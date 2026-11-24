import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Menu,
  CheckCheck,
  Check,
  Circle,
  ChevronDown,
  User,
  LogOut,
  Home,
  LayoutDashboard,
  X,
  ExternalLink,
  Mail,
  Calendar,
  ShieldCheck,
  Banknote,
  Building2,
} from 'lucide-react';
import {
  notificationService,
  formatNotificationTime,
  getNotificationTargetPath,
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/utils/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

export default function DashboardHeader({
  role = 'broker',
  onMenuClick,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const visibleNotifications =
    notifFilter === 'UNREAD' ? notifications.filter((n) => !n.is_read) : notifications;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'inquiry':
        return <Mail className="size-4 text-[#0F766E]" />;
      case 'appointment':
        return <Calendar className="size-4 text-blue-700" />;
      case 'verification':
        return <ShieldCheck className="size-4 text-amber-700" />;
      case 'sale':
        return <Banknote className="size-4 text-emerald-700" />;
      default:
        return <Building2 className="size-4 text-[#64748B]" />;
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all read:', err.message);
    }
  };

  const toggleNotifRead = async (e, n) => {
    e.stopPropagation();
    const nextRead = !n.is_read;
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, is_read: nextRead } : item))
    );
    try {
      await notificationService.markAsRead(n.id, nextRead);
    } catch (err) {
      console.warn('Failed to toggle notification status:', err.message);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      try {
        await notificationService.markAsRead(n.id, true);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err.message);
      }
    }
    setShowNotifications(false);
    navigate(getNotificationTargetPath(n, role));
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
  const dashboardPath = role === 'admin' ? '/admin/cms' : role === 'client' ? '/client/dashboard' : role === 'agent' ? '/agent/dashboard' : '/broker/dashboard';

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
        {/* Smart Notification Bell Popover (All / Unread + 9+ Badge) */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="size-10 rounded-lg text-slate-500 hover:text-[#1E293B] hover:bg-slate-100 flex items-center justify-center transition-colors relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              />
            }
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span
                data-testid="notification-unread-badge"
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6B6B] text-white text-[10px] font-bold leading-none inline-flex items-center justify-center ring-2 ring-white tabular-nums"
              >
                {badgeLabel}
              </span>
            )}
          </PopoverTrigger>

          <PopoverContent
            align="end"
            positionMethod="fixed"
            className="w-88 sm:w-96 p-0 rounded-xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden font-sans"
          >
            {/* Header: Title + Mark all read + All / Unread Tabs */}
            <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-[11px] text-[#0F766E] hover:underline font-semibold cursor-pointer"
                  >
                    <CheckCheck className="size-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <Tabs value={notifFilter} onValueChange={setNotifFilter} className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-white border border-[#E2E8F0] p-0.5 h-8">
                  <TabsTrigger value="ALL" className="text-xs font-semibold h-7">
                    All ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="UNREAD" className="text-xs font-semibold h-7">
                    Unread ({unreadCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-[#E2E8F0]" data-lenis-prevent="true">
              {visibleNotifications.length === 0 ? (
                <Empty className="p-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Bell />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">
                      {notifFilter === 'UNREAD' ? 'All caught up' : 'No notifications'}
                    </EmptyTitle>
                    <EmptyDescription className="text-xs">
                      {notifFilter === 'UNREAD'
                        ? 'You have no unread alerts right now.'
                        : 'New inquiries and updates will appear here.'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(n);
                      }
                    }}
                    className={cn(
                      'group p-3 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left',
                      !n.is_read ? 'bg-teal-50/50' : 'bg-white'
                    )}
                  >
                    <div className="size-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs leading-snug text-[#1E293B]',
                            !n.is_read ? 'font-semibold' : 'font-normal'
                          )}
                        >
                          {n.title || n.message}
                        </p>
                        {!n.is_read && (
                          <span
                            className="size-2 rounded-full bg-[#FF6B6B] shrink-0 mt-1"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      {n.message && n.title && (
                        <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <span className="text-[10px] text-[#64748B] tabular-nums mt-1 block">
                        {formatNotificationTime(n.created_at)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleNotifRead(e, n)}
                      aria-label={n.is_read ? 'Mark as unread' : 'Mark as read'}
                      title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-[#64748B] hover:text-[#0F766E] hover:bg-teal-50 transition-opacity shrink-0"
                    >
                      {n.is_read ? <Circle className="size-3.5" /> : <Check className="size-3.5" />}
                    </button>
                  </div>
                ))
              )}
            </div>

            {role === 'broker' && (
              <div className="px-3 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center">
                <Link
                  to="/broker/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] inline-flex items-center gap-1"
                >
                  <span>View all notifications</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            )}
          </PopoverContent>
        </Popover>

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
