import { Router } from 'express';
import { DataManagementController } from '../controllers/dataManagement.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All Data Management backup endpoints are strictly Admin-only
router.use(requireAuth, requireRole(['admin']));

router.get('/backup/summary', DataManagementController.getBackupSummary);
router.get('/backup/export', DataManagementController.exportSnapshot);
router.post('/restore/preview', DataManagementController.previewRestore);
router.post('/restore/commit', DataManagementController.commitRestore);

export default router;
