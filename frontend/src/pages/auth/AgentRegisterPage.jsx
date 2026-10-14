import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconLock, 
  IconCheck, 
  IconAlertCircle, 
  IconUpload, 
  IconFileText, 
  IconTrash, 
  IconEye, 
  IconEyeOff,
  IconBuildingSkyscraper,
  IconArrowRight,
  IconClock,
  IconExternalLink
} from '@tabler/icons-react';
import { invitationService } from '../../services/invitationService';
import { agentCredentialsService } from '../../services/agentCredentialsService';

export default function AgentRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Token verification state: 'VERIFYING' | 'VALID' | 'EXPIRED' | 'INVALID'
  const [verificationState, setVerificationState] = useState('VERIFYING');
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    prcLicenseNo: '',
    prcValidity: '',
    dhsudAccreditationNo: '',
    dhsudValidity: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate invitation token on mount
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setVerificationState('INVALID');
          setTokenErrorMessage('Invitation token is missing from the URL. Please request a new invite.');
        }
        return;
      }

      try {
        const res = await invitationService.validateToken(token);
        if (!isMounted) return;

        if (res?.valid) {
          setInvitedEmail(res.email || '');
          setVerificationState('VALID');
        } else {
          const reason = res?.reason || (res?.error && res.error.toLowerCase().includes('expire') ? 'EXPIRED' : 'INVALID');
          if (reason === 'EXPIRED') {
            setVerificationState('EXPIRED');
          } else {
            setVerificationState('INVALID');
            setTokenErrorMessage(res?.error || 'Invitation link is no longer valid or has already been used.');
          }
        }
      } catch (err) {
        if (!isMounted) return;
        const errData = err?.response?.data;
        const reason = errData?.data?.reason;
        const errMsg = errData?.error || err?.message || '';

        if (reason === 'EXPIRED' || errMsg.toLowerCase().includes('expire')) {
          setVerificationState('EXPIRED');
        } else {
          setVerificationState('INVALID');
          setTokenErrorMessage(errMsg || 'Failed to validate invitation token.');
        }
      }
    }

    checkToken();
    return () => { isMounted = false; };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDoc(true);
    setFormError('');

    try {
      const file = files[0];
      const uploaded = await agentCredentialsService.uploadCredential({
        file,
        token,
        kind: 'other',
      });
      setDocuments((prev) => [
        ...prev,
        {
          id: uploaded.id,
          name: uploaded.name || file.name,
          kind: uploaded.kind,
          fileId: uploaded.id,
          viewUrl: uploaded.viewUrl,
          size: uploaded.size || file.size,
        },
      ]);
    } catch (err) {
      setFormError(`Document upload failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDoc = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passphrases do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await invitationService.registerAgent({
        token,
        email: invitedEmail,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        prcLicenseNo: formData.prcLicenseNo,
        prcValidity: formData.prcValidity,
        dhsudAccreditationNo: formData.dhsudAccreditationNo,
        dhsudValidity: formData.dhsudValidity,
        documents,
      });

      setIsSuccess(true);
    } catch (err) {
      setFormError(err?.response?.data?.error || err?.message || 'Registration failed. Please check your entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial Verifying State
  if (verificationState === 'VERIFYING') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono uppercase tracking-wider text-[#0F766E] font-medium">
          Verifying Credential Invitation...
        </span>
      </div>
    );
  }

  // 2. Dedicated Expired State Card
  if (verificationState === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-lg p-8 border border-amber-200 shadow-sm text-center"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <IconClock size={26} />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold mb-2 font-mono">
            LINK EXPIRED (72H WINDOW)
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] tracking-tight mb-2">
            Invitation Link Has Expired
          </h2>
          <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
            This single-use onboarding invitation has expired. For credential protection and platform security, onboarding links are valid for 72 hours from dispatch.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              to="/contact"
              className="w-full h-10 inline-flex items-center justify-center rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Contact Principal Broker to Reissue
            </Link>
            <Link
              to="/login"
              className="w-full h-10 inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Invalid or Already Used State Card
  if (verificationState === 'INVALID') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-lg p-8 border border-[#E2E8F0] shadow-sm text-center"
        >
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <IconAlertCircle size={26} />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] tracking-tight mb-2">
            Invalid or Redeemed Invitation
          </h2>
          <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
            {tokenErrorMessage || 'This onboarding invitation link is invalid, has been revoked, or has already been redeemed.'}
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full h-10 inline-flex items-center justify-center rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Go to Login
            </Link>
            <Link
              to="/contact"
              className="w-full h-10 inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Success Screen: Pending Supervisory Review
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-lg p-8 sm:p-10 border border-[#E2E8F0] shadow-sm text-center"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <IconCheck size={32} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#0F766E] font-semibold block mb-1">
            Credentials Recorded
          </span>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight mb-2">
            Onboarding Dossier Submitted
          </h2>
          <p className="text-xs text-[#64748B] leading-relaxed mb-6">
            Your agent profile and PRC/DHSUD accreditations have been submitted for supervisory review. Once approved by the principal broker, your listing and client management tools will activate.
          </p>
          
          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] mb-6 text-left text-xs text-[#64748B] font-mono space-y-1.5">
            <p><strong className="text-[#1E293B]">Registered Email:</strong> {invitedEmail}</p>
            <p><strong className="text-[#1E293B]">Account Status:</strong> <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PENDING BROKER REVIEW</span></p>
            <p><strong className="text-[#1E293B]">Review Timeline:</strong> 24–48 hours for compliance verification</p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>Proceed to Login</span>
            <IconArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // 5. Active Registration Form View
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200/60 text-xs font-medium mb-3">
            <IconBuildingSkyscraper size={14} />
            <span>Human Shelter Realty | Agent Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
            Agent Credential Registration
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Complete your professional onboarding dossier to gain access to the brokerage network.
          </p>
        </div>

        {/* Form Container Card */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <IconAlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Email (Locked & Pre-filled per Requirement 2) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1E293B]">
                  Designated Email Address *
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                  <IconLock size={12} />
                  Locked to Invitation
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={invitedEmail}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="w-full h-11 px-3.5 pl-10 rounded-lg bg-slate-50 border border-[#E2E8F0] text-slate-700 font-medium cursor-not-allowed text-xs sm:text-sm select-all"
                />
                <IconLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                This account is bound to your secure single-use invitation token and cannot be altered.
              </p>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Julian Vance"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+63 917 555 4321"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 pr-10 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* PRC License & Validity */}
            <div className="pt-3 border-t border-[#E2E8F0]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prcLicenseNo" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                    PRC Real Estate License No *
                  </label>
                  <input
                    id="prcLicenseNo"
                    name="prcLicenseNo"
                    type="text"
                    required
                    placeholder="PRC-REB-0089123"
                    value={formData.prcLicenseNo}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label htmlFor="prcValidity" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                    PRC Validity Date *
                  </label>
                  <input
                    id="prcValidity"
                    name="prcValidity"
                    type="date"
                    required
                    value={formData.prcValidity}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                  />
                </div>
              </div>
            </div>

            {/* DHSUD Accreditation & Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dhsudAccreditationNo" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  DHSUD Accreditation No *
                </label>
                <input
                  id="dhsudAccreditationNo"
                  name="dhsudAccreditationNo"
                  type="text"
                  required
                  placeholder="DHSUD-NCR-AA-2024-9988"
                  value={formData.dhsudAccreditationNo}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label htmlFor="dhsudValidity" className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  DHSUD Validity Date *
                </label>
                <input
                  id="dhsudValidity"
                  name="dhsudValidity"
                  type="date"
                  required
                  value={formData.dhsudValidity}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Google Drive Document Upload Section */}
            <div className="pt-3 border-t border-[#E2E8F0]">
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                Supporting Credential Attachments (PRC ID, Certificate, Government ID)
              </label>
              
              <div className="border border-dashed border-[#E2E8F0] hover:border-[#0F766E] transition-colors rounded-lg p-5 text-center bg-[#F8FAFC]">
                <IconUpload size={24} className="mx-auto text-[#0F766E] mb-1.5" />
                <p className="text-xs text-[#1E293B] font-medium">
                  {uploadingDoc ? 'Uploading to Secure Cloud Storage...' : 'Upload verification attachments'}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  PDF, PNG, JPG up to 10MB each
                </p>
                <input
                  type="file"
                  id="doc-upload"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="doc-upload"
                  className="inline-block mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#1E293B] cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Choose Document File
                </label>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <IconFileText size={16} className="text-[#0F766E] shrink-0" />
                        <span className="font-medium text-[#1E293B] truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {(doc.viewUrl || (doc.webViewLink && doc.webViewLink !== '#')) && (
                          <a
                            href={doc.viewUrl ? agentCredentialsService.getDocumentContentUrl(doc.id, token) : doc.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0F766E] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>View</span>
                            <IconExternalLink size={12} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDoc(idx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                          aria-label="Remove document"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission CTA */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || uploadingDoc}
                className="w-full h-11 rounded-lg bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Agent Onboarding</span>
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
