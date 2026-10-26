import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  AuthLayout,
  AuthSubmitButton,
  AuthFeedback,
} from '../../components/auth';
import { IconMailCheck, IconArrowRight, IconRefresh } from '@tabler/icons-react';

export default function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || location.state?.email || '';
  const [email] = useState(emailParam);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setFeedback({
        type: 'error',
        message: 'No email address specified. Please sign in or register to verify your account.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await authService.resendVerification(email);
      setFeedback({
        type: 'success',
        message: 'A fresh verification email has been dispatched. Please check your inbox.',
      });
      setCooldown(60); // 60s cooldown timer
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to resend verification email at this time.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Complete your registration to access full platform features"
    >
      <div className="space-y-6 text-left">
        <div className="w-12 h-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
          <IconMailCheck className="w-6 h-6" />
        </div>

        <p className="text-sm text-[#1E293B] leading-relaxed">
          We have sent a confirmation link to{' '}
          <strong className="text-[#0F766E] font-semibold">
            {email || 'your registered email address'}
          </strong>
          . Please click the link inside to verify your account.
        </p>

        {feedback && (
          <AuthFeedback type={feedback.type} message={feedback.message} />
        )}

        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2 text-xs text-[#64748B]">
          <p className="font-semibold text-[#1E293B]">Did not receive an email?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam or junk folder</li>
            <li>Ensure your email provider is not filtering notification emails</li>
            <li>Request a new link using the button below</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0 || !email}
            className="w-full h-[48px] rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E293B] font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0
                ? `Resend available in ${cooldown}s`
                : 'Resend Verification Email'}
            </span>
          </button>

          <Link
            to="/login"
            className="w-full h-[48px] rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Proceed to Sign In</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
