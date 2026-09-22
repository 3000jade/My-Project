import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createSaleSchema, updateSaleSchema } from '../schemas/sale.schema';

const router = Router();

/**
 * GET /api/sales
 * List sales conveyance records
 */
router.get('/', optionalAuth, SaleController.list);

/**
 * GET /api/sales/:id
 * Get single sales conveyance record
 */
router.get('/:id', optionalAuth, SaleController.getById);

/**
 * POST /api/sales
 * Create new sales conveyance record
 */
router.post('/', optionalAuth, validateBody(createSaleSchema), SaleController.create);

/**
 * PUT /api/sales/:id
 * Update sales conveyance record
 */
router.put('/:id', optionalAuth, validateBody(updateSaleSchema), SaleController.update);

/**
 * DELETE /api/sales/:id
 * Delete sales conveyance record
 */
router.delete('/:id', optionalAuth, SaleController.delete);

export default router;
