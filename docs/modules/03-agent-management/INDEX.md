---
module: 03-agent-management
title: Agent Management Module
last_updated: 2026-10-28
total_documents: 13
---

# Agent Management Module — Master Index

> **Directory:** `docs/modules/03-agent-management/`  
> **Scope:** Agent rosters, PRC/DHSUD licensing verification, onboarding workflows, availability schedules, calendar integration, responsibility transfers, and Sales Agent operational portals.  
> **Core Ownership:** AgentController, AgentService, AgentEligibilityService, AvailabilitySchedules, and Sales Agent Portal.

---

## 1. Document Registry & Change History

All updates and technical reports for this module are ordered chronologically by ISO date (`YYYY-MM-DD`):

| Date | Document File | Description |
| :--- | :--- | :--- |
| `2026-10-14` | [2026-10-14-agent-management-implementation-plan.md](./2026-10-14-agent-management-implementation-plan.md) | Agent Management Implementation Plan |
| `2026-10-14` | [2026-10-14-agent-management-module-spec.md](./2026-10-14-agent-management-module-spec.md) | Agent Management Module Spec |
| `2026-10-14` | [2026-10-14-agent-management-module-verification-report.md](./2026-10-14-agent-management-module-verification-report.md) | Agent Management Module Verification Report |
| `2026-10-14` | [2026-10-14-agent-management-overview.md](./2026-10-14-agent-management-overview.md) | Agent Management Overview |
| `2026-10-16` | [2026-10-16-broker-agent-management-data-verification.md](./2026-10-16-broker-agent-management-data-verification.md) | Broker Agent Management Data Verification |
| `2026-10-21` | [2026-10-21-agent-management-technical-reference.md](./2026-10-21-agent-management-technical-reference.md) | Agent Management Technical Reference |
| `2026-10-21` | [2026-10-21-appointment-calendar-integration-verification-report.md](./2026-10-21-appointment-calendar-integration-verification-report.md) | Appointment Calendar Integration Verification Report |
| `2026-10-21` | [2026-10-21-appointment-calendar-interface-spec.md](./2026-10-21-appointment-calendar-interface-spec.md) | Appointment Calendar Interface Spec |
| `2026-10-21` | [2026-10-21-calendar-appointments-scheduling-reference.md](./2026-10-21-calendar-appointments-scheduling-reference.md) | Calendar Appointments Scheduling Reference |
| `2026-10-27` | [2026-10-27-sales-agent-portal-and-workflows-spec.md](./2026-10-27-sales-agent-portal-and-workflows-spec.md) | Human Sales Agent Portal & Workflows Specification |
| `2026-10-27` | [2026-10-27-sales-agent-portal-implementation-report.md](./2026-10-27-sales-agent-portal-implementation-report.md) | Sales Agent Portal & Deal Pipeline Implementation Report |
| `2026-10-27` | [2026-10-27-agent-portal-playwright-e2e-report.md](./2026-10-27-agent-portal-playwright-e2e-report.md) | Sales Agent Portal Playwright MCP E2E Verification Report |
| `2026-10-28` | [2026-10-28-property-input-and-agent-assignment-scope-redefinition.md](../02-property-listing/2026-10-28-property-input-and-agent-assignment-scope-redefinition.md) | Scope and Limitation Redefinition — Moving Property Assignment to Agent Management |
| `2026-10-28` | [2026-10-28-decouple-property-agent-assignment-verification.md](../02-property-listing/2026-10-28-decouple-property-agent-assignment-verification.md) | Verification Record — Decoupled Property Listings & Agent Assignment |

---

## 2. Instructions for AI Agents & Developers

When making modifications or adding new features to **Agent Management Module**:

1. **Before Action (Read Phase):**
   - Review this `INDEX.md` and the latest dated document listed above.
   - Strictly follow the `INSPECT -> ANALYZE -> PROPOSE -> APPROVAL GATE -> IMPLEMENT -> VERIFY` workflow defined in `AGENTS.md`.

2. **After Action (Document Phase):**
   - Record the changes by creating a new document in this folder named:
     `YYYY-MM-DD-[concise-action-description].md`
   - Include standard YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Add a new row to the Document Registry table in this `INDEX.md`.
