import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { NominatimService } from './nominatim.service';
import { AgentEligibilityService } from './agentEligibility.service';
import type { 
  StandardStatus, 
  MediaItem, 
  RoomItem, 
  ConfidentialItem 
} from '../../../shared/types/property';

export interface PropertyFilterQuery {
  city?: string;
  propertyType?: string;
  propertyTypeId?: number;
  property_type_id?: number;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  status?: string;
  standardStatus?: string;
  agentId?: string;
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
  mainImage?: string;
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
    propertyTypeId?: number;
    propertySubType?: string;
    yearBuilt?: number;
    parkingTotal?: number;
    parkingCovered?: number;
    parkingOpen?: number;
    transactionType?: string;
    propertyCondition?: string;
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
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  listAgentKey?: string;
  agentName?: string;
  agentId?: string;
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
    userRole?: string
  ): T {
    const isAuthorized = userRole && ['agent', 'broker', 'admin'].includes(userRole);
    if (isAuthorized) return property;

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
   * Query properties with filtering, searching, and pagination
   */
  public static async findProperties(
    query: PropertyFilterQuery = {},
    userRole?: string
  ): Promise<{
    properties: PropertyItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabase.from('properties').select('*', { count: 'exact' });

        // Apply standard filter parameters
        if (query.city) {
          dbQuery = dbQuery.ilike('city', `%${query.city}%`);
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
        if (query.agentId) {
          dbQuery = dbQuery.eq('created_by', query.agentId);
        }
        if (query.minPrice) {
          dbQuery = dbQuery.gte('price', query.minPrice);
        }
        if (query.maxPrice) {
          dbQuery = dbQuery.lte('price', query.maxPrice);
        }
        if (query.beds) {
          dbQuery = dbQuery.gte('beds', query.beds);
        }
        if (query.baths) {
          dbQuery = dbQuery.gte('baths', query.baths);
        }
        if (query.search) {
          dbQuery = dbQuery.or(`title.ilike.%${query.search}%,address.ilike.%${query.search}%,city.ilike.%${query.search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        dbQuery = dbQuery.range(from, to);
        dbQuery = dbQuery.order('created_at', { ascending: false });

        const { data, count, error } = await dbQuery;

        if (error) {
          logger.warn('[PropertyService] Supabase query failed, using local fixtures:', error.message);
        } else if (data && data.length > 0) {
          const total = count || data.length;
          const mapped: PropertyItem[] = data.map((row: any) => {
            const item: PropertyItem = {
              id: row.id,
              listingKey: row.listing_key || `KEY-${row.id}`,
              listingId: row.listing_id || `MLS-${String(row.id).slice(0, 8).toUpperCase()}`,
              title: row.title,
              tagline: row.tagline,
              price: Number(row.price),
              formattedPrice: row.formatted_price || `₱${Number(row.price).toLocaleString()}`,
              listPriceCurrency: row.list_price_currency || 'PHP',
              originalListPrice: row.original_list_price ? Number(row.original_list_price) : undefined,
              associationFee: row.association_fee ? Number(row.association_fee) : 0,
              associationFeeFrequency: row.association_fee_frequency || 'Monthly',
              taxAnnualAmount: row.tax_annual_amount ? Number(row.tax_annual_amount) : undefined,
              mainImage: (row.images && row.images[0]) || '',
              location: {
                address: row.address,
                unparsedAddress: row.unparsed_address || row.address,
                subdivisionName: row.subdivision_name,
                buildingName: row.building_name,
                building_name: row.building_name,
                city: row.city,
                state: row.state,
                stateOrProvince: row.state_or_province || row.state,
                postalCode: row.postal_code,
                region: row.region,
                region_psgc_code: row.region_psgc_code,
                province_psgc_code: row.province_psgc_code,
                city_psgc_code: row.city_psgc_code,
                barangay: row.barangay,
                barangay_psgc_code: row.barangay_psgc_code,
                coordinates: (row.latitude !== null && row.latitude !== undefined && row.longitude !== null && row.longitude !== undefined) 
                  ? { lat: Number(row.latitude), lng: Number(row.longitude) } 
                  : undefined,
              },
              specs: {
                beds: row.beds,
                baths: row.baths,
                bedroomsTotal: row.bedrooms_total || row.beds,
                bathroomsTotalInteger: row.bathrooms_total_integer || row.baths,
                bathroomsFull: row.bathrooms_full,
                bathroomsHalf: row.bathrooms_half,
                storiesTotal: row.stories_total,
                sqft: row.sqft,
                livingArea: row.living_area || row.sqft,
                livingAreaUnits: row.living_area_units || 'Square Meters',
                lotSizeArea: row.lot_size_area,
                lotSizeUnits: row.lot_size_units || 'Square Meters',
                propertyType: row.property_type || 'Residential',
                propertyTypeId: row.property_type_id || 1,
                propertySubType: row.property_sub_type,
                yearBuilt: row.year_built,
                parkingTotal: row.parking_total,
                parkingCovered: row.parking_covered || 0,
                parkingOpen: row.parking_open || 0,
                transactionType: row.transaction_type || 'For Sale',
                propertyCondition: row.property_condition,
              },
              propertyTypeId: row.property_type_id || 1,
              isFeatured: row.is_featured ?? false,
              features: row.features || [],
              interiorFeatures: row.interior_features || [],
              exteriorFeatures: row.exterior_features || [],
              images: row.images || [],
              publicRemarks: row.public_remarks,
              customAttributes: row.custom_reso_attributes,
              architecturalStyle: row.architectural_style,
              standardStatus: row.standard_status || (row.status === 'available' ? 'Active' : row.status === 'pending' ? 'Pending' : 'Closed'),
              status: row.status,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              createdBy: row.created_by,
              listAgentKey: row.list_agent_key,
              agentName: 'Elena Rossi',
              agentId: row.created_by || 'agent-1',
            };

            return this.redactConfidential(item, userRole);
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
    let filtered = [...localPropertiesState];

    // Standard filters
    if (query.city) {
      filtered = filtered.filter((p) =>
        p.location.city.toLowerCase().includes(query.city!.toLowerCase())
      );
    }
    if (query.propertyType) {
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
    if (query.agentId) {
      filtered = filtered.filter((p) => p.createdBy === query.agentId || p.agentId === query.agentId);
    }
    if (query.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number(query.minPrice));
    }
    if (query.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number(query.maxPrice));
    }
    if (query.beds) {
      filtered = filtered.filter((p) => (p.specs.bedroomsTotal ?? p.specs.beds) >= Number(query.beds));
    }
    if (query.baths) {
      filtered = filtered.filter((p) => (p.specs.bathroomsTotalInteger ?? p.specs.baths) >= Number(query.baths));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.location.address.toLowerCase().includes(q)
      );
    }

    // Confidential field redaction for client requests
    filtered = filtered.map((item) => this.redactConfidential(item, userRole));

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
  public static async countProperties(query: any) {
    const result = await this.findProperties(query);
    return result.total;
  }

  /**
   * Find a single property by ID with optional relations and role-based redaction
   */
  public static async findPropertyById(
    id: string,
    expand?: string,
    userRole?: string
  ): Promise<PropertyItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .or(`id.eq.${id},listing_id.eq.${id},listing_key.eq.${id}`)
          .single();

        if (data && !error) {
          const item: PropertyItem = {
            id: data.id,
            listingKey: data.listing_key || `KEY-${data.id}`,
            listingId: data.listing_id || `MLS-${String(data.id).slice(0, 8).toUpperCase()}`,
            title: data.title,
            tagline: data.tagline,
            price: Number(data.price),
            formattedPrice: data.formatted_price || `₱${Number(data.price).toLocaleString()}`,
            listPriceCurrency: data.list_price_currency || 'PHP',
            originalListPrice: data.original_list_price ? Number(data.original_list_price) : undefined,
            associationFee: data.association_fee ? Number(data.association_fee) : 0,
            associationFeeFrequency: data.association_fee_frequency || 'Monthly',
            taxAnnualAmount: data.tax_annual_amount ? Number(data.tax_annual_amount) : undefined,
            mainImage: (data.images && data.images[0]) || '',
            location: {
              address: data.address,
              unparsedAddress: data.unparsed_address || data.address,
              subdivisionName: data.subdivision_name,
              buildingName: data.building_name,
              building_name: data.building_name,
              city: data.city,
              state: data.state,
              stateOrProvince: data.state_or_province || data.state,
              postalCode: data.postal_code,
              region: data.region,
              region_psgc_code: data.region_psgc_code,
              province_psgc_code: data.province_psgc_code,
              city_psgc_code: data.city_psgc_code,
              barangay: data.barangay,
              barangay_psgc_code: data.barangay_psgc_code,
              coordinates: (data.latitude !== null && data.latitude !== undefined && data.longitude !== null && data.longitude !== undefined)
                ? { lat: Number(data.latitude), lng: Number(data.longitude) }
                : undefined,
            },
            specs: {
              beds: data.beds,
              baths: data.baths,
              bedroomsTotal: data.bedrooms_total || data.beds,
              bathroomsTotalInteger: data.bathrooms_total_integer || data.baths,
              bathroomsFull: data.bathrooms_full,
              bathroomsHalf: data.bathrooms_half,
              storiesTotal: data.stories_total,
              sqft: data.sqft,
              livingArea: data.living_area || data.sqft,
              livingAreaUnits: data.living_area_units || 'Square Meters',
              lotSizeArea: data.lot_size_area,
              lotSizeUnits: data.lot_size_units || 'Square Meters',
              propertyType: data.property_type || 'Residential',
              propertyTypeId: data.property_type_id || 1,
              propertySubType: data.property_sub_type,
              yearBuilt: data.year_built,
              parkingTotal: data.parking_total,
              parkingCovered: data.parking_covered || 0,
              parkingOpen: data.parking_open || 0,
              transactionType: data.transaction_type || 'For Sale',
              propertyCondition: data.property_condition,
            },
            propertyTypeId: data.property_type_id || 1,
            isFeatured: data.is_featured ?? false,
            features: data.features || [],
            interiorFeatures: data.interior_features || [],
            exteriorFeatures: data.exterior_features || [],
            images: data.images || [],
            publicRemarks: data.public_remarks,
            customResoAttributes: data.custom_reso_attributes,
            architecturalStyle: data.architectural_style,
            standardStatus: data.standard_status || (data.status === 'available' ? 'Active' : data.status === 'pending' ? 'Pending' : 'Closed'),
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            createdBy: data.created_by,
            listAgentKey: data.list_agent_key,
            agentName: 'Elena Rossi',
            agentId: data.created_by || 'agent-1',
          };

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
              shortDescription: m.short_description,
              mimeType: m.mime_type,
            }));
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

          // Fetch property_pricing
          const { data: pricingRow } = await supabaseAdmin
            .from('property_pricing')
            .select('*')
            .eq('property_id', data.id)
            .single();
          if (pricingRow) {
            (item as any).pricing = {
              currency: pricingRow.currency,
              rentFrequency: pricingRow.rent_frequency,
              leaseTerm: pricingRow.lease_term,
              associationFee: pricingRow.association_fee ? Number(pricingRow.association_fee) : 0,
              associationFeeFrequency: pricingRow.association_fee_frequency,
              associationFeeIncludes: pricingRow.association_fee_includes || [],
              securityDeposit: pricingRow.security_deposit ? Number(pricingRow.security_deposit) : undefined,
              advanceRent: pricingRow.advance_rent ? Number(pricingRow.advance_rent) : undefined,
            };
            item.listPriceCurrency = pricingRow.currency || item.listPriceCurrency;
            item.associationFee = pricingRow.association_fee ? Number(pricingRow.association_fee) : item.associationFee;
            item.associationFeeFrequency = pricingRow.association_fee_frequency || item.associationFeeFrequency;
          } else if (data.custom_reso_attributes?.pricing) {
            (item as any).pricing = data.custom_reso_attributes.pricing;
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

          return this.redactConfidential(item, userRole);
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB getById exception:', err.message);
      }
    }

    const found = localPropertiesState.find(
      (p) => p.id === id || p.listingId === id || p.listingKey === id
    );
    if (!found) return null;

    return this.redactConfidential({ ...found }, userRole);
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

    const isBrokerOrAdmin = userRole && ['broker', 'admin'].includes(userRole);
    // Gating rule: Only broker/admin can create listings; standard status defaults to Draft or Active
    const initialStatus = data.standardStatus || 'Active';

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
    const resolvedAssocFee = data.associationFee !== undefined ? Number(data.associationFee) : (data.pricing?.associationFee !== undefined ? Number(data.pricing.associationFee) : 0);
    const resolvedAssocFeeFrequency = data.associationFeeFrequency || data.pricing?.associationFeeFrequency || 'Monthly';
    const resolvedCurrency = data.listPriceCurrency || data.pricing?.currency || 'PHP';
    const resolvedTaxAnnualAmount = data.taxAnnualAmount ? Number(data.taxAnnualAmount) : undefined;

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
        beds: Number(data.specs?.beds) || 1,
        baths: Number(data.specs?.baths) || 1,
        bedroomsTotal: Number(data.specs?.bedroomsTotal ?? data.specs?.beds) || 1,
        bathroomsTotalInteger: Number(data.specs?.bathroomsTotalInteger ?? data.specs?.baths) || 1,
        bathroomsFull: Number(data.specs?.bathroomsFull) || 1,
        bathroomsHalf: Number(data.specs?.bathroomsHalf) || 0,
        storiesTotal: Number(data.specs?.storiesTotal) || 1,
        sqft: Number(data.specs?.sqft) || 100,
        livingArea: Number(data.specs?.livingArea ?? data.specs?.sqft) || 100,
        livingAreaUnits: data.specs?.livingAreaUnits || 'Square Meters',
        lotSizeArea: data.specs?.lotSizeArea ? Number(data.specs.lotSizeArea) : undefined,
        lotSizeUnits: data.specs?.lotSizeUnits || 'Square Meters',
        propertyType: data.specs?.propertyType || data.propertyType || 'Residential',
        propertyTypeId: Number(data.propertyTypeId || data.property_type_id || data.specs?.propertyTypeId || data.specs?.property_type_id || 1),
        propertySubType: data.specs?.propertySubType || 'Single Family Residence',
        yearBuilt: data.specs?.yearBuilt || new Date().getFullYear(),
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
      media: data.media || [],
      rooms: data.rooms || [],
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
      },
      architecturalStyle: data.architecturalStyle || 'Modern Architectural',
      standardStatus: initialStatus,
      status: initialStatus === 'Active' ? 'available' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      listAgentKey: data.listAgentKey || (data as any).agentId || userId,
    };

    const isValidUuid = (val?: string): boolean => {
      if (!val || typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    };

    if (isSupabaseConfigured) {
      try {
        const resolvedCreatedBy = isValidUuid(userId) ? userId : null;
        const resolvedListAgentKey = isValidUuid(newProperty.listAgentKey) ? newProperty.listAgentKey : null;

        const { data: inserted, error } = await supabaseAdmin
          .from('properties')
          .insert({
            listing_key: newProperty.listingKey,
            listing_id: newProperty.listingId,
            title: newProperty.title,
            tagline: newProperty.tagline,
            price: newProperty.price,
            formatted_price: newProperty.formattedPrice,
            association_fee_frequency: newProperty.associationFeeFrequency,
            address: newProperty.location.address,
            unparsed_address: newProperty.location.unparsedAddress,
            subdivision_name: newProperty.location.subdivisionName,
            building_name: newProperty.location.buildingName || newProperty.location.building_name || null,
            city: newProperty.location.city,
            state: newProperty.location.state,
            state_or_province: newProperty.location.stateOrProvince,
            postal_code: newProperty.location.postalCode,
            region: newProperty.location.region,
            region_psgc_code: newProperty.location.region_psgc_code,
            province_psgc_code: newProperty.location.province_psgc_code,
            city_psgc_code: newProperty.location.city_psgc_code,
            barangay: newProperty.location.barangay,
            barangay_psgc_code: newProperty.location.barangay_psgc_code,
            latitude: newProperty.location.coordinates?.lat,
            longitude: newProperty.location.coordinates?.lng,
            beds: newProperty.specs.beds,
            baths: newProperty.specs.baths,
            bedrooms_total: newProperty.specs.bedroomsTotal,
            bathrooms_total_integer: newProperty.specs.bathroomsTotalInteger,
            bathrooms_full: newProperty.specs.bathroomsFull,
            bathrooms_half: newProperty.specs.bathroomsHalf,
            stories_total: newProperty.specs.storiesTotal,
            sqft: newProperty.specs.sqft,
            living_area: newProperty.specs.livingArea,
            living_area_units: newProperty.specs.livingAreaUnits,
            lot_size_area: newProperty.specs.lotSizeArea,
            lot_size_units: newProperty.specs.lotSizeUnits,
            property_type: newProperty.specs.propertyType || 'Residential',
            property_sub_type: newProperty.specs.propertySubType,
            year_built: newProperty.specs.yearBuilt,
            parking_total: newProperty.specs.parkingTotal,
            parking_covered: newProperty.specs.parkingCovered || 0,
            parking_open: newProperty.specs.parkingOpen || 0,
            architectural_style: newProperty.architecturalStyle,
            public_remarks: newProperty.publicRemarks,
            custom_reso_attributes: newProperty.customResoAttributes || {},
            standard_status: newProperty.standardStatus,
            status: newProperty.status,
            is_featured: newProperty.isFeatured ?? false,
            transaction_type: newProperty.specs.transactionType || 'For Sale',
            property_condition: newProperty.specs.propertyCondition,
            created_by: resolvedCreatedBy,
            list_agent_key: resolvedListAgentKey,
          })
          .select()
          .single();

        if (error) {
          logger.error('[PropertyService] Supabase properties insert failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
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
          if (Array.isArray(rawImages) && rawImages.length > 0) {
            const imgRows = rawImages.map((img: any, idx: number) => ({
              property_id: inserted.id,
              image_url: typeof img === 'string' ? img : (img.imageUrl || img.image_url || img),
              display_order: typeof img === 'object' && img ? (img.displayOrder || img.display_order || (idx + 1)) : (idx + 1),
            }));
            await supabaseAdmin.from('property_images').insert(imgRows);

            // Also mirror photos to property_media with media_category = 'Photo'
            const photoMediaRows = imgRows.map((img: any, idx: number) => ({
              property_id: inserted.id,
              media_url: img.image_url,
              media_category: 'Photo',
              order_index: img.display_order || (idx + 1),
              short_description: 'Listing Photo',
              mime_type: 'image/jpeg',
            }));
            await supabaseAdmin.from('property_media').insert(photoMediaRows);
          }

          // Save property_media (FloorPlan, Video, VirtualTour, Document) if provided
          if (Array.isArray(data.media || (data as any).property_media)) {
            const rawMedia = ((data.media || (data as any).property_media) as any[]).filter(
              (m: any) => (m.mediaCategory || m.media_category) !== 'Photo'
            );
            if (rawMedia.length > 0) {
              const mediaRows = rawMedia.map((m: any, idx: number) => ({
                property_id: inserted.id,
                media_url: m.mediaUrl || m.media_url,
                media_category: m.mediaCategory || m.media_category || 'Document',
                order_index: m.orderIndex ?? m.order_index ?? (idx + 1),
                short_description: m.shortDescription || m.short_description || null,
                mime_type: m.mimeType || m.mime_type || 'application/octet-stream',
              }));
              await supabaseAdmin.from('property_media').insert(mediaRows);
            }
          }

          // Insert property_pricing (if table is available)
          const pricingData = data.pricing || {};
          const { error: pricingError } = await supabaseAdmin.from('property_pricing').upsert({
            property_id: inserted.id,
            currency: pricingData.currency || data.listPriceCurrency || 'PHP',
            rent_frequency: pricingData.rentFrequency || null,
            lease_term: pricingData.leaseTerm || null,
            association_fee: pricingData.associationFee ?? data.associationFee ?? null,
            association_fee_frequency: pricingData.associationFeeFrequency || data.associationFeeFrequency || 'Monthly',
            association_fee_includes: Array.isArray(pricingData.associationFeeIncludes) ? pricingData.associationFeeIncludes : [],
            security_deposit: pricingData.securityDeposit ?? null,
            advance_rent: pricingData.advanceRent ?? null,
          });
          if (pricingError) {
            logger.warn('[PropertyService] property_pricing insert note:', pricingError.message);
          }
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB insert exception:', err.message);
      }
    }

    localPropertiesState.unshift(newProperty);
    return newProperty;
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

    // Broker Approval Enforcement:
    // If transitioning standard_status to 'Active' from another status, require role 'broker' or 'admin'
    if (data.standardStatus === 'Active' && existing.standardStatus !== 'Active') {
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

    const updated: PropertyItem = {
      ...existing,
      ...data,
      specs: { ...existing.specs, ...(data.specs || {}) },
      architecturalStyle: data.architecturalStyle ?? existing.architecturalStyle,
      rooms: data.rooms ?? existing.rooms,
      location: mergedLocation,
      standardStatus: data.standardStatus || existing.standardStatus,
      status: (data.standardStatus === 'Active' ? 'available' : existing.status),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('properties')
          .update({
            title: updated.title,
            tagline: updated.tagline,
            price: updated.price,
            standard_status: updated.standardStatus,
            status: updated.status,
            address: updated.location.address,
            unparsed_address: updated.location.unparsedAddress,
            subdivision_name: updated.location.subdivisionName,
            building_name: updated.location.buildingName || updated.location.building_name || null,
            city: updated.location.city,
            state: updated.location.state,
            state_or_province: updated.location.stateOrProvince,
            postal_code: updated.location.postalCode,
            region: updated.location.region,
            region_psgc_code: updated.location.region_psgc_code,
            province_psgc_code: updated.location.province_psgc_code,
            city_psgc_code: updated.location.city_psgc_code,
            barangay: updated.location.barangay,
            barangay_psgc_code: updated.location.barangay_psgc_code,
            latitude: (updated.location.coordinates?.lat !== undefined && updated.location.coordinates?.lat !== null) ? Number(updated.location.coordinates.lat) : null,
            longitude: (updated.location.coordinates?.lng !== undefined && updated.location.coordinates?.lng !== null) ? Number(updated.location.coordinates.lng) : null,
            beds: updated.specs.beds,
            baths: updated.specs.baths,
            bedrooms_total: updated.specs.bedroomsTotal,
            bathrooms_total_integer: updated.specs.bathroomsTotalInteger,
            bathrooms_full: updated.specs.bathroomsFull,
            bathrooms_half: updated.specs.bathroomsHalf,
            stories_total: updated.specs.storiesTotal,
            parking_total: updated.specs.parkingTotal,
            parking_covered: updated.specs.parkingCovered,
            parking_open: updated.specs.parkingOpen,
            property_type: updated.specs.propertyType || 'Residential',
            property_sub_type: updated.specs.propertySubType,
            year_built: updated.specs.yearBuilt,
            architectural_style: updated.architecturalStyle,
            property_condition: updated.specs.propertyCondition,
            sqft: updated.specs.sqft,
            living_area: updated.specs.livingArea,
            living_area_units: updated.specs.livingAreaUnits,
            lot_size_area: updated.specs.lotSizeArea,
            lot_size_units: updated.specs.lotSizeUnits,
            is_featured: data.is_featured !== undefined ? Boolean(data.is_featured) : (data.isFeatured !== undefined ? Boolean(data.isFeatured) : updated.isFeatured),
            updated_at: updated.updatedAt,
          })
          .eq('id', id);

        // Update rooms if provided
        if (Array.isArray(data.rooms)) {
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
            await supabaseAdmin.from('property_rooms').insert(roomRows);
          }
        }

        // Sync property_images if provided (accept propertyImages, property_images, or images)
        const rawImages = data.propertyImages || (data as any).property_images || (Array.isArray(data.images) ? data.images : null);
        if (Array.isArray(rawImages)) {
          await supabaseAdmin.from('property_images').delete().eq('property_id', id);
          if (rawImages.length > 0) {
            const imgRows = rawImages.map((img: any, idx: number) => ({
              property_id: id,
              image_url: typeof img === 'string' ? img : (img.imageUrl || img.image_url || img),
              display_order: typeof img === 'object' && img ? (img.displayOrder || img.display_order || (idx + 1)) : (idx + 1),
            }));
            await supabaseAdmin.from('property_images').insert(imgRows);
          }
        }

        // Sync property_media (FloorPlan, Video, VirtualTour, Document) if provided
        if (Array.isArray(data.media || (data as any).property_media)) {
          const rawMedia = (data.media || (data as any).property_media) as any[];
          await supabaseAdmin.from('property_media').delete().eq('property_id', id);
          if (rawMedia.length > 0) {
            const mediaRows = rawMedia.map((m: any, idx: number) => ({
              property_id: id,
              media_url: m.mediaUrl || m.media_url,
              media_category: m.mediaCategory || m.media_category || 'Document',
              order_index: m.orderIndex ?? m.order_index ?? (idx + 1),
              short_description: m.shortDescription || m.short_description || null,
              mime_type: m.mimeType || m.mime_type || 'application/octet-stream',
            }));
            await supabaseAdmin.from('property_media').insert(mediaRows);
          }
        }

        // Upsert property_pricing
        if (data.pricing || data.associationFee !== undefined || data.associationFeeFrequency !== undefined) {
          const pricingData = data.pricing || {};
          await supabaseAdmin.from('property_pricing').upsert({
            property_id: id,
            currency: pricingData.currency || data.listPriceCurrency || 'PHP',
            rent_frequency: pricingData.rentFrequency || null,
            lease_term: pricingData.leaseTerm || null,
            association_fee: pricingData.associationFee ?? data.associationFee ?? null,
            association_fee_frequency: pricingData.associationFeeFrequency || data.associationFeeFrequency || 'Monthly',
            association_fee_includes: Array.isArray(pricingData.associationFeeIncludes) ? pricingData.associationFeeIncludes : [],
            security_deposit: pricingData.securityDeposit ?? null,
            advance_rent: pricingData.advanceRent ?? null,
          });
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
        logger.warn('[PropertyService] DB update exception:', err.message);
      }
    }

    localPropertiesState = localPropertiesState.map((p) => (p.id === id ? updated : p));
    return updated;
  }

  /**
   * Delete a property listing
   */
  public static async deleteProperty(id: string, userId?: string): Promise<boolean> {
    const exists = await this.findPropertyById(id);
    if (!exists) return false;

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('properties').delete().eq('id', id);
      } catch (err: any) {
        logger.warn('[PropertyService] DB delete exception:', err.message);
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

    // Verify property assignment (defense-in-depth)
    const assignedAgentId = existingProperty.listAgentKey || existingProperty.createdBy || existingProperty.agentId;
    if (assignedAgentId && assignedAgentId !== agentId) {
      throw new Error('Forbidden: You can only propose changes to properties assigned to you.');
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
        if (err.message?.includes('Conflict')) throw err;
        logger.warn('[PropertyService] proposeEdit DB error:', err.message);
      }
    }

    localEditRequestsState.unshift(newRequest);
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
}

export default PropertyService;
