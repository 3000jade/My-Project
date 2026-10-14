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
   * Check if an account already exists with this email address
   */
  public static async checkExistingUser(email: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        if (profile) return true;

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
    const { token, password, fullName, phone, prcLicenseNo, prcValidity, dhsudAccreditationNo, dhsudValidity, documents = [] } = payload;

    // 1. Validate invitation token
    const validation = await InvitationService.validateToken(token);
    if (!validation.valid || !validation.email) {
      throw new Error(`Invitation token is invalid, expired, or already utilized.`);
    }

    const email = validation.email.trim().toLowerCase();

    // 2. Reject existing accounts with 409 Conflict
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
      supporting_documents: sanitizedDocs,
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
      profile: profileRecord,
    };
  }

  public static registerAgent = AgentRegistrationService.registerInvitedAgent;
}

export default AgentRegistrationService;
