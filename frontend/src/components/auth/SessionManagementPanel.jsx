import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import {
  IconDevices,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import AuthFeedback from './AuthFeedback';

/**
 * Modern SaaS SessionManagementPanel
 * Allows authenticated users to view active browser sessions and revoke devices.
 */
export default function SessionManagementPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await authService.getActiveSessions();
      const sessionList = res?.data?.sessions || res?.sessions || [];
      setSessions(sessionList);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load active sessions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      setFeedback(null);
      await authService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setFeedback({ type: 'success', message: 'Session successfully revoked.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke session.' });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0F766E]/10 rounded-lg text-[#0F766E]">
            <IconDevices className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">Active Sessions</h3>
            <p className="text-xs text-[#64748B]">
              Devices currently signed in to your account
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSessions}
          disabled={loading}
          className="p-1.5 text-[#64748B] hover:text-[#0F766E] rounded-md hover:bg-[#F8FAFC] transition-colors"
          title="Refresh Sessions"
          aria-label="Refresh Sessions"
        >
          <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <AuthFeedback type={feedback.type} message={feedback.message} />
      )}

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-xs text-[#64748B]">
          <IconRefresh className="w-5 h-5 animate-spin text-[#0F766E] mb-2" />
          Loading active sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#64748B]">
          No active sessions found.
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0]">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#1E293B]">
                    {session.userAgent || 'Web Browser'}
                  </span>
                  {session.isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      <IconCheck className="w-3 h-3" /> Current Device
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#64748B] flex flex-wrap gap-x-4 gap-y-1">
                  <span>IP: {session.ipAddress || 'Unknown IP'}</span>
                  <span>
                    Started: {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                  {session.idleExpiresAt && (
                    <span>
                      Idle expires: {new Date(session.idleExpiresAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revokingId === session.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  <span>{revokingId === session.id ? 'Revoking...' : 'Revoke'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
