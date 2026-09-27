import { Router } from 'express';
import multer from 'multer';
import { DriveController } from '../controllers/drive.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for architectural drawings and high-res media
  },
});

/**
 * POST /api/drive/upload
 * Protected file upload to Google Drive
 */
router.post('/upload', requireAuth, upload.single('file'), DriveController.uploadFile);

/**
 * GET /api/drive/listing/:propertyId
 * Get all files for a listing
 */
router.get('/listing/:propertyId', DriveController.listFiles);

/**
 * DELETE /api/drive/files/:fileId
 * Delete file from Google Drive
 */
router.delete('/files/:fileId', requireAuth, DriveController.deleteFile);

export default router;
