import { useState } from 'react'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { INQUIRY_TYPES, PRIORITIES, SOURCES } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function NewInquiryModal({ open, onClose, properties, onCreate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredContact, setPreferredContact] = useState('Phone Call')
  const [propertyId, setPropertyId] = useState(properties?.[0]?.id ?? '')
  const [inquiryType, setInquiryType] = useState(INQUIRY_TYPES[0])
  const [priority, setPriority] = useState('Medium')
  const [source, setSource] = useState(SOURCES[0])
  const [message, setMessage] = useState('')

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    onCreate({
      client: { name, email, phone, preferredContact },
      propertyId,
      inquiryType,
      priority,
      source,
      message: message || `Inquiry logged manually regarding ${inquiryType.toLowerCase()}.`,
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Inquiry"
      subtitle="Log an inquiry received by phone, walk-in, or another channel"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Inquiry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Client Full Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Phone Number</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+63 9XX XXX XXXX" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Email Address</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Preferred Contact Method</label>
          <select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)} className={inputClass}>
            {['Phone Call', 'Email', 'SMS'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Property</label>
          <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass}>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.location}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Inquiry Type</label>
          <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)} className={inputClass}>
            {INQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Initial Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} placeholder="What did the client ask about?" />
        </div>
      </form>
    </Modal>
  )
}
