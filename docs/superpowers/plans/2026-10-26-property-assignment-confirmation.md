# Property Listing Agent Assignment & Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a strict Agent Assignment & Confirmation workflow preventing property listings from publishing live until the assigned agent explicitly confirms acceptance.

**Architecture:** Extend the property data model with an `assignment_status` state machine (`PENDING_CONFIRMATION`, `ACCEPTED`, `REJECTED`), gate public visibility strictly behind `ACCEPTED`, provide dedicated backend transition endpoints, and build responsive approval/rejection interfaces for both Agent and Broker portals.

**Tech Stack:** TypeScript, Node.js, Express, PostgreSQL / Supabase, React 18, Tailwind CSS v4, Framer Motion, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-26-property-assignment-confirmation-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-10-26-property-assignment-confirmation-design.md)

## Global Constraints
- **Design Tokens:** Base `#F8FAFC`, Surface `#FFFFFF`, Primary `#0F766E`, Conversion `#FF6B6B`, Ink `#1E293B`, Borders `#E2E8F0`.
- **Public Visibility Invariant:** Public listing queries MUST strictly filter `standard_status = 'Active' AND assignment_status = 'ACCEPTED' AND is_published = true`.
- **No Hardcoded Defaults:** Frontend property creation forms must initialize with empty `agent_id: ''` and enforce selection before submission.
- **Git Safety Gate:** Local commits only; never push to remote without explicit user command.

---

### Task 1: Database Migration & Schema Updates

**Files:**
- Create: `backend/src/models/property_assignment_confirmation_migration.sql`
- Modify: `backend/src/scripts/migrate.ts`

**Interfaces:**
- Produces: `public.properties` columns `assignment_status`, `assignment_declined_reason`, `assigned_at`, `agent_confirmed_at`.

- [ ] **Step 1: Write migration SQL script**
  Create `backend/src/models/property_assignment_confirmation_migration.sql` with column additions, status check constraint (`PENDING_CONFIRMATION`, `ACCEPTED`, `REJECTED`), and indexing on `assignment_status`.
- [ ] **Step 2: Update database migration runner**
  Add the migration file to `backend/src/scripts/migrate.ts` migration sequence.
- [ ] **Step 3: Test migration execution**
  Run `npm --prefix backend run db:push` or apply migration against database, verifying column presence.
- [ ] **Step 4: Commit migration changes**
  `git commit -m "feat(db): add property assignment status and confirmation columns"`

---

### Task 2: Backend Property Service Assignment State Machine & TDD

**Files:**
- Create: `test files/backend/services/property-assignment-confirmation.test.ts`
- Modify: `backend/src/services/property.service.ts`

**Interfaces:**
- Consumes: `PropertyItem`, `userId`, `userRole`
- Produces: `PropertyService.createProperty`, `PropertyService.acceptAssignment`, `PropertyService.declineAssignment`, `PropertyService.reassignAgent`

- [ ] **Step 1: Write failing service unit tests (Red)**
  Create `test files/backend/services/property-assignment-confirmation.test.ts`:
  - Test 1: Property creation requires valid `agent_id`; fails with 400 if missing or empty.
  - Test 2: Created property initializes with `assignment_status: 'PENDING_CONFIRMATION'`, `standard_status: 'Pending Confirmation'`, `is_published: false`.
  - Test 3: Public properties query excludes `PENDING_CONFIRMATION` and `REJECTED` properties.
  - Test 4: Assigned agent can call `acceptAssignment()`, setting status to `ACCEPTED`, `standard_status: 'Active'`, `is_published: true`.
  - Test 5: Unauthorized user cannot call `acceptAssignment()` (throws Forbidden).
  - Test 6: Assigned agent can call `declineAssignment(reason)`, setting status to `REJECTED`, `standard_status: 'Action Required'`, `is_published: false`.
  - Test 7: Broker can call `reassignAgent(newAgentId)`, returning status to `PENDING_CONFIRMATION`.
- [ ] **Step 2: Run test to verify failure (Red)**
  `npm --prefix backend test -- "property-assignment-confirmation"`
- [ ] **Step 3: Implement service methods in `property.service.ts` (Green)**
  - Update `createProperty` to require `agent_id` / `listAgentKey` and set initial `assignment_status: 'PENDING_CONFIRMATION'`.
  - Implement `acceptAssignment(propertyId, agentId)`.
  - Implement `declineAssignment(propertyId, agentId, reason)`.
  - Implement `reassignAgent(propertyId, brokerId, newAgentId)`.
  - Enforce `assignment_status === 'ACCEPTED'` in public listing queries (`listProperties`, `searchProperties`).
- [ ] **Step 4: Run tests to verify pass (Green)**
  Confirm all tests in `property-assignment-confirmation.test.ts` pass.
- [ ] **Step 5: Commit service changes**
  `git commit -m "feat(backend): implement property assignment confirmation state machine in PropertyService"`

---

### Task 3: Backend Controller & API Routes

**Files:**
- Modify: `backend/src/controllers/property.controller.ts`
- Modify: `backend/src/routes/property.routes.ts`

**Interfaces:**
- Produces: `PATCH /api/properties/:id/accept-assignment`, `PATCH /api/properties/:id/decline-assignment`, `PATCH /api/properties/:id/reassign-agent`

- [ ] **Step 1: Add controller methods in `property.controller.ts`**
  - `acceptAssignment`: Extracts `req.params.id`, `req.user.id`, calls service.
  - `declineAssignment`: Extracts `req.params.id`, `req.user.id`, `req.body.reason`, calls service.
  - `reassignAgent`: Extracts `req.params.id`, `req.user.id`, `req.body.newAgentId`, calls service.
- [ ] **Step 2: Wire endpoints in `property.routes.ts`**
  - Protect `accept-assignment` and `decline-assignment` with `authenticate` and `authorizeRoles('agent', 'admin')`.
  - Protect `reassign-agent` with `authenticate` and `authorizeRoles('broker', 'admin')`.
- [ ] **Step 3: Test API endpoints with integration tests**
  Add HTTP integration tests verifying 200 responses and RBAC protections.
- [ ] **Step 4: Commit route and controller updates**
  `git commit -m "feat(backend): add property assignment confirmation endpoints and RBAC routes"`

---

### Task 4: Frontend Listing Form Cleanup (Remove Hardcoded Defaults)

**Files:**
- Modify: `frontend/src/services/propertyService.js`
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`
- Modify: `frontend/src/components/dashboard/CreateListingModal.jsx`

**Interfaces:**
- Produces: `propertyService.acceptAssignment`, `propertyService.declineAssignment`, `propertyService.reassignAgent`

- [ ] **Step 1: Add API client methods in `propertyService.js`**
  Add `acceptAssignment(id)`, `declineAssignment(id, reason)`, and `reassignAgent(id, newAgentId)`.
- [ ] **Step 2: Update `toApiPayload` in `propertyService.js`**
  Ensure `agent_id` and `agentId` are properly mapped to the API payload.
- [ ] **Step 3: Remove hardcoded default agent from `BrokerCreateListings.jsx`**
  Change initial form state from `agent_id: 'agent-1'` to `agent_id: ''` and `agent_name: ''`.
  Add validation alert if submit is clicked without choosing an agent.
  Add notice badge below agent selector: *"Listing will remain in Pending Confirmation until accepted by the assigned agent."*
- [ ] **Step 4: Remove hardcoded default agent from `CreateListingModal.jsx`**
  Change initial state `agent_id: ''`. Require agent selection before submitting.
- [ ] **Step 5: Verify build & component rendering**
  Run `npm --prefix frontend run build` to confirm type and bundling safety.
- [ ] **Step 6: Commit frontend creation form updates**
  `git commit -m "fix(frontend): remove hardcoded default agent and enforce explicit selection on listing creation"`

---

### Task 5: Frontend Agent Portal Confirmation Workflow

**Files:**
- Modify: `frontend/src/pages/portals/agent/AgentProperties.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx`
- Create: `frontend/src/components/dashboard/AgentAssignmentActionModal.jsx`

**Interfaces:**
- Consumes: `propertyService.acceptAssignment`, `propertyService.declineAssignment`

- [ ] **Step 1: Build `AgentAssignmentActionModal.jsx`**
  Modal allowing the agent to confirm acceptance or enter an optional decline reason.
- [ ] **Step 2: Add "Pending Confirmation" tab in `AgentProperties.jsx`**
  - Add filter tab with amber badge displaying count of properties awaiting agent confirmation.
  - Render action buttons directly on pending cards: **"Accept Assignment"** and **"Decline"**.
- [ ] **Step 3: Add banner in `AgentPropertyDetail.jsx`**
  When property is in `PENDING_CONFIRMATION`, show sticky banner with Accept/Decline action buttons.
- [ ] **Step 4: Verify agent confirmation interactions**
  Test accepting and declining assignments in the browser.
- [ ] **Step 5: Commit Agent portal workflow**
  `git commit -m "feat(frontend): add agent property assignment review and confirmation workflow"`

---

### Task 6: Frontend Broker Portal Reassignment & Status Filters

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx`

**Interfaces:**
- Consumes: `propertyService.reassignAgent`

- [ ] **Step 1: Add status tabs to `BrokerProperties.jsx`**
  Add filter tabs for **"Pending Confirmation"** (Amber) and **"Action Required"** (Red).
- [ ] **Step 2: Display decline reasons and reassign action in Broker portal**
  Show the agent's decline reason on rejected properties with a **"Reassign Agent"** button.
- [ ] **Step 3: Connect reassign button to Agent Selection Modal**
  Selecting a new agent calls `propertyService.reassignAgent()` and refreshes listing status to `Pending Confirmation`.
- [ ] **Step 4: Commit Broker portal updates**
  `git commit -m "feat(frontend): add broker assignment tracking and agent reassignment flow"`

---

### Task 7: Full System Verification & Regression Testing

- [ ] **Step 1: Run complete backend test suite**
  `npm --prefix backend test`
- [ ] **Step 2: Run frontend build**
  `npm --prefix frontend run build`
- [ ] **Step 3: End-to-End Playwright test**
  - Broker logs in, creates a listing selecting an agent.
  - Verify property status is `Pending Confirmation` and NOT in public search.
  - Agent logs in, sees assignment in Pending Confirmation tab, accepts assignment.
  - Verify property status transitions to `Active` and appears live on public portal.
- [ ] **Step 4: Final verification report**
