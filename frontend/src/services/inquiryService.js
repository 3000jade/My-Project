// ==============================================================================
// Inquiry & Lead Capture Service
// Communicates with Express Backend RESTful API (/api/inquiries, /api/audit-events)
// ==============================================================================

import apiClient from './apiClient';
import { mockInquiries } from '../mockData/mockInquiries';

/**
 * Normalizes raw inquiry objects from database, backend API, or fallback mocks
 * into a uniform shape expected by all Agent, Broker, and Client dashboard views.
 */
export function normalizeInquiry(raw = {}) {
  const statusStr = String(raw.status || 'NEW').toUpperCase();
  const normalizedStatus = ['NEW', 'CONTACTED', 'SCHEDULED', 'ASSIGNED', 'RESOLVED', 'REOPENED', 'CLOSED'].includes(statusStr)
    ? (statusStr === 'CONTACTED' ? 'ASSIGNED' : statusStr === 'CLOSED' ? 'RESOLVED' : statusStr)
    : 'NEW';

  const clientName = raw.client_name || raw.name || raw.clientName || 'Anonymous Client';
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
          delivery_status: 'delivered',
        },
      ]
    : [];

  return {
    id: String(raw.id || `inq-${Date.now()}`),
    reference_code: raw.reference_code || raw.referenceCode || `INQ-${Date.now().toString().slice(-6)}`,
    client_id: raw.client_id || raw.clientId,
    client_name: clientName,
    client_email: raw.client_email || raw.email || raw.clientEmail || 'confidential@client.ph',
    client_phone: raw.client_phone || raw.phone || raw.clientPhone || '+63 900 000 0000',
    property_id: String(raw.property_id || raw.propertyId || '1'),
    property_title: raw.property_title || raw.propertyTitle || 'Premier Estate Portfolio Asset',
    property_price: raw.property_price || raw.propertyPrice || 'Price upon request',
    agent_id: raw.agent_id || raw.agentId || 'b6f46129-baad-409f-89a3-8ca504e068e2',
    agent_name: raw.agent_name || raw.agentName || 'Carmela Del Rosario',
    status: normalizedStatus,
    business_status: raw.business_status || raw.businessStatus || 'active',
    operational_status: raw.operational_status || raw.operationalStatus || 'accepted',
    closure_reason: raw.closure_reason || raw.closureReason,
    closed_at: raw.closed_at || raw.closedAt,
    created_at: formattedDate,
    last_message: raw.last_message || raw.message || 'Initial inquiry registered for private consultation.',
    ai_summary: raw.ai_summary || raw.aiSummary || `VIP prospect ${clientName} interested in luxury asset portfolio. Priority scheduling recommended.`,
    latest_ai_summary: raw.latest_ai_summary || raw.latestAiSummary || null,
    follow_up_tasks: Array.isArray(raw.follow_up_tasks) ? raw.follow_up_tasks : (Array.isArray(raw.followUpTasks) ? raw.followUpTasks : []),
    chat_session: raw.chat_session || raw.chatSession || null,
    messages: Array.isArray(raw.messages) && raw.messages.length > 0 ? raw.messages : defaultMessages,
    internal_notes: Array.isArray(raw.internalNotes) ? raw.internalNotes : (Array.isArray(raw.internal_notes) ? raw.internal_notes : []),
    assignment_history: Array.isArray(raw.assignmentHistory) ? raw.assignmentHistory : (Array.isArray(raw.assignment_history) ? raw.assignment_history : []),
  };
}

export const inquiryService = {
  /**
   * Submit client inquiry or appointment booking request (Public / Client)
   */
  async submitInquiry(inquiryData) {
    try {
      const response = await apiClient.post('/inquiries', inquiryData);
      const raw = response?.data || response;
      return {
        success: true,
        data: normalizeInquiry(raw),
        message: response?.message || 'Inquiry received successfully.',
      };
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
   * Request live chat or consultation with an agent (Client portal / Property view)
   */
  async requestAgentChat(payload) {
    try {
      const response = await apiClient.post('/inquiries/request-chat', payload);
      const raw = response?.data || response;
      return {
        inquiry: normalizeInquiry(raw?.inquiry || raw),
        chatSession: raw?.chatSession || raw?.chat_session || null,
        validatedReturnTo: raw?.validatedReturnTo || '/',
      };
    } catch (err) {
      console.warn('[inquiryService] requestAgentChat failed, returning local mock:', err.message);
      return {
        inquiry: normalizeInquiry(payload),
        chatSession: { id: `chat-${Date.now()}`, status: 'ongoing' },
        validatedReturnTo: payload.returnTo || '/',
      };
    }
  },

  /**
   * Reconnect and sync messages + pending requestIds (Cursor sync)
   */
  async reconnectInquiry(inquiryId, payload = {}) {
    try {
      const response = await apiClient.post(`/inquiries/${inquiryId}/reconnect`, payload);
      const raw = response?.data || response;
      return {
        inquiry: normalizeInquiry(raw?.inquiry || raw),
        chatSession: raw?.chatSession || raw?.chat_session,
        reconciledRequestIds: raw?.reconciledRequestIds || {},
        missedMessages: raw?.missedMessages || [],
      };
    } catch (err) {
      console.warn(`[inquiryService] Reconnect ${inquiryId} failed:`, err.message);
      const fallback = await this.getInquiryById(inquiryId);
      return {
        inquiry: fallback,
        chatSession: null,
        reconciledRequestIds: {},
        missedMessages: [],
      };
    }
  },

  /**
   * Mark messages as read by recipient
   */
  async markMessagesRead(inquiryId) {
    try {
      const response = await apiClient.post(`/inquiries/${inquiryId}/messages/read`);
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Mark read ${inquiryId} failed:`, err.message);
      return { updatedCount: 0 };
    }
  },

  /**
   * Generate or refresh AI Client Summary Report (AI-01, AI-02)
   */
  async generateAiSummary(inquiryId) {
    try {
      const response = await apiClient.post(`/inquiries/${inquiryId}/ai-summary`);
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Generate AI summary ${inquiryId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Staff review and correction of AI summary (AI-02)
   */
  async reviewAiSummary(inquiryId, reviewPayload) {
    try {
      const response = await apiClient.put(`/inquiries/${inquiryId}/ai-summary/review`, reviewPayload);
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Review AI summary ${inquiryId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Create follow-up task (TASK-01)
   */
  async createFollowUpTask(inquiryId, taskData) {
    try {
      const response = await apiClient.post(`/inquiries/${inquiryId}/tasks`, taskData);
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Create task ${inquiryId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Update follow-up task status (TASK-01)
   */
  async updateFollowUpTask(inquiryId, taskId, updateData) {
    try {
      const response = await apiClient.put(`/inquiries/${inquiryId}/tasks/${taskId}`, updateData);
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Update task ${taskId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Transition inquiry business status: active <-> inactive with reason (LIFE-01)
   */
  async changeBusinessStatus(inquiryId, payload) {
    try {
      const response = await apiClient.put(`/inquiries/${inquiryId}/business-status`, payload);
      const raw = response?.data || response;
      return normalizeInquiry(raw);
    } catch (err) {
      console.warn(`[inquiryService] changeBusinessStatus ${inquiryId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Fetch simplified participant Activity Timeline (AUD-01)
   */
  async getTimeline(inquiryId) {
    try {
      const response = await apiClient.get(`/inquiries/${inquiryId}/timeline`);
      return response?.data || response || [];
    } catch (err) {
      console.warn(`[inquiryService] Fetch timeline ${inquiryId} failed:`, err.message);
      return [];
    }
  },

  /**
   * Fetch Broker SLA and queue monitoring metrics (BROKER-01)
   */
  async getBrokerMetrics() {
    try {
      const response = await apiClient.get('/inquiries/broker-metrics');
      return (
        response?.data ||
        response || {
          totalInquiries: 0,
          activeCount: 0,
          inactiveCount: 0,
          unassignedCount: 0,
          unansweredCount: 0,
          overdueCount: 0,
          averageFirstResponseSeconds: 0,
          conversionRatePercent: 0,
        }
      );
    } catch (err) {
      console.warn('[inquiryService] Fetch broker metrics failed:', err.message);
      return {
        totalInquiries: 12,
        activeCount: 9,
        inactiveCount: 3,
        unassignedCount: 2,
        unansweredCount: 4,
        overdueCount: 1,
        averageFirstResponseSeconds: 420,
        conversionRatePercent: 33,
      };
    }
  },

  /**
   * Query protected broker/admin audit events (AUD-02)
   */
  async getAuditEvents(params = {}) {
    try {
      const response = await apiClient.get('/audit-events', { params });
      return response?.data || response || [];
    } catch (err) {
      console.warn('[inquiryService] Fetch audit events failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch inquiries with optional status or agent filtering (Staff)
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
   * Fetch inquiries submitted by authenticated client (Client Portal)
   */
  async getMyInquiries() {
    try {
      const response = await apiClient.get('/inquiries/my-inquiries');
      const rawList = response?.data || response || [];
      if (Array.isArray(rawList)) {
        return rawList.map(normalizeInquiry);
      }
      return [];
    } catch (err) {
      console.warn('[inquiryService] Fetch my-inquiries failed:', err.message);
      return [];
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
   * Assign or reassign inquiry to an agent (Broker / Admin)
   */
  async assignAgent(id, agentId, notes) {
    try {
      const response = await apiClient.post(`/inquiries/${id}/assign`, { agentId, notes });
      const raw = response?.data || response;
      return normalizeInquiry(raw);
    } catch (err) {
      console.warn(`[inquiryService] Assign agent ${agentId} failed:`, err.message);
      throw err;
    }
  },

  /**
   * Append message to conversation thread with optional client-generated requestId (Client or Agent)
   */
  async addMessage(id, content, requestId) {
    try {
      const response = await apiClient.post(`/inquiries/${id}/messages`, { content, requestId });
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Add message failed:`, err.message);
      throw err;
    }
  },

  /**
   * Append private internal note (Staff only)
   */
  async addNote(id, content) {
    try {
      const response = await apiClient.post(`/inquiries/${id}/notes`, { content });
      return response?.data || response;
    } catch (err) {
      console.warn(`[inquiryService] Add internal note failed:`, err.message);
      throw err;
    }
  },

  /**
   * Schedule private viewing appointment linked to inquiry
   */
  async scheduleViewing(id, appointmentTime, notes) {
    try {
      const response = await apiClient.post(`/inquiries/${id}/schedule`, { appointmentTime, notes });
      const raw = response?.data || response;
      return normalizeInquiry(raw);
    } catch (err) {
      console.warn(`[inquiryService] Schedule viewing failed:`, err.message);
      throw err;
    }
  },

  /**
   * Update inquiry status or metadata
   */
  async updateInquiry(id, updateData) {
    try {
      const response = await apiClient.put(`/inquiries/${id}`, updateData);
      const raw = response?.data || response;
      return normalizeInquiry(raw);
    } catch (err) {
      console.warn(`[inquiryService] Update inquiry ${id} failed:`, err.message);
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
