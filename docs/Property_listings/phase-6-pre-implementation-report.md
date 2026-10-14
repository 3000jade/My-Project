# Phase 6, Stage 0: Pre-Implementation Verification Report

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Specification Reference:** `docs/Property_listings/06-controlled-implementation.md`  
**Referenced Predecessors:**  
- `01-database-schema-design.md` & `01-database-inspection-and-schema-design-report.md` (Phase 1)  
- `02-security-approval-workflow.md` & `02-security-and-approval-workflow-report.md` (Phase 2)  
- `03-backend-api-integration.md` & `phase-3-backend-integration-report.md` (Phase 3)  
- `04-frontend-workflow-integration.md` & `phase-4-frontend-workflow-report.md` (Phase 4)  
- `05-system-integration-testing.md` & `phase-5-integration-testing-report.md` (Phase 5)  
**Execution Phase:** Phase 6, Stage 0 Only (Pre-Implementation Verification)  
**Status:** COMPLETE (Stage 0 Baseline Verified — Awaiting Explicit Approval for Stage 1)  
**Report Date:** 2026-10-14  

---

## 1. Executive Summary & Stage 0 Objectives

In accordance with Section 6 of `docs/Property_listings/06-controlled-implementation.md`, this report establishes the **Pre-Implementation Verification Baseline** before applying any changes to the Human Shelter Realty codebase or database.

Stage 0 guarantees:
1. Complete audit of Git working tree, active branch, and pre-existing modifications.
2. Verification of database migrations, runner conventions, and connection configuration without credential exposure.
3. Confirmation of target environment (local development / test sandbox).
4. Full synthesis of approved architectural findings from Phases 1 through 5.
5. A granular, file-level implementation roadmap for Stages 1 through 5.
6. Multi-level rollback instructions to prevent data loss or service disruption.
7. Explicit identification of the approval gates required before Stage 1 (Database Migration) begins.

---

## 2. Git Working Tree & Branch Inspection

### 2.1 Branch Identification
- **Active Branch:** `property-tech-v3.0`
- **Target Repository:** `c:\Users\Win11x64\Desktop\My code space\CP_kerby`
- **Commit Safety Check:** Clean git status inspection executed; no Git resets (`git reset`), branch switches, or force-pushes (`git push --force`) were performed.

### 2.2 Uncommitted Modifications Inventory
The working tree contains existing uncommitted changes from earlier feature deliverables:
- **Agent Onboarding & Credential Lifecycle:** `backend/src/models/agent_invitations_migration.sql`, invitation controllers, routes, and schemas.
- **Modern SaaS UI/UX Alignment:** Refinements across `BrokerCreateListings.jsx`, `BrokerPropertyDetail.jsx`, `PropertyDetailModal.jsx`, and portal navigation.
- **Specification Documentation:** Reports for Phases 1 through 5 in `docs/Property_listings/`.

**Pre-Implementation Rule:** Stage 1–5 implementation will strictly make targeted, additive, non-destructive modifications. None of the pre-existing uncommitted files will be overwritten or discarded.

---

## 3. Database Migration Environment & Configuration Verification

### 3.1 Existing Migration Architecture
The database migration pipeline is driven by `backend/src/scripts/migrate.ts` using Node `pg` client:
- **Canonical Schema:** `backend/src/models/supabase_schema.sql` (Master DDL: profiles, properties, property_confidential, property_media, property_rooms, inquiries, appointments).
- **Secondary Migrations:** `backend/src/models/agent_invitations_migration.sql` (Agent onboarding pipeline & verification status).
- **Proposed Migration Target:** `backend/src/models/property_edit_approval_migration.sql` (Will contain Stage 1 DDL).

### 3.2 Connection Configuration & Secret Isolation
- Connection settings are managed via environment variables in `backend/.env`:
  - `SUPABASE_URL` (REST API gateway endpoint)
  - `SUPABASE_ANON_KEY` (Public client authentication token)
  - `SUPABASE_SERVICE_ROLE_KEY` (Administrative service client)
  - `SUPABASE_DB_URL` (Direct PostgreSQL pooler connection for DDL execution)
- **Security Check:** All credentials remain strictly encapsulated within `.env`. No API keys, database passwords, or JWT secrets are exposed in logs, reports, or test scripts.

### 3.3 Target Environment
- **Target Environment for Stages 1–5:** Local Development & Testing Sandbox (`http://localhost:5000` backend, `http://localhost:5173` frontend, local/dev Supabase project).
- Production deployment (Stage 7) is **strictly excluded** from current execution and requires separate formal authorization.

---

## 4. Review of Approved Phase 1–5 Architectural Findings

A cross-phase consistency review confirmed zero contradictions across the completed design reports:

1. **Phase 1 (Database Schema Design):**
   - Authoritative listing entity: `public.properties` preserved non-destructively.
   - 4 excluded pricing/tax fields (`original_list_price`, `association_fee`, `tax_annual_amount`, `list_price_currency`) remain intact in PostgreSQL schema.
   - Proposed new tables: `public.property_edit_requests` (staged proposals with partial unique index for single pending proposal) and `public.property_audit_log` (immutable change history).
2. **Phase 2 (Security & Approval Workflow):**
   - RBAC matrix: Agents denied direct property creation and direct live property updates.
   - Secure stored procedure: `public.apply_property_edit_request(request_id, broker_id, notes)` executing with `SECURITY DEFINER` and transactional row locks (`FOR UPDATE`).
   - Hardened RLS policies: Restrict `public.properties` INSERT/UPDATE to `broker` and `admin`. Restrict `property_edit_requests` INSERT to assigned agents (`list_agent_key = auth.uid()`).
3. **Phase 3 (Backend API Integration):**
   - Express route updates: `POST /api/properties` and `PUT /api/properties/:id` restricted to `['broker', 'admin']`.
   - New endpoints: `POST /api/properties/:id/edit-requests`, `GET /api/property-edit-requests`, `POST /api/property-edit-requests/:id/approve`, `POST /api/property-edit-requests/:id/reject`.
   - Authoritative role lookup in `auth.middleware.ts` from `public.profiles.role` to eliminate JWT metadata privilege escalation risks.
4. **Phase 4 (Frontend UI & Workflow Integration):**
   - Exclude 4 pricing/tax inputs from `BrokerCreateListings.jsx` Section 4.
   - Remove `+ Add Listing` button from `AgentProperties.jsx` and "New Property" link from `DashboardSidebar.jsx`.
   - Replace direct edit modal in `AgentPropertyDetail.jsx` with 7-section "Propose Changes" drawer.
   - Integrate side-by-side comparison drawer into `BrokerProperties.jsx` with one-click approval and mandatory rejection remarks.
5. **Phase 5 (System Integration Testing):**
   - Automated test suite covering SEC-01 through SEC-14, schema DDL assertions, partial unique index concurrency tests, and Vitest RTL component tests.

---

## 5. Granular File-Level Change Plan (Stages 1 through 5)

The table below defines every file to be created or modified, the specific change scope, and the stage in which it will be executed:

| Stage | Target File Path | Action | Description of Modification |
| :---: | :--- | :---: | :--- |
| **Stage 1** | `backend/src/models/property_edit_approval_migration.sql` | **CREATE** | DDL for `property_edit_requests`, `property_audit_log`, partial unique index `idx_single_pending_request_per_property`, and stored procedures `apply_property_edit_request` and `reject_property_edit_request`. |
| **Stage 1** | `backend/src/scripts/migrate.ts` | **EDIT** | Add `'property_edit_approval_migration.sql'` to the `files` array. |
| **Stage 2** | `backend/src/models/property_edit_approval_migration.sql` | **INCLUDED** | RLS policies for `property_edit_requests`, `property_audit_log`, and hardened policies for `public.properties`. |
| **Stage 3** | `backend/src/schemas/property.schema.ts` | **EDIT** | Add `proposePropertyEditSchema`, `approveEditRequestSchema`, `rejectEditRequestSchema`. |
| **Stage 3** | `backend/src/middleware/auth.middleware.ts` | **EDIT** | Resolve user role from `public.profiles.role` rather than client JWT metadata. |
| **Stage 3** | `backend/src/routes/property.routes.ts` | **EDIT** | Restrict `POST /` and `PUT /:id` to `['broker', 'admin']`; add edit request routes (`/:id/edit-requests`, `/edit-requests`, `/approve`, `/reject`). |
| **Stage 3** | `backend/src/controllers/property.controller.ts` | **EDIT** | Implement `submitEditRequest`, `listEditRequests`, `approveEditRequest`, `rejectEditRequest`. |
| **Stage 3** | `backend/src/services/property.service.ts` | **EDIT** | Implement proposal staging logic, RPC transaction call `apply_property_edit_request`, and remove silent mock fallback. |
| **Stage 4** | `frontend/src/services/propertyService.js` | **EDIT** | Add client methods: `submitEditRequest`, `getEditRequests`, `approveEditRequest`, `rejectEditRequest`, `cancelEditRequest`. |
| **Stage 4** | `frontend/src/App.jsx` | **EDIT** | Remove `/agent/properties/create` route. |
| **Stage 4** | `frontend/src/components/dashboard/DashboardSidebar.jsx` | **EDIT** | Remove "New Property" submenu item for `role === 'agent'`. |
| **Stage 4** | `frontend/src/pages/portals/agent/AgentProperties.jsx` | **EDIT** | Remove `+ Add Listing` button; add proposal tracking indicators. |
| **Stage 4** | `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx` | **EDIT** | Replace direct edit modal with "Propose Changes" drawer; remove direct publish toggle. |
| **Stage 4** | `frontend/src/pages/portals/broker/BrokerCreateListings.jsx` | **EDIT** | Omit inputs for `associationFee`, `associationFeeFrequency`, `taxAnnualAmount`, `originalListPrice` from Section 4. |
| **Stage 4** | `frontend/src/pages/portals/broker/BrokerProperties.jsx` | **EDIT** | Integrate side-by-side Proposal Review Drawer in "Needs Approval" tab. |
| **Stage 5** | `test files/backend/models/property-edit-approval.schema.test.ts`| **CREATE** | Automated Vitest suite verifying migration DDL, table constraints, and RPC function signatures. |
| **Stage 5** | `test files/backend/services/property-approval-workflow.test.ts` | **CREATE** | Automated Vitest suite for SEC-01 through SEC-14 and controller status codes. |
| **Stage 5** | `test files/frontend/pages/agent/AgentProposeEdits.test.jsx` | **CREATE** | React Testing Library suite verifying proposal staging without live record mutation. |
| **Stage 5** | `test files/frontend/pages/broker/BrokerProposalReview.test.jsx` | **CREATE** | React Testing Library suite verifying side-by-side comparison drawer and atomic approval. |

---

## 6. Rollback & Recovery Strategy

To ensure zero-risk recovery in the event of any stage-level failure:

### 6.1 Database Rollback Procedure (Stage 1 & 2)
If database migration encounters errors or unexpected behaviors:
```sql
-- Rollback Script: 20261014_rollback_property_edit_approval.sql
BEGIN;
DROP TRIGGER IF EXISTS trg_enforce_property_status ON public.properties;
DROP FUNCTION IF EXISTS public.apply_property_edit_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_property_edit_request(UUID, UUID, TEXT);
DROP TABLE IF EXISTS public.property_audit_log CASCADE;
DROP TABLE IF EXISTS public.property_edit_requests CASCADE;

-- Revert properties RLS policies to pre-migration baseline
DROP POLICY IF EXISTS "Only brokers and admins can insert properties" ON public.properties;
CREATE POLICY "Authenticated users can insert new properties." ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only brokers and admins can update properties" ON public.properties;
CREATE POLICY "Property creators or admins can update properties." ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')));
COMMIT;
```

### 6.2 Application Code Rollback Procedure (Stage 3 & 4)
Because implementation is tracked via Git, any stage regression can be rolled back cleanly via:
```bash
# Revert specific files modified during stage
git checkout HEAD -- backend/src/routes/property.routes.ts backend/src/controllers/property.controller.ts frontend/src/App.jsx
```

### 6.3 Backup & Snapshot Verification
- **PostgreSQL Dump Backup:** Prior to executing Stage 1 migration against any live database, a snapshot will be verified via:
  `pg_dump -h <host> -U postgres -d postgres -s -f backup_schema_pre_stage1.sql`
- Development test instances utilize local Supabase instances where state can be recreated cleanly via `supabase db reset` if needed.

---

## 7. Stage 0 Mandatory Restrictions Compliance

The following restrictions were strictly enforced during Stage 0:
- [x] **No source files modified:** Zero lines of production code, routing, or templates were changed.
- [x] **No database migrations executed:** `migrate.ts` was not run; no tables or columns were created, altered, or dropped.
- [x] **No database records altered:** Zero inserts, updates, or deletes were sent to Supabase.
- [x] **No features implemented:** Staged proposals and review drawers remain in design specification state.
- [x] **No deployments performed:** Staging and production branches remain untouched.

---

## 8. Completion Criteria & Stage 1 Approval Gates

Stage 0 (Pre-Implementation Verification) is **COMPLETE**.

Before proceeding to **Stage 1 (Database Migration)**, the human partner must explicitly approve:
1. **Migration File Creation:** Authorization to create `backend/src/models/property_edit_approval_migration.sql` containing the DDL for `public.property_edit_requests`, `public.property_audit_log`, and the stored procedures `apply_property_edit_request` and `reject_property_edit_request`.
2. **Schema Non-Destruction Commitment:** Confirmation that existing columns `original_list_price`, `association_fee`, `tax_annual_amount`, and `list_price_currency` in `public.properties` will be strictly preserved in the database schema.
3. **Rollout Sequencing:** Approval to proceed through the stages sequentially (Stage 1: DB Migration ➔ Stage 2: Security & RLS ➔ Stage 3: Backend API ➔ Stage 4: Frontend UI ➔ Stage 5: E2E Testing).

---

> [!IMPORTANT]
> **STOP GATE (Stage 0 Complete):** Execution has paused. Please review this pre-implementation verification report and confirm authorization to begin **Stage 1 (Database Migration)**.
