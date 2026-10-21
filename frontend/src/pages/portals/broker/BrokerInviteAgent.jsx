import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, ArrowLeft, ArrowRight, UserPlus, Send, CheckCircle2, 
  AlertCircle, Upload, Shield, Award, Mail, Phone, Building2, Check,
  Copy, RefreshCw, Sparkles, FileText, Lock
} from 'lucide-react';
import { invitationService } from '../../../services/invitationService';
import { agentService } from '../../../services/agentService';
import { cn } from '../../../utils/cn';

const STEPS = [
  { id: 1, title: 'Agent Information', desc: 'Name, role & bio' },
  { id: 2, title: 'Contact Details', desc: 'Email & mobile contact' },
  { id: 3, title: 'Professional Licenses', desc: 'PRC & DHSUD credentials' },
  { id: 4, title: 'Role & Access', desc: 'Permissions & commission tier' },
  { id: 5, title: 'Review and Send', desc: 'Confirm invitation dispatch' }
];

export default function BrokerInviteAgent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [teams, setTeams] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Real Estate Agent',
    bio: '',
    photoPreview: null,
    email: '',
    phone: '',
    brokerAgency: 'Human Shelter Realty Manila',
    prcLicenseNo: '',
    prcValidity: '',
    dhsudNo: '',
    dhsudValidity: '',
    teamId: '',
    canCreateListings: false,
    accessTier: 'standard',
    commissionTier: '3%',
    message: ''
  });

  useEffect(() => {
    agentService.getTeams().then((data) => {
      if (Array.isArray(data)) setTeams(data);
    }).catch(() => {});
  }, []);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  // Screen 11 Field Validation Helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => phone.length >= 10;
  const isValidPRC = (prc) => prc.trim().length >= 5;

  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError('Please enter the agent full name.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.email || !isValidEmail(formData.email)) {
        setError('Please provide a valid corporate or agent email address.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e, allowReissue = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await invitationService.createInvitation({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role === 'Associate Broker' ? 'broker' : 'agent',
        brokerAgency: formData.brokerAgency,
        teamId: formData.teamId || undefined,
        canCreateListings: Boolean(formData.canCreateListings),
        accessTier: formData.accessTier,
        commissionTier: formData.commissionTier,
        prcLicenseNo: formData.prcLicenseNo || undefined,
        prcValidity: formData.prcValidity || undefined,
        dhsudNo: formData.dhsudNo || undefined,
        dhsudValidity: formData.dhsudValidity || undefined,
        message: formData.message || `Welcome to Human Shelter Realty. Please finalize your professional onboarding.`,
        allowReissue,
      });

      const token = response?.token || 'inv_token_' + Math.random().toString(36).substring(2, 9);
      const inviteUrl = `${window.location.origin}/register/agent?token=${token}`;

      setSuccessResult({
        ...formData,
        token,
        inviteUrl
      });
    } catch (err) {
      setError(err.message || 'Failed to dispatch onboarding invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReissue = () => {
    handleSubmit(null, true);
  };

  const handleCopyLink = () => {
    if (!successResult) return;
    navigator.clipboard.writeText(successResult.inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
          <Link to="/broker/agents" className="hover:text-[#1E293B] transition-colors">Agents</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#1E293B] font-semibold">Invite Agent</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              Invite Agent
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Send a single-use onboarding invitation to a licensed real estate agent.
            </p>
          </div>
          <Link
            to="/broker/agents"
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Cancel</span>
          </Link>
        </div>
      </div>

      {/* Success Celebration View */}
      {successResult ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-2xs text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1E293B]">Onboarding Invitation Dispatched!</h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              An encrypted onboarding link has been sent to <strong className="text-[#1E293B]">{successResult.email}</strong>. The agent has 72 hours to complete regulatory verification.
            </p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg max-w-lg mx-auto space-y-2 text-left">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Single-Use Invitation URL</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={successResult.inviteUrl}
                className="flex-1 bg-white border border-[#CBD5E1] rounded px-3 py-1.5 text-xs font-mono text-[#0F766E] select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setCurrentStep(1);
                setFormData({
                  fullName: '',
                  role: 'Real Estate Agent',
                  bio: '',
                  photoPreview: null,
                  email: '',
                  phone: '',
                  brokerAgency: 'Human Shelter Realty Manila',
                  prcLicenseNo: '',
                  prcValidity: '',
                  dhsudNo: '',
                  dhsudValidity: '',
                  accessTier: 'standard',
                  commissionTier: '3%',
                  message: ''
                });
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Invite Another Agent
            </button>
            <button
              type="button"
              onClick={() => navigate('/broker/agents')}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Back to Agent Roster
            </button>
          </div>
        </div>
      ) : (
        /* Multi-Step Wizard Grid (Screen 2) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Progress Stepper (4-Cols on Desktop) */}
          <div className="md:col-span-4 bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
              Onboarding Steps
            </h3>

            <div className="space-y-4">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg transition-colors",
                      isCurrent && "bg-teal-50/60 border border-teal-100",
                      isCompleted && "cursor-pointer hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                      isCompleted && "bg-[#0F766E] text-white",
                      isCurrent && "bg-[#0F766E] text-white ring-4 ring-teal-100",
                      !isCompleted && !isCurrent && "bg-slate-100 text-[#64748B] border border-[#CBD5E1]"
                    )}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-bold",
                        isCurrent ? "text-[#0F766E]" : isCompleted ? "text-[#1E293B]" : "text-[#64748B]"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single-Use Onboarding Token</span>
              </div>
              <p>Link expires in 72 hours and requires government ID confirmation.</p>
            </div>
          </div>

          {/* Right Column: Active Step Form (8-Cols on Desktop) */}
          <div className="md:col-span-8 bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 animate-in fade-in duration-150 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                {error.toLowerCase().includes('already exists') && (
                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-rose-800">
                      Active pending invite found. Generate fresh 72h onboarding token?
                    </span>
                    <button
                      type="button"
                      onClick={handleReissue}
                      disabled={submitting}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      Re-issue Invite
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: Agent Information (Screen 2) */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-base font-bold text-[#1E293B]">Agent Information</h2>
                  <p className="text-xs text-[#64748B]">Provide the primary legal name, professional role, and biography.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Professional Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] cursor-pointer"
                  >
                    <option value="Real Estate Agent">Real Estate Agent</option>
                    <option value="Senior Real Estate Agent">Senior Real Estate Agent</option>
                    <option value="Associate Broker">Associate Broker</option>
                    <option value="Property Consultant">Property Consultant</option>
                  </select>
                </div>

                {/* Profile Photo Placeholder / Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Profile Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-6 text-center space-y-2 bg-[#F8FAFC]">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center mx-auto text-[#64748B]">
                      <Upload className="w-5 h-5 text-[#0F766E]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#0F766E]">Upload Photo</span>
                      <p className="text-[11px] text-[#64748B] mt-0.5">PNG, JPG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                {/* Short Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1E293B]">
                      Short Bio (Optional)
                    </label>
                    <span className="text-[11px] text-[#64748B]">{formData.bio.length}/300</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Brief professional background, target developments, or market specialties..."
                    className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Contact Details (Screen 11 Validation Standard) */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-base font-bold text-[#1E293B]">Contact Details</h2>
                  <p className="text-xs text-[#64748B]">The invitation dispatch destination and official communication channels.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Email Address * (Invitation will be sent here)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="e.g. agent@hsr.com"
                      className={cn(
                        "w-full h-10 pl-3.5 pr-10 bg-white border rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1",
                        formData.email && isValidEmail(formData.email)
                          ? "border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500"
                          : formData.email
                          ? "border-rose-400 focus:ring-rose-500 focus:border-rose-500"
                          : "border-[#E2E8F0] focus:ring-[#0F766E] focus:border-[#0F766E]"
                      )}
                    />
                    {formData.email && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isValidEmail(formData.email) ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {formData.email && !isValidEmail(formData.email) && (
                    <span className="text-[11px] text-rose-600 mt-1 block">Please enter a valid email address.</span>
                  )}
                  {formData.email && isValidEmail(formData.email) && (
                    <span className="text-[11px] text-emerald-600 mt-1 block">✓ Valid email format.</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Mobile Contact Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Brokerage Agency / Branch
                  </label>
                  <input
                    type="text"
                    value={formData.brokerAgency}
                    onChange={(e) => handleChange('brokerAgency', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Professional Licenses */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-base font-bold text-[#1E293B]">Professional Licenses & Accreditation</h2>
                  <p className="text-xs text-[#64748B]">Optional pre-fill; the agent may also submit these during registration.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      PRC License No.
                    </label>
                    <input
                      type="text"
                      value={formData.prcLicenseNo}
                      onChange={(e) => handleChange('prcLicenseNo', e.target.value)}
                      placeholder="e.g. 1234567"
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      PRC Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.prcValidity}
                      onChange={(e) => handleChange('prcValidity', e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      DHSUD Accreditation No.
                    </label>
                    <input
                      type="text"
                      value={formData.dhsudNo}
                      onChange={(e) => handleChange('dhsudNo', e.target.value)}
                      placeholder="e.g. NCR-2025-1234"
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      DHSUD Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.dhsudValidity}
                      onChange={(e) => handleChange('dhsudValidity', e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Role & Access Permissions */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-base font-bold text-[#1E293B]">Role & Access Permissions</h2>
                  <p className="text-xs text-[#64748B]">Set permissions and baseline commission arrangements.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Portal Access Tier
                  </label>
                  {[
                    { id: 'standard', title: 'Standard Agent', desc: 'Can manage assigned listings and respond to client inquiries' },
                    { id: 'senior', title: 'Senior Agent', desc: 'Can create new properties and access advanced analytics' },
                    { id: 'team_lead', title: 'Team Lead', desc: 'Can review junior agent submissions and lead team listings' }
                  ].map((tier) => (
                    <label
                      key={tier.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        formData.accessTier === tier.id
                          ? "border-[#0F766E] bg-teal-50/40 ring-1 ring-[#0F766E]"
                          : "border-[#E2E8F0] hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="accessTier"
                        value={tier.id}
                        checked={formData.accessTier === tier.id}
                        onChange={(e) => handleChange('accessTier', e.target.value)}
                        className="mt-0.5 text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#1E293B] block">{tier.title}</span>
                        <span className="text-[11px] text-[#64748B]">{tier.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Commission Split Tier
                    </label>
                    <select
                      value={formData.commissionTier}
                      onChange={(e) => handleChange('commissionTier', e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    >
                      <option value="3%">Standard 3.0% Gross Commission</option>
                      <option value="3.5%">Associate 3.5% Gross Commission</option>
                      <option value="4%">Senior 4.0% Gross Commission</option>
                      <option value="5%">Executive 5.0% Gross Commission</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Team Assignment (Optional)
                    </label>
                    <select
                      value={formData.teamId}
                      onChange={(e) => handleChange('teamId', e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    >
                      <option value="">General Roster (No Team)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.canCreateListings)}
                    onChange={(e) => handleChange('canCreateListings', e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0F766E] border-[#CBD5E1] rounded focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1E293B] block">
                      Grant Direct Listing Creation Permission
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      By default, agents propose edits on assigned listings. Enable this to allow the agent to publish new listings directly once verified.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* STEP 5: Review and Send */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2E8F0]">
                  <h2 className="text-base font-bold text-[#1E293B]">Review & Dispatch Invitation</h2>
                  <p className="text-xs text-[#64748B]">Verify invitation parameters before issuing secure token.</p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold">Prospective Agent</span>
                      <p className="font-bold text-[#1E293B] text-sm">{formData.fullName}</p>
                      <p className="text-xs text-[#64748B]">{formData.role}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Pending Dispatch
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block">Destination Email</span>
                      <strong className="text-[#1E293B]">{formData.email}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block">Agency</span>
                      <strong className="text-[#1E293B]">{formData.brokerAgency}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block">Access Tier</span>
                      <span className="font-semibold text-[#0F766E] uppercase text-[11px]">{formData.accessTier}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block">Commission Arrangement</span>
                      <span className="font-semibold text-[#1E293B]">{formData.commissionTier}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Personal Welcome Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Add an optional welcome note that will appear in their onboarding email..."
                    className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer Buttons */}
            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <button
                type="button"
                onClick={currentStep === 1 ? () => navigate('/broker/agents') : handlePrev}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Dispatch Invitation'}</span>
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
