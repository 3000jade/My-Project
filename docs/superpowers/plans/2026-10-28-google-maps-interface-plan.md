# Google Maps Platform Interface & Geospatial Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Google Maps JavaScript API vector interface, custom Bauhaus HTML price badge pins (`AdvancedMarkerElement`), Street View 360° viewer, Places Autocomplete, and Cadastral Location Picker across all identified public, broker, and agent pages with zero-cost safeguards and fallback resilience.

**Architecture:** Upgrades CP_kerby's spatial engine from Leaflet raster tiles and unstyled Google iframes to Google Maps Platform client-side WebGL vector rendering using `@googlemaps/js-api-loader`. Replaces static iframe embeds across the platform with responsive, high-performance components: `GooglePropertyMap.jsx`, `StreetViewModal.jsx`, `GooglePlacesSearchInput.jsx`, `CadastralLocationPicker.jsx`, and `CommuteAnalysisCard.jsx`.

**Tech Stack:** React 19, `@googlemaps/js-api-loader`, `@googlemaps/markerclusterer`, Tailwind CSS v4, Framer Motion, Express v5, Vitest, Playwright.

**Spec:** [`docs/modules/02-property-listing/2026-10-28-google-maps-interface-specification.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/2026-10-28-google-maps-interface-specification.md)

---

## Global Constraints & `design.md` Specifications

- **Authoritative Color Tokens (`design.md` Section 3.1):**
  - `primary`: `#0F766E` (Primary Teal)
  - `primary-hover`: `#115E59` (Primary Teal Hover)
  - `secondary`: `#14B8A6` (Secondary Teal)
  - `accent`: `#FF6B6B` (Approved Coral Accent)
  - `background`: `#F8FAFC` (App & Page Canvas)
  - `surface`: `#FFFFFF` (Card & Modal Surface)
  - `text-primary`: `#1E293B` (Slate 800 Primary Text, contrast >= 4.5:1)
  - `text-secondary`: `#64748B` (Slate 500 Muted Text)
  - `border`: `#E2E8F0` (Slate 200 Hairline Border)
- **Approved Coral Button Standard (`design.md` Section 3.1):**
  - High-impact conversion CTAs (such as "View Residence →" and "Launch 360° Tour") MUST use background `#FF6B6B` (`colors.accent`) paired with text/icon color `#1E293B` (`colors.text-primary`), providing a verified 5.27:1 contrast ratio.
- **Mobile Touch Target Floor:**
  - All interactive triggers, HUD toggle pills, close icons, and autocomplete suggestions MUST maintain a minimum effective touch target of 44 by 44 CSS pixels (`min-h-[44px] min-w-[44px]`) on mobile viewports.
- **Corner Radii & Borders:**
  - Standard container radius is `8px` (`rounded-lg`); floating HUD plinths and price badge markers use `rounded-full` pills. Hairline borders must strictly use `1px solid #E2E8F0`.
- **Focus Rings & Accessibility:**
  - Accessible focus states must render visible focus indicators: `focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2`.
  - All interactive map pins and icon-only buttons must provide explicit `aria-label` screen reader announcements.
- **Momentum Scroll Isolation:**
  - Every map canvas container and popup overlay MUST set `data-lenis-prevent="true"` to prevent trackpad zoom from conflicting with page scroll.
- **Zero-Cost Quota Governance:**
  - Autocomplete MUST utilize `AutocompleteSessionToken` to aggregate keystrokes into a single billable session. Server-side caching (5-min TTL) MUST prevent duplicate Geocoding and Commute queries.
- **Dual-Provider Fallback Resilience:**
  - If `VITE_GOOGLE_MAPS_API_KEY` is missing or the external script fails to load, the UI must fall back gracefully to the existing Leaflet engine without throwing uncaught exceptions.
- **Preservation of Public Listviews:**
  - Enhancements must NOT disrupt existing property card layouts, sorting controls, or route navigation.

---

## Pages Requiring the Map Module (Determination Matrix)

Inspection of the codebase confirms that **8 distinct pages/views** across public, broker, and agent portals require the map module:

| # | Page / Route | Target File | Persona | Map Capability Required | Current Implementation | Upgraded State |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | **Public Properties Catalog**<br>`/properties` | `frontend/src/pages/public/PropertiesPage.jsx` | Public, Client | Dynamic multi-marker vector map, HTML price pills, clustering, "Search as I move" bounds sync, and district polygons. | Leaflet 1.9 (`PropertyMap.jsx`) with raster OSM tiles. | `GooglePropertyMap.jsx` vector canvas with `AdvancedMarkerElement` and dual-provider fallback. |
| **P2** | **Public Property Detail View**<br>`/properties/:id` | `frontend/src/pages/public/PropertyListingView.jsx` | Public, Client | Single residence location anchor, Satellite Hybrid view, 360° Street View panorama launcher, and CBD Commute Matrix card. | Static OpenStreetMap `<iframe>` embed (lines 716-724). | Interactive Google Map anchor + `StreetViewModal` + `CommuteAnalysisCard`. |
| **P3** | **Homepage Neighborhood Intelligence**<br>`/` | `frontend/src/components/ui/sections/LocationNeighborhoodSection.jsx` | Public | Architectural corridor overview highlighting prime Metro Manila growth enclaves (BGC, Makati, Alabang). | Static satellite photo background with static text badge overlay. | Interactive Google vector map with styled district polygon boundaries (`FR-PL-014`). |
| **P4** | **Broker Create/Edit Listing Studio**<br>`/broker/properties/create`<br>`/broker/properties/edit/:id` | `frontend/src/pages/portals/broker/BrokerCreateListings.jsx` | Broker, Admin | Predictive address autocomplete, cadastral draggable pin placement, reverse geocoding, and GPS latitude/longitude verification. | Nominatim text geocoder and manual latitude/longitude input fields. | `GooglePlacesSearchInput` + `CadastralLocationPicker` (draggable vector marker auto-syncing coordinates). |
| **P5** | **Broker Property Detail View**<br>`/broker/properties/:id` | `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx` | Broker, Admin | Cadastral location verification, GPS inspection, boundary preview, and Street View site check. | Unstyled Google Maps `<iframe>` on line 1924 (`maps.google.com/maps?q=...&output=embed`). | Embedded `GooglePropertyMap` in single-property verification mode with Satellite & Street View toggles. |
| **P6** | **Agent Property Intake Studio**<br>`/agent/properties/create` | `frontend/src/pages/portals/agent/AgentPropertyCreate.jsx` | Agent | Predictive Places address search and cadastral location pinpointing. | Standard text fields without spatial visual validation. | `GooglePlacesSearchInput` with localized Philippine country filter. |
| **P7** | **Agent Property Detail View**<br>`/agent/properties/:id` | `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx` | Agent | Location verification, client meeting point navigation, and 360° Street View tour preparation. | Text-based GPS coordinates. | Single-property location preview card with Street View inspection. |
| **P8** | **Property Quick Edit Drawer** | `frontend/src/components/cms/PropertyQuickEditDrawer.jsx` | Broker, Agent | Fast inline address and coordinate adjustment without opening full studio. | Form inputs without map. | Integrated `GooglePlacesSearchInput` for 1-click address and coordinate synchronization. |

---

## Environment Readiness Assessment

- **Prerequisites Verified:**
  - Frontend Vitest Test Runner: Operational (`npm --prefix frontend test -- "PropertyMap.test.jsx"` passed 3/3).
  - Backend Vitest Test Runner: Operational (`npm --prefix backend test -- "maps"` passed 7/7).
  - Node.js & npm: Verified working in Windows environment.
  - Mock Mode Fallback: Active in `GoogleMapsService` when API key is unconfigured.
- **Existing Failures Requiring Repair:** Zero pre-existing test failures in mapping components.

---

## Explicit Approval Boundaries

| Boundary Item | Status / Requirement |
| :--- | :--- |
| **Database Migrations / Schema Changes** | **None.** No database schema, migration, or RLS modification is required. |
| **Permission / Auth Changes** | **None.** Public maps remain accessible to all roles; broker cadastral intake remains protected by existing guards. |
| **Breaking API Changes** | **None.** Existing `/api/maps/*` backend endpoints are preserved and consumed without contract breaking. |
| **Approval Gate** | Present this revised plan to the user before implementation. |

---

## Affected Files & Components

```text
CP_kerby/
├── shared/
│   └── types/
│       └── integrations.ts                   # Update: Google Maps contracts, bounds, and autocomplete types
├── frontend/
│   ├── package.json                          # Update: Add @googlemaps/js-api-loader & @googlemaps/markerclusterer
│   └── src/
│       ├── services/
│       │   ├── googleMapsLoader.js           # New: Resilient script loader with key check & mock fallback
│       │   └── mapsService.js                # Update: Integrate session tokens & Street View pre-check
│       ├── components/ui/map/
│       │   ├── GooglePropertyMap.jsx         # New: Primary Google Maps Vector Canvas with Bauhaus styling
│       │   ├── MapLayerControl.jsx           # Update: Add vector/satellite/terrain toggles for Google Maps
│       │   ├── StreetViewModal.jsx           # New: 360° panorama modal with coverage verification
│       │   ├── GooglePlacesSearchInput.jsx   # New: Autocomplete search input with Philippine country bias
│       │   ├── CadastralLocationPicker.jsx   # New: Draggable pin map for intake studios (Broker & Agent)
│       │   ├── CommuteAnalysisCard.jsx       # New: Travel times to luxury CBD hubs
│       │   └── index.js                      # Update: Re-export Google Maps components
│       ├── components/ui/sections/
│       │   └── LocationNeighborhoodSection.jsx # Update: Enhance homepage location section with vector styling
│       ├── pages/
│       │   ├── public/
│       │   │   ├── PropertiesPage.jsx        # Update: Upgrade catalog map to GooglePropertyMap with dual fallback
│       │   │   └── PropertyListingView.jsx   # Update: Replace OSM iframe with interactive map + Street View + Commute
│       │   └── portals/
│       │       ├── broker/
│       │       │   ├── BrokerCreateListings.jsx # Update: Integrate GooglePlacesSearchInput & CadastralLocationPicker
│       │       │   └── BrokerPropertyDetail.jsx # Update: Replace line 1924 unstyled iframe with GooglePropertyMap
│       │       └── agent/
│       │           ├── AgentPropertyCreate.jsx  # Update: Integrate GooglePlacesSearchInput
│       │           └── AgentPropertyDetail.jsx  # Update: Add interactive location map & Street View inspection
└── test files/
    └── frontend/
        └── ui/
            ├── GooglePropertyMap.test.jsx    # New: Unit tests for vector map lifecycle & marker states
            ├── StreetViewModal.test.jsx      # New: Tests for coverage check & panorama rendering
            ├── GooglePlacesInput.test.jsx    # New: Tests for debounce, session tokens & selection
            └── CadastralLocationPicker.test.jsx # New: Tests for pin dragging & coordinate updates
```

---

## Implementation Tasks

### Phase 1: Foundation, Shared Contracts & Client Loader

#### Task 1: Shared TypeScript Contracts & Geospatial Data Types
- [ ] **Step 1.1: Write failing contract compilation check**  
  Add test assertions in `test files/backend/services/googleMaps.service.test.ts` validating new `GeoCoordinates`, `ViewportBounds`, and `StreetViewMetadataResult` interfaces.
- [ ] **Step 1.2: Update `shared/types/integrations.ts`**  
  Export `GeoCoordinates`, `ViewportBounds`, `MapPropertyPin`, `StreetViewMetadataResult`, `CommuteDestinationEstimate`, and `PlaceAutocompletePrediction`.
- [ ] **Step 1.3: Run type check and unit tests**  
  Execute `npm --prefix backend test -- "googleMaps.service.test.ts"` to verify contracts compile cleanly.

#### Task 2: Frontend Dependency Setup & Google Maps Loader Utility
- [ ] **Step 2.1: Install client packages**  
  Run `npm --prefix frontend install @googlemaps/js-api-loader @googlemaps/markerclusterer`.
- [ ] **Step 2.2: Create unit test for loader utility**  
  Create `frontend/src/services/googleMapsLoader.test.js` validating script loading lifecycle, missing key handling, and singleton loader instance.
- [ ] **Step 2.3: Implement `frontend/src/services/googleMapsLoader.js`**  
  Implement `loadGoogleMapsApi()` utilizing `Loader` from `@googlemaps/js-api-loader` with `libraries: ['places', 'marker', 'geometry']` and graceful rejection if key is missing.
- [ ] **Step 2.4: Verify loader tests**  
  Execute `npm --prefix frontend test -- "googleMapsLoader.test.js"`.

---

### Phase 2: Core Map Components & Reusable Widgets

#### Task 3: Advanced HTML Price Pins & Marker Clustering (`AdvancedMarkerElement`)
- [ ] **Step 3.1: Create unit test for marker factory**  
  Create `test files/frontend/ui/GoogleMapPins.test.jsx` verifying DOM pill generation, currency formatting (`₱145M`), hover highlight classes, `aria-label` accessibility, and click event callbacks.
- [ ] **Step 3.2: Implement `frontend/src/components/ui/map/googleMapMarkers.js`**  
  Build factory function `createPriceBadgeMarker({ property, onClick, onHover, isSelected })` strictly adhering to `design.md` tokens:
  - Normal pill: `#FFFFFF` surface, `#0F766E` (Primary Teal) typography, `1px solid #E2E8F0` hairline border, `rounded-full` pill shape, shadow-sm.
  - Active/Hovered pill: `#0F766E` Teal background, `#FFFFFF` text, glowing `#FF6B6B` (Approved Coral) beacon dot, `scale-110`, `z-index: 9999`.
  - Cluster renderer configuring `@googlemaps/markerclusterer` with luxury Bauhaus cluster pill icons (`bg-white/95 border-[#E2E8F0] text-[#0F766E]`).
- [ ] **Step 3.3: Verify marker tests**  
  Execute `npm --prefix frontend test -- "GoogleMapPins.test.jsx"`.

#### Task 4: Flagship Interactive Vector Map Canvas (`GooglePropertyMap.jsx`)
- [ ] **Step 4.1: Write failing component test**  
  Create `test files/frontend/ui/GooglePropertyMap.test.jsx` asserting:
  - Vector canvas renders with `data-lenis-prevent="true"`.
  - Custom map styling applies `#F8FAFC` background without errors.
  - Debounced `bounds_changed` listener fires `onBoundsChange(bounds)` after 350ms.
  - Selected property marker scrolls into view and triggers popover.
  - Popover CTA conforms to Approved Coral Button (`bg-[#FF6B6B] text-[#1E293B]`).
- [ ] **Step 4.2: Implement `GooglePropertyMap.jsx`**  
  - Integrate `LUXURY_MAP_OPTIONS` (disable default UI, `#F8FAFC` canvas, muted roads and waterways).
  - Register `AdvancedMarkerElement` markers for each property with accessible `aria-label`.
  - Attach debounced `idle` / `bounds_changed` listener.
  - Connect with `MapLayerControl.jsx` (floating glass dock `bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-sm` with 44px mobile touch targets).
  - Residence popover card: `#FFFFFF` surface, `rounded-xl`, specs in `#64748B`, primary CTA utilizing Approved Coral Button (`bg-[#FF6B6B] text-[#1E293B] min-h-[44px]`).
  - Implement dual-provider fallback to `PropertyMap.jsx` if Google Maps fails to initialize.
- [ ] **Step 4.3: Verify component tests**  
  Execute `npm --prefix frontend test -- "GooglePropertyMap.test.jsx"`.

#### Task 5: Street View 360° Immersion Modal (`StreetViewModal.jsx`)
- [ ] **Step 5.1: Write failing Street View test**  
  Create `test files/frontend/ui/StreetViewModal.test.jsx` asserting:
  - Calls `StreetViewService.getPanorama` within 100m radius before opening.
  - If coverage exists, mounts `google.maps.StreetViewPanorama` inside Radix Dialog with 44x44px close button.
  - If coverage is missing, renders informative luxury fallback badge in `#64748B`.
- [ ] **Step 5.2: Implement `frontend/src/components/ui/map/StreetViewModal.jsx`**  
  Render responsive modal overlay using Radix `Dialog` primitives (`DialogContent` with `bg-black/80 backdrop-blur-sm`, `rounded-xl`), 44x44px touch target close button with visible focus indicator (`focus:ring-2 focus:ring-[#0F766E]`), and compass heading controls.
- [ ] **Step 5.3: Verify Street View tests**  
  Execute `npm --prefix frontend test -- "StreetViewModal.test.jsx"`.

#### Task 6: Predictive Places Autocomplete (`GooglePlacesSearchInput.jsx`)
- [ ] **Step 6.1: Write failing autocomplete test**  
  Create `test files/frontend/ui/GooglePlacesInput.test.jsx` asserting:
  - Uses `AutocompleteSessionToken` across keystrokes.
  - Scopes predictions to `country: 'ph'` with Metro Manila bias.
  - Selecting an address returns structured `lat`, `lng`, `formattedAddress`, and `city`.
  - Dropdown items satisfy minimum 44px touch target height.
- [ ] **Step 6.2: Implement `frontend/src/components/ui/map/GooglePlacesSearchInput.jsx`**  
  Integrate with shadcn/ui `Input` primitive (`border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-lg h-10`), dropdown popover `bg-white border-[#E2E8F0] shadow-lg`, and prediction items styled with `#1E293B` text and `min-h-[44px]`.
- [ ] **Step 6.3: Verify autocomplete tests**  
  Execute `npm --prefix frontend test -- "GooglePlacesInput.test.jsx"`.

#### Task 7: Cadastral Location Picker & Commute Analysis Card
- [ ] **Step 7.1: Write unit tests for CadastralLocationPicker & CommuteAnalysisCard**  
  Create tests asserting draggable pin updates coordinates, and commute card renders travel durations to preset luxury hubs (BGC, Makati, NAIA T3).
- [ ] **Step 7.2: Implement `CadastralLocationPicker.jsx`**  
  Interactive vector map with `#0F766E` GPS coordinates badge (`bg-teal-50 border border-teal-200 text-[#0F766E] font-mono px-2 py-0.5 rounded`), draggable pin, and 44px coordinate reset button.
- [ ] **Step 7.3: Implement `CommuteAnalysisCard.jsx`**  
  Displays verified driving distances and durations using backend `/api/maps/commute`, styled with `#FFFFFF` surface, `#E2E8F0` border, `#0F766E` transit icons, and `#1E293B` duration text.
- [ ] **Step 7.4: Re-export all in `frontend/src/components/ui/map/index.js`**  
  Export `GooglePropertyMap`, `StreetViewModal`, `GooglePlacesSearchInput`, `CadastralLocationPicker`, and `CommuteAnalysisCard`.

---

### Phase 3: Page-Level Map Upgrades

#### Task 8: Upgrade Public Properties Catalog (`PropertiesPage.jsx` - Page P1)
- [ ] **Step 8.1: Write page-level regression test**  
  Update `test files/frontend/pages/PropertiesPageMap.test.jsx` to test split-view rendering with `GooglePropertyMap`.
- [ ] **Step 8.2: Wire up `GooglePropertyMap` in `PropertiesPage.jsx`**  
  Replace direct `PropertyMap` usage with `GooglePropertyMap`, maintaining identical props (`properties`, `selectedId`, `onSelectProperty`, `onBoundsChange`).
- [ ] **Step 8.3: Verify page tests**  
  Execute `npm --prefix frontend test -- "PropertiesPageMap.test.jsx"`.

#### Task 9: Upgrade Public Property Details View (`PropertyListingView.jsx` - Page P2)
- [ ] **Step 9.1: Write test for PropertyListingView map section**  
  Update `PropertyListingView.test.jsx` verifying the location section renders the interactive vector map, 360° Street View button, and Commute Analysis card.
- [ ] **Step 9.2: Replace OSM iframe in `PropertyListingView.jsx`**  
  Replace lines 716-724 (`https://www.openstreetmap.org/export/embed.html...`) with `GooglePropertyMap` in single-property anchor mode + `StreetViewModal` + `CommuteAnalysisCard`.
- [ ] **Step 9.3: Verify details page tests**  
  Execute `npm --prefix frontend test -- "PropertyListingView.test.jsx"`.

#### Task 10: Upgrade Broker Listing Studio & Property Details (Pages P4 & P5)
- [ ] **Step 10.1: Upgrade `BrokerCreateListings.jsx`**  
  Integrate `GooglePlacesSearchInput` and `CadastralLocationPicker` in the Location section, allowing brokers to search address and drag the pin to set exact coordinates.
- [ ] **Step 10.2: Upgrade `BrokerPropertyDetail.jsx`**  
  Replace line 1924 unstyled Google Maps iframe (`maps.google.com/maps?q=...&output=embed`) with bespoke `GooglePropertyMap` in single-property verification mode.
- [ ] **Step 10.3: Verify broker tests**  
  Execute `npm --prefix frontend test -- "BrokerCreateListings.test.jsx"` and `npm --prefix frontend test -- "BrokerPropertyDetail.test.jsx"`.

#### Task 11: Upgrade Agent Portal Pages (Pages P6 & P7)
- [ ] **Step 11.1: Upgrade `AgentPropertyCreate.jsx`**  
  Integrate `GooglePlacesSearchInput` for seamless address lookup and coordinate setting.
- [ ] **Step 11.2: Upgrade `AgentPropertyDetail.jsx`**  
  Add `GooglePropertyMap` single-property location preview and Street View tour preparation for scheduled client viewings.
- [ ] **Step 11.3: Verify agent portal tests**  
  Execute `npm --prefix frontend test -- "AgentPropertyDetail"`.

---

### Phase 4: Full-Stack Verification & E2E Testing

#### Task 12: Automated Integration & Playwright E2E Verification
- [ ] **Step 12.1: Run complete frontend unit test suite**  
  Execute `npm --prefix frontend test`.
- [ ] **Step 12.2: Run backend integration test suite**  
  Execute `npm --prefix backend test`.
- [ ] **Step 12.3: Execute Playwright E2E suite**  
  Run Playwright tests verifying map interactions, marker clicks, bounds updates, and Street View modal across desktop and mobile viewports.
- [ ] **Step 12.4: Update documentation and change records**  
  Create dated change record in `docs/modules/02-property-listing/` and register completion in `INDEX.md`.

---

## Rollback & Risk Mitigation Strategy

1. **Feature Flag Fallback:** If `VITE_ENABLE_GOOGLE_MAPS !== 'true'`, components automatically revert to the Leaflet raster engine.
2. **Hard Daily Budget Cap:** Daily quotas in Google Cloud Console guarantee expenses never exceed the $200 free monthly credit limit.
3. **Graceful Network Degradation:** If client ad blockers prevent external scripts from loading, the component renders a fallback card with static coordinates within 2.5s.
