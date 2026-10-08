import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export interface NominatimGeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  postalCode?: string;
  city?: string;
  subdivision?: string;
  road?: string;
  state?: string;
  country?: string;
  raw?: any;
}

export interface NominatimAutocompleteItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

// In-Memory Cache (24-hour TTL to comply with OSM caching terms)
const nominatimCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Rate limiting queue: maximum 1 request per second to public Nominatim servers
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1000;

async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

export class NominatimService {
  /**
   * Forward Geocoding: converts address string to exact coordinates
   */
  public static async geocode(
    query: string,
    options: { countryCode?: string } = {}
  ): Promise<NominatimGeocodeResult> {
    const cleanQuery = query.trim();
    const country = options.countryCode || 'ph';
    const cacheKey = `geo_${cleanQuery.toLowerCase()}_${country}`;

    // 1. Check in-memory cache
    const cached = nominatimCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { nominatimBaseUrl, nominatimUserAgent, isMockMode } = config.integrations;

    // 2. Mock mode / fallback if disabled or offline
    if (isMockMode) {
      logger.warn(`[NominatimService] Mock mode active: resolving "${cleanQuery}"`);
      const mockResult: NominatimGeocodeResult = {
        latitude: 14.5489 + (cleanQuery.length % 10) * 0.001,
        longitude: 121.0503 + (cleanQuery.length % 7) * 0.001,
        formattedAddress: cleanQuery.includes('BGC') || cleanQuery.includes('Taguig')
          ? `${cleanQuery}, Bonifacio Global City, Taguig, Metro Manila, 1634, Philippines`
          : `${cleanQuery}, Metro Manila, Philippines`,
        postalCode: '1634',
        city: cleanQuery.includes('Makati') ? 'Makati' : 'Taguig',
        subdivision: cleanQuery.includes('Forbes') ? 'Forbes Park' : 'Bonifacio Global City',
        road: cleanQuery.includes('5th') ? '5th Avenue' : 'Ayala Avenue',
        country: 'Philippines',
      };
      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: mockResult });
      return mockResult;
    }

    // 3. Live Nominatim Query with 1s throttle
    await throttleRequest();

    try {
      const url = `${nominatimBaseUrl}/search`;
      const response = await axios.get(url, {
        params: {
          q: cleanQuery,
          format: 'jsonv2',
          addressdetails: 1,
          limit: 1,
          countrycodes: country,
        },
        headers: {
          'User-Agent': nominatimUserAgent,
          Accept: 'application/json',
        },
        timeout: 6000,
      });

      const item = response.data?.[0];
      if (!item) {
        throw new Error(`Address "${cleanQuery}" could not be resolved by Nominatim.`);
      }

      const address = item.address || {};
      const result: NominatimGeocodeResult = {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        formattedAddress: item.display_name,
        postalCode: address.postcode,
        city: address.city || address.town || address.municipality || address.county,
        subdivision: address.suburb || address.neighbourhood || address.quarter || address.village,
        road: address.road,
        state: address.state || address.region,
        country: address.country,
        raw: item,
      };

      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: any) {
      logger.error(`[NominatimService] Geocode query failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Reverse Geocoding: resolves coordinates to a structured street address
   */
  public static async reverse(
    latitude: number,
    longitude: number
  ): Promise<NominatimGeocodeResult> {
    const cacheKey = `rev_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;

    const cached = nominatimCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { nominatimBaseUrl, nominatimUserAgent, isMockMode } = config.integrations;

    if (isMockMode) {
      const mockResult: NominatimGeocodeResult = {
        latitude,
        longitude,
        formattedAddress: `High Street, Bonifacio Global City, Taguig, Metro Manila, 1634, Philippines`,
        postalCode: '1634',
        city: 'Taguig',
        subdivision: 'Bonifacio Global City',
        road: '5th Avenue',
        country: 'Philippines',
      };
      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: mockResult });
      return mockResult;
    }

    await throttleRequest();

    try {
      const url = `${nominatimBaseUrl}/reverse`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'jsonv2',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': nominatimUserAgent,
          Accept: 'application/json',
        },
        timeout: 6000,
      });

      const item = response.data;
      if (!item || !item.lat) {
        throw new Error(`Coordinates [${latitude}, ${longitude}] could not be reverse geocoded.`);
      }

      const address = item.address || {};
      const result: NominatimGeocodeResult = {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        formattedAddress: item.display_name,
        postalCode: address.postcode,
        city: address.city || address.town || address.municipality,
        subdivision: address.suburb || address.neighbourhood,
        road: address.road,
        state: address.state,
        country: address.country,
        raw: item,
      };

      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: any) {
      logger.error(`[NominatimService] Reverse geocode failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Predictive Autocomplete suggestions for address inputs
   */
  public static async autocomplete(
    input: string,
    countryCode: string = 'ph'
  ): Promise<NominatimAutocompleteItem[]> {
    const cleanInput = input.trim();
    if (!cleanInput) return [];

    const cacheKey = `auto_${cleanInput.toLowerCase()}_${countryCode}`;
    const cached = nominatimCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { nominatimBaseUrl, nominatimUserAgent, isMockMode } = config.integrations;

    if (isMockMode) {
      const mockItems: NominatimAutocompleteItem[] = [
        {
          placeId: 'osm_mock_1',
          description: `${cleanInput}, Bonifacio Global City, Taguig, Metro Manila, Philippines`,
          mainText: `${cleanInput} Residences`,
          secondaryText: 'Bonifacio Global City, Taguig',
          latitude: 14.5489,
          longitude: 121.0503,
        },
        {
          placeId: 'osm_mock_2',
          description: `${cleanInput}, Ayala Avenue, Makati, Metro Manila, Philippines`,
          mainText: `${cleanInput} Tower`,
          secondaryText: 'Ayala Avenue, Makati',
          latitude: 14.5547,
          longitude: 121.0244,
        },
        {
          placeId: 'osm_mock_3',
          description: `${cleanInput}, Forbes Park, Makati, Metro Manila, Philippines`,
          mainText: `${cleanInput} Estate`,
          secondaryText: 'Forbes Park, Makati',
          latitude: 14.5441,
          longitude: 121.0366,
        },
      ];
      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: mockItems });
      return mockItems;
    }

    await throttleRequest();

    try {
      const url = `${nominatimBaseUrl}/search`;
      const response = await axios.get(url, {
        params: {
          q: cleanInput,
          format: 'jsonv2',
          addressdetails: 1,
          limit: 5,
          countrycodes: countryCode,
        },
        headers: {
          'User-Agent': nominatimUserAgent,
          Accept: 'application/json',
        },
        timeout: 6000,
      });

      const items = (response.data || []).map((item: any) => {
        const parts = item.display_name.split(',');
        const mainText = item.name || parts[0]?.trim() || item.display_name;
        const secondaryText = parts.slice(1, 4).join(',').trim();

        return {
          placeId: String(item.place_id),
          description: item.display_name,
          mainText,
          secondaryText,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });

      nominatimCache.set(cacheKey, { timestamp: Date.now(), data: items });
      return items;
    } catch (err: any) {
      logger.error(`[NominatimService] Autocomplete failed: ${err.message}`);
      return [];
    }
  }
}

export default NominatimService;
