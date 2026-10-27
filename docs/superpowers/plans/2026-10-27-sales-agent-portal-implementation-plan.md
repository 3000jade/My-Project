# Human Sales Agent Portal & Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full-stack Sales Agent Portal workflows, eliminating hardcoded mocks in `AgentSales.jsx` and `AgentDashboard.jsx`, wiring the live 4-stage deal pipeline with commission split attribution, and enforcing the Strict Broker Gate for property listings.

**Architecture:** Frontend React 19 portal pages consume authenticated Express 5 endpoints backed by Supabase PostgreSQL and domain services (`SaleService`, `AgentService`, `PropertyService`). Agents are isolated to their own assignments via `req.user.id` and RBAC middleware. Styling strictly conforms to the Modern Soft Minimalist SaaS theme (`design.md`) with Teal `#0F766E` and Coral `#FF6B6B`.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Express 5, TypeScript 5.9, Supabase PostgreSQL, Vitest.

**Spec:** [`docs/modules/03-agent-management/2026-10-27-sales-agent-portal-and-workflows-spec.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/03-agent-management/2026-10-27-sales-agent-portal-and-workflows-spec.md)

---

## Global Constraints

- **Design Tokens:** Primary `#0F766E` (Teal), Accent `#FF6B6B` (Coral), Slate/Zinc neutrals. No arbitrary unapproved color hexes.
- **Strict Broker Gate (INV-01):** Agent-created listings must always submit as proposals (`status: DRAFT_PENDING_APPROVAL` or `is_draft: true`). No direct publishing without broker review.
- **Agent Data Isolation (INV-02):** Agents can only view/mutate properties, inquiries, appointments, and sales assigned to their authenticated UUID.
- **Zero Raw Mock Data in Production Code:** Dynamic values must come from backend API endpoints with authenticated session identity.
- **Backward Compatibility:** Existing broker management, property controllers, and database RLS remain intact.

---

## Environment Readiness Assessment

- **Backend Build:** `npm run build` in `backend/` passes (TypeScript compilation succeeds with 0 errors).
- **Frontend Build:** `npm run build` in `frontend/` passes (Vite production bundle generates cleanly).
- **Database Connection:** Supabase cloud connection configured via `.env` with in-memory fallbacks when offline.
- **Test Harness:** Vitest configured in `backend/` and `frontend/`.

---

## Implementation Tasks

### Task 1: Backend Deal Pipeline & Commission Split Engine

**Files:**
- Modify: `backend/src/schemas/sale.schema.ts`
- Modify: `backend/src/services/sale.service.ts`
- Modify: `backend/src/controllers/sale.controller.ts`
- Create: `test files/backend/services/sales-pipeline-commission.test.ts`

**Interfaces:**
- Consumes: `AuthenticatedRequest.user.id`, `QuerySaleInput`
- Produces: `SaleItem` with fields `deal_stage`, `commission_rate`, `gross_commission`, `agent_split_percentage`, `agent_net_commission`, `payout_status`.

- [ ] **Step 1: Write failing unit test for sales deal pipeline & commission calculation**
  - Verify `SaleService.listSales` returns normalized deal stages (`IN_NEGOTIATION`, `UNDER_CONTRACT`, `CONVEYANCE`, `COMPLETED`).
  - Verify commission calculation formula: `gross_commission = property_value * (commission_rate / 100)` and `agent_net_commission = gross_commission * (agent_split_percentage / 100)`.
  - Verify agent isolation: query for `agentId` strictly filters records for that caller.

- [ ] **Step 2: Update Sale schema and interfaces in `sale.schema.ts` & `sale.service.ts`**
  - Add `deal_stage: 'IN_NEGOTIATION' | 'UNDER_CONTRACT' | 'CONVEYANCE' | 'COMPLETED'`.
  - Add `payout_status: 'UNPAID' | 'PARTIALLY_RELEASED' | 'PAID'`.
  - Add commission calculation helper and metrics aggregator (`getAgentSalesPipelineMetrics`).

- [ ] **Step 3: Update `SaleController.ts` with pipeline metrics endpoint**
  - Add `GET /api/sales/pipeline-metrics` to return aggregate deal counts, volume, and projected net commissions for the authenticated agent.

- [ ] **Step 4: Run tests and verify backend compilation**
  - Run `npx vitest run "test files/backend/services/sales-pipeline-commission.test.ts"` and verify 100% pass.
  - Run `npm run build` in `backend/`.

---

### Task 2: Frontend Sale Service & Normalized Pipeline DTOs

**Files:**
- Modify: `frontend/src/services/saleService.js`

**Interfaces:**
- Consumes: Backend `/api/sales` and `/api/sales/pipeline-metrics`
- Produces: `saleService.getSales`, `saleService.getPipelineMetrics`, `normalizeSale`

- [ ] **Step 1: Update `saleService.js` to parse deal stages & commission metrics**
  - Normalize `deal_stage`, `commission_rate`, `gross_commission`, `agent_split_percentage`, `agent_net_commission`, `payout_status`.
  - Add `saleService.getPipelineMetrics(params)` with offline fallback computation.

---

### Task 3: Revamp `AgentSales.jsx` — Active Deal Pipeline & Commission View

**Files:**
- Modify: `frontend/src/pages/portals/agent/AgentSales.jsx`

**Interfaces:**
- Consumes: `useAuth()` hook for authenticated `user.id`, `saleService.getSales`, `saleService.getPipelineMetrics`
- Produces: Modern SaaS Deal Pipeline UI with stage tabs, metrics, commission breakdown card, and conveyance inspector modal.

- [ ] **Step 1: Wire `useAuth()` dynamic user ID in `AgentSales.jsx`**
  - Remove hardcoded `'agent-1'` and bind to `user?.id || 'agent-1'`.

- [ ] **Step 2: Implement Pipeline Summary Metric Cards**
  - Closed Sales Volume (MTD/YTD in PHP `₱`).
  - Active Pipeline Value (Negotiation + Under Contract + Conveyance).
  - Estimated Net Commission Earned.
  - Active Deals Count.

- [ ] **Step 3: Implement Pipeline Stage Filter & Stage Badges**
  - Tabs: `ALL`, `IN_NEGOTIATION`, `UNDER_CONTRACT`, `CONVEYANCE`, `COMPLETED`.
  - Stage indicator badge with appropriate color tokens (Teal for Completed, Blue for Under Contract, Amber for Negotiation, Purple for Conveyance).

- [ ] **Step 4: Implement Commission Breakdown & Conveyance Inspector Drawer/Modal**
  - Detailed side-panel or modal presenting:
    * Property title, location, client name, and closing date.
    * Financial breakdown: Gross Value, Commission %, Brokerage Split, Net Payout.
    * Payout status pill (`PAID`, `PARTIALLY_RELEASED`, `UNPAID`).
    * Conveyance legal notes and required documents checklist.

---

### Task 4: Dynamic Agent Context & Credential Alerts in `AgentDashboard.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/agent/AgentDashboard.jsx`

**Interfaces:**
- Consumes: `useAuth()`, `dashboardService.getDashboardSummary`
- Produces: Live dashboard reflecting authenticated agent metrics and PRC/DHSUD compliance banner.

- [ ] **Step 1: Wire `useAuth()` in `AgentDashboard.jsx`**
  - Eliminate hardcoded `agent-1` default state and load metrics for `user.id`.

- [ ] **Step 2: Add Regulatory Credential Watchdog Banner**
  - If agent's PRC or DHSUD license expires within 30 days, render actionable warning pill.
  - If `verification_status === 'REJECTED'`, render high-visibility remediation alert with broker feedback.

---

### Task 5: Verify Strict Broker Gate & Listing Proposal UX

**Files:**
- Inspect/Verify: `frontend/src/pages/portals/agent/AgentPropertyCreate.jsx`
- Inspect/Verify: `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx`
- Inspect/Verify: `backend/src/controllers/property.controller.ts`

- [ ] **Step 1: Ensure `AgentPropertyCreate.jsx` clearly informs agent of draft review**
  - Display informative banner: *"All agent-submitted properties require Broker approval before publishing to the marketplace."*
  - Payload sends `is_draft: true` and `status: 'DRAFT_PENDING_APPROVAL'`.

- [ ] **Step 2: Ensure `AgentPropertyDetail.jsx` proposal modal provides transparent change review**
  - Check diff layout rendering for proposed modifications.

---

### Task 6: Verification & Local Delivery

- [ ] **Step 1: Execute full test suite in `backend/`**
- [ ] **Step 2: Execute frontend build `npm run build`**
- [ ] **Step 3: Update documentation change records in `docs/modules/03-agent-management/`**
