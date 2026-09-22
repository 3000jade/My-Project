import { z } from 'zod';

export const queryNotificationSchema = z.object({
  status: z.enum(['ALL', 'UNREAD', 'READ']).optional().default('ALL'),
  type: z.enum(['inquiry', 'verification', 'appointment', 'sale', 'property']).optional(),
  role: z.enum(['broker', 'agent', 'admin', 'client']).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const updateNotificationReadSchema = z.object({
  is_read: z.boolean(),
});

export const createNotificationSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  message: z.string().min(5, 'Message must be at least 5 characters.'),
  type: z.enum(['inquiry', 'verification', 'appointment', 'sale', 'property']).default('inquiry'),
  related_record: z.string().optional(),
  user_id: z.string().optional(),
  role: z.enum(['broker', 'agent', 'admin', 'client']).optional().default('broker'),
});

export type QueryNotificationInput = z.infer<typeof queryNotificationSchema>;
export type UpdateNotificationReadInput = z.infer<typeof updateNotificationReadSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
