import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

const REMINDER_OPTIONS = ['15 minutes before', '30 minutes before', '1 hour before', '1 day before']

export default function ScheduleFollowUpModal({ open, onClose, clientName, defaultPurpose = '', onSchedule }) {
  const [date, setDate] = useState('2026-08-29')
  const [time, setTime] = useState('10:00 AM')
  const [reminder, setReminder] = useState(REMINDER_OPTIONS[1])
  const [purpose, setPurpose] = useState(defaultPurpose)
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSchedule({ date, time, reminder, purpose, notes })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Follow-up"
      subtitle={clientName}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Schedule
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Purpose</label>
          <input required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Discuss reservation terms" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Reminder</label>
          <select value={reminder} onChange={(e) => setReminder(e.target.value)} className={inputClass}>
            {REMINDER_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional notes..." />
        </div>
      </form>
    </Modal>
  )
}
