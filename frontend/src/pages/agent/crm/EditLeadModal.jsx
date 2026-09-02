import { useState } from 'react'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { PRIORITIES, LEAD_STATUSES } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function EditLeadModal({ open, onClose, lead, onSave }) {
  const [form, setForm] = useState(lead)

  if (!lead) return null

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Lead"
      subtitle={lead.name}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Full Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Phone</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Email</label>
          <input value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Budget (₱)</label>
          <input type="number" value={form.budget ?? ''} onChange={(e) => set('budget', Number(e.target.value) || null)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Preferred Location</label>
          <input value={form.preferredLocation} onChange={(e) => set('preferredLocation', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Priority</label>
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Property Preferences</label>
          <input value={form.propertyPreferences} onChange={(e) => set('propertyPreferences', e.target.value)} className={inputClass} />
        </div>
      </form>
    </Modal>
  )
}
