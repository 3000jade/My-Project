import { z } from 'zod';

export const createInquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  propertyId: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  preferredDate: z.string().optional(),
  type: z.enum(['general', 'tour', 'offer']).default('general'),
});

export const updateInquirySchema = z.object({
  status: z.enum(['new', 'contacted', 'scheduled', 'closed', 'assigned', 'resolved', 'reopened']).optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
});

export const queryInquirySchema = z.object({
  status: z.string().optional(),
  agentId: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
export type QueryInquiryInput = z.infer<typeof queryInquirySchema>;
