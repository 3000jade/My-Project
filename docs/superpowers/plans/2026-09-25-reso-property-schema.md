# Implementation Plan: RESO 2.0 Property Listings Schema Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the **RESO Data Dictionary 2.0** standard into the PostgreSQL/Supabase property listings module with non-destructive schema migration, PostGIS spatial geography, confidential data isolation via RLS, media sync triggers, shared TypeScript interfaces, and hybrid REST/OData query translation.

**Architecture:** A four-table relational architecture (`properties`, `property_confidential`, `property_media`, `property_rooms`) in PostgreSQL/Supabase. Confidential broker fields are strictly separated via RLS. The backend service translates both human-friendly REST parameters and RESO OData query parameters (`$filter`, `$select`, `$expand`) into Supabase queries with automated field redaction for non-agent callers.

**Tech Stack:** PostgreSQL 16+, PostGIS, Supabase RLS, Express v5, TypeScript, Node.js, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-25-reso-property-schema-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-25-reso-property-schema-design.md)

---

## Global Constraints

- **Migration Safety**: Must use non-destructive `ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ...` preserving all existing property rows and IDs.
- **Client Confidentiality (RESO Redaction)**: Never return `PrivateRemarks`, lockbox codes, showing instructions, or broker commission splits to clients or anonymous callers.
- **Media Backward Compatibility**: Keep `images TEXT[]` on `public.properties` synchronized with `public.property_media` via trigger so existing frontend components do not break.
- **Status Lifecycle Gating**: Only users with role `broker` or `admin` can approve a listing into `Active` status.
- **Dual-Unit & Multi-Currency**: Store measurement units (`Square Meters` vs `Square Feet`) and currency (`PHP` vs `USD`) explicitly per RESO DD 2.0 conventions.
- **Git Safety Gate**: NEVER execute `git push`, force-push (`--force`), or publish branches to remote git repositories.

---

## User Review Required

> [!IMPORTANT]
> **PostGIS Extension**: The migration executes `CREATE EXTENSION IF NOT EXISTS "postgis";` to compute the generated `coordinates_geom` column for radius and boundary queries. If running in a Supabase/Postgres instance where PostGIS is not enabled, standard latitude/longitude fallback indexing will remain active.

> [!NOTE]
> **Zero Breaking Changes**: Existing endpoints (`GET /api/properties`, `GET /api/properties/:id`, `GET /api/properties/count`) retain full backward compatibility with existing frontend callers while adding optional support for `$filter`, `$select`, and `$expand`.

---

## Proposed Changes

```
CP_kerby/
├── backend/
│   └── src/
│       ├── models/
│       │   ├── reso_schema_migration.sql   [NEW] Standalone migration script
│       │   ├── supabase_schema.sql         [MODIFY] Master schema update
│       │   └── property.model.ts           [MODIFY] Enhanced RESO model
│       ├── services/
│       │   ├── property.service.ts         [MODIFY] Hybrid REST + OData translation & redaction
│       │   └── resoQueryParser.ts          [NEW] OData v4 filter & select query builder
│       ├── controllers/
│       │   └── property.controller.ts      [MODIFY] Pass auth context & OData query handling
│       └── schemas/
│           └── property.schema.ts          [MODIFY] Zod validation for RESO fields
├── shared/
│   └── types/
│       └── property.ts                     [MODIFY] RESO DD 2.0 interfaces & DTOs
└── test files/
    └── backend/
        ├── services/
        │   └── reso.query.test.ts          [NEW] OData parser & query translation tests
        └── controllers/
            └── property.controller.test.ts [MODIFY] Verify RESO fields & redaction
```

---

## Task Breakdown

### Task 1: PostgreSQL DDL Migration & Master Schema Update

**Files:**
- Create: `backend/src/models/reso_schema_migration.sql`
- Modify: `backend/src/models/supabase_schema.sql:71-128`

**Interfaces:**
- Produces: `public.properties` (with RESO columns, PostGIS geom), `public.property_confidential`, `public.property_media`, `public.property_rooms`, status lifecycle trigger `trg_enforce_property_status`, and media sync trigger `trg_sync_property_media`.

- [x] **Step 1: Create the standalone migration script `reso_schema_migration.sql`**
  - Implement non-destructive column additions to `public.properties`.
  - Add generated PostGIS `coordinates_geom` column with GiST index.
  - Create table `public.property_confidential` with strict RLS (accessible only by `agent`, `broker`, `admin`).
  - Create table `public.property_media` with category enum constraint and composite index `(property_id, order_index ASC)`.
  - Create table `public.property_rooms` with room types, dimensions, and index on `property_id`.
  - Create status enforcement trigger function `enforce_property_status_lifecycle()`.
  - Create media array backfill logic: `INSERT INTO property_media ... SELECT id, unnest(images) ... ON CONFLICT DO NOTHING`.
  - Create media sync trigger function to keep `properties.images` updated when `property_media` changes.
  - Create composite search index `idx_properties_client_search` and full-text search GIN index `idx_properties_fts`.

- [x] **Step 2: Update `backend/src/models/supabase_schema.sql`**
  - Update master schema so any new database provisions immediately instantiate the complete RESO architecture.

- [x] **Step 3: Verification**
  - Run SQL syntax validation using Node/pg or dry-run script.

---

### Task 2: Shared & Backend Type Contracts

**Files:**
- Modify: `shared/types/property.ts:1-48`
- Modify: `backend/src/models/property.model.ts:1-28`

**Interfaces:**
- Consumes: Task 1 database column definitions.
- Produces: `ResoPropertyItem`, `PropertyConfidential`, `PropertyMediaItem`, `PropertyRoomItem`, `ResoODataQuery`.

- [x] **Step 1: Write type definitions in `shared/types/property.ts`**
  - Define `ResoStandardStatus`: `'Draft' | 'Pending Approval' | 'Active' | 'Active Under Contract' | 'Pending' | 'Closed' | 'Canceled' | 'Expired'`.
  - Define `ResoMediaItem`: `mediaKey`, `mediaUrl`, `mediaCategory`, `orderIndex`, `shortDescription`.
  - Define `ResoRoomItem`: `roomType`, `roomLevel`, `roomLength`, `roomWidth`, `roomDimensionsUnits`, `roomFeatures`.
  - Define `ResoConfidentialItem`: `privateRemarks`, `showingInstructions`, `lockboxType`, `lockboxCode`, `buyerAgencyCompensation`.
  - Extend `PropertyItem` to include `listingKey`, `listingId`, `standardStatus`, `listPriceCurrency`, `livingAreaUnits`, `publicRemarks`, `customResoAttributes`.
  - Define `ResoODataParams`: `$filter`, `$select`, `$expand`, `$orderby`, `$top`, `$skip`.

- [x] **Step 2: Update `backend/src/models/property.model.ts`**
  - Mirror the shared contract in the backend model interface.

- [x] **Step 3: Update `backend/src/schemas/property.schema.ts`**
  - Extend Zod validation schemas (`createPropertySchema`, `queryPropertySchema`) to validate RESO fields safely without breaking existing queries.

---

### Task 3: RESO Query Parser & Property Service Upgrade

**Files:**
- Create: `backend/src/services/resoQueryParser.ts`
- Modify: `backend/src/services/property.service.ts:1-200`
- Modify: `backend/src/controllers/property.controller.ts:1-90`

**Interfaces:**
- Consumes: `ResoODataParams`, `PropertyFilterQuery`, `shared/types/property.ts`.
- Produces: `PropertyService.listProperties()` with OData support and confidential redaction, `PropertyService.getProperty()` with `$expand=media,rooms,confidential`.

- [x] **Step 1: Implement `backend/src/services/resoQueryParser.ts`**
  - Parse OData `$filter` expressions (e.g. `City eq 'Pasig' and ListPrice le 10000000`).
  - Parse `$select` field projections to limit query payloads.
  - Parse `$expand` tokens (`media`, `rooms`, `confidential`).
  - Sanitize and convert OData expressions into Supabase PostgREST query chains safely (preventing SQL injection).

- [x] **Step 2: Upgrade `backend/src/services/property.service.ts`**
  - Integrate `resoQueryParser` inside `listProperties()`.
  - Support fallback to memory/mock fixtures with full RESO mock data when Supabase is in offline/seed mode.
  - Implement confidential field redaction: strip `property_confidential` fields if `userRole NOT IN ('agent', 'broker', 'admin')`.
  - Support joining `property_media` (ordered by `order_index ASC`) and `property_rooms`.

- [x] **Step 3: Update `backend/src/controllers/property.controller.ts`**
  - Extract auth user role from `req.user` (if authenticated) and pass down to service for redaction enforcement.
  - Accept query parameters including `$filter`, `$select`, `$expand`, `$top`, `$skip`.

---

### Task 4: Automated Testing & Verification Suite

**Files:**
- Create: `test files/backend/services/reso.query.test.ts`
- Modify: `test files/backend/controllers/property.controller.test.ts`

- [x] **Step 1: Write unit tests in `test files/backend/services/reso.query.test.ts`**
  - Test RESO OData query parsing (`$filter`, `$select`, `$expand`).
  - Test redaction: verify confidential fields are omitted for public/client queries.
  - Test dual unit and currency formatting (`PHP` / `USD`, `sqm` / `sqft`).

- [x] **Step 2: Update `test files/backend/controllers/property.controller.test.ts`**
  - Verify `GET /api/properties` returns new RESO attributes (`listingKey`, `listingId`, `standardStatus`, `livingAreaUnits`).
  - Verify `GET /api/properties/:id` handles `$expand=media,rooms`.
  - Verify broker approval lifecycle validation when updating `standard_status` to `'Active'`.

- [x] **Step 3: Execute full backend test suite**
  - Run `npm --prefix backend test` and confirm all 14+ test suites pass with 0 failures.

---

## Verification Plan

### Automated Tests
```powershell
# 1. Run full backend Vitest suite
npm --prefix backend test

# 2. Run targeted RESO query test suite
npm --prefix backend test -- reso.query.test.ts
```

### Manual Verification
1. **Migration Verification**: Verify `reso_schema_migration.sql` executes cleanly without breaking existing property rows or foreign key relations.
2. **API Backward Compatibility**: Verify calling `GET /api/properties` without query parameters returns standard property cards with `images[]` populated.
3. **RESO OData Query Verification**: Call `GET /api/properties?$filter=City eq 'Pasig'&$select=ListingId,ListPrice,LivingArea&$expand=media` and verify structured response.
4. **Confidential Isolation**: Call `GET /api/properties/:id` as unauthenticated client and verify `confidential` remarks/lockbox are omitted.
