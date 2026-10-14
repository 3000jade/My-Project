import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AgentEligibilityService, AgentVerificationStatus } from './agentEligibility.service';

export interface AgentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  prc_license_no: string;
  prc_validity: string;
  dhsud_accreditation_no: string;
  dhsud_validity: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  rejection_remarks?: string;
  suspension_reason?: string;
  suspension_notes?: string;
  suspended_by?: string;
  suspended_at?: string;
  verified_by?: string;
  verified_at?: string;
  supporting_documents?: any[];
  experience_years: number;
  bio: string;
  assigned_properties_count: number;
  active_inquiries_count: number;
  upcoming_appointments_count: number;
  recorded_sales_count: number;
  total_sales_value: number;
}

export interface AgentFilterQuery {
  status?: string;
  search?: string;
}

const localAgentsState: AgentItem[] = [];

export class AgentService {
  /**
   * Helper to format a profile record into an AgentItem
   */
  private static formatAgentProfile(p: any): AgentItem {
    return {
      id: p.id,
      name: p.full_name || 'Licensed Consultant',
      email: p.email,
      phone: p.phone || '',
      avatar: p.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      prc_license_no: p.prc_license_no || 'N/A',
      prc_validity: p.prc_validity || '',
      dhsud_accreditation_no: p.dhsud_accreditation_no || 'N/A',
      dhsud_validity: p.dhsud_validity || '',
      verification_status: p.verification_status || 'PENDING',
      rejection_remarks: p.rejection_remarks,
      suspension_reason: p.suspension_reason,
      suspension_notes: p.suspension_notes,
      suspended_by: p.suspended_by,
      suspended_at: p.suspended_at,
      verified_by: p.verified_by,
      verified_at: p.verified_at,
      supporting_documents: p.supporting_documents || [],
      experience_years: p.experience_years || 0,
      bio: p.bio || '',
      assigned_properties_count: 0,
      active_inquiries_count: 0,
      upcoming_appointments_count: 0,
      recorded_sales_count: 0,
      total_sales_value: 0,
    };
  }

  /**
   * Reset local agents store (primarily for unit test isolation)
   */
  public static resetStore(): void {
    localAgentsState.length = 0;
  }

  /**
   * List agents with filtering
   */
  public static async listAgents(query?: AgentFilterQuery): Promise<AgentItem[]> {
    let list: AgentItem[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('role', 'agent')
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('[AgentService] Supabase profile fetch failed:', error.message);
          throw new Error(`Database error retrieving agent directory: ${error.message}`);
        }

        list = (data || []).map((p: any) => this.formatAgentProfile(p));
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[AgentService] Supabase profile fetch exception:', err.message);
        }
        throw err;
      }
    } else {
      // In-memory fallback ONLY when Supabase is not configured (offline / unit testing)
      list = [...localAgentsState];
    }

    let results = list;

    if (query?.status && query.status !== 'ALL') {
      results = results.filter(
        (a) => a.verification_status.toUpperCase() === query.status?.toUpperCase()
      );
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.prc_license_no.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Get single agent by ID
   */
  public static async getAgentById(id: string): Promise<AgentItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('role', 'agent')
          .single();

        if (error) {
          if (
            error.code === 'PGRST116' ||
            error.message?.includes('Row not found') ||
            error.message?.includes('0 rows') ||
            error.message?.includes('JSON object requested, multiple (or no) rows returned')
          ) {
            return null;
          }
          logger.error(`[AgentService] Supabase profile ${id} lookup failed:`, error.message);
          throw new Error(`Database error retrieving agent: ${error.message}`);
        }

        return data ? this.formatAgentProfile(data) : null;
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error(`[AgentService] Supabase profile ${id} lookup exception:`, err.message);
        }
        throw err;
      }
    }

    return localAgentsState.find((a) => a.id === id) || null;
  }

  /**
   * Register or update an agent in local cache
   */
  public static addAgent(item: AgentItem): void {
    const idx = localAgentsState.findIndex((a) => a.id === item.id || a.email === item.email);
    if (idx >= 0) {
      localAgentsState[idx] = item;
    } else {
      localAgentsState.push(item);
    }
  }

  /**
   * Update agent verification or suspension status with audit trail
   */
  public static async updateAgentStatus(
    id: string,
    status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED',
    details?: string | {
      rejection_remarks?: string;
      suspension_reason?: string;
      suspension_notes?: string;
    },
    actorId?: string
  ): Promise<AgentItem | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    const rejectionRemarks = typeof details === 'string' ? details : details?.rejection_remarks;
    const suspensionReason = typeof details === 'object' ? details?.suspension_reason : undefined;
    const suspensionNotes = typeof details === 'object' ? details?.suspension_notes : undefined;
    const reason = status === 'REJECTED' ? rejectionRemarks : status === 'SUSPENDED' ? suspensionReason : undefined;

    if (isSupabaseConfigured) {
      await AgentEligibilityService.transitionStatus(
        actorId || 'system',
        id,
        status as AgentVerificationStatus,
        reason,
        suspensionNotes ? { suspension_notes: suspensionNotes } : {}
      );
    }

    agent.verification_status = status;
    const nowIso = new Date().toISOString();

    if (status === 'VERIFIED') {
      agent.rejection_remarks = undefined;
      agent.suspension_reason = undefined;
      agent.suspension_notes = undefined;
      agent.verified_by = actorId;
      agent.verified_at = nowIso;
    } else if (status === 'REJECTED') {
      agent.rejection_remarks = rejectionRemarks || undefined;
    } else if (status === 'SUSPENDED') {
      agent.suspension_reason = suspensionReason || 'Compliance Review';
      agent.suspension_notes = suspensionNotes || undefined;
      agent.suspended_by = actorId;
      agent.suspended_at = nowIso;
    }

    return agent;
  }

  /**
   * Update agent profile information (Broker / Admin edit or applicant self-resubmission)
   */
  public static async updateAgentProfile(
    id: string,
    profileData: Partial<{
      name: string;
      phone: string;
      bio: string;
      avatar: string;
      prc_license_no: string;
      prc_validity: string;
      dhsud_accreditation_no: string;
      dhsud_validity: string;
      experience_years: number;
    }>
  ): Promise<AgentItem | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    if (profileData.name !== undefined) agent.name = profileData.name;
    if (profileData.phone !== undefined) agent.phone = profileData.phone;
    if (profileData.bio !== undefined) agent.bio = profileData.bio;
    if (profileData.avatar !== undefined) agent.avatar = profileData.avatar;
    if (profileData.prc_license_no !== undefined) agent.prc_license_no = profileData.prc_license_no;
    if (profileData.prc_validity !== undefined) agent.prc_validity = profileData.prc_validity;
    if (profileData.dhsud_accreditation_no !== undefined) agent.dhsud_accreditation_no = profileData.dhsud_accreditation_no;
    if (profileData.dhsud_validity !== undefined) agent.dhsud_validity = profileData.dhsud_validity;
    if (profileData.experience_years !== undefined) agent.experience_years = profileData.experience_years;

    // Check if credential fields were modified
    const credentialFieldsChanged =
      profileData.prc_license_no !== undefined ||
      profileData.prc_validity !== undefined ||
      profileData.dhsud_accreditation_no !== undefined ||
      profileData.dhsud_validity !== undefined;

    if (credentialFieldsChanged) {
      if (agent.verification_status === 'VERIFIED') {
        agent.verification_status = 'PENDING';
      } else if (agent.verification_status === 'REJECTED') {
        agent.verification_status = 'PENDING';
        agent.rejection_remarks = undefined;
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: agent.name,
            phone: agent.phone,
            bio: agent.bio,
            avatar_url: agent.avatar,
            prc_license_no: agent.prc_license_no,
            prc_validity: agent.prc_validity,
            dhsud_accreditation_no: agent.dhsud_accreditation_no,
            dhsud_validity: agent.dhsud_validity,
            experience_years: agent.experience_years,
            verification_status: agent.verification_status,
            rejection_remarks: agent.rejection_remarks || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          logger.error(`[AgentService] Failed to update profile ${id} in Supabase:`, error.message);
          throw new Error(`Database error updating agent profile: ${error.message}`);
        }

        return data ? this.formatAgentProfile(data) : agent;
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error(`[AgentService] Exception updating profile ${id}:`, err.message);
        }
        throw err;
      }
    }

    return agent;
  }
}

export default AgentService;
