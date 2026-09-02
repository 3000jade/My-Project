import { useState } from 'react'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { PRIORITIES } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function AddLeadModal({ open, onClose, properties, onCreate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [budget, setBudget] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [propertyPreferences, setPropertyPreferences] = useState('')
  const [interestedPropertyId, setInterestedPropertyId] = useState(properties?.[0]?.id ?? '')
  const [priority, setPriority] = useState('Medium')

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setBudget('')
    setPreferredLocation('')
    setPropertyPreferences('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    onCreate({
      name,
      email,
      phone,
      budget: Number(budget) || null,
      preferredLocation,
      propertyPreferences,
      interestedPropertyIds: interestedPropertyId ? [interestedPropertyId] : [],
      priority,
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Lead"
      subtitle="Manually add a prospective client to your CRM pipeline"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add Lead
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Full Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Phone</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+63 9XX XXX XXXX" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Budget (₱)</label>
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Preferred Location</label>
          <input value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Interested Property</label>
          <select value={interestedPropertyId} onChange={(e) => setInterestedPropertyId(e.target.value)} className={inputClass}>
            <option value="">— None —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Property Preferences</label>
          <input
            value={propertyPreferences}
            onChange={(e) => setPropertyPreferences(e.target.value)}
            className={inputClass}
            placeholder="e.g. 2-3BR house and lot near schools"
          />
        </div>
      </form>
    </Modal>
  )
}
