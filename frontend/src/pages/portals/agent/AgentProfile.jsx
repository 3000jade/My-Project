import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileCheck,
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import PublicAgentProfileModal from '../../../components/ui/modals/PublicAgentProfileModal';
import { profileService, mockDefaultProfiles } from '../../../services/profileService';
import { agentService, computeAgentCompleteness } from '../../../services/agentService';

export default function AgentProfile() {
  const [agent, setAgent] = useState(() => ({
    ...mockDefaultProfiles.agent,
    membership_status: 'active',
    onboarding_status: 'complete',
    routing_availability: 'available',
    team_name: 'Luxury Residential Advisory',
    location_branch: 'Makati & BGC Prime',
    completeness: computeAgentCompleteness(mockDefaultProfiles.agent),
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [publicPreviewOpen, setPublicPreviewOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: mockDefaultProfiles.agent.firstName,
    lastName: mockDefaultProfiles.agent.lastName,
    email: mockDefaultProfiles.agent.email,
    phone: mockDefaultProfiles.agent.phone,
    bio: mockDefaultProfiles.agent.bio,
    experience_years: mockDefaultProfiles.agent.experience_years || 5,
    prc_license_no: mockDefaultProfiles.agent.prc_license_no || '',
    prc_validity: mockDefaultProfiles.agent.prc_validity || '',
    dhsud_accreditation_no: mockDefaultProfiles.agent.dhsud_accreditation_no || '',
    dhsud_validity: mockDefaultProfiles.agent.dhsud_validity || '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      try {
        data = await agentService.getMyProfile();
      } catch {
        data = await profileService.getProfile({ role: 'agent' });
      }

      if (data) {
        const parts = (data.name || '').split(' ');
        const firstName = data.firstName || parts[0] || '';
        const lastName = data.lastName || parts.slice(1).join(' ') || '';
        const completeness = computeAgentCompleteness(data);

        const merged = {
          ...mockDefaultProfiles.agent,
          ...data,
          firstName,
          lastName,
          completeness,
        };
        setAgent(merged);
        setForm({
          firstName,
          lastName,
          email: merged.email || '',
          phone: merged.phone || '',
          bio: merged.bio || '',
          experience_years: merged.experience_years ?? 5,
          prc_license_no: merged.prc_license_no || '',
          prc_validity: merged.prc_validity || '',
          dhsud_accreditation_no: merged.dhsud_accreditation_no || '',
          dhsud_validity: merged.dhsud_validity || '',
        });
      }
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
      firstName: agent.firstName || (agent.name || '').split(' ')[0] || '',
      lastName: agent.lastName || (agent.name || '').split(' ').slice(1).join(' ') || '',
      email: agent.email || '',
      phone: agent.phone || '',
      bio: agent.bio || '',
      experience_years: agent.experience_years ?? 5,
      prc_license_no: agent.prc_license_no || '',
      prc_validity: agent.prc_validity || '',
      dhsud_accreditation_no: agent.dhsud_accreditation_no || '',
      dhsud_validity: agent.dhsud_validity || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const credentialsChanged =
      form.prc_license_no !== agent.prc_license_no ||
      form.prc_validity !== agent.prc_validity ||
      form.dhsud_accreditation_no !== agent.dhsud_accreditation_no ||
      form.dhsud_validity !== agent.dhsud_validity;

    try {
      const updated = await profileService.updateProfile(
        {
          name: fullName,
          fullName,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
          experience_years: Number(form.experience_years || 0),
          prc_license_no: form.prc_license_no,
          prc_validity: form.prc_validity,
          dhsud_accreditation_no: form.dhsud_accreditation_no,
          dhsud_validity: form.dhsud_validity,
        },
        { role: 'agent' }
      );

      const nextState = {
        ...agent,
        ...updated,
        name: fullName,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bio: form.bio,
        experience_years: Number(form.experience_years || 0),
        prc_license_no: form.prc_license_no,
        prc_validity: form.prc_validity,
        dhsud_accreditation_no: form.dhsud_accreditation_no,
        dhsud_validity: form.dhsud_validity,
        onboarding_status: credentialsChanged ? 'pending_review' : agent.onboarding_status,
      };
      nextState.completeness = computeAgentCompleteness(nextState);
      setAgent(nextState);
      setEditModalOpen(false);
      showToast(
        credentialsChanged
          ? 'Profile & license credentials submitted for Broker verification.'
          : 'Public profile details updated.'
      );
    } catch (err) {
      console.warn('Agent profile update fallback:', err.message);
      const nextState = {
        ...agent,
        name: fullName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
        experience_years: Number(form.experience_years || 0),
        prc_license_no: form.prc_license_no,
        prc_validity: form.prc_validity,
        dhsud_accreditation_no: form.dhsud_accreditation_no,
        dhsud_validity: form.dhsud_validity,
      };
      nextState.completeness = computeAgentCompleteness(nextState);
      setAgent(nextState);
      setEditModalOpen(false);
      showToast('Profile updated.');
    } finally {
      setSaving(false);
    }
  };

  const completeness = agent.completeness || computeAgentCompleteness(agent);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Agent Credentials & Profile"
        subtitle="Manage your public advisor profile, PRC/DHSUD regulatory licenses, and onboarding readiness."
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Profile' },
        ]}
        actions={
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setPublicPreviewOpen(true)}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#0F766E]" />
              <span>Preview Public Card</span>
            </button>
            <button
              type="button"
              onClick={loadProfile}
              disabled={loading}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleOpenEdit}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadProfile}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3-Dimensional Status & Onboarding Completeness Banner */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Onboarding & Operational Readiness
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                {completeness.percent}% Complete
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              {completeness.isComplete
                ? 'All required profile and regulatory credential items are complete.'
                : `Complete the remaining ${completeness.missingFields.length} item(s) to maintain full operational eligibility.`}
            </p>
          </div>

          {/* 3D Status Pills */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Membership: {(agent.membership_status || 'active').toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
              Onboarding: {(agent.onboarding_status || 'complete').replace('_', ' ').toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-[#1E293B] border border-[#E2E8F0]">
              Routing: {(agent.routing_availability || 'available').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dynamic Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(completeness.checklist || []).map((item) => (
            <div
              key={item.key}
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                item.completed
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B]'
                  : 'bg-amber-50/60 border-amber-200 text-amber-800'
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-medium truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 bg-white rounded-lg border border-[#E2E8F0] flex flex-col items-center justify-center text-[#64748B] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Loading consultant profile credentials...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Brokerage Card */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#0F766E]/30 shadow-xs"
              />
              <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-[#E2E8F0] shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">{agent.name}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{agent.role}</p>
              {agent.team_name && (
                <p className="text-xs font-semibold text-[#0F766E] mt-1 flex items-center justify-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{agent.team_name}</span>
                </p>
              )}
            </div>

            <div className="pt-1">
              <StatusBadge status={agent.verification_status} />
            </div>

            <div className="w-full pt-5 border-t border-[#E2E8F0] space-y-3 text-xs text-left">
              <div>
                <span className="text-[#64748B] block text-[10px] font-bold uppercase tracking-wider">
                  Email Address
                </span>
                <span className="font-semibold text-[#1E293B]">{agent.email}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-bold uppercase tracking-wider">
                  Mobile Contact
                </span>
                <span className="font-mono font-semibold text-[#1E293B]">{agent.phone}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-bold uppercase tracking-wider">
                  Active Practice
                </span>
                <span className="font-semibold text-[#1E293B]">
                  {agent.experience_years ?? 5} Years Active Practice
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-bold uppercase tracking-wider">
                  Listing Creation Permission
                </span>
                <span className="font-semibold text-[#1E293B]">
                  {agent.can_create_listings
                    ? 'Direct Listing Creation Enabled'
                    : 'Assigned Listings & Edit Proposals'}
                </span>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Credentials & Biography */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0F766E]" />
                  <span>Philippine Regulatory Licenses</span>
                </h3>
                <span className="text-[11px] font-semibold text-[#64748B]">
                  Broker-Supervised Compliance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                      PRC Real Estate License
                    </span>
                    <FileCheck className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <p className="text-base font-bold font-mono text-[#1E293B]">
                    {agent.prc_license_no || 'Not Provided'}
                  </p>
                  <div className="pt-2 text-xs text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]">
                    <span>Validity:</span>
                    <span className="font-mono font-semibold text-[#1E293B]">
                      {agent.prc_validity || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                      DHSUD Accreditation
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <p className="text-base font-bold font-mono text-[#1E293B]">
                    {agent.dhsud_accreditation_no || 'Not Provided'}
                  </p>
                  <div className="pt-2 text-xs text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]">
                    <span>Expiration:</span>
                    <span className="font-mono font-semibold text-[#1E293B]">
                      {agent.dhsud_validity || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Accreditation Active:</strong> Public profile fields (Name, Phone, Bio) update immediately. Any changes to PRC or DHSUD license numbers or expiry dates automatically queue for Principal Broker verification.
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
              <h3 className="text-base font-bold text-[#1E293B]">Executive Biography</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{agent.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Credentials Modal */}
      <DashboardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile & Regulatory Credentials"
        subtitle="Update your public advisor bio or submit renewed PRC/DHSUD credentials for Broker review."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="agent-first-name" className="text-xs font-semibold text-[#1E293B]">
                First Name
              </label>
              <input
                id="agent-first-name"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-last-name" className="text-xs font-semibold text-[#1E293B]">
                Last Name
              </label>
              <input
                id="agent-last-name"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="agent-email" className="text-xs font-semibold text-[#1E293B]">
                Contact Email
              </label>
              <input
                id="agent-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-phone" className="text-xs font-semibold text-[#1E293B]">
                Mobile Phone
              </label>
              <input
                id="agent-phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
            <div className="space-y-1">
              <label htmlFor="agent-prc-no" className="text-xs font-semibold text-[#1E293B]">
                PRC License Number
              </label>
              <input
                id="agent-prc-no"
                type="text"
                value={form.prc_license_no}
                onChange={(e) => setForm({ ...form, prc_license_no: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-prc-val" className="text-xs font-semibold text-[#1E293B]">
                PRC Expiry Date
              </label>
              <input
                id="agent-prc-val"
                type="date"
                value={form.prc_validity}
                onChange={(e) => setForm({ ...form, prc_validity: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="agent-dhsud-no" className="text-xs font-semibold text-[#1E293B]">
                DHSUD Accreditation No.
              </label>
              <input
                id="agent-dhsud-no"
                type="text"
                value={form.dhsud_accreditation_no}
                onChange={(e) => setForm({ ...form, dhsud_accreditation_no: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="agent-dhsud-val" className="text-xs font-semibold text-[#1E293B]">
                DHSUD Expiry Date
              </label>
              <input
                id="agent-dhsud-val"
                type="date"
                value={form.dhsud_validity}
                onChange={(e) => setForm({ ...form, dhsud_validity: e.target.value })}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="agent-bio" className="text-xs font-semibold text-[#1E293B]">
              Professional Bio
            </label>
            <textarea
              id="agent-bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full p-3.5 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>
      </DashboardModal>

      {/* Public Profile Card Preview Modal */}
      <PublicAgentProfileModal
        isOpen={publicPreviewOpen}
        onClose={() => setPublicPreviewOpen(false)}
        agent={{
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          avatar: agent.avatar,
          bio: agent.bio,
          experience_years: agent.experience_years,
          brokerage_name: agent.brokerage_name || 'Human Shelter Realty',
          team_name: agent.team_name || 'Luxury Residential Advisory',
          location_branch: agent.location_branch || 'Metro Manila',
          verification_status: 'VERIFIED',
          prc_verified: Boolean(agent.prc_license_no),
          dhsud_verified: Boolean(agent.dhsud_accreditation_no),
          routing_availability: agent.routing_availability || 'available',
          assigned_properties_count: agent.assigned_properties_count || 4,
          recorded_sales_count: agent.recorded_sales_count || 6,
        }}
      />
    </div>
  );
}
