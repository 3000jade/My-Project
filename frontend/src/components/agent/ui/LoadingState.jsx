export function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse divide-y divide-surface-200">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3 flex-1 rounded bg-surface-200" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-56 rounded-lg border border-surface-200 bg-white p-4">
          <div className="h-28 rounded-md bg-surface-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-surface-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-surface-200" />
        </div>
      ))}
    </div>
  )
}

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Spinner className="h-6 w-6 text-teal-500" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
