import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, CheckCheck, ChevronDown, User, LogOut, Home, LayoutDashboard } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/utils/cn';

export default function DashboardHeader({
  role = 'broker',
  onMenuClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click or escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleLogout = async () => {
    setShowUserMenu(false);
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
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-9 h-9 rounded-lg text-slate-500 hover:text-[#1E293B] hover:bg-slate-100 flex items-center justify-center transition-colors relative cursor-pointer"
            aria-label="Notifications"
            aria-expanded={showNotifications}
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

        {/* User Avatar Profile & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0] cursor-pointer hover:opacity-90 transition-opacity text-left select-none"
            aria-label="User navigation menu"
            aria-expanded={showUserMenu}
          >
            <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white font-bold flex items-center justify-center text-xs tracking-tight shadow-xs">
              {roleInitials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="block text-xs font-semibold text-[#1E293B]">{effectiveUserName}</span>
              <span className="block text-[10px] text-[#64748B]">{roleLabel}</span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200", showUserMenu && "rotate-180")} />
          </button>

          {/* User Profile Popover Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-1.5 z-50 animate-in fade-in duration-150 font-sans">
              {/* Profile Card Header */}
              <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                <p className="text-xs font-semibold text-[#1E293B] truncate">{effectiveUserName}</p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">{user?.email || (role === 'broker' ? 'broker@pt.com' : role === 'agent' ? 'agent@pt.com' : 'client@pt.com')}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#0F766E]/10 text-[#0F766E] font-semibold text-[10px] rounded-full uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                <Link
                  to={profilePath}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Broker Profile</span>
                </Link>

                <Link
                  to={dashboardPath}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors"
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Public Home Page</span>
                </Link>
              </div>

              {/* Sign Out / Logout Action */}
              <div className="pt-1 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
