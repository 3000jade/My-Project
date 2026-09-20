import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
  email: z.string().email('Invalid email address format.').optional(),
  phone: z.string().min(7, 'Phone must be at least 7 characters.').optional(),
  avatar: z.string().url('Avatar must be a valid URL.').optional(),
  avatar_url: z.string().url('Avatar URL must be a valid URL.').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters.').optional(),
  prc_license_no: z.string().optional(),
  prc_validity: z.string().optional(),
  dhsud_accreditation_no: z.string().optional(),
  dhsud_validity: z.string().optional(),
  firm_name: z.string().optional(),
  experience_years: z.number().int().nonnegative().optional(),
  role: z.enum(['admin', 'broker', 'agent', 'client']).optional(),
});

export const queryProfileSchema = z.object({
  role: z.enum(['admin', 'broker', 'agent', 'client']).optional(),
  userId: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type QueryProfileInput = z.infer<typeof queryProfileSchema>;
