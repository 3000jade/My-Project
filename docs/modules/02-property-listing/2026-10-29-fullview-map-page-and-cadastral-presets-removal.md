---
module: 02-property-listing
date: 2026-10-29
status: completed
affected_files:
  - frontend/src/components/ui/map/CadastralLocationPicker.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - frontend/src/pages/portals/broker/BrokerFullViewMap.jsx
  - frontend/src/pages/portals/broker/BrokerFullViewMap.test.jsx
  - frontend/src/App.jsx
  - test files/frontend/ui/CadastralPickerAndCommute.test.jsx
---

# Full-View Map Studio Page & Cadastral Presets Removal

## 1. Overview & Objective
Refactored the location pinpoint interface in Step 2 of the Broker Listing Studio:
1. Removed `Cadastral Presets: [BGC, Taguig] [Makati CBD] ...` quick buttons row.
2. Removed redundant external navigation controls.
3. Added a round white plinth button in the bottom right corner with the 4-way expand/fullscreen icon to launch a full view.
4. Generated a dedicated, full-screen **Interactive Full-View Map Page** (`/broker/properties/location-map`) with comprehensive UI function controls:
   - Full viewport Leaflet map with custom Coral/Teal draggable pinpoint marker.
   - Click anywhere on the map to set and update coordinates.
   - Automatic reverse geocoding to resolve address, city, and barangay.
   - Nominatim predictive search bar with live auto-suggestions for Philippine locations.
   - Map Layer Switcher (Street, Satellite, Architectural Light, Terrain).
   - Navigation and Zoom tools (Zoom In, Zoom Out, Center on Pin, Browser GPS Geolocation "Locate Me").
   - Proximity radius rings overlay (1 km, 3 km, 5 km).
   - Precision coordinates inspector with copy-to-clipboard.
   - Bidirectional draft synchronization with `BrokerCreateListings`: clicking "Apply Coordinates to Listing" preserves all existing draft data and updates the coordinates in Step 2.

## 2. Delivered Changes

### 2.1 CadastralLocationPicker (`frontend/src/components/ui/map/CadastralLocationPicker.jsx`)
- Added `onOpenFullView` callback support.
- Rendered round white plinth button in the bottom right corner of the canvas with the 4-way expand icon (`svg` corner brackets) matching reference design.

### 2.2 BrokerCreateListings (`frontend/src/pages/portals/broker/BrokerCreateListings.jsx`)
- Removed the `Cadastral Presets:` button track from Step 2.
- Integrated `handleOpenFullViewMap`: preserves form state in `sessionStorage` and navigates to `/broker/properties/location-map`.
- Added draft restoration effect: automatically absorbs returned coordinates from `broker_listing_updated_coords` and returns directly to `step=2`.

### 2.3 BrokerFullViewMap (`frontend/src/pages/portals/broker/BrokerFullViewMap.jsx`) [NEW]
- Full-screen cartographic workstation page with header, search bar, map canvas, layer switcher, zoom controls, radius rings, and coordinates inspector.

### 2.4 App Routing (`frontend/src/App.jsx`)
- Registered routes:
  - `/broker/properties/location-map`
  - `/broker/properties/map`

## 3. Verification & Evidence
- **Vitest Unit Tests:**
  - Ran `CadastralPickerAndCommute.test.jsx`, `BrokerFullViewMap.test.jsx`, and `BrokerCreateListings.test.jsx`: **19/19 tests passed**.
- **Production Build:**
  - `npm run build --prefix frontend`: Built successfully without errors in 5.50s.
- **Playwright MCP Interactive Verification:**
  - Navigated to `http://localhost:5173/broker/properties/create?type=houseAndLot` Step 2.
  - Verified absence of `Cadastral Presets: ...`.
  - Verified presence of the round fullview button.
  - Clicked the button and confirmed navigation to `/broker/properties/location-map`.
  - Confirmed all UI controls render cleanly.
  - Clicked "Apply Coordinates to Listing" and confirmed seamless return to Step 2 with preserved state.
