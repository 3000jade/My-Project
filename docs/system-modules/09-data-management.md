# Data Management Module — Admin Backup Specification

**Module ID**: `data-management`  
**Status**: Active (Admin Backup Slice)  
**Last Updated**: 2026-11-22  

---

## 1. Overview & Business Context

The Data Management module provides **Admin-only system backups** for the CP_kerby platform. It lets an Admin check record counts across core tables and download a complete JSON snapshot before major changes or for offline safekeeping.

### Target Actors
- **Admin (`admin`):** Full access to view backup summaries and download snapshots.
- **Broker, Agent, Client:** No access (blocked at the API gate by `requireRole(['admin'])`).

---

## 2. Core Context Principles

1. **Admin-Only Access:** Backup snapshots contain company-wide business records, so every endpoint is locked to `admin`.
2. **Every Backup Leaves a Receipt:** Downloading a snapshot logs an entry via `AuditService.recordEvent(...)`.

---

## 3. Interfaces & Contracts

| Method | Endpoint | Allowed Roles | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/data-management/backup/summary` | `admin` | Return record counts per core table (`properties`, `inquiries`, `sales`) |
| `GET` | `/api/data-management/backup/export` | `admin` | Download a full JSON backup snapshot and record an audit receipt |

---

## 4. Known Limits & Shortcuts

- `shortcut:` Backups are on-demand JSON snapshots rather than scheduled background jobs; upgrade to a scheduled worker if dataset size exceeds single-request memory limits.
