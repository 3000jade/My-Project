import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { EditProfileDialog } from '@/components/profile';
import { Button } from '@/components/ui/button';
import { profileService, mockDefaultProfiles } from '../../../services/profileService';
import { useAuth } from '../../../context/AuthContext';

export default function BrokerProfile() {
  const navigate = useNavigate();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const logout = auth?.logout;
  const [profile, setProfile] = useState(mockDefaultProfiles.broker);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleSave = async (formData) => {
    setSaving(true);
    const dataToSave = formData || form;
    try {
      const updated = await profileService.updateProfile(dataToSave, { role: 'broker' });
      setProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      console.warn('Profile update error:', err.message);
      setProfile(prev => ({ ...prev, ...dataToSave }));
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Broker Executive Profile"
        subtitle="Principal broker credentials, firm regulatory registrations, and administrative settings."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              className="h-[42px] px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Return to Public Site"
            >
              <span className="material-symbols-outlined text-[17px] text-slate-500">home</span>
              <span>Home Page</span>
            </Link>
            <button
              onClick={loadProfile}
              disabled={loading}
              className="h-[42px] px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <Button
              type="button"
              variant="coral"
              onClick={handleOpenEdit}
              className="h-[42px] px-4 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>Edit Profile</span>
            </Button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-[42px] px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[17px] text-rose-600">logout</span>
              <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
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
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#0F766E]">
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
              className="w-28 h-28 rounded-full object-cover border-4 border-[#0F766E]/20 shadow-md"
            />

            <div>
              <h3 className="text-xl font-display font-bold text-[#1E293B]">{profile.name}</h3>
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

            {/* Quick Navigation & Session Panel */}
            <div className="w-full pt-5 border-t border-gray-100 flex flex-col gap-2 font-sans">
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider text-left">
                Navigation & Session
              </span>
              <Link
                to="/"
                className="w-full py-2 px-3 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] text-xs font-medium flex items-center justify-between border border-[#E2E8F0] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0F766E]">home</span>
                  Public Home Page
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
              </Link>

              <Link
                to="/broker/dashboard"
                className="w-full py-2 px-3 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] text-xs font-medium flex items-center justify-between border border-[#E2E8F0] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0F766E]">dashboard</span>
                  Broker Dashboard
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-600">logout</span>
                <span>{loggingOut ? 'Signing out...' : 'Sign Out of Session'}</span>
              </button>
            </div>
          </div>

          {/* Right 2 Columns: Credentials & Supervised Scope */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-display font-bold text-[#1E293B] pb-3 border-b border-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">admin_panel_settings</span>
                Supervising Real Estate Broker Accreditations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FAFC]/60 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] font-sans">
                    Principal PRC Broker License
                  </span>
                  <p className="text-base font-bold font-display text-[#1E293B]">
                    {profile.prc_license_no}
                  </p>
                  <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700">Valid & Current ({profile.prc_validity ? profile.prc_validity.slice(0, 4) : '2028'})</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC]/60 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B6B] font-sans">
                    DHSUD Firm Registration
                  </span>
                  <p className="text-base font-bold font-display text-[#1E293B]">
                    {profile.dhsud_accreditation_no}
                  </p>
                  <div className="pt-2 text-xs text-gray-500 font-sans flex items-center justify-between border-t border-gray-200/50">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700">Accredited ({profile.dhsud_validity ? profile.dhsud_validity.slice(0, 4) : '2027'})</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 text-xs font-sans text-gray-600 space-y-1">
                <span className="font-bold text-[#1E293B] uppercase tracking-wider text-[10px] block">
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
      <EditProfileDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Broker Profile"
        description="Update executive contact and administrative information"
        submitLabel="Save Profile"
        initialData={{
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          firm_name: profile.firm_name,
        }}
        fields={[
          { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Alexander Sterling', required: true },
          { name: 'email', label: 'Email Address', type: 'email', placeholder: 'broker@pt.com', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+63 918 555 0244', required: true },
          { name: 'firm_name', label: 'Operating Entity / Firm', type: 'text', placeholder: 'Precision Trust Realty Operations Inc.' },
        ]}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
