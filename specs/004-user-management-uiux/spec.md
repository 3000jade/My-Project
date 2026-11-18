# Feature Specification: Stakeholder UI/UX Experience for User Management

**Feature Branch**: `004-user-management-uiux`  
**Created**: 2026-11-11  
**Status**: Ready  
**Input**: Stakeholder-centered UI/UX requirements for platform user management across Super Administrators, Managing Brokers, Compliance Officers, and Agents.

## Executive Overview
The User Management UI/UX experience establishes an agency-grade, high-trust administrative interface for Human Shelter Realty. Designed for diverse executive and operational stakeholders, it translates complex security boundaries, role-based access control (RBAC), and regulatory real estate compliance (PRC/DHSUD accreditation) into an intuitive, polished workflow adhering strictly to the Modern SaaS design tokens in `DESIGN.md`.

---

## Stakeholder Personas & Value Proposition

| Stakeholder Persona | Key Operational Objectives | Primary UI/UX Pain Points Addressed |
|---|---|---|
| **Super Administrator (Executive)** | Platform-wide oversight, security governance, rapid account intervention, zero downtime. | Cluttered interfaces, accidental self-demotion, sluggish unpaginated tables, lack of operational summary metrics. |
| **Managing Broker (Operations)** | Team roster oversight, agent recruitment status, license compliance monitoring. | Difficulty tracking which agents hold verified PRC/DHSUD credentials, lack of team-level filtering. |
| **Compliance & Legal Auditor** | Regulatory traceability, audit logging, justification tracking for account suspensions. | Opaque administrative actions, missing suspension rationales, lack of exportable audit trails. |
| **Real Estate Agent (Practitioner)** | Clear professional credibility, visible accreditation standing, seamless onboarding. | Ambiguity around accreditation review status, unpolished profile presentation. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executive Summary & Quick Triage (Priority: P1) 🎯 MVP
As a Super Administrator, I need an immediate top-level snapshot of user population and system health so that I can triage pending tasks without digging through table rows.

**Why this priority**: Executives and administrators require situational awareness within seconds of opening the portal.

**Independent Test**: Load `/admin/users`; verify 4 KPI metric cards display accurate counts for Total Accounts, Active Today, Pending Accreditation, and Suspended Accounts.

**Acceptance Scenarios**:
1. **Given** an authenticated administrator loading `/admin/users`, **When** the page renders, **Then** a 4-card metric strip appears showing live aggregations with clean typography and trend indicators.
2. **Given** an administrator clicking the "Pending Accreditation" metric card, **When** clicked, **Then** the table automatically filters to agents awaiting PRC/DHSUD review.

---

### User Story 2 - High-Clarity User Directory & Multi-Dimension Filtering (Priority: P2)
As an administrator or managing broker, I need an accessible, dense, searchable directory with instant multi-facet filters so that I can locate any account in under 3 seconds.

**Why this priority**: Operational efficiency degrades exponentially when searching large customer and agent rosters with basic search boxes.

**Independent Test**: Search by partial name/email and combine with role and status dropdown filters; confirm table updates reactively within 300ms.

**Acceptance Scenarios**:
1. **Given** a user directory with 1,000+ accounts, **When** the administrator types a query into the search field (`⌘K` autofocus), **Then** results filter with debounced server queries without layout jumps.
2. **Given** active filters applied, **When** the user clicks "Clear Filters", **Then** the inputs reset and the directory returns to default pagination.

---

### User Story 3 - Safe Role Elevation & Two-Step Suspension Modal (Priority: P3)
As a compliance officer or administrator, I need high-impact actions (role changes, account suspensions) to require explicit confirmation and documented justification so that platform security is never compromised accidentally.

**Why this priority**: Accidental clicks on destructive actions (e.g. suspending a top-producing broker or demoting an admin) cause immediate operational chaos.

**Independent Test**: Click "Suspend" on an active user; verify a modal appears requesting a suspension reason; confirm cancellation does not alter user state, and confirmation logs the reason.

**Acceptance Scenarios**:
1. **Given** an administrator clicking "Suspend", **When** triggered, **Then** a modal opens with a Coral accent (`#FF6B6B`), displaying target user details and a mandatory text area for "Reason for Suspension".
2. **Given** the active administrator's own row, **When** viewed, **Then** role modification and suspension buttons are visually disabled with a clear `Your account` badge.

---

### User Story 4 - Agent Professional Accreditation Compliance Drawer (Priority: P4)
As a Managing Broker, I need to inspect an agent's PRC license number, validity date, and DHSUD accreditation certificate in a slide-out panel so that I can approve their listing publication privileges.

**Why this priority**: RA 9646 (RESA Law) requires strict compliance verification before brokers allow agents to market properties publicly.

**Independent Test**: Click on an agent's accreditation badge in the table; confirm a slide-out drawer opens displaying license metadata and document preview links.

**Acceptance Scenarios**:
1. **Given** an agent row with a verified PRC license, **When** clicking "View Credentials", **Then** a detail drawer slides in from the right showing license number, expiration date countdown, and issuance details.
2. **Given** an agent with expired or missing credentials, **When** viewed, **Then** the drawer highlights the discrepancy in Amber (`#D97706`) with an option to request updated documents.

---

## Design System & Token Specifications

In strict adherence to `DESIGN.md`, the UI experience MUST enforce:

### 1. Color Palette
- **Primary / Brand**: Teal `#0F766E` (Active buttons, primary tabs, brand accents), `#0D635C` (Hover), `#F0FDFA` (Tint backgrounds).
- **Secondary / Accent**: Coral `#FF6B6B` (Destructive action highlights, urgent suspension warnings).
- **Surfaces**: Canvas `#F8FAFC`, Card Background `#FFFFFF`, Divider `#E2E8F0`.
- **Text & Hierarchy**: Heading `#1E293B` (semibold/bold), Body `#334155` (regular), Subtext/Muted `#64748B`.
- **Status Pills**:
  - `Active / Verified`: Emerald text `#065F46`, background `#ECFDF5`, border `#A7F3D0`.
  - `Suspended`: Red text `#991B1B`, background `#FEF2F2`, border `#FECACA`.
  - `Pending Review`: Amber text `#92400E`, background `#FFFBEB`, border `#FDE68A`.

### 2. Typography & Spatial Cadence
- **Typography Scale**:
  - Page Title: `text-2xl font-bold tracking-tight text-[#1E293B]`
  - Section / Card Header: `text-base font-semibold text-[#1E293B]`
  - Table Content: `text-xs font-medium text-[#334155]`
  - Micro-labels / Badges: `text-[10px] font-semibold tracking-wide uppercase`
  - License Numbers / Hashes: `font-mono text-[11px]`
- **Spatial Rhythm**:
  - Container Padding: `p-6` (24px) for desktop, `p-4` (16px) for mobile.
  - Border Radii: `rounded-xl` (12px) for cards/panels, `rounded-lg` (8px) for buttons/inputs, `rounded-full` for status badges.

---

## Functional Requirements
- **FR-001**: **Executive KPI Strip**: Render 4 top-level aggregated metric cards with responsive flex/grid layout above the directory.
- **FR-002**: **Command-Palette Quick Search**: Search toolbar with `⌘K` keyboard listener, clear trigger, and debounced asynchronous querying.
- **FR-003**: **Multi-Criteria Facet Filtering**: Coordinated dropdown filters for Role (`All`, `Admin`, `Broker`, `Agent`, `Client`) and Status (`All`, `Active`, `Suspended`, `Pending`).
- **FR-004**: **High-Density Responsive Table**: Data table featuring user avatar initials, multi-badge compliance indicator, role selector, and action buttons, transitioning into mobile card views on small screens.
- **FR-005**: **Safe Modal Dialogs**: Two-step modal confirmations for destructive actions (suspensions, role revocations) with required justification logging.
- **FR-006**: **Agent Credential Drawer**: Slide-out detail sheet displaying PRC license details, expiration warnings, and document verification checkpoints.

---

## Success Criteria
- **SC-001**: **Perceived Performance**: Initial user directory and metric card paint completes in `< 400ms`.
- **SC-002**: **Interaction Fluidity**: Debounced search and filter application renders in `< 250ms` without layout shift (CLS `< 0.05`).
- **SC-003**: **Error Prevention**: 100% of destructive operations require explicit two-step confirmation with documented reasons; 0 self-lockouts possible.
- **SC-004**: **Regulatory Completeness**: 100% of licensed agents display verifiable PRC metadata directly within the administrative workflow.
- **SC-005**: **Accessibility & Usability**: Full keyboard navigability (`Tab`, `Escape`, `Enter`) across modals and search bars; color contrast ratios &ge; 4.5:1.
