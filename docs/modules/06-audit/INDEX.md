---
module: 06-audit
title: Audit Module
last_updated: 2026-10-28
total_documents: 2
---

# Audit Module — Master Index

> **Directory:** `docs/modules/06-audit/`  
> **Scope:** Administrative event logging, immutable agent action logs, session security events, property change diffs, and inquiry audit trails.  
> **Core Ownership:** AuditService, AuditController, and Security Audit Middleware.

---

## 1. Document Registry & Change History

All updates and technical reports for this module are ordered chronologically by ISO date (`YYYY-MM-DD`):

| Date | Document File | Description |
| :--- | :--- | :--- |
| `2026-10-28` | [2026-10-28-audit-module-spec.md](./2026-10-28-audit-module-spec.md) | **Module Specification:** Full ISO/IEC 29148, 42010, and 25010 aligned specification for Audit Trail & Security Logging (`FR-AU-001` through `FR-AU-008`). |
| `2026-10-21` | [2026-10-21-communication-notification-audit-session-handling.md](./2026-10-21-communication-notification-audit-session-handling.md) | Communication Notification Audit Session Handling |

---

## 2. Instructions for AI Agents & Developers

When making modifications or adding new features to **Audit Module**:

1. **Before Action (Read Phase):**
   - Review this `INDEX.md` and the latest dated document listed above.
   - Strictly follow the `INSPECT -> ANALYZE -> PROPOSE -> APPROVAL GATE -> IMPLEMENT -> VERIFY` workflow defined in `AGENTS.md`.

2. **After Action (Document Phase):**
   - Record the changes by creating a new document in this folder named:
     `YYYY-MM-DD-[concise-action-description].md`
   - Include standard YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Add a new row to the Document Registry table in this `INDEX.md`.
