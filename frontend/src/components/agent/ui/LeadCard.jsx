import { Phone, Mail, Wallet } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import { leadStatusTone } from '../../../utils/agent/tone.js'
import { formatPHP } from '../../../data/agentMockData.js'

export default function LeadCard({ lead, onView }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-darkteal-800">{lead.name}</p>
        <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} size="sm" />
      </div>
      <div className="mt-2 space-y-1 text-xs text-ink-500">
        <p className="flex items-center gap-1.5">
          <Phone size={12} /> {lead.phone}
        </p>
        <p className="flex items-center gap-1.5">
          <Mail size={12} /> {lead.email}
        </p>
        <p className="flex items-center gap-1.5">
          <Wallet size={12} /> Budget: {formatPHP(lead.budget)}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3">
        <PriorityBadge priority={lead.priority} size="sm" />
        <button onClick={() => onView?.(lead)} className="text-xs font-semibold text-teal-600 hover:underline">
          View Lead
        </button>
      </div>
    </div>
  )
}
