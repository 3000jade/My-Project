import { Router } from 'express';
import { sendMessage } from '../controllers/chat.controller';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { chatRequestSchema } from '../schemas/chat.schema';

const router = Router();

// POST /api/chat
router.post('/', chatRateLimiter, validateBody(chatRequestSchema), sendMessage);

export default router;
