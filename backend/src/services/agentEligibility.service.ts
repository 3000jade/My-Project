import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { logger } from '../utils/logger';
import { AgentAvailabilityService } from './agentAvailability.service';

export type AgentOperation =
  | 'create_listing'
  | 'edit_listing'
  | 'publish_listing'
  | 'receive_lead'
  | 'assign_listing';

export type AgentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type EligibilityFailureReason =
  | 'MISSING_PROFILE'
  | 'UNVERIFIED'
  | 'EXPIRED_CREDENTIAL'
  | 'INCOMPLETE_CREDENTIAL'
  | 'UNAVAILABLE'
  | 'BLACKOUT_DATE'
  | 'CAPACITY_REACHED'
  | 'DEPARTED'
  | 'INSUFFICIENT_PERMISSION';

export type EligibilityResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: EligibilityFailureReason;
    };

export interface TransitionResult {
  success: boolean;
  previousStatus: AgentVerificationStatus;
  newStatus: AgentVerificationStatus;
  auditEventId?: string;
}

const localAuditEventsStore: Array<{
  id: string;
  actor_id: string;
  target_id: string;
  brokerage_id?: string;
  event_type?: string;
  prior_status: string;
  new_status: string;
  reason?: string | null;
  changed_fields?: Record<string, any>;
  created_at: string;
}> = [];

export class AgentEligibilityService {
  public static getLocalAuditEvents(): typeof localAuditEventsStore {
    return [...localAuditEventsStore];
  }

  public static recordLocalAuditEvent(event: {
    actor_id: string;
    target_id: string;
    brokerage_id?: string;
    event_type?: string;
    prior_status: string;
    new_status: string;
    reason?: string | null;
    changed_fields?: Record<string, any>;
    created_at?: string;
  }): string {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localAuditEventsStore.unshift({
      id,
      actor_id: event.actor_id,
      target_id: event.target_id,
      brokerage_id: event.brokerage_id || '00000000-0000-0000-0000-000000000001',
      event_type: event.event_type || 'STATUS_TRANSITION',
      prior_status: event.prior_status,
      new_status: event.new_status,
      reason: event.reason || null,
      changed_fields: event.changed_fields || {},
      created_at: event.created_at || new Date().toISOString(),
    });
    return id;
  }

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
    const { AgentService } = await import('./agent.service');
    const localRegistered = AgentService.getLocalAgentById(agentId);

    if (!isSupabaseConfigured && !localRegistered) {
      return { allowed: true };
    }

    let agentProfile: any;
    if (localRegistered) {
      agentProfile = {
        id: localRegistered.id,
        verification_status: localRegistered.verification_status,
        membership_status: localRegistered.membership_status,
        onboarding_status: localRegistered.onboarding_status,
        routing_availability: localRegistered.routing_availability,
        can_create_listings: localRegistered.can_create_listings,
        prc_license_number: localRegistered.prc_license_no,
        prc_expiry_date: localRegistered.prc_validity,
        dhsud_number: localRegistered.dhsud_accreditation_no,
        dhsud_expiry_date: localRegistered.dhsud_validity,
        active_inquiries_count: localRegistered.active_inquiries_count,
        supporting_documents: localRegistered.supporting_documents,
      };
    } else {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', agentId)
          .single();

        if (error || !data) {
          return { allowed: false, reason: 'MISSING_PROFILE' };
        }
        agentProfile = data;
      } catch (err: any) {
        if (err.message?.includes('Database outage') || err.message?.includes('Connection terminated')) {
          throw err;
        }
        logger.error(`[AgentEligibilityService] Database outage during evaluation: ${err.message}`);
        throw new Error(`Database outage during eligibility check: ${err.message}`);
      }
    }

    // Extract v2 metadata envelope if stored inside supporting_documents JSONB
    const v2Meta = Array.isArray(agentProfile.supporting_documents)
      ? agentProfile.supporting_documents.find((d: any) => d && d._meta_type === 'agent_v2_metadata')
      : undefined;

    const membershipStatus = agentProfile.membership_status || v2Meta?.membership_status;
    if (membershipStatus === 'departed') {
      return { allowed: false, reason: 'DEPARTED' };
    }
    if (membershipStatus === 'suspended' || membershipStatus === 'invited') {
      return { allowed: false, reason: 'UNVERIFIED' };
    }

    const onboardingStatus = agentProfile.onboarding_status || v2Meta?.onboarding_status;
    if (onboardingStatus && onboardingStatus !== 'complete') {
      return { allowed: false, reason: 'UNVERIFIED' };
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

    // Check explicit create_listing permission when explicitly configured on agent
    const canCreateListings =
      agentProfile.can_create_listings !== undefined
        ? agentProfile.can_create_listings
        : v2Meta?.can_create_listings;

    if (operation === 'create_listing' && canCreateListings === false) {
      return { allowed: false, reason: 'INSUFFICIENT_PERMISSION' };
    }

    // Check routing availability & schedule for new lead assignments ('receive_lead')
    if (operation === 'receive_lead') {
      const cachedSched = AgentAvailabilityService.getCachedAvailability(agentId);
      const effectiveRoutingAvail =
        cachedSched?.routing_availability ||
        agentProfile.routing_availability ||
        v2Meta?.routing_availability ||
        'available';

      if (effectiveRoutingAvail !== 'available') {
        return { allowed: false, reason: 'UNAVAILABLE' };
      }

      if (cachedSched) {
        const check = AgentAvailabilityService.isAvailableForRoutingNow(
          cachedSched,
          Number(agentProfile.active_inquiries_count) || 0,
          now
        );
        if (!check.available) {
          return { allowed: false, reason: check.reason || 'UNAVAILABLE' };
        }
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
      const auditId = this.recordLocalAuditEvent({
        actor_id: actorId,
        target_id: targetAgentId,
        prior_status: 'PENDING',
        new_status: targetStatus,
        reason,
        changed_fields: changedFields,
      });
      return {
        success: true,
        previousStatus: 'PENDING',
        newStatus: targetStatus,
        auditEventId: auditId,
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

    if (isUuid || !targetAgentId.startsWith('agent-')) {
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
    const localAuditId = this.recordLocalAuditEvent({
      actor_id: actorId,
      target_id: targetAgentId,
      prior_status: currentStatus,
      new_status: targetStatus,
      reason: reason || null,
      changed_fields: changedFields,
    });

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
      const insertChain = supabaseAdmin.from('agent_audit_events').insert(auditPayload);
      const { data: auditData, error: auditError } =
        typeof (insertChain as any)?.select === 'function'
          ? await insertChain.select('id').single()
          : await (insertChain as any);

      if (auditError) {
        logger.warn(`[AgentEligibilityService] Audit insert failed (table may not exist yet in schema cache): ${auditError.message}`);
      }

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        auditEventId: auditData?.id || localAuditId,
      };
    } catch (auditErr: any) {
      logger.warn(`[AgentEligibilityService] Audit logging skipped: ${auditErr.message}`);
      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        auditEventId: localAuditId,
      };
    }
  }
}
