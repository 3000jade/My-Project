// ==============================================================================
// Cross-Tab Session, Presence, Return-URL & Sensitive Cache Coordinator
// Enforces SESSION-01, SESSION-02, and SESSION-03
// ==============================================================================

const CHANNEL_NAME = 'cp_kerby_session_sync';
const SENSITIVE_STORAGE_PREFIXES = [
  'inquiry_draft_',
  'inquiry_cache_',
  'ai_summary_cache_',
  'chat_pending_queue_',
  'broker_audit_cache_',
];

let activeRefreshPromise = null;
let listeners = new Set();
let broadcastChannel = null;

function getChannel() {
  if (broadcastChannel) return broadcastChannel;
  if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
    try {
      broadcastChannel = new window.BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        const payload = event?.data;
        if (!payload) return;
        if (payload.type === 'LOGOUT' || payload.type === 'ACCOUNT_SWITCH' || payload.type === 'ROLE_REVOKED') {
          clearSensitiveCaches();
        }
        listeners.forEach((cb) => {
          try {
            cb(payload);
          } catch (err) {
            console.warn('[sessionCoordinator] Listener error:', err);
          }
        });
      };
    } catch (err) {
      console.warn('[sessionCoordinator] BroadcastChannel unavailable:', err);
    }
  }
  return broadcastChannel;
}

/**
 * Validate internal returnTo paths and reject external open redirects (SESSION-03)
 */
export function validateReturnTo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';
  const trimmed = rawUrl.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.toLowerCase().startsWith('/\\')
  ) {
    return '/';
  }
  return trimmed;
}

/**
 * Clear sensitive inquiry drafts, private chat buffers, and AI summary caches
 * from localStorage and sessionStorage upon logout or account switch (SESSION-02)
 */
export function clearSensitiveCaches() {
  if (typeof window === 'undefined') return;
  try {
    const storages = [window.localStorage, window.sessionStorage].filter(Boolean);
    for (const store of storages) {
      const keysToRemove = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && SENSITIVE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => store.removeItem(k));
    }
  } catch (err) {
    console.warn('[sessionCoordinator] Failed clearing sensitive caches:', err);
  }
}

/**
 * Serialize token refresh requests across concurrent calls so multiple tabs/components
 * do not trigger duplicate refresh rotations (SESSION-02)
 */
export async function executeSerializedRefresh(refreshFn) {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  activeRefreshPromise = (async () => {
    try {
      return await refreshFn();
    } finally {
      activeRefreshPromise = null;
    }
  })();
  return activeRefreshPromise;
}

/**
 * Broadcast a session lifecycle event across all open tabs
 */
export function broadcastSessionEvent(type, data = {}) {
  if (type === 'LOGOUT' || type === 'ACCOUNT_SWITCH' || type === 'ROLE_REVOKED') {
    clearSensitiveCaches();
  }
  const eventPayload = {
    type,
    timestamp: Date.now(),
    ...data,
  };
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(eventPayload);
    } catch (err) {
      console.warn('[sessionCoordinator] postMessage error:', err);
    }
  }
  listeners.forEach((cb) => {
    try {
      cb(eventPayload);
    } catch (err) {
      console.warn('[sessionCoordinator] Local listener error:', err);
    }
  });
}

export function subscribeSessionEvents(callback) {
  getChannel();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function saveInquiryDraft(inquiryId, text) {
  if (typeof window === 'undefined' || !inquiryId) return;
  try {
    const key = `inquiry_draft_${inquiryId}`;
    if (!text) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, text);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function getInquiryDraft(inquiryId) {
  if (typeof window === 'undefined' || !inquiryId) return '';
  try {
    return window.localStorage.getItem(`inquiry_draft_${inquiryId}`) || '';
  } catch {
    return '';
  }
}

export const sessionCoordinator = {
  validateReturnTo,
  clearSensitiveCaches,
  executeSerializedRefresh,
  broadcastSessionEvent,
  subscribeSessionEvents,
  saveInquiryDraft,
  getInquiryDraft,
  resetForTesting() {
    activeRefreshPromise = null;
    listeners.clear();
  },
};

export default sessionCoordinator;
