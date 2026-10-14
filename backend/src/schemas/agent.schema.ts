import { z } from 'zod';

export const updateAgentStatusSchema = z.object({
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED']),
  rejection_remarks: z.string().optional(),
  suspension_reason: z.string().optional(),
  suspension_notes: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAgentProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().min(7, 'Valid contact number is required').max(25).optional(),
  bio: z.string().max(1500).optional(),
  avatar: z.string().url('Invalid avatar URL format').optional(),
  prc_license_no: z.string().min(5, 'PRC License Number is required').optional(),
  prc_validity: z.string().optional(),
  dhsud_accreditation_no: z.string().min(5, 'DHSUD Accreditation is required').optional(),
  dhsud_validity: z.string().optional(),
  experience_years: z.number().int().min(0).max(60).optional(),
});

export const queryAgentSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export type UpdateAgentStatusInput = z.infer<typeof updateAgentStatusSchema>;
export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;
export type QueryAgentInput = z.infer<typeof queryAgentSchema>;
