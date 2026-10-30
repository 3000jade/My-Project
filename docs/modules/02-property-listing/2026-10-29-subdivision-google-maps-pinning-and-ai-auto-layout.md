---
module: 02-property-listing
date: 2026-10-29
status: Complete — verified locally
affected_files:
  - backend/src/services/subdivisionAi.service.ts
  - backend/src/controllers/subdivision.controller.ts
  - backend/src/routes/subdivision.routes.ts
  - frontend/src/services/subdivisionService.js
  - frontend/src/components/subdivision/SubdivisionVectorCanvas.jsx
  - frontend/src/components/subdivision/SubdivisionVectorCanvas.test.jsx
  - frontend/src/pages/portals/broker/BrokerSubdivisions.jsx
  - frontend/src/pages/portals/broker/BrokerSubdivisions.test.jsx
  - frontend/src/pages/portals/broker/SubdivisionMapEditor.jsx
  - frontend/src/pages/public/PublicSubdivisionMap.jsx
  - frontend/src/pages/public/PublicSubdivisionMap.test.jsx
  - docs/REQUIREMENTS_SPECIFICATION.md
  - docs/modules/02-property-listing/INDEX.md
---

# Subdivision Google Maps Pre-Creation Pinning, AI Photo Auto-Layout, Satellite Ground Layer & Flexible Vector Editing

## 1. Executive Summary

This deliverable fulfills all 5 core capabilities requested by the user for the Subdivision Map Studio & Editor:
1. **Interactive Google Maps Pinning Before Creation:** Allows brokers to search, pinpoint, and lock exact geographic coordinates using Google Maps (Roadmap, Satellite, Hybrid) with quick-select cadastral presets (BGC, Makati, Alabang, Havila, Nuvali, Clark, Cebu) directly within the creation modal.
2. **AI Layout of Subdivision Photo & Shape/Size Analysis:** Uploading a subdivision blueprint or layout photo triggers Groq Vision (`qwen/qwen3.8-27b`) to analyze the properties' shapes and sizes, supported by an adaptive aspect-ratio geometry engine fallback. An in-editor "Upload Photo" button allows uploading new photos at any time with immediate layout generation.
3. **Pure Plain White Canvas Background by Default:** Opening a subdivision initializes the canvas with a clean, solid, plain white drafting background (`bg-white`). The blurred landscape image placeholder has been completely removed so that when no image is uploaded, the background is 100% plain white. A layer toggle allows brokers and visitors to seamlessly switch between White Canvas and Satellite Ground.
4. **Executive Subdivision HUD Badge:** Both the Studio Editor canvas and the Public Visitor Map prominently display the subdivision community name and GPS coordinates in the upper-right corner with a direct link to Google Maps.
5. **High-Precision Flexible Vector Editing:** Equipped with whole-lot translation drag, 14px magnetic snapping to adjacent parcel vertices with active turquoise cyan snap ring (`#00F0FF`), keyboard micro-nudging (1px arrow, 10px Shift+arrow), and edge midpoint `+` vertex insertion.

---

## 2. Architecture & Implementation

### 2.1 Backend Services & Controller
- **`backend/src/services/subdivisionAi.service.ts`**:
  - `autoLayoutSubdivisionPlan(projectId, options)`: Analyzes blueprint image dimensions and projects parcel layout.
  - Generates structured parcel candidate arrays (`block_number`, `lot_number`, `coordinates`, `area_sqm`, `classification`, `is_verified: false`).
  - Fallback engine: Multi-block grid layout spanning two parallel blocks and a central open space/park amenity lot.
- **`backend/src/controllers/subdivision.controller.ts`**:
  - `autoLayoutPlan`: Endpoint handler resolving project GPS coordinates, invoking AI layout service, and returning structured candidate lots.
- **`backend/src/routes/subdivision.routes.ts`**:
  - Mounted `POST /:id/ai/auto-layout`.

### 2.2 Frontend Client Service & Modal Pinning
- **`frontend/src/services/subdivisionService.js`**:
  - Added `autoLayoutPlan(projectId, options)`.
- **`frontend/src/pages/portals/broker/BrokerSubdivisions.jsx`**:
  - Modernized project creation modal to a responsive 2-column layout.
  - Left column: Project metadata, address, developer, and `[x] Automatically lay out lots with AI upon launch` toggle.
  - Right column: Integrated `CadastralLocationPicker` with live coordinate spinbuttons, satellite/roadmap view toggles, and Philippine cadastral presets.

### 2.3 Pure SVG Vector Canvas & Flexible Editing
- **`frontend/src/components/subdivision/SubdivisionVectorCanvas.jsx`**:
  - **Upper-Right Executive HUD Badge:** Displays `Subdivision Community`, community name heading, GPS coordinates, and external Google Maps deep link (`z-20`).
  - **Satellite Ground Layer:** Zero-flicker Google Maps satellite iframe container keyed to effective GPS coordinates positioned beneath the vector drawing layer.
  - **Whole-Lot Drag Translation:** Click and drag anywhere inside a selected polygon to translate all vertices in real-time.
  - **Magnetic Vertex Snapping Engine (`findMagneticSnapPoint`):** Snaps moving vertices to nearby existing vertices within a 14px threshold, rendering an animated turquoise cyan ring indicator (`#00F0FF`).
  - **Keyboard Arrow Micro-Nudge:** Arrow keys move selected lot by 1px (or 10px with `Shift`).
  - **AI Verification Badge:** Displays visual unverified `!` badge on candidate lot labels until confirmed by human broker.

### 2.4 Studio Editor & Public Visitor Experience
- **`frontend/src/pages/portals/broker/SubdivisionMapEditor.jsx`**:
  - Embedded `AI Auto-Layout` trigger in executive toolbar.
  - Query parameter support `?autoLayout=true` for automatic scanning immediately after creation.
  - Floating batch review notification bar with `Accept All Lots` and `Discard` buttons.
- **`frontend/src/pages/public/PublicSubdivisionMap.jsx`**:
  - Synchronized upper-right subdivision name HUD badge with GPS telemetry.
  - Satellite ground layer rendering behind published vector polygons.

---

## 3. Verification Evidence

### 3.1 Automated Vitest Test Suites
- `frontend/src/components/subdivision/SubdivisionVectorCanvas.test.jsx`: **7/7 Passed**
- `frontend/src/pages/portals/broker/BrokerSubdivisions.test.jsx`: **5/5 Passed**
- `frontend/src/pages/public/PublicSubdivisionMap.test.jsx`: **5/5 Passed**
- `backend/test files/backend/controllers/subdivision.controller.test.ts`: **9/9 Passed**
- `backend/test files/backend/services/subdivision.service.test.ts`: **13/13 Passed**
- **Total Suite Result:** **39/39 Tests Passed (0 Regressions)**

### 3.2 Frontend Production Build
```
npm run --prefix frontend build
✓ built in 5.27s (Exit Code 0)
```

### 3.3 Live Playwright MCP Verification
- **Test Project Created:** "Nuvali Ridge Executive Estates" (`14.2464, 121.0592`, Santa Rosa).
- **Location Pinning Verified:** Nuvali Ridge preset selected, coordinates and address populated correctly.
- **AI Auto-Layout & Upload Photo Verified:** Uploaded blueprint photo to `#subdivision-editor-photo-upload`. Auto-layout triggered seamlessly, generated 9 candidate lots on the uploaded photo background, and accepted into verified editable lots via `Accept All Lots`.
- **Payload Limit & Clean Drafting Verified:** Configured `express.json({ limit: '50mb' })` to safely support high-resolution uploads and vector packages. Canvas opens pure plain white by default (`bg-white`) with zero placeholder artifacts when no blueprint is uploaded.
- **Vector Editing Verified:** B1 L1 selected, handles displayed, arrow key nudging executed smoothly.
- **Ground Satellite Rendering Verified:** Pinned Google Maps satellite terrain rendered beneath vectors in both Editor and Public Visitor viewer.
- **Upper-Right Community HUD Verified:** Subdivision name and GPS link visible in upper-right corner of both Editor and Public Map.
- **Map Publishing Verified:** Version 1 published and verified at `/subdivisions/:id/map`.

---

## 4. Requirement Traceability

| Requirement ID | Description | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- |
| `FR-SM-048` | Subdivision Google Maps Pre-Creation Pinning | Interactive map picker in creation modal with cadastral presets and GPS geocoding | Verified / Implemented |
| `FR-SM-049` | AI Layout of Photo & Pinned Satellite Ground Layer | Groq Vision + geometric fallback layout with satellite ground iframe | Verified / Implemented |
| `FR-SM-050` | Flexible Vector Editing & Executive HUD | Whole-lot drag, 14px magnetic snap ring, keyboard nudges, upper-right community HUD | Verified / Implemented |
