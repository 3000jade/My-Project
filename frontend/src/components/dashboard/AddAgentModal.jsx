import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, MailPlus, ChevronRight, ShieldCheck, Info } from 'lucide-react';
import DashboardModal from './DashboardModal';
import { Spinner, Badge } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field, FieldLabel } from '../ui/field';
import { Alert, AlertDescription } from '../ui/alert';
import { agentService } from '../../services/agentService';
import { invitationService } from '../../services/invitationService';

/**
 * AddAgentModal
 * Unified entry modal for Brokers: choose between creating an agent directly
 * or dispatching a 72-hour self-onboarding invitation email.
 */
export default function AddAgentModal({ isOpen, onClose, onInviteSuccess, onCreateSuccess }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'create' | 'invite'

  // Create Agent state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    access_tier: 'standard_agent',
    can_create_listings: false,
    can_edit_listings: false,
    prc_license_no: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Invite Agent state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAgency, setInviteAgency] = useState('Human Shelter Realty Manila');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMode('choose');
      setCreateError('');
      setInviteError('');
      setInviteSuccess('');
      return;
    }
  }, [isOpen]);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');
    try {
      const created = await agentService.createAgent({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        access_tier: 'standard_agent',
        can_create_listings: Boolean(createForm.can_create_listings),
        permission_grants: {
          create_listings: Boolean(createForm.can_create_listings),
          edit_listings: Boolean(createForm.can_edit_listings),
        },
        prc_license_no: createForm.prc_license_no.trim() || undefined,
      });
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        access_tier: 'standard_agent',
        can_create_listings: false,
        can_edit_listings: false,
        prc_license_no: '',
      });
      if (onCreateSuccess) {
        await onCreateSuccess(created);
      }
      onClose();
    } catch (err) {
      setCreateError(err?.message || 'Failed to create agent.');
    } finally {
      setCreateSubmitting(false);
    }
  };

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
      if (onInviteSuccess) {
        await onInviteSuccess({ email: sentEmail });
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

  const modalTitle =
    mode === 'create'
      ? 'Create Agent'
      : mode === 'invite'
        ? 'Invite Agent'
        : 'Add Agent';

  const modalSubtitle =
    mode === 'create'
      ? "Fill in the agent's basic info, branch, and permissions."
      : mode === 'invite'
        ? "Send a 3-day sign-up link to the agent's email."
        : 'Choose how you want to add this agent.';

  const modalActions =
    mode === 'choose' ? (
      <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4">
        Cancel
      </Button>
    ) : mode === 'create' ? (
      <div className="flex items-center justify-between w-full gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode('choose')}
          className="h-10 px-3 text-slate-600 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-agent-form"
            disabled={createSubmitting}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white gap-1.5"
          >
            {createSubmitting && <Spinner size="sm" className="text-white animate-spin" />}
            {createSubmitting ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between w-full gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode('choose')}
          className="h-10 px-3 text-slate-600 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-agent-form"
            disabled={inviteSubmitting}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white gap-1.5"
          >
            {inviteSubmitting && <Spinner size="sm" className="text-white animate-spin" />}
            {inviteSubmitting ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </div>
    );

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      actions={modalActions}
    >
      {mode === 'choose' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="group text-left p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:bg-teal-50/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
                  <UserPlus className="size-5" />
                </div>
                <Badge variant="default" className="text-[10px]">
                  Quick Add
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
                  Create Agent
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Enter the agent&apos;s details yourself and add them right away.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#0F766E]">
              <span>Continue</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('invite')}
            className="group text-left p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:bg-teal-50/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-[#E2E8F0] flex items-center justify-center text-[#1E293B]">
                  <MailPlus className="size-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Email Link
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
                  Invite Agent
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Send an email link so the agent can fill in their own details and upload IDs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#0F766E]">
              <span>Continue</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form id="create-agent-form" onSubmit={handleCreateAgent} className="space-y-4">
          {createError && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="create-agent-name" className="text-xs font-semibold text-[#1E293B]">
                Full Name *
              </FieldLabel>
              <Input
                id="create-agent-name"
                type="text"
                required
                placeholder="e.g. Elena Rossi"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-agent-email" className="text-xs font-semibold text-[#1E293B]">
                Email *
              </FieldLabel>
              <Input
                id="create-agent-email"
                type="email"
                required
                placeholder="agent@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-agent-phone" className="text-xs font-semibold text-[#1E293B]">
                Phone Number *
              </FieldLabel>
              <Input
                id="create-agent-phone"
                type="tel"
                required
                placeholder="+63 917 000 0000"
                value={createForm.phone}
                onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-agent-prc" className="text-xs font-semibold text-[#1E293B]">
                PRC License Number (Optional)
              </FieldLabel>
              <Input
                id="create-agent-prc"
                type="text"
                placeholder="PRC-REB-0000000"
                value={createForm.prc_license_no}
                onChange={(e) => setCreateForm((p) => ({ ...p, prc_license_no: e.target.value }))}
                className="h-10 text-xs font-mono"
              />
            </Field>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <span className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#0F766E]" />
              Listing Permissions
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(createForm.can_create_listings)}
                  onChange={(e) => setCreateForm((p) => ({ ...p, can_create_listings: e.target.checked }))}
                  className="w-4 h-4 accent-[#0F766E] cursor-pointer shrink-0"
                />
                <span>Create listings</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(createForm.can_edit_listings)}
                  onChange={(e) => setCreateForm((p) => ({ ...p, can_edit_listings: e.target.checked }))}
                  className="w-4 h-4 accent-[#0F766E] cursor-pointer shrink-0"
                />
                <span>Edit listings</span>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] text-[11px] text-[#64748B]">
            <Info className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>
              New agents start as Pending and can set their password on the login page.
            </span>
          </div>
        </form>
      )}

      {mode === 'invite' && (
        <form id="invite-agent-form" onSubmit={handleSendInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              <p>{inviteError}</p>
              {inviteError.toLowerCase().includes('already exists') && (
                <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-red-800">
                    An invite is already pending. Send a new 3-day link?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendInvite(null, true)}
                    disabled={inviteSubmitting}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Resend Invite
                  </button>
                </div>
              )}
            </div>
          )}

          {inviteSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 font-medium">
              {inviteSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              Agent Email *
            </label>
            <input
              type="email"
              required
              placeholder="agent@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              Brokerage / Office
            </label>
            <input
              type="text"
              value={inviteAgency}
              onChange={(e) => setInviteAgency(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              Message (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Welcome to our brokerage! Please complete your profile and upload your PRC & DHSUD IDs."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

        </form>
      )}
    </DashboardModal>
  );
}
