import React, { useState } from 'react';
import DashboardModal from './DashboardModal';
import propertyService from '../../services/propertyService';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function AgentAssignmentActionModal({
  isOpen,
  onClose,
  property,
  mode = 'accept', // 'accept' | 'decline'
  onSuccess
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!property) return null;

  const isAccept = mode === 'accept';
  const title = isAccept ? 'Accept Listing Assignment' : 'Decline Property Assignment';
  const subtitle = isAccept
    ? `Confirm responsibility for "${property.title}" and publish listing.`
    : `State reason for declining "${property.title}".`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isAccept) {
        await propertyService.acceptAssignment(property.id);
      } else {
        await propertyService.declineAssignment(property.id, reason);
      }

      if (onSuccess) {
        onSuccess(property.id, isAccept ? 'ACCEPTED' : 'REJECTED');
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${mode} assignment. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-md"
      actions={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-4 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#1E293B] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`h-10 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all text-white shadow-sm cursor-pointer disabled:opacity-50 ${
              isAccept
                ? 'bg-[#0F766E] hover:bg-[#115E59]'
                : 'bg-[#DC2626] hover:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : isAccept ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Publish</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Decline Assignment</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
          <p className="text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1">
            Target Property
          </p>
          <p className="text-sm font-semibold text-[#0F766E]">{property.title}</p>
          <p className="text-xs text-[#64748B]">
            {typeof property.location === 'string'
              ? property.location
              : property.location?.address || 'Metro Manila'}
          </p>
        </div>

        {isAccept ? (
          <p className="text-xs text-[#64748B] leading-relaxed">
            By accepting, you confirm that you are the dedicated listing consultant for this property.
            The listing will immediately be published live to the public portal and inquiries will be routed to your desk.
          </p>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block">
              Reason for Declining (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule at full capacity, location out of my primary jurisdiction..."
              rows={3}
              className="w-full px-3 py-2 text-sm text-[#1E293B] border border-[#CBD5E1] rounded-lg focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors"
            />
            <p className="text-[11px] text-[#64748B]">
              The broker will be notified with your feedback and can reassign the listing.
            </p>
          </div>
        )}
      </div>
    </DashboardModal>
  );
}
