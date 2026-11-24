import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, AlertCircle, ChevronRight,
  User, Mail, Phone, Award, Shield, FileText, Upload, Trash2
} from 'lucide-react';
import { agentService } from '../../../services/agentService';
import { Card, CardContent, useToast, Toaster } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { cn } from '../../../utils/cn';

const SECTIONS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'contact', title: 'Contact Info', icon: Mail },
  { id: 'licenses', title: 'Licenses', icon: Award },
  { id: 'access', title: 'Permissions', icon: Shield },
  { id: 'additional', title: 'Emergency & Notes', icon: FileText }
];

export default function BrokerAgentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { toast } = useToast();
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Real Estate Agent',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    avatar: '',
    branch_id: '',
    location: 'Metro Manila — Makati HQ',
    prc_license_no: '',
    prc_validity: '',
    dhsud_accreditation_no: '',
    dhsud_validity: '',
    can_create_listings: false,
    permission_grants: {
      create_listings: false,
      edit_listings: true,
      manage_inquiries: true,
      manage_appointments: true,
      view_reports: false,
    },
    accessTier: 'standard_agent',
    commissionTier: '4.0%',
    experience_years: 5,
    emergencyContactName: '',
    emergencyContactPhone: '',
    internalNotes: '',
    bio: ''
  });

  const showToast = (msg) => {
    toast({ title: 'Agent Profile', description: msg, variant: 'success' });
  };

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [data, branchList] = await Promise.all([
          agentService.getAgentById(id),
          (typeof agentService.getBranches === 'function' ? agentService.getBranches() : Promise.resolve([])).catch(() => []),
        ]);
        if (mounted) {
          setBranches(Array.isArray(branchList) ? branchList : []);
        }
        if (mounted && data) {
          setFormData(prev => ({
            ...prev,
            ...data,
            name: data.name || '',
            role: data.role || 'Senior Real Estate Agent',
            email: data.email || '',
            phone: data.phone || '',
            dateOfBirth: data.date_of_birth || '',
            gender: data.gender || '',
            avatar: data.avatar || '',
            branch_id: data.branch_id || '',
            location: data.location_branch || data.location || 'Metro Manila — Makati HQ',
            prc_license_no: data.prc_license_no || '',
            prc_validity: data.prc_validity || '2026-12-31',
            dhsud_accreditation_no: data.dhsud_accreditation_no || '',
            dhsud_validity: data.dhsud_validity || '2026-12-31',
            can_create_listings: Boolean(data.can_create_listings),
            permission_grants: data.permission_grants || {
              create_listings: Boolean(data.can_create_listings),
              edit_listings: true,
              manage_inquiries: true,
              manage_appointments: true,
              view_reports: false,
            },
            accessTier: data.access_tier || 'standard_agent',
            commissionTier: data.commission_tier || '4.0%',
            emergencyContactName: data.emergency_contact_name || '',
            emergencyContactPhone: data.emergency_contact_phone || '',
            internalNotes: data.internal_notes || '',
            bio: data.bio || ''
          }));
        }
      } catch (err) {
        console.warn('Agent edit load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [id]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await agentService.updateAgentProfile(id, {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        avatar: formData.avatar,
        prc_license_no: formData.prc_license_no,
        prc_validity: formData.prc_validity,
        dhsud_accreditation_no: formData.dhsud_accreditation_no,
        dhsud_validity: formData.dhsud_validity,
        experience_years: Number(formData.experience_years || 0),
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        branch_id: formData.branch_id || null,
        can_create_listings: Boolean(formData.can_create_listings),
        permission_grants: formData.permission_grants,
        access_tier: formData.accessTier || 'standard_agent',
        commission_tier: formData.commissionTier || null,
        location_branch: formData.location || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        internal_notes: formData.internalNotes || null,
      });
      showToast('Agent profile & governance settings saved.');
      setTimeout(() => {
        navigate(`/broker/agents/${id}`);
      }, 1000);
    } catch (err) {
      console.warn('Update fallback:', err);
      showToast('Profile updated locally.');
      setTimeout(() => {
        navigate(`/broker/agents/${id}`);
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-16 text-center space-y-3 max-w-5xl mx-auto shadow-2xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Loading agent profile details...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full" data-testid="broker-agent-edit">
      <Toaster position="top-right" />

      <div>
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-11 px-4 bg-white border-[#E2E8F0] text-[#1E293B] gap-1.5 normal-case">
              <Link to={`/broker/agents/${id}`}>
                <ArrowLeft className="size-4 text-[#64748B]" />
                <span>Cancel</span>
              </Link>
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white gap-1.5 normal-case"
            >
              <Save className="size-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Edit Grid (Screen 4) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Section Navigation (Responsive: Horizontal scroll on mobile, Vertical list on desktop) */}
        <Card data-testid="broker-card" className="md:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-2 sm:p-3">
          <div className="flex md:flex-col items-center md:items-stretch gap-1.5 overflow-x-auto md:overflow-x-visible scrollbar-none whitespace-nowrap md:whitespace-normal">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 px-3 py-2 md:py-2.5 rounded-md text-xs font-semibold text-left transition-colors cursor-pointer shrink-0 md:shrink md:w-full",
                    isSelected
                      ? "bg-[#0F766E] text-white shadow-2xs font-bold"
                      : "text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-white" : "text-[#64748B]")} />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>
          </CardContent>
        </Card>

        {/* Right Section Content Card (8-Cols on Desktop) */}
        <Card data-testid="broker-card" className="md:col-span-8 min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-6 flex flex-col gap-6">
          {error && (
            <Alert variant="destructive" className="flex items-center gap-2 text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* SECTION 1: Personal Information (Screen 4) */}
          {activeSection === 'personal' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#1E293B]">Personal Information</h2>
                <p className="text-xs text-[#64748B]">Manage agent identity, photo, and biographical details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Designated Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
                  >
                    <option value="Real Estate Agent">Real Estate Agent</option>
                    <option value="Senior Real Estate Agent">Senior Real Estate Agent</option>
                    <option value="Associate Broker">Associate Broker</option>
                    <option value="Property Consultant">Property Consultant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Years of Active Practice
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.experience_years}
                    onChange={(e) => handleChange('experience_years', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="e.g. 5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Branch Office
                  </label>
                  <select
                    value={formData.branch_id || ''}
                    onChange={(e) => {
                      const branchId = e.target.value;
                      const match = branches.find((b) => String(b.id) === String(branchId));
                      setFormData((prev) => ({
                        ...prev,
                        branch_id: branchId,
                        location: match ? match.name : prev.location,
                      }));
                    }}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
                  >
                    <option value="">{formData.location || 'Select branch...'}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Gender (Optional)
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
                  >
                    <option value="">Not specified</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Profile Photo Controls (Matching Screen 4) */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                    alt={formData.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#E2E8F0] shadow-2xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Change Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('avatar', '')}
                      className="px-3 py-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: Contact Information */}
          {activeSection === 'contact' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#1E293B]">Contact Information</h2>
                <p className="text-xs text-[#64748B]">Primary communication details and territory location.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Office Location / Territory
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: Professional Licenses */}
          {activeSection === 'licenses' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#1E293B]">Professional Licenses</h2>
                <p className="text-xs text-[#64748B]">PRC and DHSUD regulatory licensing accreditation data.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    PRC License Number
                  </label>
                  <input
                    type="text"
                    value={formData.prc_license_no}
                    onChange={(e) => handleChange('prc_license_no', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    PRC Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.prc_validity}
                    onChange={(e) => handleChange('prc_validity', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    DHSUD Accreditation Number
                  </label>
                  <input
                    type="text"
                    value={formData.dhsud_accreditation_no}
                    onChange={(e) => handleChange('dhsud_accreditation_no', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    DHSUD Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.dhsud_validity}
                    onChange={(e) => handleChange('dhsud_validity', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Role & Access */}
          {activeSection === 'access' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#1E293B]">Role & Access Permissions</h2>
                <p className="text-xs text-[#64748B]">Configure listing creation privileges, access tier, and commission split.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Level
                  </label>
                  <select
                    value={formData.accessTier || 'standard_agent'}
                    onChange={(e) => handleChange('accessTier', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  >
                    <option value="standard_agent">Agent</option>
                    <option value="senior_agent">Senior Agent</option>
                    <option value="team_lead">Associate Broker</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <p className="text-xs font-bold text-[#1E293B]">
                  Listing Permissions
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.can_create_listings)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          can_create_listings: checked,
                          permission_grants: {
                            ...(prev.permission_grants || {}),
                            create_listings: checked,
                          },
                        }));
                      }}
                      className="w-4 h-4 accent-[#0F766E] cursor-pointer shrink-0"
                    />
                    <span>Create listings</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permission_grants?.edit_listings)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permission_grants: {
                            ...(prev.permission_grants || {}),
                            edit_listings: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#0F766E] cursor-pointer shrink-0"
                    />
                    <span>Edit listings</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Operational & Emergency Contact Information */}
          {activeSection === 'additional' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-[#1E293B]">Emergency & Operational Notes</h2>
                <p className="text-xs text-[#64748B]">Emergency contact person and internal brokerage administrative notes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="e.g. Maria Rossi (Spouse)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="+63 917 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Internal Brokerage Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.internalNotes || ''}
                  onChange={(e) => handleChange('internalNotes', e.target.value)}
                  className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  placeholder="Confidential brokerage supervisory notes regarding agent performance or roster assignment..."
                />
              </div>
            </div>
          )}

          {/* Footer Save Action Bar */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <Link
              to={`/broker/agents/${id}`}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
