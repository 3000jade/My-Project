import { Sparkles, Pencil, X, Check } from 'lucide-react'
import Button from './Button.jsx'

export default function AISuggestionCard({ suggestion, onUse, onEdit, onDismiss }) {
  return (
    <div className="rounded-lg border border-accent-100 bg-accent-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-600">
        <Sparkles size={14} />
        AI Suggested Response
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-800">{suggestion}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="accent" size="sm" icon={Check} onClick={onUse}>
          Use Response
        </Button>
        <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" icon={X} onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
