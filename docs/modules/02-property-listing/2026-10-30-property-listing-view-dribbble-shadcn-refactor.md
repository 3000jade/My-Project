---
module: 02-property-listing
date: 2026-10-30
status: Complete — verified locally
affected_files:
  - frontend/src/pages/public/PropertyListingView.jsx
  - frontend/src/components/layout/Header.jsx
  - frontend/src/components/ui/map/GooglePropertyMap.jsx
  - frontend/src/components/ui/map/PropertyMap.jsx
  - frontend/src/index.css
---

# Verification Record — Property Listing View Dribbble-Inspired shadcn/ui Refactoring

## 1. Context & Objectives
- **Target:** `frontend/src/pages/public/PropertyListingView.jsx` (Public Property Details Showcase)
- **Goal:** Transform the property listing page into a modern, high-converting, Dribbble-inspired architectural real estate showcase using shadcn/ui primitives (`Card`, `Button`, `Badge`, `Dialog`).
- **Refinement Follow-Up:**
  - Make navigation bar properly sticky below the main 80px fixed header.
  - Eliminate redundant cards and duplicate specification lists.
  - Completely remove confidential staff information (`Private Remarks`, `Showing Instructions`, `Lockbox Code`, `Commission Split / Co-Broke`, `Staff Notes`).
  - Remove visible MLS ID chip: `MLS ID: MLS-6CELVNZ(...)` while retaining `data-testid="reso-listing-id"` for test compliance.
  - Remove asking price preview from top header and remove `Verified by Human Shelter Realty` from the header subtitle.
  - Remove status when `Pending Confirmation` (retain `data-testid="reso-standard-status"` as `sr-only`).
  - Replace `"Comprehensive RESO Specifications"` heading with `"Specification"`.
  - Replace `"Property Highlights"` heading with `"Property Description"`.
  - Replace `"Cadastral Location"` heading with `"Map"`.
  - Remove `Calculated rate: ₱1 / sqm` and Unit Rate metrics from public view.
  - Remove `PRC #0023419 • Verified MLS Listing` line from agent card.
  - Fix document media categorization: prevent photo files from rendering as fake `"Property Brochure"` documents, ensuring the dashed empty documents placeholder renders when no actual documents are attached.
  - Resolve missing image extraction: inspect RESO `media` / `property_media` arrays with `mediaCategory: 'Photo'` so property photos resolve and render instead of falling back to "No property photos uploaded yet".
  - Prevent all maps (Leaflet and Google Maps) from escaping their container or overlaying other components (sticky navigation bar, fixed headers, modals).
  - Strip HTML tags (e.g. `<p>test</p>` -> `test`) in Property Description so raw markup is never exposed.
  - Relocate in-page navigation bar beneath the key specifications ribbon (Bedrooms, Bathrooms, Floor Area, Lot Size, Parking icons).
  - Verify visually and interactively using Playwright MCP.

---

## 2. Delivered Behavior & Enhancements

1. **HTML Tag Sanitization in Property Description:**
   - Raw markup like `<p>test</p>` is stripped via `cleanPublicRemarks` memo (`replace(/<[^>]+>/g, '')`), displaying clean human-readable text `test`.

2. **In-Page Navigation Relocation:**
   - Moved navigation bar (`Property Description`, `Specification`, `Amenities`, `Map`, `Financials`, `Documents`, and quick Save/Share) from the page top to directly beneath the key specifications ribbon (Bedrooms, Bathrooms, Floor Area, Lot Size, Parking).
   - Set to `sticky top-[80px] z-30` so as users scroll down, it pins seamlessly below the 80px fixed header.
   - Retained top header row with "Back to Properties" and breadcrumb navigation above the photo showcase.

3. **Map Stacking Context & Overlay Prevention:**
   - Enforced `isolation: isolate !important; z-index: 0 !important;` globally across `.leaflet-container`, `[data-testid^="google-property-map"]`, and `.property-map-container` in `index.css`.
   - Scaled internal Leaflet panes to `z-index: 10` and HUD controls to `z-20` (replacing legacy `z-[1000]`).
   - Added `relative isolate z-0` to the map container in `GooglePropertyMap.jsx`, `PropertyMap.jsx`, and `PropertyListingView.jsx`.
   - Verified via Playwright live browser inspection: sticky navigation bar (`z-30`) and fixed header (`z-50`) render 100% on top of the map.

4. **Top Header Cleanliness & Confidentiality:**
   - Visible MLS ID chip `MLS ID: MLS-6CELVNZ(e053104d-124c-455f-b812-aa39d4b11583)` removed; preserved `<span data-testid="reso-listing-id" className="sr-only">` for automated test compliance.
   - Removed duplicate asking price block from desktop header.
   - Removed `"Verified by Human Shelter Realty"` from header subtitle.
   - Status badge hidden when status is `Pending Confirmation`; rendered with `sr-only` so RESO compliance tests pass without exposing internal confirmation states to visitors.

5. **Rate & Agent License Removals:**
   - Permanently deleted `Calculated rate: {pricePerSqm}` under the sidebar price.
   - Streamlined key metrics ribbon to 5 core RESO specifications (Bedrooms, Bathrooms, Floor Area, Lot Size, Parking), eliminating redundant "Unit Rate".
   - Permanently deleted `{agent.license} • Verified MLS Listing` from the agent card footer.

6. **Media & Photo Hydration Resolution:**
   - Added RESO `media` and `property_media` resolution in `photos` hook. Filtered by category (`Photo` / non-document), sorting by `orderIndex`/`display_order`.
   - Real property photo (`https://lh3.googleusercontent.com/d/1gIL_J_F8O7Xf-h4ctPar8roRSh0UjebJ`) now successfully renders in the Hero section instead of falling back to "No property photos uploaded yet".

7. **Official Media & Documents Empty State:**
   - Refined `mediaList` calculation to strictly filter for real document assets (`cat === 'document' || cat === 'pdf' || type.includes('pdf') || url.endsWith('.pdf')`).
   - Photos with `mediaCategory === 'Photo'` are no longer mistakenly parsed as documents.
   - Confirmed empty placeholder renders with dashed border, icon, and `"No documents uploaded — Architectural brochures, floor plans, and elevation documents have not been attached to this listing yet."`

---

## 3. Verification Evidence

### 3.1 Static & Test Checks
- **Vitest Unit Test Suite:** `npx vitest run src/pages/public/PropertyListingView.test.jsx` — **3 passed (100%)**.
- **Production Build Check:** `npm run build` — **Built in 6.67s without errors**.

### 3.2 Live Playwright MCP Verification
- **DOM & Layout Ordering Evaluation (`5af51edb-4fda-44bf-9f7a-6fafd420279e` / `test 3`):**
  ```json
  {
    "remarksText": "test",
    "remarksHTML": "test",
    "hasRawPTag": false,
    "specsRibbonTop": 829.0,
    "navTop": 958.0,
    "twoColTop": 1032.0,
    "isNavBeneathSpecs": true,
    "navPills": [
      "Property Description",
      "Specification",
      "Amenities",
      "Map",
      "Financials",
      "Documents",
      "Save"
    ]
  }
  ```
- **Screenshots Captured:**
  - `nav-beneath-specs-and-clean-tag-verified.png`
  - `map-scrolled-under-nav-verified.png`
  - `image-resolved-hero.png`
