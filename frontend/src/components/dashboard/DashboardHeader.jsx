import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Menu, CheckCheck, ChevronDown, User, LogOut, Home, 
  LayoutDashboard, X, ExternalLink, History, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/utils/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function DashboardHeader({
  role = 'broker',
  onMenuClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationRef = useRef(null);

  // Close notifications popover on outside click or escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await notificationService.getNotifications();
        if (isMounted && Array.isArray(data)) {
          setNotifications(data);
        }
      } catch {
        // Handled silently
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (showNotifications) {
      (async () => {
        try {
          const events = await auditService.listAuditEvents({ limit: 6 });
          if (isMounted && Array.isArray(events)) {
            setRecentActivities(events);
          }
        } catch {
          // Handled silently
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [showNotifications]);

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

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.warn('Logout failed:', err);
    } finally {
      navigate('/login');
    }
  };

  const fallbackRoleName = role === 'client'
    ? 'Valued Client'
    : role === 'agent'
      ? 'Associate Agent'
      : role === 'broker'
        ? 'Principal Broker'
        : 'Administrator';
  const effectiveUserName =
    user?.fullName ||
    user?.full_name ||
    user?.profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : fallbackRoleName);
  const roleLabel = role === 'client' ? 'Client' : role === 'agent' ? 'Sales Agent' : role === 'broker' ? 'Principal Broker' : 'Administrator';
  const roleInitials = effectiveUserName
    ? effectiveUserName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (role === 'client' ? 'CL' : role === 'agent' ? 'AG' : role === 'broker' ? 'PB' : 'AD');

  const profilePath = role === 'client' ? '/client/profile' : role === 'agent' ? '/agent/profile' : '/broker/profile';
  const dashboardPath = role === 'client' ? '/client/dashboard' : role === 'agent' ? '/agent/dashboard' : '/broker/dashboard';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none gap-4">
      
      {/* Left: Mobile Toggle & Global Search Console */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Console with Clear Button and Keyboard Shortcut */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, clients, or inquiries..."
            aria-label="Search properties, clients, or inquiries"
            className="w-full h-10 pl-9 pr-14 sm:pr-20 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-[#E2E8F0] rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Avatar Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="w-10 h-10 rounded-lg text-slate-500 hover:text-[#1E293B] hover:bg-slate-100 flex items-center justify-center transition-colors relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B6B] ring-2 ring-white" />
            )}
          </button>

          {/* Slide-Down Notifications & Recent Activity Popover Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in duration-150 font-sans">
              {/* Dual-Tab Navigation Bar */}
              <div className="px-4 pt-1 pb-2 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className={cn(
                      "text-xs font-semibold pb-1.5 border-b-2 transition-colors cursor-pointer",
                      activeTab === 'notifications'
                        ? "border-[#0F766E] text-[#0F766E]"
                        : "border-transparent text-slate-500 hover:text-[#1E293B]"
                    )}
                  >
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activities')}
                    className={cn(
                      "text-xs font-semibold pb-1.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
                      activeTab === 'activities'
                        ? "border-[#0F766E] text-[#0F766E]"
                        : "border-transparent text-slate-500 hover:text-[#1E293B]"
                    )}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Recent Activity</span>
                  </button>
                </div>

                {activeTab === 'notifications' && unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-[#0F766E] hover:underline font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Notifications List */}
              {activeTab === 'notifications' && (
                <>
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

                  {role === 'broker' && (
                    <div className="px-3 pt-2 pb-1 border-t border-[#E2E8F0] text-center">
                      <Link
                        to="/broker/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-[11px] font-medium text-[#0F766E] hover:text-[#115E59] inline-flex items-center gap-1"
                      >
                        <span>View all tasks & alerts</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Recent Activity Audit Stream */}
              {activeTab === 'activities' && (
                <>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0] text-xs">
                    {recentActivities.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No recent activity recorded in the past 24 hours.
                      </div>
                    ) : (
                      recentActivities.map((act) => {
                        const isDenied = act.outcome === 'denied';
                        return (
                          <div
                            key={act.id}
                            className="p-3 hover:bg-[#F8FAFC] transition-colors text-left"
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0 mt-1.5",
                                  isDenied ? "bg-[#DC2626]" : "bg-[#10B981]"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-[#1E293B] truncate">
                                    {act.actorName || 'System'}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </span>
                                </div>
                                <p className="text-slate-600 line-clamp-1 mt-0.5">
                                  {act.reason || act.targetTitle || act.eventType}
                                </p>
                                {act.targetTitle && (
                                  <span className="inline-block px-1.5 py-0.5 mt-1 text-[10px] bg-slate-100 text-slate-600 rounded font-mono truncate max-w-full">
                                    {act.targetTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="px-3 pt-2.5 pb-1 border-t border-[#E2E8F0] text-center">
                    <Link
                      to="/broker/audit"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Full Audit Trail</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* User Profile Accessible Radix Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E2E8F0] cursor-pointer hover:opacity-90 transition-opacity text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-md py-1"
              aria-label="User navigation menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white font-bold flex items-center justify-center text-xs tracking-tight shadow-xs shrink-0 ring-1 ring-teal-600/30">
                {roleInitials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-xs font-semibold text-[#1E293B]">{effectiveUserName}</span>
                <span className="block text-[10px] text-[#64748B]">{roleLabel}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-xl border border-[#E2E8F0] bg-white shadow-xl z-50">
            {/* Profile Info Header */}
            <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
              <p className="text-xs font-semibold text-[#1E293B] truncate">{effectiveUserName}</p>
              <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                {user?.email || (role === 'broker' ? 'broker@pt.com' : role === 'agent' ? 'agent@pt.com' : 'client@pt.com')}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-teal-50 text-[#0F766E] border border-teal-200 font-semibold text-[10px] rounded-full uppercase tracking-wider">
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Navigation Destinations */}
            <DropdownMenuItem asChild>
              <Link
                to={profilePath}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1E293B] rounded-lg hover:bg-[#F8FAFC] hover:text-[#0F766E] cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Broker Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                to={dashboardPath}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1E293B] rounded-lg hover:bg-[#F8FAFC] hover:text-[#0F766E] cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                to="/"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1E293B] rounded-lg hover:bg-[#F8FAFC] hover:text-[#0F766E] cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>Public Home Page</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-[#E2E8F0]" />

            {/* Sign Out Action */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors focus:bg-rose-50 focus:text-rose-700"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
