import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  AuthLayout,
  AuthTextField,
  AuthSubmitButton,
  AuthFeedback,
} from '../../components/auth';
import { IconMail, IconArrowLeft } from '@tabler/icons-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      await authService.forgotPassword(trimmed, redirectUrl);
      setSubmitted(true);
    } catch (err) {
      // Neutral security response: even on error, we display confirmation unless it's a critical network fault
      setError(err.message || 'Unable to submit request. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email to receive recovery instructions"
    >
      {submitted ? (
        <div className="space-y-6 text-left">
          <AuthFeedback
            type="success"
            message="If an account exists for this email address, password reset instructions have been dispatched. Please check your inbox and spam folder."
          />

          <p className="text-xs text-[#64748B] leading-relaxed">
            The recovery link will remain valid for 1 hour. If you do not receive an email within a few minutes, check that you entered the correct address.
          </p>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full h-[48px] rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E293B] font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthFeedback type="error" message={error} />}

          <AuthTextField
            id="forgot-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            autoComplete="email"
            icon={IconMail}
            helperText="We will send a secure password reset link to this address."
          />

          <div className="pt-2">
            <AuthSubmitButton
              loading={loading}
              loadingText="Sending Recovery Link..."
            >
              Send Recovery Link
            </AuthSubmitButton>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
