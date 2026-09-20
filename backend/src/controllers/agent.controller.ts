import { Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
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
      const { verification_status } = req.body;

      if (!verification_status) {
        res.status(400).json({
          success: false,
          error: 'verification_status is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = await AgentService.updateAgentStatus(id, verification_status);

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
      res.status(500).json({
        success: false,
        error: err.message || 'Error updating agent verification status.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AgentController;
