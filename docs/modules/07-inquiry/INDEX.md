---
module: 07-inquiry
title: Inquiry Module
last_updated: 2026-10-27
total_documents: 3
---

# Inquiry Module — Master Index

> **Directory:** `docs/modules/07-inquiry/`  
> **Scope:** Client lead capture, inquiry triage pipelines, broker assignment, and tour request processing.  
> **Core Ownership:** InquiryController, InquiryService, and Client Inquiry Modals.

---

## 1. Document Registry & Change History

All updates and technical reports for this module are ordered chronologically by ISO date (`YYYY-MM-DD`):

| Date | Document File | Description |
| :--- | :--- | :--- |
| `2026-10-06` | [2026-10-06-inquiry-management-verification-report.md](./2026-10-06-inquiry-management-verification-report.md) | Inquiry Management Verification Report |
| `2026-10-06` | [2026-10-06-inquiry-module-spec.md](./2026-10-06-inquiry-module-spec.md) | Inquiry Module Spec |
| `2026-10-06` | [2026-10-06-property-listing-inquiry-module.md](./2026-10-06-property-listing-inquiry-module.md) | Property Listing Inquiry Module |

---

## 2. Instructions for AI Agents & Developers

When making modifications or adding new features to **Inquiry Module**:

1. **Before Action (Read Phase):**
   - Review this `INDEX.md` and the latest dated document listed above.
   - Strictly follow the `INSPECT -> ANALYZE -> PROPOSE -> APPROVAL GATE -> IMPLEMENT -> VERIFY` workflow defined in `AGENTS.md`.

2. **After Action (Document Phase):**
   - Record the changes by creating a new document in this folder named:
     `YYYY-MM-DD-[concise-action-description].md`
   - Include standard YAML frontmatter (`module`, `date`, `status`, `affected_files`).
   - Add a new row to the Document Registry table in this `INDEX.md`.
