import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import sessionCoordinator from '../../services/sessionCoordinator';
import SessionTimeoutModal from './SessionTimeoutModal';

/**
 * SessionWatcher
 * Monitors user inactivity, role-specific idle timeouts (Staff: 30m / Client: 60m),
 * enforces server-confirmed session extension via POST /api/auth/extend-session,
 * prevents background timer drift via visibility change re-checks,
 * and mounts the SessionTimeoutModal.
 */
export default function SessionWatcher() {
  const { user, logout } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  // Role policies: Staff (admin, broker, agent) = 30 min (1800s), Client = 60 min (3600s)
  const isStaff = user && ['admin', 'broker', 'agent'].includes(user.role);
  const maxIdleSeconds = isStaff ? 30 * 60 : 60 * 60;
  const warningWindowSeconds = 120; // Show modal 2 minutes before idle expiry

  const lastActivityRef = useRef(Date.now());
  const lastServerSyncRef = useRef(Date.now());
  const isExtendingRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const prevUserRef = useRef(user);
  const SERVER_SYNC_INTERVAL_MS = 5 * 60 * 1000; // Sync active DOM interactions to server at most once per 5m

  // Reset activity tracker and modal state whenever user logs in, logs out, or switches accounts
  useEffect(() => {
    if (user && (!prevUserRef.current || prevUserRef.current.id !== user.id)) {
      const now = Date.now();
      lastActivityRef.current = now;
      lastServerSyncRef.current = now;
      isLoggingOutRef.current = false;
      setIsModalOpen(false);
      setSecondsRemaining(warningWindowSeconds);
    } else if (!user && prevUserRef.current) {
      const now = Date.now();
      lastActivityRef.current = now;
      lastServerSyncRef.current = now;
      isLoggingOutRef.current = false;
      setIsModalOpen(false);
    }
    prevUserRef.current = user;
  }, [user, warningWindowSeconds]);

  // Throttled activity tracker (resets idle clock only when warning is NOT showing, and syncs to server every 5m)
  const handleUserActivity = useCallback(() => {
    // Once warning modal is active, user must explicitly click "Extend Session"
    if (!isModalOpen) {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastServerSyncRef.current >= SERVER_SYNC_INTERVAL_MS && !isExtendingRef.current) {
        lastServerSyncRef.current = now;
        Promise.resolve(authService.extendSession?.()).catch(() => {});
      }
    }
  }, [isModalOpen, SERVER_SYNC_INTERVAL_MS]);

  // Extend session: hits backend server extension endpoint and updates local timestamp
  const handleExtendSession = async () => {
    if (isExtendingRef.current) return;
    try {
      isExtendingRef.current = true;
      await authService.extendSession();
      lastActivityRef.current = Date.now();
      setIsModalOpen(false);
      setSecondsRemaining(warningWindowSeconds);
      sessionCoordinator.broadcastSessionEvent('SESSION_EXTENDED', {
        userId: user?.id,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[SessionWatcher] Server session extension failed:', err);
      // If server rejected (e.g. absolute ceiling reached or revoked), log out
      if (!isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        await logout();
      }
    } finally {
      isExtendingRef.current = false;
    }
  };

  const handleLogoutNow = async () => {
    setIsModalOpen(false);
    if (!isLoggingOutRef.current) {
      isLoggingOutRef.current = true;
      await logout();
    }
  };

  // Activity event listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [user, handleUserActivity]);

  // Main countdown & authoritative deadline ticker
  useEffect(() => {
    if (!user) {
      setIsModalOpen(false);
      return;
    }

    const checkTimeout = () => {
      if (isLoggingOutRef.current) return;

      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remainingSeconds = maxIdleSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        // Inactivity ceiling reached - log out immediately
        isLoggingOutRef.current = true;
        setIsModalOpen(false);
        logout();
      } else if (remainingSeconds <= warningWindowSeconds) {
        // Warning threshold reached
        setIsModalOpen(true);
        setSecondsRemaining(remainingSeconds);
      } else {
        if (isModalOpen) {
          setIsModalOpen(false);
        }
      }
    };

    // Run every 1000ms
    const interval = setInterval(checkTimeout, 1000);

    // Re-check on visibility change (recovers from browser background tab throttling)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Cross-tab synchronization
    const unsubscribe = sessionCoordinator.subscribeSessionEvents((event) => {
      if (event.type === 'SESSION_EXTENDED') {
        lastActivityRef.current = Date.now();
        isLoggingOutRef.current = false;
        setIsModalOpen(false);
      } else if (event.type === 'LOGOUT' || event.type === 'ROLE_REVOKED') {
        lastActivityRef.current = Date.now();
        isLoggingOutRef.current = false;
        setIsModalOpen(false);
      }
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [user, maxIdleSeconds, isModalOpen, logout]);

  if (!user) return null;

  return (
    <SessionTimeoutModal
      isOpen={isModalOpen}
      secondsRemaining={secondsRemaining}
      onExtendSession={handleExtendSession}
      onLogout={handleLogoutNow}
    />
  );
}
