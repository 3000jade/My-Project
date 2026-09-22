import { z } from 'zod';

export const queryDashboardSchema = z.object({
  role: z.enum(['broker', 'agent']),
  agentId: z.string().optional(),
});

export type QueryDashboardInput = z.infer<typeof queryDashboardSchema>;
