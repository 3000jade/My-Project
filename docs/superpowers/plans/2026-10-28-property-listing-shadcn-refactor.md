# Property Listing Module shadcn/ui Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Property Listing Module (`02-property-listing`) frontend interfaces (`BrokerProperties.jsx`, `BrokerCreateListings.jsx`, `CreateListingModal.jsx`, `BrokerPropertyDetail.jsx`, `AgentProperties.jsx`) to repository-owned shadcn/ui primitives adhering strictly to `design.md` tokens, while maintaining the strict invariant of zero modifications to public listview components (`PropertyListingView.jsx`, `PropertiesPage.jsx`).

**Architecture:** 
1. Scaffold required atomic headless Radix UI primitives (`input`, `textarea`, `select`, `tabs`, `sheet`, `alert`, `alert-dialog`, `checkbox`, `label`) directly into `frontend/src/components/ui/` with CVA bindings using the canonical class merge utility `@/utils/cn`.
2. Progressively migrate each screen to shadcn/ui primitives, applying the authoritative palette (Teal `#0F766E`, Coral `#FF6B6B` with Slate `#1E293B` text at 5.27:1 contrast, Canvas `#F8FAFC`, Surface `#FFFFFF`, Border `#E2E8F0`).
3. Retain complete functional isolation and decoupled intake architecture (no sales agent picker in Step 1).

**Tech Stack:** React 19, Tailwind CSS v4, Radix UI Primitives, Class Variance Authority (`cva`), `clsx`, `tailwind-merge`, Vitest, Playwright.

**Spec Reference:**
- [`docs/modules/02-property-listing/ui-specification.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/ui-specification.md)
- [`design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/design.md)
- [`docs/modules/02-property-listing/2026-10-27-property-listings-functions-specification.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/2026-10-27-property-listings-functions-specification.md)

---

## Global Constraints & Boundaries

- **Strict Non-Interference:** Do NOT modify `frontend/src/pages/public/PropertyListingView.jsx` or `frontend/src/pages/public/PropertiesPage.jsx`.
- **Decoupled Intake Rule:** Step 1 of `BrokerCreateListings.jsx` and `CreateListingModal.jsx` must NOT introduce sales agent selection.
- **Authoritative Brand Tokens:**
  - Primary Teal: `#0F766E` | Hover: `#115E59` | Secondary Teal: `#14B8A6`
  - Approved Coral Accent: `#FF6B6B` with Slate text `#1E293B` (Contrast: 5.27:1)
  - Background Canvas: `#F8FAFC` | Surface: `#FFFFFF` | Border: `#E2E8F0`
- **Component Ownership:** All primitives live in `frontend/src/components/ui/` with zero black-box package lock-in.

---

## Environment Readiness & Existing State

- **Primitives Present:** `badge.jsx`, `button.jsx`, `card.jsx`, `dialog.jsx`, `dropdown-menu.jsx`, `skeleton.jsx`, `table.jsx`.
- **Primitives to Add:** `input.jsx`, `textarea.jsx`, `select.jsx`, `tabs.jsx`, `sheet.jsx`, `alert.jsx`, `alert-dialog.jsx`, `checkbox.jsx`, `label.jsx`.
- **Test Baseline:**
  - Frontend Vitest suite passes: `BrokerCreateListings.test.jsx` (7/7 passed), `BrokerAgentDetail.test.jsx` (4/4 passed), `propertyService.test.js` (9/9 passed).
  - Playwright E2E suite passes: `property-agent-assignment-decoupling.spec.ts` (3/3 passed).

---

## Implementation Tasks

### Task 1: Scaffold & Verify Atomic shadcn/ui Primitives

**Files:**
- Create: `frontend/src/components/ui/input.jsx`
- Create: `frontend/src/components/ui/textarea.jsx`
- Create: `frontend/src/components/ui/tabs.jsx`
- Create: `frontend/src/components/ui/sheet.jsx`
- Create: `frontend/src/components/ui/alert.jsx`
- Create: `frontend/src/components/ui/alert-dialog.jsx`
- Create: `frontend/src/components/ui/checkbox.jsx`
- Create: `frontend/src/components/ui/label.jsx`
- Test: `frontend/src/components/ui/primitives.test.jsx`

**Interfaces:**
- Consumes: Radix UI primitives (`@radix-ui/react-tabs`, `@radix-ui/react-dialog`, `@radix-ui/react-checkbox`, `@radix-ui/react-label`), `cva`, `@/utils/cn`.
- Produces: Accessible atomic form and layout primitives styled with `design.md` tokens.

- [x] **Step 1: Write unit tests for new primitives in `primitives.test.jsx`**
  - Verify render, keyboard accessibility, role attributes, and class merging for `Input`, `Textarea`, `Tabs`, `Sheet`, `Alert`, `Checkbox`, `Label`.
- [x] **Step 2: Run test to observe failure**
  - Run: `npm run test --prefix frontend -- primitives.test.jsx`
- [x] **Step 3: Implement atomic primitives in `frontend/src/components/ui/`**
  - `input.jsx`: Height `h-[40px]`, Slate border `#CBD5E1`, focus ring `#0F766E`.
  - `textarea.jsx`: Min-h 100px, Slate border `#CBD5E1`, focus ring `#0F766E`.
  - `tabs.jsx`: Underline/pill variants with active indicator `#0F766E`.
  - `sheet.jsx`: Radix dialog wrapper configured as slide-over drawer with backdrop blur.
  - `alert.jsx`: Variants `default`, `warning` (`#F59E0B`), `destructive` (`#DC2626`).
  - `checkbox.jsx`: Checked background `#0F766E` with white checkmark.
  - `label.jsx`: Accessible label binding with uppercase tracking.
- [x] **Step 4: Run tests and verify passing**
  - Run: `npm run test --prefix frontend -- primitives.test.jsx`

---

### Task 2: Refactor Broker Property Management Console (`BrokerProperties.jsx`, `M02-SCR-01`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Modify: `frontend/src/components/cms/PropertyQuickEditDrawer.jsx`
- Test: `frontend/src/pages/portals/broker/BrokerProperties.test.jsx` (create or update)

**Interfaces:**
- Consumes: `Table`, `Badge`, `DropdownMenu`, `Sheet`, `Button`, `Skeleton`, `Input` from `frontend/src/components/ui/`.
- Produces: High-density responsive real estate inventory ledger.

- [x] **Step 1: Write component tests for `BrokerProperties`**
  - Verify table displays property rows, status badges, action dropdown items, and filters without regressions.
- [x] **Step 2: Refactor table structure in `BrokerProperties.jsx`**
  - Replace bespoke table elements with `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>`.
  - Bind status pills to `<Badge variant="...">`:
    - `AVAILABLE` -> `variant="success"`
    - `RESERVED` -> `variant="warning"`
    - `UNDER CONTRACT` -> `variant="secondary"`
    - `UNASSIGNED` -> `variant="outline"`
- [x] **Step 3: Refactor row action menu to `DropdownMenu`**
  - Replace bespoke popups with `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>`.
- [x] **Step 4: Refactor `PropertyQuickEditDrawer.jsx` to `Sheet`**
  - Replace bespoke side drawer with `<Sheet>`, `<SheetContent>`, `<SheetHeader>`, `<SheetTitle>`.
- [x] **Step 5: Run tests and verify passing**
  - Run: `npm run test --prefix frontend -- BrokerProperties.test.jsx`

---

### Task 3: Refactor 7-Step Listing Intake & Edit Studio (`BrokerCreateListings.jsx`, `M02-SCR-02`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`
- Test: `frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx`

**Interfaces:**
- Consumes: `Tabs`, `Input`, `Textarea`, `Checkbox`, `Alert`, `Button` from `frontend/src/components/ui/`.
- Produces: Refactored 7-step studio adhering to `design.md` with zero sales agent selection controls.

- [x] **Step 1: Verify existing test suite passes before refactoring**
  - Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`
- [x] **Step 2: Refactor step wizard navigation bar to `Tabs`**
  - Bind step tabs to `<TabsList>` and `<TabsTrigger>` with accessible ARIA states and completed checkmarks.
- [x] **Step 3: Refactor Step 1 inputs to shadcn `Input`, `Textarea`, `Label`**
  - Ensure 2-column grid layout is preserved; verify zero agent picker exists.
- [x] **Step 4: Refactor Steps 2-6 form elements**
  - Replace form inputs with `<Input>`, `<Textarea>`, `<Checkbox>`.
  - Replace error callouts with `<Alert variant="destructive">`.
- [x] **Step 5: Refactor Step 7 Review CTA to Approved Coral Button**
  - Use `<Button variant="coral">` (`#FF6B6B` background with `#1E293B` slate text).
- [x] **Step 6: Run tests and verify all pass**
  - Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`

---

### Task 4: Refactor Quick Listing Intake Modal (`CreateListingModal.jsx`, `M02-SCR-03`)

**Files:**
- Modify: `frontend/src/components/dashboard/CreateListingModal.jsx`
- Test: `frontend/src/components/dashboard/CreateListingModal.test.jsx` (create or run)

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Input`, `Label`, `Button` from `frontend/src/components/ui/`.
- Produces: Accessible modal for rapid unassigned property creation.

- [x] **Step 1: Write test for `CreateListingModal` refactor**
  - Verify modal opens, captures fields, sets `agent_id: null`, and submits successfully.
- [x] **Step 2: Refactor modal markup to `Dialog` primitive**
  - Replace bespoke modal DOM with `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`, `<DialogFooter>`.
  - Use `<Input>` and `<Label>` for form fields.
- [x] **Step 3: Run tests and verify passing**
  - Run: `npm run test --prefix frontend -- CreateListingModal.test.jsx`

---

### Task 5: Refactor Broker Property Dossier & Agent Portfolio (`M02-SCR-04` & `M02-SCR-05`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentProperties.jsx`

**Interfaces:**
- Consumes: `Tabs`, `Card`, `Badge`, `Alert`, `Dialog`, `Button` from `frontend/src/components/ui/`.
- Produces: Refactored dossier and consultant portfolio with accessible handshake banners.

- [x] **Step 1: Refactor `BrokerPropertyDetail.jsx` tabs and cards**
  - Replace bespoke dossier tabs with `<Tabs>` and audit table with `<Table>`.
- [x] **Step 2: Refactor `AgentProperties.jsx` handshake alert**
  - Replace assignment banner with `<Alert variant="warning">` and action buttons `<Button>`.
  - Replace decline reason popup with accessible `<Dialog>`.
- [x] **Step 3: Run portal component tests**
  - Run: `npm run test --prefix frontend -- BrokerPropertyDetail AgentProperties`

---

### Task 6: End-to-End Playwright Verification & Invariant Audit

**Files:**
- Run: `frontend/e2e/property-agent-assignment-decoupling.spec.ts`
- Audit: `frontend/src/pages/public/PropertyListingView.jsx`
- Audit: `frontend/src/pages/public/PropertiesPage.jsx`
- Create: `docs/modules/02-property-listing/2026-10-28-shadcn-ui-refactoring-verification.md`

- [x] **Step 1: Execute full Playwright E2E suite**
  - Run: `cd frontend && npx playwright test property-agent-assignment-decoupling.spec.ts`
- [x] **Step 2: Verify zero modifications on public listviews**
  - Run: `git diff frontend/src/pages/public/PropertyListingView.jsx frontend/src/pages/public/PropertiesPage.jsx` (must be completely empty).
- [x] **Step 3: Document dated verification record**
  - Create `docs/modules/02-property-listing/2026-10-28-shadcn-ui-refactoring-verification.md` with YAML frontmatter.
  - Update `docs/modules/02-property-listing/INDEX.md` and `docs/modules/02-property-listing/ui-specification.md`.

---

## Explicit Approval Boundaries (AGENTS.md Section 9)

| Boundary Item | Changes Involved | Approval Requirement |
| :--- | :--- | :--- |
| **Database Changes** | None. Zero schema migrations or table alterations. | Pre-approved |
| **Permission Changes** | None. Enforces existing RBAC. | Pre-approved |
| **Breaking API Changes** | None. Endpoints remain identical. | Pre-approved |
| **Listview Components** | Strictly untouched (`PropertyListingView.jsx`, `PropertiesPage.jsx`). | Invariant (Strict Non-Interference) |
| **Design Standards** | Applies `design.md` tokens (Teal `#0F766E`, Coral `#FF6B6B`, Slate `#1E293B`). | Pre-approved |
