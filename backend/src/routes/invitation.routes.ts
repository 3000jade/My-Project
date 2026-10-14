import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

/**
 * Public route: Token validation
 * GET /api/invitations/validate/:token
 */
router.get('/validate/:token', InvitationController.validateToken);

/**
 * Protected routes: Broker & Admin only
 */
router.use(requireAuth);
router.use(requireRole(['broker', 'admin']));

router.post('/', InvitationController.create);
router.get('/', InvitationController.list);
router.post('/:id/resend', InvitationController.resend);
router.post('/:id/revoke', InvitationController.revoke);
router.delete('/:id', InvitationController.revoke);

export default router;
