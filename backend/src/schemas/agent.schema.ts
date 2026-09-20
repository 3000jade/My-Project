import { z } from 'zod';

export const updateAgentStatusSchema = z.object({
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED']),
  notes: z.string().optional(),
});

export const queryAgentSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export type UpdateAgentStatusInput = z.infer<typeof updateAgentStatusSchema>;
export type QueryAgentInput = z.infer<typeof queryAgentSchema>;
