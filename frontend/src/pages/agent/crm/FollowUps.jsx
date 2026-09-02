import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Check, RotateCcw, Pencil, UserRound } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { followUpStatusTone } from '../../../utils/agent/tone.js'
import { findProperty, formatDate } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

function Section({ title, items, onComplete, onReschedule, onEdit, onViewClient }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white shadow-card">
      <div className="border-b border-surface-100 px-5 py-4">
        <p className="text-sm font-semibold text-darkteal-800">
          {title} <span className="ml-1 text-xs font-normal text-ink-400">({items.length})</span>
        </p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-400">Nothing here right now.</p>
      ) : (
        <div className="divide-y divide-surface-100">
          {items.map((f) => {
            const property = findProperty(f.propertyId)
            return (
              <div key={f.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-darkteal-800">{f.clientName}</p>
                    <StatusBadge label={f.status} tone={followUpStatusTone(f.status)} size="sm" />
                  </div>
                  <p className="text-xs text-ink-500">{f.purpose}</p>
                  <p className="text-xs text-ink-400">
                    {formatDate(f.date)} · {f.time} {property && `· ${property.name}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-semibold">
                  {f.status !== 'Completed' && (
                    <button onClick={() => onComplete(f.id)} className="flex items-center gap-1 text-teal-600 hover:underline">
                      <Check size={12} /> Complete
                    </button>
                  )}
                  <button onClick={() => onReschedule(f)} className="flex items-center gap-1 text-ink-500 hover:underline">
                    <RotateCcw size={12} /> Reschedule
                  </button>
                  <button onClick={() => onEdit(f)} className="flex items-center gap-1 text-ink-500 hover:underline">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => onViewClient(f)} className="flex items-center gap-1 text-ink-500 hover:underline">
                    <UserRound size={12} /> View Client
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FollowUps() {
  const navigate = useNavigate()
  const { followUps, leads, clients, completeFollowUp, rescheduleFollowUp, showToast } = useApp()
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const today = followUps.filter((f) => f.status === 'Today')
  const overdue = followUps.filter((f) => f.status === 'Overdue')
  const upcoming = followUps.filter((f) => f.status === 'Upcoming')
  const completed = followUps.filter((f) => f.status === 'Completed')

  function handleViewClient(f) {
    const client = clients.find((c) => c.name === f.clientName)
    if (client) return navigate(`/agent/crm/clients?q=${encodeURIComponent(client.name)}`)
    const lead = leads.find((l) => l.name === f.clientName || l.id === f.leadId)
    if (lead) return navigate(`/agent/crm/leads/${lead.id}`)
    showToast('No CRM record found for this client yet.', 'danger')
  }

  function openReschedule(f) {
    setRescheduleTarget(f)
    setNewDate(f.date)
    setNewTime(f.time)
  }

  return (
    <div>
      <PageHeader title="Follow-up Management" subtitle="Stay on top of every client touchpoint that's due." />

      {followUps.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No follow-ups scheduled" message="Follow-ups you schedule from inquiries and leads will show up here." />
      ) : (
        <div className="space-y-5">
          <Section title="Today's Follow-ups" items={today} onComplete={completeFollowUp} onReschedule={openReschedule} onEdit={setEditTarget} onViewClient={handleViewClient} />
          <Section title="Overdue" items={overdue} onComplete={completeFollowUp} onReschedule={openReschedule} onEdit={setEditTarget} onViewClient={handleViewClient} />
          <Section title="Upcoming" items={upcoming} onComplete={completeFollowUp} onReschedule={openReschedule} onEdit={setEditTarget} onViewClient={handleViewClient} />
          <Section title="Completed" items={completed} onComplete={completeFollowUp} onReschedule={openReschedule} onEdit={setEditTarget} onViewClient={handleViewClient} />
        </div>
      )}

      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Follow-up"
        subtitle={rescheduleTarget?.clientName}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                rescheduleFollowUp(rescheduleTarget.id, newDate, newTime)
                setRescheduleTarget(null)
              }}
            >
              Save New Schedule
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Date</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">Time</label>
            <input value={newTime} onChange={(e) => setNewTime(e.target.value)} className={inputClass} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Follow-up"
        subtitle={editTarget?.clientName}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setEditTarget(null)}>
            Close
          </Button>
        }
      >
        {editTarget && (
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Purpose</dt>
              <dd className="font-medium text-ink-800">{editTarget.purpose}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Reminder</dt>
              <dd className="font-medium text-ink-800">{editTarget.reminder}</dd>
            </div>
            <div>
              <dt className="mb-1 text-ink-500">Notes</dt>
              <dd className="rounded-md bg-surface-50 p-2.5 font-medium text-ink-800">{editTarget.notes || 'No notes added.'}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  )
}
