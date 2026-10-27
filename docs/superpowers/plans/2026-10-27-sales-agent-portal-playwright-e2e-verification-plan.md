# Sales Agent Portal & Deal Pipeline — Playwright MCP E2E Verification Plan

> **Standard:** ISO/IEC/IEEE 29148:2018 & ISO/IEC 25010:2023  
> **Workflow:** AGENTS.md (Inspect → Check Readiness → /grill-me → Specify → /plan → Approve → Implement → Verify → Document → Deliver)  
> **Module:** `03-agent-management`  
> **Spec Reference:** [`docs/modules/03-agent-management/2026-10-27-sales-agent-portal-and-workflows-spec.md`](../docs/modules/03-agent-management/2026-10-27-sales-agent-portal-and-workflows-spec.md)  
> **Design Reference:** [`design.md`](../../design.md)

---

## 1. Goal & Intended Outcome

Execute end-to-end browser verification of the Sales Agent Portal and Active Deal Pipeline using the **Playwright MCP server**, capturing automated snapshots and screenshots across 4 core user journeys. Confirm strict adherence to Philippine RA 9646 (Strict Broker Gate INV-01 and Regulatory Watchdog Banner) and [`design.md`](../../design.md) design tokens (Primary Teal `#0F766E`, Accent Coral `#FF6B6B`, Slate `#1E293B`, 8px radius). Update the module verification report and index to achieve formal Verified Local Delivery under `AGENTS.md` Section 13.

---

## 2. Applicable Guidance & Skills

- **Workflow Standard:** [`AGENTS.md`](../../AGENTS.md) Sections 4, 5, 8, 11, 12, 13
- **Design System:** [`design.md`](../../design.md) Modern SaaS palette and role-based profiles
- **Testing Server:** Playwright MCP (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_take_screenshot`)
- **Backend Test Suite:** Vitest (`sales-pipeline-commission.test.ts`)

---

## 3. Environment Readiness

| Service / Tool | Expected Address / State | Readiness Check |
|---|---|---|
| Frontend Vite Server | `http://localhost:5173` | Confirmed listening |
| Backend Express API | `http://localhost:5000` | Confirmed listening |
| Supabase Auth / Local DB | Active session endpoint `/auth/login` | Seed credentials available (`agent@pt.com` / `agentPassword123!`) |
| Playwright MCP Server | Tools eager/lazy loaded in workspace | Loaded and responsive |

---

## 4. Requirements & Acceptance Criteria

| Requirement ID | Acceptance Criterion | Playwright Assertion / Verification |
|---|---|---|
| `REQ-AUTH-E2E-01` | Agent can log in at `/login` with credentials `agent@pt.com` / `agentPassword123!`. | Browser redirects to `/agent/dashboard` with active session. |
| `REQ-AGENT-DASH-01` | Dashboard displays KPI metrics and PRC Regulatory Watchdog banner. | Snapshot confirms presence of license/accreditation alert with compliant colors. |
| `REQ-AGENT-SALE-01` | Active Deal Pipeline provides 4 filter tabs and KPI metrics cards. | Clicking through `In Negotiation`, `Under Contract`, `Conveyance`, and `Completed` tabs updates list. |
| `REQ-AGENT-SALE-02` | Deal Dossier modal presents transparent commission math and split calculation. | Clicking "View Dossier" displays Gross Commission, Broker Split, and Net Agent Commission math card. |
| `REQ-AGENT-PROP-01` | Strict Broker Gate (INV-01) advisory banner on `/agent/properties/new`. | Form warns agent that property will be created as `draft` requiring supervising broker approval. |
| `REQ-DESIGN-TOKENS` | Visual UI elements conform to `design.md` tokens. | Verification of Primary Teal `#0F766E`, Accent Coral `#FF6B6B`, Dark Slate `#1E293B`, and 8px radii. |

---

## 5. Explicit Approval Boundaries

Per [`AGENTS.md`](../../AGENTS.md) Section 9:
- **Playwright MCP Test Execution & Report Writing:** Authorized by the user's prompt ("yes proceed").
- **Database / Schema Alterations:** None in this task.
- **Code Edits to UI Components:** If Playwright screenshot inspection reveals visual or functional defects, present a formal fix proposal and await explicit approval before editing code.

---

## 6. Ordered Execution Tasks

### Task 1: Status Correction
- **Action:** Update [`docs/modules/03-agent-management/2026-10-27-sales-agent-portal-implementation-report.md`](../docs/modules/03-agent-management/2026-10-27-sales-agent-portal-implementation-report.md) status from premature `COMPLETED` to `IN_PROGRESS (Awaiting Playwright MCP E2E Verification)`.

### Task 2: Journey 1 — Agent Authentication & Session Verification
- **Tool:** Playwright MCP `browser_navigate` to `http://localhost:5173/login`.
- **Steps:**
  1. Fill email `agent@pt.com` and password `agentPassword123!`.
  2. Click login submit button.
  3. Wait for navigation to `/agent/dashboard` or `/agent`.
  4. Assert token persistence and successful session hydration.

### Task 3: Journey 2 — Agent Dashboard & Regulatory Watchdog Banner
- **Tool:** Playwright MCP `browser_navigate` to `http://localhost:5173/agent/dashboard`.
- **Steps:**
  1. Capture DOM snapshot (`browser_snapshot`).
  2. Assert PRC Credential Watchdog banner text (RA 9646 compliance).
  3. Assert KPI summary cards (Properties, Deals, Inquiries).
  4. Take screenshot (`agent-dashboard-e2e.png`).

### Task 4: Journey 3 — Active Deal Pipeline & Commission Dossier Modal
- **Tool:** Playwright MCP `browser_navigate` to `http://localhost:5173/agent/sales`.
- **Steps:**
  1. Capture DOM snapshot of `/agent/sales`.
  2. Verify 4 pipeline tabs: `All`, `In Negotiation`, `Under Contract`, `Conveyance`, `Completed`.
  3. Click tab `Under Contract` or `Conveyance` via `browser_click`.
  4. Click "View Dossier" on a transaction row.
  5. Assert modal displays Property Details, Stage Audit, and Commission Split Card.
  6. Take screenshot (`agent-deal-pipeline-dossier-e2e.png`).

### Task 5: Journey 4 — Strict Broker Gate (INV-01) on Property Creation
- **Tool:** Playwright MCP `browser_navigate` to `http://localhost:5173/agent/properties/new`.
- **Steps:**
  1. Capture DOM snapshot of `/agent/properties/new`.
  2. Assert Strict Broker Gate advisory banner is rendered.
  3. Verify warning text stating submission creates draft listing requiring broker review under RESA law.
  4. Take screenshot (`agent-property-broker-gate-e2e.png`).

### Task 6: Visual Inspection against `design.md`
- Inspect captured screenshots for:
  - Header, buttons, and active tabs matching `#0F766E` (Teal).
  - Attention badges, alerts, or pending notices matching `#FF6B6B` (Coral) or Amber `#F59E0B`.
  - Body typography using Inter/Plus Jakarta Sans with `#1E293B` text.
  - Border radius standard `rounded-lg` (8px).

### Task 7: Documentation & Verified Local Delivery
- Create [`docs/modules/03-agent-management/2026-10-27-agent-portal-playwright-e2e-report.md`](../docs/modules/03-agent-management/2026-10-27-agent-portal-playwright-e2e-report.md) with test results, snapshots, and screenshot references.
- Update [`docs/modules/03-agent-management/2026-10-27-sales-agent-portal-implementation-report.md`](../docs/modules/03-agent-management/2026-10-27-sales-agent-portal-implementation-report.md) status to `COMPLETED — VERIFIED LOCALLY`.
- Update [`docs/modules/03-agent-management/INDEX.md`](../docs/modules/03-agent-management/INDEX.md) with the new verification report.
