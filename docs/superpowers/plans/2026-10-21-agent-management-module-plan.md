# Agent Management Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and complete the full-lifecycle Agent Management Module across Supabase PostgreSQL, Express TypeScript Backend, and React 19 Frontend Portals (Broker, Sales Agent, and Client) with 3-dimensional status modeling, brokerage/team isolation, routing availability, and responsibility transfers.

**Architecture:** Approach A — Relational Brokerage Membership & Synced Profile Projection. Dedicated tables (`brokerages`, `teams`, `brokerage_memberships`, `agent_availability_schedules`, `agent_responsibility_transfers`) govern multi-brokerage isolation (1 active brokerage per agent), team placement, routing schedules, and transfer operations while projecting status fields onto `public.profiles` via PostgreSQL triggers so existing foreign keys remain 100% compatible.

**Tech Stack:** PostgreSQL / Supabase (RLS + Triggers + RPC), Node.js + Express v5 + TypeScript + Zod, React 19 + Vite 8 + Tailwind CSS v4 + Lucide Icons, Vitest + Supertest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-21-agent-management-module-design.md`

## Global Constraints

- Design System: Human Shelter Realty | Modern SaaS (`#0F766E` Teal primary, `#115E59` hover, `#FF6B6B` Coral accent, `#F8FAFC` Slate Alabaster ground, `#FFFFFF` Pure White surface, `1px border-[#E2E8F0]`, standard `8px` `rounded-lg` radius, strict `8px` spacing grid).
- API Envelope: All endpoints must return `ApiResponse<T>` (`{ success: boolean, data?: T, error?: string, message?: string, timestamp: string }`).
- Timezone Invariant: PRC and DHSUD credential expirations must be evaluated against `Asia/Manila` (`UTC+8`) end-of-day (`23:59:59.999+08:00`).
- Zero Mock Fallbacks in Production Services: Frontend and backend services must query real database records and live API endpoints without `Math.random()` or hardcoded mock arrays.
- Git Safety: Never run `git push` unless explicitly instructed by the user.

---

### Task 1: Reconcile Unapplied Migrations & Apply Agent Management v2 Schema (`backend/src/models/`)

**Files:**
- Create: `backend/src/models/agent_management_v2_migration.sql`
- Modify: `backend/src/scripts/migrate.ts`
- Modify: `shared/types/agent.ts`
- Test: `test files/backend/agentManagementSchema.test.ts`

**Interfaces:**
- Produces:
  - Database tables: `public.brokerages`, `public.teams`, `public.brokerage_memberships`, `public.agent_availability_schedules`, `public.agent_responsibility_transfers`, plus reconciled `public.agent_credential_documents`, `public.agent_audit_events`, `public.claim_agent_invitation` RPC, and `public.inquiries` assignment columns.
  - Shared types in `shared/types/agent.ts`: `MembershipStatus` (`'invited' | 'active' | 'suspended' | 'departed'`), `OnboardingStatus` (`'incomplete' | 'pending_review' | 'complete' | 'rejected'`), `RoutingAvailability` (`'available' | 'paused' | 'scheduled_unavailable'`), `AgentTeamDTO`, `AgentAvailabilityScheduleDTO`, `ResponsibilityPreviewDTO`, `ResponsibilityTransferRequestDTO`, `ResponsibilityTransferResultDTO`, `AgentAuditEventDTO`, `PublicAgentProfileDTO`.

- [ ] **Step 1: Write failing schema & contract test (`test files/backend/agentManagementSchema.test.ts`)**
- [ ] **Step 2: Run test to verify RED**
- [ ] **Step 3: Author `backend/src/models/agent_management_v2_migration.sql` and update `shared/types/agent.ts`**
- [ ] **Step 4: Apply unapplied migrations and `agent_management_v2_migration.sql` to the connected Supabase database and verify GREEN**

---

### Task 2: Vertical Slice 1 — Multi-Brokerage Invitations, Atomic Claim & Onboarding Checklist (`InvitationService`, `AgentRegistrationService`, `AgentService`)

**Files:**
- Modify: `backend/src/schemas/invitation.schema.ts`
- Modify: `backend/src/schemas/agent.schema.ts`
- Modify: `backend/src/services/invitation.service.ts`
- Modify: `backend/src/services/agentRegistration.service.ts`
- Modify: `backend/src/services/agent.service.ts`
- Modify: `backend/src/controllers/agent.controller.ts`
- Modify: `backend/src/routes/agent.routes.ts`
- Test: `test files/backend/agentOnboardingLifecycle.test.ts`

**Interfaces:**
- Consumes: `shared/types/agent.ts`, `public.agent_invitations`, `public.brokerage_memberships`, `public.profiles`
- Produces:
  - `AgentService.computeCompleteness(profile, documents): AgentCompletenessInfo`
  - `AgentService.getAgentById(id, actorBrokerageId?)`
  - `AgentService.listAgents(query, actorBrokerageId?)`
  - `AgentService.listPublicAgents()` & `AgentService.getPublicAgentById(id)`
  - `GET /api/agents/me`, `GET /api/agents/public`, `GET /api/agents/public/:id`
  - Multi-brokerage check in `AgentRegistrationService.registerInvitedAgent`: prevents joining a second active brokerage (`409 ACTIVE_BROKERAGE_MEMBERSHIP_EXISTS`) while allowing `departed` agents to join a new brokerage.

- [ ] **Step 1: Write failing unit/integration tests for 3-dimensional onboarding completeness, multi-brokerage isolation, invitation revocation, and public profile field stripping (`test files/backend/agentOnboardingLifecycle.test.ts`)**
- [ ] **Step 2: Run test to verify RED**
- [ ] **Step 3: Implement completeness calculator, multi-brokerage isolation, `GET /api/agents/me`, and `GET /api/agents/public` endpoints**
- [ ] **Step 4: Run test to verify GREEN**

---

### Task 3: Teams, Role Administration, Routing Availability & Eligibility Engine (`AgentTeamService`, `AgentAvailabilityService`, `AgentEligibilityService`)

**Files:**
- Create: `backend/src/services/agentTeam.service.ts`
- Create: `backend/src/services/agentAvailability.service.ts`
- Modify: `backend/src/services/agentEligibility.service.ts`
- Modify: `backend/src/controllers/agent.controller.ts`
- Modify: `backend/src/controllers/property.controller.ts`
- Modify: `backend/src/routes/agent.routes.ts`
- Test: `test files/backend/agentAvailabilityAndTeams.test.ts`

**Interfaces:**
- Consumes: `public.teams`, `public.brokerage_memberships`, `public.agent_availability_schedules`
- Produces:
  - `AgentTeamService.listTeams(brokerageId)`, `createTeam`, `updateTeam`, `deleteTeam`
  - `AgentAvailabilityService.getAvailability(agentId)`, `updateAvailability(agentId, payload, actorId)`
  - `AgentEligibilityService.evaluate(agentId, operation, now)`: checks `membership_status === 'active'`, `onboarding_status === 'complete'`, `verification_status === 'VERIFIED'`, `Asia/Manila` credential validity, `can_create_listings` (for `create_listing`), and `routing_availability === 'available'` + schedule/blackout/capacity (for `receive_lead`).
  - Endpoints:
    - `GET /api/agents/teams`, `POST /api/agents/teams`, `PUT /api/agents/teams/:teamId`, `DELETE /api/agents/teams/:teamId`
    - `GET /api/agents/:id/availability`, `PUT /api/agents/:id/availability`
    - `GET /api/agents/:id/eligibility`

- [ ] **Step 1: Write failing tests for team CRUD, routing availability persistence, and eligibility evaluation (`receive_lead` vs `edit_listing` vs `create_listing`) (`test files/backend/agentAvailabilityAndTeams.test.ts`)**
- [ ] **Step 2: Run test to verify RED**
- [ ] **Step 3: Implement `AgentTeamService`, `AgentAvailabilityService`, updated `AgentEligibilityService`, and controller routes**
- [ ] **Step 4: Run test to verify GREEN**

---

### Task 4: Suspension, Departure, Responsibility Transfers & Performance/Audit History (`AgentTransferService`, `AgentService`)

**Files:**
- Create: `backend/src/services/agentTransfer.service.ts`
- Modify: `backend/src/services/agent.service.ts`
- Modify: `backend/src/controllers/agent.controller.ts`
- Modify: `backend/src/routes/agent.routes.ts`
- Test: `test files/backend/agentTransferAndDeparture.test.ts`

**Interfaces:**
- Consumes: `public.properties`, `public.inquiries`, `public.appointments`, `public.sales`, `public.agent_responsibility_transfers`, `public.agent_audit_events`, `public.notifications`
- Produces:
  - `AgentTransferService.previewResponsibilities(agentId, brokerageId)`
  - `AgentTransferService.executeTransfer(sourceAgentId, payload, actorId)`
  - `AgentTransferService.retryTransfer(transferId, actorId)`
  - `AgentTransferService.departAgent(agentId, payload, actorId)`
  - `AgentService.getAuditEvents(agentId?, brokerageId?)`
  - `AgentService.getPerformanceSummary(agentId?, brokerageId?)`
  - Endpoints:
    - `GET /api/agents/:id/responsibilities`
    - `POST /api/agents/:id/responsibilities/transfer`
    - `POST /api/agents/transfers/:transferId/retry`
    - `POST /api/agents/:id/depart`
    - `GET /api/agents/:id/audit-events` & `GET /api/agents/audit-events`
    - `GET /api/agents/:id/performance` & `GET /api/agents/performance/summary`

- [ ] **Step 1: Write failing tests for responsibility preview, bulk/selective transfer, unassigned queue fallback, partial failure recovery/idempotent retry, departure workflow, and historical sales attribution (`test files/backend/agentTransferAndDeparture.test.ts`)**
- [ ] **Step 2: Run test to verify RED**
- [ ] **Step 3: Implement `AgentTransferService`, audit/performance queries, and notification triggers**
- [ ] **Step 4: Run test to verify GREEN**

---

### Task 5: Frontend Services, Broker Portal, Sales Agent Portal & Client Public Agent Profile (`frontend/src/`)

**Files:**
- Modify: `frontend/src/services/agentService.js`
- Modify: `frontend/src/services/invitationService.js`
- Modify: `frontend/src/pages/portals/broker/BrokerAgents.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerInviteAgent.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAgentEdit.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentProfile.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentAvailability.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentDashboard.jsx`
- Create: `frontend/src/components/ui/modals/PublicAgentProfileModal.jsx`
- Modify: `frontend/src/components/ui/index.js`
- Modify: `frontend/src/pages/public/PropertyListingView.jsx`
- Test: `frontend/src/pages/portals/broker/__tests__/BrokerAgentDetail.honestUI.test.jsx`, `frontend/src/pages/portals/agent/__tests__/AgentPortalLifecycle.test.jsx`

**Interfaces:**
- Consumes: All `/api/agents/*` and `/api/invitations/*` endpoints
- Produces:
  - Live data-driven Broker Directory (`BrokerAgents.jsx` with Team Drawer, Revoke Invite, 3D status filters), Broker Dossier (`BrokerAgentDetail.jsx` with dynamic Onboarding Checklist, live Performance & Audit tabs, and 3-step Suspension/Transfer/Departure Wizard Modal), and Broker Editor (`BrokerAgentEdit.jsx` persisting all governance fields).
  - Live data-driven Sales Agent Profile & Onboarding Checklist (`AgentProfile.jsx` + `AgentDashboard.jsx` with Public Profile Preview and Credential Resubmission) and Availability Settings (`AgentAvailability.jsx` persisted to backend).
  - Client-facing `PublicAgentProfileModal.jsx` integrated into `PropertyListingView.jsx` with brokerage fallback support.

- [ ] **Step 1: Write failing frontend component tests for dynamic onboarding completeness, responsibility transfer/departure modal, agent self-profile/availability persistence, and public agent profile modal**
- [ ] **Step 2: Run frontend tests to verify RED**
- [ ] **Step 3: Implement `agentService.js`, `invitationService.js`, Broker Portal screens, Sales Agent Portal screens, and `PublicAgentProfileModal.jsx` adhering strictly to Modern SaaS tokens (`#0F766E` Teal, `#FF6B6B` Coral, `8px` radius, `8px` grid)**
- [ ] **Step 4: Run frontend tests and `npm run build` to verify GREEN**

---

### Task 6: Phase 5 End-to-End Verification & Phase 6 `/learn` Module Documentation

**Files:**
- Create: `test files/backend/agentManagementE2E.verification.test.ts`
- Create: `docs/modules/03-agent-management/2026-10-14-agent-management-module-verification-report.md`
- Create: `docs/modules/03-agent-management/2026-10-21-agent-management-technical-reference.md`

- [ ] **Step 1: Execute complete E2E verification suite covering all Phase 5 acceptance criteria (Invitations & Onboarding, Profiles & Permissions, Availability & Assignment, Suspension & Departure Transfers, Reporting & Experience)**
- [ ] **Step 2: Record evidence and results in `docs/modules/03-agent-management/2026-10-14-agent-management-module-verification-report.md`**
- [ ] **Step 3: Write the comprehensive Phase 6 `/learn` module summary in `docs/modules/03-agent-management/2026-10-21-agent-management-technical-reference.md`**
