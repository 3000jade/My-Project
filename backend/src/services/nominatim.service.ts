import axios from 'axios';
import config from '../config';
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

// Common Philippine City / Typo Normalizer
const PH_TYPO_MAP: Record<string, string> = {
  mairkina: 'marikina',
  marikina: 'marikina',
  pasay: 'pasay',
  pasig: 'pasig',
  makati: 'makati',
  taguig: 'taguig',
  muntinlupa: 'muntinlupa',
  paranaque: 'parañaque',
  malabon: 'malabon',
  mandaluyong: 'mandaluyong',
  navotas: 'navotas',
  valenzuela: 'valenzuela',
  caloocan: 'caloocan',
  quezon: 'quezon city',
  qc: 'quezon city',
  alabang: 'ayala alabang',
  greenhills: 'greenhills',
  bgc: 'bonifacio global city',
};

function normalizeQuery(input: string): string {
  let normalized = input.trim();
  const lower = normalized.toLowerCase();

  for (const [typo, correct] of Object.entries(PH_TYPO_MAP)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    if (regex.test(lower)) {
      normalized = normalized.replace(regex, correct);
    }
  }
  return normalized;
}

export class NominatimService {
  /**
   * Forward Geocoding: converts address string to exact coordinates
   */
  public static async geocode(
    query: string,
    options: { countryCode?: string } = {}
  ): Promise<NominatimGeocodeResult> {
    const cleanQuery = normalizeQuery(query);
    const country = options.countryCode || 'ph';
    const cacheKey = `geo_${cleanQuery.toLowerCase()}_${country}`;

    // 1. Check in-memory cache
    const cached = nominatimCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { nominatimBaseUrl, nominatimUserAgent, nominatimMockMode } = config.integrations;

    // 2. Explicit Mock Mode (if configured for offline tests)
    if (nominatimMockMode) {
      logger.warn(`[NominatimService] Mock mode active: resolving "${cleanQuery}"`);
      const mockResult: NominatimGeocodeResult = {
        latitude: 14.5489 + (cleanQuery.length % 10) * 0.001,
        longitude: 121.0503 + (cleanQuery.length % 7) * 0.001,
        formattedAddress: `${cleanQuery}, Metro Manila, Philippines`,
        postalCode: '1634',
        city: cleanQuery.includes('Marikina') ? 'Marikina' : cleanQuery.includes('Makati') ? 'Makati' : 'Taguig',
        subdivision: 'City Center',
        road: 'Main Avenue',
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
      logger.warn(`[NominatimService] Geocode query failed for "${cleanQuery}": ${err.message}. Using fallback.`);
      const fallbackResult: NominatimGeocodeResult = {
        latitude: 14.6331,
        longitude: 121.0994,
        formattedAddress: `${cleanQuery}, Metro Manila, Philippines`,
        city: 'Marikina',
        subdivision: 'Marikina City',
        country: 'Philippines',
      };
      return fallbackResult;
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

    const { nominatimBaseUrl, nominatimUserAgent, nominatimMockMode } = config.integrations;

    if (nominatimMockMode) {
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
      logger.warn(`[NominatimService] Reverse geocode failed: ${err.message}. Using fallback.`);
      return {
        latitude,
        longitude,
        formattedAddress: `Coordinates [${latitude.toFixed(4)}, ${longitude.toFixed(4)}], Metro Manila, Philippines`,
        city: 'Metro Manila',
        country: 'Philippines',
      };
    }
  }

  /**
   * Predictive Autocomplete suggestions for address inputs
   */
  public static async autocomplete(
    input: string,
    countryCode: string = 'ph'
  ): Promise<NominatimAutocompleteItem[]> {
    const cleanInput = normalizeQuery(input);
    if (!cleanInput) return [];

    const cacheKey = `auto_${cleanInput.toLowerCase()}_${countryCode}`;
    const cached = nominatimCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { nominatimBaseUrl, nominatimUserAgent, nominatimMockMode } = config.integrations;

    if (nominatimMockMode) {
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
          limit: 6,
          countrycodes: countryCode,
        },
        headers: {
          'User-Agent': nominatimUserAgent,
          Accept: 'application/json',
        },
        timeout: 6000,
      });

      const items: NominatimAutocompleteItem[] = (response.data || []).map((item: any) => {
        const parts = item.display_name.split(',');
        const mainText = item.name || parts[0]?.trim() || item.display_name;
        const secondaryText = parts.slice(1, 4).join(',').trim();

        return {
          placeId: String(item.place_id || item.osm_id),
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
      logger.warn(`[NominatimService] Autocomplete query failed for "${cleanInput}": ${err.message}`);
      return [];
    }
  }

  /**
   * Clears in-memory cache
   */
  public static clearCache(): void {
    nominatimCache.clear();
  }
}
