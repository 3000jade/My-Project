import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { profileService, mockDefaultProfiles } from '../../services/profileService';

export default function AgentProfile() {
  const [agent, setAgent] = useState(mockDefaultProfiles.agent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: mockDefaultProfiles.agent.firstName,
    lastName: mockDefaultProfiles.agent.lastName,
    email: mockDefaultProfiles.agent.email,
    phone: mockDefaultProfiles.agent.phone,
    bio: mockDefaultProfiles.agent.bio,
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile({ role: 'agent' });
      setAgent(data);
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load agent profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenEdit = () => {
    setForm({
      firstName: agent.firstName || '',
      lastName: agent.lastName || '',
      email: agent.email || '',
      phone: agent.phone || '',
      bio: agent.bio || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        name: `${form.firstName} ${form.lastName}`.trim(),
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        bio: form.bio,
      }, { role: 'agent' });

      setAgent(updated);
      setEditModalOpen(false);
    } catch (err) {
      console.warn('Agent profile update failed:', err.message);
      setAgent(prev => ({
        ...prev,
        name: `${form.firstName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
      }));
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
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
          <div className="flex items-center gap-3">
            <button
              onClick={loadProfile}
              disabled={loading}
              className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenEdit}
              className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadProfile}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#266F71]">
            progress_activity
          </span>
          <p className="text-sm font-sans font-medium">Loading consultant profile credentials...</p>
        </div>
      ) : (
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
              <p className="text-xs text-gray-500 font-sans mt-0.5">{agent.role}</p>
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
      )}

      {/* Edit Profile Modal */}
      <DashboardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile Information"
        subtitle="Update personal details and public biography"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="agent-first-name" className="text-xs font-bold uppercase tracking-wider text-gray-600">First Name</label>
              <input
                id="agent-first-name"
                type="text"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-last-name" className="text-xs font-bold uppercase tracking-wider text-gray-600">Last Name</label>
              <input
                id="agent-last-name"
                type="text"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="agent-email" className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact Email</label>
            <input
              id="agent-email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="agent-phone" className="text-xs font-bold uppercase tracking-wider text-gray-600">Mobile Phone</label>
            <input
              id="agent-phone"
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="agent-bio" className="text-xs font-bold uppercase tracking-wider text-gray-600">Professional Bio</label>
            <textarea
              id="agent-bio"
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
