// ==============================================================================
// Agent & Consultant Management Service (v2)
// Communicates with Express Backend RESTful API (/api/agents)
// ==============================================================================

import apiClient from './apiClient';

/**
 * Evaluates license validity status based purely on PRC license number and validity date,
 * strictly decoupled from profile verification status.
 * Evaluated against Asia/Manila calendar date (UTC+8).
 *
 * Returns: 'NOT_PROVIDED' | 'UNKNOWN' | 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
 */
export function evaluateLicenseStatus(licenseNo, validityDate) {
  if (
    !licenseNo ||
    typeof licenseNo !== 'string' ||
    licenseNo.trim() === '' ||
    licenseNo === 'N/A' ||
    licenseNo === 'PRC-REB-PENDING'
  ) {
    return 'NOT_PROVIDED';
  }
  if (!validityDate || typeof validityDate !== 'string' || validityDate.trim() === '') {
    return 'UNKNOWN';
  }

  const dateStr = validityDate.includes('T') ? validityDate.split('T')[0] : validityDate.trim();
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return 'UNKNOWN';
  }

  const nowInManila = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  if (dateStr < nowInManila) {
    return 'EXPIRED';
  }

  // Check if expiring within 30 days
  const expMs = new Date(`${dateStr}T23:59:59+08:00`).getTime();
  const nowMs = Date.now();
  if (expMs - nowMs <= 30 * 24 * 60 * 60 * 1000) {
    return 'EXPIRING_SOON';
  }

  return 'VALID';
}

/**
 * Computes dynamic onboarding completeness checklist when not pre-populated by backend
 */
export function computeAgentCompleteness(raw = {}) {
  if (raw.completeness && typeof raw.completeness.percent === 'number') {
    return raw.completeness;
  }

  const name = raw.name || raw.full_name || '';
  const phone = raw.phone || '';
  const bio = raw.bio || '';
  const prcNo = raw.prc_license_no || '';
  const prcVal = raw.prc_validity || '';
  const dhsudNo = raw.dhsud_accreditation_no || '';
  const dhsudVal = raw.dhsud_validity || '';
  const docs = Array.isArray(raw.supporting_documents)
    ? raw.supporting_documents.filter((d) => !d || d._meta_type !== 'agent_v2_metadata')
    : [];

  const checklist = [
    { key: 'name', label: 'Full Legal Name', completed: Boolean(name.trim()), required: true },
    { key: 'phone', label: 'Active Mobile Number', completed: Boolean(String(phone).trim()), required: true },
    {
      key: 'bio',
      label: 'Professional Biography & Specialization',
      completed: Boolean(String(bio).trim()),
      required: true,
    },
    {
      key: 'prc_license_no',
      label: 'PRC Real Estate License & Expiry',
      completed: Boolean(prcNo && prcVal),
      required: true,
    },
    {
      key: 'dhsud_accreditation_no',
      label: 'DHSUD Accreditation & Expiry',
      completed: Boolean(dhsudNo && dhsudVal),
      required: true,
    },
    {
      key: 'supporting_documents',
      label: 'Uploaded PRC / DHSUD Credential Scans',
      completed: docs.length > 0,
      required: true,
    },
  ];

  const completedCount = checklist.filter((i) => i.completed).length;
  const totalRequired = checklist.length;
  const percent = Math.round((completedCount / totalRequired) * 100);
  const missingFields = checklist.filter((i) => !i.completed).map((i) => i.key);

  return {
    percent,
    completedCount,
    totalRequired,
    isComplete: missingFields.length === 0,
    missingFields,
    checklist,
  };
}

/**
 * Normalizes agent records from database or backend API
 * into a uniform shape expected by all Broker, Agent, and Client views.
 */
export function normalizeAgent(raw = {}) {
  const statusStr = String(raw.verification_status || raw.status || 'PENDING').toUpperCase();
  const validStatus = ['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED', 'INVITED'].includes(statusStr)
    ? statusStr
    : 'PENDING';

  let experience = null;
  if (raw.experience_years !== null && raw.experience_years !== undefined && raw.experience_years !== '') {
    const num = Number(raw.experience_years);
    if (!isNaN(num)) {
      experience = num;
    }
  }

  const prcLicenseNo = raw.prc_license_no || '';
  const prcValidity = raw.prc_validity || '';

  const membershipStatus =
    raw.membership_status ||
    (validStatus === 'SUSPENDED' ? 'suspended' : validStatus === 'INVITED' ? 'invited' : 'active');

  const onboardingStatus =
    raw.onboarding_status ||
    (validStatus === 'VERIFIED'
      ? 'complete'
      : validStatus === 'REJECTED'
      ? 'rejected'
      : !prcLicenseNo
      ? 'incomplete_profile'
      : 'pending_review');

  const routingAvailability =
    raw.routing_availability ||
    (membershipStatus === 'active' && onboardingStatus === 'complete' && validStatus === 'VERIFIED'
      ? 'available'
      : 'paused');

  const cleanDocs = Array.isArray(raw.supporting_documents)
    ? raw.supporting_documents.filter((d) => !d || d._meta_type !== 'agent_v2_metadata')
    : [];

  return {
    id: String(raw.id || ''),
    name: raw.name || raw.full_name || '',
    role: raw.role || 'agent',
    email: raw.email || '',
    phone: raw.phone || '',
    avatar: raw.avatar || raw.avatar_url || '',
    prc_license_no: prcLicenseNo,
    prc_validity: prcValidity,
    dhsud_accreditation_no: raw.dhsud_accreditation_no || '',
    dhsud_validity: raw.dhsud_validity || '',
    verification_status: validStatus,
    membership_status: membershipStatus,
    onboarding_status: onboardingStatus,
    routing_availability: routingAvailability,
    license_status: raw.license_status || evaluateLicenseStatus(prcLicenseNo, prcValidity),
    brokerage_id: raw.brokerage_id || '00000000-0000-0000-0000-000000000001',
    brokerage_name: raw.brokerage_name || 'Human Shelter Realty',
    team_id: raw.team_id || null,
    team_name: raw.team_name || null,
    can_create_listings: Boolean(raw.can_create_listings),
    access_tier: raw.access_tier || 'standard_agent',
    commission_tier: raw.commission_tier || '',
    location_branch: raw.location_branch || raw.location || '',
    emergency_contact_name: raw.emergency_contact_name || '',
    emergency_contact_phone: raw.emergency_contact_phone || '',
    internal_notes: raw.internal_notes || '',
    completeness: computeAgentCompleteness({ ...raw, supporting_documents: cleanDocs }),
    availability: raw.availability || null,
    rejection_remarks: raw.rejection_remarks || '',
    suspension_reason: raw.suspension_reason || '',
    suspension_notes: raw.suspension_notes || '',
    departed_at: raw.departed_at || null,
    departure_reason: raw.departure_reason || '',
    supporting_documents: cleanDocs,
    experience_years: experience,
    bio: raw.bio || '',
    created_at: raw.created_at || null,
    assigned_properties_count: Number(raw.assigned_properties_count || 0),
    active_inquiries_count: Number(raw.active_inquiries_count || 0),
    upcoming_appointments_count: Number(raw.upcoming_appointments_count || 0),
    recorded_sales_count: Number(raw.recorded_sales_count || 0),
    total_sales_value: Number(raw.total_sales_value || 0),
    last_activity: raw.last_activity || '',
  };
}

export const agentService = {
  /**
   * Fetch consultant directory with optional filters
   */
  async getAgents(params = {}) {
    const response = await apiClient.get('/agents', { params });
    const rawList = response?.data || response || [];
    return Array.isArray(rawList) ? rawList.map(normalizeAgent) : [];
  },

  /**
   * Fetch safe public consultant directory for Client discovery
   */
  async getPublicAgents() {
    const response = await apiClient.get('/agents/public');
    return response?.data || response || [];
  },

  /**
   * Fetch safe public consultant profile by ID
   */
  async getPublicAgentById(id) {
    const response = await apiClient.get(`/agents/public/${id}`);
    return response?.data || response || null;
  },

  /**
   * Fetch authenticated agent's own self-service profile, completeness checklist, and availability
   */
  async getMyProfile() {
    const response = await apiClient.get('/agents/me');
    const raw = response?.data || response;
    return raw ? normalizeAgent(raw) : null;
  },

  /**
   * Fetch a single consultant profile by ID
   */
  async getAgentById(id) {
    const response = await apiClient.get(`/agents/${id}`);
    const raw = response?.data || response;
    return raw ? normalizeAgent(raw) : null;
  },

  /**
   * Update consultant verification status (Approve, Reject, Suspend)
   */
  async updateAgentStatus(id, verification_status, details = {}) {
    const payload =
      typeof details === 'string'
        ? { verification_status, rejection_remarks: details }
        : { verification_status, ...details };

    const response = await apiClient.put(`/agents/${id}/status`, payload);
    const raw = response?.data || response;
    return normalizeAgent(raw);
  },

  /**
   * Update consultant profile details (Edit Profile)
   */
  async updateAgentProfile(id, profileData) {
    const response = await apiClient.put(`/agents/${id}`, profileData);
    const raw = response?.data || response;
    return normalizeAgent(raw);
  },

  /**
   * Alias for updateAgentProfile
   */
  async updateAgent(id, profileData) {
    return this.updateAgentProfile(id, profileData);
  },

  /**
   * Resubmit credentials for a rejected or updated agent dossier
   */
  async resubmitCredentials(id, credentialData) {
    const response = await apiClient.post(`/agents/${id}/resubmit-credentials`, credentialData);
    const raw = response?.data || response;
    return normalizeAgent(raw);
  },

  /**
   * Brokerage Teams CRUD
   */
  async getTeams(params = {}) {
    const response = await apiClient.get('/agents/teams', { params });
    return response?.data || response || [];
  },

  async createTeam(payload) {
    const response = await apiClient.post('/agents/teams', payload);
    return response?.data || response;
  },

  async updateTeam(teamId, payload) {
    const response = await apiClient.put(`/agents/teams/${teamId}`, payload);
    return response?.data || response;
  },

  async deleteTeam(teamId) {
    const response = await apiClient.delete(`/agents/teams/${teamId}`);
    return response?.data || response;
  },

  /**
   * Agent Availability & Routing Schedule
   */
  async getAvailability(agentId) {
    const response = await apiClient.get(`/agents/${agentId}/availability`);
    return response?.data || response;
  },

  async updateAvailability(agentId, payload) {
    const response = await apiClient.put(`/agents/${agentId}/availability`, payload);
    return response?.data || response;
  },

  /**
   * Operational Eligibility Evaluation
   */
  async checkEligibility(agentId) {
    const response = await apiClient.get(`/agents/${agentId}/eligibility`);
    return response?.data || response;
  },

  /**
   * Responsibility Preview, Bulk/Selective Transfer, Retry & Offboarding Departure
   */
  async previewResponsibilities(agentId) {
    const response = await apiClient.get(`/agents/${agentId}/responsibilities`);
    return response?.data || response;
  },

  async transferResponsibilities(agentId, payload) {
    const response = await apiClient.post(`/agents/${agentId}/responsibilities/transfer`, payload);
    return response?.data || response;
  },

  async retryTransfer(transferId) {
    const response = await apiClient.post(`/agents/transfers/${transferId}/retry`);
    return response?.data || response;
  },

  async departAgent(agentId, payload) {
    const response = await apiClient.post(`/agents/${agentId}/depart`, payload);
    return response?.data || response;
  },

  /**
   * Immutable Audit History & Performance Summary
   */
  async getAuditEvents(agentId, limit = 50) {
    const url = agentId ? `/agents/${agentId}/audit-events` : '/agents/audit-events';
    const response = await apiClient.get(url, { params: { limit } });
    return response?.data || response || [];
  },

  async getPerformanceSummary(agentId) {
    const url = agentId ? `/agents/${agentId}/performance` : '/agents/performance/summary';
    const response = await apiClient.get(url);
    return response?.data || response;
  },
};

export default agentService;
