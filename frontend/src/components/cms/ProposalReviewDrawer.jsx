import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Clock, 
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';

export default function ProposalReviewDrawer({
  isOpen,
  onClose,
  proposal,
  onApprove,
  onReject,
  isProcessing = false
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!proposal) return null;

  const original = proposal.original_snapshot || {};
  const proposed = proposal.proposed_changes || {};
  const agent = proposal.agent || {};

  const handleApprove = async () => {
    setValidationError('');
    try {
      await onApprove(proposal.id, reviewNotes);
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to approve proposal.');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setValidationError('Please provide a specific reason for declining the proposal.');
      return;
    }
    setValidationError('');
    try {
      await onReject(proposal.id, rejectionReason.trim());
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to decline proposal.');
    }
  };

  // Helper to detect if a field was altered
  const isChanged = (key) => proposed[key] !== undefined && proposed[key] !== original[key];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DrawerContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-[#E2E8F0] dark:border-slate-800"
        data-testid="broker-drawer"
      >
        {/* Header */}
        <DrawerHeader className="p-6 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col justify-start bg-[#F8FAFC] dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Pending Broker Review
            </span>
            <span className="text-xs font-mono text-[#64748B] dark:text-slate-400">
              ID: {proposal.id ? proposal.id.slice(0, 8) : 'REQ'}
            </span>
          </div>
          <DrawerTitle className="text-lg font-bold text-[#1E293B] dark:text-slate-100 mt-1">
            Review Listing Proposal
          </DrawerTitle>
          <DrawerDescription className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Target Property: <span className="font-semibold text-[#1E293B] dark:text-slate-200">{original.title || proposal.property?.title || 'Listing'}</span>
          </DrawerDescription>
        </DrawerHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" data-lenis-prevent="true">
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Proposing Agent Dossier Card */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 block">
              Submission Agent & Notes
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                  {agent.full_name ? agent.full_name.slice(0, 2).toUpperCase() : 'AG'}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100">{agent.full_name || 'Assigned Agent'}</p>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">{agent.email || 'agent@hsr.com'}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {new Date(proposal.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {proposal.agent_notes && (
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Agent Rationale: </span>
                {proposal.agent_notes}
              </div>
            )}
          </div>

          {/* Side-by-Side Diff Comparison */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-slate-100 block">
              Proposed Field Modifications
            </span>

            {/* Title Comparison */}
            <div className={`p-3 rounded-lg border text-xs transition-colors ${
              isChanged('title') ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider">Listing Title</span>
                {isChanged('title') && (
                  <span className="text-[10px] font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-1.5 py-0.5 rounded">Modified</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-slate-500 dark:text-slate-400">
                  <span className="block text-[10px] text-slate-400 font-sans">Current Live:</span>
                  <p className="font-medium mt-0.5">{original.title || '—'}</p>
                </div>
                <div className={isChanged('title') ? 'text-[#0F766E] dark:text-teal-400 font-semibold' : 'text-slate-700 dark:text-slate-200'}>
                  <span className="block text-[10px] text-slate-400 font-sans">Proposed:</span>
                  <p className="mt-0.5">{proposed.title || original.title || '—'}</p>
                </div>
              </div>
            </div>

            {/* Price Comparison */}
            <div className={`p-3 rounded-lg border text-xs transition-colors ${
              isChanged('price') ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider">Valuation Price</span>
                {isChanged('price') && (
                  <span className="text-[10px] font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-1.5 py-0.5 rounded">Modified</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <span className="block text-[10px] text-slate-400 font-sans">Current Live:</span>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    ₱{Number(original.price || original.price_raw || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-sans">Proposed:</span>
                  <p className={`font-bold mt-0.5 ${isChanged('price') ? 'text-[#0F766E] dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    ₱{Number(proposed.price || original.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition & Status Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border text-xs ${
                isChanged('property_condition') ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800'
              }`}>
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Condition</span>
                <p className="text-slate-500 dark:text-slate-400 line-through text-[11px]">{original.property_condition || '—'}</p>
                <p className="font-bold text-[#0F766E] dark:text-teal-400 mt-0.5">{proposed.property_condition || original.property_condition || '—'}</p>
              </div>

              <div className={`p-3 rounded-lg border text-xs ${
                isChanged('standard_status') ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800'
              }`}>
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Publication Status</span>
                <p className="text-slate-500 dark:text-slate-400 line-through text-[11px]">{original.standard_status || 'Active'}</p>
                <p className="font-bold text-[#0F766E] dark:text-teal-400 mt-0.5">{proposed.standard_status || original.standard_status || 'Active'}</p>
              </div>
            </div>

            {/* Specifications Comparison */}
            <div className={`p-3 rounded-lg border text-xs ${
              (isChanged('bedrooms_total') || isChanged('bathrooms_total_integer') || isChanged('living_area')) 
                ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' 
                : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider">Specifications</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-[#F8FAFC] dark:bg-slate-800 rounded border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Beds</span>
                  <span className="font-bold font-mono text-[#0F766E] dark:text-teal-400 text-sm">
                    {proposed.bedrooms_total ?? original.bedrooms ?? original.specs?.beds ?? 0}
                  </span>
                </div>
                <div className="p-2 bg-[#F8FAFC] dark:bg-slate-800 rounded border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Baths</span>
                  <span className="font-bold font-mono text-[#0F766E] dark:text-teal-400 text-sm">
                    {proposed.bathrooms_total_integer ?? original.bathrooms ?? original.specs?.baths ?? 0}
                  </span>
                </div>
                <div className="p-2 bg-[#F8FAFC] dark:bg-slate-800 rounded border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Area</span>
                  <span className="font-bold font-mono text-[#0F766E] dark:text-teal-400 text-sm">
                    {proposed.living_area ?? original.sqm ?? original.specs?.livingArea ?? '—'} m²
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative Comparison */}
            {isChanged('public_remarks') && (
              <div className="p-3 rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 text-xs space-y-2">
                <span className="font-semibold text-[#64748B] dark:text-slate-400 uppercase text-[10px] tracking-wider block">
                  Updated Narrative / Public Remarks
                </span>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-[#E2E8F0] dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-line text-xs leading-relaxed">
                  {proposed.public_remarks}
                </div>
              </div>
            )}
          </div>

          {/* Broker Review Feedback Form */}
          <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#CBD5E1] dark:border-slate-700 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] dark:text-slate-100 block">
              {showRejectPrompt ? 'Mandatory Rejection Remarks *' : 'Broker Review Notes (Optional)'}
            </label>

            {showRejectPrompt ? (
              <textarea
                required
                rows={3}
                placeholder="Explain why this proposal is declined (e.g., Price increase must be supported by owner signed amendment)..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-red-300 dark:border-red-900 rounded-lg text-xs text-[#1E293B] dark:text-slate-100 outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-900"
              />
            ) : (
              <textarea
                rows={2}
                placeholder="Optional internal confirmation remarks..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                className="w-full p-3 border border-[#CBD5E1] dark:border-slate-700 rounded-lg text-xs text-[#1E293B] dark:text-slate-100 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white dark:bg-slate-900"
              />
            )}
          </div>
        </div>

        {/* Footer Decision Actions */}
        <DrawerFooter className="p-5 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between gap-3 shrink-0">
          {showRejectPrompt ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectPrompt(false)}
                className="h-10 px-4 rounded-lg border border-[#CBD5E1] dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors"
              >
                Back to Review
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="h-10 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Confirm Rejection</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRejectPrompt(true)}
                className="h-10 px-4 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors"
              >
                Decline Proposal...
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-lg border border-[#CBD5E1] dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="h-10 px-5 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish to Live</span>
                </button>
              </div>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
