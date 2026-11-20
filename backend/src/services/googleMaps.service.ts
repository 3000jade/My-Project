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

  /**
   * Reverse geocode coordinates into a structured address via Google Maps Geocoding API
   */
  public static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
    city?: string;
    subdivision?: string;
    postalCode?: string;
  }> {
    const { googleMapsApiKey, isMockMode } = config.integrations;

    if (isMockMode || !googleMapsApiKey) {
      return {
        latitude,
        longitude,
        formattedAddress: 'Metro Manila, Philippines',
        city: 'Makati',
        postalCode: '1200',
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`;
      const response = await axios.get(url, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: googleMapsApiKey,
        },
      });

      const result = response.data?.results?.[0];
      if (!result) {
        return { latitude, longitude, formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` };
      }

      const components: any[] = result.address_components || [];
      const cityObj = components.find((c) => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
      const subObj = components.find((c) => c.types.includes('sublocality') || c.types.includes('neighborhood'));
      const postalObj = components.find((c) => c.types.includes('postal_code'));

      return {
        latitude,
        longitude,
        formattedAddress: result.formatted_address,
        city: cityObj?.long_name,
        subdivision: subObj?.long_name,
        postalCode: postalObj?.long_name,
      };
    } catch (err: any) {
      logger.error('[GoogleMapsService] Reverse geocode error:', err.message);
      return { latitude, longitude, formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` };
    }
  }

  /**
   * Generate Nearby Places (highway, transit, school, hospital, mall) + map coordinates
   * using Google Places Nearby Search and/or Groq AI, with clean Philippine city fallbacks.
   */
  public static async suggestNearbyPlaces(context: {
    latitude?: number;
    longitude?: number;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
  }): Promise<{
    highway: string;
    transit: string;
    school: string;
    hospital: string;
    mall: string;
    nearbyPins: Array<{ category: string; label: string; lat: number; lng: number }>;
    source: string;
  }> {
    const baseLat = Number(context.latitude) || 14.5547;
    const baseLng = Number(context.longitude) || 121.0244;
    const cityLabel = [context.barangay, context.city, context.province, context.region]
      .filter(Boolean)
      .join(', ') || 'Metro Manila, Philippines';

    // 1. Try Groq AI for rich local context when configured
    const groqKey = config.groqApiKey || (config.xaiApiKey?.startsWith('gsk_') ? config.xaiApiKey : '');
    if (groqKey && !config.integrations.isMockMode) {
      try {
        const prompt = `Given this Philippine property location: "${context.address || ''} ${cityLabel}" (lat: ${baseLat}, lng: ${baseLng}), identify the closest real landmarks with short estimated driving time in parentheses, e.g. "SLEX Alabang Exit (5 mins)".
Return strictly valid JSON with keys: "highway", "transit", "school", "hospital", "mall", and "nearbyPins" (array of objects with { "category": "highway"|"transit"|"school"|"hospital"|"mall", "label": string, "lat": number, "lng": number }).`;

        const aiResp = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: config.aiModel || 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You are a Philippine real estate location assistant. Return only JSON.' },
              { role: 'user', content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );

        const rawJson = aiResp.data?.choices?.[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed.highway && parsed.school && parsed.mall) {
            return {
              highway: String(parsed.highway),
              transit: String(parsed.transit || ''),
              school: String(parsed.school),
              hospital: String(parsed.hospital || ''),
              mall: String(parsed.mall),
              nearbyPins: Array.isArray(parsed.nearbyPins) ? parsed.nearbyPins : [],
              source: 'groq_ai',
            };
          }
        }
      } catch (aiErr: any) {
        logger.warn('[GoogleMapsService] AI nearby fallback triggered:', aiErr.message);
      }
    }

    // 2. City-aware Philippine landmark fallback anchored near [baseLat, baseLng]
    const lower = cityLabel.toLowerCase();
    const preset = lower.includes('muntinlupa') || lower.includes('alabang')
      ? {
          highway: 'SLEX Alabang Exit (6 mins)',
          transit: 'Alabang P2P Terminal (7 mins)',
          school: 'De La Salle Santiago Zobel (5 mins)',
          hospital: 'Asian Hospital and Medical Center (6 mins)',
          mall: 'Alabang Town Center (5 mins)',
        }
      : lower.includes('taguig') || lower.includes('bgc')
      ? {
          highway: 'C-5 Kalayaan Flyover (4 mins)',
          transit: 'BGC Bus Central Stop (3 mins)',
          school: 'International School Manila (5 mins)',
          hospital: 'St. Luke’s Medical Center BGC (5 mins)',
          mall: 'Bonifacio High Street / SM Aura (4 mins)',
        }
      : lower.includes('quezon')
      ? {
          highway: 'EDSA / Commonwealth Ave (5 mins)',
          transit: 'MRT-3 North Ave / Quezon Ave (8 mins)',
          school: 'UP Diliman / Ateneo de Manila (10 mins)',
          hospital: 'Philippine Heart Center / St. Luke’s QC (8 mins)',
          mall: 'TriNoma / SM City North EDSA (7 mins)',
        }
      : {
          highway: 'EDSA / Skyway Buendia Exit (5 mins)',
          transit: 'MRT-3 Ayala Station (6 mins)',
          school: 'Assumption College / AIM (5 mins)',
          hospital: 'Makati Medical Center (6 mins)',
          mall: 'Greenbelt / Glorietta Mall (5 mins)',
        };

    const nearbyPins = [
      { category: 'highway', label: preset.highway, lat: baseLat + 0.0042, lng: baseLng - 0.0038 },
      { category: 'transit', label: preset.transit, lat: baseLat - 0.0031, lng: baseLng + 0.0045 },
      { category: 'school', label: preset.school, lat: baseLat + 0.0028, lng: baseLng + 0.0034 },
      { category: 'hospital', label: preset.hospital, lat: baseLat - 0.0044, lng: baseLng - 0.0029 },
      { category: 'mall', label: preset.mall, lat: baseLat + 0.0019, lng: baseLng + 0.0051 },
    ];

    return {
      ...preset,
      nearbyPins,
      source: 'city_fallback',
    };
  }
}

export default GoogleMapsService;
