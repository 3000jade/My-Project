import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockAgents } from '../../mockData/mockAgents';
import { mockProperties } from '../../mockData/mockProperties';
import { mockSales } from '../../mockData/mockSales';

export default function BrokerAgentDetail() {
  const { id } = useParams();
  const initialAgent = mockAgents.find(a => a.id === id) || mockAgents[0];

  const [agent, setAgent] = useState(initialAgent);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });

  const assignedProps = mockProperties.filter(p => p.agent_id === agent.id);
  const recordedSales = mockSales.filter(s => s.agent_id === agent.id);

  const handleApplyAction = (status) => {
    setAgent(prev => ({ ...prev, verification_status: status }));
    setConfirmModal({ open: false, action: null });
  };

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
                className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Approve & Verify
              </button>
            )}

            {agent.verification_status !== 'REJECTED' && (
              <button
                onClick={() => setConfirmModal({ open: true, action: 'REJECTED' })}
                className="h-[46px] px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Reject Credentials
              </button>
            )}

            {agent.verification_status !== 'SUSPENDED' && (
              <button
                onClick={() => setConfirmModal({ open: true, action: 'SUSPENDED' })}
                className="h-[46px] px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors"
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
                      <p className="text-xs text-gray-400">{p.location} • {p.property_type}</p>
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
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApplyAction(confirmModal.action)}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Apply Status
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
