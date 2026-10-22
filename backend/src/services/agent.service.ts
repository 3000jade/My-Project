import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AgentEligibilityService, AgentVerificationStatus } from './agentEligibility.service';
import { AgentTeamService } from './agentTeam.service';
import { NotificationService } from './notification.service';
import type {
  MembershipStatus,
  OnboardingStatus,
  RoutingAvailability,
  LicenseValidityState,
  AccessTier,
  AgentCompletenessDTO,
  AgentChecklistItemDTO,
  PublicAgentProfileDTO,
  AgentAuditEventDTO,
} from '../../../shared/types/agent';

const DEFAULT_BROKERAGE_ID = '00000000-0000-0000-0000-000000000001';

export interface AgentItem {
  id: string;
  name: string;
  role?: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  prc_license_no?: string | null;
  prc_validity?: string | null;
  dhsud_accreditation_no?: string | null;
  dhsud_validity?: string | null;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  membership_status?: MembershipStatus;
  onboarding_status?: OnboardingStatus;
  routing_availability?: RoutingAvailability;
  license_status?: LicenseValidityState;
  brokerage_id?: string;
  brokerage_name?: string;
  team_id?: string | null;
  team_name?: string | null;
  can_create_listings?: boolean;
  access_tier?: AccessTier;
  commission_tier?: string | null;
  location_branch?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  internal_notes?: string | null;
  completeness?: AgentCompletenessDTO;
  rejection_remarks?: string;
  suspension_reason?: string;
  suspension_notes?: string;
  suspended_by?: string;
  suspended_at?: string;
  verified_by?: string;
  verified_at?: string;
  departed_at?: string;
  departure_reason?: string;
  supporting_documents?: any[];
  experience_years?: number | null;
  bio?: string | null;
  created_at?: string | null;
  assigned_properties_count: number;
  active_inquiries_count: number;
  upcoming_appointments_count: number;
  recorded_sales_count: number;
  total_sales_value: number;
}

export interface AgentFilterQuery {
  status?: string;
  membership_status?: string;
  onboarding_status?: string;
  routing_availability?: string;
  license_status?: string;
  team_id?: string;
  brokerage_id?: string;
  search?: string;
}

interface AgentAggregates {
  assignedProperties: number;
  activeInquiries: number;
  upcomingAppointments: number;
  recordedSales: number;
  totalSalesValue: number;
}

const localAgentsState: AgentItem[] = [];

export class AgentService {
  /**
   * Look up an agent in the local in-memory store (used for test fixtures & fast fallbacks)
   */
  public static getLocalAgentById(id: string): AgentItem | null {
    return localAgentsState.find((a) => a.id === id) || null;
  }

  public static getLocalAgents(): AgentItem[] {
    return localAgentsState.map((a) => this.enrichAgentDimensions(a));
  }

  public static getLocalAgentByEmail(email: string): AgentItem | null {
    const clean = email.trim().toLowerCase();
    return localAgentsState.find((a) => a.email.toLowerCase() === clean) || null;
  }

  /**
   * Compute dynamic onboarding completeness checklist (replaces hardcoded 75%)
   */
  public static computeCompleteness(agent: Partial<AgentItem>): AgentCompletenessDTO {
    const cleanDocs = Array.isArray(agent.supporting_documents)
      ? agent.supporting_documents.filter((d: any) => !d || d._meta_type !== 'agent_v2_metadata')
      : [];

    const items: AgentChecklistItemDTO[] = [
      {
        key: 'name',
        label: 'Full Legal Name',
        completed: Boolean(agent.name && agent.name.trim() && agent.name !== 'Licensed Consultant'),
        required: true,
      },
      {
        key: 'phone',
        label: 'Active Mobile Number',
        completed: Boolean(agent.phone && String(agent.phone).trim()),
        required: true,
      },
      {
        key: 'bio',
        label: 'Professional Biography & Specialization',
        completed: Boolean(agent.bio && String(agent.bio).trim()),
        required: true,
      },
      {
        key: 'prc_license_no',
        label: 'PRC Real Estate License Number & Expiry',
        completed: Boolean(agent.prc_license_no && agent.prc_validity),
        required: true,
      },
      {
        key: 'dhsud_accreditation_no',
        label: 'DHSUD Accreditation Number & Expiry',
        completed: Boolean(agent.dhsud_accreditation_no && agent.dhsud_validity),
        required: true,
      },
      {
        key: 'supporting_documents',
        label: 'Uploaded PRC / DHSUD Credential Scans',
        completed: cleanDocs.length > 0,
        required: true,
      },
    ];

    const missingFields: string[] = [];
    if (!agent.name || !agent.name.trim()) missingFields.push('name');
    if (!agent.phone || !String(agent.phone).trim()) missingFields.push('phone');
    if (!agent.bio || !String(agent.bio).trim()) missingFields.push('bio');
    if (!agent.prc_license_no) missingFields.push('prc_license_no');
    if (!agent.prc_validity) missingFields.push('prc_validity');
    if (!agent.dhsud_accreditation_no) missingFields.push('dhsud_accreditation_no');
    if (!agent.dhsud_validity) missingFields.push('dhsud_validity');
    if (cleanDocs.length === 0) missingFields.push('supporting_documents');

    const completedCount = items.filter((i) => i.completed).length;
    const totalRequired = items.length;
    const percent = Math.round((completedCount / totalRequired) * 100);

    return {
      percent,
      completedRequired: completedCount,
      completedCount,
      totalRequired,
      totalCount: totalRequired,
      isComplete: missingFields.length === 0,
      missingFields,
      checklist: items,
    };
  }

  /**
   * Compute license validity state (VALID, EXPIRING_SOON within 30 days, EXPIRED, INCOMPLETE)
   */
  public static computeLicenseStatus(agent: Partial<AgentItem>, now: Date = new Date()): LicenseValidityState {
    if (!agent.prc_license_no || !agent.dhsud_accreditation_no || !agent.prc_validity || !agent.dhsud_validity) {
      return 'INCOMPLETE';
    }

    const nowMs = now.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const prcEndMs = AgentEligibilityService.getAsiaManilaEndOfDay(agent.prc_validity);
    const dhsudEndMs = AgentEligibilityService.getAsiaManilaEndOfDay(agent.dhsud_validity);

    if (nowMs > prcEndMs || nowMs > dhsudEndMs) {
      return 'EXPIRED';
    }
    if (prcEndMs - nowMs <= thirtyDaysMs || dhsudEndMs - nowMs <= thirtyDaysMs) {
      return 'EXPIRING_SOON';
    }
    return 'VALID';
  }

  /**
   * Enrich an AgentItem with explicit 3D lifecycle dimensions, completeness, and license status
   */
  public static enrichAgentDimensions(raw: Partial<AgentItem> & { id: string; name: string; email: string }): AgentItem {
    const vStatus = ((raw.verification_status || 'PENDING').toUpperCase() as AgentItem['verification_status']);

    // Extract embedded v2 metadata from supporting_documents if present
    const rawDocs = Array.isArray(raw.supporting_documents) ? raw.supporting_documents : [];
    const v2Meta = rawDocs.find((d: any) => d && d._meta_type === 'agent_v2_metadata') || {};
    const cleanDocs = rawDocs.filter((d: any) => !d || d._meta_type !== 'agent_v2_metadata');

    let membershipStatus: MembershipStatus =
      raw.membership_status || v2Meta.membership_status || (vStatus === 'SUSPENDED' ? 'suspended' : 'active');

    let onboardingStatus: OnboardingStatus =
      raw.onboarding_status ||
      v2Meta.onboarding_status ||
      (vStatus === 'VERIFIED'
        ? 'complete'
        : vStatus === 'REJECTED'
        ? 'rejected'
        : !raw.prc_license_no || !raw.dhsud_accreditation_no
        ? 'incomplete_profile'
        : 'pending_review');

    let routingAvailability: RoutingAvailability =
      raw.routing_availability ||
      v2Meta.routing_availability ||
      (membershipStatus === 'active' && onboardingStatus === 'complete' && vStatus === 'VERIFIED'
        ? 'available'
        : 'paused');

    if (membershipStatus === 'departed' || membershipStatus === 'suspended' || vStatus !== 'VERIFIED') {
      if (routingAvailability === 'available') {
        routingAvailability = 'paused';
      }
    }

    const baseItem: AgentItem = {
      id: raw.id,
      name: raw.name || 'Licensed Consultant',
      role: raw.role || 'agent',
      email: raw.email,
      phone: raw.phone ?? null,
      avatar: raw.avatar ?? null,
      prc_license_no: raw.prc_license_no ?? null,
      prc_validity: raw.prc_validity ?? null,
      dhsud_accreditation_no: raw.dhsud_accreditation_no ?? null,
      dhsud_validity: raw.dhsud_validity ?? null,
      verification_status: vStatus,
      membership_status: membershipStatus,
      onboarding_status: onboardingStatus,
      routing_availability: routingAvailability,
      brokerage_id: raw.brokerage_id || v2Meta.brokerage_id || DEFAULT_BROKERAGE_ID,
      brokerage_name: raw.brokerage_name || v2Meta.brokerage_name || 'Human Shelter Realty',
      team_id: raw.team_id !== undefined ? raw.team_id : v2Meta.team_id ?? null,
      team_name: raw.team_name !== undefined ? raw.team_name : v2Meta.team_name ?? null,
      can_create_listings:
        raw.can_create_listings !== undefined
          ? Boolean(raw.can_create_listings)
          : v2Meta.can_create_listings !== undefined
          ? Boolean(v2Meta.can_create_listings)
          : false,
      access_tier: raw.access_tier || v2Meta.access_tier || 'standard_agent',
      commission_tier: raw.commission_tier !== undefined ? raw.commission_tier : v2Meta.commission_tier ?? null,
      location_branch: raw.location_branch !== undefined ? raw.location_branch : v2Meta.location_branch ?? null,
      emergency_contact_name:
        raw.emergency_contact_name !== undefined ? raw.emergency_contact_name : v2Meta.emergency_contact_name ?? null,
      emergency_contact_phone:
        raw.emergency_contact_phone !== undefined
          ? raw.emergency_contact_phone
          : v2Meta.emergency_contact_phone ?? null,
      internal_notes: raw.internal_notes !== undefined ? raw.internal_notes : v2Meta.internal_notes ?? null,
      rejection_remarks: raw.rejection_remarks || v2Meta.rejection_remarks || undefined,
      suspension_reason: raw.suspension_reason || v2Meta.suspension_reason || undefined,
      suspension_notes: raw.suspension_notes || v2Meta.suspension_notes || undefined,
      suspended_by: raw.suspended_by || v2Meta.suspended_by || undefined,
      suspended_at: raw.suspended_at || v2Meta.suspended_at || undefined,
      verified_by: raw.verified_by || v2Meta.verified_by || undefined,
      verified_at: raw.verified_at || v2Meta.verified_at || undefined,
      departed_at: raw.departed_at || v2Meta.departed_at || undefined,
      departure_reason: raw.departure_reason || v2Meta.departure_reason || undefined,
      supporting_documents: cleanDocs,
      experience_years:
        raw.experience_years !== null && raw.experience_years !== undefined ? Number(raw.experience_years) : null,
      bio: raw.bio ?? null,
      created_at: raw.created_at ?? null,
      assigned_properties_count: raw.assigned_properties_count ?? 0,
      active_inquiries_count: raw.active_inquiries_count ?? 0,
      upcoming_appointments_count: raw.upcoming_appointments_count ?? 0,
      recorded_sales_count: raw.recorded_sales_count ?? 0,
      total_sales_value: raw.total_sales_value ?? 0,
    };

    if (baseItem.team_id && !baseItem.team_name) {
      const resolvedTeam = AgentTeamService.getTeamByIdSync(baseItem.team_id);
      if (resolvedTeam) {
        baseItem.team_name = resolvedTeam.name;
      }
    }

    baseItem.license_status = this.computeLicenseStatus(baseItem);
    baseItem.completeness = this.computeCompleteness(baseItem);

    return baseItem;
  }

  /**
   * Build supporting_documents array with embedded v2 metadata envelope for live Supabase persistence
   */
  private static buildSupportingDocumentsWithMeta(agent: AgentItem): any[] {
    const cleanDocs = (agent.supporting_documents || []).filter(
      (d: any) => !d || d._meta_type !== 'agent_v2_metadata'
    );
    const metaEnvelope = {
      _meta_type: 'agent_v2_metadata',
      membership_status: agent.membership_status,
      onboarding_status: agent.onboarding_status,
      routing_availability: agent.routing_availability,
      brokerage_id: agent.brokerage_id || DEFAULT_BROKERAGE_ID,
      brokerage_name: agent.brokerage_name || 'Human Shelter Realty',
      team_id: agent.team_id ?? null,
      team_name: agent.team_name ?? null,
      can_create_listings: Boolean(agent.can_create_listings),
      access_tier: agent.access_tier || 'standard_agent',
      commission_tier: agent.commission_tier ?? null,
      location_branch: agent.location_branch ?? null,
      emergency_contact_name: agent.emergency_contact_name ?? null,
      emergency_contact_phone: agent.emergency_contact_phone ?? null,
      internal_notes: agent.internal_notes ?? null,
      departed_at: agent.departed_at,
      departure_reason: agent.departure_reason,
    };
    return [...cleanDocs, metaEnvelope];
  }

  /**
   * Project an internal AgentItem into a safe PublicAgentProfileDTO (strips internal/confidential fields)
   */
  public static toPublicAgentDTO(agent: AgentItem): PublicAgentProfileDTO | null {
    const enriched = this.enrichAgentDimensions(agent);
    if (
      enriched.verification_status !== 'VERIFIED' ||
      enriched.membership_status !== 'active' ||
      enriched.onboarding_status !== 'complete'
    ) {
      return null;
    }

    return {
      id: enriched.id,
      name: enriched.name,
      role: enriched.role || 'Agent',
      email: enriched.email,
      phone: enriched.phone || null,
      avatar: enriched.avatar || null,
      bio: enriched.bio || null,
      experience_years: enriched.experience_years ?? null,
      brokerage_name: enriched.brokerage_name || 'Human Shelter Realty',
      team_name: enriched.team_name || null,
      prc_verified: Boolean(enriched.prc_license_no && enriched.license_status !== 'EXPIRED'),
      dhsud_verified: Boolean(enriched.dhsud_accreditation_no && enriched.license_status !== 'EXPIRED'),
      license_status: 'VALID',
      routing_availability: enriched.routing_availability || 'available',
      assigned_properties_count: enriched.assigned_properties_count ?? 0,
    };
  }

  /**
   * Synchronize routing_availability dimension on agent record when updated via AgentAvailabilityService
   */
  public static async syncAgentAvailabilityDimension(
    agentId: string,
    availability: RoutingAvailability | { routing_availability: RoutingAvailability },
    actorId?: string
  ): Promise<void> {
    const routingAvailability: RoutingAvailability =
      typeof availability === 'string'
        ? availability
        : availability.routing_availability || 'available';

    const localIdx = localAgentsState.findIndex((a) => a.id === agentId);
    if (localIdx >= 0) {
      localAgentsState[localIdx] = {
        ...localAgentsState[localIdx],
        routing_availability: routingAvailability,
      };
    }

    if (isSupabaseConfigured) {
      try {
        const current = await this.getAgentById(agentId);
        if (current) {
          current.routing_availability = routingAvailability;
          const docsWithMeta = this.buildSupportingDocumentsWithMeta(current);
          await supabaseAdmin
            .from('profiles')
            .update({
              supporting_documents: docsWithMeta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', agentId);
        }
      } catch {
        // Non-fatal in mock/offline environments
      }
    }
  }

  /**
   * Batched retrieval of relational metrics for one or more agents
   */
  private static async fetchAgentAggregates(agentIds: string[]): Promise<Record<string, AgentAggregates>> {
    const result: Record<string, AgentAggregates> = {};
    for (const id of agentIds) {
      result[id] = {
        assignedProperties: 0,
        activeInquiries: 0,
        upcomingAppointments: 0,
        recordedSales: 0,
        totalSalesValue: 0,
      };
    }

    if (!isSupabaseConfigured || agentIds.length === 0) {
      return result;
    }

    try {
      const { data: propsData, error: propsErr } = await supabaseAdmin
        .from('properties')
        .select('id, list_agent_key, status')
        .in('list_agent_key', agentIds);

      if (propsErr) {
        logger.warn('[AgentService] Failed to aggregate assigned properties:', propsErr.message);
      }

      const allAssignedPropIds: string[] = [];
      const propToAgentMap: Record<string, string> = {};

      if (propsData) {
        for (const prop of propsData) {
          const agentKey = prop.list_agent_key;
          if (agentKey && result[agentKey]) {
            result[agentKey].assignedProperties += 1;
            allAssignedPropIds.push(prop.id);
            propToAgentMap[prop.id] = agentKey;
          }
        }
      }

      if (allAssignedPropIds.length > 0) {
        const { data: inqData, error: inqErr } = await supabaseAdmin
          .from('inquiries')
          .select('id, property_id, status')
          .in('property_id', allAssignedPropIds)
          .in('status', ['new', 'contacted', 'pending']);

        if (inqErr) {
          logger.warn('[AgentService] Failed to aggregate active inquiries:', inqErr.message);
        } else if (inqData) {
          for (const inq of inqData) {
            const agentKey = propToAgentMap[inq.property_id];
            if (agentKey && result[agentKey]) {
              result[agentKey].activeInquiries += 1;
            }
          }
        }
      }

      const nowIso = new Date().toISOString();
      const { data: apptData, error: apptErr } = await supabaseAdmin
        .from('appointments')
        .select('id, agent_id, status, appointment_time')
        .in('agent_id', agentIds)
        .gte('appointment_time', nowIso)
        .in('status', ['requested', 'confirmed']);

      if (apptErr) {
        logger.warn('[AgentService] Failed to aggregate appointments:', apptErr.message);
      } else if (apptData) {
        for (const appt of apptData) {
          const agentKey = appt.agent_id;
          if (agentKey && result[agentKey]) {
            result[agentKey].upcomingAppointments += 1;
          }
        }
      }

      const { data: salesData, error: salesErr } = await supabaseAdmin
        .from('sales')
        .select('id, agent_id, property_value, status')
        .in('agent_id', agentIds)
        .eq('status', 'COMPLETED');

      if (salesErr) {
        logger.warn('[AgentService] Failed to aggregate sales:', salesErr.message);
      } else if (salesData) {
        for (const sale of salesData) {
          const agentKey = sale.agent_id;
          if (agentKey && result[agentKey]) {
            result[agentKey].recordedSales += 1;
            result[agentKey].totalSalesValue += Number(sale.property_value) || 0;
          }
        }
      }
    } catch (err: any) {
      logger.warn('[AgentService] Aggregate query exception:', err.message);
    }

    return result;
  }

  /**
   * Helper to format a profile record into an enriched AgentItem
   */
  private static formatAgentProfile(p: any, aggregates?: Partial<AgentAggregates>): AgentItem {
    return this.enrichAgentDimensions({
      id: p.id,
      name: p.full_name || 'Licensed Consultant',
      role: p.role || 'agent',
      email: p.email,
      phone: p.phone || null,
      avatar: p.avatar_url || null,
      prc_license_no: p.prc_license_no || null,
      prc_validity: p.prc_validity || null,
      dhsud_accreditation_no: p.dhsud_accreditation_no || null,
      dhsud_validity: p.dhsud_validity || null,
      verification_status: p.verification_status || 'PENDING',
      membership_status: p.membership_status,
      onboarding_status: p.onboarding_status,
      routing_availability: p.routing_availability,
      brokerage_id: p.brokerage_id,
      team_id: p.team_id,
      can_create_listings: p.can_create_listings,
      access_tier: p.access_tier,
      commission_tier: p.commission_tier,
      location_branch: p.location_branch,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
      internal_notes: p.internal_notes,
      rejection_remarks: p.rejection_remarks || undefined,
      suspension_reason: p.suspension_reason || undefined,
      suspension_notes: p.suspension_notes || undefined,
      suspended_by: p.suspended_by || undefined,
      suspended_at: p.suspended_at || undefined,
      verified_by: p.verified_by || undefined,
      verified_at: p.verified_at || undefined,
      departed_at: p.departed_at || undefined,
      departure_reason: p.departure_reason || undefined,
      supporting_documents: p.supporting_documents || [],
      experience_years:
        p.experience_years !== null && p.experience_years !== undefined ? Number(p.experience_years) : null,
      bio: p.bio || null,
      created_at: p.created_at || null,
      assigned_properties_count: aggregates?.assignedProperties ?? 0,
      active_inquiries_count: aggregates?.activeInquiries ?? 0,
      upcoming_appointments_count: aggregates?.upcomingAppointments ?? 0,
      recorded_sales_count: aggregates?.recordedSales ?? 0,
      total_sales_value: aggregates?.totalSalesValue ?? 0,
    });
  }

  /**
   * Reset local agents store (primarily for unit test isolation)
   */
  public static resetStore(): void {
    localAgentsState.length = 0;
  }

  /**
   * List agents with rich filtering across all 3 lifecycle dimensions, team, and license state
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

        const profiles = data || [];
        const agentIds = profiles.map((p: any) => p.id);
        const aggregatesMap = await this.fetchAgentAggregates(agentIds);

        list = profiles.map((p: any) => this.formatAgentProfile(p, aggregatesMap[p.id]));

        // Merge any local in-memory agents (e.g., unit test fixtures not persisted to Supabase)
        for (const local of localAgentsState) {
          if (!list.some((item) => item.id === local.id)) {
            list.unshift(this.enrichAgentDimensions(local));
          }
        }
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error('[AgentService] Supabase profile fetch exception:', err.message);
        }
        throw err;
      }
    } else {
      list = localAgentsState.map((a) => this.enrichAgentDimensions(a));
    }

    let results = list;

    if (query?.brokerage_id) {
      results = results.filter((a) => (a.brokerage_id || DEFAULT_BROKERAGE_ID) === query.brokerage_id);
    }

    if (query?.status && query.status !== 'ALL') {
      results = results.filter(
        (a) => a.verification_status.toUpperCase() === query.status?.toUpperCase()
      );
    }

    if (query?.membership_status && query.membership_status !== 'ALL') {
      results = results.filter(
        (a) => (a.membership_status || '').toLowerCase() === query.membership_status?.toLowerCase()
      );
    }

    if (query?.onboarding_status && query.onboarding_status !== 'ALL') {
      results = results.filter(
        (a) => (a.onboarding_status || '').toLowerCase() === query.onboarding_status?.toLowerCase()
      );
    }

    if (query?.routing_availability && query.routing_availability !== 'ALL') {
      results = results.filter(
        (a) => (a.routing_availability || '').toLowerCase() === query.routing_availability?.toLowerCase()
      );
    }

    if (query?.license_status && query.license_status !== 'ALL') {
      results = results.filter(
        (a) => (a.license_status || '').toUpperCase() === query.license_status?.toUpperCase()
      );
    }

    if (query?.team_id && query.team_id !== 'ALL') {
      results = results.filter((a) => a.team_id === query.team_id);
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.prc_license_no && a.prc_license_no.toLowerCase().includes(q)) ||
          (a.team_name && a.team_name.toLowerCase().includes(q)) ||
          (a.location_branch && a.location_branch.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * List safe public agent profiles for Client discovery
   */
  public static async listPublicAgents(): Promise<PublicAgentProfileDTO[]> {
    const allAgents = await this.listAgents({ status: 'VERIFIED' });
    return allAgents
      .map((a) => this.toPublicAgentDTO(a))
      .filter((dto): dto is PublicAgentProfileDTO => dto !== null);
  }

  /**
   * Get single safe public agent profile by ID
   */
  public static async getPublicAgentById(id: string): Promise<PublicAgentProfileDTO | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;
    return this.toPublicAgentDTO(agent);
  }

  /**
   * Get single agent by ID
   */
  public static async getAgentById(id: string): Promise<AgentItem | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const localNonUuid = localAgentsState.find((a) => a.id === id);
      if (localNonUuid) {
        return this.enrichAgentDimensions(localNonUuid);
      }
    }

    if (isSupabaseConfigured) {
      try {
        const query = supabaseAdmin?.from?.('profiles');
        if (!query || typeof query.select !== 'function') {
          const local = localAgentsState.find((a) => a.id === id);
          return local ? this.enrichAgentDimensions(local) : null;
        }

        const { data, error } = await query
          .select('*')
          .eq('id', id)
          .eq('role', 'agent')
          .single();

        if (error) {
          if (
            error.code === 'PGRST116' ||
            error.code === '22P02' ||
            error.message?.includes('Row not found') ||
            error.message?.includes('0 rows') ||
            error.message?.includes('invalid input syntax') ||
            error.message?.includes('JSON object requested, multiple (or no) rows returned')
          ) {
            const local = localAgentsState.find((a) => a.id === id);
            return local ? this.enrichAgentDimensions(local) : null;
          }
          logger.error(`[AgentService] Supabase profile ${id} lookup failed:`, error.message);
          throw new Error(`Database error retrieving agent: ${error.message}`);
        }

        if (!data) {
          const local = localAgentsState.find((a) => a.id === id);
          return local ? this.enrichAgentDimensions(local) : null;
        }

        const aggregatesMap = await this.fetchAgentAggregates([id]);
        return this.formatAgentProfile(data, aggregatesMap[id]);
      } catch (err: any) {
        if (err instanceof TypeError || err.message?.includes('Cannot read properties of undefined')) {
          const local = localAgentsState.find((a) => a.id === id);
          return local ? this.enrichAgentDimensions(local) : null;
        }
        if (!err.message?.includes('Database error')) {
          logger.error(`[AgentService] Supabase profile ${id} lookup exception:`, err.message);
        }
        throw err;
      }
    }

    const local = localAgentsState.find((a) => a.id === id);
    return local ? this.enrichAgentDimensions(local) : null;
  }

  /**
   * Register or update an agent in local cache
   */
  public static addAgent(item: AgentItem): void {
    const enriched = this.enrichAgentDimensions(item);
    const idx = localAgentsState.findIndex((a) => a.id === enriched.id || a.email === enriched.email);
    if (idx >= 0) {
      localAgentsState[idx] = enriched;
    } else {
      localAgentsState.push(enriched);
    }
  }

  /**
   * Update agent verification, suspension, or departure status with audit trail and notifications
   */
  public static async updateAgentStatus(
    id: string,
    status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED',
    details?:
      | string
      | {
          rejection_remarks?: string;
          suspension_reason?: string;
          suspension_notes?: string;
          membership_status?: MembershipStatus;
          onboarding_status?: OnboardingStatus;
          routing_availability?: RoutingAvailability;
          departed_at?: string;
          departure_reason?: string;
        },
    actorId?: string
  ): Promise<AgentItem | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    const rejectionRemarks = typeof details === 'string' ? details : details?.rejection_remarks;
    const suspensionReason = typeof details === 'object' ? details?.suspension_reason : undefined;
    const suspensionNotes = typeof details === 'object' ? details?.suspension_notes : undefined;
    const reason =
      status === 'REJECTED' ? rejectionRemarks : status === 'SUSPENDED' ? suspensionReason : undefined;

    if (isSupabaseConfigured) {
      try {
        await AgentEligibilityService.transitionStatus(
          actorId || 'system',
          id,
          status as AgentVerificationStatus,
          reason,
          suspensionNotes ? { suspension_notes: suspensionNotes } : {}
        );
      } catch (err: any) {
        if (err.message?.includes('invalid input syntax') || err.message?.includes('22P02')) {
          logger.warn(`[AgentService] Skipping transitionStatus for non-UUID agent ID: ${id}`);
        } else {
          logger.warn(`[AgentService] Transition status warning for ${id}:`, err.message);
        }
      }
    }

    agent.verification_status = status;
    const nowIso = new Date().toISOString();

    if (status === 'VERIFIED') {
      agent.rejection_remarks = undefined;
      agent.suspension_reason = undefined;
      agent.suspension_notes = undefined;
      agent.verified_by = actorId;
      agent.verified_at = nowIso;
      agent.membership_status = 'active';
      agent.onboarding_status = 'complete';
      agent.routing_availability =
        typeof details === 'object' && details?.routing_availability
          ? details.routing_availability
          : 'available';
    } else if (status === 'REJECTED') {
      agent.rejection_remarks = rejectionRemarks || undefined;
      agent.onboarding_status = 'rejected';
      agent.routing_availability = 'paused';
    } else if (status === 'SUSPENDED') {
      agent.suspension_reason = suspensionReason || 'Compliance Review';
      agent.suspension_notes = suspensionNotes || undefined;
      agent.suspended_by = actorId;
      agent.suspended_at = nowIso;
      agent.membership_status =
        typeof details === 'object' && details?.membership_status === 'departed'
          ? 'departed'
          : 'suspended';
      agent.routing_availability = 'paused';
      if (typeof details === 'object' && details?.departed_at) {
        agent.departed_at = details.departed_at;
        agent.departure_reason = details.departure_reason;
      }
    } else if (status === 'PENDING') {
      agent.membership_status = 'active';
      agent.onboarding_status = 'pending_review';
      agent.routing_availability = 'paused';
    }

    const enriched = this.enrichAgentDimensions(agent);

    if (isSupabaseConfigured) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          const docsWithMeta = this.buildSupportingDocumentsWithMeta(enriched);
          await supabaseAdmin
            .from('profiles')
            .update({
              supporting_documents: docsWithMeta,
              updated_at: nowIso,
            })
            .eq('id', id);
        }
      } catch {
        // Non-fatal
      }
    }

    const localIdx = localAgentsState.findIndex((a) => a.id === id);
    if (localIdx >= 0) {
      localAgentsState[localIdx] = { ...enriched };
    }

    // Emit notification for status transition
    try {
      await NotificationService.createNotification({
        title: `Agent Status Updated: ${status}`,
        message:
          status === 'VERIFIED'
            ? `${enriched.name} has been verified and activated for brokerage operations.`
            : status === 'REJECTED'
            ? `${enriched.name}'s credentials require revision: ${rejectionRemarks || 'See remarks'}.`
            : status === 'SUSPENDED'
            ? `${enriched.name}'s account was placed on ${enriched.membership_status}: ${agent.suspension_reason}.`
            : `${enriched.name} was returned to pending review.`,
        type: 'verification',
        related_record: id,
        role: 'agent',
        user_id: id,
      });
    } catch {
      // Ignore notification failures
    }

    return enriched;
  }

  /**
   * Update agent profile information (supports self-service fields, credential fields, and Broker-only governance fields)
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
      team_id: string | null;
      can_create_listings: boolean;
      access_tier: AccessTier;
      commission_tier: string | null;
      location_branch: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      internal_notes: string | null;
      routing_availability: RoutingAvailability;
    }>,
    actor?: { id: string; role: string; brokerage_id?: string }
  ): Promise<AgentItem | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    const isBrokerOrAdmin = actor?.role === 'broker' || actor?.role === 'admin' || !actor;

    if (profileData.name !== undefined) agent.name = profileData.name;
    if (profileData.phone !== undefined) agent.phone = profileData.phone;
    if (profileData.bio !== undefined) agent.bio = profileData.bio;
    if (profileData.avatar !== undefined) agent.avatar = profileData.avatar;
    if (profileData.prc_license_no !== undefined) agent.prc_license_no = profileData.prc_license_no;
    if (profileData.prc_validity !== undefined) agent.prc_validity = profileData.prc_validity;
    if (profileData.dhsud_accreditation_no !== undefined)
      agent.dhsud_accreditation_no = profileData.dhsud_accreditation_no;
    if (profileData.dhsud_validity !== undefined) agent.dhsud_validity = profileData.dhsud_validity;
    if (profileData.experience_years !== undefined) agent.experience_years = profileData.experience_years;
    if (profileData.routing_availability !== undefined)
      agent.routing_availability = profileData.routing_availability;

    // Broker/Admin-only internal governance & permission fields
    if (isBrokerOrAdmin) {
      if (profileData.team_id !== undefined) {
        agent.team_id = profileData.team_id;
        const resolvedTeam = profileData.team_id
          ? AgentTeamService.getTeamByIdSync(profileData.team_id)
          : null;
        agent.team_name = resolvedTeam ? resolvedTeam.name : null;
      }
      if (profileData.can_create_listings !== undefined) {
        agent.can_create_listings = Boolean(profileData.can_create_listings);
      }
      if (profileData.access_tier !== undefined) {
        agent.access_tier = profileData.access_tier;
      }
      if (profileData.commission_tier !== undefined) {
        agent.commission_tier = profileData.commission_tier;
      }
      if (profileData.location_branch !== undefined) {
        agent.location_branch = profileData.location_branch;
      }
      if (profileData.emergency_contact_name !== undefined) {
        agent.emergency_contact_name = profileData.emergency_contact_name;
      }
      if (profileData.emergency_contact_phone !== undefined) {
        agent.emergency_contact_phone = profileData.emergency_contact_phone;
      }
      if (profileData.internal_notes !== undefined) {
        agent.internal_notes = profileData.internal_notes;
      }
    }

    // Check if credential fields were modified
    const credentialFieldsChanged =
      profileData.prc_license_no !== undefined ||
      profileData.prc_validity !== undefined ||
      profileData.dhsud_accreditation_no !== undefined ||
      profileData.dhsud_validity !== undefined;

    if (credentialFieldsChanged) {
      if (agent.verification_status === 'VERIFIED') {
        agent.verification_status = 'PENDING';
        agent.onboarding_status = 'pending_review';
        agent.routing_availability = 'paused';
      } else if (agent.verification_status === 'REJECTED') {
        agent.verification_status = 'PENDING';
        agent.onboarding_status = 'pending_review';
        agent.rejection_remarks = undefined;
      }
    }

    const enriched = this.enrichAgentDimensions(agent);

    if (isSupabaseConfigured) {
      try {
        const docsWithMeta = this.buildSupportingDocumentsWithMeta(enriched);
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: enriched.name,
            phone: enriched.phone,
            bio: enriched.bio,
            avatar_url: enriched.avatar,
            prc_license_no: enriched.prc_license_no,
            prc_validity: enriched.prc_validity,
            dhsud_accreditation_no: enriched.dhsud_accreditation_no,
            dhsud_validity: enriched.dhsud_validity,
            experience_years: enriched.experience_years,
            verification_status: enriched.verification_status,
            rejection_remarks: enriched.rejection_remarks || null,
            supporting_documents: docsWithMeta,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === '22P02' || error.message?.includes('invalid input syntax')) {
            logger.warn(`[AgentService] Non-UUID agent ID ${id} updated in local state only.`);
          } else {
            logger.error(`[AgentService] Failed to update profile ${id} in Supabase:`, error.message);
            throw new Error(`Database error updating agent profile: ${error.message}`);
          }
        }
      } catch (err: any) {
        if (!err.message?.includes('Database error')) {
          logger.error(`[AgentService] Exception updating profile ${id}:`, err.message);
        }
        throw err;
      }
    }

    const localIdx = localAgentsState.findIndex((a) => a.id === id);
    if (localIdx >= 0) {
      localAgentsState[localIdx] = { ...enriched };
    }

    if (actor) {
      AgentEligibilityService.recordLocalAuditEvent({
        actor_id: actor.id,
        target_id: id,
        brokerage_id: enriched.brokerage_id || DEFAULT_BROKERAGE_ID,
        event_type: credentialFieldsChanged ? 'CREDENTIAL_RESUBMITTED' : 'PROFILE_UPDATED',
        prior_status: enriched.verification_status,
        new_status: enriched.verification_status,
        reason: credentialFieldsChanged ? 'License credentials updated' : 'Profile fields updated',
        changed_fields: profileData as Record<string, any>,
      });
    }

    return enriched;
  }

  /**
   * Retrieve immutable audit history for a specific agent or entire brokerage
   */
  public static async getAuditEvents(agentId?: string, limit: number = 50): Promise<AgentAuditEventDTO[]> {
    const localEvents = AgentEligibilityService.getLocalAuditEvents();

    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('agent_audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (agentId) {
          query = query.eq('target_id', agentId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback to local store
      }
    }

    const filtered = agentId ? localEvents.filter((e) => e.target_id === agentId) : localEvents;
    return filtered.slice(0, limit);
  }

  /**
   * Compute brokerage or single-agent operational performance summary
   */
  public static async getPerformanceSummary(agentId?: string) {
    const agents = agentId
      ? ([await this.getAgentById(agentId)].filter(Boolean) as AgentItem[])
      : await this.listAgents();

    const totalAgents = agents.length;
    const activeVerifiedCount = agents.filter(
      (a) => a.verification_status === 'VERIFIED' && a.membership_status === 'active'
    ).length;
    const availableForRoutingCount = agents.filter(
      (a) =>
        a.verification_status === 'VERIFIED' &&
        a.membership_status === 'active' &&
        a.routing_availability === 'available'
    ).length;
    const pendingReviewCount = agents.filter((a) => a.verification_status === 'PENDING').length;
    const expiringCredentialsCount = agents.filter(
      (a) => a.license_status === 'EXPIRING_SOON' || a.license_status === 'EXPIRED'
    ).length;

    const totalAssignedListings = agents.reduce((acc, a) => acc + (a.assigned_properties_count || 0), 0);
    const totalActiveInquiries = agents.reduce((acc, a) => acc + (a.active_inquiries_count || 0), 0);
    const totalUpcomingAppointments = agents.reduce(
      (acc, a) => acc + (a.upcoming_appointments_count || 0),
      0
    );
    const totalRecordedSales = agents.reduce((acc, a) => acc + (a.recorded_sales_count || 0), 0);
    const totalSalesValue = agents.reduce((acc, a) => acc + (a.total_sales_value || 0), 0);

    return {
      totalAgents,
      activeVerifiedCount,
      availableForRoutingCount,
      pendingReviewCount,
      expiringCredentialsCount,
      totalAssignedListings,
      totalActiveInquiries,
      totalUpcomingAppointments,
      totalRecordedSales,
      totalSalesValue,
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        team_name: a.team_name,
        verification_status: a.verification_status,
        membership_status: a.membership_status,
        routing_availability: a.routing_availability,
        assigned_properties_count: a.assigned_properties_count,
        active_inquiries_count: a.active_inquiries_count,
        upcoming_appointments_count: a.upcoming_appointments_count,
        recorded_sales_count: a.recorded_sales_count,
        total_sales_value: a.total_sales_value,
      })),
    };
  }
}

export default AgentService;
