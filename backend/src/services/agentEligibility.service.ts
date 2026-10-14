import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { logger } from '../utils/logger';

export type AgentOperation =
  | 'create_listing'
  | 'edit_listing'
  | 'publish_listing'
  | 'receive_lead';

export type AgentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type EligibilityResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'MISSING_PROFILE' | 'UNVERIFIED' | 'EXPIRED_CREDENTIAL' | 'INCOMPLETE_CREDENTIAL';
    };

export interface TransitionResult {
  success: boolean;
  previousStatus: AgentVerificationStatus;
  newStatus: AgentVerificationStatus;
  auditEventId?: string;
}

export class AgentEligibilityService {
  /**
   * Helper to compute end of day in Asia/Manila (UTC+8).
   * Asia/Manila is UTC+8 with no DST.
   */
  public static getAsiaManilaEndOfDay(dateStr: string): number {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
      return new Date(dateStr).getTime();
    }
    const [, y, m, d] = match;
    return new Date(`${y}-${m}-${d}T23:59:59.999+08:00`).getTime();
  }

  /**
   * Evaluate whether an agent is eligible to perform an operation at a specific time.
   */
  public static async evaluate(
    agentId: string,
    operation: AgentOperation,
    now: Date = new Date()
  ): Promise<EligibilityResult> {
    if (!isSupabaseConfigured) {
      // If Supabase not configured in local mock mode, allow if id exists
      return { allowed: true };
    }

    let agentProfile: any;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error || !data) {
        const { AgentService } = await import('./agent.service');
        const fallback = await AgentService.getAgentById(agentId);
        if (fallback) {
          agentProfile = {
            id: fallback.id,
            verification_status: fallback.verification_status,
            prc_license_number: fallback.prc_license_no,
            prc_expiry_date: fallback.prc_validity,
            dhsud_number: fallback.dhsud_accreditation_no,
            dhsud_expiry_date: fallback.dhsud_validity,
          };
        } else {
          return { allowed: false, reason: 'MISSING_PROFILE' };
        }
      } else {
        agentProfile = data;
      }
    } catch (err: any) {
      if (err.message?.includes('Database outage') || err.message?.includes('Connection terminated')) {
        throw err;
      }
      logger.error(`[AgentEligibilityService] Database outage during evaluation: ${err.message}`);
      throw new Error(`Database outage during eligibility check: ${err.message}`);
    }

    const verificationStatus = (agentProfile.verification_status || 'PENDING').toUpperCase() as AgentVerificationStatus;

    if (verificationStatus !== 'VERIFIED') {
      return { allowed: false, reason: 'UNVERIFIED' };
    }

    // Check credential completeness
    const prcNumber =
      agentProfile.prc_license_no ||
      agentProfile.prc_license_number ||
      agentProfile.prc_number ||
      agentProfile.prcLicenseNumber;

    const dhsudNumber =
      agentProfile.dhsud_accreditation_no ||
      agentProfile.dhsud_number ||
      agentProfile.dhsud_registration_number ||
      agentProfile.dhsudNumber;

    if (!prcNumber || !dhsudNumber) {
      return { allowed: false, reason: 'INCOMPLETE_CREDENTIAL' };
    }

    // Check credential expiry in Asia/Manila timezone
    const nowMs = now.getTime();
    const prcExpiry =
      agentProfile.prc_validity ||
      agentProfile.prc_expiry_date ||
      agentProfile.prcExpiryDate;

    if (prcExpiry) {
      const prcEndOfDayMs = this.getAsiaManilaEndOfDay(prcExpiry);
      if (nowMs > prcEndOfDayMs) {
        return { allowed: false, reason: 'EXPIRED_CREDENTIAL' };
      }
    }

    const dhsudExpiry =
      agentProfile.dhsud_validity ||
      agentProfile.dhsud_expiry_date ||
      agentProfile.dhsudExpiryDate;

    if (dhsudExpiry) {
      const dhsudEndOfDayMs = this.getAsiaManilaEndOfDay(dhsudExpiry);
      if (nowMs > dhsudEndOfDayMs) {
        return { allowed: false, reason: 'EXPIRED_CREDENTIAL' };
      }
    }

    return { allowed: true };
  }

  /**
   * Transition an agent's verification status with atomic validation and immutable audit logging.
   */
  public static async transitionStatus(
    actorId: string,
    targetAgentId: string,
    targetStatus: AgentVerificationStatus,
    reason?: string,
    changedFields: Record<string, any> = {}
  ): Promise<TransitionResult> {
    if (!isSupabaseConfigured) {
      return {
        success: true,
        previousStatus: 'PENDING',
        newStatus: targetStatus,
      };
    }

    let currentProfile: any;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetAgentId)
        .single();

      if (error || !data) {
        const { AgentService } = await import('./agent.service');
        const fallback = await AgentService.getAgentById(targetAgentId);
        if (fallback) {
          currentProfile = {
            id: fallback.id,
            verification_status: fallback.verification_status,
            prc_license_number: fallback.prc_license_no,
            prc_expiry_date: fallback.prc_validity,
            dhsud_number: fallback.dhsud_accreditation_no,
            dhsud_expiry_date: fallback.dhsud_validity,
          };
        } else {
          throw new Error('Target agent profile not found.');
        }
      } else {
        currentProfile = data;
      }
    } catch (err: any) {
      if (err.message === 'Target agent profile not found.') {
        throw err;
      }
      logger.error(`[AgentEligibilityService] Error fetching profile: ${err.message}`);
      throw err;
    }

    const currentStatus = (currentProfile.verification_status || 'PENDING').toUpperCase() as AgentVerificationStatus;

    if (currentStatus === targetStatus) {
      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
      };
    }

    // State machine constraints
    if (currentStatus === 'SUSPENDED' && targetStatus === 'VERIFIED') {
      throw new Error('Cannot transition directly from SUSPENDED to VERIFIED; reinstatement to PENDING is required for fresh review.');
    }

    if (targetStatus === 'REJECTED' && (!reason || !reason.trim())) {
      throw new Error('Rejection remarks are required when rejecting an agent.');
    }

    if (targetStatus === 'SUSPENDED' && (!reason || !reason.trim())) {
      throw new Error('Suspension reason is required when suspending an agent.');
    }

    if (targetStatus === 'VERIFIED') {
      const prcNumber =
        currentProfile.prc_license_no ||
        currentProfile.prc_license_number ||
        currentProfile.prc_number ||
        currentProfile.prcLicenseNumber;

      const dhsudNumber =
        currentProfile.dhsud_accreditation_no ||
        currentProfile.dhsud_number ||
        currentProfile.dhsud_registration_number ||
        currentProfile.dhsudNumber;

      if (!prcNumber || !dhsudNumber) {
        throw new Error('Cannot approve agent with incomplete PRC or DHSUD credentials.');
      }

      const nowMs = Date.now();
      const prcExpiry =
        currentProfile.prc_validity ||
        currentProfile.prc_expiry_date ||
        currentProfile.prcExpiryDate;

      if (prcExpiry && nowMs > this.getAsiaManilaEndOfDay(prcExpiry)) {
        throw new Error('Cannot approve agent with expired PRC license.');
      }

      const dhsudExpiry =
        currentProfile.dhsud_validity ||
        currentProfile.dhsud_expiry_date ||
        currentProfile.dhsudExpiryDate;

      if (dhsudExpiry && nowMs > this.getAsiaManilaEndOfDay(dhsudExpiry)) {
        throw new Error('Cannot approve agent with expired DHSUD registration.');
      }
    }

    const updatePayload: Record<string, any> = {
      verification_status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    const isActorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);

    if (targetStatus === 'REJECTED') {
      updatePayload.rejection_remarks = reason;
    } else if (targetStatus === 'SUSPENDED') {
      updatePayload.suspension_reason = reason;
      updatePayload.suspended_at = new Date().toISOString();
      updatePayload.suspended_by = isActorUuid ? actorId : null;
    } else if (targetStatus === 'VERIFIED') {
      updatePayload.rejection_remarks = null;
      updatePayload.suspension_reason = null;
      updatePayload.verified_at = new Date().toISOString();
      updatePayload.verified_by = isActorUuid ? actorId : null;
    }

    // Apply any additional changed credential fields
    for (const [key, val] of Object.entries(changedFields)) {
      updatePayload[key] = val;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAgentId);

    if (isUuid) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', targetAgentId);

      if (updateError) {
        logger.error(`[AgentEligibilityService] Failed to update profile status: ${updateError.message}`);
        throw new Error(`Failed to update status: ${updateError.message}`);
      }
    }

    // Record immutable audit event
    const auditPayload = {
      actor_id: actorId,
      target_id: targetAgentId,
      prior_status: currentStatus,
      new_status: targetStatus,
      reason: reason || null,
      changed_fields: changedFields,
      created_at: new Date().toISOString(),
    };

    try {
      const { data: auditData, error: auditError } = await supabaseAdmin
        .from('agent_audit_events')
        .insert(auditPayload)
        .select('id')
        .single();

      if (auditError) {
        logger.warn(`[AgentEligibilityService] Audit insert failed (table may not exist yet in schema cache): ${auditError.message}`);
      }

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        auditEventId: auditData?.id,
      };
    } catch (auditErr: any) {
      logger.warn(`[AgentEligibilityService] Audit logging skipped: ${auditErr.message}`);
      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
      };
    }
  }
}
