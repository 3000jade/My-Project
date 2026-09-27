import { Router } from 'express';
import { MailController } from '../controllers/mail.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/mail/send
 * Protected endpoint for direct email delivery
 */
router.post('/send', requireAuth, MailController.sendMail);

export default router;
