# Map Configuration Cleanup & uMap Layer Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the existing hardcoded Leaflet map configuration in `frontend/src/components/ui/map/PropertyMap.jsx` and implement modular uMap-inspired features (multi-basemap switching, PSGC district polygon overlays, Lenis momentum scroll isolation, and clean marker lifecycle management) backed by unit and integration tests.

**Architecture:** Decouple tile providers and vector layer overlays from the core map view into a composable layer engine. State is driven by React props with declarative Leaflet layer lifecycle management, ensuring DOM-event memory leaks are eliminated and Lenis scroll gestures are isolated via `data-lenis-prevent="true"`.

**Tech Stack:** React 19, Leaflet 1.9.4, Tailwind CSS v4, Framer Motion v12, Vitest 5, `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-10-06-umap-map-modernization-design.md`

## Global Constraints

- **Design System:** Comply strictly with Nordic Modern Architectural standards (`#FBFBF9` canvas, `#0D4446` spruce teal, `#E76F51` terracotta coral accent, `h-[54px]` inputs).
- **Directory Blueprint:** All map components must reside in `frontend/src/components/ui/map/` and re-export via `frontend/src/components/ui/index.js`.
- **Scroll Isolation:** The map viewport and any scrollable popup elements must contain `data-lenis-prevent="true"`.
- **Git Safety:** Strictly no remote git push. All commits remain local.

---

### Task 1: Type Contracts & Philippine District GeoJSON Fixtures

**Files:**
- Create: `shared/types/maps.ts`
- Create: `frontend/src/mockData/mockMapDistricts.js`
- Test: `test files/frontend/mockData/mockMapDistricts.test.js`

**Interfaces:**
- Produces: `BasemapId`, `MapLayerConfig`, `DistrictFeature`, `PHILIPPINE_BASEMAPS`, `MOCK_PH_DISTRICTS`

- [ ] **Step 1: Write the failing test for district boundaries and basemap configs**

Create `test files/frontend/mockData/mockMapDistricts.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { PHILIPPINE_BASEMAPS, MOCK_PH_DISTRICTS } from '../../../frontend/src/mockData/mockMapDistricts';

describe('mockMapDistricts & Basemap Definitions', () => {
  it('exports valid basemap definitions with url and attribution', () => {
    expect(PHILIPPINE_BASEMAPS).toBeDefined();
    expect(PHILIPPINE_BASEMAPS['osm-standard']).toHaveProperty('url');
    expect(PHILIPPINE_BASEMAPS['esri-satellite']).toHaveProperty('url');
    expect(PHILIPPINE_BASEMAPS['carto-light']).toHaveProperty('url');
  });

  it('exports valid GeoJSON district features for prime Philippine hubs', () => {
    expect(MOCK_PH_DISTRICTS).toBeDefined();
    expect(MOCK_PH_DISTRICTS.type).toBe('FeatureCollection');
    expect(MOCK_PH_DISTRICTS.features.length).toBeGreaterThanOrEqual(3);

    const bgc = MOCK_PH_DISTRICTS.features.find((f) => f.properties.id === 'bgc');
    expect(bgc).toBeDefined();
    expect(bgc.geometry.type).toBe('Polygon');
    expect(bgc.properties.name).toBe('Bonifacio Global City');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/mockData/mockMapDistricts.test.js"`  
Expected: FAIL (module not found)

- [ ] **Step 3: Create shared type definitions**

Create `shared/types/maps.ts`:
```typescript
export type BasemapId = 'osm-standard' | 'esri-satellite' | 'carto-light';

export interface BasemapConfig {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface DistrictProperties {
  id: string;
  name: string;
  city: string;
  region: string;
  highlightColor: string;
  propertyCount?: number;
}

export interface DistrictFeature {
  type: 'Feature';
  properties: DistrictProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictFeatureCollection {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}
```

- [ ] **Step 4: Create mock district fixtures and basemap configurations**

Create `frontend/src/mockData/mockMapDistricts.js`:
```javascript
export const PHILIPPINE_BASEMAPS = {
  'osm-standard': {
    id: 'osm-standard',
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  },
  'esri-satellite': {
    id: 'esri-satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    maxZoom: 18
  },
  'carto-light': {
    id: 'carto-light',
    label: 'Architectural Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20
  }
};

export const MOCK_PH_DISTRICTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'bgc',
        name: 'Bonifacio Global City',
        city: 'Taguig',
        region: 'NCR',
        highlightColor: '#174849',
        propertyCount: 14
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0400, 14.5420],
            [121.0580, 14.5420],
            [121.0580, 14.5580],
            [121.0400, 14.5580],
            [121.0400, 14.5420]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'makati-cbd',
        name: 'Makati Central Business District',
        city: 'Makati',
        region: 'NCR',
        highlightColor: '#E76F51',
        propertyCount: 19
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0150, 14.5500],
            [121.0320, 14.5500],
            [121.0320, 14.5650],
            [121.0150, 14.5650],
            [121.0150, 14.5500]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'alabang',
        name: 'Ayala Alabang & Filinvest',
        city: 'Muntinlupa',
        region: 'NCR',
        highlightColor: '#0D4446',
        propertyCount: 8
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0180, 14.4150],
            [121.0420, 14.4150],
            [121.0420, 14.4350],
            [121.0180, 14.4350],
            [121.0180, 14.4150]
          ]
        ]
      }
    }
  ]
};
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/mockData/mockMapDistricts.test.js"`  
Expected: PASS

- [ ] **Step 6: Commit changes**

Run: `git add shared/types/maps.ts frontend/src/mockData/mockMapDistricts.js "test files/frontend/mockData/mockMapDistricts.test.js"`  
Run: `git commit -m "feat(maps): add map layer contracts and Philippine district GeoJSON fixtures"`

---

### Task 2: Clean Up Property Coordinates & Geocoding Resolver

**Files:**
- Modify: `frontend/src/utils/propertyCoordinates.js`
- Test: `test files/frontend/utils/propertyCoordinates.test.js`

**Interfaces:**
- Consumes: Property object or ID
- Produces: `getPropertyCoordinates`, `formatPricePill`, `isWithinPhilippineBounds`, `PHILIPPINES_BBOX`

- [ ] **Step 1: Write the failing unit tests for coordinate normalization and bounds validation**

Create `test files/frontend/utils/propertyCoordinates.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import {
  getPropertyCoordinates,
  formatPricePill,
  isWithinPhilippineBounds,
  PHILIPPINES_BBOX
} from '../../../frontend/src/utils/propertyCoordinates';

describe('propertyCoordinates utility cleanup', () => {
  it('defines valid Philippine bounding box limits', () => {
    expect(PHILIPPINES_BBOX).toBeDefined();
    expect(PHILIPPINES_BBOX.minLat).toBe(4.5);
    expect(PHILIPPINES_BBOX.maxLat).toBe(21.5);
    expect(PHILIPPINES_BBOX.minLng).toBe(116.0);
    expect(PHILIPPINES_BBOX.maxLng).toBe(127.0);
  });

  it('validates whether coordinates fall inside the Philippine archipelago', () => {
    expect(isWithinPhilippineBounds(14.5547, 121.0244)).toBe(true); // Makati
    expect(isWithinPhilippineBounds(10.3157, 123.8854)).toBe(true); // Cebu
    expect(isWithinPhilippineBounds(35.6762, 139.6503)).toBe(false); // Tokyo
  });

  it('resolves explicit property coordinates and falls back gracefully for unknown records', () => {
    const propertyWithExplicit = { lat: 14.5866, lng: 121.0827 };
    expect(getPropertyCoordinates(propertyWithExplicit)).toEqual({ lat: 14.5866, lng: 121.0827 });

    const fallback = getPropertyCoordinates(null);
    expect(fallback).toHaveProperty('lat');
    expect(fallback).toHaveProperty('lng');
    expect(isWithinPhilippineBounds(fallback.lat, fallback.lng)).toBe(true);
  });

  it('formats price pill strings with clean PHP currency notation', () => {
    expect(formatPricePill('₱185,000,000', 185000000)).toBe('₱185M');
    expect(formatPricePill('₱3,500,000', 3500000)).toBe('₱3.5M');
    expect(formatPricePill('₱850,000', 850000)).toBe('₱850K');
    expect(formatPricePill(null, null)).toBe('₱ --');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/utils/propertyCoordinates.test.js"`  
Expected: FAIL (missing `isWithinPhilippineBounds`, `PHILIPPINES_BBOX`)

- [ ] **Step 3: Refactor and clean up `propertyCoordinates.js`**

Modify `frontend/src/utils/propertyCoordinates.js`:
- Export `PHILIPPINES_BBOX = { minLat: 4.5, maxLat: 21.5, minLng: 116.0, maxLng: 127.0 };`
- Export `isWithinPhilippineBounds(lat, lng)`: return true if inside bounds.
- Ensure `formatPricePill` uses standard `₱` currency symbol without garbled character encoding (`?`).
- Use deterministic string hashing for pin coordinate jitter.

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/utils/propertyCoordinates.test.js"`  
Expected: PASS

- [ ] **Step 5: Commit changes**

Run: `git add frontend/src/utils/propertyCoordinates.js "test files/frontend/utils/propertyCoordinates.test.js"`  
Run: `git commit -m "refactor(maps): clean up coordinates resolver and add Philippine bounds validation"`

---

### Task 3: Build MapLayerControl Component

**Files:**
- Create: `frontend/src/components/ui/map/MapLayerControl.jsx`
- Test: `test files/frontend/ui/MapLayerControl.test.jsx`

**Interfaces:**
- Consumes: `activeBasemap`, `onBasemapChange`, `showDistricts`, `onToggleDistricts`, `districtCount`
- Produces: Floating glass HUD for basemap and district layer toggling

- [ ] **Step 1: Write the failing unit tests for MapLayerControl**

Create `test files/frontend/ui/MapLayerControl.test.jsx`:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapLayerControl from '../../../frontend/src/components/ui/map/MapLayerControl';

describe('MapLayerControl Component', () => {
  it('renders basemap switcher options and fires onBasemapChange', () => {
    const handleBasemapChange = vi.fn();
    const handleToggleDistricts = vi.fn();

    render(
      <MapLayerControl
        activeBasemap="osm-standard"
        onBasemapChange={handleBasemapChange}
        showDistricts={false}
        onToggleDistricts={handleToggleDistricts}
      />
    );

    expect(screen.getByText(/Street/i)).toBeInTheDocument();
    expect(screen.getByText(/Satellite/i)).toBeInTheDocument();

    const satelliteBtn = screen.getByText(/Satellite/i);
    fireEvent.click(satelliteBtn);
    expect(handleBasemapChange).toHaveBeenCalledWith('esri-satellite');
  });

  it('renders district overlay toggle button and triggers callback', () => {
    const handleToggleDistricts = vi.fn();

    render(
      <MapLayerControl
        activeBasemap="osm-standard"
        onBasemapChange={vi.fn()}
        showDistricts={false}
        onToggleDistricts={handleToggleDistricts}
      />
    );

    const districtBtn = screen.getByText(/Districts/i);
    fireEvent.click(districtBtn);
    expect(handleToggleDistricts).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/ui/MapLayerControl.test.jsx"`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement MapLayerControl with Nordic Modern glass styling**

Create `frontend/src/components/ui/map/MapLayerControl.jsx`:
- Include basemap options (`osm-standard`, `esri-satellite`, `carto-light`).
- Include district boundaries toggle with status pill.
- Ensure all clickable items have `cursor-pointer`, `data-lenis-prevent="true"`, and crisp typography.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- --run "test files/frontend/ui/MapLayerControl.test.jsx"`  
Expected: PASS

- [ ] **Step 5: Commit changes**

Run: `git add frontend/src/components/ui/map/MapLayerControl.jsx "test files/frontend/ui/MapLayerControl.test.jsx"`  
Run: `git commit -m "feat(maps): implement MapLayerControl floating basemap and layer switcher"`

---

### Task 4: Modernize PropertyMap (Cleanup + uMap Multi-Layer Engine)

**Files:**
- Modify: `frontend/src/components/ui/map/PropertyMap.jsx`
- Modify: `frontend/src/components/ui/map/index.js` (re-export `MapLayerControl`)
- Test: `test files/frontend/ui/PropertyMap.test.jsx`

**Interfaces:**
- Consumes: `properties`, `selectedPropertyId`, `hoveredPropertyId`, `onSelectProperty`, `onBoundsChange`, `targetDistrict`
- Produces: Enhanced interactive Leaflet map with dynamic tile switching, polygon overlays, memory-safe popups, and `data-lenis-prevent="true"`.

- [ ] **Step 1: Write comprehensive unit tests for PropertyMap**

Create `test files/frontend/ui/PropertyMap.test.jsx`:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertyMap from '../../../frontend/src/components/ui/map/PropertyMap';

// Leaflet mock
vi.mock('leaflet', () => {
  return {
    default: {
      map: () => ({
        setView: vi.fn(),
        remove: vi.fn(),
        fitBounds: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        flyTo: vi.fn(),
        getBounds: () => ({
          getNorth: () => 14.6,
          getSouth: () => 14.4,
          getEast: () => 121.1,
          getWest: () => 120.9
        })
      }),
      tileLayer: () => ({
        addTo: vi.fn(),
        remove: vi.fn()
      }),
      geoJSON: () => ({
        addTo: vi.fn(),
        remove: vi.fn()
      }),
      control: {
        zoom: () => ({ addTo: vi.fn() })
      },
      featureGroup: () => ({
        addTo: vi.fn(),
        clearLayers: vi.fn(),
        addLayer: vi.fn(),
        getBounds: () => ({ isValid: () => true })
      }),
      latLngBounds: () => ({
        extend: vi.fn(),
        isValid: () => true
      }),
      divIcon: vi.fn(() => ({})),
      marker: () => ({
        bindPopup: vi.fn(),
        on: vi.fn()
      })
    }
  };
});

describe('PropertyMap Modernized Component', () => {
  const sampleProperties = [
    {
      id: '1',
      name: 'Pacific Sky Penthouse',
      price: '₱185,000,000',
      price_raw: 185000000,
      lat: 14.5547,
      lng: 121.0244,
      location: 'Makati'
    }
  ];

  it('renders map container with data-lenis-prevent attribute', () => {
    const { container } = render(
      <BrowserRouter>
        <PropertyMap properties={sampleProperties} />
      </BrowserRouter>
    );

    const mapRoot = container.firstChild;
    expect(mapRoot).toHaveAttribute('data-lenis-prevent', 'true');
    expect(screen.getByText(/Search as I move map/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Location/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or checks requirements**

Run: `npm --prefix frontend test -- --run "test files/frontend/ui/PropertyMap.test.jsx"`  
Expected: Verification of initial mock and missing attributes

- [ ] **Step 3: Refactor `PropertyMap.jsx`**

Modify `frontend/src/components/ui/map/PropertyMap.jsx`:
1. Add `data-lenis-prevent="true"` to container.
2. Integrate `activeBasemap` state (`osm-standard`, `esri-satellite`, `carto-light`) and swap `tileLayer` dynamically using `PHILIPPINE_BASEMAPS`.
3. Integrate `showDistricts` state and load `MOCK_PH_DISTRICTS` via `L.geoJSON` with hover tooltips and styled boundaries.
4. Clean up inline HTML string templates into structured safe helpers.
5. Embed `MapLayerControl` in the floating controls bar.

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/ui/PropertyMap.test.jsx"`  
Expected: PASS

- [ ] **Step 5: Commit changes**

Run: `git add frontend/src/components/ui/map/PropertyMap.jsx frontend/src/components/ui/map/ "test files/frontend/ui/PropertyMap.test.jsx"`  
Run: `git commit -m "feat(maps): clean up PropertyMap and integrate uMap multi-basemap and district polygon engine"`

---

### Task 5: End-to-End Verification in PropertiesPage & Quality Assurance

**Files:**
- Modify/Verify: `test files/frontend/pages/PropertiesPageMap.test.jsx`
- Run: Full frontend test suite

- [ ] **Step 1: Update `PropertiesPageMap.test.jsx` to test layer control integration**

Ensure `test files/frontend/pages/PropertiesPageMap.test.jsx` asserts both property list rendering and enhanced map controls in split view mode.

- [ ] **Step 2: Run the full test suite**

Run: `npm --prefix frontend test -- --run "test files/frontend/pages/PropertiesPageMap.test.jsx"`  
Run: `npm --prefix frontend test -- --run "test files/frontend/ui/PropertyMap.test.jsx"`  
Run: `npm --prefix frontend test -- --run "test files/frontend/ui/MapLayerControl.test.jsx"`  
Expected: ALL PASS

- [ ] **Step 3: Verification before completion**

Inspect `git status` to ensure all created and modified files follow `ARCHITECTURE_MAP.md` conventions and no unintended files are staged.
