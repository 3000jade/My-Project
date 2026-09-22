import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateNotificationReadSchema, createNotificationSchema } from '../schemas/notification.schema';

const router = Router();

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', optionalAuth, NotificationController.getUnreadCount);

/**
 * GET /api/notifications
 */
router.get('/', optionalAuth, NotificationController.list);

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', optionalAuth, validateBody(updateNotificationReadSchema), NotificationController.markAsRead);

/**
 * POST /api/notifications/mark-all-read
 */
router.post('/mark-all-read', optionalAuth, NotificationController.markAllAsRead);

/**
 * POST /api/notifications
 */
router.post('/', optionalAuth, validateBody(createNotificationSchema), NotificationController.create);

export default router;
