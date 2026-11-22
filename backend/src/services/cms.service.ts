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

// Strip PostgREST .or() syntax characters so user search text cannot break filter parsing
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,().]/g, ' ').trim();
}

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
      const safeSearch = sanitizeSearchTerm(filters.search);
      if (safeSearch) {
        query = query.or(`title.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
      }
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
      if (idx !== -1) mockContents.splice(idx, 1);
      return;
    }

    const { error } = await supabaseAdmin.from('cms_contents').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
