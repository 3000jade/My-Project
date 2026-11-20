import { Request, Response } from 'express';
import { config } from '../config';
import logger from '../utils/logger';
import { NominatimService } from '../services/nominatim.service';
import { GoogleMapsService } from '../services/googleMaps.service';
import type { ApiResponse } from '../types/api';

async function resolveWithFallback<T>(
  googleFn: () => Promise<T>,
  nominatimFn: () => Promise<T>,
  label: string
): Promise<{ result: T; provider: 'google' | 'nominatim' }> {
  if (config.integrations.googleMapsApiKey) {
    try {
      const result = await googleFn();
      const isEmptyList = Array.isArray(result) && result.length === 0;
      if (result && !isEmptyList) {
        return { result, provider: 'google' };
      }
    } catch (err: any) {
      logger.warn(`[MapsController] Google ${label} failed (${err.message}); falling back to Nominatim OSM.`);
    }
  }
  return { result: await nominatimFn(), provider: 'nominatim' };
}

export class MapsController {
  /**
   * GET /api/maps/geocode
   * Convert address string into coordinates via Google Maps (fallback to Nominatim OSM)
   */
  public static async geocode(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const address = req.query.address as string;
      const country = (req.query.country as string) || 'ph';

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'address query parameter is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { result, provider } = await resolveWithFallback(
        () => GoogleMapsService.geocodeAddress(address),
        () => NominatimService.geocode(address, { countryCode: country }),
        'geocode'
      );

      res.status(200).json({
        success: true,
        data: result,
        message: provider === 'google' ? 'Address geocoded via Google Maps.' : 'Address geocoded via Nominatim OSM.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error geocoding address.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/maps/reverse
   * Reverse geocode coordinates via Google Maps (fallback to Nominatim OSM)
   */
  public static async reverse(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          error: 'Valid numeric lat and lng query parameters are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { result, provider } = await resolveWithFallback(
        () => GoogleMapsService.reverseGeocode(lat, lng),
        () => NominatimService.reverse(lat, lng),
        'reverse'
      );

      res.status(200).json({
        success: true,
        data: result,
        message: provider === 'google' ? 'Coordinates reverse geocoded via Google Maps.' : 'Coordinates reverse geocoded via Nominatim OSM.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error reverse geocoding coordinates.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/maps/places/autocomplete
   * Predictive places search proxy via Google Places API (fallback to Nominatim OSM)
   */
  public static async autocomplete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const input = (req.query.input as string) || '';
      const country = (req.query.country as string) || 'ph';

      if (!input || input.trim().length === 0) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'Empty input.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { result: predictions, provider } = await resolveWithFallback(
        () => GoogleMapsService.placesAutocomplete(input, country),
        () => NominatimService.autocomplete(input, country),
        'autocomplete'
      );

      res.status(200).json({
        success: true,
        data: predictions,
        message: provider === 'google' ? 'Place predictions retrieved from Google Maps.' : 'Place predictions retrieved from Nominatim OSM.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching place predictions.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/maps/nearby-ai
   * Generate nearby places (highway, transit, school, hospital, mall) & map pins
   */
  public static async suggestNearbyPlaces(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const result = await GoogleMapsService.suggestNearbyPlaces(req.body || {});
      res.status(200).json({
        success: true,
        data: result,
        message: 'Nearby places suggested.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error suggesting nearby places.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/maps/commute
   * Compute Distance Matrix estimates to central luxury destinations
   */
  public static async getCommute(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          error: 'Valid numeric lat and lng query parameters are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const commutes = await GoogleMapsService.calculateCommuteMatrix({
        latitude: lat,
        longitude: lng,
      });

      res.status(200).json({
        success: true,
        data: commutes,
        message: 'Commute estimates calculated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error calculating commute matrix.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/maps/streetview/metadata
   * Check 360 panorama coverage
   */
  public static async getStreetViewMetadata(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          error: 'Valid numeric lat and lng query parameters are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const metadata = await GoogleMapsService.checkStreetViewCoverage(lat, lng);

      res.status(200).json({
        success: true,
        data: metadata,
        message: 'Street view metadata retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error checking street view metadata.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default MapsController;
