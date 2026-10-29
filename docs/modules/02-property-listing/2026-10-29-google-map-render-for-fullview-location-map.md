---
module: 02-property-listing
date: 2026-10-29
status: completed
affected_files:
  - frontend/src/pages/portals/broker/BrokerFullViewMap.jsx
  - frontend/src/pages/portals/broker/BrokerFullViewMap.test.jsx
---

# Google Maps Rendering for Full-View Location Map Page

## 1. Overview & Objective
Replaced the Leaflet/OpenStreetMap rendering on the dedicated Full-View Map Studio page (`/broker/properties/location-map`) with authentic **Google Maps rendering**, providing official Google cartography, canonical red pinpoint marker, and comprehensive UI controls.

## 2. Delivered Changes

### 2.1 Google Maps Engine (`frontend/src/pages/portals/broker/BrokerFullViewMap.jsx`)
- **Official Google Maps Embed:** Replaced Leaflet map canvas with the Google Maps embed engine (`https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${zoomLevel}&output=embed`), rendering Google's authentic cartography and red pinpoint marker.
- **Layer Switching:** Added interactive switching between Google's official map types:
  - `Roadmap` (`'m'`): Standard Google vector roadmap.
  - `Satellite` (`'k'`): High-resolution satellite imagery.
  - `Hybrid` (`'h'`): Satellite imagery with streets and place labels.
  - `Terrain` (`'p'`): Topographical elevation map.
- **Zoom & Navigation Controls:** Interactive Zoom In (`+`), Zoom Out (`-`), and Reset/Center on Pin (`zoomLevel = 16`).
- **GPS Device Geolocation:** "Locate Me" button captures browser device location via `navigator.geolocation` and positions the pin.
- **Predictive Address Search Bar:** Nominatim OSM autocomplete search bar with suggestion flyout. Selecting any result immediately updates the Google Maps pin.
- **Coordinates Inspector:** Precision numerical Latitude and Longitude editing inputs with 1-click clipboard copy.
- **Bidirectional Listing Draft Sync:** Preserves all existing draft data and updates coordinates in Step 2 upon clicking "Apply Coordinates to Listing".

### 2.2 Test Suite Updates (`frontend/src/pages/portals/broker/BrokerFullViewMap.test.jsx`)
- Added tests asserting the rendering of `fullview-google-map-canvas` and iframe embed with the active coordinates in `src`.
- Verified dynamic layer switching updates `t=k` and `t=p`.
- Verified "Apply Coordinates to Listing" saves to `sessionStorage` and navigates back to Step 2.

## 3. Verification & Evidence
- **Vitest Unit Tests:**
  - Ran `BrokerFullViewMap.test.jsx`, `CadastralPickerAndCommute.test.jsx`, and `BrokerCreateListings.test.jsx`: **20/20 tests passed**.
- **Production Build:**
  - `npm run build --prefix frontend`: Built cleanly with zero errors in 4.58s.
- **Playwright MCP Live Browser Verification:**
  - Navigated to `http://localhost:5173/broker/properties/location-map?returnUrl=%2Fbroker%2Fproperties%2Fcreate&lat=14.5547&lng=121.0244`.
  - Confirmed official Google Maps Roadmap rendering with Google's red pin.
  - Clicked "Satellite" and confirmed immediate switch to Google Satellite imagery.
  - Clicked "Apply Coordinates to Listing" and confirmed seamless return to `http://localhost:5173/broker/properties/create?step=2`.
