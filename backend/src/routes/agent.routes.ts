import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { updateAgentStatusSchema, queryAgentSchema } from '../schemas/agent.schema';

const router = Router();

// Authenticated agent directory
router.get('/', requireAuth, validateQuery(queryAgentSchema), AgentController.list);

// Authenticated single agent lookup
router.get('/:id', requireAuth, AgentController.getById);

// Update agent verification status (Brokers & Admins)
router.put(
  '/:id/status',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(updateAgentStatusSchema),
  AgentController.updateStatus
);

// Fallback direct PUT /:id
router.put(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(updateAgentStatusSchema),
  AgentController.updateStatus
);

export default router;
