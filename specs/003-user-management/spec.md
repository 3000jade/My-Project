# Feature Specification: Comprehensive User Management Module

**Feature Branch**: `003-user-management`  
**Created**: 2026-11-11  
**Status**: Ready  
**Input**: Comprehensive User Management Module for Human Shelter Realty (Admin, Broker, Agent, and Client lifecycle, RBAC, accreditation verification, and session control).

## Executive Overview
The User Management Module provides complete administrative control over platform identity, role-based access control (RBAC), agent professional accreditation verification (PRC/DHSUD), and concurrent active session monitoring for Human Shelter Realty. Built to enforce **Constitution Principle VI (User Management & Privilege Isolation)**, it ensures strict separation between public clients, accredited agents, managing brokers, and system administrators while providing real-time security auditing.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role Assignment & Privilege Enforcement (Priority: P1) 🎯 MVP
As a Super Administrator, I need to review registered platform users, view their authority level, and modify their role (`client`, `agent`, `broker`, `admin`) so that users have the exact permissions required for their platform responsibilities.

**Why this priority**: Correct access boundaries are the bedrock of platform security; agents and brokers must not access administrative tools, and clients must not publish listings.

**Independent Test**: Can be verified by updating an account's role in the admin portal and confirming immediate permission elevation or restriction across protected routes without page reloads.

**Acceptance Scenarios**:
1. **Given** an authenticated Super Administrator in `/admin/users`, **When** they select a new role for a target user and confirm, **Then** the database updates `profiles.role`, clears the cached auth session, and emits an `admin.user_role_updated` audit log.
2. **Given** a Super Administrator viewing their own account row, **When** reviewing available actions, **Then** role modification is disabled to prevent accidental administrative self-lockout.

---

### User Story 2 - Account Suspension & Security Kill Switch (Priority: P2)
As a Super Administrator, I need to suspend compromised or delinquent accounts and terminate their active sessions instantly so that unauthorized actions are stopped immediately.

**Why this priority**: Rapid containment of security incidents or unethical broker/agent conduct is essential for platform integrity and client trust.

**Independent Test**: Suspend an active user from the admin console and verify that their ongoing requests in other browsers/devices are rejected immediately with HTTP 401 Unauthorized.

**Acceptance Scenarios**:
1. **Given** an active user account, **When** the administrator clicks "Suspend", **Then** the user's `verification_status` transitions to `SUSPENDED`, `SessionService.disableUserAccount` revokes all active session tokens, and subsequent API requests from that user are blocked.
2. **Given** a suspended user account, **When** the administrator clicks "Activate", **Then** the user account status returns to `VERIFIED` and they are permitted to log in again.
3. **Given** an administrator attempts to suspend their own account, **Then** the action is blocked with HTTP 403 Forbidden.

---

### User Story 3 - Agent Professional Accreditation Review (Priority: P3)
As a Managing Broker or Super Administrator, I need to inspect real estate agents' Professional Regulation Commission (PRC) licenses and DHSUD accreditation numbers so that only legally compliant practitioners represent listings.

**Why this priority**: Philippine real estate law (RA 9646 Real Estate Service Act) mandates valid PRC licensing and DHSUD accreditation for practicing real estate consultants and agents.

**Independent Test**: Filter the user directory by `role=agent`, view the agent's PRC license number and expiration status, and review attached credential documents.

**Acceptance Scenarios**:
1. **Given** an agent registered with a PRC license, **When** viewed in the user directory, **Then** their PRC license badge (e.g. `PRC #0098765`) is visibly displayed.
2. **Given** an agent with missing or expired accreditation, **When** viewed in the directory, **Then** an `Unregistered` or `Pending Review` compliance alert is displayed.

---

### User Story 4 - Multi-Device Session Inspection & Revocation (Priority: P4)
As an administrator or security officer, I need to view all active browser/device sessions across the platform and revoke specific anomalous sessions without suspending the user's overall profile.

**Why this priority**: Allows targeted mitigation of lost devices, compromised tokens, or concurrent session abuse without requiring complete account termination.

**Independent Test**: Navigate to the "Active Sessions" tab in `/admin/users`, select an individual device session, and click "Revoke Session". Confirm only that specific device is logged out.

**Acceptance Scenarios**:
1. **Given** multiple active logins for a user across mobile and desktop, **When** an administrator revokes a specific session by token hash, **Then** that device receives an immediate session expiration redirect while other devices remain logged in.
2. **Given** an administrator using the global "Revoke All Sessions" command, **Then** all active tokens except the current admin session are cleared.

---

## Functional Requirements
- **FR-001**: **Unified User Directory**: Provide a paginated, searchable, and role-filterable directory of all platform profiles (`GET /api/admin/users`).
- **FR-002**: **Strict Role State Machine**: Enforce transition validation across the 4 valid roles (`client`, `agent`, `broker`, `admin`) with self-lockout prevention.
- **FR-003**: **Instant Suspension & Invalidation**: Account suspension MUST trigger immediate revocation of all associated token hashes in `SessionService` and clear cache entries.
- **FR-004**: **Accreditation Badging**: Surface PRC license numbers and DHSUD registration status directly in the user management table for agent rows.
- **FR-005**: **Server-Side Session Inspector**: Provide a dedicated UI panel displaying IP address, user agent/device, last activity timestamp, and remaining idle TTL for all live sessions.
- **FR-006**: **Immutable Audit Logging**: Every role alteration, suspension, activation, and session revocation MUST record an audit entry with actor ID, target ID, prior values, and timestamp via `AuditService`.

---

## Key Entities
- **Profile (`public.profiles`)**: Represents platform user metadata (id, email, full_name, avatar_url, role, verification_status, prc_license_no, prc_validity, dhsud_accreditation_no).
- **Session Record (`SessionService` / `user_sessions`)**: Server-side token hash, user_id, device footprint, ip_address, created_at, last_active_at, expires_at.
- **Audit Event (`public.audit_events`)**: event_type, actor_id, target_id, target_type, outcome, previous_values, new_values, timestamp.

---

## Success Criteria
- **SC-001**: Role update latency is under 500ms and reflected across all portal views on subsequent requests.
- **SC-002**: Revoked or suspended sessions are blocked on their next API interaction within 1 request cycle (0 residual access).
- **SC-003**: User directory queries execute with bounded range queries (`limit <= 100`) to guarantee stable $O(1)$ response times under large datasets.
- **SC-004**: 100% compliance with Philippine PRC real estate identification standards in the agent directory view.
- **SC-005**: Zero accidental administrative self-lockouts permitted by the API or UI.
