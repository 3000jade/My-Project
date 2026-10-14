# Property Listing Form Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an accessible, responsive 7-section property listing form adhering to the Nordic Modern Architectural design system and RESO 2.0 data specifications, preserving existing business rules, permissions, uploads, and database schemas.

**Architecture:** Standardize the primary listing wizard (`BrokerCreateListings.jsx`) into the canonical 7-section architecture (Basic Info, Location, Specifications, Pricing & Availability, Features & Amenities, Media & Documents, Review & Submit) with subtype reactivity (Land vs Condo vs Residential), enhance `propertyService.js` serialization/normalization for multi-category features and additional specs, and ensure the agent portal routes to the authenticated creation flow.

**Tech Stack:** React 19, React Router v7, Tailwind CSS v4, Leaflet / React-Leaflet, ReactQuill, Vitest.

**Spec:** `docs/implementation/PROPERTY_LISTING_FORM.md`

## Global Constraints

- **Public/Private Theme:** Administrative & portal pages utilize the crisp Daylight Light Theme (`#FBFBF9` ground, `#FFFFFF` plinths, `#0D4446` Spruce Teal, `#E76F51` Burnt Terracotta Coral CTA, `#D8DFDF` borders).
- **Control Dimensions:** Form inputs, selects, and action plinths must maintain a uniform height of `h-[54px]` (`h-13.5` / `54px`) or `h-12` (`48px`) consistently.
- **Safety & Schema:** Do NOT alter database migrations, table columns, or backend route authentication.
- **Status Decoupling:** Keep `status` (transactional: AVAILABLE, RESERVED, SOLD) strictly decoupled from `standardStatus` (publication: Draft, Pending Approval, Active, Closed).

---

### Task 1: Update `propertyService.js` and Vitest Unit Tests

**Files:**
- Modify: `frontend/src/services/propertyService.js:80-160`
- Modify: `frontend/src/services/propertyService.test.js:1-72`

**Interfaces:**
- `toApiPayload(item)`: Emits payload matching `createPropertySchema` in `backend/src/schemas/property.schema.ts`, including `interiorFeatures`, `exteriorFeatures`, `yearBuilt`, `taxAnnualAmount`, `associationFee`, and location coordinates.
- `normalizeProperty(rawItem)`: Normalizes `interior_features`, `exterior_features`, `year_built`, and coordinates.

- [ ] **Step 1: Write updated failing unit tests in `propertyService.test.js`**
- [ ] **Step 2: Run `vitest run src/services/propertyService.test.js` to observe failure**
- [ ] **Step 3: Update `toApiPayload` and `normalizeProperty` in `propertyService.js`**
- [ ] **Step 4: Re-run `vitest run src/services/propertyService.test.js` to ensure 100% pass**
- [ ] **Step 5: Verify git diff for Task 1**

---

### Task 2: Refactor `BrokerCreateListings.jsx` to 7 Logical Sections with Subtype Reactivity

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`

**Step Definition & Structure:**
- **Section 1: Basic Property Information** (Step 1)
  - Title, Property Category / Subclass, Transaction Type ('For Sale' / 'For Rent'), Rich Description, Assigned Agent, Listing Code/ID (Read-only badge).
- **Section 2: Property Location** (Step 2)
  - Interactive Leaflet Map with Nominatim Forward/Reverse Geocoding + Google Maps URL importer.
  - Complete Address, Subdivision/Building, Barangay, City, Province, Postal Code, Lat/Lng coordinates.
- **Section 3: Property Specifications** (Step 3)
  - Subtype conditional visibility:
    - *Condominium:* Reveals Floor Level, Tower Name; hides Lot Area.
    - *Land / Vacant Lot:* Hides Bedrooms, Bathrooms, Number of Floors, Tower/Floor; reveals Lot Area & Frontage/Road Access.
    - *House & Lot / Townhouse / Villa:* Shows Bedrooms, Bathrooms, Parking Slots, Stories Total, Floor Area, Lot Area, Year Built, Property Condition.
- **Section 4: Pricing and Availability** (Step 4)
  - Listing Price (PHP currency formatter), Price Term / Basis, Original List Price, HOA Association Fee & Frequency, Annual Property Tax, Negotiable flag.
- **Section 5: Features and Amenities** (Step 5)
  - Categorized amenities taxonomy: Interior Features (e.g. Smart Home, Wine Cellar, Private Elevator, Staff Quarters), Exterior Features (e.g. Swimming Pool, Garden, Covered Garage, Balcony), Community & Security (e.g. 24/7 Security, Gated Community, Clubhouse).
- **Section 6: Media and Documents** (Step 6)
  - Multi-image drag & drop uploader with Cover / Hero photo badge selector.
  - Video file or Virtual Tour URL.
  - Floor Plan / Blueprint URL.
  - Confidential Broker documents & legal notes (Private remarks, lockbox code, seller direct phone, commission split).
- **Section 7: Review and Submit** (Step 7)
  - Comprehensive inspection ledger broken down by the 6 previous sections with deep-linking "Edit Section" buttons.
  - Validation issue checklist (checking title, price, address, coordinates, and photo count).
  - Explicit Action CTAs:
    - "Save Draft" (`standardStatus: 'Draft'`, `status: 'INACTIVE'`)
    - "Publish Listing" (`standardStatus: 'Active'`, `status: 'AVAILABLE'`)

- [ ] **Step 1: Update form state structure and step definitions (1 through 7)**
- [ ] **Step 2: Implement Sections 1 to 4 with conditional rendering per property type**
- [ ] **Step 3: Implement Section 5 (Categorized features) and Section 6 (Media & Confidential)**
- [ ] **Step 4: Implement Section 7 (Interactive summary ledger with edit jump buttons)**
- [ ] **Step 5: Add unsaved changes warning (`beforeunload`) and form validation indicators**

---

### Task 3: Mount Agent Create Route in `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx:120-145`

- [ ] **Step 1: Check existing agent route definitions**
- [ ] **Step 2: Connect `<Route path="properties/create" element={<BrokerCreateListings />} />` (or alias) so agents can create listings with role-aware permissions**
- [ ] **Step 3: Verify link from `AgentProperties.jsx` to create page**

---

### Task 4: Post-Implementation Verification & Regression Testing

- [ ] **Step 1: Run Vitest test suite on `propertyService.test.js` and portal components**
- [ ] **Step 2: Run Vite build check (`npm run build` in `frontend`) to ensure zero syntax or bundle errors**
- [ ] **Step 3: Verify conditional visibility across Condominium, Land, and House & Lot**
- [ ] **Step 4: Verify draft vs publish status persistence**
