import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';
import type { CommuteEstimate } from '../../../shared/types/integrations';

// Preset luxury lifestyle & commercial hubs in Metro Manila for luxury property commute analysis
const PRESET_DESTINATIONS = [
  { name: 'Bonifacio High Street (BGC Central)', address: 'Bonifacio High Street, Taguig', lat: 14.5509, lng: 121.0505 },
  { name: 'Ayala Avenue (Makati CBD)', address: 'Ayala Ave, Makati, Metro Manila', lat: 14.5547, lng: 121.0244 },
  { name: 'NAIA International Terminal 3', address: 'NAIA Terminal 3, Pasay', lat: 14.5204, lng: 121.0152 },
  { name: 'International School Manila (ISM)', address: 'University Parkway, BGC, Taguig', lat: 14.5528, lng: 121.0583 },
  { name: 'Manila Polo Club', address: 'McKinley Rd, Forbes Park, Makati', lat: 14.5441, lng: 121.0366 },
];

// Simple in-memory cache for Autocomplete to control API quota consumption
const autocompleteCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class GoogleMapsService {
  /**
   * Geocode text address into exact coordinates
   */
  public static async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
    postalCode?: string;
  }> {
    const { googleMapsApiKey, isMockMode } = config.integrations;

    if (isMockMode || !googleMapsApiKey) {
      logger.warn(`[GoogleMapsService] Mock mode active: geocoding address "${address}"`);
      // Deterministic mock coordinates centered around BGC / Makati luxury corridor
      return {
        latitude: 14.5489 + (address.length % 10) * 0.001,
        longitude: 121.0503 + (address.length % 7) * 0.001,
        formattedAddress: address.includes('BGC')
          ? '5th Ave & 28th St, Bonifacio Global City, Taguig, 1634 Metro Manila'
          : `${address}, Metro Manila, Philippines`,
        postalCode: '1634',
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`;
      const response = await axios.get(url, {
        params: {
          address,
          key: googleMapsApiKey,
        },
      });

      const result = response.data?.results?.[0];
      if (!result) {
        throw new Error(`Address "${address}" could not be geocoded.`);
      }

      const { lat, lng } = result.geometry.location;
      const postalObj = result.address_components?.find((c: any) => c.types.includes('postal_code'));

      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address,
        postalCode: postalObj?.long_name,
      };
    } catch (err: any) {
      logger.error('[GoogleMapsService] Geocoding error:', err.message);
      throw err;
    }
  }

  /**
   * Places Autocomplete proxy with 5-minute memory caching
   */
  public static async placesAutocomplete(
    input: string,
    country: string = 'ph'
  ): Promise<Array<{ description: string; placeId: string; mainText: string; secondaryText: string }>> {
    const cacheKey = `${input.toLowerCase().trim()}_${country}`;
    const cached = autocompleteCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { googleMapsApiKey, isMockMode } = config.integrations;

    if (isMockMode || !googleMapsApiKey) {
      const mockPredictions = [
        {
          description: `${input} - Bonifacio Global City, Taguig, Metro Manila`,
          placeId: 'ChIJmock_bgc_123',
          mainText: `${input} Residences`,
          secondaryText: 'Bonifacio Global City, Taguig',
        },
        {
          description: `${input} - Ayala Avenue, Makati CBD, Metro Manila`,
          placeId: 'ChIJmock_makati_456',
          mainText: `${input} Tower`,
          secondaryText: 'Ayala Avenue, Makati',
        },
        {
          description: `${input} - Rockwell Center, Makati, Metro Manila`,
          placeId: 'ChIJmock_rockwell_789',
          mainText: `${input} Penthouse`,
          secondaryText: 'Rockwell Center, Makati',
        },
      ];

      autocompleteCache.set(cacheKey, { timestamp: Date.now(), data: mockPredictions });
      return mockPredictions;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
      const response = await axios.get(url, {
        params: {
          input,
          components: country ? `country:${country}` : undefined,
          key: googleMapsApiKey,
        },
      });

      const predictions = (response.data?.predictions || []).map((p: any) => ({
        description: p.description,
        placeId: p.place_id,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));

      autocompleteCache.set(cacheKey, { timestamp: Date.now(), data: predictions });
      return predictions;
    } catch (err: any) {
      logger.error('[GoogleMapsService] Autocomplete error:', err.message);
      return [];
    }
  }

  /**
   * Calculate drive-time commute matrix to key luxury commercial hubs
   */
  public static async calculateCommuteMatrix(origin: {
    latitude: number;
    longitude: number;
  }): Promise<CommuteEstimate[]> {
    const { googleMapsApiKey, isMockMode } = config.integrations;

    if (isMockMode || !googleMapsApiKey) {
      return PRESET_DESTINATIONS.map((dest, i) => {
        const estDistanceKm = (2.5 + i * 2.8).toFixed(1);
        const estDurationMin = Math.round(8 + i * 9);
        return {
          destination: dest.address,
          destinationName: dest.name,
          distanceText: `${estDistanceKm} km`,
          distanceMeters: Math.round(parseFloat(estDistanceKm) * 1000),
          durationText: `${estDurationMin} mins`,
          durationSeconds: estDurationMin * 60,
          mode: 'driving',
        };
      });
    }

    try {
      const destinationsStr = PRESET_DESTINATIONS.map((d) => `${d.lat},${d.lng}`).join('|');
      const originStr = `${origin.latitude},${origin.longitude}`;

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
      const response = await axios.get(url, {
        params: {
          origins: originStr,
          destinations: destinationsStr,
          mode: 'driving',
          departure_time: 'now',
          key: googleMapsApiKey,
        },
      });

      const elements = response.data?.rows?.[0]?.elements || [];

      return PRESET_DESTINATIONS.map((dest, idx) => {
        const elem = elements[idx] || {};
        return {
          destination: dest.address,
          destinationName: dest.name,
          distanceText: elem.distance?.text || 'N/A',
          distanceMeters: elem.distance?.value || 0,
          durationText: elem.duration_in_traffic?.text || elem.duration?.text || 'N/A',
          durationSeconds: elem.duration_in_traffic?.value || elem.duration?.value || 0,
          mode: 'driving',
        };
      });
    } catch (err: any) {
      logger.error('[GoogleMapsService] Distance Matrix error:', err.message);
      return [];
    }
  }

  /**
   * Check 360 Street View panorama coverage
   */
  public static async checkStreetViewCoverage(
    latitude: number,
    longitude: number
  ): Promise<{ available: boolean; status: string; panoId?: string }> {
    const { googleMapsApiKey, isMockMode } = config.integrations;

    if (isMockMode || !googleMapsApiKey) {
      return {
        available: true,
        status: 'OK',
        panoId: 'mock-street-view-pano-12345',
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/streetview/metadata`;
      const response = await axios.get(url, {
        params: {
          location: `${latitude},${longitude}`,
          key: googleMapsApiKey,
        },
      });

      const isOk = response.data?.status === 'OK';
      return {
        available: isOk,
        status: response.data?.status || 'UNKNOWN',
        panoId: response.data?.pano_id,
      };
    } catch (err: any) {
      logger.error('[GoogleMapsService] Street view metadata check error:', err.message);
      return { available: false, status: 'ERROR' };
    }
  }
}

export default GoogleMapsService;
