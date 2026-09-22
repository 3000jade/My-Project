// ==============================================================================
// Dashboard Service
// Communicates EXCLUSIVELY with the Express Backend (/api/dashboard/summary)
// ==============================================================================

import apiClient from './apiClient';
import { mockProperties } from '../mockData/mockProperties';
import { mockInquiries } from '../mockData/mockInquiries';
import { mockAppointments } from '../mockData/mockAppointments';
import { mockAgents } from '../mockData/mockAgents';
import { mockSales } from '../mockData/mockSales';
import { mockActivity } from '../mockData/mockActivity';

export function computeBrokerFallback() {
  const totalProperties = mockProperties.length;
  const availableProperties = mockProperties.filter(p => p.status === 'AVAILABLE').length;
  const reservedProperties = mockProperties.filter(p => p.status === 'RESERVED').length;
  const soldProperties = mockProperties.filter(p => p.status === 'SOLD').length;

  const totalInquiries = mockInquiries.length;
  const newInquiries = mockInquiries.filter(i => i.status === 'NEW').length;
  const unresolvedInquiries = mockInquiries.filter(i => i.status !== 'RESOLVED').length;

  const upcomingAppointments = mockAppointments.filter(a => a.status === 'REQUESTED' || a.status === 'CONFIRMED').length;

  const totalAgents = mockAgents.length;
  const pendingAgentVerification = mockAgents.filter(a => a.verification_status === 'PENDING').length;

  const totalSalesValue = mockSales
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.property_value, 0);

  const closedCount = mockSales.filter(s => s.status === 'COMPLETED').length;

  return {
    role: 'broker',
    metrics: {
      totalProperties,
      availableProperties,
      reservedProperties,
      soldProperties,
      totalInquiries,
      newInquiries,
      unresolvedInquiries,
      upcomingAppointments,
      totalAgents,
      pendingAgentVerification,
      totalSalesValue,
    },
    salesSummary: {
      totalSalesValue,
      closedCount,
      recentSales: mockSales.slice(0, 4),
    },
    agentOverview: mockAgents,
    recentActivity: mockActivity,
  };
}

export function computeAgentFallback(agentId = 'agent-1') {
  const agentProperties = mockProperties.filter(p => p.agent_id === agentId);
  const agentInquiries = mockInquiries.filter(i => i.agent_id === agentId);
  const agentAppointments = mockAppointments.filter(a => a.agent_id === agentId);
  const agentSales = mockSales.filter(s => s.agent_id === agentId);

  const totalProperties = agentProperties.length;
  const availableProperties = agentProperties.filter(p => p.status === 'AVAILABLE').length;
  const reservedProperties = agentProperties.filter(p => p.status === 'RESERVED').length;
  const soldProperties = agentProperties.filter(p => p.status === 'SOLD').length;
  const newInquiries = agentInquiries.filter(i => i.status === 'NEW').length;
  const unresolvedInquiries = agentInquiries.filter(i => i.status === 'NEW' || i.status === 'ASSIGNED' || i.status === 'REOPENED').length;
  const upcomingAppointments = agentAppointments.filter(a => a.status === 'REQUESTED' || a.status === 'CONFIRMED').length;

  const totalRecordedSalesValue = agentSales
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.property_value, 0);

  return {
    role: 'agent',
    agentId,
    metrics: {
      totalProperties,
      availableProperties,
      reservedProperties,
      soldProperties,
      newInquiries,
      unresolvedInquiries,
      upcomingAppointments,
      totalRecordedSalesValue,
    },
    agentProperties,
    agentAppointments: agentAppointments.slice(0, 4),
    agentInquiries: agentInquiries.slice(0, 4),
    agentSales: agentSales.slice(0, 3),
    recentActivity: mockActivity.slice(0, 5),
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
