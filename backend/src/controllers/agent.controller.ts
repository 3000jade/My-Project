import { Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { AgentTeamService } from '../services/agentTeam.service';
import { AgentAvailabilityService } from '../services/agentAvailability.service';
import { AgentTransferService } from '../services/agentTransfer.service';
import { AgentEligibilityService } from '../services/agentEligibility.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

const DEFAULT_BROKERAGE_ID = '00000000-0000-0000-0000-000000000001';

export class AgentController {
  /**
   * GET /api/agents/public
   * Public directory of active verified agents (confidential fields stripped)
   */
  public static async listPublic(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const publicAgents = await AgentService.listPublicAgents();
      res.status(200).json({
        success: true,
        data: publicAgents,
        message: 'Public agent directory retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving public agent directory.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/public/:id
   * Public safe profile for a single active verified agent
   */
  public static async getPublicById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const publicAgent = await AgentService.getPublicAgentById(id);

      if (!publicAgent) {
        res.status(404).json({
          success: false,
          error: 'Public agent profile not found or unavailable.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: publicAgent,
        message: 'Public agent profile retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving public agent profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/me
   * Authenticated agent self-service profile, completeness checklist, and schedule
   */
  public static async getMyProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const agent = await AgentService.getAgentById(userId);
      if (!agent) {
        res.status(404).json({
          success: false,
          error: 'Agent profile not found.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const availability = await AgentAvailabilityService.getAvailability(userId);

      // Strip broker-only internal notes when returned to the agent themselves
      const { internal_notes, ...selfSafeAgent } = agent;

      res.status(200).json({
        success: true,
        data: {
          ...selfSafeAgent,
          availability,
        },
        message: 'Self-service agent profile retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving self-service profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const membership_status = req.query.membership_status as string | undefined;
      const onboarding_status = req.query.onboarding_status as string | undefined;
      const routing_availability = req.query.routing_availability as string | undefined;
      const license_status = req.query.license_status as string | undefined;
      const team_id = req.query.team_id as string | undefined;
      const brokerage_id = req.query.brokerage_id as string | undefined;
      const search = req.query.search as string | undefined;

      const agents = await AgentService.listAgents({
        status,
        membership_status,
        onboarding_status,
        routing_availability,
        license_status,
        team_id,
        brokerage_id,
        search,
      });

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

      const availability = await AgentAvailabilityService.getAvailability(id);

      res.status(200).json({
        success: true,
        data: {
          ...agent,
          availability,
        },
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
      const {
        verification_status,
        rejection_remarks,
        suspension_reason,
        suspension_notes,
        membership_status,
        onboarding_status,
        routing_availability,
      } = req.body;

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
        {
          rejection_remarks,
          suspension_reason,
          suspension_notes,
          membership_status,
          onboarding_status,
          routing_availability,
        },
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
      const isBadRequest =
        err.message?.includes('required') ||
        err.message?.includes('incomplete') ||
        err.message?.includes('expired');
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
   * Updates agent profile fields (Broker/Admin or Self-Service for own ID)
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user;

      if (user && user.role === 'agent' && user.id !== id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Agents can only update their own profile.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const actor = user ? { id: user.id, role: user.role } : undefined;
      const updated = await AgentService.updateAgentProfile(id, req.body, actor);

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

      await AgentService.updateAgentProfile(id, req.body, { id: user.id, role: user.role });
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

  /**
   * GET /api/agents/teams
   */
  public static async listTeams(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const brokerageId = (req.query.brokerage_id as string) || DEFAULT_BROKERAGE_ID;
      const teams = await AgentTeamService.listTeams(brokerageId);
      res.status(200).json({
        success: true,
        data: teams,
        message: 'Teams retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving teams.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/agents/teams
   */
  public static async createTeam(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { name, description, lead_agent_id, brokerage_id } = req.body;
      const created = await AgentTeamService.createTeam({
        name,
        description,
        lead_agent_id,
        brokerage_id: brokerage_id || DEFAULT_BROKERAGE_ID,
      });

      res.status(201).json({
        success: true,
        data: created,
        message: 'Team created successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error creating team.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/agents/teams/:teamId
   */
  public static async updateTeam(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const teamId = String(req.params.teamId);
      const brokerageId = (req.body.brokerage_id as string) || DEFAULT_BROKERAGE_ID;
      const updated = await AgentTeamService.updateTeam(teamId, req.body, brokerageId);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Team "${teamId}" not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Team updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error updating team.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/agents/teams/:teamId
   */
  public static async deleteTeam(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const teamId = String(req.params.teamId);
      const brokerageId = (req.query.brokerage_id as string) || DEFAULT_BROKERAGE_ID;
      const deleted = await AgentTeamService.deleteTeam(teamId, brokerageId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Team "${teamId}" not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: teamId, deleted: true },
        message: 'Team deleted successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error deleting team.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/:id/availability
   */
  public static async getAvailability(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const schedule = await AgentAvailabilityService.getAvailability(id);

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Agent availability schedule retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving availability schedule.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/agents/:id/availability
   */
  public static async updateAvailability(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user;

      if (user && user.role === 'agent' && user.id !== id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update your own availability schedule.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = await AgentAvailabilityService.updateAvailability(id, req.body, user?.id);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Agent availability schedule updated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error updating availability schedule.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/:id/eligibility
   */
  public static async checkEligibility(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const operations = [
        'receive_lead',
        'edit_listing',
        'create_listing',
        'publish_listing',
        'assign_listing',
      ] as const;

      const results: Record<string, any> = {};
      for (const op of operations) {
        results[op] = await AgentEligibilityService.evaluate(id, op);
      }

      res.status(200).json({
        success: true,
        data: {
          agent_id: id,
          operations: results,
        },
        message: 'Agent operational eligibility evaluated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error evaluating eligibility.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/:id/responsibilities
   */
  public static async previewResponsibilities(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const brokerageId = (req.query.brokerage_id as string) || DEFAULT_BROKERAGE_ID;
      const preview = await AgentTransferService.previewResponsibilities(id, brokerageId);

      res.status(200).json({
        success: true,
        data: preview,
        message: 'Agent responsibility preview retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error previewing agent responsibilities.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/agents/:id/responsibilities/transfer
   */
  public static async transferResponsibilities(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?.id || 'broker';
      const brokerageId = (req.body.brokerage_id as string) || DEFAULT_BROKERAGE_ID;

      const result = await AgentTransferService.executeTransfer(id, req.body, actorId, brokerageId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Responsibilities transferred successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error transferring responsibilities.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/agents/transfers/:transferId/retry
   */
  public static async retryTransfer(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const transferId = String(req.params.transferId);
      const actorId = req.user?.id || 'broker';
      const retried = await AgentTransferService.retryTransfer(transferId, actorId);

      if (!retried) {
        res.status(404).json({
          success: false,
          error: `Transfer record "${transferId}" not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: retried,
        message: 'Transfer retried and completed.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error retrying transfer.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/agents/:id/depart
   */
  public static async departAgent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?.id || 'broker';
      const brokerageId = (req.body.brokerage_id as string) || DEFAULT_BROKERAGE_ID;

      const result = await AgentTransferService.departAgent(id, req.body, actorId, brokerageId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Agent offboarded and active responsibilities reassigned.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error departing agent.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/audit-events or GET /api/agents/:id/audit-events
   */
  public static async getAuditEvents(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const agentId = (req.params.id as string) || (req.query.agent_id as string) || undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const events = await AgentService.getAuditEvents(agentId, limit);

      res.status(200).json({
        success: true,
        data: events,
        message: 'Audit events retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving audit events.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/agents/performance/summary or GET /api/agents/:id/performance
   */
  public static async getPerformance(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const agentId = (req.params.id as string) || undefined;
      const summary = await AgentService.getPerformanceSummary(agentId);

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Performance metrics retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving performance summary.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AgentController;
