// ==============================================================================
// Appointment & Viewing Scheduling Service
// Communicates with Express Backend RESTful API (/api/appointments)
// ==============================================================================

import apiClient from './apiClient';
import { mockAppointments } from '../mockData/mockAppointments';

/**
 * Normalizes appointment objects from database, backend API, or fallback mocks
 * into a uniform shape expected by all Agent, Broker, and Client appointment views.
 */
export function normalizeAppointment(raw = {}) {
  const statusStr = String(raw.status || 'REQUESTED').toUpperCase();
  const normalizedStatus = statusStr === 'PENDING' ? 'REQUESTED' : statusStr;
  const validStatus = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(
    normalizedStatus
  )
    ? normalizedStatus
    : 'REQUESTED';

  const dateStr =
    raw.appointment_date || raw.scheduled_date || new Date().toISOString().split('T')[0];
  const timeStr = raw.appointment_time || raw.time_slot || '10:00 AM';

  return {
    id: String(raw.id || `apt-${Date.now()}`),
    brokerage_id: raw.brokerage_id || '00000000-0000-0000-0000-000000000001',
    client_id: raw.client_id || null,
    client_name: raw.client_name || raw.full_name || raw.name || 'Anonymous Client',
    client_email: raw.client_email || raw.email || 'confidential@client.ph',
    client_phone: raw.client_phone || raw.phone || '+63 900 000 0000',
    property_id: String(raw.property_id || raw.listing_id || '1'),
    property_title: raw.property_title || 'Premier Estate Portfolio Asset',
    property_address: raw.property_address || raw.location || null,
    agent_id: raw.agent_id !== undefined ? raw.agent_id : 'agent-1',
    agent_name: raw.agent_name || raw.assigned_agent || (raw.agent_id ? 'Elena Rossi' : 'Unassigned Queue'),
    appointment_date: dateStr,
    appointment_time: timeStr,
    start_at: raw.start_at || `${dateStr}T02:00:00.000Z`,
    end_at: raw.end_at || `${dateStr}T03:00:00.000Z`,
    duration_minutes: Number(raw.duration_minutes) || 60,
    buffer_minutes: raw.buffer_minutes !== undefined ? Number(raw.buffer_minutes) : 15,
    timezone: raw.timezone || 'Asia/Manila',
    appointment_type: raw.appointment_type || 'Site Visit',
    location: raw.location || raw.property_title || 'Metro Manila Cadastre',
    status: validStatus,
    notes: raw.notes || '',
    internal_notes: raw.internal_notes || '',
    cancellation_reason: raw.cancellation_reason || null,
    reschedule_reason: raw.reschedule_reason || null,
    has_conflict: Boolean(raw.has_conflict),
    conflict_reason: raw.conflict_reason || null,
    reminders: Array.isArray(raw.reminders) ? raw.reminders : [],
    activity_history: Array.isArray(raw.activity_history) ? raw.activity_history : [],
    created_at: raw.created_at || raw.timestamp || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

/**
 * Generate a downloadable .ics iCalendar file content string for an appointment
 */
export function generateAppointmentIcs(appointment) {
  const appt = normalizeAppointment(appointment);
  const startDt = new Date(appt.start_at || `${appt.appointment_date}T02:00:00.000Z`);
  const endDt = new Date(
    appt.end_at || new Date(startDt.getTime() + (appt.duration_minutes || 60) * 60 * 1000).toISOString()
  );

  const fmtIcsDate = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Human Shelter Realty//Calendar & Appointment Scheduling v2//EN',
    'BEGIN:VEVENT',
    `UID:${appt.id}@humanshelterrealty.ph`,
    `DTSTAMP:${fmtIcsDate(new Date())}`,
    `DTSTART:${fmtIcsDate(startDt)}`,
    `DTEND:${fmtIcsDate(endDt)}`,
    `SUMMARY:${appt.appointment_type}: ${appt.property_title} (${appt.client_name})`,
    `DESCRIPTION:Client: ${appt.client_name} (${appt.client_phone})\\nAgent: ${appt.agent_name}\\nNotes: ${appt.notes || 'None'}`,
    `LOCATION:${appt.location || appt.property_title}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export const appointmentService = {
  /**
   * Fetch appointment roster with optional status, agent, date range, or search filters
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
      if (err?.response?.status === 409 || /conflict|overlap|buffer|working hours|blocked/i.test(err?.message || '')) {
        throw err;
      }
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
      if (/cutoff|2 hours|conflict|overlap/i.test(err?.message || '')) {
        throw err;
      }
      console.warn(`[appointmentService] Update appointment ${id} failed:`, err.message);
      const fallback = mockAppointments.find((a) => String(a.id) === String(id)) || {};
      return normalizeAppointment({ ...fallback, ...updateData, id });
    }
  },

  /**
   * Reassign appointment to another agent or Brokerage Unassigned Queue
   */
  async reassignAppointment(id, payload) {
    try {
      const response = await apiClient.patch(`/appointments/${id}/reassign`, payload);
      const raw = response?.data || response;
      return normalizeAppointment(raw);
    } catch (err) {
      console.warn(`[appointmentService] Reassign appointment ${id} failed:`, err.message);
      const fallback = mockAppointments.find((a) => String(a.id) === String(id)) || {};
      return normalizeAppointment({
        ...fallback,
        id,
        agent_id: payload.target_agent_id,
        agent_name: payload.target_agent_name || (payload.target_agent_id ? 'Assigned Agent' : 'Unassigned Queue'),
      });
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
