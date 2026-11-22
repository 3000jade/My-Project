# Tasks: Stakeholder UI/UX Experience for User Management

**Input**: Design documents from `/specs/004-user-management-uiux/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/admin-ui.json`)  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `data-model.md`, `contracts/`  
**Constitution**: Enforces `.specify/memory/constitution.md` (Principle I: Design System `DESIGN.md`, Principle VI: RBAC & Least Privilege)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Mapped user story (US1, US2, US3, US4)

---

## Phase 1: Setup & Shared UI Tokens

**Purpose**: Design tokens, state definitions, and contract scaffolding

- [x] T001 [P] Verify `DESIGN.md` token values (Teal `#0F766E`, Coral `#FF6B6B`, Slate `#1E293B`) in `frontend/src/index.css`
- [x] T002 [P] Establish OpenAPI contracts for UI metrics and modal operations in `specs/004-user-management-uiux/contracts/admin-ui.json`

---

## Phase 2: Foundational (Backend Metrics & Validation APIs)

**Purpose**: Provide aggregated metrics and mandatory reason validation for UI components

**⚠️ CRITICAL**: Blocks User Story 1 and User Story 3 execution

- [x] T003 Implement `GET /api/admin/users/stats` in `backend/src/controllers/admin.controller.ts` returning counts for Total Accounts, Active Today, Pending Accreditation, and Suspended
- [x] T004 Enforce mandatory non-empty `reason` payload validation for account suspension in `backend/src/controllers/admin.controller.ts` (`updateUserStatus`)
- [x] T005 [P] Register stats route in `backend/src/routes/admin.routes.ts`

**Checkpoint**: Backend metrics and status validation ready for frontend integration.

---

## Phase 3: User Story 1 - Executive Summary & Quick Triage (Priority: P1) 🎯 MVP

**Goal**: Super Administrators and Executives have an immediate 4-card KPI strip with one-click filter triage.  
**Independent Test**: Load `/admin/users`; verify 4 cards render live numbers; click "Pending Accreditation" card and confirm directory filters immediately.

- [x] T006 [P] [US1] Create `frontend/src/components/auth/UserMetricsStrip.jsx` rendering 4 responsive metric cards adhering to `DESIGN.md`
- [x] T007 [US1] Implement interactive filter click handlers on metric cards (e.g. clicking "Suspended" triggers `status=suspended` filter)
- [x] T008 [US1] Mount `UserMetricsStrip` atop `frontend/src/components/auth/RolePermissionEditor.jsx` with skeleton loading states

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - High-Clarity User Directory & Multi-Dimension Filtering (Priority: P2)

**Goal**: Fast, accessible directory with `⌘K` command-palette search, debounced querying, and coordinated role/status facets.  
**Independent Test**: Press `⌘K` or `Ctrl+K`; verify search input autofocuses; change role to "agent" and status to "active"; verify combined filtering without layout shift.

- [x] T009 [US2] Add global keyboard shortcut listener (`⌘K` / `Ctrl+K`) to focus search input in `frontend/src/components/auth/RolePermissionEditor.jsx`
- [x] T010 [US2] Add Status filter dropdown (`All Statuses`, `Active`, `Suspended`, `Pending Review`) beside the Role dropdown
- [x] T011 [US2] Add "Clear Filters" reset button when active search or non-default filters are present

**Checkpoint**: User Stories 1 and 2 operate in harmony.

---

## Phase 5: User Story 3 - Safe Role Elevation & Two-Step Suspension Modal (Priority: P3)

**Goal**: Prevent accidental suspensions or role demotions by requiring an accessible two-step confirmation modal with documented reason.  
**Independent Test**: Click "Suspend" on a user; verify modal opens; verify confirm button is disabled until reason is entered; verify confirmation emits update with audit trail.

- [x] T012 [P] [US3] Create accessible `frontend/src/components/auth/UserActionConfirmationModal.jsx` with Coral accent (`#FF6B6B`), focus trapping, and `Escape` dismiss
- [x] T013 [US3] Require non-empty justification text area before enabling "Confirm Suspension" button
- [x] T014 [US3] Connect modal dispatch to `PATCH /api/admin/users/:id/status` in `RolePermissionEditor.jsx`
- [x] T015 [US3] Confirm self-account lockout badge (`Your account`) disables modal trigger for the logged-in admin

**Checkpoint**: Accidental account intervention risk eliminated.

---

## Phase 6: User Story 4 - Agent Professional Accreditation Compliance Drawer (Priority: P4)

**Goal**: Managing Brokers and Administrators can inspect full PRC licensing and DHSUD certificates in a slide-out drawer.  
**Independent Test**: Click an agent's PRC badge; verify slide-out drawer displays PRC number, validity date countdown, DHSUD status, and close button.

- [x] T016 [P] [US4] Create `frontend/src/components/auth/AgentCredentialDrawer.jsx` slide-out sheet component adhering to `DESIGN.md`
- [x] T017 [US4] Display PRC license number, expiration countdown, and DHSUD accreditation metadata in drawer
- [x] T018 [US4] Add "View Credentials" action link on agent rows in `RolePermissionEditor.jsx` to open the drawer

**Checkpoint**: All 4 stakeholder user stories complete.

---

## Phase 7: Polish, Verification & Quality Gates

**Purpose**: Automated test coverage, regression check, and Playwright MCP live browser verification

- [x] T019 [P] Update unit test suite in `frontend/src/components/auth/RolePermissionEditor.test.jsx` to cover KPI strip, search hotkey, and confirmation modal
- [x] T020 Run automated Vitest test suites (`npm --prefix frontend test`)
- [x] T021 Perform Playwright MCP live browser verification on `http://localhost:5173/admin/users`
- [x] T022 Capture visual proof screenshots and compile `walkthrough.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup & Foundational (Phases 1 & 2)**: Backend metrics endpoint (`/stats`) and reason validation block Phase 3 (KPI strip) and Phase 5 (Modal).
- **User Stories (Phases 3 -> 4 -> 5 -> 6)**:
  - US1 (P1 🎯 MVP): Can be tested independently.
  - US2 (P2): Enhances existing table with hotkey and multi-facet filtering.
  - US3 (P3): Replaces inline button toggle with modal confirmation.
  - US4 (P4): Adds non-blocking credential drawer.
- **Polish & Verification (Phase 7)**: Executed after all story features are integrated.

---

## Implementation Strategy (MVP First)

1. **Phase 1 & 2**: Implement `GET /api/admin/users/stats` and reason validation.
2. **Phase 3 (MVP)**: Deliver `UserMetricsStrip.jsx` with live counts and click-to-filter triage.
3. **Phase 4**: Add `⌘K` search hotkey and multi-dimension status facet.
4. **Phase 5**: Integrate `UserActionConfirmationModal.jsx` for safe two-step suspensions.
5. **Phase 6**: Integrate `AgentCredentialDrawer.jsx` for deep regulatory compliance checks.
6. **Phase 7**: Validate with Vitest unit tests and Playwright MCP browser automation.
