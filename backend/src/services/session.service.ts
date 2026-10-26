import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { AuditService } from './audit.service';
import type { AuthSessionRecord, RevokeReason } from '../../../shared/types/inquiry';

export const IDLE_TIMEOUT_MS: Record<string, number> = {
  agent: 30 * 60 * 1000, // 30 minutes
  broker: 30 * 60 * 1000, // 30 minutes
  admin: 30 * 60 * 1000, // 30 minutes
  client: 60 * 60 * 1000, // 60 minutes
};

export const ABSOLUTE_TIMEOUT_MS: Record<string, number> = {
  agent: 12 * 60 * 60 * 1000, // 12 hours
  broker: 12 * 60 * 60 * 1000, // 12 hours
  admin: 12 * 60 * 60 * 1000, // 12 hours
  client: 24 * 60 * 60 * 1000, // 24 hours
};

export const VALID_REVOKE_REASONS: RevokeReason[] = [
  'user_logout',
  'user_manual_revoke',
  'password_reset',
  'inactivity_timeout',
  'absolute_timeout',
  'all_device_revocation',
  'account_disabled',
  'admin_action',
];

const PRESENCE_TTL_MS = 60 * 1000; // 60 seconds bounded presence TTL

// Persistent storage file path
const DATA_DIR = path.resolve(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// In-memory indexed stores
let sessionsById = new Map<string, AuthSessionRecord>();
let sessionsByTokenHash = new Map<string, AuthSessionRecord>();
let presenceStore = new Map<string, number>(); // userId -> lastHeartbeatMs
let disabledAccounts = new Set<string>();

export interface SessionListDTO {
  id: string;
  isCurrent: boolean;
  role: string;
  createdAt: number;
  lastActiveAt: number;
  idleExpiresAt: number;
  absoluteExpiresAt: number;
  lastHeartbeatAt?: number;
  userAgent: string;
  ipAddress: string;
}

export interface RevokeSessionOptions {
  sessionId: string;
  requestingUserId?: string;
  reason: RevokeReason;
  nowMs?: number;
}

export class SessionService {
  /**
   * Compute non-reversible SHA-256 hash of access token for storage and lookup (SF-01)
   */
  public static hashToken(token: string): string {
    if (!token) return '';
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Persist active and revoked sessions to disk (merges across concurrent processes)
   * Enforces that plaintext tokens are NEVER written to disk (SF-01)
   */
  private static saveToPersistence(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const mergedMap = new Map<string, AuthSessionRecord>();
      const mergedDisabled = new Set<string>(disabledAccounts);

      if (fs.existsSync(SESSIONS_FILE)) {
        try {
          const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
          const diskData = JSON.parse(raw);
          if (Array.isArray(diskData.sessions)) {
            for (const s of diskData.sessions) {
              if (s && s.id) {
                // Sanitize legacy entries
                const sanitized = { ...s };
                if (sanitized.token && !sanitized.tokenHash) {
                  sanitized.tokenHash = this.hashToken(sanitized.token);
                }
                delete sanitized.token;
                mergedMap.set(sanitized.id, sanitized);
              }
            }
          }
          if (Array.isArray(diskData.disabledAccounts)) {
            for (const uid of diskData.disabledAccounts) {
              mergedDisabled.add(uid);
            }
          }
        } catch {
          // Ignore read error
        }
      }

      for (const s of sessionsById.values()) {
        const sanitized = { ...s };
        delete sanitized.token; // Zero raw credential exposure at rest
        mergedMap.set(sanitized.id, sanitized);
      }

      const payload = {
        sessions: Array.from(mergedMap.values()),
        disabledAccounts: Array.from(mergedDisabled),
      };

      const tmpFile = `${SESSIONS_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
      try {
        fs.renameSync(tmpFile, SESSIONS_FILE);
      } catch {
        fs.copyFileSync(tmpFile, SESSIONS_FILE);
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      console.warn('[SessionService] Failed to write persistent sessions to disk:', err.message);
    }
  }

  /**
   * Save session record asynchronously to Supabase public.user_sessions if table is deployed,
   * with automatic fallback to local persistence
   */
  private static async syncSessionToDatabase(record: AuthSessionRecord): Promise<void> {
    try {
      if (!supabaseAdmin) return;
      await supabaseAdmin.from('user_sessions').upsert({
        id: record.id,
        user_id: record.userId,
        role: record.role,
        token_hash: record.tokenHash || this.hashToken(record.token || record.id),
        created_at: new Date(record.createdAt).toISOString(),
        last_active_at: new Date(record.lastActiveAt).toISOString(),
        idle_expires_at: new Date(record.idleExpiresAt).toISOString(),
        absolute_expires_at: new Date(record.absoluteExpiresAt).toISOString(),
        revoked_at: record.revokedAt ? new Date(record.revokedAt).toISOString() : null,
        revoke_reason: record.revokeReason || null,
        last_heartbeat_at: record.lastHeartbeatAt ? new Date(record.lastHeartbeatAt).toISOString() : null,
        user_agent: record.userAgent || 'Unknown Device',
        ip_address: record.ipAddress || 'Unavailable',
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Table may not yet be migrated in dev/test; local persistent store ensures durability
    }
  }

  /**
   * Reload session records from disk (simulates backend restart / multi-instance hydration)
   */
  public static reloadFromPersistence(): void {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.sessions)) {
          sessionsById.clear();
          sessionsByTokenHash.clear();
          for (const s of data.sessions) {
            if (s && s.id) {
              const record: AuthSessionRecord = { ...s };
              if (!record.tokenHash && record.token) {
                record.tokenHash = this.hashToken(record.token);
              }
              delete (record as any).token;
              sessionsById.set(record.id, record);
              if (record.tokenHash) {
                sessionsByTokenHash.set(record.tokenHash, record);
              }
            }
          }
        }
        if (Array.isArray(data.disabledAccounts)) {
          disabledAccounts.clear();
          for (const uid of data.disabledAccounts) {
            disabledAccounts.add(uid);
          }
        }
      }
    } catch (err: any) {
      // In-memory cache preserved on temporary disk contention
    }
  }

  /**
   * Reset store for unit tests
   */
  public static resetForTesting(): void {
    sessionsById.clear();
    sessionsByTokenHash.clear();
    presenceStore.clear();
    disabledAccounts.clear();
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        fs.unlinkSync(SESSIONS_FILE);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Audit helper to verify that persistence contains NO plaintext tokens (SF-01)
   */
  public static getPersistedStateForAudit(): string {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        return fs.readFileSync(SESSIONS_FILE, 'utf8');
      }
    } catch {
      // Ignore
    }
    return '';
  }

  /**
   * Create an authoritative session record with an opaque, stable UUID
   * Decoupled from Bearer token; indexed via SHA-256 tokenHash (SF-01)
   */
  public static createSession(params: {
    sessionId?: string;
    token?: string;
    userId: string;
    role: string;
    nowMs?: number;
    userAgent?: string;
    ipAddress?: string;
  }): AuthSessionRecord {
    const now = params.nowMs ?? Date.now();
    const idleLimit = IDLE_TIMEOUT_MS[params.role] || IDLE_TIMEOUT_MS.client;
    const absLimit = ABSOLUTE_TIMEOUT_MS[params.role] || ABSOLUTE_TIMEOUT_MS.client;

    // Use token if provided; generate fallback
    const rawToken = params.token || params.sessionId || `token-${crypto.randomBytes(16).toString('hex')}`;
    const tokenHash = this.hashToken(rawToken);

    // Assign an opaque UUID if sessionId is missing or looks like a raw JWT/token
    const isOpaqueUuid = params.sessionId && /^[0-9a-f-]{36}$/i.test(params.sessionId);
    const opaqueId = isOpaqueUuid ? params.sessionId! : crypto.randomUUID();

    const record: AuthSessionRecord = {
      id: opaqueId,
      tokenHash,
      userId: params.userId,
      role: params.role,
      createdAt: now,
      lastActiveAt: now,
      idleExpiresAt: now + idleLimit,
      absoluteExpiresAt: now + absLimit,
      lastHeartbeatAt: now,
      userAgent: params.userAgent || 'Unknown Device',
      ipAddress: params.ipAddress || 'Unavailable',
      updatedAt: now,
    };

    sessionsById.set(opaqueId, record);
    sessionsByTokenHash.set(tokenHash, record);
    presenceStore.set(params.userId, now);

    this.saveToPersistence();
    void this.syncSessionToDatabase(record);
    return { ...record };
  }

  public static async createSessionAsync(params: {
    sessionId?: string;
    token?: string;
    userId: string;
    role: string;
    nowMs?: number;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthSessionRecord> {
    const record = this.createSession(params);
    await this.syncSessionToDatabase(record);
    return record;
  }

  /**
   * Internal session resolver: checks in-memory cache by UUID or token hash,
   * falls back to persistent store on miss
   */
  private static findSession(identifier: string): AuthSessionRecord | undefined {
    if (!identifier) return undefined;

    // 1. Direct lookup by opaque UUID
    let s = sessionsById.get(identifier);
    if (s) return s;

    // 2. Direct lookup by tokenHash (if caller passed a 64-char hex hash)
    s = sessionsByTokenHash.get(identifier);
    if (s) return s;

    // 3. Lookup by hashing raw token
    const hash = this.hashToken(identifier);
    s = sessionsByTokenHash.get(hash);
    if (s) return s;

    // 4. Reload from disk on miss
    this.reloadFromPersistence();
    s = sessionsById.get(identifier) || sessionsByTokenHash.get(identifier) || sessionsByTokenHash.get(hash);
    return s;
  }

  /**
   * Retrieve session by token or opaque session ID
   */
  public static getSession(identifier: string): AuthSessionRecord | undefined {
    const s = this.findSession(identifier);
    return s ? { ...s } : undefined;
  }

  public static async getSessionAsync(identifier: string): Promise<AuthSessionRecord | undefined> {
    return this.getSession(identifier);
  }

  public static getSessionById(id: string): AuthSessionRecord | undefined {
    let s = sessionsById.get(id);
    if (!s) {
      this.reloadFromPersistence();
      s = sessionsById.get(id);
    }
    return s ? { ...s } : undefined;
  }

  public static async getSessionByIdAsync(id: string): Promise<AuthSessionRecord | undefined> {
    return this.getSessionById(id);
  }

  public static getSessionByToken(token: string): AuthSessionRecord | undefined {
    return this.findSession(token);
  }

  public static async getSessionByBearerAsync(token: string): Promise<AuthSessionRecord | undefined> {
    return this.findSession(token);
  }

  /**
   * Validate session state (idle expiry, absolute expiry, revocation, account disablement)
   * Background heartbeats (`isHeartbeat = true`) never extend `idleExpiresAt` (SESSION-01)
   */
  public static validateSession(
    identifier: string,
    nowMs: number = Date.now(),
    isHeartbeat: boolean = false
  ): {
    valid: boolean;
    reason?: 'SESSION_NOT_FOUND' | 'SESSION_REVOKED' | 'SESSION_IDLE_EXPIRED' | 'SESSION_ABSOLUTE_EXPIRED' | 'ACCOUNT_DISABLED';
    session?: AuthSessionRecord;
  } {
    const session = this.findSession(identifier);
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
      session.updatedAt = nowMs;
      this.saveToPersistence();
      void this.syncSessionToDatabase(session);
    }

    presenceStore.set(session.userId, nowMs);
    return { valid: true, session: { ...session } };
  }

  public static async validateSessionAsync(
    identifier: string,
    nowMs: number = Date.now(),
    isHeartbeat: boolean = false
  ) {
    return this.validateSession(identifier, nowMs, isHeartbeat);
  }

  /**
   * Explicit server-confirmed session extension ("Stay signed in").
   * Resets idle timeout up to the absolute session ceiling.
   */
  public static extendSession(identifier: string, nowMs: number = Date.now()): {
    valid: boolean;
    reason?: string;
    session?: AuthSessionRecord;
  } {
    const session = this.findSession(identifier);
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

    const idleLimit = IDLE_TIMEOUT_MS[session.role] || IDLE_TIMEOUT_MS.client;
    session.lastActiveAt = nowMs;
    session.idleExpiresAt = Math.min(session.absoluteExpiresAt, nowMs + idleLimit);
    session.updatedAt = nowMs;
    presenceStore.set(session.userId, nowMs);

    this.saveToPersistence();
    void this.syncSessionToDatabase(session);
    return { valid: true, session: { ...session } };
  }

  public static async extendSessionAsync(identifier: string, nowMs: number = Date.now()) {
    const result = this.extendSession(identifier, nowMs);
    if (result.session) {
      await this.syncSessionToDatabase(result.session);
    }
    return result;
  }

  /**
   * Rotate session for token refresh while strictly preserving:
   * - Logical identity (id UUID)
   * - Original absolute expiry (absoluteExpiresAt)
   * - Inactivity expiry (lastActiveAt and idleExpiresAt) - SF-03!
   */
  public static rotateSession(
    oldToken: string,
    newToken: string,
    userId: string,
    role: string,
    nowMs: number = Date.now(),
    recordActivity: boolean = false
  ): { valid: boolean; session?: AuthSessionRecord; reason?: string } {
    const oldHash = this.hashToken(oldToken);
    let existing = sessionsByTokenHash.get(oldHash);
    if (!existing) {
      this.reloadFromPersistence();
      existing = sessionsByTokenHash.get(oldHash) || this.findSession(oldToken);
    }
    if (!existing) {
      return { valid: false, reason: 'SESSION_NOT_FOUND' };
    }

    if (existing.revokedAt) {
      return { valid: false, reason: 'SESSION_REVOKED' };
    }
    if (disabledAccounts.has(existing.userId)) {
      return { valid: false, reason: 'ACCOUNT_DISABLED' };
    }
    if (nowMs >= existing.absoluteExpiresAt) {
      return { valid: false, reason: 'SESSION_ABSOLUTE_EXPIRED' };
    }
    if (nowMs >= existing.idleExpiresAt) {
      return { valid: false, reason: 'SESSION_IDLE_EXPIRED' };
    }

    sessionsByTokenHash.delete(oldHash);

    const newHash = this.hashToken(newToken);
    existing.tokenHash = newHash;
    delete (existing as any).token;

    // SF-03: Decouple background token refresh from idle activity extension
    if (recordActivity) {
      const idleLimit = IDLE_TIMEOUT_MS[existing.role] || IDLE_TIMEOUT_MS.client;
      existing.lastActiveAt = nowMs;
      existing.idleExpiresAt = Math.min(existing.absoluteExpiresAt, nowMs + idleLimit);
    }
    existing.updatedAt = nowMs;

    sessionsByTokenHash.set(newHash, existing);
    presenceStore.set(existing.userId, nowMs);

    this.saveToPersistence();
    void this.syncSessionToDatabase(existing);
    return { valid: true, session: { ...existing } };
  }

  public static async rotateSessionAsync(
    oldToken: string,
    newToken: string,
    userId: string,
    role: string,
    nowMs: number = Date.now(),
    recordActivity: boolean = false
  ) {
    const result = this.rotateSession(oldToken, newToken, userId, role, nowMs, recordActivity);
    if (result.session) {
      await this.syncSessionToDatabase(result.session);
    }
    return result;
  }

  /**
   * Get safe metadata for all active sessions of a user (SM-05, SM-19)
   * Guarantees NO raw bearer tokens, NO fullId, and realistic device metadata.
   */
  public static getUserSessions(
    userId: string,
    currentToken?: string,
    nowMs: number = Date.now()
  ): SessionListDTO[] {
    this.reloadFromPersistence();
    const currentHash = currentToken ? this.hashToken(currentToken) : undefined;
    const results: SessionListDTO[] = [];
    for (const session of sessionsById.values()) {
      if (
        session.userId === userId &&
        !session.revokedAt &&
        nowMs < session.absoluteExpiresAt &&
        nowMs < session.idleExpiresAt
      ) {
        const isCurrent = Boolean(
          currentToken &&
          (session.tokenHash === currentHash || session.id === currentToken)
        );
        results.push({
          id: session.id, // Opaque UUID identifier
          isCurrent,
          role: session.role,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          idleExpiresAt: session.idleExpiresAt,
          absoluteExpiresAt: session.absoluteExpiresAt,
          lastHeartbeatAt: session.lastHeartbeatAt,
          userAgent: session.userAgent || 'Unknown Device',
          ipAddress: session.ipAddress || 'Unavailable',
        });
      }
    }
    return results;
  }

  public static async getUserSessionsAsync(
    userId: string,
    currentToken?: string,
    nowMs: number = Date.now()
  ): Promise<SessionListDTO[]> {
    return this.getUserSessions(userId, currentToken, nowMs);
  }

  /**
   * Record informational presence heartbeat (SF-04, SESSION-01)
   * Validation-first: checks session existence, ownership, and validity BEFORE recording presence.
   * Updates session.lastHeartbeatAt without extending idle session expiry.
   */
  public static recordHeartbeat(identifier: string, userId: string, nowMs: number = Date.now()): boolean {
    const session = this.findSession(identifier);
    if (!session) {
      return false; // SF-04: Untracked sessions reject immediately
    }

    if (userId && session.userId !== userId) {
      return false; // SF-04: Mismatched owner rejects immediately
    }

    const validation = this.validateSession(identifier, nowMs, true);
    if (!validation.valid) {
      return false;
    }

    session.lastHeartbeatAt = nowMs;
    session.updatedAt = nowMs;
    presenceStore.set(session.userId, nowMs);

    this.saveToPersistence();
    void this.syncSessionToDatabase(session);
    return true;
  }

  public static async recordHeartbeatAsync(
    identifier: string,
    userId: string,
    nowMs: number = Date.now()
  ): Promise<boolean> {
    const ok = this.recordHeartbeat(identifier, userId, nowMs);
    const session = this.findSession(identifier);
    if (session && ok) {
      await this.syncSessionToDatabase(session);
    }
    return ok;
  }

  public static isUserOnline(userId: string, nowMs: number = Date.now()): boolean {
    const lastHeartbeat = presenceStore.get(userId);
    if (!lastHeartbeat) return false;
    return nowMs - lastHeartbeat <= PRESENCE_TTL_MS;
  }

  /**
   * Revoke a specific session with server-side ownership enforcement (SM-20, SF-06)
   * Monotonic: once revoked, cannot be overwritten or un-revoked.
   */
  public static revokeSession(
    sessionIdOrOptions: string | RevokeSessionOptions,
    requestingUserIdOrReason?: string,
    reason?: string,
    nowMs: number = Date.now()
  ): boolean {
    let targetId: string;
    let requestingUserId: string | undefined;
    let actualReason: string = 'user_logout';
    let timestamp: number = nowMs;

    if (typeof sessionIdOrOptions === 'object' && sessionIdOrOptions !== null) {
      // Typed options invocation (SF-06)
      targetId = sessionIdOrOptions.sessionId;
      requestingUserId = sessionIdOrOptions.requestingUserId;
      actualReason = sessionIdOrOptions.reason;
      timestamp = sessionIdOrOptions.nowMs ?? nowMs;

      // Strict enum validation for typed options (SF-06)
      if (!VALID_REVOKE_REASONS.includes(actualReason as RevokeReason)) {
        return false;
      }
    } else {
      // Positional invocation with backward compatibility
      targetId = sessionIdOrOptions;
      if (reason !== undefined) {
        requestingUserId = requestingUserIdOrReason;
        actualReason = reason;
      } else if (requestingUserIdOrReason !== undefined) {
        const potentialTarget = this.findSession(targetId);
        if (potentialTarget && requestingUserIdOrReason === potentialTarget.userId) {
          requestingUserId = requestingUserIdOrReason;
        } else {
          actualReason = requestingUserIdOrReason;
        }
      }
    }

    if (!targetId) {
      return false;
    }

    // Exact lookup by opaque ID or token with persistence fallback
    const target = this.findSession(targetId);
    if (!target) {
      return false;
    }

    // Server-side ownership verification
    if (requestingUserId && target.userId !== requestingUserId) {
      return false;
    }

    // Monotonicity: cannot overwrite or re-revoke an already revoked session
    if (target.revokedAt) {
      return false;
    }

    target.revokedAt = timestamp;
    target.revokeReason = actualReason as RevokeReason;
    target.updatedAt = timestamp;

    // Check if user has other active sessions before clearing presence
    const remaining = Array.from(sessionsById.values()).filter(
      (s) => s.userId === target.userId && !s.revokedAt && timestamp < s.idleExpiresAt
    );
    if (remaining.length === 0) {
      presenceStore.delete(target.userId);
    }

    this.saveToPersistence();
    void this.syncSessionToDatabase(target);
    return true;
  }

  public static async revokeSessionAsync(
    sessionIdOrOptions: string | RevokeSessionOptions,
    requestingUserIdOrReason?: string,
    reason?: string,
    nowMs: number = Date.now()
  ): Promise<boolean> {
    const ok = this.revokeSession(sessionIdOrOptions, requestingUserIdOrReason, reason, nowMs);
    const targetId = typeof sessionIdOrOptions === 'object' ? sessionIdOrOptions.sessionId : sessionIdOrOptions;
    const session = this.findSession(targetId);
    if (session && ok) {
      await this.syncSessionToDatabase(session);
    }
    return ok;
  }

  /**
   * Revoke all active sessions for a user (SM-22)
   */
  public static revokeAllUserSessions(
    userId: string,
    reason: RevokeReason = 'all_device_revocation',
    nowMs: number = Date.now()
  ): number {
    this.reloadFromPersistence();
    let count = 0;
    for (const session of sessionsById.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = nowMs;
        session.revokeReason = reason;
        session.updatedAt = nowMs;
        count++;
        void this.syncSessionToDatabase(session);
      }
    }
    presenceStore.delete(userId);
    this.saveToPersistence();

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

  public static async revokeAllUserSessionsAsync(
    userId: string,
    reason: RevokeReason = 'all_device_revocation',
    nowMs: number = Date.now()
  ): Promise<number> {
    return this.revokeAllUserSessions(userId, reason, nowMs);
  }

  /**
   * Disable user account and revoke all sessions (SM-23)
   */
  public static disableUserAccount(userId: string, reason: RevokeReason = 'account_disabled'): void {
    this.revokeAllUserSessions(userId, reason);
    disabledAccounts.add(userId);
    this.saveToPersistence();
  }

  public static async disableUserAccountAsync(userId: string, reason: RevokeReason = 'account_disabled'): Promise<void> {
    this.disableUserAccount(userId, reason);
  }
}

// Initial hydration from persistence on module startup
SessionService.reloadFromPersistence();

export default SessionService;
