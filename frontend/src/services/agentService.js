// ==============================================================================
// Agent & Consultant Management Service
// Communicates with Express Backend RESTful API (/api/agents)
// ==============================================================================

import apiClient from './apiClient';
import { mockAgents } from '../mockData/mockAgents';

/**
 * Normalizes agent records from database, backend API, or fallback mocks
 * into a uniform shape expected by all Broker agent management views.
 */
export function normalizeAgent(raw = {}) {
  const statusStr = String(raw.verification_status || raw.status || 'PENDING').toUpperCase();
  const validStatus = ['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(statusStr)
    ? statusStr
    : 'PENDING';

  return {
    id: String(raw.id || `agent-${Date.now()}`),
    name: raw.name || raw.full_name || 'Licensed Consultant',
    email: raw.email || 'consultant@pt.com',
    phone: raw.phone || '+63 900 000 0000',
    avatar: raw.avatar || raw.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    prc_license_no: raw.prc_license_no || 'PRC-REB-PENDING',
    prc_validity: raw.prc_validity || '2027-12-31',
    dhsud_accreditation_no: raw.dhsud_accreditation_no || 'DHSUD-NCR-AA-PENDING',
    dhsud_validity: raw.dhsud_validity || '2026-12-31',
    verification_status: validStatus,
    experience_years: Number(raw.experience_years || 3),
    bio: raw.bio || 'Licensed premier property consultant advising private and institutional clients on luxury asset portfolios.',
    assigned_properties_count: Number(raw.assigned_properties_count || 0),
    active_inquiries_count: Number(raw.active_inquiries_count || 0),
    upcoming_appointments_count: Number(raw.upcoming_appointments_count || 0),
    recorded_sales_count: Number(raw.recorded_sales_count || 0),
    total_sales_value: Number(raw.total_sales_value || 0),
  };
}

export const agentService = {
  /**
   * Fetch consultant directory with optional filters
   */
  async getAgents(params = {}) {
    try {
      const response = await apiClient.get('/agents', { params });
      const rawList = response?.data || response || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map(normalizeAgent);
      }
      return mockAgents.map(normalizeAgent);
    } catch (err) {
      console.warn('[agentService] Fetch agents failed, falling back to mock fixtures:', err.message);
      return mockAgents.map(normalizeAgent);
    }
  },

  /**
   * Fetch a single consultant profile by ID
   */
  async getAgentById(id) {
    try {
      const response = await apiClient.get(`/agents/${id}`);
      const raw = response?.data || response;
      if (raw) {
        return normalizeAgent(raw);
      }
    } catch (err) {
      console.warn(`[agentService] Fetch agent ${id} failed, checking mock fixtures:`, err.message);
    }

    const fallback = mockAgents.find((a) => String(a.id) === String(id));
    return fallback ? normalizeAgent(fallback) : null;
  },

  /**
   * Update consultant verification status (Approve, Reject, Suspend)
   */
  async updateAgentStatus(id, verification_status) {
    try {
      const response = await apiClient.put(`/agents/${id}/status`, { verification_status });
      const raw = response?.data || response;
      return normalizeAgent(raw);
    } catch (err) {
      console.warn(`[agentService] Update agent ${id} status failed:`, err.message);
      const fallback = mockAgents.find((a) => String(a.id) === String(id)) || {};
      return normalizeAgent({ ...fallback, verification_status, id });
    }
  },
};

export default agentService;
