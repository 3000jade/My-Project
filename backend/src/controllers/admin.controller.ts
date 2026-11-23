import { Response } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { SessionService } from '../services/session.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest, invalidateAuthCache } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class AdminController {
  /**
   * GET /api/admin/users/stats
   * Aggregated user management statistics for executive KPI strip
   */
  public static async getUserStats(_req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!isSupabaseConfigured) {
        res.status(200).json({
          success: true,
          data: {
            totalUsers: 4,
            activeToday: 4,
            pendingAccreditation: 1,
            suspendedAccounts: 0,
          },
          message: 'Admin user statistics loaded (development mock).',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Total count
      const { count: totalUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Suspended count
      const { count: suspendedAccounts } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'SUSPENDED');

      // Pending accreditation count (agents with missing prc or pending verification)
      const { count: pendingAccreditation } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent')
        .or('verification_status.eq.PENDING,prc_license_no.is.null');

      const activeToday = Math.max(0, (totalUsers || 0) - (suspendedAccounts || 0));

      res.status(200).json({
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeToday,
          pendingAccreditation: pendingAccreditation || 0,
          suspendedAccounts: suspendedAccounts || 0,
        },
        message: 'Admin user statistics loaded successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to load user statistics.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/admin/users
   * List all user profiles with administrative metadata, search, and pagination
   */
  public static async listUsers(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '15'), 10) || 15));
      const search = String(req.query.search || '').trim().toLowerCase();
      const roleFilter = String(req.query.role || '').trim();
      const statusFilter = String(req.query.status || '').trim().toLowerCase();

      if (!isSupabaseConfigured) {
        let mockUsers = [
          {
            id: 'usr-admin-1',
            email: 'admin@pt.com',
            full_name: 'System Administrator',
            fullName: 'System Administrator',
            role: 'admin',
            verification_status: 'VERIFIED',
            status: 'active',
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'usr-broker-1',
            email: 'broker@pt.com',
            full_name: 'Principal Broker',
            fullName: 'Principal Broker',
            role: 'broker',
            verification_status: 'VERIFIED',
            status: 'active',
            created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          {
            id: 'usr-agent-1',
            email: 'agent@pt.com',
            full_name: 'Licensed Agent Vance',
            fullName: 'Licensed Agent Vance',
            role: 'agent',
            verification_status: 'VERIFIED',
            status: 'active',
            prc_license_no: '0098765',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
          {
            id: 'usr-client-1',
            email: 'client@pt.com',
            full_name: 'Investor Clara',
            fullName: 'Investor Clara',
            role: 'client',
            verification_status: 'VERIFIED',
            status: 'active',
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ];

        if (search) {
          mockUsers = mockUsers.filter(
            (u) =>
              (u.full_name && u.full_name.toLowerCase().includes(search)) ||
              (u.email && u.email.toLowerCase().includes(search))
          );
        }

        if (roleFilter && roleFilter !== 'all') {
          mockUsers = mockUsers.filter((u) => u.role === roleFilter);
        }

        if (statusFilter && statusFilter !== 'all') {
          mockUsers = mockUsers.filter((u) => {
            if (statusFilter === 'suspended') return u.status === 'suspended' || u.verification_status === 'SUSPENDED';
            if (statusFilter === 'active') return (u.status === 'active' || !u.status) && u.verification_status !== 'SUSPENDED';
            if (statusFilter === 'pending') return u.verification_status === 'PENDING' || !u.prc_license_no;
            return true;
          });
        }

        const total = mockUsers.length;
        const startIndex = (page - 1) * limit;
        const pagedUsers = mockUsers.slice(startIndex, startIndex + limit);

        res.status(200).json({
          success: true,
          data: {
            users: pagedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          },
          message: 'Admin users loaded (development mock).',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      let query = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'suspended') {
          query = query.eq('verification_status', 'SUSPENDED');
        } else if (statusFilter === 'active') {
          query = query.neq('verification_status', 'SUSPENDED');
        } else if (statusFilter === 'pending') {
          query = query.or('verification_status.eq.PENDING,prc_license_no.is.null');
        }
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(error.message);
      }

      const users = (data || []).map((u: any) => ({
        ...u,
        fullName: u.full_name || u.fullName || 'Unnamed',
        status: u.verification_status === 'SUSPENDED' ? 'suspended' : 'active',
      }));

      const total = count || 0;

      res.status(200).json({
        success: true,
        data: {
          users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
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

      // Self-Lockout Prevention Guard
      if (req.user && req.user.id === id) {
        res.status(403).json({
          success: false,
          error: 'Self-modification forbidden: Administrators cannot modify their own role to prevent accidental lockout.',
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

      invalidateAuthCache(id);

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
      const rawStatus = String(req.body.status || '').trim().toUpperCase();
      const status = rawStatus === 'ACTIVE' ? 'VERIFIED' : rawStatus;
      const { reason } = req.body;

      if (!status || !['VERIFIED', 'SUSPENDED', 'PENDING'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Status must be one of: VERIFIED, SUSPENDED, PENDING.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Mandatory justification check for account suspension
      if (status === 'SUSPENDED' && (!reason || typeof reason !== 'string' || reason.trim().length < 5)) {
        res.status(400).json({
          success: false,
          error: 'A valid documented justification (at least 5 characters) is required to suspend an account.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Self-Lockout Prevention Guard
      if (req.user && req.user.id === id) {
        res.status(403).json({
          success: false,
          error: 'Self-modification forbidden: Administrators cannot modify their own suspension status.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (status === 'SUSPENDED') {
        SessionService.disableUserAccount(id, 'account_disabled');
      } else if (status === 'VERIFIED') {
        SessionService.enableUserAccount(id);
      }
      invalidateAuthCache(id);

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
