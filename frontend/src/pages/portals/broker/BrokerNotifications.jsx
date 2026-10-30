import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/dashboard/PageHeader';
import { Card, CardContent, useToast, Toaster } from '../../../components/ui';
import { Spinner } from '../../../components/ui';
import { ListSkeleton } from '../../../components/dashboard/skeletons';
import { notificationService } from '../../../services/notificationService';

export default function BrokerNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message ? `Failed to load system notifications: ${err.message}` : 'Failed to load system notifications.';
      setError(msg);
      toast({ title: 'Notification Error', description: 'Could not synchronize notifications.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    return true;
  });

  const toggleRead = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: nextStatus } : n));
    try {
      await notificationService.markAsRead(id, nextStatus);
      toast({
        title: nextStatus ? 'Marked as Read' : 'Marked as Unread',
        description: 'Notification status updated.',
        variant: 'default',
        duration: 2000
      });
    } catch (err) {
      console.warn('Error updating read status:', err.message);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
      toast({
        title: 'All Caught Up',
        description: 'All system notifications marked as read.',
        variant: 'success',
      });
    } catch (err) {
      console.warn('Error marking all read:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans min-w-0 max-w-full" data-testid="broker-notifications-portal">
      <Toaster />
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Operational event feed for client inquiries, agent accreditation filings, and transaction milestones."
        actions={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
            <button
              onClick={loadNotifications}
              disabled={loading}
              aria-label="Refresh notifications"
              className="h-[46px] px-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              
              className="h-[46px] px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Mark All as Read
            </button>
          </div>
        }
      />

      {error && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 font-sans text-sm">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadNotifications}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-3" role="group">
        {[
          { key: 'ALL', label: 'All Alerts' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'READ', label: 'Read' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-[#0F766E] text-white'
                : 'text-[#64748B] dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single-Column Responsive Notifications List using Card */}
      {loading ? (
        <Spinner centered size="lg" text="Loading system notifications..." />
      ) : filtered.length === 0 ? (
        <Card data-testid="broker-card" className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-8 font-sans shadow-xs">
          <span className="material-symbols-outlined text-gray-300 dark:text-slate-600 text-[48px] mb-2">
            notifications_off
          </span>
          <h3 className="text-base font-bold text-[#1E293B] dark:text-slate-100">No notifications found</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">There are no notifications matching the {filter.toLowerCase()} filter.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <Card
              key={item.id}
              data-testid="broker-card"
              className={`border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors overflow-hidden ${
                !item.is_read ? 'bg-[#FF6B6B]/5 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      !item.is_read
                        ? 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                        : 'bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.type === 'inquiry' ? 'mail' :
                       item.type === 'verification' ? 'verified_user' :
                       item.type === 'appointment' ? 'calendar_today' :
                       item.type === 'sale' ? 'monetization_on' : 'apartment'}
                    </span>
                  </div>
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#1E293B] dark:text-slate-100">{item.title}</h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" aria-label="Unread alert" />
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed max-w-xl">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-slate-400 pt-1">
                      <span>{item.timestamp}</span>
                      {item.related_record && (
                        <>
                          <span>•</span>
                          <span>Related ID: {item.related_record}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleRead(item.id, item.is_read)}
                  aria-label={item.is_read ? "Mark Unread" : "Mark Read"}
                  className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline shrink-0 font-sans cursor-pointer"
                >
                  {item.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
