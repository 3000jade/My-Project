import { z } from 'zod';

export const querySaleSchema = z.object({
  status: z.enum(['ALL', 'COMPLETED', 'PENDING', 'CANCELLED']).optional().default('ALL'),
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
  notes: z.string().optional().default(''),
});

export const updateSaleSchema = z.object({
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  property_value: z.number().positive().optional(),
  sale_date: z.string().optional(),
});

export type QuerySaleInput = z.infer<typeof querySaleSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
