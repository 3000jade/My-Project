import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateNotificationReadSchema, createNotificationSchema } from '../schemas/notification.schema';

const router = Router();

router.get('/unread-count', requireAuth, NotificationController.getUnreadCount);
router.get('/preferences', requireAuth, NotificationController.getPreferences);
router.put('/preferences', requireAuth, NotificationController.updatePreferences);
router.post('/callbacks/:provider', NotificationController.handleCallback);
router.get('/', requireAuth, NotificationController.list);
router.patch('/:id/read', requireAuth, validateBody(updateNotificationReadSchema), NotificationController.markAsRead);
router.post('/mark-all-read', requireAuth, NotificationController.markAllAsRead);
router.post('/', requireAuth, requireRole(['broker', 'admin']), validateBody(createNotificationSchema), NotificationController.create);

export default router;
