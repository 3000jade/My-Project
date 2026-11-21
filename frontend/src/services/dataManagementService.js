import apiClient from './apiClient';

const DEFAULT_SUMMARY = {
  tables: [],
  estimatedBytes: 0,
  cooldownRemainingSec: 0,
  lastBackupAt: null,
  recentBackups: [],
};

const dataManagementService = {
  async getBackupSummary() {
    const res = await apiClient.get('/data-management/backup/summary');
    const payload = res?.data ?? res;
    return payload?.tables ? payload : DEFAULT_SUMMARY;
  },

  async exportSnapshot() {
    const res = await apiClient.get('/data-management/backup/export');
    return res?.data ?? res;
  },
};

export default dataManagementService;
