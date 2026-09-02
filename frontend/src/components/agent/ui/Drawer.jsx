import { X } from 'lucide-react'

export default function Drawer({ open, onClose, title, subtitle, children, headerExtra, width = 'max-w-2xl' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-darkteal-900/40 animate-fade-in" onClick={onClose} />
      <div
        className={`relative z-10 flex h-full w-full ${width} animate-drawer-in flex-col bg-white shadow-pop sm:m-0`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-200 bg-darkteal-800 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-teal-100">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="rounded-md p-1.5 text-teal-100 hover:bg-white/10 hover:text-white" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-surface-50">{children}</div>
      </div>
    </div>
  )
}
