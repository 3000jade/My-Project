# Implementation & Verification Plan: Broker Agent Management High-Density Command Console

**Standard:** `AGENTS.md` (Specification-Led Development) & `design.md` (Modern SaaS Tokens)  
**Target Component:** `frontend/src/pages/portals/broker/BrokerAgents.jsx`  
**Vitest Suite:** `frontend/src/pages/portals/broker/BrokerAgents.test.jsx`  
**Playwright E2E Suite:** `frontend/e2e/broker-agent-management.spec.ts`  
**Playwright MCP Verification:** Active on `http://localhost:5173/broker/agents`  
**Status:** Ready for Execution (Awaiting Approval)  

---

## 1. Environment Readiness Findings (`AGENTS.md` §5)

| Prerequisite | Status | Verification Evidence |
| :--- | :--- | :--- |
| **Local Application Server** | **READY** | Vite dev server active on `http://localhost:5173` (PID: 12468, port confirmed listening). |
| **Playwright MCP Server** | **READY** | `browser_navigate`, `browser_snapshot`, and `browser_take_screenshot` verified live. |
| **Role & Authentication Context** | **READY** | Active Principal Broker session loaded on `http://localhost:5173/broker/agents`. |
| **Baseline Visual Proof** | **CAPTURED** | Baseline screenshot recorded via Playwright MCP (`media_0.png`). |
| **Vitest Test Runner** | **READY** | Vitest v5.0.5 executable in `frontend/`. |
| **Production Build Pipeline** | **READY** | `vite build` transforms 10,947 modules in 5.67s without errors. |

---

## 2. Intended Outcome & Scope

Refactor `BrokerAgents.jsx` to **Option 1: High-Density Command Console** to eliminate layout inefficiencies and horizontal scrolling while elevating credential review throughput:

1. **Slim 4-Stat Metric Bar:** Replace tall decorative plinths with a slim horizontal telemetry bar (`Total Agents`, `Verified Agents`, `Pending Review`, `Active Invitations`), reducing vertical footprint by 40%.
2. **One-Click Status Pill Tabs with Live Count Badges:** Fast single-click filtering (`All Agents`, `Pending Review` in amber, `Verified` in emerald, `Invited` in sky, `Suspended` in slate).
3. **100% Full-Width Data Grid:** Remove the rigid 72%/28% desktop split; expand the roster table across the full container width (`w-full`), ensuring all 9 columns render comfortably.
4. **On-Demand Analytics & Insights Drawer:** Relocate the Verification Summary donut chart, Recent Activities audit log, and Onboarding Checklist into an accessible slide-over drawer / collapsible panel.
5. **Accessible Radix UI DropdownMenu:** Upgrade row context actions (`View Dossier`, `Send Direct Email`, `Copy Agent ID`) using Radix primitives from `@/components/ui/dropdown-menu`.
6. **E2E Playwright Suite & MCP Verification:** Author and run `frontend/e2e/broker-agent-management.spec.ts`, and perform live interactive functional and visual verification using Playwright MCP.

---

## 3. Playwright E2E Test Scenarios (`frontend/e2e/broker-agent-management.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Broker Agent Management — High-Density Command Console Flow', () => {
  // Scenario 1: Authentication & Header Telemetry Verification
  test('renders 4-stat metric strip and full-width header', async ({ page }) => { ... });

  // Scenario 2: One-Click Status Pill Triage
  test('filters roster immediately when clicking Pending Review and Verified pill tabs', async ({ page }) => { ... });

  // Scenario 3: Global Search Console with Shortcut & Clear
  test('supports keyboard search, live filtering, and one-click clear button', async ({ page }) => { ... });

  // Scenario 4: Context Row Actions & Credential Review CTA
  test('renders high-impact Review button for pending agents and navigates to detail dossier', async ({ page }) => { ... });

  // Scenario 5: Radix DropdownMenu Keyboard & Click Behavior
  test('opens accessible Radix context menu with keyboard navigation', async ({ page }) => { ... });

  // Scenario 6: Analytics & Insights Drawer Toggle
  test('toggles Analytics Drawer displaying Donut Chart, Audit Log, and Checklist', async ({ page }) => { ... });

  // Scenario 7: Responsive Layout & Mobile Touch Targets
  test('adapts to mobile viewport (390px) with touch-friendly cards >= 44px', async ({ page }) => { ... });
});
```

---

## 4. Ordered Implementation Steps

### Step 1: Fix & Align Unit Test Assertions (`BrokerAgents.test.jsx`)
- Align card label selectors (`Total Agents`, `Verified Agents`, `Pending Review`, `Active Invitations`).
- Ensure checklist items (`Invited Agents`, `Profile Information`) and widgets (`Verification Summary`, `Recent Activities`, `Agent Onboarding Checklist`) are present.
- Wrap asynchronous render actions in `waitFor` blocks.

### Step 2: Implement High-Density Console Architecture in `BrokerAgents.jsx`
- Replace 4 tall plinths with slim horizontal telemetry cards with exact test labels and trend chips.
- Add top action bar: `+ Invite Agent` (Coral `#FF6B6B`), `Analytics & Insights` toggle, `Export CSV`, `Refresh`.
- Implement one-click status pill tabs (`All Agents`, `Pending Review`, `Verified`, `Invited`, `Suspended`) with count badges.
- Expand data table to 100% full width (`w-full`) with balanced column widths.
- Integrate accessible Radix `DropdownMenu` for row actions.
- Build the toggleable `Analytics & Insights` slide-over drawer / panel housing the donut chart, recent audits, and checklist.

### Step 3: Author Playwright E2E Test Suite (`frontend/e2e/broker-agent-management.spec.ts`)
- Write tests matching Scenarios 1–7 adhering to accessible role/label locators and automatic waiting.
- Run tests via Playwright CLI: `npx playwright test e2e/broker-agent-management.spec.ts`.

### Step 4: Live Functional & UI Verification via Playwright MCP
- Use `browser_navigate` to `http://localhost:5173/broker/agents`.
- Use `browser_click` to verify status tab switching (`Pending Review`, `Verified`).
- Use `browser_type` to test search input and clear button.
- Use `browser_click` to open the Analytics Drawer.
- Use `browser_take_screenshot` to capture the final "after" screenshot for side-by-side visual comparison.

### Step 5: Verify Vitest & Build Checks
- Run Vitest suite: `npx vitest run src/pages/portals/broker/BrokerAgents.test.jsx`.
- Run dashboard suite: `npx vitest run src/components/dashboard/`.
- Run production build: `npm run build`.

### Step 6: Documentation & Local Delivery
- Update `docs/superpowers/plans/2026-10-28-broker-agents-high-density-console-plan.md`.
- Update Master Living Requirements in `docs/REQUIREMENTS_SPECIFICATION.md`.
- Present concise local delivery report with verification evidence and before-and-after screenshots.

---

## 5. Explicit Approval Boundaries (`AGENTS.md` §9)
- **Database Schema Changes:** None required (no migrations or DB alterations).
- **Permissions / Role Changes:** None (preserves existing Broker authorization).
- **Breaking API Changes:** None (`agentService` and `invitationService` contracts preserved).
- **Approval Gate:** Awaiting user approval to proceed with execution.
