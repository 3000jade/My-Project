# Property Listing Showcase & Tour Conversion Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-converting, Redfin-inspired Property Listing Showcase for `PropertyListingView` focused strictly on architectural media immersion, core specifications, detailed features, cadastral context, and an interactive sticky tour booking engine (excluding monthly payment calculators, neighborhood scores, and mortgage FAQs).

**Architecture:** Refactor `PropertyListingView.jsx` into modular UI components conforming to `design.md`: 5-photo architectural mosaic, key metrics plinth, scroll-triggered sticky sub-navbar, architectural overview & features grid, cadastral map preview, and a sticky tour scheduling conversion rail.

**Tech Stack:** React 19 · Tailwind CSS v4 (`@tailwindcss/vite`) · Radix UI Primitives (`@radix-ui/react-dialog`, `@radix-ui/react-slot`) · Lucide React · JetBrains Mono tabular figures

**Spec Reference:** [`design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/design.md) & Redfin Home Details Benchmark (`2035 W Division St Unit 3`)

---

## 1. UI/UX Design Mockup Showcase (Focused Scope)

*(Excludes monthly payment calculator, walk scores, and mortgage FAQs; emphasizes architectural media, specifications, features grid, cadastral map, and sticky tour booking)*

![Redfin-Style Luxury Property Listing UI/UX Showcase (Streamlined)](C:/Users/Win11x64/.gemini/antigravity/brain/c62695e2-aed5-4d18-9486-568cad31b5c6/human_shelter_realty_listing_ui_mockup_v2_1794916455854.jpg)

---

## 2. Streamlined UI/UX Component Inventory Table

| Component Identifier | Component Name | Visual Tokens & Geometry | User Interactions & Behaviors | Target File Path |
| :--- | :--- | :--- | :--- | :--- |
| **COMP-01** | `ListingHeroMosaic` | Asymmetrical 5-tile photo grid (`h-[480px]`). Left 60% anchor shot, right 40% 2×2 thumbnail stack. `border-outline`, `rounded-xl`. | Floating "See all 38 Photos" pill (`rounded-full bg-white/90 backdrop-blur`) opens full-screen image lightbox dialog; "360° Virtual Tour" trigger. | `frontend/src/components/ui/sections/ListingHeroMosaic.jsx` |
| **COMP-02** | `ListingMetricsPlinth` | Hairline bordered plinth (`bg-surface border-y border-outline py-4 px-6`). | Displays primary price in bold tabular JetBrains Mono (`text-3xl font-bold font-mono text-on-surface`), Beds, Baths, SqFt (`$/sqft`), and Property Status badge. | `frontend/src/components/ui/sections/ListingMetricsPlinth.jsx` |
| **COMP-03** | `ListingStickySubNav` | Scroll-triggered sticky header (`fixed top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline h-14`). | Docks smoothly to top when user scrolls past Hero Mosaic. Houses compact address, price, and mini "Schedule Tour" CTA. | `frontend/src/components/ui/sections/ListingStickySubNav.jsx` |
| **COMP-04** | `PropertyFeaturesGrid` | Categorized 2-column specifications ledger (`rounded-xl border border-outline bg-surface p-6`). | Displays categorized architectural specs: Interior details, Kitchen fixtures, Climate systems, Parking allocation, Security, and Building amenities. | `frontend/src/components/ui/sections/PropertyFeaturesGrid.jsx` |
| **COMP-05** | `CadastralContextCard` | Cadastral map preview container (`rounded-xl border border-outline bg-surface p-6`). | Interactive embedded cadastral lot map with boundary pins, coordinate badges, and "Enlarge Map" dialog trigger. | `frontend/src/components/ui/sections/CadastralContextCard.jsx` |
| **COMP-06** | `StickyTourSchedulerDock` | Desktop right-rail sticky card (`w-full rounded-xl border border-outline bg-surface p-6 shadow-xs sticky top-20`). | "In-Person" vs "Video Chat" tabs, horizontal date pill carousel, time slot dropdown, primary Teal CTA (`bg-primary hover:bg-primary-hover text-white h-12`). Sponsoring broker card. | `frontend/src/components/ui/sections/StickyTourSchedulerDock.jsx` |
| **COMP-07** | `MobileTourBottomBar` | Mobile-only viewport sticky footer (`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-outline h-16 px-4`). | Presents listing price and prominent "Schedule Tour" full touch target (`min-h-[44px]`). | `frontend/src/components/ui/sections/MobileTourBottomBar.jsx` |

---

## 3. Explicitly Excluded Components (Out of Scope)

* ❌ **Monthly Payments / Mortgage Calculator:** Excluded per user direction (no interest rate sliders, no P&I breakdown bar).
* ❌ **Neighborhood Intelligence & Livability:** Excluded per user direction (no Walk Score®, Transit Score®, or Bike Score®).
* ❌ **Mortgage & Buying FAQs:** Excluded per user direction (no financing accordion or loan disclosure rows).

---

## 4. Execution Tasks

### Task 1: Component Scaffolding & Media Stage
- [ ] Create `frontend/src/components/ui/sections/ListingHeroMosaic.jsx` (5-photo asymmetrical grid + lightbox dialog trigger).
- [ ] Create `frontend/src/components/ui/sections/ListingMetricsPlinth.jsx` (tabular price in JetBrains Mono, beds, baths, floor area).
- [ ] Create `frontend/src/components/ui/sections/ListingStickySubNav.jsx` (scroll-triggered header).
- [ ] Run static syntax check `npx tsc --noEmit`.

### Task 2: Core Details, Features Grid & Cadastral Preview
- [ ] Create `frontend/src/components/ui/sections/PropertyFeaturesGrid.jsx` with structured amenity categories.
- [ ] Extract and encapsulate `frontend/src/components/ui/sections/CadastralContextCard.jsx` with satellite/boundary preview.
- [ ] Run static build check `npx vite build`.

### Task 3: Sticky Tour Conversion Engine
- [ ] Create `frontend/src/components/ui/sections/StickyTourSchedulerDock.jsx` (In-Person vs Video Chat, date pills, time slot selector, primary Teal CTA).
- [ ] Create `frontend/src/components/ui/sections/MobileTourBottomBar.jsx` for persistent mobile access.
- [ ] Wire scheduling triggers to existing `InspectionScheduleModal` workflow.

### Task 4: Page Integration & Verification
- [ ] Integrate new modular components into `frontend/src/pages/public/PropertyListingView.jsx`.
- [ ] Verify clean layout on desktop (12-column grid) and mobile viewports (`< 768px`).
- [ ] Run `npm run build` to confirm zero bundle or syntax issues.

---

## 5. Structured Manual Testing Table

| Test ID | Role / Persona | Preconditions | Action / User Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOD-001** | Visitor | Navigate to `/properties/:id` on desktop (`>= 1024px`) | Observe page layout | 5-photo mosaic and metrics plinth load cleanly; no mortgage calculator, walk scores, or FAQs appear | 🔘 Ready to Verify |
| **TC-MOD-002** | Visitor | On property page | Scroll past the hero mosaic | Sticky sub-nav docks to top; right-side "Go Tour This Home" card remains smoothly pinned | 🔘 Ready to Verify |
| **TC-MOD-003** | Visitor | Click "See all Photos" pill on hero mosaic | Lightbox dialog opens | High-res gallery dialog renders with keyboard arrow navigation (`Left`/`Right`) and Close `Esc` | 🔘 Ready to Verify |
| **TC-MOD-004** | Visitor | On "Go Tour This Home" card, select "Video Chat" | Tab switches | Visual indicator switches to `#0F766E`; time slots update to virtual consultation guidance | 🔘 Ready to Verify |
| **TC-MOD-005** | Mobile User | Open property page on mobile viewport (`375px`) | Scroll down | Mosaic displays responsive touch carousel; sticky bottom bar stays anchored with "Schedule Tour" CTA | 🔘 Ready to Verify |
