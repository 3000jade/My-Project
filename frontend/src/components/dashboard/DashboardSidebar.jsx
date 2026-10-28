import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, MessageSquare, Calendar, 
  FileText, 
  HelpCircle, ExternalLink, X, Bookmark, Compass, User,
  Settings, Shield
} from 'lucide-react';
import { cn } from '@/utils/cn';

export default function DashboardSidebar({
  role = 'broker',
  isOpen = false,
  onClose,
}) {
  const location = useLocation();

  // Broker navigation sections for semantic visual hierarchy
  const brokerSections = [
    {
      title: 'Overview',
      items: [
        { to: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Management',
      items: [
        { to: '/broker/properties', label: 'Properties', icon: Building2 },
        { to: '/broker/inquiries', label: 'Inquiries', icon: MessageSquare },
        { to: '/broker/agents', label: 'Agents', icon: User },
      ],
    },
    {
      title: 'Analytics & System',
      items: [
        { to: '/broker/reports', label: 'Reports', icon: FileText },
        { to: '/broker/audit', label: 'Audit Trail', icon: Shield },
        { to: '/broker/profile', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const agentLinks = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agent/properties', label: 'Properties', icon: Building2 },
    { to: '/agent/inquiries', label: 'Inquiries', icon: MessageSquare },
    { to: '/agent/availability', label: 'Schedule & Availability', icon: Calendar },
    { to: '/agent/sales', label: 'Sales', icon: FileText },
  ];

  const clientLinks = [
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/client/saved-properties', label: 'Saved Properties', icon: Bookmark },
    { to: '/client/inquiries', label: 'My Inquiries', icon: MessageSquare },
    { to: '/properties', label: 'Explore Listings', icon: Compass },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen z-40 flex flex-col bg-[#032626] border-r border-[#0A3D3C] transition-all duration-200 select-none w-64 text-white shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        aria-label="Dashboard Sidebar"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-teal-900/60 shrink-0">
          <Link 
            to={role === 'broker' ? '/broker/dashboard' : '/'} 
            className="flex items-center gap-3 min-w-0 group"
          >
            {/* Modern Geometric Emblem */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-xs shrink-0 ring-1 ring-teal-400/30 group-hover:ring-teal-400/60 transition-all">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="truncate min-w-0 text-left">
              <span className="font-bold text-xs tracking-wider text-white block uppercase font-sans truncate group-hover:text-teal-200 transition-colors">
                HUMAN SHELTER REALTY
              </span>
              <span className="font-sans text-[9px] text-teal-300/80 block uppercase tracking-widest truncate font-medium">
                {role === 'broker' ? 'BROKER PORTAL' : role === 'agent' ? 'AGENT WORKSPACE' : 'CLIENT PORTAL'}
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-teal-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
          {role === 'broker' ? (
            brokerSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 py-1">
                  <span className="text-[10px] font-semibold text-teal-300/60 uppercase tracking-wider block">
                    {section.title}
                  </span>
                </div>
                {section.items.map((link) => {
                  const Icon = link.icon;
                  const isProperties = link.label === 'Properties';
                  const isAgents = link.label === 'Agents';
                  const isSettings = link.label === 'Settings';
                  const isActive = isProperties
                    ? location.pathname.includes('/properties')
                    : isAgents
                    ? location.pathname.startsWith('/broker/agents') || location.pathname.startsWith('/broker/appointments')
                    : isSettings
                    ? location.pathname === '/broker/profile'
                    : location.pathname === link.to;

                  return (
                    <NavLink
                      key={link.to + link.label}
                      to={link.to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors font-medium",
                        isActive
                          ? "bg-[#0F766E] text-white font-semibold shadow-xs ring-1 ring-teal-400/20"
                          : "text-teal-100/75 hover:text-white hover:bg-white/5 active:bg-white/10"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-white" : "text-teal-200/70")} />
                      <span className="truncate">{link.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {(role === 'client' ? clientLinks : agentLinks).map((link) => {
                const Icon = link.icon;
                const isProperties = link.label === 'Properties';
                const isActive = isProperties
                  ? location.pathname.includes('/properties')
                  : location.pathname === link.to;

                return (
                  <NavLink
                    key={link.to + link.label}
                    to={link.to}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors font-medium",
                      isActive
                        ? "bg-[#0F766E] text-white font-semibold shadow-xs"
                        : "text-teal-100/75 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-teal-200/70")} />
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Support / Knowledge Base Card */}
        <div className="mx-3 mb-4 p-3.5 rounded-xl bg-gradient-to-b from-teal-900/60 to-teal-950/80 border border-teal-800/60 shadow-inner text-left">
          <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
            <div className="w-5 h-5 rounded-md bg-[#0F766E]/50 flex items-center justify-center text-teal-300">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <span>Need Assistance?</span>
          </div>
          <p className="text-[11px] text-teal-200/75 leading-relaxed mb-3">
            Access our broker guide or contact operations support.
          </p>
          <a
            href="mailto:support@humanshelterrealty.com"
            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-teal-700/60 hover:bg-teal-800/50 text-white text-xs font-medium transition-colors"
          >
            <span>Go to Help Center</span>
            <ExternalLink className="w-3 h-3 text-teal-300" />
          </a>
        </div>
      </aside>
    </>
  );
}
