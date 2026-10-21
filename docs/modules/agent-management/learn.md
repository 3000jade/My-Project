# Agent Management Module — `/learn` Technical Reference & Implementation Summary

**Implementation Version:** `v2.1.0`  
**Verification Date:** `2026-10-21`  
**Specification Source:** `docs/implementation/agentmanagementModule.md`, `docs/implementation/appointmentAndCalendarInterface.md`, `docs/superpowers/specs/2026-10-21-agent-management-module-design.md`, `docs/superpowers/specs/2026-10-21-calendar-and-appointment-scheduling-design.md`
**Companion Calendar & Scheduling Reference:** [`calendar-appointments-learn.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/agent-management/calendar-appointments-learn.md)

---

## 1. Purpose and Boundaries

The **Agent Management Module** governs the end-to-end lifecycle of real estate consultants within **Human Shelter Realty** across three primary stakeholders:
- **Broker (`broker` / `admin`):** Invites agents, reviews PRC/DHSUD credentials, manages teams and governance permissions (`can_create_listings`, `access_tier`, `commission_tier`), monitors workload and performance, suspends/reactivates accounts, and executes responsibility transfers and offboarding (departure).
- **Sales Agent (`agent`):** Accepts single-use 72-hour invitations, completes onboarding checklist items, maintains public profile and regulatory credentials, manages live lead-routing availability (`available | paused | vacation`), weekly working hours, and blackout dates, and manages assigned listings/inquiries/viewings.
- **Client (`client` / public visitor):** Views sanitized, verified public agent profiles (`PublicAgentCardDTO`) on property listings and inquiry workflows without exposure to internal brokerage notes, commission splits, or emergency contacts.

### Module Ownership vs. External Integrations
- **Owned by Agent Management:** Agent profiles & completeness computation, brokerage & team membership (`agent_teams`), single-use 72h invitations (`agent_invitations`), 3-dimensional lifecycle state machine (`membership_status`, `onboarding_status`, `routing_availability`), role & listing permission administration (`can_create_listings`), availability schedules & blackout dates (`agent_availability_schedules`), responsibility transfers (`responsibility_transfers`), and immutable administrative audit history (`agent_audit_events`).
- **Integrated Modules:**
  - **Authentication (`auth.users` / `public.profiles`):** Shares identity UUIDs while separating brokerage membership state.
  - **Properties (`public.properties` / `public.property_edit_requests`):** Enforces `canPerformAction(agentId, 'create_listing' | 'edit_listing')` in `PropertyController`.
  - **Inquiries (`public.inquiries`) & Viewings (`public.appointments`):** Queries `AgentEligibilityService` for lead routing eligibility and reassigns open inquiries/upcoming viewings during transfers or departure.
  - **Sales & Transactions (`public.sales`):** Preserves historical attribution on `COMPLETED` deals during transfers/departures.

---

## 2. Implemented Stakeholder Capabilities

### Broker Capabilities
- Issue single-use 72-hour onboarding invitations with pre-configured `teamId`, `canCreateListings`, `accessTier`, and `commissionTier` (`BrokerInviteAgent.jsx`, `BrokerAgents.jsx`).
- Resend/rotate expired or pending invitations and revoke unused tokens.
- Filter roster by verification status (`VERIFIED`, `PENDING`, `INVITED`, `SUSPENDED`, `DEPARTED`), role, and team (`BrokerAgents.jsx`).
- Create, update, and delete brokerage teams (`POST /api/agents/teams`, `PATCH /api/agents/teams/:teamId`, `DELETE /api/agents/teams/:teamId`).
- Review onboarding checklist completeness (`0%–100%`) and approve (`VERIFIED`) or reject (`REJECTED` with mandatory remarks) PRC/DHSUD credentials (`BrokerAgentDetail.jsx`).
- Edit governance fields (`team_id`, `can_create_listings`, `access_tier`, `commission_tier`, `location_branch`, `emergency_contact_name`, `emergency_contact_phone`, `internal_notes`) via `BrokerAgentEdit.jsx`.
- Preview active responsibilities (`GET /api/agents/:id/responsibilities-preview`) and execute idempotent bulk transfers (`POST /api/agents/:id/transfer-responsibilities`) to another eligible agent or the **Brokerage Unassigned Queue** (`targetAgentId: null`).
- Suspend, reactivate, or depart agents (`POST /api/agents/:id/depart`) while preserving historical closed sales attribution.
- Inspect immutable administrative audit trails (`GET /api/agents/audit-events`, `GET /api/agents/:id/audit-events`).

### Sales Agent Capabilities
- Validate and claim single-use 72-hour invitation tokens (`AgentRegisterPage.jsx`, `POST /api/agents/register-with-token`).
- View live onboarding completeness checklist (`computeAgentCompleteness`) and 3D lifecycle status pills (`AgentProfile.jsx`).
- Self-update permitted public profile fields (`name`, `phone`, `avatar`, `bio`, `experience_years`) and submit PRC/DHSUD credential renewals (`PATCH /api/agents/me/profile`).
- Toggle live lead-routing availability (`available | paused | vacation`), set `max_concurrent_leads`, configure `away_message`, manage weekly working slots, and add/remove blackout dates (`AgentAvailability.jsx`, `PUT /api/agents/:id/availability`).
- Propose edits on assigned listings (`POST /api/properties/:id/propose-edit`) or publish listings directly when granted `can_create_listings = true`.

### Client Capabilities
- View verified agent badges (`PRC Verified`, `DHSUD Accredited`), license validity state, brokerage/team affiliation, bio, experience, and active portfolio in `PublicAgentProfileModal.jsx` (launched from `PropertyListingView.jsx`).
- Initiate inquiries and schedule viewings directly from the public agent modal.

---

## 3. Brokerage, Team, and Role Permissions

| Action / Resource | Broker / Admin | Verified Sales Agent | Pending / Suspended / Departed Agent | Client / Public |
|---|---|---|---|---|
| Invite / Resend / Revoke Invitations | Allowed | Denied (`403`) | Denied (`403`) | Denied (`401/403`) |
| Create / Update / Delete Teams | Allowed | Read-Only (`GET /api/agents/teams`) | Denied | Denied |
| Approve / Reject / Suspend / Depart Agent | Allowed | Denied (`403`) | Denied (`403`) | Denied (`401/403`) |
| Edit Governance Fields (`can_create_listings`, `commission_tier`, `internal_notes`) | Allowed (`PATCH /api/agents/:id`) | Denied (stripped in `updateSelfProfile`) | Denied | Denied |
| Edit Self Public Profile & Credentials | Allowed | Allowed (`PATCH /api/agents/me/profile`) | Allowed for `PENDING` / `REJECTED` (Blocked for `SUSPENDED` / `DEPARTED`) | Denied |
| Create / Publish Property Listing | Allowed | Allowed **only if** `can_create_listings = true` | Denied (`403`) | Denied |
| Propose Edit on Assigned Listing | Allowed | Allowed (`POST /api/properties/:id/propose-edit`) | Denied (`403`) | Denied |
| View Public Agent Directory & Modal | Allowed | Allowed | Allowed | Allowed (`PublicAgentCardDTO` only) |

---

## 4. Invitation and Onboarding Lifecycle

1. **Invitation Issuance:** Broker submits `POST /api/invitations`. A CSPRNG 64-char hex token with a 72-hour `expires_at` window is created alongside pre-configured `team_id`, `can_create_listings`, `access_tier`, and `commission_tier`.
2. **Token Validation:** Prospective agent opens `/register/agent?token=...` which calls `GET /api/invitations/validate?token=...` to verify the token is `pending` and not expired, locking the invited email address.
3. **Atomic Claim & Registration:** Submitting `POST /api/agents/register-with-token` claims the token via `claim_agent_invitation(p_token, p_expected_email)` (or atomic fallback check), creates/updates the agent profile with `membership_status = 'active'`, `onboarding_status = 'pending_review'`, `verification_status = 'PENDING'`, and `routing_availability = 'paused'`.
4. **Broker Review:**
   - **Approve (`VERIFIED`):** Transitions `membership_status = 'active'`, `onboarding_status = 'complete'`, `verification_status = 'VERIFIED'`, and `routing_availability = 'available'`.
   - **Reject (`REJECTED`):** Requires `rejection_reason`, sets `onboarding_status = 'rejected'`, `verification_status = 'REJECTED'`, and `routing_availability = 'paused'` until the agent resubmits corrected credentials.

---

## 5. Membership Status and Availability Rules

The module separates agent state into **three orthogonal dimensions**:

| Dimension | Allowed Values | Purpose |
|---|---|---|
| `membership_status` | `invited \| active \| suspended \| departed` | Controls brokerage affiliation and portal access. Only 1 active membership (`invited`, `active`, `suspended`) is permitted per agent at a time; `departed` agents can join a new brokerage. |
| `onboarding_status` | `incomplete_profile \| pending_review \| rejected \| complete` | Tracks credential & profile verification readiness. |
| `routing_availability` | `available \| paused \| vacation` | Controls whether an active, verified agent receives new lead/inquiry assignments. |

### Invariant Rules (`AgentEligibilityService`)
- **`receive_lead` Eligibility:** Requires `membership_status === 'active'`, `onboarding_status === 'complete'`, `verification_status === 'VERIFIED'`, `license_status !== 'EXPIRED'`, `routing_availability === 'available'`, and no active blackout date in `agent_availability_schedules`.
- **`edit_listing` Eligibility:** Requires `membership_status === 'active'`, `onboarding_status === 'complete'`, `verification_status === 'VERIFIED'`, and `license_status !== 'EXPIRED'`. **Pausing `routing_availability` (`paused` or `vacation`) does NOT revoke `edit_listing`.**
- **`create_listing` Eligibility:** Requires all `edit_listing` criteria **plus** (`role === 'broker' || role === 'admin' || can_create_listings === true`).
- **Credential Re-Verification Trigger:** If a `VERIFIED` agent modifies `prc_license_no`, `prc_validity`, `dhsud_accreditation_no`, or `dhsud_validity` via `PATCH /api/agents/me/profile`, their status automatically transitions to `verification_status = 'PENDING'`, `onboarding_status = 'pending_review'`, and `routing_availability = 'paused'` until re-approved by the Broker.

---

## 6. UI/UX Screens, Interactions, and Interface States

All screens follow the **Human Shelter Realty Modern SaaS Design System** (`#0F766E` Teal Primary, `#115E59` Hover, `#FF6B6B` Coral Conversion CTA, `#F8FAFC` Slate Alabaster Canvas, `#FFFFFF` Surface with `1px border-[#E2E8F0]`, `rounded-lg` 8px radius):
- **`BrokerAgents.jsx` (`/broker/agents`):** 3 sub-tabs (`Agent Management`, `Agent Invitations`, `Teams`), 4 KPI cards with sparklines, search + multi-dropdown filter bar (`statusFilter`, `roleFilter`, `teamFilter`, `sortBy`), 3D status & license badges (`Valid`, `Expiring Soon`, `Expired`, `Departed`), Verification Donut Chart, live `Recent Activities` audit feed, and Onboarding Checklist progress bars.
- **`BrokerInviteAgent.jsx` (`/broker/agents/invite`):** 5-step wizard with Team assignment selector and Direct Listing Creation (`canCreateListings`) toggle in Step 4.
- **`BrokerAgentDetail.jsx` (`/broker/agents/:id`):** 3D status strip (`Membership`, `Onboarding`, `Lead Routing`, `Team`, `Listing Creation`), dynamic completeness progress bar (`agent.completeness.percent`), 5 tabs (`Overview`, `Listings`, `Inquiries`, `Performance`, `Activity`), plus **Transfer Active Work Modal**, **Depart Agent Modal**, and **Suspend Agent Modal** with live responsibility impact preview cards.
- **`BrokerAgentEdit.jsx` (`/broker/agents/:id/edit`):** Full Broker governance editor persisting `team_id`, `can_create_listings`, `access_tier`, `commission_tier`, `location_branch`, `emergency_contact_name`, `emergency_contact_phone`, and `internal_notes`.
- **`AgentProfile.jsx` (`/agent/profile`):** Dynamic onboarding checklist banner, 3D status pills, self-service public profile editor, credential renewal warning banner, and live public card preview.
- **`AgentAvailability.jsx` (`/agent/availability`):** Interactive 3-state routing selector (`Available for Routing`, `Pause New Leads`, `Vacation / Leave Mode`), max concurrent leads input, away message, blackout date manager, and weekly schedule grid.
- **`PublicAgentProfileModal.jsx` (Client Modal in `PropertyListingView.jsx`):** Displays verified PRC/DHSUD trust badges, brokerage/team affiliation, experience, bio, active listings, and direct Inquiry / Schedule Viewing CTAs.

---

## 7. Architecture and Business Rules

- **Backend Service Layer (`backend/src/services/`):**
  - `agent.service.ts`: Roster hydration, dynamic completeness calculation (`computeCompleteness`), license expiry evaluation (`evaluateLicenseStatus` with 30-day `EXPIRING_SOON` threshold), public DTO sanitization (`toPublicAgentCard`), Broker profile updates, and self-profile updates with credential change detection.
  - `agentTeam.service.ts`: Brokerage-scoped CRUD for `agent_teams`.
  - `agentAvailability.service.ts`: Manages `agent_availability_schedules`, blackout date evaluation, and syncs `routing_availability` onto the agent profile.
  - `agentEligibility.service.ts`: Enforces state machine transitions, action gates (`receive_lead`, `edit_listing`, `create_listing`, `assign_property`), and writes audit records to `agent_audit_events`.
  - `agentTransfer.service.ts`: Previews active responsibilities, executes idempotent bulk transfers (`idempotencyKey`), supports `retryTransfer`, and orchestrates the 7-step `departAgent` workflow.
- **Dual-Layer Persistence for Live Supabase Compatibility:** When the remote Supabase PostgREST schema cache has not yet applied DDL columns from `agent_management_v2_migration.sql`, `AgentService` automatically embeds and reads `{ _meta_type: 'agent_v2_metadata', ... }` inside `public.profiles.supporting_documents` (`JSONB`) and strips that metadata entry from public/document views.

---

## 8. Database Entities, Relationships, Indexes, and RLS Policies

Defined in `backend/src/models/agent_management_v2_migration.sql` and `backend/src/models/invitation_atomic_claim_migration.sql`:
1. **`public.profiles` (Extended Columns):**
   - `membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('invited', 'active', 'suspended', 'departed'))`
   - `onboarding_status TEXT DEFAULT 'incomplete_profile' CHECK (onboarding_status IN ('incomplete_profile', 'pending_review', 'rejected', 'complete'))`
   - `routing_availability TEXT DEFAULT 'paused' CHECK (routing_availability IN ('available', 'paused', 'vacation'))`
   - `brokerage_id UUID`, `team_id UUID`, `can_create_listings BOOLEAN DEFAULT FALSE`, `access_tier TEXT DEFAULT 'standard'`, `commission_tier TEXT DEFAULT 'Standard 3.0%'`, `location_branch TEXT`, `emergency_contact_name TEXT`, `emergency_contact_phone TEXT`, `internal_notes TEXT`, `departed_at TIMESTAMPTZ`, `departure_reason TEXT`.
   - **Partial Unique Index:** `idx_profiles_one_active_brokerage_per_agent ON public.profiles(id) WHERE role = 'agent' AND membership_status IN ('invited', 'active', 'suspended')`.
2. **`public.agent_teams`:** `id`, `brokerage_id`, `name`, `description`, `lead_agent_id`, `location_branch`, `is_active`, `created_at`, `updated_at`.
3. **`public.agent_availability_schedules`:** `agent_id (PK)`, `routing_availability`, `max_concurrent_leads`, `away_message`, `weekly_schedule (JSONB)`, `blackout_dates (JSONB)`, `updated_at`.
4. **`public.responsibility_transfers`:** `id`, `idempotency_key (UNIQUE)`, `brokerage_id`, `from_agent_id`, `to_agent_id (NULLABLE for Unassigned Queue)`, `initiated_by`, `transfer_type ('manual_transfer' | 'suspension_reassignment' | 'departure_transfer')`, `status ('pending' | 'completed' | 'partial_failure' | 'failed')`, `summary (JSONB)`, `error_details (JSONB)`, `reason`, `created_at`, `completed_at`.
5. **`public.agent_audit_events`:** `id`, `brokerage_id`, `actor_id`, `target_agent_id`, `action`, `previous_state (JSONB)`, `new_state (JSONB)`, `reason`, `notes`, `created_at`.
6. **RLS Policies:** Enable Brokerage/Admin full read/write within their brokerage, Agent self-read/write on `agent_availability_schedules`, and public read on active verified profiles.

---

## 9. APIs, Events, and Integrations

| Method & Route | Auth / Guard | Controller / Service | Purpose |
|---|---|---|---|
| `GET /api/agents/public` | Public | `AgentController.getPublicAgents` | Returns sanitized `PublicAgentCardDTO[]` for verified active agents. |
| `GET /api/agents/public/:id` | Public | `AgentController.getPublicAgentById` | Returns sanitized `PublicAgentCardDTO` + active public listings. |
| `GET /api/agents/me/profile` | Authenticated Agent | `AgentController.getMyProfile` | Returns the authenticated agent's full dossier + dynamic completeness checklist. |
| `PATCH /api/agents/me/profile` | Authenticated Agent | `AgentController.updateMyProfile` | Updates permitted self-editable fields; triggers `pending_review` if PRC/DHSUD fields change. |
| `GET /api/agents` | Authenticated | `AgentController.getAgents` | Returns full brokerage agent roster with 3D lifecycle states and completeness. |
| `GET /api/agents/teams` | Authenticated | `AgentController.getTeams` | Lists brokerage teams. |
| `POST /api/agents/teams` | Broker / Admin | `AgentController.createTeam` | Creates a brokerage team. |
| `PATCH /api/agents/teams/:teamId` | Broker / Admin | `AgentController.updateTeam` | Updates a brokerage team. |
| `DELETE /api/agents/teams/:teamId` | Broker / Admin | `AgentController.deleteTeam` | Soft-deletes a brokerage team and clears member `team_id`. |
| `GET /api/agents/audit-events` | Broker / Admin | `AgentController.getAllAuditEvents` | Lists recent administrative audit events across the brokerage. |
| `GET /api/agents/:id/audit-events` | Broker / Admin | `AgentController.getAgentAuditEvents` | Lists audit events for a specific agent. |
| `GET /api/agents/:id/availability` | Authenticated | `AgentController.getAvailability` | Returns `agent_availability_schedules` record for `:id`. |
| `PUT /api/agents/:id/availability` | Self Agent / Broker | `AgentController.updateAvailability` | Updates routing status, max leads, away message, weekly schedule, and blackout dates. |
| `GET /api/agents/:id/eligibility` | Authenticated | `AgentController.checkEligibility` | Evaluates `canPerformAction(id, action)` (`receive_lead`, `edit_listing`, `create_listing`). |
| `GET /api/agents/:id/responsibilities-preview` | Broker / Admin | `AgentController.previewResponsibilities` | Returns counts & samples of active listings, open inquiries, upcoming viewings, and closed deals. |
| `POST /api/agents/:id/transfer-responsibilities` | Broker / Admin | `AgentController.transferResponsibilities` | Executes idempotent transfer to `targetAgentId` or `null` (Unassigned Queue). |
| `POST /api/agents/transfers/:transferId/retry` | Broker / Admin | `AgentController.retryTransfer` | Retries a failed or partially failed transfer operation. |
| `POST /api/agents/:id/depart` | Broker / Admin | `AgentController.departAgent` | Transitions agent to `departed`, pauses routing, transfers active work, preserves closed deals. |
| `GET /api/agents/:id/performance` | Self Agent / Broker | `AgentController.getPerformanceSummary` | Returns attributed closed deals, revenue, active listings, open inquiries, and upcoming viewings. |

---

## 10. Suspension, Departure, and Transfer Behavior

1. **Suspension (`verification_status = 'SUSPENDED'`):**
   - Sets `membership_status = 'suspended'` and `routing_availability = 'paused'`.
   - Immediately blocks `receive_lead`, `edit_listing`, and `create_listing`.
   - Broker can optionally transfer the suspended agent's active work via the **Transfer Active Work** modal.
2. **Departure (`POST /api/agents/:id/depart`):**
   - Executes the 7-step workflow:
     1. Previews outstanding active listings, open inquiries (`NEW`, `CONTACTED`, `SCHEDULED`, `NEGOTIATING`), and upcoming viewings (`PENDING`, `CONFIRMED`).
     2. Validates target agent eligibility (if `targetAgentId` is provided) or targets the **Brokerage Unassigned Queue** (`targetAgentId = null`).
     3. Stops new assignments (`routing_availability = 'paused'`).
     4. Revokes brokerage membership (`membership_status = 'departed'`, records `departed_at` and `departure_reason`).
     5. Reassigns active listings, open inquiries, and upcoming viewings to the destination.
     6. **Preserves Historical Attribution:** Closed sales (`sales.status = 'COMPLETED'`) are never reassigned and remain permanently credited to the original closing agent.
     7. Records the transfer ledger entry in `responsibility_transfers` (with `idempotency_key` deduplication and `/retry` support) and writes an immutable event to `agent_audit_events`.

---

## 11. Performance Metric Definitions and Attribution Rules

- **Assigned Listings (`assigned_properties_count`):** Count of non-archived properties currently assigned to the agent (`properties.assigned_agent_id = agent.id`). Reassigned upon work transfer.
- **Open Inquiries (`active_inquiries_count`):** Count of inquiries in active pipeline states (`NEW`, `CONTACTED`, `SCHEDULED`, `NEGOTIATING`) currently assigned to the agent. Reassigned upon work transfer.
- **Upcoming Viewings (`upcoming_viewings_count`):** Count of scheduled property viewings (`PENDING`, `CONFIRMED`). Reassigned upon work transfer.
- **Recorded Closed Deals (`recorded_sales_count`) & Closed Revenue (`closedRevenue`):** Count and total amount of `public.sales` rows where `agent_id = agent.id` and `status = 'COMPLETED'`. **Permanently attributed to the closing agent even after transfer or departure.**

---

## 12. Verification Evidence and Results

Verified on `2026-10-21` (full report in `docs/reports/agent-management-module-verification-report.md`):
- `test files/backend/agentManagementSchema.test.ts`: **3 passed**
- `test files/backend/agentOnboardingLifecycle.test.ts`: **4 passed**
- `test files/backend/agentAvailabilityAndTeams.test.ts`: **2 passed**
- `test files/backend/agentTransferAndDeparture.test.ts`: **2 passed**
- `test files/backend/services/agentEligibility.service.test.ts`: **8 passed**
- `test files/backend/services/agent-management-lifecycle.e2e.test.ts`: **7 passed**
- `test files/frontend/agentManagementModule.test.jsx`: **4 passed**
- `frontend` production build (`npm run build`): **Passed (Exit 0)**

---

## 13. Decisions, Deviations, Limitations, and Deferred Work

- **Approved Decisions Implemented:**
  - Single active brokerage per agent (`invited | active | suspended`), while `departed` agents can join a new brokerage.
  - Brokers create/publish listings by default; verified agents propose edits unless explicitly granted `can_create_listings = true`.
  - Credential edits by a verified agent trigger `pending_review` re-verification.
  - Closed deals (`COMPLETED`) remain permanently attributed to the original closer.
- **Known Environment Limitation & Mitigation:**
  - `backend/.env` connects to Supabase via HTTPS (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) without a direct Postgres port-5432 `SUPABASE_DB_URL` string. Until `backend/src/models/agent_management_v2_migration.sql` is executed in the Supabase SQL Editor, the backend services transparently persist and hydrate v2 fields using `supporting_documents` JSONB metadata and service-layer stores.
- **Deferred / Out-of-Scope Items:**
  - Payroll, commission disbursement accounting, external recruitment job boards, and LMS training modules remain outside module boundaries per Phase 2 specification.

---

## 14. Relevant Files, Migrations, Contracts, and Tests

### Shared Contracts & Migrations
- `shared/types/agent.ts`
- `backend/src/models/invitation_atomic_claim_migration.sql`
- `backend/src/models/agent_management_v2_migration.sql`
- `backend/src/scripts/migrate.ts`

### Backend Services, Schemas, Controllers & Routes
- `backend/src/services/agent.service.ts`
- `backend/src/services/agentTeam.service.ts`
- `backend/src/services/agentAvailability.service.ts`
- `backend/src/services/agentEligibility.service.ts`
- `backend/src/services/agentTransfer.service.ts`
- `backend/src/services/agentRegistration.service.ts`
- `backend/src/services/invitation.service.ts`
- `backend/src/schemas/agent.schema.ts`
- `backend/src/schemas/invitation.schema.ts`
- `backend/src/controllers/agent.controller.ts`
- `backend/src/controllers/property.controller.ts`
- `backend/src/routes/agent.routes.ts`

### Frontend Services, Modals & Portal Pages
- `frontend/src/services/agentService.js`
- `frontend/src/components/ui/modals/PublicAgentProfileModal.jsx`
- `frontend/src/pages/public/PropertyListingView.jsx`
- `frontend/src/pages/portals/broker/BrokerAgents.jsx`
- `frontend/src/pages/portals/broker/BrokerInviteAgent.jsx`
- `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
- `frontend/src/pages/portals/broker/BrokerAgentEdit.jsx`
- `frontend/src/pages/portals/agent/AgentProfile.jsx`
- `frontend/src/pages/portals/agent/AgentAvailability.jsx`

### Automated Verification Suites
- `test files/backend/agentManagementSchema.test.ts`
- `test files/backend/agentOnboardingLifecycle.test.ts`
- `test files/backend/agentAvailabilityAndTeams.test.ts`
- `test files/backend/agentTransferAndDeparture.test.ts`
- `test files/backend/services/agentEligibility.service.test.ts`
- `test files/backend/services/agent-management-lifecycle.e2e.test.ts`
- `test files/frontend/agentManagementModule.test.jsx`

---

## 15. Implementation Version and Verification Date

- **Implementation Version:** `2.0.0`
- **Verification Date:** `2026-10-21`
- **Verification Status:** **COMPLETE & VERIFIED (30/30 Automated Tests Passing, Production Build Clean)**
