# Database Pipeline & API Route Audit Specification

**Date:** 2026-10-18  
**Approach:** Approach 1 - Dedicated Modular Scripts  
**Status:** Approved by User  

---

## 1. Overview & Objectives

This specification defines three dedicated, production-grade scripts designed to automate database lifecycle management, full-stack field parity verification, and API route health auditing for the CP_kerby Luxury Architectural Real Estate Platform:

1. **Database Cleanup Script (`clean-database.ts` via `npm run db:clean`)**:
   Safely and systematically purges all transactional and listing records from the database in strict foreign-key order while preserving all user accounts, credentials, and reference tables intact.

2. **Full-Field Data Push Verification Script (`push-all-data.ts` via `npm run db:push-data`)**:
   Authenticates against the live backend API and pushes complete, production-grade property, inquiry, and appointment payloads exercising **100% of frontend fields** (from `BrokerCreateListings.jsx`, `propertyService.js`, and `RegisterPage.jsx`). It asserts that no fields are rejected by Zod validation, dropped during controller/service mapping, or lost in PostgreSQL/Supabase tables.

3. **API Route Health & Logic Audit Script (`test-api-routes.ts` via `npm run test:api-routes`)**:
   Systematically issues requests to all registered Express API routes, validating HTTP status codes, latency, payload flows, and error handling, and emitting a clean diagnostic table.

---

## 2. Database Cleanup Specification (`clean-database.ts`)

### Target Tables & Foreign Key Deletion Order
The cleanup script executes deletions in the following sequence using `supabaseAdmin` to avoid foreign key constraint violations:

| Step | Table | Identification Key | Rationale / Dependency |
|---|---|---|---|
| 1 | `property_rooms` | `id` | Dependent on `properties.id` |
| 2 | `property_media` | `id` | Dependent on `properties.id` |
| 3 | `property_images` | `id` | Dependent on `properties.id` |
| 4 | `property_confidential` | `property_id` | Dependent on `properties.id` |
| 5 | `property_edit_requests` | `id` | Dependent on `properties.id` (if present) |
| 6 | `property_audit_log` | `id` | Dependent on `properties.id` (if present) |
| 7 | `inquiries` | `id` | References `properties.id` |
| 8 | `appointments` | `id` | References `properties.id` and `profiles.id` |
| 9 | `notifications` | `id` | Independent transactional ledger |
| 10 | `sales` | `id` | Transactional sales records |
| 11 | `properties` | `id` | Root entity for listings |

### Preservation Guarantees
- `public.profiles` is **never deleted**. All verified brokers, agents, admins, and clients remain intact.
- `auth.users` is **never deleted**.
- `public.property_types` is **preserved** as a static reference catalog.

### Verification & Logging
- Inspects row counts before deletion.
- Executes targeted deletions using `.not(idCol, 'is', null)`.
- Re-verifies row counts after deletion, ensuring a confirmed count of 0.
- Prints a clear summary table to standard output.

---

## 3. Full-Field Data Push Specification (`push-all-data.ts`)

### Authentication & Authorization
- Obtains an active JWT Bearer token by authenticating as a broker/admin user via `POST /api/auth/login`.
- If no existing user session is provided via command arguments, it uses the primary test broker credentials or creates/ensures a valid test broker account via `supabaseAdmin`.

### Comprehensive Property Payload (100% Frontend Parity)
The payload submitted to `POST /api/properties` covers every field defined in the frontend forms (`BrokerCreateListings.jsx`) and normalized by `toApiPayload`:

- **General Information:**
  - `title`: `"The Glass Pavilion at Forbes Park"`
  - `tagline`: `"A Masterpiece of Cantilevered Glass & Minimalist Travertine"`
  - `price`: `285000000`
  - `formattedPrice`: `"₱285,000,000"`
  - `listPriceCurrency`: `"PHP"`
  - `originalListPrice`: `295000000`
  - `associationFee`: `45000`
  - `associationFeeFrequency`: `"Monthly"`
  - `taxAnnualAmount`: `120000`
  - `standardStatus`: `"Active"`
  - `status`: `"available"`
  - `isFeatured`: `true`
  - `architecturalStyle`: `"Modernist Glass Pavilion"`
  - `publicRemarks`: `"An architectural tour de force situated on a private promontory..."`

- **Location Specification:**
  - `address`: `"42 Narra Avenue, Forbes Park"`
  - `unparsedAddress`: `"42 Narra Avenue, Forbes Park, Makati City, Metro Manila"`
  - `subdivisionName`: `"Forbes Park South"`
  - `buildingName`: `"Pavilion A"`
  - `city`: `"Makati"`
  - `state`: `"Metro Manila"`
  - `stateOrProvince`: `"Metro Manila"`
  - `postalCode`: `"1219"`
  - `region`: `"National Capital Region"`
  - `regionPsgcCode`: `"1300000000"`
  - `provincePsgcCode`: `"1376000000"`
  - `cityPsgcCode`: `"1376020000"`
  - `barangay`: `"Forbes Park"`
  - `barangayPsgcCode`: `"137602005"`
  - `coordinates`: `{ lat: 14.5492, lng: 121.0384 }`

- **Architectural Specifications (`specs`):**
  - `beds`: `5`
  - `baths`: `6`
  - `bedroomsTotal`: `5`
  - `bathroomsTotalInteger`: `6`
  - `bathroomsFull`: `5`
  - `bathroomsHalf`: `2`
  - `storiesTotal`: `3`
  - `sqft`: `1250`
  - `livingArea`: `1250`
  - `livingAreaUnits`: `"Square Meters"`
  - `lotSizeArea`: `2100`
  - `lotSizeUnits`: `"Square Meters"`
  - `propertyType`: `"Villa / Estate"`
  - `propertyTypeId`: `4`
  - `propertySubType`: `"Single Family Residence"`
  - `yearBuilt`: `2024`
  - `parkingTotal`: `8`
  - `parkingCovered`: `6`
  - `parkingOpen`: `2`
  - `transactionType`: `"For Sale"`
  - `propertyCondition`: `"Brand New / Turnkey"`

- **Rooms (`rooms`):**
  - Room 1: Primary Bedroom, Level: Second, 8m x 6m, Features: `['En-Suite Spa Bath', 'Walk-In Dressing Suite', 'Private Balcony']`
  - Room 2: Living Room, Level: Main, 14m x 9m, Features: `['Double Height Ceiling', 'Travertine Fireplace', 'Floor-to-Ceiling Glazing']`
  - Room 3: Kitchen, Level: Main, 7m x 5m, Features: `['Gaggenau Appliances', 'Calacatta Marble Island', 'Butler Pantry']`
  - Room 4: Home Office, Level: Main, 5m x 4m, Features: `['Acoustic Paneling', 'Custom Millwork']`

- **Media (`media` & `property_images`):**
  - Photo 1: Primary Façade URL (`orderIndex: 1`, `mediaCategory: 'Photo'`)
  - Photo 2: Great Room Interior URL (`orderIndex: 2`, `mediaCategory: 'Photo'`)
  - FloorPlan 1: Ground Level Architectural Blueprint (`orderIndex: 3`, `mediaCategory: 'FloorPlan'`)
  - VirtualTour 1: 3D Matterport Space (`orderIndex: 4`, `mediaCategory: 'VirtualTour'`)

- **Confidential Information (`confidential`):**
  - `privateRemarks`: `"Security codes shared with verified listing broker only."`
  - `showingInstructions`: `"24-hour advance notice required for security escort."`
  - `lockboxType`: `"Smart Electronic Keypad"`
  - `lockboxLocation`: `"North Guard Post Gate A"`
  - `lockboxCode`: `"7894#"`
  - `buyerAgencyCompensation`: `"3.0% Commission"`
  - `sellerDirectPhone`: `"+63 917 555 0199"`
  - `sellerDirectEmail`: `"owner.forbes@example.com"`
  - `expirationDate`: `"2027-12-31"`

### Transactional Pipeline (Inquiry & Appointment Flow)
After creating the property, the script executes:
1. `POST /api/inquiries` referencing the new property ID with client details.
2. `POST /api/appointments` requesting a private showing for this property.
3. Queries `GET /api/properties/:id` and validates that all returned fields match the submitted payload.

---

## 4. API Route Flow & Logic Audit Specification (`test-api-routes.ts`)

### Route Matrix to Audit
| Endpoint | Method | Expected Status | Purpose |
|---|---|---|---|
| `/api/health` | GET | 200 | System & Database Health check |
| `/api/auth/login` | POST | 200 | Authentication & Token issuance |
| `/api/auth/me` | GET | 200 | Token verification & profile payload |
| `/api/properties` | GET | 200 | Listing catalogue with pagination |
| `/api/properties/count` | GET | 200 | Aggregate listing count |
| `/api/properties?city=Makati` | GET | 200 | Query filtering verification |
| `/api/properties/:id` | GET | 200 | Deep property lookup with expanded relations |
| `/api/valuations` | GET | 200 | Valuation engine endpoint |
| `/api/valuations/estimate` | POST | 200 | Algorithmic property valuation calculation |
| `/api/inquiries` | GET / POST | 200 / 201 | Inquiries triage and lead capture |
| `/api/agents` | GET | 200 | Active agents directory |
| `/api/agents/consultants` | GET | 200 | Curated consultant list |
| `/api/appointments` | GET / POST | 200 / 201 | Scheduled private tours |
| `/api/profile` | GET | 200 | Current user profile |
| `/api/notifications` | GET | 200 | Real-time notification feed |
| `/api/sales` | GET | 200 | Sales conveyance ledger |
| `/api/dashboard/stats` | GET | 200 | Executive KPI statistics |
| `/api/maps/geocode` | GET | 200 | Geocoding service proxy |
| `/api/drive/status` | GET | 200 / 503 | External Google Drive connectivity check |
| `/api/mail/status` | GET | 200 / 503 | External Gmail/SMTP connectivity check |

### Error Handling & Degradation Resilience
- External services (Google Drive, Gmail, WhatsApp) are audited for graceful failure handling (i.e. returning a structured JSON status response without throwing an unhandled exception or crashing the server).
- Any failing route or schema mismatch is flagged with an explicit diagnosis in the final audit table.

---

## 5. NPM Script Integration

In `backend/package.json`:
- `"db:clean": "tsx src/scripts/clean-database.ts"`
- `"db:push-data": "tsx src/scripts/push-all-data.ts"`
- `"test:api-routes": "tsx src/scripts/test-api-routes.ts"`
