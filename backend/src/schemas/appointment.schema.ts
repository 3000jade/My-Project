import { z } from 'zod';

export const createAppointmentSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  client_phone: z.string().min(1, 'Contact phone is required'),
  client_id: z.string().optional().nullable(),
  brokerage_id: z.string().optional(),
  property_id: z.string().min(1, 'Property ID is required'),
  property_title: z.string().optional(),
  property_address: z.string().optional().nullable(),
  agent_id: z.string().optional().nullable(),
  agent_name: z.string().optional(),
  appointment_date: z.string().min(1, 'Appointment date is required'),
  appointment_time: z.string().min(1, 'Appointment time is required'),
  duration_minutes: z.coerce.number().int().min(15).max(240).default(60),
  buffer_minutes: z.coerce.number().int().min(0).max(60).default(15),
  timezone: z.string().default('Asia/Manila'),
  appointment_type: z
    .enum([
      'Site Visit',
      'Online Consultation',
      'Document Signing',
      'Property Inspection',
      'Closing Meeting',
    ])
    .default('Site Visit'),
  location: z.string().optional().nullable(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(15).max(240).optional(),
  buffer_minutes: z.coerce.number().int().min(0).max(60).optional(),
  appointment_type: z
    .enum([
      'Site Visit',
      'Online Consultation',
      'Document Signing',
      'Property Inspection',
      'Closing Meeting',
    ])
    .optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  cancellation_reason: z.string().optional().nullable(),
  reschedule_reason: z.string().optional().nullable(),
});

export const reassignAppointmentSchema = z.object({
  target_agent_id: z.string().nullable(),
  reason: z.string().min(1, 'Reassignment reason is required'),
});

export const queryAppointmentSchema = z.object({
  status: z.string().optional(),
  agentId: z.string().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ReassignAppointmentInput = z.infer<typeof reassignAppointmentSchema>;
export type QueryAppointmentInput = z.infer<typeof queryAppointmentSchema>;
