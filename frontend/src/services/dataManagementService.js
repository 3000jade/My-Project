import apiClient from './apiClient';

const dataManagementService = {
  async previewImport(resource, rows) {
    const res = await apiClient.post('/data-management/import/preview', { resource, rows });
    return res.data?.data;
  },

  async commitImport(resource, rows) {
    const res = await apiClient.post('/data-management/import/commit', { resource, rows });
    return res.data?.data;
  },

  async exportRecords(resource, format = 'json') {
    const res = await apiClient.get(`/data-management/export/${resource}`, {
      params: { format },
    });
    return res.data?.data;
  },

  async getDataHealth() {
    const res = await apiClient.get('/data-management/health');
    return res.data?.data?.resources || [];
  },

  async archiveRecord(resource, id) {
    const res = await apiClient.post('/data-management/archive', { resource, id });
    return res.data?.data;
  },

  async restoreRecord(resource, id) {
    const res = await apiClient.post('/data-management/restore', { resource, id });
    return res.data?.data;
  },

  async exportSnapshot() {
    const res = await apiClient.get('/data-management/backup/export');
    return res.data?.data;
  },
};

export default dataManagementService;
