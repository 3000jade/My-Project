import apiClient from './apiClient';

const cmsService = {
  // Public endpoints
  async getPublicContents(type) {
    const res = await apiClient.get(`/cms/public/${type}`);
    const payload = res?.data ?? res;
    return payload?.items || [];
  },

  async getPublicContentBySlug(type, slug) {
    const res = await apiClient.get(`/cms/public/${type}/${slug}`);
    const payload = res?.data ?? res;
    return payload?.item || null;
  },

  // Admin endpoints
  async listAdminContents(params = {}) {
    const res = await apiClient.get('/cms/admin/contents', { params });
    const payload = res?.data ?? res;
    return payload?.items || [];
  },

  async createContent(payload) {
    const res = await apiClient.post('/cms/admin/contents', payload);
    const data = res?.data ?? res;
    return data?.item;
  },

  async updateContent(id, payload) {
    const res = await apiClient.patch(`/cms/admin/contents/${id}`, payload);
    const data = res?.data ?? res;
    return data?.item;
  },

  async deleteContent(id) {
    await apiClient.delete(`/cms/admin/contents/${id}`);
  },
};

export default cmsService;
