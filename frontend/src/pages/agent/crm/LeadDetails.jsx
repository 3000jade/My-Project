import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, CalendarClock, CalendarDays, StickyNote, UserCheck, Wallet, MapPin } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import PriorityBadge from '../../../components/agent/ui/PriorityBadge.jsx'
import PropertyCard from '../../../components/agent/ui/PropertyCard.jsx'
import Timeline from '../../../components/agent/ui/Timeline.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import ConfirmDialog from '../../../components/agent/ui/ConfirmDialog.jsx'
import ScheduleFollowUpModal from '../../../components/agent/modals/ScheduleFollowUpModal.jsx'
import ScheduleMeetingModal from '../../../components/agent/modals/ScheduleMeetingModal.jsx'
import EditLeadModal from './EditLeadModal.jsx'
import AddNoteModal from './AddNoteModal.jsx'
import { leadStatusTone } from '../../../utils/agent/tone.js'
import { formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { leads, properties, updateLead, addLeadNote, addFollowUp, addScheduleEvent, convertLeadToClient } = useApp()

  const [editOpen, setEditOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)

  const lead = leads.find((l) => l.id === id)

  if (!lead) {
    return (
      <EmptyState
        title="Lead not found"
        message="This lead may have been removed."
        action={
          <Button variant="primary" onClick={() => navigate('/agent/crm/leads')}>
            Back to Leads
          </Button>
        }
      />
    )
  }

  const interestedProperties = properties.filter((p) => lead.interestedPropertyIds?.includes(p.id))

  return (
    <div>
      <button onClick={() => navigate('/agent/crm/leads')} className="mb-3 flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline">
        <ArrowLeft size={15} /> Back to Leads
      </button>

      <PageHeader title={lead.name} subtitle={`Lead ${lead.id} · Sourced ${lead.sourceInquiryId ? `from ${lead.sourceInquiryId}` : 'manually'}`}>
        <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
          Edit Lead
        </Button>
        <Button variant="secondary" icon={CalendarClock} onClick={() => setFollowUpOpen(true)}>
          Add Follow-up
        </Button>
        <Button variant="secondary" icon={CalendarDays} onClick={() => setMeetingOpen(true)}>
          Schedule Meeting
        </Button>
        <Button variant="secondary" icon={StickyNote} onClick={() => setNoteOpen(true)}>
          Add Note
        </Button>
        {lead.status !== 'Converted' && (
          <Button variant="primary" icon={UserCheck} onClick={() => setConvertOpen(true)}>
            Convert
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-surface-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
              <p className="text-sm font-semibold text-darkteal-800">Interested Properties</p>
            </div>
            {interestedProperties.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400">No properties linked yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                {interestedProperties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onView={(prop) => navigate(`/agent/properties/${prop.id}`)}
                    onEdit={(prop) => navigate(`/agent/properties/${prop.id}/edit`)}
                    onDelete={() => {}}
                    onChangeStatus={() => navigate(`/agent/properties/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-white shadow-card">
            <div className="border-b border-surface-100 px-5 py-4">
              <p className="text-sm font-semibold text-darkteal-800">Communication History</p>
            </div>
            {lead.communicationHistory.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400">No communication logged yet.</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {lead.communicationHistory.map((c, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-darkteal-800">{c.channel}</p>
                      <p className="text-xs text-ink-500">{c.summary}</p>
                    </div>
                    <p className="shrink-0 text-xs text-ink-400">{formatDate(c.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-white shadow-card">
            <div className="border-b border-surface-100 px-5 py-4">
              <p className="text-sm font-semibold text-darkteal-800">Follow-up History</p>
            </div>
            {lead.followUpHistory.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400">No follow-ups recorded yet.</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {lead.followUpHistory.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-darkteal-800">{f.purpose}</p>
                      <p className="text-xs text-ink-500">{formatDate(f.date)}</p>
                    </div>
                    <StatusBadge label={f.status} tone={f.status === 'Completed' ? 'dark' : 'teal-soft'} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <p className="mb-3 text-sm font-semibold text-darkteal-800">Lead Activity Timeline</p>
            <Timeline items={lead.activity} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-darkteal-800">Lead Profile</p>
              <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} size="sm" />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] text-ink-400">Email</dt>
                <dd className="font-medium text-ink-800">{lead.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-400">Phone</dt>
                <dd className="font-medium text-ink-800">{lead.phone}</dd>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <dt className="flex items-center gap-1 text-[11px] text-ink-400">
                    <Wallet size={11} /> Budget
                  </dt>
                  <dd className="font-medium text-ink-800">{formatPHP(lead.budget)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-[11px] text-ink-400">Priority</dt>
                  <dd className="mt-0.5">
                    <PriorityBadge priority={lead.priority} size="sm" />
                  </dd>
                </div>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[11px] text-ink-400">
                  <MapPin size={11} /> Preferred Location
                </dt>
                <dd className="font-medium text-ink-800">{lead.preferredLocation || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-400">Property Preferences</dt>
                <dd className="font-medium text-ink-800">{lead.propertyPreferences || '—'}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                <span className="text-[11px] text-ink-400">Last Contact</span>
                <span className="font-medium text-ink-800">{formatDate(lead.lastContact)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-400">Next Follow-up</span>
                <span className="font-medium text-ink-800">{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}</span>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <EditLeadModal open={editOpen} onClose={() => setEditOpen(false)} lead={lead} onSave={(data) => updateLead(lead.id, data)} />

      <ScheduleFollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        clientName={lead.name}
        defaultPurpose="Check in on progress"
        onSchedule={(data) =>
          addFollowUp({ clientName: lead.name, leadId: lead.id, propertyId: lead.interestedPropertyIds?.[0] ?? null, ...data })
        }
      />

      <ScheduleMeetingModal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        clientName={lead.name}
        onSchedule={(data) =>
          addScheduleEvent({
            title: `${data.type} with ${lead.name}`,
            propertyId: lead.interestedPropertyIds?.[0] ?? null,
            client: lead.name,
            ...data,
          })
        }
      />

      <AddNoteModal open={noteOpen} onClose={() => setNoteOpen(false)} onSave={(note) => addLeadNote(lead.id, note)} />

      <ConfirmDialog
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        onConfirm={() => {
          const client = convertLeadToClient(lead)
          navigate(`/agent/crm/clients?highlight=${client.id}`)
        }}
        title="Convert Lead to Client"
        confirmLabel="Convert to Client"
        message={
          <>
            Convert <span className="font-semibold">{lead.name}</span> into a client record?
          </>
        }
      />
    </div>
  )
}
