import { Router } from 'express';
import { InquiryController } from '../controllers/inquiry.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createInquirySchema,
  updateInquirySchema,
  queryInquirySchema,
} from '../schemas/inquiry.schema';

const router = Router();

/**
 * Public Routes
 */
// Public lead capture & tour request submission
router.post('/', validateBody(createInquirySchema), InquiryController.create);

/**
 * Protected Routes (Requires Bearer Auth Token)
 */
// Authenticated list for agents & brokers
router.get('/', requireAuth, validateQuery(queryInquirySchema), InquiryController.list);

// Authenticated detail lookup
router.get('/:id', requireAuth, InquiryController.getById);

// Update inquiry status / agent reassignment
router.put(
  '/:id',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(updateInquirySchema),
  InquiryController.update
);

// Delete inquiry (Broker / Admin only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  InquiryController.delete
);

export default router;
