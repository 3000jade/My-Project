import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  MessagesSquare,
  Users,
  BarChart3,
  Bot,
  Bell,
  Settings,
  ChevronDown,
  Home,
  X,
} from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'

const NAV = [
  { label: 'Dashboard', to: '/agent', icon: LayoutDashboard, exact: true },
  {
    label: 'Properties',
    icon: Building2,
    base: '/agent/properties',
    children: [
      { label: 'My Properties', to: '/agent/properties' },
      { label: 'Add Property', to: '/agent/properties/add' },
    ],
  },
  {
    label: 'Inquiries',
    icon: MessagesSquare,
    base: '/agent/inquiries',
    children: [
      { label: 'All Inquiries', to: '/agent/inquiries' },
      { label: 'New', to: '/agent/inquiries/new' },
      { label: 'Follow-ups', to: '/agent/inquiries/follow-up' },
      { label: 'Closed', to: '/agent/inquiries/closed' },
    ],
  },
  {
    label: 'CRM',
    icon: Users,
    base: '/agent/crm',
    children: [
      { label: 'Leads', to: '/agent/crm/leads' },
      { label: 'Clients', to: '/agent/crm/clients' },
      { label: 'Follow-ups', to: '/agent/crm/follow-ups' },
      { label: 'Schedule', to: '/agent/crm/schedule' },
      { label: 'Communication History', to: '/agent/crm/communication-history' },
    ],
  },
  {
    label: 'Sales',
    icon: BarChart3,
    base: '/agent/sales',
    children: [
      { label: 'Sales Overview', to: '/agent/sales/overview' },
      { label: 'Transactions', to: '/agent/sales/transactions' },
      { label: 'Sales Reports', to: '/agent/sales/reports' },
      { label: 'Sales Analytics', to: '/agent/sales/analytics' },
    ],
  },
  { label: 'AI Assistant', to: '/agent/ai-assistant', icon: Bot },
  { label: 'Notifications', to: '/agent/notifications', icon: Bell },
  {
    label: 'Profile & Settings',
    icon: Settings,
    base: '/agent/profile',
    children: [
      { label: 'My Profile', to: '/agent/profile' },
      { label: 'Security', to: '/agent/profile/security' },
      { label: 'Terms & Conditions', to: '/agent/profile/terms' },
    ],
  },
]

function NavGroup({ item, currentPath }) {
  const isActiveBase = currentPath.startsWith(item.base)
  const [open, setOpen] = useState(isActiveBase)

  useEffect(() => {
    if (isActiveBase) setOpen(true)
  }, [isActiveBase])

  const Icon = item.icon

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActiveBase ? 'bg-teal-500/15 text-teal-300' : 'text-teal-100/80 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} strokeWidth={2} />
          {item.label}
        </span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 ml-8 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              className={({ isActive }) =>
                `rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive ? 'font-semibold text-teal-300' : 'text-teal-100/70 hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation()
  const { unreadCount } = useApp()

  const content = (
    <div className="flex h-full w-64 flex-col bg-darkteal-800">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-500 text-white">
          <Home size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">RealtyConnect</p>
          <p className="truncate text-[11px] font-medium text-teal-200/80">Agent Portal</p>
        </div>
        <button onClick={onCloseMobile} className="ml-auto rounded-md p-1 text-teal-100 hover:bg-white/10 lg:hidden">
          <X size={18} />
        </button>
      </div>

      <nav data-lenis-prevent="true" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} currentPath={location.pathname} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-500 text-white' : 'text-teal-100/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <item.icon size={18} strokeWidth={2} />
                {item.label}
              </span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-teal-200/60">RealtyConnect © 2026</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:shrink-0">{content}</aside>

      {/* Mobile drawer sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-darkteal-900/50" onClick={onCloseMobile} />
          <div className="relative z-10 animate-sidebar-in">{content}</div>
        </div>
      )}
    </>
  )
}
