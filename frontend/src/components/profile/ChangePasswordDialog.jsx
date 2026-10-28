import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      if (onSave) {
        await onSave(form.currentPassword, form.newPassword);
        setSuccess('Password updated successfully.');
        setTimeout(() => {
          setSuccess('');
          setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          onOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#0F766E]/10 rounded-lg text-[#0F766E]">
                <KeyRound className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                Change Password
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-[#64748B]">
              Ensure your new password contains at least 8 characters.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-[#DC2626] py-2">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 py-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <AlertDescription className="text-xs">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider">
                Current Password
              </Label>
              <Input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="h-[44px] border-[#E2E8F0] focus-visible:ring-[#0F766E]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider">
                New Password
              </Label>
              <Input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                className="h-[44px] border-[#E2E8F0] focus-visible:ring-[#0F766E]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider">
                Confirm New Password
              </Label>
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                required
                className="h-[44px] border-[#E2E8F0] focus-visible:ring-[#0F766E]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-[#E2E8F0] text-[#1E293B]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              disabled={saving}
              className="bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
