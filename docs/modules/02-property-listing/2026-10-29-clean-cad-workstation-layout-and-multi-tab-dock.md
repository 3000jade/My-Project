---
module: 02-property-listing
date: 2026-10-29
status: Complete — verified locally
affected_files:
  - frontend/src/components/subdivision/SubdivisionLeftToolstrip.jsx
  - frontend/src/components/subdivision/SubdivisionLeftToolstrip.test.jsx
  - frontend/src/components/subdivision/SubdivisionBottomViewportDock.jsx
  - frontend/src/components/subdivision/SubdivisionBottomViewportDock.test.jsx
  - frontend/src/components/subdivision/SubdivisionRightDock.jsx
  - frontend/src/components/subdivision/SubdivisionRightDock.test.jsx
  - frontend/src/components/subdivision/SubdivisionVectorCanvas.jsx
  - frontend/src/pages/portals/broker/SubdivisionMapEditor.jsx
  - docs/REQUIREMENTS_SPECIFICATION.md
  - docs/modules/02-property-listing/INDEX.md
---

# Clean CAD Workstation Layout & Multi-Tab Studio Dock

## 1. Overview
Implemented a clean, uncluttered, agency-grade Modern SaaS CAD workstation layout for the Subdivision Map Editor (`SubdivisionMapEditor.jsx`), inspired by Figma, Linear, and modern web CAD tools.

## 2. Delivered Behavior & Features
1. **Left Vertical CAD Toolstrip (`SubdivisionLeftToolstrip.jsx`):**
   - Slim vertical dock pinned to the left edge of the canvas.
   - Houses drawing tools without obscuring the canvas: Pointer (`V`), Pan Hand (`H`), Polygon (`P`), Rectangle (`R`), Slice Boundary (`K`), AI Magic Wand (`W`), AI OCR (`O`), Undo, and Redo.
2. **Bottom Floating Viewport HUD Dock (`SubdivisionBottomViewportDock.jsx`):**
   - Glassmorphic dock pinned at bottom center.
   - Stepped zoom controls (`-`, `100%`, `+`, `Fit Screen`).
   - Blueprint Opacity blend slider (0% to 100%).
   - Layer visibility toggles (Blueprint Graphic, Lot Boundaries).
   - Grid Matrix toggle (`Show/Hide CAD Grid Dots`).
   - Canvas Ground switcher (`White Board` vs `Google Maps Satellite Ground`).
3. **Multi-Tab Right Studio Dock (`SubdivisionRightDock.jsx`):**
   - Utilizing shadcn Radix `Tabs`:
     - **Tab 1: Specs (`LotInspector`):** Displays lot Block, Lot number, Classification, Availability pills, Area (m²), Asking Price, Remarks, and "Square Corners (90° Orthogonal)".
     - **Tab 2: Roster:** Searchable parcel ledger with status filters (`ALL`, `Available`, `Reserved`, `Sold`); clicking any item selects and focuses that polygon.
     - **Tab 3: Blueprint:** Active blueprint status, replacement graphic button, clear background button, and AI whole-blueprint auto-layout trigger.
4. **Top Executive Command Header Mode Switcher:**
   - Seamlessly switch between `Vector Drafting` (interactive canvas) and `Parcels Ledger` (spacious full-width table view with metrics and actions).

## 3. Verification Evidence
- **Automated Tests:** 15/15 unit and component tests passing across all subdivision components (`npm --prefix frontend run test -- src/components/subdivision`).
- **Production Build:** `npm run --prefix frontend build` succeeded with zero errors.
- **Playwright MCP Live Browser Verification:**
  - `playwright_verified_clean_cad_drafting.png`: Verified default clean layout with left toolstrip and bottom viewport HUD.
  - `playwright_verified_drawn_parcel.png`: Verified drawing a rectangle lot on the canvas with active handles and specs.
  - `playwright_verified_parcels_ledger.png`: Verified switching to the Parcels Ledger table view.
  - `playwright_verified_blueprint_tab.png`: Verified the Blueprint & AI settings tab in the Right Studio Dock.
