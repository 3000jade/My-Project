import { Request, Response } from 'express';
import { InvitationService } from '../services/invitation.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

function classifyInvitationError(err: any): number {
  const msg = (err?.message || '').toLowerCase();
  if (
    msg.includes('database error') ||
    msg.includes('connection') ||
    msg.includes('network') ||
    msg.includes('unavailable')
  ) {
    return 503;
  }
  if (
    msg.includes('409') ||
    msg.includes('conflict') ||
    msg.includes('already exists') ||
    msg.includes('in progress')
  ) {
    return 409;
  }
  if (msg.includes('not found')) {
    return 404;
  }
  if (msg.includes('required') || msg.includes('invalid')) {
    return 400;
  }
  return 500;
}

export class InvitationController {
  /**
   * POST /api/invitations
   * Dispatches agent invitation link via email
   */
  public static async create(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, fullName, phone, role, brokerAgency, message, allowReissue } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Email address is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const invitedBy = req.user?.id;
      const invitation = await InvitationService.createInvitation(
        { email, fullName, phone, role, brokerAgency, message, allowReissue },
        invitedBy
      );

      res.status(201).json({
        success: true,
        data: invitation,
        message: `Agent onboarding invitation sent to ${email}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const statusCode = classifyInvitationError(err);
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Failed to dispatch invitation.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/invitations
   * List all invitations with optional status filter
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const list = await InvitationService.listInvitations(status);
      res.status(200).json({
        success: true,
        data: list,
        message: 'Invitations retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const statusCode = classifyInvitationError(err);
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Failed to retrieve invitations.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/invitations/validate/:token
   * Public token validation endpoint
   */
  public static async validateToken(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const token = String(req.params.token || '');
      const result = await InvitationService.validateToken(token);

      if (!result.valid) {
        res.status(400).json({
          success: false,
          data: result,
          error: `Invitation token is ${result.reason?.toLowerCase() || 'invalid'}.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'Invitation token is valid.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error validating token.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/invitations/:id/resend
   */
  public static async resend(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await InvitationService.resendInvitation(id);

      res.status(200).json({
        success: true,
        data: updated,
        message: `Invitation resent to ${updated.email}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const statusCode = classifyInvitationError(err);
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Could not resend invitation.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/invitations/:id/revoke
   */
  public static async revoke(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await InvitationService.revokeInvitation(id);

      res.status(200).json({
        success: true,
        data: updated,
        message: `Invitation for ${updated.email} revoked.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const statusCode = classifyInvitationError(err);
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Could not revoke invitation.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default InvitationController;
