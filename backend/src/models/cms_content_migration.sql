-- ==============================================================================
-- CP_kerby Realty Corporation Content Management System (CMS)
-- Migration: Corporation Pages, Guides, FAQs, Hero Banners & Featured Collections
-- ==============================================================================

BEGIN;

-- 1. UNIFIED CMS CONTENTS TABLE
CREATE TABLE IF NOT EXISTS public.cms_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('page', 'article', 'faq', 'banner')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  media_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Prevent duplicate active slugs per content type while allowing archived reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_contents_active_slug
  ON public.cms_contents (content_type, slug)
  WHERE status <> 'ARCHIVED';

-- Fast public reads for published content ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_cms_contents_published_lookup
  ON public.cms_contents (content_type, sort_order, published_at DESC)
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_cms_contents_author_id
  ON public.cms_contents (author_id);


-- 2. FEATURED PROPERTY COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.cms_featured_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_collections_active_slug
  ON public.cms_featured_collections (slug)
  WHERE status <> 'ARCHIVED';

CREATE INDEX IF NOT EXISTS idx_cms_collections_published
  ON public.cms_featured_collections (sort_order)
  WHERE status = 'PUBLISHED';


-- 3. COLLECTION <-> PROPERTY JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.cms_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.cms_featured_collections(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  custom_badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (collection_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_cms_collection_items_order
  ON public.cms_collection_items (collection_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_cms_collection_items_property_id
  ON public.cms_collection_items (property_id);


-- 4. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_cms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cms_contents_updated_at ON public.cms_contents;
CREATE TRIGGER trg_cms_contents_updated_at
  BEFORE UPDATE ON public.cms_contents
  FOR EACH ROW EXECUTE FUNCTION public.set_cms_updated_at();

DROP TRIGGER IF EXISTS trg_cms_collections_updated_at ON public.cms_featured_collections;
CREATE TRIGGER trg_cms_collections_updated_at
  BEFORE UPDATE ON public.cms_featured_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_cms_updated_at();


-- 5. ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.cms_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_featured_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_collection_items ENABLE ROW LEVEL SECURITY;

-- Public read-only access to published records
DROP POLICY IF EXISTS cms_contents_public_read ON public.cms_contents;
CREATE POLICY cms_contents_public_read
  ON public.cms_contents FOR SELECT
  USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS cms_collections_public_read ON public.cms_featured_collections;
CREATE POLICY cms_collections_public_read
  ON public.cms_featured_collections FOR SELECT
  USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS cms_collection_items_public_read ON public.cms_collection_items;
CREATE POLICY cms_collection_items_public_read
  ON public.cms_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_featured_collections c
      WHERE c.id = cms_collection_items.collection_id
        AND c.status = 'PUBLISHED'
    )
  );

-- Admin-only full access (wrapped auth.uid() avoids per-row re-evaluation)
DROP POLICY IF EXISTS cms_contents_admin_all ON public.cms_contents;
CREATE POLICY cms_contents_admin_all
  ON public.cms_contents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS cms_collections_admin_all ON public.cms_featured_collections;
CREATE POLICY cms_collections_admin_all
  ON public.cms_featured_collections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS cms_collection_items_admin_all ON public.cms_collection_items;
CREATE POLICY cms_collection_items_admin_all
  ON public.cms_collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

COMMIT;
