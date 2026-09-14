export interface PropertyModel {
  id: string;
  title: string;
  tagline?: string;
  price: number;
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
  status: 'available' | 'pending' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}
