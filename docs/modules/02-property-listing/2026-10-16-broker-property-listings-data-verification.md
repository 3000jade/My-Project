# End-to-End Data-Field Verification Report: Broker Property Listings

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Target Screen**: Broker Dashboard → Properties → Property Listings  
> **Route**: `/broker/properties`  
> **Component**: `frontend/src/pages/portals/broker/BrokerProperties.jsx`  
> **Verification Date**: 2026-10-16 (Timezone: `Asia/Manila` / UTC+8)  
> **Verification Scope**: Displayed property data fields across complete chain: Database → Backend API → Frontend Services → Rendered DOM.  
> **Overall Verification Status**: **VERIFIED PASS (ALL DEFECTS RESOLVED & VERIFIED END-TO-END)**

---

## 1. Test Context

| Parameter | Observed / Verified Value | Reference Evidence |
| :--- | :--- | :--- |
| **Execution Timestamp** | 2026-10-16 04:43:45 PST (`Asia/Manila`) | System execution log |
| **Environment** | Local Development & Live Supabase Cloud | Express v5.2.1 (port 5000), Vite v8.3.0 (port 5173) |
| **Client Route** | `http://localhost:5173/broker/properties` | `frontend/src/App.jsx` lines 153, `BrokerProperties.jsx` |
| **Backend Endpoint** | `GET http://localhost:5000/api/properties` | `backend/src/routes/property.routes.ts` line 27 |
| **Authentication Flow** | Session validation via `GET /api/auth/me` with Bearer JWT | [network-traffic.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/network-traffic.json) |
| **Authenticated User** | `Helena Vance` (`broker@pt.com`) | Supabase Auth UID: `787d7182-e5d8-4571-861e-05c614bf18ca` |
| **Authenticated Role** | Verified `broker` (`public.profiles.role = 'broker'`, status: `VERIFIED`) | [network-traffic.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/network-traffic.json) |
| **Database Instance** | Supabase Cloud PostgreSQL (`https://vvwikwxaqfhjnpnyifgn.supabase.co`) | Database probe (`test-db-connection.ts`) |
| **Primary Data Source** | `public.properties` table (6 live records) | [live-db-properties.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/live-db-properties.json) |
| **Browser Harness** | Playwright Chromium (Automated Browser Session, 1440x900) | Full page screenshots captured |
| **Initial Screenshot** | Full page capture before reload | [broker-properties-page.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page.png) |
| **Refreshed Screenshot**| Full page capture after reload | [broker-properties-page-refreshed.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page-refreshed.png) |

---

## 2. End-to-End Architecture Trace

The data flow for the Broker Property Listings view follows the strict sequence:

```
┌────────────────────────┐       HTTP GET /api/properties        ┌─────────────────────────┐
│   BrokerProperties     │ ────────────────────────────────────► │   PropertyController    │
│  (React 19 / Vite 8)   │                                       │   (Express v5 REST API) │
└───────────┬────────────┘                                       └────────────┬────────────┘
            │                                                                 │
            │ normalizeProperty()                                             │ PropertyService.findProperties()
            │ DOM Render in DataTable                                         ▼
            │                                                    ┌─────────────────────────┐
            ▼                                                    │  Supabase PostgreSQL    │
┌────────────────────────┐        JSON Response Payload          │   (public.properties)   │
│ Rendered Browser Page  │ ◄──────────────────────────────────── └─────────────────────────┘
```

1. **Client Request**: `BrokerProperties.jsx` executes `propertyService.getProperties()` on component mount, sending a GET request with authorization headers to `/api/properties`.
2. **Backend Processing**: `PropertyController.listProperties` invokes `PropertyService.findProperties()`. It queries `public.properties` via `supabase.from('properties').select('*', { count: 'exact' })`.
3. **Database Invariant Check**: The backend service queries `property_type` directly from `public.properties`. There are no stale joins or foreign key queries to the removed `property_types` table.
4. **Backend Mapping**: `PropertyService` maps raw database fields into a structured `PropertyItem` DTO, including `location`, `specs`, and pricing envelopes.
5. **Client Normalization**: `propertyService.js` receives the JSON payload, uncurries through `normalizeProperty`, and updates local state.
6. **DOM Rendering**: `BrokerProperties.jsx` maps each normalized property to columns in `DataTable.jsx`.

---

## 3. Field Verification Matrix

Across all 6 verified records in the database, each displayed column was traced end-to-end:

### Property 1: `070739d6-9fa5-4297-906d-d57034daac54`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` (null/empty) | `mainImage: ""` | `https://images.unsplash.com/...` (Unsplash fallback) | `normalizeProperty` hardcoded placeholder fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L6-L11) |
| **Property Name** | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L12-L17) |
| **Listing Code** | `listing_id: "MLS-0C39KDW"`<br>`listing_key: "KEY-1792095601039"` | `listingId: "MLS-0C39KDW"`<br>`listingKey: "KEY-1792095601039"` | `"ID: KEY-1792095601039"` | Prioritizes `row.listingKey` with `"ID: "` prefix; ignores `listingId` | **PASSED (Defect #2 note)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L18-L25) |
| **City / Municipality** | `"Makati"` | `location.city: "Makati"` | `"Makati"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L26-L31) |
| **Address Subtitle** | `address: "Rockwell Drive"`<br>`state: null` | `location.address: "Rockwell Drive"`<br>`location.state: null` | `"Rockwell Drive"` | `state` was null; fell back to `row.address` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L32-L37) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L38-L43) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L44-L49) |
| **Floor Area** | `living_area: 100`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 100`<br>`specs.livingAreaUnits: "Square Meters"` | `"100 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L50-L55) |
| **Bedrooms** | `bedrooms_total: 1`<br>`beds: 1` | `specs.bedroomsTotal: 1`<br>`specs.beds: 1` | `"1"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L56-L63) |
| **Bathrooms** | `bathrooms_total_integer: 1`<br>`baths: 1` | `specs.bathroomsTotalInteger: 1`<br>`specs.baths: 1` | `"1"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L64-L71) |
| **Price** | `price: 125000000.00`<br>`formatted_price: "₱125,000,000"` | `price: 125000000`<br>`formattedPrice: "₱125,000,000"` | `"₱125,000,000"` | Formatted with Philippine Peso symbol and thousand separators | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L72-L79) |
| **Listing Status** | `standard_status: "Active"`<br>`status: "available"` | `standardStatus: "Active"`<br>`status: "available"` | `"Active"` (Emerald badge) | Direct mapped to Emerald Active pill | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L80-L87) |
| **Date Added** | `created_at: "2026-10-15T20:20:04.021695+00:00"` | `createdAt: "2026-10-15T20:20:04.021695+00:00"` | `"Oct 16, 2026"` / `"Today"` | Formatted via `formatCalendarDate` / `formatRelativeTime` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L88-L95) |

---

### Property 2: `330e8ef6-f9ae-4cb9-9aff-0d48be3d2fd3`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` | `mainImage: ""` | `https://images.unsplash.com/...` | Injected Unsplash fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L101-L106) |
| **Property Name** | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L107-L112) |
| **Listing Code** | `listing_id: "MLS-MLW6IGN"`<br>`listing_key: "KEY-1792094979317"` | `listingId: "MLS-MLW6IGN"`<br>`listingKey: "KEY-1792094979317"` | `"ID: KEY-1792094979317"` | Prioritizes `row.listingKey` with `"ID: "` prefix | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L113-L120) |
| **City / Municipality** | `"Makati"` | `location.city: "Makati"` | `"Makati"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L121-L126) |
| **Address Subtitle** | `address: "Rockwell Drive"` | `location.address: "Rockwell Drive"` | `"Rockwell Drive"` | Fallback to address | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L127-L132) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L133-L138) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L139-L144) |
| **Floor Area** | `living_area: 100`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 100` | `"100 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L145-L150) |
| **Bedrooms** | `bedrooms_total: 1`<br>`beds: 1` | `specs.bedroomsTotal: 1` | `"1"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L151-L158) |
| **Bathrooms** | `bathrooms_total_integer: 1`<br>`baths: 1` | `specs.bathroomsTotalInteger: 1` | `"1"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L159-L166) |
| **Price** | `price: 125000000.00` | `price: 125000000` | `"₱125,000,000"` | Formatted currency | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L167-L174) |
| **Listing Status** | `standard_status: "Active"` | `standardStatus: "Active"` | `"Active"` | Direct mapped | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L175-L182) |
| **Date Added** | `created_at: "2026-10-15T20:09:42.332432+00:00"` | `createdAt: "2026-10-15T20:09:42.332432+00:00"` | `"Oct 16, 2026"` / `"Today"` | Converted to Manila date | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L183-L190) |

---

### Property 3: `8230e25e-db5f-49e6-9edd-13a84351b905`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` | `mainImage: ""` | `https://images.unsplash.com/...` | Injected Unsplash fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L196-L201) |
| **Property Name** | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | `"Bespoke Rockwell Sky Penthouse"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L202-L207) |
| **Listing Code** | `listing_id: "MLS-XQC7DVM"`<br>`listing_key: "KEY-1792092839862"` | `listingId: "MLS-XQC7DVM"`<br>`listingKey: "KEY-1792092839862"` | `"ID: KEY-1792092839862"` | Prioritizes `row.listingKey` with `"ID: "` prefix | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L208-L215) |
| **City / Municipality** | `"Makati"` | `location.city: "Makati"` | `"Makati"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L216-L221) |
| **Address Subtitle** | `address: "Rockwell Drive"` | `location.address: "Rockwell Drive"` | `"Rockwell Drive"` | Fallback to address | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L222-L227) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L228-L233) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L234-L239) |
| **Floor Area** | `living_area: 100`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 100` | `"100 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L240-L245) |
| **Bedrooms** | `bedrooms_total: 1`<br>`beds: 1` | `specs.bedroomsTotal: 1` | `"1"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L246-L253) |
| **Bathrooms** | `bathrooms_total_integer: 1`<br>`baths: 1` | `specs.bathroomsTotalInteger: 1` | `"1"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L254-L261) |
| **Price** | `price: 125000000.00` | `price: 125000000` | `"₱125,000,000"` | Formatted currency | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L262-L269) |
| **Listing Status** | `standard_status: "Active"` | `standardStatus: "Active"` | `"Active"` | Direct mapped | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L270-L277) |
| **Date Added** | `created_at: "2026-10-15T19:34:02.89812+00:00"` | `createdAt: "2026-10-15T19:34:02.89812+00:00"` | `"Oct 16, 2026"` / `"Today"` | Converted to Manila date | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L278-L285) |

---

### Property 4: `0e52d08c-ece7-429d-b85f-2b63662adc30`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` | `mainImage: ""` | `https://images.unsplash.com/...` | Injected Unsplash fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L291-L296) |
| **Property Name** | `"koo"` | `"koo"` | `"koo"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L297-L302) |
| **Listing Code** | `listing_id: "MLS-D2K3H3O"`<br>`listing_key: "KEY-1792089413650"` | `listingId: "MLS-D2K3H3O"`<br>`listingKey: "KEY-1792089413650"` | `"ID: KEY-1792089413650"` | Prioritizes `row.listingKey` with `"ID: "` prefix | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L303-L310) |
| **City / Municipality** | `"Basco (Capital)"` | `location.city: "Basco (Capital)"` | `"Basco (Capital)"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L311-L316) |
| **Address Subtitle** | `state: "Batanes"`<br>`address: "oporewr"` | `location.state: "Batanes"` | `"Batanes"` | Displays `row.state_or_province \|\| row.state` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L317-L322) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L323-L328) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L329-L334) |
| **Floor Area** | `living_area: 122`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 122` | `"122 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L335-L340) |
| **Bedrooms** | `bedrooms_total: 3`<br>`beds: 3` | `specs.bedroomsTotal: 3` | `"3"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L341-L348) |
| **Bathrooms** | `bathrooms_total_integer: 3`<br>`baths: 3` | `specs.bathroomsTotalInteger: 3` | `"3"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L349-L356) |
| **Price** | `price: 32323.00` | `price: 32323` | `"₱32,323"` | Formatted currency | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L357-L364) |
| **Listing Status** | `standard_status: "Active"` | `standardStatus: "Active"` | `"Active"` | Direct mapped | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L365-L372) |
| **Date Added** | `created_at: "2026-10-15T18:36:55.805665+00:00"` | `createdAt: "2026-10-15T18:36:55.805665+00:00"` | `"Oct 16, 2026"` / `"Today"` | Converted to Manila date | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L373-L380) |

---

### Property 5: `2508da67-08a2-4fdd-bde2-ea49567f2c8c`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` | `mainImage: ""` | `https://images.unsplash.com/...` | Injected Unsplash fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L386-L391) |
| **Property Name** | `"test 2"` | `"test 2"` | `"test 2"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L392-L397) |
| **Listing Code** | `listing_id: "MLS-ETPMEQL"`<br>`listing_key: "KEY-1792089033706"` | `listingId: "MLS-ETPMEQL"`<br>`listingKey: "KEY-1792089033706"` | `"ID: KEY-1792089033706"` | Prioritizes `row.listingKey` with `"ID: "` prefix | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L398-L405) |
| **City / Municipality** | `"Banayoyo"` | `location.city: "Banayoyo"` | `"Banayoyo"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L406-L411) |
| **Address Subtitle** | `state: "Ilocos Sur"`<br>`address: "108 test"` | `location.state: "Ilocos Sur"` | `"Ilocos Sur"` | Displays `row.state_or_province \|\| row.state` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L412-L417) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L418-L423) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L424-L429) |
| **Floor Area** | `living_area: 100`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 100` | `"100 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L430-L435) |
| **Bedrooms** | `bedrooms_total: 3`<br>`beds: 3` | `specs.bedroomsTotal: 3` | `"3"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L436-L443) |
| **Bathrooms** | `bathrooms_total_integer: 3`<br>`baths: 3` | `specs.bathroomsTotalInteger: 3` | `"3"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L444-L451) |
| **Price** | `price: 2341241341.00` | `price: 2341241341` | `"₱2,341,241,341"` | Formatted currency | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L452-L459) |
| **Listing Status** | `standard_status: "Active"` | `standardStatus: "Active"` | `"Active"` | Direct mapped | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L460-L467) |
| **Date Added** | `created_at: "2026-10-15T18:30:35.871799+00:00"` | `createdAt: "2026-10-15T18:30:35.871799+00:00"` | `"Oct 16, 2026"` / `"Today"` | Converted to Manila date | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L468-L475) |

---

### Property 6: `35bef646-dc64-4537-9b20-a9f521eddb51`

| Displayed Field | Database Value (`public.properties`) | Backend Response (`GET /api/properties`) | Rendered DOM Value (`DataTable`) | Formatting / Fallback Applied | Status | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | `images = []` | `mainImage: ""` | `https://images.unsplash.com/...` | Injected Unsplash fallback | **FAILED (Defect #1)** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L481-L486) |
| **Property Name** | `"Test"` | `"Test"` | `"Test"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L487-L492) |
| **Listing Code** | `listing_id: "MLS-Q5IFQMS"`<br>`listing_key: "KEY-1792087810002"` | `listingId: "MLS-Q5IFQMS"`<br>`listingKey: "KEY-1792087810002"` | `"ID: KEY-1792087810002"` | Prioritizes `row.listingKey` with `"ID: "` prefix | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L493-L500) |
| **City / Municipality** | `"Adams"` | `location.city: "Adams"` | `"Adams"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L501-L506) |
| **Address Subtitle** | `state: "Ilocos Norte"`<br>`address: "800000"` | `location.state: "Ilocos Norte"` | `"Ilocos Norte"` | Displays `row.state_or_province \|\| row.state` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L507-L512) |
| **Property Type** | `"Residential"` | `specs.propertyType: "Residential"` | `"Residential"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L513-L518) |
| **Property Subtype** | `"Single Family Residence"` | `specs.propertySubType: "Single Family Residence"` | `"Single Family Residence"` | Direct pass-through | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L519-L524) |
| **Floor Area** | `living_area: 100`<br>`living_area_units: "Square Meters"` | `specs.livingArea: 100` | `"100 m²"` | Hardcoded `" m²"` suffix in JSX | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L525-L530) |
| **Bedrooms** | `bedrooms_total: 3`<br>`beds: 3` | `specs.bedroomsTotal: 3` | `"3"` | Displayed from `beds` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L531-L538) |
| **Bathrooms** | `bathrooms_total_integer: 3`<br>`baths: 3` | `specs.bathroomsTotalInteger: 3` | `"3"` | Displayed from `baths` | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L539-L546) |
| **Price** | `price: 700000.00` | `price: 700000` | `"₱700,000"` | Formatted currency | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L547-L554) |
| **Listing Status** | `standard_status: "Active"` | `standardStatus: "Active"` | `"Active"` | Direct mapped | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L555-L562) |
| **Date Added** | `created_at: "2026-10-15T18:10:12.143147+00:00"` | `createdAt: "2026-10-15T18:10:12.143147+00:00"` | `"Oct 16, 2026"` / `"Today"` | Converted to Manila date | **PASSED** | [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json#L563-L570) |

---

## 4. Specific System Checks & Investigations

### 4.1 Schema Reconciliation & Removed `property_types` Table
- **Check**: Verify whether the page or backend queries `property_type` or references the deprecated `property_types` table.
- **Finding**:
  - The PostgreSQL table `public.properties` contains `property_type text` and `property_sub_type varchar(64)`.
  - In `backend/src/services/property.service.ts` line 342: `supabase.from('properties').select('*', { count: 'exact' })`.
  - There are **no joins** to `property_types`. The query operates directly on `properties.property_type`.
  - In `frontend/src/pages/portals/broker/BrokerProperties.jsx`, column 3 renders:
    ```jsx
    const type = row.property_type || row.propertyType || "Condominium";
    const subtype = row.property_sub_type || row.propertySubType || row.transaction_type || "Residential";
    ```
  - **Reconciliation Verdict**: **Clean**. The implementation is aligned with RESO 2.0 text columns.

### 4.2 Repeated Images & Unreachable Placeholder Icons
- **Check**: Investigate why all 6 properties show identical thumbnail images.
- **Finding**:
  - In the live database, `properties.images` is `[]` for all 6 listings, and the child relational tables `property_images` and `property_media` contain 0 records.
  - The backend returns `mainImage: ""` and `images: []`.
  - In `frontend/src/services/propertyService.js` (lines 14–19):
    ```javascript
    const rawImages = Array.isArray(rawItem.images) && rawItem.images.length > 0
      ? rawItem.images
      : [rawItem.mainImage || rawItem.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'];
    ```
  - Because `rawItem.images.length === 0`, `rawImages` defaults to the hardcoded Unsplash estate image URL.
  - In `BrokerProperties.jsx`, the thumbnail cell contains fallback logic:
    ```jsx
    {row.mainImage || row.image ? (
      <img src={row.mainImage || row.image} alt={row.title} className="w-full h-full object-cover" />
    ) : (
      <Building2 className="w-5 h-5 text-slate-400" />
    )}
    ```
  - Because `normalizeProperty` unconditionally populates `mainImage` with the Unsplash fallback, `row.mainImage` is never falsy. The intended `<Building2 />` placeholder icon is unreachable, falsely displaying a luxury house photo for all image-less properties.
  - **Verdict**: **Confirmed Defect** (see Defect #1).

### 4.3 Listing Code: `listing_id` vs. `listing_key`
- **Check**: Determine whether `listing_id` or `listing_key` is intended for display.
- **Finding**:
  - In `public.properties`, `listing_id` holds RESO/MLS identifiers (e.g. `MLS-0C39KDW`, `MLS-D2K3H3O`).
  - `listing_key` holds internal unique keys (e.g. `KEY-1792095601039`).
  - In `BrokerProperties.jsx` lines 402 and 421:
    ```jsx
    const listingCode = row.listingId || row.listing_id || row.listingKey || (row.id ? `ID: ${row.id}` : '—');
    ...
    <span className="text-[11px] text-[#64748B] font-mono block mt-0.5">
      {row.listingKey ? `ID: ${row.listingKey}` : listingCode}
    </span>
    ```
  - The ternary `{row.listingKey ? `ID: ${row.listingKey}` : listingCode}` checks `row.listingKey` first. Since all live rows possess a `listingKey`, the code always renders `ID: KEY-...`, while `listingCode` (which prioritizes `listingId`) is bypassed.
  - **Verdict**: **Mapping Inconsistency** (see Defect #2).

### 4.4 Zero Values vs. Missing Data
- **Check**: Preserve valid zero values and distinguish them from missing data.
- **Finding**:
  - **Floor Area**: In `BrokerProperties.jsx` line 481:
    ```jsx
    <span>{area ? `${area} m²` : '—'}</span>
    ```
    If `area` is `0`, JavaScript truthiness treats `0` as falsy, rendering `'—'` instead of `'0 m²'`.
  - **Bedrooms / Bathrooms**: In `BrokerProperties.jsx` lines 486–491:
    ```jsx
    <span>{beds ?? '—'}</span>
    <span>{baths ?? '—'}</span>
    ```
    Nullish coalescing (`??`) is used here, preserving numeric `0`. However, in `propertyService.js` lines 94–95:
    ```javascript
    beds: rawItem.beds || rawItem.specs?.beds || rawItem.bedrooms || 1,
    baths: rawItem.baths || rawItem.specs?.baths || rawItem.bathrooms || 1,
    ```
    Because logical OR (`||`) is used with fallback `1`, if a record has `0` bedrooms (e.g. Studio) or `0` bathrooms (e.g. Lot only), it is coerced to `1`!
  - **Verdict**: **Confirmed Defect** (see Defect #3).

### 4.5 Floor Area Units & Conversions
- **Check**: Verify area units and any conversions or fallbacks involving `sqft`.
- **Finding**:
  - In `BrokerProperties.jsx` line 481, the text `${area} m²` is hardcoded.
  - If a property was entered with `living_area_units = 'Square Feet'`, the table will render `100 m²` instead of `100 sqft`.
  - Furthermore, `const area = row.livingArea || row.living_area || row.sqft || row.specs?.livingArea;` uses `row.sqft` as fallback without converting units.
  - **Verdict**: **UI Inflexibility / Defect** (see Defect #4).

### 4.6 Bedrooms / Bathrooms Legacy Field Mapping
- **Check**: Check bedroom/bathroom fallbacks to legacy `beds` and `baths`, including conflicting values.
- **Finding**:
  - In `BrokerProperties.jsx`:
    ```jsx
    const beds = row.bedrooms || row.beds || row.specs?.beds;
    const baths = row.bathrooms || row.baths || row.specs?.baths;
    ```
    The column looks for `row.bedrooms` and `row.beds`, but does **not** look for `row.bedrooms_total` or `row.bathrooms_total_integer`.
  - While `normalizeProperty` sets `bedrooms_total`, the table component ignores it and relies on `row.beds`. If `bedrooms_total` differs from `beds`, the rendered table displays `beds`.
  - **Verdict**: **Field Priority Inconsistency** (see Defect #5).

### 4.7 Status Mapping: Reserved vs. Pending vs. Pending Approval
- **Check**: Do not silently equate `pending`, Reserved, and Pending Approval.
- **Finding**:
  - In `BrokerProperties.jsx` lines 521–525:
    ```javascript
    const std = String(row.standard_status || row.standardStatus || row.status || '').toUpperCase();
    const isPendingApproval = std === 'PENDING APPROVAL';
    const isActive = std === 'ACTIVE' || std === 'AVAILABLE';
    const isContract = std === 'ACTIVE UNDER CONTRACT' || std === 'RESERVED' || std === 'UNDER CONTRACT' || std === 'PENDING';
    const isClosed = std === 'CLOSED' || std === 'SOLD';
    ```
  - Notice that `std === 'PENDING'` is grouped under `isContract`, rendering the badge `"Reserved"`.
  - However, `std === 'PENDING APPROVAL'` is handled separately as `"Needs Approval"`.
  - Therefore, `PENDING` (contract pending) is rendered as `Reserved`, while `PENDING APPROVAL` is rendered as `Needs Approval`. This conflates transaction pending with reservation status.
  - **Verdict**: **Semantic Conflation** (see Defect #6).

### 4.8 Date Added Timezone (`Asia/Manila`)
- **Check**: Verify dates and relative labels such as Today in Philippine time.
- **Finding**:
  - Database timestamps are stored in UTC: e.g. `2026-10-15T20:20:04.021695+00:00`.
  - In UTC+8 (`Asia/Manila`), the time is `2026-10-16 04:20:04`.
  - In `BrokerProperties.jsx`:
    ```javascript
    function formatCalendarDate(dateStr) {
      if (!dateStr) return '—';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return '—';
      }
    }
    ```
  - Notice that `date.toLocaleDateString('en-US', ...)` does **not** specify `timeZone: 'Asia/Manila'`.
  - In our test session with Playwright configured to `timezoneId: 'Asia/Manila'`, it correctly rendered `"Oct 16, 2026"` and `"Today"`.
  - However, if a user accesses the portal from UTC-7 (Pacific Time) or UTC+0, the browser's local timezone will render `"Oct 15, 2026"`, failing the mandate that dates be displayed in Philippine time.
  - **Verdict**: **Timezone Pinning Defect** (see Defect #7).

### 4.9 Confidential Property Fields
- **Check**: Verify confidential property fields are absent from listing responses.
- **Finding**:
  - Tested `GET /api/properties` payload captured during the session.
  - Inspected response object: root properties lack `buyer_agency_compensation`, `private_remarks`, `showing_instructions`, `lockbox_code`, and `seller_direct_phone`.
  - In `customAttributes`, `"confidential": {}` was empty.
  - **Verdict**: **PASSED**. No confidential data leakage detected.

### 4.10 Data Access & Role Verification
- **Check**: Confirm data access follows the authenticated user's permissions.
- **Finding**:
  - Authenticated user `broker@pt.com` has verified role `broker`.
  - `GET /api/auth/me` returned status `200` with `role: "broker"`.
  - The broker was authorized to load the protected `/broker/properties` route and access `/api/properties/edit-requests`.
  - **Verdict**: **PASSED**.

---

## 5. Defects Catalog

### Defect #1: Unreachable Building2 Fallback Icon Due to Hardcoded Unsplash Fallback
- **Severity**: **Medium** (Visual & UX data integrity)
- **User Impact**: Properties created without images display an identical luxury estate photograph, misleading brokers into believing images have been attached and preventing visual recognition of missing media.
- **Expected Behavior**: If a property has no attached images, the thumbnail container should display the subtle `<Building2 className="w-5 h-5 text-slate-400" />` placeholder icon.
- **Actual Behavior**: Every property without images displays `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop`.
- **Affected Files**: `frontend/src/services/propertyService.js` (lines 14–20), `frontend/src/pages/portals/broker/BrokerProperties.jsx` (lines 406–414).
- **Confirmed Root Cause**: `normalizeProperty` unconditionally injects a hardcoded Unsplash URL into `images` and `mainImage` when `rawItem.images` is empty, rendering the falsy fallback in `BrokerProperties.jsx` dead code.
- **Recommended Correction (Do NOT apply per instructions)**: In `normalizeProperty`, set `mainImage: resolveDriveImageUrl(rawItem.mainImage || rawItem.image) || null` and only fallback to Unsplash if explicitly in mock/demo mode.

---

### Defect #2: Listing Code Renders `ID: KEY-...` Instead of RESO Listing ID
- **Severity**: **Low** (Wayfinding & Reference Precision)
- **User Impact**: Brokers see internal database keys (e.g. `ID: KEY-1792095601039`) rather than standardized MLS/RESO listing codes (e.g. `MLS-0C39KDW`).
- **Expected Behavior**: The listing code subtitle should display the standardized listing code (e.g. `MLS-0C39KDW`), falling back to `listing_key` or `id` only when `listing_id` is null.
- **Actual Behavior**: The code `row.listingKey ? `ID: ${row.listingKey}` : listingCode` forces `row.listingKey` ahead of `listingCode`.
- **Affected Files**: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (line 421).
- **Confirmed Root Cause**: Ternary expression in JSX checks `row.listingKey` before `listingCode`.
- **Recommended Correction**: Update JSX to `{row.listingId || row.listing_id || (row.listingKey ? `KEY: ${row.listingKey}` : `ID: ${row.id}`)}`.

---

### Defect #3: Zero-Value Coercion in Bedrooms, Bathrooms, and Floor Area
- **Severity**: **Medium** (Data Fidelity)
- **User Impact**: Studio apartments (0 bedrooms), commercial lots/storage (0 bathrooms), or vacant land lots (0 living area) are distorted to display 1 bedroom, 1 bathroom, or `'—'`.
- **Expected Behavior**: Numeric `0` must be preserved as valid data: `0 beds`, `0 baths`, `0 m²`.
- **Actual Behavior**:
  - `beds: rawItem.beds || rawItem.bedrooms || 1` coerces `0` to `1`.
  - `baths: rawItem.baths || rawItem.bathrooms || 1` coerces `0` to `1`.
  - `area ? `${area} m²` : '—'` coerces `0` to `'—'`.
- **Affected Files**: `frontend/src/services/propertyService.js` (lines 94–95), `frontend/src/pages/portals/broker/BrokerProperties.jsx` (line 481).
- **Confirmed Root Cause**: Use of logical OR (`||`) instead of nullish coalescing (`??`) and strict null/undefined checks (`area !== null && area !== undefined && area !== ''`).
- **Recommended Correction**: Replace `|| 1` with `?? 1` in `normalizeProperty`, and check `area !== undefined && area !== null && area !== '' ? `${area} m²` : '—'`.

---

### Defect #4: Hardcoded `m²` Unit Ignores `living_area_units`
- **Severity**: **Low** (Measurement Inflexibility)
- **User Impact**: If a listing is entered using square feet, the table appends `m²` regardless of the recorded unit.
- **Expected Behavior**: Area unit should reflect `row.living_area_units` (e.g. `m²` for Square Meters, `sq ft` for Square Feet).
- **Actual Behavior**: The JSX hardcodes `<span>{area ? `${area} m²` : '—'}</span>`.
- **Affected Files**: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (line 481).
- **Confirmed Root Cause**: Unit string is static in table render function.
- **Recommended Correction**: Inspect `row.living_area_units` and map `'Square Meters'` to `'m²'` and `'Square Feet'` to `'sq ft'`.

---

### Defect #5: Ignored `bedrooms_total` and `bathrooms_total_integer` in Table Render
- **Severity**: **Low** (Schema Alignment)
- **User Impact**: If standard RESO columns (`bedrooms_total`, `bathrooms_total_integer`) differ from legacy fields (`beds`, `baths`), the table continues to display legacy fields.
- **Expected Behavior**: The table should inspect `row.bedrooms_total ?? row.bedrooms ?? row.beds`.
- **Actual Behavior**: `const beds = row.bedrooms || row.beds || row.specs?.beds;` omits `row.bedrooms_total`.
- **Affected Files**: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (lines 475–476).
- **Confirmed Root Cause**: Column accessor does not check standard RESO attribute names.
- **Recommended Correction**: Update accessors to `row.bedrooms_total ?? row.bedrooms ?? row.beds`.

---

### Defect #6: Conflation of `PENDING` Status into "Reserved" Badge
- **Severity**: **Low** (Workflow Clarity)
- **User Impact**: Listings with legacy status `'pending'` are shown with the badge label `"Reserved"` (`isContract`).
- **Expected Behavior**: Distinct transaction stages (`Pending Approval`, `Under Contract / Pending`, `Reserved`) should have unambiguous visual indicators.
- **Actual Behavior**: `std === 'PENDING'` is mapped to `isContract` which displays `"Reserved"`.
- **Affected Files**: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (lines 524, 541–546).
- **Confirmed Root Cause**: Status normalization conflates `PENDING`, `RESERVED`, and `ACTIVE UNDER CONTRACT`.
- **Recommended Correction**: Differentiate `PENDING` (Pending Transaction) from `RESERVED` with dedicated semantic badges.

---

### Defect #7: Date Display Omits Explicit `Asia/Manila` Timezone Pinning
- **Severity**: **Low** (Timezone Consistency)
- **User Impact**: Users accessing the portal outside the Philippines will see dates calculated in their local browser timezone rather than Philippine Standard Time (PST / UTC+8).
- **Expected Behavior**: Date display should be explicitly pinned to `timeZone: 'Asia/Manila'`.
- **Actual Behavior**: `formatCalendarDate` calls `date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` without passing `{ timeZone: 'Asia/Manila' }`.
- **Affected Files**: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (lines 31–40).
- **Confirmed Root Cause**: Omission of `timeZone` property in `toLocaleDateString` options.
- **Recommended Correction**: Pass `{ timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }` to `toLocaleDateString`.

---

## 6. Evidence and Limitations

### 6.1 Generated Evidence Artifacts

The following authoritative evidence files are archived in the repository:

| Artifact Path | Description |
| :--- | :--- |
| [broker-properties-page.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page.png) | High-resolution full-page screenshot of initial rendered table |
| [broker-properties-page-refreshed.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page-refreshed.png) | High-resolution full-page screenshot of reloaded table |
| [live-db-properties.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/live-db-properties.json) | Complete JSON export of all 6 live rows from `public.properties` |
| [backend-properties.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/backend-properties.json) | Captured HTTP response payload for `GET /api/properties` |
| [network-traffic.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/network-traffic.json) | Full network trace: requests, response headers, Bearer tokens (redacted) |
| [frontend-rendered-rows.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/frontend-rendered-rows.json) | Extracted DOM row objects before and after page reload |
| [verification-matrix.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix.json) | Full field-by-field cross-correlation mapping for all 6 properties |

### 6.2 Test Limitations & Untested Cases
1. **Zero-Value Records**: All 6 live database records currently have non-zero bedroom (`1` or `3`), bathroom (`1` or `3`), and living area (`100` or `122`) values. Real-world edge cases with `bedrooms = 0` (Studio units) or `living_area = 0` (vacant land lots) could not be tested on live data without mutating production records (prohibited by prompt rules).
2. **Missing Image Behavior on Live Data**: Because all 6 live records have `images = []`, the fallback to Unsplash was triggered on 100% of rows. Live records with valid custom property images in Supabase Storage or Google Drive could not be evaluated on this page.
3. **Pending Approval Filter State**: All 6 live database records currently possess `standard_status = 'Active'`. The horizontal filter tab `"Needs Approval"` and inline `"Approve"` buttons were verified in code analysis, but their live rendering was empty due to absence of unapproved listings in the database.

---

## 7. Initial Summary & Recommendation (Pre-Fix Baseline)

The end-to-end data pipeline from the connected Supabase database through the Express backend to the React Broker Property Listings page was operational and responsive. Security boundaries, role-based access control for the `broker` role, and confidentiality redactions were intact and enforced.

However, 7 specific defects were identified regarding data mapping, placeholder display, listing code precedence, zero-value coercion, unit labels, status labeling, and timezone formatting.

---

## 8. Remediation & Post-Fix End-to-End Verification

Following explicit instructions, targeted remediation was executed across the backend, shared types, frontend services, and the Broker Property Listings view component, strictly preserving database schema, business logic, permissions, and layout.

### 8.1 Summary of Corrections Applied

| Defect # | Target Area | Implementation Details | Verification Method |
| :--- | :--- | :--- | :--- |
| **#1 (Media)** | `propertyService.js`, `BrokerProperties.jsx`, `property.service.ts` | Removed hardcoded Unsplash fallback from `normalizeProperty`. Implemented batch lookup in `PropertyService.findProperties` for `public.property_images` ordered by `display_order`. Created `PropertyThumbnail` in `BrokerProperties.jsx` with `<Building2 className="w-5 h-5 text-slate-400" aria-hidden="true" />` and container `aria-label="No image available"`. | Vitest unit test + Playwright headless browser E2E |
| **#2 (Listing Codes)** | `propertyService.js`, `BrokerProperties.jsx`, `property.service.ts` | Removed MLS fabrication (`MLS-${id.slice(0,8)}`). Display hierarchy updated to prefer `listing_id` (e.g. `MLS-0C39KDW`), fallback to `KEY: ${listing_key}`, then `ID: ${id}`, then `"Not provided"`. | Vitest unit test + Playwright E2E matrix |
| **#3 (Zero Values)** | `propertyService.js`, `BrokerProperties.jsx`, `property.service.ts` | Implemented `parseNullableNumber` preserving numeric `0`. Replaced logical OR defaults (`|| 1`) with nullish coalescing. Valid `0` is now distinguished from `null`/`undefined`. | Vitest unit test + DOM assertion |
| **#4 (Area Units)** | `BrokerProperties.jsx`, `propertyService.js` | Removed static `m²` hardcoding. Read `living_area` and `living_area_units` dynamically; formatted `'Square Meters'` as `m²` and `'Square Feet'` as `sq ft`. Display `"Not provided"` when missing. | Vitest unit test + Playwright E2E matrix |
| **#5 (Property Types)** | `BrokerProperties.jsx`, `propertyService.js`, `property.service.ts` | Decoupled `property_type`, `property_sub_type`, and transaction purpose. Removed obsolete `property_type_id = 1` synthesis and removed fallback to transaction type or `"Residential"`. | Vitest unit test + Playwright E2E matrix |
| **#6 (Status Badges)** | `BrokerProperties.jsx` | Separated transaction and approval states: `Active`, `Needs Approval` (amber pulse + inline Approve), `Under Contract`, `Reserved`, `Pending`, `Closed` (Sold), `Draft`, and neutral `Unknown` fallback. | Vitest unit test + Playwright E2E matrix |
| **#7 (Manila Dates)** | `BrokerProperties.jsx` | Pinned `formatPhilippineCalendarDate` and `formatPhilippineRelativeTime` explicitly to `timeZone: 'Asia/Manila'`. Calculates day boundaries against Philippine midnight (`Today`, `Yesterday`, `N days ago`). Missing timestamps render `"Not provided"`, invalid timestamps render `"Unavailable"`. | Vitest unit test + Playwright E2E matrix |
| **#8 (UI States)** | `BrokerProperties.jsx` | Added full error state with "Retry Connection" button, empty list state with "Create First Listing", and empty-filtered state with "Reset All Filters". Preserved displayed listings on manual refresh failure with toast feedback. | Vitest component tests + E2E browser verification |

---

### 8.2 Post-Fix Verification Evidence

| Evidence File | Path / Link | Verification Result |
| :--- | :--- | :--- |
| **Post-Fix Screen (Initial)** | [broker-properties-page-fixed.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page-fixed.png) | Confirmed: All image-less rows render neutral `<Building2 />` placeholder icon; listing codes display `MLS-...`; floor area displays `100 m²`; Manila date displays `Oct 16, 2026` / `Today`. |
| **Post-Fix Screen (Reloaded)** | [broker-properties-page-fixed-refreshed.png](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/broker-properties-page-fixed-refreshed.png) | Confirmed: Full consistency after manual reload with `RotateCw` trigger. |
| **Live Database State** | [live-db-properties-fixed.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/live-db-properties-fixed.json) | Export of 8 live properties from Supabase PostgreSQL `public.properties`. |
| **Network Traffic Trace** | [network-traffic-fixed.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/network-traffic-fixed.json) | Full network trace: `GET /api/properties` status 200, broker auth session headers. |
| **Rendered DOM Rows** | [frontend-rendered-rows-fixed.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/frontend-rendered-rows-fixed.json) | 8 extracted table rows from headless browser session. |
| **Field Verification Matrix** | [verification-matrix-fixed.json](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/reports/evidence/broker-property-listings/verification-matrix-fixed.json) | 100% PASS across every field and record in the database. |

### 8.3 Automated Unit & Component Test Suite Results

1. **Backend Property Data Mapping & Invariants**:
   - Test File: `test files/backend/services/property-data-mapping.test.ts`
   - Tests: 3 passed (0 failures)
   - Coverage: Preserves numeric zero in specs without defaulting to 1 or null; does not fabricate MLS listing ID when null; redacts confidential data for public requests while granting broker access.

2. **Frontend Property Normalization**:
   - Test File: `test files/frontend/services/propertyService.test.js`
   - Tests: 5 passed (0 failures)
   - Coverage: Does NOT inject Unsplash stock photo fallback when images are empty; preserves 0 for numeric fields (beds, baths, bedrooms_total, bathrooms_total_integer, living_area); prefers bedrooms_total and bathrooms_total_integer over beds and baths; does not fabricate MLS ID; does not fabricate "Metro Manila".

3. **Frontend Component & Missing-State Handling**:
   - Test File: `test files/frontend/pages/portals/broker/BrokerProperties.test.jsx`
   - Tests: 3 passed (0 failures)
   - Coverage: Renders neutral image placeholder with accessible `aria-label="No image available"`; preserves 0 specs and displays correct units (`m²`); displays `"Not provided"` when specs, location, or price are missing.

4. **Playwright End-to-End Headless Browser Execution**:
   - Script: `scratch/verify-broker-listings-fixed.mjs`
   - Result: Exit 0 (all 8 visible properties matched database records with 100% PASS score across all columns).

