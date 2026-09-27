import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { ResoQueryParser, ParsedFilterCondition } from './resoQueryParser';
import { 
  ResoStandardStatus, 
  ResoMediaItem, 
  ResoRoomItem, 
  ResoConfidentialItem 
} from '../../../shared/types/property';

export interface PropertyFilterQuery {
  city?: string;
  propertyType?: string;
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
  // RESO OData query parameters
  $filter?: string;
  $select?: string;
  $expand?: string;
  $top?: number;
  $skip?: number;
  $orderby?: string;
  $count?: boolean;
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
  media?: ResoMediaItem[];
  rooms?: ResoRoomItem[];
  confidential?: ResoConfidentialItem;
  publicRemarks?: string;
  customResoAttributes?: Record<string, unknown>;
  architecturalStyle?: string;
  standardStatus?: ResoStandardStatus;
  status: 'available' | 'pending' | 'sold';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  listAgentKey?: string;
  agentName?: string;
  agentId?: string;
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

export class PropertyService {
  /**
   * Query properties with filtering, searching, OData parsing, and pagination
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
    const limit = Math.max(1, Math.min(100, Number(query.limit) || Number(query.$top) || 10));

    // Parse RESO OData query parameters
    const parsedOData = ResoQueryParser.parseOData({
      $filter: query.$filter,
      $select: query.$select,
      $expand: query.$expand,
      $top: query.$top,
      $skip: query.$skip,
      $orderby: query.$orderby,
    });

    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabase.from('properties').select('*', { count: 'exact' });

        // Apply standard filter parameters
        if (query.city) {
          dbQuery = dbQuery.ilike('city', `%${query.city}%`);
        }
        if (query.propertyType) {
          dbQuery = dbQuery.ilike('property_type', `%${query.propertyType}%`);
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

        // Apply OData $filter conditions
        for (const cond of parsedOData.conditions) {
          switch (cond.operator) {
            case 'eq':
              dbQuery = dbQuery.eq(cond.column, cond.value);
              break;
            case 'ne':
              dbQuery = dbQuery.neq(cond.column, cond.value);
              break;
            case 'gt':
              dbQuery = dbQuery.gt(cond.column, cond.value);
              break;
            case 'gte':
              dbQuery = dbQuery.gte(cond.column, cond.value);
              break;
            case 'lt':
              dbQuery = dbQuery.lt(cond.column, cond.value);
              break;
            case 'lte':
              dbQuery = dbQuery.lte(cond.column, cond.value);
              break;
          }
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        dbQuery = dbQuery.range(from, to);

        if (parsedOData.orderBy) {
          dbQuery = dbQuery.order(parsedOData.orderBy.column, { ascending: parsedOData.orderBy.ascending });
        } else {
          dbQuery = dbQuery.order('created_at', { ascending: false });
        }

        const { data, count, error } = await dbQuery;

        if (error) {
          logger.warn('[PropertyService] Supabase query failed, using local fixtures:', error.message);
        } else if (data) {
          const total = count || 0;
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
                city: row.city,
                state: row.state,
                stateOrProvince: row.state_or_province || row.state,
                postalCode: row.postal_code,
                coordinates: { lat: row.latitude, lng: row.longitude },
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
                propertyType: row.property_type,
                propertySubType: row.property_sub_type,
                yearBuilt: row.year_built,
                parkingTotal: row.parking_total,
              },
              features: row.features || [],
              interiorFeatures: row.interior_features || [],
              exteriorFeatures: row.exterior_features || [],
              images: row.images || [],
              publicRemarks: row.public_remarks,
              customResoAttributes: row.custom_reso_attributes,
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

            return ResoQueryParser.redactConfidential(item, userRole);
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

    // Local in-memory filter fallback with OData support
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

    // OData $filter conditions evaluated in-memory
    for (const cond of parsedOData.conditions) {
      filtered = filtered.filter((p) => {
        let val: any;
        if (cond.column === 'city') val = p.location.city;
        else if (cond.column === 'price') val = p.price;
        else if (cond.column === 'standard_status') val = p.standardStatus;
        else if (cond.column === 'property_type') val = p.specs.propertyType;
        else if (cond.column === 'bedrooms_total' || cond.column === 'beds') val = p.specs.bedroomsTotal ?? p.specs.beds;
        else if (cond.column === 'bathrooms_total_integer' || cond.column === 'baths') val = p.specs.bathroomsTotalInteger ?? p.specs.baths;
        else if (cond.column === 'living_area') val = p.specs.livingArea ?? p.specs.sqft;
        else if (cond.column === 'listing_id') val = p.listingId;
        else if (cond.column === 'listing_key') val = p.listingKey;

        if (val === undefined || val === null) return true;

        if (typeof val === 'string' && typeof cond.value === 'string') {
          if (cond.operator === 'eq') return val.toLowerCase() === cond.value.toLowerCase();
          if (cond.operator === 'ne') return val.toLowerCase() !== cond.value.toLowerCase();
        }

        const numVal = Number(val);
        const numCond = Number(cond.value);
        if (!isNaN(numVal) && !isNaN(numCond)) {
          if (cond.operator === 'eq') return numVal === numCond;
          if (cond.operator === 'ne') return numVal !== numCond;
          if (cond.operator === 'gt') return numVal > numCond;
          if (cond.operator === 'gte') return numVal >= numCond;
          if (cond.operator === 'lt') return numVal < numCond;
          if (cond.operator === 'lte') return numVal <= numCond;
        }

        return true;
      });
    }

    // Confidential field redaction for client requests
    filtered = filtered.map((item) => {
      const sanitized = ResoQueryParser.redactConfidential(item, userRole);
      // Strip media/rooms if not requested via $expand
      if (parsedOData.expandRelations.length > 0) {
        if (!parsedOData.expandRelations.includes('media')) delete (sanitized as any).media;
        if (!parsedOData.expandRelations.includes('rooms')) delete (sanitized as any).rooms;
      }
      return sanitized;
    });

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
              city: data.city,
              state: data.state,
              stateOrProvince: data.state_or_province || data.state,
              postalCode: data.postal_code,
              coordinates: { lat: data.latitude, lng: data.longitude },
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
              propertyType: data.property_type,
              propertySubType: data.property_sub_type,
              yearBuilt: data.year_built,
              parkingTotal: data.parking_total,
            },
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

          // Fetch media if expanded
          if (expand?.includes('media')) {
            const { data: mediaRows } = await supabase
              .from('property_media')
              .select('*')
              .eq('property_id', data.id)
              .order('order_index', { ascending: true });
            if (mediaRows) {
              item.media = mediaRows.map((m: any) => ({
                mediaKey: m.media_key,
                mediaUrl: m.media_url,
                orderIndex: m.order_index,
                mediaCategory: m.media_category,
                shortDescription: m.short_description,
              }));
            }
          }

          // Fetch confidential if expanded AND authorized
          if (expand?.includes('confidential') && userRole && ['agent', 'broker', 'admin'].includes(userRole)) {
            const { data: confRow } = await supabase
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
            }
          }

          return ResoQueryParser.redactConfidential(item, userRole);
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB getById exception:', err.message);
      }
    }

    const found = localPropertiesState.find(
      (p) => p.id === id || p.listingId === id || p.listingKey === id
    );
    if (!found) return null;

    return ResoQueryParser.redactConfidential({ ...found }, userRole);
  }

  /**
   * Create a new property listing with RESO Data Dictionary attributes
   */
  public static async createProperty(
    data: any,
    userId?: string,
    userRole?: string
  ): Promise<PropertyItem> {
    const isBrokerOrAdmin = userRole && ['broker', 'admin'].includes(userRole);
    // Gating rule: Agents default to Draft or Pending Approval; only broker/admin can direct-publish Active
    const initialStatus = (data.standardStatus === 'Active' && !isBrokerOrAdmin)
      ? 'Pending Approval'
      : (data.standardStatus || 'Draft');

    const generatedId = `prop-${Date.now()}`;
    const newProperty: PropertyItem = {
      id: generatedId,
      listingKey: data.listingKey || `KEY-${Date.now()}`,
      listingId: data.listingId || `MLS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      title: data.title || 'Untitled Luxury Property',
      tagline: data.tagline || '',
      price: Number(data.price) || 0,
      formattedPrice: `₱${(Number(data.price) || 0).toLocaleString()}`,
      listPriceCurrency: data.listPriceCurrency || 'PHP',
      originalListPrice: data.originalListPrice ? Number(data.originalListPrice) : Number(data.price) || 0,
      associationFee: Number(data.associationFee) || 0,
      associationFeeFrequency: data.associationFeeFrequency || 'Monthly',
      taxAnnualAmount: data.taxAnnualAmount ? Number(data.taxAnnualAmount) : undefined,
      location: {
        address: data.location?.address || 'Address pending',
        unparsedAddress: data.location?.unparsedAddress || data.location?.address || 'Address pending',
        subdivisionName: data.location?.subdivisionName,
        city: data.location?.city || 'Metro Manila',
        state: data.location?.state || 'Philippines',
        stateOrProvince: data.location?.stateOrProvince || data.location?.state || 'Metro Manila',
        postalCode: data.location?.postalCode || '1000',
        coordinates: data.location?.coordinates || { lat: 14.55, lng: 121.05 },
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
        propertyType: data.specs?.propertyType || 'Residential',
        propertySubType: data.specs?.propertySubType || 'Single Family Residence',
        yearBuilt: data.specs?.yearBuilt || new Date().getFullYear(),
        parkingTotal: Number(data.specs?.parkingTotal) || 0,
      },
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
      customResoAttributes: data.customResoAttributes,
      architecturalStyle: data.architecturalStyle || 'Modern Architectural',
      standardStatus: initialStatus,
      status: initialStatus === 'Active' ? 'available' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      listAgentKey: userId,
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabaseAdmin
          .from('properties')
          .insert({
            listing_key: newProperty.listingKey,
            listing_id: newProperty.listingId,
            title: newProperty.title,
            tagline: newProperty.tagline,
            price: newProperty.price,
            formatted_price: newProperty.formattedPrice,
            list_price_currency: newProperty.listPriceCurrency,
            original_list_price: newProperty.originalListPrice,
            association_fee: newProperty.associationFee,
            association_fee_frequency: newProperty.associationFeeFrequency,
            tax_annual_amount: newProperty.taxAnnualAmount,
            address: newProperty.location.address,
            unparsed_address: newProperty.location.unparsedAddress,
            subdivision_name: newProperty.location.subdivisionName,
            city: newProperty.location.city,
            state: newProperty.location.state,
            state_or_province: newProperty.location.stateOrProvince,
            postal_code: newProperty.location.postalCode,
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
            property_type: newProperty.specs.propertyType,
            property_sub_type: newProperty.specs.propertySubType,
            year_built: newProperty.specs.yearBuilt,
            parking_total: newProperty.specs.parkingTotal,
            architectural_style: newProperty.architecturalStyle,
            features: newProperty.features,
            interior_features: newProperty.interiorFeatures,
            exterior_features: newProperty.exteriorFeatures,
            images: newProperty.images,
            public_remarks: newProperty.publicRemarks,
            custom_reso_attributes: newProperty.customResoAttributes,
            standard_status: newProperty.standardStatus,
            status: newProperty.status,
            created_by: userId,
            list_agent_key: userId,
          })
          .select()
          .single();

        if (!error && inserted) {
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

    const updated: PropertyItem = {
      ...existing,
      ...data,
      specs: { ...existing.specs, ...(data.specs || {}) },
      location: { ...existing.location, ...(data.location || {}) },
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
            city: updated.location.city,
            beds: updated.specs.beds,
            baths: updated.specs.baths,
            sqft: updated.specs.sqft,
            living_area: updated.specs.livingArea,
            updated_at: updated.updatedAt,
          })
          .eq('id', id);
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
}

export default PropertyService;
