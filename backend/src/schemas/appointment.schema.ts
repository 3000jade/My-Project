import { z } from 'zod';

export const createAppointmentSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  client_phone: z.string().min(1, 'Contact phone is required'),
  property_id: z.string().min(1, 'Property ID is required'),
  property_title: z.string().optional(),
  agent_id: z.string().optional(),
  agent_name: z.string().optional(),
  appointment_date: z.string().min(1, 'Appointment date is required'),
  appointment_time: z.string().min(1, 'Appointment time is required'),
  appointment_type: z.enum(['Site Visit', 'Online Consultation', 'Document Signing']).default('Site Visit'),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  notes: z.string().optional(),
});

export const queryAppointmentSchema = z.object({
  status: z.string().optional(),
  agentId: z.string().optional(),
  search: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type QueryAppointmentInput = z.infer<typeof queryAppointmentSchema>;
