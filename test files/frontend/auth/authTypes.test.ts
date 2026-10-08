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
