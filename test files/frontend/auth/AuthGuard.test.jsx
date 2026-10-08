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
