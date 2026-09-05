import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import { mockNotifications } from '../../mockData/mockNotifications';

export default function BrokerNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    return true;
  });

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

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
          <button
            onClick={markAllRead}
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-sm"
          >
            Mark All as Read
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {['ALL', 'UNREAD', 'READ'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors ${
              filter === tab
                ? 'bg-[#266F71] text-white'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
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
                   item.type === 'appointment' ? 'calendar_today' : 'monetization_on'}
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
                  <span>•</span>
                  <span>Related ID: {item.related_record}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleRead(item.id)}
              className="text-xs font-semibold text-[#266F71] hover:underline shrink-0 font-sans"
            >
              {item.is_read ? 'Mark Unread' : 'Mark Read'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
