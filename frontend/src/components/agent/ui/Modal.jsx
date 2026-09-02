import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-darkteal-900/40 animate-fade-in" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${widths[size]} animate-modal-in rounded-lg bg-white shadow-pop max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-200 bg-darkteal-800 rounded-t-lg px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-teal-100">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-teal-100 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div data-lenis-prevent="true" className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-surface-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
