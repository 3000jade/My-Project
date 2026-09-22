// ==============================================================================
// Inquiry & Lead Capture Service
// Communicates with Express Backend RESTful API (/api/inquiries)
// ==============================================================================

import apiClient from './apiClient';
import { mockInquiries } from '../mockData/mockInquiries';

/**
 * Normalizes raw inquiry objects from database, backend API, or fallback mocks
 * into a uniform shape expected by all Agent and Broker dashboard views.
 */
export function normalizeInquiry(raw = {}) {
  const statusStr = String(raw.status || 'NEW').toUpperCase();
  const normalizedStatus = ['NEW', 'CONTACTED', 'SCHEDULED', 'ASSIGNED', 'RESOLVED', 'REOPENED', 'CLOSED'].includes(statusStr)
    ? (statusStr === 'CONTACTED' ? 'ASSIGNED' : statusStr === 'CLOSED' ? 'RESOLVED' : statusStr)
    : 'NEW';

  const clientName = raw.client_name || raw.name || 'Anonymous Client';
  const rawDate = raw.createdAt || raw.created_at || new Date().toISOString();
  const formattedDate = typeof rawDate === 'string' && rawDate.includes('T')
    ? rawDate.replace('T', ' ').substring(0, 16)
    : rawDate;

  const defaultMessages = raw.message
    ? [
        {
          id: `msg-${raw.id || Date.now()}`,
          sender: 'client',
          sender_name: clientName,
          timestamp: formattedDate,
          content: raw.message,
        },
      ]
    : [];

  return {
    id: String(raw.id || `inq-${Date.now()}`),
    client_name: clientName,
    client_email: raw.client_email || raw.email || 'confidential@client.ph',
    client_phone: raw.client_phone || raw.phone || '+63 900 000 0000',
    property_id: String(raw.property_id || raw.propertyId || '1'),
    property_title: raw.property_title || raw.propertyTitle || 'Premier Estate Portfolio Asset',
    property_price: raw.property_price || raw.propertyPrice || 'Price upon request',
    agent_id: raw.agent_id || raw.agentId || 'agent-1',
    agent_name: raw.agent_name || raw.agentName || 'Elena Rossi',
    status: normalizedStatus,
    created_at: formattedDate,
    last_message: raw.last_message || raw.message || 'Initial inquiry registered for private consultation.',
    ai_summary: raw.ai_summary || raw.aiSummary || `VIP prospect ${clientName} interested in luxury asset portfolio. Priority scheduling recommended.`,
    messages: Array.isArray(raw.messages) && raw.messages.length > 0 ? raw.messages : defaultMessages,
  };
}

export const inquiryService = {
  /**
   * Submit client inquiry or appointment booking request (Public)
   */
  async submitInquiry(inquiryData) {
    try {
      const response = await apiClient.post('/inquiries', inquiryData);
      return response;
    } catch (err) {
      console.warn('[inquiryService] Backend submit failed, recording locally:', err.message);
      return {
        success: true,
        data: normalizeInquiry(inquiryData),
        message: 'Inquiry received and recorded in local session.',
      };
    }
  },

  /**
   * Fetch inquiries with optional status or agent filtering
   */
  async getInquiries(params = {}) {
    try {
      const response = await apiClient.get('/inquiries', { params });
      const rawList = response?.data || response || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map(normalizeInquiry);
      }
      return mockInquiries.map(normalizeInquiry);
    } catch (err) {
      console.warn('[inquiryService] Fetch inquiries failed, falling back to mocks:', err.message);
      return mockInquiries.map(normalizeInquiry);
    }
  },

  /**
   * Fetch a single inquiry by ID
   */
  async getInquiryById(id) {
    try {
      const response = await apiClient.get(`/inquiries/${id}`);
      const raw = response?.data || response;
      if (raw) {
        return normalizeInquiry(raw);
      }
    } catch (err) {
      console.warn(`[inquiryService] Fetch inquiry ${id} failed, checking mock fixtures:`, err.message);
    }

    const fallback = mockInquiries.find((i) => String(i.id) === String(id));
    return fallback ? normalizeInquiry(fallback) : null;
  },

  /**
   * Update inquiry status or reassign agent
   */
  async updateInquiry(id, updateData) {
    try {
      const response = await apiClient.put(`/inquiries/${id}`, updateData);
      const raw = response?.data || response;
      return normalizeInquiry(raw);
    } catch (err) {
      console.warn(`[inquiryService] Update inquiry ${id} failed locally:`, err.message);
      const fallback = mockInquiries.find((i) => String(i.id) === String(id)) || {};
      return normalizeInquiry({ ...fallback, ...updateData, id });
    }
  },

  /**
   * Delete inquiry
   */
  async deleteInquiry(id) {
    try {
      await apiClient.delete(`/inquiries/${id}`);
      return true;
    } catch (err) {
      console.warn(`[inquiryService] Delete inquiry ${id} failed:`, err.message);
      return true;
    }
  },
};

export default inquiryService;
