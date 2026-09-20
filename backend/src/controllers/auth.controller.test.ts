import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../schemas/auth.schema';

describe('Auth Service & Role Validation', () => {
  it('should authenticate agent@pt.com with agent role', async () => {
    const result = await AuthService.signIn('agent@pt.com', 'agentPassword123!');
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('agent@pt.com');
    expect(result.user.role).toBe('agent');
    expect(result.token).toBeDefined();
  });

  it('should authenticate broker@pt.com with broker role', async () => {
    const result = await AuthService.signIn('broker@pt.com', 'brokerPassword123!');
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('broker@pt.com');
    expect(result.user.role).toBe('broker');
    expect(result.token).toBeDefined();
  });

  it('should authenticate admin@pt.com with admin role', async () => {
    const result = await AuthService.signIn('admin@pt.com', 'adminPassword123!');
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('admin@pt.com');
    expect(result.user.role).toBe('admin');
    expect(result.token).toBeDefined();
  });

  it('should reject invalid password with 401 error', async () => {
    await expect(
      AuthService.signIn('agent@pt.com', 'WrongPassword999!')
    ).rejects.toThrow();
  });

  it('loginSchema should accept shorthand "agent" and map to "agent@pt.com"', () => {
    const parsed = loginSchema.parse({
      email: 'agent',
      password: 'agentPassword123!',
    });
    expect(parsed.email).toBe('agent@pt.com');
  });

  it('loginSchema should accept shorthand "broker" and map to "broker@pt.com"', () => {
    const parsed = loginSchema.parse({
      email: 'broker',
      password: 'brokerPassword123!',
    });
    expect(parsed.email).toBe('broker@pt.com');
  });
});
