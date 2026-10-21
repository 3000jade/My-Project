import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { InvitationService } from './invitation.service';
import { AgentService } from './agent.service';
import { AgentCredentialsService } from './agentCredentials.service';
import logger from '../utils/logger';

export interface DocumentAttachment {
  name: string;
  id?: string;
  fileId?: string;
  kind?: string;
  viewUrl?: string;
  webViewLink?: string;
  mimeType?: string;
  size?: number;
}

export interface RegisterInvitedAgentPayload {
  token: string;
  password: string;
  fullName: string;
  phone: string;
  prcLicenseNo: string;
  prcValidity: string;
  dhsudAccreditationNo: string;
  dhsudValidity: string;
  documents?: DocumentAttachment[];
}

export class AgentRegistrationService {
  /**
   * Check whether a user (by email) is allowed to join a target brokerage.
   * Enforces the 1-active-brokerage-per-agent rule while allowing departed agents to join a new brokerage.
   */
  public static async canUserJoinBrokerage(
    email: string,
    targetBrokerageId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<{ allowed: boolean; reason?: 'ACTIVE_BROKERAGE_MEMBERSHIP_EXISTS'; existingAgentId?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check local in-memory store first (for unit tests and runtime cache)
    const localAgent = AgentService.getLocalAgentByEmail(cleanEmail);
    if (localAgent) {
      if (localAgent.membership_status === 'departed') {
        return { allowed: true, existingAgentId: localAgent.id };
      }
      return {
        allowed: false,
        reason: 'ACTIVE_BROKERAGE_MEMBERSHIP_EXISTS',
        existingAgentId: localAgent.id,
      };
    }

    // 2. Check Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, supporting_documents, verification_status')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile) {
          const docs = Array.isArray(profile.supporting_documents) ? profile.supporting_documents : [];
          const v2Meta = docs.find((d: any) => d && d._meta_type === 'agent_v2_metadata');
          if (v2Meta?.membership_status === 'departed') {
            return { allowed: true, existingAgentId: profile.id };
          }
          return {
            allowed: false,
            reason: 'ACTIVE_BROKERAGE_MEMBERSHIP_EXISTS',
            existingAgentId: profile.id,
          };
        }
      } catch {
        // Fallback
      }
    }

    return { allowed: true };
  }

  /**
   * Check if an account already exists with this email address and has an active brokerage membership
   */
  public static async checkExistingUser(email: string): Promise<boolean> {
    const check = await this.canUserJoinBrokerage(email);
    if (!check.allowed) {
      return true;
    }

    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, supporting_documents')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (profile) {
          const docs = Array.isArray(profile.supporting_documents) ? profile.supporting_documents : [];
          const v2Meta = docs.find((d: any) => d && d._meta_type === 'agent_v2_metadata');
          if (v2Meta?.membership_status === 'departed') {
            return false;
          }
          return true;
        }

        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const matched = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (matched) return true;
      } catch {
        // Fallback
      }
    }
    return false;
  }

  public static async registerInvitedAgent(payload: RegisterInvitedAgentPayload) {
    const {
      token,
      password,
      fullName,
      phone,
      prcLicenseNo,
      prcValidity,
      dhsudAccreditationNo,
      dhsudValidity,
      documents = [],
    } = payload;

    // 1. Validate invitation token
    const validation = await InvitationService.validateToken(token);
    if (!validation.valid || !validation.email) {
      throw new Error(`Invitation token is invalid, expired, or already utilized.`);
    }

    const email = validation.email.trim().toLowerCase();

    // 2. Reject existing accounts with active brokerage membership with 409 Conflict
    const alreadyExists = await this.checkExistingUser(email);
    if (alreadyExists) {
      throw new Error(`An account already exists with this email address (409 Conflict).`);
    }

    // 3. Perform atomic invitation claim (prevents simultaneous registration race conditions)
    const attemptId = crypto.randomUUID();
    const claim = await InvitationService.claimInvitation(token, attemptId);
    if (!claim.claimed) {
      throw new Error(`Invitation registration is already claimed or in progress (409 Conflict).`);
    }

    const targetBrokerageId =
      claim.invitation?.brokerage_id ||
      validation.brokerage_id ||
      '00000000-0000-0000-0000-000000000001';
    const targetTeamId = claim.invitation?.team_id ?? validation.team_id ?? null;
    const canCreateListings = Boolean(
      claim.invitation?.can_create_listings ?? validation.can_create_listings ?? false
    );

    let userId = `agent-registered-${Date.now()}`;

    // 4. Provision Auth User in Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: 'agent',
          },
        });

        if (authUser?.user) {
          userId = authUser.user.id;
        } else if (authErr) {
          throw new Error(`Supabase createUser error: ${authErr.message}`);
        }
      } catch (err: any) {
        logger.error('[AgentRegistrationService] Supabase auth provisioning exception:', err.message);
        throw err;
      }
    }

    // Link uploaded credential documents to the new user and sanitize attachments
    await AgentCredentialsService.linkInvitationDocumentsToAgent(token, userId);

    const sanitizedDocs = await Promise.all(
      documents.map(async (doc) => {
        const docId = doc.id || doc.fileId;
        if (docId) {
          const meta = await AgentCredentialsService.getDocumentMetadata(docId);
          if (meta) {
            return {
              id: meta.id,
              name: meta.file_name,
              kind: meta.kind,
              mimeType: meta.mime_type,
              size: meta.size_bytes,
              viewUrl: `/api/agent-credentials/${meta.id}/content`,
            };
          }
        }
        return {
          id: doc.id || doc.fileId,
          name: doc.name,
          viewUrl: doc.id ? `/api/agent-credentials/${doc.id}/content` : undefined,
        };
      })
    );

    const v2MetaEnvelope = {
      _meta_type: 'agent_v2_metadata',
      membership_status: 'active',
      onboarding_status: 'pending_review',
      routing_availability: 'paused',
      brokerage_id: targetBrokerageId,
      team_id: targetTeamId,
      can_create_listings: canCreateListings,
      access_tier: canCreateListings ? 'senior_agent' : 'standard_agent',
    };

    // 5. Upsert Profile with PENDING status and credential attachments
    const profileRecord = {
      id: userId,
      email,
      full_name: fullName,
      phone,
      role: 'agent',
      prc_license_no: prcLicenseNo,
      prc_validity: prcValidity,
      dhsud_accreditation_no: dhsudAccreditationNo,
      dhsud_validity: dhsudValidity,
      verification_status: 'PENDING',
      supporting_documents: [...sanitizedDocs, v2MetaEnvelope],
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(profileRecord);

        if (profileError) {
          logger.warn(`[AgentRegistrationService] Profile upsert warning: ${profileError.message}`);
        }
      } catch (err: any) {
        logger.warn('[AgentRegistrationService] Profile upsert exception:', err.message);
      }
    }

    // Also register agent into AgentService local cache if needed
    try {
      AgentService.addAgent({
        id: userId,
        name: fullName,
        email,
        phone,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        prc_license_no: prcLicenseNo,
        prc_validity: prcValidity,
        dhsud_accreditation_no: dhsudAccreditationNo,
        dhsud_validity: dhsudValidity,
        verification_status: 'PENDING',
        membership_status: 'active',
        onboarding_status: 'pending_review',
        routing_availability: 'paused',
        brokerage_id: targetBrokerageId,
        team_id: targetTeamId,
        can_create_listings: canCreateListings,
        supporting_documents: sanitizedDocs,
        experience_years: 1,
        bio: 'Newly registered consultant pending supervisory broker credential verification.',
        assigned_properties_count: 0,
        active_inquiries_count: 0,
        upcoming_appointments_count: 0,
        recorded_sales_count: 0,
        total_sales_value: 0,
      });
    } catch {
      // Ignored
    }

    // 6. Mark invitation as permanently finalized/used
    await InvitationService.finalizeInvitation(attemptId, token);

    return {
      success: true,
      message: 'Consultant registration successfully submitted. Account is pending principal broker verification.',
      user: {
        id: userId,
        email,
        fullName,
        role: 'agent',
      },
      profile: {
        ...profileRecord,
        supporting_documents: sanitizedDocs,
      },
    };
  }

  public static registerAgent = AgentRegistrationService.registerInvitedAgent;
}

export default AgentRegistrationService;
