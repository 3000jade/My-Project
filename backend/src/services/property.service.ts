import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export interface PropertyFilterQuery {
  city?: string;
  propertyType?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  agentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PropertyItem {
  id: string;
  title: string;
  tagline?: string;
  price: number;
  formattedPrice?: string;
  mainImage?: string;
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
  createdBy?: string;
  agentName?: string;
  agentId?: string;
}

// In-memory fallback seed fixtures for local development
const SEED_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-1',
    title: 'Ayala Alabang Estate',
    tagline: 'Refined Brutalist Modernism',
    price: 185000000,
    formattedPrice: '₱185,000,000',
    location: {
      address: '123 Narra Street, Ayala Alabang',
      city: 'Muntinlupa',
      state: 'Metro Manila',
      coordinates: { lat: 14.426, lng: 121.031 },
    },
    specs: {
      beds: 5,
      baths: 6,
      sqft: 850,
      propertyType: 'Estate',
      yearBuilt: 2024,
    },
    features: ['Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home System'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    ],
    architecturalStyle: 'Modern Tropical',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prop-2',
    title: 'Forbes Park Pavilion',
    tagline: 'Timeless Architectural Heritage',
    price: 340000000,
    formattedPrice: '₱340,000,000',
    location: {
      address: '88 Cambridge Circle, Forbes Park',
      city: 'Makati',
      state: 'Metro Manila',
      coordinates: { lat: 14.549, lng: 121.038 },
    },
    specs: {
      beds: 6,
      baths: 7,
      sqft: 1200,
      propertyType: 'Villa',
      yearBuilt: 2025,
    },
    features: ['Lap Pool', 'Sculpture Garden', 'Helipad', 'Catering Kitchen'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    ],
    architecturalStyle: 'Brutalist Minimalist',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prop-3',
    title: 'Dasmarinas Village Sanctuary',
    tagline: 'Organic Luxury & Zen Courtyards',
    price: 295000000,
    formattedPrice: '₱295,000,000',
    location: {
      address: '42 Palm Avenue, Dasmarinas Village',
      city: 'Makati',
      state: 'Metro Manila',
      coordinates: { lat: 14.542, lng: 121.029 },
    },
    specs: {
      beds: 4,
      baths: 5,
      sqft: 750,
      propertyType: 'Single Family',
      yearBuilt: 2023,
    },
    features: ['Internal Courtyard', 'Zen Koi Pond', 'Solar Array', 'Wine Room'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    ],
    architecturalStyle: 'Japanese Contemporary',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let localPropertiesState = [...SEED_PROPERTIES];

export class PropertyService {
  /**
   * Query properties with filtering, searching, and pagination
   */
  public static async findProperties(query: PropertyFilterQuery = {}): Promise<{
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

        if (query.city) {
          dbQuery = dbQuery.ilike('city', `%${query.city}%`);
        }
        if (query.propertyType) {
          dbQuery = dbQuery.ilike('property_type', `%${query.propertyType}%`);
        }
        if (query.transactionType) {
          dbQuery = dbQuery.ilike('transaction_type', `%${query.transactionType}%`);
        }
        if (query.status) {
          dbQuery = dbQuery.eq('status', query.status);
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
        if (query.search) {
          dbQuery = dbQuery.or(`title.ilike.%${query.search}%,address.ilike.%${query.search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        dbQuery = dbQuery.range(from, to).order('created_at', { ascending: false });

        const { data, count, error } = await dbQuery;

        if (error) {
          logger.warn('[PropertyService] Supabase query failed, using local fixtures:', error.message);
        } else if (data) {
          const total = count || 0;
          const mapped: PropertyItem[] = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            tagline: row.tagline,
            price: Number(row.price),
            formattedPrice: row.formatted_price || `₱${Number(row.price).toLocaleString()}`,
            mainImage: (row.images && row.images[0]) || '',
            location: {
              address: row.address,
              city: row.city,
              state: row.state,
              coordinates: { lat: row.latitude, lng: row.longitude },
            },
            specs: {
              beds: row.beds,
              baths: row.baths,
              sqft: row.sqft,
              propertyType: row.property_type,
              yearBuilt: row.year_built,
            },
            features: row.features || [],
            images: row.images || [],
            architecturalStyle: row.architectural_style,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            agentName: 'Elena Rossi',
            agentId: row.created_by || 'agent-1',
          }));

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
    if (query.transactionType) {
      filtered = filtered.filter((p: any) =>
        (p.transactionType || '').toLowerCase().includes(query.transactionType!.toLowerCase())
      );
    }
    if (query.status) {
      filtered = filtered.filter((p) => p.status === query.status);
    }
    if (query.agentId) {
      filtered = filtered.filter((p) => p.createdBy === query.agentId || (p as any).agent_id === query.agentId || p.agentId === query.agentId);
    }
    if (query.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number(query.minPrice));
    }
    if (query.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number(query.maxPrice));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.location.address.toLowerCase().includes(q)
      );
    }

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
   * Find a single property by ID
   */
  public static async findPropertyById(id: string): Promise<PropertyItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            title: data.title,
            tagline: data.tagline,
            price: Number(data.price),
            formattedPrice: data.formatted_price || `₱${Number(data.price).toLocaleString()}`,
            mainImage: (data.images && data.images[0]) || '',
            location: {
              address: data.address,
              city: data.city,
              state: data.state,
              coordinates: { lat: data.latitude, lng: data.longitude },
            },
            specs: {
              beds: data.beds,
              baths: data.baths,
              sqft: data.sqft,
              propertyType: data.property_type,
              yearBuilt: data.year_built,
            },
            features: data.features || [],
            images: data.images || [],
            architecturalStyle: data.architectural_style,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            createdBy: data.created_by,
            agentName: 'Elena Rossi',
            agentId: data.created_by || 'agent-1',
          };
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB getById exception:', err.message);
      }
    }

    const found = localPropertiesState.find((p) => p.id === id);
    return found || null;
  }

  /**
   * Create a new property listing
   */
  public static async createProperty(
    data: Partial<PropertyItem>,
    userId?: string
  ): Promise<PropertyItem> {
    const newProperty: PropertyItem = {
      id: `prop-${Date.now()}`,
      title: data.title || 'Untitled Luxury Property',
      tagline: data.tagline || '',
      price: Number(data.price) || 0,
      formattedPrice: `₱${(Number(data.price) || 0).toLocaleString()}`,
      location: {
        address: data.location?.address || 'Address pending',
        city: data.location?.city || 'Metro Manila',
        state: data.location?.state || 'Philippines',
        coordinates: data.location?.coordinates || { lat: 14.55, lng: 121.05 },
      },
      specs: {
        beds: Number(data.specs?.beds) || 1,
        baths: Number(data.specs?.baths) || 1,
        sqft: Number(data.specs?.sqft) || 100,
        propertyType: data.specs?.propertyType || 'Villa',
        yearBuilt: data.specs?.yearBuilt || new Date().getFullYear(),
      },
      features: data.features || [],
      images: data.images?.length
        ? data.images
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'],
      architecturalStyle: data.architecturalStyle || 'Modern Architectural',
      status: data.status || 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabaseAdmin
          .from('properties')
          .insert({
            title: newProperty.title,
            tagline: newProperty.tagline,
            price: newProperty.price,
            formatted_price: newProperty.formattedPrice,
            address: newProperty.location.address,
            city: newProperty.location.city,
            state: newProperty.location.state,
            latitude: newProperty.location.coordinates?.lat,
            longitude: newProperty.location.coordinates?.lng,
            beds: newProperty.specs.beds,
            baths: newProperty.specs.baths,
            sqft: newProperty.specs.sqft,
            property_type: newProperty.specs.propertyType,
            year_built: newProperty.specs.yearBuilt,
            architectural_style: newProperty.architecturalStyle,
            features: newProperty.features,
            images: newProperty.images,
            status: newProperty.status,
            created_by: userId,
          })
          .select()
          .single();

        if (!error && inserted) {
          newProperty.id = inserted.id;
        }
      } catch (err: any) {
        logger.warn('[PropertyService] DB insert exception:', err.message);
      }
    }

    localPropertiesState.unshift(newProperty);
    return newProperty;
  }

  /**
   * Update an existing property listing
   */
  public static async updateProperty(
    id: string,
    data: Partial<PropertyItem>,
    userId?: string
  ): Promise<PropertyItem | null> {
    const existing = await this.findPropertyById(id);
    if (!existing) return null;

    const updated: PropertyItem = {
      ...existing,
      ...data,
      specs: { ...existing.specs, ...data.specs },
      location: { ...existing.location, ...data.location },
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
            address: updated.location.address,
            city: updated.location.city,
            beds: updated.specs.beds,
            baths: updated.specs.baths,
            sqft: updated.specs.sqft,
            status: updated.status,
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
