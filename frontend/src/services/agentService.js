// ==============================================================================
// Agent & Consultant Management Service
// Communicates with Express Backend RESTful API (/api/agents)
// ==============================================================================

import apiClient from './apiClient';

/**
 * Normalizes agent records from database or backend API
 * into a uniform shape expected by all Broker agent management views.
 */
export function normalizeAgent(raw = {}) {
  const statusStr = String(raw.verification_status || raw.status || 'PENDING').toUpperCase();
  const validStatus = ['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED', 'INVITED'].includes(statusStr)
    ? statusStr
    : 'PENDING';

  return {
    id: String(raw.id || `agent-${Date.now()}`),
    name: raw.name || raw.full_name || 'Licensed Consultant',
    role: raw.role || 'Agent',
    email: raw.email || 'consultant@pt.com',
    phone: raw.phone || '+63 900 000 0000',
    avatar: raw.avatar || raw.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    prc_license_no: raw.prc_license_no || 'PRC-REB-PENDING',
    prc_validity: raw.prc_validity || '2027-12-31',
    dhsud_accreditation_no: raw.dhsud_accreditation_no || 'DHSUD-NCR-AA-PENDING',
    dhsud_validity: raw.dhsud_validity || '2026-12-31',
    verification_status: validStatus,
    license_status: (raw.prc_validity && new Date(raw.prc_validity).getTime() < Date.now())
      ? 'EXPIRED'
      : (raw.license_status || (validStatus === 'VERIFIED' ? 'VALID' : validStatus === 'PENDING' ? 'FOR_REVIEW' : validStatus === 'INVITED' ? '—' : 'EXPIRED')),
    rejection_remarks: raw.rejection_remarks || '',
    supporting_documents: raw.supporting_documents || [],
    experience_years: Number(raw.experience_years || 3),
    bio: raw.bio || 'Licensed premier property consultant advising private and institutional clients on luxury asset portfolios.',
    assigned_properties_count: Number(raw.assigned_properties_count || 0),
    active_inquiries_count: Number(raw.active_inquiries_count || 0),
    upcoming_appointments_count: Number(raw.upcoming_appointments_count || 0),
    recorded_sales_count: Number(raw.recorded_sales_count || 0),
    total_sales_value: Number(raw.total_sales_value || 0),
    last_activity: raw.last_activity || 'Recently active',
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
    const payload = typeof details === 'string'
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
};

export default agentService;
