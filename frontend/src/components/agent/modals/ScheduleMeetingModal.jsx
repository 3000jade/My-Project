import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export const MEETING_TYPES = ['Property Viewing', 'Agent Consultation', 'Online Meeting', 'Office Meeting']

export default function ScheduleMeetingModal({ open, onClose, clientName, onSchedule }) {
  const [type, setType] = useState(MEETING_TYPES[0])
  const [date, setDate] = useState('2026-08-29')
  const [time, setTime] = useState('2:00 PM')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSchedule({ type, date, time, location, notes })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Meeting"
      subtitle={clientName}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Schedule Meeting
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Meeting Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Time</label>
            <input required value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 2:00 PM" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Location / Meeting Link</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={type === 'Online Meeting' ? 'https://meet.google.com/...' : 'Office or property address'}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional notes..." />
        </div>
      </form>
    </Modal>
  )
}
