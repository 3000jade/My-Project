import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { updateAgentStatusSchema, updateAgentProfileSchema, queryAgentSchema } from '../schemas/agent.schema';

const router = Router();

// Authenticated administrative agent directory (Brokers & Admins)
router.get('/', requireAuth, requireRole(['broker', 'admin']), validateQuery(queryAgentSchema), AgentController.list);

// Authenticated administrative single agent lookup (Brokers & Admins)
router.get('/:id', requireAuth, requireRole(['broker', 'admin']), AgentController.getById);

// Update agent verification status (Brokers & Admins)
router.put(
  '/:id/status',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(updateAgentStatusSchema),
  AgentController.updateStatus
);

// Update agent profile information (Brokers & Admins)
router.put(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(updateAgentProfileSchema),
  AgentController.updateProfile
);

// Applicant self-service credential resubmission (applicant or broker/admin)
router.post(
  '/:id/resubmit-credentials',
  requireAuth,
  AgentController.resubmitCredentials
);

export default router;
