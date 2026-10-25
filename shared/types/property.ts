/**
 * Standard Property Types & Shared Contracts
 */

export type StandardStatus = 
  | 'Draft'
  | 'Pending Approval'
  | 'Pending Confirmation'
  | 'Action Required'
  | 'Active'
  | 'Active Under Contract'
  | 'Pending'
  | 'Closed'
  | 'Canceled'
  | 'Expired';

export type PropertyType = 
  | 'Residential'
  | 'Commercial Sale'
  | 'Commercial Lease'
  | 'Land'
  | 'Residential Income';

export interface MediaItem {
  id?: string;
  mediaKey: string;
  mediaUrl: string;
  orderIndex: number;
  mediaCategory: 'Photo' | 'FloorPlan' | 'Video' | 'VirtualTour' | 'Document';
  shortDescription?: string;
  mimeType?: string;
}

export interface RoomItem {
  id?: string;
  roomType: 'Primary Bedroom' | 'Bedroom' | 'Bathroom' | 'Living Room' | 'Dining Room' | 'Kitchen' | 'Home Office' | 'Balcony' | 'Laundry' | string;
  roomLevel?: 'Main' | 'Second' | 'Third' | 'Basement' | 'Penthouse' | 'Upper' | 'Lower' | string;
  roomLength?: number;
  roomWidth?: number;
  roomDimensionsUnits?: 'Meters' | 'Feet';
  roomFeatures?: string[];
}

export interface ConfidentialItem {
  privateRemarks?: string;
  showingInstructions?: string;
  lockboxType?: string;
  lockboxLocation?: string;
  lockboxCode?: string;
  buyerAgencyCompensation?: string;
  sellerDirectPhone?: string;
  sellerDirectEmail?: string;
  expirationDate?: string;
}

// Backward compatibility aliases
export type ResoStandardStatus = StandardStatus;
export type ResoPropertyType = PropertyType;
export type ResoMediaItem = MediaItem;
export type ResoRoomItem = RoomItem;
export type ResoConfidentialItem = ConfidentialItem;

export interface Property {
  id: string | number;
  listingKey?: string;
  listingId?: string;
  title: string;
  tagline?: string;
  price: number;
  formattedPrice?: string;
  listPriceCurrency?: 'PHP' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'JPY' | string;
  originalListPrice?: number;
  associationFee?: number;
  associationFeeFrequency?: 'Monthly' | 'Annually' | 'Quarterly' | string;
  taxAnnualAmount?: number;
  location: {
    address: string;
    unparsedAddress?: string | null;
    subdivisionName?: string | null;
    buildingName?: string | null;
    building_name?: string | null;
    city: string;
    state?: string | null;
    stateOrProvince?: string | null;
    postalCode?: string | null;
    region?: string | null;
    region_psgc_code?: string | null;
    province_psgc_code?: string | null;
    city_psgc_code?: string | null;
    barangay?: string | null;
    barangay_psgc_code?: string | null;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specs: {
    beds?: number | null;
    baths?: number | null;
    bedroomsTotal?: number | null;
    bathroomsTotalInteger?: number | null;
    bathroomsFull?: number | null;
    bathroomsHalf?: number | null;
    storiesTotal?: number | null;
    sqft?: number | null;
    livingArea?: number | null;
    livingAreaUnits?: 'Square Meters' | 'Square Feet' | string;
    lotSizeArea?: number | null;
    lotSizeUnits?: 'Square Meters' | 'Square Feet' | 'Acres' | 'Hectares' | string;
    propertyType: string;
    propertyTypeId?: number;
    propertySubType?: string;
    yearBuilt?: number | null;
    parkingTotal?: number | null;
    parkingCovered?: number | null;
    parkingOpen?: number | null;
    transactionType?: string;
    propertyCondition?: string;
  };
  mainImage?: string | null;
  propertyTypeId?: number;
  property_type_id?: number;
  isFeatured?: boolean;
  features: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: string[];
  images: string[];
  media?: MediaItem[];
  rooms?: RoomItem[];
  confidential?: ConfidentialItem;
  publicRemarks?: string;
  customAttributes?: Record<string, unknown>;
  customResoAttributes?: Record<string, unknown>;
  architecturalStyle?: string;
  standardStatus?: StandardStatus;
  status: 'available' | 'pending' | 'sold';
  assignmentStatus?: 'PENDING_CONFIRMATION' | 'ACCEPTED' | 'REJECTED';
  assignmentDeclinedReason?: string | null;
  assignedAt?: string;
  agentConfirmedAt?: string | null;
  isPublished?: boolean;
  listAgentKey?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValuationEstimate {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidenceScore: number;
  lastUpdated: string;
}

export interface PropertyItem extends Property {
  transactionType?: 'For Sale' | 'For Rent' | 'Pre-Selling';
  propertySubClass?: string;
  furnishing?: 'Fully Furnished' | 'Semi-Furnished' | 'Bare / Unfurnished';
  floorLevel?: 'Low' | 'Mid' | 'High' | 'Penthouse';
  financingTerms?: string[];
  communityRules?: string[];
  tenureType?: 'Perpetual / Freehold' | 'Leasehold' | 'Clean Title';
}
