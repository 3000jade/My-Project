# Tasks: User Management Security Hardening & Admin Enhancements

**Input**: Design documents from `/specs/002-user-management-security/`  
**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Foundational (Database Trigger Hardening)
- [x] T001 Create migration script `backend/src/models/fix_handle_new_user_trigger_migration.sql` for privilege escalation fix
- [x] T002 Sync trigger definition in `backend/src/models/supabase_schema.sql`

## Phase 2: User Story 1 & 2 - Backend Security & Self-Lockout Guards
- [x] T003 [US1/US2] Implement self-lockout prevention guards in `backend/src/controllers/admin.controller.ts` (`updateUserRole` & `updateUserStatus`)
- [x] T004 [US3] Implement server-side pagination and filter parameters in `backend/src/controllers/admin.controller.ts` (`listUsers`)

## Phase 3: User Story 3 & 4 - Frontend Admin Portal Enhancements
- [x] T005 [US2] Update `frontend/src/components/auth/RolePermissionEditor.jsx` to disable role selector and status toggle for current logged-in user with `(Your account)` badge
- [x] T006 [US3] Implement server-side pagination controls in `frontend/src/components/auth/RolePermissionEditor.jsx`
- [x] T007 [US4] Display PRC accreditation badge for agent accounts in `frontend/src/components/auth/RolePermissionEditor.jsx`

## Phase 4: Verification & Quality Gates
- [x] T008 [P] Update unit and component tests in `frontend/src/components/auth/RolePermissionEditor.test.jsx`
- [x] T009 Run automated Vitest test suites (Unit & Regression)
- [x] T010 Perform Playwright MCP browser verification in live Super Admin portal and capture screenshot artifact
