---
module: 04-sales-and-reports
title: Sales and Report Module
last_updated: 2026-10-27
total_documents: 1
---

# Sales and Report Module — Master Index

> **Directory:** `docs/modules/04-sales-and-reports/`  
> **Scope:** Sales transaction logging, commission tiers, revenue analytics, and broker performance reporting.  
> **Core Ownership:** SalesController, CommissionCalculationService, and Analytics Views.

---

## 1. Document Registry & Change History

All updates and technical reports for this module are ordered chronologically by ISO date (`YYYY-MM-DD`):

| Date | Document File | Description |
| :--- | :--- | :--- |
| `2026-10-21` | [2026-10-21-sales-and-reports-technical-reference.md](./2026-10-21-sales-and-reports-technical-reference.md) | Sales And Reports Technical Reference |

---

## 2. Instructions for AI Agents & Developers

When making modifications or adding new features to **Sales and Report Module**:

1. **Before Action (Read Phase):**
   - Review this `INDEX.md` and the latest dated document listed above.
   - Strictly follow the `INSPECT -> ANALYZE -> PROPOSE -> APPROVAL GATE -> IMPLEMENT -> VERIFY` workflow defined in `AGENTS.md`.

2. **After Action (Document Phase):**
   - Record the changes by creating a new document in this folder named:
     `YYYY-MM-DD-[concise-action-description].md`
   - Include standard YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Add a new row to the Document Registry table in this `INDEX.md`.
