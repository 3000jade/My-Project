import { Router } from 'express';
import multer from 'multer';
import { SubdivisionController } from '../controllers/subdivision.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // FR-002: max 15MB
});

const router = Router();

// ==========================================
// Public Visitor Endpoints
// ==========================================
router.get('/:id/public-map', optionalAuth, SubdivisionController.getPublicMap);
router.get('/', optionalAuth, SubdivisionController.listProjects);
router.get('/:id', optionalAuth, SubdivisionController.getProjectById);
router.get('/:id/plans/active', optionalAuth, SubdivisionController.getActivePlan);

// ==========================================
// AI-Assisted Boundary & OCR Services
// ==========================================
router.post('/ai/detect-boundary', SubdivisionController.detectAiBoundary);
router.post('/ai/recognize-labels', SubdivisionController.recognizeAiLabels);
router.post(
  '/:id/ai/auto-layout',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.autoLayoutPlan
);

// ==========================================
// Authenticated Editor Endpoints (Broker / Admin)
// ==========================================
router.post(
  '/',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.createProject
);

router.post(
  '/:id/plans',
  requireAuth,
  requireRole(['broker', 'admin']),
  upload.single('plan_file'),
  SubdivisionController.uploadPlan
);

router.get(
  '/:id/lots',
  requireAuth,
  requireRole(['broker', 'admin', 'agent']),
  SubdivisionController.getDraftLots
);

router.put(
  '/:id/lots',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.batchSaveLots
);

router.post(
  '/:id/validate',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.validateDraft
);

router.post(
  '/:id/publish',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.publishVersion
);

router.get(
  '/:id/versions',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.listVersions
);

router.post(
  '/:id/versions/:version/restore',
  requireAuth,
  requireRole(['broker', 'admin']),
  SubdivisionController.restoreVersion
);

export default router;
