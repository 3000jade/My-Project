# Google Maps Interface & Functional Requirements Specification

> **Module:** 02 — Property Listing (`docs/modules/02-property-listing/`)  
> **Feature:** Google Maps Platform Interface, Cartographic Styling & Geospatial Services  
> **Document Type:** Feature Architecture & Requirements Specification  
> **Standards Alignment:** ISO/IEC/IEEE 29148:2018 (Requirements Engineering), ISO/IEC 42010:2022 (Architecture Description), ISO/IEC 25010:2023 (Product Quality)  
> **Status:** Specification Approved / Planned Implementation  
> **Date:** 2026-10-28  
> **Target Files & Affected Pages:**  
> - **Public Discovery:** `frontend/src/pages/public/PropertiesPage.jsx`, `frontend/src/pages/public/PropertyListingView.jsx`, `frontend/src/components/ui/sections/LocationNeighborhoodSection.jsx`  
> - **Broker Management:** `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`, `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx`  
> - **Agent Operations:** `frontend/src/pages/portals/agent/AgentPropertyCreate.jsx`, `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx`  
> - **Shared Components:** `frontend/src/components/ui/map/GooglePropertyMap.jsx`, `frontend/src/components/ui/map/MapLayerControl.jsx`, `frontend/src/components/ui/map/StreetViewModal.jsx`, `frontend/src/components/ui/map/GooglePlacesSearchInput.jsx`, `frontend/src/components/ui/map/CadastralLocationPicker.jsx`, `frontend/src/components/ui/map/CommuteAnalysisCard.jsx`  
> - **Services & Contracts:** `frontend/src/services/googleMapsLoader.js`, `frontend/src/services/mapsService.js`, `shared/types/integrations.ts`, `backend/src/services/googleMaps.service.ts`

---

## 1. Executive Summary & Purpose

The **CP_kerby Luxury Architectural Real Estate Platform** requires an ultra-premium, responsive, and performance-optimized geospatial discovery engine. While the initial prototype utilized open-source Leaflet and OpenStreetMap raster tiles, the luxury real estate segment demands fluid client-side vector rendering, high-fidelity satellite hybrid photogrammetry, integrated Street View 360° panoramas, micro-animated custom price badge pins, and intelligent location autocomplete.

This specification establishes the complete technical and visual architectural standard for the **Google Maps Interface** and formulates the official, prioritized **Functional Requirements (FR-PL-008 through FR-PL-014)** in strict compliance with ISO/IEC/IEEE 29148:2018 and the platform's Nordic Bauhaus Modern SaaS design system (`design.md`).

---

## 2. Existing vs. Proposed Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CURRENT STATE (Leaflet / OSM)                                │
│                                                                                                │
│  [ Leaflet L.map ] ──► [ OSM / ESRI Raster Tiles ] (Visible tile seams, rigid styling)          │
│         │                                                                                      │
│         └──► [ L.divIcon HTML Pins ] (Basic DOM markers, lacking vector scaling)               │
│         └──► [ Nominatim Geocoding ] (Slower response, non-standardized Philippine addresses)  │
│         └──► [ No Street View / No Native 3D Tilt ]                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼ TRANSFORMATION
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                PROPOSED STATE (Google Maps Platform)                           │
│                                                                                                │
│  [ @googlemaps/js-api-loader ] ──► Dynamic script hydration with referrer restriction          │
│         │                                                                                      │
│         ├──► [ WebGL Vector Map Canvas ]                                                       │
│         │     ├── Custom Luxury Cartographic Style (Muted Sage & Spruce Teal accents)          │
│         │     ├── Smooth Fractional Zoom & 45° Oblique Tilt Vector Capabilities                │
│         │     └── Lenis Momentum Isolation (data-lenis-prevent="true")                         │
│         │                                                                                      │
│         ├──► [ google.maps.marker.AdvancedMarkerElement ]                                      │
│         │     ├── Interactive HTML Price Pills (₱285M, $5.2M) with active state transitions    │
│         │     ├── High-performance Marker Clustering (@googlemaps/markerclusterer)            │
│         │     └── Rich Architectural Preview Cards (Custom OverlayView / InfoWindow)           │
│         │                                                                                      │
│         ├──► [ Street View 360° Panorama Engine ]                                              │
│         │     ├── Embedded Side-by-Side & Fullscreen Modal Street View viewer                 │
│         │     └── Metadata Coverage Verification (prevents black-screen dead ends)             │
│         │                                                                                      │
│         ├──► [ Google Places Autocomplete & Viewport Bias ]                                    │
│         │     └── Bound to Philippines (PH) luxury corridors (BGC, Makati, Alabang, Cebu)      │
│         │                                                                                      │
│         └──► [ Backend Distance Matrix & Geocoding Gateway ]                                   │
│               └── Server-side proxy for API key protection and quota rate-limiting             │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Google Maps Interface & UX Design Specification

### 3.1 Cartographic Vector Styling (Strict `design.md` Alignment)

The Google Map canvas must adhere strictly to the platform's authoritative design tokens in `design.md` (Section 3.1), eschewing generic commercial map clutter in favor of an understated architectural aesthetic:

- **App Canvas & Map Background:** `#F8FAFC` (`colors.background`).
- **Water Bodies & Oceans:** `#E0F2FE` (Glacial soft blue-teal matching brand secondary accents).
- **Greenery / Parks / Golf Clubs:** `#ECFDF5` (Muted emerald tint).
- **Primary Highways & Thoroughfares:** `#FFFFFF` surface stroke with `#E2E8F0` hairline casing (`colors.border`).
- **Local Residential Roads:** `#FFFFFF` hairline stroke.
- **Points of Interest (POI):** Business POIs hidden by default; architectural landmarks, parks, and civic institutions preserved with muted `#64748B` (`colors.text-secondary`) icons.
- **Labels & Typography:**
  - Font Family: `Inter`, system font fallbacks.
  - Text Fill: `#1E293B` (`colors.text-primary`, Slate 800).
  - Text Stroke / Halo: `#FFFFFF` (2px buffer).

#### Map Options Definition:
```typescript
export const LUXURY_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true, // Clean slate; custom Bauhaus HUD controls applied
  zoomControl: false,     // Replaced by custom floating glass zoom pill
  mapTypeControl: false,  // Controlled by MapLayerControl HUD
  streetViewControl: false,// Controlled by dedicated Street View launcher
  fullscreenControl: false,// Integrated into custom HUD dock
  gestureHandling: 'greedy', // Seamless trackpad/drag with Lenis isolated
  mapId: 'CP_KERBY_LUXURY_VECTOR_MAP', // Cloud-styled or JSON vector styling
  maxZoom: 20,
  minZoom: 10,
  tilt: 0,
  clickableIcons: false,   // Eliminates accidental POI modal clicks
};
```

---

### 3.2 Floating Bauhaus Glass HUD Dock (`MapLayerControl.jsx`)

The interface features an ergonomic, floating glass dock anchored at top-center or top-right of the map canvas, built with Tailwind CSS v4 design tokens and `design.md` standards:

1. **Dock Plinth & Elevation:**
   - Background: `bg-white/95 backdrop-blur-md` (`colors.surface`).
   - Border: `border border-[#E2E8F0]` (`colors.border`).
   - Shape: `rounded-full` pill with drop shadow `shadow-sm`.
   - Touch Target: Minimum height `44px` on mobile for all button triggers.
2. **Basemap Switcher Tabs:**
   - **Vector Architectural:** Active tab styled with `#0F766E` (`colors.primary`) background and `#FFFFFF` text. Inactive tabs styled with transparent background, `#64748B` (`colors.text-secondary`), and hover `#1E293B`.
   - **Satellite Hybrid:** High-resolution photogrammetric imagery with muted road/boundary vector overlays (`google.maps.MapTypeId.HYBRID`).
   - **Terrain / Relief:** Topographical elevation contours highlighting elevation in rolling luxury enclaves.
3. **Dynamic Cadastral / District Overlay Toggle:**
   - Pill toggle button (`⬡ Prime Districts`) rendering GeoJSON boundaries for core metropolitan corridors:
     - Bonifacio Global City (BGC)
     - Makati Central Business District & Forbes Park / Dasmariñas Village
     - Ayala Alabang Village
     - Cebu Business Park & Maria Luisa Estate
   - Polygon styling: Spruce Teal hairline (`strokeColor: "#0F766E"`, `strokeWeight: 1.5`, `strokeOpacity: 0.8`), fill opacity `0.08` resting, `0.22` on hover.
4. **"Search As I Move" Viewport Filter Checkbox:**
   - Floating pill with checkmark: `[✓] Search as map moves`.
   - Debounced listener (350ms) capturing `map.getBounds()` to re-query property listings within current camera boundaries.
5. **Camera Reset / "Fit All" Controller:**
   - One-click trigger that invokes `map.fitBounds(bounds)` encompassing all active property markers with a 48px padding buffer.

---

### 3.3 Advanced HTML Price Pin Markers (`AdvancedMarkerElement`)

Rather than legacy raster pins, properties are visualized via interactive HTML DOM price badges utilizing the Google Maps JavaScript API `AdvancedMarkerElement`:

```text
  Normal State:                 Hovered / Active State:
 ┌────────────────┐            ┌──────────────────────┐
 │   ₱145,000,000 │            │ ●  ₱145,000,000      │  ▲
 └───────┬────────┘            └──────────┬───────────┘  │ Elevates zIndex to 9999
         ▼                                ▼              │ Scales up 1.12x
                                                         │ Background -> Spruce Teal (#0F766E)
                                                         │ Beacon dot -> Approved Coral (#FF6B6B)
```

- **Marker Ergonomics:**
  - **Normal State:** Background `#FFFFFF` (`colors.surface`), border `1px solid #E2E8F0` (`colors.border`), shadow `0 2px 8px rgba(0,0,0,0.08)`, text `#0F766E` (`colors.primary`), font-weight `600`, border-radius `9999px` (pill).
  - **Selected / Hover State:** Background `#0F766E`, text `#FFFFFF`, shadow `0 6px 20px rgba(15,118,110,0.25)`, glowing Coral (`#FF6B6B`, `colors.accent`) active beacon dot, `transform: scale(1.12)`.
  - **Bidirectional Hover Synchrony:** Hovering a property card in the listing grid immediately illuminates its corresponding map marker, and hovering a marker highlights its card.

---

### 3.4 Interactive Architectural Residence Popover (`InfoWindow` / Custom Overlay)

Clicking any price pin displays a custom glass card overlay directly anchored to the marker coordinates:

- **Surface & Shell:** `#FFFFFF` (`colors.surface`), border `1px solid #E2E8F0` (`colors.border`), `rounded-xl`, shadow `shadow-xl`.
- **Thumbnail Aspect Ratio:** 16:10 high-resolution architectural photograph with `rounded-t-xl`.
- **Price Badge Overlay:** Pinned over the image with blur backdrop (`bg-slate-900/60 backdrop-blur-md text-white font-mono`).
- **Property Header:** Title (e.g., *"The Aurelia Penthouse"*), Subdivision / City (e.g., *"Bonifacio Global City, Taguig"*), text `#1E293B`.
- **Architectural Specs Strip:** `4 Beds` • `5 Baths` • `680 m²` in `#64748B`.
- **Action CTAs (Strict `design.md` Conformance):**
  - **Primary CTA: "View Residence →"**  
    Applies the **Approved Coral Button** specification (`design.md` Section 3.1):  
    - Background: `#FF6B6B` (`colors.accent`)  
    - Text and icon color: `#1E293B` (`colors.text-primary`, 5.27:1 contrast)  
    - Height: `h-10 px-4` (desktop), `min-h-[44px]` (mobile)  
    - Radius: `rounded-lg` (`8px`)  
    - Hover: `hover:bg-[#FF5252] transition-colors`  
  - **Secondary CTA: "360° Street View"**  
    - Background: `#FFFFFF` (`colors.surface`), border `1px solid #E2E8F0`, text `#1E293B`, hover `bg-slate-50`.

---

### 3.5 Street View 360° Split-Screen & Modal Viewport

To deliver an immersive luxury experience without leaving the platform:

1. **Embedded Street View Mode:**
   - Supports a split-screen canvas (`50% Vector Map | 50% Street View Panorama`) or an overlay modal.
   - Synchronizes camera orientation: as the user pans Street View, a directional compass fov cone rotates on the vector map.
2. **Zero Dead-End Fallback Engine:**
   - Before launching Street View, the client or backend executes `google.maps.StreetViewService.getPanorama({ location, radius: 100 })`.
   - If `status !== google.maps.StreetViewStatus.OK`, the Street View action button gracefully disables with an explanatory tooltip (*"Street View panorama not available for this private estate entrance"*), preventing jarring blank screens.

---

## 4. Recommended Functional Requirements (FR) Specification Table

The following functional requirements are formally registered for Module 02 (Property Listing) under ISO/IEC/IEEE 29148:2018:

| Req ID | Capability / Feature | Detailed Description & Business Logic | Actors | Priority | Status | Acceptance & Verification Criteria |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **`FR-PL-008`** | Google Maps Vector Canvas & Luxury Theme | Render a high-performance vector map canvas via `@googlemaps/js-api-loader` configured with Nordic Bauhaus daylight tokens (`#FBFBF9` ground, `#0F766E` Spruce Teal), disabling default commercial UI clutter while isolating trackpad zoom from page scroll via `data-lenis-prevent="true"`. | Public, Client, Broker | **P1** | **Planned** | Vector map loads cleanly; zero tile artifacts; trackpad wheel zooms map without triggering page scroll. |
| **`FR-PL-009`** | Advanced HTML Price Pins & Dynamic Clustering | Implement `google.maps.marker.AdvancedMarkerElement` to render custom pill-shaped price markers with dual-state styling (White/Teal resting, Spruce Teal/Terracotta Coral selected) and dynamic density clustering using `@googlemaps/markerclusterer`. | Public, Client | **P1** | **Planned** | Custom DOM markers display currency formatted prices; clicking marker highlights item; clusters expand on zoom. |
| **`FR-PL-010`** | "Search As I Move" Viewport Bounding Box Synchronization | Implement debounced listener (350ms) capturing `map.getBounds()` coordinates (`north`, `south`, `east`, `west`). When active, updates search parameters and refetches catalog properties strictly bounded by the current viewport. | Public, Client | **P1** | **Planned** | Dragging map triggers debounced API query with `bounds` payload; property grid synchronizes with visible markers. |
| **`FR-PL-011`** | Google Street View 360° Immersion & Coverage Pre-Check | Provide embedded and modal Street View viewer using `google.maps.StreetViewPanorama`. Verify panorama coverage via `StreetViewService` within a 100m radius before rendering; display graceful fallback if private cadastral road lacks coverage. | Public, Client, Agent | **P2** | **Planned** | Verified coordinate launches interactive 360° tour; coordinate without coverage disables button with informative tooltip. |
| **`FR-PL-012`** | Predictive Places Autocomplete with Localized Viewport Bias | Integrate Google Places Autocomplete in search headers and listing intake modals, biased to Philippine territory (`country: 'ph'`) with priority bounds centered around Metro Manila, Metro Cebu, and luxury enclave coordinates. | All Users | **P1** | **Planned** | Typing 3+ characters displays structured suggestions; selecting an option parses exact `lat`, `lng`, and PSGC city name. |
| **`FR-PL-013`** | Commute & Proximity Analysis to Prime Commercial Hubs | Calculate driving distances and transit durations from the selected property to preset luxury lifestyle destinations (BGC High Street, Makati Ayala Ave, NAIA T3, International School Manila) via backend Google Distance Matrix proxy. | Public, Client, Broker | **P2** | **Planned** | Property detail page displays interactive commute card with verified driving durations and distance in kilometers. |
| **`FR-PL-014`** | Metropolitan Cadastral & District Polygon Overlays | Render GeoJSON boundary polygons representing prime real estate districts (BGC, Makati CBD, Ayala Alabang) with interactive hover states and active property inventory counter tooltips. | Public, Broker | **P2** | **Planned** | Toggling district overlay displays vector boundaries; hovering boundary illuminates corridor and reveals property count. |

---

## 5. Non-Functional Requirements (ISO/IEC 25010:2023)

| Req ID | Quality Characteristic | Requirement Metric / Constraint | Target Benchmark | Verification Method |
| :---: | :--- | :--- | :--- | :--- |
| **`NFR-MAP-001`** | **Performance Efficiency** | Initial map canvas render time. | First Vector Tile Render `< 500ms` on broadband connections. | Playwright trace & Chrome DevTools Performance Profiler. |
| **`NFR-MAP-002`** | **Performance Efficiency** | Pin rendering frame rate under load. | 60 FPS scrolling and panning with 250+ visible markers. | Marker clusterer stress benchmark with synthetic data. |
| **`NFR-MAP-003`** | **Security (Key Isolation)** | Protection of Google Maps Platform API credentials. | Client API Key strictly restricted to authorized domain referrers; server-side APIs (Distance Matrix, Geocoding) proxied via Express backend gateway with IP restrictions. | Security audit inspection; zero server-only keys present in client bundle. |
| **`NFR-MAP-004`** | **Reliability & Fault Tolerance** | Resilience when Google Maps API fails or offline. | If Google Maps script fails to load or quota is exhausted, UI renders an elegant fallback card with retry prompt; zero uncaught JavaScript exceptions. | Simulated script load failure in Vitest/Playwright tests. |
| **`NFR-MAP-005`** | **Usability & Accessibility** | Keyboard navigability and ARIA screen reader compliance. | Map markers and HUD buttons navigable via `Tab` / `Enter` / `Space`; markers provide descriptive `aria-label` (e.g., *"Residence for sale: ₱145M, 4 Beds in BGC"*). | Automated axe-core accessibility audit & keyboard traversal tests. |
| **`NFR-MAP-006`** | **Cost & Quota Governance** | Server-side caching for external API queries. | Places Autocomplete, Geocoding, and Commute responses cached in backend memory/Redis for 5 minutes (`CACHE_TTL_MS = 300,000`). | Backend unit tests validating cache hits on identical queries. |

---

## 6. Shared TypeScript Contracts & Data Interfaces

To ensure end-to-end type safety between the frontend UI and backend gateway, the following contracts are defined in `shared/types/integrations.ts`:

```typescript
// Shared Types for Google Maps Platform Integration

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapPropertyPin {
  id: string;
  title: string;
  priceFormatted: string;
  priceNumeric: number;
  currency: string;
  coordinates: GeoCoordinates;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number;
  thumbnailUrl: string;
  city: string;
  subdivision?: string;
  isFeatured?: boolean;
}

export interface StreetViewMetadataResult {
  hasCoverage: boolean;
  panoId?: string;
  location?: GeoCoordinates;
  copyright?: string;
}

export interface CommuteDestinationEstimate {
  destinationId: string;
  destinationName: string;
  destinationCoordinates: GeoCoordinates;
  distanceKm: number;
  durationMinutes: number;
  durationText: string;
  trafficCondition?: 'low' | 'moderate' | 'heavy';
}

export interface PlaceAutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coordinates?: GeoCoordinates;
}
```

---

## 7. User Journeys & Page Map Requirements Matrix

### 7.1 Exhaustive Page Integration Matrix

| # | Page / View Route | Target File | Persona / Role | Map Module Capability Required | Current Implementation | Upgraded State |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | **Public Properties Catalog**<br>`/properties` | `frontend/src/pages/public/PropertiesPage.jsx` | Public, Client | Dynamic multi-marker vector map, HTML price pills, clustering, "Search as I move" bounds sync, and district polygons. | Leaflet 1.9 (`PropertyMap.jsx`) with raster OSM tiles. | `GooglePropertyMap.jsx` vector canvas with `AdvancedMarkerElement` and dual-provider fallback. |
| **P2** | **Public Property Detail View**<br>`/properties/:id` | `frontend/src/pages/public/PropertyListingView.jsx` | Public, Client | Single residence location anchor, Satellite Hybrid view, 360° Street View panorama launcher, and CBD Commute Matrix card. | Static OpenStreetMap `<iframe>` embed without street view or commute metrics. | High-resolution interactive Google Map canvas + `StreetViewModal` + `CommuteAnalysisCard`. |
| **P3** | **Homepage Neighborhood Intelligence**<br>`/` | `frontend/src/components/ui/sections/LocationNeighborhoodSection.jsx` | Public | Architectural corridor overview highlighting prime Metro Manila growth enclaves (BGC, Makati, Alabang). | Static satellite photo background with static text badge overlay. | Interactive or lightweight Google vector map with styled district polygon boundaries (`FR-PL-014`). |
| **P4** | **Broker Create/Edit Listing Studio**<br>`/broker/properties/create`<br>`/broker/properties/edit/:id` | `frontend/src/pages/portals/broker/BrokerCreateListings.jsx` | Broker, Admin | Predictive address autocomplete, cadastral draggable pin placement, reverse geocoding, and GPS latitude/longitude verification. | Nominatim text geocoder and manual latitude/longitude input fields. | `GooglePlacesSearchInput` + `CadastralLocationPicker` (draggable vector marker auto-syncing coordinates). |
| **P5** | **Broker Property Detail View**<br>`/broker/properties/:id` | `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx` | Broker, Admin | Cadastral location verification, GPS inspection, boundary preview, and Street View site check. | Unstyled Google Maps `<iframe>` on line 1924 (`maps.google.com/maps?q=...&output=embed`). | Embedded `GooglePropertyMap` in single-property verification mode with Satellite & Street View toggles. |
| **P6** | **Agent Property Intake Studio**<br>`/agent/properties/create` | `frontend/src/pages/portals/agent/AgentPropertyCreate.jsx` | Agent | Predictive Places address search and cadastral location pinpointing. | Standard text fields without spatial visual validation. | `GooglePlacesSearchInput` with localized Philippine country filter. |
| **P7** | **Agent Property Detail View**<br>`/agent/properties/:id` | `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx` | Agent | Location verification, client meeting point navigation, and 360° Street View tour preparation. | Text-based GPS coordinates. | Single-property location preview card with Street View inspection. |
| **P8** | **Property Quick Edit Drawer** | `frontend/src/components/cms/PropertyQuickEditDrawer.jsx` | Broker, Agent | Fast inline address and coordinate adjustment without opening full studio. | Form inputs without map. | Integrated `GooglePlacesSearchInput` for 1-click address and coordinate synchronization. |

### 7.2 Core User Journeys
1. **Initiation:** Buyer navigates to `/properties` and toggles to the split-screen Map View.
2. **Spatial Exploration:** Buyer pans the map to Bonifacio Global City. The map smoothly moves without interfering with page scroll (`data-lenis-prevent="true"`).
3. **Dynamic Filtering:** "Search as I move" fires debounced bounding box coordinates; the property grid updates to show only residences inside BGC.
4. **Pin Interaction:** Hovering over a `₱280M` pin highlights the marker in Spruce Teal (`#0F766E`), reveals an active Terracotta Coral beacon dot, and surfaces the thumbnail preview card.
5. **Street View Inspection:** Buyer clicks "360° Street View" on the preview card. The interface opens a panoramic viewer showing the private street entrance and perimeter architecture.

### Journey 2: Listing Broker Inputting Cadastral Location
1. **Initiation:** Broker opens the Property Intake Studio (`/broker/properties/create`).
2. **Address Autocomplete:** In the Location step, broker types into `GooglePlacesSearchInput`. Suggestions appear instantly, biased to the Philippines.
3. **Pinpoint Placement:** Selecting *"Ayala Alabang Village, Muntinlupa"* centers an interactive vector map and drops an adjustable pin. The broker can drag the pin to the exact estate cadastral plot, automatically populating verified latitude and longitude.

---

## 8. Rollout, Rollback & Compatibility Strategy

1. **Zero Downtime Dual-Provider Fallback:**
   - The interface incorporates a feature flag: `VITE_ENABLE_GOOGLE_MAPS=true`.
   - If the Google Maps API key is unset, invalid, or blocked by content filters, the map component gracefully falls back to the existing Leaflet engine without disrupting user sessions.
2. **Public Listview Protection:**
   - In accordance with the system design rules, upgrading the map interface strictly preserves the layout stability of the public property listviews and header filters.
3. **Quota & Rate-Limit Safeguards:**
   - Geocoding and Commute queries remain proxied through the Express backend gateway (`backend/src/services/googleMaps.service.ts`) with in-memory caching to avoid client-side API key exposure and eliminate runaway billing.

---

## 9. Traceability & Standards Alignment

| Standard Clause | Alignment Description | Document Section |
| :--- | :--- | :--- |
| **ISO/IEC/IEEE 29148:2018 (Clause 6.4)** | Precise specification of functional capabilities with unique sequential identifiers (`FR-PL-008` – `FR-PL-014`). | Section 4 |
| **ISO/IEC 42010:2022 (Clause 5.4)** | Clear architectural viewpoint, subsystem relationships, and transformation diagrams. | Section 2 & Section 3 |
| **ISO/IEC 25010:2023** | System quality attribute specifications covering Performance, Security, Usability, and Fault Tolerance. | Section 5 |
| **Master Requirements (`docs/REQUIREMENTS_SPECIFICATION.md`)** | Registered under Module 02 (Property Listing) in the living Master Requirements Specification. | Section 4 & SRS Registry |
