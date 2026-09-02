import { Circle } from 'lucide-react'
import { formatDateTime } from '../../../data/agentMockData.js'

export default function Timeline({ items }) {
  if (!items?.length) {
    return <p className="text-sm text-ink-400">No activity recorded yet.</p>
  }
  return (
    <ol className="relative ml-2 border-l border-surface-300 pl-5">
      {items.map((item, idx) => (
        <li key={idx} className="mb-5 last:mb-0">
          <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 ring-4 ring-white">
            <Circle size={0} />
          </span>
          <p className="text-xs font-medium text-ink-400">{formatDateTime(item.time)}</p>
          <p className="mt-0.5 text-sm font-medium text-darkteal-800">{item.label}</p>
        </li>
      ))}
    </ol>
  )
}
