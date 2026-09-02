import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  Mail,
  Sparkles,
  Paperclip,
  Send,
  Bot,
  UserPlus,
  CalendarClock,
  CalendarDays,
  XCircle,
  RotateCcw,
  StickyNote,
  MessageCircle,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import Button from '../../../components/agent/ui/Button.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import MessageBubble from '../../../components/agent/ui/MessageBubble.jsx'
import AISuggestionCard from '../../../components/agent/ui/AISuggestionCard.jsx'
import Timeline from '../../../components/agent/ui/Timeline.jsx'
import PropertyThumb from '../../../components/agent/ui/PropertyThumb.jsx'
import ConfirmDialog from '../../../components/agent/ui/ConfirmDialog.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import ConvertToLeadModal from './ConvertToLeadModal.jsx'
import ScheduleFollowUpModal from '../../../components/agent/modals/ScheduleFollowUpModal.jsx'
import ScheduleMeetingModal from '../../../components/agent/modals/ScheduleMeetingModal.jsx'
import { useApp } from '../../../context/AgentContext.jsx'
import { inquiryStatusTone, propertyStatusTone } from '../../../utils/agent/tone.js'
import { INQUIRY_STATUSES, PRIORITIES, formatDate, formatPHP } from '../../../data/agentMockData.js'
import { buildAiSuggestion } from '../../../utils/agent/aiSuggestions.js'

const AI_HANDLES = ['Property availability', 'Property price', 'Basic property information', 'Location', 'Frequently asked questions']

const selectClass =
  'w-full rounded-md border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function InquiryDrawerContent({ inquiryId, onClose }) {
  const navigate = useNavigate()
  const {
    inquiries,
    properties,
    updateInquiryStatus,
    updateInquiryPriority,
    sendInquiryMessage,
    setInquiryAiHandling,
    closeInquiry,
    reopenInquiry,
    convertInquiryToLead,
    addFollowUp,
    addScheduleEvent,
  } = useApp()

  const inquiry = inquiries.find((i) => i.id === inquiryId)
  const property = inquiry ? properties.find((p) => p.id === inquiry.propertyId) : null

  const [draft, setDraft] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [addPropertyOpen, setAddPropertyOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const composerRef = useRef(null)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    setDraft('')
    setShowSuggestion(false)
    setNoteMode(false)
  }, [inquiryId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [inquiry?.messages?.length])

  if (!inquiry) return null

  function focusComposer() {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => composerRef.current?.focus(), 250)
  }

  function handleSend() {
    if (!draft.trim()) return
    sendInquiryMessage(inquiry.id, noteMode ? 'note' : 'agent', draft.trim())
    setDraft('')
    setShowSuggestion(false)
  }

  function handleAttach(e) {
    const file = e.target.files?.[0]
    if (!file) return
    sendInquiryMessage(inquiry.id, 'agent', `📎 Attached file: ${file.name}`)
    e.target.value = ''
  }

  function insertProperty(p) {
    setDraft((d) => `${d ? d + '\n' : ''}Here's the listing you asked about: ${p.name} — ${p.location}, ${formatPHP(p.price)}.`)
    setAddPropertyOpen(false)
    focusComposer()
  }

  const suggestion = buildAiSuggestion(inquiry, property)

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Client Information */}
      <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Client Information</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] text-ink-400">Full Name</p>
            <p className="text-sm font-medium text-darkteal-800">{inquiry.client.name}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">Preferred Contact</p>
            <p className="text-sm font-medium text-darkteal-800">{inquiry.client.preferredContact}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">Email</p>
            <a href={`mailto:${inquiry.client.email}`} className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline">
              <Mail size={12} /> {inquiry.client.email}
            </a>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">Phone</p>
            <a href={`tel:${inquiry.client.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline">
              <Phone size={12} /> {inquiry.client.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Property */}
      {property && (
        <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Property</p>
          <div className="flex gap-3">
            <PropertyThumb id={property.id} type={property.type} className="h-20 w-24 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-darkteal-800">{property.name}</p>
              <p className="flex items-center gap-1 text-xs text-ink-500">
                <MapPin size={11} /> {property.location}
              </p>
              <p className="mt-1 text-sm font-bold text-teal-600">{formatPHP(property.price)}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <StatusBadge label={property.status} tone={propertyStatusTone(property.status)} size="sm" />
                <button
                  onClick={() => {
                    onClose()
                    navigate(`/agent/properties/${property.id}`)
                  }}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  View Property
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Information */}
      <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Inquiry Information</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-ink-400">Inquiry Type</p>
            <p className="font-medium text-ink-800">{inquiry.inquiryType}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">Source</p>
            <p className="font-medium text-ink-800">{inquiry.source}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">Date Received</p>
            <p className="font-medium text-ink-800">{formatDate(inquiry.dateReceived)}</p>
          </div>
          <div className="flex items-end">
            <StatusBadge label={inquiry.status} tone={inquiryStatusTone(inquiry.status)} size="sm" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-surface-100 pt-3">
          <div>
            <label className="mb-1 block text-[11px] text-ink-400">Status</label>
            <select value={inquiry.status} onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)} className={selectClass}>
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ink-400">Priority</label>
            <select value={inquiry.priority} onChange={(e) => updateInquiryPriority(inquiry.id, e.target.value)} className={selectClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Conversation */}
      <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
          <MessageCircle size={13} /> Conversation
        </p>
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
          {inquiry.messages.map((m) => (
            <MessageBubble key={m.id} sender={m.sender} text={m.text} time={m.time} />
          ))}
          <div ref={bottomRef} />
        </div>
      </section>

      {/* Response composer */}
      <section id="composer" className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => setNoteMode(false)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${!noteMode ? 'bg-teal-500 text-white' : 'bg-surface-100 text-ink-500'}`}
          >
            Reply to Client
          </button>
          <button
            onClick={() => setNoteMode(true)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${noteMode ? 'bg-accent-500 text-white' : 'bg-surface-100 text-ink-500'
              }`}
          >
            <StickyNote size={12} /> Internal Note
          </button>
        </div>

        <textarea
          ref={composerRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={noteMode ? 'Add a private note (not visible to the client)...' : 'Type your response...'}
          className="w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleAttach} />
          <Button variant="secondary" size="sm" icon={Paperclip} onClick={() => fileInputRef.current?.click()}>
            Attach
          </Button>
          <Button variant="secondary" size="sm" icon={MapPin} onClick={() => setAddPropertyOpen(true)}>
            Add Property
          </Button>
          <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setShowSuggestion(true)}>
            AI Suggestion
          </Button>
          <Button variant="primary" size="sm" icon={Send} onClick={handleSend} className="ml-auto">
            {noteMode ? 'Add Note' : 'Send'}
          </Button>
        </div>

        {showSuggestion && (
          <div className="mt-3">
            <AISuggestionCard
              suggestion={suggestion}
              onUse={() => {
                setDraft(suggestion)
                setNoteMode(false)
                setShowSuggestion(false)
              }}
              onEdit={() => {
                setDraft(suggestion)
                setNoteMode(false)
                setShowSuggestion(false)
                focusComposer()
              }}
              onDismiss={() => setShowSuggestion(false)}
            />
          </div>
        )}
      </section>

      {/* AI Status */}
      <section className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-darkteal-800">
            <Bot size={15} className="text-teal-600" /> AI Assistant: {inquiry.aiHandled ? 'Active' : 'Inactive'}
          </p>
          <button
            onClick={() => setInquiryAiHandling(inquiry.id, !inquiry.aiHandled)}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
          >
            {inquiry.aiHandled ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-ink-400" />}
            AI Settings
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-600">What the AI Assistant can handle for this inquiry:</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {AI_HANDLES.map((h) => (
            <li key={h} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Inquiry Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={MessageCircle} onClick={focusComposer}>
            Respond
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            disabled={inquiry.status === 'Converted'}
            onClick={() => setConvertOpen(true)}
          >
            {inquiry.status === 'Converted' ? 'Already Converted' : 'Convert to Lead'}
          </Button>
          <Button variant="secondary" size="sm" icon={CalendarClock} onClick={() => setFollowUpOpen(true)}>
            Schedule Follow-up
          </Button>
          <Button variant="secondary" size="sm" icon={CalendarDays} onClick={() => setMeetingOpen(true)}>
            Schedule Meeting
          </Button>
          {inquiry.status === 'Closed' ? (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => reopenInquiry(inquiry.id)}>
              Reopen Inquiry
            </Button>
          ) : (
            <Button variant="danger" size="sm" icon={XCircle} onClick={() => setCloseConfirmOpen(true)}>
              Close Inquiry
            </Button>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Activity Timeline</p>
        <Timeline items={inquiry.activity} />
      </section>

      {/* Add Property modal */}
      <Modal open={addPropertyOpen} onClose={() => setAddPropertyOpen(false)} title="Add Property to Response" size="md">
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => insertProperty(p)}
              className="flex w-full items-center gap-3 rounded-md border border-surface-200 p-2.5 text-left hover:bg-surface-50"
            >
              <PropertyThumb id={p.id} type={p.type} className="h-12 w-16 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-darkteal-800">{p.name}</p>
                <p className="text-xs text-ink-500">
                  {p.location} · {formatPHP(p.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <ConvertToLeadModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        inquiry={inquiry}
        property={property}
        onConvert={convertInquiryToLead}
      />

      <ScheduleFollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        clientName={inquiry.client.name}
        defaultPurpose={`Follow up on ${inquiry.inquiryType.toLowerCase()}`}
        onSchedule={(data) =>
          addFollowUp({ clientName: inquiry.client.name, leadId: null, propertyId: inquiry.propertyId, ...data })
        }
      />

      <ScheduleMeetingModal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        clientName={inquiry.client.name}
        onSchedule={(data) =>
          addScheduleEvent({
            title: `${data.type} with ${inquiry.client.name}`,
            propertyId: inquiry.propertyId,
            client: inquiry.client.name,
            ...data,
          })
        }
      />

      <ConfirmDialog
        open={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={() => closeInquiry(inquiry.id)}
        title="Close Inquiry"
        confirmLabel="Close Inquiry"
        message="Are you sure you want to close this inquiry? You can reopen it later if the client responds again."
      />
    </div>
  )
}
