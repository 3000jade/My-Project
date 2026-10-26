import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => {
  const mockClient = {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockClient,
    apiClient: mockClient,
  };
});

describe('authService.validateSession normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes user object with fullName from profile when validating session on reload', async () => {
    apiClient.getToken.mockReturnValue('valid-jwt-token');
    apiClient.get.mockResolvedValue({
      data: {
        user: {
          id: 'broker-uid-123',
          email: 'broker@pt.com',
          role: 'broker',
        },
        profile: {
          id: 'broker-uid-123',
          email: 'broker@pt.com',
          full_name: 'Broker',
          role: 'broker',
        },
      },
    });

    const user = await authService.validateSession();

    expect(user).not.toBeNull();
    expect(user.fullName).toBe('Broker');
    expect(user.role).toBe('broker');
  });

  it('falls back to user_metadata.full_name if profile.full_name is unavailable', async () => {
    apiClient.getToken.mockReturnValue('valid-jwt-token');
    apiClient.get.mockResolvedValue({
      data: {
        user: {
          id: 'broker-uid-456',
          email: 'broker@pt.com',
          role: 'broker',
          user_metadata: {
            full_name: 'Metadata Broker',
          },
        },
      },
    });

    const user = await authService.validateSession();

    expect(user).not.toBeNull();
    expect(user.fullName).toBe('Metadata Broker');
  });
});
