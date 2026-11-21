import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import type { CmsContentType, CmsStatus } from '../schemas/cms.schema';

export interface CmsContentRecord {
  id: string;
  content_type: CmsContentType;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  media_url?: string | null;
  payload: Record<string, unknown>;
  status: CmsStatus;
  sort_order: number;
  author_id?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsCollectionRecord {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: CmsStatus;
  sort_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    property_id: string;
    sort_order: number;
    custom_badge?: string | null;
    property?: Record<string, unknown> | null;
  }>;
}

// In-memory store used only when Supabase env vars are not configured (local dev/tests)
const mockContents: CmsContentRecord[] = [
  {
    id: 'cms-banner-1',
    content_type: 'banner',
    slug: 'home-hero-primary',
    title: 'Architectural Homes Across Metro Manila',
    summary: 'Curated residences and investment lots vetted by licensed Philippine brokers.',
    body: null,
    media_url: null,
    payload: { cta_label: 'Explore Listings', cta_url: '/properties' },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cms-faq-1',
    content_type: 'faq',
    slug: 'how-to-schedule-viewing',
    title: 'How do I schedule a private property viewing?',
    summary: null,
    body: 'Open any active property listing and click Request Viewing. A licensed agent will confirm your preferred date within 24 hours.',
    media_url: null,
    payload: { category: 'Buyers' },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockCollections: CmsCollectionRecord[] = [];

export class CmsService {
  /**
   * Public: list PUBLISHED content items by type
   */
  public static async listPublicContents(type: CmsContentType): Promise<CmsContentRecord[]> {
    if (!isSupabaseConfigured) {
      return mockContents
        .filter((item) => item.content_type === type && item.status === 'PUBLISHED')
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    const { data, error } = await supabaseAdmin
      .from('cms_contents')
      .select('*')
      .eq('content_type', type)
      .eq('status', 'PUBLISHED')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as CmsContentRecord[];
  }

  /**
   * Public: fetch one PUBLISHED content item by type + slug
   */
  public static async getPublicContentBySlug(
    type: CmsContentType,
    slug: string
  ): Promise<CmsContentRecord | null> {
    if (!isSupabaseConfigured) {
      return (
        mockContents.find(
          (item) => item.content_type === type && item.slug === slug && item.status === 'PUBLISHED'
        ) || null
      );
    }

    const { data, error } = await supabaseAdmin
      .from('cms_contents')
      .select('*')
      .eq('content_type', type)
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as CmsContentRecord) || null;
  }

  /**
   * Public: list PUBLISHED featured collections with their active properties
   */
  public static async listPublicCollections(): Promise<CmsCollectionRecord[]> {
    if (!isSupabaseConfigured) {
      return mockCollections
        .filter((c) => c.status === 'PUBLISHED')
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    const { data, error } = await supabaseAdmin
      .from('cms_featured_collections')
      .select(
        `
        *,
        items:cms_collection_items (
          id,
          property_id,
          sort_order,
          custom_badge,
          property:properties (
            id,
            title,
            price,
            city,
            barangay,
            property_sub_type,
            standard_status,
            bedrooms_total,
            bathrooms_total_integer,
            living_area,
            lot_size_area
          )
        )
      `
      )
      .eq('status', 'PUBLISHED')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);

    const activeCollections = (data || []).map((collection: any) => ({
      ...collection,
      items: (collection.items || [])
        .filter((item: any) => item.property && item.property.standard_status === 'Active')
        .sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));

    // Batch-fetch primary photo for active properties from property_media / property_images
    const propIds = Array.from(
      new Set(
        activeCollections.flatMap((c: any) => c.items.map((item: any) => item.property_id))
      )
    );
    const photoMap: Record<string, string> = {};
    if (propIds.length > 0) {
      const { data: mediaRows } = await supabaseAdmin
        .from('property_media')
        .select('property_id, media_url, order_index')
        .in('property_id', propIds)
        .eq('media_category', 'Photo')
        .order('order_index', { ascending: true });
      for (const row of mediaRows || []) {
        if (row.property_id && row.media_url && !photoMap[row.property_id]) {
          photoMap[row.property_id] = row.media_url;
        }
      }
      const missingIds = propIds.filter((id) => !photoMap[id]);
      if (missingIds.length > 0) {
        const { data: imgRows } = await supabaseAdmin
          .from('property_images')
          .select('property_id, image_url, display_order')
          .in('property_id', missingIds)
          .order('display_order', { ascending: true });
        for (const row of imgRows || []) {
          if (row.property_id && row.image_url && !photoMap[row.property_id]) {
            photoMap[row.property_id] = row.image_url;
          }
        }
      }
    }

    return activeCollections.map((collection: any) => ({
      ...collection,
      items: collection.items.map((item: any) => ({
        ...item,
        property: {
          ...item.property,
          images: photoMap[item.property_id] ? [photoMap[item.property_id]] : [],
        },
      })),
    })) as CmsCollectionRecord[];
  }

  /**
   * Admin: list all contents across statuses
   */
  public static async listAdminContents(filters: {
    type?: CmsContentType;
    status?: CmsStatus;
    search?: string;
  }): Promise<CmsContentRecord[]> {
    if (!isSupabaseConfigured) {
      return mockContents.filter((item) => {
        if (filters.type && item.content_type !== filters.type) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
        }
        return true;
      });
    }

    let query = supabaseAdmin
      .from('cms_contents')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (filters.type) query = query.eq('content_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as CmsContentRecord[];
  }

  /**
   * Admin: create content item
   */
  public static async createContent(
    authorId: string,
    input: Partial<CmsContentRecord>
  ): Promise<CmsContentRecord> {
    const now = new Date().toISOString();
    const publishedAt = input.status === 'PUBLISHED' ? now : null;

    if (!isSupabaseConfigured) {
      const record: CmsContentRecord = {
        id: `cms-${Date.now()}`,
        content_type: input.content_type as CmsContentType,
        slug: input.slug!,
        title: input.title!,
        summary: input.summary ?? null,
        body: input.body ?? null,
        media_url: input.media_url ?? null,
        payload: input.payload || {},
        status: (input.status as CmsStatus) || 'DRAFT',
        sort_order: input.sort_order ?? 0,
        author_id: authorId,
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      };
      mockContents.unshift(record);
      return record;
    }

    const { data, error } = await supabaseAdmin
      .from('cms_contents')
      .insert({
        ...input,
        author_id: authorId,
        published_at: publishedAt,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as CmsContentRecord;
  }

  /**
   * Admin: update content item
   */
  public static async updateContent(
    id: string,
    input: Partial<CmsContentRecord>
  ): Promise<CmsContentRecord> {
    const updates: Record<string, unknown> = { ...input };
    if (input.status === 'PUBLISHED') {
      updates.published_at = new Date().toISOString();
    }

    if (!isSupabaseConfigured) {
      const idx = mockContents.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error('Content item not found.');
      mockContents[idx] = {
        ...mockContents[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      } as CmsContentRecord;
      return mockContents[idx];
    }

    const { data, error } = await supabaseAdmin
      .from('cms_contents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as CmsContentRecord;
  }

  /**
   * Admin: delete content item
   */
  public static async deleteContent(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = mockContents.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error('Content item not found.');
      mockContents.splice(idx, 1);
      return;
    }

    const { error } = await supabaseAdmin.from('cms_contents').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /**
   * Admin: list all featured collections with linked items
   */
  public static async listAdminCollections(): Promise<CmsCollectionRecord[]> {
    if (!isSupabaseConfigured) {
      return mockCollections;
    }

    const { data, error } = await supabaseAdmin
      .from('cms_featured_collections')
      .select(
        `
        *,
        items:cms_collection_items (
          id,
          property_id,
          sort_order,
          custom_badge,
          property:properties (id, title, price, city, standard_status)
        )
      `
      )
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as CmsCollectionRecord[];
  }

  public static async createCollection(
    actorId: string,
    input: Partial<CmsCollectionRecord>
  ): Promise<CmsCollectionRecord> {
    const now = new Date().toISOString();
    if (!isSupabaseConfigured) {
      const record: CmsCollectionRecord = {
        id: `col-${Date.now()}`,
        slug: input.slug!,
        title: input.title!,
        description: input.description ?? null,
        status: (input.status as CmsStatus) || 'DRAFT',
        sort_order: input.sort_order ?? 0,
        created_by: actorId,
        created_at: now,
        updated_at: now,
        items: [],
      };
      mockCollections.unshift(record);
      return record;
    }

    const { data, error } = await supabaseAdmin
      .from('cms_featured_collections')
      .insert({ ...input, created_by: actorId })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { ...(data as CmsCollectionRecord), items: [] };
  }

  public static async updateCollection(
    id: string,
    input: Partial<CmsCollectionRecord>
  ): Promise<CmsCollectionRecord> {
    if (!isSupabaseConfigured) {
      const idx = mockCollections.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Collection not found.');
      mockCollections[idx] = { ...mockCollections[idx], ...input, updated_at: new Date().toISOString() };
      return mockCollections[idx];
    }

    const { data, error } = await supabaseAdmin
      .from('cms_featured_collections')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as CmsCollectionRecord;
  }

  public static async deleteCollection(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = mockCollections.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Collection not found.');
      mockCollections.splice(idx, 1);
      return;
    }

    const { error } = await supabaseAdmin.from('cms_featured_collections').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /**
   * Admin: replace ordered property list inside a featured collection
   */
  public static async syncCollectionItems(
    collectionId: string,
    items: Array<{ property_id: string; sort_order?: number; custom_badge?: string | null }>
  ): Promise<void> {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.property_id)) {
        throw new Error('Duplicate property IDs are not allowed in the same collection.');
      }
      seen.add(item.property_id);
    }

    if (!isSupabaseConfigured) {
      const col = mockCollections.find((c) => c.id === collectionId);
      if (!col) throw new Error('Collection not found.');
      col.items = items.map((item, idx) => ({
        id: `ci-${Date.now()}-${idx}`,
        property_id: item.property_id,
        sort_order: item.sort_order ?? idx,
        custom_badge: item.custom_badge ?? null,
      }));
      return;
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('cms_collection_items')
      .delete()
      .eq('collection_id', collectionId);
    if (deleteErr) throw new Error(deleteErr.message);

    if (items.length === 0) return;

    const rows = items.map((item, idx) => ({
      collection_id: collectionId,
      property_id: item.property_id,
      sort_order: item.sort_order ?? idx,
      custom_badge: item.custom_badge ?? null,
    }));

    const { error: insertErr } = await supabaseAdmin.from('cms_collection_items').insert(rows);
    if (insertErr) throw new Error(insertErr.message);
  }
}
