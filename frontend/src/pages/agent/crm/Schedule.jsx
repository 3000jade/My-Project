import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, MapPin } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import NewEventModal from './NewEventModal.jsx'
import { eventTypeTone } from '../../../utils/agent/tone.js'
import { findProperty, formatDate } from '../../../data/agentMockData.js'

function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Schedule() {
  const { scheduleEvents, properties, addScheduleEvent } = useApp()
  const [cursor, setCursor] = useState(new Date(2026, 7, 1)) // August 2026
  const [selectedDate, setSelectedDate] = useState(null)
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [prefillDate, setPrefillDate] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const eventsByDate = useMemo(() => {
    const map = {}
    scheduleEvents.forEach((ev) => {
      map[ev.date] = map[ev.date] ? [...map[ev.date], ev] : [ev]
    })
    return map
  }, [scheduleEvents])

  const grid = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1)
    const startWeekday = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const upcoming = useMemo(
    () =>
      [...scheduleEvents]
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
        .slice(0, 6),
    [scheduleEvents]
  )

  const monthLabel = cursor.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  return (
    <div>
      <PageHeader title="Schedule" subtitle="View property viewings, client meetings, consultations, and follow-ups.">
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setPrefillDate(null)
            setNewEventOpen(true)
          }}
        >
          Schedule Event
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-darkteal-800">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-md p-1.5 text-ink-500 hover:bg-surface-100">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCursor(new Date(2026, 7, 1))} className="rounded-md px-2 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50">
                Today
              </button>
              <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-md p-1.5 text-ink-500 hover:bg-surface-100">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, idx) => {
              if (!day) return <div key={idx} className="min-h-[84px] rounded-md bg-surface-50/60" />
              const key = toDateKey(year, month, day)
              const dayEvents = eventsByDate[key] || []
              const isToday = key === '2026-08-27'
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(key)}
                  className={`flex min-h-[84px] flex-col items-start gap-1 rounded-md border p-1.5 text-left transition-colors ${
                    isToday ? 'border-teal-400 bg-teal-50/60' : 'border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-teal-700' : 'text-ink-600'}`}>{day}</span>
                  <div className="flex w-full flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                          eventTypeTone(ev.type) === 'dark'
                            ? 'bg-darkteal-800 text-white'
                            : eventTypeTone(ev.type) === 'teal-solid'
                            ? 'bg-teal-500 text-white'
                            : eventTypeTone(ev.type) === 'orange-solid'
                            ? 'bg-accent-500 text-white'
                            : eventTypeTone(ev.type) === 'orange-soft'
                            ? 'bg-accent-50 text-accent-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {ev.client}
                      </span>
                    ))}
                    {dayEvents.length > 2 && <span className="text-[10px] text-ink-400">+{dayEvents.length - 2} more</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white shadow-card">
          <div className="border-b border-surface-100 px-5 py-4">
            <p className="text-sm font-semibold text-darkteal-800">Upcoming Events</p>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-400">No events scheduled yet.</p>
          ) : (
            <div className="divide-y divide-surface-100">
              {upcoming.map((ev) => (
                <div key={ev.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-darkteal-800">{ev.client}</p>
                    <StatusBadge label={ev.type} tone={eventTypeTone(ev.type)} size="sm" />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {formatDate(ev.date)} · {ev.time}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-400">
                    <MapPin size={11} /> {ev.location}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? formatDate(selectedDate) : ''}
        subtitle="Scheduled events"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedDate(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setPrefillDate(selectedDate)
                setNewEventOpen(true)
              }}
            >
              Add Event
            </Button>
          </>
        }
      >
        {selectedEvents.length === 0 ? (
          <p className="flex items-center gap-2 py-4 text-sm text-ink-400">
            <CalendarDays size={16} /> No events scheduled for this day.
          </p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((ev) => {
              const property = findProperty(ev.propertyId)
              return (
                <div key={ev.id} className="rounded-md border border-surface-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-darkteal-800">{ev.title || ev.client}</p>
                    <StatusBadge label={ev.type} tone={eventTypeTone(ev.type)} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{ev.time}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <MapPin size={11} /> {ev.location}
                  </p>
                  {property && <p className="mt-1 text-xs text-ink-400">Property: {property.name}</p>}
                  {ev.notes && <p className="mt-1.5 rounded bg-surface-50 p-2 text-xs text-ink-600">{ev.notes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <NewEventModal
        open={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        defaultDate={prefillDate}
        properties={properties}
        onCreate={addScheduleEvent}
      />
    </div>
  )
}
