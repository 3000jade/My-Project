/**
 * RESO (Real Estate Standards Organization) Data Dictionary 2.0 Types & Shared Contracts
 */

export type ResoStandardStatus = 
  | 'Draft'
  | 'Pending Approval'
  | 'Active'
  | 'Active Under Contract'
  | 'Pending'
  | 'Closed'
  | 'Canceled'
  | 'Expired';

export type ResoPropertyType = 
  | 'Residential'
  | 'Commercial Sale'
  | 'Commercial Lease'
  | 'Land'
  | 'Residential Income';

export interface ResoMediaItem {
  id?: string;
  mediaKey: string;
  mediaUrl: string;
  orderIndex: number;
  mediaCategory: 'Photo' | 'FloorPlan' | 'Video' | 'VirtualTour' | 'Document';
  shortDescription?: string;
  mimeType?: string;
}

export interface ResoRoomItem {
  id?: string;
  roomType: 'Primary Bedroom' | 'Bedroom' | 'Bathroom' | 'Living Room' | 'Dining Room' | 'Kitchen' | 'Home Office' | 'Balcony' | 'Laundry' | string;
  roomLevel?: 'Main' | 'Second' | 'Third' | 'Basement' | 'Penthouse' | 'Upper' | 'Lower' | string;
  roomLength?: number;
  roomWidth?: number;
  roomDimensionsUnits?: 'Meters' | 'Feet';
  roomFeatures?: string[];
}

export interface ResoConfidentialItem {
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
    unparsedAddress?: string;
    subdivisionName?: string;
    city: string;
    state?: string;
    stateOrProvince?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specs: {
    beds: number;
    baths: number;
    bedroomsTotal?: number;
    bathroomsTotalInteger?: number;
    bathroomsFull?: number;
    bathroomsHalf?: number;
    storiesTotal?: number;
    sqft: number;
    livingArea?: number;
    livingAreaUnits?: 'Square Meters' | 'Square Feet' | string;
    lotSizeArea?: number;
    lotSizeUnits?: 'Square Meters' | 'Square Feet' | 'Acres' | 'Hectares' | string;
    propertyType: string;
    propertySubType?: string;
    yearBuilt?: number;
    parkingTotal?: number;
  };
  features: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: string[];
  images: string[];
  media?: ResoMediaItem[];
  rooms?: ResoRoomItem[];
  confidential?: ResoConfidentialItem;
  publicRemarks?: string;
  customResoAttributes?: Record<string, unknown>;
  architecturalStyle?: string;
  standardStatus?: ResoStandardStatus;
  status: 'available' | 'pending' | 'sold';
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

export interface ResoODataParams {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $top?: number;
  $skip?: number;
  $orderby?: string;
  $count?: boolean;
}
