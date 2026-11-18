# Quickstart: User Management Module

## Prerequisites
- Node.js v18+
- PostgreSQL / Supabase project configured with `auth.users` and `public.profiles`
- Active environment variables in `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)

## Starting the Application
```powershell
# 1. Start the Express API Backend
npm --prefix backend run dev

# 2. Start the Vite Frontend Dev Server
npm --prefix frontend run dev
```

## Running User Management Tests
```powershell
# Run RolePermissionEditor component test suite
npm --prefix frontend test src/components/auth/RolePermissionEditor.test.jsx -- --run
```

## Navigating to the Admin Portal
1. Open browser to `http://localhost:5173/login`.
2. Sign in as `admin@pt.com` / `adminPassword123!`.
3. Navigate to `http://localhost:5173/admin/users`.
4. Switch between **Users & Roles** and **Active Sessions** to audit platform authority.
