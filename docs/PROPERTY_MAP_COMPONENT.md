# Property Map Component Documentation (`PropertyMap.jsx`)

> **Location:** `frontend/src/components/ui/map/PropertyMap.jsx`  
> **Companion Components:** `frontend/src/components/ui/map/MapLayerControl.jsx`  
> **Design Philosophy:** Nordic Modern Architectural & Bauhaus Precision  
> **Primary Technology:** React 19, Leaflet 1.9+, Tailwind CSS v4, OpenStreetMap / ESRI / CartoDB  

---

## 1. Executive Overview

The **`PropertyMap`** component is the spatial visualization anchor of the CP_kerby luxury real estate platform. It renders interactive high-density property maps featuring dynamic price badge pins, preview cards, live bounding-box search synchronization, prime district polygon overlays, and multi-tier basemap switching.

Designed to eliminate visual clutter, the component integrates seamlessly with the platform's **Daylight Light Theme** (`#FBFBF9` ground, `#0D4446` / `#174849` Spruce Teal, and `#E76F51` Burnt Terracotta Coral) and respects global momentum scroll physics via `data-lenis-prevent="true"`.

---

## 2. Key Features & Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [✓ Search as I move map]  [Street | Satellite | Light]  [⬡ Districts]           │
│                                                                                 │
│          ┌──────────┐                                                           │
│          │ ₱285M •  │ ◄─── Interactive Custom HTML Price Pin                    │
│          └────▼─────┘                                                           │
│               │                                                                 │
│               ▼                                                                 │
│        ┌─────────────────────────┐                                              │
│        │ [Property Photo Preview]│                                              │
│        │ The Horizon Penthouse   │ ◄─── Rich Residence Preview Card             │
│        │ 4 Beds • 5 Baths • 620m²│      with "View Residence →" CTA             │
│        └─────────────────────────┘                                              │
│                                                                                 │
│                                                  [● 14 Locations]  [⛶ Fit All]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Dynamic HTML Price Badge Pins (`L.divIcon`)
- Rather than generic map pins, each listing is rendered as an ergonomic, pill-shaped **price badge** (e.g., `₱45M`, `$2.8M`).
- **Interactive State Handshake:**
  - **Normal State:** Crisp `#FFFFFF` plinth, subtle drop shadow, hairline border, and `#174849` typography.
  - **Hovered / Selected State:** Instantly scales up (`scale-110`), elevates `zIndex` to 1000, transitions background to Deep Spruce Teal (`#174849`), and displays a high-contrast Terracotta Coral (`#E76F51`) beacon dot.
  - Fully synchronized with external property cards (hovering a card in the search results highlights the corresponding map pin).

### 2.2 Rich Interactive Residence Popups
Clicking any pin summons a custom-styled popup card featuring:
- High-resolution thumbnail image with embedded price badge.
- Property title and neighborhood/city label.
- Architectural telemetry (Beds, Baths, Living Area in square meters).
- **"View Residence →"** button navigating directly to the property's detailed view (`/properties/:id`).

### 2.3 "Search As I Move" Dynamic Bounding-Box Filter
- Includes a floating toggle checkbox: **"Search as I move map"**.
- Employs a 300ms debounced `moveend` event listener that calculates the visible viewport bounds (`north`, `south`, `east`, `west`).
- Fires `onBoundsChange(bounds)` to the parent listing page to dynamically re-query listings within the current camera view.

### 2.4 Floating Bauhaus Glass HUD Dock (`MapLayerControl.jsx`)
A frosted glass control dock (`bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-full`) floating at the top of the map provides:
1. **Basemap Switcher:**
   - **Street:** OpenStreetMap Standard (urban clarity).
   - **Satellite:** ESRI World Imagery (high-resolution aerial photography of estates and grounds).
   - **Light:** CartoDB Positron (subdued architectural light map minimizing canvas noise).
2. **Philippine Prime Business Districts Overlay:**
   - Toggles GeoJSON polygon boundaries highlighting prime luxury hubs (BGC, Makati CBD, Rockwell, Alabang, New Manila).
   - Interactive district tooltips display active residence inventory and district metadata.

### 2.5 Spatial Telemetry & Recenter Controls
- **Live Inventory Badge:** Displays real-time location counts with an active pulsing status beacon (`14 Locations`).
- **"Fit All" Recenter Button:** Automatically calculates the geographical bounding box of all active listings and smoothly fits them into the viewport (`fitBounds`) with padding.
- **Fly-To Smooth Transitions:** Supports programmatic `targetDistrict` prop for cinematic camera flights to specific metropolitan areas.

### 2.6 Lenis Momentum-Scroll Isolation
- Global smooth scrolling in CP_kerby is powered by Lenis.
- The map wrapper and popups contain **`data-lenis-prevent="true"`**, preventing map wheel-zoom and pan gestures from conflicting with page-level vertical scrolling.

---

## 3. Component Architecture & Props Interface

### Props Contract (`PropertyMap`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`properties`** | `Array<Object>` | `[]` | List of property items with coordinates, price, media, and specs. |
| **`selectedPropertyId`** | `string \| null` | `null` | ID of the currently selected property (active state). |
| **`hoveredPropertyId`** | `string \| null` | `null` | ID of the property hovered in the adjacent listing card grid. |
| **`onSelectProperty`** | `Function` | `undefined` | Callback invoked when a property marker is clicked: `(property) => void`. |
| **`onBoundsChange`** | `Function` | `undefined` | Callback invoked when "Search as I move" is active and map pans/zooms. |
| **`targetDistrict`** | `Object \| null` | `null` | `{ lat: number, lng: number, zoom?: number }` to trigger smooth camera fly-to. |
| **`className`** | `string` | `''` | Tailwind CSS utility classes applied to the outer container. |

---

## 4. Dependencies & Utility Ecosystem

- **`leaflet` (`^1.9.4`)**: Core mapping engine and layer manager.
- **`leaflet.css`**: Core Leaflet styling and layer positioning.
- **`propertyCoordinates.js`**:
  - `getPropertyCoordinates(property)`: Fallback-safe coordinate resolver parsing `latitude`/`longitude`, nested `location` objects, or default coordinates.
  - `formatPricePill(price, priceRaw)`: Formatter converting raw numeric prices into compact badges (e.g. `₱285M`, `₱15.5M`).
- **`mockMapDistricts.js`**:
  - `PHILIPPINE_BASEMAPS`: URL templates, attributions, and tile configs for OSM, ESRI, and CartoDB.
  - `MOCK_PH_DISTRICTS`: GeoJSON boundaries for Bonifacio Global City, Makati CBD, Rockwell, and New Manila.
- **`MapLayerControl.jsx`**: Floating glass HUD control widget.

---

## 5. Usage Example

```jsx
import React, { useState } from 'react';
import PropertyMap from '@/components/ui/map/PropertyMap';

export default function ListingExplorerPage({ listings }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const handleBoundsChange = (bounds) => {
    if (bounds) {
      console.log('Filter listings within viewport:', bounds);
    }
  };

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-[#D8DFDF]">
      <PropertyMap
        properties={listings}
        selectedPropertyId={selectedId}
        hoveredPropertyId={hoveredId}
        onSelectProperty={(prop) => setSelectedId(prop.id)}
        onBoundsChange={handleBoundsChange}
      />
    </div>
  );
}
```

---

## 6. Design System Tokens Applied

- **Base Ground:** Plain Alabaster Daylight (`#FBFBF9`)
- **Primary Marker Ink:** Spruce Teal (`#174849` / `#0D4446`)
- **Active Pin Accent:** Burnt Terracotta Coral (`#E76F51`)
- **Popup Container:** Crisp pure white (`#FFFFFF`) with `16px` concentric border radius
- **Typography:** Major Third scale, high-contrast WCAG AAA verified ink
- **HUD Plates:** 95% frosted glass (`bg-white/95 backdrop-blur-md`) with hairline rim borders (`border-gray-200/80`)
