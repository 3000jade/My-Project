# Agent Management Module — Architecture & Design Specification

> **Date:** 2026-10-21  
> **Module Reference:** `docs/implementation/agentmanagementModule.md`  
> **Selected Architecture:** Approach A — Relational Brokerage Membership & Synced Profile Projection  
> **Design System:** Human Shelter Realty | Modern SaaS (`#0F766E` Teal, `#115E59` Hover, `#FF6B6B` Coral, `#F8FAFC` Slate Alabaster, `#FFFFFF` Pure White, `8px` grid & `8px` radius)

---

## 1. Purpose, Scope & Resolved Policy Decisions

The Agent Management Module governs the complete lifecycle of real estate sales agents within a brokerage on the **CP_kerby** platform across three stakeholders: **Brokers**, **Sales Agents**, and **Clients**.

### 1.1 Resolved Architectural & Policy Decisions
1. **Multi-Brokerage Platform (1 Active Brokerage per Agent):**
   - Multiple independent brokerages exist with strict backend and database (RLS) isolation.
   - An agent may hold at most **one** non-departed brokerage membership (`invited`, `active`, or `suspended`) at any given time, enforced via a partial unique index `idx_brokerage_memberships_one_active`.
   - Past `departed` memberships are retained historically so audit trails and closed transaction attributions are never lost, while freeing the agent's identity (`public.profiles`) to join another brokerage later.
2. **Listing Creation & Team Access:**
   - Brokers create and publish property listings by default.
   - Active, verified Sales Agents (`membership_status = 'active'`, `onboarding_status = 'complete'`, `license_status = 'VALID'`) can propose edits (`property_edit_requests`) on assigned listings and view team-shared workload within their assigned team.
   - Brokers can explicitly grant an agent a `can_create_listings = true` permission flag on their brokerage membership to allow direct draft listing creation (`POST /api/properties`).
3. **Profile Field Ownership & Onboarding Review:**
   - **Public & Self-Editable by Agent (Immediate Save):** `full_name`, `phone`, `avatar_url`, `bio`, `experience_years`.
   - **Compliance-Gated (Requires Broker Approval):** `prc_license_no`, `prc_validity`, `dhsud_accreditation_no`, `dhsud_validity`, and `agent_credential_documents`. Modifying verified credentials transitions `onboarding_status` to `pending_review` (`verification_status = 'PENDING'`) until re-approved by the Broker.
   - **Internal / Broker-Only:** `team_id`, `can_create_listings`, `access_tier`, `commission_tier`, `location_branch`, `emergency_contact_name`, `emergency_contact_phone`, `internal_notes`, `suspension_reason`, `suspension_notes`.
4. **Routing Availability vs. Existing Work:**
   - Setting `routing_availability` to `paused` or `scheduled_unavailable` (or outside weekly hours / blackout dates / max inquiry capacity) stops **new lead assignments** (`receive_lead`), while preserving the agent's access to their existing assigned listings, open inquiries, and scheduled viewings.
5. **Suspension vs. Departure & Responsibility Transfers:**
   - **Suspension (`membership_status = 'suspended'`):** Requires `suspension_reason`. Immediately blocks new assignments (`receive_lead`, `assign_listing`) and revokes portal write access (`edit_listing`, `create_listing`). Broker may either hold existing work in place or execute a Responsibility Transfer.
   - **Departure (`membership_status = 'departed'`):** Terminal for that brokerage membership. Stops all new assignments, revokes brokerage access, and **requires** previewing and executing a Responsibility Transfer (reassigning active listings, open inquiries, and upcoming viewings to an eligible agent in the same brokerage or to the **Brokerage Unassigned Queue**).
6. **Performance Attribution:**
   - Closed deals (`sales.status = 'COMPLETED'`) remain permanently attributed to the closing `agent_id`.
   - Open inquiries, active listings, and upcoming viewings transferred during suspension/departure count toward the receiving agent's active workload and future closing metrics, while `property_audit_log`, `inquiry_assignment_audit`, and `agent_responsibility_transfers` preserve historical authorship.

---

## 2. Three-Dimensional Lifecycle Model

| Dimension | Column | Allowed Values |
| :--- | :--- | :--- |
| **Membership Status** | `membership_status` | `'invited'`, `'active'`, `'suspended'`, `'departed'` |
| **Onboarding Status** | `onboarding_status` | `'incomplete'`, `'pending_review'`, `'complete'`, `'rejected'` |
| **Routing Availability** | `routing_availability` | `'available'`, `'paused'`, `'scheduled_unavailable'` |

### Effective Eligibility Invariant
An agent is eligible for `receive_lead` if and only if:
- `membership_status === 'active'`
- `onboarding_status === 'complete'`
- `verification_status === 'VERIFIED'`
- PRC and DHSUD numbers are present and unexpired in `Asia/Manila` (`UTC+8`) end-of-day
- `routing_availability === 'available'`, not in an active blackout window, and below `max_active_inquiries` (when `auto_pause_on_capacity` is enabled).

---

## 3. Database Schema & Migration Design (`backend/src/models/agent_management_v2_migration.sql`)

### 3.1 Reconciling Unapplied Prior Migrations
Ensure idempotent application of:
- `invitation_atomic_claim_migration.sql`
- `agent_credential_documents_migration.sql`
- `agent_audit_events_migration.sql`
- `inquiries_module_migration.sql`

### 3.2 New Relational Tables & Synced Projection
1. `public.brokerages`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `name TEXT NOT NULL`, `slug TEXT NOT NULL UNIQUE`, `prc_broker_license_no TEXT`, `owner_broker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `fallback_queue_email TEXT`, `status TEXT NOT NULL DEFAULT 'active'`, `created_at`, `updated_at`.
   - Seeded with default `'Human Shelter Realty'` (`slug = 'human-shelter-realty'`).
2. `public.teams`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE`, `name TEXT NOT NULL`, `description TEXT`, `lead_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `created_at`, `updated_at`, `UNIQUE (brokerage_id, name)`.
3. `public.brokerage_memberships`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE`, `agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL`.
   - Status columns: `membership_status`, `onboarding_status`, `routing_availability`.
   - Role & governance columns: `can_create_listings`, `access_tier`, `commission_tier`, `location_branch`, `emergency_contact_name`, `emergency_contact_phone`, `internal_notes`.
   - Audit columns: `invited_by`, `verified_by`, `verified_at`, `rejection_remarks`, `suspended_by`, `suspended_at`, `suspension_reason`, `suspension_notes`, `departed_by`, `departed_at`, `departure_reason`, `created_at`, `updated_at`.
   - Partial unique index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerage_memberships_one_active ON public.brokerage_memberships (agent_id) WHERE membership_status IN ('invited', 'active', 'suspended');`
4. `public.agent_availability_schedules`:
   - `agent_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `brokerage_id UUID REFERENCES public.brokerages(id) ON DELETE CASCADE`, `routing_availability TEXT NOT NULL DEFAULT 'available'`, `timezone TEXT NOT NULL DEFAULT 'Asia/Manila'`, `weekly_schedule JSONB NOT NULL DEFAULT '{}'::jsonb`, `blackout_dates JSONB NOT NULL DEFAULT '[]'::jsonb`, `max_active_inquiries INTEGER NOT NULL DEFAULT 25`, `auto_pause_on_capacity BOOLEAN NOT NULL DEFAULT true`, `away_message TEXT`, `updated_by UUID`, `updated_at TIMESTAMPTZ`.
5. `public.agent_responsibility_transfers`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE`, `source_agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `target_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `trigger_type TEXT NOT NULL CHECK (trigger_type IN ('suspension', 'departure', 'manual_transfer'))`, `status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'partial_failure', 'failed'))`, `idempotency_key TEXT UNIQUE`, `summary_counts JSONB NOT NULL DEFAULT '{}'::jsonb`, `transferred_items JSONB NOT NULL DEFAULT '[]'::jsonb`, `notes TEXT`, `created_at TIMESTAMPTZ`, `completed_at TIMESTAMPTZ`.
6. `public.profiles` & `public.agent_invitations` extensions:
   - `public.profiles` adds `brokerage_id`, `team_id`, `membership_status`, `onboarding_status`, `routing_availability`, `can_create_listings`, `access_tier`, `commission_tier`, `location_branch`, `emergency_contact_name`, `emergency_contact_phone`, `internal_notes`, `departed_at`, `departure_reason`.
   - Trigger `sync_membership_to_profile()` automatically projects `brokerage_memberships` updates to `public.profiles`.
   - Trigger `guard_profile_sensitive_columns()` prevents ordinary authenticated users from self-escalating `role`, `verification_status`, `membership_status`, `onboarding_status`, `brokerage_id`, or `can_create_listings`.

---

## 4. API & Service Contracts

1. **Invitations (`/api/invitations`)**:
   - `POST /api/invitations`: Scoped to broker's `brokerage_id`, supports `teamId`, `role`, `allowReissue`.
   - `GET /api/invitations`: Scoped to broker's `brokerage_id`.
   - `POST /api/invitations/:id/resend`: Rotates token & extends expiry by 72h.
   - `POST /api/invitations/:id/revoke`: Marks pending invitation `revoked`.
   - `GET /api/invitations/validate/:token`: Public validation.
2. **Agent Directory, Self-Profile & Public Profile (`/api/agents`)**:
   - `GET /api/agents/public` & `GET /api/agents/public/:id`: Public endpoints returning only active, verified agents with valid licenses and public-safe fields.
   - `GET /api/agents`: Broker/Admin directory with filters (`status`, `membershipStatus`, `onboardingStatus`, `availability`, `teamId`, `search`).
   - `GET /api/agents/me`: Authenticated agent's own full profile, completeness breakdown, availability schedule, and audit history.
   - `GET /api/agents/:id`: Broker/Admin single agent lookup (enforcing brokerage isolation).
   - `PUT /api/agents/:id`: Self or Broker/Admin profile update (enforcing field-level permissions and resetting `onboarding_status` to `pending_review` if an agent modifies PRC/DHSUD credentials).
   - `PUT /api/agents/:id/status`: Broker/Admin status transition (`VERIFIED`, `REJECTED`, `SUSPENDED`, `PENDING`) + notification emission + audit logging.
   - `POST /api/agents/:id/resubmit-credentials`: Agent credential resubmission.
3. **Teams (`/api/agents/teams`)**:
   - `GET /api/agents/teams`, `POST /api/agents/teams`, `PUT /api/agents/teams/:teamId`, `DELETE /api/agents/teams/:teamId`.
4. **Availability & Eligibility (`/api/agents/:id/availability`, `/api/agents/:id/eligibility`)**:
   - `GET /api/agents/:id/availability`, `PUT /api/agents/:id/availability`: Reads/persists routing availability, weekly schedule, blackout dates, and max inquiry capacity.
   - `GET /api/agents/:id/eligibility`: Evaluates operational eligibility (`create_listing`, `edit_listing`, `publish_listing`, `receive_lead`).
5. **Responsibility Transfers, Departure & Audit (`/api/agents/:id/responsibilities`, `/api/agents/:id/depart`, `/api/agents/:id/audit-events`)**:
   - `GET /api/agents/:id/responsibilities`: Preview assigned listings, open inquiries, upcoming viewings, and eligible target agents in the same brokerage.
   - `POST /api/agents/:id/responsibilities/transfer`: Execute bulk or selective transfer to target agent or Brokerage Unassigned Queue (`targetAgentId: null`) with idempotency key and per-item failure reporting.
   - `POST /api/agents/transfers/:transferId/retry`: Idempotent retry of failed transfer items.
   - `POST /api/agents/:id/depart`: Execute departure workflow (requiring transfer of outstanding work or routing to Unassigned Queue, setting `membership_status = 'departed'`, and logging audit event).
   - `GET /api/agents/:id/audit-events` & `GET /api/agents/audit-events`: Query immutable administrative history.
