import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 shadow-pop"
        >
          {toast.variant === 'danger' ? (
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-accent-600" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-600" />
          )}
          <p className="flex-1 text-sm text-ink-700">{toast.message}</p>
          <button onClick={() => dismissToast(toast.id)} className="text-ink-400 hover:text-ink-700">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
