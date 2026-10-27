---
module: 01-user-management
date: 2026-10-27
status: complete
affected_files:
  - frontend/src/components/auth/SessionWatcher.jsx
  - frontend/src/pages/auth/LoginPage.jsx
  - frontend/src/components/auth/SessionWatcher.test.jsx
  - frontend/src/pages/auth/LoginPage.test.jsx
---

# User Management Module: Session Timeout Re-Login Defect & Remediation Report

> **Module Identifier:** `01-user-management` / `auth-rbac`  
> **Date:** October 27, 2026  
> **Status:** Complete — Verified Locally  
> **Classification:** Bug Fix & Inactivity Lifecycle Hardening  

---

## 1. Problem Statement & Symptoms

Users reported that following an idle session timeout, attempting to log in again on the same page failed or immediately logged them back out.

### Root Cause Analysis

1. **Unreset Inactivity Ref in Mounted `SessionWatcher` Instance**:
   - `SessionWatcher` is mounted continuously inside `<AuthProvider>` in `frontend/src/App.jsx`.
   - It tracked idle duration using a React ref: `const lastActivityRef = useRef(Date.now())`.
   - When idle time exceeded policy limits (30 minutes for staff: `admin`, `broker`, `agent`; 60 minutes for `client`), `checkTimeout` invoked `logout()`, clearing tokens and updating `user` to `null`.
   - React Router redirected to `/login?returnUrl=...`. Because this was client-side SPA navigation, `SessionWatcher` remained mounted in the React component tree.
   - While `user` was `null`, window activity event listeners were unmounted (`if (!user) return`), leaving `lastActivityRef.current` holding the stale timestamp from 30+ minutes prior.
   - Upon entering credentials and submitting the login form on the page, `loginWithCredentials` succeeded, populating `user` in `AuthContext`.
   - Because `SessionWatcher` was already mounted, React re-rendered it with the new `user`, but `lastActivityRef.current` was never reset. On the subsequent 1000ms countdown interval, `elapsedSeconds` calculated as $> 1800$s (`remainingSeconds <= 0`), immediately triggering `logout()` within 1 second and ejecting the user back to `/login`.

2. **Absence of Re-Entrant Logout Guard**:
   - `checkTimeout` lacked an active `isLoggingOutRef` lock. While awaiting asynchronous logout operations, `checkTimeout` could trigger duplicate `logout()` invocations on every interval tick.

3. **Email Substring Matching vs. Authoritative API Role Clearance**:
   - `LoginPage.jsx` contained a legacy helper `completeAuthRedirect(targetEmail)` that performed string matching: `targetEmail.toLowerCase().includes('agent')`.
   - Legitimate broker or agent accounts with standard email addresses (e.g., `user@gmail.com`) failed all substring checks and defaulted to `/client/dashboard`.
   - Upon landing on `/client/dashboard`, `AuthGuard` rejected the non-client user with a 403 `Access Restricted` redirect to `/unauthorized`.
   - Furthermore, `returnUrl` parameters preserved by `AuthGuard` during timeout were ignored upon re-authenticating.

---

## 2. Technical Remediation & Implementation

### 2.1 SessionWatcher Inactivity Reset (`frontend/src/components/auth/SessionWatcher.jsx`)

- **User Transition Watcher**:
  Introduced `prevUserRef` and a transition effect:
  ```javascript
  const lastActivityRef = useRef(Date.now());
  const isExtendingRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const prevUserRef = useRef(user);

  useEffect(() => {
    if (user && (!prevUserRef.current || prevUserRef.current.id !== user.id)) {
      lastActivityRef.current = Date.now();
      isLoggingOutRef.current = false;
      setIsModalOpen(false);
      setSecondsRemaining(warningWindowSeconds);
    } else if (!user && prevUserRef.current) {
      lastActivityRef.current = Date.now();
      isLoggingOutRef.current = false;
      setIsModalOpen(false);
    }
    prevUserRef.current = user;
  }, [user, warningWindowSeconds]);
  ```
  Whenever a user logs in, logs out, or switches accounts, `lastActivityRef.current` is reset to `Date.now()`, clearing stale timers and dismissing any warning modal.

- **Re-Entrant Logout Guard**:
  Added `isLoggingOutRef` check in `checkTimeout`, `handleExtendSession`, and `handleLogoutNow`:
  ```javascript
  if (isLoggingOutRef.current) return;
  // ...
  if (remainingSeconds <= 0) {
    isLoggingOutRef.current = true;
    setIsModalOpen(false);
    logout();
  }
  ```

- **Cross-Tab Event Handling**:
  Extended `sessionCoordinator.subscribeSessionEvents` to reset `lastActivityRef.current = Date.now()` and clear modal state upon receiving `LOGOUT` or `ROLE_REVOKED` broadcasts.

### 2.2 Role-Based Routing & Return-URL Restoration (`frontend/src/pages/auth/LoginPage.jsx`)

- **Authoritative Role Inspection**:
  Updated `handleLogin` to pass the authenticated `authData.user.role` directly to `completeAuthRedirect`:
  ```javascript
  const authData = await login(identifier, password, rememberMe);
  setFailedAttempts(0);
  const role = authData?.user?.role;
  completeAuthRedirect(role, identifier);
  ```

- **Safe Return URL Handling**:
  Integrated `sessionCoordinator.validateReturnTo` to sanitize incoming `returnUrl` query parameters or router state and confirm role authorization:
  ```javascript
  const completeAuthRedirect = (role, targetEmail) => {
    const rawSearch = location.search || (typeof window !== 'undefined' ? window.location.search : '');
    const searchParams = new URLSearchParams(rawSearch);
    const returnUrlParam = searchParams.get('returnUrl') || location.state?.from?.pathname;
    const validReturn = returnUrlParam
      ? sessionCoordinator.validateReturnTo(decodeURIComponent(returnUrlParam))
      : null;

    const userRole =
      role ||
      (targetEmail?.toLowerCase().includes('agent')
        ? 'agent'
        : targetEmail?.toLowerCase().includes('broker')
        ? 'broker'
        : targetEmail?.toLowerCase().includes('admin')
        ? 'admin'
        : 'client');

    if (validReturn && validReturn !== '/' && validReturn !== '/login') {
      const isRoleAllowed =
        userRole === 'admin' ||
        (userRole === 'agent' && validReturn.startsWith('/agent')) ||
        (userRole === 'broker' && (validReturn.startsWith('/broker') || validReturn.startsWith('/agent'))) ||
        (userRole === 'client' && validReturn.startsWith('/client'));

      if (isRoleAllowed) {
        navigate(validReturn);
        return;
      }
    }

    if (userRole === 'agent') {
      navigate('/agent/dashboard');
    } else if (userRole === 'broker' || userRole === 'admin') {
      navigate('/broker/dashboard');
    } else {
      navigate('/client/dashboard');
    }
  };
  ```

---

## 3. Verification & Evidence

### 3.1 Unit Testing

1. **`SessionWatcher.test.jsx`**:
   - Added automated reproduction test verifying that fast-forwarding 1801 seconds triggers idle timeout, user transitions to `null`, user re-authenticates on the same component instance, and the timer is refreshed with no second `logout()` invocation.
   - Result: **3/3 PASS**.

2. **`LoginPage.test.jsx`**:
   - Added test ensuring standard email addresses without role tokens (e.g., `custom.user@realestate.ph`) navigate accurately to their role dashboard based on API response data.
   - Added test verifying permitted `returnUrl` parameters (e.g., `?returnUrl=%2Fbroker%2Freports`) are preserved and navigated to upon successful login.
   - Result: **6/6 PASS**.

3. **Master Auth Suite**:
   - Executed all 11 test suites across `test files/frontend/auth` and `frontend/src/services/authService.test.js`.
   - Result: **23/23 tests PASS**.

4. **Backend Integration**:
   - Executed `auth.controller.test.ts` and `auth-gap-remediation.test.ts`.
   - Result: **15/15 tests PASS**.

5. **Production Build**:
   - `npm --prefix frontend run build` completed with exit code `0`.

---

## 4. Summary of Changes

| File | Change Summary |
| :--- | :--- |
| `frontend/src/components/auth/SessionWatcher.jsx` | Added `prevUserRef` transition listener, timer reset on re-login, re-entrant `isLoggingOutRef` guard, and cross-tab logout synchronization. |
| `frontend/src/pages/auth/LoginPage.jsx` | Updated redirect handling to use `authData.user.role`, added `sessionCoordinator.validateReturnTo` integration, and preserved `returnUrl`. |
| `frontend/src/components/auth/SessionWatcher.test.jsx` | Added regression test for session timeout followed by re-login on the same component instance. |
| `frontend/src/pages/auth/LoginPage.test.jsx` | Added regression tests for role-based navigation and returnUrl validation. |
