import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AgentAvailabilityService } from './agentAvailability.service';
import { AgentService } from './agent.service';
import { DEFAULT_BROKERAGE_ID } from './agentTeam.service';
import type {
  AppointmentItemDTO,
  AppointmentStatus,
  AppointmentType,
  AppointmentReminderDTO,
  AppointmentActivityEntryDTO,
  ReassignAppointmentRequestDTO,
} from '../../../shared/types/appointment';

export type AppointmentItem = AppointmentItemDTO;

export interface AppointmentFilterQuery {
  status?: string;
  agentId?: string;
  clientId?: string;
  clientEmail?: string;
  brokerageId?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AppointmentActorContext {
  id?: string;
  email?: string;
  role?: string;
  brokerage_id?: string | null;
}

const META_MARKER = '\n<!--APPT_V2_META:';
const META_END = '-->';

/**
 * Parse a date string (YYYY-MM-DD) and time string ("10:00 AM" or "14:30") in Asia/Manila (UTC+8)
 * into a canonical UTC ISO timestamp, plus formatted 12-hour time and 24-hour HH:mm.
 */
export function parseManilaDateTime(
  dateStr: string,
  timeStr: string
): {
  startAtIso: string;
  dateFormatted: string;
  time12h: string;
  time24h: string;
  dayOfWeek: string;
} {
  const cleanDate = (dateStr || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const rawTime = (timeStr || '10:00 AM').trim();

  let hours24 = 10;
  let minutes = 0;

  const amPmMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const h24Match = rawTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (amPmMatch) {
    let h = parseInt(amPmMatch[1], 10);
    minutes = parseInt(amPmMatch[2], 10);
    const period = amPmMatch[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    hours24 = h;
  } else if (h24Match) {
    hours24 = parseInt(h24Match[1], 10);
    minutes = parseInt(h24Match[2], 10);
  } else if (rawTime.includes('T')) {
    const parsed = new Date(rawTime);
    if (!Number.isNaN(parsed.getTime())) {
      const manilaMs = parsed.getTime() + 8 * 60 * 60 * 1000;
      const manilaDate = new Date(manilaMs);
      hours24 = manilaDate.getUTCHours();
      minutes = manilaDate.getUTCMinutes();
    }
  }

  const hh24 = String(hours24).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const time24h = `${hh24}:${mm}`;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const h12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const time12h = `${String(h12).padStart(2, '0')}:${mm} ${period}`;

  // Construct Date in Asia/Manila (+08:00)
  const isoWithOffset = `${cleanDate}T${hh24}:${mm}:00+08:00`;
  const utcDate = new Date(isoWithOffset);
  const startAtIso = Number.isNaN(utcDate.getTime())
    ? new Date().toISOString()
    : utcDate.toISOString();

  // Compute day of week in Asia/Manila
  const manilaDayDate = new Date(`${cleanDate}T12:00:00Z`);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[manilaDayDate.getUTCDay()] || 'monday';

  return {
    startAtIso,
    dateFormatted: cleanDate,
    time12h,
    time24h,
    dayOfWeek,
  };
}

export function buildRemindersForStart(
  startAtIso: string,
  status: AppointmentStatus,
  existingReminders?: AppointmentReminderDTO[]
): AppointmentReminderDTO[] {
  const startMs = new Date(startAtIso).getTime();
  const r24Iso = new Date(startMs - 24 * 60 * 60 * 1000).toISOString();
  const r2Iso = new Date(startMs - 2 * 60 * 60 * 1000).toISOString();

  const isTerminal = status === 'CANCELLED' || status === 'COMPLETED' || status === 'NO_SHOW';
  const r24Id = existingReminders?.find((r) => r.type === '24h_prior')?.id || `rem-24h-${crypto.randomUUID().slice(0, 8)}`;
  const r2Id = existingReminders?.find((r) => r.type === '2h_prior')?.id || `rem-2h-${crypto.randomUUID().slice(0, 8)}`;

  return [
    {
      id: r24Id,
      type: '24h_prior',
      scheduled_for: r24Iso,
      status: isTerminal ? 'cancelled' : 'pending',
      sent_at: null,
    },
    {
      id: r2Id,
      type: '2h_prior',
      scheduled_for: r2Iso,
      status: isTerminal ? 'cancelled' : 'pending',
      sent_at: null,
    },
  ];
}

function encodeNotesWithMetadata(
  cleanNotes: string | undefined,
  item: AppointmentItemDTO
): string {
  const meta = {
    brokerage_id: item.brokerage_id,
    client_id: item.client_id || null,
    property_title: item.property_title,
    property_address: item.property_address || null,
    agent_name: item.agent_name,
    appointment_date: item.appointment_date,
    appointment_time: item.appointment_time,
    start_at: item.start_at,
    end_at: item.end_at,
    duration_minutes: item.duration_minutes,
    buffer_minutes: item.buffer_minutes,
    timezone: item.timezone,
    appointment_type: item.appointment_type,
    location: item.location || null,
    extended_status: item.status,
    internal_notes: item.internal_notes || '',
    cancellation_reason: item.cancellation_reason || null,
    reschedule_reason: item.reschedule_reason || null,
    reminders: item.reminders || [],
    activity_history: item.activity_history || [],
  };
  return `${cleanNotes || ''}${META_MARKER}${JSON.stringify(meta)}${META_END}`;
}

function decodeNotesAndMetadata(rawNotes: string | null | undefined): {
  cleanNotes: string;
  meta: Record<string, any>;
} {
  if (!rawNotes) return { cleanNotes: '', meta: {} };
  const idx = rawNotes.indexOf(META_MARKER);
  if (idx === -1) return { cleanNotes: rawNotes, meta: {} };

  const cleanNotes = rawNotes.slice(0, idx);
  const endIdx = rawNotes.indexOf(META_END, idx + META_MARKER.length);
  const jsonPart =
    endIdx !== -1
      ? rawNotes.slice(idx + META_MARKER.length, endIdx)
      : rawNotes.slice(idx + META_MARKER.length);

  try {
    const meta = JSON.parse(jsonPart);
    return { cleanNotes, meta };
  } catch {
    return { cleanNotes: rawNotes, meta: {} };
  }
}

function makeSeedAppointment(raw: {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_id: string;
  property_title: string;
  agent_id: string;
  agent_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
  location?: string;
}): AppointmentItemDTO {
  const parsed = parseManilaDateTime(raw.appointment_date, raw.appointment_time);
  const durationMinutes = 60;
  const bufferMinutes = 15;
  const endAtIso = new Date(new Date(parsed.startAtIso).getTime() + durationMinutes * 60 * 1000).toISOString();

  return {
    id: raw.id,
    brokerage_id: DEFAULT_BROKERAGE_ID,
    client_id: null,
    client_name: raw.client_name,
    client_email: raw.client_email,
    client_phone: raw.client_phone,
    property_id: raw.property_id,
    property_title: raw.property_title,
    property_address: raw.location || 'Metro Manila Luxury Cadastre',
    agent_id: raw.agent_id,
    agent_name: raw.agent_name,
    appointment_date: parsed.dateFormatted,
    appointment_time: parsed.time12h,
    start_at: parsed.startAtIso,
    end_at: endAtIso,
    duration_minutes: durationMinutes,
    buffer_minutes: bufferMinutes,
    timezone: 'Asia/Manila',
    appointment_type: raw.appointment_type,
    location: raw.location || raw.property_title,
    status: raw.status,
    notes: raw.notes,
    internal_notes: '',
    cancellation_reason: null,
    reschedule_reason: null,
    has_conflict: false,
    conflict_reason: null,
    reminders: buildRemindersForStart(parsed.startAtIso, raw.status),
    activity_history: [
      {
        id: `act-${raw.id}`,
        action: 'created',
        actor_id: raw.agent_id,
        actor_role: 'agent',
        new_status: raw.status,
        new_start_at: parsed.startAtIso,
        new_agent_id: raw.agent_id,
        timestamp: raw.created_at,
      },
    ],
    created_at: raw.created_at,
    updated_at: raw.created_at,
  };
}

const seedAppointments: AppointmentItemDTO[] = [
  makeSeedAppointment({
    id: 'apt-201',
    client_name: 'Atty. Fernando Zobel',
    client_email: 'fzobel@ayala.ph',
    client_phone: '+63 917 888 1234',
    property_id: '1',
    property_title: 'Ayala Alabang Estate',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
    appointment_date: '2026-09-08',
    appointment_time: '10:00 AM',
    appointment_type: 'Site Visit',
    status: 'REQUESTED',
    notes: 'Client requested entry gate gatepass clearance for two vehicles. Bring site architectural plans.',
    created_at: '2026-09-04T10:00:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-202',
    client_name: 'Dr. Beatrice Ramos-Tan',
    client_email: 'b.ramos@medclinic.ph',
    client_phone: '+63 920 901 4455',
    property_id: '2',
    property_title: 'The Proscenium Penthouse',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
    appointment_date: '2026-09-09',
    appointment_time: '02:30 PM',
    appointment_type: 'Document Signing',
    status: 'CONFIRMED',
    notes: 'Reservation agreement signing and issuance of earnest deposit receipt at Rockwell Club.',
    created_at: '2026-09-02T14:30:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-203',
    client_name: 'Engr. Mateo Villanueva',
    client_email: 'mvillanueva@buildcon.ph',
    client_phone: '+63 918 333 7654',
    property_id: '3',
    property_title: 'Forbes Park Modern Residence',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
    appointment_date: '2026-09-11',
    appointment_time: '11:00 AM',
    appointment_type: 'Site Visit',
    status: 'CONFIRMED',
    notes: "Structural ocular inspection with buyer's certified structural engineer.",
    created_at: '2026-08-30T11:00:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-204',
    client_name: 'Patricia Sy-Cojuangco',
    client_email: 'psy@syinvest.com',
    client_phone: '+63 917 222 9901',
    property_id: '4',
    property_title: 'One Serendra Garden Villa',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
    appointment_date: '2026-08-25',
    appointment_time: '03:00 PM',
    appointment_type: 'Document Signing',
    status: 'COMPLETED',
    notes: 'Turnover deed execution completed. Key handover ceremony executed.',
    created_at: '2026-08-15T15:00:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-205',
    client_name: 'Gregory Delgado',
    client_email: 'gdelgado@shipping.com',
    client_phone: '+63 917 111 4433',
    property_id: '5',
    property_title: 'Tagaytay Ridge Sanctuary',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
    appointment_date: '2026-08-19',
    appointment_time: '01:00 PM',
    appointment_type: 'Site Visit',
    status: 'CANCELLED',
    notes: 'Client rescheduled due to heavy monsoon rains in Tagaytay.',
    created_at: '2026-08-10T13:00:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-206',
    client_name: 'Michael Anthony Cruz',
    client_email: 'mcruz@globalcap.sg',
    client_phone: '+65 9123 4567',
    property_id: '6',
    property_title: 'Aurelia Residences Horizon Suite',
    agent_id: 'agent-2',
    agent_name: 'Alexander Sterling',
    appointment_date: '2026-09-10',
    appointment_time: '04:00 PM',
    appointment_type: 'Online Consultation',
    status: 'CONFIRMED',
    notes: 'Zoom virtual walkthrough and 3D digital twin presentation.',
    created_at: '2026-09-05T16:00:00.000Z',
  }),
  makeSeedAppointment({
    id: 'apt-207',
    client_name: 'Corazon Aquino-Dee',
    client_email: 'cdee@deegroup.com',
    client_phone: '+63 917 444 8877',
    property_id: '7',
    property_title: 'Greenhills West Contemporary Villa',
    agent_id: 'agent-2',
    agent_name: 'Alexander Sterling',
    appointment_date: '2026-09-12',
    appointment_time: '09:30 AM',
    appointment_type: 'Site Visit',
    status: 'REQUESTED',
    notes: 'Inspection of interior master suite and garden drainage systems.',
    created_at: '2026-09-01T09:30:00.000Z',
  }),
];

let localAppointmentsState: AppointmentItemDTO[] = [...seedAppointments];

// Per-agent booking mutex lock queue to prevent concurrent double-booking race conditions
const agentBookingLocks = new Map<string, Promise<any>>();

async function withAgentLock<T>(agentId: string, fn: () => Promise<T>): Promise<T> {
  const key = agentId || 'unassigned';
  const prev = agentBookingLocks.get(key) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  agentBookingLocks.set(key, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

function normalizeDbRow(row: any): AppointmentItemDTO {
  const { cleanNotes, meta } = decodeNotesAndMetadata(row.notes);

  let dateStr = row.appointment_date || meta.appointment_date || '';
  let timeStr = meta.appointment_time || '';

  if ((!dateStr || !timeStr) && row.appointment_time) {
    const rawT = String(row.appointment_time);
    if (rawT.includes('T') || rawT.includes('-')) {
      const dt = new Date(rawT);
      if (!Number.isNaN(dt.getTime())) {
        const manilaDt = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
        if (!dateStr) dateStr = manilaDt.toISOString().slice(0, 10);
        if (!timeStr) {
          const h = manilaDt.getUTCHours();
          const m = String(manilaDt.getUTCMinutes()).padStart(2, '0');
          const p = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          timeStr = `${String(h12).padStart(2, '0')}:${m} ${p}`;
        }
      }
    } else if (!timeStr) {
      timeStr = rawT;
    }
  }

  const parsed = parseManilaDateTime(dateStr || '2026-09-08', timeStr || '10:00 AM');
  const durationMinutes = Number(row.duration_minutes || meta.duration_minutes || 60);
  const bufferMinutes = Number(row.buffer_minutes ?? meta.buffer_minutes ?? 15);
  const startAt = row.start_at || meta.start_at || parsed.startAtIso;
  const endAt =
    row.end_at ||
    meta.end_at ||
    new Date(new Date(startAt).getTime() + durationMinutes * 60 * 1000).toISOString();

  let statusUpper = String(meta.extended_status || row.status || 'REQUESTED').toUpperCase();
  if (statusUpper === 'PENDING') statusUpper = 'REQUESTED';

  return {
    id: row.id,
    brokerage_id: row.brokerage_id || meta.brokerage_id || DEFAULT_BROKERAGE_ID,
    client_id: row.client_id || meta.client_id || null,
    client_name: row.client_name || row.name || 'Client',
    client_email: row.client_email || row.email || '',
    client_phone: row.client_phone || row.phone || '',
    property_id: row.property_id || '1',
    property_title: row.property_title || meta.property_title || 'Premier Estate Asset',
    property_address: row.property_address || meta.property_address || null,
    agent_id: row.agent_id !== undefined ? row.agent_id : 'agent-1',
    agent_name: row.agent_name || meta.agent_name || (row.agent_id ? 'Elena Rossi' : 'Unassigned Queue'),
    appointment_date: parsed.dateFormatted,
    appointment_time: parsed.time12h,
    start_at: startAt,
    end_at: endAt,
    duration_minutes: durationMinutes,
    buffer_minutes: bufferMinutes,
    timezone: row.timezone || meta.timezone || 'Asia/Manila',
    appointment_type: (row.appointment_type || meta.appointment_type || 'Site Visit') as AppointmentType,
    location: row.location || meta.location || row.property_title || meta.property_title || null,
    status: statusUpper as AppointmentStatus,
    notes: cleanNotes,
    internal_notes: row.internal_notes ?? meta.internal_notes ?? '',
    cancellation_reason: row.cancellation_reason ?? meta.cancellation_reason ?? null,
    reschedule_reason: row.reschedule_reason ?? meta.reschedule_reason ?? null,
    reminders: Array.isArray(row.reminders)
      ? row.reminders
      : Array.isArray(meta.reminders) && meta.reminders.length > 0
      ? meta.reminders
      : buildRemindersForStart(startAt, statusUpper as AppointmentStatus),
    activity_history: Array.isArray(row.activity_history)
      ? row.activity_history
      : Array.isArray(meta.activity_history)
      ? meta.activity_history
      : [],
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

export class AppointmentService {
  public static resetStore(): void {
    localAppointmentsState = seedAppointments.map((a) => JSON.parse(JSON.stringify(a)));
    agentBookingLocks.clear();
  }

  public static getLocalAppointments(): AppointmentItemDTO[] {
    return localAppointmentsState;
  }

  /**
   * Evaluate whether an appointment conflicts with an agent's blackout dates, working hours, or other active bookings
   */
  public static async evaluateConflictsForAppointment(
    item: AppointmentItemDTO,
    allAppointments: AppointmentItemDTO[]
  ): Promise<{ has_conflict: boolean; conflict_reason: string | null }> {
    if (!item.agent_id || item.status === 'CANCELLED' || item.status === 'NO_SHOW' || item.status === 'COMPLETED') {
      return { has_conflict: false, conflict_reason: null };
    }

    const schedule = await AgentAvailabilityService.getAvailability(item.agent_id);

    // 1. Check blackout / blocked periods
    if (Array.isArray(schedule.blackout_dates)) {
      for (const blk of schedule.blackout_dates) {
        const sDate = (blk.startDate || '').slice(0, 10);
        const eDate = (blk.endDate || '').slice(0, 10);
        if (sDate && eDate && item.appointment_date >= sDate && item.appointment_date <= eDate) {
          return {
            has_conflict: true,
            conflict_reason: `Overlaps agent blocked period (${sDate} to ${eDate}${blk.reason ? `: ${blk.reason}` : ''})`,
          };
        }
      }
    }

    // 2. Check overlapping active appointments (REQUESTED or CONFIRMED) for the same agent
    const itemStart = new Date(item.start_at).getTime();
    const itemEndWithBuffer = new Date(item.end_at).getTime() + (item.buffer_minutes ?? 15) * 60 * 1000;

    for (const other of allAppointments) {
      if (other.id === item.id) continue;
      if (other.agent_id !== item.agent_id) continue;
      if (other.status !== 'REQUESTED' && other.status !== 'CONFIRMED') continue;

      const otherStart = new Date(other.start_at).getTime();
      const otherEndWithBuffer = new Date(other.end_at).getTime() + (other.buffer_minutes ?? 15) * 60 * 1000;

      if (itemStart < otherEndWithBuffer && otherStart < itemEndWithBuffer) {
        return {
          has_conflict: true,
          conflict_reason: `Time-slot conflict or buffer overlap with ${other.client_name} (${other.appointment_time})`,
        };
      }
    }

    return { has_conflict: false, conflict_reason: null };
  }

  /**
   * Validate that a proposed slot for an agent is within working hours, not on a blocked date,
   * and does not overlap any existing REQUESTED or CONFIRMED appointment (+ buffer).
   */
  public static async validateSlotAvailability(params: {
    agentId: string | null | undefined;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    bufferMinutes: number;
    excludeAppointmentId?: string;
    bypassWorkingHoursCheck?: boolean;
  }): Promise<void> {
    const {
      agentId,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      bufferMinutes,
      excludeAppointmentId,
      bypassWorkingHoursCheck,
    } = params;

    if (!agentId) return; // Unassigned queue bookings don't check individual agent schedule

    const parsed = parseManilaDateTime(appointmentDate, appointmentTime);
    const startMs = new Date(parsed.startAtIso).getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;
    const endWithBufferMs = endMs + bufferMinutes * 60 * 1000;

    // Check if agent has an explicit schedule or exists in AgentService
    const cachedSchedule = AgentAvailabilityService.getCachedAvailability(agentId);
    const knownAgent = AgentService.getLocalAgentById(agentId);
    const shouldEnforceWorkingHours =
      !bypassWorkingHoursCheck && Boolean(cachedSchedule || knownAgent);

    const schedule = await AgentAvailabilityService.getAvailability(agentId);

    // 1. Check blackout / blocked periods
    if (Array.isArray(schedule.blackout_dates)) {
      for (const blk of schedule.blackout_dates) {
        const sDate = (blk.startDate || '').slice(0, 10);
        const eDate = (blk.endDate || '').slice(0, 10);
        if (sDate && eDate && parsed.dateFormatted >= sDate && parsed.dateFormatted <= eDate) {
          throw new Error(
            `Selected date (${parsed.dateFormatted}) falls within an agent blocked/blackout period${
              blk.reason ? `: ${blk.reason}` : ''
            }.`
          );
        }
      }
    }

    // 2. Check weekly working hours if applicable
    if (shouldEnforceWorkingHours && schedule.weekly_schedule) {
      const dayWindow = schedule.weekly_schedule[parsed.dayOfWeek];
      if (dayWindow) {
        if (!dayWindow.enabled) {
          throw new Error(
            `Agent is unavailable on ${parsed.dayOfWeek}s (outside working hours / closed).`
          );
        }
        const [startH, startM] = (dayWindow.start || '09:00').split(':').map(Number);
        const [endH, endM] = (dayWindow.end || '18:00').split(':').map(Number);
        const [reqH, reqM] = parsed.time24h.split(':').map(Number);

        const windowStartMins = startH * 60 + (startM || 0);
        const windowEndMins = endH * 60 + (endM || 0);
        const reqStartMins = reqH * 60 + (reqM || 0);
        const reqEndMins = reqStartMins + durationMinutes;

        if (reqStartMins < windowStartMins || reqEndMins > windowEndMins) {
          throw new Error(
            `Requested slot (${parsed.time12h}) is outside the agent's working hours (${dayWindow.start} - ${dayWindow.end}).`
          );
        }
      }
    }

    // 3. Check overlapping active appointments (REQUESTED or CONFIRMED) + buffer
    for (const existing of localAppointmentsState) {
      if (excludeAppointmentId && existing.id === excludeAppointmentId) continue;
      if (existing.agent_id !== agentId) continue;
      if (existing.status !== 'REQUESTED' && existing.status !== 'CONFIRMED') continue;

      const exStartMs = new Date(existing.start_at).getTime();
      const exBuffer = existing.buffer_minutes ?? 15;
      const exEndWithBufferMs = new Date(existing.end_at).getTime() + exBuffer * 60 * 1000;

      if (startMs < exEndWithBufferMs && exStartMs < endWithBufferMs) {
        throw new Error(
          `Time-slot conflict or ${bufferMinutes}-minute buffer overlap with existing ${existing.status.toLowerCase()} appointment for ${existing.client_name} at ${existing.appointment_time}.`
        );
      }
    }
  }

  /**
   * List appointments with filtering and dynamic conflict evaluation
   */
  public static async listAppointments(query?: AppointmentFilterQuery): Promise<AppointmentItemDTO[]> {
    let combined = [...localAppointmentsState];

    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabaseAdmin
          .from('appointments')
          .select('*')
          .order('appointment_time', { ascending: false });

        if (query?.agentId && query.agentId !== 'ALL') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.agentId);
          if (isUuid) {
            dbQuery = dbQuery.eq('agent_id', query.agentId);
          }
        }

        const { data, error } = await dbQuery;
        if (data && !error && data.length > 0) {
          const dbNormalized = data.map(normalizeDbRow);
          const byId = new Map<string, AppointmentItemDTO>();
          for (const item of dbNormalized) byId.set(item.id, item);
          for (const local of localAppointmentsState) {
            if (!byId.has(local.id)) byId.set(local.id, local);
          }
          combined = Array.from(byId.values());
        }
      } catch (err: any) {
        logger.warn('[AppointmentService] Supabase fetch warning, using local state:', err.message);
      }
    }

    // Evaluate conflicts dynamically against current agent schedules (batch-fetching unique agent schedules once)
    const uniqueAgentIds = Array.from(
      new Set(combined.map((a) => a.agent_id).filter(Boolean))
    ) as string[];
    await Promise.all(uniqueAgentIds.map((aid) => AgentAvailabilityService.getAvailability(aid)));

    const evaluated: AppointmentItemDTO[] = [];
    for (const item of combined) {
      const conflictInfo = await this.evaluateConflictsForAppointment(item, combined);
      evaluated.push({
        ...item,
        has_conflict: conflictInfo.has_conflict,
        conflict_reason: conflictInfo.conflict_reason,
      });
    }

    let results = evaluated;

    if (query?.brokerageId) {
      results = results.filter(
        (a) => (a.brokerage_id || DEFAULT_BROKERAGE_ID) === query.brokerageId
      );
    }

    if (query?.status && query.status !== 'ALL') {
      const target = query.status.toUpperCase() === 'PENDING' ? 'REQUESTED' : query.status.toUpperCase();
      results = results.filter((a) => (a.status || '').toUpperCase() === target);
    }

    if (query?.agentId && query.agentId !== 'ALL') {
      if (query.agentId === 'UNASSIGNED') {
        results = results.filter((a) => !a.agent_id);
      } else {
        results = results.filter((a) => a.agent_id === query.agentId);
      }
    }

    if (query?.clientId || query?.clientEmail) {
      results = results.filter(
        (a) =>
          (query.clientId && a.client_id === query.clientId) ||
          (query.clientEmail &&
            a.client_email &&
            a.client_email.toLowerCase() === query.clientEmail.toLowerCase())
      );
    }

    if (query?.propertyId) {
      results = results.filter((a) => a.property_id === query.propertyId);
    }

    if (query?.startDate) {
      results = results.filter((a) => a.appointment_date >= query.startDate!.slice(0, 10));
    }

    if (query?.endDate) {
      results = results.filter((a) => a.appointment_date <= query.endDate!.slice(0, 10));
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.client_name.toLowerCase().includes(q) ||
          a.property_title.toLowerCase().includes(q) ||
          (a.agent_name && a.agent_name.toLowerCase().includes(q)) ||
          (a.notes && a.notes.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Get appointment by ID
   */
  public static async getAppointmentById(id: string): Promise<AppointmentItemDTO | null> {
    const localFound = localAppointmentsState.find((a) => a.id === id);
    if (localFound) {
      const conflictInfo = await this.evaluateConflictsForAppointment(localFound, localAppointmentsState);
      return {
        ...localFound,
        has_conflict: conflictInfo.has_conflict,
        conflict_reason: conflictInfo.conflict_reason,
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('appointments')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          return normalizeDbRow(data);
        }
      } catch (err: any) {
        logger.warn(`[AppointmentService] DB getById failed for ${id}:`, err.message);
      }
    }

    return null;
  }

  /**
   * Create an appointment with availability, working-hours, blackout, and buffer conflict validation
   */
  public static async createAppointment(
    data: Partial<AppointmentItemDTO>,
    options?: { bypassWorkingHoursCheck?: boolean; actor?: AppointmentActorContext }
  ): Promise<AppointmentItemDTO> {
    const agentId = data.agent_id !== undefined ? data.agent_id : 'agent-1';

    return withAgentLock(agentId || 'unassigned', async () => {
      const appointmentDate = data.appointment_date || new Date().toISOString().split('T')[0];
      const appointmentTime = data.appointment_time || '10:00 AM';
      const durationMinutes = Number(data.duration_minutes) || 60;
      const bufferMinutes = data.buffer_minutes !== undefined ? Number(data.buffer_minutes) : 15;

      await this.validateSlotAvailability({
        agentId,
        appointmentDate,
        appointmentTime,
        durationMinutes,
        bufferMinutes,
        bypassWorkingHoursCheck: options?.bypassWorkingHoursCheck,
      });

      const parsed = parseManilaDateTime(appointmentDate, appointmentTime);
      const endAtIso = new Date(
        new Date(parsed.startAtIso).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      const agentObj = agentId ? AgentService.getLocalAgentById(agentId) : undefined;
      const resolvedBrokerageId =
        data.brokerage_id ||
        options?.actor?.brokerage_id ||
        agentObj?.brokerage_id ||
        DEFAULT_BROKERAGE_ID;
      const resolvedAgentName =
        data.agent_name || agentObj?.name || (agentId ? 'Elena Rossi' : 'Unassigned Queue');

      const nowIso = new Date().toISOString();
      const status: AppointmentStatus = (data.status?.toUpperCase() as AppointmentStatus) || 'REQUESTED';

      const newAppointment: AppointmentItemDTO = {
        id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        brokerage_id: resolvedBrokerageId,
        client_id: data.client_id || null,
        client_name: data.client_name || 'Anonymous Client',
        client_email: data.client_email || 'client@estate.ph',
        client_phone: data.client_phone || '+63 900 000 0000',
        property_id: data.property_id || '1',
        property_title: data.property_title || 'Premier Estate Portfolio Asset',
        property_address: data.property_address || data.location || null,
        agent_id: agentId,
        agent_name: resolvedAgentName,
        appointment_date: parsed.dateFormatted,
        appointment_time: parsed.time12h,
        start_at: parsed.startAtIso,
        end_at: endAtIso,
        duration_minutes: durationMinutes,
        buffer_minutes: bufferMinutes,
        timezone: data.timezone || 'Asia/Manila',
        appointment_type: (data.appointment_type as AppointmentType) || 'Site Visit',
        location: data.location || data.property_title || 'Premier Estate Portfolio Asset',
        status,
        notes: data.notes || '',
        internal_notes: data.internal_notes || '',
        cancellation_reason: null,
        reschedule_reason: null,
        has_conflict: false,
        conflict_reason: null,
        reminders: buildRemindersForStart(parsed.startAtIso, status),
        activity_history: [
          {
            id: `act-${Date.now()}`,
            action: 'created',
            actor_id: options?.actor?.id || data.client_id || null,
            actor_role: options?.actor?.role || 'client',
            new_status: status,
            new_start_at: parsed.startAtIso,
            new_agent_id: agentId,
            timestamp: nowIso,
          },
        ],
        created_by: options?.actor?.id || data.client_id || null,
        updated_by: options?.actor?.id || data.client_id || null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const isPropUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        newAppointment.property_id
      );
      const isAgentUuid =
        !newAppointment.agent_id ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          newAppointment.agent_id
        );

      if (isSupabaseConfigured && isPropUuid && isAgentUuid) {
        try {
          const dbStatus =
            newAppointment.status === 'NO_SHOW'
              ? 'cancelled'
              : newAppointment.status.toLowerCase();

          const { data: inserted, error } = await supabaseAdmin
            .from('appointments')
            .insert({
              client_name: newAppointment.client_name,
              client_email: newAppointment.client_email,
              client_phone: newAppointment.client_phone,
              property_id: newAppointment.property_id,
              agent_id: newAppointment.agent_id,
              appointment_time: newAppointment.start_at,
              status: dbStatus,
              notes: encodeNotesWithMetadata(newAppointment.notes, newAppointment),
            })
            .select()
            .single();

          if (inserted && !error) {
            newAppointment.id = inserted.id;
          }
        } catch (err: any) {
          logger.warn('[AppointmentService] Supabase insert fallback to memory:', err.message);
        }
      }

      localAppointmentsState.unshift(newAppointment);
      return newAppointment;
    });
  }

  /**
   * Update appointment status, reschedule, or notes with role & cutoff validation
   */
  public static async updateAppointment(
    id: string,
    updateData: Partial<AppointmentItemDTO>,
    actor?: AppointmentActorContext
  ): Promise<AppointmentItemDTO | null> {
    const item = await this.getAppointmentById(id);
    if (!item) return null;

    // Client 2-hour cutoff rule for self-service cancellation or rescheduling
    if (actor?.role === 'client') {
      const isRescheduling =
        (updateData.appointment_date && updateData.appointment_date !== item.appointment_date) ||
        (updateData.appointment_time && updateData.appointment_time !== item.appointment_time);
      const isCancelling = updateData.status?.toUpperCase() === 'CANCELLED';

      if (isRescheduling || isCancelling) {
        const msUntilStart = new Date(item.start_at).getTime() - Date.now();
        const twoHoursMs = 2 * 60 * 60 * 1000;
        if (msUntilStart < twoHoursMs) {
          throw new Error(
            'Clients can only reschedule or cancel appointments at least 2 hours before the scheduled start time (cutoff window).'
          );
        }
      }
    }

    const nextDate = updateData.appointment_date || item.appointment_date;
    const nextTime = updateData.appointment_time || item.appointment_time;
    const nextDuration = Number(updateData.duration_minutes || item.duration_minutes || 60);
    const nextBuffer =
      updateData.buffer_minutes !== undefined
        ? Number(updateData.buffer_minutes)
        : item.buffer_minutes ?? 15;

    const scheduleChanged =
      nextDate !== item.appointment_date ||
      nextTime !== item.appointment_time ||
      nextDuration !== item.duration_minutes;

    let nextStatus: AppointmentStatus = updateData.status
      ? ((updateData.status.toUpperCase() === 'PENDING'
          ? 'REQUESTED'
          : updateData.status.toUpperCase()) as AppointmentStatus)
      : item.status;

    if (scheduleChanged && nextStatus !== 'CANCELLED' && nextStatus !== 'NO_SHOW') {
      await this.validateSlotAvailability({
        agentId: item.agent_id,
        appointmentDate: nextDate,
        appointmentTime: nextTime,
        durationMinutes: nextDuration,
        bufferMinutes: nextBuffer,
        excludeAppointmentId: id,
      });
    }

    const parsed = parseManilaDateTime(nextDate, nextTime);
    const nextStartAt = scheduleChanged ? parsed.startAtIso : item.start_at;
    const nextEndAt = scheduleChanged
      ? new Date(new Date(parsed.startAtIso).getTime() + nextDuration * 60 * 1000).toISOString()
      : item.end_at;

    const nextReminders = buildRemindersForStart(nextStartAt, nextStatus, item.reminders);
    const nowIso = new Date().toISOString();

    const history: AppointmentActivityEntryDTO[] = [...(item.activity_history || [])];
    if (scheduleChanged) {
      history.push({
        id: `act-${Date.now()}-resched`,
        action: 'rescheduled',
        actor_id: actor?.id || null,
        actor_role: actor?.role || null,
        previous_start_at: item.start_at,
        new_start_at: nextStartAt,
        reason: updateData.reschedule_reason || null,
        timestamp: nowIso,
      });
    }

    if (nextStatus !== item.status) {
      const actionMap: Record<AppointmentStatus, AppointmentActivityEntryDTO['action']> = {
        REQUESTED: 'created',
        CONFIRMED: 'confirmed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'no_show',
      };
      history.push({
        id: `act-${Date.now()}-status`,
        action: actionMap[nextStatus] || 'notes_updated',
        actor_id: actor?.id || null,
        actor_role: actor?.role || null,
        previous_status: item.status,
        new_status: nextStatus,
        reason: updateData.cancellation_reason || updateData.reschedule_reason || null,
        timestamp: nowIso,
      });
    }

    const updatedItem: AppointmentItemDTO = {
      ...item,
      ...updateData,
      status: nextStatus,
      appointment_date: parsed.dateFormatted,
      appointment_time: parsed.time12h,
      start_at: nextStartAt,
      end_at: nextEndAt,
      duration_minutes: nextDuration,
      buffer_minutes: nextBuffer,
      notes: updateData.notes !== undefined ? updateData.notes : item.notes,
      internal_notes:
        updateData.internal_notes !== undefined ? updateData.internal_notes : item.internal_notes,
      cancellation_reason:
        updateData.cancellation_reason !== undefined
          ? updateData.cancellation_reason
          : item.cancellation_reason,
      reschedule_reason:
        updateData.reschedule_reason !== undefined
          ? updateData.reschedule_reason
          : item.reschedule_reason,
      reminders: nextReminders,
      activity_history: history,
      updated_by: actor?.id || item.updated_by || null,
      updated_at: nowIso,
    };

    const index = localAppointmentsState.findIndex((a) => a.id === id);
    if (index !== -1) {
      localAppointmentsState[index] = updatedItem;
    } else {
      localAppointmentsState.push(updatedItem);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isSupabaseConfigured && isUuid) {
      try {
        const dbStatus =
          updatedItem.status === 'NO_SHOW'
            ? 'cancelled'
            : updatedItem.status.toLowerCase();

        await supabaseAdmin
          .from('appointments')
          .update({
            status: dbStatus,
            appointment_time: updatedItem.start_at,
            notes: encodeNotesWithMetadata(updatedItem.notes, updatedItem),
          })
          .eq('id', id);
      } catch (err: any) {
        logger.warn(`[AppointmentService] Supabase update failed for ${id}:`, err.message);
      }
    }

    return updatedItem;
  }

  /**
   * Reassign an appointment to another agent (or Brokerage Unassigned Queue = null)
   * while validating target agent schedule conflicts and recording audit history.
   */
  public static async reassignAppointment(
    id: string,
    payload: ReassignAppointmentRequestDTO,
    actor?: AppointmentActorContext
  ): Promise<AppointmentItemDTO | null> {
    const item = await this.getAppointmentById(id);
    if (!item) return null;

    const targetAgentId = payload.target_agent_id ?? null;

    if (targetAgentId && (item.status === 'REQUESTED' || item.status === 'CONFIRMED')) {
      await this.validateSlotAvailability({
        agentId: targetAgentId,
        appointmentDate: item.appointment_date,
        appointmentTime: item.appointment_time,
        durationMinutes: item.duration_minutes || 60,
        bufferMinutes: item.buffer_minutes ?? 15,
        excludeAppointmentId: id,
      });
    }

    let targetAgentName = 'Unassigned Queue';
    if (targetAgentId) {
      const targetAgent = await AgentService.getAgentById(targetAgentId);
      targetAgentName = targetAgent?.name || 'Assigned Agent';
    }

    const nowIso = new Date().toISOString();
    const history: AppointmentActivityEntryDTO[] = [
      ...(item.activity_history || []),
      {
        id: `act-${Date.now()}-reassign`,
        action: 'reassigned',
        actor_id: actor?.id || null,
        actor_role: actor?.role || 'broker',
        previous_agent_id: item.agent_id,
        new_agent_id: targetAgentId,
        reason: payload.reason,
        timestamp: nowIso,
      },
    ];

    const updatedItem: AppointmentItemDTO = {
      ...item,
      agent_id: targetAgentId,
      agent_name: targetAgentName,
      activity_history: history,
      updated_by: actor?.id || null,
      updated_at: nowIso,
    };

    const index = localAppointmentsState.findIndex((a) => a.id === id);
    if (index !== -1) {
      localAppointmentsState[index] = updatedItem;
    } else {
      localAppointmentsState.push(updatedItem);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isTargetUuid =
      !targetAgentId ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAgentId);

    if (isSupabaseConfigured && isUuid && isTargetUuid) {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({
            agent_id: targetAgentId,
            notes: encodeNotesWithMetadata(updatedItem.notes, updatedItem),
          })
          .eq('id', id);
      } catch (err: any) {
        logger.warn(`[AppointmentService] Supabase reassign failed for ${id}:`, err.message);
      }
    }

    return updatedItem;
  }

  /**
   * Sanitize an appointment payload for Client / Public viewers (strips internal_notes)
   */
  public static sanitizeForClient(item: AppointmentItemDTO): Omit<AppointmentItemDTO, 'internal_notes'> {
    const clone: any = { ...item };
    delete clone.internal_notes;
    return clone;
  }

  /**
   * Delete appointment
   */
  public static async deleteAppointment(id: string): Promise<boolean> {
    const index = localAppointmentsState.findIndex((a) => a.id === id);
    if (index !== -1) {
      localAppointmentsState.splice(index, 1);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isSupabaseConfigured && isUuid) {
      try {
        await supabaseAdmin.from('appointments').delete().eq('id', id);
      } catch (err: any) {
        logger.warn(`[AppointmentService] Supabase delete failed for ${id}:`, err.message);
      }
    }

    return true;
  }
}

export default AppointmentService;
