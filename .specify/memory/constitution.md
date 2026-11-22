<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0 (MINOR: Added Principle VI on User Management, RBAC & Privilege Isolation)
- List of modified principles: None (Principles I-V preserved and refined)
- Added sections: Principle VI (User Management & Privilege Isolation)
- Removed sections: None
- Follow-up TODOs: None
-->

# Human Shelter Realty - Spec Kit Constitution

## Core Principles

### I. Strict Design System & Token Adherence (NON-NEGOTIABLE)
All frontend UI components, typography, colors, border radii, and spacing scales must strictly adhere to `DESIGN.md`. Arbitrary hex values, custom utility classes, and improvised design tokens are strictly prohibited.

### II. Authentication & Security
- Passwords must be hashed and verified via Supabase Auth (GoTrue `bcrypt` cost factor 10). Plaintext passwords must never be stored in custom tables or logs.
- Sensitive environment variables must remain in `.env` and never be committed to Git.
- Session tokens must use SHA-256 digests in session caches and support active revocation via server-side session stores.

### III. Test-Driven Verification (Evidence Before Assertions)
- Every bug fix and feature requires automated test coverage (Vitest for React components and units, Playwright for interactive visual states).
- Changes must pass all automated test suites prior to completion.

### IV. Senior Dev Simplicity (Ponytail & YAGNI)
- The best code is the code never written. Build the smallest complete solution that fully solves the problem.
- No unnecessary abstractions, wrappers, or speculative features.

### V. Specification-First Workflow
- Features and architectural shifts must begin with a clear specification (`spec.md`) and technical plan (`plan.md`) before code is written.

### VI. User Management & Privilege Isolation (RBAC & Least Privilege)
- Role Hierarchy: Supported roles are strictly scoped to `admin`, `broker`, `agent`, and `client`.
- Default-to-Lowest-Privilege: Public self-registration MUST default to the `client` role. Elevated roles (`agent`, `broker`, `admin`) MUST NOT be selectable or injectible via public registration payloads or auth metadata.
- Closed Agent Onboarding: Agents and Brokers MUST only enter elevated roles via verified invitation tokens (`agent_invitations`) or explicit administrative promotion.
- Dual-Layer RBAC Enforcement: Access control MUST be enforced at both the API routing layer (`requireRole` middleware) and the database persistence layer (PostgreSQL Row Level Security & trigger guards).
- Audit Logging: Any role modification, account suspension, or session kill switch execution MUST emit an immutable audit event via `AuditService`.

## Governance
This Constitution defines the foundational boundaries for all AI coding agents and human contributors working on Human Shelter Realty.
Amendments require documentation, semantic versioning increments, and verification against existing architectural patterns.

**Version**: 1.1.0 | **Ratified**: 2026-11-11 | **Last Amended**: 2026-11-11
