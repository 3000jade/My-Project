import { Router } from 'express';
import { MailController } from '../controllers/mail.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

/**
 * POST /api/mail/send
 * Protected endpoint for direct email delivery
 */
router.post('/send', requireAuth, requireRole(['agent', 'broker', 'admin']), MailController.sendMail);

export default router;
