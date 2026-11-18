# Feature Specification: User Management Security Hardening & Admin Enhancements

**Feature Branch**: `002-user-management-security`  
**Created**: 2026-11-11  
**Status**: Ready  
**Input**: User management security audit, privilege escalation prevention, self-lockout guard, pagination, and PRC accreditation badging.

## Purpose & Overview
Enforce Constitution Principle VI (User Management & Privilege Isolation) by hardening the user registration trigger against privilege escalation, preventing administrative self-lockout in role management, providing server-side pagination for user listings, and surfacing agent accreditation details directly in the Super Admin interface.

---

## Functional Requirements
- **FR-001**: Self-service user registrations MUST strictly default to the `client` role in PostgreSQL, ignoring any client-supplied metadata role attempts.
- **FR-002**: The administrative API (`AdminController`) MUST reject any role change or account suspension requests targeting the authenticated administrator's own account with HTTP 403 Forbidden.
- **FR-003**: The admin user list endpoint (`GET /api/admin/users`) MUST support pagination (`page`, `limit`), search query, and role filtering.
- **FR-004**: The Super Admin `RolePermissionEditor` UI MUST disable role alteration and suspension controls for the logged-in administrator, render pagination controls, and display PRC accreditation status for agents.

---

## User Scenarios & Testing

### User Story 1 - Privilege Escalation Guard (Priority: P1) 🎯 MVP
As a platform security administrator, I want direct user signups to only create `client` accounts so that malicious users cannot grant themselves `agent`, `broker`, or `admin` access.

**Acceptance Scenarios**:
1. **Given** a new user signs up with arbitrary `raw_user_meta_data->>'role' = 'admin'`, **When** the `handle_new_user()` trigger runs, **Then** `public.profiles.role` MUST be `'client'`.
2. **Given** an existing user profile with an elevated role, **When** metadata updates occur on auth.users, **Then** the trigger MUST preserve the existing role.

### User Story 2 - Admin Self-Lockout Prevention (Priority: P2)
As a Super Administrator, I want the system to prevent me from accidentally demoting or suspending my own account so that administrative access to the platform is never accidentally severed.

**Acceptance Scenarios**:
1. **Given** an administrator attempts to change their own role via `PATCH /api/admin/users/:ownId/role`, **When** the request is received, **Then** the server responds with 403 Forbidden.
2. **Given** an administrator attempts to suspend their own account via `PATCH /api/admin/users/:ownId/status`, **When** the request is received, **Then** the server responds with 403 Forbidden.
3. **Given** an administrator views the users table, **Then** their own row displays `(Your account)` and controls are disabled.

### User Story 3 - Paginated User Directory (Priority: P3)
As an administrator, I want the user list to load in paginated batches so that the system remains fast and responsive as the user base expands.

**Acceptance Scenarios**:
1. **Given** a request to `GET /api/admin/users?page=1&limit=10`, **When** executed, **Then** the response returns the first 10 records and total count.
2. **Given** page navigation buttons in the UI, **When** clicked, **Then** the corresponding page of users is fetched.

### User Story 4 - Agent Accreditation Badging (Priority: P4)
As an administrator or managing broker, I want to clearly see which agents have registered PRC licenses so that compliance status is instantly recognizable.

**Acceptance Scenarios**:
1. **Given** an agent row in the user table, **Then** their PRC license number (or "Unregistered") is rendered as a distinct badge.

---

## Success Criteria
- **SC-001**: 100% of self-service signups result in `role = 'client'`.
- **SC-002**: 0 instances of self-demotion or self-suspension permitted.
- **SC-003**: User list API executes with bounded range queries (`.range(from, to)`).
- **SC-004**: Vitest unit/component tests and Playwright MCP browser checks pass without regressions.
