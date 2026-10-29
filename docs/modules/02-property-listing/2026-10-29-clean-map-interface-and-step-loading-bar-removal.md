---
module: 02-property-listing
date: 2026-10-29
status: completed
affected_files:
  - frontend/src/components/ui/map/CadastralLocationPicker.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - test files/frontend/ui/CadastralPickerAndCommute.test.jsx
---

# Clean Map Interface & Stepper Progress Loading Bar Removal

## 1. Overview & Objective
Refactored the location pinpoint map interface in Step 2 of the listing creation studio (`CadastralLocationPicker.jsx`) and the listing stepper header in `BrokerCreateListings.jsx`. The purpose was to eliminate visual clutter, redundant overlays, and distracting animated elements while keeping the embedded Google Maps interactive canvas clean, uncluttered, and responsive.

## 2. Delivered Changes

### 2.1 CadastralLocationPicker (`frontend/src/components/ui/map/CadastralLocationPicker.jsx`)
- **Removed Outer Base White Card Wrapper:** Replaced nested `rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3` styling with a direct `w-full ${className}` container so the map canvas sits flush and naturally within Step 2 without duplicate card borders.
- **Removed Button Navigation Controls:** Eliminated floating "Open in Google Maps" external navigation button, map layer switcher buttons (Map / Satellite / Hybrid), and custom zoom increment/decrement buttons. The user can interact with the map directly via native Google Maps touch, pan, and zoom gestures.
- **Removed Status Pills:** Removed the `"Cadastral Coordinates Verified"` green pill and the `"GPS: ..."` coordinate text badge overlay. Coordinates remain directly inspectable and editable in the dedicated numerical latitude/longitude inputs in Step 2.
- **Removed Redundant Footer Note:** Stripped the bottom disclaimer text to maximize vertical canvas real estate.

### 2.2 BrokerCreateListings Stepper Header (`frontend/src/pages/portals/broker/BrokerCreateListings.jsx`)
- **Removed Horizontal Progress Loading Bar:** Removed the animated `h-1.5 bg-[#0F766E]` progress bar underneath the `Step X of 7` label to maintain a clean, distraction-free header.
- **Fixed Missing Import:** Added missing `ViewPropertyButton` import to the destructuring list from `../../../components/ui`.

## 3. Verification & Evidence
- **Vitest Unit Tests:**
  - Ran `CadastralPickerAndCommute.test.jsx` and `BrokerCreateListings.test.jsx`: **16/16 tests passed**.
  - Verified assertions confirming that `data-testid="cadastral-map-canvas"` and the embed iframe exist with the correct coordinate parameters, and that removed pills and buttons do not render.
- **Vite Production Build:**
  - Ran `npm run build --prefix frontend`: Built successfully without errors in 5.01s.
- **Playwright MCP Verification:**
  - Navigated to `http://localhost:5173/broker/properties/create` and navigated to Step 2 (*Location & Address*).
  - Confirmed the elimination of the progress loading bar and the clean, unobstructed map canvas rendering flush without extra white card borders.
