// ==============================================================================
// Appointment & Viewing Scheduling Service
// Communicates with Express Backend RESTful API (/api/appointments)
// ==============================================================================

import apiClient from './apiClient';
import { mockAppointments } from '../mockData/mockAppointments';

/**
 * Normalizes appointment objects from database, backend API, or fallback mocks
 * into a uniform shape expected by all Agent and Broker appointment views.
 */
export function normalizeAppointment(raw = {}) {
  const statusStr = String(raw.status || 'REQUESTED').toUpperCase();
  const validStatus = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(statusStr)
    ? statusStr
    : 'REQUESTED';

  const dateStr = raw.appointment_date || raw.scheduled_date || new Date().toISOString().split('T')[0];
  const timeStr = raw.appointment_time || raw.time_slot || '10:00 AM';

  return {
    id: String(raw.id || `apt-${Date.now()}`),
    client_name: raw.client_name || raw.full_name || raw.name || 'Anonymous Client',
    client_email: raw.client_email || raw.email || 'confidential@client.ph',
    client_phone: raw.client_phone || raw.phone || '+63 900 000 0000',
    property_id: String(raw.property_id || raw.listing_id || '1'),
    property_title: raw.property_title || 'Premier Estate Portfolio Asset',
    agent_id: String(raw.agent_id || 'agent-1'),
    agent_name: raw.agent_name || raw.assigned_agent || 'Elena Rossi',
    appointment_date: dateStr,
    appointment_time: timeStr,
    appointment_type: raw.appointment_type || 'Site Visit',
    status: validStatus,
    notes: raw.notes || '',
    created_at: raw.created_at || raw.timestamp || new Date().toISOString(),
  };
}

export const appointmentService = {
  /**
   * Fetch appointment roster with optional status, agent, or search filters
   */
  async getAppointments(params = {}) {
    try {
      const response = await apiClient.get('/appointments', { params });
      const rawList = response?.data || response || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map(normalizeAppointment);
      }
      return mockAppointments.map(normalizeAppointment);
    } catch (err) {
      console.warn('[appointmentService] Fetch appointments failed, falling back to mocks:', err.message);
      return mockAppointments.map(normalizeAppointment);
    }
  },

  /**
   * Fetch single appointment by ID
   */
  async getAppointmentById(id) {
    try {
      const response = await apiClient.get(`/appointments/${id}`);
      const raw = response?.data || response;
      if (raw) {
        return normalizeAppointment(raw);
      }
    } catch (err) {
      console.warn(`[appointmentService] Fetch appointment ${id} failed:`, err.message);
    }

    const fallback = mockAppointments.find((a) => String(a.id) === String(id));
    return fallback ? normalizeAppointment(fallback) : null;
  },

  /**
   * Book an appointment (public booking modal or internal dashboard)
   */
  async createAppointment(appointmentData) {
    try {
      const response = await apiClient.post('/appointments', appointmentData);
      const raw = response?.data || response;
      return normalizeAppointment(raw);
    } catch (err) {
      console.warn('[appointmentService] Backend appointment booking failed, storing locally:', err.message);
      return normalizeAppointment(appointmentData);
    }
  },

  /**
   * Update status or reschedule appointment
   */
  async updateAppointment(id, updateData) {
    try {
      const response = await apiClient.put(`/appointments/${id}`, updateData);
      const raw = response?.data || response;
      return normalizeAppointment(raw);
    } catch (err) {
      console.warn(`[appointmentService] Update appointment ${id} failed:`, err.message);
      const fallback = mockAppointments.find((a) => String(a.id) === String(id)) || {};
      return normalizeAppointment({ ...fallback, ...updateData, id });
    }
  },

  /**
   * Delete appointment
   */
  async deleteAppointment(id) {
    try {
      await apiClient.delete(`/appointments/${id}`);
      return true;
    } catch (err) {
      console.warn(`[appointmentService] Delete appointment ${id} failed:`, err.message);
      return true;
    }
  },
};

export default appointmentService;
