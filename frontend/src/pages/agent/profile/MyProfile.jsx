import { useState } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-surface-100 disabled:text-ink-500'

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
      {children}
    </div>
  )
}

export default function MyProfile() {
  const { agent, updateAgent } = useApp()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(agent)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSave() {
    updateAgent(form)
    setEditing(false)
  }

  function handleCancel() {
    setForm(agent)
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Profile" subtitle="Your public profile information as shown to clients and colleagues.">
        {!editing ? (
          <Button variant="primary" icon={Pencil} onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <>
            <Button variant="secondary" icon={X} onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              Save Changes
            </Button>
          </>
        )}
      </PageHeader>

      <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-2xl font-bold text-white">
            {agent.avatarInitials}
          </span>
          {editing && (
            <Button variant="secondary" size="sm">
              Change Photo
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input disabled={!editing} value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input disabled={!editing} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input disabled={!editing} value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Agency / Brokerage">
            <input disabled={!editing} value={form.agency} onChange={(e) => set('agency', e.target.value)} className={inputClass} />
          </Field>
          <Field label="PRC License Number">
            <input disabled={!editing} value={form.prcLicense} onChange={(e) => set('prcLicense', e.target.value)} className={inputClass} />
          </Field>
          <Field label="DHSUD Accreditation Number">
            <input disabled={!editing} value={form.dhsudAccreditation} onChange={(e) => set('dhsudAccreditation', e.target.value)} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Specialization">
              <input disabled={!editing} value={form.specialization} onChange={(e) => set('specialization', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
