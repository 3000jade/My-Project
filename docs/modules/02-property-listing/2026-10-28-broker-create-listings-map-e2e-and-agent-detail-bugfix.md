---
module: 02-property-listing
date: 2026-10-28
status: Complete — verified locally
affected_files:
  - frontend/e2e/broker-create-listings-map.spec.ts
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - frontend/src/components/ui/map/CadastralLocationPicker.jsx
  - frontend/src/components/ui/map/EnlargedMapModal.jsx
  - frontend/src/components/ui/map/StreetViewModal.jsx
  - frontend/src/pages/portals/agent/AgentPropertyDetail.jsx
  - test files/frontend/pages/agent/AgentPropertyDetail.test.jsx
---

# Verification Record: Broker Create Listings Map E2E & Agent Property Detail Bug Resolution

## 1. Overview & Delivered Capabilities

This verification record covers two interrelated testing and debugging tasks:
1. **Playwright E2E Test Suite for Broker Listing Creation Map Functionality:**
   - Authored and verified [`frontend/e2e/broker-create-listings-map.spec.ts`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/e2e/broker-create-listings-map.spec.ts) covering Step 2 Location map mounting, preset coordinate synchronization, manual coordinate entry, and Google Maps URL parsing.
   - Handled browser `beforeunload` unsaved changes dialogs across multi-step test runs.
   - Fixed race conditions in reverse geocoding inside [`BrokerCreateListings.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerCreateListings.jsx) using a monotonically increasing request sequence ref (`latestPinRequestRef`).
   - Enhanced preset active visual states with `#0F766E` Teal indicators.

2. **Diagnosis & Complete Bug Resolution for Agent Property Detail ([`AgentPropertyDetail.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/agent/AgentPropertyDetail.jsx)):**
   - **Bug 1 (Contract Mismatch & Modal Freeze):** [`StreetViewModal.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/map/StreetViewModal.jsx) expected `coordinates={{ lat, lng }}` and `propertyTitle`, but `AgentPropertyDetail.jsx` passed `lat={propLat}`, `lng={propLng}`, and `propertyName={...}`. Because `coordinates` was undefined, `StreetViewModal` returned early in its `useEffect`, freezing the modal in an infinite loading spinner when clicking `360° Street View`. Fixed `StreetViewModal.jsx` to defensively handle both contract variants and normalized `AgentPropertyDetail.jsx`.
   - **Bug 2 (Missing Feature Parity):** Unlike `PropertyListingView.jsx` and `BrokerPropertyDetail.jsx`, `AgentPropertyDetail.jsx` lacked the "Enlarge Map" action button and [`EnlargedMapModal`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/map/EnlargedMapModal.jsx). Mounted modal with proper state handling.
   - **Bug 3 (Invalid Map Height Style Prop):** Passed `height="100%"` to `GooglePropertyMap` instead of CSS utility class `className="w-full h-full"`.
   - **Bug 4 (Price String Parsing Failure):** In `handleSubmitProposal`, `Number(formPrice)` yielded `NaN` when formatted with commas or currency symbols (e.g., `"₱12,500,000"` or `"12,500,000"`). Sanitized input via `Number(String(formPrice).replace(/[^0-9.]/g, ''))`.
   - **Bug 5 (Coordinate Fallback Omission):** Property object fallback calculation omitted `property.lat` / `property.lng`, relying solely on nested `coordinates` object. Added direct property fallback.

---

## 2. Verification Summary

### A. Playwright E2E Suite (`frontend/e2e/broker-create-listings-map.spec.ts`)
- **Execution Command:** `npx --prefix frontend playwright test e2e/broker-create-listings-map.spec.ts`
- **Results:**
  - `ok 1 navigates to Step 2 Location and verifies Cadastral Map components are mounted (10.6s)`
  - `ok 2 synchronizes coordinates when clicking Cadastral Presets (13.6s)`
  - `ok 3 supports manual coordinate entry with two-way cadastral badge reflection (10.3s)`
  - `ok 4 parses coordinates from Google Maps URL input (10.5s)`
- **Total:** 4 passed (49.5s) — 100% success rate.

### B. Vitest Unit & Integration Suites
- **Execution Command:** `npm --prefix frontend test -- "AgentPropertyDetail.test.jsx" "BrokerCreateListings.test.jsx"`
- **Results:**
  - `AgentPropertyDetail.test.jsx`: 5 passed (5)
  - `BrokerCreateListings.test.jsx`: 11 passed (11)
- **Total:** 16 passed (16) across 2 test suites (8.01s).
