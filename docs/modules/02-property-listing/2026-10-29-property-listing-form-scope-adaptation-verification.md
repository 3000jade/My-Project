---
module: 02-property-listing
date: 2026-10-29
status: verified
affected_files:
  - frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.jsx
  - frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.test.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx
  - frontend/src/services/propertyService.js
  - frontend/src/services/propertyService.test.js
  - frontend/src/App.jsx
  - frontend/e2e/schema-v1-property-intake.spec.ts
  - docs/REQUIREMENTS_SPECIFICATION.md
---

# Verification Record — Property Listing Form Scope Adaptation & Schema v1.0 Intake Studio

## 1. Overview & Capability Delivered

This document records the full verification of **FR-PL-022: Tailored Property Intake Studio & Schema v1.0 Asset Class Adaptation**.

The listing intake experience in `BrokerCreateListings.jsx` and `BrokerPropertyTypeSelect.jsx` has been modernized and adapted specifically to **three primary Philippine real estate asset classes**:
1. **Subdivision Lot (`residentialLot`):** Captures titled master-planned vacant lots with subdivision name, phase, block, lot, road frontage (m), depth (m), lot position / cut (`corner`, `inner`, `through`, `end`), topography / terrain (`level`, `rolling`, `sloping`, `elevated`), facing orientation (`east`, `west`, `north`, `south`), cadastral survey reference, and TCT status, while completely omitting residential bedroom/room dimensions.
2. **House and Lot (`houseAndLot`):** Captures single-family and multi-storey detached homes with dual area metrics (Lot Area + Floor Area), stories, bedrooms, bathrooms, carport, maid's room, and TCT title.
3. **Condominium (`condominium`):** Captures high-rise strata suites with building name, tower/wing, floor level, unit number, usable floor area, balcony details, dedicated parking slot numbers, and Condominium Certificate of Title (CCT), while completely omitting lot area and frontage.

### Key Enhancements & Compliance
- **Strict shadcn Architecture:** Built on shadcn primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, built-in `Button` variants, `Input`, `Label`, `Alert`), with clean Tailwind v4 gap layout (`flex flex-col gap-*`, `grid gap-6`, eliminating all legacy `space-y-*` and `space-x-*` constructs).
- **Real-World Broker Terminology:** Stepper milestones aligned to professional real estate intake:
  1. `Listing Overview`
  2. `Location & Address`
  3. `Property Specifications`
  4. `Pricing & Terms`
  5. `Features & Amenities`
  6. `Photos & Maps`
  7. `Review & Publish`
- **Supabase & RLS Alignment:** Assigned listing agent dropdown binds directly to `public.properties.list_agent_key`, establishing immediate owner management access through Supabase RLS policy `list_agent_key = auth.uid() OR created_by = auth.uid()`.
- **Zero Database Migration Dual-Envelope Architecture:** Top-level SQL columns (`sqft`, `beds`, `baths`) receive safe, calculated fallbacks (for `residentialLot`, `sqft = Math.round(lotSizeArea * 10.7639)` and `beds = 1`, `baths = 1` satisfy PostgreSQL non-null constraints) while the complete canonical Schema v1.0 JSON payload is persisted inside `custom_reso_attributes.canonicalPayload`.

---

## 2. Verification Evidence

### 2.1 Playwright Full-Stack Browser E2E Tests
All 3 end-to-end user journeys executed in Chromium against live servers (`http://localhost:5173` and `http://localhost:5000`):

```bash
cd frontend; npx playwright test schema-v1-property-intake.spec.ts
```

```text
Running 3 tests using 1 worker

[1/3] [chromium] › e2e\schema-v1-property-intake.spec.ts:33:3 › Schema v1.0 Property Intake Studio & Real-World Specifications › verifies property type selection gateway renders 3 core asset classes with shadcn cards
[2/3] [chromium] › e2e\schema-v1-property-intake.spec.ts:64:3 › Schema v1.0 Property Intake Studio & Real-World Specifications › completes full-stack residentialLot intake flow with canonical Schema v1.0 specifications
[3/3] [chromium] › e2e\schema-v1-property-intake.spec.ts:214:3 › Schema v1.0 Property Intake Studio & Real-World Specifications › verifies Condominium tailored specifications hide lot details and show strata unit details
  3 passed (25.0s)
```

**Verified Capabilities:**
1. **Selection Gateway:** Verified cards for `Subdivision Lot`, `House and Lot`, and `Condominium` with `Vacant Land`, `Single-Family`, and `Vertical Strata` badges. Verified navigation to `/broker/properties/new?type=residentialLot`.
2. **Subdivision Lot Journey:** Step 1 through Step 7 completed with `residentialLot` data (Title, Tagline, Cadastral Ref `CAD-HAV-B12-L04`, Subdivision `Havila Highlands Executive Subdivision`, Block 12, Lot 4, Lot Area 270 sqm, Frontage 15m, Depth 18m, Corner position, Level terrain, East facing, Price ₱6,480,000).
3. **Dual-Envelope Payload Verification:** Intercepted network POST to `/api/properties` confirmed:
   - `payload.title`: `"Prime Corner Lot in Havila Highlands Subdivision"`
   - `payload.price`: `6480000`
   - `payload.specs.sqft`: `2906` (`Math.round(270 * 10.7639)`)
   - `payload.customResoAttributes.canonicalPayload.schemaVersion`: `"1.0"`
   - `payload.customResoAttributes.canonicalPayload.propertyType`: `"residentialLot"`
   - `payload.customResoAttributes.canonicalPayload.propertyDetails.lotArea.value`: `270`
   - `payload.customResoAttributes.canonicalPayload.propertyDetails.frontage.value`: `15`
   - `payload.customResoAttributes.canonicalPayload.propertyDetails.depth.value`: `18`
4. **Condominium Journey:** Verified condominium branching renders building name, tower/wing, floor level, unit number, balcony details, and unit layout while completely omitting lot area and road frontage.

### 2.2 Visual Review Evidence
Full-page screenshot captured during Step 7 Review & Publish:
`C:/Users/Win11x64/.gemini/antigravity/brain/9eeb88a0-af46-42cf-a531-abe14feca154/schema-v1-property-intake-review.png` (286 KB).

### 2.3 Vitest Unit & Integration Suites
Ran complete unit and regression test suite across all 4 affected test files:

```bash
npm run test --prefix frontend -- BrokerCreateListings BrokerPropertyTypeSelect propertyService --run
```

```text
 RUN  v5.0.5 C:/Users/Win11x64/Desktop/My code space/CP_kerby/frontend

 ✓ ../test files/frontend/services/propertyService.test.js (5 tests) 10ms
 ✓ src/services/propertyService.test.js (6 tests) 40ms
 ✓ src/pages/portals/broker/BrokerPropertyTypeSelect.test.jsx (4 tests) 371ms
 ✓ src/pages/portals/broker/BrokerCreateListings.test.jsx (12 tests) 1448ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
   Start at  05:07:50
   Duration  7.90s
```

---

## 3. Traceability Matrix

| Requirement | Acceptance Criteria | Test File | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `FR-PL-022.1` | 3 primary asset cards with badges and descriptions | `BrokerPropertyTypeSelect.test.jsx`, `schema-v1-property-intake.spec.ts` | 4 unit tests + E2E pass | Verified |
| `FR-PL-022.2` | Real-world 7-step navigation stepper header with shadcn Card | `BrokerCreateListings.test.jsx`, `schema-v1-property-intake.spec.ts` | 12 unit tests + E2E pass | Verified |
| `FR-PL-022.3` | Step 1 & 2 tailored inputs (Tagline, Cadastral Ref, Subdivision / Condo branch) | `BrokerCreateListings.test.jsx`, `schema-v1-property-intake.spec.ts` | 12 unit tests + E2E pass | Verified |
| `FR-PL-022.4` | Step 3 tailored specs (`residentialLot` frontage/depth/terrain; `condominium` floor area/balcony) | `BrokerCreateListings.test.jsx`, `schema-v1-property-intake.spec.ts` | 12 unit tests + E2E pass | Verified |
| `FR-PL-022.5` | Supabase `list_agent_key` agent assignment | `propertyService.test.js`, `schema-v1-property-intake.spec.ts` | Unit tests + E2E pass | Verified |
| `FR-PL-022.6` | Dual-envelope Schema v1.0 canonical persistence with sqft fallback | `propertyService.test.js`, `schema-v1-property-intake.spec.ts` | 11 unit tests + E2E payload match | Verified |
