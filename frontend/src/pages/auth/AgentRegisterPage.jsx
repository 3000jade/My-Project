import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Lock,
  Check,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  Camera,
  User,
} from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import { agentCredentialsService } from '../../services/agentCredentialsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const STEPS = [
  { id: 1, title: 'Your Name' },
  { id: 2, title: 'Phone Number' },
  { id: 3, title: 'Create Password' },
  { id: 4, title: 'Profile Photo' },
  { id: 5, title: 'License Details' },
  { id: 6, title: 'Verification Documents' },
];

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function BrandLogo() {
  return (
    <img
      src="/images/human-shelter-logo.webp"
      alt="Human Shelter Realty"
      className="h-12 sm:h-14 w-auto object-contain mx-auto"
    />
  );
}

export default function AgentRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const token = searchParams.get('token');

  // Token verification state: 'VERIFYING' | 'VALID' | 'EXPIRED' | 'INVALID'
  const [verificationState, setVerificationState] = useState('VERIFYING');
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');

  // Step & form states
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    prcLicenseNo: '',
    prcValidity: '',
    dhsudAccreditationNo: '',
    dhsudValidity: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
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
          setTokenErrorMessage('Invitation link is missing a valid token. Please request a new invite.');
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
          const reason =
            res?.reason ||
            (res?.error && res.error.toLowerCase().includes('expire') ? 'EXPIRED' : 'INVALID');
          if (reason === 'EXPIRED') {
            setVerificationState('EXPIRED');
          } else {
            setVerificationState('INVALID');
            setTokenErrorMessage(
              res?.error || 'This invitation link is no longer valid or has already been used.'
            );
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
          setTokenErrorMessage(errMsg || 'Unable to verify this invitation link.');
        }
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFormError('Profile photo must be 5MB or smaller.');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const composedFullName = [formData.firstName, formData.middleName, formData.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.firstName.trim()) return 'Please enter your first name.';
      if (!formData.lastName.trim()) return 'Please enter your last name.';
    }
    if (step === 2) {
      if (!formData.phone.trim()) return 'Please enter your phone number.';
    }
    if (step === 3) {
      if (formData.password.length < 8) return 'Password must be at least 8 characters long.';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 5) {
      if (!formData.prcLicenseNo.trim()) return 'Please enter your PRC license number.';
      if (!formData.prcValidity) return 'Please select your PRC expiry date.';
      if (!formData.dhsudAccreditationNo.trim()) return 'Please enter your DHSUD number.';
      if (!formData.dhsudValidity) return 'Please select your DHSUD expiry date.';
    }
    return '';
  };

  const handleNextStep = () => {
    const err = validateStep(currentStep);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevStep = () => {
    setFormError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
      setFormError(
        `Document upload failed: ${err.response?.data?.error || err.message || 'Unknown error'}`
      );
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDoc = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < STEPS.length) {
      handleNextStep();
      return;
    }

    for (const stepNum of [1, 2, 3, 5]) {
      const err = validateStep(stepNum);
      if (err) {
        setFormError(err);
        setCurrentStep(stepNum);
        return;
      }
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      // shortcut: avatarDataUrl is included in payload; persist to profiles.avatar_url in backend when ready
      await invitationService.registerAgent({
        token,
        email: invitedEmail,
        password: formData.password,
        fullName: composedFullName,
        phone: formData.phone,
        prcLicenseNo: formData.prcLicenseNo,
        prcValidity: formData.prcValidity,
        dhsudAccreditationNo: formData.dhsudAccreditationNo,
        dhsudValidity: formData.dhsudValidity,
        documents,
        ...(avatarPreview ? { avatarDataUrl: avatarPreview } : {}),
      });

      setIsSuccess(true);
    } catch (err) {
      setFormError(
        err?.response?.data?.error || err?.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStepMeta = STEPS[currentStep - 1];
  const progressValue = Math.round((currentStep / STEPS.length) * 100);

  return (
    <MotionConfig reducedMotion="user">
      {/* 1. Verifying State (Centered Shimmer Skeleton Card) */}
      {verificationState === 'VERIFYING' && (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex w-full max-w-lg flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <BrandLogo />
              <Skeleton className="h-8 w-48" />
            </div>
            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-11 w-full" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Expired Invitation State */}
      {verificationState === 'EXPIRED' && (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="rounded-xl border-amber-200">
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <BrandLogo />
                <div className="flex size-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                  <Clock className="size-6" />
                </div>
                <Badge variant="warning">Link Expired (72 Hours)</Badge>
                <h1 className="text-xl font-semibold tracking-tight text-on-surface">
                  Invitation Link Expired
                </h1>
                <p className="text-sm text-on-surface-variant">
                  For your security, agent invitation links stay active for 72 hours. Ask your broker to send a fresh invite.
                </p>
                <div className="flex w-full flex-col gap-2 pt-2">
                  <Button asChild size="lg" className="w-full">
                    <Link to="/contact">Contact Broker</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link to="/login">Back to Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* 3. Invalid or Used Invitation State */}
      {verificationState === 'INVALID' && (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <BrandLogo />
                <div className="flex size-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
                  <AlertCircle className="size-6" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-on-surface">
                  Invitation Link Not Valid
                </h1>
                <p className="text-sm text-on-surface-variant">
                  {tokenErrorMessage ||
                    'This invitation link is invalid, has been revoked, or was already used.'}
                </p>
                <div className="flex w-full flex-col gap-2 pt-2">
                  <Button asChild size="lg" className="w-full">
                    <Link to="/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* 4. End Screen: Successfully Registered */}
      {verificationState === 'VALID' && isSuccess && (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <BrandLogo />
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={composedFullName || 'Profile photo'}
                      className="size-20 rounded-full border-2 border-emerald-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <Check className="size-7" />
                    </div>
                  )}
                  {avatarPreview && (
                    <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white">
                      <Check className="size-4" />
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-on-surface">
                  Successfully Registered
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Your agent account has been created and sent to your broker for review.
                </p>

                <div className="flex w-full flex-col gap-2 rounded-lg border border-outline bg-surface-variant/60 p-4 text-left text-sm">
                  {composedFullName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-on-surface-variant">Name</span>
                      <span className="truncate font-medium text-on-surface">{composedFullName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">Email</span>
                    <span className="truncate font-medium text-on-surface">{invitedEmail}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">Status</span>
                    <Badge variant="warning">Pending Broker Review</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">Estimated Review</span>
                    <span className="font-medium text-on-surface">24–48 hours</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="mt-2 h-11 w-full normal-case tracking-normal text-sm font-semibold"
                  onClick={() => navigate('/login')}
                >
                  <span>Go to Login</span>
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* 5. Active Step-by-Step Registration (Single Centered Medium Card) */}
      {verificationState === 'VALID' && !isSuccess && (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex w-full max-w-lg flex-col gap-6">
            {/* Brand Header */}
            <header className="flex flex-col items-center gap-4 text-center">
              <BrandLogo />
              <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-[28px]">
                Agent Registration
              </h1>
            </header>

            {/* Centered Medium Stepper Card */}
            <Card className="rounded-xl border-outline bg-surface shadow-xs">
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                  {/* Step Header & Progress */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold text-on-surface">
                        {activeStepMeta.title}
                      </h2>
                      <span className="text-xs font-medium text-on-surface-variant">
                        Step {currentStep} of {STEPS.length}
                      </span>
                    </div>
                    <Progress value={progressValue} aria-label={`Step ${currentStep} of ${STEPS.length}`} />
                  </div>

                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {/* Step 1: Your Name */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                      >
                        <FieldGroup className="gap-4">
                          <Field data-disabled className="gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <FieldLabel htmlFor="invitedEmail" className="text-sm font-medium text-on-surface">
                                Email
                              </FieldLabel>
                              <Badge variant="default">
                                <Lock className="size-3" />
                                Verified Invite
                              </Badge>
                            </div>
                            <div className="relative">
                              <Input
                                id="invitedEmail"
                                type="email"
                                value={invitedEmail}
                                disabled
                                readOnly
                                aria-readonly="true"
                                className="h-11 bg-surface-variant pl-10 text-sm font-medium text-on-surface opacity-100"
                              />
                              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                            </div>
                            <FieldDescription className="text-xs text-on-surface-variant">
                              Linked to your invitation email
                            </FieldDescription>
                          </Field>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field className="gap-2">
                              <FieldLabel htmlFor="firstName" className="text-sm font-medium text-on-surface">
                                First Name <span className="text-red-600">*</span>
                              </FieldLabel>
                              <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                required
                                autoComplete="given-name"
                                placeholder="Maria"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>

                            <Field className="gap-2">
                              <FieldLabel htmlFor="middleName" className="text-sm font-medium text-on-surface">
                                Middle Name
                              </FieldLabel>
                              <Input
                                id="middleName"
                                name="middleName"
                                type="text"
                                autoComplete="additional-name"
                                placeholder="Optional"
                                value={formData.middleName}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>
                          </div>

                          <Field className="gap-2">
                            <FieldLabel htmlFor="lastName" className="text-sm font-medium text-on-surface">
                              Last Name <span className="text-red-600">*</span>
                            </FieldLabel>
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              required
                              autoComplete="family-name"
                              placeholder="Santos"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="h-11 text-sm"
                            />
                          </Field>
                        </FieldGroup>
                      </motion.div>
                    )}

                    {/* Step 2: Phone Number */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                      >
                        <FieldGroup className="gap-4">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="phone" className="text-sm font-medium text-on-surface">
                              Phone Number <span className="text-red-600">*</span>
                            </FieldLabel>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              autoComplete="tel"
                              placeholder="+63 917 555 4321"
                              value={formData.phone}
                              onChange={handleChange}
                              className="h-11 text-sm"
                            />
                            <FieldDescription className="text-xs text-on-surface-variant">
                              Used for client inquiries and broker updates
                            </FieldDescription>
                          </Field>
                        </FieldGroup>
                      </motion.div>
                    )}

                    {/* Step 3: Create Password */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                      >
                        <FieldGroup className="gap-4">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="password" className="text-sm font-medium text-on-surface">
                              Password <span className="text-red-600">*</span>
                            </FieldLabel>
                            <div className="relative">
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={formData.password}
                                onChange={handleChange}
                                className="h-11 pr-11 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </Field>

                          <Field className="gap-2">
                            <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium text-on-surface">
                              Confirm Password <span className="text-red-600">*</span>
                            </FieldLabel>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              required
                              autoComplete="new-password"
                              placeholder="Re-enter password"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className="h-11 text-sm"
                            />
                          </Field>
                        </FieldGroup>
                      </motion.div>
                    )}

                    {/* Step 4: Profile Photo (Large Circle Upload) */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step-4"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col items-center gap-4 py-2 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          aria-label="Upload profile photo"
                          className="group relative flex size-36 items-center justify-center rounded-full border-2 border-dashed border-outline-variant bg-surface-variant/60 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer"
                        >
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Profile preview"
                              className="size-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-on-surface-variant group-hover:text-primary">
                              <User className="size-12" />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-xs">
                            <Camera className="size-4" />
                          </span>
                        </button>

                        <input
                          ref={avatarInputRef}
                          type="file"
                          id="avatar-upload"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="sr-only"
                        />

                        <div className="flex flex-col items-center gap-1">
                          <p className="text-sm font-medium text-on-surface">
                            {avatarPreview ? 'Looking good!' : 'Add a profile photo'}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            JPG, PNG, or WebP up to 5MB (Optional)
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => avatarInputRef.current?.click()}
                            className="h-11 normal-case tracking-normal text-sm"
                          >
                            {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                          {avatarPreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              onClick={() => setAvatarPreview('')}
                              className="h-11 normal-case tracking-normal text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 5: License Details */}
                    {currentStep === 5 && (
                      <motion.div
                        key="step-5"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                      >
                        <FieldGroup className="gap-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field className="gap-2">
                              <FieldLabel htmlFor="prcLicenseNo" className="text-sm font-medium text-on-surface">
                                PRC License Number <span className="text-red-600">*</span>
                              </FieldLabel>
                              <Input
                                id="prcLicenseNo"
                                name="prcLicenseNo"
                                type="text"
                                required
                                placeholder="PRC-REB-0089123"
                                value={formData.prcLicenseNo}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>

                            <Field className="gap-2">
                              <FieldLabel htmlFor="prcValidity" className="text-sm font-medium text-on-surface">
                                PRC Expiry Date <span className="text-red-600">*</span>
                              </FieldLabel>
                              <Input
                                id="prcValidity"
                                name="prcValidity"
                                type="date"
                                required
                                value={formData.prcValidity}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field className="gap-2">
                              <FieldLabel htmlFor="dhsudAccreditationNo" className="text-sm font-medium text-on-surface">
                                DHSUD Number <span className="text-red-600">*</span>
                              </FieldLabel>
                              <Input
                                id="dhsudAccreditationNo"
                                name="dhsudAccreditationNo"
                                type="text"
                                required
                                placeholder="DHSUD-NCR-AA-2024-9988"
                                value={formData.dhsudAccreditationNo}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>

                            <Field className="gap-2">
                              <FieldLabel htmlFor="dhsudValidity" className="text-sm font-medium text-on-surface">
                                DHSUD Expiry Date <span className="text-red-600">*</span>
                              </FieldLabel>
                              <Input
                                id="dhsudValidity"
                                name="dhsudValidity"
                                type="date"
                                required
                                value={formData.dhsudValidity}
                                onChange={handleChange}
                                className="h-11 text-sm"
                              />
                            </Field>
                          </div>
                        </FieldGroup>
                      </motion.div>
                    )}

                    {/* Step 6: Verification Documents */}
                    {currentStep === 6 && (
                      <motion.div
                        key="step-6"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-4"
                      >
                        <p className="text-xs text-on-surface-variant">
                          Upload your PRC ID, DHSUD certificate, or valid government ID &bull; PDF, PNG, JPG up to 10MB
                        </p>

                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-background p-4 text-center sm:p-6">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-primary">
                            <Upload className="size-5" />
                          </div>
                          <p className="text-sm font-medium text-on-surface">
                            {uploadingDoc ? 'Uploading file...' : 'Upload verification files'}
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="doc-upload"
                            onChange={handleFileUpload}
                            disabled={uploadingDoc}
                            className="sr-only"
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={uploadingDoc}
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 h-11 normal-case tracking-normal"
                          >
                            Choose File
                          </Button>
                        </div>

                        {documents.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {documents.map((doc, idx) => (
                              <div
                                key={doc.id || idx}
                                className="flex items-center justify-between gap-2 rounded-lg border border-outline bg-background px-3 py-2 text-sm"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <FileText className="size-4 shrink-0 text-primary" />
                                  <span className="truncate font-medium text-on-surface">{doc.name}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {(doc.viewUrl || (doc.webViewLink && doc.webViewLink !== '#')) && (
                                    <a
                                      href={
                                        doc.viewUrl
                                          ? agentCredentialsService.getDocumentContentUrl(doc.id, token)
                                          : doc.webViewLink
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-medium text-primary hover:underline"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="size-3" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeDoc(idx)}
                                    aria-label="Remove document"
                                    className="flex size-11 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Separator />

                        <div className="flex items-center gap-3 rounded-lg border border-outline bg-surface-variant/60 p-4 text-sm">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt={composedFullName || 'Profile'}
                              className="size-10 shrink-0 rounded-full border border-outline object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-on-surface-variant border border-outline">
                              <User className="size-5" />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate font-semibold text-on-surface">
                              {composedFullName || '—'}
                            </span>
                            <span className="truncate text-xs text-on-surface-variant">
                              {formData.phone} &bull; {invitedEmail}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step Navigation Footer */}
                  <div className="flex items-center gap-3 pt-2">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handlePrevStep}
                        disabled={isSubmitting || uploadingDoc}
                        className="h-11 normal-case tracking-normal text-sm font-medium"
                      >
                        <ArrowLeft data-icon="inline-start" className="size-4" />
                        <span>Back</span>
                      </Button>
                    )}

                    {currentStep < STEPS.length ? (
                      <Button
                        key="continue-btn"
                        type="button"
                        size="lg"
                        onClick={handleNextStep}
                        className="h-11 flex-1 normal-case tracking-normal text-sm font-semibold"
                      >
                        <span>Continue</span>
                        <ArrowRight data-icon="inline-end" className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        key="submit-btn"
                        type="submit"
                        size="lg"
                        loading={isSubmitting}
                        disabled={isSubmitting || uploadingDoc}
                        className="h-11 flex-1 normal-case tracking-normal text-sm font-semibold"
                      >
                        <span>Submit Registration</span>
                        <ArrowRight data-icon="inline-end" className="size-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </MotionConfig>
  );
}
