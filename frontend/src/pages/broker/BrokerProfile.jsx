import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { profileService, mockDefaultProfiles } from '../../services/profileService';

export default function BrokerProfile() {
  const [profile, setProfile] = useState(mockDefaultProfiles.broker);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({ ...profile });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile({ role: 'broker' });
      setProfile(data);
      setForm(data);
    } catch (err) {
      setError(err.message || 'Failed to load broker profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenEdit = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      firm_name: profile.firm_name,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileService.updateProfile(form, { role: 'broker' });
      setProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      console.warn('Profile update error:', err.message);
      setProfile(prev => ({ ...prev, ...form }));
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Broker Executive Profile"
        subtitle="Principal broker credentials, firm regulatory registrations, and administrative settings."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
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
          <p className="text-sm font-sans font-medium">Loading executive profile credentials...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Firm Identity */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#266F71]/20 shadow-md"
            />

            <div>
              <h3 className="text-xl font-display font-bold text-[#174849]">{profile.name}</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">{profile.role}</p>
            </div>

            <StatusBadge status="VERIFIED" />

            <div className="w-full pt-6 border-t border-gray-100 space-y-3 text-xs font-sans text-left">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Email</span>
                <span className="font-semibold text-gray-800">{profile.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Direct Phone</span>
                <span className="font-semibold text-gray-800">{profile.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Operating Entity</span>
                <span className="font-semibold text-gray-800">{profile.firm_name}</span>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Credentials & Supervised Scope */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#266F71]">admin_panel_settings</span>
                Supervising Real Estate Broker Accreditations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#266F71] font-sans">
                    Principal PRC Broker License
                  </span>
                  <p className="text-base font-bold font-display text-[#174849]">
                    {profile.prc_license_no}
                  </p>
                  <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700">Valid & Current ({profile.prc_validity ? profile.prc_validity.slice(0, 4) : '2028'})</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8E5D] font-sans">
                    DHSUD Firm Registration
                  </span>
                  <p className="text-base font-bold font-display text-[#174849]">
                    {profile.dhsud_accreditation_no}
                  </p>
                  <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700">Accredited ({profile.dhsud_validity ? profile.dhsud_validity.slice(0, 4) : '2027'})</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 text-xs font-sans text-gray-600 space-y-1">
                <span className="font-bold text-[#174849] uppercase tracking-wider text-[10px] block">
                  Administrative Authority
                </span>
                <p>
                  Holds full operational oversight for firm listing publications, consultant accreditation approvals, inquiry triage reassignment, and sales conveyancing audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <DashboardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Broker Profile"
        subtitle="Update executive contact and administrative information"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          <div className="space-y-1">
            <label htmlFor="broker-name" className="text-xs font-bold uppercase tracking-wider text-gray-600">Full Name</label>
            <input
              id="broker-name"
              type="text"
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="broker-email" className="text-xs font-bold uppercase tracking-wider text-gray-600">Email Address</label>
            <input
              id="broker-email"
              type="email"
              value={form.email || ''}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="broker-phone" className="text-xs font-bold uppercase tracking-wider text-gray-600">Phone</label>
            <input
              id="broker-phone"
              type="text"
              value={form.phone || ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="broker-firm" className="text-xs font-bold uppercase tracking-wider text-gray-600">Operating Entity / Firm</label>
            <input
              id="broker-firm"
              type="text"
              value={form.firm_name || ''}
              onChange={e => setForm({ ...form, firm_name: e.target.value })}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#266F71]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
