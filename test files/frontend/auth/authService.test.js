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
