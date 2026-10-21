import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, AuditController.list);
router.get('/export', requireAuth, AuditController.exportEvents);
router.patch('/:id', requireAuth, AuditController.rejectMutation);
router.delete('/:id', requireAuth, AuditController.rejectMutation);

export default router;
