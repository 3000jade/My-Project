# Data Management Module — Context Principles & Specification

**Module ID**: `data-management`  
**Status**: Active  
**Last Updated**: 2026-11-21  

---

## 1. Overview & Business Context

The Data Management module is the **shared control center** for managing business data safely across the CP_kerby platform. It follows a **"Hub & Spoke" ("One Shared Rulebook, Separate Tools")** architecture:

- **Hub (Shared Rulebook):** Enforces role boundaries, dry-run previews, reversible archiving, and automatic audit receipts.
- **Spoke 1 — Site Content:** Reuses the existing CMS service (`cms.service.ts`) for banners, FAQs, pages, and featured collections.
- **Spoke 2 — Bulk Import & Scoped Export:** Lets authorized users preview CSV/JSON uploads before saving and export scoped records.
- **Spoke 3 — Archive, Restore & Snapshot Backups:** Lets Admins check data health, archive or restore stale records, and download JSON snapshots.

### Target Actors
- **Admin (`admin`):** Full access to all three spokes.
- **Broker (`broker`):** Access to Bulk Import/Export scoped strictly to their own records (`broker_id = user.id`). Blocked from system-wide health, archive/restore, and snapshot backups.
- **Agent (`agent`) & Client (`client`):** No access (enforced by `requireRole(['admin', 'broker'])`).

---

## 2. Core Context Principles

1. **One Source of Truth:** Live business records stay in the database (Supabase). The browser only holds temporary scratchpad state while previewing an import or editing a form.
2. **Preview Before Saving (Dry-Run Gate):** Bulk imports always run through `/api/data-management/import/preview` first to show valid vs. invalid rows before `/import/commit` writes anything.
3. **Archive, Don't Erase:** Cleanup actions mark records as `ARCHIVED` (reversible via `/restore`) instead of permanently deleting them.
4. **Clear Role Boundaries:** Every endpoint checks role and ownership scope before reading or mutating data.
5. **Every Action Leaves a Receipt:** Every commit, export, archive, restore, and snapshot logs an event via `AuditService.recordEvent(...)`, which automatically strips sensitive fields.

---

## 3. Interfaces & Contracts

| Method | Endpoint | Allowed Roles | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/data-management/import/preview` | `admin`, `broker` | Validate import rows without writing to DB |
| `POST` | `/api/data-management/import/commit` | `admin`, `broker` | Save validated rows (scoped) + log audit receipt |
| `GET` | `/api/data-management/export/:resource` | `admin`, `broker` | Export `properties`, `inquiries`, or `sales` (`json` or `csv`) |
| `GET` | `/api/data-management/health` | `admin` | Summarize active vs. archived/stale record counts |
| `POST` | `/api/data-management/archive` | `admin` | Soft-archive a record (`status = 'ARCHIVED'`) |
| `POST` | `/api/data-management/restore` | `admin` | Restore an archived record (`status = 'ACTIVE'`) |
| `GET` | `/api/data-management/backup/export` | `admin` | Download JSON snapshot of core tables |

---

## 4. Known Limits & Shortcuts

- `shortcut:` Backups are on-demand JSON snapshots rather than scheduled background jobs; upgrade to a scheduled worker if dataset size exceeds single-request memory limits.
- `shortcut:` Archive/restore updates `status` in-place; if a table lacks an `archived_at` column, add a migration before tracking archive timestamps in SQL.
