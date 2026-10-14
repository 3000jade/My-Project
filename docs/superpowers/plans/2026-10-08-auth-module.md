# Authentication and Authorization Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive, decoupled Authentication and Authorization Module comprising business logic/network functions (`loginWithCredentials`, `registerUser`, `logout`, `refreshSession`, `validateSession`, `hasRole`, `can`) and luxury architectural UI components (`LoginForm`, `RegisterForm`, `AuthGuard`, `PermissionGate`, `SessionTimeoutModal`, `MfaChallengeModal`) with full test coverage.

**Architecture:** Separation of concerns across three layers: a business logic network layer in `authService.js`, a state adapter layer in `AuthContext.jsx`, and an atomic presentation layer in `frontend/src/components/auth/` adhering to the Nordic Modern architectural design system.

**Tech Stack:** React 19, TypeScript, Express v5, Tailwind CSS v4, Framer Motion v12, Tabler Icons, Vitest 5, `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-10-08-auth-module-design.md`

## Global Constraints

- **Design System:** Strictly comply with Nordic Modern Architectural standards (`#FBFBF9` canvas, `#0D4446` spruce teal, `#E76F51` terracotta coral, `h-[54px]` inputs).
- **Directory Blueprint:** Components live in `frontend/src/components/auth/`, shared types in `shared/types/auth.ts`, tests in `test files/frontend/auth/`.
- **Lenis Modal Safety:** Any scrollable or modal dialog must include `data-lenis-prevent="true"`.
- **Git Safety:** Strictly local commits only; no remote pushes.

---

### Task 1: Shared Auth & RBAC Type Contracts

**Files:**
- Create: `shared/types/auth.ts`
- Modify: `shared/types/index.ts`
- Test: `test files/frontend/auth/authTypes.test.ts`

**Interfaces:**
- Produces: `UserRole`, `Permission`, `AuthUser`, `AuthSession`, `LoginCredentials`, `RegisterPayload`, `MfaVerificationPayload`

- [x] **Step 1: Write the failing test for auth type contracts**

Create `test files/frontend/auth/authTypes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { AuthUser, UserRole, Permission, AuthSession } from '../../../shared/types/auth';

describe('Auth Type Contracts', () => {
  it('validates shape of AuthUser and permissions', () => {
    const user: AuthUser = {
      id: 'usr-1',
      email: 'alex@kerby.ph',
      fullName: 'Alex Vance',
      role: 'agent',
      permissions: ['property:create', 'property:edit'],
      isVerified: true,
      mfaEnabled: false
    };

    expect(user.id).toBe('usr-1');
    expect(user.role).toBe('agent');
    expect(user.permissions).toContain('property:create');
  });

  it('validates shape of AuthSession envelope', () => {
    const session: AuthSession = {
      user: {
        id: 'usr-2',
        email: 'broker@kerby.ph',
        fullName: 'Elena Rostova',
        role: 'broker',
        permissions: ['property:delete', 'reports:view']
      },
      token: 'jwt-token-sample',
      refreshToken: 'refresh-token-sample',
      expiresAt: Date.now() + 3600000
    };

    expect(session.token).toBe('jwt-token-sample');
    expect(session.user.role).toBe('broker');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/authTypes.test.ts"`  
Expected: FAIL (module not found)

- [x] **Step 3: Create `shared/types/auth.ts` and update `shared/types/index.ts`**

Create `shared/types/auth.ts`:
```typescript
export type UserRole = 'client' | 'agent' | 'broker' | 'admin';

export type Permission = 
  | 'property:create'
  | 'property:edit'
  | 'property:delete'
  | 'property:view_private'
  | 'inquiries:manage'
  | 'reports:view'
  | 'users:manage'
  | string;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions?: Permission[];
  avatarUrl?: string;
  phone?: string;
  isVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
  acceptedTerms: boolean;
}

export interface MfaVerificationPayload {
  code: string;
  challengeId?: string;
}
```

Update `shared/types/index.ts` to export all definitions from `./auth`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/authTypes.test.ts"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add shared/types/auth.ts shared/types/index.ts "test files/frontend/auth/authTypes.test.ts"`  
Run: `git commit -m "feat(auth): define shared TypeScript contracts for authentication and RBAC"`

---

### Task 2: Core Functions in Network & Logic Layer (`authService.js`)

**Files:**
- Modify: `frontend/src/services/authService.js`
- Test: `test files/frontend/auth/authService.test.js`

**Interfaces:**
- Produces: `loginWithCredentials`, `registerUser`, `logout`, `refreshSession`, `validateSession`, `hasRole`, `can`, `hasPermission`

- [x] **Step 1: Write failing tests for core business logic & network functions**

Create `test files/frontend/auth/authService.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, hasRole, can } from '../../../frontend/src/services/authService';
import apiClient from '../../../frontend/src/services/apiClient';

vi.mock('../../../frontend/src/services/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn()
  }
}));

describe('authService Core Functions & RBAC Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loginWithCredentials validates inputs and sets auth token on success', async () => {
    const mockUser = { id: '1', email: 'test@kerby.ph', role: 'agent' };
    apiClient.post.mockResolvedValueOnce({
      data: { user: mockUser, token: 'mock-jwt-token' }
    });

    const session = await authService.loginWithCredentials('test@kerby.ph', 'Secret123!');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'test@kerby.ph', password: 'Secret123!' });
    expect(apiClient.setToken).toHaveBeenCalledWith('mock-jwt-token');
    expect(session.user.email).toBe('test@kerby.ph');
  });

  it('loginWithCredentials throws structured error when password is empty', async () => {
    await expect(authService.loginWithCredentials('test@kerby.ph', '')).rejects.toThrow(/Password is required/i);
  });

  it('registerUser dispatches registration payload and sets token', async () => {
    const payload = { fullName: 'Maria Santos', email: 'maria@kerby.ph', password: 'Password123!', acceptedTerms: true };
    apiClient.post.mockResolvedValueOnce({
      data: { user: { id: '2', ...payload, role: 'client' }, token: 'new-token' }
    });

    const res = await authService.registerUser(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'maria@kerby.ph' }));
    expect(res.user.fullName).toBe('Maria Santos');
  });

  it('validateSession returns user data on valid token and clears on failure', async () => {
    apiClient.getToken.mockReturnValueOnce('valid-token');
    apiClient.get.mockResolvedValueOnce({ data: { user: { id: '1', email: 'test@kerby.ph' } } });

    const user = await authService.validateSession();
    expect(user.email).toBe('test@kerby.ph');

    // Failure branch
    apiClient.getToken.mockReturnValueOnce('invalid-token');
    apiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));
    const invalidUser = await authService.validateSession();
    expect(invalidUser).toBeNull();
    expect(apiClient.clearToken).toHaveBeenCalled();
  });

  it('hasRole evaluates role hierarchy and admin superuser bypass', () => {
    const agent = { role: 'agent' };
    const admin = { role: 'admin' };

    expect(hasRole(agent, 'agent')).toBe(true);
    expect(hasRole(agent, ['broker', 'admin'])).toBe(false);
    expect(hasRole(admin, 'agent')).toBe(true); // Superuser bypass
    expect(hasRole(null, 'agent')).toBe(false);
  });

  it('can evaluates fine-grained capabilities with admin override', () => {
    const agent = { role: 'agent', permissions: ['property:create', 'property:edit'] };
    const client = { role: 'client', permissions: [] };
    const admin = { role: 'admin', permissions: [] };

    expect(can(agent, 'property:create')).toBe(true);
    expect(can(agent, 'property:delete')).toBe(false);
    expect(can(admin, 'property:delete')).toBe(true); // Admin bypass
    expect(can(client, 'property:create')).toBe(false);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/authService.test.js"`  
Expected: FAIL (missing methods / exports)

- [x] **Step 3: Implement functions in `frontend/src/services/authService.js`**

Implement in `frontend/src/services/authService.js`:
- `hasRole(user, role)`
- `can(user, permission)` and alias `hasPermission`
- `loginWithCredentials(identity, password, rememberMe)`
- `registerUser(payload)`
- `logout()`
- `refreshSession(refreshToken)`
- `validateSession()`
- Maintain backward-compatible aliases: `login`, `register`, `getCurrentUser`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/authService.test.js"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add frontend/src/services/authService.js "test files/frontend/auth/authService.test.js"`  
Run: `git commit -m "feat(auth): implement core network functions and RBAC capability checks in authService"`

---

### Task 3: Auth State Adapter Hook (`AuthContext.jsx`)

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`
- Test: `test files/frontend/auth/AuthContext.test.jsx`

**Interfaces:**
- Consumes: `authService`, `hasRole`, `can`
- Produces: `useAuth` hook providing: `user`, `isAuthenticated`, `loading`, `error`, `loginWithCredentials`, `registerUser`, `logout`, `refreshSession`, `validateSession`, `hasRole`, `can`

- [x] **Step 1: Write unit tests for updated `AuthContext`**

Create `test files/frontend/auth/AuthContext.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../frontend/src/context/AuthContext';
import { authService } from '../../../frontend/src/services/authService';

vi.mock('../../../frontend/src/services/authService', () => ({
  authService: {
    validateSession: vi.fn(),
    loginWithCredentials: vi.fn(),
    registerUser: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    hasRole: vi.fn((user, role) => user?.role === role || user?.role === 'admin'),
    can: vi.fn((user, perm) => user?.role === 'admin' || user?.permissions?.includes(perm))
  },
  hasRole: vi.fn((user, role) => user?.role === role || user?.role === 'admin'),
  can: vi.fn((user, perm) => user?.role === 'admin' || user?.permissions?.includes(perm))
}));

function TestConsumer() {
  const { user, isAuthenticated, loading, loginWithCredentials, logout, hasRole, can } = useAuth();
  if (loading) return <div>Loading Auth...</div>;
  return (
    <div>
      <div data-testid="status">{isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS'}</div>
      <div data-testid="user-email">{user ? user.email : 'NONE'}</div>
      <div data-testid="has-agent-role">{hasRole('agent') ? 'YES' : 'NO'}</div>
      <div data-testid="can-create">{can('property:create') ? 'YES' : 'NO'}</div>
      <button onClick={() => loginWithCredentials('test@kerby.ph', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext and useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates user on mount when validateSession resolves an active user', async () => {
    authService.validateSession.mockResolvedValueOnce({
      id: '1',
      email: 'alex@kerby.ph',
      role: 'agent',
      permissions: ['property:create']
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('status')).toHaveTextContent('AUTHENTICATED');
    expect(screen.getByTestId('user-email')).toHaveTextContent('alex@kerby.ph');
    expect(screen.getByTestId('has-agent-role')).toHaveTextContent('YES');
    expect(screen.getByTestId('can-create')).toHaveTextContent('YES');
  });

  it('handles logout by clearing user and setting status to anonymous', async () => {
    authService.validateSession.mockResolvedValueOnce({ id: '1', email: 'alex@kerby.ph', role: 'agent' });
    authService.logout.mockResolvedValueOnce();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('status')).toHaveTextContent('AUTHENTICATED');
    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('ANONYMOUS');
    expect(screen.getByTestId('user-email')).toHaveTextContent('NONE');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/AuthContext.test.jsx"`  
Expected: FAIL (missing methods in hook)

- [x] **Step 3: Update `AuthContext.jsx` with full actions suite**

Modify `frontend/src/context/AuthContext.jsx`:
- Call `authService.validateSession()` on mount.
- Provide `loginWithCredentials`, `registerUser`, `logout`, `refreshSession`, `validateSession`.
- Provide bound helpers: `hasRole: (role) => hasRole(user, role)` and `can: (perm) => can(user, perm)`.
- Expose `isAuthenticated = Boolean(user)`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/AuthContext.test.jsx"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add frontend/src/context/AuthContext.jsx "test files/frontend/auth/AuthContext.test.jsx"`  
Run: `git commit -m "feat(auth): enrich AuthContext with validateSession, refreshSession, and RBAC actions"`

---

### Task 4: Interactive Input Forms (`LoginForm.jsx` & `RegisterForm.jsx`)

**Files:**
- Create: `frontend/src/components/auth/LoginForm.jsx`
- Create: `frontend/src/components/auth/RegisterForm.jsx`
- Test: `test files/frontend/auth/LoginForm.test.jsx`
- Test: `test files/frontend/auth/RegisterForm.test.jsx`

**Interfaces:**
- `LoginForm`: Props `{ onSuccess, onNavigateRegister, defaultRole? }`
- `RegisterForm`: Props `{ onSuccess, onNavigateLogin, defaultRole? }`

- [x] **Step 1: Write failing tests for `LoginForm` and `RegisterForm`**

Create `test files/frontend/auth/LoginForm.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../../frontend/src/components/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders input fields, reveal toggle, and submits credentials', async () => {
    const handleLogin = vi.fn().mockResolvedValue();
    render(<LoginForm onSubmitCredentials={handleLogin} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'client@kerby.ph' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith({
        email: 'client@kerby.ph',
        password: 'Secret123!',
        rememberMe: true
      });
    });
  });

  it('toggles password masking visibility', () => {
    render(<LoginForm onSubmitCredentials={vi.fn()} />);
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/Toggle password visibility/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
```

Create `test files/frontend/auth/RegisterForm.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../../../frontend/src/components/auth/RegisterForm';

describe('RegisterForm Component', () => {
  it('displays real-time password strength meter and blocks mismatched passwords', async () => {
    const handleRegister = vi.fn().mockResolvedValue();
    render(<RegisterForm onSubmitRegistration={handleRegister} />);

    const passInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    // Enter weak password
    fireEvent.change(passInput, { target: { value: '123' } });
    expect(screen.getByText(/Weak|Fair/i)).toBeInTheDocument();

    // Mismatched confirmation
    fireEvent.change(confirmInput, { target: { value: '456' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Passphrases do not match/i)).toBeInTheDocument();
    expect(handleRegister).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/LoginForm.test.jsx"`  
Expected: FAIL (modules not found)

- [x] **Step 3: Implement `LoginForm.jsx` and `RegisterForm.jsx`**

Create `frontend/src/components/auth/LoginForm.jsx`:
- Email input (`h-[54px]`), password input with eye icon toggle, remember me checkbox, inline error alert, submit button with loading spinner.

Create `frontend/src/components/auth/RegisterForm.jsx`:
- Full name, email, password, confirm password, 4-tier visual strength meter (Length, Mixed Case, Numbers, Symbols), terms consent checkbox, submit button.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/LoginForm.test.jsx" "test files/frontend/auth/RegisterForm.test.jsx"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add frontend/src/components/auth/LoginForm.jsx frontend/src/components/auth/RegisterForm.jsx "test files/frontend/auth/LoginForm.test.jsx" "test files/frontend/auth/RegisterForm.test.jsx"`  
Run: `git commit -m "feat(auth): build LoginForm and RegisterForm interactive input components"`

---

### Task 5: Access Guards (`AuthGuard.jsx` & `PermissionGate.jsx`)

**Files:**
- Create: `frontend/src/components/auth/AuthGuard.jsx`
- Create: `frontend/src/components/auth/PermissionGate.jsx`
- Modify: `frontend/src/components/auth/ProtectedRoute.jsx` (alias to AuthGuard)
- Test: `test files/frontend/auth/AuthGuard.test.jsx`
- Test: `test files/frontend/auth/PermissionGate.test.jsx`

**Interfaces:**
- `AuthGuard`: Props `{ children, allowedRoles?, requiredPermissions?, fallback? }`
- `PermissionGate`: Props `{ permission?, role?, fallback?, children }`

- [x] **Step 1: Write failing tests for `AuthGuard` and `PermissionGate`**

Create `test files/frontend/auth/AuthGuard.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthGuard from '../../../frontend/src/components/auth/AuthGuard';
import * as AuthContext from '../../../frontend/src/context/AuthContext';

describe('AuthGuard Component', () => {
  it('renders children when user possesses required role and permission', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', role: 'broker', permissions: ['property:delete'] },
      loading: false,
      isAuthenticated: true,
      hasRole: (role) => role === 'broker',
      can: (perm) => perm === 'property:delete'
    });

    render(
      <MemoryRouter>
        <AuthGuard allowedRoles={['broker']} requiredPermissions={['property:delete']}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders 403 Access Denied when user is authenticated but unauthorized', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '2', role: 'client', permissions: [] },
      loading: false,
      isAuthenticated: true,
      hasRole: () => false,
      can: () => false
    });

    render(
      <MemoryRouter>
        <AuthGuard allowedRoles={['broker']}>
          <div>Secret Broker Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Broker Area')).not.toBeInTheDocument();
    expect(screen.getByText(/Access Restricted|Forbidden/i)).toBeInTheDocument();
  });
});
```

Create `test files/frontend/auth/PermissionGate.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PermissionGate from '../../../frontend/src/components/auth/PermissionGate';
import * as AuthContext from '../../../frontend/src/context/AuthContext';

describe('PermissionGate Component', () => {
  it('renders child action when permission succeeds', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      can: (p) => p === 'records:delete',
      hasRole: () => true
    });

    render(
      <PermissionGate permission="records:delete">
        <button>Delete Record</button>
      </PermissionGate>
    );

    expect(screen.getByRole('button', { name: /Delete Record/i })).toBeInTheDocument();
  });

  it('renders fallback when permission test fails', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      can: () => false,
      hasRole: () => false
    });

    render(
      <PermissionGate permission="records:delete" fallback={<span>No Permission</span>}>
        <button>Delete Record</button>
      </PermissionGate>
    );

    expect(screen.queryByRole('button', { name: /Delete Record/i })).not.toBeInTheDocument();
    expect(screen.getByText('No Permission')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/AuthGuard.test.jsx"`  
Expected: FAIL (modules not found)

- [x] **Step 3: Implement `AuthGuard.jsx`, `PermissionGate.jsx`, and update `ProtectedRoute.jsx`**

Create `frontend/src/components/auth/AuthGuard.jsx`:
- Loading spinner plinth during session initialization.
- Navigate to `/login?returnUrl=...` if unauthenticated.
- Render 403 Forbidden architectural card if role/permission check fails.
- Render children when authorized.

Create `frontend/src/components/auth/PermissionGate.jsx`:
- Check `can(permission)` or `hasRole(role)`. Render children or fallback.

Modify `frontend/src/components/auth/ProtectedRoute.jsx` to re-export `AuthGuard` for zero-breaking-change backwards compatibility.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/AuthGuard.test.jsx" "test files/frontend/auth/PermissionGate.test.jsx"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add frontend/src/components/auth/AuthGuard.jsx frontend/src/components/auth/PermissionGate.jsx frontend/src/components/auth/ProtectedRoute.jsx "test files/frontend/auth/AuthGuard.test.jsx" "test files/frontend/auth/PermissionGate.test.jsx"`  
Run: `git commit -m "feat(auth): build AuthGuard and PermissionGate structural and in-page authorization guards"`

---

### Task 6: Session & Security Modals (`SessionTimeoutModal.jsx` & `MfaChallengeModal.jsx`)

**Files:**
- Create: `frontend/src/components/auth/SessionTimeoutModal.jsx`
- Create: `frontend/src/components/auth/MfaChallengeModal.jsx`
- Create: `frontend/src/components/auth/index.js`
- Test: `test files/frontend/auth/SessionTimeoutModal.test.jsx`
- Test: `test files/frontend/auth/MfaChallengeModal.test.jsx`

**Interfaces:**
- `SessionTimeoutModal`: Props `{ isOpen, secondsRemaining, onExtendSession, onLogout }`
- `MfaChallengeModal`: Props `{ isOpen, onVerifyCode, onResendCode, onClose }`

- [x] **Step 1: Write failing tests for session and MFA challenge modals**

Create `test files/frontend/auth/SessionTimeoutModal.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionTimeoutModal from '../../../frontend/src/components/auth/SessionTimeoutModal';

describe('SessionTimeoutModal Component', () => {
  it('renders countdown clock and calls onExtendSession when clicked', () => {
    const handleExtend = vi.fn();
    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={45}
        onExtendSession={handleExtend}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText(/Session Expiring/i)).toBeInTheDocument();
    expect(screen.getByText(/45s/i)).toBeInTheDocument();

    const extendBtn = screen.getByRole('button', { name: /Extend Session/i });
    fireEvent.click(extendBtn);
    expect(handleExtend).toHaveBeenCalledTimes(1);
  });
});
```

Create `test files/frontend/auth/MfaChallengeModal.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MfaChallengeModal from '../../../frontend/src/components/auth/MfaChallengeModal';

describe('MfaChallengeModal Component', () => {
  it('renders 6-digit OTP input boxes and auto-submits on completion', async () => {
    const handleVerify = vi.fn().mockResolvedValue();
    render(<MfaChallengeModal isOpen={true} onVerifyCode={handleVerify} onClose={vi.fn()} />);

    expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);

    // Simulate typing 1 2 3 4 5 6
    '123456'.split('').forEach((digit, idx) => {
      fireEvent.change(inputs[idx], { target: { value: digit } });
    });

    await waitFor(() => {
      expect(handleVerify).toHaveBeenCalledWith('123456');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/SessionTimeoutModal.test.jsx" "test files/frontend/auth/MfaChallengeModal.test.jsx"`  
Expected: FAIL (modules not found)

- [x] **Step 3: Implement `SessionTimeoutModal.jsx` and `MfaChallengeModal.jsx`**

Create `frontend/src/components/auth/SessionTimeoutModal.jsx`:
- Framer Motion backdrop and modal with `data-lenis-prevent="true"`.
- Circular countdown indicator, "Extend Session" primary button, "Log Out Now" secondary button.

Create `frontend/src/components/auth/MfaChallengeModal.jsx`:
- 6 individual numeric inputs with auto-advance on keydown/input.
- Auto-submit when length reaches 6.
- Resend link with 60s cooldown timer.

Create `frontend/src/components/auth/index.js` exporting all components.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix frontend test -- --run "test files/frontend/auth/SessionTimeoutModal.test.jsx" "test files/frontend/auth/MfaChallengeModal.test.jsx"`  
Expected: PASS

- [x] **Step 5: Commit changes**

Run: `git add frontend/src/components/auth/SessionTimeoutModal.jsx frontend/src/components/auth/MfaChallengeModal.jsx frontend/src/components/auth/index.js "test files/frontend/auth/SessionTimeoutModal.test.jsx" "test files/frontend/auth/MfaChallengeModal.test.jsx"`  
Run: `git commit -m "feat(auth): build SessionTimeoutModal and MfaChallengeModal security components"`

---

### Task 7: Page Integration, Header Profile Dock & Full Verification

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.jsx` (embed `LoginForm`)
- Modify: `frontend/src/pages/auth/RegisterPage.jsx` (embed `RegisterForm`)
- Modify: `frontend/src/components/layout/Header.jsx` (add authenticated user avatar & role dock)
- Test: `test files/frontend/pages/LoginPage.test.jsx`
- Test: `test files/frontend/pages/RegisterPage.test.jsx`

- [x] **Step 1: Update `LoginPage.jsx` and `RegisterPage.jsx`**

Refactor `LoginPage.jsx` and `RegisterPage.jsx` to render the newly created `LoginForm` and `RegisterForm` components within the full-bleed Nordic architectural split-screen layout.

- [x] **Step 2: Update `Header.jsx` with User Avatar & Role Dock**

In `frontend/src/components/layout/Header.jsx`:
- When unauthenticated: Show "Login" and "Register" buttons.
- When authenticated: Render user avatar, full name / role badge pill (Agent, Broker, Client), and one-click portal shortcut dropdown with Logout action.

- [x] **Step 3: Run the full frontend auth test suite**

Run:
```bash
npm --prefix frontend test -- --run "test files/frontend/auth/authTypes.test.ts" "test files/frontend/auth/authService.test.js" "test files/frontend/auth/AuthContext.test.jsx" "test files/frontend/auth/LoginForm.test.jsx" "test files/frontend/auth/RegisterForm.test.jsx" "test files/frontend/auth/AuthGuard.test.jsx" "test files/frontend/auth/PermissionGate.test.jsx" "test files/frontend/auth/SessionTimeoutModal.test.jsx" "test files/frontend/auth/MfaChallengeModal.test.jsx" "test files/frontend/pages/LoginPage.test.jsx" "test files/frontend/pages/RegisterPage.test.jsx"
```
Expected: ALL PASS

- [x] **Step 4: Commit and finalize**

Run: `git add frontend/src/pages/auth/ frontend/src/components/layout/Header.jsx "test files/frontend/pages/"`  
Run: `git commit -m "feat(auth): integrate LoginForm, RegisterForm, and Header profile dock across the platform"`
