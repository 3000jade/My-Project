import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Retrieve aggregated dashboard metrics, recent records, and activity
 */
router.get('/summary', optionalAuth, DashboardController.getSummary);

/**
 * GET /api/dashboard
 * Alias for summary
 */
router.get('/', optionalAuth, DashboardController.getSummary);

export default router;
