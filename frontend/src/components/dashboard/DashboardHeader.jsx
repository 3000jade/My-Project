import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Menu, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { cn } from '@/utils/cn';

export default function DashboardHeader({
  role = 'broker',
  onMenuClick,
  title = "Property Inventory"
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

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

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#D8DFDF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-[#F4F5F4] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400">Dashboard</span>
          <span className="text-[#D8DFDF]">/</span>
          <span className="font-semibold text-[#0F172A]">{title}</span>
          <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0D4446]/10 text-[#0D4446] border border-[#0D4446]/20 font-semibold">
            RESO Verified
          </span>
        </div>
      </div>

      {/* Center: Linear-Style Search Command Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
        <div className="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg border border-[#D8DFDF] bg-[#FBFBF9] hover:bg-[#F4F5F4] text-xs text-slate-400 transition-colors cursor-pointer">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="flex-1 truncate text-left">Search title, location, or ID...</span>
          <kbd className="font-mono text-[10px] text-slate-500 bg-white border border-[#D8DFDF] px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Notification Center */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-[#0F172A] hover:bg-[#F4F5F4] flex items-center justify-center transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E76F51] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-xl shadow-xl border border-[#D8DFDF] py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-[#E5EBEB] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A]">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-[#0D4446] hover:underline font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#E5EBEB] text-xs">
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
                        "p-3.5 hover:bg-[#FBFBF9] transition-colors cursor-pointer",
                        !n.is_read ? "bg-[#0D4446]/5 font-medium" : "text-slate-600"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#0F172A] leading-snug">{n.title || n.message}</p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446] shrink-0 mt-1" />
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
      </div>

    </header>
  );
}
