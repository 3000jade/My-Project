import { z } from 'zod';

export const cmsContentTypeEnum = z.enum(['page', 'article', 'faq', 'banner']);
export const cmsStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCmsContentSchema = z.object({
  content_type: cmsContentTypeEnum,
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(120, 'Slug cannot exceed 120 characters.')
    .regex(slugRegex, 'Slug must use lowercase letters, numbers, and hyphens only.'),
  title: z.string().trim().min(2, 'Title is required.').max(200),
  summary: z.string().trim().max(500).optional().nullable(),
  body: z.string().optional().nullable(),
  media_url: z.string().trim().max(1000).optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  status: cmsStatusEnum.optional().default('DRAFT'),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export const updateCmsContentSchema = createCmsContentSchema.partial();

export const queryCmsContentSchema = z.object({
  type: cmsContentTypeEnum.optional(),
  status: cmsStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
});

export const createCollectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, 'Slug must use lowercase letters, numbers, and hyphens only.'),
  title: z.string().trim().min(2, 'Collection title is required.').max(160),
  description: z.string().trim().max(500).optional().nullable(),
  status: cmsStatusEnum.optional().default('DRAFT'),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const syncCollectionItemsSchema = z.object({
  items: z
    .array(
      z.object({
        property_id: z.string().uuid('Invalid property ID format.'),
        sort_order: z.coerce.number().int().min(0).optional(),
        custom_badge: z.string().trim().max(40).optional().nullable(),
      })
    )
    .max(24, 'A featured collection can hold at most 24 properties.'),
});

export type CmsContentType = z.infer<typeof cmsContentTypeEnum>;
export type CmsStatus = z.infer<typeof cmsStatusEnum>;
