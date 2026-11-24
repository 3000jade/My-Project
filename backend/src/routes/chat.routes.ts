import { Router } from 'express';
import { sendMessage, sendMessageStream } from '../controllers/chat.controller';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { chatRequestSchema } from '../schemas/chat.schema';

const router = Router();

// POST /api/chat
router.post('/', chatRateLimiter, validateBody(chatRequestSchema), sendMessage);

// POST /api/chat/stream
router.post('/stream', chatRateLimiter, validateBody(chatRequestSchema), sendMessageStream);

export default router;
