-- Expand cms_contents.content_type to cover all private realty CMS sections
BEGIN;

ALTER TABLE public.cms_contents
  DROP CONSTRAINT IF EXISTS cms_contents_content_type_check;

ALTER TABLE public.cms_contents
  ADD CONSTRAINT cms_contents_content_type_check
  CHECK (content_type IN ('banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'));

COMMIT;
