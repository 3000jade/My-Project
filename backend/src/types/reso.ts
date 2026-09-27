/**
 * RESO (Real Estate Standards Organization) Data Dictionary Type Definitions
 * Exact specification mirroring RESO Web API & Data Dictionary standards.
 */

export type ResoStandardStatus = 
  | 'Active' 
  | 'Active Under Contract' 
  | 'Pending' 
  | 'Closed' 
  | 'Withdrawn' 
  | 'Canceled' 
  | 'Expired';

export type ResoPropertyType = 
  | 'Residential' 
  | 'Commercial Sale' 
  | 'Commercial Lease' 
  | 'Land' 
  | 'Residential Income';

export interface ResoMedia {
  MediaKey: string;
  MediaURL: string;
  Order: number;
  MediaCategory?: string;
  MimeType?: string;
}

export interface ResoProperty {
  ListingKey: string;
  ListingId: string;
  StandardStatus: ResoStandardStatus;
  PropertyType: ResoPropertyType;
  ListPrice: number;
  OriginalListPrice?: number;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  LotSizeArea?: number;
  LotSizeUnits?: string;
  StreetNumber?: string;
  StreetName?: string;
  UnitNumber?: string;
  City: string;
  StateOrProvince?: string;
  PostalCode: string;
  Latitude?: number;
  Longitude?: number;
  PublicRemarks?: string;
  Media?: ResoMedia[];
  ModificationTimestamp: string;
}

export interface ResoODataQuery {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $top?: number;
  $skip?: number;
  $orderby?: string;
  $count?: boolean;
}

export interface ResoODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}
