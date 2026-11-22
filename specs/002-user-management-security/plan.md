# Technical Plan: User Management Security Hardening & Admin Enhancements

**Feature Branch**: `002-user-management-security`  
**Created**: 2026-11-11  
**Status**: Ready  
**Input**: `specs/002-user-management-security/spec.md`

## Architecture & Technology Stack
- **Database**: PostgreSQL on Supabase, PL/pgSQL triggers (`handle_new_user`), Row Level Security policies.
- **Backend**: Node.js / Express / TypeScript (`AdminController`, `auth.middleware`).
- **Frontend**: React 18, Tailwind CSS (Modern SaaS tokens per `DESIGN.md`), `@tabler/icons-react`.
- **Testing**: Vitest, React Testing Library, Playwright MCP.

---

## Technical Design & Endpoints

### 1. Database Layer
- Script: `backend/src/models/fix_handle_new_user_trigger_migration.sql`
- Replace `COALESCE(NEW.raw_user_meta_data->>'role', 'agent')` with static `'client'`.
- Ensure `ON CONFLICT (id) DO UPDATE` never overwrites existing `role` from metadata.

### 2. Backend Controller Layer
- File: `backend/src/controllers/admin.controller.ts`
- In `updateUserRole`: Guard `if (req.user?.id === id) return res.status(403)`
- In `updateUserStatus`: Guard `if (req.user?.id === id) return res.status(403)`
- In `listUsers`: Parse `page`, `limit`, `search`, `role` query parameters. Apply `.range(from, to)`.

### 3. Frontend Component Layer
- File: `frontend/src/components/auth/RolePermissionEditor.jsx`
- Retrieve current user ID via local auth context / stored user.
- Render `(Your account)` indicator for self row; disable `<select>` and status `<button>`.
- Add pagination bar (`<button Previous>`, page indicators, `<button Next>`).
- Render PRC badge for `role === 'agent'`.

---

## Technical Constraints & Quality Gates
- **Constitution Compliance**: Principle VI (Strict least privilege, dual-layer enforcement, audit logging).
- **Design System**: Strict adherence to `DESIGN.md` tokens (`#0F766E`, `#1E293B`, `#64748B`, `#F1F5F9`, `rounded-lg`).
