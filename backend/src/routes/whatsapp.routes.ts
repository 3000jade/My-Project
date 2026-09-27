import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/whatsapp/link
 * Generate instant click-to-chat inquiry link
 */
router.get('/link', WhatsAppController.getInquiryLink);

/**
 * POST /api/whatsapp/send
 * Protected endpoint to dispatch lead alerts
 */
router.post('/send', requireAuth, WhatsAppController.sendAlert);

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook verification handshake
 */
router.get('/webhook', WhatsAppController.verifyWebhook);

/**
 * POST /api/whatsapp/webhook
 * Meta Webhook inbound event handler
 */
router.post('/webhook', WhatsAppController.handleWebhook);

export default router;
