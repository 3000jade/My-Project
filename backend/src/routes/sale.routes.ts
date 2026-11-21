import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createSaleSchema, updateSaleSchema } from '../schemas/sale.schema';

const router = Router();

/**
 * GET /api/sales
 * List sales conveyance records
 */
router.get('/', requireAuth, requireRole(['agent', 'broker', 'admin']), SaleController.list);

/**
 * GET /api/sales/pipeline-metrics
 * Aggregate deal pipeline statistics and projected commission
 */
router.get('/pipeline-metrics', requireAuth, requireRole(['agent', 'broker', 'admin']), SaleController.getPipelineMetrics);

/**
 * GET /api/sales/:id
 * Get single sales conveyance record
 */
router.get('/:id', requireAuth, requireRole(['agent', 'broker', 'admin']), SaleController.getById);

/**
 * POST /api/sales
 * Create new sales conveyance record
 */
router.post('/', requireAuth, requireRole(['agent', 'broker', 'admin']), validateBody(createSaleSchema), SaleController.create);

/**
 * PUT /api/sales/:id
 * Update sales conveyance record
 */
router.put('/:id', requireAuth, requireRole(['broker', 'admin']), validateBody(updateSaleSchema), SaleController.update);

/**
 * DELETE /api/sales/:id
 * Delete sales conveyance record
 */
router.delete('/:id', requireAuth, requireRole(['broker', 'admin']), SaleController.delete);

export default router;
