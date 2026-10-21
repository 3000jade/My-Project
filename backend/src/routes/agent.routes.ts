import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  updateAgentStatusSchema,
  updateAgentProfileSchema,
  queryAgentSchema,
  updateAgentAvailabilitySchema,
  createTeamSchema,
  updateTeamSchema,
  transferResponsibilitiesSchema,
  departAgentSchema,
} from '../schemas/agent.schema';

const router = Router();

// 1. Public Client Endpoints (Safe public agent directory & profile card)
router.get('/public', AgentController.listPublic);
router.get('/public/:id', AgentController.getPublicById);

// 2. Sales Agent Self-Service Endpoint
router.get('/me', requireAuth, AgentController.getMyProfile);

// 3. Brokerage Teams Management (Brokers & Admins, read access for authenticated agents)
router.get('/teams', requireAuth, AgentController.listTeams);
router.post('/teams', requireAuth, requireRole(['broker', 'admin']), validateBody(createTeamSchema), AgentController.createTeam);
router.put('/teams/:teamId', requireAuth, requireRole(['broker', 'admin']), validateBody(updateTeamSchema), AgentController.updateTeam);
router.delete('/teams/:teamId', requireAuth, requireRole(['broker', 'admin']), AgentController.deleteTeam);

// 4. Brokerage-wide Audit & Performance Summaries
router.get('/audit-events', requireAuth, requireRole(['broker', 'admin']), AgentController.getAuditEvents);
router.get('/performance/summary', requireAuth, requireRole(['broker', 'admin']), AgentController.getPerformance);
router.post('/transfers/:transferId/retry', requireAuth, requireRole(['broker', 'admin']), AgentController.retryTransfer);

// 5. Authenticated administrative agent directory (Brokers & Admins)
router.get('/', requireAuth, requireRole(['broker', 'admin']), validateQuery(queryAgentSchema), AgentController.list);

// 6. Single Agent Sub-Resources
router.get('/:id/availability', requireAuth, AgentController.getAvailability);
router.put('/:id/availability', requireAuth, validateBody(updateAgentAvailabilitySchema), AgentController.updateAvailability);
router.get('/:id/eligibility', requireAuth, AgentController.checkEligibility);
router.get('/:id/responsibilities', requireAuth, requireRole(['broker', 'admin']), AgentController.previewResponsibilities);
router.post(
  '/:id/responsibilities/transfer',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(transferResponsibilitiesSchema),
  AgentController.transferResponsibilities
);
router.post(
  '/:id/depart',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(departAgentSchema),
  AgentController.departAgent
);
router.get('/:id/audit-events', requireAuth, requireRole(['broker', 'admin']), AgentController.getAuditEvents);
router.get('/:id/performance', requireAuth, AgentController.getPerformance);

// 7. Single Agent Core CRUD
router.get('/:id', requireAuth, requireRole(['broker', 'admin']), AgentController.getById);

router.put(
  '/:id/status',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(updateAgentStatusSchema),
  AgentController.updateStatus
);

router.put(
  '/:id',
  requireAuth,
  validateBody(updateAgentProfileSchema),
  AgentController.updateProfile
);

router.post(
  '/:id/resubmit-credentials',
  requireAuth,
  AgentController.resubmitCredentials
);

export default router;
