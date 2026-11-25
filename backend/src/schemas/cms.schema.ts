import { z } from 'zod';

export const cmsContentTypeEnum = z.enum([
  'banner',
  'page',
  'office',
  'staff',
  'partner',
  'award',
  'article',
  'faq',
]);

export const AUTO_SLUG_CONTENT_TYPES = [
  'banner',
  'office',
  'staff',
  'partner',
  'award',
  'faq',
] as const;

export const cmsStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_REQUIRED_TYPES = new Set<string>(['page', 'article']);

/**
 * Validates that a CMS media URL is empty, a trusted internal path, or an http(s) URL.
 */
export function isSafeMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/api/drive/media/') || trimmed.startsWith('/images/')) {
    return !/\s/.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyYear(value: unknown): boolean {
  if (hasNonEmptyString(value)) return true;
  return typeof value === 'number' && Number.isFinite(value);
}

function validatePayloadEnums(
  payload: Record<string, unknown> | undefined,
  ctx: z.RefinementCtx
): void {
  if (!payload) return;

  if (
    payload.partner_type !== undefined &&
    payload.partner_type !== 'developer' &&
    payload.partner_type !== 'bank'
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['payload', 'partner_type'],
      message: "Partner type must be 'developer' or 'bank'.",
    });
  }

  if (
    payload.media_type !== undefined &&
    payload.media_type !== 'image' &&
    payload.media_type !== 'video'
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['payload', 'media_type'],
      message: "Media type must be 'image' or 'video'.",
    });
  }
}

const slugFieldSchema = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(
    z
      .string()
      .min(2, 'Slug must be at least 2 characters.')
      .max(120, 'Slug cannot exceed 120 characters.')
      .regex(slugRegex, 'Slug must use lowercase letters, numbers, and hyphens only.')
      .optional()
  )
  .optional()
  .nullable();

const mediaUrlFieldSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isSafeMediaUrl, {
    message: 'Media URL must be a valid http(s) URL, /api/drive/media/..., or /images/... path.',
  })
  .transform((val) => (val === '' ? null : val))
  .optional()
  .nullable();

const baseCmsContentSchema = z.object({
  content_type: cmsContentTypeEnum,
  slug: slugFieldSchema,
  title: z.string().trim().min(2, 'Title is required.').max(200),
  summary: z.string().trim().max(500).optional().nullable(),
  body: z.string().optional().nullable(),
  media_url: mediaUrlFieldSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
  status: cmsStatusEnum.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const createCmsContentSchema = baseCmsContentSchema
  .extend({
    payload: z.record(z.string(), z.unknown()).optional().default({}),
    status: cmsStatusEnum.optional().default('DRAFT'),
    sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  })
  .superRefine((data, ctx) => {
    const payload = data.payload ?? {};

    if (SLUG_REQUIRED_TYPES.has(data.content_type) && !hasNonEmptyString(data.slug)) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'Slug is required for page and article content.',
      });
    }

    if (data.content_type === 'staff') {
      if (!hasNonEmptyString(payload.department)) {
        ctx.addIssue({
          code: 'custom',
          path: ['payload', 'department'],
          message: 'Department is required for staff profiles.',
        });
      }
      if (!hasNonEmptyString(payload.role)) {
        ctx.addIssue({
          code: 'custom',
          path: ['payload', 'role'],
          message: 'Role is required for staff profiles.',
        });
      }
    }

    if (data.content_type === 'office' && !hasNonEmptyString(payload.address)) {
      ctx.addIssue({
        code: 'custom',
        path: ['payload', 'address'],
        message: 'Address is required for office branches.',
      });
    }

    if (
      data.content_type === 'partner' &&
      payload.partner_type !== 'developer' &&
      payload.partner_type !== 'bank'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['payload', 'partner_type'],
        message: "Partner type is required and must be 'developer' or 'bank'.",
      });
    }

    if (data.content_type === 'award') {
      if (!hasNonEmptyYear(payload.year)) {
        ctx.addIssue({
          code: 'custom',
          path: ['payload', 'year'],
          message: 'Year is required for awards.',
        });
      }
      if (!hasNonEmptyString(payload.organization)) {
        ctx.addIssue({
          code: 'custom',
          path: ['payload', 'organization'],
          message: 'Organization is required for awards.',
        });
      }
    }

    validatePayloadEnums(payload, ctx);
  });

export const updateCmsContentSchema = baseCmsContentSchema
  .partial()
  .superRefine((data, ctx) => {
    validatePayloadEnums(data.payload, ctx);
  });

export const queryCmsContentSchema = z.object({
  type: cmsContentTypeEnum.optional(),
  status: cmsStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
});

export type CmsContentType = z.infer<typeof cmsContentTypeEnum>;
export type CmsStatus = z.infer<typeof cmsStatusEnum>;
