# Broker Property Listings Defects Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the data-mapping, display, and missing-state UI defects on the Broker Property Listings page (`/broker/properties`), including image retrieval from `property_images`, listing code precedence, numeric zero preservation, area unit formatting, property-type decoupling, status badge separation, Philippine timezone date calculations, comprehensive missing-state UI handling, and end-to-end verification.

**Architecture:** 
1. **Backend Service (`PropertyService.findProperties`)**: Batch retrieve images from `public.property_images` ordered by `display_order`, map proper numeric values preserving 0, eliminate hardcoded/fabricated MLS IDs, remove legacy property-type lookups, and ensure confidential field protection.
2. **Frontend Service (`propertyService.js`)**: Refactor `normalizeProperty` to eliminate automatic Unsplash fallbacks, preserve 0 vs null for bedrooms/bathrooms/livingArea, respect unit definitions, avoid MLS code fabrication, and return pristine UI-safe objects.
3. **Presentation Layer (`BrokerProperties.jsx`)**: Render neutral `<Building2 />` placeholder on image error or missing image with accessible labels; format listing codes (`listing_id` > `listing_key` > `id`); format living area with units (`m²`, `sq ft`); format bedrooms/bathrooms preserving 0 and showing `—` only when unknown; display type / subtype cleanly without purpose conflation; separate `PENDING` vs `RESERVED` vs `PENDING APPROVAL`; format Philippine dates (`Asia/Manila`) with calendar and relative day boundaries; implement exhaustive missing-state labels ("Untitled property", "Location not provided", "Price not provided", "Type not provided", "Unknown"); add accessible labels, responsive alignment, loading, empty, filtered-empty, and error/retry states with working-data preservation.
4. **Verification**: Focused unit/integration regression tests (Vitest) + Playwright E2E verification capturing refreshed browser state, network payloads, screenshots, and updating `docs/modules/02-property-listing/2026-10-16-broker-property-listings-data-verification.md`.

**Tech Stack:** React 19, TypeScript, Express v5, PostgreSQL / Supabase, Vitest, Playwright, Tailwind CSS v4, Lucide React.

**Spec:** [USER_REQUEST prompt requirements and `docs/modules/02-property-listing/2026-10-16-broker-property-listings-data-verification.md`]

## Global Constraints

- Do not modify database schema or alter production records.
- Preserve overall page layout, branding, permissions, and unrelated workflows.
- Frontend requests must go through `propertyService.js` and `apiClient.js`.
- Never show an empty-state message while a request is loading or has failed.
- Format dates explicitly in `Asia/Manila` timezone.
- Preserve zero (`0`) and distinguish it from null, undefined, empty strings, and missing data.

---

### Task 1: Shared Contracts & Backend Service Data Normalization

**Files:**
- Modify: `shared/types/property.ts`
- Modify: `backend/src/services/property.service.ts`
- Test: `test files/backend/services/property-data-mapping.test.ts`

**Interfaces:**
- Consumes: `public.properties`, `public.property_images`, `PropertyFilterQuery`
- Produces: `PropertyItem[]` with `mainImage` resolved from `property_images` ordered by `display_order`, nullable numeric fields preserving 0, accurate `listingId` / `listingKey`, and no fabricated MLS IDs.

- [ ] **Step 1: Write the failing test for backend property data mapping**

Create `test files/backend/services/property-data-mapping.test.ts` to test:
1. Batch retrieval of `property_images` ordered by `display_order` without hardcoded fallbacks.
2. Preservation of numeric 0 for `bedrooms_total`, `bathrooms_total_integer`, `living_area`.
3. Non-fabrication of MLS identifiers when `listing_id` is null.
4. Absence of confidential fields for public callers, preservation for brokers.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "property-data-mapping.test.ts"` in `backend`
Expected: FAIL due to missing batch retrieval and fallback logic.

- [ ] **Step 3: Update `shared/types/property.ts` and `backend/src/services/property.service.ts`**

1. In `shared/types/property.ts`: make `property_type_id` / `propertyTypeId` optional, add `mainImage?: string | null`.
2. In `backend/src/services/property.service.ts`:
   - In `PropertyService.findProperties`:
     - When properties are fetched from `supabase.from('properties')`, collect `propertyIds = data.map(r => r.id)`.
     - Batch fetch images from `public.property_images`:
       ```typescript
       let imageMap: Record<string, string[]> = {};
       if (propertyIds.length > 0) {
         const { data: imagesData } = await supabase
           .from('property_images')
           .select('property_id, image_url, display_order')
           .in('property_id', propertyIds)
           .order('display_order', { ascending: true });
         if (imagesData) {
           for (const img of imagesData) {
             if (!imageMap[img.property_id]) imageMap[img.property_id] = [];
             imageMap[img.property_id].push(img.image_url);
           }
         }
       }
       ```
     - Map `mainImage`: `(imageMap[row.id] && imageMap[row.id][0]) || (row.images && row.images[0]) || null`.
     - Map `images`: `imageMap[row.id] || row.images || []`.
     - Map `listingId`: `row.listing_id || null` (DO NOT fabricate `MLS-...` from id!).
     - Map `listingKey`: `row.listing_key || null`.
     - Map numeric specs preserving 0:
       ```typescript
       bedroomsTotal: row.bedrooms_total !== null && row.bedrooms_total !== undefined ? Number(row.bedrooms_total) : (row.beds !== null && row.beds !== undefined ? Number(row.beds) : null),
       bathroomsTotalInteger: row.bathrooms_total_integer !== null && row.bathrooms_total_integer !== undefined ? Number(row.bathrooms_total_integer) : (row.baths !== null && row.baths !== undefined ? Number(row.baths) : null),
       livingArea: row.living_area !== null && row.living_area !== undefined ? Number(row.living_area) : null,
       livingAreaUnits: row.living_area_units || 'Square Meters',
       ```
     - Remove `property_type_id` requirements and lookup assumptions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "property-data-mapping.test.ts"` in `backend`
Expected: PASS.

---

### Task 2: Frontend Normalization Service (`propertyService.js`)

**Files:**
- Modify: `frontend/src/services/propertyService.js`
- Test: `frontend/src/services/propertyService.test.js`

**Interfaces:**
- Consumes: Raw backend response object from `/api/properties`
- Produces: Normalized, UI-safe property object without mock fallbacks

- [ ] **Step 1: Write failing unit tests for `normalizeProperty`**

In `frontend/src/services/propertyService.test.js`:
1. Verify `mainImage` is `null` when images array is empty (no Unsplash stock photo injection).
2. Verify `beds` / `baths` preserves `0` (e.g. Studio with 0 beds returns 0, not 1).
3. Verify `bedrooms_total` takes precedence over legacy `beds`.
4. Verify `bathrooms_total_integer` takes precedence over legacy `baths`.
5. Verify `living_area` preserves `0` and does not substitute with `sqft` when units differ.
6. Verify `listing_id` is null/empty when absent, not fabricated.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "propertyService.test.js"` in `frontend`
Expected: FAIL due to Unsplash fallback and `|| 1` defaults.

- [ ] **Step 3: Refactor `normalizeProperty` in `propertyService.js`**

1. Helper `parseNullableNumber(val)`: returns `null` if val is null, undefined, or empty string; otherwise `Number(val)`.
2. Remove Unsplash fallback:
   ```javascript
   const rawImages = Array.isArray(rawItem.images) ? rawItem.images : [];
   const images = rawImages.map(resolveDriveImageUrl).filter(Boolean);
   const mainImage = resolveDriveImageUrl(rawItem.mainImage || rawItem.image) || (images.length > 0 ? images[0] : null);
   ```
3. Set numeric fields with nullish preservation:
   ```javascript
   const bedroomsTotal = parseNullableNumber(rawItem.bedrooms_total ?? rawItem.bedroomsTotal ?? rawItem.specs?.bedroomsTotal ?? rawItem.beds ?? rawItem.specs?.beds);
   const bathroomsTotalInteger = parseNullableNumber(rawItem.bathrooms_total_integer ?? rawItem.bathroomsTotalInteger ?? rawItem.specs?.bathroomsTotalInteger ?? rawItem.baths ?? rawItem.specs?.baths);
   const livingArea = parseNullableNumber(rawItem.living_area ?? rawItem.livingArea ?? rawItem.specs?.livingArea ?? rawItem.floor_area);
   ```
4. Do NOT fabricate MLS ID:
   ```javascript
   listing_id: rawItem.listing_id || rawItem.listingId || null,
   listing_key: rawItem.listing_key || rawItem.listingKey || null,
   ```
5. Do NOT invent `"Metro Manila"` when location is missing:
   ```javascript
   location: locationString || null,
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- "propertyService.test.js"` in `frontend`
Expected: PASS.

---

### Task 3: BrokerProperties Presentation & Data-Mapping UI Corrections

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Test: `test files/frontend/pages/broker/BrokerProperties.test.jsx`

**Interfaces:**
- Consumes: Normalized properties from `propertyService.getProperties()`
- Produces: Rendered table with accessible placeholders, accurate codes, units, statuses, Manila dates, and error/empty states.

- [ ] **Step 1: Write failing tests in `BrokerProperties.test.jsx`**

Add tests for:
1. Neutral `<Building2 />` placeholder rendered with `aria-label="No image available"` when image is null or broken.
2. Listing code hierarchy: displays `listing_id` first, falling back to `listing_key`, then UUID, then "Not provided".
3. Specs display: shows `0` for 0 beds/baths, `—` when unknown. Shows `m²` or `sq ft` based on `living_area_units`, and "Not provided" when area is missing.
4. Property Type: shows "Type not provided" when type is missing; omits secondary line when subtype is missing; never displays transaction purpose as subtype.
5. Status badges: distinct badges for Active, Needs Approval, Under Contract, Pending, Reserved, Closed, Draft, Unknown.
6. Date added: formatted explicitly in `Asia/Manila` with consistent relative days.
7. Loading feedback, error state with Retry, filtered empty state with Clear Filters, working data preserved on refresh error.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "BrokerProperties.test.jsx"` in `frontend`
Expected: FAIL on new test assertions.

- [ ] **Step 3: Implement UI corrections in `BrokerProperties.jsx`**

1. **Date formatters**:
   - `formatPhilippineCalendarDate(dateStr)`: uses `Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })`. Returns `'Not provided'` if null/empty, `'Unavailable'` if invalid date.
   - `formatPhilippineRelativeTime(dateStr)`: computes day difference against current Philippine midnight using `Intl.DateTimeFormat`. Returns `'Today'`, `'Yesterday'`, `'X days ago'`, etc. Returns `'Not provided'` if null/empty, `'Unavailable'` if invalid.
2. **Thumbnail render**:
   - Show `<img>` if `row.mainImage || row.image`, with `onError` fallback to hide img and reveal fallback icon.
   - If no image, render neutral container with `<Building2 className="w-5 h-5 text-slate-400" aria-hidden="true" />` and `aria-label="No image available"`.
3. **Property Name & Listing Code**:
   - Title: `row.title || 'Untitled property'`.
   - Listing code:
     ```javascript
     const listingId = row.listingId || row.listing_id;
     const listingKey = row.listingKey || row.listing_key;
     const codeDisplay = listingId 
       ? (listingId.startsWith('MLS') ? listingId : `MLS: ${listingId}`)
       : (listingKey ? `KEY: ${listingKey}` : (row.id ? `ID: ${row.id}` : 'Not provided'));
     ```
4. **Location**:
   - Primary: `row.city || row.subdivision_name || row.address || 'Location not provided'`.
   - Subtitle: `row.state_or_province || row.state || (row.city && row.address && row.address !== row.city ? row.address : null)`. Omit if null.
5. **Property Type**:
   - Primary: `row.property_type || row.propertyType || 'Type not provided'`.
   - Subtype: `row.property_sub_type || row.propertySubType || null`. Omit secondary line if null (do NOT display `transaction_type`).
6. **Specs**:
   - Floor area:
     ```javascript
     const area = row.living_area ?? row.livingArea;
     const units = (row.living_area_units || row.livingAreaUnits || 'Square Meters') === 'Square Feet' ? 'sq ft' : 'm²';
     const areaText = area !== null && area !== undefined && area !== '' ? `${area} ${units}` : 'Not provided';
     ```
   - Beds: `row.bedrooms_total ?? row.bedroomsTotal ?? row.bedrooms ?? row.beds ?? '—'`.
   - Baths: `row.bathrooms_total_integer ?? row.bathroomsTotalInteger ?? row.bathrooms ?? row.baths ?? '—'`.
   - Accessible descriptions: add `aria-label="Floor area: ..."` etc.
7. **Price**:
   - If `row.price_raw > 0` or (numeric price > 0): `₱${Number(rawPrice).toLocaleString()}`.
   - If 0, null, or missing: `'Price not provided'`.
8. **Status badges & filters**:
   - Map `PENDING APPROVAL` $\rightarrow$ Needs Approval (Amber).
   - Map `ACTIVE UNDER CONTRACT` $\rightarrow$ Under Contract (Amber).
   - Map `PENDING` $\rightarrow$ Pending (Amber/Purple).
   - Map `RESERVED` $\rightarrow$ Reserved (Amber).
   - Map `ACTIVE` / `AVAILABLE` $\rightarrow$ Active (Emerald).
   - Map `CLOSED` / `SOLD` $\rightarrow$ Closed (Rose).
   - Map `DRAFT` / `INACTIVE` $\rightarrow$ Draft (Blue).
   - Map any other $\rightarrow$ Unknown (Slate).
9. **UI Feedback & Error States**:
   - Skeleton/loader while `loading`.
   - Error banner with "Retry" button when `error` occurs.
   - Preserve `properties` in state if manual refresh fails, displaying a toast notification that refresh failed.
   - Empty filtered state: when search/filter returns 0 items, display "No matching listings found" with "Clear filters" button.
   - Empty database state: when raw properties list has 0 items, display "No property listings found".

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- "BrokerProperties.test.jsx"` in `frontend`
Expected: PASS.

---

### Task 4: Full Test Suite Verification

**Files:**
- Run backend and frontend vitest suites.

- [ ] **Step 1: Run frontend test suite**
Run: `npm test` in `frontend`
Expected: All tests pass.

- [ ] **Step 2: Run backend property test suite**
Run: `npx vitest run "property"` in `backend`
Expected: All property tests pass.

---

### Task 5: End-to-End Browser Verification & Report Update

**Files:**
- Script: `frontend/verify-broker-properties-e2e.mjs`
- Evidence: `docs/reports/evidence/broker-property-listings/`
- Report: `docs/modules/02-property-listing/2026-10-16-broker-property-listings-data-verification.md`

- [ ] **Step 1: Execute Playwright E2E browser verification**

Run real browser session logged in as `broker@pt.com`.
Verify:
1. Full chain: Supabase DB $\rightarrow$ Backend API $\rightarrow$ Frontend $\rightarrow$ Rendered DOM.
2. Verified neutral `<Building2 />` placeholder rendered for listings with missing images.
3. Accurate listing codes rendered (e.g. `MLS-0C39KDW` instead of `ID: KEY-...`).
4. Correct unit formatting (`100 m²`).
5. Correct Manila date (`Oct 16, 2026` / `Today`).
6. Zero preservation and missing labels.
7. Capture before/after screenshots and network logs into `docs/reports/evidence/broker-property-listings/`.

- [ ] **Step 2: Update `docs/modules/02-property-listing/2026-10-16-broker-property-listings-data-verification.md`**

Update the audit report with:
- Summary of all implemented corrections.
- Before/after behavioral comparison and screenshots.
- Updated verification matrix with all fields verified.
- Regression test and E2E results.
- Remaining limitations or blocked cases.
