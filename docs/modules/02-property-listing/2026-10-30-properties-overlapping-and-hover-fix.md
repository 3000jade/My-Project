---
module: 02-property-listing
date: 2026-10-30
status: Complete — verified locally
affected_files:
  - frontend/src/pages/public/PropertiesPage.jsx
  - frontend/src/components/ui/cards/PropertyCard.jsx
  - frontend/src/components/ui/search/UnifiedSearchBar.jsx
  - frontend/src/components/ui/map/googleMapMarkers.js
---

# Change Record: PropertiesPage UI Overlapping & Hover/Highlight Optimization

## 1. Description
Using the Playwright MCP browser automation and inspection tools, diagnosed and resolved visual clipping and overlapping issues on the public `PropertiesPage`:
1. **Virtualizer Row Clipping:** Removed disruptive `scale-[1.01]` / `scale-[1.02]` transforms from TanStack Virtualizer row elements in both Split Mode and Grid Mode. Scaled items inside absolute-positioned rows were bleeding outside item height boundaries, clipping the cards' focus rings and shadows.
2. **Smooth Non-Reflowing Card Focus:** Shifted the focus and hover state directly into `PropertyCard.jsx` with a Modern SaaS teal halo (`ring-2 ring-[#0F766E]/30 shadow-xl -translate-y-1`), adding subtle row grid headroom (`pt-1.5 pb-6 px-0.5`).
3. **UnifiedSearchBar Right Edge Clearance:** Adjusted the view switcher (`Split Map` vs `Grid View`) with responsive icon-only display below `2xl` and `ml-auto`, preventing it from colliding with card borders at 1024px–1280px widths.
4. **Card-to-Map Marker Synchronization:** Connected `isHovered` to `createTeardropPinElement` in `googleMapMarkers.js` so hovering any card in the list elevates the map pin (`scale-120 drop-shadow-xl`), pulses the pin core, and displays the property title tooltip.
5. **Spec Pill Formatting:** Cleaned up living area formatting (`9,688 sqm`) to prevent text wrapping or truncation inside card specs.

## 2. Verification Evidence
- **Playwright MCP Inspection:** Verified at 1280px desktop and 375px mobile viewports; verified card hover state in `properties_desktop_hover_fixed.png`.
- **Vitest Suites:** `PropertiesPage.test.jsx` (3/3 passed), `PropertyCard.test.jsx` (6/6 passed) — total 9/9 passed.
- **Production Vite Build:** `npm run build --prefix frontend` passed cleanly in 9.00s.
