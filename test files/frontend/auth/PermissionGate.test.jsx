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
