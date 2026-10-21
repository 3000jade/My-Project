import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Invalid email address format').trim().toLowerCase(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim().optional(),
  phone: z.string().min(7, 'Contact number is invalid').max(25).trim().optional(),
  role: z.enum(['agent', 'broker']).optional().default('agent'),
  brokerAgency: z.string().max(120).trim().optional(),
  brokerageId: z.string().optional(),
  teamId: z.string().nullable().optional(),
  canCreateListings: z.boolean().optional(),
  message: z.string().max(500).trim().optional(),
  allowReissue: z.boolean().optional(),
});

export const queryInvitationSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type QueryInvitationInput = z.infer<typeof queryInvitationSchema>;
