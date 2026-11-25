import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import sessionCoordinator from '@/services/sessionCoordinator';
import OtpInput from '@/components/auth/OtpInput';
import AuthStepProgress from '@/components/auth/smart-auth/AuthStepProgress';
import GoogleAuthButton from '@/components/auth/smart-auth/GoogleAuthButton';
import RegisterPhoneStep from '@/components/auth/smart-auth/RegisterPhoneStep';
import RegisterFullNameStep from '@/components/auth/smart-auth/RegisterFullNameStep';
import RegisterProfileStep from '@/components/auth/smart-auth/RegisterProfileStep';
import RegisterSuccessCard from '@/components/auth/smart-auth/RegisterSuccessCard';
import {
  evaluatePasswordStrength,
  saveRememberedEmail,
  suggestEmailCorrection,
} from '@/components/auth/smart-auth/smartAuthHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';

const STEP_ANIMATION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

const PRIMARY_BUTTON_CLASS =
  'w-full h-14 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-base normal-case tracking-normal gap-2';

const INPUT_CLASS =
  'h-14 px-4 rounded-lg border-outline bg-surface text-base text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin, completeRegistration } = useAuth();

  // Steps: 'email' | 'otp' | 'phone' | 'name' | 'password' | 'success'
  const [step, setStep] = useState('email');

  const [emailInput, setEmailInput] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [verificationToken, setVerificationToken] = useState('');

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [existingAccountEmail, setExistingAccountEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const emailSuggestion = useMemo(() => suggestEmailCorrection(emailInput), [emailInput]);
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const activeEmail = resolvedEmail || emailInput;

  const handleCapsLockCheck = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const resetToEmailStep = () => {
    setStep('email');
    setOtp('');
    setVerificationToken('');
    setPassword('');
    setShowPassword(false);
    setCapsLockOn(false);
    setAuthError('');
    setExistingAccountEmail('');
    setSuccessMsg('');
  };

  const completeAuthRedirect = (role) => {
    const rawSearch =
      location.search || (typeof window !== 'undefined' ? window.location.search : '');
    const searchParams = new URLSearchParams(rawSearch);
    const returnUrlParam = searchParams.get('returnUrl') || location.state?.from?.pathname;
    const validReturn = returnUrlParam
      ? sessionCoordinator.validateReturnTo(decodeURIComponent(returnUrlParam))
      : null;

    if (validReturn && (role === 'admin' || validReturn.startsWith(`/${role || 'client'}`))) {
      navigate(validReturn);
      return;
    }

    if (role === 'admin') navigate('/admin/cms');
    else if (role === 'agent') navigate('/agent/dashboard');
    else if (role === 'broker') navigate('/broker/dashboard');
    else navigate('/client/dashboard');
  };

  // Step 1: Check email and send 6-digit verification code
  const handleStartRegistration = async (e) => {
    if (e) e.preventDefault();
    const cleaned = String(emailInput || '').trim();
    if (!cleaned) {
      setAuthError('Please enter your email.');
      return;
    }

    setAuthError('');
    setExistingAccountEmail('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const result = await authService.identifyEmail(cleaned);
      const nextEmail = result?.email || cleaned.toLowerCase();

      if (result?.status === 'existing') {
        setExistingAccountEmail(nextEmail);
        setAuthError('An account with this email already exists.');
        return;
      }

      if (result?.status === 'invited_agent') {
        setAuthError(
          'This email has a broker invitation. Please open the invite link sent to your email.'
        );
        return;
      }

      setResolvedEmail(nextEmail);
      setEmailInput(nextEmail);

      const otpRes = await authService.initiateRegistrationOtp({
        email: nextEmail,
        channel: 'email',
        role: 'client',
      });
      setCooldown(otpRes?.cooldownSeconds || 60);
      setOtp('');
      setVerificationToken('');
      setStep('otp');

      if (otpRes?.devOtp) {
        setSuccessMsg(`Test code: ${otpRes.devOtp}`);
      }
    } catch (err) {
      setAuthError(
        err?.message || 'Please enter a valid email (like name@example.com).'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit Email OTP
  const handleVerifyEmailOtp = async (codeOverride) => {
    const code = codeOverride || otp;
    if (!code || code.length !== 6) {
      setAuthError('Please enter all 6 digits.');
      return;
    }

    setAuthError('');
    setIsVerifying(true);

    try {
      const targetEmail = activeEmail.trim().toLowerCase();
      const res = await authService.verifyRegistrationEmail(targetEmail, code);
      setVerificationToken(res?.verificationToken || '');
      setSuccessMsg('');
      setStep('phone');
    } catch (err) {
      setAuthError(err?.message || 'That code did not match. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setAuthError('');
    setIsResending(true);

    try {
      const targetEmail = activeEmail.trim().toLowerCase();
      const res = await authService.resendRegistrationOtp(targetEmail, 'email');
      setCooldown(res?.cooldownSeconds || 60);
      setOtp('');
      if (res?.devOtp) {
        setSuccessMsg(`New test code: ${res.devOtp}`);
      } else {
        setSuccessMsg('We sent a new code to your email.');
      }
    } catch (err) {
      setAuthError(err?.message || 'Could not resend the code right now. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 3: Phone Number
  const handlePhoneContinue = (e) => {
    if (e) e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      setAuthError('Please enter a valid phone number.');
      return;
    }
    setAuthError('');
    setSuccessMsg('');
    setStep('name');
  };

  // Step 4: Full Name
  const handleNameContinue = (e) => {
    if (e) e.preventDefault();
    if (fullName.trim().length < 2) {
      setAuthError('Please enter your full name.');
      return;
    }
    setAuthError('');
    setSuccessMsg('');
    setStep('password');
  };

  // Step 5: Password & Complete Registration
  const handleCompleteRegistration = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (!passwordStrength.allMet) {
      setAuthError('Please make sure your password meets all 4 rules below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetEmail = activeEmail.trim().toLowerCase();
      const payload = {
        email: targetEmail,
        verificationToken,
        phone: phone.trim(),
        fullName: fullName.trim(),
        password,
      };

      const authData = completeRegistration
        ? await completeRegistration(payload)
        : await authService.completeRegistration(payload);

      saveRememberedEmail(targetEmail);
      setCreatedAccount({
        role: authData?.user?.role || 'client',
        fullName: fullName.trim(),
        email: targetEmail,
      });
      setStep('success');
    } catch (err) {
      const errorMessage = err?.message || 'We could not create your account. Please try again.';
      const isExpired =
        err?.response?.data?.data?.code === 'VERIFICATION_EXPIRED' ||
        errorMessage.toLowerCase().includes('expired');

      if (isExpired) {
        try {
          const targetEmail = activeEmail.trim().toLowerCase();
          const otpRes = await authService.resendRegistrationOtp(targetEmail, 'email');
          setCooldown(otpRes?.cooldownSeconds || 60);
          setOtp('');
          setVerificationToken('');
          setStep('otp');
          setAuthError('Your code expired. We sent a fresh 6-digit code to continue.');
          if (otpRes?.devOtp) {
            setSuccessMsg(`New test code: ${otpRes.devOtp}`);
          }
        } catch {
          setAuthError(errorMessage);
        }
      } else {
        setAuthError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setAuthError('Google did not return sign-up details. Please try again.');
      return;
    }

    setAuthError('');
    setIsSubmitting(true);
    try {
      const authData = await googleLogin(credentialResponse.credential, 'client');
      if (authData?.user?.email) saveRememberedEmail(authData.user.email);
      completeAuthRedirect(authData?.user?.role || 'client');
    } catch (err) {
      setAuthError(err?.message || 'Google sign-up did not go through. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setAuthError('Google sign-up was cancelled. You can try again or use your email.');
  };

  const headingByStep = {
    email: 'Create an account',
    otp: 'Verify your email',
    phone: 'Your phone number',
    name: 'Your full name',
    password: 'Create a password',
  };

  const handleTopBackClick = () => {
    setAuthError('');
    setExistingAccountEmail('');
    setSuccessMsg('');
    if (step === 'password') setStep('name');
    else if (step === 'name') setStep('phone');
    else if (step !== 'email') resetToEmailStep();
    else navigate('/');
  };

  const topBackLabel =
    step === 'password'
      ? 'Back'
      : step === 'name'
      ? 'Back'
      : step !== 'email'
      ? 'Change email'
      : 'Home';

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen w-full bg-background text-on-surface font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
          {/* Back / Home button directly at the top of the card */}
          {step !== 'success' && (
            <div className="flex items-center justify-start">
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={handleTopBackClick}
                className="h-11 px-2 text-on-surface-variant hover:text-on-surface normal-case tracking-normal font-medium text-base gap-2"
              >
                <ArrowLeft className="size-5" />
                <span>{topBackLabel}</span>
              </Button>
            </div>
          )}

          {/* Single Centered XL Registration Card */}
          <Card
            data-testid="register-card"
            className="bg-surface border border-outline rounded-xl shadow-xs"
          >
            <CardHeader className="p-6 sm:p-8 pb-4 flex flex-col gap-6">
              <Link
                to="/"
                aria-label="Human Shelter Realty Home"
                className="inline-flex items-center self-center"
              >
                <img
                  src="/images/human-shelter-logo.webp"
                  alt="Human Shelter Realty"
                  className="h-20 sm:h-24 w-auto max-w-full object-contain"
                />
              </Link>

              <AuthStepProgress step={step} />

              {step !== 'success' && (
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
                    {headingByStep[step]}
                  </CardTitle>
                  {step === 'otp' && (
                    <CardDescription className="text-base text-on-surface-variant">
                      Enter the 6-digit code sent to{' '}
                      <span className="font-medium text-on-surface">{activeEmail}</span>.
                    </CardDescription>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 sm:p-8 pt-2 flex flex-col gap-6">
              <AnimatePresence mode="wait">
                {successMsg && (
                  <motion.div key="success-alert" {...STEP_ANIMATION}>
                    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 rounded-lg">
                      <Check className="size-4 text-emerald-700" />
                      <AlertDescription className="text-xs leading-relaxed text-emerald-700">
                        {successMsg}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {authError && (
                  <motion.div key="error-alert" {...STEP_ANIMATION}>
                    <Alert
                      variant="destructive"
                      className="bg-red-50 border-red-200 text-red-600 rounded-lg"
                    >
                      <AlertCircle className="size-4 text-red-600" />
                      <AlertDescription className="text-xs leading-relaxed text-red-600">
                        {authError}{' '}
                        {existingAccountEmail && (
                          <Link
                            to="/login"
                            className="font-semibold underline underline-offset-2 text-red-700 hover:text-red-800"
                          >
                            Sign in instead
                          </Link>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 1: Email */}
              {step === 'email' && (
                <motion.div key="step-email" {...STEP_ANIMATION} className="flex flex-col gap-6">
                  <form onSubmit={handleStartRegistration} className="flex flex-col gap-6">
                    <FieldGroup className="gap-4">
                      <Field className="gap-2">
                        <FieldLabel
                          htmlFor="register-email"
                          className="text-base font-medium text-on-surface"
                        >
                          Email
                        </FieldLabel>
                        <Input
                          id="register-email"
                          type="email"
                          autoComplete="email"
                          autoFocus
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (authError) setAuthError('');
                            if (existingAccountEmail) setExistingAccountEmail('');
                          }}
                          placeholder="name@example.com"
                          className={INPUT_CLASS}
                          required
                        />
                      </Field>
                    </FieldGroup>

                    {emailSuggestion && (
                      <div className="flex items-center justify-between gap-2 p-2 px-4 rounded-lg bg-tertiary-container/60 border border-primary/20 text-sm text-on-surface">
                        <span className="inline-flex items-center gap-2 min-w-0 truncate">
                          <Sparkles className="size-4 text-primary shrink-0" />
                          <span className="truncate">
                            Did you mean <strong className="font-semibold">{emailSuggestion}</strong>?
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmailInput(emailSuggestion)}
                          className="h-9 px-2 text-sm font-semibold text-primary hover:text-primary-hover normal-case tracking-normal shrink-0"
                        >
                          Use this
                        </Button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={PRIMARY_BUTTON_CLASS}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="text-white" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-sm text-on-surface-variant whitespace-nowrap">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isSubmitting}
                    text="signup_with"
                    onFallbackClick={() =>
                      handleGoogleSuccess({ credential: 'mock-google-token-client' })
                    }
                  />

                  <p className="text-center text-xs leading-relaxed text-on-surface-variant">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="font-medium text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-medium text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  <p className="text-center text-sm text-on-surface-variant pt-4 border-t border-outline">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-primary hover:text-primary-hover hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* Step 2: 6-Digit Email Verification */}
              {step === 'otp' && (
                <motion.div key="step-otp" {...STEP_ANIMATION} className="flex flex-col gap-6">
                  <OtpInput
                    size="lg"
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (authError) setAuthError('');
                    }}
                    onComplete={(code) => handleVerifyEmailOtp(code)}
                    disabled={isVerifying}
                    error={Boolean(authError)}
                  />

                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>Didn&apos;t get a code?</span>
                    {cooldown > 0 ? (
                      <span className="font-semibold text-on-surface tabular-nums">
                        Resend in {cooldown}s
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="h-11 text-sm font-semibold text-primary hover:text-primary-hover normal-case tracking-normal gap-2"
                      >
                        {isResending && <Spinner size="sm" />}
                        <span>Resend code</span>
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleVerifyEmailOtp(otp)}
                    disabled={isVerifying || otp.length !== 6}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    {isVerifying ? (
                      <>
                        <Spinner size="sm" className="text-white" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify</span>
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Phone Number */}
              {step === 'phone' && (
                <motion.div key="step-phone" {...STEP_ANIMATION}>
                  <RegisterPhoneStep
                    phone={phone}
                    onChangePhone={(val) => {
                      setPhone(val);
                      if (authError) setAuthError('');
                    }}
                    onSubmit={handlePhoneContinue}
                  />
                </motion.div>
              )}

              {/* Step 4: Full Name */}
              {step === 'name' && (
                <motion.div key="step-name" {...STEP_ANIMATION}>
                  <RegisterFullNameStep
                    fullName={fullName}
                    onChangeFullName={(val) => {
                      setFullName(val);
                      if (authError) setAuthError('');
                    }}
                    onSubmit={handleNameContinue}
                  />
                </motion.div>
              )}

              {/* Step 5: Password */}
              {step === 'password' && (
                <motion.div key="step-password" {...STEP_ANIMATION}>
                  <RegisterProfileStep
                    password={password}
                    onChangePassword={(val) => {
                      setPassword(val);
                      if (authError) setAuthError('');
                    }}
                    showPassword={showPassword}
                    onToggleShowPassword={() => setShowPassword((prev) => !prev)}
                    passwordStrength={passwordStrength}
                    capsLockOn={capsLockOn}
                    onCapsLockCheck={handleCapsLockCheck}
                    isSubmitting={isSubmitting}
                    onSubmit={handleCompleteRegistration}
                  />
                </motion.div>
              )}

              {/* Done: Account Created */}
              {step === 'success' && (
                <motion.div key="step-success" {...STEP_ANIMATION}>
                  <RegisterSuccessCard
                    fullName={createdAccount?.fullName || fullName}
                    email={createdAccount?.email || activeEmail}
                    onContinue={() => completeAuthRedirect(createdAccount?.role || 'client')}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </MotionConfig>
  );
}
