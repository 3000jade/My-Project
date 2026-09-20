import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createPropertySchema, queryPropertySchema } from '../schemas/property.schema';

const router = Router();

/**
 * Public routes
 */
router.get('/count', validateQuery(queryPropertySchema), PropertyController.countProperties);
router.get('/', validateQuery(queryPropertySchema), PropertyController.listProperties);
router.get('/:id', PropertyController.getProperty);

/**
 * Protected routes (Requires Bearer Auth Token + RBAC)
 */
// Only agents, brokers, and admins can create property listings
router.post(
  '/',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(createPropertySchema),
  PropertyController.createProperty
);

// Only agents, brokers, and admins can update property listings
router.put(
  '/:id',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  PropertyController.updateProperty
);

// High-privilege: Only brokers and admins can delete property listings
router.delete(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  PropertyController.deleteProperty
);

export default router;
