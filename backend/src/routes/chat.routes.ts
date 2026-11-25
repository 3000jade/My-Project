import { Router } from 'express';
import { sendMessage, sendMessageStream } from '../controllers/chat.controller';
import {
  getLiveAgents,
  getLiveMessages,
  postLiveMessage,
  startLiveHandoff,
  streamLiveChat,
} from '../controllers/chatLive.controller';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { chatRequestSchema } from '../schemas/chat.schema';

const router = Router();

// POST /api/chat
router.post('/', chatRateLimiter, validateBody(chatRequestSchema), sendMessage);

// POST /api/chat/stream
router.post('/stream', chatRateLimiter, validateBody(chatRequestSchema), sendMessageStream);

// Live agent selection & visitor-scoped live chat
router.get('/live-agents', chatRateLimiter, getLiveAgents);
router.post('/live-handoff', chatRateLimiter, startLiveHandoff);
router.get('/live/:inquiryId/stream', streamLiveChat);
router.get('/live/:inquiryId/messages', getLiveMessages);
router.post('/live/:inquiryId/messages', chatRateLimiter, postLiveMessage);

export default router;
