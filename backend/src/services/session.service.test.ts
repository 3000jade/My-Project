import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from './session.service';
import * as supabaseConfig from '../config/supabase';

describe('SessionService DB Hydration & Throttling', () => {
  beforeEach(() => {
    SessionService.resetForTesting();
    vi.restoreAllMocks();
  });

  it('hydrates sessions from Supabase user_sessions when in-memory cache is cleared', async () => {
    const now = Date.now();
    const token = 'test-bearer-token-hydrate-123';
    const tokenHash = SessionService.hashToken(token);
    const dbRow = {
      id: '11111111-1111-4111-8111-111111111111',
      user_id: 'user-123',
      role: 'broker',
      token_hash: tokenHash,
      created_at: new Date(now - 60_000).toISOString(),
      last_active_at: new Date(now - 60_000).toISOString(),
      idle_expires_at: new Date(now + 29 * 60_000).toISOString(),
      absolute_expires_at: new Date(now + 11 * 60 * 60_000).toISOString(),
      revoked_at: null,
      revoke_reason: null,
      last_heartbeat_at: null,
      user_agent: 'Vitest Browser',
      ip_address: '127.0.0.1',
      updated_at: new Date(now - 60_000).toISOString(),
    };

    const mockChain: any = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      is: vi.fn(() => Promise.resolve({ data: [dbRow], error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: dbRow, error: null })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => mockChain),
    };

    vi.spyOn(supabaseConfig, 'isSupabaseConfigured', 'get' as any).mockReturnValue(true);
    const fromSpy = vi.fn(() => mockChain);
    vi.spyOn(supabaseConfig, 'supabaseAdmin', 'get' as any).mockReturnValue({ from: fromSpy } as any);

    // 1. getUserSessionsAsync should hydrate from user_sessions when memory is empty
    const sessions = await SessionService.getUserSessionsAsync('user-123', token, now);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(dbRow.id);
    expect(sessions[0].isCurrent).toBe(true);

    // 2. Clear memory and test extendSessionAsync hydration
    SessionService.resetForTesting();
    const extended = await SessionService.extendSessionAsync(token, now);
    expect(extended.valid).toBe(true);
    expect(extended.session?.id).toBe(dbRow.id);
  });

  it('throttles lastActiveAt persistence to once per 60 seconds', () => {
    const t0 = Date.now();
    const session = SessionService.createSession({
      token: 'throttle-token-abc',
      userId: 'user-throttle',
      role: 'broker',
      nowMs: t0,
    });

    const saveSpy = vi.spyOn(SessionService as any, 'saveToPersistence');

    // Request 5 seconds later should update in memory without hitting disk
    const res1 = SessionService.validateSession('throttle-token-abc', t0 + 5_000, false);
    expect(res1.valid).toBe(true);
    expect(res1.session?.lastActiveAt).toBe(t0 + 5_000);
    expect(saveSpy).not.toHaveBeenCalled();

    // Request 61 seconds later should persist
    const res2 = SessionService.validateSession('throttle-token-abc', t0 + 61_000, false);
    expect(res2.valid).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(session.id).toBeDefined();
  });
});
