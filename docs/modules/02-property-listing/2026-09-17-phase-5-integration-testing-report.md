# Phase 5: System Integration and Testing Design Report

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Specification Reference:** `docs/Property_listings/05-system-integration-testing.md`  
**Referenced Predecessors:**  
- `01-database-schema-design.md` & `01-database-inspection-and-schema-design-report.md` (Phase 1)  
- `02-security-approval-workflow.md` & `02-security-and-approval-workflow-report.md` (Phase 2)  
- `03-backend-api-integration.md` & `phase-3-backend-integration-report.md` (Phase 3)  
- `04-frontend-workflow-integration.md` & `phase-4-frontend-workflow-report.md` (Phase 4)  
**Execution Phase:** Phase 5 (Analysis, Verification Strategy & Test Planning Only — No Execution or File Modification)  
**Status:** COMPLETE (Pending User Approval)  
**Report Date:** 2026-10-14  

---

## 1. Executive Summary & Quality Assurance Scope

This report establishes the comprehensive integration, verification, and regression prevention strategy for the Human Shelter Realty Property Listing Management Module.

The testing architecture encompasses:
1. **Database Schema & Constraint Verification:** Validating `public.property_edit_requests`, `public.property_audit_log`, partial unique indexing, and PostgreSQL stored procedures (`apply_property_edit_request`, `reject_property_edit_request`).
2. **Security & RBAC Enforcement (SEC-01 through SEC-14):** Verification of role permissions across API routes, Express middleware, and Supabase Row Level Security (RLS) policies.
3. **Backend API Contract Verification:** Testing input validation, atomic transactional execution, conflict handling, and error response envelopes.
4. **Frontend Workflow & Component Testing:** React Testing Library suites verifying the Agent 7-section proposal form, the Broker side-by-side comparison drawer, and removal of unauthorized creation controls.
5. **End-to-End Workflow Scenarios:** Multi-actor lifecycle tracing (Agent proposal ➔ Broker review ➔ Stored procedure application ➔ Immutable audit log ➔ Refreshed public inventory).

---

## 2. Existing Testing Environment Inspection

A full inspection of the existing workspace test infrastructure was conducted across both client and server layers.

### 2.1 Test Frameworks & Configurations

| Layer | Primary Framework | Test Runner Configuration | Helper Libraries & Mocking | Active Scripts |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Vitest v5.0 / Vite v8 | `frontend/vite.config.js` (jsdom environment) | `@testing-library/react` v16.3, `@testing-library/jest-dom` v7.0, `@testing-library/dom` v10.4 | `npm test` (`vitest run`), `npm run build` |
| **Backend** | Vitest v5.0 | `backend/package.json` (`ts-node`, `tsx` v4.23) | Node built-ins, Vitest mocks, Supertest/Axios adapters | `npm test` (`vitest run`), `npm run db:test` |
| **Shared / E2E**| Unified Test Tree | `test files/` (Directory holding 70+ test suites across frontend and backend) | Isolated Vitest runners targeting components, routes, and services | Vitest targeted execution |

### 2.2 Inspection Findings & Existing Test Inventory
- **Frontend Inventory Tests:** Existing suites (`test files/frontend/pages/broker/BrokerProperties.test.jsx`, `PropertyDetailModal.test.jsx`, `BrokerPropertyDetail.test.jsx`) verify table filtering, tab counts, and quick-view modals with high reliability.
- **Backend Service Tests:** Existing suites (`test files/backend/services/agent-verification-rbac.test.ts`, `agent-management-lifecycle.e2e.test.ts`) demonstrate proven patterns for mocking Express `Request`/`Response` objects and evaluating HTTP status codes.
- **Schema DDL Tests:** Existing suites (`test files/backend/models/agent-invitations.schema.test.ts`) verify SQL migration strings and DDL check constraints directly from disk.
- **Test Gap:** There are currently **zero tests** covering property edit request submission, broker approval workflows, partial unique index concurrency, or `property_audit_log` verification.

---

## 3. Database Integration Testing Plan

### 3.1 Existing Schema Preservation Verification (`DB-EXIST-01`)
- **Objective:** Verify that adding `property_edit_requests` and `property_audit_log` introduces zero breaking changes to `public.properties` or its existing 5 dependent tables (`property_confidential`, `property_media`, `property_rooms`, `inquiries`, `appointments`).
- **Assertions:**
  1. Primary key `public.properties(id)` remains `UUID`.
  2. Foreign keys `property_confidential(property_id)`, `property_media(property_id)`, `property_rooms(property_id)` remain `ON DELETE CASCADE`.
  3. Pre-existing triggers `trg_enforce_property_status` and `trg_sync_property_media` execute without syntax errors.
  4. Existing columns `original_list_price`, `association_fee`, `tax_annual_amount`, and `list_price_currency` remain present in PostgreSQL DDL and retain their types/defaults.

### 3.2 Proposed Edit Requests Table Verification (`DB-REQ-02`)
- **Objective:** Validate constraint enforcement on `public.property_edit_requests`.
- **Assertions:**
  1. Inserting a proposal with an invalid `request_status` (e.g. `'DRAFT'` or `'UNKNOWN'`) fails the `CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONFLICT'))` constraint.
  2. `property_id` foreign key cascade deletes edit proposals when the parent property is deleted.
  3. `agent_id` foreign key cascade deletes proposals if the agent profile is deleted.
  4. Omitting `proposed_changes` or `original_snapshot` fails the `NOT NULL` constraint.

### 3.3 Concurrency & Single Active Pending Request (`DB-CONCUR-03`)
- **Objective:** Validate the partial unique index `idx_single_pending_request_per_property`.
- **Test Sequence:**
  1. Insert a request for `property_id = 'P-1'` with `request_status = 'PENDING'`. (Succeeds).
  2. Attempt a second insert for `property_id = 'P-1'` with `request_status = 'PENDING'`.
  3. **Assert:** Database engine raises PostgreSQL Error `23505` (unique_violation).
  4. Update the first request to `request_status = 'APPROVED'`.
  5. Attempt a new insert for `property_id = 'P-1'` with `request_status = 'PENDING'`.
  6. **Assert:** Succeeds, because the partial index applies exclusively to `request_status = 'PENDING'`.

### 3.4 Atomic Stored Procedure Execution (`DB-RPC-04`)
- **Objective:** Verify atomic execution of `apply_property_edit_request(request_id, broker_id, notes)`.
- **Test Scenarios:**
  1. **Success Path:** Calling RPC on a valid `PENDING` request updates `public.properties` with proposed business keys, transitions request to `APPROVED`, writes a row to `public.property_audit_log`, and commits atomically.
  2. **Caller Authorization Guard:** Calling RPC with a `p_broker_id` whose profile role is `'agent'` throws exception: `"Access Denied: Only brokers and administrators can approve edit requests."` No changes are committed.
  3. **Row Locking & State Guard:** Calling RPC on a request that is already `'APPROVED'` or `'REJECTED'` throws exception: `"Cannot approve request: status is already APPROVED."`

---

## 4. Authentication and Authorization Testing (SEC-01 through SEC-14)

A dedicated security test suite will execute against both the Express API routing middleware and PostgreSQL RLS policies:

| Test ID | Test Scenario | Actor / Role | Tested Endpoint / DB Object | Expected Result | Verified Boundary |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | Unauthenticated property creation | Anonymous (No token) | `POST /api/properties` | **401 Unauthorized** | Express `requireAuth` |
| **SEC-02** | Agent attempts property creation | Agent | `POST /api/properties` | **403 Forbidden** | Express `requireRole` & Supabase RLS |
| **SEC-03** | Broker creates listing | Broker | `POST /api/properties` | **201 Created** | Express `requireRole(['broker', 'admin'])` |
| **SEC-04** | Administrator creates listing | Administrator | `POST /api/properties` | **201 Created** | Express superuser bypass |
| **SEC-05** | Agent directly updates approved listing | Agent | `PUT /api/properties/:id` | **403 Forbidden** | Express `requireRole` & Supabase RLS |
| **SEC-06** | Agent submits edit proposal for unassigned listing | Agent (`agent-1`) on Property assigned to (`agent-2`) | `POST /api/properties/:id/edit-requests` | **403 Forbidden** | Controller ownership check & RLS `WITH CHECK` |
| **SEC-07** | Assigned agent submits valid proposal | Agent (`agent-1`) on Property assigned to (`agent-1`) | `POST /api/properties/:id/edit-requests` | **201 Created** | Proposal ingestion service |
| **SEC-08** | Agent attempts to approve own proposal | Agent | `POST /api/property-edit-requests/:id/approve` | **403 Forbidden** | Express `requireRole` & RPC security check |
| **SEC-09** | Client / Buyer accesses edit requests queue | Client | `GET /api/property-edit-requests` | **403 Forbidden** | Express `requireRole` & Supabase RLS |
| **SEC-10** | Authorized broker approves proposal | Broker | `POST /api/property-edit-requests/:id/approve` | **200 OK** | RPC `apply_property_edit_request` |
| **SEC-11** | Authorized broker rejects proposal with remarks | Broker | `POST /api/property-edit-requests/:id/reject` | **200 OK** | RPC `reject_property_edit_request` |
| **SEC-12** | Direct REST mutation of audit logs | Any Authenticated User | `POST /rest/v1/property_audit_log` | **403 / Denied** | Supabase RLS (no client INSERT policy) |
| **SEC-13** | Caller impersonates another broker in approval | Broker A sends body: `{ reviewerId: "broker-B" }` | `POST /api/property-edit-requests/:id/approve` | **Rejected / Overridden** | Server extracts identity from verified `req.user.id` |
| **SEC-14** | Agent attempts to inject system keys (`id`, `created_by`) | Agent | `POST /api/properties/:id/edit-requests` | **System keys stripped** | Server-side sanitization |

---

## 5. Backend API Integration Testing Plan

### 5.1 Property Creation Endpoints (`API-PROP-01`)
- **Test 1.1:** `POST /api/properties` by an agent returns `{ success: false, error: "Forbidden: ..." }` with status 403.
- **Test 1.2:** `POST /api/properties` by a broker with valid body returns status 201 with persisted ID.
- **Test 1.3:** `POST /api/properties` omitting required fields (`title` or `price`) returns status 400 with structured Zod validation errors.
- **Test 1.4:** Excluded fields (`original_list_price`, `association_fee`, `tax_annual_amount`, `list_price_currency`) are accepted if passed, but default gracefully when omitted.

### 5.2 Edit Request Submission (`API-EDIT-02`)
- **Test 2.1 (Valid Proposal):** Assigned agent submits price change from ₱100M to ₱95M.
  - **Assert:** HTTP 201 Created. Response contains `requestId`, `status: 'PENDING'`.
  - **Assert:** Calling `GET /api/properties/:id` shows price is **still ₱100M** (live listing untouched).
- **Test 2.2 (Empty Payload):** Agent submits empty `proposedChanges: {}`.
  - **Assert:** HTTP 400 Bad Request (`"proposedChanges must contain at least one field to update"`).
- **Test 2.3 (Duplicate Proposal):** Agent submits a second proposal while first is `PENDING`.
  - **Assert:** HTTP 409 Conflict (`"An active edit request is already pending broker review for this property"`).
- **Test 2.4 (Unassigned Listing):** Agent submits proposal for another agent's property.
  - **Assert:** HTTP 403 Forbidden (`"You are not the assigned agent for this listing"`).

### 5.3 Review & Approval Endpoints (`API-APPR-03`)
- **Test 3.1 (Successful Approval):** Broker calls `POST /api/property-edit-requests/:id/approve`.
  - **Assert:** HTTP 200 OK.
  - **Assert:** Subsequent `GET /api/properties/:id` reflects new price ₱95M and updated `updated_at`.
  - **Assert:** Querying `public.property_audit_log` contains row with `action_type = 'EDIT_APPROVED'`, `changed_fields = ['price']`, `previous_data.price = 100000000`, `new_data.price = 95000000`.
- **Test 3.2 (Double Approval):** Second broker calls approve on already approved request.
  - **Assert:** HTTP 409 Conflict (`"Cannot approve request: status is already APPROVED"`).
- **Test 3.3 (Rejection):** Broker calls `POST /api/property-edit-requests/:id/reject` with remarks: `"Price reduction exceeds seller mandate."`
  - **Assert:** HTTP 200 OK. Request status updated to `REJECTED`. Live property price remains ₱100M.
- **Test 3.4 (Rejection Without Remarks):** Broker calls reject without `rejectionReason`.
  - **Assert:** HTTP 400 Bad Request (`"A rejection reason of at least 3 characters is required"`).

---

## 6. Frontend Integration Testing Plan

### 6.1 Agent Portal Integration (`FE-AGENT-01`)
- **Test A1 (Creation Controls Gated):**
  - Render `AgentProperties.jsx` wrapped in `AuthContext` with `role = 'agent'`.
  - **Assert:** No element with text `"Add Listing"` or `href="/agent/properties/create"` exists in the DOM.
- **Test A2 (Navigation Gated):**
  - Render `DashboardSidebar.jsx` with `role = 'agent'`.
  - **Assert:** "Properties" dropdown does not render "New Property" submenu item.
- **Test A3 (Propose Edits Flow):**
  - Render `AgentPropertyDetail.jsx`.
  - Click "Propose Changes" button.
  - **Assert:** Drawer opens containing 7 sections pre-populated with approved values.
  - **Assert:** Excluded pricing/tax fields (`associationFee`, `taxAnnualAmount`, `originalListPrice`) are **not** present.
  - Submit modified price and remarks.
  - **Assert:** `propertyService.submitEditRequest` is called with diff payload.
  - **Assert:** Alert banner appears: `"⚠️ Edit proposal submitted. Pending broker review."`

### 6.2 Broker Portal Integration (`FE-BROKER-02`)
- **Test B1 (Review Queue Tab):**
  - Render `BrokerProperties.jsx`.
  - Click "Needs Approval" tab.
  - **Assert:** Table lists pending agent edit proposals with `Agent`, `Modified Fields`, and `Submitted Date`.
- **Test B2 (Comparison Drawer):**
  - Click on pending proposal in table.
  - **Assert:** Slide-over drawer opens displaying side-by-side ledger (Current Value vs Proposed Value) with Coral highlights on changed rows.
- **Test B3 (Approval Action):**
  - Click "Approve & Publish Changes".
  - **Assert:** `propertyService.approveEditRequest` invoked; success toast renders: `"Approved changes for [Property Title]"`.
  - **Assert:** Drawer closes and inventory table refreshes.
- **Test B4 (Rejection Action):**
  - Click "Decline Proposal".
  - **Assert:** Dialog prompts for mandatory rejection remarks.
  - Submitting remarks calls `propertyService.rejectEditRequest`; badge updates to `REJECTED`.

---

## 7. End-to-End Workflow Testing Scenarios

```
                    ┌────────────────────────────────────────────────────────┐
                    │ SCENARIO A: HAPPY PATH (PROPOSE ➔ APPROVE ➔ PUBLISH)   │
                    └────────────────────────────────────────────────────────┘
  [Agent: Elena Rossi]                 [Broker: Victoria Vance]              [PostgreSQL Database]
           │                                      │                                    │
           │ 1. Submits Price Drop (₱340M ➔ ₱325M) │                                    │
           ├──────────────────────────────────────┼───────────────────────────────────►│ Staged in property_edit_requests
           │                                      │                                    │ (public.properties price remains ₱340M)
           │                                      │ 2. Opens Review Drawer             │
           │                                      │◄───────────────────────────────────┤ Fetches diff & original_snapshot
           │                                      │ 3. Clicks "Approve & Publish"      │
           │                                      ├───────────────────────────────────►│ Executes apply_property_edit_request()
           │                                      │                                    │ • Locks rows (FOR UPDATE)
           │                                      │                                    │ • Updates public.properties price to ₱325M
           │                                      │                                    │ • Sets request status = 'APPROVED'
           │                                      │                                    │ • Writes diff to property_audit_log
           │ 4. Receives in-app notification      │ 5. Table refreshes with ₱325M      │ • Dispatches notification
           │◄─────────────────────────────────────┴────────────────────────────────────┤
```

### Scenario B: Rejection Path
1. Agent proposes property status transition to `'Closed'` without conveyance clearance.
2. Proposal staged as `PENDING`. Live property remains `Active`.
3. Broker reviews proposal and clicks "Decline Proposal".
4. Broker enters remarks: `"Conveyance escrow pending clearance. Re-submit after deed signing."`
5. System executes `reject_property_edit_request()`.
6. Proposal marked `REJECTED`. `public.properties` remains `Active`.
7. Agent views rejection remarks in tracking table.

### Scenario C: Unauthorized Cross-Agent Edit Attempt
1. Agent A (`agent-1`) attempts to call `POST /api/properties/:id/edit-requests` on Property B assigned to Agent B (`agent-2`).
2. Express controller checks `properties.list_agent_key !== req.user.id`.
3. Server responds immediately with `403 Forbidden`.
4. Database remains completely untouched; no proposal row is created.

---

## 8. Regression Prevention Strategy

To ensure zero regressions across existing luxury real estate workflows:
1. **Public Property Discovery Unaffected:** Public search, OData filters (`city`, `propertyType`, `minPrice`, `maxPrice`), and cadastre map viewings query only `public.properties` where `standard_status = 'Active'`. Because edit proposals live in `public.property_edit_requests`, public queries experience zero performance degradation or data leakage.
2. **Confidential Vault Security Preserved:** `property_confidential` records remain strictly protected by existing 1-to-1 foreign keys and RLS policies.
3. **Preservation of Overlapping Schema Columns:** Adapters in `propertyService.js` and `PropertyService.ts` will continue to read both `beds` and `bedrooms_total`, `baths` and `bathrooms_total_integer`, `sqft` and `living_area`, ensuring that legacy mobile cards, detail modals, and RESO feeds function without code changes.

---

## 9. Requirements Traceability Matrix (REQ-01 through REQ-06)

| Req ID | Business Requirement | Test Coverage IDs | Target Layer | Expected Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Agents cannot create property listings | `SEC-01`, `SEC-02`, `API-PROP-01`, `FE-AGENT-01` | Database, API, UI | Route rejected with 403; DB RLS denies INSERT; UI controls removed. |
| **REQ-02** | Agents propose edits to assigned listings without modifying live records | `SEC-06`, `SEC-07`, `API-EDIT-02`, `FE-AGENT-03` | Database, API, UI | Proposals staged in `property_edit_requests`; `properties` row remains unaltered while `PENDING`. |
| **REQ-03** | Broker / Admin review and atomic approval | `SEC-10`, `SEC-11`, `DB-RPC-04`, `API-APPR-03`, `FE-BROKER-03` | Database, API, UI | Atomic application via `apply_property_edit_request`; live property updated; agent notified. |
| **REQ-04** | Status changes require approval; manual Reserved/Sold | `DB-RPC-04`, `API-APPR-03`, `FE-BROKER-02` | Database & API | Agent-proposed status changes staged; broker approval required; no auto-conveyance. |
| **REQ-05** | Exclude 4 fields from Add Property form; preserve DB columns | `DB-EXIST-01`, `API-PROP-01`, `FE-AGENT-03` | Database & UI | Inputs omitted from `BrokerCreateListings.jsx`; DB columns remain intact in PostgreSQL. |
| **REQ-06** | Audit trail recording actor, action, timestamp, and diff | `SEC-12`, `DB-RPC-04`, `API-APPR-03` | Database & API | Immutable row committed to `public.property_audit_log` with before/after JSONB diff. |

---

## 10. Test Execution Sequence & Pre-Flight Checklist

When execution is approved in the implementation phase, tests will be run in this exact order:

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: DATABASE & MIGRATION TESTS (npm run db:test)                   │
│ • Verify table structures, check constraints, and partial index        │
│ • Verify apply_property_edit_request RPC atomicity                     │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 2: BACKEND CONTROLLER & RBAC TESTS (npm test in backend)          │
│ • Execute SEC-01 through SEC-14 test suite                             │
│ • Verify Zod validation schemas for proposal, approve, and reject      │
│ • Verify assignment verification logic                                 │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 3: FRONTEND COMPONENT & WORKFLOW TESTS (npm test in frontend)     │
│ • Execute FE-AGENT-01 through FE-BROKER-04 React testing library suites│
│ • Verify form field exclusions in BrokerCreateListings.jsx             │
│ • Verify comparison drawer rendering in BrokerProperties.jsx           │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 4: END-TO-END BUILD VERIFICATION (npm run build in frontend)      │
│ • Full production bundle compile test (0 errors, 0 lint warnings)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Completion Status & Stop Gate

In strict accordance with the user instructions and Section 10 of `05-system-integration-testing.md`:
- **Phase 5 integration testing analysis and design are complete.**
- **No source code files have been modified.**
- **No database migrations have been executed.**
- **No test records have been inserted into live or staging tables.**
- **No unexecuted tests have been reported as passed.**
- **All 5 specification phases (Phase 1–5) are fully documented and ready for human partner approval.**
- **Execution has stopped to await explicit instruction before implementing changes.**
