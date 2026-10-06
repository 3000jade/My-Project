# Map Configuration Cleanup & uMap Layer Engine Specification

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Status**: Approved Specification  
> **Target Date**: 2026-10-06  

---

## 1. Objective

Upgrade CP_kerby's existing interactive map (`PropertyMap.jsx`) by cleaning up brittle inline code, isolating Lenis momentum scrolling, and introducing key **uMap** geospatial capabilities:
1. **Multi-Basemap Switching:** Seamless toggling between OpenStreetMap Standard, ESRI High-Resolution Satellite, and CARTO Architectural Light.
2. **Philippine District & Boundary Overlays:** Interactive GeoJSON polygon overlays highlighting prime commercial corridors (Bonifacio Global City, Makati CBD, and Ayala Alabang).
3. **Robust Lifecycle & Memory Management:** Clean Leaflet layer registration and removal to eliminate memory leaks and event listener duplication.
4. **Lenis Momentum Scroll Isolation:** Enforcing `data-lenis-prevent="true"` across map canvas and popup interactions to eliminate trackpad zoom/scroll collision.

---

## 2. Architectural Design

```
┌────────────────────────────────────────────────────────┐
│             frontend/src/components/ui/map/            │
├────────────────────────────┬───────────────────────────┤
│ PropertyMap.jsx            │ Main Leaflet viewport &   │
│                            │ pins controller           │
├────────────────────────────┼───────────────────────────┤
│ MapLayerControl.jsx        │ Floating glass dock for   │
│                            │ basemap & district toggles│
├────────────────────────────┼───────────────────────────┤
│ index.js                   │ Barrel re-export          │
└────────────────────────────┴───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│             frontend/src/mockData/ & utils/            │
├────────────────────────────┬───────────────────────────┤
│ mockMapDistricts.js        │ GeoJSON polygon fixtures  │
│ propertyCoordinates.js     │ Cleaned bounds validation │
└────────────────────────────┴───────────────────────────┘
```

---

## 3. Visual & Interaction Design Tokens

- **Controls Dock:** Frosted glass plate (`bg-white/95 backdrop-blur-md`), hairline border `border-gray-200/80`, drop shadow `shadow-sm`.
- **Active Basemap Indicator:** `#174849` Spruce Teal pill with white bold typography.
- **District Boundary Aesthetics:** 
  - Weight: 2px hairline border with dashed offset.
  - Fill Opacity: 0.12 resting, 0.28 on hover.
  - Interactive Tooltip: Displays district name and active listing count.
- **Pin Markers:** Retains existing luxury price pill (`#174849` Spruce Teal & `#E76F51` Terracotta Coral active beacon).
