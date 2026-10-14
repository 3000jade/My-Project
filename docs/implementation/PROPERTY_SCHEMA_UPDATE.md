---
id: property-schema-update
project: Human Shelter Realty
scope: Property data model and validation compatibility
status: proposed-not-approved
references:
  - property.schema.ts
  - property.service.ts
  - property.controller.ts
  - property.routes.ts
  - design.md
---

# Property Schema Update: Validation and Controlled Editing

## Goal
Improve the **existing** property schema for efficient storage, consistent field meanings, accurate listing data, and safe Supabase operations. This document is an **AI IDE implementation instruction and proposal**, **not** permission to edit source code or run migrations.

**Workflow: INSPECT → VALIDATE → PROPOSE → USER APPROVAL → IMPLEMENT → TEST → REPORT.**

**Do not modify any project files, schemas, data, or database objects before explicit approval.**

## 1. Inspect existing implementation (read-only)

1. Read `property.schema.ts`, `property.service.ts`, `property.controller.ts`, `property.routes.ts`, and shared `PropertyItem` / `StandardStatus` types. Discover their actual paths in the repository.
2. Inspect Supabase migrations or generated database types for the **real** `properties`, `property_media`, and `property_confidential` tables; identify other related tables, foreign keys, indexes, constraints, and RLS policies. The TypeScript Zod schema is **not** proof of database columns.
3. Inspect frontend Add Property, Edit Property, Property Listings, and Property Details components and their actual API calls.
4. Examine authentication, role middleware, agent ownership checks, and API response shapes. Check Git status and pre-existing uncommitted changes.
5. Report unknown or unavailable sources as **UNVERIFIED**, never infer that they exist.

## 2. Baseline facts from supplied files

- `createPropertySchema` requires `title` (trimmed, at least 3 characters) and positive numeric `price`. `location` and `specs` are optional objects; if `location` is provided, `address` and `city` are required.
- `specs` includes overlapping fields (`beds` / `bedroomsTotal`, `baths` / `bathroomsTotalInteger`, `sqft` / `livingArea`). Both measurement units and display precedence need clear rules.
- There are **two** status systems: `standardStatus` (`Draft`, `Pending Approval`, `Active`, `Active Under Contract`, `Pending`, `Closed`, `Canceled`, `Expired`) and `status` (`available`, `pending`, `sold`). Avoid renaming or deleting either until mapping and data migration are approved.
- The service maps a broad flat Supabase `properties` row into nested `location` and `specs` response objects; it also references `property_media` and `property_confidential` in detail retrieval.
- The service currently has `SEED_PROPERTIES`, an in-memory fallback, placeholder property fields, hardcoded agent identity, and misleading success paths after some database failures. These violate the **no mock data** requirement; propose safe fixes separately and test callers.
- `POST` validates with `createPropertySchema`. `PUT` currently does not use an equivalent update body schema. `GET` is public, and modifying routes have role middleware; property ownership and public visibility constraints must be verified independently.

## 3. Proposed efficient schema (not an assumed existing database)

Aim for the **smallest** normalized structure justified by actual page workflows and observed query needs.

| Proposed table | Role | Implementation guidance |
|---|---|---|
| `properties` | Core identity, title, type, transaction, pricing, publication/availability, ownership and timestamps | **Keep existing table and IDs**; map before altering |
| `property_locations` | Address, subdivision, city, province, postal code, coordinates | Optional extraction; avoid unnecessary joins if current schema performs adequately |
| `property_specifications` | Beds, baths, area + unit, parking, stories, condition, year built | Define authoritative fields before any backfill |
| `property_media` | Photos/videos/floor plans with ordering and captions | Reuse existing table if validated; no duplicate images table |
| `property_confidential` | Restricted seller contacts, instructions and codes | Keep separate and ensure strict backend access |
| `features` and `property_features` | Reusable amenity catalog and associations | Optional; justify against existing string arrays |
| `property_rooms` | Per-room dimensions/details | Optional, only if needed by actual screens |
| `property_status_history` | Auditable manual status changes | Coordinate with existing Audit Trail module; do not duplicate audit functionality |

**Do not create these tables merely because they appear in this proposal.** Prefer improving existing structures where appropriate.

### Main `properties` fields to evaluate

- `id`: preserve actual PK type and existing references; do not assume UUID.
- `listing_id` / `listing_key`: retain existing identifiers; choose uniqueness/nullable rules after inspecting records.
- `title`, `tagline`, `public_remarks`, `property_type`, `property_sub_type`, `transaction_type`.
- `price` (nonnegative/positive per approved draft-vs-publish rules), `list_price_currency`, `original_list_price`, `association_fee`, `association_fee_frequency`, `tax_annual_amount`.
- `status`, `standard_status`, `is_featured` (verify current persistence of `isFeatured` before including).
- `created_by`, assigned agent reference (only if current permissions/workflows require it), `created_at`, `updated_at`.

**Field names and column constraints are suggestions until cross-checked against the real database.**

## 4. Schema and behavior corrections to PROPOSE

### A. Data integrity and no mock data
- Remove runtime fixture fallback on database errors or zero results; return **real empty results** for a successful empty query and **explicit errors** for failures.
- Remove hardcoded agent name / ID and fabricated property details, default photos, placeholder coordinates, address, bedroom counts, areas, and other values used to manufacture records.
- Do not report create/update/delete success unless the persistent operation has succeeded. No silent in-memory success.
- Avoid exposing confidential fields in any public response or unrestricted join.

### B. Canonical fields and units
- Inventory every existing legacy field and its consumers before choosing canonical fields.
- Propose clear precedence for bedroom and bathroom counts and distinctions between floor area, living area and lot area.
- Store measurement value **with unit**, and convert for display without corrupting stored values. Never silently treat `sqft` as square meters.
- Preserve old API fields through compatibility mapping during an approved migration.

### C. Publication and availability statuses
- Define separate meanings for **listing workflow** (`standardStatus`) and **availability** (`status`), including allowed combinations and transitions.
- Preserve the existing enums until an approved transition/migration plan is complete.
- Authorized personnel must manually update Reserved/Sold and comparable transaction statuses, subject to existing business rules.
- Restrict publication/activation approval to confirmed authorized roles; avoid unintended changes to status on unrelated updates.
- Public queries must never expose drafts, pending approval, or confidential/internal records through user-controlled filter parameters.

### D. Validation and security
- Create a distinct update validation schema or explicitly derive a safe partial schema; validate `PUT` bodies and permitted writable fields.
- Distinguish **save draft** requirements from **publish** requirements where approved. Do not weaken create validation silently.
- Confirm role permissions and property ownership before create/edit/upload/delete; privileged `supabaseAdmin` calls still require server-side authorization.
- Validate URLs, media categories, file sizes/types, coordinates, monetary ranges, and permitted enum values at the correct boundaries.
- Confirm policy for confidential documents, seller contact details, and lockbox data; ensure frontend cannot access them without permission.

## 5. Migration design (only after verification)

1. Export actual table definitions, constraints, indexes, policies and row counts without exporting private data into documentation.
2. Create a **field mapping matrix**: old database column → old API field → proposed canonical field → UI consumer → migration action.
3. Identify nullable values, invalid existing records, orphaned references, and conflicting statuses; do not invent replacements.
4. Propose non-destructive, versioned migrations: add columns/tables → backfill deterministically → dual-read/compatibility where necessary → switch verified code → remove deprecated fields in a **separate** approved phase.
5. Prepare backup/rollback steps; verify that an actual restore mechanism exists before applying changes.
6. Assess potential downtime, query cost, RLS changes and impact on existing live data.
7. Create only indexes justified by verified filters/queries (e.g., created time, workflow status, agent ownership, price, city search). Assess query plans before and after.

## 6. Mandatory validation report BEFORE editing

The AI IDE must output a table for each proposed field or change:

| Item | Existing evidence (path/table/column) | Current behavior | Proposed change | Compatibility impact | Status |
|---|---|---|---|---|---|
| [name] | [source] | [verified behavior] | [proposal] | [affected consumers] | VERIFIED / PARTIAL / PROPOSED / UNVERIFIED |

Also list:
- The existing entity relationship outline and approved target ER diagram.
- Exact paths for files that would be changed.
- API/request/response and frontend form impact.
- RLS/permission risks, persistence risks and status mapping risks.
- Migration SQL plan (review only), backup/rollback plan and test plan.
- Explicit decisions required from the user.

**STOP HERE and ask for approval. Do not edit files or execute SQL.**

## 7. Controlled implementation AFTER approval

- Change only approved files and database objects.
- Preserve unrelated pages, established routes, auth, IDs, values and existing records.
- Never add sample/seed/demo data to production paths.
- Separate database migration approval from source-code refactor approval when their impacts differ.
- If a missing dependency or new breaking change is discovered, stop and request renewed approval.
- Keep changes modular and compatible with `design.md` and page-specific `.md` files, without adding page UI requirements to this schema document.

## 8. Verification and acceptance criteria

- [ ] New and existing property records round-trip through API and database without field loss.
- [ ] Empty queries return an empty list and correct count, not fixtures.
- [ ] Database errors surface as failures, not fake success.
- [ ] Update/delete/upload respect authentication, roles and ownership.
- [ ] Public searches exclude unpublished and confidential data.
- [ ] Agent identity is read from real authorized records or omitted if unavailable.
- [ ] Both status fields follow approved mappings; manual status changes are recorded appropriately.
- [ ] Numeric areas and currencies have explicit, preserved units.
- [ ] Media metadata and confidential fields follow verified storage and access rules.
- [ ] All existing Add/Edit/Listing/Details flows remain compatible.
- [ ] Migration, unit, integration and relevant RLS tests run; report actual results and untested scenarios.
- [ ] Modified files, applied migration IDs, and rollback instructions are documented.

## AI IDE Activation Prompt

> Read `PROPERTY_SCHEMA_UPDATE.md`, the current property schema/service/controller/routes, shared property types, Supabase schema/migrations, and affected UI components. Inspect and validate first. Present a field mapping and safe schema optimization proposal with exact affected files, risks, migrations and tests. **Do not modify any code or database before I explicitly approve.** Never use mock data.
