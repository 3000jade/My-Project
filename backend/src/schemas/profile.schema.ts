import { z } from 'zod';

const optionalUrlOrEmpty = z.union([
  z.string().url('Avatar must be a valid URL.'),
  z.literal(''),
]).optional();

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
  first_name: z.string().trim().max(80, 'First name cannot exceed 80 characters.').optional(),
  middle_name: z.string().trim().max(80, 'Middle name cannot exceed 80 characters.').optional(),
  last_name: z.string().trim().max(80, 'Last name cannot exceed 80 characters.').optional(),
  display_name: z.string().trim().max(120, 'Display name cannot exceed 120 characters.').optional(),
  phone: z.union([z.string().min(7, 'Phone must be at least 7 characters.'), z.literal('')]).optional(),
  avatar: optionalUrlOrEmpty,
  avatar_url: optionalUrlOrEmpty,
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters.').optional(),
  prc_license_no: z.string().optional(),
  prc_validity: z.string().optional(),
  dhsud_accreditation_no: z.string().optional(),
  dhsud_validity: z.string().optional(),
  firm_name: z.string().optional(),
  experience_years: z.number().int().nonnegative().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Prefer not to say']).nullable().optional(),
  emergency_contact_name: z.string().max(120).nullable().optional(),
  emergency_contact_phone: z.string().max(30).nullable().optional(),
  preferred_location: z.string().optional(),
  preferredLocation: z.string().optional(),
  investment_budget: z.string().optional(),
  investmentBudget: z.string().optional(),
  notification_preferences: z.record(z.string(), z.boolean()).optional(),
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  ui_preferences: z.record(z.string(), z.any()).optional(),
  uiPreferences: z.record(z.string(), z.any()).optional(),
  font_size_preference: z.enum(['compact', 'standard', 'comfortable']).optional(),
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED']).optional(),
  role: z.enum(['admin', 'broker', 'agent', 'client']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
