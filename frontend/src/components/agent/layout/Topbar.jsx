import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut, Building2, MessagesSquare, Users } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import { timeAgo } from '../../../data/agentMockData.js'

const BREADCRUMB_MAP = [
  { match: /^\/agent\/?$/, label: 'Dashboard' },
  { match: /^\/agent\/properties\/add/, label: 'Properties / Add Property' },
  { match: /^\/agent\/properties\/[^/]+$/, label: 'Properties / Property Details' },
  { match: /^\/agent\/properties/, label: 'Properties / My Properties' },
  { match: /^\/agent\/inquiries\/new/, label: 'Inquiries / New' },
  { match: /^\/agent\/inquiries\/follow-up/, label: 'Inquiries / Follow-ups' },
  { match: /^\/agent\/inquiries\/closed/, label: 'Inquiries / Closed' },
  { match: /^\/agent\/inquiries/, label: 'Inquiry Management' },
  { match: /^\/agent\/crm\/leads\/[^/]+$/, label: 'CRM / Lead Details' },
  { match: /^\/agent\/crm\/leads/, label: 'CRM / Leads' },
  { match: /^\/agent\/crm\/clients/, label: 'CRM / Clients' },
  { match: /^\/agent\/crm\/follow-ups/, label: 'CRM / Follow-ups' },
  { match: /^\/agent\/crm\/schedule/, label: 'CRM / Schedule' },
  { match: /^\/agent\/crm\/communication-history/, label: 'CRM / Communication History' },
  { match: /^\/agent\/sales\/overview/, label: 'Sales / Sales Overview' },
  { match: /^\/agent\/sales\/transactions/, label: 'Sales / Transactions' },
  { match: /^\/agent\/sales\/reports/, label: 'Sales / Sales Reports' },
  { match: /^\/agent\/sales\/analytics/, label: 'Sales / Sales Analytics' },
  { match: /^\/agent\/ai-assistant/, label: 'AI Assistant' },
  { match: /^\/agent\/notifications/, label: 'Notifications' },
  { match: /^\/agent\/profile\/security/, label: 'Profile & Settings / Security' },
  { match: /^\/agent\/profile\/terms/, label: 'Profile & Settings / Terms & Conditions' },
  { match: /^\/agent\/profile/, label: 'Profile & Settings / My Profile' },
]

function useBreadcrumb(pathname) {
  const found = BREADCRUMB_MAP.find((b) => b.match.test(pathname))
  return found ? found.label : 'Dashboard'
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onOutside])
}

export default function Topbar({ onOpenMobileSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const breadcrumb = useBreadcrumb(location.pathname)
  const { agent, properties, inquiries, leads, clients, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, showToast } =
    useApp()

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useClickOutside(searchRef, () => setSearchOpen(false))
  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  const q = query.trim().toLowerCase()
  const results = q
    ? {
        properties: properties.filter((p) => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)).slice(0, 3),
        inquiries: inquiries.filter((i) => i.client.name.toLowerCase().includes(q)).slice(0, 3),
        leads: leads.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 3),
        clients: clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3),
      }
    : null
  const hasResults =
    results && (results.properties.length || results.inquiries.length || results.leads.length || results.clients.length)

  function goTo(path) {
    navigate(path)
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-surface-200 bg-white px-4 py-3 sm:px-6">
      <button onClick={onOpenMobileSidebar} className="rounded-md p-2 text-ink-600 hover:bg-surface-100 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate text-xs font-medium text-ink-400">Agent Portal</span>
        <span className="truncate text-sm font-semibold text-darkteal-800">{breadcrumb}</span>
      </div>

      <div className="relative ml-2 flex-1 sm:ml-6 sm:max-w-md" ref={searchRef}>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search clients, properties, leads..."
          className="w-full rounded-md border border-surface-300 bg-surface-50 py-2 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        {searchOpen && q && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-lg border border-surface-200 bg-white p-2 shadow-pop">
            {!hasResults && <p className="px-3 py-4 text-center text-sm text-ink-400">No matches for "{query}"</p>}
            {results.properties.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Properties</p>
                {results.properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => goTo(`/agent/properties/${p.id}`)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-100"
                  >
                    <Building2 size={14} className="text-teal-600" /> {p.name}
                    <span className="ml-auto text-xs text-ink-400">{p.location}</span>
                  </button>
                ))}
              </div>
            )}
            {results.inquiries.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Inquiries</p>
                {results.inquiries.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => goTo(`/agent/inquiries?q=${encodeURIComponent(i.client.name)}`)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-100"
                  >
                    <MessagesSquare size={14} className="text-teal-600" /> {i.client.name}
                    <span className="ml-auto text-xs text-ink-400">{i.inquiryType}</span>
                  </button>
                ))}
              </div>
            )}
            {results.leads.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Leads</p>
                {results.leads.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => goTo(`/agent/crm/leads/${l.id}`)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-100"
                  >
                    <Users size={14} className="text-teal-600" /> {l.name}
                    <span className="ml-auto text-xs text-ink-400">{l.status}</span>
                  </button>
                ))}
              </div>
            )}
            {results.clients.length > 0 && (
              <div>
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Clients</p>
                {results.clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => goTo(`/agent/crm/clients?q=${encodeURIComponent(c.name)}`)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-100"
                  >
                    <Users size={14} className="text-teal-600" /> {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative shrink-0" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative rounded-md p-2 text-ink-600 hover:bg-surface-100"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-surface-200 bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
              <p className="text-sm font-semibold text-darkteal-800">Notifications</p>
              <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-teal-600 hover:underline">
                Mark all as read
              </button>
            </div>
            <div data-lenis-prevent="true" className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`flex w-full flex-col gap-0.5 border-b border-surface-100 px-4 py-3 text-left last:border-0 hover:bg-surface-50 ${
                    !n.read ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-darkteal-800">
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />}
                    {n.title}
                  </span>
                  <span className="text-xs text-ink-500 line-clamp-2">{n.message}</span>
                  <span className="text-[11px] text-ink-400">{timeAgo(n.time)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setNotifOpen(false)
                navigate('/agent/notifications')
              }}
              className="block w-full border-t border-surface-100 px-4 py-2.5 text-center text-xs font-semibold text-teal-600 hover:bg-surface-50"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>

      <div className="relative shrink-0 border-l border-surface-200 pl-3" ref={profileRef}>
        <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
            {agent.avatarInitials}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-semibold text-darkteal-800">{agent.name}</span>
            <span className="block text-[11px] text-ink-400">{agent.role}</span>
          </span>
          <ChevronDown size={14} className="hidden text-ink-400 md:block" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-surface-200 bg-white py-1.5 shadow-pop">
            <button
              onClick={() => {
                setProfileOpen(false)
                navigate('/agent/profile')
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink-700 hover:bg-surface-100"
            >
              <User size={15} /> My Profile
            </button>
            <button
              onClick={() => {
                setProfileOpen(false)
                navigate('/agent/profile/security')
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink-700 hover:bg-surface-100"
            >
              <Settings size={15} /> Settings
            </button>
            <button
              onClick={() => {
                setProfileOpen(false)
                showToast('You have been logged out.')
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-accent-600 hover:bg-surface-100"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
