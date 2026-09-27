import { Request, Response } from 'express';
import { GoogleMapsService } from '../services/googleMaps.service';
import type { ApiResponse } from '../types/api';

export class MapsController {
  /**
   * GET /api/maps/geocode
   * Convert address string into exact coordinates
   */
  public static async geocode(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const address = req.query.address as string;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'address query parameter is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await GoogleMapsService.geocodeAddress(address);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Address geocoded successfully.',
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
   * GET /api/maps/places/autocomplete
   * Predictive places search proxy with caching
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

      const predictions = await GoogleMapsService.placesAutocomplete(input, country);

      res.status(200).json({
        success: true,
        data: predictions,
        message: 'Place predictions retrieved.',
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
