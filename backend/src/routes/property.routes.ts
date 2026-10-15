import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createPropertySchema,
  queryPropertySchema,
  proposePropertyEditSchema,
  approveEditRequestSchema,
  rejectEditRequestSchema,
  queryEditRequestsSchema
} from '../schemas/property.schema';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});

const router = Router();

/**
 * Public routes
 */
router.get('/count', validateQuery(queryPropertySchema), PropertyController.countProperties);
router.get('/', validateQuery(queryPropertySchema), PropertyController.listProperties);

/**
 * Edit Request & Proposal routes (Must precede /:id)
 */
// List edit requests (Brokers/Admins view all; Agents view their own)
router.get(
  '/edit-requests',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateQuery(queryEditRequestsSchema),
  PropertyController.getEditRequests
);

// Get single edit request by ID
router.get(
  '/edit-requests/:requestId',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  PropertyController.getEditRequestById
);

// Approve edit request (Brokers and Admins only)
router.post(
  '/edit-requests/:requestId/approve',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(approveEditRequestSchema),
  PropertyController.approveEditRequest
);

// Reject edit request with required remarks (Brokers and Admins only)
router.post(
  '/edit-requests/:requestId/reject',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(rejectEditRequestSchema),
  PropertyController.rejectEditRequest
);

// Cancel pending edit request (Proposing Agent only)
router.post(
  '/edit-requests/:requestId/cancel',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  PropertyController.cancelEditRequest
);

/**
 * Single Property routes
 */
router.get('/:id', PropertyController.getProperty);

/**
 * Protected Property Management routes (Requires Bearer Auth Token + RBAC)
 */
// Restricted: Only brokers and admins can create property listings (Agents prohibited)
router.post(
  '/',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(createPropertySchema),
  PropertyController.createProperty
);

// Restricted: Only brokers and admins can directly mutate property listings (Agents must propose)
router.put(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  PropertyController.updateProperty
);

// Propose modifications to an assigned property listing (Agents, Brokers, Admins)
router.post(
  '/:id/propose-edit',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(proposePropertyEditSchema),
  PropertyController.proposeEdit
);

// Upload media for a property (Google Drive integration)
router.post(
  '/:id/media',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  upload.array('media', 15),
  PropertyController.uploadMedia
);

// High-privilege: Only brokers and admins can delete property listings
router.delete(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  PropertyController.deleteProperty
);

export default router;

