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
  listPriceCurrency: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY']).optional().default('PHP'),
  originalListPrice: z.number().positive().optional(),
  associationFee: z.number().nonnegative().optional(),
  associationFeeFrequency: z.string().trim().optional(),
  taxAnnualAmount: z.number().nonnegative().optional(),
  location: z
    .object({
      address: z.string().min(1, 'Address is required.').trim(),
      unparsedAddress: z.string().trim().optional(),
      subdivisionName: z.string().trim().optional(),
      city: z.string().min(1, 'City is required.').trim(),
      state: z.string().trim().optional(),
      stateOrProvince: z.string().trim().optional(),
      postalCode: z.string().trim().optional(),
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
      bedroomsTotal: z.number().int().nonnegative().optional(),
      bathroomsTotalInteger: z.number().int().nonnegative().optional(),
      bathroomsFull: z.number().int().nonnegative().optional(),
      bathroomsHalf: z.number().int().nonnegative().optional(),
      storiesTotal: z.number().int().nonnegative().optional(),
      sqft: z.number().positive().optional(),
      livingArea: z.number().positive().optional(),
      livingAreaUnits: z.enum(['Square Meters', 'Square Feet']).optional(),
      lotSizeArea: z.number().nonnegative().optional(),
      lotSizeUnits: z.string().optional(),
      propertyType: z.string().optional(),
      propertySubType: z.string().optional(),
      yearBuilt: z.number().int().optional(),
      parkingTotal: z.number().int().nonnegative().optional(),
    })
    .optional(),
  features: z.array(z.string()).optional(),
  interiorFeatures: z.array(z.string()).optional(),
  exteriorFeatures: z.array(z.string()).optional(),
  images: z.array(z.string().url('Images must be valid URLs.')).optional(),
  media: z.array(z.object({
    mediaKey: z.string().optional(),
    mediaUrl: z.string().url(),
    orderIndex: z.number().int().nonnegative().optional(),
    mediaCategory: z.enum(['Photo', 'FloorPlan', 'Video', 'VirtualTour', 'Document']).optional(),
    shortDescription: z.string().optional(),
  })).optional(),
  rooms: z.array(z.object({
    roomType: z.string(),
    roomLevel: z.string().optional(),
    roomLength: z.number().optional(),
    roomWidth: z.number().optional(),
    roomDimensionsUnits: z.enum(['Meters', 'Feet']).optional(),
    roomFeatures: z.array(z.string()).optional(),
  })).optional(),
  confidential: z.object({
    privateRemarks: z.string().optional(),
    showingInstructions: z.string().optional(),
    lockboxType: z.string().optional(),
    lockboxLocation: z.string().optional(),
    lockboxCode: z.string().optional(),
    buyerAgencyCompensation: z.string().optional(),
    sellerDirectPhone: z.string().optional(),
    sellerDirectEmail: z.string().email().optional(),
    expirationDate: z.string().optional(),
  }).optional(),
  publicRemarks: z.string().optional(),
  customResoAttributes: z.record(z.unknown()).optional(),
  architecturalStyle: z.string().optional(),
  standardStatus: z.enum(['Draft', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired']).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().default('available'),
  isFeatured: z.boolean().optional().default(false),
});

export const queryPropertySchema = z.object({
  city: z.string().trim().optional(),
  propertyType: z.string().trim().optional(),
  transactionType: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  beds: z.coerce.number().int().nonnegative().optional(),
  baths: z.coerce.number().int().nonnegative().optional(),
  status: z.string().optional(),
  standardStatus: z.string().optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  agentId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  // RESO OData query parameters
  $filter: z.string().optional(),
  $select: z.string().optional(),
  $expand: z.string().optional(),
  $top: z.coerce.number().int().positive().max(100).optional(),
  $skip: z.coerce.number().int().nonnegative().optional(),
  $orderby: z.string().optional(),
  $count: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type QueryPropertyInput = z.infer<typeof queryPropertySchema>;
