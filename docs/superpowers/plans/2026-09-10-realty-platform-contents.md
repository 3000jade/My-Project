# Realty Platform Architecture & Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate the complete 3-tier Realty Platform (Core Navigation, Lead Generation & Value Content, Functional Content & Legal Compliance) in the React frontend, featuring the static "In Progress" architectural hero anchor, interactive MLS filters, neighborhood intelligence guides, home valuation CMA tool, blog, and regulatory disclosures.

**Architecture:** Implement modular, highly reusable React components styled with Tailwind CSS and Framer Motion. Maintain strict compliance with the *Monolith & Void* design tokens (`#174849` Deep Pine Teal, `#FB8E5D` Sunset Amber, `#071313` Obsidian, uniform `h-[54px]` controls, Doppelrand double-bezel padding, and `data-lenis-prevent="true"` for scroll isolation).

**Tech Stack:** React 19, Tailwind CSS v3/v4, Framer Motion, Lenis Scroll (`lenis/react`), React Router v7, `@tanstack/react-virtual`.

**Spec:** [`docs/superpowers/specs/2026-09-10-realty-platform-contents-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-10-realty-platform-contents-design.md)

## Global Constraints

- **Control Heights:** Every input, select, and button inside search, valuation, and contact components MUST be strictly `h-[54px]`.
- **Header & Search Offset:** Exactly `80px` header offset tracked via `getBoundingClientRect` sentinel element.
- **Sticky Transition:** Search box loses `rounded` radius (`rounded-0`) and spans edge-to-edge when snapping sticky.
- **Lenis Modal Fix:** Any scrollable container inside a modal or drawer MUST carry `data-lenis-prevent="true"`.
- **Modal Physics:** Framer Motion spring (`damping: 25`, `stiffness: 200`, `y: 100 -> 0`, `scale: 0.9 -> 1.0`) over `bg-black/80 backdrop-blur-md`.
- **Close Buttons:** `w-9 h-9` solid white circle (`bg-white shadow-xl text-[20px] text-gray-900`).

---

### Task 1: Static "In Progress" Architectural Hero Visual Anchor

**Files:**
- Create: `frontend/src/components/ui/HeroVisualAnchor.jsx`
- Modify: `frontend/src/pages/Home.jsx`
- Test: Manual visual check on `http://localhost:5173` & React unit tests

**Interfaces:**
- Produces: `<HeroVisualAnchor onExplore={() => {}} onRequestValuation={() => {}} />`

- [ ] **Step 1: Create `HeroVisualAnchor.jsx`**
  - Implement full-viewport visual anchor with high-resolution twilight architectural image.
  - Render luxury tracked glassmorphic badge: `[ IN PROGRESS • ARCHITECTURAL PREVIEW ]` with subtle pulsing indicator.
  - Embed dual action buttons (`h-[54px]`, "Explore Verified Inventory" and "Request Instant Home Valuation").
  - Add ambient radial gradients (`#174849`/30% and `#FB8E5D`/20%).
- [ ] **Step 2: Integrate into `Home.jsx`**
  - Replace the multi-image slideshow with `HeroVisualAnchor`.
  - Wire sentinel ref directly below `HeroVisualAnchor` to maintain precision 80px sticky header transition.
- [ ] **Step 3: Verification & Commit**
  - Check in browser that badge renders crisp, gradients display specular depth, and buttons link to `/properties` and `/valuation`.
  - `git commit -m "feat(home): add static in-progress architectural hero visual anchor"`

---

### Task 2: Advanced Search Console with Buy/Sell/Rent Tabs

**Files:**
- Modify: `frontend/src/components/ui/AdvancedSearchBox.jsx`
- Modify: `frontend/src/pages/Home.jsx`

**Interfaces:**
- Consumes: Sentinel scroll events and search filter handlers.
- Produces: Real-time search filter state passing to `/properties`.

- [ ] **Step 1: Add Buy / Sell / Rent Mode Switcher**
  - Add pill segmented controls at top of `AdvancedSearchBox` (`Buy`, `Sell`, `Rent`).
  - When "Sell" is selected, dynamically transition fields to "Enter Address for CMA Valuation" with direct link to the valuation tool.
- [ ] **Step 2: Ensure Strict 54px Uniformity**
  - Verify every text input, dropdown button, and filter trigger inside `AdvancedSearchBox` has `h-[54px]`.
- [ ] **Step 3: Edge-to-Edge Sticky Transition**
  - Ensure `isSticky` state toggles `rounded-[2.5rem]` $\rightarrow$ `rounded-0` and expands edge-to-edge.
- [ ] **Step 4: Verification & Commit**
  - Test scrolling down past sentinel; verify sticky snap and mode toggling.
  - `git commit -m "feat(search): add buy/sell/rent tabs and polish 54px flush alignment"`

---

### Task 3: Exclusive Listings Showcase & Inspection Modal

**Files:**
- Create: `frontend/src/components/ui/ExclusiveListingsSection.jsx`
- Modify: `frontend/src/pages/Home.jsx`
- Reuse: `frontend/src/components/ui/PropertyDetailModal.jsx`

**Interfaces:**
- Consumes: `mockProperties` filtered by `exclusive: true`.
- Produces: Modal opening dispatch via custom event `open-property-detail`.

- [ ] **Step 1: Create `ExclusiveListingsSection.jsx`**
  - Build horizontal / 3-column curated grid of agency exclusive estates.
  - Display architectural tags: Lot Area, Gross Floor Area, Solar Azimuth, Architect.
  - Add "Cinematic Walkthrough" badge and quick-inspection CTA.
- [ ] **Step 2: Clean up Home.jsx obsolete placeholders**
  - Remove generic `CATEGORY_CARDS` (Print, Typography, Animation, etc.) from `Home.jsx`.
  - Mount `ExclusiveListingsSection` in its place.
- [ ] **Step 3: Verify Modal Spring Physics & Lenis Scroll Lock**
  - Test clicking any exclusive card opens `PropertyDetailModal`.
  - Confirm `data-lenis-prevent="true"` prevents Lenis from hijacking internal modal scroll.
- [ ] **Step 4: Verification & Commit**
  - `git commit -m "feat(listings): mount exclusive listings showcase and clean up obsolete cards"`

---

### Task 4: Free Home Valuation CMA Tool & Dedicated Landing

**Files:**
- Create: `frontend/src/components/ui/HomeValuationTool.jsx`
- Create: `frontend/src/pages/HomeValuationPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Header.jsx`

**Interfaces:**
- Produces: Route `/valuation` and embedded tool component.
- Outputs: Ingestion payload dispatched to `/broker/inquiries` mock dataset.

- [ ] **Step 1: Create `HomeValuationTool.jsx`**
  - Build 2-step interactive CMA funnel:
    - Step 1: Address input (`h-[54px]`), property type, floor area (sqm/sqft), bedrooms, and condition rating.
    - Step 2: Instant estimated valuation range ($ Low, Expected, High) with confidence meter and comparative MLS sales indicator.
  - Add contact information capture (`Name`, `Email`, `Phone`) to dispatch full CMA dossier.
- [ ] **Step 2: Create `HomeValuationPage.jsx`**
  - Wrap the tool in a dedicated editorial landing page explaining the firm's algorithmic and on-the-ground valuation methodology.
- [ ] **Step 3: Register Route in `App.jsx` & Navigation in `Header.jsx`**
  - Lazy load `HomeValuationPage` on `/valuation`.
  - Add "Sell / Valuation" link in `Header.jsx`.
- [ ] **Step 4: Verification & Commit**
  - Complete a test valuation; confirm range calculation and success confirmation state.
  - `git commit -m "feat(valuation): implement free home valuation CMA funnel and route"`

---

### Task 5: Neighborhood Guides & District Intelligence

**Files:**
- Create: `frontend/src/data/mockNeighborhoods.js`
- Create: `frontend/src/pages/NeighborhoodGuidesPage.jsx`
- Create: `frontend/src/components/ui/NeighborhoodCard.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Header.jsx`

**Interfaces:**
- Produces: Route `/neighborhoods` and neighborhood intelligence cards.

- [ ] **Step 1: Create `mockNeighborhoods.js`**
  - Populate data for prime enclaves: Makati CBD, Bonifacio Global City, Alabang Hills, Forbes Park, New Manila.
  - Include metrics: School Ratings (e.g. 9.8/10), Walk Score, Avg Price/sqm, 5-Year Appreciation (+42%), and Michelin Dining count.
- [ ] **Step 2: Build `NeighborhoodGuidesPage.jsx` and `NeighborhoodCard.jsx`**
  - Create interactive district grid with filter tabs (Urban Core, Coastal Enclave, Gated Subdivisions).
  - Add expandable modal/sheet displaying school details, commute times, and lifestyle amenities.
- [ ] **Step 3: Register Route in `App.jsx` & Navigation in `Header.jsx`**
  - Lazy load `NeighborhoodGuidesPage` on `/neighborhoods`.
  - Add "Neighborhoods" link in `Header.jsx`.
- [ ] **Step 4: Verification & Commit**
  - Test neighborhood cards, metric rendering, and modal details.
  - `git commit -m "feat(neighborhoods): add district intelligence guides and metrics"`

---

### Task 6: Real Estate Blog & Market Intelligence Editorial

**Files:**
- Create: `frontend/src/data/mockArticles.js`
- Create: `frontend/src/pages/BlogPage.jsx`
- Create: `frontend/src/components/ui/BlogCard.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: Route `/blog` and editorial article cards.

- [ ] **Step 1: Create `mockArticles.js`**
  - Articles covering:
    - "Navigating Luxury Real Estate Taxes: Capital Gains & Stamp Duty"
    - "Q3 Luxury Residential Index: Capital Inflows & Yield Analysis"
    - "Mastering Off-Market Acquisitions: The Private Office Protocol"
- [ ] **Step 2: Build `BlogPage.jsx` and `BlogCard.jsx`**
  - Editorial layout with category filter pills (`All`, `Market Reports`, `Tax & Legal`, `Acquisition Guides`).
  - Featured article header with reading time, author credential, and downloadable PDF report trigger.
  - Contextual quick-fill contact banner at the base of the page.
- [ ] **Step 3: Register Route in `App.jsx`**
  - Lazy load `BlogPage` on `/blog`.
- [ ] **Step 4: Verification & Commit**
  - `git commit -m "feat(blog): implement market intelligence articles and editorial hub"`

---

### Task 7: Verified Client Testimonials & Case Studies

**Files:**
- Create: `frontend/src/components/ui/TestimonialsSection.jsx`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/AboutPage.jsx`

**Interfaces:**
- Produces: Reusable `<TestimonialsSection />` component.

- [ ] **Step 1: Build `TestimonialsSection.jsx`**
  - Dual presentation:
    - Verified Transaction Testimonials (Quote, client photo/anonymous icon, acquisition context, transaction duration).
    - Case Study Spotlight: Before/after acquisition breakdown detailing zoning clearance and off-market negotiation.
- [ ] **Step 2: Embed in `Home.jsx` and `AboutPage.jsx`**
  - Replace basic text carousel with the rich `TestimonialsSection`.
- [ ] **Step 3: Verification & Commit**
  - `git commit -m "feat(testimonials): add verified client transaction reviews and case studies"`

---

### Task 8: Legal Compliance, Equal Housing & Regulatory Footer

**Files:**
- Create: `frontend/src/pages/ComplianceLegalPage.jsx`
- Modify: `frontend/src/components/Footer.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: Route `/compliance` and updated institutional regulatory footer.

- [ ] **Step 1: Create `ComplianceLegalPage.jsx`**
  - Detailed sections for:
    - Equal Housing Opportunity statement & anti-discrimination charter.
    - MLS IDX Data Disclaimer & intellectual property notice.
    - Philippine Data Privacy Act (RA 10173) & GDPR disclosures.
    - Professional licensing details (PRC Real Estate Brokerage License & REBAP Accreditation).
- [ ] **Step 2: Update `Footer.jsx`**
  - Add official Equal Housing Opportunity logo / SVG emblem.
  - Anchor MLS IDX compliance notice with real-time update timestamp.
  - Link directly to `/compliance`, `/privacy`, `/terms`.
- [ ] **Step 3: Register Route in `App.jsx`**
  - Lazy load `ComplianceLegalPage` on `/compliance`.
- [ ] **Step 4: Verification & Commit**
  - Confirm legal badges render cleanly and links route smoothly.
  - `git commit -m "feat(compliance): anchor regulatory disclosures, fair housing and MLS notices"`

---

### Task 9: End-to-End Polish & Verification

**Files:**
- All modified & created files

- [ ] **Step 1: Lenis & Motion Physics Audit**
  - Ensure all modals, drawers, and popovers maintain `data-lenis-prevent="true"`.
  - Verify smooth momentum scrolling remains uninterrupted across all pages.
- [ ] **Step 2: Precision Height Audit**
  - Verify every input and button inside search, valuation, and contact modules measures exactly `h-[54px]`.
- [ ] **Step 3: Responsive Breakpoints Audit**
  - Verify mobile (375px), tablet (768px), and desktop (1440px) layouts.
- [ ] **Step 4: Run build check**
  - `npm run build` to confirm zero compilation errors or broken imports.
- [ ] **Step 5: Final Git Commit & Summary**
  - `git commit -m "chore: complete end-to-end integration of realty platform content suite"`
