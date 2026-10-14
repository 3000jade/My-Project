# Property Listings Mockup Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Broker Property Listings table and dashboard layout (`BrokerProperties.jsx`, `DataTable.jsx`, `SearchAndFilterBar.jsx`, `DashboardHeader.jsx`, `DashboardSidebar.jsx`) to achieve 100% visual and functional fidelity with the Modern SaaS mockup design.

**Architecture:** Refactor the property ledger view from heavy KPI plinths to a high-density, clean SaaS table chassis. Implement pixel-accurate pill status tabs with count badges, structured 7-column table layout with specs and location sublines, 4-button action clusters (Edit, Duplicate, View, More), numbered pagination (`< 1 2 3 4 5 >`), top bar search and avatar profile, and sidebar community promo card.

**Tech Stack:** React 18, React Router v6, Tailwind CSS v4, Lucide React icons, Vitest, Testing Library.

**Spec:** Mockup image (`media_1791924462478.png`), `design.md`, and `docs/implementation/PROPERTY_LISTING_FORM.md`.

## Global Constraints
- Strictly adhere to Modern SaaS design tokens: Teal `#0F766E`, Coral `#FF6B6B`, `#F8FAFC` base ground, `#FFFFFF` surfaces with `#E2E8F0` 1px borders, standard 8px radius (`rounded-lg`).
- Zero regressions in existing business logic: retain `propertyService.getProperties()`, `updateProperty()`, bulk batch actions, approval transitions, and local mock fallback.
- All Vitest test suites (especially `BrokerProperties.test.jsx`) must pass with 100% green status.
- NEVER execute `git push` or remote publication commands.

---

### Task 1: Enhance `DataTable.jsx` with Numbered Pagination & Multi-Action Cell Support

**Files:**
- Modify: `frontend/src/components/dashboard/DataTable.jsx`
- Test: `frontend/src/components/dashboard/DataTable.test.jsx` (create or update)

**Interfaces:**
- Consumes: `currentPage`, `pageSize`, `data.length`, `totalPages`
- Produces: Dynamic numbered pagination array (`<`, `1`, `2`, `...`, `N`, `>`) with solid teal active button styling matching mockup footer.

- [x] **Step 1: Write the component test for numbered pagination**
Create test asserting that when `data.length = 25` and `pageSize = 8`, page buttons `1`, `2`, `3`, `4` are rendered, and clicking page `2` triggers page switch with correct active highlight.

- [x] **Step 2: Run test to observe failure**
Run `npx vitest run DataTable.test.jsx`.

- [x] **Step 3: Implement numbered pagination in `DataTable.jsx`**
Replace minimal `1 / 5` text counter with numbered pagination buttons:
```jsx
// Numbered button layout matching mockup
<div className="flex items-center gap-1">
  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-[#E2E8F0] ...">
    <ChevronLeft className="w-4 h-4" />
  </button>
  {pageNumbers.map(page => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={cn(
        "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
        currentPage === page
          ? "bg-[#0F766E] text-white font-semibold shadow-xs"
          : "text-slate-600 hover:bg-slate-100 border border-transparent"
      )}
    >
      {page}
    </button>
  ))}
  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-[#E2E8F0] ...">
    <ChevronRight className="w-4 h-4" />
  </button>
</div>
```

- [x] **Step 4: Verify tests pass**
Run `npx vitest run DataTable.test.jsx`.

---

### Task 2: Refactor `SearchAndFilterBar.jsx` for Mockup Toolbar Alignment

**Files:**
- Modify: `frontend/src/components/dashboard/SearchAndFilterBar.jsx`
- Test: `frontend/src/components/dashboard/SearchAndFilterBar.test.jsx`

**Interfaces:**
- Consumes: `searchValue`, `onSearchChange`, `statusFilter`, `onStatusFilterChange`, `onFilterModalClick`
- Produces: Integrated toolbar with search input on left, `All Statuses` dropdown on right, and square icon filter button.

- [x] **Step 1: Write the failing test for filter button and toolbar layout**
Assert search input, status dropdown, and filter icon button render with appropriate CSS classes and callback triggers.

- [x] **Step 2: Run test to observe failure**
Run `npx vitest run SearchAndFilterBar.test.jsx`.

- [x] **Step 3: Update `SearchAndFilterBar.jsx`**
Implement the flex toolbar layout matching the mockup:
- Search input with placeholder `"Search by title, address, agent, or property type..."` with left search icon.
- Right controls:
  - Custom styled dropdown with `ChevronDown` icon (`border border-[#E2E8F0] rounded-lg text-xs bg-white text-slate-700`).
  - Square filter button with `SlidersHorizontal` icon (`border border-[#E2E8F0] rounded-lg p-2.5 bg-white text-slate-600 hover:bg-slate-50`).

- [x] **Step 4: Verify tests pass**
Run `npx vitest run SearchAndFilterBar.test.jsx`.

---

### Task 3: Redesign `BrokerProperties.jsx` Layout & Data Columns

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Test: `frontend/src/pages/portals/broker/BrokerProperties.test.jsx`

**Interfaces:**
- Consumes: `properties`, `propertyService`, `normalizeProperty`
- Produces: Mockup-accurate breadcrumbs, title/subtitle header, Refresh + New Listing buttons, pill status tabs, and 7-column table with multi-line specs and location.

- [x] **Step 1: Write/update test assertions in `BrokerProperties.test.jsx`**
Assert:
1. Breadcrumb `Properties > All Listings` and header `Property Listings` render.
2. Status filter tabs render counts (`All Listings`, `Needs Approval`, `Active`, `Under Contract`, `Closed`).
3. Property columns render image thumbnail, title, property ID, MapPin location, specs (area, beds, baths), price (bold teal), status dot pill, and 4 action buttons (Edit, Copy, Eye, More).

- [x] **Step 2: Run test to observe failure**
Run `npx vitest run BrokerProperties.test.jsx`.

- [x] **Step 3: Implement UI updates in `BrokerProperties.jsx`**
1. **Header Section:**
   - Breadcrumbs: `Properties` > `All Listings`
   - Title: `Property Listings` + subtitle: `Manage and organize your property listings.`
   - Action cluster:
     - `Refresh` button with `RotateCw` icon (white bg, subtle border).
     - `+ New Listing` button in Coral `#FF6B6B` with white text.
2. **Pill Status Tabs:**
   - Oval/pill filter buttons with count badges:
     - Active tab: `#0F766E` background with white text and translucent count pill.
     - Inactive tabs: `#F8FAFC` or transparent background with `#64748B` text and `#F1F5F9` count badge.
3. **Column Structure:**
   - `Property`: rounded-lg image thumbnail (~64x48px), bold title, `ID: HSR-XXXXXXX | Type` subline.
   - `Location`: MapPin icon + address line 1, city line 2.
   - `Specs`: Maximize icon + `XX m²`, bed icon + count, bath icon + count.
   - `Price & Carrying`: Bold Teal `#0F766E` formatted price (`₱158,000,000`).
   - `Status`: Rounded dot badges (`Active` green, `Draft` slate, `Pending Approval` amber).
   - `Actions`: 4 icon buttons:
     - Pencil (`Edit3`) $\rightarrow$ Quick Edit
     - Copy (`Copy`) $\rightarrow$ Duplicate listing
     - Eye (`Eye`) $\rightarrow$ View detail modal
     - MoreVertical (`MoreVertical`) $\rightarrow$ Dropdown options
4. **Action Handlers:**
   - Implement `handleDuplicate(property)` to clone a listing with a new ID and "Copy" suffix.
   - Implement `handleViewPublic(property)` to open property dossier or preview.

- [x] **Step 4: Verify test suite passes**
Run `npx vitest run BrokerProperties.test.jsx`.

---

### Task 4: Polish `DashboardHeader.jsx` & `DashboardSidebar.jsx` Chrome

**Files:**
- Modify: `frontend/src/components/dashboard/DashboardHeader.jsx`
- Modify: `frontend/src/components/dashboard/DashboardSidebar.jsx`
- Test: `frontend/src/components/dashboard/DashboardHeader.test.jsx`

**Interfaces:**
- Consumes: User profile context (`John Doe`, `Administrator`), notifications
- Produces: Mockup-aligned search bar ("Search properties, clients, or reference numbers..."), avatar pill ("JD - John Doe, Administrator"), and sidebar promo plinth.

- [x] **Step 1: Update test in `DashboardHeader.test.jsx`**
Verify placeholder text and user profile badge rendering.

- [x] **Step 2: Implement header search bar & user profile in `DashboardHeader.jsx`**
- Center search placeholder: `"Search properties, clients, or reference numbers..."`.
- Right profile badge: `JD` initials circle, `John Doe`, `Administrator` sub-label with chevron down.

- [x] **Step 3: Implement Community Promo Card in `DashboardSidebar.jsx`**
- Add bottom card in sidebar above user profile:
  - Gradient or soft emerald/mint background (`#ECFDF5` to `#F0FDF4`).
  - Home community illustration.
  - Heading: "Build Better Communities Together".
  - Body: "Quality homes for a brighter tomorrow."
  - Circular arrow button (`→`).

- [x] **Step 4: Verify header and sidebar tests pass**
Run `npm test`.

---

### Task 5: End-to-End Visual & Functional Verification

**Files:**
- Target: Full frontend workspace (`frontend/src/`)

- [ ] **Step 1: Execute Vitest test suites**
Run `npm test` or `npx vitest run` across all dashboard tests. Ensure 100% pass rate.

- [ ] **Step 2: Build verification**
Run `npm run build` in `frontend/` to confirm zero syntax or bundling errors.

- [ ] **Step 3: Visual inspection via browser subagent**
Launch browser subagent to verify pixel alignment with mockup image (`media_1791924462478.png`), testing tab switching, searching, pagination, and action buttons.
