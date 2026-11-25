import { z } from 'zod';

const basePropertySchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long.')
    .trim(),
  price: z
    .number()
    .positive('Price must be greater than zero.'),
  propertyTypeId: z.number().int().positive().optional().default(1),
  property_type_id: z.number().int().positive().optional(),
  listPriceCurrency: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY']).optional().default('PHP'),
  originalListPrice: z.number().positive().optional(),
  associationFee: z.number().nonnegative().optional(),
  taxAnnualAmount: z.number().nonnegative().optional(),
  pricing: z.object({
    currency: z.string().max(3).optional().default('PHP'),
    rentFrequency: z.string().optional(),
    leaseTerm: z.string().optional(),
    associationFee: z.number().nonnegative().optional(),
    associationFeeIncludes: z.array(z.string()).optional(),
    securityDeposit: z.number().nonnegative().optional(),
    advanceRent: z.number().nonnegative().optional(),
  }).optional(),
  location: z
    .object({
      address: z.string().trim().optional().default(''),
      buildingName: z.string().trim().nullable().optional(),
      building_name: z.string().trim().nullable().optional(),
      city: z.string().trim().optional().default(''),
      state: z.string().trim().nullable().optional(),
      stateOrProvince: z.string().trim().nullable().optional(),
      region: z.string().trim().nullable().optional(),
      regionPsgcCode: z.string().trim().nullable().optional().or(z.literal('')),
      region_psgc_code: z.string().trim().nullable().optional().or(z.literal('')),
      provincePsgcCode: z.string().trim().nullable().optional().or(z.literal('')),
      province_psgc_code: z.string().trim().nullable().optional().or(z.literal('')),
      cityPsgcCode: z.string().trim().nullable().optional().or(z.literal('')),
      city_psgc_code: z.string().trim().nullable().optional().or(z.literal('')),
      barangay: z.string().trim().nullable().optional(),
      barangayPsgcCode: z.string().trim().nullable().optional().or(z.literal('')),
      barangay_psgc_code: z.string().trim().nullable().optional().or(z.literal('')),
      coordinates: z
        .object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  specs: z
    .object({
      beds: z.number().int().nonnegative().optional(),
      baths: z.number().int().nonnegative().optional(),
      bedroomsTotal: z.number().int().nonnegative().optional(),
      bathroomsTotalInteger: z.number().int().nonnegative().optional(),
      sqft: z.number().nonnegative().optional(),
      livingArea: z.number().nonnegative().optional(),
      livingAreaUnits: z.enum(['Square Meters', 'Square Feet']).optional(),
      lotSizeArea: z.number().nonnegative().optional(),
      lotSizeUnits: z.string().optional(),
      propertyType: z.string().optional(),
      propertyTypeId: z.number().int().positive().optional(),
      property_type_id: z.number().int().positive().optional(),
      transactionType: z.enum(['For Sale', 'For Rent', 'For Rent / Lease']).optional(),
      propertyCondition: z.string().optional(),
      propertySubType: z.string().optional(),
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
    galleryCategory: z.string().trim().min(1).max(32).optional(),
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
  customResoAttributes: z.record(z.string(), z.unknown()).optional(),
  standardStatus: z.enum(['Draft', 'Hold', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired', 'Pending Confirmation', 'Action Required']).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().default('available'),
  isFeatured: z.boolean().optional().default(false),
  agentId: z.string().trim().optional().nullable(),
  agent_id: z.string().trim().optional().nullable(),
  listAgentKey: z.string().trim().optional().nullable(),
  list_agent_key: z.string().trim().optional().nullable(),
  assignmentStatus: z.enum(['UNASSIGNED', 'PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED']).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const createPropertySchema = basePropertySchema.superRefine((data, ctx) => {
  const isDraft = data.standardStatus === 'Draft' || data.isPublished === false;
  if (isDraft || !data.location) return;
  if (!data.location.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['location', 'address'],
      message: 'Address is required.',
    });
  }
  if (!data.location.city) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['location', 'city'],
      message: 'City is required.',
    });
  }
});

// Partial update schema without .default() on omitted fields so partial PUTs never overwrite existing values
export const updatePropertySchema = basePropertySchema.partial().extend({
  propertyTypeId: z.number().int().positive().optional(),
  listPriceCurrency: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY']).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional(),
  isFeatured: z.boolean().optional(),
});

export const queryPropertySchema = z.object({
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  propertyType: z.string().trim().optional(),
  propertyTypeId: z.coerce.number().int().positive().optional(),
  property_type_id: z.coerce.number().int().positive().optional(),
  transactionType: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  beds: z.union([z.string().trim(), z.coerce.number().int().nonnegative()]).optional(),
  baths: z.coerce.number().int().nonnegative().optional(),
  furnishing: z.string().trim().optional(),
  parking: z.coerce.number().int().nonnegative().optional(),
  banks: z.string().trim().optional(),
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'relevance']).optional(),
  status: z.string().optional(),
  standardStatus: z.string().optional(),
  publicView: z.enum(['true', 'false']).optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  agentId: z.string().trim().optional(),
  list_agent_key: z.string().trim().optional(),
  listAgentKey: z.string().trim().optional(),
  assignmentStatus: z.string().optional(),
  unassigned: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
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

export const proposePropertyEditSchema = z.object({
  proposedChanges: z.record(z.string(), z.unknown()).refine((val) => Object.keys(val).length > 0, {
    message: 'Proposed changes must contain at least one field.',
  }),
  agentNotes: z.string().trim().max(2000).optional(),
});
export type ProposePropertyEditInput = z.infer<typeof proposePropertyEditSchema>;

export const shareListingEmailSchema = z.object({
  recipients: z
    .array(z.string().trim().email('Invalid recipient email address.'))
    .min(1, 'At least one recipient email is required.')
    .max(5, 'Maximum of 5 recipients per share.'),
  idempotency_key: z.string().trim().min(8).max(128),
  optional_note: z.string().trim().max(500).optional(),
  website: z.string().max(0, 'Bot submission rejected.').optional(), // Honeypot trap
});
export type ShareListingEmailInput = z.infer<typeof shareListingEmailSchema>;

export const approveEditRequestSchema = z.object({
  reviewNotes: z.string().trim().max(2000).optional(),
});
export type ApproveEditRequestInput = z.infer<typeof approveEditRequestSchema>;

export const rejectEditRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters.')
    .max(2000),
});
export type RejectEditRequestInput = z.infer<typeof rejectEditRequestSchema>;

export const queryEditRequestsSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONFLICT']).optional(),
  propertyId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type QueryEditRequestsInput = z.infer<typeof queryEditRequestsSchema>;

