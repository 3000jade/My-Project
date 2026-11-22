import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Retrieve aggregated dashboard metrics, recent records, and activity
 */
router.get('/summary', requireAuth, requireRole(['agent', 'broker', 'admin']), DashboardController.getSummary);

/**
 * GET /api/dashboard
 * Alias for summary
 */
router.get('/', requireAuth, requireRole(['agent', 'broker', 'admin']), DashboardController.getSummary);

export default router;
