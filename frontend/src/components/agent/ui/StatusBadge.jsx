const TONE_CLASSES = {
  'teal-solid': 'bg-teal-500 text-white',
  'teal-soft': 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200',
  'orange-solid': 'bg-accent-500 text-white',
  'orange-soft': 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100',
  neutral: 'bg-surface-200 text-ink-500 ring-1 ring-inset ring-surface-300',
  dark: 'bg-darkteal-800 text-white',
}

const DOT_CLASSES = {
  'teal-solid': 'bg-white',
  'teal-soft': 'bg-teal-500',
  'orange-solid': 'bg-white',
  'orange-soft': 'bg-accent-500',
  neutral: 'bg-ink-400',
  dark: 'bg-teal-300',
}

export default function StatusBadge({ label, tone = 'neutral', withDot = true, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${sizeClasses} ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}
    >
      {withDot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone] || DOT_CLASSES.neutral}`} />}
      {label}
    </span>
  )
}
