import { Router } from 'express';
import { InquiryController } from '../controllers/inquiry.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createInquirySchema,
  requestAgentChatSchema,
  updateInquirySchema,
  changeBusinessStatusSchema,
  queryInquirySchema,
  assignInquirySchema,
  postInquiryMessageSchema,
  postInquiryNoteSchema,
  scheduleInquiryTourSchema,
  createFollowUpTaskSchema,
  updateFollowUpTaskSchema,
} from '../schemas/inquiry.schema';

const router = Router();

// Public lead capture & tour request submission
router.post('/', optionalAuth, validateBody(createInquirySchema), InquiryController.create);

// Authenticated client Request an Agent chat flow
router.post('/request-agent', requireAuth, validateBody(requestAgentChatSchema), InquiryController.requestAgentChat);

// Authenticated client inquiries list (sanitized: strictly no internal notes)
router.get('/my-inquiries', requireAuth, InquiryController.getMyInquiries);

// Broker monitoring dashboard metrics
router.get('/broker-metrics', requireAuth, requireRole(['broker', 'admin']), InquiryController.getBrokerMetrics);

// Authenticated list for agents & brokers
router.get('/', requireAuth, validateQuery(queryInquirySchema), InquiryController.list);

// Reconnect & cursor synchronization
router.get('/:id/reconnect', requireAuth, InquiryController.reconnect);

// Simplified activity timeline
router.get('/:id/timeline', requireAuth, InquiryController.getTimeline);

// Authenticated detail lookup
router.get('/:id', optionalAuth, InquiryController.getById);

// Update inquiry status / closure / details
router.put(
  '/:id',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(updateInquirySchema),
  InquiryController.update
);

// Change Active/Inactive business status with mandatory outcome & reason
router.post(
  '/:id/status',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(changeBusinessStatusSchema),
  InquiryController.changeBusinessStatus
);

// Merge duplicate inquiry
router.post(
  '/:id/merge',
  requireAuth,
  requireRole(['broker', 'admin']),
  InquiryController.mergeInquiry
);

// Assign or reassign agent (Broker / Admin only)
router.post(
  '/:id/assign',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(assignInquirySchema),
  InquiryController.assignAgent
);

// Append message to conversation thread (Client, Agent, Broker)
router.post(
  '/:id/messages',
  requireAuth,
  validateBody(postInquiryMessageSchema),
  InquiryController.addMessage
);

// Mark messages as read
router.post('/:id/messages/read', requireAuth, InquiryController.markMessagesRead);

// Edit or redact message
router.patch('/:id/messages/:msgId', requireAuth, InquiryController.editOrRedactMessage);

// End communication chat session episode
router.post('/:id/chat-session/end', requireAuth, InquiryController.endChatSession);

// Follow-up tasks CRUD
router.post(
  '/:id/tasks',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(createFollowUpTaskSchema),
  InquiryController.createTask
);

router.patch(
  '/:id/tasks/:taskId',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(updateFollowUpTaskSchema),
  InquiryController.updateTask
);

// AI Client Summary Report generation & review
router.post(
  '/:id/ai-summary',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  InquiryController.generateAiSummary
);

router.patch(
  '/:id/ai-summary/:summaryId',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  InquiryController.reviewAiSummary
);

// Append private internal note (Agent, Broker, Admin only)
router.post(
  '/:id/notes',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(postInquiryNoteSchema),
  InquiryController.addNote
);

// Schedule private viewing appointment linked to inquiry
router.post(
  '/:id/schedule',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(scheduleInquiryTourSchema),
  InquiryController.scheduleViewing
);

// Delete inquiry (Broker / Admin only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  InquiryController.delete
);

export default router;
