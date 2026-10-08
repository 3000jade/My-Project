import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
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

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ANONYMOUS');
    });
    expect(screen.getByTestId('user-email')).toHaveTextContent('NONE');
  });
});
