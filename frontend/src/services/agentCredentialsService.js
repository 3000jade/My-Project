import apiClient from './apiClient';

export const agentCredentialsService = {
  /**
   * Upload an agent credential file with invitation token or session auth
   */
  async uploadCredential({ file, token, kind = 'other' }) {
    const formData = new FormData();
    formData.append('file', file);
    if (token) {
      formData.append('token', token);
    }
    formData.append('kind', kind);

    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['x-invitation-token'] = token;
    }

    const response = await apiClient.post('/agent-credentials/upload', formData, { headers });
    return response.data?.document;
  },

  /**
   * Derive authenticated/authorized internal content stream URL for a document
   */
  getDocumentContentUrl(documentId, token) {
    if (!documentId) return '#';
    const base = `/api/agent-credentials/${documentId}/content`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },

  /**
   * List credential documents for a specific agent
   */
  async listAgentCredentials(agentId) {
    const response = await apiClient.get(`/agent-credentials/agent/${agentId}`);
    return response.data?.documents || [];
  },
};

export default agentCredentialsService;
