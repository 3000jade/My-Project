import { Router } from 'express';
import { MapsController } from '../controllers/maps.controller';

const router = Router();

/**
 * GET /api/maps/geocode
 * Geocode text address into latitude/longitude coordinates
 */
router.get('/geocode', MapsController.geocode);

/**
 * GET /api/maps/places/autocomplete
 * Search address predictions proxy
 */
router.get('/places/autocomplete', MapsController.autocomplete);

/**
 * GET /api/maps/commute
 * Distance Matrix calculation to luxury lifestyle hubs
 */
router.get('/commute', MapsController.getCommute);

/**
 * GET /api/maps/streetview/metadata
 * Check Street View 360 panorama coverage
 */
router.get('/streetview/metadata', MapsController.getStreetViewMetadata);

export default router;
