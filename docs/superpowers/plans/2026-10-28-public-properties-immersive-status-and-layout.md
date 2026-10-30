# Implementation Plan: Public Properties Immersive Status Cards & Header Height Layout Adaptation

## Goal Description
Create an immersive UI/UX experience on the public properties discovery page ([`frontend/src/pages/public/PropertiesPage.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/public/PropertiesPage.jsx)) and property cards ([`frontend/src/components/ui/cards/PropertyCard.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/cards/PropertyCard.jsx)):
1. **Status-Driven Property Cards:** Dynamically render canonical RESO lifecycle statuses (`Active`, `Active Under Contract`, `Closed / Sold`) with `design.md` design tokens (Spruce Teal `#0F766E`, Warm Amber `#F59E0B`, Slate `#334155`). For `Active Under Contract`, display a contextual amber status tag (*"Under Contract — Backup Inquiries Welcome"*). For `Closed / Sold`, render a discrete Slate neutral pill with subtle image desaturation (*"Archived / Sold Record"*).
2. **Dynamic Navigation Header Layout Adaptation:** Eliminate fixed 80px dead space by reacting to header visibility (`header-visibility` window event from [`Header.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/layout/Header.jsx)). Dynamically set the top spacing from `80px` to `0px` when the header collapses on scroll, smoothly expanding the split map and cards viewport to 100vh with a frosted-glass docking toolbar.
3. **Bidirectional Map-Card Synchronization & Micro-Interactions:** Elevate card on hover with soft multi-layer shadow and Spruce Teal border accent, highlight corresponding cadastral map marker, and auto-scroll/highlight the card when clicking a map marker.

---

## User Review Required

> [!IMPORTANT]
> - **Public View Scope Authorization:** In previous tasks, `PropertiesPage.jsx` was held under an invariant boundary. This implementation plan directly modifies `frontend/src/pages/public/PropertiesPage.jsx` and `frontend/src/components/ui/cards/PropertyCard.jsx` per your explicit request.
> - **Card Status Policy:** `PropertyCard.jsx` will now visually differentiate `Active Under Contract` (Amber) and `Closed / Sold` (Slate) if those listings are present or returned by public queries, while keeping cards accessible and interactive.

---

## Proposed Changes

### Component 1: Public Property Card Status & Interaction ([`PropertyCard.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/ui/cards/PropertyCard.jsx))

#### [MODIFY] `frontend/src/components/ui/cards/PropertyCard.jsx`
- Extract canonical status:
  ```javascript
  const standardStatus = property.standard_status || property.standardStatus || property.StandardStatus || property.status || 'Active';
  const isUnderContract = standardStatus.toLowerCase().includes('contract') || standardStatus.toLowerCase().includes('reserved');
  const isClosed = standardStatus.toLowerCase().includes('closed') || standardStatus.toLowerCase().includes('sold');
  ```
- Top-left Badge Cluster:
  - Transaction pill (`For Sale` / `For Rent` in Spruce Teal `#0F766E` / `bg-white/95 text-teal-800 border-slate-200`).
  - Status pill:
    - If `isUnderContract`: Warm Amber pill `bg-amber-50/95 text-amber-800 border-amber-300 font-bold backdrop-blur-md` with dot indicator `bg-amber-500`.
    - If `isClosed`: Slate pill `bg-slate-100/95 text-slate-700 border-slate-300 font-bold backdrop-blur-md` with dot indicator `bg-slate-500`.
    - If `isFeatured`: Coral badge `bg-[#FF6B6B] text-white`.
- Contextual Overlay / Image Styling:
  - If `isClosed`: apply `grayscale-[35%] opacity-90` to the cover image to subtly indicate an archived/sold listing.
  - If `isUnderContract`: render a subtle bottom banner or pill on top of image *"Under Contract — Backup Inquiries Accepted"*.
- External synchronization props:
  - Support `isSelected` and `isHovered` props to trigger Spruce Teal ring (`ring-2 ring-[#0F766E] border-[#0F766E]`) and elevation when highlighted via map pin hover.

#### [NEW] `frontend/src/components/ui/cards/PropertyCard.test.jsx`
- Unit tests verifying:
  - Renders Active listing with standard For Sale/Rent badge.
  - Renders Under Contract with Amber status badge and backup inquiry tag.
  - Renders Closed / Sold with Slate neutral status badge and desaturation class.
  - Correctly toggles `isSelected` and `isHovered` styles.

---

### Component 2: Immersive Layout & Header Height Adaptation ([`PropertiesPage.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/public/PropertiesPage.jsx))

#### [MODIFY] `frontend/src/pages/public/PropertiesPage.jsx`
- **Dynamic Header Spacing:**
  - Listen to `header-visibility` event dispatched by `Header.jsx`:
    ```javascript
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    useEffect(() => {
      const handleHeaderVisibility = (e) => {
        setIsHeaderVisible(e.detail?.isVisible ?? true);
      };
      window.addEventListener('header-visibility', handleHeaderVisibility);
      return () => window.removeEventListener('header-visibility', handleHeaderVisibility);
    }, []);
    ```
  - Replace `<div className="h-[80px] shrink-0" />` with an animated/transitioning spacer:
    ```jsx
    <div 
      className={`shrink-0 transition-all duration-300 ease-in-out ${
        isHeaderVisible ? 'h-[80px]' : 'h-0'
      }`} 
    />
    ```
- **Immersive Viewport Real Estate:**
  - Wrap the search toolbar in a sticky frosted container (`sticky top-0 z-30 backdrop-blur-md bg-[#FBFBF9]/90 border-b border-slate-200/60 transition-all`).
  - Container height expands smoothly to fill full `h-screen` when header scrolls away, giving the cadastral map and property list maximum vertical immersion.
- **Bidirectional Map Synchronization:**
  - Pass `hoveredPropertyId` and `selectedPropertyId` to each `PropertyCard`:
    ```jsx
    <PropertyCard
      property={property}
      variant="vertical"
      isSelected={selectedPropertyId === property.id}
      isHovered={hoveredPropertyId === property.id}
      onMouseEnter={() => setHoveredPropertyId(property.id)}
      onMouseLeave={() => setHoveredPropertyId(null)}
    />
    ```
  - Map marker clicks trigger smooth scrolling to `property-card-${property.id}` with a temporary Spruce Teal focus pulse.

---

## Verification Plan

### Automated Tests
1. **Unit Tests for PropertyCard:**
   ```powershell
   npm run test --prefix frontend -- PropertyCard.test.jsx
   ```
2. **Page Regression Tests:**
   ```powershell
   npm run test --prefix frontend -- StatusBadge BrokerProperties BrokerPropertyDetail PropertyQuickEditDrawer propertyService
   ```
3. **Playwright E2E Test:**
   ```powershell
   powershell -Command "cd frontend; npx playwright test property.spec.ts"
   ```

### Manual & Browser Verification (Playwright MCP)
1. **Header Collapse Verification:**
   - Navigate to `http://localhost:5173/properties`.
   - Scroll page and observe top spacer transition from `80px` to `0px` without content jump or blank space.
   - Capture screenshot: `properties-header-collapsed-layout.png`.
2. **Property Card Status Visuals:**
   - Verify Active listings display clean Teal badge.
   - Verify Under Contract and Sold test items display Amber and Slate badges with appropriate image styling.
   - Capture screenshot: `properties-status-cards-immersive.png`.
3. **Map-Card Hover Sync:**
   - Hover card and verify map marker highlights.
   - Click map pin and verify smooth scroll to the active property card.
