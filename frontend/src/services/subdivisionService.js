import apiClient from './apiClient';

export const subdivisionService = {
  async getSubdivisions() {
    return apiClient.get('/subdivisions');
  },

  async getSubdivisionById(id) {
    return apiClient.get(`/subdivisions/${id}`);
  },

  async createSubdivision(data) {
    return apiClient.post('/subdivisions', data);
  },

  async uploadPlan(projectId, formData) {
    return apiClient.post(`/subdivisions/${projectId}/plans`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getLots(projectId) {
    return apiClient.get(`/subdivisions/${projectId}/lots`);
  },

  async saveDraftLots(projectId, lots) {
    return apiClient.put(`/subdivisions/${projectId}/lots`, { lots });
  },

  async validateMap(projectId) {
    return apiClient.post(`/subdivisions/${projectId}/validate`);
  },

  async publishMap(projectId, notes = '') {
    return apiClient.post(`/subdivisions/${projectId}/publish`, { notes });
  },

  async listVersions(projectId) {
    return apiClient.get(`/subdivisions/${projectId}/versions`);
  },

  async rollbackVersion(projectId, versionNumber) {
    return apiClient.post(`/subdivisions/${projectId}/versions/${versionNumber}/restore`);
  },

  async getPublicMap(projectId) {
    return apiClient.get(`/subdivisions/${projectId}/public-map`);
  },

  async aiDetectBoundary(payload) {
    return apiClient.post('/subdivisions/ai/detect-boundary', payload);
  },

  async aiRecognizeOcr(payload) {
    return apiClient.post('/subdivisions/ai/recognize-labels', payload);
  },

  async autoLayoutPlan(projectId, options = {}) {
    return apiClient.post(`/subdivisions/${projectId}/ai/auto-layout`, options);
  },
};

export default subdivisionService;
