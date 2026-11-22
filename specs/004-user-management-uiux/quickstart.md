# Quickstart: Stakeholder User Management UI/UX

## Prerequisites
- Node.js v18+
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`

## Running Local Verification
```powershell
# 1. Start application servers (if not already running)
npm --prefix backend run dev
npm --prefix frontend run dev

# 2. Run component tests
npm --prefix frontend test src/components/auth/RolePermissionEditor.test.jsx -- --run
```

## Stakeholder Walkthrough & Visual Checkpoints
1. Log in at `http://localhost:5173/login` using `admin@pt.com` / `adminPassword123!`.
2. Go to `http://localhost:5173/admin/users`.
3. **Executive KPI Strip**: Check that the 4 cards (Total Accounts, Active Today, Pending Accreditation, Suspended) render across the top.
4. **Quick Triage**: Click "Pending Accreditation" or "Suspended" to test interactive filter linkage.
5. **Search & Hotkeys**: Press `⌘K` or `Ctrl+K` to jump to search. Type an agent's name.
6. **Self-Account Guard**: Observe the admin's own row displays `Your account` and has disabled role/suspension buttons.
7. **Two-Step Modal**: Click "Suspend" on an active test account; verify modal prompts for a mandatory reason.
8. **Credential Drawer**: Click on an agent's PRC badge; verify the credential review sheet opens.
