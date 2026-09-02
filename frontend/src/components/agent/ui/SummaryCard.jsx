export default function SummaryCard({ icon: Icon, label, value, sublabel, actionLabel, onAction, accent = 'teal' }) {
  const iconWrap =
    accent === 'orange' ? 'bg-accent-50 text-accent-600' : accent === 'dark' ? 'bg-darkteal-50 text-darkteal-800' : 'bg-teal-50 text-teal-600'

  return (
    <div className="flex flex-col justify-between rounded-lg border border-surface-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-darkteal-800">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 self-start text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline underline-offset-2"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}
