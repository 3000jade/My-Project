import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu, CheckCheck, ChevronDown } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { cn } from '@/utils/cn';

export default function DashboardHeader({
  role = 'broker',
  onMenuClick,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Keep empty or current if error
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all read:', err.message);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      try {
        await notificationService.markAsRead(n.id, true);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err.message);
      }
    }
  };

  const roleLabel = role === 'client' ? 'Client' : role === 'agent' ? 'Sales Agent' : 'Administrator';
  const roleInitials = role === 'client' ? 'CL' : role === 'agent' ? 'AG' : 'MS';
  const userName = role === 'client' ? 'Valued Client' : role === 'agent' ? 'Associate Agent' : 'Maria Santos';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none gap-4">
      
      {/* Left: Mobile Toggle & Clean Search Bar matching target mockup */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Console */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, clients, or inquiries..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
          />
        </div>
      </div>

      {/* Right: Notifications & User Avatar Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg text-slate-500 hover:text-[#1E293B] hover:bg-slate-100 flex items-center justify-center transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6B6B] ring-2 ring-white" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B]">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-[#0F766E] hover:underline font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0] text-xs">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No new alerts or client inquiries.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer",
                        !n.is_read ? "bg-[#0F766E]/5 font-medium" : "text-slate-600"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#1E293B] leading-snug">{n.title || n.message}</p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Badge matching mockup */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0] cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white font-bold flex items-center justify-center text-xs tracking-tight shadow-xs">
            {roleInitials}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <span className="block text-xs font-semibold text-[#1E293B]">{userName}</span>
            <span className="block text-[10px] text-[#64748B]">{roleLabel}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>
      </div>

    </header>
  );
}
