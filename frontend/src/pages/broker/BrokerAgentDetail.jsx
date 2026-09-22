import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { agentService } from '../../services/agentService';
import { mockProperties } from '../../mockData/mockProperties';

export default function BrokerAgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await agentService.getAgentById(id);
        if (mounted) {
          if (data) {
            setAgent(data);
          } else {
            setError(`Consultant profile "${id}" could not be located.`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve consultant profile.');
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

  const assignedProps = agent
    ? mockProperties.filter(p => p.agent_id === agent.id || p.created_by === agent.id)
    : [];

  const handleApplyAction = async (status) => {
    if (!agent) return;
    setUpdating(true);
    try {
      const updated = await agentService.updateAgentStatus(agent.id, status);
      setAgent(updated);
    } catch (err) {
      console.warn('Status transition failed:', err.message);
      setAgent(prev => ({ ...prev, verification_status: status }));
    } finally {
      setUpdating(false);
      setConfirmModal({ open: false, action: null });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-16 text-center space-y-3 max-w-6xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#266F71] border-t-transparent"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
          Loading consultant credentials dossier...
        </p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Consultant Not Found"
          breadcrumbs={[
            { label: "Dashboard", to: "/broker/dashboard" },
            { label: "Agents", to: "/broker/agents" },
            { label: "Error" }
          ]}
        />
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-600">error</span>
          <h2 className="text-lg font-bold text-[#174849] font-display">Consultant Profile Unavailable</h2>
          <p className="text-sm text-gray-600 font-sans max-w-md mx-auto">
            {error || "The consultant credentials could not be loaded."}
          </p>
          <Link
            to="/broker/agents"
            className="inline-block px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans hover:bg-[#174849] transition-colors"
          >
            ← Return to Consultant Roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Review Consultant: ${agent.name}`}
        subtitle={`Regulatory Credential Review • ID: ${agent.id}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Agents", to: "/broker/agents" },
          { label: agent.name }
        ]}
        badge={<StatusBadge status={agent.verification_status} />}
        actions={
          <div className="flex items-center gap-2">
            {agent.verification_status !== 'VERIFIED' && (
              <button
                onClick={() => setConfirmModal({ open: true, action: 'VERIFIED' })}
                className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Approve & Verify
              </button>
            )}

            {agent.verification_status !== 'REJECTED' && (
              <button
                onClick={() => setConfirmModal({ open: true, action: 'REJECTED' })}
                className="h-[46px] px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Reject Credentials
              </button>
            )}

            {agent.verification_status !== 'SUSPENDED' && (
              <button
                onClick={() => setConfirmModal({ open: true, action: 'SUSPENDED' })}
                className="h-[46px] px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                Suspend Account
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-gray-200 shadow-sm"
          />

          <div>
            <h3 className="text-xl font-display font-bold text-[#174849]">{agent.name}</h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">Real Estate Consultant</p>
          </div>

          <StatusBadge status={agent.verification_status} />

          <div className="w-full pt-6 border-t border-gray-100 space-y-3 text-xs font-sans text-left">
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Email</span>
              <span className="font-semibold text-gray-800">{agent.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Phone</span>
              <span className="font-semibold text-gray-800">{agent.phone}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Experience</span>
              <span className="font-semibold text-gray-800">{agent.experience_years} Years</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Official Credentials Review */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">verified_user</span>
              Regulatory Accreditation Dossier (Manual Verification)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#266F71] font-sans">
                  PRC Broker Registration
                </span>
                <p className="text-base font-bold font-display text-[#174849]">
                  {agent.prc_license_no}
                </p>
                <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                  <span>Valid Until:</span>
                  <span className="font-semibold text-gray-700">{agent.prc_validity}</span>
                </div>
              </div>

              <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8E5D] font-sans">
                  DHSUD Accreditation
                </span>
                <p className="text-base font-bold font-display text-[#174849]">
                  {agent.dhsud_accreditation_no}
                </p>
                <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                  <span>Expiration:</span>
                  <span className="font-semibold text-gray-700">{agent.dhsud_validity}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs font-sans">
              <span className="font-bold text-[#174849] uppercase tracking-wider text-[10px] block">
                Regulatory Compliance Notes
              </span>
              <p className="text-gray-600 leading-relaxed">
                {agent.bio}
              </p>
            </div>
          </div>

          {/* Assigned Properties Preview */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#174849]">
                Assigned Property Listings ({assignedProps.length})
              </h3>
            </div>
            {assignedProps.length === 0 ? (
              <p className="text-xs text-gray-500 font-sans">No property listings assigned currently.</p>
            ) : (
              <div className="space-y-2.5">
                {assignedProps.map(p => (
                  <div key={p.id} className="p-3 bg-[#F1F0EC]/60 rounded-xl flex items-center justify-between text-sm font-sans">
                    <div>
                      <p className="font-bold text-[#174849]">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.location || `${p.address || ''}, ${p.city || ''}`} • {p.property_type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#266F71]">{p.price}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DashboardModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null })}
        title="Confirm Verification Status Change"
        subtitle="This action manually updates the consultant's accreditation status in the system."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmModal({ open: false, action: null })}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApplyAction(confirmModal.action)}
              disabled={updating}
              className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
            >
              {updating ? 'Updating...' : 'Apply Status'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 font-sans">
          Are you sure you want to mark consultant <strong className="text-[#174849]">{agent.name}</strong> as <strong className="text-[#266F71]">{confirmModal.action}</strong>?
        </p>
      </DashboardModal>
    </div>
  );
}
