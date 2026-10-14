import apiClient from './apiClient';

/**
 * Service handling Agent Invitations and Onboarding Registration
 */
export const invitationService = {
  /**
   * Validates an invitation token before loading onboarding form
   * @param {string} token
   * @returns {Promise<{ valid: boolean, email?: string, expiresAt?: string, error?: string }>}
   */
  async validateToken(token) {
    const res = await apiClient.get(`/invitations/validate/${token}`);
    return res?.data || res;
  },

  /**
   * Creates and emails a new single-use agent invitation (Broker / Admin only)
   * @param {{ email: string, brokerAgency?: string, message?: string }} payload
   */
  async createInvitation(payload) {
    const res = await apiClient.post('/invitations', payload);
    return res?.data || res;
  },

  /**
   * Lists agent invitations with optional status filter
   * @param {string} [status]
   */
  async getInvitations(status = 'ALL') {
    const res = await apiClient.get('/invitations', {
      params: status && status !== 'ALL' ? { status } : {},
    });
    return res?.data || res || [];
  },

  /**
   * Resends invitation email with new token & refreshed 72h expiry
   * @param {string} id
   */
  async resendInvitation(id) {
    const res = await apiClient.post(`/invitations/${id}/resend`);
    return res?.data || res;
  },

  /**
   * Revokes an active invitation
   * @param {string} id
   */
  async revokeInvitation(id) {
    const res = await apiClient.delete(`/invitations/${id}`);
    return res?.data || res;
  },

  /**
   * Completes agent onboarding registration with credentials and document attachments
   * @param {object} registrationData
   */
  async registerAgent(registrationData) {
    const res = await apiClient.post('/auth/register-agent', registrationData);
    return res?.data || res;
  },
};

export default invitationService;
