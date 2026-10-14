import { StandardStatus, MediaItem, RoomItem, ConfidentialItem } from '../../../shared/types/property';

export interface PropertyModel {
  id: string;
  listingKey?: string;
  listingId?: string;
  title: string;
  tagline?: string;
  price: number;
  formattedPrice?: string;
  listPriceCurrency?: string;
  originalListPrice?: number;
  associationFee?: number;
  associationFeeFrequency?: string;
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
    livingAreaUnits?: string;
    lotSizeArea?: number;
    lotSizeUnits?: string;
    propertyType: string;
    propertySubType?: string;
    yearBuilt?: number;
    parkingTotal?: number;
  };
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
  listAgentKey?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

