---
module: 02-property-listing
date: 2026-10-28
status: Complete — verified locally
affected_files:
  - frontend/src/components/ui/map/EnlargedMapModal.jsx
  - frontend/src/components/ui/map/index.js
  - frontend/src/components/ui/index.js
  - frontend/src/pages/public/PropertyListingView.jsx
  - test files/frontend/ui/EnlargedMapModal.test.jsx
  - test files/frontend/pages/PropertyListingView.test.jsx
---

# Verification Record: Property Detail Pinpoint Map & Enlarged Full-Scale Map Modal

## 1. Overview & Delivered Capabilities

Enhanced the location experience on the property detail page ([`PropertyListingView.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/public/PropertyListingView.jsx)) based on specification and `/grill-me` alignment:

1. **Inline High-Resolution Pinpoint Map:**
   - Display tightly focused single property coordinates at high cadastral resolution (zoom 16–17).
   - Momentum scroll protection via `data-lenis-prevent="true"`.
2. **Floating Action Dock:**
   - Embedded frosted-glass action buttons inside the canvas:
     - **Enlarge Map Button:** Styled in Modern SaaS teal with `IconMaximize` (`min-h-[44px]` touch target).
     - **360° View Button:** Styled with `IconCompass`.
   - Co-located secondary Enlarge trigger in the section header alongside GPS coordinates.
3. **Fullscreen Enlarged Property Map Modal ([`EnlargedMapModal.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/map/EnlargedMapModal.jsx)):**
   - Full-viewport accessible dialog (`role="dialog"`, `aria-modal="true"`, `data-lenis-prevent="true"`).
   - Top status header displaying property title, formatted address, total active listings count badge, and "Center on Property" re-center button.
   - Vector [`GooglePropertyMap`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/map/GooglePropertyMap.jsx) displaying all active listings loaded via `propertyService.getProperties()` or mock fallback.
   - Highlights the current property with an **Approved Coral** beacon (`#FF6B6B`) and pulsing indicator.
   - Interactive residence preview cards upon clicking any surrounding pin.
   - Floating legend distinguishing current property (Coral) from other listings (Teal).
   - Full keyboard accessibility (`Escape` key closes modal cleanly).

---

## 2. Test Execution & Evidence

| Test Suite | Tests Run | Result | Evidence File / Summary |
|---|---|---|---|
| `EnlargedMapModal` Unit Tests | 4 | PASSED | `test files/frontend/ui/EnlargedMapModal.test.jsx` (Dialog attributes, title/address, close/Esc, selection, re-center) |
| `PropertyListingView` Regression & Interaction | 5 | PASSED | `test files/frontend/pages/PropertyListingView.test.jsx` (Includes Enlarge Map button click and modal verification) |
| `PropertyListingView` RESO Schema Compliance | 3 | PASSED | `src/pages/public/PropertyListingView.test.jsx` (All RESO fields pass) |
| Core Map Components | 12 | PASSED | `test files/frontend/ui/` (`GooglePropertyMap`, `StreetViewModal`, `CadastralPickerAndCommute`, `EnlargedMapModal`) |
| **Total Tests Verified** | **24** | **100% PASSED** | Zero regressions |

---

## 3. Design & Quality Compliance

- **Tokens ([`design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/design.md)):**
  - Primary Teal (`#0F766E` / hover `#115E59`).
  - Approved Coral (`#FF6B6B`) for active current property pin and header badge.
  - White glass and Slate canvas (`#F8FAFC`).
  - Minimum 44px mobile touch targets.
- **Scroll Protection:** All interactive viewports implement `data-lenis-prevent="true"`.
- **Zero-Cost Guardrails:** Full offline/unconfigured fallback to Leaflet OSM canvas.
