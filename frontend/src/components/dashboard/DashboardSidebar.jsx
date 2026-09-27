import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Mail, Calendar, 
  Users, DollarSign, BarChart3, Bell, User, 
  ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { cn } from '@/utils/cn';

export default function DashboardSidebar({
  role = 'broker',
  isOpen = false,
  onClose,
  unreadCount = 3
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const agentLinks = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agent/properties', label: 'Properties', icon: Building2 },
    { to: '/agent/inquiries', label: 'Inquiries', icon: Mail, badge: 3 },
    { to: '/agent/appointments', label: 'Appointments', icon: Calendar },
    { to: '/agent/sales', label: 'Sales', icon: DollarSign },
    { to: '/agent/profile', label: 'Profile', icon: User },
  ];

  const brokerLinks = [
    { to: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/broker/properties', label: 'Properties', icon: Building2, badge: 6 },
    { to: '/broker/inquiries', label: 'Inquiries', icon: Mail, badge: 7 },
    { to: '/broker/appointments', label: 'Appointments', icon: Calendar },
    { to: '/broker/agents', label: 'Agents', icon: Users, badge: 2 },
    { to: '/broker/sales', label: 'Sales', icon: DollarSign },
    { to: '/broker/reports', label: 'Reports', icon: BarChart3 },
    { to: '/broker/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/broker/profile', label: 'Profile', icon: User },
  ];

  const links = role === 'broker' ? brokerLinks : agentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen z-40 flex flex-col bg-white border-r border-[#D8DFDF] transition-all duration-200 select-none",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5EBEB] shrink-0">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D4446] flex items-center justify-center font-mono font-bold text-white text-xs tracking-wider shrink-0 shadow-xs">
              PT
            </div>
            {!isCollapsed && (
              <div className="truncate min-w-0">
                <span className="font-semibold text-xs tracking-tight text-[#0F172A] block truncate">
                  PRECISION TECH
                </span>
                <span className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">
                  {role === 'broker' ? 'Executive Broker' : 'Agent Workspace'}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-6 h-6 rounded-md hover:bg-[#F4F5F4] text-slate-400 hover:text-slate-700 items-center justify-center cursor-pointer transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
          {!isCollapsed && (
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider px-2 mb-2 font-medium">
              Navigation
            </p>
          )}

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                title={isCollapsed ? link.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                    isActive
                      ? "bg-[#0D4446]/10 text-[#0D4446] font-semibold border border-[#0D4446]/20 shadow-xs"
                      : "text-slate-600 hover:text-[#0F172A] hover:bg-[#F4F5F4]"
                  )
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </div>

                {!isCollapsed && link.badge && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-[#F4F5F4] text-slate-600 font-semibold group-hover:bg-white border border-transparent group-hover:border-[#E5EBEB]">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer: Broker Profile & Role Switcher */}
        <div className="p-3 border-t border-[#E5EBEB] bg-[#FBFBF9]/80 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F4F5F4] transition-colors cursor-pointer min-w-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
              className="w-7 h-7 rounded-full object-cover border border-[#D8DFDF] shrink-0"
              alt="Avatar"
            />
            {!isCollapsed && (
              <div className="truncate min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#0F172A] truncate">Alexander Sterling</p>
                <p className="font-mono text-[10px] text-slate-400 truncate">Principal Broker</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="bg-[#F4F5F4] p-1 rounded-md flex items-center justify-between font-mono text-[10px] text-slate-500 border border-[#E5EBEB]">
              <span className="px-2 py-0.5 rounded bg-white text-[#0F172A] font-semibold shadow-xs">
                Broker
              </span>
              <Link to="/agent/properties" className="px-2 py-0.5 rounded hover:text-[#0F172A] transition-colors">
                Agent
              </Link>
              <Link to="/properties" className="px-2 py-0.5 rounded hover:text-[#0F172A] transition-colors">
                Public
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
