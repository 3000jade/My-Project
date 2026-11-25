# Private Realty Content Management System (CMS) Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Admin Content Management desk, backend CMS API/schema, and public website sections so Super Admins can manage all six private realty content areas (Banners, Company & Contact / Office Branches, Staff Directory, Partners & Awards, Buyer Guides, and FAQs) with tailored forms, dual file-upload/URL media picking, and safe public fallbacks.

**Architecture:** Extend the existing `public.cms_contents` table with four new realty content types (`office`, `staff`, `partner`, `award`) alongside existing (`banner`, `page`, `article`, `faq`), validate type-specific `payload` fields in Zod, and add an admin-only image upload route reusing `GoogleDriveService`. On the frontend, drive the refactored `/admin/cms` workspace from a single `cmsConfig.js` blueprint with a reusable `CmsMediaField` (upload + URL + preview), tab-aware table/drawer components, an `AlertDialog` delete guard, and graceful public consumers on Homepage, About Us, and Contact pages.

**Tech Stack:** Express 5 · TypeScript · Zod v4 · Multer · Supabase/PostgreSQL · React 19 · Vite 8 · Tailwind CSS v4 · shadcn/ui · Vitest · React Testing Library

**Spec:** `docs/superpowers/specs/2026-11-25-realty-cms-refactor-design.md`

## Global Constraints

- **Access Control:** Super Admin (`admin`) role ONLY for all CMS create, update, upload, publish, archive, and delete operations; public endpoints return `status = 'PUBLISHED'` records only.
- **Design System (`DESIGN.md`):** Use only approved palette tokens (`#F8FAFC` canvas, `#FFFFFF` surface, `#F1F5F9` muted surface, `#E2E8F0` border, `#1E293B` primary text, `#64748B` secondary text, `#0F766E` teal primary, `#115E59` hover), 8-point spacing scale, and existing `shadcn/ui` primitives in `frontend/src/components/ui/`.
- **Portal Header Rule (`AGENTS.md`):** Do NOT add stacked page titles or descriptive subtitles above portal page content in `AdminCmsPage.jsx`; portal page titles render inline in `DashboardHeader`.
- **Image Upload Bounds:** Allowed MIME types are `image/jpeg`, `image/png`, `image/webp`, `image/gif`; maximum size is 10 MB (`10 * 1024 * 1024` bytes).
- **PowerShell Syntax (Windows):** Chain shell commands with `;` rather than `&&` in Windows PowerShell 5.1.
- **Knowledge Graph:** After modifying code files, run `graphify update .`.

---

## File Structure Map

| Action | File | Responsibility |
| :--- | :--- | :--- |
| Create | `supabase/migrations/20261125005000_expand_cms_content_types.sql` | Expands `cms_contents.content_type` CHECK constraint to all 8 types. |
| Modify | `backend/src/schemas/cms.schema.ts` | Validates all 8 types, safe `media_url`, optional slug for auto-slug types, and per-type `payload` rules. |
| Create | `backend/src/schemas/cms.schema.test.ts` | Unit tests for Zod schema validation across all 8 types and invalid inputs. |
| Modify | `backend/src/services/cms.service.ts` | Auto-slug generation with collision avoidance, friendly Postgres `23505` error, starter local mock data. |
| Modify | `backend/src/controllers/cms.controller.ts` | Adds `uploadMedia` handler using `GoogleDriveService.uploadListingFile('cms-media', file, 'Photos')`. |
| Modify | `backend/src/routes/cms.routes.ts` | Adds admin-only `POST /admin/upload` route with 10 MB image-only `multer` middleware. |
| Create | `backend/src/services/cms.service.test.ts` | Unit tests for service auto-slugging, collision handling, and published filtering. |
| Create | `backend/src/controllers/cms.controller.test.ts` | Unit tests for `uploadMedia` validation and Google Drive delegation. |
| Modify | `frontend/src/services/cmsService.js` | Adds `uploadMedia(file)` multipart helper. |
| Create | `frontend/src/components/cms/cmsConfig.js` | Single source of truth for the 6 tabs, sub-types, department presets, slugify, and filter helpers. |
| Create | `frontend/src/components/cms/CmsMediaField.jsx` | Dual-mode image uploader + URL input + live preview + remove action. |
| Create | `frontend/src/components/cms/CmsDeleteDialog.jsx` | Confirmation `AlertDialog` gating permanent deletion. |
| Create | `frontend/src/components/cms/CmsMediaField.test.jsx` | Tests URL input preview, file upload success, and invalid-file error handling. |
| Modify | `frontend/src/components/cms/CmsContentTable.jsx` | Renders tab-specific columns (avatars, partner/award badges, office addresses, slugs) + actions. |
| Modify | `frontend/src/components/cms/CmsContentEditorDrawer.jsx` | Renders tailored form fields per type, sub-type switcher, and `CmsMediaField`. |
| Modify | `frontend/src/pages/portals/super-admin/AdminCmsPage.jsx` | 6 real estate tabs, KPI cards, status filter pills, search, drawer, and delete confirmation dialog. |
| Modify | `frontend/src/pages/portals/super-admin/AdminCmsPage.test.jsx` | Tests 6 tabs, status filters, sub-type switching, tailored drawer fields, and delete confirmation. |
| Modify | `frontend/src/components/ui/sections/PartnersSection.jsx` | Renders published `partner` items (developers & banks) with safe fallback. |
| Modify | `frontend/src/components/ui/sections/AwardsShowcase.jsx` | Renders published `award` items (slider + Historical Honors) with safe fallback. |
| Create | `frontend/src/components/ui/sections/PartnersAndAwardsCms.test.jsx` | Tests CMS-driven rendering and fallback behavior for Partners & Awards. |
| Modify | `frontend/src/pages/public/AboutPage.jsx` | Renders published `staff` items grouped by department with fallback to `mockAbout.js`. |
| Modify | `frontend/src/pages/public/ContactPage.jsx` | Renders published `contact-us` page channels + published `office` branch cards + `LiveEditProvider`. |
| Create | `frontend/src/pages/public/AboutAndContactCms.test.jsx` | Tests CMS-driven Staff Directory, Contact channels, Office Branches, and fallbacks. |

---

### Task 1: Database Migration & Backend CMS Validation Schema

**Files:**
- Create: `supabase/migrations/20261125005000_expand_cms_content_types.sql`
- Modify: `backend/src/schemas/cms.schema.ts`
- Test: `backend/src/schemas/cms.schema.test.ts`

**Interfaces:**
- Produces:
  - `cmsContentTypeEnum`: `z.enum(['banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'])`
  - `AUTO_SLUG_CONTENT_TYPES`: `readonly ['banner', 'office', 'staff', 'partner', 'award', 'faq']`
  - `createCmsContentSchema`, `updateCmsContentSchema`, `queryCmsContentSchema`
  - `CmsContentType`, `CmsStatus`

- [ ] **Step 1: Write the failing schema unit tests**

Create `backend/src/schemas/cms.schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  cmsContentTypeEnum,
  createCmsContentSchema,
  updateCmsContentSchema,
} from './cms.schema';

describe('cms.schema', () => {
  it('accepts all 8 private realty content types', () => {
    const types = ['banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'];
    for (const t of types) {
      expect(cmsContentTypeEnum.safeParse(t).success).toBe(true);
    }
  });

  it('requires department and role for staff and allows omitting slug', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'staff',
      title: 'Gina Punzalan',
      media_url: '/api/drive/media/file-123',
      payload: { department: 'Business Development & Growth', role: 'Senior Business Development' },
      status: 'PUBLISHED',
    });
    expect(valid.success).toBe(true);

    const missingRole = createCmsContentSchema.safeParse({
      content_type: 'staff',
      title: 'Gina Punzalan',
      payload: { department: 'Accounting Department' },
    });
    expect(missingRole.success).toBe(false);
  });

  it('requires address for office branches', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'office',
      title: 'Makati Main Office',
      payload: { address: '123 Ayala Ave, Makati City', phone: '+63 2 8888 0000' },
    });
    expect(valid.success).toBe(true);

    const missingAddress = createCmsContentSchema.safeParse({
      content_type: 'office',
      title: 'Makati Main Office',
      payload: {},
    });
    expect(missingAddress.success).toBe(false);
  });

  it('validates partner_type as developer or bank', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'partner',
      title: 'Ayala Land',
      media_url: 'https://example.com/logo.png',
      payload: { partner_type: 'developer' },
    });
    expect(valid.success).toBe(true);

    const invalid = createCmsContentSchema.safeParse({
      content_type: 'partner',
      title: 'Unknown Org',
      payload: { partner_type: 'other' },
    });
    expect(invalid.success).toBe(false);
  });

  it('requires year and organization for awards', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'award',
      title: 'Top Luxury Brokerage',
      payload: { year: '2025', organization: 'Asian Real Estate Awards', featured: true },
    });
    expect(valid.success).toBe(true);

    const missingYear = createCmsContentSchema.safeParse({
      content_type: 'award',
      title: 'Top Luxury Brokerage',
      payload: { organization: 'Asian Real Estate Awards' },
    });
    expect(missingYear.success).toBe(false);
  });

  it('requires explicit slug for page and article types', () => {
    const missingSlug = createCmsContentSchema.safeParse({
      content_type: 'article',
      title: 'First-Time Buyer Guide',
    });
    expect(missingSlug.success).toBe(false);
  });

  it('rejects unsafe javascript: URLs in media_url', () => {
    const badMedia = createCmsContentSchema.safeParse({
      content_type: 'banner',
      title: 'Promo',
      media_url: 'javascript:alert(1)',
    });
    expect(badMedia.success).toBe(false);

    const badUpdate = updateCmsContentSchema.safeParse({
      media_url: 'javascript:alert(1)',
    });
    expect(badUpdate.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; npx vitest run src/schemas/cms.schema.test.ts`  
Expected: FAIL because `staff`, `office`, `partner`, `award` are not yet in `cmsContentTypeEnum` and `slug` is still strictly required.

- [ ] **Step 3: Create the SQL migration and update `backend/src/schemas/cms.schema.ts`**

Create `supabase/migrations/20261125005000_expand_cms_content_types.sql`:

```sql
-- Expand cms_contents.content_type to cover all private realty CMS sections
BEGIN;

ALTER TABLE public.cms_contents
  DROP CONSTRAINT IF EXISTS cms_contents_content_type_check;

ALTER TABLE public.cms_contents
  ADD CONSTRAINT cms_contents_content_type_check
  CHECK (content_type IN ('banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'));

COMMIT;
```

Update `backend/src/schemas/cms.schema.ts`:

```ts
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

function isSafeMediaUrl(value: string): boolean {
  if (!value) return true;
  if (value.startsWith('/api/drive/media/') || value.startsWith('/images/')) {
    return true;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const mediaUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isSafeMediaUrl, 'Media URL must be an http(s) link or an uploaded media path.')
  .optional()
  .nullable();

const baseCmsFields = {
  content_type: cmsContentTypeEnum,
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(120, 'Slug cannot exceed 120 characters.')
    .regex(slugRegex, 'Slug must use lowercase letters, numbers, and hyphens only.')
    .optional(),
  title: z.string().trim().min(2, 'Title is required.').max(200),
  summary: z.string().trim().max(500).optional().nullable(),
  body: z.string().optional().nullable(),
  media_url: mediaUrlSchema,
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  status: cmsStatusEnum.optional().default('DRAFT'),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
};

function nonEmptyString(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

export const createCmsContentSchema = z.object(baseCmsFields).superRefine((data, ctx) => {
  const payload = (data.payload || {}) as Record<string, unknown>;

  if ((data.content_type === 'page' || data.content_type === 'article') && !nonEmptyString(data.slug)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['slug'],
      message: 'Web address slug is required for pages and guides.',
    });
  }

  if (data.content_type === 'staff') {
    if (!nonEmptyString(payload.department)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'department'],
        message: 'Department is required for staff members.',
      });
    }
    if (!nonEmptyString(payload.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'role'],
        message: 'Job role is required for staff members.',
      });
    }
  }

  if (data.content_type === 'office' && !nonEmptyString(payload.address)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['payload', 'address'],
      message: 'Branch address is required for office entries.',
    });
  }

  if (data.content_type === 'partner') {
    if (payload.partner_type !== 'developer' && payload.partner_type !== 'bank') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'partner_type'],
        message: 'Partner type must be developer or bank.',
      });
    }
  }

  if (data.content_type === 'award') {
    if (!nonEmptyString(payload.year)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'year'],
        message: 'Year is required for awards.',
      });
    }
    if (!nonEmptyString(payload.organization)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'organization'],
        message: 'Awarding organization is required for awards.',
      });
    }
    if (
      payload.media_type !== undefined &&
      payload.media_type !== 'image' &&
      payload.media_type !== 'video'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'media_type'],
        message: 'Media type must be image or video.',
      });
    }
  }
});

export const updateCmsContentSchema = z
  .object(baseCmsFields)
  .partial()
  .superRefine((data, ctx) => {
    const payload = data.payload as Record<string, unknown> | undefined;
    if (!payload) return;
    if (
      payload.partner_type !== undefined &&
      payload.partner_type !== 'developer' &&
      payload.partner_type !== 'bank'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'partner_type'],
        message: 'Partner type must be developer or bank.',
      });
    }
    if (
      payload.media_type !== undefined &&
      payload.media_type !== 'image' &&
      payload.media_type !== 'video'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'media_type'],
        message: 'Media type must be image or video.',
      });
    }
  });

export const queryCmsContentSchema = z.object({
  type: cmsContentTypeEnum.optional(),
  status: cmsStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
});

export type CmsContentType = z.infer<typeof cmsContentTypeEnum>;
export type CmsStatus = z.infer<typeof cmsStatusEnum>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; npx vitest run src/schemas/cms.schema.test.ts`  
Expected: PASS (all 7 tests pass).

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20261125005000_expand_cms_content_types.sql backend/src/schemas/cms.schema.ts backend/src/schemas/cms.schema.test.ts
git commit -m "feat(cms): expand database content types and Zod payload validation"
```

---

### Task 2: Backend CMS Service, Auto-Slug Collision Handling & Admin Image Upload Route

**Files:**
- Modify: `backend/src/services/cms.service.ts`
- Modify: `backend/src/controllers/cms.controller.ts`
- Modify: `backend/src/routes/cms.routes.ts`
- Test: `backend/src/services/cms.service.test.ts`
- Test: `backend/src/controllers/cms.controller.test.ts`

**Interfaces:**
- Consumes: `cmsContentTypeEnum`, `AUTO_SLUG_CONTENT_TYPES` from `../schemas/cms.schema`; `GoogleDriveService.uploadListingFile` from `../services/googleDrive.service`.
- Produces:
  - `CmsService.generateSlug(title: string): string`
  - `CmsController.uploadMedia(req, res)` mounted at `POST /api/cms/admin/upload` returning `{ success: true, data: { url, fileId, fileName } }`.

- [ ] **Step 1: Write failing tests for CMS service and upload controller**

Create `backend/src/services/cms.service.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseAdmin: {},
}));

import { CmsService } from './cms.service';

describe('CmsService (mock/local mode)', () => {
  it('auto-generates unique slugs when omitted for staff items', async () => {
    const first = await CmsService.createContent('admin-1', {
      content_type: 'staff',
      title: 'Maria Clara',
      payload: { department: 'Marketing Department', role: 'Marketing Officer' },
      status: 'PUBLISHED',
    });
    const second = await CmsService.createContent('admin-1', {
      content_type: 'staff',
      title: 'Maria Clara',
      payload: { department: 'Sales Department', role: 'Sales Associate' },
      status: 'PUBLISHED',
    });

    expect(first.slug).toMatch(/^maria-clara/);
    expect(second.slug).toMatch(/^maria-clara-/);
    expect(second.slug).not.toBe(first.slug);
  });

  it('rejects duplicate explicit slugs on pages with a friendly message', async () => {
    await CmsService.createContent('admin-1', {
      content_type: 'page',
      slug: 'privacy-policy-test',
      title: 'Privacy Policy',
      status: 'PUBLISHED',
    });

    await expect(
      CmsService.createContent('admin-1', {
        content_type: 'page',
        slug: 'privacy-policy-test',
        title: 'Privacy Policy Duplicate',
        status: 'DRAFT',
      })
    ).rejects.toThrow(/already in use/i);
  });

  it('returns only PUBLISHED records from listPublicContents', async () => {
    await CmsService.createContent('admin-1', {
      content_type: 'partner',
      title: 'Published Bank',
      payload: { partner_type: 'bank' },
      status: 'PUBLISHED',
    });
    await CmsService.createContent('admin-1', {
      content_type: 'partner',
      title: 'Hidden Draft Bank',
      payload: { partner_type: 'bank' },
      status: 'DRAFT',
    });

    const publicPartners = await CmsService.listPublicContents('partner');
    expect(publicPartners.some((p) => p.title === 'Published Bank')).toBe(true);
    expect(publicPartners.some((p) => p.title === 'Hidden Draft Bank')).toBe(false);
  });
});
```

Create `backend/src/controllers/cms.controller.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsController } from './cms.controller';
import { GoogleDriveService } from '../services/googleDrive.service';

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('CmsController.uploadMedia', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when no file is provided', async () => {
    const req: any = { file: undefined };
    const res = makeRes();
    await CmsController.uploadMedia(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-image MIME types with 400', async () => {
    const req: any = {
      file: { originalname: 'script.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('a') },
    };
    const res = makeRes();
    await CmsController.uploadMedia(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/JPG, PNG, WebP, or GIF/i);
  });

  it('uploads valid image via GoogleDriveService and returns proxy url', async () => {
    vi.spyOn(GoogleDriveService, 'uploadListingFile').mockResolvedValue({
      fileId: 'drive-abc',
      fileName: 'logo.png',
      mimeType: 'image/png',
      size: 2048,
      webViewLink: '',
      webContentLink: '',
      directImageUrl: 'https://lh3.googleusercontent.com/d/drive-abc',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=drive-abc&sz=w1600',
      proxyUrl: '/api/drive/media/drive-abc',
      category: 'Photos',
    } as any);

    const req: any = {
      file: { originalname: 'logo.png', mimetype: 'image/png', size: 2048, buffer: Buffer.from('png') },
    };
    const res = makeRes();
    await CmsController.uploadMedia(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      url: '/api/drive/media/drive-abc',
      fileId: 'drive-abc',
      fileName: 'logo.png',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; npx vitest run src/services/cms.service.test.ts src/controllers/cms.controller.test.ts`  
Expected: FAIL (`CmsController.uploadMedia` does not exist; `CmsService.createContent` does not auto-slug).

- [ ] **Step 3: Implement auto-slugging in `cms.service.ts`, `uploadMedia` in `cms.controller.ts`, and `POST /admin/upload` in `cms.routes.ts`**

Update `backend/src/services/cms.service.ts` — add `slugifyTitle`, `isAutoSlugType`, collision suffix generation, and friendly Postgres `23505` handling:

```ts
import { AUTO_SLUG_CONTENT_TYPES } from '../schemas/cms.schema';
import type { CmsContentType, CmsStatus } from '../schemas/cms.schema';
```

Add helper functions above `export class CmsService`:

```ts
const AUTO_SLUG_SET = new Set<string>(AUTO_SLUG_CONTENT_TYPES);

export function slugifyTitle(raw: string): string {
  const base = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return base.length >= 2 ? base : `item-${Date.now().toString(36)}`;
}

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
```

Inside `CmsService.createContent`:
- Compute `const isAutoSlug = AUTO_SLUG_SET.has(input.content_type as string);`
- Compute `let resolvedSlug = input.slug?.trim() ? slugifyTitle(input.slug) : slugifyTitle(input.title || 'item');`
- In `!isSupabaseConfigured` mode:
  - Check for active collision: `mockContents.some((item) => item.content_type === input.content_type && item.slug === resolvedSlug && item.status !== 'ARCHIVED')`.
  - If colliding and `isAutoSlug`, append `-${randomSlugSuffix()}` until unique.
  - If colliding and NOT `isAutoSlug`, throw `new Error('That web address is already in use. Please choose another.')`.
- In Supabase mode:
  - Attempt insert with `slug: resolvedSlug`.
  - If `error?.code === '23505'`:
    - If `isAutoSlug`, retry once with `${resolvedSlug}-${randomSlugSuffix()}`.
    - Otherwise throw `new Error('That web address is already in use. Please choose another.')`.
- Also in `CmsService.updateContent`: if `error?.code === '23505'`, throw `new Error('That web address is already in use. Please choose another.')`.

Update `backend/src/controllers/cms.controller.ts`:
- Import `GoogleDriveService` from `../services/googleDrive.service`.
- Add `ALLOWED_CMS_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])`.
- Add `uploadMedia`:

```ts
  public static async uploadMedia(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        fail(res, new Error('Please choose an image file to upload.'), 400);
        return;
      }
      if (!ALLOWED_CMS_IMAGE_TYPES.has(file.mimetype)) {
        fail(res, new Error('Unsupported file type. Please upload a JPG, PNG, WebP, or GIF image.'), 400);
        return;
      }

      const uploaded = await GoogleDriveService.uploadListingFile('cms-media', file, 'Photos');
      const url = uploaded.proxyUrl || uploaded.directImageUrl || `/api/drive/media/${uploaded.fileId}`;
      ok(
        res,
        {
          url,
          fileId: uploaded.fileId,
          fileName: uploaded.fileName || file.originalname,
        },
        'Image uploaded successfully.',
        201
      );
    } catch (err) {
      fail(res, err, 500);
    }
  }
```

Update `backend/src/routes/cms.routes.ts`:
- Import `multer` and configure:
```ts
const cmsImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for CMS logos, portraits, banners
  },
});
```
- Mount `router.post('/admin/upload', cmsImageUpload.single('file'), CmsController.uploadMedia);` under the admin-protected section (`requireAuth`, `requireRole(['admin'])`).
- Also add a small multer error handler wrapper or route-level error handler so files >10 MB return HTTP `400` (`"Image file is too large. Maximum size is 10 MB."`).

- [ ] **Step 4: Run backend tests and TypeScript build check**

Run: `cd backend; npx vitest run src/schemas/cms.schema.test.ts src/services/cms.service.test.ts src/controllers/cms.controller.test.ts`  
Expected: PASS (all backend CMS tests pass).

- [ ] **Step 5: Commit**

```powershell
git add backend/src/services/cms.service.ts backend/src/controllers/cms.controller.ts backend/src/routes/cms.routes.ts backend/src/services/cms.service.test.ts backend/src/controllers/cms.controller.test.ts
git commit -m "feat(cms): add auto-slug collision handling and admin image upload endpoint"
```

---

### Task 3: Frontend CMS Service Upload, Realty Config Blueprint, Media Picker & Delete Dialog

**Files:**
- Modify: `frontend/src/services/cmsService.js`
- Create: `frontend/src/components/cms/cmsConfig.js`
- Create: `frontend/src/components/cms/CmsMediaField.jsx`
- Create: `frontend/src/components/cms/CmsDeleteDialog.jsx`
- Test: `frontend/src/components/cms/CmsMediaField.test.jsx`

**Interfaces:**
- Consumes: `POST /api/cms/admin/upload` from Task 2; `shadcn/ui` `Button`, `Input`, `Label`, `Alert`, `AlertDescription`, `AlertDialog*`.
- Produces:
  - `cmsService.uploadMedia(file: File): Promise<{ url: string, fileId: string, fileName: string }>`
  - `CMS_TABS`, `STAFF_DEPARTMENTS`, `getTabById`, `getDefaultTypeForTab`, `getContentTypeLabel`, `toSlug`, `filterCmsItems` in `cmsConfig.js`
  - `CmsMediaField({ label, value, onChange, hint, accept })`
  - `CmsDeleteDialog({ item, isDeleting, error, onClose, onConfirm })`

- [ ] **Step 1: Write failing test for `CmsMediaField`**

Create `frontend/src/components/cms/CmsMediaField.test.jsx`:

```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CmsMediaField from './CmsMediaField';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    uploadMedia: vi.fn(),
  },
}));

describe('CmsMediaField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows live preview when an image URL is pasted and allows clearing it', () => {
    const handleChange = vi.fn();
    render(
      <CmsMediaField
        label="Partner Logo"
        value="https://example.com/logo.png"
        onChange={handleChange}
      />
    );

    expect(screen.getByAltText(/Partner Logo preview/i)).toHaveAttribute(
      'src',
      'https://example.com/logo.png'
    );

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('uploads an image file via cmsService.uploadMedia and updates value', async () => {
    cmsService.uploadMedia.mockResolvedValue({
      url: '/api/drive/media/img-1',
      fileId: 'img-1',
      fileName: 'team.jpg',
    });
    const handleChange = vi.fn();
    render(<CmsMediaField label="Portrait Photo" value="" onChange={handleChange} />);

    const fileInput = screen.getByLabelText(/Upload image file/i);
    const file = new File(['abc'], 'team.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(cmsService.uploadMedia).toHaveBeenCalledWith(file);
      expect(handleChange).toHaveBeenCalledWith('/api/drive/media/img-1');
    });
  });

  it('shows an error message for unsupported file types without uploading', async () => {
    const handleChange = vi.fn();
    render(<CmsMediaField label="Portrait Photo" value="" onChange={handleChange} />);

    const fileInput = screen.getByLabelText(/Upload image file/i);
    const badFile = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Please choose a JPG, PNG, WebP, or GIF image/i)).toBeInTheDocument();
    });
    expect(cmsService.uploadMedia).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/components/cms/CmsMediaField.test.jsx`  
Expected: FAIL because `CmsMediaField.jsx` does not exist yet.

- [ ] **Step 3: Implement `cmsService.uploadMedia`, `cmsConfig.js`, `CmsMediaField.jsx`, and `CmsDeleteDialog.jsx`**

Update `frontend/src/services/cmsService.js` — add:

```js
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/cms/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res?.data ?? res;
    return data;
  },
```

Create `frontend/src/components/cms/cmsConfig.js`:

```js
import {
  Megaphone,
  Building2,
  Users,
  Award,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const STAFF_DEPARTMENTS = [
  'Business Development & Growth',
  'Sales Department',
  'Accounting Department',
  'Marketing Department',
  'Logistics Department',
];

export const CMS_TABS = [
  {
    id: 'banners',
    label: 'Banners & Announcements',
    shortLabel: 'Banners',
    icon: Megaphone,
    contentTypes: ['banner'],
    defaultType: 'banner',
    createLabel: 'New Banner',
    description: 'Top announcement bars and open-house notices shown at the top of the website.',
    emptyLabel: 'No announcements yet.',
  },
  {
    id: 'company',
    label: 'Company & Contact',
    shortLabel: 'Company',
    icon: Building2,
    contentTypes: ['page', 'office'],
    defaultType: 'page',
    createLabel: 'New Page or Branch',
    description: 'Manage your About Us story, Contact page details, and physical Office Branches.',
    emptyLabel: 'No company pages or branches yet.',
    subTypes: [
      { id: 'page', label: 'Company Page', helper: 'About Us, Contact Us, or static company copy' },
      { id: 'office', label: 'Office Branch', helper: 'Branch address, phone, and office hours' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff Directory',
    shortLabel: 'Staff',
    icon: Users,
    contentTypes: ['staff'],
    defaultType: 'staff',
    createLabel: 'Add Staff Member',
    description: 'Team members grouped by department on the About Us page.',
    emptyLabel: 'No staff members published yet.',
  },
  {
    id: 'partners-awards',
    label: 'Partners & Awards',
    shortLabel: 'Partners & Awards',
    icon: Award,
    contentTypes: ['partner', 'award'],
    defaultType: 'partner',
    createLabel: 'New Partner or Award',
    description: 'Trusted developer logos, partner banks, and company honors shown on the Homepage.',
    emptyLabel: 'No partners or awards yet.',
    subTypes: [
      { id: 'partner', label: 'Trusted Partner', helper: 'Accredited developer or partner bank logo' },
      { id: 'award', label: 'Award / Honor', helper: 'Industry recognition, year, and optional media' },
    ],
  },
  {
    id: 'guides',
    label: 'Buyer Guides',
    shortLabel: 'Guides',
    icon: BookOpen,
    contentTypes: ['article'],
    defaultType: 'article',
    createLabel: 'New Buyer Guide',
    description: 'Home-buying tips and Philippine market updates shown on the Guides page.',
    emptyLabel: 'No buyer guides yet.',
  },
  {
    id: 'faqs',
    label: 'FAQs',
    shortLabel: 'FAQs',
    icon: HelpCircle,
    contentTypes: ['faq'],
    defaultType: 'faq',
    createLabel: 'New FAQ',
    description: 'Common buyer questions and answers displayed on the Homepage.',
    emptyLabel: 'No FAQs yet.',
  },
];

export const CMS_STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export function getTabById(tabId) {
  return CMS_TABS.find((t) => t.id === tabId) || CMS_TABS[0];
}

export function getDefaultTypeForTab(tabId) {
  return getTabById(tabId).defaultType;
}

export function getContentTypeLabel(contentType, payload = {}) {
  switch (contentType) {
    case 'banner':
      return 'Banner';
    case 'page':
      return 'Company Page';
    case 'office':
      return 'Office Branch';
    case 'staff':
      return 'Staff Member';
    case 'partner':
      return payload?.partner_type === 'bank' ? 'Partner Bank' : 'Developer';
    case 'award':
      return 'Award';
    case 'article':
      return 'Buyer Guide';
    case 'faq':
      return 'FAQ';
    default:
      return contentType;
  }
}

export function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function filterCmsItems(items, { tabId, status = 'ALL', search = '' }) {
  const tab = getTabById(tabId);
  const allowedTypes = new Set(tab.contentTypes);
  const q = search.trim().toLowerCase();

  return items.filter((item) => {
    if (!allowedTypes.has(item.content_type)) return false;
    if (status !== 'ALL' && item.status !== status) return false;
    if (!q) return true;
    const payload = item.payload || {};
    const searchable = [
      item.title,
      item.slug,
      item.summary,
      payload.department,
      payload.role,
      payload.address,
      payload.organization,
      payload.year,
      payload.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  });
}
```

Create `frontend/src/components/cms/CmsMediaField.jsx`:

```jsx
import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import cmsService from '@/services/cmsService';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

export default function CmsMediaField({
  id = 'cms-media-url',
  label = 'Image',
  value = '',
  onChange,
  hint = 'Upload a JPG, PNG, WebP, or GIF (up to 10 MB) or paste an image web link.',
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError('Please choose a JPG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Image is too large. Maximum file size is 10 MB.');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const uploaded = await cmsService.uploadMedia(file);
      if (uploaded?.url) {
        onChange(uploaded.url);
      } else {
        setUploadError('Upload succeeded, but no image link was returned.');
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            setUploadError('');
            onChange(e.target.value);
          }}
          placeholder="https://... or upload an image"
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Upload image file"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-10 px-4 shrink-0 gap-2"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
        </Button>
      </div>

      {hint && <p className="text-xs text-[#64748B]">{hint}</p>}

      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {value ? (
        <div className="flex items-center gap-4 p-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
          <img
            src={value}
            alt={`${label} preview`}
            className="size-16 rounded-lg object-cover border border-[#E2E8F0] bg-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#1E293B] truncate">{value}</p>
            <p className="text-xs text-[#64748B]">Live preview</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            aria-label="Remove image"
            className="text-[#64748B] hover:text-red-600 gap-1"
          >
            <X className="size-4" />
            <span>Remove</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B]">
          <ImageIcon className="size-4 shrink-0" />
          <span>No image selected yet.</span>
        </div>
      )}
    </div>
  );
}
```

Create `frontend/src/components/cms/CmsDeleteDialog.jsx`:

```jsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CmsDeleteDialog({
  item,
  isDeleting = false,
  error = '',
  onClose,
  onConfirm,
}) {
  return (
    <AlertDialog open={Boolean(item)} onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{item?.title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the item from your content desk and public website. If you only want to hide it, choose Archive instead.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(item);
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend; npx vitest run src/components/cms/CmsMediaField.test.jsx`  
Expected: PASS (all 3 tests pass).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/services/cmsService.js frontend/src/components/cms/cmsConfig.js frontend/src/components/cms/CmsMediaField.jsx frontend/src/components/cms/CmsDeleteDialog.jsx frontend/src/components/cms/CmsMediaField.test.jsx
git commit -m "feat(cms): add realty CMS config blueprint, dual media picker, and delete dialog"
```

---

### Task 4: Refactored Admin CMS Table, Tailored Editor Drawer & AdminCmsPage

**Files:**
- Modify: `frontend/src/components/cms/CmsContentTable.jsx`
- Modify: `frontend/src/components/cms/CmsContentEditorDrawer.jsx`
- Modify: `frontend/src/pages/portals/super-admin/AdminCmsPage.jsx`
- Modify: `frontend/src/pages/portals/super-admin/AdminCmsPage.test.jsx`

**Interfaces:**
- Consumes: `CMS_TABS`, `CMS_STATUS_FILTERS`, `STAFF_DEPARTMENTS`, `getTabById`, `getContentTypeLabel`, `toSlug`, `filterCmsItems` from `./cmsConfig`; `CmsMediaField`; `CmsDeleteDialog`; `cmsService`.
- Produces: Fully refactored `/admin/cms` workspace matching `DESIGN.md` and `AGENTS.md`.

- [ ] **Step 1: Write updated failing tests in `AdminCmsPage.test.jsx`**

Replace `frontend/src/pages/portals/super-admin/AdminCmsPage.test.jsx`:

```jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCmsPage from './AdminCmsPage';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    listAdminContents: vi.fn(),
    createContent: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn(),
    uploadMedia: vi.fn(),
  },
}));

const MOCK_ITEMS = [
  {
    id: 'b1',
    content_type: 'banner',
    slug: 'open-house',
    title: 'Open House Weekend',
    summary: 'Visit our BGC models',
    payload: { cta_label: 'Explore', cta_url: '/properties' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'p1',
    content_type: 'page',
    slug: 'about-us',
    title: 'About Human Shelter Realty',
    status: 'PUBLISHED',
    sort_order: 0,
  },
  {
    id: 'o1',
    content_type: 'office',
    slug: 'makati-main',
    title: 'Makati Main Office',
    payload: { address: '123 Ayala Ave, Makati', phone: '+63 2 8888 0000' },
    status: 'DRAFT',
    sort_order: 1,
  },
  {
    id: 's1',
    content_type: 'staff',
    slug: 'gina-punzalan',
    title: 'Gina Punzalan',
    media_url: '/images/staff/gina-punzalan.jpg',
    payload: { department: 'Business Development & Growth', role: 'Senior Business Development' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'pt1',
    content_type: 'partner',
    slug: 'ayala-land',
    title: 'Ayala Land',
    media_url: 'https://example.com/ayala.png',
    payload: { partner_type: 'developer' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'a1',
    content_type: 'award',
    slug: 'best-brokerage-2025',
    title: 'Best Luxury Brokerage',
    payload: { year: '2025', organization: 'Asian Real Estate Awards', featured: true },
    status: 'PUBLISHED',
    sort_order: 1,
  },
];

describe('AdminCmsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cmsService.listAdminContents.mockResolvedValue(MOCK_ITEMS);
    cmsService.createContent.mockResolvedValue({ id: 'new-1' });
    cmsService.deleteContent.mockResolvedValue();
  });

  it('renders all 6 private realty tabs and filters by tab and status', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /Banners & Announcements/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Company & Contact/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Staff Directory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Partners & Awards/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Buyer Guides/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /FAQs/i })).toBeInTheDocument();

    // Switch to Company & Contact tab -> shows both page and office branch
    fireEvent.click(screen.getByRole('tab', { name: /Company & Contact/i }));
    await waitFor(() => {
      expect(screen.getByText('About Human Shelter Realty')).toBeInTheDocument();
      expect(screen.getByText('Makati Main Office')).toBeInTheDocument();
    });

    // Filter to Drafts only -> shows Makati Main Office, hides About page
    fireEvent.click(screen.getByRole('button', { name: /^Draft$/i }));
    expect(screen.getByText('Makati Main Office')).toBeInTheDocument();
    expect(screen.queryByText('About Human Shelter Realty')).toBeNull();
  });

  it('shows tailored Staff form fields without exposing raw slug input', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Staff Directory/i }));
    await waitFor(() => {
      expect(screen.getByText('Gina Punzalan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Staff Member/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Job Role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/Web Address/i)).toBeNull();
  });

  it('supports switching between Partner and Award sub-types inside Partners & Awards drawer', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Partners & Awards/i }));
    await waitFor(() => {
      expect(screen.getByText('Ayala Land')).toBeInTheDocument();
      expect(screen.getByText('Best Luxury Brokerage')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Partner or Award/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Partner Category/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Award \/ Honor/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Awarding Organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/pages/portals/super-admin/AdminCmsPage.test.jsx`  
Expected: FAIL because `AdminCmsPage` still has the old 4 tabs.

- [ ] **Step 3: Refactor `CmsContentTable.jsx`, `CmsContentEditorDrawer.jsx`, and `AdminCmsPage.jsx`**

1. **`CmsContentTable.jsx`:**
   - Accepts `tabId`, `items`, `onEdit`, `onTogglePublish`, `onArchive`, `onRequestDelete`, `emptyLabel`.
   - Renders tab-aware middle columns:
     - `staff`: Column 1 = portrait thumbnail (or initials circle) + Full Name; Column 2 = `payload.role`; Column 3 = `payload.department`.
     - `partners-awards`: Column 1 = logo/media thumbnail + Title; Column 2 = Kind badge (`Developer`, `Partner Bank`, `Award`); Column 3 = `payload.year · payload.organization` (for award) or `payload.website_url` (for partner).
     - `company`: Column 1 = Title + summary; Column 2 = Kind badge (`Company Page` vs `Office Branch`); Column 3 = `payload.address` (for office) or `/${item.slug}` (for page).
     - `banners`: Column 1 = Headline + summary; Column 2 = Button CTA (`payload.cta_label → payload.cta_url` or `—`).
     - `guides`: Column 1 = Title + summary; Column 2 = Category (`payload.category || 'Guide'`); Column 3 = `/${item.slug}`.
     - `faqs`: Column 1 = Question + answer preview; Column 2 = Category (`payload.category || 'General'`).
   - Always includes Status badge (`Published`, `Draft`, `Archived`), Display Order (`tabular-nums`), and Actions `DropdownMenu` (`Edit`, `Publish Now` / `Move to Draft`, `Archive`, `Delete` -> calls `onRequestDelete(item)`).

2. **`CmsContentEditorDrawer.jsx`:**
   - Accepts `isOpen`, `onClose`, `tabId`, `initialItem`, `onSave`, `isSaving`.
   - Reads `tab = getTabById(tabId)`. When creating new inside a multi-type tab (`company` or `partners-awards`), renders a crisp 2-button sub-type selector (`Company Page` / `Office Branch` or `Trusted Partner` / `Award / Honor`) styled with `#0F766E` active border/tint. When editing an existing item, locks to `initialItem.content_type`.
   - Renders tailored fields per `activeType`:
     - `banner`: Headline (`title`), Short Summary (`summary`), Button Text (`cta_label`), Button Link (`cta_url`), Optional Banner Image (`CmsMediaField`).
     - `page`: Page Title (`title`), Web Address (`slug`), Short Summary (`summary`), Main Content (`body`), Optional Cover Image (`CmsMediaField`), plus Contact Page Channels fieldset (`whatsapp_url`, `calendly_url`, `contact_email`, `eyebrow`) shown when `slug === 'contact-us'` or when toggled open via "Include Contact Page Links".
     - `office`: Branch Name (`title`), Full Address (`address`, required), Phone Number (`phone`), Office Hours (`hours`), Optional Map Link (`map_url`), Optional Branch Photo (`CmsMediaField`).
     - `staff`: Full Name (`title`), Job Role / Branch (`role`, required), Department (`department`, dropdown preset from `STAFF_DEPARTMENTS` + option to type custom department), Portrait Photo (`CmsMediaField`).
     - `partner`: Organization Name (`title`), Partner Category (`partner_type`: `'developer'` or `'bank'`), Logo Image (`CmsMediaField`), Optional Website Link (`website_url`).
     - `award`: Award Title (`title`), Year (`year`, required), Awarding Organization (`organization`, required), Short Description (`summary`), Media Type (`image` or `video`), Media Picker (`CmsMediaField` when `image`, plain URL `Input` when `video`), `Checkbox` "Show in Homepage Featured Slider" (`featured`).
     - `article`: Guide Title (`title`), Web Address (`slug`), Category (`category`), Short Summary (`summary`), Cover Image (`CmsMediaField`), Main Content (`body`).
     - `faq`: Question (`title`), Category (`category`), Answer (`body`).
   - Always includes Visibility Status (`DRAFT`, `PUBLISHED`, `ARCHIVED`) and Display Order (`sort_order`).
   - Keeps form state intact if `onSave` throws and shows an inline `Alert`.

3. **`AdminCmsPage.jsx`:**
   - Top bar right-aligned primary button (`bg-[#0F766E] hover:bg-[#115E59] text-white h-10 px-4`) using `activeTabConfig.createLabel` (no stacked page title/subtitle above content, obeying `AGENTS.md`).
   - 3 `KpiCard` tiles (`Published Items`, `Drafts Pending`, `Active Sections` count of distinct tabs having >= 1 published item).
   - 6 `Tabs` from `CMS_TABS`.
   - Card header with tab title, concise one-line description, status filter pill buttons (`All`, `Published`, `Draft`, `Archived`), and search `Input`.
   - `CmsContentTable`, `CmsContentEditorDrawer`, and `CmsDeleteDialog`.

- [ ] **Step 4: Run frontend CMS tests**

Run: `cd frontend; npx vitest run src/pages/portals/super-admin/AdminCmsPage.test.jsx src/components/cms/CmsMediaField.test.jsx src/components/cms/CmsPublicSections.test.jsx src/components/cms/LiveCmsEditor.test.jsx`  
Expected: PASS (all admin & CMS component tests pass).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/cms/CmsContentTable.jsx frontend/src/components/cms/CmsContentEditorDrawer.jsx frontend/src/pages/portals/super-admin/AdminCmsPage.jsx frontend/src/pages/portals/super-admin/AdminCmsPage.test.jsx
git commit -m "feat(cms): refactor AdminCmsPage with 6 realty tabs, tailored forms, and delete guard"
```

---

### Task 5: Public Homepage Partners & Awards CMS Integration (with Safe Fallbacks)

**Files:**
- Modify: `frontend/src/components/ui/sections/PartnersSection.jsx`
- Modify: `frontend/src/components/ui/sections/AwardsShowcase.jsx`
- Test: `frontend/src/components/ui/sections/PartnersAndAwardsCms.test.jsx`

**Interfaces:**
- Consumes: `cmsService.getPublicContents('partner')` and `cmsService.getPublicContents('award')`.
- Produces: Live CMS-driven `PartnersSection` and `AwardsShowcase` with automatic fallback to existing defaults whenever zero published records exist.

- [ ] **Step 1: Write failing tests for `PartnersSection` and `AwardsShowcase`**

Create `frontend/src/components/ui/sections/PartnersAndAwardsCms.test.jsx`:

```jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartnersSection from './PartnersSection';
import AwardsShowcase from './AwardsShowcase';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    getPublicContents: vi.fn(),
  },
}));

describe('PartnersSection & AwardsShowcase CMS integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders published developer and bank partners from CMS', async () => {
    cmsService.getPublicContents.mockResolvedValue([
      {
        id: 'p1',
        title: 'Ayala Land Premier',
        media_url: 'https://example.com/ayala.png',
        payload: { partner_type: 'developer' },
      },
      {
        id: 'p2',
        title: 'BPI Housing Loans',
        media_url: 'https://example.com/bpi.png',
        payload: { partner_type: 'bank' },
      },
    ]);

    render(
      <MemoryRouter>
        <PartnersSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByAltText('Ayala Land Premier').length).toBeGreaterThan(0);
      expect(screen.getAllByAltText('BPI Housing Loans').length).toBeGreaterThan(0);
    });
  });

  it('renders published awards in Historical Honors and falls back when empty', async () => {
    cmsService.getPublicContents.mockResolvedValueOnce([
      {
        id: 'aw1',
        title: 'Philippine Realty Excellence',
        summary: 'Recognized nationwide.',
        media_url: 'https://example.com/award.jpg',
        payload: { year: '2026', organization: 'Philippine Realty Council', featured: true },
      },
    ]);

    const { unmount } = render(<AwardsShowcase />);
    await waitFor(() => {
      expect(screen.getAllByText('Philippine Realty Excellence').length).toBeGreaterThan(0);
      expect(screen.getByText('Philippine Realty Council')).toBeInTheDocument();
    });
    unmount();

    // Empty CMS -> falls back to built-in honors
    cmsService.getPublicContents.mockResolvedValueOnce([]);
    render(<AwardsShowcase />);
    await waitFor(() => {
      expect(screen.getByText('Top Luxury Brokerage Firm')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/components/ui/sections/PartnersAndAwardsCms.test.jsx`  
Expected: FAIL because neither component calls `cmsService.getPublicContents` yet.

- [ ] **Step 3: Wire `PartnersSection.jsx` and `AwardsShowcase.jsx` to `cmsService.getPublicContents`**

- In `PartnersSection.jsx`:
  - Call `cmsService.getPublicContents('partner')` in `useEffect` (with mounted guard and `.catch(() => {})`).
  - Split items into `cmsDevelopers = items.filter(i => i.payload?.partner_type !== 'bank')` and `cmsBanks = items.filter(i => i.payload?.partner_type === 'bank')`.
  - When `cmsDevelopers.length > 0`, build the marquee items from `cmsDevelopers` (rendering `<img src={partner.media_url} alt={partner.title} />` when `media_url` is set, or clean typographic badge with `partner.title` if logo is omitted; repeating to at least 6 items so the marquee loops smoothly). Same for `cmsBanks`.
  - When a list is empty, keep the existing fallback placeholders unchanged.
- In `AwardsShowcase.jsx`:
  - Call `cmsService.getPublicContents('award')` in `useEffect` (with mounted guard and `.catch(() => {})`).
  - When `cmsAwards.length > 0`:
    - Build `honorsList` from `cmsAwards` (`year: item.payload?.year`, `title: item.title`, `organization: item.payload?.organization`).
    - Build `featuredSlides` from `cmsAwards.filter(item => item.media_url && (item.payload?.featured !== false))` — if at least 1 has `media_url`, use those in the carousel (clamping `currentIndex` safely to `0` when the list updates); otherwise fall back to `AWARDS`.
  - When `cmsAwards.length === 0`, keep existing `AWARDS` and `AWARDS_LIST` fallbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend; npx vitest run src/components/ui/sections/PartnersAndAwardsCms.test.jsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/ui/sections/PartnersSection.jsx frontend/src/components/ui/sections/AwardsShowcase.jsx frontend/src/components/ui/sections/PartnersAndAwardsCms.test.jsx
git commit -m "feat(cms): connect Homepage Partners and Awards sections to CMS with fallbacks"
```

---

### Task 6: Public About Us Staff Directory & Contact Page / Branches CMS Integration

**Files:**
- Modify: `frontend/src/pages/public/AboutPage.jsx`
- Modify: `frontend/src/pages/public/ContactPage.jsx`
- Test: `frontend/src/pages/public/AboutAndContactCms.test.jsx`

**Interfaces:**
- Consumes: `cmsService.getPublicContents('staff')`, `cmsService.getPublicContents('office')`, `cmsService.getPublicContentBySlug('page', 'contact-us')`, `LiveEditProvider`, `LiveEditFloatingBar`, `LiveEditableText`.
- Produces: Live CMS-driven Staff Directory on `AboutPage` and live CMS-driven Contact details + Office Branches section on `ContactPage`, both with safe fallbacks.

- [ ] **Step 1: Write failing tests for `AboutPage` and `ContactPage` CMS integration**

Create `frontend/src/pages/public/AboutAndContactCms.test.jsx`:

```jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    getPublicContents: vi.fn(),
    getPublicContentBySlug: vi.fn(),
    updateContent: vi.fn(),
    createContent: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

describe('AboutPage & ContactPage CMS integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('renders CMS staff grouped by department on AboutPage', async () => {
    cmsService.getPublicContentBySlug.mockResolvedValue(null);
    cmsService.getPublicContents.mockResolvedValue([
      {
        id: 'st-1',
        title: 'Elena Cruz',
        media_url: '/api/drive/media/elena',
        payload: { department: 'Executive Advisory', role: 'Managing Broker' },
      },
    ]);

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Advisory')).toBeInTheDocument();
      expect(screen.getByText('Elena Cruz')).toBeInTheDocument();
      expect(screen.getByText('Managing Broker')).toBeInTheDocument();
    });
  });

  it('renders CMS contact details and Office Branches on ContactPage', async () => {
    cmsService.getPublicContentBySlug.mockResolvedValue({
      id: 'pg-contact',
      title: 'Speak With Our Advisory Desk',
      summary: 'Visit any branch or message us directly.',
      payload: {
        contact_email: 'advisory@humanshelter.ph',
        whatsapp_url: 'https://wa.me/639171234567',
        calendly_url: 'https://calendly.com/hsr',
      },
    });
    cmsService.getPublicContents.mockResolvedValue([
      {
        id: 'off-1',
        title: 'BGC Flagship Branch',
        payload: {
          address: '9th Ave, Bonifacio Global City, Taguig',
          phone: '+63 2 8123 4567',
          hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
        },
      },
    ]);

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Speak With Our Advisory Desk')).toBeInTheDocument();
      expect(screen.getByText('advisory@humanshelter.ph')).toBeInTheDocument();
      expect(screen.getByText('BGC Flagship Branch')).toBeInTheDocument();
      expect(screen.getByText('9th Ave, Bonifacio Global City, Taguig')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/pages/public/AboutAndContactCms.test.jsx`  
Expected: FAIL because `AboutPage` does not load `staff` from CMS and `ContactPage` does not load `contact-us` or `office` from CMS.

- [ ] **Step 3: Wire `AboutPage.jsx` and `ContactPage.jsx` to CMS with safe fallbacks**

- In `AboutPage.jsx`:
  - Fetch `cmsService.getPublicContents('staff')` alongside `getPublicContentBySlug('page', 'about-us')`.
  - Group published staff items by `item.payload?.department || 'Our Team'` into `{ id, label, members: [{ id, name: item.title, role: item.payload?.role || '', image: item.media_url || '' }] }`.
  - Render `cmsDepartments.length > 0 ? cmsDepartments : staffDepartments`.
- In `ContactPage.jsx`:
  - Wrap returned JSX in `<LiveEditProvider> ... <LiveEditFloatingBar /></LiveEditProvider>`.
  - Fetch `cmsService.getPublicContentBySlug('page', 'contact-us')` and `cmsService.getPublicContents('office')`.
  - Drive headline (`title`), intro (`summary`), WhatsApp URL (`payload.whatsapp_url`), Calendly URL (`payload.calendly_url`), and company email (`payload.contact_email`) with safe fallbacks to the existing hardcoded defaults, and wrap headline/summary in `LiveEditableText` (using `saveContactField` similar to `AboutPage`).
  - When `offices.length > 0`, render an **Our Office Branches** grid below the Contact grid showing each branch's title, address, phone, office hours, optional branch photo, and optional "View on Map" link.

- [ ] **Step 4: Run all CMS tests across backend + frontend, run builds, and update graphify**

Run:
```powershell
cd backend; npx vitest run src/schemas/cms.schema.test.ts src/services/cms.service.test.ts src/controllers/cms.controller.test.ts; npm run build
cd ../frontend; npx vitest run src/components/cms/ src/pages/portals/super-admin/AdminCmsPage.test.jsx src/components/ui/sections/PartnersAndAwardsCms.test.jsx src/pages/public/AboutAndContactCms.test.jsx; npm run build
cd ..; graphify update .
```
Expected: All tests PASS and both `backend` and `frontend` builds succeed with zero errors.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/public/AboutPage.jsx frontend/src/pages/public/ContactPage.jsx frontend/src/pages/public/AboutAndContactCms.test.jsx
git commit -m "feat(cms): connect About Us staff directory and Contact page branches to CMS"
```

