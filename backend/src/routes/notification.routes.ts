import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateNotificationReadSchema, createNotificationSchema } from '../schemas/notification.schema';

const router = Router();

router.get('/unread-count', optionalAuth, NotificationController.getUnreadCount);
router.get('/preferences', requireAuth, NotificationController.getPreferences);
router.put('/preferences', requireAuth, NotificationController.updatePreferences);
router.post('/callbacks/:provider', NotificationController.handleCallback);
router.get('/', optionalAuth, NotificationController.list);
router.patch('/:id/read', optionalAuth, validateBody(updateNotificationReadSchema), NotificationController.markAsRead);
router.post('/mark-all-read', optionalAuth, NotificationController.markAllAsRead);
router.post('/', optionalAuth, validateBody(createNotificationSchema), NotificationController.create);

export default router;
