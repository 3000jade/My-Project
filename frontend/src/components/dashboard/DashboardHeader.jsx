import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockNotifications } from '../../mockData/mockNotifications';

export default function DashboardHeader({
  role = 'agent',
  onMenuClick,
  title = "Dashboard"
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Toggle & Context Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-[#174849] hover:bg-[#F1F0EC] transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <div className="hidden sm:block">
          <h2 className="text-lg font-display font-bold text-[#174849]">
            {title}
          </h2>
          <p className="text-[11px] font-sans text-gray-400 uppercase tracking-widest">
            {role === 'broker' ? 'Firm Operations & Sales Monitoring' : 'Property Management & Inquiry Assistance'}
          </p>
        </div>
      </div>

      {/* Right: Notification Center & Quick Access */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-[#F1F0EC] hover:bg-[#266F71]/10 text-[#174849] flex items-center justify-center transition-colors relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FB8E5D] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/80 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#174849] font-sans">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#266F71] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-[#F1F0EC]/50 transition-colors ${
                      !n.is_read ? 'bg-[#FB8E5D]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#FB8E5D] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#174849] font-sans">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 font-sans leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pt-2 border-t border-gray-100 text-center">
                <Link
                  to={role === 'broker' ? "/broker/notifications" : "/agent/dashboard"}
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#266F71] hover:text-[#174849] uppercase tracking-wider block py-1 font-sans"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <Link
          to={role === 'broker' ? '/broker/profile' : '/agent/profile'}
          className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#F1F0EC] transition-colors border border-transparent hover:border-gray-200"
        >
          <img
            src={
              role === 'broker'
                ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"
                : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
            }
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#174849] font-sans leading-tight">
              {role === 'broker' ? "Alexander Sterling" : "Elena Rossi"}
            </p>
            <span className="text-[10px] font-bold text-[#266F71] uppercase tracking-wider">
              {role === 'broker' ? 'Broker / Admin' : 'Agent'}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
