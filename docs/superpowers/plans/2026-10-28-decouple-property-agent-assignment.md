# Decouple Agent Assignment from Property Listings Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple agent assignment from Property Listings intake (Module 02: `property-listing`) and relocate all property-to-agent assignment workflows to the Agent Management module (Module 03: `agent-management`), ensuring public and client listview components remain completely untouched.

**Architecture:** 
1. Streamline Property Intake (`BrokerCreateListings.jsx`, `CreateListingModal.jsx`, `createPropertySchema`, `PropertyService.createProperty`) by removing the agent selector, agent validation, and agent roster fetching, defaulting unassigned listings to `list_agent_key = NULL` with corporate brokerage contact fallback.
2. Relocate Property Assignment into `BrokerAgentDetail.jsx` (Module 03) under the "Listings" tab via an "+ Assign Properties" drawer/modal that queries unassigned inventory and invokes `reassignAgent` to initiate the assignment confirmation handshake (`PENDING_CONFIRMATION`).

**Tech Stack:** React 19, TypeScript 5.9+, Tailwind CSS v4, Express, PostgreSQL / Supabase, Vitest, Playwright.

**Spec Reference:**
- [`docs/modules/02-property-listing/2026-10-28-property-input-and-agent-assignment-scope-redefinition.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/2026-10-28-property-input-and-agent-assignment-scope-redefinition.md)
- [`docs/modules/02-property-listing/2026-10-27-property-listings-functions-specification.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/2026-10-27-property-listings-functions-specification.md)

---

## Global Constraints & Boundaries

- **Strict Non-Interference**: Do NOT make any changes to `PropertyListingView.jsx`, `PropertiesPage.jsx`, or any listview display components.
- **Philippine RESA (RA 9646) Supervision**: Only brokers and admins can assign or reassign properties to agents; agents cannot assign properties to themselves.
- **Unassigned Inventory Fallback**: When `list_agent_key` is null, public property endpoints and displays must present Corporate Brokerage contact details rather than throwing errors.
- **Backward Compatibility**: Existing properties with assigned agents must retain their assignments and statuses without disruption.

---

## Environment Readiness & Existing State

- **Backend Test Status**: 53 test files passing (251 passing tests); existing test suite runs via `npm run test --prefix backend`.
- **Database Status**: PostgreSQL tables `public.properties`, `public.property_confidential`, `public.property_audit_log` active. `list_agent_key` is a nullable foreign key.
- **Frontend Status**: Vite dev server and build tools configured.

---

## Implementation Tasks

### Task 1: Relax Backend Validation & Enable Unassigned Property Creation

**Files:**
- Modify: `backend/src/schemas/property.schema.ts`
- Modify: `backend/src/services/property.service.ts`
- Test: `test files/backend/services/property-assignment-confirmation.test.ts`

**Interfaces:**
- Consumes: `createPropertySchema` in `backend/src/schemas/property.schema.ts`
- Produces: `PropertyService.createProperty` returning unassigned property with `list_agent_key = null` and `assignment_status = 'UNASSIGNED'` (or `null`) when no agent is supplied.

- [x] **Step 1: Write a failing integration test for unassigned property creation**
  - Add test case in `test files/backend/services/property-assignment-confirmation.test.ts`:
    "allows broker to create a property without an agentId, resulting in list_agent_key=null and unassigned status".
- [x] **Step 2: Run test to confirm it fails or requires relaxation**
  - Run: `npx vitest run "test files/backend/services/property-assignment-confirmation.test.ts"`
- [x] **Step 3: Update `createPropertySchema` in `backend/src/schemas/property.schema.ts`**
  - Ensure `agentId`, `agent_id`, `listAgentKey`, `list_agent_key` are strictly optional with `.optional().nullable()`.
  - Add `'UNASSIGNED'` to the allowed `assignmentStatus` enum: `z.enum(['UNASSIGNED', 'PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED']).optional()`.
  - Update `queryPropertySchema` to support filtering by `unassigned=true` or `assignmentStatus='UNASSIGNED'`.
- [x] **Step 4: Update `PropertyService.createProperty` in `backend/src/services/property.service.ts`**
  - If no `agentId` or `list_agent_key` is provided in the input:
    - Set `list_agent_key = null`.
    - Set `assignment_status = 'UNASSIGNED'` (or `null`).
    - Skip agent assignment notifications/emails.
    - Set `is_published = input.isPublished ?? (input.standardStatus === 'Active')`.
- [x] **Step 5: Run tests and verify they pass**
  - Run: `npx vitest run "test files/backend/services/property-assignment-confirmation.test.ts"`

---

### Task 2: Streamline Property Creation Wizard (`BrokerCreateListings.jsx`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`
- Test: `frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx`

**Interfaces:**
- Consumes: Form submission state and validation logic in `BrokerCreateListings.jsx`.
- Produces: Clean 7-step wizard where Step 1 is solely property metadata and contains zero agent picker controls or agent validation checks.

- [x] **Step 1: Write failing component test verifying Step 1 renders without agent picker**
  - In `frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx`, verify Step 1 renders Property Title, Transaction Type, Property Type, but does NOT render "Assigned Agent" selector or modal.
- [x] **Step 2: Run test to observe failure**
  - Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`
- [x] **Step 3: Remove Agent Roster Fetching & State from `BrokerCreateListings.jsx`**
  - Remove `import { agentService } from '../../../services/agentService'`.
  - Remove `agentsList`, `isLoadingAgents`, `isAgentModalOpen`, `agentSearchQuery`, `fetchAgents` state and effects.
  - Remove `agent_id: ''` and `agent_name: ''` from `INITIAL_FORM_DATA`.
- [x] **Step 4: Remove Agent Selection UI from Step 1 Render Block**
  - In `renderStepContent(1)`: Remove the Agent Card selector, "Choose Agent" button, and `AgentSelectionModal` markup.
  - Ensure Step 1 cleanly displays: Listing Title, Transaction Type, Property Classification, Sub-Type, and Architectural Style.
- [x] **Step 5: Remove Agent Validation Gates**
  - Remove `if (!formData.agent_id) draftValidationErrors.push(...)`.
  - Remove any agent check from `finalValidationErrors` and publication readiness checklist.
- [x] **Step 6: Update `CreateListingModal.jsx` (Secondary Dashboard Intake)**
  - In `frontend/src/components/dashboard/CreateListingModal.jsx`: Remove agent selector dropdown, remove `agentService.getAgents()` call, remove `formData.agentId` requirement.
- [x] **Step 7: Run tests and verify passing**
  - Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`

---

### Task 3: Implement Agent-Centric Property Assignment in `BrokerAgentDetail.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
- Modify: `frontend/src/services/propertyService.js`
- Test: `frontend/src/pages/portals/broker/BrokerAgentDetail.test.jsx`

**Interfaces:**
- Consumes: `propertyService.getProperties({ assignmentStatus: 'UNASSIGNED' })` and `propertyService.reassignAgent(propertyId, agentId)`.
- Produces: Interactive "+ Assign Properties" drawer inside `BrokerAgentDetail` allowing brokers to browse unassigned inventory, select listings, and assign them to the agent.

- [x] **Step 1: Write failing test for Assign Properties Drawer in `BrokerAgentDetail`**
  - In `BrokerAgentDetail.test.jsx`: Test that clicking "+ Assign Properties" in the Listings tab opens the drawer with unassigned properties, and selecting a property calls `propertyService.reassignAgent`.
- [x] **Step 2: Run test to observe failure**
  - Run: `npm run test --prefix frontend -- BrokerAgentDetail.test.jsx`
- [x] **Step 3: Enhance `propertyService.js` with unassigned filter helper**
  - Ensure `propertyService.getUnassignedProperties()` calls `GET /api/properties?unassigned=true` or filters for `list_agent_key = null`.
- [x] **Step 4: Add "+ Assign Properties" Header Action in `BrokerAgentDetail.jsx` Listings Tab**
  - In `BrokerAgentDetail.jsx`, within the `activeTab === 'listings'` render section, add an "+ Assign Properties" button with icon `IconPlus` or `IconBuilding`.
  - Maintain state for `isAssignDrawerOpen`, `unassignedListings`, `isLoadingUnassigned`, `selectedPropertiesToAssign`.
- [x] **Step 5: Build `AssignPropertiesDrawer` in `BrokerAgentDetail.jsx`**
  - Drawer features:
    - Search bar filtering by property title, city, or price.
    - Checkbox list of available unassigned properties with thumbnail, title, price, and location.
    - "Confirm Assignment" button that invokes `propertyService.reassignAgent(propId, agent.id)` for each selected property.
    - Toast feedback: `"Assigned X properties to [Agent Name]. Status: Pending Confirmation."`
    - Re-fetches `assignedProps` upon completion and closes drawer.
- [x] **Step 6: Run tests and verify passing**
  - Run: `npm run test --prefix frontend -- BrokerAgentDetail.test.jsx`

---

### Task 4: Public & Client Contact Fallback Verification

**Files:**
- Modify: `backend/src/services/property.service.ts` (if needed for redaction / corporate fallback projection)
- Test: `frontend/src/services/propertyService.test.js`

**Interfaces:**
- Consumes: `normalizeProperty` in `frontend/src/services/propertyService.js`
- Produces: Safe default agent metadata: `agentName: 'Human Shelter Realty Corporate Brokerage Desk'`, `agentPhone: '+63 2 8888 0000'`, `agentEmail: 'inquiries@humanshelterrealty.com'` when `list_agent_key` is null.

- [x] **Step 1: Write test for unassigned property normalization**
  - In `frontend/src/services/propertyService.test.js`: Test `normalizeProperty` on an item with `agent_id = null` to verify fallback contact fields are correctly populated without exceptions.
- [x] **Step 2: Update `normalizeProperty` in `frontend/src/services/propertyService.js`**
  - If `agentName` is empty, set default corporate desk representation:
    - `agentName: 'Human Shelter Realty Desk'`
    - `isCorporateDesk: true`
- [x] **Step 3: Run tests and confirm passing**
  - Run: `npm run test --prefix frontend -- propertyService.test.js`

---

### Task 5: End-to-End Playwright Verification

**Files:**
- Create/Run: Playwright E2E scenario in `frontend/e2e/property-agent-assignment-decoupling.spec.ts`

- [x] **Step 1: Write Playwright E2E test verifying full decoupled flow**
  - Scenario 1: Broker logs in -> Navigates to `/portal/broker/properties/create` -> Step 1 has NO agent field -> Completes wizard -> Listing is created as unassigned without errors.
  - Scenario 2: Broker navigates to `/portal/broker/agents/:id` -> Switches to "Listings" tab -> Clicks "+ Assign Properties" -> Selects the newly created unassigned listing -> Confirms assignment -> Property appears under agent's assigned listings with status `Pending Confirmation`.
  - Scenario 3: Verify `/properties/:id` opens without errors and `PropertyListingView.jsx` remains unchanged.
- [x] **Step 2: Execute Playwright E2E verification**
  - Run: `npx playwright test property-agent-assignment-decoupling.spec.ts`

---

## Explicit Approval Boundaries (AGENTS.md Section 9)

| Boundary Item | Changes Involved | Approval Requirement |
| :--- | :--- | :--- |
| **Database DDL / Migrations** | None. `list_agent_key` is already nullable in `public.properties`. | Conditional Autonomy (No breaking schema changes) |
| **Permission & RBAC Changes** | None. Only brokers/admins assign properties. | Pre-approved |
| **Breaking API Changes** | None. `agentId` in `createPropertySchema` made optional. | Pre-approved |
| **Scope Expansion** | None. Strictly limited to decoupling intake and relocating assignment. | Pre-approved |
