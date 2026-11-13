import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { AgentCredentialsController } from '../controllers/agentCredentials.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error(`Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/agent-credentials/upload
 * Upload credential document (supports token or authenticated agent)
 */
router.post('/upload', uploadRateLimiter, optionalAuth, upload.single('file'), AgentCredentialsController.uploadCredential);

/**
 * GET /api/agent-credentials/:documentId/content
 * Stream credential content with authorization check
 */
router.get('/:documentId/content', optionalAuth, AgentCredentialsController.getDocumentContent);

/**
 * GET /api/agent-credentials/agent/:agentId
 * List credential documents for an agent
 */
router.get('/agent/:agentId', requireAuth, AgentCredentialsController.listAgentCredentials);

export default router;
