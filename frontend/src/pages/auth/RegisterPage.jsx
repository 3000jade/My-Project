import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconMailCheck,
  IconArrowLeft,
  IconEdit,
} from '@tabler/icons-react';
import { GoogleLogin, useGoogleOAuth } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from '../../components/auth';
import { authService } from '../../services/authService';

function GoogleOAuthSafe({ onSuccess, onError, fallback }) {
  let hasProvider = false;
  try {
    const context = useGoogleOAuth();
    hasProvider = Boolean(context?.clientId);
  } catch {
    hasProvider = false;
  }

  if (!hasProvider) return fallback;

  return (
    <div className="w-full flex justify-center overflow-hidden rounded-xl border border-[#e1e5df] hover:border-[#c2c9bf] transition-colors">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        theme="outline"
        size="large"
        shape="rectangular"
        width="100%"
        text="signup_with"
      />
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, googleLogin, verifyRegistrationOtp } = useAuth();

  // Workflow Step State: 'credentials' | 'otp'
  const [step, setStep] = useState('credentials');

  // Credentials State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 60-Second Cooldown Countdown Timer
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Password Rules & Validation
  const passwordRules = [
    { id: 'length', label: '8+ Characters', met: password.length >= 8 },
    { id: 'mixedCase', label: 'Upper & Lowercase', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { id: 'number', label: 'At least 1 Number', met: /\d/.test(password) },
    { id: 'symbol', label: 'Special Symbol', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const metRulesCount = passwordRules.filter(r => r.met).length;
  const strengthLabels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-[#e1e5df]', 'bg-red-500', 'bg-[#c4683c]', 'bg-yellow-500', 'bg-[#2d6a4f]'];

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  // Step 1: Validate credentials and initiate 6-digit email OTP
  const handleInitiateOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (!agreeTerms) {
      setAuthError('You must agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passphrases do not match. Please verify your credentials.');
      return;
    }

    if (metRulesCount < 2) {
      setAuthError('Please ensure your passphrase satisfies core security guidelines.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'client',
      };
      if (phone.trim()) payload.phone = phone.trim();

      const res = await authService.initiateRegistrationOtp(payload);
      setCooldown(res?.data?.cooldownSeconds || 60);
      setStep('otp');
      setOtp('');

      if (res?.data?.devOtp) {
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${email.trim().toLowerCase()}. (Dev Test Code: ${res.data.devOtp})`);
      } else {
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${email.trim().toLowerCase()}.`);
      }
    } catch (err) {
      setAuthError(err.message || 'Unable to initiate verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP and establish session
  const handleVerifyOtp = async (codeOverride) => {
    const code = codeOverride || otp;
    if (!code || code.length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code.');
      return;
    }

    setAuthError('');
    setIsVerifying(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: code,
        password,
        fullName: fullName.trim(),
        role: 'client',
      };
      if (phone.trim()) payload.phone = phone.trim();

      const authData = verifyRegistrationOtp
        ? await verifyRegistrationOtp(payload)
        : await authService.verifyRegistrationOtp(payload);

      setSuccessMsg('Email verified successfully! Redirecting to client portal...');
      setTimeout(() => {
        const targetRole = authData?.user?.role || 'client';
        navigate(`/${targetRole}/dashboard`);
      }, 600);
    } catch (err) {
      setAuthError(err.message || 'Verification failed. Please check your 6-digit code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend 6-Digit OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setAuthError('');
    setIsResending(true);

    try {
      const res = await authService.resendRegistrationOtp(email.trim().toLowerCase());
      setCooldown(res?.data?.cooldownSeconds || 60);
      setOtp('');
      if (res?.data?.devOtp) {
        setSuccessMsg(`A fresh verification code has been sent. (Dev Test Code: ${res.data.devOtp})`);
      } else {
        setSuccessMsg('A fresh verification code has been dispatched to your email.');
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to resend verification code. Please wait.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setAuthError('Google registration did not provide valid credentials.');
      return;
    }

    setAuthError('');
    setIsSubmitting(true);
    try {
      const authData = await googleLogin(credentialResponse.credential, 'client');
      const targetRole = authData?.user?.role || 'client';
      navigate(`/${targetRole}/dashboard`);
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setAuthError('Google authentication was cancelled or failed.');
  };

  return (
    <>
      <main className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row m-0 p-0 overflow-x-hidden font-sans selection:bg-[#c4683c] selection:text-white bg-[#ffffff]">

        {/* =========================================================================
            LEFT: ARCHITECTURAL SHOWCASE (100% full bleed on wide screens, 50% width)
            ========================================================================= */}
        <section className="w-full lg:w-1/2 h-[340px] sm:h-[420px] lg:h-full relative shrink-0 bg-[#183d3b] text-white border-0 overflow-hidden group">
          {/* Full bleed photo extending to the far left monitor edge */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88"
            alt="Scandinavian Modernist Architecture"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.76] contrast-[1.06] group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Ambient Nordic Pine Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#183d3b]/95 via-[#183d3b]/35 to-black/25 pointer-events-none" />

          {/* Direct positioning in left lower corner without limiting container */}
          <div className="relative z-10 w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-end border-0">

            {/* Bottom: Editorial Slogan & 3-Pill Carousel Indicator in Lower Left Corner */}
            <div className="max-w-[480px] space-y-4">
              <span className="font-mono text-xs tracking-widest text-[#a8b8b0] uppercase">
                {step === 'otp' ? 'Step 02 / Verification' : 'Step 01 / Identity Onboarding'}
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight text-white leading-[1.15]">
                {step === 'otp' ? 'Verification with Precision' : 'Quiet Precision, Cadastral Clarity'}
              </h1>

              <p className="font-sans text-xs sm:text-sm text-[#e1e5df] font-light leading-relaxed">
                {step === 'otp'
                  ? 'Secure single-use One-Time Password validation ensures verified registry access for accredited high-value acquisitions.'
                  : 'Experience modern luxury real estate infrastructure engineered for accredited investors, corporate buyers, and discerning clientele.'}
              </p>

              {/* 3-Pill Carousel Indicators in Lower Left Corner */}
              <div className="flex items-center gap-2 pt-2">
                <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'credentials' ? 'w-8 bg-[#c4683c]' : 'w-4 bg-white/40'}`} />
                <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'otp' ? 'w-8 bg-[#c4683c]' : 'w-4 bg-white/40'}`} />
                <span className="h-1.5 w-4 rounded-full bg-white/40" />
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            RIGHT: ELEVATED DAYLIGHT AUTH CONSOLE (100% full bleed to right monitor edge)
            ========================================================================= */}
        <section className="w-full lg:w-1/2 min-h-full lg:h-full bg-[#ffffff] relative flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto border-0">

          {/* Back to Home / Back to Details Button */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
            <button
              type="button"
              onClick={() => {
                if (step === 'otp') {
                  setStep('credentials');
                  setAuthError('');
                  setSuccessMsg('');
                } else {
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#f4f5f2] hover:bg-[#e1e5df] border border-[#e1e5df] hover:border-[#c2c9bf] rounded-full text-xs font-medium text-[#183d3b] transition-all hover:-translate-x-0.5 shadow-sm cursor-pointer"
            >
              <span>←</span>
              <span>{step === 'otp' ? 'Back to details' : 'Back to home'}</span>
            </button>
          </div>

          {/* Inner Form Column (Max-width 440px centered on page) */}
          <div className="w-full max-w-[440px] space-y-5 sm:space-y-6 my-auto py-2 border-0 mx-auto">

            {/* Header */}
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-[#1c2224] leading-tight">
                {step === 'otp' ? 'Verify your email' : 'Create an account'}
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#5f6b6f]">
                {step === 'otp' ? (
                  <span>
                    Enter the 6-digit verification code dispatched to your inbox.
                  </span>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-[#183d3b] hover:text-[#c4683c] font-semibold underline underline-offset-4 ml-1 cursor-pointer transition-colors"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Agent / Broker Invitation Info Callout (Step 1 Only) */}
            {step === 'credentials' && (
              <div className="p-3 bg-[#F0FDFA] border border-[#0F766E]/20 rounded-xl text-left">
                <p className="font-sans text-xs text-[#0F766E] leading-relaxed">
                  <strong>Licensed Real Estate Professional?</strong> Real estate agent onboarding requires a broker invitation token under RESA RA 9646.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register/agent')}
                    className="font-semibold underline hover:text-[#115E59] cursor-pointer"
                  >
                    Enter broker invite code
                  </button>
                </p>
              </div>
            )}

            {/* Success Feedback Banner */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-[#F0FDF4] border border-[#22C55E]/30 text-[#15803D] text-xs rounded-xl font-sans flex items-start gap-2.5 shadow-sm text-left"
                >
                  <IconCheck className="w-4 h-4 shrink-0 text-[#22C55E] mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline Error Banner */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-[#fcf1eb] border border-[#c4683c]/30 text-[#b0572d] text-xs rounded-xl font-sans flex items-start gap-2.5 shadow-sm text-left"
                >
                  <IconAlertCircle className="w-4 h-4 shrink-0 text-[#c4683c] mt-0.5" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 1: CREDENTIALS INTAKE FORM */}
            {step === 'credentials' && (
              <form onSubmit={handleInitiateOtp} className="space-y-3.5 sm:space-y-4">

                {/* Full Name with Header Label */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-fullname" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Full Name
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all overflow-hidden">
                    <input
                      id="reg-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="Enter your full name"
                      type="text"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Email with Header Label */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-email" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Email
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all overflow-hidden">
                    <input
                      id="reg-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="name@domain.com"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Contact Number with Header Label */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-phone" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Contact Number
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all overflow-hidden">
                    <input
                      id="reg-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="+63 917 000 0000"
                      type="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Create Password */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-password" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Password
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all flex items-center pr-2 overflow-hidden">
                    <input
                      id="reg-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="Create secure passphrase"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#7a868a] hover:text-[#183d3b] p-2 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-confirm-password" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Confirm Password
                  </label>
                  <div className={`relative bg-[#f4f5f2] border ${!passwordsMatch ? 'border-red-400 focus-within:border-red-500' : 'border-[#e1e5df] focus-within:border-[#183d3b]'} focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all flex items-center pr-2 overflow-hidden`}>
                    <input
                      id="reg-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="Re-enter passphrase"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#7a868a] hover:text-[#183d3b] p-2 transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Mismatch Feedback */}
                {!passwordsMatch && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-sans">
                    <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Passphrases do not match. Please verify your credentials.</span>
                  </div>
                )}

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="p-3 bg-[#f4f5f2] border border-[#e1e5df] rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${metRulesCount >= step ? strengthColors[metRulesCount] : 'bg-[#e1e5df]'
                            }`}
                        />
                      ))}
                      <span className="font-mono text-[9px] text-[#7a868a] uppercase ml-1">
                        {strengthLabels[metRulesCount]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-sans">
                      {passwordRules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 transition-colors ${rule.met ? 'text-[#2d6a4f] font-medium' : 'text-[#7a868a]'
                            }`}
                        >
                          {rule.met ? (
                            <IconCheck className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#bec8c8] shrink-0" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agreement Checkbox */}
                <div className="pt-0.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      aria-label="I agree to the Terms of Service and Privacy Policy"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#183d3b] accent-[#183d3b] cursor-pointer shrink-0"
                    />
                    <span className="font-sans text-xs sm:text-[13px] text-[#5f6b6f] leading-snug">
                      I agree to the <span className="text-[#183d3b] font-semibold hover:underline">Terms of Service</span> and <span className="text-[#183d3b] font-semibold hover:underline">Privacy Policy</span>.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-1.5">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting || !passwordsMatch}
                    className="w-full h-[54px] bg-[#183d3b] hover:bg-[#122e2c] text-white font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(24,61,59,0.35)] hover:shadow-[0_14px_28px_-5px_rgba(24,61,59,0.45)] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <IconRefresh className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </span>
                    ) : (
                      <span>Continue to Verification</span>
                    )}
                  </motion.button>
                </div>

              </form>
            )}

            {/* STEP 2: IN-PLACE 6-DIGIT EMAIL OTP VERIFICATION */}
            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 text-left"
              >
                {/* Email Chip with Quick Edit Action */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                      <IconMailCheck className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">Target Recipient</p>
                      <p className="text-xs font-semibold text-[#1E293B] truncate">{email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setAuthError('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0F766E] hover:bg-[#0F766E]/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Change email"
                  >
                    <IconEdit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* 6-Digit Otp Input Box */}
                <div className="space-y-2 py-2">
                  <label className="block text-center font-sans text-xs font-semibold text-[#1E293B] tracking-wide">
                    6-Digit Security Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (authError) setAuthError('');
                    }}
                    onComplete={(completeCode) => handleVerifyOtp(completeCode)}
                    disabled={isVerifying}
                    error={Boolean(authError)}
                    autoFocus
                  />
                  <p className="text-center font-sans text-[11px] text-[#64748B]">
                    Code expires in 10 minutes.
                  </p>
                </div>

                {/* Cooldown Timer & Resend Link */}
                <div className="flex items-center justify-center text-xs font-sans text-[#64748B] pt-1">
                  {cooldown > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span>Resend code in</span>
                      <strong className="font-mono text-[#0F766E] font-bold">
                        0:{cooldown < 10 ? '0' : ''}{cooldown}
                      </strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="font-semibold text-[#0F766E] hover:underline cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isResending && <IconRefresh className="w-3.5 h-3.5 animate-spin" />}
                      <span>Resend verification code</span>
                    </button>
                  )}
                </div>

                {/* Submit Verification Button */}
                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => handleVerifyOtp(otp)}
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full h-[54px] bg-[#0F766E] hover:bg-[#115E59] text-white font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(15,118,110,0.35)] hover:shadow-[0_14px_28px_-5px_rgba(15,118,110,0.45)] cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <span className="inline-flex items-center gap-2">
                        <IconRefresh className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </span>
                    ) : (
                      <span>Verify & Complete Registration</span>
                    )}
                  </motion.button>
                </div>

                {/* Back to Step 1 */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setAuthError('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                  >
                    <IconArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to credentials</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Social SSO Button (Google OAuth - Step 1 Only) */}
            {step === 'credentials' && (
              <>
                <div className="w-full flex items-center justify-center pt-2">
                  <div className="h-[1px] bg-[#e1e5df] flex-1" />
                  <span className="px-4 font-sans text-xs text-[#7a868a] select-none text-center whitespace-nowrap">
                    Or register with
                  </span>
                  <div className="h-[1px] bg-[#e1e5df] flex-1" />
                </div>

                <div className="w-full pt-0.5">
                  <GoogleOAuthSafe
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    fallback={
                      <button
                        type="button"
                        onClick={() => setAuthError('Google authentication requires an active Google Client ID.')}
                        className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#ffffff] hover:bg-[#f4f5f2] font-sans text-xs sm:text-sm font-semibold text-[#1c2224] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm hover:border-[#c2c9bf]"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.31 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.57 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                        </svg>
                        <span>Google</span>
                      </button>
                    }
                  />
                </div>
              </>
            )}

          </div>
        </section>

      </main>
    </>
  );
}
