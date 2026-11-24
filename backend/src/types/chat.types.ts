/**
 * Shared TypeScript contracts for the AI Property Agent request/response payloads.
 * Strictly visitor-safe public shapes (never include internal notes, seller contacts, or lockbox codes).
 */

export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPageContext {
  route?: string;
  propertyId?: string;
}

export interface ChatPropertyCard {
  id: string;
  title: string;
  city: string;
  price: number;
  formattedPrice: string;
  propertyType: string;
  transactionType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floorArea: number | null;
  lotArea: number | null;
  parking: number | null;
  mainImage: string | null;
  status: string;
}

export interface ChatPropertyDetail extends ChatPropertyCard {
  address: string;
  subdivisionName: string | null;
  buildingName: string | null;
  associationFee: number | null;
  associationFeeFrequency: string | null;
  features: string[];
  publicRemarks: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export interface ChatComparisonRow {
  label: string;
  values: string[];
}

export interface ChatComparisonTable {
  properties: Array<{
    id: string;
    title: string;
    city: string;
    formattedPrice: string;
  }>;
  rows: ChatComparisonRow[];
}

export interface ChatNearbyLandmark {
  category: 'highway' | 'transit' | 'school' | 'hospital' | 'mall';
  label: string;
}

export interface ChatNearbyCommute {
  destinationName: string;
  distanceText: string;
  durationText: string;
}

export interface ChatNearbySummary {
  propertyId: string;
  propertyTitle: string;
  landmarks: ChatNearbyLandmark[];
  commutes: ChatNearbyCommute[];
  unavailable?: boolean;
}

export interface ChatHandoffDraft {
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: string;
  summary: string;
}

export interface ChatResponsePayload {
  message: string;
  cards?: ChatPropertyCard[];
  comparison?: ChatComparisonTable;
  nearby?: ChatNearbySummary;
  handoffDraft?: ChatHandoffDraft;
}
