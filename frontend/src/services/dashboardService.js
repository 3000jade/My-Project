// ==============================================================================
// Dashboard Service
// Communicates EXCLUSIVELY with the Express Backend (/api/dashboard/summary)
// ==============================================================================

import apiClient from './apiClient';

export function computeBrokerFallback() {
  return {
    role: 'broker',
    metrics: {
      totalProperties: 0,
      availableProperties: 0,
      reservedProperties: 0,
      soldProperties: 0,
      totalInquiries: 0,
      newInquiries: 0,
      unresolvedInquiries: 0,
      upcomingAppointments: 0,
      totalAgents: 0,
      pendingAgentVerification: 0,
      totalSalesValue: 0,
    },
    salesSummary: {
      totalSalesValue: 0,
      closedCount: 0,
      recentSales: [],
    },
    agentOverview: [],
    recentActivity: [],
  };
}

export function computeAgentFallback(agentId = '') {
  return {
    role: 'agent',
    agentId,
    metrics: {
      totalProperties: 0,
      availableProperties: 0,
      reservedProperties: 0,
      soldProperties: 0,
      newInquiries: 0,
      unresolvedInquiries: 0,
      upcomingAppointments: 0,
      totalRecordedSalesValue: 0,
    },
    agentProperties: [],
    agentAppointments: [],
    agentInquiries: [],
    agentSales: [],
    recentActivity: [],
  };
}

export const dashboardService = {
  /**
   * Fetch consolidated dashboard summary
   */
  async getDashboardSummary({ role = 'broker', agentId } = {}) {
    try {
      const response = await apiClient.get('/dashboard/summary', {
        params: { role, agentId },
      });
      if (response && response.data) {
        return response.data;
      }
      return role === 'agent' ? computeAgentFallback(agentId) : computeBrokerFallback();
    } catch (err) {
      console.warn('[dashboardService] getDashboardSummary fallback:', err.message);
      return role === 'agent' ? computeAgentFallback(agentId) : computeBrokerFallback();
    }
  },
};

export default dashboardService;
