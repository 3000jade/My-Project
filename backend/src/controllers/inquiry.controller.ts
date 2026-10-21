import { Request, Response } from 'express';
import { InquiryService } from '../services/inquiry.service';
import { AuditService } from '../services/audit.service';
import { GmailService } from '../services/gmail.service';
import logger from '../utils/logger';
import type { ApiResponse } from '../types/api';

export class InquiryController {
  /**
   * POST /api/inquiries
   * Public or Authenticated client submission
   */
  public static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        res.status(400).json({
          success: false,
          error: 'Name, email, and message are required fields.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      const inquiryPayload = {
        ...req.body,
        clientId: user?.id || req.body.clientId || req.body.client_id,
        client_id: user?.id || req.body.clientId || req.body.client_id,
      };

      const inquiry = await InquiryService.createInquiry(inquiryPayload);

      // Asynchronous notification dispatch via Gmail API
      void GmailService.sendInquiryNotification({
        agentName: 'Listing Consultant',
        agentEmail: 'consultant@cpkerby.luxury',
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        clientPhone: inquiry.phone,
        propertyTitle: inquiry.propertyTitle || inquiry.property_title || 'Luxury Estate',
        propertyPrice: inquiry.propertyPrice || inquiry.property_price,
        message: inquiry.message,
      }).catch((err) => logger.warn('[InquiryController] Gmail dispatch warning:', err.message));

      res.status(201).json({
        success: true,
        data: inquiry,
        message: 'Inquiry received. A representative will contact you shortly.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error processing inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/request-agent
   * Registered Client Request an Agent live chat flow (AUTH-01, ROUTE-01)
   */
  public static async requestAgentChat(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required before creating an agent chat request.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await InquiryService.requestAgentChat({
        clientId: user.id,
        clientName: user.full_name || user.name || 'Registered Client',
        clientEmail: user.email || 'client@luxury.ph',
        propertyId: req.body.propertyId,
        propertyTitle: req.body.propertyTitle,
        propertyPrice: req.body.propertyPrice,
        agentId: req.body.agentId,
        returnTo: req.body.returnTo,
        initialMessage: req.body.initialMessage,
        agentAvailable: req.body.agentAvailable,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: result.resumed
          ? 'Resumed existing inquiry chat session.'
          : 'Authenticated agent chat request initiated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error initiating agent chat request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/broker-metrics
   * Broker monitoring SLA & queue metrics (BROKER-01)
   */
  public static async getBrokerMetrics(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const metrics = await InquiryService.getBrokerMonitoringMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
        message: 'Broker monitoring metrics retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error computing broker metrics.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries
   * Staff listing (Broker/Admin all, Agent assigned)
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const businessStatus = req.query.businessStatus as string | undefined;
      const operationalStatus = req.query.operationalStatus as string | undefined;
      const type = req.query.type as string | undefined;
      const search = req.query.search as string | undefined;
      let agentId = req.query.agentId as string | undefined;

      const user = (req as any).user;
      if (user && user.role === 'agent' && !agentId) {
        agentId = user.id;
      }

      const inquiries = await InquiryService.listInquiries({
        status,
        businessStatus,
        operationalStatus,
        agentId,
        type,
        search,
      });

      res.status(200).json({
        success: true,
        data: inquiries,
        message: 'Inquiries retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching inquiries.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/my-inquiries
   * Authenticated client inquiries list (sanitized)
   */
  public static async getMyInquiries(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required to view your inquiries.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const inquiries = await InquiryService.getMyInquiries(user.id, user.email);

      res.status(200).json({
        success: true,
        data: inquiries,
        message: 'Client inquiries retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching client inquiries.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/:id
   */
  public static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const requesterRole = user?.role || 'public';

      const inquiry = await InquiryService.getInquiryById(id, requesterRole, user?.id, user?.email);

      if (!inquiry) {
        res.status(404).json({
          success: false,
          error: `Inquiry with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: inquiry,
        message: 'Inquiry retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Error retrieving inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/:id/reconnect
   * Reconnect & cursor reconciliation endpoint (CHAT-02, SESSION-03)
   */
  public static async reconnect(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const sinceCursor = req.query.sinceCursor as string | undefined;
      const pendingRequestIds = req.query.pendingRequestIds
        ? String(req.query.pendingRequestIds).split(',').filter(Boolean)
        : [];

      const synced = await InquiryService.reconnectAndSync(id, {
        userId: user?.id,
        role: user?.role || 'client',
        userEmail: user?.email,
        sinceCursor,
        pendingRequestIds,
      });

      res.status(200).json({
        success: true,
        data: synced,
        message: 'Inquiry re-authorized and synchronized.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 400;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to synchronize inquiry session.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/assign
   * Broker/Admin assigns agent
   */
  public static async assignAgent(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { agentId, notes } = req.body;

      if (!agentId) {
        res.status(400).json({
          success: false,
          error: 'agentId is required for assignment.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      const updated = await InquiryService.assignAgent(
        id,
        agentId,
        user?.id,
        user?.full_name || 'Brokerage Admin',
        notes
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Agent assigned successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error assigning agent.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/messages
   * Append message to thread (Client or Staff) with requestId idempotency
   */
  public static async addMessage(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { content, requestId, attachments } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({
          success: false,
          error: 'Message content cannot be empty.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      const senderRole = user?.role || 'client';
      const senderName = user?.full_name || user?.name || (senderRole === 'client' ? 'Client' : 'Agent');

      const message = await InquiryService.addMessage(id, {
        senderId: user?.id,
        sender: senderRole as any,
        senderName,
        content: content.trim(),
        requestId,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message added to thread.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Error appending message.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/messages/read
   * Record authorized recipient read receipts (CHAT-01)
   */
  public static async markMessagesRead(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const result = await InquiryService.markMessagesRead(id, {
        userId: user?.id,
        role: user?.role || 'client',
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Messages marked as read.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 400;
      res.status(status).json({
        success: false,
        error: err.message || 'Error marking messages read.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/inquiries/:id/messages/:msgId
   * Edit or redact message with audit logging
   */
  public static async editOrRedactMessage(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const msgId = String(req.params.msgId);
      const user = (req as any).user;
      const updated = await InquiryService.editOrRedactMessage(id, msgId, {
        actorId: user?.id,
        actorName: user?.full_name || user?.name || 'User',
        actorRole: user?.role || 'agent',
        action: req.body.action || 'edit',
        newContent: req.body.content,
        reason: req.body.reason,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Message updated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error updating message.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/chat-session/end
   * End communication episode without inactivating inquiry (LIFE-01)
   */
  public static async endChatSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const session = await InquiryService.endChatSession(id, req.body.sessionId || '', {
        actorId: user?.id,
        actorName: user?.full_name || user?.name || 'Participant',
        actorRole: user?.role || 'agent',
        reason: req.body.reason,
      });

      res.status(200).json({
        success: true,
        data: session,
        message: 'Chat session ended. Inquiry remains active.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error ending chat session.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/status
   * Change business status Active/Inactive with outcome & reason (LIFE-01)
   */
  public static async changeBusinessStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const updated = await InquiryService.changeBusinessStatus(id, {
        businessStatus: req.body.businessStatus,
        outcome: req.body.outcome,
        reason: req.body.reason,
        actorId: user?.id,
        actorName: user?.full_name || user?.name || 'Staff',
        actorRole: user?.role || 'agent',
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: `Inquiry business status updated to ${updated.businessStatus}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error changing business status.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/merge
   */
  public static async mergeInquiry(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const sourceId = String(req.params.id);
      const { targetInquiryId, reason } = req.body;
      const user = (req as any).user;
      const merged = await InquiryService.mergeInquiries(sourceId, targetInquiryId, {
        actorId: user?.id,
        actorName: user?.full_name || 'Broker',
        actorRole: user?.role || 'broker',
        reason,
      });

      res.status(200).json({
        success: true,
        data: merged,
        message: 'Duplicate inquiry merged.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error merging inquiries.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/tasks
   * Create follow-up task (TASK-01)
   */
  public static async createTask(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const task = await InquiryService.createFollowUpTask(id, {
        assignedTo: req.body.assignedTo || user?.id,
        createdBy: user?.id,
        title: req.body.title,
        notes: req.body.notes,
        dueAt: req.body.dueAt,
      });

      res.status(201).json({
        success: true,
        data: task,
        message: 'Follow-up task created.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error creating follow-up task.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/inquiries/:id/tasks/:taskId
   * Update follow-up task status (TASK-01)
   */
  public static async updateTask(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const taskId = String(req.params.taskId);
      const user = (req as any).user;
      const updated = await InquiryService.updateFollowUpTask(id, taskId, {
        status: req.body.status,
        notes: req.body.notes,
        actorId: user?.id,
        actorName: user?.full_name || 'Agent',
        actorRole: user?.role || 'agent',
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Follow-up task updated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error updating follow-up task.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/ai-summary
   * Generate structured 6-section AI Client Summary Report (AI-01, AI-02)
   */
  public static async generateAiSummary(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const summary = await InquiryService.generateAiSummaryForInquiry(
        id,
        {
          id: user?.id || 'staff',
          name: user?.full_name || user?.name || 'Advisory Specialist',
          role: user?.role || 'agent',
        },
        Boolean(req.body?.simulateFailure)
      );

      res.status(201).json({
        success: true,
        data: summary,
        message: 'AI Client Summary Report generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 400;
      res.status(status).json({
        success: false,
        error: err.message || 'Error generating AI summary.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/inquiries/:id/ai-summary/:summaryId
   * Review or correct AI Client Summary Report (AI-02)
   */
  public static async reviewAiSummary(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const summaryId = String(req.params.summaryId);
      const user = (req as any).user;
      const updated = await InquiryService.reviewAiSummaryForInquiry(id, summaryId, {
        actorId: user?.id || 'staff',
        actorName: user?.full_name || user?.name || 'Staff Member',
        actorRole: user?.role || 'agent',
        reviewStatus: req.body.reviewStatus || 'reviewed',
        corrections: req.body.corrections,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'AI Client Summary review recorded.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error reviewing AI summary.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/:id/timeline
   * Simplified activity timeline for inquiry
   */
  public static async getTimeline(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;
      const timeline = await AuditService.getInquiryActivityTimeline(id, user?.role || 'client');

      res.status(200).json({
        success: true,
        data: timeline,
        message: 'Inquiry activity timeline retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching activity timeline.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/notes
   * Append private internal note (Staff only)
   */
  public static async addNote(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({
          success: false,
          error: 'Note content cannot be empty.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      if (!user || !['agent', 'broker', 'admin'].includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Only agents and brokers can create internal notes.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const note = await InquiryService.addNote(id, {
        authorId: user.id,
        authorName: user.full_name || user.name || 'Staff Member',
        authorRole: user.role,
        content: content.trim(),
      });

      res.status(201).json({
        success: true,
        data: note,
        message: 'Internal note recorded.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /access denied|not authorized/i.test(err.message) ? 403 : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Error recording internal note.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/inquiries/:id/schedule
   */
  public static async scheduleViewing(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { appointmentTime, notes } = req.body;

      if (!appointmentTime) {
        res.status(400).json({
          success: false,
          error: 'appointmentTime is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      const updated = await InquiryService.scheduleViewing(id, {
        appointmentTime,
        agentId: user?.id,
        notes,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Viewing appointment scheduled.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error scheduling viewing appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/inquiries/:id
   */
  public static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status, closure_reason, closureReason, inactiveOutcome } = req.body;

      if (status === 'closed' && !closure_reason && !closureReason && !inactiveOutcome) {
        res.status(400).json({
          success: false,
          error: 'Closure reason is required when status is closed.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = await InquiryService.updateInquiry(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Inquiry with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Inquiry updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error updating inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/inquiries/:id
   */
  public static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const success = await InquiryService.deleteInquiry(id);

      res.status(200).json({
        success,
        message: 'Inquiry deleted successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error deleting inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default InquiryController;
