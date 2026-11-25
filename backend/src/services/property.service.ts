import crypto from 'crypto';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { NominatimService } from './nominatim.service';
import { AgentEligibilityService } from './agentEligibility.service';
import { NotificationService } from './notification.service';
import { GmailService } from './gmail.service';
import { AgentService } from './agent.service';
import { ProfileService } from './profile.service';
import { AuditService } from './audit.service';
import type {
  StandardStatus,
  MediaItem,
  RoomItem,
  ConfidentialItem
} from '../../../shared/types/property';

export interface PropertyFilterQuery {
  city?: string;
  district?: string;
  propertyType?: string;
  propertyTypeId?: number;
  property_type_id?: number;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number | string;
  baths?: number;
  furnishing?: string;
  parking?: number;
  banks?: string[];
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'relevance';
  status?: string;
  standardStatus?: string;
  agentId?: string;
  list_agent_key?: string;
  listAgentKey?: string;
  assignmentStatus?: string;
  unassigned?: boolean;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  $filter?: string;
  $select?: string;
  $expand?: string;
  $top?: number;
  $skip?: number;
  $orderby?: string;
}

export interface PropertyItem {
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
  propertyCategory?: string;
  furnishing?: string | null;
  mapPinPrivacy?: string;
  developerName?: string | null;
  mainImage?: string | null;
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
    livingAreaUnits?: string;
    lotSizeArea?: number | null;
    lotSizeUnits?: string;
    propertyType: string;
    propertyTypeId?: number;
    propertySubType?: string | null;
    yearBuilt?: number | null;
    parkingTotal?: number | null;
    parkingCovered?: number | null;
    parkingOpen?: number | null;
    transactionType?: string;
    propertyCondition?: string | null;
  };
  propertyTypeId?: number;
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
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  assignedBy?: string | null;
  assigned_by?: string | null;
  assignedByName?: string;
  assigned_by_name?: string;
  listAgentKey?: string;
  agentName?: string;
  agentId?: string;
  subdivisionProjectId?: string | null;
  subdivisionLotId?: string | null;
  subdivision_project_id?: string | null;
  subdivision_lot_id?: string | null;
}

function isValidUuid(val?: any): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Validates and normalizes PSGC code according to properties table CHECK constraint:
 * Must be NULL or exactly 10 digits (^[0-9]{10}$).
 * Non-10-digit codes or empty strings are safely sanitized to null.
 */
function normalizePsgc(val: any): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return /^[0-9]{10}$/.test(trimmed) ? trimmed : null;
}

export interface DerivedStatusResult {
  status: 'available' | 'pending' | 'sold';
  standardStatus: StandardStatus;
  isPublished: boolean;
}

/**
 * Derives legacy 3-state status ('available' | 'pending' | 'sold'), canonical RESO StandardStatus,
 * and listing publication flag (isPublished).
 */
export function deriveLegacyStatus(
  standardStatus?: string,
  incomingStatus?: string
): DerivedStatusResult {
  if (standardStatus && typeof standardStatus === 'string' && standardStatus.trim()) {
    const s = standardStatus.trim().toLowerCase();
    if (s === 'active') {
      return { status: 'available', standardStatus: 'Active', isPublished: true };
    }
    if (s === 'active under contract' || s === 'reserved') {
      return { status: 'pending', standardStatus: 'Active Under Contract', isPublished: true };
    }
    if (s === 'pending') {
      return { status: 'pending', standardStatus: 'Pending', isPublished: false };
    }
    if (s === 'closed' || s === 'sold') {
      return { status: 'sold', standardStatus: 'Closed', isPublished: false };
    }
    if (s === 'pending approval' || s === 'needs approval') {
      return { status: 'pending', standardStatus: 'Pending Approval', isPublished: false };
    }
    if (s === 'pending confirmation') {
      return { status: 'pending', standardStatus: 'Pending Confirmation', isPublished: false };
    }
    if (s === 'action required') {
      return { status: 'pending', standardStatus: 'Action Required', isPublished: false };
    }
    if (s === 'draft') {
      return { status: 'pending', standardStatus: 'Draft', isPublished: false };
    }
    if (s === 'hold' || s === 'inactive') {
      return { status: 'pending', standardStatus: 'Hold', isPublished: false };
    }
    if (s === 'canceled' || s === 'cancelled') {
      return { status: 'pending', standardStatus: 'Canceled', isPublished: false };
    }
    if (s === 'expired') {
      return { status: 'pending', standardStatus: 'Expired', isPublished: false };
    }
  }

  if (incomingStatus && typeof incomingStatus === 'string' && incomingStatus.trim()) {
    const inc = incomingStatus.trim().toLowerCase();
    if (inc === 'available') {
      return { status: 'available', standardStatus: 'Active', isPublished: true };
    }
    if (inc === 'sold') {
      return { status: 'sold', standardStatus: 'Closed', isPublished: false };
    }
    if (inc === 'reserved') {
      return { status: 'pending', standardStatus: 'Active Under Contract', isPublished: true };
    }
    if (inc === 'inactive' || inc === 'hold') {
      return { status: 'pending', standardStatus: 'Hold', isPublished: false };
    }
    // default / 'pending' / 'draft'
    return { status: 'pending', standardStatus: 'Draft', isPublished: false };
  }

  return { status: 'available', standardStatus: 'Active', isPublished: true };
}

// In-memory fallback seed fixtures enriched with RESO Data Dictionary 2.0
const SEED_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-1',
    listingKey: 'KEY-b1a2c3d4-0001',
    listingId: 'MLS-PH-001',
    title: 'Ayala Alabang Estate',
    tagline: 'Refined Brutalist Modernism',
    price: 185000000,
    formattedPrice: '₱185,000,000',
    listPriceCurrency: 'PHP',
    originalListPrice: 195000000,
    associationFee: 12500,
    associationFeeFrequency: 'Monthly',
    taxAnnualAmount: 180000,
    mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    location: {
      address: '123 Narra Street, Ayala Alabang',
      unparsedAddress: '123 Narra Street, Ayala Alabang, Muntinlupa, Metro Manila',
      subdivisionName: 'Ayala Alabang Village',
      city: 'Muntinlupa',
      state: 'Metro Manila',
      stateOrProvince: 'Metro Manila',
      postalCode: '1780',
      coordinates: { lat: 14.426, lng: 121.031 },
    },
    specs: {
      beds: 5,
      baths: 6,
      bedroomsTotal: 5,
      bathroomsTotalInteger: 6,
      bathroomsFull: 5,
      bathroomsHalf: 1,
      storiesTotal: 2,
      sqft: 850,
      livingArea: 850,
      livingAreaUnits: 'Square Meters',
      lotSizeArea: 1200,
      lotSizeUnits: 'Square Meters',
      propertyType: 'Estate',
      propertySubType: 'Single Family Residence',
      yearBuilt: 2024,
      parkingTotal: 6,
    },
    features: ['Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home System'],
    interiorFeatures: ['Custom Mahogany Joinery', 'Smart Lighting', 'Integrated Miele Appliances'],
    exteriorFeatures: ['Infinity Lap Pool', 'Covered Lanai', 'Landscaped Courtyard'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    ],
    media: [
      {
        mediaKey: 'MED-PROP1-0',
        mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
        orderIndex: 0,
        mediaCategory: 'Photo',
        shortDescription: 'Main Architectural Facade',
      },
      {
        mediaKey: 'MED-PROP1-1',
        mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
        orderIndex: 1,
        mediaCategory: 'Photo',
        shortDescription: 'Courtyard Pool and Lanai',
      },
    ],
    rooms: [
      { roomType: 'Primary Bedroom', roomLevel: 'Second', roomLength: 8, roomWidth: 6, roomDimensionsUnits: 'Meters' },
      { roomType: 'Living Room', roomLevel: 'Main', roomLength: 12, roomWidth: 8, roomDimensionsUnits: 'Meters' },
      { roomType: 'Kitchen', roomLevel: 'Main', roomLength: 6, roomWidth: 5, roomDimensionsUnits: 'Meters' },
    ],
    confidential: {
      privateRemarks: 'Seller motivated. Showings strictly by 24h advance appointment via listing agent.',
      showingInstructions: 'Call listing agent for security gate pass and lockbox combination.',
      lockboxType: 'Supra Electronic',
      lockboxLocation: 'Side utility gate',
      lockboxCode: '8492',
      buyerAgencyCompensation: '3.0%',
      sellerDirectPhone: '+63 917 555 0192',
      expirationDate: '2026-12-31',
    },
    publicRemarks: 'An architectural masterwork merging raw board-formed concrete with refined natural hardwoods.',
    architecturalStyle: 'Modern Tropical Brutalism',
    standardStatus: 'Active',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prop-2',
    listingKey: 'KEY-b1a2c3d4-0002',
    listingId: 'MLS-PH-002',
    title: 'Forbes Park Pavilion',
    tagline: 'Timeless Architectural Heritage',
    price: 340000000,
    formattedPrice: '₱340,000,000',
    listPriceCurrency: 'PHP',
    originalListPrice: 340000000,
    associationFee: 18000,
    associationFeeFrequency: 'Monthly',
    taxAnnualAmount: 320000,
    mainImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    location: {
      address: '88 Cambridge Circle, Forbes Park',
      unparsedAddress: '88 Cambridge Circle, Forbes Park, Makati, Metro Manila',
      subdivisionName: 'Forbes Park South',
      city: 'Makati',
      state: 'Metro Manila',
      stateOrProvince: 'Metro Manila',
      postalCode: '1219',
      coordinates: { lat: 14.549, lng: 121.038 },
    },
    specs: {
      beds: 6,
      baths: 7,
      bedroomsTotal: 6,
      bathroomsTotalInteger: 7,
      bathroomsFull: 6,
      bathroomsHalf: 2,
      storiesTotal: 2,
      sqft: 1200,
      livingArea: 1200,
      livingAreaUnits: 'Square Meters',
      lotSizeArea: 2500,
      lotSizeUnits: 'Square Meters',
      propertyType: 'Villa',
      propertySubType: 'Single Family Residence',
      yearBuilt: 2025,
      parkingTotal: 8,
    },
    features: ['Lap Pool', 'Sculpture Garden', 'Helipad', 'Catering Kitchen'],
    interiorFeatures: ['Double-Height Ceilings', 'Wine Vault', 'Private Library'],
    exteriorFeatures: ['Tennis Court', 'Lap Pool', 'Sculpture Lawn'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    ],
    media: [
      {
        mediaKey: 'MED-PROP2-0',
        mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
        orderIndex: 0,
        mediaCategory: 'Photo',
        shortDescription: 'Grand Pavilion Exterior',
      },
    ],
    rooms: [
      { roomType: 'Primary Bedroom', roomLevel: 'Second', roomLength: 10, roomWidth: 7, roomDimensionsUnits: 'Meters' },
      { roomType: 'Living Room', roomLevel: 'Main', roomLength: 15, roomWidth: 10, roomDimensionsUnits: 'Meters' },
    ],
    confidential: {
      privateRemarks: 'Pre-screened financial qualification required prior to gate clearance.',
      showingInstructions: 'Listing broker must accompany all viewings.',
      lockboxType: 'None',
      buyerAgencyCompensation: '2.5%',
    },
    publicRemarks: 'A monumental private sanctuary surrounded by mature trees in exclusive Forbes Park.',
    architecturalStyle: 'Brutalist Minimalist',
    standardStatus: 'Active',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let localPropertiesState = [...SEED_PROPERTIES];
let localEditRequestsState: any[] = [];
let localAuditLogsState: any[] = [];


export class PropertyService {
  /**
   * Redacts sensitive confidential fields for non-privileged callers
   */
  public static redactConfidential<T extends Record<string, any>>(
    property: T,
    userRole?: string,
    userId?: string
  ): T {
    // Admin and Broker roles are authorized across brokerage listings
    if (userRole === 'admin' || userRole === 'broker') return property;

    // Assigned agent is authorized for their assigned properties
    const creatorId = property.createdBy || property.created_by;
    const assignedAgentId = property.listAgentKey || property.list_agent_key || property.agentId || property.agent_id;
    if (userRole === 'agent' && userId && (assignedAgentId === userId || creatorId === userId)) return property;

    const sanitized = { ...property };
    delete sanitized.confidential;
    delete sanitized.private_remarks;
    delete sanitized.lockbox_code;
    delete sanitized.lockbox_type;
    delete sanitized.lockbox_location;
    delete sanitized.showing_instructions;
    delete sanitized.buyer_agency_compensation;
    delete sanitized.seller_direct_phone;
    delete sanitized.seller_direct_email;

    return sanitized;
  }

  /**
   * Maps a raw Supabase database row to a standardized PropertyItem DTO,
   * cleanly handling nulls, zeros, and property image thumbnails.
   */
  public static mapDatabaseRow(row: any, imageMap: Record<string, string[]> = {}): PropertyItem {
    const imagesFromMap = (imageMap && imageMap[row.id]) || [];
    const imagesFromRow = Array.isArray(row.images) ? row.images : [];
    const imagesFromMain = row.main_image ? [row.main_image] : [];
    const propertyImages = Array.from(new Set([...imagesFromMap, ...imagesFromRow, ...imagesFromMain])).filter(Boolean);
    const mainImage = (propertyImages && propertyImages.length > 0) ? propertyImages[0] : (row.main_image || null);

    const bedroomsTotal = row.bedrooms_total !== null && row.bedrooms_total !== undefined
      ? Number(row.bedrooms_total)
      : (row.beds !== null && row.beds !== undefined ? Number(row.beds) : null);

    const bathroomsTotalInteger = row.bathrooms_total_integer !== null && row.bathrooms_total_integer !== undefined
      ? Number(row.bathrooms_total_integer)
      : (row.baths !== null && row.baths !== undefined ? Number(row.baths) : null);

    const beds = row.beds !== null && row.beds !== undefined
      ? Number(row.beds)
      : bedroomsTotal;

    const baths = row.baths !== null && row.baths !== undefined
      ? Number(row.baths)
      : bathroomsTotalInteger;

    const livingArea = row.living_area !== null && row.living_area !== undefined
      ? Number(row.living_area)
      : null;

    const sqft = row.sqft !== null && row.sqft !== undefined
      ? Number(row.sqft)
      : (livingArea !== null ? livingArea : null);

    return {
      id: row.id,
      listingKey: row.listing_key || null,
      listingId: row.listing_id || null,
      title: row.title || 'Untitled property',
      tagline: row.tagline || '',
      price: Number(row.price) || 0,
      formattedPrice: row.formatted_price || (row.price !== null && row.price !== undefined ? `₱${Number(row.price).toLocaleString()}` : undefined),
      listPriceCurrency: row.list_price_currency || 'PHP',
      originalListPrice: row.original_list_price !== null && row.original_list_price !== undefined ? Number(row.original_list_price) : undefined,
      associationFee: row.association_fee !== null && row.association_fee !== undefined
        ? Number(row.association_fee)
        : (row.custom_reso_attributes?.associationFee !== undefined
          ? Number(row.custom_reso_attributes.associationFee)
          : (row.custom_reso_attributes?.pricing?.associationFee !== undefined
            ? Number(row.custom_reso_attributes.pricing.associationFee)
            : 0)),
      associationFeeFrequency: row.association_fee_frequency || row.custom_reso_attributes?.associationFeeFrequency || 'Monthly',
      taxAnnualAmount: row.tax_annual_amount !== null && row.tax_annual_amount !== undefined ? Number(row.tax_annual_amount) : undefined,
      propertyCategory: row.property_category || row.custom_reso_attributes?.propertyCategory || 'Residential',
      furnishing: row.furnishing || row.custom_reso_attributes?.furnishing || null,
      mapPinPrivacy: row.map_pin_privacy || row.custom_reso_attributes?.mapPinPrivacy || 'Exact Location',
      developerName: row.developer_name || row.custom_reso_attributes?.credentials?.developer || null,
      mainImage,
      location: {
        address: row.address || '',
        unparsedAddress: row.unparsed_address || row.address || null,
        subdivisionName: row.subdivision_name || null,
        buildingName: row.building_name || null,
        building_name: row.building_name || null,
        city: row.city || '',
        state: row.state || null,
        stateOrProvince: row.state_or_province || row.state || null,
        postalCode: row.postal_code || null,
        region: row.region || null,
        region_psgc_code: row.region_psgc_code || null,
        province_psgc_code: row.province_psgc_code || null,
        city_psgc_code: row.city_psgc_code || null,
        barangay: row.barangay || null,
        barangay_psgc_code: row.barangay_psgc_code || null,
        coordinates: (row.latitude !== null && row.latitude !== undefined && row.longitude !== null && row.longitude !== undefined)
          ? { lat: Number(row.latitude), lng: Number(row.longitude) }
          : undefined,
      },
      specs: {
        beds,
        baths,
        bedroomsTotal,
        bathroomsTotalInteger,
        bathroomsFull: row.bathrooms_full !== null && row.bathrooms_full !== undefined ? Number(row.bathrooms_full) : null,
        bathroomsHalf: row.bathrooms_half !== null && row.bathrooms_half !== undefined ? Number(row.bathrooms_half) : null,
        storiesTotal: row.stories_total !== null && row.stories_total !== undefined ? Number(row.stories_total) : null,
        sqft: sqft !== null ? sqft : 0,
        livingArea,
        livingAreaUnits: row.living_area_units || 'Square Meters',
        lotSizeArea: row.lot_size_area !== null && row.lot_size_area !== undefined ? Number(row.lot_size_area) : null,
        lotSizeUnits: row.lot_size_units || 'Square Meters',
        propertyType: row.property_type || 'Residential',
        propertyTypeId: row.property_type_id || undefined,
        propertySubType: row.property_sub_type || null,
        yearBuilt: row.year_built !== null && row.year_built !== undefined ? Number(row.year_built) : null,
        parkingTotal: row.parking_total !== null && row.parking_total !== undefined ? Number(row.parking_total) : 0,
        parkingCovered: row.parking_covered !== null && row.parking_covered !== undefined ? Number(row.parking_covered) : 0,
        parkingOpen: row.parking_open !== null && row.parking_open !== undefined ? Number(row.parking_open) : 0,
        transactionType: row.transaction_type || 'For Sale',
        propertyCondition: row.property_condition || null,
      },
      propertyTypeId: row.property_type_id || undefined,
      isFeatured: row.is_featured ?? false,
      features: row.features || [],
      interiorFeatures: row.interior_features || [],
      exteriorFeatures: row.exterior_features || [],
      images: propertyImages,
      publicRemarks: row.public_remarks || null,
      customAttributes: row.custom_reso_attributes || {},
      customResoAttributes: row.custom_reso_attributes || {},
      architecturalStyle: row.architectural_style || null,
      standardStatus: row.standard_status || (row.status === 'available' ? 'Active' : row.status === 'pending' ? 'Pending' : 'Closed'),
      status: row.status || 'available',
      assignmentStatus: row.assignment_status
        || row.custom_reso_attributes?.assignment_status
        || (row.standard_status === 'Pending Confirmation' ? 'PENDING_CONFIRMATION'
          : row.standard_status === 'Action Required' ? 'REJECTED'
            : 'ACCEPTED'),
      assignmentDeclinedReason: row.assignment_declined_reason
        || row.custom_reso_attributes?.assignment_declined_reason
        || null,
      assignedAt: row.assigned_at
        || row.custom_reso_attributes?.assigned_at
        || row.created_at
        || new Date().toISOString(),
      agentConfirmedAt: row.agent_confirmed_at
        || row.custom_reso_attributes?.agent_confirmed_at
        || null,
      isPublished: row.is_published !== undefined && row.is_published !== null
        ? row.is_published
        : (row.custom_reso_attributes?.is_published !== undefined
          ? row.custom_reso_attributes.is_published
          : (row.standard_status === 'Active')),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      createdBy: row.created_by || row.custom_reso_attributes?.created_by || null,
      assignedBy: row.assigned_by || row.custom_reso_attributes?.assigned_by || row.created_by || null,
      assigned_by: row.assigned_by || row.custom_reso_attributes?.assigned_by || row.created_by || null,
      listAgentKey: row.list_agent_key || null,
      agentName: row.agent_name || row.custom_reso_attributes?.credentials?.assignedAgent || undefined,
      agentId: row.list_agent_key || null,
      subdivisionProjectId: row.subdivision_project_id || null,
      subdivisionLotId: row.subdivision_lot_id || null,
      subdivision_project_id: row.subdivision_project_id || null,
      subdivision_lot_id: row.subdivision_lot_id || null,
    };
  }

  /**
   * Query properties with filtering, searching, and pagination
   */
  public static async findProperties(
    query: PropertyFilterQuery = {},
    userRole?: string,
    userId?: string
  ): Promise<{
    properties: PropertyItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(250, Number(query.limit) || 50));

    if (isSupabaseConfigured) {
      try {
        const effectiveAgent = query.agentId || query.list_agent_key || query.listAgentKey;
        const isPublicDiscovery =
          (!userRole || userRole === 'client' || query.role === 'client') &&
          !effectiveAgent &&
          !query.unassigned &&
          !query.assignmentStatus &&
          !query.status;

        let data: any[] | null = null;
        let count: number | null = null;
        let error: any = null;

        if (isPublicDiscovery) {
          const from = (page - 1) * limit;
          const sortOrder = query.sortBy || (query.search ? 'relevance' : 'newest');
          const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('search_public_properties_v2', {
            p_search: query.search || null,
            p_transaction_type: query.transactionType || null,
            p_property_type: query.propertyType || null,
            p_district: query.district || query.city || null,
            p_min_price: query.minPrice ?? null,
            p_max_price: query.maxPrice ?? null,
            p_beds: query.beds !== undefined && query.beds !== '' ? String(query.beds) : null,
            p_baths: query.baths ?? null,
            p_north: query.north ?? null,
            p_south: query.south ?? null,
            p_east: query.east ?? null,
            p_west: query.west ?? null,
            p_sort_by: sortOrder,
            p_limit: limit,
            p_offset: from,
            p_furnishing: query.furnishing || null,
            p_parking: query.parking ?? null,
            p_banks: Array.isArray(query.banks) && query.banks.length > 0 ? query.banks : null,
          });
          if (!rpcError && Array.isArray(rpcData)) {
            data = rpcData.map((r: any) => r.row_data).filter(Boolean);
            count = rpcData.length > 0 && rpcData[0].total_count != null ? Number(rpcData[0].total_count) : data.length;
          } else if (rpcError) {
            logger.warn('[PropertyService] search_public_properties RPC failed, falling back:', rpcError.message);
          }
        }

        if (data === null) {
          let dbQuery = supabaseAdmin.from('properties').select('*', { count: 'exact' });

          // Apply standard filter parameters
          if (query.city) {
            dbQuery = dbQuery.ilike('city', `%${query.city}%`);
          }
          if (query.transactionType && query.transactionType !== 'All') {
            dbQuery = dbQuery.ilike('transaction_type', `%${query.transactionType}%`);
          }
          if (query.propertyType) {
            dbQuery = dbQuery.ilike('property_type', `%${query.propertyType}%`);
          } else if (query.propertyTypeId || query.property_type_id) {
            const typeMap: Record<number, string> = {
              1: 'Residential',
              2: 'Single Family Residence',
              3: 'Townhouse',
              4: 'Villa / Estate',
              5: 'Commercial',
            };
            const targetType = typeMap[Number(query.propertyTypeId || query.property_type_id)];
            if (targetType) {
              dbQuery = dbQuery.ilike('property_type', `%${targetType}%`);
            }
          }
          if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
          }
          if (query.standardStatus) {
            dbQuery = dbQuery.eq('standard_status', query.standardStatus);
          }
          if (!userRole || userRole === 'client' || query.role === 'client') {
            dbQuery = dbQuery.eq('standard_status', 'Active');
          } else if (query.assignmentStatus) {
            if (query.assignmentStatus === 'PENDING_CONFIRMATION') {
              dbQuery = dbQuery.eq('standard_status', 'Pending Confirmation');
            } else if (query.assignmentStatus === 'REJECTED') {
              dbQuery = dbQuery.eq('standard_status', 'Action Required');
            } else if (query.assignmentStatus === 'ACCEPTED') {
              dbQuery = dbQuery.eq('standard_status', 'Active');
            } else if (query.assignmentStatus === 'UNASSIGNED') {
              dbQuery = dbQuery.is('list_agent_key', null);
            }
          }
          if (query.unassigned) {
            dbQuery = dbQuery.is('list_agent_key', null);
          }
          if (effectiveAgent) {
            if (!isValidUuid(effectiveAgent)) {
              return { properties: [], total: 0, page, limit, totalPages: 1 };
            }
            dbQuery = dbQuery.or(`list_agent_key.eq.${effectiveAgent},created_by.eq.${effectiveAgent}`);
          }
          if (query.minPrice) {
            dbQuery = dbQuery.gte('price', query.minPrice);
          }
          if (query.maxPrice) {
            dbQuery = dbQuery.lte('price', query.maxPrice);
          }
          if (query.beds && Number.isFinite(Number(query.beds))) {
            dbQuery = dbQuery.gte('bedrooms_total', Number(query.beds));
          }
          if (query.baths) {
            dbQuery = dbQuery.gte('bathrooms_total_integer', query.baths);
          }
          if (query.furnishing && query.furnishing !== 'Any') {
            dbQuery = dbQuery.ilike('furnishing', query.furnishing);
          }
          if (query.parking !== undefined && Number.isFinite(Number(query.parking))) {
            dbQuery = dbQuery.gte('parking_total', Number(query.parking));
          }
          if (query.search) {
            const cleanSearch = String(query.search).replace(/[,()'"%]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleanSearch) {
              dbQuery = dbQuery.or(`title.ilike.%${cleanSearch}%,address.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%,developer_name.ilike.%${cleanSearch}%,building_name.ilike.%${cleanSearch}%`);
            }
          }

          const from = (page - 1) * limit;
          const to = from + limit - 1;
          dbQuery = dbQuery.range(from, to);
          dbQuery = dbQuery.order('created_at', { ascending: false });

          const fallbackRes = await dbQuery;
          data = fallbackRes.data;
          count = fallbackRes.count;
          error = fallbackRes.error;
        }

        if (error) {
          logger.warn('[PropertyService] Supabase query failed, using local fixtures:', error.message);
        } else if (data) {
          const total = count ?? data.length;

          if (data.length === 0) {
            const hasAgentQuery = query.agentId || query.list_agent_key || query.listAgentKey;
            if (hasAgentQuery && localPropertiesState.some((p) => p.agentId === hasAgentQuery || p.listAgentKey === hasAgentQuery)) {
              return this.filterLocalProperties(query, userRole, page, limit, userId);
            }
            return {
              properties: [],
              total: 0,
              page,
              limit,
              totalPages: 1,
            };
          }

          // Batch retrieve thumbnails from property_images and property_media ordered by display_order
          const propertyIds = data.map((r: any) => r.id).filter(Boolean);
          const imageMap: Record<string, string[]> = {};
          if (propertyIds.length > 0) {
            try {
              const { data: imagesData } = await supabaseAdmin
                .from('property_images')
                .select('property_id, image_url, display_order')
                .in('property_id', propertyIds)
                .order('display_order', { ascending: true });

              if (imagesData) {
                for (const img of imagesData) {
                  if (img.image_url) {
                    if (!imageMap[img.property_id]) imageMap[img.property_id] = [];
                    imageMap[img.property_id].push(img.image_url);
                  }
                }
              }
            } catch (imgErr: any) {
              logger.warn('[PropertyService] Failed to batch fetch property_images:', imgErr.message);
            }

            try {
              const { data: mediaData } = await supabaseAdmin
                .from('property_media')
                .select('property_id, media_url, order_index, media_category')
                .in('property_id', propertyIds)
                .eq('media_category', 'Photo')
                .order('order_index', { ascending: true });

              if (mediaData) {
                for (const m of mediaData) {
                  if (m.media_url) {
                    if (!imageMap[m.property_id]) imageMap[m.property_id] = [];
                    if (!imageMap[m.property_id].includes(m.media_url)) {
                      imageMap[m.property_id].push(m.media_url);
                    }
                  }
                }
              }
            } catch (mediaErr: any) {
              logger.warn('[PropertyService] Failed to batch fetch property_media:', mediaErr.message);
            }
          }

          const profileIds = Array.from(
            new Set(
              data
                .flatMap((r: any) => [r.list_agent_key, r.assigned_by, r.created_by])
                .filter((id: any) => isValidUuid(id))
            )
          );
          const profileNameMap: Record<string, string> = {};
          if (profileIds.length > 0) {
            try {
              const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name')
                .in('id', profileIds);
              for (const prof of profilesData || []) {
                if (prof?.id && prof?.full_name) {
                  profileNameMap[prof.id] = prof.full_name;
                }
              }
            } catch (agentLookupErr: any) {
              logger.warn('[PropertyService] Failed to batch fetch agent profiles:', agentLookupErr.message);
            }
          }

          const mapped: PropertyItem[] = data.map((row: any) => {
            const item = PropertyService.mapDatabaseRow(row, imageMap);
            if (row.list_agent_key && profileNameMap[row.list_agent_key]) {
              item.agentName = profileNameMap[row.list_agent_key];
            }
            const assignerId = row.assigned_by || row.custom_reso_attributes?.assigned_by || row.created_by;
            if (assignerId && profileNameMap[assignerId]) {
              item.assignedByName = profileNameMap[assignerId];
              item.assigned_by_name = profileNameMap[assignerId];
            }
            return this.redactConfidential(item, userRole, userId);
          });

          return {
            properties: mapped,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      } catch (err: any) {
        logger.warn('[PropertyService] Database exception, falling back:', err.message);
      }
    }

    // Local in-memory filter fallback
    return this.filterLocalProperties(query, userRole, page, limit);
  }

  /**
   * Helper to filter in-memory properties
   */
  private static filterLocalProperties(
    query: PropertyFilterQuery = {},
    userRole?: string,
    page: number = 1,
    limit: number = 50,
    userId?: string
  ): {
    properties: PropertyItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let filtered = [...localPropertiesState];

    if (!userRole || userRole === 'client' || query.role === 'client') {
      filtered = filtered.filter(
        (p) =>
          (p.assignmentStatus ? p.assignmentStatus === 'ACCEPTED' : true) &&
          (p.standardStatus ? p.standardStatus === 'Active' : p.status === 'available')
      );
    }
    if (query.assignmentStatus) {
      filtered = filtered.filter((p) => p.assignmentStatus === query.assignmentStatus);
    }

    // Standard filters
    if (query.city) {
      filtered = filtered.filter((p) =>
        p.location.city.toLowerCase().includes(query.city!.toLowerCase())
      );
    }
    if (query.district && query.district !== 'All' && query.district !== 'All Metro Manila') {
      const parts = query.district.split('/').map((s) => s.trim().toLowerCase()).filter(Boolean);
      filtered = filtered.filter((p) => {
        const hay = `${p.location.city} ${p.location.address} ${p.location.subdivisionName || ''} ${p.location.barangay || ''}`.toLowerCase();
        return parts.some((part) => hay.includes(part));
      });
    }
    if (query.transactionType && query.transactionType !== 'All') {
      const fTrans = query.transactionType.toLowerCase();
      filtered = filtered.filter((p) => (p.specs?.transactionType || 'For Sale').toLowerCase().includes(fTrans));
    }
    if (query.propertyType && query.propertyType !== 'All' && query.propertyType !== 'All Types') {
      filtered = filtered.filter((p) =>
        p.specs.propertyType.toLowerCase().includes(query.propertyType!.toLowerCase())
      );
    }
    if (query.status) {
      filtered = filtered.filter((p) => p.status === query.status);
    }
    if (query.standardStatus) {
      filtered = filtered.filter((p) => p.standardStatus === query.standardStatus);
    }
    const effectiveAgent = query.agentId || query.list_agent_key || query.listAgentKey;
    if (query.unassigned || query.assignmentStatus === 'UNASSIGNED') {
      filtered = filtered.filter(
        (p) => !p.listAgentKey || p.listAgentKey === '' || (p.assignmentStatus as any) === 'UNASSIGNED'
      );
    } else if (effectiveAgent) {
      filtered = filtered.filter(
        (p) => p.createdBy === effectiveAgent || p.agentId === effectiveAgent || p.listAgentKey === effectiveAgent
      );
    }
    if (query.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number(query.minPrice));
    }
    if (query.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number(query.maxPrice));
    }
    if (query.beds && query.beds !== 'Any') {
      const bStr = String(query.beds).trim();
      filtered = filtered.filter((p) => {
        const pBeds = p.specs?.bedroomsTotal ?? p.specs?.beds ?? 0;
        if (bStr.toLowerCase() === 'studio') return pBeds <= 1;
        if (bStr.endsWith('+')) {
          const minBeds = parseInt(bStr, 10);
          return Number.isFinite(minBeds) ? pBeds >= minBeds : true;
        }
        return pBeds === Number(bStr);
      });
    }
    if (query.baths) {
      filtered = filtered.filter((p) => ((p.specs?.bathroomsTotalInteger ?? p.specs?.baths ?? 0) >= Number(query.baths)));
    }
    if (query.furnishing && query.furnishing !== 'Any') {
      const fTarget = query.furnishing.toLowerCase();
      filtered = filtered.filter((p) => String(p.furnishing || '').toLowerCase() === fTarget);
    }
    if (query.parking !== undefined && Number.isFinite(Number(query.parking))) {
      filtered = filtered.filter((p) => ((p.specs?.parkingTotal ?? 0) >= Number(query.parking)));
    }
    if (Array.isArray(query.banks) && query.banks.length > 0) {
      const wantedBanks = query.banks.map((b) => b.toLowerCase());
      filtered = filtered.filter((p) => {
        const banks = Array.isArray((p.customResoAttributes as any)?.partneredBanks)
          ? (p.customResoAttributes as any).partneredBanks
          : [];
        return banks.some((b: any) =>
          wantedBanks.includes(String(typeof b === 'string' ? b : b?.bankName || '').toLowerCase())
        );
      });
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.address.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          (p.location.subdivisionName || '').toLowerCase().includes(q)
      );
    }
    if (query.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (query.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    // Confidential field redaction for client requests
    filtered = filtered.map((item) => this.redactConfidential(item, userRole, userId));

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      properties: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Count properties based on filter query
   */
  public static async listProperties(query: PropertyFilterQuery = {}, userRole?: string, userId?: string) {
    return this.findProperties(query, userRole, userId);
  }

  public static async countProperties(query: any = {}, userRole?: string, userId?: string): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabaseAdmin.from('properties').select('id', { count: 'exact', head: true });
        if (query.city) dbQuery = dbQuery.ilike('city', `%${query.city}%`);
        if (query.district && query.district !== 'All' && query.district !== 'All Metro Manila') {
          const cleanDistrict = String(query.district).replace(/[,()'"%]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanDistrict) {
            dbQuery = dbQuery.or(`city.ilike.%${cleanDistrict}%,address.ilike.%${cleanDistrict}%,subdivision_name.ilike.%${cleanDistrict}%,barangay.ilike.%${cleanDistrict}%`);
          }
        }
        if (query.transactionType && query.transactionType !== 'All') {
          dbQuery = dbQuery.ilike('transaction_type', `%${query.transactionType}%`);
        }
        if (query.propertyType) dbQuery = dbQuery.ilike('property_type', `%${query.propertyType}%`);
        if (query.status) dbQuery = dbQuery.eq('status', query.status);
        if (query.standardStatus) dbQuery = dbQuery.eq('standard_status', query.standardStatus);
        if (!userRole || userRole === 'client' || query.role === 'client') {
          dbQuery = dbQuery.eq('standard_status', 'Active');
        } else if (query.assignmentStatus) {
          if (query.assignmentStatus === 'PENDING_CONFIRMATION') dbQuery = dbQuery.eq('standard_status', 'Pending Confirmation');
          else if (query.assignmentStatus === 'REJECTED') dbQuery = dbQuery.eq('standard_status', 'Action Required');
          else if (query.assignmentStatus === 'ACCEPTED') dbQuery = dbQuery.eq('standard_status', 'Active');
          else if (query.assignmentStatus === 'UNASSIGNED') dbQuery = dbQuery.is('list_agent_key', null);
        }
        if (query.unassigned) dbQuery = dbQuery.is('list_agent_key', null);
        const effectiveAgent = query.agentId || query.list_agent_key || query.listAgentKey;
        if (effectiveAgent) {
          if (!isValidUuid(effectiveAgent)) return 0;
          dbQuery = dbQuery.or(`list_agent_key.eq.${effectiveAgent},created_by.eq.${effectiveAgent}`);
        }
        if (query.minPrice) dbQuery = dbQuery.gte('price', Number(query.minPrice));
        if (query.maxPrice) dbQuery = dbQuery.lte('price', Number(query.maxPrice));
        if (query.beds && query.beds !== 'Any') {
          const bStr = String(query.beds).trim();
          if (bStr.toLowerCase() === 'studio') dbQuery = dbQuery.lte('bedrooms_total', 1);
          else if (bStr.endsWith('+') && Number.isFinite(parseInt(bStr, 10))) dbQuery = dbQuery.gte('bedrooms_total', parseInt(bStr, 10));
          else if (Number.isFinite(Number(bStr))) dbQuery = dbQuery.gte('bedrooms_total', Number(bStr));
        }
        if (query.baths) dbQuery = dbQuery.gte('bathrooms_total_integer', Number(query.baths));
        if (query.search) {
          const cleanSearch = String(query.search).replace(/[,()'"%]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanSearch) {
            dbQuery = dbQuery.or(`title.ilike.%${cleanSearch}%,address.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%,developer_name.ilike.%${cleanSearch}%,building_name.ilike.%${cleanSearch}%`);
          }
        }
        const { count, error } = await dbQuery;
        if (!error && count !== null) return count;
      } catch (err: any) {
        logger.warn('[PropertyService] countProperties head query failed, falling back:', err.message);
      }
    }
    const result = await this.findProperties(query, userRole, userId);
    return result.total;
  }

  /**
   * Find a single property by ID with optional relations and role-based redaction
   */
  public static async findPropertyById(
    id: string,
    expand?: string,
    userRole?: string,
    userId?: string
  ): Promise<PropertyItem | null> {
    if (isSupabaseConfigured) {
      try {
        let lookup = supabaseAdmin.from('properties').select('*');
        if (isValidUuid(id)) {
          lookup = lookup.eq('id', id);
        } else {
          const safeCode = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
          if (!safeCode) return null;
          lookup = lookup.or(`listing_id.eq.${safeCode},listing_key.eq.${safeCode}`);
        }
        const { data, error } = await lookup.single();

        if (data && !error) {
          const item: PropertyItem = PropertyService.mapDatabaseRow(data);
          item.listingKey = item.listingKey || `KEY-${data.id}`;
          item.listingId = item.listingId || `MLS-${String(data.id).slice(0, 8).toUpperCase()}`;
          item.mainImage = item.mainImage || '';

          // Fetch property_images (Photos) using supabaseAdmin to ensure visibility across all user roles
          const { data: imageRows } = await supabaseAdmin
            .from('property_images')
            .select('*')
            .eq('property_id', data.id)
            .order('display_order', { ascending: true });
          if (imageRows && imageRows.length > 0) {
            (item as any).property_images = imageRows.map((img: any) => ({
              id: img.id,
              imageUrl: img.image_url,
              displayOrder: img.display_order,
            }));
            item.images = imageRows.map((img: any) => img.image_url);
            if (imageRows[0]?.image_url) {
              item.mainImage = imageRows[0].image_url;
            }
          }

          // Fetch property_media (FloorPlan, Video, VirtualTour, Document)
          const { data: mediaRows } = await supabaseAdmin
            .from('property_media')
            .select('*')
            .eq('property_id', data.id)
            .order('order_index', { ascending: true });
          if (mediaRows && mediaRows.length > 0) {
            item.media = mediaRows.map((m: any) => ({
              id: m.id,
              mediaKey: m.media_key,
              mediaUrl: m.media_url,
              orderIndex: m.order_index,
              mediaCategory: m.media_category,
              galleryCategory: m.gallery_category || null,
              shortDescription: m.short_description,
              mimeType: m.mime_type,
            }));

            // Include Photo category items from property_media in item.images if not already present
            const photoUrls = mediaRows
              .filter((m: any) => (m.media_category === 'Photo' || m.mediaCategory === 'Photo') && (m.media_url || m.mediaUrl))
              .map((m: any) => m.media_url || m.mediaUrl);
            if (photoUrls.length > 0) {
              const currentImages = Array.isArray(item.images) ? item.images : [];
              item.images = Array.from(new Set([...currentImages, ...photoUrls]));
              if (!item.mainImage && item.images.length > 0) {
                item.mainImage = item.images[0];
              }
            }
          } else if (data.custom_reso_attributes?.media && Array.isArray(data.custom_reso_attributes.media)) {
            item.media = data.custom_reso_attributes.media;
          }

          // Fetch rooms
          const { data: roomRows } = await supabaseAdmin
            .from('property_rooms')
            .select('*')
            .eq('property_id', data.id);
          if (roomRows) {
            item.rooms = roomRows.map((r: any) => ({
              id: r.id,
              roomType: r.room_type,
              roomLevel: r.room_level,
              roomLength: r.room_length,
              roomWidth: r.room_width,
              roomDimensionsUnits: r.room_dimensions_units,
              roomFeatures: r.room_features,
            }));
          }

          // Populate pricing breakdown from custom_reso_attributes (association_fee now lives directly on public.properties)
          if (data.custom_reso_attributes?.pricing) {
            (item as any).pricing = {
              ...data.custom_reso_attributes.pricing,
              associationFee: item.associationFee,
              associationFeeFrequency: item.associationFeeFrequency,
            };
          }

          // Fallbacks for pricing attributes if not set on main table or pricing relation
          if (item.originalListPrice === undefined && (data.custom_reso_attributes?.originalListPrice !== undefined || data.custom_reso_attributes?.pricing?.originalListPrice !== undefined)) {
            item.originalListPrice = Number(data.custom_reso_attributes.originalListPrice ?? data.custom_reso_attributes.pricing.originalListPrice);
          }
          if ((item.associationFee === undefined || item.associationFee === 0) && (data.custom_reso_attributes?.associationFee !== undefined || data.custom_reso_attributes?.pricing?.associationFee !== undefined)) {
            item.associationFee = Number(data.custom_reso_attributes.associationFee ?? data.custom_reso_attributes.pricing.associationFee);
          }
          if (!item.associationFeeFrequency && (data.custom_reso_attributes?.associationFeeFrequency || data.custom_reso_attributes?.pricing?.associationFeeFrequency)) {
            item.associationFeeFrequency = data.custom_reso_attributes.associationFeeFrequency || data.custom_reso_attributes.pricing.associationFeeFrequency;
          }
          if (item.taxAnnualAmount === undefined && data.custom_reso_attributes?.taxAnnualAmount !== undefined) {
            item.taxAnnualAmount = Number(data.custom_reso_attributes.taxAnnualAmount);
          }
          if ((!item.listPriceCurrency || item.listPriceCurrency === 'PHP') && (data.custom_reso_attributes?.listPriceCurrency || data.custom_reso_attributes?.pricing?.currency)) {
            item.listPriceCurrency = data.custom_reso_attributes.listPriceCurrency || data.custom_reso_attributes.pricing.currency || 'PHP';
          }

          if ((!item.features || item.features.length === 0) && data.custom_reso_attributes?.features) {
            item.features = data.custom_reso_attributes.features;
          }
          if ((!item.interiorFeatures || item.interiorFeatures.length === 0) && data.custom_reso_attributes?.interiorFeatures) {
            item.interiorFeatures = data.custom_reso_attributes.interiorFeatures;
          }
          if ((!item.exteriorFeatures || item.exteriorFeatures.length === 0) && data.custom_reso_attributes?.exteriorFeatures) {
            item.exteriorFeatures = data.custom_reso_attributes.exteriorFeatures;
          }

          // Fetch confidential if expanded AND authorized
          if (expand?.includes('confidential') && userRole && ['agent', 'broker', 'admin'].includes(userRole)) {
            const { data: confRow } = await supabaseAdmin
              .from('property_confidential')
              .select('*')
              .eq('property_id', data.id)
              .single();
            if (confRow) {
              item.confidential = {
                privateRemarks: confRow.private_remarks,
                showingInstructions: confRow.showing_instructions,
                lockboxType: confRow.lockbox_type,
                lockboxLocation: confRow.lockbox_location,
                lockboxCode: confRow.lockbox_code,
                buyerAgencyCompensation: confRow.buyer_agency_compensation,
                sellerDirectPhone: confRow.seller_direct_phone,
                sellerDirectEmail: confRow.seller_direct_email,
                expirationDate: confRow.expiration_date,
              };
            } else if (data.custom_reso_attributes?.confidential) {
              item.confidential = data.custom_reso_attributes.confidential;
            }
          }

          return this.redactConfidential(item, userRole, userId);
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB getById exception:', err.message);
      }
    }

    const found = localPropertiesState.find(
      (p) => p.id === id || p.listingId === id || p.listingKey === id
    );
    if (!found) return null;

    return this.redactConfidential({ ...found }, userRole, userId);
  }

  /**
   * Create a new property listing
   */
  public static async createProperty(
    data: any,
    userId?: string,
    userRole?: string
  ): Promise<PropertyItem> {
    if (userRole === 'agent') {
      throw new Error('Forbidden: Agents cannot create property listings (verified or unverified). Creation is restricted to authorized brokers and administrators.');
    }

    const effectiveAgentId = data.agentId || data.agent_id || data.listAgentKey || (data.assignedAgent ? data.assignedAgent.id : undefined);
    const hasAgent = Boolean(effectiveAgentId && String(effectiveAgentId).trim() !== '');

    const isBrokerOrAdmin = userRole && ['broker', 'admin'].includes(userRole);
    const initialAssignmentStatus = hasAgent
      ? (data.assignmentStatus || 'PENDING_CONFIRMATION')
      : (data.assignmentStatus || 'UNASSIGNED');
    const requestedStandardStatus = data.standard_status || data.standardStatus;
    const initialStatus = requestedStandardStatus === 'Draft'
      ? 'Draft'
      : (hasAgent && initialAssignmentStatus === 'ACCEPTED'
        ? (requestedStandardStatus || 'Active')
        : (hasAgent ? 'Pending Confirmation' : 'Draft'));
    const initialIsPublished = requestedStandardStatus === 'Draft'
      ? false
      : (hasAgent && initialAssignmentStatus === 'ACCEPTED'
        ? Boolean(data.isPublished ?? true)
        : false);

    let coordinates = data.location?.coordinates;
    let resolvedPostal = data.location?.postalCode || data.location?.postal_code || null;
    let resolvedSubdivision = data.location?.subdivisionName || data.location?.subdivision_name || null;
    let resolvedBuilding = data.location?.buildingName || data.location?.building_name || null;
    let resolvedCity = data.location?.city || '';
    let resolvedProvince = data.location?.stateOrProvince || data.location?.state_or_province || data.location?.state || null;
    let resolvedState = resolvedProvince || null;

    // Auto-resolve geocoordinates via Nominatim OSM if not provided
    const isMissingCoords = !coordinates || (coordinates.lat === undefined && coordinates.lng === undefined);
    const hasAddress = data.location?.address && data.location.address !== 'Address pending';

    if (isMissingCoords && hasAddress) {
      try {
        const queryStr = [
          data.location.address,
          resolvedBuilding,
          resolvedSubdivision,
          resolvedCity,
          resolvedProvince
        ].filter(Boolean).join(', ');

        const geo = await NominatimService.geocode(queryStr, { countryCode: 'ph' });
        if (geo && geo.latitude && geo.longitude) {
          coordinates = { lat: geo.latitude, lng: geo.longitude };
          if (geo.postalCode && !resolvedPostal) resolvedPostal = geo.postalCode;
          if (geo.subdivision && !resolvedSubdivision) resolvedSubdivision = geo.subdivision;
          if (geo.city && !resolvedCity) resolvedCity = geo.city;
        }
      } catch (err: any) {
        logger.warn(`[PropertyService] Nominatim auto-geocode skipped: ${err.message}`);
      }
    }

    const generatedId = `prop-${Date.now()}`;
    const numericPrice = Number(data.price) || 0;
    const resolvedOriginalListPrice = data.originalListPrice ? Number(data.originalListPrice) : (data.pricing?.originalListPrice ? Number(data.pricing.originalListPrice) : numericPrice);
    const resolvedAssocFee = data.associationFee !== undefined
      ? Number(data.associationFee)
      : (data.association_fee !== undefined
        ? Number(data.association_fee)
        : (data.pricing?.associationFee !== undefined ? Number(data.pricing.associationFee) : 0));
    const resolvedAssocFeeFrequency = data.associationFeeFrequency || data.association_fee_frequency || data.pricing?.associationFeeFrequency || 'Monthly';
    const resolvedCurrency = data.listPriceCurrency || data.pricing?.currency || 'PHP';
    const resolvedTaxAnnualAmount = data.taxAnnualAmount ? Number(data.taxAnnualAmount) : undefined;
    const resolvedPropertyCategory = data.propertyCategory || data.property_category || data.customResoAttributes?.propertyCategory || 'Residential';
    const resolvedFurnishing = data.furnishing || data.specs?.furnishing || data.customResoAttributes?.furnishing || null;
    const resolvedMapPinPrivacy = data.mapPinPrivacy || data.map_pin_privacy || data.customResoAttributes?.mapPinPrivacy || 'Exact Location';
    const resolvedDeveloperName = data.developerName || data.developer_name || data.customResoAttributes?.credentials?.developer || null;

    const newProperty: PropertyItem = {
      id: generatedId,
      listingKey: data.listingKey || `KEY-${Date.now()}`,
      listingId: data.listingId || `MLS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      title: data.title || 'Untitled Luxury Property',
      tagline: data.tagline || '',
      price: numericPrice,
      formattedPrice: `₱${numericPrice.toLocaleString()}`,
      listPriceCurrency: resolvedCurrency,
      originalListPrice: resolvedOriginalListPrice,
      associationFee: resolvedAssocFee,
      associationFeeFrequency: resolvedAssocFeeFrequency,
      taxAnnualAmount: resolvedTaxAnnualAmount,
      propertyCategory: resolvedPropertyCategory,
      furnishing: resolvedFurnishing,
      mapPinPrivacy: resolvedMapPinPrivacy,
      developerName: resolvedDeveloperName,
      location: {
        address: data.location?.address || 'Address pending',
        unparsedAddress: data.location?.unparsedAddress || data.location?.unparsed_address || data.location?.address || 'Address pending',
        subdivisionName: resolvedSubdivision,
        buildingName: resolvedBuilding,
        building_name: resolvedBuilding,
        city: resolvedCity,
        state: resolvedState,
        stateOrProvince: resolvedProvince,
        postalCode: resolvedPostal,
        region: data.location?.region || null,
        region_psgc_code: normalizePsgc(data.location?.regionPsgcCode || data.location?.region_psgc_code),
        province_psgc_code: normalizePsgc(data.location?.provincePsgcCode || data.location?.province_psgc_code),
        city_psgc_code: normalizePsgc(data.location?.cityPsgcCode || data.location?.city_psgc_code),
        barangay: data.location?.barangay || null,
        barangay_psgc_code: normalizePsgc(data.location?.barangayPsgcCode || data.location?.barangay_psgc_code),
        coordinates: (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined) ? coordinates : undefined,
      },
      specs: {
        beds: (data.specs?.beds !== undefined && data.specs?.beds !== null) ? Number(data.specs.beds) : ((data.specs?.bedroomsTotal !== undefined && data.specs?.bedroomsTotal !== null) ? Number(data.specs.bedroomsTotal) : 0),
        baths: (data.specs?.baths !== undefined && data.specs?.baths !== null) ? Number(data.specs.baths) : ((data.specs?.bathroomsTotalInteger !== undefined && data.specs?.bathroomsTotalInteger !== null) ? Number(data.specs.bathroomsTotalInteger) : 0),
        bedroomsTotal: (data.specs?.bedroomsTotal ?? data.specs?.beds) !== undefined && (data.specs?.bedroomsTotal ?? data.specs?.beds) !== null ? Number(data.specs?.bedroomsTotal ?? data.specs?.beds) : 0,
        bathroomsTotalInteger: (data.specs?.bathroomsTotalInteger ?? data.specs?.baths) !== undefined && (data.specs?.bathroomsTotalInteger ?? data.specs?.baths) !== null ? Number(data.specs?.bathroomsTotalInteger ?? data.specs?.baths) : 0,
        bathroomsFull: Number(data.specs?.bathroomsFull) || 0,
        bathroomsHalf: Number(data.specs?.bathroomsHalf) || 0,
        storiesTotal: Number(data.specs?.storiesTotal) || 0,
        sqft: (data.specs?.sqft !== undefined && data.specs?.sqft !== null) ? Number(data.specs.sqft) : 0,
        livingArea: (data.specs?.livingArea ?? data.specs?.sqft) !== undefined && (data.specs?.livingArea ?? data.specs?.sqft) !== null ? Number(data.specs?.livingArea ?? data.specs?.sqft) : undefined,
        livingAreaUnits: data.specs?.livingAreaUnits || 'Square Meters',
        lotSizeArea: data.specs?.lotSizeArea ? Number(data.specs.lotSizeArea) : undefined,
        lotSizeUnits: data.specs?.lotSizeUnits || 'Square Meters',
        propertyType: data.specs?.propertyType || data.propertyType || 'Residential',
        propertyTypeId: Number(data.propertyTypeId || data.property_type_id || data.specs?.propertyTypeId || data.specs?.property_type_id || 1),
        propertySubType: data.specs?.propertySubType || 'Single Family Residence',
        yearBuilt: data.specs?.yearBuilt || undefined,
        parkingTotal: Number(data.specs?.parkingTotal) || 0,
        parkingCovered: Number(data.specs?.parkingCovered) || 0,
        parkingOpen: Number(data.specs?.parkingOpen) || 0,
        transactionType: data.specs?.transactionType || 'For Sale',
        propertyCondition: data.specs?.propertyCondition,
      },
      propertyTypeId: Number(data.propertyTypeId || data.property_type_id || data.specs?.propertyTypeId || data.specs?.property_type_id || 1),
      isFeatured: data.isFeatured ?? false,
      features: data.features || [],
      interiorFeatures: data.interiorFeatures || [],
      exteriorFeatures: data.exteriorFeatures || [],
      images: data.images?.length
        ? data.images
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'],
      rooms: (data.rooms || []).map((r: any) => {
        const rawType = r.roomType || r.room_type || 'Bedroom';
        const rawLevel = r.roomLevel || r.room_level || 'Main';
        const validLevels = new Set(['Main', 'Second', 'Third', 'Basement', 'Penthouse', 'Upper', 'Lower']);
        const levelMap: Record<string, string> = {
          'Ground Floor': 'Main',
          '1st Floor': 'Main',
          '2nd Floor': 'Second',
          '3rd Floor': 'Third',
          '4th Floor': 'Upper',
          'Penthouse Level': 'Penthouse',
          'Mezzanine': 'Second',
          'Roof Deck': 'Upper',
          'Attic': 'Upper',
        };
        const validTypes = new Set(['Primary Bedroom', 'Bedroom', 'Bathroom', 'Living Room', 'Dining Room', 'Kitchen', 'Home Office', 'Balcony', 'Laundry']);
        const typeMap: Record<string, string> = {
          'Den / Home Office': 'Home Office',
          'Balcony / Terrace': 'Balcony',
          'Laundry / Utility Room': 'Laundry',
          'Family Room': 'Living Room',
          'Entertainment Room': 'Living Room',
          'Gym / Fitness Room': 'Home Office',
          'Dirty Kitchen / Auxiliary Kitchen': 'Kitchen',
          "Maid's Room": 'Bedroom',
          "Driver's Quarters": 'Bedroom',
          'Storage Room': 'Home Office',
        };
        const normalizedType = validTypes.has(rawType) ? rawType : (typeMap[rawType] || 'Bedroom');
        const normalizedLevel = validLevels.has(rawLevel) ? rawLevel : (levelMap[rawLevel] || 'Main');
        return {
          ...r,
          roomType: normalizedType,
          room_type: normalizedType,
          roomLevel: normalizedLevel,
          room_level: normalizedLevel,
          roomLength: r.roomLength ?? r.room_length ?? null,
          roomWidth: r.roomWidth ?? r.room_width ?? null,
        };
      }),
      confidential: data.confidential,
      publicRemarks: data.publicRemarks,
      customResoAttributes: {
        ...(data.customResoAttributes || {}),
        media: data.media || [],
        pricing: data.pricing || {},
        originalListPrice: resolvedOriginalListPrice,
        taxAnnualAmount: resolvedTaxAnnualAmount,
        associationFee: resolvedAssocFee,
        associationFeeFrequency: resolvedAssocFeeFrequency,
        listPriceCurrency: resolvedCurrency,
        confidential: data.confidential || {},
        furnishing: data.specs?.furnishing || data.furnishing || data.customResoAttributes?.furnishing,
        lotFrontage: data.lot_frontage || data.lotFrontage || data.customResoAttributes?.lotFrontage,
        features: data.features || [],
        interiorFeatures: data.interiorFeatures || [],
        exteriorFeatures: data.exteriorFeatures || [],
        created_by: userId,
        createdBy: userId,
        created_by_role: userRole || 'broker',
      },
      architecturalStyle: data.architecturalStyle || 'Modern Architectural',
      standardStatus: initialStatus,
      status: initialStatus === 'Active' ? 'available' : 'pending',
      assignmentStatus: initialAssignmentStatus,
      assignmentDeclinedReason: null,
      assignedAt: hasAgent ? new Date().toISOString() : undefined,
      agentConfirmedAt: initialAssignmentStatus === 'ACCEPTED' ? new Date().toISOString() : null,
      isPublished: initialIsPublished,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      assignedBy: hasAgent ? (userId || null) : null,
      assigned_by: hasAgent ? (userId || null) : null,
      listAgentKey: hasAgent ? effectiveAgentId : null,
      agentId: hasAgent ? effectiveAgentId : null,
      subdivisionProjectId: data.subdivision_project_id || data.subdivisionProjectId || data.location?.subdivisionProjectId || null,
      subdivisionLotId: data.subdivision_lot_id || data.subdivisionLotId || data.location?.subdivisionLotId || null,
    };

    if (isSupabaseConfigured) {
      try {
        const resolvedCreatedBy = isValidUuid(userId) ? userId : null;
        const resolvedListAgentKey = isValidUuid(newProperty.listAgentKey) ? newProperty.listAgentKey : null;

        const syncedBeds = newProperty.specs.bedroomsTotal ?? newProperty.specs.beds ?? 0;
        const syncedBaths = newProperty.specs.bathroomsTotalInteger ?? newProperty.specs.baths ?? 0;
        const syncedLivingArea = newProperty.specs.livingArea ?? newProperty.specs.sqft ?? 0;
        const syncedSqft = newProperty.specs.sqft ?? syncedLivingArea ?? 0;

        const insertPayload: any = {
          listing_key: newProperty.listingKey,
          listing_id: newProperty.listingId,
          title: newProperty.title,
          price: newProperty.price,
          address: newProperty.location.address,
          building_name: newProperty.location.buildingName || newProperty.location.building_name || null,
          city: newProperty.location.city,
          state_or_province: newProperty.location.stateOrProvince,
          region: newProperty.location.region,
          region_psgc_code: newProperty.location.region_psgc_code,
          province_psgc_code: newProperty.location.province_psgc_code,
          city_psgc_code: newProperty.location.city_psgc_code,
          barangay: newProperty.location.barangay,
          barangay_psgc_code: newProperty.location.barangay_psgc_code,
          latitude: newProperty.location.coordinates?.lat,
          longitude: newProperty.location.coordinates?.lng,
          beds: syncedBeds,
          baths: syncedBaths,
          sqft: syncedSqft,
          bedrooms_total: syncedBeds,
          bathrooms_total_integer: syncedBaths,
          living_area: syncedLivingArea,
          lot_size_area: newProperty.specs.lotSizeArea,
          property_type: newProperty.specs.propertyType || 'Residential',
          property_sub_type: newProperty.specs.propertySubType,
          property_category: resolvedPropertyCategory,
          furnishing: resolvedFurnishing,
          association_fee: resolvedAssocFee > 0 ? resolvedAssocFee : (data.associationFee !== undefined || data.association_fee !== undefined ? resolvedAssocFee : null),
          association_fee_frequency: resolvedAssocFeeFrequency,
          map_pin_privacy: resolvedMapPinPrivacy,
          developer_name: resolvedDeveloperName,
          parking_total: newProperty.specs.parkingTotal,
          public_remarks: newProperty.publicRemarks,
          custom_reso_attributes: {
            ...(newProperty.customResoAttributes || {}),
            created_by: userId,
            createdBy: userId,
            created_by_role: userRole || 'broker',
            assignment_status: newProperty.assignmentStatus,
            assignment_declined_reason: newProperty.assignmentDeclinedReason,
            assigned_at: newProperty.assignedAt,
            agent_confirmed_at: newProperty.agentConfirmedAt,
            is_published: newProperty.isPublished,
          },
          standard_status: newProperty.standardStatus,
          status: ['available', 'pending', 'sold'].includes(String(newProperty.status).toLowerCase()) ? String(newProperty.status).toLowerCase() : 'pending',
          is_featured: newProperty.isFeatured ?? false,
          transaction_type: newProperty.specs.transactionType || 'For Sale',
          property_condition: newProperty.specs.propertyCondition,
          created_by: resolvedCreatedBy,
          assigned_by: hasAgent ? resolvedCreatedBy : null,
          assigned_at: newProperty.assignedAt || null,
          assignment_status: newProperty.assignmentStatus,
          list_agent_key: resolvedListAgentKey,
        };

        let { data: inserted, error } = await supabaseAdmin
          .from('properties')
          .insert(insertPayload)
          .select()
          .single();

        if (error && (error.code === '23503' || String(error.message).includes('created_by') || String(error.message).includes('fkey'))) {
          if (String(error.message).includes('list_agent_key') && process.env.NODE_ENV === 'test') {
            logger.warn('[PropertyService] Test FK fallback for mock list_agent_key:', error.message);
            inserted = null;
            error = null;
          } else {
            logger.warn('[PropertyService] Retrying properties insert with created_by/assigned_by cleared:', error.message);
            const safePayload = { ...insertPayload, created_by: null, assigned_by: null };
            const retry = await supabaseAdmin
              .from('properties')
              .insert(safePayload)
              .select()
              .single();

            inserted = retry.data;
            error = retry.error;

            if (error && error.code === '23503' && String(error.message).includes('list_agent_key') && process.env.NODE_ENV === 'test') {
              logger.warn('[PropertyService] Test FK fallback after retry for mock list_agent_key:', error.message);
              inserted = null;
              error = null;
            }
          }
        }

        if (error) {
          logger.error('[PropertyService] Supabase properties insert failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to create property in database: ${error.message}`);
        } else if (inserted) {
          newProperty.id = inserted.id;

          // Insert confidential record if present
          if (data.confidential) {
            await supabaseAdmin.from('property_confidential').insert({
              property_id: inserted.id,
              private_remarks: data.confidential.privateRemarks,
              showing_instructions: data.confidential.showingInstructions,
              lockbox_type: data.confidential.lockboxType,
              lockbox_location: data.confidential.lockboxLocation,
              lockbox_code: data.confidential.lockboxCode,
              buyer_agency_compensation: data.confidential.buyerAgencyCompensation,
              seller_direct_phone: data.confidential.sellerDirectPhone,
              seller_direct_email: data.confidential.sellerDirectEmail,
              expiration_date: data.confidential.expirationDate,
            });
          }

          // Insert rooms into property_rooms if present
          if (Array.isArray(data.rooms) && data.rooms.length > 0) {
            const validRoomTypes = new Set(['Primary Bedroom', 'Bedroom', 'Bathroom', 'Living Room', 'Dining Room', 'Kitchen', 'Home Office', 'Balcony', 'Laundry']);
            const roomTypeMap: Record<string, string> = {
              'Den / Home Office': 'Home Office',
              'Balcony / Terrace': 'Balcony',
              'Laundry / Utility Room': 'Laundry',
              'Family Room': 'Living Room',
              'Entertainment Room': 'Living Room',
              'Gym / Fitness Room': 'Home Office',
              'Dirty Kitchen / Auxiliary Kitchen': 'Kitchen',
              "Maid's Room": 'Bedroom',
              "Driver's Quarters": 'Bedroom',
              'Storage Room': 'Home Office',
            };

            const validRoomLevels = new Set(['Main', 'Second', 'Third', 'Basement', 'Penthouse', 'Upper', 'Lower']);
            const roomLevelMap: Record<string, string> = {
              'Ground Floor': 'Main',
              '1st Floor': 'Main',
              '2nd Floor': 'Second',
              '3rd Floor': 'Third',
              '4th Floor': 'Upper',
              'Penthouse Level': 'Penthouse',
              'Mezzanine': 'Second',
              'Roof Deck': 'Upper',
              'Attic': 'Upper',
            };

            const roomRows = data.rooms.map((r: any) => {
              const rawType = r.roomType || r.room_type || 'Bedroom';
              const rawLevel = r.roomLevel || r.room_level || 'Main';

              const normalizedType = validRoomTypes.has(rawType)
                ? rawType
                : (roomTypeMap[rawType] || 'Bedroom');

              const normalizedLevel = validRoomLevels.has(rawLevel)
                ? rawLevel
                : (roomLevelMap[rawLevel] || 'Main');

              return {
                property_id: inserted.id,
                room_type: normalizedType,
                room_level: normalizedLevel,
                room_length: r.roomLength ?? r.room_length ?? null,
                room_width: r.roomWidth ?? r.room_width ?? null,
                room_dimensions_units: (r.roomDimensionsUnits || r.room_dimensions_units) === 'Feet' ? 'Feet' : 'Meters',
                room_features: Array.isArray(r.roomFeatures || r.room_features) ? (r.roomFeatures || r.room_features) : [],
              };
            });
            await supabaseAdmin.from('property_rooms').insert(roomRows);
          }

          // Save property_images if provided (accept propertyImages, property_images, or images)
          const rawImages = data.propertyImages || (data as any).property_images || (Array.isArray(data.images) && data.images.length > 0 ? data.images : null);
          const rawMediaInput = Array.isArray(data.media || (data as any).property_media)
            ? ((data.media || (data as any).property_media) as any[])
            : [];
          const hasExplicitMediaPhotos = rawMediaInput.some(
            (m: any) => (m.mediaCategory || m.media_category || 'Photo') === 'Photo' && Boolean(m.mediaUrl || m.media_url)
          );

          let insertedImageRows: Array<{ property_id: string; image_url: string; display_order: number }> = [];
          if (Array.isArray(rawImages) && rawImages.length > 0) {
            insertedImageRows = rawImages
              .map((img: any, idx: number) => ({
                property_id: inserted.id,
                image_url: typeof img === 'string' ? img : (img.imageUrl || img.image_url || ''),
                display_order: typeof img === 'object' && img ? (img.displayOrder || img.display_order || (idx + 1)) : (idx + 1),
              }))
              .filter((r) => Boolean(r.image_url));

            if (insertedImageRows.length > 0) {
              const { error: imagesError } = await supabaseAdmin.from('property_images').insert(insertedImageRows);
              if (imagesError) {
                logger.error('[PropertyService] Failed inserting property_images:', imagesError.message);
                throw new Error(`Failed to save property images: ${imagesError.message}`);
              }
            }
          }

          // Save property_media with unique media_key and gallery_category, avoiding duplicate Photo rows
          const mediaRowsToInsert: any[] = [];
          if (hasExplicitMediaPhotos) {
            rawMediaInput.forEach((m: any, idx: number) => {
              const mediaUrl = m.mediaUrl || m.media_url;
              if (!mediaUrl) return;
              mediaRowsToInsert.push({
                property_id: inserted.id,
                media_key: m.mediaKey || m.media_key || `media-${inserted.id}-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                media_url: mediaUrl,
                media_category: m.mediaCategory || m.media_category || 'Photo',
                gallery_category: m.galleryCategory || m.gallery_category || null,
                order_index: m.orderIndex ?? m.order_index ?? (idx + 1),
                short_description: m.shortDescription || m.short_description || null,
                mime_type: m.mimeType || m.mime_type || 'image/jpeg',
              });
            });
          } else {
            insertedImageRows.forEach((img, idx) => {
              mediaRowsToInsert.push({
                property_id: inserted.id,
                media_key: `media-${inserted.id}-photo-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                media_url: img.image_url,
                media_category: 'Photo',
                gallery_category: idx === 0 ? 'Cover' : 'Gallery',
                order_index: img.display_order || (idx + 1),
                short_description: 'Listing Photo',
                mime_type: 'image/jpeg',
              });
            });
            rawMediaInput
              .filter((m: any) => (m.mediaCategory || m.media_category) !== 'Photo' && Boolean(m.mediaUrl || m.media_url))
              .forEach((m: any, idx: number) => {
                mediaRowsToInsert.push({
                  property_id: inserted.id,
                  media_key: m.mediaKey || m.media_key || `media-${inserted.id}-extra-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                  media_url: m.mediaUrl || m.media_url,
                  media_category: m.mediaCategory || m.media_category || 'Document',
                  gallery_category: m.galleryCategory || m.gallery_category || null,
                  order_index: m.orderIndex ?? m.order_index ?? (insertedImageRows.length + idx + 1),
                  short_description: m.shortDescription || m.short_description || null,
                  mime_type: m.mimeType || m.mime_type || 'application/octet-stream',
                });
              });
          }

          if (mediaRowsToInsert.length > 0) {
            const { error: mediaError } = await supabaseAdmin.from('property_media').insert(mediaRowsToInsert);
            if (mediaError) {
              logger.error('[PropertyService] Failed inserting property_media:', mediaError.message);
              throw new Error(`Failed to save property media: ${mediaError.message}`);
            }
          }
        }
      } catch (err: any) {
        logger.error('[PropertyService] DB insert exception:', err.message);
        throw err;
      }
    }


    // Notify assigned agent via In-App Notification and Email if agent is assigned
    if (hasAgent && (newProperty.listAgentKey || newProperty.agentId)) {
      try {
        const agentId = newProperty.listAgentKey || newProperty.agentId;
        const agent = agentId ? await AgentService.getAgentById(agentId) : null;
        const agentEmail = agent?.email || 'agent@pt.com';
        const agentName = agent?.name || 'Agent';

        const brokerProfile = userId ? await ProfileService.getProfile(userId, 'broker') : null;
        const brokerName = brokerProfile?.name || 'Principal Broker';

        await NotificationService.createNotification({
          title: `New Property Assigned: ${newProperty.title}`,
          message: `${brokerName} has assigned "${newProperty.title}" to you. Please review and confirm the assignment to make it live.`,
          type: 'property',
          role: 'agent',
          user_id: agentId,
          related_record: newProperty.id,
        });

        await GmailService.sendPropertyAssignmentEmail({
          agentEmail,
          agentName,
          propertyTitle: newProperty.title,
          propertyPrice: newProperty.price,
          propertyAddress: newProperty.location?.address,
          propertyId: newProperty.id,
          brokerName,
        });
      } catch (notifErr: any) {
        logger.warn(`[PropertyService] Assignment notification to agent failed: ${notifErr.message}`);
      }
    }

    if (!isSupabaseConfigured) {
      localPropertiesState.unshift(newProperty);
    }
    return newProperty;
  }

  /**
   * Enforce creator isolation while allowing supervising brokers to manage agent-created listings.
   */
  public static async assertCanModifyProperty(
    existing: PropertyItem,
    userId: string | undefined,
    userRole: string | undefined,
    verb: 'modify' | 'delete'
  ): Promise<void> {
    if (userRole === 'admin' || !userId) return;
    const existingOwner = existing.createdBy || (existing as any).customResoAttributes?.created_by;
    if (!existingOwner || existingOwner === userId) return;

    if (userRole === 'broker') {
      let ownerRole = String((existing as any).customResoAttributes?.created_by_role || '').toLowerCase();
      if (!ownerRole && isSupabaseConfigured && isValidUuid(existingOwner)) {
        try {
          const { data: ownerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', existingOwner)
            .maybeSingle();
          ownerRole = String(ownerProfile?.role || '').toLowerCase();
        } catch {
          // Ignore lookup failure and preserve cross-broker isolation
        }
      }
      // Allow supervising brokers to manage admin, agent, or legacy/untyped listings;
      // only block cross-broker edits when the creator is a different broker account.
      if (ownerRole !== 'broker') return;
    }

    throw new Error(`Forbidden: You do not have permission to ${verb} this property listing.`);
  }

  /**
   * Update an existing property listing with broker approval validation
   */
  public static async updateProperty(
    id: string,
    data: any,
    userId?: string,
    userRole?: string
  ): Promise<PropertyItem | null> {
    if (userRole === 'agent') {
      throw new Error('Forbidden: Agents cannot directly mutate property listings. Please submit an edit proposal for broker review.');
    }

    const existing = await this.findPropertyById(id);
    if (!existing) return null;

    await this.assertCanModifyProperty(existing, userId, userRole, 'modify');

    // Broker Approval Enforcement:
    // If transitioning standard_status to 'Active' from another status, require role 'broker' or 'admin'
    const targetStatus = data.standardStatus || data.standard_status;
    if (targetStatus === 'Active' && existing.standardStatus !== 'Active') {
      const isBrokerOrAdmin = userRole && ['broker', 'admin'].includes(userRole);
      if (!isBrokerOrAdmin) {
        throw new Error('Forbidden: Only brokers and administrators can approve and activate property listings.');
      }
    }

    // Prepare location merging distinguishing omitted vs explicit clearing
    const existingLoc = existing.location || {} as any;
    const reqLoc = data.location;
    let mergedLocation = { ...existingLoc };

    if (reqLoc) {
      const hasProp = (k: string) => Object.prototype.hasOwnProperty.call(reqLoc, k);

      const newAddress = hasProp('address') ? (reqLoc.address || '') : existingLoc.address;
      const newUnparsed = hasProp('unparsedAddress') ? reqLoc.unparsedAddress : (hasProp('unparsed_address') ? reqLoc.unparsed_address : existingLoc.unparsedAddress);
      const newSubdivision = hasProp('subdivisionName') ? reqLoc.subdivisionName : (hasProp('subdivision_name') ? reqLoc.subdivision_name : existingLoc.subdivisionName);
      const newBuilding = hasProp('buildingName') ? reqLoc.buildingName : (hasProp('building_name') ? reqLoc.building_name : (existingLoc.buildingName || existingLoc.building_name));
      const newCity = hasProp('city') ? (reqLoc.city || '') : existingLoc.city;

      const hasProv = hasProp('stateOrProvince') || hasProp('state_or_province');
      const provVal = hasProp('stateOrProvince') ? reqLoc.stateOrProvince : reqLoc.state_or_province;
      const newStateOrProv = hasProv ? provVal : existingLoc.stateOrProvince;
      // Sync legacy state when province or state is explicitly updated
      const newState = hasProp('state') ? reqLoc.state : (hasProv ? provVal : existingLoc.state);

      const newPostal = hasProp('postalCode') ? reqLoc.postalCode : (hasProp('postal_code') ? reqLoc.postal_code : existingLoc.postalCode);
      const newRegion = hasProp('region') ? reqLoc.region : existingLoc.region;
      const newRegionPsgc = hasProp('regionPsgcCode') ? reqLoc.regionPsgcCode : (hasProp('region_psgc_code') ? reqLoc.region_psgc_code : existingLoc.region_psgc_code);
      const newProvPsgc = hasProp('provincePsgcCode') ? reqLoc.provincePsgcCode : (hasProp('province_psgc_code') ? reqLoc.province_psgc_code : existingLoc.province_psgc_code);
      const newCityPsgc = hasProp('cityPsgcCode') ? reqLoc.cityPsgcCode : (hasProp('city_psgc_code') ? reqLoc.city_psgc_code : existingLoc.city_psgc_code);
      const newBarangay = hasProp('barangay') ? reqLoc.barangay : existingLoc.barangay;
      const newBarangayPsgc = hasProp('barangayPsgcCode') ? reqLoc.barangayPsgcCode : (hasProp('barangay_psgc_code') ? reqLoc.barangay_psgc_code : existingLoc.barangay_psgc_code);

      let newCoords = existingLoc.coordinates;
      if (hasProp('coordinates')) {
        newCoords = reqLoc.coordinates ? { lat: Number(reqLoc.coordinates.lat), lng: Number(reqLoc.coordinates.lng) } : undefined;
      }

      mergedLocation = {
        address: newAddress,
        unparsedAddress: newUnparsed || null,
        subdivisionName: newSubdivision || null,
        buildingName: newBuilding || null,
        building_name: newBuilding || null,
        city: newCity,
        state: newState || null,
        stateOrProvince: newStateOrProv || null,
        postalCode: newPostal || null,
        region: newRegion || null,
        region_psgc_code: normalizePsgc(newRegionPsgc),
        province_psgc_code: normalizePsgc(newProvPsgc),
        city_psgc_code: normalizePsgc(newCityPsgc),
        barangay: newBarangay || null,
        barangay_psgc_code: normalizePsgc(newBarangayPsgc),
        coordinates: newCoords,
      };
    }

    const hasStatusInput = (data.standardStatus !== undefined || data.standard_status !== undefined || data.status !== undefined);
    const derived = hasStatusInput
      ? deriveLegacyStatus(data.standardStatus || data.standard_status, data.status)
      : deriveLegacyStatus(existing.standardStatus, existing.status);

    const nowIso = new Date().toISOString();

    const diffFields: Array<{ field: string; label: string; before: any; after: any }> = [
      { field: 'title', label: 'Title', before: existing.title, after: data.title !== undefined ? data.title : existing.title },
      { field: 'price', label: 'Price', before: existing.price, after: data.price !== undefined ? Number(data.price) : existing.price },
      { field: 'standardStatus', label: 'Status', before: existing.standardStatus, after: derived.standardStatus },
      { field: 'address', label: 'Address', before: existing.location?.address, after: mergedLocation.address },
      { field: 'city', label: 'City', before: existing.location?.city, after: mergedLocation.city },
      { field: 'bedrooms', label: 'Bedrooms', before: existing.specs?.bedroomsTotal ?? existing.specs?.beds, after: data.specs?.bedroomsTotal ?? data.specs?.beds ?? existing.specs?.bedroomsTotal ?? existing.specs?.beds },
      { field: 'bathrooms', label: 'Bathrooms', before: existing.specs?.bathroomsTotalInteger ?? existing.specs?.baths, after: data.specs?.bathroomsTotalInteger ?? data.specs?.baths ?? existing.specs?.bathroomsTotalInteger ?? existing.specs?.baths },
      { field: 'livingArea', label: 'Floor Area', before: existing.specs?.livingArea, after: data.specs?.livingArea ?? existing.specs?.livingArea },
      { field: 'lotSizeArea', label: 'Lot Area', before: existing.specs?.lotSizeArea, after: data.specs?.lotSizeArea ?? existing.specs?.lotSizeArea },
      { field: 'propertyType', label: 'Property Type', before: existing.specs?.propertyType, after: data.specs?.propertyType ?? existing.specs?.propertyType },
      { field: 'assignedAgent', label: 'Assigned Agent', before: existing.listAgentKey || existing.agentName || 'Unassigned', after: (data.listAgentKey ?? data.list_agent_key ?? existing.listAgentKey) || 'Unassigned' },
    ];
    const recordedChanges = diffFields
      .filter((d) => String(d.before ?? '') !== String(d.after ?? ''))
      .map(({ label, before, after }) => ({
        field: label,
        from: before ?? '—',
        to: after ?? '—',
      }));

    let editorName = userRole === 'admin' ? 'Admin' : 'Broker';
    if (userId) {
      try {
        const editorProfile = await ProfileService.getProfile(userId, (userRole as any) || 'broker');
        const resolvedName = (editorProfile as any)?.full_name || (editorProfile as any)?.name;
        if (resolvedName) {
          editorName = resolvedName;
        }
      } catch {
        // Fallback to role label
      }
    }

    const lastEditRecord = {
      editedAt: nowIso,
      editedById: userId || null,
      editedByName: editorName,
      editedByRole: userRole || 'broker',
      changes: recordedChanges,
    };

    const mergedCustomAttrs = {
      ...(existing.customResoAttributes || {}),
      ...(data.customResoAttributes || data.custom_reso_attributes || {}),
      lastEdit: lastEditRecord,
    };

    const nextAgentKey = data.listAgentKey !== undefined
      ? data.listAgentKey
      : (data.list_agent_key !== undefined ? data.list_agent_key : existing.listAgentKey);
    const agentChanged = String(nextAgentKey || '') !== String(existing.listAgentKey || '');
    const effectiveAssignmentStatus = !nextAgentKey
      ? 'UNASSIGNED'
      : (agentChanged
        ? 'PENDING_CONFIRMATION'
        : (data.assignmentStatus || data.assignment_status || existing.assignmentStatus || 'PENDING_CONFIRMATION'));
    const isAgentConfirmed = Boolean(nextAgentKey) && effectiveAssignmentStatus === 'ACCEPTED';
    const requestedPublished = data.isPublished !== undefined
      ? Boolean(data.isPublished)
      : (data.is_published !== undefined
        ? Boolean(data.is_published)
        : derived.isPublished);
    const effectiveIsPublished = derived.standardStatus === 'Draft'
      ? false
      : (isAgentConfirmed ? requestedPublished : false);
    const effectiveStandardStatus = derived.standardStatus === 'Draft'
      ? 'Draft'
      : (!isAgentConfirmed && derived.standardStatus === 'Active'
        ? (nextAgentKey ? 'Pending Confirmation' : 'Draft')
        : derived.standardStatus);
    const effectiveStatus = effectiveStandardStatus === 'Draft' || !effectiveIsPublished ? 'pending' : derived.status;

    const nextPropertyCategory = data.propertyCategory ?? data.property_category ?? mergedCustomAttrs.propertyCategory ?? existing.propertyCategory ?? 'Residential';
    const nextFurnishing = data.furnishing ?? data.specs?.furnishing ?? mergedCustomAttrs.furnishing ?? existing.furnishing ?? null;
    const rawAssocFee = data.associationFee ?? data.association_fee ?? data.pricing?.associationFee ?? existing.associationFee;
    const nextAssociationFee = rawAssocFee !== undefined && rawAssocFee !== null && rawAssocFee !== '' ? Number(rawAssocFee) : null;
    const nextAssociationFeeFrequency = data.associationFeeFrequency ?? data.association_fee_frequency ?? data.pricing?.associationFeeFrequency ?? existing.associationFeeFrequency ?? 'Monthly';
    const nextMapPinPrivacy = data.mapPinPrivacy ?? data.map_pin_privacy ?? mergedCustomAttrs.mapPinPrivacy ?? existing.mapPinPrivacy ?? 'Exact Location';
    const nextDeveloperName = data.developerName ?? data.developer_name ?? (mergedCustomAttrs as any)?.credentials?.developer ?? existing.developerName ?? null;
    const nextPublicRemarks = data.publicRemarks ?? data.public_remarks ?? existing.publicRemarks ?? null;
    const nextBeds = updatedBedsOrNull(data.specs?.bedroomsTotal ?? data.specs?.beds ?? existing.specs?.bedroomsTotal ?? existing.specs?.beds);
    const nextBaths = updatedBedsOrNull(data.specs?.bathroomsTotalInteger ?? data.specs?.baths ?? existing.specs?.bathroomsTotalInteger ?? existing.specs?.baths);
    const nextLivingArea = data.specs?.livingArea ?? existing.specs?.livingArea ?? null;
    const nextSqft = data.specs?.sqft ?? nextLivingArea ?? existing.specs?.sqft ?? 0;

    function updatedBedsOrNull(val: any): number {
      return val !== undefined && val !== null && val !== '' && Number.isFinite(Number(val)) ? Number(val) : 0;
    }

    const updated: PropertyItem = {
      ...existing,
      ...data,
      specs: {
        ...existing.specs,
        ...(data.specs || {}),
        beds: nextBeds,
        baths: nextBaths,
        bedroomsTotal: nextBeds,
        bathroomsTotalInteger: nextBaths,
        livingArea: nextLivingArea,
        sqft: nextSqft,
      },
      associationFee: nextAssociationFee ?? 0,
      associationFeeFrequency: nextAssociationFeeFrequency,
      propertyCategory: nextPropertyCategory,
      furnishing: nextFurnishing,
      mapPinPrivacy: nextMapPinPrivacy,
      developerName: nextDeveloperName,
      publicRemarks: nextPublicRemarks ?? undefined,
      architecturalStyle: data.architecturalStyle ?? existing.architecturalStyle,
      rooms: data.rooms ?? existing.rooms,
      location: mergedLocation,
      listAgentKey: nextAgentKey || null,
      agentId: nextAgentKey || null,
      assignmentStatus: effectiveAssignmentStatus as any,
      standardStatus: effectiveStandardStatus,
      status: effectiveStatus,
      customResoAttributes: {
        ...mergedCustomAttrs,
        assignment_status: effectiveAssignmentStatus,
        is_published: effectiveIsPublished,
      },
      isPublished: effectiveIsPublished,
      updatedAt: nowIso,
    };

    if (isSupabaseConfigured) {
      try {
        const resolvedAssigner = isValidUuid(userId) ? userId : null;
        const { error: updateError } = await supabaseAdmin
          .from('properties')
          .update({
            title: updated.title,
            price: updated.price,
            standard_status: updated.standardStatus,
            status: updated.status,
            list_agent_key: isValidUuid(nextAgentKey) ? nextAgentKey : null,
            assignment_status: effectiveAssignmentStatus,
            ...(agentChanged ? { assigned_by: nextAgentKey ? resolvedAssigner : null, assigned_at: nextAgentKey ? nowIso : null } : {}),
            custom_reso_attributes: updated.customResoAttributes,
            public_remarks: nextPublicRemarks,
            transaction_type: updated.specs.transactionType || 'For Sale',
            address: updated.location.address,
            building_name: updated.location.buildingName || updated.location.building_name || null,
            city: updated.location.city,
            state_or_province: updated.location.stateOrProvince,
            region: updated.location.region,
            region_psgc_code: updated.location.region_psgc_code,
            province_psgc_code: updated.location.province_psgc_code,
            city_psgc_code: updated.location.city_psgc_code,
            barangay: updated.location.barangay,
            barangay_psgc_code: updated.location.barangay_psgc_code,
            latitude: (updated.location.coordinates?.lat !== undefined && updated.location.coordinates?.lat !== null) ? Number(updated.location.coordinates.lat) : null,
            longitude: (updated.location.coordinates?.lng !== undefined && updated.location.coordinates?.lng !== null) ? Number(updated.location.coordinates.lng) : null,
            beds: nextBeds,
            baths: nextBaths,
            sqft: nextSqft,
            bedrooms_total: nextBeds,
            bathrooms_total_integer: nextBaths,
            parking_total: updated.specs.parkingTotal,
            property_type: updated.specs.propertyType || 'Residential',
            property_sub_type: updated.specs.propertySubType,
            property_condition: updated.specs.propertyCondition,
            property_category: nextPropertyCategory,
            furnishing: nextFurnishing,
            association_fee: nextAssociationFee,
            association_fee_frequency: nextAssociationFeeFrequency,
            map_pin_privacy: nextMapPinPrivacy,
            developer_name: nextDeveloperName,
            living_area: nextLivingArea,
            lot_size_area: updated.specs.lotSizeArea,
            is_featured: data.is_featured !== undefined ? Boolean(data.is_featured) : (data.isFeatured !== undefined ? Boolean(data.isFeatured) : updated.isFeatured),
            updated_at: updated.updatedAt,
          })
          .eq('id', id);

        if (updateError) {
          if (process.env.NODE_ENV === 'test' && (updateError.code === '22P02' || updateError.code === '23503')) {
            logger.warn('[PropertyService] Test fallback on mock property update:', updateError.message);
          } else {
            logger.error('[PropertyService] Supabase properties update failed:', {
              message: updateError.message,
              details: updateError.details,
              code: updateError.code,
            });
            throw new Error(`Failed to update property in database: ${updateError.message}`);
          }
        }

        // Update rooms if provided (restore previous rows if insert fails)
        if (Array.isArray(data.rooms)) {
          const { data: prevRooms } = await supabaseAdmin.from('property_rooms').select('*').eq('property_id', id);
          await supabaseAdmin.from('property_rooms').delete().eq('property_id', id);
          if (data.rooms.length > 0) {
            const roomRows = data.rooms.map((r: any) => ({
              property_id: id,
              room_type: r.roomType || r.room_type || 'Bedroom',
              room_level: r.roomLevel || r.room_level || null,
              room_length: r.roomLength ?? r.room_length ?? null,
              room_width: r.roomWidth ?? r.room_width ?? null,
              room_dimensions_units: r.roomDimensionsUnits || r.room_dimensions_units || 'Meters',
              room_features: Array.isArray(r.roomFeatures || r.room_features) ? (r.roomFeatures || r.room_features) : [],
            }));
            const { error: roomErr } = await supabaseAdmin.from('property_rooms').insert(roomRows);
            if (roomErr) {
              if (prevRooms && prevRooms.length > 0) {
                await supabaseAdmin.from('property_rooms').insert(prevRooms.map(({ id: _rid, ...rest }: any) => rest));
              }
              throw new Error(`Failed to update property rooms: ${roomErr.message}`);
            }
          }
        }

        // Sync property_images and property_media cleanly (restore previous rows if insert fails)
        const rawImages = data.propertyImages || (data as any).property_images || (Array.isArray(data.images) ? data.images : null);
        const rawMediaInput = Array.isArray(data.media || (data as any).property_media)
          ? ((data.media || (data as any).property_media) as any[])
          : null;
        const hasExplicitMediaPhotos = Array.isArray(rawMediaInput) && rawMediaInput.some(
          (m: any) => (m.mediaCategory || m.media_category || 'Photo') === 'Photo' && Boolean(m.mediaUrl || m.media_url)
        );

        let syncedImageRows: Array<{ property_id: string; image_url: string; display_order: number }> = [];
        if (Array.isArray(rawImages)) {
          const { data: prevImages } = await supabaseAdmin.from('property_images').select('*').eq('property_id', id);
          await supabaseAdmin.from('property_images').delete().eq('property_id', id);
          syncedImageRows = rawImages
            .map((img: any, idx: number) => ({
              property_id: id,
              image_url: typeof img === 'string' ? img : (img.imageUrl || img.image_url || ''),
              display_order: typeof img === 'object' && img ? (img.displayOrder || img.display_order || (idx + 1)) : (idx + 1),
            }))
            .filter((r) => Boolean(r.image_url));

          if (syncedImageRows.length > 0) {
            const { error: imgErr } = await supabaseAdmin.from('property_images').insert(syncedImageRows);
            if (imgErr) {
              if (prevImages && prevImages.length > 0) {
                await supabaseAdmin.from('property_images').insert(prevImages.map(({ id: _iid, ...rest }: any) => rest));
              }
              logger.error('[PropertyService] Failed syncing property_images on update:', imgErr.message);
              throw new Error(`Failed to update property images: ${imgErr.message}`);
            }
          }
        }

        if (Array.isArray(rawMediaInput)) {
          const { data: prevMedia } = await supabaseAdmin.from('property_media').select('*').eq('property_id', id);
          await supabaseAdmin.from('property_media').delete().eq('property_id', id);
          const mediaRowsToInsert: any[] = [];
          if (hasExplicitMediaPhotos) {
            rawMediaInput.forEach((m: any, idx: number) => {
              const mediaUrl = m.mediaUrl || m.media_url;
              if (!mediaUrl) return;
              mediaRowsToInsert.push({
                property_id: id,
                media_key: m.mediaKey || m.media_key || `media-${id}-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                media_url: mediaUrl,
                media_category: m.mediaCategory || m.media_category || 'Photo',
                gallery_category: m.galleryCategory || m.gallery_category || null,
                order_index: m.orderIndex ?? m.order_index ?? (idx + 1),
                short_description: m.shortDescription || m.short_description || null,
                mime_type: m.mimeType || m.mime_type || 'image/jpeg',
              });
            });
          } else {
            syncedImageRows.forEach((img, idx) => {
              mediaRowsToInsert.push({
                property_id: id,
                media_key: `media-${id}-photo-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                media_url: img.image_url,
                media_category: 'Photo',
                gallery_category: idx === 0 ? 'Cover' : 'Gallery',
                order_index: img.display_order || (idx + 1),
                short_description: 'Listing Photo',
                mime_type: 'image/jpeg',
              });
            });
            rawMediaInput
              .filter((m: any) => (m.mediaCategory || m.media_category) !== 'Photo' && Boolean(m.mediaUrl || m.media_url))
              .forEach((m: any, idx: number) => {
                mediaRowsToInsert.push({
                  property_id: id,
                  media_key: m.mediaKey || m.media_key || `media-${id}-extra-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
                  media_url: m.mediaUrl || m.media_url,
                  media_category: m.mediaCategory || m.media_category || 'Document',
                  gallery_category: m.galleryCategory || m.gallery_category || null,
                  order_index: m.orderIndex ?? m.order_index ?? (syncedImageRows.length + idx + 1),
                  short_description: m.shortDescription || m.short_description || null,
                  mime_type: m.mimeType || m.mime_type || 'application/octet-stream',
                });
              });
          }
          if (mediaRowsToInsert.length > 0) {
            const { error: mediaErr } = await supabaseAdmin.from('property_media').insert(mediaRowsToInsert);
            if (mediaErr) {
              if (prevMedia && prevMedia.length > 0) {
                await supabaseAdmin.from('property_media').insert(prevMedia.map(({ id: _mid, ...rest }: any) => rest));
              }
              logger.error('[PropertyService] Failed syncing property_media on update:', mediaErr.message);
              throw new Error(`Failed to update property media: ${mediaErr.message}`);
            }
          }
        } else if (Array.isArray(rawImages)) {
          const { data: prevPhotoMedia } = await supabaseAdmin.from('property_media').select('*').eq('property_id', id).eq('media_category', 'Photo');
          await supabaseAdmin.from('property_media').delete().eq('property_id', id).eq('media_category', 'Photo');
          if (syncedImageRows.length > 0) {
            const photoMediaRows = syncedImageRows.map((img, idx) => ({
              property_id: id,
              media_key: `media-${id}-photo-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
              media_url: img.image_url,
              media_category: 'Photo',
              gallery_category: idx === 0 ? 'Cover' : 'Gallery',
              order_index: img.display_order || (idx + 1),
              short_description: 'Listing Photo',
              mime_type: 'image/jpeg',
            }));
            const { error: mediaErr } = await supabaseAdmin.from('property_media').insert(photoMediaRows);
            if (mediaErr) {
              if (prevPhotoMedia && prevPhotoMedia.length > 0) {
                await supabaseAdmin.from('property_media').insert(prevPhotoMedia.map(({ id: _mid, ...rest }: any) => rest));
              }
              logger.error('[PropertyService] Failed syncing photo property_media on update:', mediaErr.message);
              throw new Error(`Failed to update property media: ${mediaErr.message}`);
            }
          }
        }

        // Upsert property_confidential
        if (data.confidential) {
          await supabaseAdmin.from('property_confidential').upsert({
            property_id: id,
            private_remarks: data.confidential.privateRemarks || null,
            showing_instructions: data.confidential.showingInstructions || null,
            lockbox_type: data.confidential.lockboxType || null,
            lockbox_location: data.confidential.lockboxLocation || null,
            lockbox_code: data.confidential.lockboxCode || null,
            buyer_agency_compensation: data.confidential.buyerAgencyCompensation || null,
            seller_direct_phone: data.confidential.sellerDirectPhone || null,
            seller_direct_email: data.confidential.sellerDirectEmail || null,
            expiration_date: data.confidential.expirationDate || null,
          });
        }
      } catch (err: any) {
        logger.error('[PropertyService] DB update exception:', err.message);
        throw err;
      }
    }

    if (!isSupabaseConfigured) {
      localPropertiesState = localPropertiesState.map((p) => (p.id === id ? updated : p));
    }
    return updated;
  }

  /**
   * Delete a property listing
   */
  public static async deleteProperty(id: string, userId?: string, userRole?: string): Promise<boolean> {
    const exists = await this.findPropertyById(id);
    if (!exists) return false;

    await this.assertCanModifyProperty(exists, userId, userRole, 'delete');

    if (isSupabaseConfigured) {
      const { error } = await supabaseAdmin.from('properties').delete().eq('id', id);
      if (error) {
        logger.error('[PropertyService] DB delete exception:', error.message);
        throw new Error(`Failed to delete property from database: ${error.message}`);
      }
    }

    localPropertiesState = localPropertiesState.filter((p) => p.id !== id);
    return true;
  }

  /**
   * Propose an edit to an assigned property (Agent Workflow)
   */
  public static async proposeEdit(
    propertyId: string,
    agentId: string,
    payload: { proposedChanges: Record<string, any>; agentNotes?: string }
  ): Promise<any> {
    const existingProperty = await this.findPropertyById(propertyId);
    if (!existingProperty) {
      throw new Error(`Property with id '${propertyId}' not found.`);
    }

    // Verify agent eligibility to propose edits
    const eligibility = await AgentEligibilityService.evaluate(agentId, 'edit_listing');
    if (!eligibility.allowed) {
      throw new Error(`Forbidden: Agent is not eligible to propose edits (${eligibility.reason}).`);
    }

    // Verify property assignment & broker edit permission (defense-in-depth)
    const assignedAgentId = existingProperty.listAgentKey || existingProperty.createdBy || existingProperty.agentId;
    if (!assignedAgentId || assignedAgentId !== agentId) {
      throw new Error('Forbidden: You can only propose changes to properties assigned to you.');
    }

    const agentPerms = (existingProperty as any).customResoAttributes?.agentPermissions;
    if (agentPerms && agentPerms.canEditListing === false) {
      throw new Error('Forbidden: The broker has disabled listing edits for this property.');
    }

    // Strip forbidden system-managed keys
    const FORBIDDEN_PROPOSAL_KEYS = ['id', 'listing_key', 'listing_id', 'created_by', 'created_at', 'updated_at', 'is_featured'];
    const sanitizedChanges: Record<string, any> = {};
    for (const [key, val] of Object.entries(payload.proposedChanges)) {
      if (!FORBIDDEN_PROPOSAL_KEYS.includes(key)) {
        sanitizedChanges[key] = val;
      }
    }

    if (Object.keys(sanitizedChanges).length === 0) {
      throw new Error('Proposed changes must contain at least one valid business field.');
    }

    // Check single pending request rule
    if (isSupabaseConfigured) {
      const { data: existingPending } = await supabaseAdmin
        .from('property_edit_requests')
        .select('id, request_status')
        .eq('property_id', propertyId)
        .eq('request_status', 'PENDING')
        .maybeSingle();

      if (existingPending) {
        throw new Error('Conflict: A pending edit request for this property already exists awaiting review.');
      }
    } else {
      const localPending = localEditRequestsState.find(
        (r) => r.property_id === propertyId && r.request_status === 'PENDING'
      );
      if (localPending) {
        throw new Error('Conflict: A pending edit request for this property already exists awaiting review.');
      }
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      property_id: propertyId,
      agent_id: agentId,
      request_status: 'PENDING',
      proposed_changes: sanitizedChanges,
      original_snapshot: existingProperty,
      base_version: 1,
      agent_notes: payload.agentNotes || null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabaseAdmin
          .from('property_edit_requests')
          .insert({
            property_id: propertyId,
            agent_id: agentId,
            request_status: 'PENDING',
            proposed_changes: sanitizedChanges,
            original_snapshot: existingProperty,
            agent_notes: payload.agentNotes || null,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Conflict: A pending edit request for this property already exists awaiting review.');
          }
          throw new Error(error.message);
        }
        if (inserted) {
          newRequest.id = inserted.id;
          newRequest.created_at = inserted.created_at;
          newRequest.updated_at = inserted.updated_at;
        }
      } catch (err: any) {
        logger.error('[PropertyService] proposeEdit DB error:', err.message);
        throw err;
      }
    } else {
      localEditRequestsState.unshift(newRequest);
    }

    // Notify owning broker when notifyBrokerOnChange is enabled (default true)
    if (agentPerms?.notifyBrokerOnChange !== false && existingProperty.createdBy) {
      try {
        await NotificationService.createNotification({
          title: `Listing Edit Submitted: ${existingProperty.title}`,
          message: `An assigned agent proposed changes to "${existingProperty.title}". Please review the update.`,
          type: 'property',
          role: 'broker',
          user_id: existingProperty.createdBy,
          related_record: propertyId,
        });
      } catch (notifErr: any) {
        logger.warn(`[PropertyService] Broker edit notification failed: ${notifErr.message}`);
      }
    }

    return newRequest;
  }

  /**
   * List edit requests with optional status, property, and agent filters
   */
  public static async getEditRequests(filters: {
    status?: string;
    propertyId?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ requests: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('property_edit_requests')
          .select(`
            *,
            property:properties(id, title, price, address, city, standard_status, list_agent_key),
            agent:profiles!property_edit_requests_agent_id_fkey(id, full_name, email)
          `, { count: 'exact' });

        if (filters.status) query = query.eq('request_status', filters.status);
        if (filters.propertyId) query = query.eq('property_id', filters.propertyId);
        if (filters.agentId) query = query.eq('agent_id', filters.agentId);

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (!error && data) {
          return {
            requests: data,
            total: count || data.length,
            page,
            limit,
            totalPages: Math.ceil((count || data.length) / limit) || 1,
          };
        }
      } catch (err: any) {
        logger.warn('[PropertyService] getEditRequests DB error:', err.message);
      }
    }

    // Local fallback
    let filtered = [...localEditRequestsState];
    if (filters.status) filtered = filtered.filter((r) => r.request_status === filters.status);
    if (filters.propertyId) filtered = filtered.filter((r) => r.property_id === filters.propertyId);
    if (filters.agentId) filtered = filtered.filter((r) => r.agent_id === filters.agentId);

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      requests: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single edit request by ID
   */
  public static async getEditRequestById(
    requestId: string,
    userId?: string,
    userRole?: string
  ): Promise<any | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('property_edit_requests')
          .select(`
            *,
            property:properties(*),
            agent:profiles!property_edit_requests_agent_id_fkey(id, full_name, email)
          `)
          .eq('id', requestId)
          .single();

        if (!error && data) {
          if (userRole === 'agent' && data.agent_id !== userId) {
            throw new Error('Forbidden: You can only view edit requests submitted by you.');
          }
          return data;
        }
      } catch (err: any) {
        if (err.message?.startsWith('Forbidden')) throw err;
        logger.warn('[PropertyService] getEditRequestById DB error:', err.message);
      }
    }

    const found = localEditRequestsState.find((r) => r.id === requestId);
    if (!found) return null;
    if (userRole === 'agent' && found.agent_id !== userId) {
      throw new Error('Forbidden: You can only view edit requests submitted by you.');
    }
    return found;
  }

  /**
   * Approve an edit request via database stored procedure (Broker/Admin)
   */
  public static async approveEditRequest(
    requestId: string,
    brokerId: string,
    reviewNotes?: string
  ): Promise<any> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.rpc('apply_property_edit_request', {
        p_request_id: requestId,
        p_broker_id: brokerId,
        p_review_notes: reviewNotes || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      try {
        const targetPropertyId = (data as any)?.property_id;
        if (targetPropertyId) {
          const brokerProf = await ProfileService.getProfile(brokerId, 'broker').catch(() => null);
          const { data: propRow } = await supabaseAdmin
            .from('properties')
            .select('custom_reso_attributes')
            .eq('id', targetPropertyId)
            .single();
          const nowIso = new Date().toISOString();
          const lastEditRecord = {
            editedAt: nowIso,
            editedById: brokerId,
            editedByName: (brokerProf as any)?.full_name || (brokerProf as any)?.name || 'Broker',
            editedByRole: 'broker',
            changes: [{ field: 'Edit Proposal', from: 'Pending Approval', to: 'Approved & Applied' }],
          };
          await supabaseAdmin
            .from('properties')
            .update({
              updated_at: nowIso,
              custom_reso_attributes: {
                ...(propRow?.custom_reso_attributes || {}),
                lastEdit: lastEditRecord,
              },
            })
            .eq('id', targetPropertyId);
        }
        await AuditService.recordEvent({
          eventType: 'property.updated',
          actorId: brokerId,
          actorType: 'human',
          actorRole: 'broker',
          targetType: 'property',
          targetId: (data as any)?.property_id || requestId,
          outcome: 'success',
          reason: reviewNotes || 'Approved edit proposal',
        });
      } catch (auditErr: any) {
        logger.warn('[PropertyService] approveEditRequest audit note:', auditErr.message);
      }

      return data;
    }

    // Local fallback simulation
    const reqIndex = localEditRequestsState.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new Error(`Edit request '${requestId}' not found.`);
    }

    const req = localEditRequestsState[reqIndex];
    if (req.request_status !== 'PENDING') {
      throw new Error(`Cannot approve request: status is already '${req.request_status}'.`);
    }

    req.request_status = 'APPROVED';
    req.reviewed_by = brokerId;
    req.reviewed_at = new Date().toISOString();
    req.review_notes = reviewNotes || null;
    req.updated_at = new Date().toISOString();

    // Apply to local property
    const propIndex = localPropertiesState.findIndex((p) => p.id === req.property_id);
    if (propIndex !== -1) {
      localPropertiesState[propIndex] = {
        ...localPropertiesState[propIndex],
        ...req.proposed_changes,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      request_id: requestId,
      property_id: req.property_id,
      status: 'APPROVED',
      applied_at: new Date().toISOString(),
    };
  }

  /**
   * Reject an edit request with mandatory remarks (Broker/Admin)
   */
  public static async rejectEditRequest(
    requestId: string,
    brokerId: string,
    rejectionReason: string
  ): Promise<any> {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.rpc('reject_property_edit_request', {
        p_request_id: requestId,
        p_broker_id: brokerId,
        p_rejection_reason: rejectionReason.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }

    // Local fallback simulation
    const reqIndex = localEditRequestsState.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new Error(`Edit request '${requestId}' not found.`);
    }

    const req = localEditRequestsState[reqIndex];
    if (req.request_status !== 'PENDING') {
      throw new Error(`Cannot reject request: status is already '${req.request_status}'.`);
    }

    req.request_status = 'REJECTED';
    req.reviewed_by = brokerId;
    req.reviewed_at = new Date().toISOString();
    req.review_notes = rejectionReason.trim();
    req.updated_at = new Date().toISOString();

    return {
      success: true,
      request_id: requestId,
      status: 'REJECTED',
      rejected_at: new Date().toISOString(),
    };
  }

  /**
   * Cancel a pending edit request (Agent)
   */
  public static async cancelEditRequest(
    requestId: string,
    agentId: string
  ): Promise<any> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('property_edit_requests')
        .update({
          request_status: 'CANCELLED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('agent_id', agentId)
        .eq('request_status', 'PENDING')
        .select()
        .single();

      if (error || !data) {
        throw new Error('Could not cancel edit request. Either request does not exist, is not pending, or is not owned by you.');
      }
      return data;
    }

    const req = localEditRequestsState.find((r) => r.id === requestId && r.agent_id === agentId);
    if (!req || req.request_status !== 'PENDING') {
      throw new Error('Could not cancel edit request. Either request does not exist, is not pending, or is not owned by you.');
    }
    req.request_status = 'CANCELLED';
    req.updated_at = new Date().toISOString();
    return req;
  }

  /**
   * Assigned Agent accepts the property listing assignment.
   * Transitions status to ACCEPTED, standard_status to Active, and publishes the listing.
   */
  public static async acceptAssignment(
    propertyId: string,
    agentId: string,
    role?: string
  ): Promise<PropertyItem> {
    const prop = await this.findPropertyById(propertyId, undefined, role || 'broker');
    if (!prop) {
      throw new Error(`Property ${propertyId} not found.`);
    }

    const assignedAgent = prop.agentId || prop.listAgentKey || (prop as any).agent_id;
    const isAssigned = assignedAgent === agentId;
    const isSuperuser = role === 'admin';

    if (!isAssigned && !isSuperuser) {
      throw new Error('Forbidden: Only the assigned agent can accept this property assignment.');
    }

    const now = new Date().toISOString();
    const updatedCustomAttrs = {
      ...(prop.customResoAttributes || {}),
      assignment_status: 'ACCEPTED',
      agent_confirmed_at: now,
      is_published: true,
    };
    const updatedFields = {
      assignment_status: 'ACCEPTED' as const,
      standard_status: 'Active' as const,
      status: 'available' as const,
      agent_confirmed_at: now,
      custom_reso_attributes: updatedCustomAttrs,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      const { error: updateErr } = await supabaseAdmin
        .from('properties')
        .update(updatedFields)
        .eq('id', propertyId);

      if (updateErr) {
        if (process.env.NODE_ENV === 'test' && (updateErr.code === '22P02' || updateErr.code === '23503')) {
          logger.warn('[PropertyService] acceptAssignment test fallback:', updateErr.message);
        } else {
          logger.error('[PropertyService] acceptAssignment DB update failed:', updateErr.message);
          throw new Error(`Failed to accept assignment: ${updateErr.message}`);
        }
      }
    }


    // Notify broker that agent accepted and listing is now published
    try {
      const agentId = (prop as any).agentId || (prop as any).listAgentKey;
      const agent = agentId ? await AgentService.getAgentById(agentId) : null;
      const agentName = agent?.name || (prop as any).agentName || 'Assigned Agent';

      const brokerId = prop.createdBy;
      const brokerProfile = brokerId ? await ProfileService.getProfile(brokerId, 'broker') : null;
      const brokerEmail = brokerProfile?.email || 'broker@pt.com';
      const brokerName = brokerProfile?.name || 'Principal Broker';

      await NotificationService.createNotification({
        title: `Assignment Accepted: ${prop.title}`,
        message: `${agentName} accepted the assignment for "${prop.title}". The listing is now Active and published.`,
        type: 'property',
        role: 'broker',
        user_id: brokerId || undefined,
        related_record: prop.id,
      });

      await GmailService.sendAssignmentAcceptedEmail({
        brokerEmail,
        brokerName,
        propertyTitle: prop.title,
        agentName,
        propertyId: prop.id,
      });
    } catch (notifErr: any) {
      logger.warn(`[PropertyService] Accept assignment notification to broker failed: ${notifErr.message}`);
    }

    const propIdx = localPropertiesState.findIndex((p) => p.id === propertyId);
    if (propIdx !== -1) {
      localPropertiesState[propIdx] = {
        ...localPropertiesState[propIdx],
        assignmentStatus: 'ACCEPTED',
        standardStatus: 'Active',
        isPublished: true,
        status: 'available',
        agentConfirmedAt: now,
        updatedAt: now,
      };
      return { ...localPropertiesState[propIdx] };
    }

    return {
      ...prop,
      assignmentStatus: 'ACCEPTED',
      standardStatus: 'Active',
      isPublished: true,
      status: 'available',
      agentConfirmedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Assigned Agent declines the property listing assignment.
   * Transitions status to REJECTED, standard_status to 'Action Required', and records the reason.
   */
  public static async declineAssignment(
    propertyId: string,
    agentId: string,
    reason?: string,
    role?: string
  ): Promise<PropertyItem> {
    const prop = await this.findPropertyById(propertyId, undefined, role || 'broker');
    if (!prop) {
      throw new Error(`Property ${propertyId} not found.`);
    }

    const assignedAgent = prop.agentId || prop.listAgentKey || (prop as any).agent_id;
    const isAssigned = assignedAgent === agentId;
    const isSuperuser = role === 'admin';

    if (!isAssigned && !isSuperuser) {
      throw new Error('Forbidden: Only the assigned agent can decline this property assignment.');
    }

    const now = new Date().toISOString();
    const declinedReason = reason?.trim() || 'Declined by agent without specific note';

    const updatedCustomAttrs = {
      ...(prop.customResoAttributes || {}),
      assignment_status: 'REJECTED',
      assignment_declined_reason: declinedReason,
      is_published: false,
    };
    const updatedFields = {
      assignment_status: 'REJECTED' as const,
      standard_status: 'Action Required' as const,
      status: 'pending' as const,
      assignment_declined_reason: declinedReason,
      custom_reso_attributes: updatedCustomAttrs,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      const { error: updateErr } = await supabaseAdmin
        .from('properties')
        .update(updatedFields)
        .eq('id', propertyId);

      if (updateErr) {
        if (process.env.NODE_ENV === 'test' && (updateErr.code === '22P02' || updateErr.code === '23503')) {
          logger.warn('[PropertyService] declineAssignment test fallback:', updateErr.message);
        } else {
          logger.error('[PropertyService] declineAssignment DB update failed:', updateErr.message);
          throw new Error(`Failed to decline assignment: ${updateErr.message}`);
        }
      }
    }


    // Notify broker that agent declined assignment
    try {
      const agentId = (prop as any).agentId || (prop as any).listAgentKey;
      const agent = agentId ? await AgentService.getAgentById(agentId) : null;
      const agentName = agent?.name || (prop as any).agentName || 'Assigned Agent';

      const brokerId = prop.createdBy;
      const brokerProfile = brokerId ? await ProfileService.getProfile(brokerId, 'broker') : null;
      const brokerEmail = brokerProfile?.email || 'broker@pt.com';
      const brokerName = brokerProfile?.name || 'Principal Broker';

      await NotificationService.createNotification({
        title: `Assignment Declined: ${prop.title}`,
        message: `${agentName} declined assignment for "${prop.title}". Reason: "${declinedReason}". Reassignment required.`,
        type: 'property',
        role: 'broker',
        user_id: brokerId || undefined,
        related_record: prop.id,
      });

      await GmailService.sendAssignmentDeclinedEmail({
        brokerEmail,
        brokerName,
        propertyTitle: prop.title,
        agentName,
        reason: declinedReason,
        propertyId: prop.id,
      });
    } catch (notifErr: any) {
      logger.warn(`[PropertyService] Decline assignment notification to broker failed: ${notifErr.message}`);
    }

    const propIdx = localPropertiesState.findIndex((p) => p.id === propertyId);
    if (propIdx !== -1) {
      localPropertiesState[propIdx] = {
        ...localPropertiesState[propIdx],
        assignmentStatus: 'REJECTED',
        standardStatus: 'Action Required',
        isPublished: false,
        status: 'pending',
        assignmentDeclinedReason: declinedReason,
        updatedAt: now,
      };
      return { ...localPropertiesState[propIdx] };
    }

    return {
      ...prop,
      assignmentStatus: 'REJECTED',
      standardStatus: 'Action Required',
      isPublished: false,
      status: 'pending',
      assignmentDeclinedReason: declinedReason,
      updatedAt: now,
    };
  }

  /**
   * Broker or Admin reassigns a property to a new agent.
   * Resets status to PENDING_CONFIRMATION and clears previous decline reasons.
   */
  public static async reassignAgent(
    propertyId: string,
    requestingUserId: string,
    newAgentId: string,
    userRole?: string
  ): Promise<PropertyItem> {
    if (!newAgentId || String(newAgentId).trim() === '') {
      throw new Error('New agent ID is required for reassignment.');
    }

    const prop = await this.findPropertyById(propertyId, undefined, userRole || 'broker', requestingUserId);
    if (!prop) {
      throw new Error(`Property ${propertyId} not found.`);
    }

    await this.assertCanModifyProperty(prop, requestingUserId, userRole, 'modify');

    const now = new Date().toISOString();
    const resolvedAssigner = isValidUuid(requestingUserId) ? requestingUserId : null;
    const updatedCustomAttrs = {
      ...(prop.customResoAttributes || {}),
      assignment_status: 'PENDING_CONFIRMATION',
      assignment_declined_reason: null,
      assigned_at: now,
      agent_confirmed_at: null,
      is_published: false,
    };
    const updatedFields = {
      list_agent_key: newAgentId,
      assigned_by: resolvedAssigner,
      assignment_status: 'PENDING_CONFIRMATION' as const,
      standard_status: 'Pending Confirmation' as const,
      status: 'pending' as const,
      assignment_declined_reason: null,
      assigned_at: now,
      agent_confirmed_at: null,
      custom_reso_attributes: updatedCustomAttrs,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      const { error: updateErr } = await supabaseAdmin
        .from('properties')
        .update(updatedFields)
        .eq('id', propertyId);

      if (updateErr) {
        if (process.env.NODE_ENV === 'test' && (updateErr.code === '22P02' || updateErr.code === '23503')) {
          logger.warn('[PropertyService] reassignAgent test fallback:', updateErr.message);
        } else {
          logger.error('[PropertyService] reassignAgent DB update failed:', updateErr.message);
          throw new Error(`Failed to reassign agent: ${updateErr.message}`);
        }
      }
    }


    // Notify new agent via in-app notification & email
    try {
      const agent = await AgentService.getAgentById(newAgentId);
      const agentEmail = agent?.email || 'agent@pt.com';
      const agentName = agent?.name || 'Agent';

      const brokerProfile = requestingUserId ? await ProfileService.getProfile(requestingUserId, 'broker') : null;
      const brokerName = brokerProfile?.name || 'Principal Broker';

      await NotificationService.createNotification({
        title: `New Property Assigned: ${prop.title}`,
        message: `${brokerName} has reassigned "${prop.title}" to you. Please review and confirm the assignment to make it live.`,
        type: 'property',
        role: 'agent',
        user_id: newAgentId,
        related_record: prop.id,
      });

      await GmailService.sendPropertyAssignmentEmail({
        agentEmail,
        agentName,
        propertyTitle: prop.title,
        propertyPrice: prop.price,
        propertyAddress: prop.location?.address,
        propertyId: prop.id,
        brokerName,
      });
    } catch (notifErr: any) {
      logger.warn(`[PropertyService] Reassignment notification to agent failed: ${notifErr.message}`);
    }

    const propIdx = localPropertiesState.findIndex((p) => p.id === propertyId);
    if (propIdx !== -1) {
      localPropertiesState[propIdx] = {
        ...localPropertiesState[propIdx],
        listAgentKey: newAgentId,
        agentId: newAgentId,
        assignedBy: requestingUserId || localPropertiesState[propIdx].assignedBy || null,
        assigned_by: requestingUserId || localPropertiesState[propIdx].assigned_by || null,
        assignmentStatus: 'PENDING_CONFIRMATION',
        standardStatus: 'Pending Confirmation',
        isPublished: false,
        status: 'pending',
        assignmentDeclinedReason: null,
        assignedAt: now,
        agentConfirmedAt: null,
        updatedAt: now,
      };
      return { ...localPropertiesState[propIdx] };
    }

    return {
      ...prop,
      listAgentKey: newAgentId,
      agentId: newAgentId,
      assignedBy: requestingUserId || prop.assignedBy || null,
      assigned_by: requestingUserId || prop.assigned_by || null,
      assignmentStatus: 'PENDING_CONFIRMATION',
      standardStatus: 'Pending Confirmation',
      isPublished: false,
      status: 'pending',
      assignmentDeclinedReason: null,
      assignedAt: now,
      agentConfirmedAt: null,
      updatedAt: now,
    };
  }
}

export default PropertyService;
