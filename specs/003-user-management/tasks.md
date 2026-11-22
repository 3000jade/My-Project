# Tasks: Comprehensive User Management Module

**Input**: Design documents from `/specs/003-user-management/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/admin-users.json`)  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `data-model.md`, `contracts/`  
**Constitution**: Enforces `.specify/memory/constitution.md` (Principle VI: User Management & Privilege Isolation)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Mapped user story (US1, US2, US3, US4)

---

## Phase 1: Setup & Shared Infrastructure

**Purpose**: Environment and shared type alignment

- [x] T001 Verify database environment variables and service role bindings in `backend/src/config/supabase.ts`
- [x] T002 [P] Establish OpenAPI contracts for user management endpoints in `specs/003-user-management/contracts/admin-users.json`

---

## Phase 2: Foundational (Database & Security Infrastructure)

**Purpose**: Core security triggers, middleware, and session management infrastructure

**⚠️ CRITICAL**: Blocks all user stories from executing unverified access

- [x] T003 Deploy hardened user registration trigger migration in `backend/src/models/fix_handle_new_user_trigger_migration.sql` to force `role = 'client'`
- [x] T004 Sync master DDL schema definitions in `backend/src/models/supabase_schema.sql`
- [x] T005 [P] Verify dual-layer RBAC route protection in `backend/src/middleware/role.middleware.ts`
- [x] T006 [P] Verify SHA-256 token hashing and session storage in `backend/src/services/session.service.ts`
- [x] T007 Configure audit event recording for administrative actions in `backend/src/services/audit.service.ts`

**Checkpoint**: Foundation ready - User story tasks can now proceed.

---

## Phase 3: User Story 1 - Role Assignment & Privilege Enforcement (Priority: P1) 🎯 MVP

**Goal**: Super Administrator can view users, filter/paginate directory, and reassign roles with self-lockout prevention.  
**Independent Test**: Super Admin changes a user's role in the admin portal; confirm immediate role update, auth cache invalidation, and audit log generation; confirm own role dropdown is disabled.

- [x] T008 [US1] Implement server-side pagination (`page`, `limit`), search, and role filtering in `backend/src/controllers/admin.controller.ts` (`listUsers`)
- [x] T009 [US1] Implement self-lockout guard in `backend/src/controllers/admin.controller.ts` (`updateUserRole`) rejecting `id === req.user.id` with 403 Forbidden
- [x] T010 [US1] Integrate `RolePermissionEditor.jsx` with paginated API, search debouncing, and role dropdown selector
- [x] T011 [US1] Enforce self-account UI protection in `frontend/src/components/auth/RolePermissionEditor.jsx` (render `Your account` badge, disable role dropdown for active admin)

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Account Suspension & Security Kill Switch (Priority: P2)

**Goal**: Super Administrator can suspend compromised accounts, immediately terminating all active sessions.  
**Independent Test**: Suspend an active user; verify `verification_status` updates to `SUSPENDED`, session tokens are revoked, and subsequent requests fail with 401 Unauthorized.

- [x] T012 [US2] Implement account suspension handler in `backend/src/controllers/admin.controller.ts` (`updateUserStatus`) with self-lockout guard
- [x] T013 [US2] Wire instant session termination via `SessionService.disableUserAccount(id)` and `invalidateAuthCache(id)`
- [x] T014 [US2] Add Suspend/Activate action button in `frontend/src/components/auth/RolePermissionEditor.jsx` with loading states and disabled self-row
- [x] T015 [US2] Emit `admin.account_suspended` and `admin.account_activated` audit logs in `backend/src/services/audit.service.ts`

**Checkpoint**: User Stories 1 and 2 work independently and in combination.

---

## Phase 5: User Story 3 - Agent Professional Accreditation Review (Priority: P3)

**Goal**: Surfacing real estate agents' PRC licenses and DHSUD accreditation numbers directly in user management.  
**Independent Test**: Filter user table by `role=agent`; confirm PRC license badge renders with license number or `Unregistered` warning.

- [x] T016 [US3] Ensure PRC licensing columns (`prc_license_no`, `prc_validity`, `dhsud_accreditation_no`) are returned in `backend/src/controllers/admin.controller.ts` (`listUsers`)
- [x] T017 [US3] Implement PRC accreditation badges with `IconCertificate` in `frontend/src/components/auth/RolePermissionEditor.jsx`

**Checkpoint**: Agent accreditation compliance clearly surfaced in user management.

---

## Phase 6: User Story 4 - Multi-Device Session Inspection & Revocation (Priority: P4)

**Goal**: Administrators can inspect all active browser/device sessions and revoke individual devices remotely.  
**Independent Test**: Switch to "Active Sessions" tab in `/admin/users`; verify active sessions display IP, user agent, and remaining TTL; click "Revoke" to invalidate individual session.

- [x] T018 [US4] Verify session listing and revocation endpoints in `backend/src/controllers/auth.controller.ts` / `session.service.ts`
- [x] T019 [US4] Verify `SessionManagementPanel.jsx` component renders live sessions with IP, user agent, and remote revoke actions
- [x] T020 [US4] Wire tab switcher between "Users & Roles" and "Active Sessions" in `frontend/src/pages/portals/super-admin/AdminUsersPage.jsx`

**Checkpoint**: All user stories functional.

---

## Phase 7: Polish, Verification & Quality Gates

**Purpose**: Automated test suites and real-browser visual verification

- [x] T021 [P] Author unit tests for `RolePermissionEditor` covering pagination, self-lockout, and PRC badges in `frontend/src/components/auth/RolePermissionEditor.test.jsx`
- [x] T022 Run automated Vitest test suite (`npm --prefix frontend test`)
- [x] T023 Perform live browser end-to-end verification using Playwright MCP on `http://localhost:5173/admin/users`
- [x] T024 Capture visual proof screenshots and compile `walkthrough.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup & Foundational (Phases 1 & 2)**: Database triggers & session services block all user stories.
- **User Stories (Phases 3 -> 4 -> 5 -> 6)**:
  - US1 (P1 🎯 MVP): Can be tested independently.
  - US2 (P2): Depends on foundational session service; integrates with user table.
  - US3 (P3): Enhances directory with agent accreditation data.
  - US4 (P4): Provides dedicated active session tab.
- **Polish & Verification (Phase 7)**: Executed after all story features are integrated.

---

## Implementation Strategy (MVP First)

1. **Phase 1 & 2**: Harden database trigger (`fix_handle_new_user_trigger_migration.sql`) & verify session infrastructure.
2. **Phase 3 (MVP)**: Deliver paginated user directory with role assignment & self-lockout guard.
3. **Phase 4**: Add account suspension kill switch.
4. **Phase 5**: Add agent PRC accreditation badges.
5. **Phase 6**: Integrate multi-device session management panel.
6. **Phase 7**: Verify 100% test coverage with Vitest and Playwright MCP.
