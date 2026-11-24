# Private Realty Content Management System (CMS) Refactor — Design Specification

**Date:** 2026-11-25  
**Scope:** Refactor the Admin Content Management desk (`/admin/cms`), backend CMS API & schema, and public realty website sections so admins can manage all six core private realty content areas from one unified workspace.  
**Access Model:** Super Admin (`admin`) only for all write, upload, publish, archive, and delete operations. Public visitors can only read `PUBLISHED` items.

---

## 1. Purpose & Problem Statement

The current CMS (`/admin/cms`) is structured like a generic blog manager with four broad tabs (`Company Pages`, `Guides & Blog`, `FAQs`, `Hero Banners`) and a single generic form that always exposes technical fields like URL slugs. Meanwhile, core private realty website content—such as the **Staff & Team Directory** on `AboutPage`, **Contact & Branch Details** on `ContactPage`, **Trusted Developer & Bank Partners** in `PartnersSection`, and **Awards & Achievements** in `AwardsShowcase`—is hardcoded or using placeholder logos.

This refactor transforms the CMS into a purpose-built **Private Realty Content Desk** backed by the existing `cms_contents` table, with tailored real estate tabs, context-aware forms, dual image upload/URL picking with live preview, safe delete confirmation, and graceful fallbacks on every public page.

---

## 2. Architecture & Data Model

### 2.1 Database Migration (`supabase/migrations/20261125005000_expand_cms_content_types.sql`)

Extend the existing `public.cms_contents` table without breaking existing records or RLS policies:

- Drop the existing `cms_contents_content_type_check` constraint and replace it with:
  ```sql
  CHECK (content_type IN ('banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'))
  ```
- Existing indexes (`idx_cms_contents_active_slug`, `idx_cms_contents_published_lookup`, `idx_cms_contents_author_id`), triggers (`trg_cms_contents_updated_at`), and Row-Level Security policies (`cms_contents_public_read`, `cms_contents_admin_all`) remain intact and automatically enforce public read-only (`status = 'PUBLISHED'`) and admin-only mutations for all 8 content types.

### 2.2 Content Types & Structured `payload` Contract

Each `cms_contents` record uses the standard columns (`id`, `content_type`, `slug`, `title`, `summary`, `body`, `media_url`, `payload`, `status`, `sort_order`, `author_id`, `published_at`, `created_at`, `updated_at`) with strict type-specific field mapping:

| `content_type` | Admin Tab | Core Columns Used | `payload` Keys | Slug Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `banner` | Banners & Announcements | `title` (headline), `summary` (subtext), `media_url` (optional image) | `cta_label` (string), `cta_url` (string) | Auto-generated from title (editable in drawer if needed, hidden in table) |
| `page` | Company & Contact | `title`, `slug` (e.g., `about-us`, `contact-us`), `summary`, `body`, `media_url` | Optional Contact fields for `contact-us`: `whatsapp_url`, `calendly_url`, `contact_email`, `eyebrow` | Explicit & editable (required for page routing/lookup) |
| `office` | Company & Contact | `title` (branch name, e.g., `Makati Main Office`), `summary` (short tagline, optional), `media_url` (optional office photo) | `address` (string, required), `phone` (string), `hours` (string), `map_url` (string) | Auto-generated from title |
| `staff` | Staff Directory | `title` (full name), `media_url` (portrait photo) | `department` (string, required — e.g., `Business Development & Growth`, `Accounting Department`, `Marketing Department`, `Logistics Department`, `Sales Department`), `role` (string, required — e.g., `Senior Business Development`) | Auto-generated from full name |
| `partner` | Partners & Awards | `title` (partner organization name), `media_url` (logo image) | `partner_type` (`'developer' \| 'bank'`, required), `website_url` (string, optional) | Auto-generated from partner name |
| `award` | Partners & Awards | `title` (award title), `summary` (short description), `media_url` (photo or video URL, optional) | `year` (string, required — e.g., `'2025'`), `organization` (string, required), `media_type` (`'image' \| 'video'`, default `'image'`), `featured` (boolean, default `false`) | Auto-generated from year + title |
| `article` | Buyer Guides | `title`, `slug`, `summary`, `body`, `media_url` (cover photo) | `category` (string — e.g., `Buyers`, `Financing`, `Market News`) | Explicit & editable (used in `/guides/:slug`) |
| `faq` | FAQs | `title` (question), `body` (answer) | `category` (string — e.g., `Buyers`, `Viewing`, `Reservation`) | Auto-generated from question |

### 2.3 Backend API & Validation

Files updated:
- `backend/src/schemas/cms.schema.ts`
- `backend/src/routes/cms.routes.ts`
- `backend/src/controllers/cms.controller.ts`
- `backend/src/services/cms.service.ts`

1. **Schema Validation (`cms.schema.ts`):**
   - Expand `cmsContentTypeEnum` to `['banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq']`.
   - Validate `media_url` as either a relative `/api/drive/media/...` path, a local `/images/...` path, or a valid `http://` / `https://` URL (reject `javascript:` or invalid schemes).
   - Validate type-specific `payload` fields via `superRefine` on create (and validate known keys on partial update):
     - `staff`: `payload.department` and `payload.role` non-empty strings.
     - `office`: `payload.address` non-empty string.
     - `partner`: `payload.partner_type` in `['developer', 'bank']`.
     - `award`: `payload.year` and `payload.organization` non-empty strings; `payload.media_type` in `['image', 'video']` if provided.
   - Allow `slug` to be auto-generated on the backend if omitted for non-routed types (`banner`, `office`, `staff`, `partner`, `award`, `faq`), appending a short random suffix if an active slug collision occurs so admins never hit confusing slug errors for staff or FAQs.

2. **Admin Image Upload Endpoint (`POST /api/cms/admin/upload`):**
   - Protected by `requireAuth` and `requireRole(['admin'])`.
   - Uses `multer` memory storage with a **10 MB** file size limit.
   - Strictly allows image MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Rejects unsupported file types with HTTP `400` and a clear plain-English message.
   - Calls `GoogleDriveService.uploadListingFile('cms-media', file, 'Photos')` and returns:
     ```json
     {
       "success": true,
       "data": {
         "url": "/api/drive/media/<fileId>",
         "fileId": "<fileId>",
         "fileName": "<originalName>"
       },
       "message": "Image uploaded successfully."
     }
     ```
   - Works seamlessly in both live Google Drive mode and local mock mode (via existing `GoogleDriveService` mock buffer stream).

3. **Mock/Local Fallback Data (`cms.service.ts`):**
   - Update `mockContents` with clean starter records across the expanded types so local development without Supabase exercises every tab cleanly.

---

## 3. Admin Content Desk UI Refactor (`frontend/src/pages/portals/super-admin/AdminCmsPage.jsx`)

Strictly adheres to `DESIGN.md` tokens (`#F8FAFC` canvas, `#FFFFFF` cards, `#E2E8F0` borders, `#0F766E` primary teal, `#1E293B` primary ink, `#64748B` secondary ink, 8-point spacing grid) and `AGENTS.md` rules (no subtitle stacked under portal page titles; reuse `shadcn/ui` primitives).

### 3.1 Modular Component Breakdown

| File | Responsibility |
| :--- | :--- |
| `frontend/src/components/cms/cmsConfig.js` | Single source of truth defining the 6 real estate tabs, mapped `content_type` values, tab icons, create button labels, sub-type selectors (for `Company & Contact` and `Partners & Awards`), table column definitions, and form field descriptors. |
| `frontend/src/components/cms/CmsMediaField.jsx` | Reusable dual-mode image picker: **Upload File** button (calls `cmsService.uploadMedia(file)`) + **Paste Image Link** input + live thumbnail preview + clear/remove button + inline upload progress and error alert. |
| `frontend/src/components/cms/CmsContentTable.jsx` | Tab-aware `shadcn/ui` `Table` rendering tailored columns per section (e.g., portrait thumbnail + Department/Role for Staff; logo + Developer/Bank/Award badge + Year for Partners & Awards; Address + Phone for Offices; Slug for Pages & Guides), status badge (`Published`, `Draft`, `Archived`), display order, and row action `DropdownMenu`. |
| `frontend/src/components/cms/CmsContentEditorDrawer.jsx` | Tab-aware right-hand `Drawer` rendering only the fields relevant to the chosen content type (plus a clean sub-type toggle when creating inside `Company & Contact` (`page` vs `office`) or `Partners & Awards` (`partner` vs `award`)). Keeps form data intact on save/upload errors. |
| `frontend/src/components/cms/CmsDeleteDialog.jsx` | `shadcn/ui` `AlertDialog` confirming permanent deletion before calling `cmsService.deleteContent(id)`. |
| `frontend/src/pages/portals/super-admin/AdminCmsPage.jsx` | Orchestrates data loading, 3 KPI summary cards (`Published Items`, `Drafts Pending`, `Active Sections`), 6 real estate `Tabs`, search input + status filter pills (`All`, `Published`, `Draft`, `Archived`), and opens the editor drawer or delete dialog. |

### 3.2 Six Real Estate Tabs

1. **Banners & Announcements** (`contentTypes: ['banner']`)
   - Table columns: Headline & Summary, Button Link, Status, Order, Actions.
   - Form fields: Headline, Short Summary, Button Text, Button Link, Optional Banner Image (`CmsMediaField`), Visibility Status, Display Order.
2. **Company & Contact** (`contentTypes: ['page', 'office']`)
   - Supports creating either a **Company Page** (`page` — e.g., `about-us`, `contact-us`) or an **Office Branch** (`office`).
   - Table columns: Title / Branch Name, Kind (`Page` vs `Office Branch`), Details (Slug or Address), Status, Order, Actions.
   - Form fields:
     - *Company Page:* Page Title, Web Address (Slug), Short Summary, Main Content, Optional Cover Image, plus collapsible/conditional Contact Channel fields (WhatsApp Link, Booking Calendar Link, Company Email) when slug is `contact-us` (or toggled on).
     - *Office Branch:* Branch Name, Full Address, Phone Number, Office Hours, Optional Map Link, Optional Branch Photo.
3. **Staff Directory** (`contentTypes: ['staff']`)
   - Table columns: Staff Member (Avatar thumbnail + Full Name), Role, Department, Status, Order, Actions.
   - Form fields: Full Name, Job Role / Branch, Department (preset options + custom input), Portrait Photo (`CmsMediaField`), Visibility Status, Display Order.
4. **Partners & Awards** (`contentTypes: ['partner', 'award']`)
   - Supports creating either a **Trusted Partner** (`partner`) or a **Company Award** (`award`).
   - Table columns: Visual (Logo/Thumbnail) + Title, Kind (`Developer`, `Partner Bank`, or `Award`), Details (Website or Year + Organization), Status, Order, Actions.
   - Form fields:
     - *Partner:* Organization Name, Partner Category (`Partner Developer` or `Partner Bank`), Logo Image (`CmsMediaField`), Optional Website Link, Status, Order.
     - *Award:* Award Title, Year, Awarding Organization, Short Description, Media Type (`Image` or `Video`), Photo/Video (`CmsMediaField` for image, URL input for video), Show in Featured Slider toggle (`Switch`), Status, Order.
5. **Buyer Guides** (`contentTypes: ['article']`)
   - Table columns: Guide Title & Summary, Category, Web Address (Slug), Status, Order, Actions.
   - Form fields: Guide Title, Web Address (Slug), Category, Short Summary, Cover Image (`CmsMediaField`), Full Article Content, Status, Order.
6. **FAQs** (`contentTypes: ['faq']`)
   - Table columns: Question, Category, Status, Order, Actions.
   - Form fields: Question, Category, Answer, Status, Order.

---

## 4. Public Website Integrations & Fallbacks

All public pages consume `cmsService.getPublicContents(type)` / `getPublicContentBySlug(type, slug)` (which only return `PUBLISHED` items) and silently fall back to existing defaults if the CMS returns an empty list or encounters a network error:

1. **Homepage (`frontend/src/pages/public/Home.jsx`):**
   - `CmsPublicBanner`: Continues rendering the highest-priority published `banner`. Hidden when none published.
   - `PartnersSection.jsx`: Fetches published `partner` items. Splits into `partner_type === 'developer'` and `partner_type === 'bank'`. Renders each partner's real logo (`media_url`) and accessible name (`title`), repeating smoothly for the marquee. Falls back to existing placeholders for any category that has zero published items.
   - `AwardsShowcase.jsx`: Fetches published `award` items. Items with `media_url` (or `payload.featured === true` and a media URL) populate the top slider; all published awards populate the **Historical Honors** grid (`payload.year`, `title`, `payload.organization`). Falls back to built-in `AWARDS` / `AWARDS_LIST` when zero published awards exist.
   - `CmsPublicCollectionsAndFaqs`: Continues rendering published `faq` items in `sort_order`.
2. **About Us (`frontend/src/pages/public/AboutPage.jsx`):**
   - Keeps `about-us` `page` content + `LiveEditableText` for admins.
   - Fetches published `staff` items and groups them by `payload.department` (preserving display order). Falls back to `staffDepartments` from `mockAbout.js` when zero published staff records exist.
3. **Contact Page (`frontend/src/pages/public/ContactPage.jsx`):**
   - Wraps in `LiveEditProvider` + `LiveEditFloatingBar` so logged-in admins can edit `contact-us` headline/intro inline or jump straight to the CMS Desk.
   - Fetches published `page` (`contact-us`) to drive headline, intro text, WhatsApp link, Calendly link, and email (falling back to existing values).
   - Fetches published `office` items and renders a clean **Our Office Branches** card grid (branch name, address, phone, office hours, optional map link) whenever one or more published offices exist.
4. **Buyer Guides (`frontend/src/pages/public/GuidesPage.jsx`):**
   - Continues consuming published `article` items with cover image, category, summary, body, and live admin editing.

---

## 5. Error Handling & Edge Cases

- **Upload Validation:** Client checks file type and 10 MB cap before sending; server enforces identical checks via `multer` + MIME filter and returns descriptive `400` errors.
- **Duplicate Slug Handling:** For explicit-slug types (`page`, `article`), server catches Postgres unique violation (`23505`) and returns a friendly error (`"That web address is already in use. Please choose another."`). For auto-slug types (`banner`, `office`, `staff`, `partner`, `award`, `faq`), backend appends a short suffix automatically on collision.
- **Non-Destructive Form Errors:** Failed saves keep the editor drawer open with all entered text preserved and display an inline `Alert`.
- **Safe Deletion:** `CmsDeleteDialog` requires explicit confirmation before deleting, displays loading state while deleting, and surfaces any API error cleanly.
- **Public Resilience:** Every public CMS fetch wraps in `.catch(() => {})` so a temporary outage never blocks buyers from browsing properties or submitting contact messages.

---

## 6. Verification & Testing Strategy

1. **Backend Automated Tests (Vitest — `backend/src/schemas/cms.schema.test.ts`, `backend/src/services/cms.service.test.ts`, `backend/src/controllers/cms.controller.test.ts`):**
   - Schema validation accepts valid records for all 8 content types and rejects missing required payload fields (e.g., `staff` without `department`/`role`, `partner` with invalid `partner_type`, `award` without `year`, unsafe `media_url`).
   - Auto-slug generation avoids collisions for auto-slug types.
   - `POST /api/cms/admin/upload` requires `admin` role, accepts valid image uploads, and rejects non-image MIME types.
   - Public endpoints return only `PUBLISHED` items for all 8 types.
2. **Frontend Automated Tests (Vitest + React Testing Library):**
   - `AdminCmsPage.test.jsx`: Verifies all 6 real estate tabs render, KPI cards compute accurately, status filter pills + search work, tailored form fields appear per tab (including `Company & Contact` sub-type switch and `Partners & Awards` sub-type switch), `CmsMediaField` handles both link input and file upload preview, and `CmsDeleteDialog` gates deletion.
   - Public section tests (`PartnersSection`, `AwardsShowcase`, `AboutPage`, `ContactPage`): Verify published CMS items render dynamically and default fallbacks render when CMS returns empty lists.
3. **Build & Graph Update:**
   - Run `npm run test` / targeted test suites in both `backend` and `frontend`, plus production build checks, and run `graphify update .` after code edits.
