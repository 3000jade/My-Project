// ==============================================================================
// Shared Appointment & Calendar Scheduling Contracts (v2)
// ==============================================================================

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentType =
  | 'Site Visit'
  | 'Online Consultation'
  | 'Document Signing'
  | 'Property Inspection'
  | 'Closing Meeting';

export type ReminderType = '24h_prior' | '2h_prior';

export type ReminderStatus = 'pending' | 'sent' | 'cancelled';

export interface AppointmentReminderDTO {
  id: string;
  type: ReminderType;
  scheduled_for: string; // ISO UTC timestamp
  status: ReminderStatus;
  sent_at?: string | null;
}

export interface AppointmentActivityEntryDTO {
  id: string;
  action:
    | 'created'
    | 'confirmed'
    | 'rescheduled'
    | 'cancelled'
    | 'completed'
    | 'no_show'
    | 'reassigned'
    | 'notes_updated';
  actor_id?: string | null;
  actor_role?: string | null;
  previous_status?: AppointmentStatus | null;
  new_status?: AppointmentStatus | null;
  previous_start_at?: string | null;
  new_start_at?: string | null;
  previous_agent_id?: string | null;
  new_agent_id?: string | null;
  reason?: string | null;
  timestamp: string;
}

export interface AppointmentItemDTO {
  id: string;
  brokerage_id: string;
  client_id?: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_id: string;
  property_title: string;
  property_address?: string | null;
  agent_id: string | null;
  agent_name: string;
  appointment_date: string; // YYYY-MM-DD in Asia/Manila
  appointment_time: string; // e.g. "10:00 AM" or "14:00"
  start_at: string; // Canonical ISO UTC timestamp
  end_at: string; // Canonical ISO UTC timestamp
  duration_minutes: number; // 30 | 60 | 90 | 120 (default 60)
  buffer_minutes: number; // default 15
  timezone: string; // default 'Asia/Manila'
  appointment_type: AppointmentType;
  location?: string | null;
  status: AppointmentStatus;
  notes?: string;
  internal_notes?: string;
  cancellation_reason?: string | null;
  reschedule_reason?: string | null;
  has_conflict?: boolean;
  conflict_reason?: string | null;
  reminders?: AppointmentReminderDTO[];
  activity_history?: AppointmentActivityEntryDTO[];
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReassignAppointmentRequestDTO {
  target_agent_id: string | null;
  reason: string;
}
