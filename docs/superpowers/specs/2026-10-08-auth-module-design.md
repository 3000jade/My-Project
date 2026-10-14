# Authentication and Authorization Module Specification

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Status**: Approved Specification  
> **Target Date**: 2026-10-08  

---

## 1. System Overview

The **Authentication and Authorization Module** handles user identity verification (**AuthN**), session lifecycle management, and resource access control (**AuthZ**). It provides an isolated, reusable service layer that separates core business rules and API requests from user interface elements, complying with the **Nordic Modern Architectural** design system (`#FBFBF9` canvas, `#0D4446` spruce teal, `#E76F51` terracotta coral accent, and `h-[54px]` inputs).

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  LoginForm  │  RegisterForm  │  AuthGuard  │  PermissionGate           │
│  SessionTimeoutModal         │  MfaChallengeModal                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes useAuth hook
┌───────────────────────────────────▼────────────────────────────────────┘
│                          STATE ADAPTER LAYER                           │
│  AuthContext (useAuth: user, isAuthenticated, loading, error, can...)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ delegates to
┌───────────────────────────────────▼────────────────────────────────────┘
│                    BUSINESS LOGIC & NETWORK LAYER                      │
│  loginWithCredentials │ registerUser │ logout │ refreshSession         │
│  validateSession      │ hasRole      │ can (hasPermission)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / JWT via apiClient
┌───────────────────────────────────▼────────────────────────────────────┘
│                         BACKEND REST API & DB                          │
│  Express v5 (/api/auth) + Supabase PostgreSQL (auth.users, profiles)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Module Functions (Part 1)

### 2.1 `loginWithCredentials(identity, password)`
* **Type:** Network and Authentication Function.
* **Inputs:** `identity` (email string), `password` (secret string).
* **Processing:** Validates formatting, executes `POST /api/auth/login`, receives signed session tokens (`token`, optional `refreshToken`), initializes local token storage via `apiClient.setToken()`.
* **Outputs:** Resolves `AuthSession` object with `user` and `token`; throws structured error on invalid credentials, lockout, or network failure.

### 2.2 `registerUser(payload)`
* **Type:** Network and Onboarding Function.
* **Inputs:** `payload` (`{ fullName, email, password, role?, acceptedTerms }`).
* **Processing:** Validates password entropy, dispatches `POST /api/auth/register`, sets token on return.
* **Outputs:** Resolves newly provisioned user profile object.

### 2.3 `logout()`
* **Type:** State and Session Cleanup Function.
* **Inputs:** None.
* **Processing:** Dispatches `POST /api/auth/logout` to notify server, purges stored tokens (`apiClient.clearToken()`), resets in-memory `user` state to `null`.
* **Outputs:** Resolves and triggers redirect to login.

### 2.4 `refreshSession()`
* **Type:** Token Lifecycle Function.
* **Inputs:** None (reads existing stored token / refresh token).
* **Processing:** Dispatches token rotation request (`POST /api/auth/refresh`), replaces active token pair.
* **Outputs:** Returns refreshed access credentials; triggers forced logout if expired or revoked.

### 2.5 `validateSession()`
* **Type:** Lifecycle Initialization Function.
* **Inputs:** Stored bearer token.
* **Processing:** Queries `GET /api/auth/me` on application launch or page reload to verify token validity and retrieve fresh role/permissions.
* **Outputs:** Populates active `user` context or clears stored state if invalid.

### 2.6 `hasRole(user, requiredRole)`
* **Type:** Authorization Logic (RBAC).
* **Inputs:** `user` object, `requiredRole` (string e.g. `'agent'`, `'broker'`, or array `['agent', 'admin']`).
* **Processing:** Evaluates whether `user.role` matches, granting automatic bypass for `'admin'`.
* **Outputs:** `boolean` (`true` if authorized, `false` otherwise).

### 2.7 `can(user, permission)` / `hasPermission(user, permission)`
* **Type:** Authorization Logic (Fine-Grained Capability Check).
* **Inputs:** `user` object, `permission` string (e.g. `'property:create'`, `'property:delete'`).
* **Processing:** Checks `user.permissions` array. Super-admin `'admin'` bypasses all checks.
* **Outputs:** `boolean` (`true` if allowed, `false` otherwise).

### 2.8 `useAuth()`
* **Type:** State Adapter / Custom Hook.
* **Provided Data:** `user`, `isAuthenticated` (`boolean`), `loading` (`boolean`), `error` (`string | null`).
* **Provided Actions:** `login`, `loginWithCredentials`, `register`, `registerUser`, `logout`, `refreshSession`, `validateSession`, `hasRole`, `can`.

---

## 3. Core UI Components & Guards (Part 2)

### 3.1 `LoginForm`
* Interactive credentials form with email input, masked password with reveal toggle, remember me checkbox, inline error alert, and submit button.
* Form controls adhere to uniform `h-[54px]` sizing, `#174849` Spruce Teal focus rings, and disable during submission.

### 3.2 `RegisterForm`
* Interactive onboarding component collecting full name, email, password, and password confirmation.
* Features real-time visual password strength meter (4-tier complexity bar: Length, Mixed Case, Numbers, Symbols) and terms consent checkbox.

### 3.3 `AuthGuard` (Enhanced `ProtectedRoute`)
* Route wrapper accepting `allowedRoles` and optional `requiredPermissions`.
* Displays neutral Bauhaus loading spinner during session validation.
* Redirects unauthenticated users to `/login?returnUrl=...`.
* Displays luxury 403 "Access Denied" plinth if the user is authenticated but unauthorized.

### 3.4 `PermissionGate`
* In-page wrapper: `<PermissionGate permission="property:delete" fallback={<DisabledBtn />}> <DeleteBtn /> </PermissionGate>`.
* Conditionally renders or hides interactive controls based on `can(permission)`.

### 3.5 `SessionTimeoutModal`
* Non-intrusive modal dialog warning of session expiration when idle or token expiration approaches.
* Displays dynamic countdown timer with "Extend Session" action invoking `refreshSession()`.

### 3.6 `MfaChallengeModal`
* 6-digit numeric OTP challenge modal with auto-focus, auto-advance between inputs, countdown indicator, and "Resend Code" action.

---

## 4. Architectural Directory Mapping

```text
CP_kerby/
├── shared/types/
│   └── auth.ts                                  # Shared DTOs, User, Session, and Role types
├── frontend/src/
│   ├── components/auth/
│   │   ├── LoginForm.jsx                        # Standalone interactive login component
│   │   ├── RegisterForm.jsx                     # Standalone registration component with strength meter
│   │   ├── AuthGuard.jsx                        # Structural route guard with 403 handling
│   │   ├── ProtectedRoute.jsx                   # Backward-compatible re-export of AuthGuard
│   │   ├── PermissionGate.jsx                   # In-page fine-grained capability gate
│   │   ├── SessionTimeoutModal.jsx              # Inactivity and session warning dialog
│   │   ├── MfaChallengeModal.jsx                # Multi-factor authentication OTP dialog
│   │   └── index.js                             # Component barrel export
│   ├── context/
│   │   └── AuthContext.jsx                      # Updated state provider exposing useAuth actions
│   ├── services/
│   │   └── authService.js                       # Network service with token rotation & validation
│   └── pages/auth/
│       ├── LoginPage.jsx                        # Clean page container rendering LoginForm
│       └── RegisterPage.jsx                     # Clean page container rendering RegisterForm
└── test files/frontend/auth/                    # Unified test suite covering all functions & components
```
