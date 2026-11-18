# Technical Research: User Management Architecture

**Feature**: `003-user-management`  
**Date**: 2026-11-11

## 1. Identity & Auth Architecture
- **Supabase GoTrue (Postgres Auth)**: Handles registration, email confirmations, password reset, and bcrypt password hashing (cost factor 10).
- **Express Backend Middleware**:
  - `requireAuth`: Verifies bearer JWT via Supabase client, queries authoritative `profiles` row from Postgres using `supabaseAdmin`, validates session token against server-side `SessionService` (tracking idle and absolute expirations), and caches user profile for 30s (`AUTH_CACHE_TTL_MS`).
  - `requireRole(['admin', ...])`: Role-based route guard; blocks unprivileged roles with 403 Forbidden.

## 2. Row Level Security & Database Trigger Safeguards
- **Trigger `handle_new_user()`**:
  - Hardened to strictly insert `role = 'client'` and `verification_status = 'VERIFIED'`.
  - Disallows elevated role injection via `raw_user_meta_data`.
- **Trigger `prevent_profile_privilege_escalation()`**:
  - Stops non-admin callers from modifying `role` or `verification_status` directly via PostgREST.

## 3. Server-Side Session Tracking & Kill Switch
- **`SessionService`**:
  - In-memory cache + persistent JSON session store (`data/sessions.json` or `user_sessions` table).
  - Uses SHA-256 digest of token: `crypto.createHash('sha256').update(token).digest('hex')`.
  - Invalidation: `disableUserAccount(userId)` immediately marks all tokens associated with the user as invalid.

## 4. Administrative User Interface
- **Super Admin Portal (`/admin/users`)**:
  - Header: Role management and session tab switcher.
  - Tab 1: `RolePermissionEditor.jsx` (Server-side pagination, search debounce, role dropdown, suspension toggle, PRC accreditation badges, self-account protection).
  - Tab 2: `SessionManagementPanel.jsx` (Live device sessions, token hashes, idle time, IP addresses, kill switch).
