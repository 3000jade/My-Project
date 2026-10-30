import { Spinner } from '../../../components/ui';
import { ProfileSkeleton } from '../../../components/dashboard/skeletons';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { EditProfileDialog } from '@/components/profile';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, useToast, Toaster, Editable } from '../../../components/ui';
import { profileService, mockDefaultProfiles } from '../../../services/profileService';
import { useAuth } from '../../../context/AuthContext';
import { useDashboardDensity } from '../../../context/DashboardThemeContext';
import { cn } from '@/utils/cn';

export default function BrokerProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const logout = auth?.logout;
  const { density = 'standard', setDensity = () => {}, isSyncing = false, options = [] } = useDashboardDensity();
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
      const msg = err.message || 'Failed to load broker profile.';
      setError(msg);
      toast({ title: 'Profile Error', description: 'Could not synchronize profile data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      toast({
        title: 'Profile Saved',
        description: 'Broker credentials and profile updated successfully.',
        variant: 'success'
      });
    } catch (err) {
      console.warn('Profile update error:', err.message);
      setProfile(prev => ({ ...prev, ...dataToSave }));
      setEditModalOpen(false);
      toast({
        title: 'Updated Locally',
        description: 'Profile changes applied.',
        variant: 'primary'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInlineSave = async (field, val) => {
    const updated = { ...profile, [field]: val };
    setProfile(updated);
    try {
      await profileService.updateProfile(updated, { role: 'broker' });
      toast({ title: 'Updated', description: `${field} saved successfully.`, variant: 'success', duration: 2000 });
    } catch (err) {
      console.warn('Inline update error:', err.message);
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
    <div className="space-y-8 max-w-5xl mx-auto font-sans min-w-0 max-w-full" data-testid="broker-profile-portal">
      <Toaster />
      <PageHeader
        title="Broker Executive Profile"
        subtitle="Principal broker credentials, firm regulatory registrations, and administrative settings."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              className="h-[42px] px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Return to Public Site"
            >
              <span className="material-symbols-outlined text-[17px] text-[#64748B] dark:text-slate-400">home</span>
              <span>Home Page</span>
            </Link>
            <button
              onClick={loadProfile}
              disabled={loading}
              aria-label="Refresh Profile"
              className="h-[42px] px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
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
              className="h-[42px] px-3.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[17px] text-rose-600 dark:text-rose-400">logout</span>
              <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        }
      />

      {error && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">error</span>
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
        <ProfileSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Firm Identity */}
          <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#0F766E]/20 shadow-md"
            />

            <div>
              <h3 className="text-xl font-display font-bold text-[#1E293B] dark:text-slate-100">{profile.name}</h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-sans mt-0.5">{profile.role}</p>
            </div>

            <StatusBadge status="VERIFIED" />

            <div className="w-full pt-6 border-t border-[#E2E8F0] dark:border-slate-800 space-y-3 text-xs font-sans text-left">
              <div>
                <span className="text-[#64748B] dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Email</span>
                <span className="font-semibold text-[#1E293B] dark:text-slate-200">{profile.email}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Direct Phone</span>
                <span className="font-semibold text-[#1E293B] dark:text-slate-200">{profile.phone}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Operating Entity</span>
                <span className="font-semibold text-[#1E293B] dark:text-slate-200">{profile.firm_name}</span>
              </div>
            </div>

            {/* Quick Navigation & Session Panel */}
            <div className="w-full pt-5 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col gap-2 font-sans">
              <span className="text-[#64748B] dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider text-left">
                Navigation &amp; Session
              </span>
              <Link
                to="/"
                className="w-full py-2 px-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1E293B] dark:text-slate-100 text-xs font-medium flex items-center justify-between border border-[#E2E8F0] dark:border-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0F766E] dark:text-teal-400">home</span>
                  Public Home Page
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
              </Link>

              <Link
                to="/broker/dashboard"
                className="w-full py-2 px-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1E293B] dark:text-slate-100 text-xs font-medium flex items-center justify-between border border-[#E2E8F0] dark:border-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0F766E] dark:text-teal-400">dashboard</span>
                  Broker Dashboard
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400">logout</span>
                <span>{loggingOut ? 'Signing out...' : 'Sign Out of Session'}</span>
              </button>
            </div>
          </Card>

          {/* Right 2 Columns: Credentials & Supervised Scope */}
          <div className="md:col-span-2 space-y-6">
            {/* Appearance & Typography Density Card */}
            <Card data-testid="typography-density-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-display font-bold text-[#1E293B] dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] dark:text-teal-400">format_size</span>
                    Appearance &amp; Typography Density
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Adjust the base text scale and layout density across the entire broker command portal.
                  </p>
                </div>
                {isSyncing ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#0F766E] font-medium animate-pulse">
                    <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                    Syncing to profile...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="material-symbols-outlined text-[13px]">cloud_done</span>
                    Profile Synced
                  </span>
                )}
              </div>

              {/* 3 Discrete Density Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(options || []).map((opt) => {
                  const isSelected = density === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDensity(opt.id)}
                      aria-pressed={isSelected}
                      data-testid={`density-option-${opt.id}`}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group",
                        isSelected
                          ? "border-[#0F766E] bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-[#0F766E] shadow-xs"
                          : "border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          isSelected ? "text-[#0F766E] dark:text-teal-400" : "text-[#1E293B] dark:text-slate-200"
                        )}>
                          {opt.label}
                        </span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-tight",
                          isSelected
                            ? "bg-[#0F766E] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400"
                        )}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#64748B] dark:text-slate-400">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Container */}
              <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/90 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  <span>Live Density Preview</span>
                  <span className="font-mono text-[#0F766E] dark:text-teal-400 lowercase">
                    data-dashboard-density="{density}"
                  </span>
                </div>
                
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                      The Dahlia Penthouse • BGC High Street
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Listing
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    4 Bedrooms • 480 sqm • ₱125,000,000 • Verified Luxury Asset
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300 pt-1">
                    <span>Showings: <strong className="text-[#0F766E] font-bold">14</strong></span>
                    <span>Inquiries: <strong className="text-[#0F766E] font-bold">38</strong></span>
                    <span>Assigned: <strong>Elena Rossi</strong></span>
                  </div>
                </div>
              </div>
            </Card>
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs space-y-5">
              <h3 className="text-base font-display font-bold text-[#1E293B] dark:text-slate-100 pb-3 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] dark:text-teal-400">admin_panel_settings</span>
                Supervising Real Estate Broker Accreditations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FAFC]/80 dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400 font-sans">
                    Principal PRC Broker License
                  </span>
                  <p className="text-base font-bold font-display text-[#1E293B] dark:text-slate-100">
                    {profile.prc_license_no}
                  </p>
                  <div className="pt-2 text-xs text-[#64748B] dark:text-slate-400 font-sans flex items-center justify-between border-t border-[#E2E8F0] dark:border-slate-700">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Valid &amp; Current ({profile.prc_validity ? profile.prc_validity.slice(0, 4) : '2028'})</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC]/80 dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B6B] font-sans">
                    DHSUD Firm Registration
                  </span>
                  <p className="text-base font-bold font-display text-[#1E293B] dark:text-slate-100">
                    {profile.dhsud_accreditation_no}
                  </p>
                  <div className="pt-2 text-xs text-[#64748B] dark:text-slate-400 font-sans flex items-center justify-between border-t border-[#E2E8F0] dark:border-slate-700">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Accredited ({profile.dhsud_validity ? profile.dhsud_validity.slice(0, 4) : '2027'})</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-xs font-sans text-slate-600 dark:text-slate-300 space-y-1">
                <span className="font-bold text-[#1E293B] dark:text-slate-100 uppercase tracking-wider text-[10px] block">
                  Administrative Authority
                </span>
                <p>
                  Holds full operational oversight for firm listing publications, consultant accreditation approvals, inquiry triage reassignment, and sales conveyancing audits.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Modal using Dialog */}
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
