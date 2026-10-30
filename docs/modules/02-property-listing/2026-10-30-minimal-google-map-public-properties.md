---
module: 02-property-listing
date: 2026-10-30
status: verified_locally
affected_files:
  - frontend/src/components/ui/map/googleMapMarkers.js
  - frontend/src/components/ui/map/GooglePropertyMap.jsx
  - frontend/src/components/ui/map/GooglePropertyMap.test.jsx
  - frontend/src/pages/public/PropertiesPage.jsx
---

# Minimal Google Map Interface for Public Properties Verification Record

## 1. Executive Summary

This record verifies the implementation and local testing of the streamlined minimal Google Map interface on the public properties portal (`/properties`). Previously, the map displayed text-heavy price badges and fell back to a single-pin embed iframe when `VITE_GOOGLE_MAPS_API_KEY` was absent.

The refined implementation delivers:
1. **Regular SVG Teardrop Pins (No Price Text):** Renders clean, modern vector teardrop pins in brand teal (`#0F766E`) with a white inner core dot (`r="5"`). The pin tip is cartographically anchored to the exact property coordinates. When selected, the pin morphs into vibrant coral (`#FF6B6B`) with a scale bounce and active pulse dot.
2. **Click-to-Scroll & Hover Title Tooltip:**
   - **Clicking a Pin:** Immediately selects the property, highlights the property card with a bold teal border (`ring-3 ring-[#0F766E] shadow-2xl scale-[1.02] bg-teal-50/20`), auto-expands the virtual list limit if necessary, and smoothly scrolls the list directly to center the card.
   - **Hovering a Pin:** Displays an unobtrusive property title tooltip above the pin on the map without causing jitter or scrolling in the property list.
   - **Clean Map Viewport:** Removed bottom floating preview cards to leave the map completely open and unobstructed.
3. **Full Manual Zoom & Unrestricted Range:**
   - Supports full zoom range from 1 (global overview) to 21 (street-level closeup) across both native Google Maps and Leaflet engines.
   - Dedicated floating manual zoom controls (`+` and `−` buttons with accessible labels) anchored at the bottom-right of the map canvas, alongside smooth scroll-wheel and gesture zooming.
4. **Resilient Hybrid Google Canvas:** Automatically loads Google Maps JavaScript API with luxury vector styles when configured, or seamlessly falls back to Google Maps tiles via Leaflet, ensuring all property pins are visible.
5. **Modern SaaS Cartographic Controls:** Clean top floating HUD providing Street (Roadmap), Satellite imagery, Districts toggle, "Fit All" auto-centering, and "Search as I move map" bounds synchronization.

## 2. Affected Files & Changes

| File | Change Description |
| :--- | :--- |
| `frontend/src/components/ui/map/googleMapMarkers.js` | Added `createTeardropPinElement` rendering regular SVG teardrop pins (teal with white center, coral on selection) with hover title tooltips and no price text. |
| `frontend/src/components/ui/map/GooglePropertyMap.jsx` | Configured full zoom range (1-21), added bottom-right manual zoom control dock (`+` and `−`), removed bottom popover card, and wired teardrop pin selection. |
| `frontend/src/pages/public/PropertiesPage.jsx` | Updated `handleSelectProperty` to smoothly scroll to card and highlight upon pin click; updated `handleHoverProperty` to avoid list scroll jumps. |
| `frontend/src/components/ui/map/GooglePropertyMap.test.jsx` | Updated unit test suite verifying regular teardrop pin rendering, selection color morphing, manual zoom controls, and click callbacks. |

## 3. Verification Evidence

### Automated Unit & Component Tests

```powershell
npm --prefix frontend test -- GooglePropertyMap.test.jsx PropertiesPageMap.test.jsx PropertiesPage.test.jsx
```

**Results:**
- `../test files/frontend/ui/GooglePropertyMap.test.jsx`: 3 passed
- `src/components/ui/map/GooglePropertyMap.test.jsx`: 8 passed
- `src/pages/public/PropertiesPage.test.jsx`: 3 passed
- `../test files/frontend/pages/PropertiesPageMap.test.jsx`: 2 passed
- **Total:** 16 passed (100% pass rate)

### Playwright MCP Zoom & Inspection Diagnosis & Resolution

1. **Issue 1 — Controls Occlusion by Map Tiles:**
   - **Diagnosis:** Floating top HUD dock and bottom-right manual zoom buttons had `z-20`. Leaflet tile panes default to `z-index: 400`, which occluded controls underneath map tiles.
   - **Fix:** Elevated map controls to `z-[1000]` and offset zoom controls to `bottom-20 right-4 sm:right-6` above floating chat badge.
2. **Issue 2 — Map Destruction on Zoom ("No Results Found"):**
   - **Diagnosis:** `searchAsMove` defaulted to `true`. Zooming into an area with 0 properties emptied `filteredProperties`, causing `PropertiesPage.jsx` to unmount the entire split view container and replace it with `FilterEmptyState`.
   - **Fix:** `searchAsMove` defaults to `false` (opt-in toggle), and in `viewMode === 'split'`, the map container remains permanently mounted in the right pane while the left pane displays the empty state if 0 results occur.
3. **Issue 3 — Leaflet Unmount Exception:**
   - **Diagnosis:** Unmounting during an in-flight zoom animation caused `_leaflet_pos` errors.
   - **Fix:** Added `stop()` and defensive `try/catch` in Leaflet unmount cleanup. Permanent split mounting also prevents unexpected unmounting.

### Production Build Validation

```powershell
npm --prefix frontend run build
```

**Results:**
- `vite v8.3.5 building client environment for production...`
- `✓ 10997 modules transformed.`
- `✓ built in 8.16s` with zero errors.
