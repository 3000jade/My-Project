import { useState } from 'react'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

const EVENT_TYPES = ['Property Viewing', 'Client Meeting', 'Online Meeting', 'Follow-up']

export default function NewEventModal({ open, onClose, defaultDate, properties, onCreate }) {
  const [type, setType] = useState(EVENT_TYPES[0])
  const [client, setClient] = useState('')
  const [propertyId, setPropertyId] = useState(properties?.[0]?.id ?? '')
  const [date, setDate] = useState(defaultDate || '2026-08-27')
  const [time, setTime] = useState('10:00 AM')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onCreate({
      type,
      title: `${type} with ${client || 'client'}`,
      client: client || 'Unassigned',
      propertyId: propertyId || null,
      date,
      time,
      location,
      notes,
    })
    setClient('')
    setLocation('')
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Event"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Schedule Event
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Event Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Client Name</label>
          <input required value={client} onChange={(e) => setClient(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Related Property</label>
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass}>
            <option value="">— None —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Time</label>
          <input required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} placeholder="e.g. 2:00 PM" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Location / Meeting Link</label>
          <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>
      </form>
    </Modal>
  )
}
