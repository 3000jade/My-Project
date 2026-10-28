import { Loader } from '@googlemaps/js-api-loader';

/**
 * Singleton instance of Google Maps JS API Loader
 */
let loaderInstance = null;
let googleMapsPromise = null;

/**
 * Returns true if the client-side Google Maps API key is configured and non-empty.
 */
export function isGoogleMapsConfigured() {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 5 && !key.includes('your_google_maps_api_key'));
}

/**
 * Safely extracts the client Google Maps API key from environment variables.
 */
export function getGoogleMapsApiKey() {
  return (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_KEY ||
    ''
  );
}

/**
 * Loads the Google Maps JavaScript API with the required libraries:
 * - 'marker' (for AdvancedMarkerElement)
 * - 'places' (for Autocomplete & Session Tokens)
 * - 'geometry' (for spherical distance calculations)
 *
 * @param {object} options
 * @param {boolean} [options.forceFailIfMissing=false] - If true, throws immediately if key is missing.
 * @returns {Promise<typeof google>}
 */
export async function loadGoogleMapsApi(options = {}) {
  const { forceFailIfMissing = false } = options;
  const apiKey = getGoogleMapsApiKey();

  if (!isGoogleMapsConfigured()) {
    const errorMsg = '[googleMapsLoader] Google Maps API key is not configured in VITE_GOOGLE_MAPS_API_KEY.';
    if (forceFailIfMissing) {
      throw new Error(errorMsg);
    }
    console.warn(errorMsg, 'Map components will fall back to open-source Leaflet engine.');
    return null;
  }

  // If already loaded in window.google
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return window.google;
  }

  // Return existing singleton promise if loading is already in flight
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  loaderInstance = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'marker', 'geometry'],
    authReferrerPolicy: 'origin',
  });

  googleMapsPromise = loaderInstance
    .load()
    .then((google) => {
      return google;
    })
    .catch((error) => {
      console.error('[googleMapsLoader] Failed to load Google Maps JS API:', error);
      googleMapsPromise = null; // Reset to allow retry
      throw error;
    });

  return googleMapsPromise;
}

export default {
  loadGoogleMapsApi,
  isGoogleMapsConfigured,
  getGoogleMapsApiKey,
};
