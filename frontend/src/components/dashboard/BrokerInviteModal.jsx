import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardModal from './DashboardModal';
import { Spinner } from '../ui';
import { invitationService } from '../../services/invitationService';

/**
 * BrokerInviteModal
 * Standalone modal for issuing single-use 72-hour agent onboarding invitations.
 */
export default function BrokerInviteModal({ isOpen, onClose, onSuccess }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAgency, setInviteAgency] = useState('Human Shelter Realty Manila');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const handleSendInvite = async (e, allowReissue = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setInviteSubmitting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      await invitationService.createInvitation({
        email: inviteEmail,
        brokerAgency: inviteAgency,
        message: inviteMessage,
        allowReissue,
      });

      const sentEmail = inviteEmail;
      setInviteSuccess(`Invitation dispatched to ${sentEmail}.`);
      setInviteEmail('');
      setInviteMessage('');
      if (onSuccess) {
        await onSuccess({ email: sentEmail });
      }
      setTimeout(() => {
        setInviteSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setInviteError(err.message || 'Failed to dispatch invitation.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleReissueInvite = () => {
    handleSendInvite(null, true);
  };

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Agent Invitation"
      subtitle="Generate a single-use onboarding token valid for 72 hours and dispatch via email."
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E293B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invite-agent-form"
            disabled={inviteSubmitting}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {inviteSubmitting && <Spinner size="sm" className="text-white animate-spin" />}
            {inviteSubmitting ? 'Dispatching...' : 'Dispatch Invitation'}
          </button>
        </div>
      }
    >
      <form id="invite-agent-form" onSubmit={handleSendInvite} className="space-y-4">
        {inviteError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            <p>{inviteError}</p>
            {inviteError.toLowerCase().includes('already exists') && (
              <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between gap-3">
                <span className="text-[11px] text-red-800">
                  Active pending invite found. Generate fresh 72h onboarding token?
                </span>
                <button
                  type="button"
                  onClick={handleReissueInvite}
                  disabled={inviteSubmitting}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  Re-issue Invite
                </button>
              </div>
            )}
          </div>
        )}
        {inviteSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
            {inviteSuccess}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
            Prospective Agent Email *
          </label>
          <input
            type="email"
            required
            placeholder="agent@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
            Brokerage / Branch Agency
          </label>
          <input
            type="text"
            value={inviteAgency}
            onChange={(e) => setInviteAgency(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
            Personalized Welcome Note (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add welcoming instructions or office orientation details..."
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
        </div>

        <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#E2E8F0]">
          Prefer the complete onboarding wizard?{' '}
          <Link
            to="/broker/agents/invite"
            onClick={onClose}
            className="text-[#0F766E] font-semibold hover:underline"
          >
            Open Full Multi-Step Invite Wizard →
          </Link>
        </div>
      </form>
    </DashboardModal>
  );
}
