import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function DashboardSidebar({
  role = 'agent',
  isOpen = false,
  onClose,
  unreadCount = 3
}) {
  const agentLinks = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/agent/properties', label: 'Properties', icon: 'apartment' },
    { to: '/agent/inquiries', label: 'Inquiries', icon: 'mail', badge: 3 },
    { to: '/agent/appointments', label: 'Appointments', icon: 'calendar_today' },
    { to: '/agent/availability', label: 'Availability', icon: 'schedule' },
    { to: '/agent/sales', label: 'Sales', icon: 'monetization_on' },
    { to: '/agent/profile', label: 'Profile', icon: 'person' },
  ];

  const brokerLinks = [
    { to: '/broker/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/broker/properties', label: 'Properties', icon: 'apartment' },
    { to: '/broker/inquiries', label: 'Inquiries', icon: 'mail', badge: 7 },
    { to: '/broker/appointments', label: 'Appointments', icon: 'calendar_today' },
    { to: '/broker/agents', label: 'Agents', icon: 'badge', badge: 2 },
    { to: '/broker/sales', label: 'Sales', icon: 'monetization_on' },
    { to: '/broker/reports', label: 'Reports', icon: 'analytics' },
    { to: '/broker/notifications', label: 'Notifications', icon: 'notifications', badge: unreadCount },
    { to: '/broker/profile', label: 'Profile', icon: 'admin_panel_settings' },
  ];

  const links = role === 'broker' ? brokerLinks : agentLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#174849] text-white">
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#266F71] flex items-center justify-center font-display font-bold text-white text-lg tracking-wider shadow-md group-hover:scale-105 transition-transform">
            PT
          </div>
          <div>
            <div className="font-display font-bold text-base tracking-wide text-white leading-tight">
              PRECISION
            </div>
            <div className="text-[10px] font-sans uppercase tracking-widest text-[#FB8E5D]">
              {role === 'broker' ? 'Broker / Admin' : 'Agent Portal'}
            </div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-white/70 hover:text-white p-1"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-2 font-sans">
          Main Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? "bg-[#266F71] text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </div>
            {link.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FB8E5D] text-white font-sans">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Switcher & User footer */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0 space-y-3">
        {/* Quick Portal Toggle for Demo/Grading */}
        <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 font-sans">
            Switch View:
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              to="/agent/dashboard"
              className={`px-2 py-1 rounded text-[10px] font-bold font-sans transition-colors ${
                role === 'agent'
                  ? "bg-[#266F71] text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Agent
            </Link>
            <Link
              to="/broker/dashboard"
              className={`px-2 py-1 rounded text-[10px] font-bold font-sans transition-colors ${
                role === 'broker'
                  ? "bg-[#266F71] text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Broker
            </Link>
            <Link
              to="/"
              className="px-2 py-1 rounded text-[10px] font-bold font-sans text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Return to Public Client Site"
            >
              Client
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <img
              src={
                role === 'broker'
                  ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"
                  : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
              }
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border border-white/20"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight font-sans">
                {role === 'broker' ? "Alexander Sterling" : "Elena Rossi"}
              </p>
              <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">
                {role === 'broker' ? "Principal Broker" : "Licensed Agent"}
              </p>
            </div>
          </div>

          <Link
            to="/login"
            title="Logout / Sign out"
            className="text-white/50 hover:text-[#FB8E5D] transition-colors p-1.5"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
