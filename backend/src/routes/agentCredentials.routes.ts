import { Router } from 'express';
import multer from 'multer';
import { AgentCredentialsController } from '../controllers/agentCredentials.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/agent-credentials/upload
 * Upload credential document (supports token or authenticated agent)
 */
router.post('/upload', optionalAuth, upload.single('file'), AgentCredentialsController.uploadCredential);

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
