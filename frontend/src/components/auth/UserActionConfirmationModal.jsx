import React, { useState, useEffect } from 'react';
import {
  IconAlertTriangle,
  IconShieldLock,
  IconX,
} from '@tabler/icons-react';

/**
 * UserActionConfirmationModal Component
 * Two-step confirmation modal for high-impact account actions (Suspension & Role Changes)
 * Requires documented justification before allowing account suspension
 */
export default function UserActionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'suspend', // 'suspend' | 'activate' | 'role_change'
  userName = 'User',
  userEmail = '',
  currentRole = '',
  newRole = '',
  isSubmitting = false,
}) {
  const [reason, setReason] = useState('');
  const isSuspend = actionType === 'suspend';
  const isRoleChange = actionType === 'role_change';

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const canSubmit = !isSuspend || reason.trim().length >= 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    onConfirm(reason.trim());
  };

  const getModalTitle = () => {
    if (isSuspend) return 'Suspend User Account';
    if (isRoleChange) return 'Confirm Role Modification';
    return 'Reactivate User Account';
  };

  const getModalSubtitle = () => {
    if (isRoleChange) return 'Privilege escalation & access control';
    return 'Confirm governance action';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                isSuspend
                  ? 'bg-red-50 text-[#FF6B6B]'
                  : isRoleChange && newRole === 'admin'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-teal-50 text-[#0F766E]'
              }`}
            >
              {isSuspend ? (
                <IconAlertTriangle className="w-5 h-5" />
              ) : (
                <IconShieldLock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="modal-title" className="text-sm font-semibold text-[#1E293B]">
                {getModalTitle()}
              </h3>
              <p className="text-xs text-[#64748B]">{getModalSubtitle()}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-[#64748B] hover:text-[#1E293B] rounded-lg transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-[#334155] leading-relaxed">
            {isSuspend ? (
              <p>
                You are about to suspend{' '}
                <strong className="text-[#1E293B] font-semibold">{userName}</strong> (
                <span className="font-mono text-[11px] text-[#64748B]">{userEmail}</span>).
                All active session tokens will be revoked immediately and access will be blocked.
              </p>
            ) : isRoleChange ? (
              <div className="space-y-3">
                <p>
                  You are modifying permissions for{' '}
                  <strong className="text-[#1E293B] font-semibold">{userName}</strong> (
                  <span className="font-mono text-[11px] text-[#64748B]">{userEmail}</span>).
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Role</span>
                    <span className="font-semibold text-slate-700 capitalize">{currentRole || 'client'}</span>
                  </div>
                  <span className="text-slate-400 font-bold">→</span>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Role</span>
                    <span className="font-semibold text-[#0F766E] capitalize">{newRole}</span>
                  </div>
                </div>
                {newRole === 'admin' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                    <strong>Elevated Authority Warning:</strong> Granting Super Administrator privileges provides full system access, including account suspension and financial governance.
                  </div>
                )}
              </div>
            ) : (
              <p>
                You are about to restore full platform access for{' '}
                <strong className="text-[#1E293B] font-semibold">{userName}</strong> (
                <span className="font-mono text-[11px] text-[#64748B]">{userEmail}</span>).
              </p>
            )}
          </div>

          {isSuspend && (
            <div>
              <label
                htmlFor="suspension-reason"
                className="block text-xs font-semibold text-[#1E293B] mb-1.5"
              >
                Documented Justification <span className="text-[#FF6B6B]">*</span>
              </label>
              <textarea
                id="suspension-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter justification for compliance audit (min 5 chars)..."
                required
                className="w-full text-xs p-2.5 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B] transition-colors"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                This rationale will be recorded permanently in the platform audit trail.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition-colors border border-[#E2E8F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm ${
                isSuspend
                  ? 'bg-[#FF6B6B] hover:bg-[#EE5A5A] disabled:opacity-50'
                  : 'bg-[#0F766E] hover:bg-[#0D635C] disabled:opacity-50'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : isSuspend
                ? 'Confirm Suspension'
                : isRoleChange
                ? 'Confirm Role Change'
                : 'Confirm Reactivation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
