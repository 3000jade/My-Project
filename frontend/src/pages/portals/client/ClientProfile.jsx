import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Shield,
  Check,
  AlertCircle,
  Camera,
  Bell,
  KeyRound,
  DollarSign,
  Edit3,
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import { clientUserService } from '../../../services/clientUserService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditProfileDialog, ChangePasswordDialog } from '@/components/profile';

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Dialog states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    priceDropAlerts: true,
  });

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const data = await clientUserService.getClientProfile();
        if (mounted && data) {
          setProfile(data);
          setNotifications({
            emailNotifications: data.emailNotifications ?? true,
            smsNotifications: data.smsNotifications ?? true,
            priceDropAlerts: data.priceDropAlerts ?? true,
          });
        }
      } catch (err) {
        console.warn('[ClientProfile] Load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProfile = async (formData) => {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      const nameParts = (formData.name || '').trim().split(' ');
      const firstName = formData.firstName || nameParts[0] || profile.firstName;
      const lastName = formData.lastName || nameParts.slice(1).join(' ') || profile.lastName;

      const payload = {
        ...formData,
        firstName,
        lastName,
        name: formData.name || [firstName, lastName].filter(Boolean).join(' '),
      };

      const updated = await clientUserService.updateClientProfile(payload);
      setProfile(updated);
      setEditModalOpen(false);
      setFeedback({ type: 'success', message: 'Profile information updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await clientUserService.changePassword(currentPassword, newPassword);
    setFeedback({ type: 'success', message: 'Security passphrase updated successfully.' });
  };

  const handleToggleNotification = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await clientUserService.updateClientProfile(updated);
    } catch (err) {
      console.warn('Notification preference toggle failed:', err);
    }
  };

  const clientFields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Sophia Isabella Laurel', required: true },
    { name: 'phone', label: 'Contact Phone', type: 'tel', placeholder: '+63 917 555 8899', required: true },
    { name: 'preferredLocation', label: 'Preferred Enclaves / Locations', type: 'text', placeholder: 'e.g. Bonifacio Global City, Taguig' },
    { name: 'investmentBudget', label: 'Target Acquisition Budget', type: 'text', placeholder: 'e.g. ₱50M - ₱120M' },
    { name: 'bio', label: 'Investor Profile & Acquisition Notes', type: 'textarea', placeholder: 'Private investment notes...', fullWidth: true },
  ];

  return (
    <div className="space-y-8 font-sans antialiased text-[#1E293B]">
      <PageHeader
        title="My Profile & Settings"
        subtitle="Review account credentials, update your investment parameters, and manage security preferences."
        actions={
          <Button
            type="button"
            variant="coral"
            onClick={() => setEditModalOpen(true)}
            className="h-[44px] px-5 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] font-bold shadow-xs flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        }
      />

      {/* Global Feedback Banner */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-[#DC2626]'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              ) : (
                <Check className="w-4 h-4 shrink-0 text-[#10B981]" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-xs underline cursor-pointer opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Overview Card */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <img
              src={profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={profile?.name || 'Client Avatar'}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-[#E2E8F0]"
            />
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              title="Change Profile Details"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
                {profile?.name || 'Sophia Isabella Laurel'}
              </h2>
              <Badge className="bg-[#0F766E]/10 text-[#0F766E] border-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                {profile?.role || 'Registered Client'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
              {profile?.bio || 'Private investor exploring high-yield prime estates.'}
            </p>
            <p className="text-[11px] font-mono text-[#64748B]">
              Account Member Since: {profile?.memberSince || 'March 2026'}
            </p>
          </div>
        </div>

        {/* Informational Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-[#E2E8F0]">
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
              Email Address
            </span>
            <p className="text-xs font-bold text-[#1E293B] truncate">{profile?.email}</p>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
              Contact Number
            </span>
            <p className="text-xs font-bold text-[#1E293B] truncate">{profile?.phone}</p>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
              Preferred Enclave
            </span>
            <p className="text-xs font-bold text-[#1E293B] truncate">{profile?.preferredLocation || 'Not specified'}</p>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#0F766E]" />
              Target Budget
            </span>
            <p className="text-xs font-bold text-[#1E293B] truncate">{profile?.investmentBudget || 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {/* Two Column Section: Security & Notification Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & Credentials Card */}
        <Card className="bg-white border-[#E2E8F0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F766E]/10 rounded-xl text-[#0F766E]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Security & Credentials</h3>
                <p className="text-xs text-[#64748B]">Manage passphrases and multi-factor authentication</p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B]">Authentication Method</span>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Active</Badge>
              </div>
              <p className="text-xs text-[#64748B]">Single-Factor Email/Password with TLS 1.3 encryption.</p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B]">Change Passphrase</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
              className="border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Update Password</span>
            </Button>
          </div>
        </Card>

        {/* Communication Settings Card */}
        <Card className="bg-white border-[#E2E8F0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F766E]/10 rounded-xl text-[#0F766E]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">Communication Settings</h3>
                <p className="text-xs text-[#64748B]">Configure real-time alerts and concierge dispatches</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Email Notifications</p>
                  <p className="text-[11px] text-[#64748B]">Tour schedules, proposals, and viewing alerts.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => handleToggleNotification('emailNotifications')}
                  className="w-4 h-4 accent-[#0F766E] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">SMS Priority Dispatch</p>
                  <p className="text-[11px] text-[#64748B]">Instant SMS updates for viewing confirmations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={() => handleToggleNotification('smsNotifications')}
                  className="w-4 h-4 accent-[#0F766E] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Price Drop & Enclave Alerts</p>
                  <p className="text-[11px] text-[#64748B]">Notifications when target enclave listings change.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.priceDropAlerts}
                  onChange={() => handleToggleNotification('priceDropAlerts')}
                  className="w-4 h-4 accent-[#0F766E] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reusable Profile Edit Dialog */}
      <EditProfileDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Client Profile"
        description="Update your contact details and luxury real estate acquisition criteria."
        initialData={profile || {}}
        fields={clientFields}
        onSave={handleSaveProfile}
        saving={saving}
      />

      {/* Password Security Dialog */}
      <ChangePasswordDialog
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onSave={handlePasswordChange}
      />
    </div>
  );
}
