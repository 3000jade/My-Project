import apiClient from './apiClient';

/**
 * Maps & Geocoding Service powered by backend Nominatim (OpenStreetMap) engine.
 */
export const mapsService = {
  /**
   * Predictive address autocomplete from Nominatim OSM.
   * @param {string} input - search query text
   * @param {string} [country='ph'] - ISO country code filter
   * @returns {Promise<Array<{placeId: string, description: string, mainText: string, secondaryText: string, latitude: number, longitude: number}>>}
   */
  async autocomplete(input, country = 'ph') {
    if (!input || !input.trim()) return [];
    try {
      const response = await apiClient.get('/maps/places/autocomplete', {
        params: { input: input.trim(), country },
      });
      return response?.data || response || [];
    } catch (error) {
      console.error('[mapsService] Autocomplete failed:', error);
      return [];
    }
  },

  /**
   * Forward geocodes an address or place name to exact coordinates.
   * @param {string} address - Address or landmark name
   * @param {string} [country='ph'] - ISO country code
   * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string, city?: string, subdivision?: string, postalCode?: string}>}
   */
  async geocode(address, country = 'ph') {
    if (!address || !address.trim()) return null;
    try {
      const response = await apiClient.get('/maps/geocode', {
        params: { address: address.trim(), country },
      });
      return response?.data || response || null;
    } catch (error) {
      console.error('[mapsService] Geocode failed:', error);
      return null;
    }
  },

  /**
   * Reverse geocodes coordinates to a verified structured address.
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string, city?: string, subdivision?: string, postalCode?: string}>}
   */
  async reverse(lat, lng) {
    if (lat === undefined || lng === undefined) return null;
    try {
      const response = await apiClient.get('/maps/reverse', {
        params: { lat, lng },
      });
      return response?.data || response || null;
    } catch (error) {
      console.error('[mapsService] Reverse geocode failed:', error);
      return null;
    }
  },

  /**
   * Distance Matrix commute calculations to luxury lifestyle hubs.
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async getCommute(lat, lng) {
    if (lat === undefined || lng === undefined) return [];
    try {
      const response = await apiClient.get('/maps/commute', {
        params: { lat, lng },
      });
      return response?.data || response || [];
    } catch (error) {
      console.error('[mapsService] Commute calculation failed:', error);
      return [];
    }
  },
};

export default mapsService;
