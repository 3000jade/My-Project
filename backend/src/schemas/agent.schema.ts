import { z } from 'zod';

export const updateAgentStatusSchema = z.object({
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED']),
  rejection_remarks: z.string().optional(),
  suspension_reason: z.string().optional(),
  suspension_notes: z.string().optional(),
  membership_status: z.enum(['invited', 'active', 'suspended', 'departed']).optional(),
  onboarding_status: z.enum(['incomplete_profile', 'pending_review', 'rejected', 'complete']).optional(),
  routing_availability: z.enum(['available', 'paused', 'vacation']).optional(),
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
  team_id: z.string().nullable().optional(),
  can_create_listings: z.boolean().optional(),
  access_tier: z.enum(['standard_agent', 'senior_agent', 'team_lead']).optional(),
  commission_tier: z.string().max(100).nullable().optional(),
  location_branch: z.string().max(120).nullable().optional(),
  emergency_contact_name: z.string().max(120).nullable().optional(),
  emergency_contact_phone: z.string().max(30).nullable().optional(),
  internal_notes: z.string().max(2000).nullable().optional(),
  routing_availability: z.enum(['available', 'paused', 'vacation']).optional(),
});

export const queryAgentSchema = z.object({
  status: z.string().optional(),
  membership_status: z.string().optional(),
  onboarding_status: z.string().optional(),
  routing_availability: z.string().optional(),
  license_status: z.string().optional(),
  team_id: z.string().optional(),
  brokerage_id: z.string().optional(),
  search: z.string().optional(),
});

export const updateAgentAvailabilitySchema = z.object({
  routing_availability: z.enum(['available', 'paused', 'vacation']).optional(),
  weekly_schedule: z.array(
    z.object({
      day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
      enabled: z.boolean(),
      start: z.string(),
      end: z.string(),
    })
  ).optional(),
  blackout_dates: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      reason: z.string(),
    })
  ).optional(),
  max_concurrent_leads: z.number().int().min(1).max(200).optional(),
  away_message: z.string().max(500).nullable().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(120),
  description: z.string().max(500).nullable().optional(),
  lead_agent_id: z.string().nullable().optional(),
  brokerage_id: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  lead_agent_id: z.string().nullable().optional(),
});

export const transferResponsibilitiesSchema = z.object({
  targetAgentId: z.string().nullable().optional(),
  scopes: z.array(z.enum(['listings', 'inquiries', 'appointments'])).optional(),
  itemIds: z
    .object({
      listings: z.array(z.string()).optional(),
      inquiries: z.array(z.string()).optional(),
      appointments: z.array(z.string()).optional(),
    })
    .optional(),
  triggerType: z.enum(['manual', 'suspension', 'departure']).optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const departAgentSchema = z.object({
  targetAgentId: z.string().nullable().optional(),
  departureReason: z.string().min(3, 'Departure reason is required').max(500),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().optional(),
});

export type UpdateAgentStatusInput = z.infer<typeof updateAgentStatusSchema>;
export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;
export type QueryAgentInput = z.infer<typeof queryAgentSchema>;
export type UpdateAgentAvailabilityInput = z.infer<typeof updateAgentAvailabilitySchema>;
