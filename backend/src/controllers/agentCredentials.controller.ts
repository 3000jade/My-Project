import { Request, Response } from 'express';
import { AgentCredentialsService, CredentialDocumentKind } from '../services/agentCredentials.service';
import logger from '../utils/logger';

export class AgentCredentialsController {
  /**
   * POST /api/agent-credentials/upload
   * Accepts multipart file and invitation token or authenticated agent user
   */
  public static async uploadCredential(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'File is required in upload request.' });
        return;
      }

      const token = (req.body?.token || req.headers?.['x-invitation-token']) as string | undefined;
      const authenticatedUser = (req as any).user;
      const agentId = authenticatedUser?.role === 'agent' ? authenticatedUser.id : req.body?.agentId;
      const kind = (req.body?.kind || 'other') as CredentialDocumentKind;

      const result = await AgentCredentialsService.uploadCredential({
        file,
        token,
        agentId,
        kind,
      });

      res.status(201).json({
        success: true,
        document: result,
      });
    } catch (err: any) {
      logger.error('[AgentCredentialsController] Upload error:', err.message);
      res.status(400).json({ error: err.message || 'Failed to upload credential document.' });
    }
  }

  /**
   * GET /api/agent-credentials/:documentId/content
   * Streams private credential file contents to authorized applicant or broker/admin
   */
  public static async getDocumentContent(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const authenticatedUser = (req as any).user;
      const token = (req.query?.token || req.headers?.['x-invitation-token']) as string | undefined;

      const actor = {
        userId: authenticatedUser?.id,
        role: authenticatedUser?.role,
        token,
      };

      const fileResult = await AgentCredentialsService.getDocumentContentStream(documentId, actor);

      res.setHeader('Content-Type', fileResult.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(fileResult.fileName)}"`
      );
      if (fileResult.contentLength) {
        res.setHeader('Content-Length', fileResult.contentLength);
      }

      fileResult.stream.pipe(res);
    } catch (err: any) {
      logger.error('[AgentCredentialsController] Stream error:', err.message);
      if (err.message?.includes('not found')) {
        res.status(404).json({ error: err.message });
      } else if (err.message?.includes('Access denied') || err.message?.includes('Unauthorized agent')) {
        res.status(403).json({ error: err.message });
      } else if (err.message?.includes('Unauthorized') || err.message?.includes('Authentication required')) {
        res.status(401).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve document content.' });
      }
    }
  }

  /**
   * GET /api/agent-credentials/agent/:agentId
   * List credentials for an agent (restricted to broker/admin or self)
   */
  public static async listAgentCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const authenticatedUser = (req as any).user;

      const isBrokerOrAdmin = authenticatedUser?.role === 'broker' || authenticatedUser?.role === 'admin';
      const isSelf = authenticatedUser?.role === 'agent' && authenticatedUser?.id === agentId;

      if (!isBrokerOrAdmin && !isSelf) {
        res.status(403).json({ error: 'Access denied: You cannot view credentials for this agent.' });
        return;
      }

      const docs = await AgentCredentialsService.listDocumentsForAgent(agentId);
      res.json({ success: true, documents: docs });
    } catch (err: any) {
      logger.error('[AgentCredentialsController] List error:', err.message);
      res.status(500).json({ error: err.message || 'Failed to list credentials.' });
    }
  }
}

export default AgentCredentialsController;
