export interface GoogleAuthPayload {
  idToken: string;
  role?: 'client' | 'agent' | 'broker' | 'admin';
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
  webContentLink?: string;
  directImageUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
}

export interface EmailNotificationRequest {
  to: string;
  subject: string;
  template: 'inquiry_received' | 'tour_confirmed' | 'broker_approval' | 'valuation_report';
  context: Record<string, any>;
}

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  templateName: string;
  parameters: Record<string, string>;
}

export interface CommuteEstimate {
  destination: string;
  destinationName: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  mode: 'driving' | 'transit' | 'walking';
}

// ==========================================
// Google Maps Platform Geospatial Contracts
// ==========================================

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapPropertyPin {
  id: string;
  title: string;
  priceFormatted: string;
  priceNumeric: number;
  currency: string;
  coordinates: GeoCoordinates;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number;
  thumbnailUrl: string;
  city: string;
  subdivision?: string;
  isFeatured?: boolean;
}

export interface StreetViewMetadataResult {
  hasCoverage: boolean;
  panoId?: string;
  location?: GeoCoordinates;
  copyright?: string;
}

export interface CommuteDestinationEstimate {
  destinationId: string;
  destinationName: string;
  destinationCoordinates: GeoCoordinates;
  distanceKm: number;
  durationMinutes: number;
  durationText: string;
  trafficCondition?: 'low' | 'moderate' | 'heavy';
}

export interface PlaceAutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coordinates?: GeoCoordinates;
}
