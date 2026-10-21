import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, MessageSquare, Calendar, 
  Users, CheckSquare, FileText, 
  HelpCircle, ExternalLink, X, Bookmark, Compass, User
} from 'lucide-react';
import { cn } from '@/utils/cn';

export default function DashboardSidebar({
  role = 'broker',
  isOpen = false,
  onClose,
}) {
  const location = useLocation();

  const brokerLinks = [
    { to: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/broker/properties', label: 'Properties', icon: Building2 },
    { to: '/broker/inquiries', label: 'Inquiries', icon: MessageSquare },
    { to: '/broker/clients', label: 'Clients', icon: Users },
    { to: '/broker/agents', label: 'Agents', icon: User },
    { to: '/broker/notifications', label: 'Tasks', icon: CheckSquare },
    { to: '/broker/reports', label: 'Reports', icon: FileText },
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

  const links = role === 'broker' ? brokerLinks : role === 'client' ? clientLinks : agentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen z-40 flex flex-col bg-[#032626] border-r border-[#0A3D3C] transition-all duration-200 select-none w-64 text-white",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-teal-900/50 shrink-0">
          <Link to={role === 'broker' ? '/broker/dashboard' : '/'} className="flex items-center gap-3 min-w-0">
            {/* Gold Geometric House Emblem matching mockup */}
            <svg 
              className="w-7 h-7 text-amber-400 shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5z" />
            </svg>
            <div className="truncate min-w-0 text-left">
              <span className="font-bold text-xs tracking-wider text-white block uppercase font-sans truncate">
                HUMAN SHELTER REALTY
              </span>
              <span className="font-sans text-[9px] text-teal-300/80 block uppercase tracking-widest truncate font-medium">
                {role === 'broker' ? 'BROKER DASHBOARD' : 'PROPERTY MANAGEMENT'}
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-teal-300 hover:text-white p-1"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
          {links.map((link) => {
            const Icon = link.icon;
            const isProperties = link.label === 'Properties';
            const isAgents = link.label === 'Agents';
            const isActive = isProperties
              ? location.pathname.includes('/properties')
              : isAgents
              ? location.pathname.startsWith('/broker/agents') || location.pathname.startsWith('/broker/appointments')
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
                    : "text-teal-100/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-teal-200/70")} />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}

          {/* Divider & Settings for Broker matching mockup */}
          {role === 'broker' && (
            <>
              <div className="pt-2 pb-1">
                <div className="h-px bg-teal-900/50 w-full" />
              </div>
              <NavLink
                to="/broker/profile"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors font-medium",
                  location.pathname === '/broker/profile'
                    ? "bg-[#0F766E] text-white font-semibold shadow-xs"
                    : "text-teal-100/70 hover:text-white hover:bg-white/5"
                )}
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-teal-200/70 rotate-90" />
                <span className="truncate">Settings</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Bottom "Need Help?" Card matching mockup */}
        <div className="mx-3 mb-4 p-3.5 rounded-xl bg-teal-950/60 border border-teal-800/50 shadow-inner text-left">
          <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
            <HelpCircle className="w-4 h-4 text-teal-300 shrink-0" />
            <span>Need Help?</span>
          </div>
          <p className="text-[11px] text-teal-200/70 leading-snug mb-3">
            Visit our help center or contact support.
          </p>
          <a
            href="mailto:support@humanshelterrealty.com"
            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-teal-700/60 hover:bg-teal-900/50 text-white text-xs font-medium transition-colors"
          >
            <span>Go to Help Center</span>
            <ExternalLink className="w-3 h-3 text-teal-300" />
          </a>
        </div>
      </aside>
    </>
  );
}
