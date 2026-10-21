# Broker Agent Management Data & UI Defects Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct all verified data inaccuracies, mock fallbacks, hardcoded metrics, compliance/licensing status misrepresentations, plaintext token security leaks, and UI synchronization defects across the Broker Agent Management page (`/broker/agents`), Agent Detail dossier (`/broker/agents/:id`), and Invitations ledger.

**Architecture:** Maintain clean decoupled architecture:
1. Update shared contracts (`shared/types/agent.ts`, `shared/types/property.ts`) with strict nullable types and clean DTO boundaries.
2. Extend backend controllers, validation schemas (`backend/src/schemas/`), and services (`agent.service.ts`, `invitation.service.ts`, `property.service.ts`) with batched aggregate counts, `list_agent_key` property filters, secure invitation list allowlists, and accurate profile fields.
3. Update frontend service normalizers (`frontend/src/services/agentService.js`, `invitationService.js`, `propertyService.js`) to eliminate loose logical OR defaults (`0 || 3`, bogus phone numbers, Unsplash photo fallbacks).
4. Update UI components (`BrokerAgents.jsx`, `BrokerAgentDetail.jsx`) with realistic initials avatars, separate license status logic, dynamic Manila timezone formatting, accessible labels, empty/error retry states, and accurate donut/metric calculations.

**Tech Stack:** React 19, TypeScript, Express v5, Vitest, Playwright, Supabase PostgreSQL, Tailwind CSS v4.

**Spec:** `docs/reports/broker-agent-management-data-verification.md`

## Global Constraints
- Preserve existing database schema, authentication, permissions, registration workflows, and production records. Do not run DDL or mutate live production rows.
- Never invent mock data or placeholder values for missing fields. Missing fields must display explicit UI states ("Not provided", "No biography provided", "0 years of experience", "Experience not provided").
- Preserve date-only validity values without timezone shift. Evaluate license expiration in Philippine calendar time (`Asia/Manila`).
- Keep profile verification status separate from license and accreditation validity. A `VERIFIED` profile must not automatically receive a `Valid` license badge.
- Never expose plaintext invitation tokens or token digests in list endpoints.
- All aggregate counts (Listings, Inquiries, Appointments, Sales) must reflect actual database relationships and batched queries, returning `0` when empty.

---

### Task 1: Update Shared Contracts & Types

**Files:**
- Modify: `shared/types/agent.ts`
- Modify: `shared/types/property.ts`

**Interfaces:**
- `AgentProfileDTO`: make `phone`, `avatar`, `bio`, `experience_years`, `prc_license_no`, `prc_validity`, `dhsud_accreditation_no`, `dhsud_validity`, `created_at` nullable/optional as appropriate.
- `AgentInvitationSummaryDTO`: DTO for ordinary invitation list responses omitting `token`, `token_digest`, and `registration_attempt_id`.
- `PropertyFilterQuery`: add `list_agent_key` (and camelCase `listAgentKey`).

- [x] **Step 1: Write contract type definitions in `shared/types/agent.ts` and `shared/types/property.ts`**
- [x] **Step 2: Verify TypeScript compiles shared types without syntax errors**

---

### Task 2: Backend - Support `list_agent_key` in Property Query API

**Files:**
- Modify: `backend/src/schemas/property.schema.ts`
- Modify: `backend/src/services/property.service.ts`
- Test: `test files/backend/property-list-agent-filter.test.ts`

**Interfaces:**
- Consumes: `QueryPropertyInput`
- Produces: `findProperties({ list_agent_key?: string, listAgentKey?: string })` filtering by `properties.list_agent_key = uuid`

- [x] **Step 1: Write failing unit test for `list_agent_key` filtering**
- [x] **Step 2: Run test to confirm failure**
- [x] **Step 3: Update `queryPropertySchema` in `backend/src/schemas/property.schema.ts` and `findProperties` in `property.service.ts`**
- [x] **Step 4: Run test to confirm pass**

---

### Task 3: Backend - Real Batched Aggregation & Safe Profile Formatting in `agent.service.ts`

**Files:**
- Modify: `backend/src/services/agent.service.ts`
- Modify: `backend/src/controllers/agent.controller.ts`
- Test: `test files/backend/agent-service-aggregates.test.ts`

**Interfaces:**
- Consumes: Supabase `profiles`, `properties`, `inquiries`, `appointments`, `sales`
- Produces: `AgentItem` with:
  - `role`: actual `role` from profile (`agent`, `broker`, etc.)
  - `avatar`: `p.avatar_url || null` (no Unsplash fallback)
  - `phone`: `p.phone || null`
  - `created_at`: `p.created_at`
  - `experience_years`: `p.experience_years !== null ? Number(p.experience_years) : null`
  - `assigned_properties_count`: real count from `properties WHERE list_agent_key = profile.id`
  - `active_inquiries_count`: real count from `inquiries WHERE property_id IN (agent's properties) AND status IN ('new','contacted','pending')`
  - `upcoming_appointments_count`: real count from `appointments WHERE agent_id = profile.id AND appointment_time >= now() AND status IN ('requested','confirmed')`
  - `recorded_sales_count`: real count from `sales WHERE agent_id = profile.id AND status = 'COMPLETED'`
  - `total_sales_value`: real sum from `sales WHERE agent_id = profile.id AND status = 'COMPLETED'`

- [x] **Step 1: Write failing test verifying aggregate queries and field mapping**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement batched aggregation and updated `formatAgentProfile` in `agent.service.ts`**
- [x] **Step 4: Run test to verify pass**

---

### Task 4: Backend - Secure Invitation List Allowlist (Omit Raw Tokens)

**Files:**
- Modify: `backend/src/services/invitation.service.ts`
- Modify: `backend/src/controllers/invitation.controller.ts`
- Test: `test files/backend/invitation-token-exclusion.test.ts`

**Interfaces:**
- Consumes: `GET /api/invitations`
- Produces: List of invitations without `token`, `token_digest`, or `registration_attempt_id`.

- [x] **Step 1: Write failing test verifying `listInvitations` does not expose `token` or `token_digest`**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Update `select` statement in `listInvitations` to safe explicit column allowlist**
- [x] **Step 4: Run test to verify pass**

---

### Task 5: Frontend Service Layer - Normalization & Support for Real Relationships

**Files:**
- Modify: `frontend/src/services/agentService.js`
- Modify: `frontend/src/services/propertyService.js`
- Test: `test files/frontend/agentService.test.js`

**Interfaces:**
- Consumes: Backend API responses
- Produces: Normalized agent objects where:
  - `experience_years`: preserved as `0` when `0`, `null` when missing
  - `phone`: empty string or null (never `+63 900 000 0000`)
  - `bio`: empty string or null (never canned paragraph)
  - `avatar`: null/empty when not provided
  - `license_status`: separate computation:
    - If `!prc_license_no` or `prc_license_no === 'N/A'`: `'NOT_PROVIDED'`
    - Else if `!prc_validity`: `'UNKNOWN'`
    - Else if expired in Manila calendar date: `'EXPIRED'`
    - Else: `'VALID'`
  - `propertyService.getProperties`: supports passing `list_agent_key` or `listAgentKey` to query assigned properties.

- [x] **Step 1: Write failing tests in `test files/frontend/agentService.test.js`**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement corrected `normalizeAgent` and `propertyService`**
- [x] **Step 4: Run test to verify pass**

---

### Task 6: Frontend UI - Correct Broker Agent Management Page (`BrokerAgents.jsx`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerAgents.jsx`

**Key UI Corrections:**
- Avatar fallback: Render initials badge (e.g. "CR") or neutral icon when `row.avatar` is missing/broken.
- Phone display: Render "Not provided" when empty/missing.
- License Status badge: Distinguish "Valid" (green), "Expired" (rose), "Validity unknown" (amber), "Not provided" (slate `—`).
- Metric Plinths:
  - "Active Invitations": Calculate from `(invitations || []).filter(i => i.status === 'pending' && new Date(i.expires_at).getTime() > Date.now()).length`. Remove `|| 1`.
  - Trends / Percentages: Remove fake percentage comparisons or clearly mark them as "Total active".
- Donut Chart:
  - Base population = `totalAgents` (registered agents).
  - Slices = Verified, Pending Review, Suspended.
  - Calculate real percentages summing to 100% without fallback constant additions (`|| 25`, `|| 8` removed). Handle `totalAgents === 0` cleanly.
- Recent Activities widget:
  - If no audit log endpoint is available, show "Activity history currently unavailable" / clean empty state instead of fabricated Unsplash personas.
- Agent Onboarding Checklist widget:
  - Derive counts from real loaded agent data (e.g., profiles with PRC submitted: X / totalAgents, DHSUD submitted: Y / totalAgents, Verified: Z / totalAgents).
- Invitations Tab:
  - Remove "Copy Link" buttons from ordinary rows (since tokens are not exposed). Keep "Resend" and "View Details".
- Loading, Empty, and Error states with retry:
  - Include Error state with "Retry" button that preserves filter/search terms.
- Accessible labels:
  - Add `aria-label` and `title` to action buttons and icon buttons.
  - Text truncation with `truncate`, `min-w-0` to avoid overlap on mobile.

- [x] **Step 1: Update `BrokerAgents.jsx` with corrected components and logic**
- [x] **Step 2: Run frontend build / lint to ensure no syntax or React errors**

---

### Task 7: Frontend UI - Correct Broker Agent Detail View (`BrokerAgentDetail.jsx`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`

**Key UI Corrections:**
- Experience display: Render "0 years of experience" when `0`, "Experience not provided" when null/undefined.
- Biography: Render "No biography provided." when missing.
- Contact info:
  - Phone missing: Render "Not provided"; disable call action.
  - Location: If not in profile, render "Not provided" or omit.
  - Joined Date: Render `agent.created_at` formatted in `Asia/Manila` ("Joined: Month DD, YYYY") or "Not provided".
- License Information:
  - PRC License Number: "Not provided" when missing.
  - Validity Date: Format date-only string without timezone shift, or "Not provided" / "Validity unknown".
  - License Status: Compute from valid dates, separate from `verification_status`.
- Assigned Listings Tab:
  - Remove `SAMPLE_AGENT_LISTINGS`!
  - Fetch real listings using `propertyService.getProperties({ list_agent_key: agent.id })`.
  - Render real listing cards, or clean empty state "No properties currently assigned to this agent."
- Performance Tab & Stats:
  - Remove hardcoded "12 Closed Deals" and "₱45.2M". Display real `recorded_sales_count` and `total_sales_value` (formatted currency) or clean "No closed transactions on record."
- Document attachments & Google Drive:
  - Only show documents that actually exist in `supporting_documents`.

- [x] **Step 1: Update `BrokerAgentDetail.jsx` with real data integrations and clean empty states**
- [x] **Step 2: Run frontend build / test to verify no regressions**

---

### Task 8: Comprehensive Regression Testing & E2E Browser Verification

**Files:**
- Test files in `test files/` (frontend & backend)
- Script: `C:/Users/Win11x64/.gemini/antigravity/brain/f9232db2-7ade-4b40-a7d0-6d19fa980f29/scratch/verify_broker_agents_e2e.cjs`
- Output evidence in `docs/reports/evidence/broker-agent-management/`

- [x] **Step 1: Run all unit and integration test suites**
- [x] **Step 2: Run Playwright E2E browser verification against live frontend and backend**
- [x] **Step 3: Capture new screenshots (Roster, Invitations, Carmela Detail, Elena Detail)**
- [x] **Step 4: Capture updated network traces and rendered page data**

---

### Task 9: Update Data Verification Report

**Files:**
- Update: `docs/reports/broker-agent-management-data-verification.md`

- [x] **Step 1: Update report with before/after comparison, implemented fixes, regression test results, and remaining limitations**
- [x] **Step 2: Ensure all tokens, credentials, and PII in evidence and report are properly redacted**
