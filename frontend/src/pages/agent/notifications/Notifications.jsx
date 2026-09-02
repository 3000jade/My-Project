import { Bell, MessagesSquare, CalendarClock, UserPlus, CalendarCheck, Home, Bot, Mail } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import { timeAgo } from '../../../data/agentMockData.js'

const TYPE_ICON = {
  inquiry: MessagesSquare,
  followup: CalendarClock,
  lead: UserPlus,
  meeting: CalendarCheck,
  status: Home,
  ai: Bot,
  message: Mail,
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp()
  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Stay updated on inquiries, leads, follow-ups, and system activity.">
        <Button variant="secondary" onClick={markAllNotificationsRead}>
          Mark All as Read
        </Button>
      </PageHeader>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Unread ({unread.length})</p>
              <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
                <div className="divide-y divide-surface-100">
                  {unread.map((n) => {
                    const Icon = TYPE_ICON[n.type] || Bell
                    return (
                      <div key={n.id} className="flex items-start gap-3 bg-teal-50/40 px-5 py-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-darkteal-800">{n.title}</p>
                          <p className="mt-0.5 text-sm text-ink-600">{n.message}</p>
                          <p className="mt-1 text-xs text-ink-400">{timeAgo(n.time)}</p>
                        </div>
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="shrink-0 text-xs font-semibold text-teal-600 hover:underline"
                        >
                          Mark as Read
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Earlier</p>
              <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
                <div className="divide-y divide-surface-100">
                  {read.map((n) => {
                    const Icon = TYPE_ICON[n.type] || Bell
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-5 py-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-200 text-ink-500">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink-700">{n.title}</p>
                          <p className="mt-0.5 text-sm text-ink-500">{n.message}</p>
                          <p className="mt-1 text-xs text-ink-400">{timeAgo(n.time)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
