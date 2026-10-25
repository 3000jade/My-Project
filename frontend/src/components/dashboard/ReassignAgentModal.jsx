import React, { useState } from 'react';
import DashboardModal from './DashboardModal';
import propertyService from '../../services/propertyService';
import { mockAgents } from '../../mockData/mockAgents';
import { AlertCircle, UserCheck, ShieldAlert } from 'lucide-react';

export default function ReassignAgentModal({
  isOpen,
  onClose,
  property,
  onSuccess
}) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!property) return null;

  const currentAgentId = property.agent_id || property.agentId;
  const declineReason = property.assignment_declined_reason || property.assignmentDeclinedReason;

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Please select an agent to reassign this listing to.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await propertyService.reassignAgent(property.id, selectedAgentId);
      if (onSuccess) {
        onSuccess(property.id, selectedAgentId);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reassign agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Listing Agent"
      subtitle={`Choose a new licensed agent to represent "${property.title}".`}
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
            onClick={handleReassign}
            disabled={isSubmitting || !selectedAgentId}
            className="h-10 px-5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Reassigning...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Reassign & Notify</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {declineReason && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Previous Agent Declined Representation</p>
              <p className="text-red-700 mt-0.5">"{declineReason}"</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
            Select Replacement Agent <span className="text-[#DC2626]">*</span>
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          >
            <option value="">-- Choose Licensed Agent --</option>
            {mockAgents
              .filter(a => a.id !== currentAgentId)
              .map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role || 'Agent'}) — {a.email}
                </option>
              ))}
          </select>
          <p className="text-[11px] text-[#64748B]">
            The new agent will receive this listing in their portal under "Pending Confirmation" and must review it before the listing goes live.
          </p>
        </div>
      </div>
    </DashboardModal>
  );
}
