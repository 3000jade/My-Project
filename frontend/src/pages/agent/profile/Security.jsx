import { useState } from 'react'
import { KeyRound, ShieldCheck, Smartphone, Laptop, Monitor, LogOut } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import ConfirmDialog from '../../../components/agent/ui/ConfirmDialog.jsx'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

const LOGIN_ACTIVITY = [
  { id: 1, device: 'Chrome on Windows', location: 'Quezon City, PH', time: '2026-08-27T08:10:00', icon: Monitor },
  { id: 2, device: 'RealtyConnect Mobile App', location: 'Cainta, Rizal, PH', time: '2026-08-26T18:42:00', icon: Smartphone },
  { id: 3, device: 'Chrome on Windows', location: 'Quezon City, PH', time: '2026-08-25T09:05:00', icon: Monitor },
]

const INITIAL_SESSIONS = [
  { id: 1, device: 'Chrome on Windows · This device', location: 'Quezon City, PH', current: true },
  { id: 2, device: 'RealtyConnect Mobile App', location: 'Cainta, Rizal, PH', current: false },
]

export default function Security() {
  const { showToast } = useApp()
  const [otpEnabled, setOtpEnabled] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)

  function handleChangePassword(e) {
    e.preventDefault()
    setPasswordModalOpen(false)
    showToast('Password changed successfully.')
  }

  function handleLogoutAll() {
    setSessions((prev) => prev.filter((s) => s.current))
    showToast('All other sessions have been logged out.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Security" subtitle="Manage your password, two-factor authentication, and active sessions." />

      <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-darkteal-800">Password</p>
              <p className="text-xs text-ink-500">Last changed on Jul 15, 2026.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-darkteal-800">OTP / Two-Factor Authentication</p>
              <p className="text-xs text-ink-500">
                {otpEnabled ? 'OTP is enabled for your account.' : 'Add an extra layer of security to your account.'}
              </p>
            </div>
          </div>
          <Button
            variant={otpEnabled ? 'secondary' : 'primary'}
            onClick={() => {
              setOtpEnabled((v) => !v)
              showToast(otpEnabled ? 'OTP disabled.' : 'OTP enabled for your account.')
            }}
          >
            {otpEnabled ? 'Disable OTP' : 'Enable OTP'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white shadow-card">
        <div className="border-b border-surface-100 px-5 py-4">
          <p className="text-sm font-semibold text-darkteal-800">Login Activity</p>
        </div>
        <div className="divide-y divide-surface-100">
          {LOGIN_ACTIVITY.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
              <a.icon size={16} className="text-ink-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-800">{a.device}</p>
                <p className="text-xs text-ink-500">{a.location}</p>
              </div>
              <p className="text-xs text-ink-400">{new Date(a.time).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <p className="text-sm font-semibold text-darkteal-800">Active Sessions</p>
          {sessions.length > 1 && (
            <Button variant="danger" size="sm" icon={LogOut} onClick={() => setLogoutConfirmOpen(true)}>
              Logout All Sessions
            </Button>
          )}
        </div>
        <div className="divide-y divide-surface-100">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <Laptop size={16} className="text-ink-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-800">{s.device}</p>
                <p className="text-xs text-ink-500">{s.location}</p>
              </div>
              {s.current && <span className="text-xs font-semibold text-teal-600">Active now</span>}
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Password"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePassword}>
              Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleChangePassword} className="space-y-3 text-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Current Password</label>
            <input type="password" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">New Password</label>
            <input type="password" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Confirm New Password</label>
            <input type="password" required className={inputClass} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogoutAll}
        title="Logout All Sessions"
        confirmLabel="Logout All"
        danger
        message="This will sign you out of all devices except this one. You'll need to log in again on those devices."
      />
    </div>
  )
}
