-- Create public.cms_contents table for the Content Management Module (CMS)
CREATE TABLE IF NOT EXISTS public.cms_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('page', 'article', 'faq', 'banner')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  media_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_contents_public
  ON public.cms_contents (content_type, status, sort_order);

ALTER TABLE public.cms_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published cms contents" ON public.cms_contents;
CREATE POLICY "Public can read published cms contents"
  ON public.cms_contents
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');
