# Property Listing Agent Assignment & Confirmation Workflow Design Spec

**Date:** 2026-10-26  
**Status:** Approved  
**Author:** Antigravity Engineering  
**Scope:** Property lifecycle state machine, backend APIs, database schema migration, notification pipeline, and Broker/Agent portal workflows.

---

## 1. Executive Summary & Problem Statement

Currently, when a broker creates a property listing in `BrokerCreateListings.jsx`, the form hardcodes `agent_id: 'agent-1'` by default. Consequently, listings are automatically published with an agent assigned without any explicit selection by the broker or consent from the agent.

This specification introduces a strict **Agent Assignment & Confirmation Gate**:
1. Every property listing submitted by a Broker requires an explicitly selected agent (no hardcoded defaults).
2. The property cannot be published directly to the public portal upon submission. Instead, it enters `Pending Confirmation` (`assignment_status: 'PENDING_CONFIRMATION'`).
3. The assigned agent must inspect the property specifications and either **Accept** or **Decline** the assignment.
4. If **Accepted**: The property transitions to `Active`, is published live, and notifies the Broker.
5. If **Declined**: The property transitions to `Action Required` (`assignment_status: 'REJECTED'`), stays hidden from the public portal, and alerts the Broker with the agent's decline reason to reassign.

---

## 2. Architecture & Data Model

### 2.1 Database Schema Migration (`public.properties`)

```sql
-- Migration: property_assignment_confirmation_migration.sql
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS assignment_status VARCHAR(30) DEFAULT 'PENDING_CONFIRMATION',
  ADD COLUMN IF NOT EXISTS assignment_declined_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS agent_confirmed_at TIMESTAMPTZ NULL;

-- Index for operational filtering by assignment status
CREATE INDEX IF NOT EXISTS idx_properties_assignment_status 
  ON public.properties(assignment_status);

-- Invariant constraint for assignment statuses
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS chk_property_assignment_status,
  ADD CONSTRAINT chk_property_assignment_status 
  CHECK (assignment_status IN ('PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED'));
```

### 2.2 Lifecycle State Transitions

```
[Broker Creates Listing with Assigned Agent]
                    │
                    ▼
       assignment_status = 'PENDING_CONFIRMATION'
       standard_status   = 'Pending Confirmation'
       is_published      = false
                    │
          ┌─────────┴─────────┐
          │                   │
    [Agent Accepts]     [Agent Declines]
          │                   │
          ▼                   ▼
   assignment_status =   assignment_status =
     'ACCEPTED'            'REJECTED'
   standard_status =     standard_status =
     'Active'              'Action Required'
   is_published = true   is_published = false
   Public: LIVE          Broker: Reassignment Required
```

### 2.3 Strict Invariants
1. **Mandatory Agent on Submission**: Property creation requires `agent_id` to be a valid agent ID. If omitted, returns `400 Bad Request`.
2. **Public Portal Query Isolation**: Public routes (`GET /api/properties`, `/properties/:id`, `/api/properties/search`) enforce:
   `standard_status = 'Active' AND assignment_status = 'ACCEPTED' AND is_published = true`.
3. **Agent Authorization Gate**: Only the assigned agent (`req.user.id === property.agent_id` or an Admin) can accept or decline the assignment.

---

## 3. Backend API Specification

### 3.1 `PATCH /api/properties/:id/accept-assignment`
- **Role:** Agent (`req.user.id === property.agent_id`) or Admin.
- **Validation:** Property must be in `assignment_status === 'PENDING_CONFIRMATION'`.
- **Action:**
  - `assignment_status` $\leftarrow$ `'ACCEPTED'`
  - `standard_status` $\leftarrow$ `'Active'`
  - `is_published` $\leftarrow$ `true`
  - `agent_confirmed_at` $\leftarrow$ `NOW()`
- **Notification:** Sends `property.assignment_accepted` notification to the Broker.
- **Response:** `200 OK` with updated property entity.

### 3.2 `PATCH /api/properties/:id/decline-assignment`
- **Role:** Agent (`req.user.id === property.agent_id`).
- **Body:** `{ reason?: string }`
- **Action:**
  - `assignment_status` $\leftarrow$ `'REJECTED'`
  - `standard_status` $\leftarrow$ `'Action Required'`
  - `assignment_declined_reason` $\leftarrow$ `body.reason`
  - `is_published` $\leftarrow$ `false`
- **Notification:** Sends urgent `property.assignment_rejected` notification to the Broker.
- **Response:** `200 OK` with updated property entity.

### 3.3 `PATCH /api/properties/:id/reassign-agent`
- **Role:** Broker or Admin.
- **Body:** `{ newAgentId: string }`
- **Action:**
  - Validates `newAgentId` is a verified agent.
  - `agent_id` $\leftarrow$ `newAgentId`
  - `assignment_status` $\leftarrow$ `'PENDING_CONFIRMATION'`
  - `standard_status` $\leftarrow$ `'Pending Confirmation'`
  - `assignment_declined_reason` $\leftarrow$ `null`
  - `assigned_at` $\leftarrow$ `NOW()`
- **Notification:** Sends `property.assigned` notification to the new agent.
- **Response:** `200 OK` with updated property entity.

---

## 4. Frontend UI/UX Workflows

### 4.1 Listing Creation Form Updates (`BrokerCreateListings.jsx`, `CreateListingModal.jsx`)
- Clear initial state: `agent_id: ''`, `agent_name: ''`.
- If no agent is selected, disabling publish/submit button with tooltip: *"Select an assigned agent to submit listing."*
- Notice box below the agent selector informing the broker that the listing will remain unlisted until confirmed by the agent.

### 4.2 Agent Portal (`AgentProperties.jsx`, `AgentPropertyDetail.jsx`)
- Filter tab: **"Pending Review"** with an amber count badge.
- Property detail view displays an assignment header banner:
  - **"Accept Assignment & Publish"** (`#0F766E` Teal button).
  - **"Decline Assignment"** (Outlined destructive button with reason dialog).

### 4.3 Broker Portal (`BrokerProperties.jsx`, `BrokerPropertyDetail.jsx`)
- Status tabs: `All`, `Active`, `Pending Confirmation`, `Action Required (Declined)`, `Draft`, `Closed`.
- `Action Required` displays the agent's decline reason and a **"Reassign Agent"** action button.

---

## 5. Testing & Verification Plan

1. **Unit & Service Tests (`test files/backend/services/property-assignment-confirmation.test.ts`)**:
   - Verify property creation with no agent fails with 400.
   - Verify created property initializes with `PENDING_CONFIRMATION` and `is_published: false`.
   - Verify unconfirmed property is not returned by public listing query.
   - Verify assigned agent can accept assignment, switching status to `Active` and `is_published: true`.
   - Verify unassigned agent or non-agent cannot accept someone else's assignment (403).
   - Verify assigned agent can decline assignment, switching status to `Action Required` and recording reason.
   - Verify broker can reassign a declined property to a new agent.
2. **Frontend Component Tests**:
   - `BrokerCreateListings.test.jsx`: Assert form starts without agent selected and requires selection.
   - `AgentProperties.test.jsx`: Assert pending assignments show Accept/Decline action buttons.
3. **End-to-End Verification**:
   - Create listing as Broker $\rightarrow$ Log in as Agent $\rightarrow$ Accept assignment $\rightarrow$ Verify property is now live on public home/properties page.
