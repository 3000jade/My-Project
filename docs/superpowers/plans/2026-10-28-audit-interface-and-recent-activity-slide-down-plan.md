# Implementation Plan: Audit Interface & Recent Activities Slide-Down Integration

**Module Identifier:** `06-audit` / `audit-ui`  
**System:** Human Shelter Realty / CP_kerby Modern SaaS Platform  
**Target Date:** October 28, 2026  
**Standards Conformance:** `docs/implementation/design.md` (Soft Minimalist SaaS UI/UX Design System), ISO/IEC 25010:2023  
**Status:** Awaiting Approval  

---

## 1. Intended Outcome & Task Scope

The objective of this task is to establish a seamless, standardized audit experience across Human Shelter Realty, unifying common labels and linking navigation through a global **"Recent Activities" slide-down drawer in the header** that seamlessly routes stakeholders to the full **Audit Trail Page**.

### Key Deliverables:
1. **Common Labels & Iconography Standardization:**
   - `"Recent Activity"`: Standardized across the header slide-down popover, dashboard cards, and property/inquiry operational tabs.
   - `"Audit Trail"`: Standardized for the full regulatory inspection console, sidebar navigation, and compliance exports.
   - `"Security Events"`: Specific label for session timeouts, access denials, and tamper alerts.
   - `"Listing Mutations"`: Specific label for property field changes and broker approval diffs.
2. **DashboardHeader Slide-Down Popover Enhancement:**
   - Expand the existing bell popover in [`DashboardHeader.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/dashboard/DashboardHeader.jsx) into a dual-tab slide-down:
     - Tab 1: **Notifications** (Personal tasks, inquiry alerts).
     - Tab 2: **Recent Activity** (Live, formatted audit events with actor attribution, entity badges, and relative timestamps).
   - Prominent footer navigation link: `"View Full Audit Trail →"` linking directly to `/broker/audit`.
3. **Dedicated Broker Audit Console Page (`/broker/audit`):**
   - Author [`frontend/src/pages/portals/broker/BrokerAudit.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerAudit.jsx) featuring:
     - 12-column Modern SaaS layout.
     - Summary KPI cards (Total Events, Listing Mutations, Security Denials).
     - Multi-facet filter toolbar (Actor, Entity Type, Outcome, Date Range).
     - Accessible `DataTable` with status badges and timestamp formatting.
     - Side-by-side JSON Diff Drawer (`Sheet`) for inspecting before/after mutations.
     - `"Export Compliance Log"` action button triggering `GET /api/audit-events/export`.
4. **Dashboard & Sidebar Integration:**
   - Add `"Audit Trail"` to [`DashboardSidebar.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/dashboard/DashboardSidebar.jsx) under *"Analytics & System"*.
   - Add direct hyperlink from *"Firm-Wide Operations Activity Log"* in [`BrokerDashboard.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerDashboard.jsx) to `/broker/audit`.
5. **Frontend Audit Service Integration:**
   - Create [`frontend/src/services/auditService.js`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/services/auditService.js) to consume backend routes `/api/audit-events` and `/api/audit-events/export`.

---

## 2. Applicable Design Tokens & UI Guidelines (`design.md`)

* **Canvas Ground:** Slate Alabaster Ground (`#F8FAFC`).
* **Surface Containers:** Pure White (`#FFFFFF`) with `1px border border-[#E2E8F0]`, `rounded-lg` (8px radius).
* **Brand Colors:** Spruce Teal (`#0F766E`, hover `#115E59`) for active tabs and primary buttons; High-Impact Coral (`#FF6B6B`) with dark slate ink (`#1E293B`) for export actions.
* **Typographic Ink:** Slate 800 (`#1E293B`) for headings and primary copy; Slate 500 (`#64748B`) for helper text; `JetBrains Mono` (12px) for timestamps, IDs, and JSON diffs.
* **Component Reuse:** Leverages existing shadcn/ui components (`Table`, `Badge`, `Sheet`, `Button`, `Input`, `DropdownMenu`).

---

## 3. Affected Files

| File Path | Action | Scope / Changes |
| :--- | :---: | :--- |
| `frontend/src/services/auditService.js` | **Create** | API client for `/api/audit-events` and `/api/audit-events/export`. |
| `frontend/src/pages/portals/broker/BrokerAudit.jsx` | **Create** | Dedicated Broker Audit Console page with table, filters, and diff drawer. |
| `frontend/src/pages/portals/broker/BrokerAudit.test.jsx` | **Create** | Vitest unit tests verifying render, filtering, and export triggers. |
| `frontend/src/components/dashboard/DashboardHeader.jsx` | **Modify** | Dual-tab slide-down (`Notifications` + `Recent Activity`) with direct audit link. |
| `frontend/src/components/dashboard/DashboardSidebar.jsx` | **Modify** | Add `"Audit Trail"` navigation item under Analytics & System. |
| `frontend/src/pages/portals/broker/BrokerDashboard.jsx` | **Modify** | Harmonize "Recent Activity" card header and link to `/broker/audit`. |
| `frontend/src/App.jsx` | **Modify** | Register route `/broker/audit` protected by `RoleRoute` (`broker`, `admin`). |

---

## 4. Detailed Implementation Steps

### Step 1: Frontend Audit Service Layer
* Create `frontend/src/services/auditService.js`:
  - `listAuditEvents(params)`: Queries `GET /api/audit-events` with filters (`inquiryId`, `eventType`, `actorId`, `outcome`, `limit`).
  - `exportAuditEvents(params)`: Queries `GET /api/audit-events/export` and handles JSON download or modal display.
  - Mock fallback caching for offline or simulated development environments.

### Step 2: DashboardHeader Slide-Down Enhancement
* In `frontend/src/components/dashboard/DashboardHeader.jsx`:
  - Introduce tab state: `activeTab: 'notifications' | 'activities'`.
  - Fetch recent audit events on open (latest 6 records via `auditService.listAuditEvents({ limit: 6 })`).
  - Render compact activity items with:
    - Status icon (Emerald check, Amber clock, or Teal edit icon).
    - Actor name and concise event description.
    - Monospace relative timestamp (`2m ago`, `1h ago`).
  - Add footer link button:
    ```jsx
    <Link
      to="/broker/audit"
      onClick={() => setShowNotifications(false)}
      className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center justify-center gap-1.5 py-2 border-t border-[#E2E8F0]"
    >
      <span>View Full Audit Trail</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
    ```

### Step 3: Author Broker Audit Console (`BrokerAudit.jsx`)
* In `frontend/src/pages/portals/broker/BrokerAudit.jsx`:
  - Render `PageHeader`: Title `"Audit Trail"`, Subtitle `"Tamper-resistant chronological log of administrative actions, listing mutations, and agent delegations."`.
  - Header Action: `"Export Compliance Log"` button with Coral accent styling.
  - KPI Summary: 3 cards showing Total Events, Listing Mutations, and Denied/Security Alerts.
  - Filter Toolbar:
    - Debounced Search input (`w-72 h-10`).
    - Event Type Dropdown (`All Events`, `Listing Mutations`, `Agent Lifecycle`, `Inquiry Assignments`, `Security Alerts`).
    - Outcome Filter (`All`, `Success`, `Denied`).
  - Table: `DataTable` displaying timestamp, event type badge, actor, target entity link, outcome pill, and "Inspect Diff" button.
  - Side Drawer: `Sheet` component displaying the sanitized `previous_values` vs `new_values` JSON diff with color-coded additions/deletions.

### Step 4: Routing & Navigation Integration
* In `frontend/src/App.jsx`:
  - Import `BrokerAudit` and register `<Route path="/broker/audit" element={<RoleRoute allowedRoles={['broker', 'admin']}><BrokerAudit /></RoleRoute>} />`.
* In `frontend/src/components/dashboard/DashboardSidebar.jsx`:
  - Add `{ to: '/broker/audit', label: 'Audit Trail', icon: ShieldCheck }` under `Analytics & System`.
* In `frontend/src/pages/portals/broker/BrokerDashboard.jsx`:
  - Update `"Firm-Wide Operations Activity Log"` header to include an `"Open Full Audit Trail →"` text button linking to `/broker/audit`.

---

## 5. Verification & Testing Strategy

1. **Unit & Component Testing (Vitest):**
   - `BrokerAudit.test.jsx`: Assert rendering of header, filters, data rows, and diff drawer opening.
   - `DashboardHeader.test.jsx`: Assert tab switching between Notifications and Recent Activity, and verify navigation link to `/broker/audit`.
2. **Visual & Design System Compliance (`design.md`):**
   - Verify 8px grid spacing (`p-4`, `p-6`, `gap-4`).
   - Verify Teal `#0F766E` focus rings and Coral `#FF6B6B` export button contrast ($\ge 4.5:1$).
   - Verify responsive behavior on mobile ($< 768\text{px}$) and tablet ($768 - 1023\text{px}$).
3. **End-to-End Flow Verification:**
   - Click bell icon in header $\rightarrow$ Click "Recent Activity" tab $\rightarrow$ Verify latest audit events displayed $\rightarrow$ Click "View Full Audit Trail" $\rightarrow$ Confirmed navigation to `/broker/audit`.

---

## 6. Approval Boundary

* **Changes strictly within Frontend & UI/UX scope:** No schema changes or breaking backend changes.
* **Explicit Gate:** Awaiting user review and authorization before modifying project files.
