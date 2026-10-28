import { z } from 'zod';

export const DealStageEnum = z.enum([
  'IN_NEGOTIATION',
  'UNDER_CONTRACT',
  'CONVEYANCE',
  'COMPLETED',
]);

export const PayoutStatusEnum = z.enum([
  'UNPAID',
  'PARTIALLY_RELEASED',
  'PAID',
]);

export const querySaleSchema = z.object({
  status: z.enum(['ALL', 'COMPLETED', 'PENDING', 'CANCELLED']).optional().default('ALL'),
  dealStage: z.enum(['ALL', 'IN_NEGOTIATION', 'UNDER_CONTRACT', 'CONVEYANCE', 'COMPLETED']).optional(),
  agentId: z.string().optional(),
  propertyId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const createSaleSchema = z.object({
  property_id: z.string().min(1, 'Property ID is required.'),
  property_title: z.string().min(2, 'Property title is required.'),
  property_location: z.string().min(2, 'Property location is required.'),
  client_name: z.string().min(2, 'Client name is required.'),
  agent_id: z.string().min(1, 'Agent ID is required.'),
  agent_name: z.string().min(2, 'Agent name is required.'),
  sale_date: z.string().min(1, 'Sale date is required.'),
  property_value: z.number().positive('Property valuation must be greater than zero.'),
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']).default('PENDING'),
  deal_stage: DealStageEnum.optional(),
  commission_rate: z.number().min(0).max(100).optional().default(5.0),
  agent_split_percentage: z.number().min(0).max(100).optional().default(60.0),
  payout_status: PayoutStatusEnum.optional().default('UNPAID'),
  notes: z.string().optional().default(''),
});

export const updateSaleSchema = z.object({
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']).optional(),
  deal_stage: DealStageEnum.optional(),
  payout_status: PayoutStatusEnum.optional(),
  notes: z.string().optional(),
  property_value: z.number().positive().optional(),
  sale_date: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  agent_split_percentage: z.number().min(0).max(100).optional(),
});

export type QuerySaleInput = {
  status?: 'ALL' | 'COMPLETED' | 'PENDING' | 'CANCELLED';
  dealStage?: 'ALL' | 'IN_NEGOTIATION' | 'UNDER_CONTRACT' | 'CONVEYANCE' | 'COMPLETED';
  agentId?: string;
  propertyId?: string;
  search?: string;
  limit?: number;
};
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type DealStage = z.infer<typeof DealStageEnum>;
export type PayoutStatus = z.infer<typeof PayoutStatusEnum>;
