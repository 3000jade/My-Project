import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { inquiryService } from '../../../services/inquiryService';
import { agentService } from '../../../services/agentService';

export default function BrokerInquiryDetail() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agents, setAgents] = useState([]);
  const [reassignReason, setReassignReason] = useState('Reassigned by Broker');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | audit

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const [data, audits, agentList] = await Promise.all([
          inquiryService.getInquiryById(id),
          inquiryService.getAuditEvents({ inquiryId: id }).catch(() => []),
          agentService.getAgents().catch(() => []),
        ]);
        if (mounted) {
          setAgents(Array.isArray(agentList) ? agentList : []);
          if (data) {
            setInquiry(data);
            setSelectedAgentId(data.agent_id || '');
            setAuditEvents(Array.isArray(audits) ? audits : []);
          } else {
            setError(`Inquiry with ID "${id}" could not be found.`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Error loading inquiry details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveReassignment = async () => {
    const selectedAgent = agents.find(a => a.id === selectedAgentId) || { id: selectedAgentId, name: 'Assigned Specialist' };
    if (!selectedAgentId || !inquiry) return;

    setSaving(true);
    try {
      const updated = await inquiryService.assignAgent(inquiry.id, selectedAgentId, reassignReason);
      setInquiry(updated);
      const refreshedAudits = await inquiryService.getAuditEvents({ inquiryId: inquiry.id });
      setAuditEvents(refreshedAudits);
    } catch (err) {
      console.warn('Reassignment API call failed, falling back to local update:', err.message);
      const updated = await inquiryService.updateInquiry(inquiry.id, {
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        status: 'ASSIGNED',
      });
      setInquiry(updated);
    } finally {
      setSaving(false);
      setReassignModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-16 text-center space-y-3 max-w-6xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
          Loading inquiry dossier & audit history...
        </p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader title="Inquiry Not Found" />
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-600">error</span>
          <h2 className="text-lg font-bold text-[#1E293B] font-display">Inquiry Record Unavailable</h2>
          <p className="text-sm text-[#64748B] font-sans max-w-md mx-auto">
            {error || "The inquiry record could not be loaded."}
          </p>
          <Link
            to="/broker/inquiries"
            className="inline-block px-5 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans hover:bg-[#115E59] transition-colors"
          >
            ← Return to Firm Inquiries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title={`Inquiry Review: ${inquiry.client_name}`}
        subtitle={`Firm Triage • Ref: ${inquiry.reference_code || inquiry.id}`}
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                inquiry.business_status === 'inactive'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {inquiry.business_status || 'active'}
            </span>
            <StatusBadge status={inquiry.status} />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/broker/inquiries"
              className="h-[42px] px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </Link>
            <button
              onClick={() => setReassignModalOpen(true)}
              className="h-[42px] px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Reassign Agent
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]'
          }`}
        >
          Inquiry Overview & Thread
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Protected Audit Log ({auditEvents.length})</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: AI Insights & Message Thread */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Assistance Context */}
            {inquiry.ai_summary && (
              <div className="bg-white rounded-lg border border-[#0F766E]/30 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-[#0F766E] mb-2 font-display font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  <span>AI Inbound Inquiry Intelligence Analysis</span>
                </div>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  {inquiry.ai_summary}
                </p>
              </div>
            )}

            {/* Messages Feed */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs flex flex-col h-[500px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans pb-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">forum</span>
                Communication Audit History
              </h3>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar" data-lenis-prevent="true">
                {inquiry.messages && inquiry.messages.length > 0 ? (
                  inquiry.messages.map((msg) => {
                    const isAgent = msg.sender === 'agent';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-500 font-sans">
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={`max-w-md p-3.5 rounded-lg text-xs leading-relaxed ${
                            isAgent
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400 font-sans">
                    No previous communication history recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Assigned Agent & Property Info */}
          <div className="space-y-6">
            {/* Handling Agent */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
                Supervising Consultant
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold">
                  {(inquiry.agent_name || 'U').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1E293B] font-sans">{inquiry.agent_name || 'Unassigned'}</p>
                  <p className="text-xs text-[#64748B] font-sans">Assigned Consultant</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalOpen(true)}
                className="w-full py-2 bg-slate-100 hover:bg-[#0F766E] hover:text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reassign to Different Agent
              </button>
            </div>

            {/* Client Details */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-2 text-xs font-sans">
              <h3 className="font-bold uppercase tracking-wider text-[#64748B] text-[10px]">
                Client Dossier
              </h3>
              <p className="font-bold text-sm text-[#1E293B]">{inquiry.client_name}</p>
              <p className="text-slate-600">Email: {inquiry.client_email}</p>
              <p className="text-slate-600">Phone: {inquiry.client_phone}</p>
            </div>

            {/* Property Reference */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[#64748B] text-[10px] font-sans">
                Property Referenced
              </h3>
              <p className="font-bold text-sm text-[#1E293B] font-sans">{inquiry.property_title}</p>
              <p className="text-base font-bold font-display text-[#0F766E]">{inquiry.property_price}</p>
              <Link
                to={`/broker/properties/${inquiry.property_id}`}
                className="inline-block pt-1 text-xs font-bold text-[#0F766E] uppercase tracking-wider font-sans hover:underline"
              >
                Inspect Property Dossier →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Protected Broker Audit Viewer (AUD-02, UX-01) */
        <div data-testid="broker-protected-audit-viewer" className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">security</span>
                Protected Broker Audit Evidence
              </h3>
              <p className="text-xs text-[#64748B]">
                Immutable, append-only security and operational audit trail with field redaction
              </p>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(auditEvents, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-export-${inquiry.id}.json`;
                a.click();
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Export Audit JSON
            </button>
          </div>

          <div className="space-y-3">
            {auditEvents && auditEvents.length > 0 ? (
              auditEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0F766E]">{evt.eventType}</span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                    <span>Actor: <strong>{evt.actorName}</strong> ({evt.actorRole || 'system'})</span>
                    <span>•</span>
                    <span>Outcome: <strong className={evt.outcome === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{evt.outcome}</strong></span>
                  </div>
                  {evt.reason && (
                    <p className="text-slate-700 italic">Reason: {evt.reason}</p>
                  )}
                  {(evt.previousValues || evt.newValues) && (
                    <div className="mt-1 pt-1 border-t border-slate-200/60 font-mono text-[10px] text-slate-600">
                      {evt.previousValues && <div>Prev: {JSON.stringify(evt.previousValues)}</div>}
                      {evt.newValues && <div>New: {JSON.stringify(evt.newValues)}</div>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] italic py-4 text-center">No audit records logged for this inquiry.</p>
            )}
          </div>
        </div>
      )}

      {/* Reassign Agent Modal */}
      <DashboardModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Reassign Inquiry to Consultant"
        subtitle={`Select a licensed agent to take over communication with ${inquiry.client_name}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReassignment}
              disabled={saving}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
            >
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">
            Select Active Consultant
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
            {agents.map(ag => (
              <label
                key={ag.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedAgentId === ag.id
                    ? 'border-[#0F766E] bg-teal-50/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="agentSelect"
                    checked={selectedAgentId === ag.id}
                    onChange={() => setSelectedAgentId(ag.id)}
                    className="accent-[#0F766E]"
                  />
                  <div>
                    <p className="font-bold text-xs text-[#1E293B] font-sans">{ag.name}</p>
                    <p className="text-[11px] text-[#64748B] font-sans">{ag.assigned_properties_count} listings • {ag.active_inquiries_count} inquiries</p>
                  </div>
                </div>
                <StatusBadge status={ag.verification_status} />
              </label>
            ))}
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">
              Reassignment Audit Reason
            </label>
            <input
              type="text"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Load balancing or specialist expertise"
              className="w-full h-[40px] px-3 border border-[#E2E8F0] rounded text-xs outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
