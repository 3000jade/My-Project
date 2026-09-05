import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockAgents } from '../../mockData/mockAgents';

export default function AgentProfile() {
  const [agent, setAgent] = useState(mockAgents[0]); // Elena Rossi
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "Elena",
    lastName: "Rossi",
    email: agent.email,
    phone: agent.phone,
    bio: agent.bio
  });

  const handleSaveProfile = () => {
    setAgent(prev => ({
      ...prev,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      phone: form.phone,
      bio: form.bio
    }));
    setEditModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Agent Credentials & Profile"
        subtitle="Manage professional real estate licensing credentials, contact info, and regulatory accreditations."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Profile" }
        ]}
        actions={
          <button
            onClick={() => setEditModalOpen(true)}
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Verification Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#266F71]/20 shadow-md"
            />
            <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow">
              <span className="material-symbols-outlined text-[#266F71] text-[20px]">verified</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-display font-bold text-[#174849]">{agent.name}</h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">Senior Real Estate Consultant</p>
          </div>

          <div className="pt-2">
            <StatusBadge status={agent.verification_status} />
          </div>

          <div className="w-full pt-6 border-t border-gray-100 space-y-3 text-xs font-sans text-left">
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Email Address</span>
              <span className="font-semibold text-gray-800">{agent.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Mobile Contact</span>
              <span className="font-semibold text-gray-800">{agent.phone}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Experience</span>
              <span className="font-semibold text-gray-800">{agent.experience_years} Years Active Practice</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Credentials & Regulatory Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Professional Regulatory Credentials */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">badge</span>
              Philippine Regulatory Licenses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PRC Card */}
              <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#266F71] font-sans">
                    PRC Real Estate Broker
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#266F71]">workspace_premium</span>
                </div>
                <p className="text-base font-bold font-display text-[#174849]">
                  {agent.prc_license_no}
                </p>
                <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                  <span>Validity:</span>
                  <span className="font-semibold text-gray-700">{agent.prc_validity}</span>
                </div>
              </div>

              {/* DHSUD Card */}
              <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8E5D] font-sans">
                    DHSUD Accreditation
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#FB8E5D]">gavel</span>
                </div>
                <p className="text-base font-bold font-display text-[#174849]">
                  {agent.dhsud_accreditation_no}
                </p>
                <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                  <span>Expiration:</span>
                  <span className="font-semibold text-gray-700">{agent.dhsud_validity}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs font-sans text-emerald-800 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">verified_user</span>
              <span>
                <strong>Accreditation Active:</strong> All regulatory documents verified by supervising Broker. Eligible for high-value client transactions and property deed conveyance.
              </span>
            </div>
          </div>

          {/* Professional Biography */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-display font-bold text-[#174849]">
              Executive Biography
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              {agent.bio}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <DashboardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile Information"
        subtitle="Update personal details and public biography (UI Preview)"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Save Profile
            </button>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Mobile Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Professional Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
