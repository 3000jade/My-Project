import { Response } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { SessionService } from '../services/session.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class AdminController {
  /**
   * GET /api/admin/users
   * List all user profiles with administrative metadata
   */
  public static async listUsers(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!isSupabaseConfigured) {
        const mockUsers = [
          {
            id: 'usr-admin-1',
            email: 'admin@pt.com',
            full_name: 'System Administrator',
            role: 'admin',
            verification_status: 'VERIFIED',
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'usr-broker-1',
            email: 'broker@pt.com',
            full_name: 'Principal Broker',
            role: 'broker',
            verification_status: 'VERIFIED',
            created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          {
            id: 'usr-agent-1',
            email: 'agent@pt.com',
            full_name: 'Licensed Agent Vance',
            role: 'agent',
            verification_status: 'VERIFIED',
            prc_license_no: '0098765',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
          {
            id: 'usr-client-1',
            email: 'client@pt.com',
            full_name: 'Investor Clara',
            role: 'client',
            verification_status: 'VERIFIED',
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ];

        res.status(200).json({
          success: true,
          data: { users: mockUsers, total: mockUsers.length },
          message: 'Admin users loaded (development mock).',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { data, error, count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({
        success: true,
        data: { users: data || [], total: count || 0 },
        message: 'Admin users loaded successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to list users.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Modify user role
   */
  public static async updateUserRole(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const { role } = req.body;
      const validRoles = ['client', 'agent', 'broker', 'admin'];

      if (!id || !role || !validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (isSupabaseConfigured) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          throw new Error(error.message);
        }
      }

      void AuditService.recordEvent({
        eventType: 'admin.user_role_updated',
        actorId: req.user?.id || 'admin',
        actorType: 'human',
        targetType: 'user_profile',
        targetId: id,
        outcome: 'success',
        reason: 'Administrative role assignment',
        newValues: { role },
      });

      res.status(200).json({
        success: true,
        data: { id, role },
        message: `User role successfully updated to '${role}'.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update user role.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Suspend or activate user account
   */
  public static async updateUserStatus(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const { status, reason } = req.body;

      if (!status || !['VERIFIED', 'SUSPENDED', 'PENDING'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Status must be one of: VERIFIED, SUSPENDED, PENDING.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (status === 'SUSPENDED') {
        SessionService.disableUserAccount(id, reason || 'admin_suspended');
      }

      if (isSupabaseConfigured) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            verification_status: status,
            suspension_reason: status === 'SUSPENDED' ? reason || 'Administrative suspension' : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) {
          throw new Error(error.message);
        }
      }

      void AuditService.recordEvent({
        eventType: status === 'SUSPENDED' ? 'admin.account_suspended' : 'admin.account_activated',
        actorId: req.user?.id || 'admin',
        actorType: 'human',
        targetType: 'user_profile',
        targetId: id,
        outcome: 'success',
        reason: reason || 'Administrative status change',
        newValues: { status },
      });

      res.status(200).json({
        success: true,
        data: { id, status },
        message: `Account status successfully updated to '${status}'.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update account status.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AdminController;
