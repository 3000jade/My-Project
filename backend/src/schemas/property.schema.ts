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
  propertyTypeId: z.number().int().positive().optional().default(1),
  property_type_id: z.number().int().positive().optional(),
  listPriceCurrency: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY']).optional().default('PHP'),
  originalListPrice: z.number().positive().optional(),
  associationFee: z.number().nonnegative().optional(),
  associationFeeFrequency: z.string().trim().optional(),
  taxAnnualAmount: z.number().nonnegative().optional(),
  pricing: z.object({
    currency: z.string().max(3).optional().default('PHP'),
    rentFrequency: z.string().optional(),
    leaseTerm: z.string().optional(),
    associationFee: z.number().nonnegative().optional(),
    associationFeeFrequency: z.string().optional(),
    associationFeeIncludes: z.array(z.string()).optional(),
    securityDeposit: z.number().nonnegative().optional(),
    advanceRent: z.number().nonnegative().optional(),
  }).optional(),
  location: z
    .object({
      address: z.string().min(1, 'Address is required.').trim(),
      unparsedAddress: z.string().trim().nullable().optional(),
      subdivisionName: z.string().trim().nullable().optional(),
      buildingName: z.string().trim().nullable().optional(),
      building_name: z.string().trim().nullable().optional(),
      city: z.string().min(1, 'City is required.').trim(),
      state: z.string().trim().nullable().optional(),
      stateOrProvince: z.string().trim().nullable().optional(),
      postalCode: z.string().trim().nullable().optional(),
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
      bathroomsFull: z.number().int().nonnegative().optional(),
      bathroomsHalf: z.number().int().nonnegative().optional(),
      storiesTotal: z.number().int().nonnegative().optional(),
      sqft: z.number().positive().optional(),
      livingArea: z.number().positive().optional(),
      livingAreaUnits: z.enum(['Square Meters', 'Square Feet']).optional(),
      lotSizeArea: z.number().nonnegative().optional(),
      lotSizeUnits: z.string().optional(),
      propertyType: z.string().optional(),
      propertyTypeId: z.number().int().positive().optional(),
      property_type_id: z.number().int().positive().optional(),
      transactionType: z.enum(['For Sale', 'For Rent']).optional(),
      propertyCondition: z.string().optional(),
      propertySubType: z.string().optional(),
      yearBuilt: z.number().int().optional(),
      parkingTotal: z.number().int().nonnegative().optional(),
      parkingCovered: z.number().int().nonnegative().optional(),
      parkingOpen: z.number().int().nonnegative().optional(),
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
  customResoAttributes: z.record(z.string(), z.unknown()).optional(),
  architecturalStyle: z.string().optional(),
  standardStatus: z.enum(['Draft', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired', 'Pending Confirmation', 'Action Required']).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional().default('available'),
  isFeatured: z.boolean().optional().default(false),
  agentId: z.string().trim().optional(),
  agent_id: z.string().trim().optional(),
  listAgentKey: z.string().trim().optional(),
  list_agent_key: z.string().trim().optional(),
  assignmentStatus: z.enum(['PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED']).optional(),
  isPublished: z.boolean().optional(),
});

export const queryPropertySchema = z.object({
  city: z.string().trim().optional(),
  propertyType: z.string().trim().optional(),
  propertyTypeId: z.coerce.number().int().positive().optional(),
  property_type_id: z.coerce.number().int().positive().optional(),
  transactionType: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  beds: z.coerce.number().int().nonnegative().optional(),
  baths: z.coerce.number().int().nonnegative().optional(),
  status: z.string().optional(),
  standardStatus: z.string().optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  agentId: z.string().trim().optional(),
  list_agent_key: z.string().trim().optional(),
  listAgentKey: z.string().trim().optional(),
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

