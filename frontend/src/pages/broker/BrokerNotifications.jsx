import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import { notificationService } from '../../services/notificationService';

export default function BrokerNotifications() {
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
      setError(err.message ? `Failed to load system notifications: ${err.message}` : 'Failed to load system notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (err) {
      console.warn('Error updating read status:', err.message);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Error marking all read:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Operational event feed for client inquiries, agent accreditation filings, and transaction milestones."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Notifications" }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Mark All as Read
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
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
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { key: 'ALL', label: 'All Alerts' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'READ', label: 'Read' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-[#266F71] text-white'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3 bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#266F71]">
            progress_activity
          </span>
          <p className="text-sm font-sans font-medium">Loading system notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-200/80 p-8 font-sans">
          <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2">
            notifications_off
          </span>
          <h3 className="text-base font-bold text-gray-700">No notifications found</h3>
          <p className="text-xs text-gray-400 mt-1">There are no notifications matching the {filter.toLowerCase()} filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !item.is_read ? 'bg-[#FB8E5D]/5' : 'hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !item.is_read ? 'bg-[#FB8E5D]/15 text-[#FB8E5D]' : 'bg-[#266F71]/10 text-[#266F71]'
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
                    <h4 className="font-bold text-sm text-[#174849]">{item.title}</h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#FB8E5D]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
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
                className="text-xs font-semibold text-[#266F71] hover:underline shrink-0 font-sans cursor-pointer"
              >
                {item.is_read ? 'Mark Unread' : 'Mark Read'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
