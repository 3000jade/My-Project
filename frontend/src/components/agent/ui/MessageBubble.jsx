import { Bot, Lock, User, UserRound } from 'lucide-react'
import { formatDateTime } from '../../../data/agentMockData.js'

const SENDER_META = {
  client: { label: 'Client', icon: UserRound, align: 'left', bubble: 'bg-white border border-surface-300 text-ink-900' },
  ai: { label: 'AI Assistant', icon: Bot, align: 'left', bubble: 'bg-teal-50 border border-teal-200 text-darkteal-800' },
  agent: { label: 'You (Agent)', icon: User, align: 'right', bubble: 'bg-teal-500 text-white' },
  note: { label: 'Internal Note', icon: Lock, align: 'left', bubble: 'bg-accent-50 border border-accent-100 text-ink-700' },
}

export default function MessageBubble({ sender, text, time }) {
  const meta = SENDER_META[sender] || SENDER_META.client
  const Icon = meta.icon
  const isRight = meta.align === 'right'

  return (
    <div className={`flex w-full flex-col ${isRight ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-medium text-ink-400 ${isRight ? 'flex-row-reverse' : ''}`}>
        <Icon size={12} />
        <span>{meta.label}</span>
        <span>·</span>
        <span>{formatDateTime(time)}</span>
      </div>
      <div className={`mt-1 max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${meta.bubble}`}>
        {sender === 'note' && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-accent-600">Private · Not visible to client</p>
        )}
        {text}
      </div>
    </div>
  )
}
