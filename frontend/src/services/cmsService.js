import apiClient from './apiClient';

const cmsService = {
  // Public endpoints
  async getPublicContents(type) {
    const res = await apiClient.get(`/cms/public/${type}`);
    return res.data?.data?.items || [];
  },

  async getPublicContentBySlug(type, slug) {
    const res = await apiClient.get(`/cms/public/${type}/${slug}`);
    return res.data?.data?.item || null;
  },

  async getPublicCollections() {
    const res = await apiClient.get('/cms/public/collections');
    return res.data?.data?.collections || [];
  },

  // Admin endpoints
  async listAdminContents(params = {}) {
    const res = await apiClient.get('/cms/admin/contents', { params });
    return res.data?.data?.items || [];
  },

  async createContent(payload) {
    const res = await apiClient.post('/cms/admin/contents', payload);
    return res.data?.data?.item;
  },

  async updateContent(id, payload) {
    const res = await apiClient.patch(`/cms/admin/contents/${id}`, payload);
    return res.data?.data?.item;
  },

  async deleteContent(id) {
    await apiClient.delete(`/cms/admin/contents/${id}`);
  },

  async listAdminCollections() {
    const res = await apiClient.get('/cms/admin/collections');
    return res.data?.data?.collections || [];
  },

  async createCollection(payload) {
    const res = await apiClient.post('/cms/admin/collections', payload);
    return res.data?.data?.collection;
  },

  async updateCollection(id, payload) {
    const res = await apiClient.patch(`/cms/admin/collections/${id}`, payload);
    return res.data?.data?.collection;
  },

  async deleteCollection(id) {
    await apiClient.delete(`/cms/admin/collections/${id}`);
  },

  async syncCollectionItems(id, items) {
    await apiClient.put(`/cms/admin/collections/${id}/items`, { items });
  },
};

export default cmsService;
