---
module: 02-property-listing
date: 2026-10-30
status: verified
affected_files:
  - frontend/src/pages/public/PropertiesPage.jsx
  - frontend/src/components/ui/map/GooglePropertyMap.jsx
  - frontend/src/utils/propertyCoordinates.js
  - frontend/src/components/ui/map/GooglePropertyMap.test.jsx
---

# Verification Record — Public Properties Google Maps Interface & Card Scroll Fix

## 1. Overview & Objective
In accordance with user requirements and the approved implementation plan (`2026-10-30-properties-google-map-and-scroll-fix.md`), this task delivered two core enhancements to the public property search and explorer interface:
1. **Authentic Google Maps Interface:** Replaced OpenStreetMap/Leaflet fallback on the public properties explorer map (`frontend/src/components/ui/map/GooglePropertyMap.jsx`) with Google Maps Embed (`output=embed`), featuring layer switching (Roadmap, Satellite, Hybrid, Terrain), dynamic coordinate pinpointing, zoom controls, and interactive residence preview cards without requiring a paid API key.
2. **Fluid Property Card Scrolling:** Fixed property card list scroll locking in `frontend/src/pages/public/PropertiesPage.jsx` by isolating the virtualized card container from Lenis smooth scroll hijacking via `data-lenis-prevent="true"`, `overscroll-contain`, and flexbox container constraints (`min-h-0`).

## 2. Changes Delivered

### A. Fluid Card Scroll in `PropertiesPage.jsx`
- Added `data-lenis-prevent="true"` and `data-testid="properties-scroll-container"` to `parentRef`.
- Added `overscroll-contain` to the scrollable container.
- Added `min-h-0` to all intermediate flex parent containers (`flex-1 w-full flex flex-col overflow-hidden pb-4 min-h-0`) to eliminate flexbox auto minimum height calculation bugs that prevent child overflow scrolling.
- Adjusted virtualizer overscan to 4 and estimated item height to 520px for smoother scrolling.

### B. Authentic Google Maps Interface in `GooglePropertyMap.jsx`
- Connected Google Maps Embed iframe with dynamic `activeCoords` derived from the selected or hovered property.
- Implemented cartographic HUD controls:
  - Layer Switching: **Roadmap** (`t=m`), **Satellite** (`t=k`), **Hybrid** (`t=h`), and **Terrain** (`t=p`).
  - Zoom Controls: Step zoom in (`+`), zoom out (`−`), and `Fit All`.
  - Search as I move toggle button for live sync.
- Preserved floating residence card preview with thumbnail, formatted price badge, bedrooms/bathrooms count, address, and quick navigation.

### C. Coordinate Normalization in `propertyCoordinates.js`
- Added checks for `property.latitude` and `property.longitude` before falling back to district jitter, ensuring accurate lat/lng resolution for mock and backend properties alike.

## 3. Verification Evidence

### Vitest Unit & Integration Tests
Command executed:
```bash
npm run test --prefix frontend -- GooglePropertyMap.test.jsx BrokerFullViewMap.test.jsx CadastralPickerAndCommute.test.jsx --run
```
Result:
- **4 test files passed (4/4)**
- **12 tests passed (12/12)**

### Production Vite Build
Command executed:
```bash
npm run build --prefix frontend
```
Result:
- Build completed successfully in 7.46s with zero compile errors.

### Playwright MCP Interactive Verification
Automated browser verification executed on `http://localhost:5173/properties`:
- **Google Maps Embed count:** 1
- **Initial embed src:** `https://maps.google.com/maps?q=18.251457,120.610237&t=m&z=15&output=embed`
- **Properties scroll container count:** 1
- **Initial scrollTop:** `0`
- **Scrolled scrollTop:** `450` (Verified smooth scrolling without scroll-locking or Lenis hijacking)
- **Updated src after Satellite click:** `https://maps.google.com/maps?q=18.251457,120.610237&t=k&z=15&output=embed` (`t=k` confirms satellite cartography switch)
- **Screenshot artifact:** `properties_google_map_verified.png`

## 4. Status
**Complete — verified locally.**
