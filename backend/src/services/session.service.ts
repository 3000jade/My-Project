import { AuditService } from './audit.service';
import type { AuthSessionRecord } from '../../../shared/types/inquiry';

const IDLE_TIMEOUT_MS: Record<string, number> = {
  agent: 30 * 60 * 1000, // 30 minutes
  broker: 30 * 60 * 1000, // 30 minutes
  admin: 30 * 60 * 1000, // 30 minutes
  client: 60 * 60 * 1000, // 60 minutes
};

const ABSOLUTE_TIMEOUT_MS: Record<string, number> = {
  agent: 12 * 60 * 60 * 1000, // 12 hours
  broker: 12 * 60 * 60 * 1000, // 12 hours
  admin: 12 * 60 * 60 * 1000, // 12 hours
  client: 24 * 60 * 60 * 1000, // 24 hours
};

const PRESENCE_TTL_MS = 60 * 1000; // 60 seconds bounded presence TTL

let sessionStore = new Map<string, AuthSessionRecord>();
let presenceStore = new Map<string, number>(); // userId -> lastHeartbeatMs
let disabledAccounts = new Set<string>();

export class SessionService {
  public static resetForTesting(): void {
    sessionStore.clear();
    presenceStore.clear();
    disabledAccounts.clear();
  }

  public static createSession(params: {
    sessionId: string;
    userId: string;
    role: string;
    nowMs?: number;
  }): AuthSessionRecord {
    const now = params.nowMs ?? Date.now();
    const idleLimit = IDLE_TIMEOUT_MS[params.role] || IDLE_TIMEOUT_MS.client;
    const absLimit = ABSOLUTE_TIMEOUT_MS[params.role] || ABSOLUTE_TIMEOUT_MS.client;

    const record: AuthSessionRecord = {
      id: params.sessionId,
      userId: params.userId,
      role: params.role,
      createdAt: now,
      lastActiveAt: now,
      idleExpiresAt: now + idleLimit,
      absoluteExpiresAt: now + absLimit,
    };

    sessionStore.set(params.sessionId, record);
    presenceStore.set(params.userId, now);
    return { ...record };
  }

  public static getSession(sessionId: string): AuthSessionRecord | undefined {
    const s = sessionStore.get(sessionId);
    return s ? { ...s } : undefined;
  }

  /**
   * Validate session state (idle expiry, absolute expiry, revocation, account disablement)
   * Background heartbeats (`isHeartbeat = true`) never extend `idleExpiresAt` (SESSION-01)
   */
  public static validateSession(
    sessionId: string,
    nowMs: number = Date.now(),
    isHeartbeat: boolean = false
  ): {
    valid: boolean;
    reason?: 'SESSION_NOT_FOUND' | 'SESSION_REVOKED' | 'SESSION_IDLE_EXPIRED' | 'SESSION_ABSOLUTE_EXPIRED' | 'ACCOUNT_DISABLED';
    session?: AuthSessionRecord;
  } {
    const session = sessionStore.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'SESSION_NOT_FOUND' };
    }

    if (disabledAccounts.has(session.userId)) {
      return { valid: false, reason: 'ACCOUNT_DISABLED', session };
    }

    if (session.revokedAt) {
      return { valid: false, reason: 'SESSION_REVOKED', session };
    }

    if (nowMs >= session.absoluteExpiresAt) {
      return { valid: false, reason: 'SESSION_ABSOLUTE_EXPIRED', session };
    }

    if (nowMs >= session.idleExpiresAt) {
      return { valid: false, reason: 'SESSION_IDLE_EXPIRED', session };
    }

    if (!isHeartbeat) {
      const idleLimit = IDLE_TIMEOUT_MS[session.role] || IDLE_TIMEOUT_MS.client;
      session.lastActiveAt = nowMs;
      session.idleExpiresAt = Math.min(session.absoluteExpiresAt, nowMs + idleLimit);
    }

    presenceStore.set(session.userId, nowMs);
    return { valid: true, session };
  }

  /**
   * Record informational presence heartbeat without extending idle session expiry (SESSION-01)
   */
  public static recordHeartbeat(sessionId: string, userId: string, nowMs: number = Date.now()): boolean {
    presenceStore.set(userId, nowMs);
    const session = sessionStore.get(sessionId);
    if (!session) return true;
    const validation = this.validateSession(sessionId, nowMs, true);
    return validation.valid;
  }

  public static isUserOnline(userId: string, nowMs: number = Date.now()): boolean {
    const lastHeartbeat = presenceStore.get(userId);
    if (!lastHeartbeat) return false;
    return nowMs - lastHeartbeat <= PRESENCE_TTL_MS;
  }

  public static revokeSession(sessionId: string, reason: string = 'user_logout', nowMs: number = Date.now()): boolean {
    const session = sessionStore.get(sessionId);
    if (!session) return false;
    session.revokedAt = nowMs;
    session.revokeReason = reason;
    presenceStore.delete(session.userId);
    return true;
  }

  public static revokeAllUserSessions(
    userId: string,
    reason: string = 'all_device_revocation',
    nowMs: number = Date.now()
  ): number {
    let count = 0;
    for (const session of sessionStore.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = nowMs;
        session.revokeReason = reason;
        count++;
      }
    }
    presenceStore.delete(userId);

    void AuditService.recordEvent({
      eventType: 'auth.all_sessions_revoked',
      actorId: userId,
      actorType: 'human',
      targetType: 'user_sessions',
      targetId: userId,
      outcome: 'success',
      reason,
      newValues: { revokedCount: count },
    });

    return count;
  }

  public static disableUserAccount(userId: string, reason: string = 'account_disabled'): void {
    disabledAccounts.add(userId);
    this.revokeAllUserSessions(userId, reason);
  }
}

export default SessionService;
