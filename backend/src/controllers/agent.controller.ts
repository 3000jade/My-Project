import { Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class AgentController {
  /**
   * GET /api/agents
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const agents = await AgentService.listAgents({ status, search });

      res.status(200).json({
        success: true,
        data: agents,
        message: 'Agents retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving agent directory.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/:id
   */
  public static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const agent = await AgentService.getAgentById(id);

      if (!agent) {
        res.status(404).json({
          success: false,
          error: `Agent with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: agent,
        message: 'Agent profile retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving agent.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/agents/:id/status
   */
  public static async updateStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { verification_status, rejection_remarks, suspension_reason, suspension_notes } = req.body;

      if (!verification_status) {
        res.status(400).json({
          success: false,
          error: 'verification_status is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const actorId = (req as AuthenticatedRequest).user?.id;
      const updated = await AgentService.updateAgentStatus(
        id,
        verification_status,
        { rejection_remarks, suspension_reason, suspension_notes },
        actorId
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Agent with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: `Agent verification status updated to ${verification_status}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const isConflict = err.message?.includes('cannot transition') || err.message?.includes('already');
      const isBadRequest = err.message?.includes('required') || err.message?.includes('incomplete') || err.message?.includes('expired');
      const statusCode = isConflict ? 409 : isBadRequest ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: err.message || 'Error updating agent verification status.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/agents/:id
   * Updates agent profile fields (Name, Phone, Bio, Licenses, Experience)
   */
  public static async updateProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await AgentService.updateAgentProfile(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Agent with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Agent profile updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error updating agent profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/agents/:id/resubmit-credentials
   * Allows rejected applicants to resubmit updated credentials for broker re-review
   */
  public static async resubmitCredentials(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (user.id !== id && user.role !== 'broker' && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You can only resubmit credentials for your own application.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const existing = await AgentService.getAgentById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Agent with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await AgentService.updateAgentProfile(id, req.body);
      await AgentService.updateAgentStatus(id, 'PENDING', 'Applicant credential resubmission', user.id);
      const refreshed = await AgentService.getAgentById(id);

      res.status(200).json({
        success: true,
        data: refreshed,
        message: 'Credentials resubmitted successfully. Your dossier is now pending review.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error resubmitting credentials.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AgentController;

