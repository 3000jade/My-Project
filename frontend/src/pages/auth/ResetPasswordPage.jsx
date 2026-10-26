import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  AuthLayout,
  PasswordField,
  AuthSubmitButton,
  AuthFeedback,
} from '../../components/auth';
import { IconCheck, IconAlertCircle, IconArrowRight } from '@tabler/icons-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Extract recovery token from URL query param or hash fragment (e.g. Supabase redirect)
  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
      return;
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const hashToken = params.get('access_token') || params.get('token');
      if (hashToken) {
        setToken(hashToken);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or expired password reset link. Please request a new one.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword });
      setSuccess(true);
      // Clean up sensitive token material from URL bar
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Ensure your new password satisfies security guidelines"
    >
      {success ? (
        <div className="space-y-6 text-left">
          <AuthFeedback
            type="success"
            message="Your password has been successfully updated. You can now sign in with your new credentials."
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full h-[48px] rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Continue to Sign In</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : !token ? (
        <div className="space-y-6 text-left">
          <AuthFeedback
            type="error"
            message="No recovery token detected in the URL. Password reset links are time-limited and single-use."
          />

          <p className="text-xs text-[#64748B]">
            Please submit a new password reset request to obtain a valid recovery link.
          </p>

          <div className="pt-2">
            <Link
              to="/forgot-password"
              className="w-full h-[48px] rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthFeedback type="error" message={error} />}

          <PasswordField
            id="reset-new-password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            showStrengthMeter
          />

          <PasswordField
            id="reset-confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
          />

          <div className="pt-2">
            <AuthSubmitButton
              loading={loading}
              loadingText="Updating Password..."
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              Update Password
            </AuthSubmitButton>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              Cancel and Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
