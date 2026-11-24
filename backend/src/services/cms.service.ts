import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import {
  AUTO_SLUG_CONTENT_TYPES,
  type CmsContentType,
  type CmsStatus,
} from '../schemas/cms.schema';

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
  {
    id: 'cms-office-1',
    content_type: 'office',
    slug: 'makati-flagship-office',
    title: 'Makati Flagship Office',
    summary: 'Private advisory headquarters serving Metro Manila luxury residences.',
    body: null,
    media_url: null,
    payload: {
      address: '123 Ayala Avenue, Makati City 1226',
      phone: '+63 2 8888 1200',
      email: 'makati@humanshelterrealty.ph',
      hours: 'Mon-Sat, 9:00 AM - 6:00 PM',
    },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cms-staff-1',
    content_type: 'staff',
    slug: 'elena-santos-principal-broker',
    title: 'Elena Santos',
    summary: 'Licensed real estate broker specializing in Makati and BGC estates.',
    body: null,
    media_url: null,
    payload: {
      department: 'Executive Advisory',
      role: 'Principal Broker',
      license_no: 'PRC #0012485',
    },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cms-partner-1',
    content_type: 'partner',
    slug: 'ayala-land-premier',
    title: 'Ayala Land Premier',
    summary: 'Accredited luxury residential developer partner.',
    body: null,
    media_url: null,
    payload: {
      partner_type: 'developer',
      website_url: 'https://www.ayalalandpremier.com',
    },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cms-award-1',
    content_type: 'award',
    slug: 'top-luxury-brokerage-2025',
    title: 'Top Luxury Brokerage Firm',
    summary: 'Recognized for premier residential advisory across Metro Manila.',
    body: null,
    media_url: null,
    payload: {
      year: '2025',
      organization: 'Philippine Property Excellence Awards',
      featured: true,
    },
    status: 'PUBLISHED',
    sort_order: 1,
    author_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const AUTO_SLUG_SET = new Set<string>(AUTO_SLUG_CONTENT_TYPES);
const DUPLICATE_SLUG_ERROR = 'That web address is already in use. Please choose another.';
let mockIdSequence = 0;

/**
 * Converts a title or raw slug input into a URL-safe slug, with a timestamp fallback for short inputs.
 */
export function slugifyTitle(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
  return normalized.length >= 2 ? normalized : `item-${Date.now().toString(36)}`;
}

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, '0');
}

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

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        /does not exist|schema cache/i.test(error.message || '')
      ) {
        return [];
      }
      throw new Error(error.message);
    }
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
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        /does not exist|schema cache/i.test(error.message || '')
      ) {
        return [];
      }
      throw new Error(error.message);
    }
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
    const isAutoSlug = AUTO_SLUG_SET.has(String(input.content_type));
    let resolvedSlug = input.slug?.trim()
      ? slugifyTitle(input.slug)
      : slugifyTitle(input.title || 'item');

    if (!isSupabaseConfigured) {
      const hasCollision = (candidateSlug: string) =>
        mockContents.some(
          (item) =>
            item.content_type === input.content_type &&
            item.slug === candidateSlug &&
            item.status !== 'ARCHIVED'
        );

      if (hasCollision(resolvedSlug)) {
        if (!isAutoSlug) {
          throw new Error(DUPLICATE_SLUG_ERROR);
        }
        const baseSlug = resolvedSlug;
        do {
          resolvedSlug = `${baseSlug}-${randomSlugSuffix()}`;
        } while (hasCollision(resolvedSlug));
      }

      mockIdSequence += 1;
      const record: CmsContentRecord = {
        id: `cms-${Date.now()}-${mockIdSequence}`,
        content_type: input.content_type as CmsContentType,
        slug: resolvedSlug,
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

    const insertPayload = {
      ...input,
      slug: resolvedSlug,
      author_id: authorId,
      published_at: publishedAt,
    };

    const { data, error } = await supabaseAdmin
      .from('cms_contents')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        if (isAutoSlug) {
          const retrySlug = `${resolvedSlug}-${randomSlugSuffix()}`;
          const retryResult = await supabaseAdmin
            .from('cms_contents')
            .insert({ ...insertPayload, slug: retrySlug })
            .select('*')
            .single();

          if (!retryResult.error) {
            return retryResult.data as CmsContentRecord;
          }
          if (retryResult.error.code === '23505') {
            throw new Error(DUPLICATE_SLUG_ERROR);
          }
          throw new Error(retryResult.error.message);
        }
        throw new Error(DUPLICATE_SLUG_ERROR);
      }
      throw new Error(error.message);
    }
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

      const existing = mockContents[idx];
      const nextSlug =
        typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : existing.slug;
      const nextType = (input.content_type as CmsContentType | undefined) || existing.content_type;
      const nextStatus = (input.status as CmsStatus | undefined) || existing.status;

      if (
        nextStatus !== 'ARCHIVED' &&
        (input.slug !== undefined || input.status !== undefined || input.content_type !== undefined) &&
        mockContents.some(
          (item) =>
            item.id !== id &&
            item.content_type === nextType &&
            item.slug === nextSlug &&
            item.status !== 'ARCHIVED'
        )
      ) {
        throw new Error(DUPLICATE_SLUG_ERROR);
      }

      mockContents[idx] = {
        ...existing,
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

    if (error) {
      if (error.code === '23505') {
        throw new Error(DUPLICATE_SLUG_ERROR);
      }
      throw new Error(error.message);
    }
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
