export interface Property {
  id: string | number;
  title: string;
  tagline?: string;
  price: number;
  formattedPrice?: string;
  location: {
    address: string;
    city: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specs: {
    beds: number;
    baths: number;
    sqft: number;
    propertyType: string;
    yearBuilt?: number;
  };
  features: string[];
  images: string[];
  architecturalStyle?: string;
  status: 'available' | 'pending' | 'sold';
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

