import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockInquiries } from '../../mockData/mockInquiries';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerInquiryDetail() {
  const { id } = useParams();
  const initial = mockInquiries.find(i => i.id === id) || mockInquiries[0];

  const [inquiry, setInquiry] = useState(initial);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(inquiry.agent_id);

  const handleSaveReassignment = () => {
    const selectedAgent = mockAgents.find(a => a.id === selectedAgentId);
    if (selectedAgent) {
      setInquiry(prev => ({
        ...prev,
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        status: 'ASSIGNED'
      }));
    }
    setReassignModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`Inquiry Review: ${inquiry.client_name}`}
        subtitle={`Firm Triage • Inbound Ref: ${inquiry.id}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Inquiries", to: "/broker/inquiries" },
          { label: inquiry.client_name }
        ]}
        badge={<StatusBadge status={inquiry.status} />}
        actions={
          <button
            onClick={() => setReassignModalOpen(true)}
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Reassign Agent
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights & Message Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Assistance Context */}
          {inquiry.ai_summary && (
            <div className="bg-gradient-to-br from-white to-[#266F71]/5 rounded-2xl border border-[#266F71]/30 p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-[#266F71] mb-2 font-display font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                <span>AI Inbound Inquiry Intelligence Analysis</span>
              </div>
              <p className="text-xs font-sans text-gray-700 leading-relaxed">
                {inquiry.ai_summary}
              </p>
            </div>
          )}

          {/* Messages Feed */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col h-[500px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-sans pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#266F71]">forum</span>
              Communication Audit History
            </h3>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar" data-lenis-prevent="true">
              {inquiry.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-500 font-sans">
                        {msg.sender_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div
                      className={`max-w-md p-4 rounded-2xl text-sm font-sans leading-relaxed ${
                        isAgent
                          ? 'bg-[#266F71] text-white rounded-tr-xs shadow-xs'
                          : 'bg-[#F1F0EC] text-gray-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assigned Agent & Property Info */}
        <div className="space-y-6">
          {/* Handling Agent */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Supervising Consultant
            </h3>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                alt="Agent"
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-bold text-sm text-[#174849] font-sans">{inquiry.agent_name}</p>
                <p className="text-xs text-gray-400 font-sans">Assigned Consultant</p>
              </div>
            </div>
            <button
              onClick={() => setReassignModalOpen(true)}
              className="w-full py-2 bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Reassign to Different Agent
            </button>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-3 text-xs font-sans">
            <h3 className="font-bold uppercase tracking-wider text-gray-400 text-[10px]">
              Client Dossier
            </h3>
            <div className="space-y-1.5">
              <p className="font-bold text-sm text-[#174849]">{inquiry.client_name}</p>
              <p className="text-gray-600">Email: {inquiry.client_email}</p>
              <p className="text-gray-600">Phone: {inquiry.client_phone}</p>
            </div>
          </div>

          {/* Property Reference */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-gray-400 text-[10px] font-sans">
              Property Referenced
            </h3>
            <p className="font-bold text-sm text-[#174849] font-sans">{inquiry.property_title}</p>
            <p className="text-base font-bold font-display text-[#266F71]">{inquiry.property_price}</p>
            <Link
              to={`/broker/properties/${inquiry.property_id}`}
              className="inline-block pt-1 text-xs font-bold text-[#266F71] uppercase tracking-wider font-sans hover:underline"
            >
              Inspect Property Dossier →
            </Link>
          </div>
        </div>
      </div>

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
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReassignment}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Confirm Assignment
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">
            Select Active Consultant
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {mockAgents.map(ag => (
              <label
                key={ag.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAgentId === ag.id
                    ? 'border-[#266F71] bg-[#266F71]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="agentSelect"
                    checked={selectedAgentId === ag.id}
                    onChange={() => setSelectedAgentId(ag.id)}
                    className="accent-[#266F71]"
                  />
                  <div>
                    <p className="font-bold text-sm text-[#174849] font-sans">{ag.name}</p>
                    <p className="text-xs text-gray-400 font-sans">{ag.assigned_properties_count} listings • {ag.active_inquiries_count} inquiries</p>
                  </div>
                </div>
                <StatusBadge status={ag.verification_status} />
              </label>
            ))}
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
