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
  Save, 
  Bell, 
  KeyRound,
  DollarSign
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredLocation: '',
    investmentBudget: '',
    bio: '',
  });

  // Change Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passSaving, setPassSaving] = useState(false);

  // Notification toggles
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
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            preferredLocation: data.preferredLocation || '',
            investmentBudget: data.investmentBudget || '',
            bio: data.bio || '',
          });
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
    return () => { mounted = false; };
  }, []);

  const handleOpenEdit = () => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      preferredLocation: profile.preferredLocation || '',
      investmentBudget: profile.investmentBudget || '',
      bio: profile.bio || '',
    });
    setFeedback({ type: '', message: '' });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await clientUserService.updateClientProfile(form);
      setProfile(updated);
      setEditModalOpen(false);
      setFeedback({ type: 'success', message: 'Profile information updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passphrases do not match. Please verify.' });
      return;
    }
    if (passForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New passphrase must be at least 8 characters long.' });
      return;
    }

    setPassSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      await clientUserService.changePassword(passForm.currentPassword, passForm.newPassword);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', message: 'Security passphrase updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Could not update password.' });
    } finally {
      setPassSaving(false);
    }
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

  return (
    <div className="space-y-8 font-sans antialiased text-[#141717]">
      <PageHeader
        title="My Profile & Settings"
        subtitle="Review account credentials, update your investment parameters, and manage security preferences."
        actions={
          <button
            type="button"
            onClick={handleOpenEdit}
            className="h-[46px] px-5 bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        }
      />

      {/* Global Feedback Banner */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-[#D8DFDF] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <img
              src={profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={profile?.name || 'Client Avatar'}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-[#D8DFDF]"
            />
            <button
              type="button"
              onClick={handleOpenEdit}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#141717]">
                {profile?.name || 'Sophia Isabella Laurel'}
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-[#0D4446]/10 text-[#0D4446]">
                {profile?.role || 'Registered Client'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5C6768] max-w-2xl leading-relaxed">
              {profile?.bio || 'Private investor exploring high-yield prime estates.'}
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Account Member Since: {profile?.memberSince || 'March 2026'}
            </p>
          </div>
        </div>

        {/* Informational Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-[#E5EBEB]">
          <div className="p-3.5 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB]">
            <span className="text-[10px] font-mono uppercase text-[#5C6768] block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0D4446]" />
              Email Address
            </span>
            <p className="text-xs font-bold text-[#141717] truncate">{profile?.email}</p>
          </div>

          <div className="p-3.5 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB]">
            <span className="text-[10px] font-mono uppercase text-[#5C6768] block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0D4446]" />
              Contact Number
            </span>
            <p className="text-xs font-bold text-[#141717] truncate">{profile?.phone}</p>
          </div>

          <div className="p-3.5 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB]">
            <span className="text-[10px] font-mono uppercase text-[#5C6768] block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0D4446]" />
              Target Location
            </span>
            <p className="text-xs font-bold text-[#141717] truncate">{profile?.preferredLocation}</p>
          </div>

          <div className="p-3.5 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB]">
            <span className="text-[10px] font-mono uppercase text-[#5C6768] block mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#0D4446]" />
              Target Budget
            </span>
            <p className="text-xs font-bold text-[#141717] truncate">{profile?.investmentBudget}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Security & Preferences Chassis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-[#D8DFDF] p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5EBEB]">
            <KeyRound className="w-5 h-5 text-[#0D4446]" />
            <div>
              <h3 className="text-sm font-display font-bold text-[#141717]">Change Passphrase</h3>
              <p className="text-xs text-[#5C6768]">Keep your client account secure with a robust passkey.</p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141717]">Current Passphrase</label>
              <input
                type="password"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] focus:bg-white focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] text-xs font-sans outline-none transition-colors"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141717]">New Passphrase</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] focus:bg-white focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] text-xs font-sans outline-none transition-colors"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141717]">Confirm New Passphrase</label>
              <input
                type="password"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] focus:bg-white focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] text-xs font-sans outline-none transition-colors"
                placeholder="Re-enter passphrase"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passSaving}
              className="w-full h-[54px] bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {passSaving ? 'Updating Passphrase...' : 'Save New Passphrase'}
            </button>
          </form>
        </div>

        {/* Account Notifications & Settings */}
        <div className="bg-white rounded-2xl border border-[#D8DFDF] p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5EBEB]">
              <Bell className="w-5 h-5 text-[#0D4446]" />
              <div>
                <h3 className="text-sm font-display font-bold text-[#141717]">Communication Settings</h3>
                <p className="text-xs text-[#5C6768]">Choose how you receive portfolio updates and tour schedules.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9] cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#141717] block">Email Dossiers & Reports</span>
                  <span className="text-[11px] text-[#5C6768]">Receive automated site brochures and transaction summaries.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => handleToggleNotification('emailNotifications')}
                  className="w-4 h-4 accent-[#0D4446] mt-1 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9] cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#141717] block">WhatsApp / SMS Tour Reminders</span>
                  <span className="text-[11px] text-[#5C6768]">Immediate alerts 2 hours prior to scheduled property inspections.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={() => handleToggleNotification('smsNotifications')}
                  className="w-4 h-4 accent-[#0D4446] mt-1 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9] cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#141717] block">Saved Property Price Drops</span>
                  <span className="text-[11px] text-[#5C6768]">Notification when a saved residence reduces list price.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.priceDropAlerts}
                  onChange={() => handleToggleNotification('priceDropAlerts')}
                  className="w-4 h-4 accent-[#0D4446] mt-1 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between mt-4">
            <div>
              <h4 className="text-xs font-bold text-red-800">Deactivate Account</h4>
              <p className="text-[11px] text-red-600">Permanently close client account and remove saved data.</p>
            </div>
            <button
              type="button"
              onClick={() => alert('Account deactivation requested. Our concierge team will reach out to confirm.')}
              className="px-3 py-1.5 rounded-lg border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Deactivate
            </button>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      <DashboardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Client Profile"
        subtitle="Update your personal details and real estate acquisition criteria."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">Contact Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">Preferred Location</label>
              <input
                type="text"
                value={form.preferredLocation}
                onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                placeholder="e.g. Bonifacio Global City, Taguig"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#141717]">Investment Target Budget</label>
              <input
                type="text"
                value={form.investmentBudget}
                onChange={(e) => setForm({ ...form, investmentBudget: e.target.value })}
                className="w-full h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
                placeholder="e.g. ₱50M - ₱120M"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#141717]">Bio / Acquisition Notes</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] text-xs outline-none focus:border-[#0D4446]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="h-[46px] px-5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[46px] px-6 rounded-xl bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}
