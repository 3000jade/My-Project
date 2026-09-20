import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long.')
    .trim(),
  tagline: z.string().trim().optional(),
  price: z
    .number()
    .positive('Price must be greater than zero.'),
  location: z
    .object({
      address: z.string().min(1, 'Address is required.').trim(),
      city: z.string().min(1, 'City is required.').trim(),
      state: z.string().trim().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
  specs: z
    .object({
      beds: z.number().int().nonnegative().optional(),
      baths: z.number().int().nonnegative().optional(),
      sqft: z.number().positive().optional(),
      propertyType: z.string().optional(),
      yearBuilt: z.number().int().optional(),
    })
    .optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string().url('Images must be valid URLs.')).optional(),
  architecturalStyle: z.string().optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().default('available'),
});

export const queryPropertySchema = z.object({
  city: z.string().trim().optional(),
  propertyType: z.string().trim().optional(),
  transactionType: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  status: z.string().optional(),
  agentId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type QueryPropertyInput = z.infer<typeof queryPropertySchema>;
