# Broker Portal Bento Layout & shadcn/ui Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize every Broker Portal page (`frontend/src/pages/portals/broker/*.jsx`) onto a unified 12-column **Bento Grid** layout composed strictly with `shadcn/ui` primitives (`Card`, `Tabs`, `Table`, `Badge`, `Button`, `Alert`, `Separator`, `Skeleton`) and `lucide-react` icons.

**Architecture:** Each Broker page uses a `flex flex-col gap-6` vertical container with `PageHeader`, an optional 4-column KPI strip (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`), and a `grid-cols-1 lg:grid-cols-12 gap-6 items-start` Bento workspace (`lg:col-span-8` primary tile + `lg:col-span-4` stacked side rail). Map studios keep map tiles isolated at `z-index: 0`.

**Tech Stack:** React 19 · Tailwind CSS v4 · `shadcn/ui` (`frontend/src/components/ui/`) · `lucide-react`

**Spec:** [`DESIGN.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/DESIGN.md) (Section 7: Broker Portal Bento Layout & `shadcn/ui` Standard) and [`.agents/skills/shadcn/SKILL.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/.agents/skills/shadcn/SKILL.md)

## Global Constraints

- Follow [`DESIGN.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/DESIGN.md): 8-point spacing grid, `#F8FAFC` canvas, `#FFFFFF` card surface, `#E2E8F0` hairline borders, `#0F766E` primary teal, `#FF6B6B` coral (with `#1E293B` text), JetBrains Mono for prices/numbers.
- Follow `shadcn` rules: use `gap-*` (no `space-y-*` / `space-x-*`), use `size-*` for equal width/height, use `<Alert>` for banners, use full `CardHeader` / `CardContent` / `CardFooter`, use `lucide-react` icons.
- Preserve all existing API calls, permissions, and form state logic without breaking routes.

---

## Broker Pages Bento Mapping

| Page File | Primary Bento Tile (`lg:col-span-8` or `12`) | Side Rail / Supporting Bento Tiles (`lg:col-span-4`) |
| :--- | :--- | :--- |
| `BrokerDashboard.jsx` | *(Done)* 4-card top strip + Tabbed Sales & Agents `Card` | Needs Attention `Card` + Recent Activity `Card` |
| `BrokerSales.jsx` | Closed Deals `Table` inside `Card` | Total Valuation & Deal Volume summary `Card`s |
| `BrokerReports.jsx` | Tabbed Reports & Export `Card` (`Tabs` + `Table`) | Report Summary & Export Presets `Card` |
| `BrokerAudit.jsx` | Filterable Audit Trail `Table` inside `Card` | Audit Activity Summary & Severity Breakdown `Card` |
| `BrokerNotifications.jsx` | Tabbed Notification Feed `Card` (All / Unread / Read) | Alert Preferences & Unread Summary `Card` |
| `BrokerProfile.jsx` | Profile & Brokerage Credentials `Card` | Appearance Density & Security Status `Card`s |
| `BrokerInquiries.jsx` | 3-card top strip + Tabbed Inquiries `Table` `Card` | Queue Breakdown & Response Tips `Card` |
| `BrokerInquiryDetail.jsx` | Conversation Thread & Protected Audit `Card` | Client Info, Property Preview & Assigned Agent `Card`s |
| `BrokerAppointments.jsx` | Schedule Calendar `Card` | Upcoming Tours & Pending Confirmations `Card` |
| `BrokerAgents.jsx` | Tabbed Roster & Invitations `Table` `Card` | Team Summary & Pending Verifications `Card` |
| `BrokerAgentDetail.jsx` | Tabbed Credentials, Listings & Sales `Card` | Agent Profile Summary & Approval Actions `Card` |
| `BrokerAgentEdit.jsx` | Tabbed Profile & Role Editor `Card` | Current Status & Quick Navigation `Card` |
| `BrokerInviteAgent.jsx` | Multi-Step Invitation Form `Card` | Invitation Guidelines & Pending Count `Card` |
| `BrokerProperties.jsx` | Filter Toolbar + Tabbed Inventory/Proposals `Card` | Portfolio Status Breakdown `Card`s |
| `BrokerPropertyTypeSelect.jsx` | *(Done)* 3-Category Bento Selection Grid | — |
| `BrokerCreateListings.jsx` | Step-by-Step Listing Form `Card` | Live Listing Preview & Completion Checklist `Card` |
| `BrokerFullViewMap.jsx` | Isolated Map Canvas `Card` (`z-0`) | Active Pins & Quick Filter `Card` |
| `BrokerMultiPropertyMapStudio.jsx` | Isolated Multi-Property Map `Card` (`z-0`) | Property Ledger Sidebar `Card` |
| `BrokerSubdivisionInventory.jsx` | Subdivision Inventory `Table` / Grid `Card` | Subdivision Telemetry & AI Actions `Card` |
| `SubdivisionMapEditor.jsx` | Isolated Vector Map Canvas `Card` (`z-0`) | Lot Inspector & AI Dock `Card` |

---

## Execution Tasks

### Wave 1: Executive, Sales, Reports, Audit, Notifications & Profile

- [ ] **Task 1.1 — `BrokerDashboard.jsx` Audit Pass:**
  - Verify `BrokerDashboard.jsx` replaces any remaining `material-symbols-outlined` in `recentActivity` or uses a clean `lucide-react` fallback map, and confirm zero `space-y-*` classes remain.
- [ ] **Task 1.2 — `BrokerSales.jsx`:**
  - Refactor root to `flex flex-col gap-6`, top KPI strip (`grid-cols-1 sm:grid-cols-3 gap-4`) with `Card`, and 8/4 Bento split (`Table` inside `Card` on left + Breakdown/Export `Card` on right).
- [ ] **Task 1.3 — `BrokerReports.jsx`:**
  - Wrap report views in `shadcn` `Tabs` inside a `lg:col-span-8` `Card`, with export controls and summary metrics in `lg:col-span-4` `Card`s.
- [ ] **Task 1.4 — `BrokerAudit.jsx`:**
  - Apply 8/4 Bento grid: filterable audit log `Table` `Card` on left, severity/action breakdown & filter `Card` on right. Replace raw alert banners with `<Alert>`.
- [ ] **Task 1.5 — `BrokerNotifications.jsx`:**
  - Apply 8/4 Bento grid: `Tabs` (`All`, `Unread`, `Read`) notification list `Card` on left, unread count & quick "Mark all read" `Card` on right.
- [ ] **Task 1.6 — `BrokerProfile.jsx`:**
  - Arrange account details, brokerage license card, and typography density selector into clean 8/4 Bento `Card` tiles using `lucide-react` icons.
- [ ] **Wave 1 Build Check:** Run `cd frontend && npx vite build` and verify zero errors.

### Wave 2: Leads, Inquiries & Appointments

- [ ] **Task 2.1 — `BrokerInquiries.jsx`:**
  - Convert top 3-card metrics bar and tabbed `DataTable` to `shadcn` `Card` + `Tabs`, replace raw error div with `<Alert>`, and pair with an 8/4 or top-strip Bento layout.
- [ ] **Task 2.2 — `BrokerInquiryDetail.jsx`:**
  - Apply 8/4 Bento grid: conversation timeline + AI summary `Card` in `lg:col-span-8`; client contact, linked property, and agent assignment `Card`s stacked in `lg:col-span-4`.
- [ ] **Task 2.3 — `BrokerAppointments.jsx`:**
  - Place `AgentScheduleCalendar` inside a `lg:col-span-8` `Card` and upcoming/pending tour summary `Card`s in `lg:col-span-4`.
- [ ] **Wave 2 Build Check:** Run `cd frontend && npx vite build` and verify zero errors.

### Wave 3: Agents & Team Management

- [ ] **Task 3.1 — `BrokerAgents.jsx`:**
  - Structure top summary `Card`s (`grid-cols-1 sm:grid-cols-3 gap-4`), `Tabs` (`Active Roster`, `Pending Review`, `Invitations`) inside primary `Card`, and `<Alert>` for errors.
- [ ] **Task 3.2 — `BrokerAgentDetail.jsx`:**
  - Apply 8/4 Bento grid: `Tabs` (Credentials, Assigned Listings, Sales) in `lg:col-span-8` `Card`; agent profile card & verification actions in `lg:col-span-4` `Card`s.
- [ ] **Task 3.3 — `BrokerAgentEdit.jsx`:**
  - Wrap edit sections in `shadcn` `Tabs` + `Card` (`lg:col-span-8`) with live agent summary/status tile in `lg:col-span-4`.
- [ ] **Task 3.4 — `BrokerInviteAgent.jsx`:**
  - Place multi-step invite form in `lg:col-span-8` `Card` and onboarding checklist/rules `Card` in `lg:col-span-4`.
- [ ] **Wave 3 Build Check:** Run `cd frontend && npx vite build` and verify zero errors.

### Wave 4: Properties, Forms & Map Studios

- [ ] **Task 4.1 — `BrokerProperties.jsx`:**
  - Apply Bento summary strip (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`) + full-width tabbed portfolio `Card` (`All`, `Active`, `Needs Approval`, `Proposals`).
- [ ] **Task 4.2 — `BrokerCreateListings.jsx`:**
  - Frame the multi-step wizard in an 8/4 Bento grid: active step form `Card` (`lg:col-span-8`) + live summary/completion status `Card` (`lg:col-span-4`).
- [ ] **Task 4.3 — `BrokerFullViewMap.jsx` & `BrokerMultiPropertyMapStudio.jsx`:**
  - Enforce 8/4 Bento split with map container isolated (`isolation: isolate; z-index: 0`) in `lg:col-span-8` `Card` and property ledger/filters in `lg:col-span-4` `Card`.
- [ ] **Task 4.4 — `BrokerSubdivisionInventory.jsx` & `SubdivisionMapEditor.jsx`:**
  - Align inventory cards/tables and vector map studio dock into clean `shadcn` `Card` tiles with `isolation: isolate; z-index: 0` on map canvases.
- [ ] **Wave 4 Build Check:** Run `cd frontend && npx vite build` and `graphify update .`.

---

## Manual Verification Table

| Test ID | Scope | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-BENTO-01** | Desktop (`>= 1024px`) | Visit each Broker page | Every page uses crisp white `Card` tiles on `#F8FAFC` canvas with 8/4 or 4-card Bento grids and zero horizontal overflow |
| **TC-BENTO-02** | Mobile (`375px`) | Resize viewport to mobile | All Bento tiles stack cleanly into 1 column (`gap-4` / `gap-6`) with `>= 44px` touch targets |
| **TC-BENTO-03** | Map Studios | Open `BrokerFullViewMap` & `SubdivisionMapEditor` | Map tiles stay behind sticky header (`z-30`) and dialogs (`z-50`) |
| **TC-BENTO-04** | Interactive States | Switch `Tabs`, trigger `<Alert>` retry, click `Button` CTAs | All existing API data, filters, and modals continue working identically |
