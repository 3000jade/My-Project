import { Router } from 'express';
import { DataManagementController } from '../controllers/dataManagement.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(requireAuth);

// Import / Export spoke (Admin: all records, Broker: own records)
router.post('/import/preview', requireRole(['admin', 'broker']), DataManagementController.previewImport);
router.post('/import/commit', requireRole(['admin', 'broker']), DataManagementController.commitImport);
router.get('/export/:resource', requireRole(['admin', 'broker']), DataManagementController.exportRecords);

// Health, Archive/Restore & Snapshot Backup spoke (Admin only)
router.get('/health', requireRole(['admin']), DataManagementController.getHealth);
router.post('/archive', requireRole(['admin']), DataManagementController.archiveRecord);
router.post('/restore', requireRole(['admin']), DataManagementController.restoreRecord);
router.get('/backup/export', requireRole(['admin']), DataManagementController.exportSnapshot);

export default router;
