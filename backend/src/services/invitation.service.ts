import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { config } from '../config';
import { GmailService } from './gmail.service';
import logger from '../utils/logger';

export interface AgentInvitation {
  id: string;
  email: string;
  token?: string;
  token_digest?: string;
  registration_attempt_id?: string;
  claim_expires_at?: string;
  delivery_status?: string;
  status: 'pending' | 'used' | 'revoked' | 'expired';
  expires_at: string;
  invited_by?: string;
  brokerage_id?: string;
  team_id?: string | null;
  can_create_listings?: boolean;
  full_name?: string;
  phone?: string;
  role?: string;
  broker_agency?: string;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationPayload {
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  brokerAgency?: string;
  brokerageId?: string;
  teamId?: string | null;
  canCreateListings?: boolean;
  message?: string;
  allowReissue?: boolean;
}

export interface ValidateTokenResult {
  valid: boolean;
  email?: string;
  id?: string;
  role?: string;
  brokerage_id?: string;
  team_id?: string | null;
  can_create_listings?: boolean;
  reason?: 'EXPIRED' | 'USED' | 'REVOKED' | 'NOT_FOUND';
}

const localInvitationsState: AgentInvitation[] = [];

export class InvitationService {
  /**
   * Reset store (primarily for unit and integration testing)
   */
  public static resetStore(): void {
    localInvitationsState.length = 0;
  }

  /**
   * Helper to derive full invitation URL
   */
  public static getInviteUrl(token: string): string {
    const origin = Array.isArray(config.clientOrigin) ? config.clientOrigin[0] : config.clientOrigin;
    return `${origin}/register/agent?token=${token}`;
  }

  /**
   * Create a new agent invitation
   */
  public static async createInvitation(
    payload: string | CreateInvitationPayload,
    invitedBy?: string
  ): Promise<AgentInvitation> {
    const email = typeof payload === 'string' ? payload : payload.email;
    const fullName = typeof payload === 'object' ? payload.fullName : undefined;
    const phone = typeof payload === 'object' ? payload.phone : undefined;
    const role = typeof payload === 'object' ? payload.role || 'agent' : 'agent';
    const brokerAgency = typeof payload === 'object' ? payload.brokerAgency : undefined;
    const brokerageId =
      typeof payload === 'object' && payload.brokerageId
        ? payload.brokerageId
        : '00000000-0000-0000-0000-000000000001';
    const teamId = typeof payload === 'object' ? payload.teamId ?? null : null;
    const canCreateListings = typeof payload === 'object' ? Boolean(payload.canCreateListings) : false;
    const message = typeof payload === 'object' ? payload.message : undefined;
    const allowReissue = typeof payload === 'object' ? Boolean(payload.allowReissue) : false;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if an active unexpired invitation already exists
    const existing = await this.findActiveByEmail(normalizedEmail);
    if (existing) {
      if (allowReissue) {
        // Automatically revoke previous pending invitation before creating fresh one
        try {
          await this.revokeInvitation(existing.id);
        } catch {
          existing.status = 'revoked';
        }
      } else {
        throw new Error(`An active invitation already exists for this email address.`);
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

    // Only pass strictly valid UUIDs to Postgres to avoid "invalid input syntax for type uuid"
    const isValidUuid = typeof invitedBy === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitedBy);
    const safeInvitedBy = isValidUuid ? invitedBy : null;

    const newInvitation: AgentInvitation = {
      id: `inv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      email: normalizedEmail,
      token,
      token_digest: tokenDigest,
      delivery_status: 'sent',
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      invited_by: safeInvitedBy || undefined,
      brokerage_id: brokerageId,
      team_id: teamId,
      can_create_listings: canCreateListings,
      full_name: fullName,
      phone,
      role,
      broker_agency: brokerAgency,
      message,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        let { data, error } = await supabaseAdmin
          .from('agent_invitations')
          .insert({
            email: normalizedEmail,
            token,
            token_digest: tokenDigest,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
            invited_by: safeInvitedBy,
            full_name: fullName || null,
            phone: phone || null,
            role,
            broker_agency: brokerAgency || null,
            message: message || null,
          })
          .select()
          .single();

        if (error && error.message?.includes('token_digest')) {
          const fallbackRes = await supabaseAdmin
            .from('agent_invitations')
            .insert({
              email: normalizedEmail,
              token,
              status: 'pending',
              expires_at: expiresAt.toISOString(),
              invited_by: safeInvitedBy,
              full_name: fullName || null,
              phone: phone || null,
              role,
              broker_agency: brokerAgency || null,
              message: message || null,
            })
            .select()
            .single();
          data = fallbackRes.data;
          error = fallbackRes.error;
        }

        if (data && !error) {
          newInvitation.id = data.id;
        } else if (error) {
          logger.error('[InvitationService] Supabase insert failed:', error.message);
          throw new Error(`Database error creating invitation: ${error.message}`);
        }
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[InvitationService] Supabase insert exception:', err.message);
        }
        throw err;
      }
    } else {
      localInvitationsState.push(newInvitation);
    }

    // Dispatch invitation email via GmailService
    const inviteUrl = this.getInviteUrl(token);
    try {
      await GmailService.sendAgentInvitationEmail({
        to: normalizedEmail,
        inviteUrl,
        expiresInHours: 72,
      });
    } catch (err: any) {
      logger.warn('[InvitationService] Failed to send email via GmailService:', err.message);
    }

    return newInvitation;
  }

  /**
   * List all agent invitations with optional status filtering
   */
  public static async listInvitations(statusFilter?: string): Promise<AgentInvitation[]> {
    let list: AgentInvitation[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('agent_invitations')
          .select('id, email, status, expires_at, invited_by, full_name, phone, role, broker_agency, message, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('[InvitationService] Supabase listInvitations error:', error.message);
          throw new Error(`Database error retrieving invitations: ${error.message}`);
        }

        if (data) {
          list = data.map((inv: any) => {
            let status = inv.status;
            if (status === 'pending' && new Date(inv.expires_at).getTime() < Date.now()) {
              status = 'expired';
            }
            const { token, token_digest, registration_attempt_id, ...safeInv } = inv;
            return { ...safeInv, status } as AgentInvitation;
          });
        }
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[InvitationService] Supabase listInvitations exception:', err.message);
        }
        throw err;
      }
    } else {
      list = localInvitationsState.map((localInv) => {
        let status = localInv.status;
        if (status === 'pending' && new Date(localInv.expires_at).getTime() < Date.now()) {
          status = 'expired';
        }
        const { token, token_digest, registration_attempt_id, ...safeInv } = localInv;
        return { ...safeInv, status } as AgentInvitation;
      });
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      const target = statusFilter.toLowerCase();
      list = list.filter((i) => i.status.toLowerCase() === target);
    }

    return list;
  }

  /**
   * Validate invitation token
   */
  public static async validateToken(token: string): Promise<ValidateTokenResult> {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
    let inv: AgentInvitation | undefined = localInvitationsState.find(
      (i) => i.token === token || i.token_digest === tokenDigest
    );

    if (isSupabaseConfigured) {
      try {
        let { data, error } = await supabaseAdmin
          .from('agent_invitations')
          .select('*')
          .or(`token.eq.${token},token_digest.eq.${tokenDigest}`)
          .maybeSingle();

        if (error && (error.message?.includes('token_digest') || error.code === '42703')) {
          const fallback = await supabaseAdmin
            .from('agent_invitations')
            .select('*')
            .eq('token', token)
            .maybeSingle();
          data = fallback.data;
          error = fallback.error;
        }

        if (data && !error) {
          inv = data;
        }
      } catch (err: any) {
        logger.warn('[InvitationService] Supabase validateToken error:', err.message);
      }
    }

    if (!inv) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    if (inv.status === 'used') {
      return { valid: false, reason: 'USED', email: inv.email, role: inv.role };
    }

    if (inv.status === 'revoked') {
      return { valid: false, reason: 'REVOKED', email: inv.email, role: inv.role };
    }

    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return { valid: false, reason: 'EXPIRED', email: inv.email, role: inv.role };
    }

    return { valid: true, email: inv.email, id: inv.id, role: inv.role };
  }

  /**
   * Resend / refresh an invitation (rotates raw token and digest)
   */
  public static async resendInvitation(id: string): Promise<AgentInvitation> {
    let inv: AgentInvitation | null = null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('agent_invitations')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          logger.error('[InvitationService] Supabase find invitation error:', error.message);
          throw new Error(`Database error finding invitation: ${error.message}`);
        }
        inv = data;
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[InvitationService] Supabase find invitation exception:', err.message);
        }
        throw err;
      }
    } else {
      inv = localInvitationsState.find((i) => i.id === id) || null;
    }

    if (!inv) {
      throw new Error(`Invitation "${id}" not found.`);
    }

    if (inv.status === 'used' || inv.status === 'revoked') {
      throw new Error(`Cannot resend a used or revoked invitation: 409 Conflict.`);
    }

    const now = new Date();
    if (inv.registration_attempt_id && inv.claim_expires_at && new Date(inv.claim_expires_at).getTime() > now.getTime()) {
      throw new Error(`Registration attempt currently in progress for this invitation: 409 Conflict.`);
    }

    // Rotate raw token and digest to invalidate the previous link
    const newToken = crypto.randomBytes(32).toString('hex');
    const newDigest = crypto.createHash('sha256').update(newToken).digest('hex');

    inv.token = newToken;
    inv.token_digest = newDigest;
    inv.registration_attempt_id = undefined;
    inv.claim_expires_at = undefined;
    inv.expires_at = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    inv.status = 'pending';
    inv.updated_at = now.toISOString();

    if (isSupabaseConfigured) {
      try {
        let { error } = await supabaseAdmin
          .from('agent_invitations')
          .update({
            token: newToken,
            token_digest: newDigest,
            registration_attempt_id: null,
            claim_expires_at: null,
            expires_at: inv.expires_at,
            status: 'pending',
            updated_at: inv.updated_at,
          })
          .eq('id', id);

        // Fallback for database instances where invitation_atomic_claim_migration.sql has not been run
        if (
          error &&
          (error.message?.includes('claim_expires_at') ||
            error.message?.includes('registration_attempt_id') ||
            error.message?.includes('token_digest'))
        ) {
          // Attempt with token_digest first
          let fallbackRes = await supabaseAdmin
            .from('agent_invitations')
            .update({
              token: newToken,
              token_digest: newDigest,
              expires_at: inv.expires_at,
              status: 'pending',
              updated_at: inv.updated_at,
            })
            .eq('id', id);

          // If token_digest also doesn't exist in the remote schema cache, fall back to core columns
          if (fallbackRes.error && fallbackRes.error.message?.includes('token_digest')) {
            fallbackRes = await supabaseAdmin
              .from('agent_invitations')
              .update({
                token: newToken,
                expires_at: inv.expires_at,
                status: 'pending',
                updated_at: inv.updated_at,
              })
              .eq('id', id);
          }

          error = fallbackRes.error;
        }

        if (error) {
          logger.error('[InvitationService] Supabase resendInvitation error:', error.message);
          throw new Error(`Database error updating invitation: ${error.message}`);
        }
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[InvitationService] Supabase resendInvitation exception:', err.message);
        }
        throw err;
      }
    } else {
      const localIdx = localInvitationsState.findIndex((i) => i.id === id);
      if (localIdx >= 0) {
        localInvitationsState[localIdx] = inv;
      } else {
        localInvitationsState.push(inv);
      }
    }

    const inviteUrl = this.getInviteUrl(inv.token);
    await GmailService.sendAgentInvitationEmail({
      to: inv.email,
      inviteUrl,
      expiresInHours: 72,
      isResend: true,
    });

    return inv;
  }

  /**
   * Atomic claim function for concurrent registration serialization
   */
  public static async claimInvitation(
    token: string,
    attemptId: string
  ): Promise<{ claimed: boolean; invitation: AgentInvitation }> {
    const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    if (isSupabaseConfigured) {
      try {
        // Attempt database RPC claim first
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('claim_agent_invitation', {
          p_token_digest: tokenDigest,
          p_attempt_id: attemptId,
        });

        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          return { claimed: true, invitation: rpcData[0] as AgentInvitation };
        }

        // Direct atomic update query
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('agent_invitations')
          .update({
            registration_attempt_id: attemptId,
            claim_expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
            updated_at: now.toISOString(),
          })
          .or(`token.eq.${token},token_digest.eq.${tokenDigest}`)
          .eq('status', 'pending')
          .gt('expires_at', now.toISOString())
          .is('registration_attempt_id', null)
          .select()
          .maybeSingle();

        if (updated && !updateErr) {
          return { claimed: true, invitation: updated as AgentInvitation };
        }

        if (
          updateErr &&
          (updateErr.message?.includes('claim_expires_at') ||
            updateErr.message?.includes('registration_attempt_id') ||
            updateErr.message?.includes('token_digest') ||
            updateErr.code === '42703')
        ) {
          const { data: fallbackUpdated, error: fallbackErr } = await supabaseAdmin
            .from('agent_invitations')
            .update({
              updated_at: now.toISOString(),
            })
            .eq('token', token)
            .eq('status', 'pending')
            .gt('expires_at', now.toISOString())
            .select()
            .maybeSingle();

          if (fallbackUpdated && !fallbackErr) {
            return { claimed: true, invitation: fallbackUpdated as AgentInvitation };
          }
        }
      } catch (err: any) {
        logger.warn('[InvitationService] Supabase atomic claim warning:', err.message);
      }
    }

    // Local / In-memory atomic claim logic
    const inv = localInvitationsState.find(
      (i) => i.token === token || i.token_digest === tokenDigest
    );

    if (!inv) {
      throw new Error('Invitation token is invalid, expired, or already utilized.');
    }

    if (inv.status !== 'pending') {
      throw new Error(`Invitation is already utilized or closed (status: ${inv.status}).`);
    }

    if (new Date(inv.expires_at).getTime() < now.getTime()) {
      throw new Error('Invitation token has expired.');
    }

    const hasActiveClaim =
      inv.registration_attempt_id &&
      inv.claim_expires_at &&
      new Date(inv.claim_expires_at).getTime() > now.getTime() &&
      inv.registration_attempt_id !== attemptId;

    if (hasActiveClaim) {
      throw new Error('Registration is already claimed or in progress for this invitation (409 Conflict).');
    }

    inv.registration_attempt_id = attemptId;
    inv.claim_expires_at = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    inv.updated_at = now.toISOString();

    return { claimed: true, invitation: inv };
  }

  /**
   * Finalize invitation state as used
   */
  public static async finalizeInvitation(attemptId: string, token: string): Promise<void> {
    const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date().toISOString();

    const inv = localInvitationsState.find(
      (i) => (i.token === token || i.token_digest === tokenDigest)
    );
    if (inv) {
      inv.status = 'used';
      inv.registration_attempt_id = attemptId;
      inv.updated_at = now;
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('agent_invitations')
          .update({
            status: 'used',
            updated_at: now,
          })
          .eq('registration_attempt_id', attemptId);

        if (error && (error.message?.includes('registration_attempt_id') || error.code === '42703')) {
          await supabaseAdmin
            .from('agent_invitations')
            .update({
              status: 'used',
              updated_at: now,
            })
            .eq('token', token);
        }
      } catch (err: any) {
        logger.warn('[InvitationService] Supabase finalizeInvitation error:', err.message);
      }
    }
  }

  /**
   * Revoke an invitation
   */
  public static async revokeInvitation(id: string): Promise<AgentInvitation> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('agent_invitations')
          .update({
            status: 'revoked',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          logger.error('[InvitationService] Supabase revokeInvitation error:', error.message);
          throw new Error(`Database error revoking invitation: ${error.message}`);
        }
        if (!data) {
          throw new Error(`Invitation "${id}" not found.`);
        }
        return data;
      } catch (err: any) {
        if (!err.message?.includes('Database error') && !err.message?.includes('not found')) {
          logger.error('[InvitationService] Supabase revokeInvitation exception:', err.message);
        }
        throw err;
      }
    }

    const inv = localInvitationsState.find((i) => i.id === id);
    if (inv) {
      inv.status = 'revoked';
      inv.updated_at = new Date().toISOString();
      return inv;
    }

    throw new Error(`Invitation "${id}" not found.`);
  }

  /**
   * Mark token as used after successful agent registration
   */
  public static async markTokenUsed(token: string): Promise<void> {
    const inv = localInvitationsState.find((i) => i.token === token);
    if (inv) {
      inv.status = 'used';
      inv.updated_at = new Date().toISOString();
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('agent_invitations')
          .update({
            status: 'used',
            updated_at: new Date().toISOString(),
          })
          .eq('token', token);
      } catch (err: any) {
        logger.warn('[InvitationService] Supabase markTokenUsed error:', err.message);
      }
    }
  }

  /**
   * Private check for active invitation
   */
  private static async findActiveByEmail(email: string): Promise<AgentInvitation | null> {
    const now = Date.now();
    const activeLocal = localInvitationsState.find(
      (i) => i.email === email && i.status === 'pending' && new Date(i.expires_at).getTime() > now
    );
    if (activeLocal) return activeLocal;

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabaseAdmin
          .from('agent_invitations')
          .select('*')
          .eq('email', email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (data) return data;
      } catch {
        // Fallback to local
      }
    }

    return null;
  }
}

export default InvitationService;
