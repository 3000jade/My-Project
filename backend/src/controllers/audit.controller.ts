import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import type { ApiResponse } from '../types/api';

export class AuditController {
  /**
   * GET /api/audit-events
   * Broker/Admin protected audit event viewer
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = (req as any).user;
      const events = await AuditService.listAuditEvents(
        {
          inquiryId: req.query.inquiryId as string | undefined,
          eventType: req.query.eventType as string | undefined,
          actorId: req.query.actorId as string | undefined,
          outcome: req.query.outcome as string | undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        },
        {
          actorId: user?.id,
          actorRole: user?.role,
        }
      );

      res.status(200).json({
        success: true,
        data: events,
        message: 'Audit events retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /unauthorized|forbidden/i.test(err.message) ? 403 : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to retrieve audit events.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/audit-events/export
   * Authorized Broker/Admin export
   */
  public static async exportEvents(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = (req as any).user;
      const payload = await AuditService.exportAuditEvents(
        {
          inquiryId: req.query.inquiryId as string | undefined,
          eventType: req.query.eventType as string | undefined,
        },
        {
          actorId: user?.id,
          actorName: user?.full_name || user?.email,
          actorRole: user?.role,
        }
      );

      res.status(200).json({
        success: true,
        data: payload,
        message: 'Audit log export generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = /unauthorized|forbidden/i.test(err.message) ? 403 : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to export audit logs.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE / PATCH /api/audit-events/:id
   * Rejects any mutation attempt on immutable audit store (AUD-02)
   */
  public static async rejectMutation(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = (req as any).user;
      await AuditService.attemptModifyAuditRecord(String(req.params.id), {
        actorId: user?.id,
        actorName: user?.full_name || user?.email,
        actorRole: user?.role,
      });
    } catch (err: any) {
      res.status(403).json({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AuditController;
