import React from 'react';
import {
  IconUsers,
  IconUserCheck,
  IconCertificate,
  IconAlertTriangle,
} from '@tabler/icons-react';

/**
 * UserMetricsStrip Component
 * 4-card executive KPI summary strip adhering to DESIGN.md
 * Provides one-click filter triage for Super Administrators and Brokers
 */
export default function UserMetricsStrip({
  stats,
  loading,
  activeFilter,
  onSelectFilter,
}) {
  const cards = [
    {
      id: 'total',
      title: 'Total Accounts',
      value: stats?.totalUsers ?? 0,
      subtitle: 'Registered platform profiles',
      icon: IconUsers,
      color: '#0F766E',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      filterRole: 'all',
      filterStatus: 'all',
    },
    {
      id: 'active',
      title: 'Active Accounts',
      value: stats?.activeToday ?? stats?.activeUsers ?? 0,
      subtitle: 'Verified & active users',
      icon: IconUserCheck,
      color: '#0F766E',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      filterRole: 'all',
      filterStatus: 'active',
    },
    {
      id: 'pending',
      title: 'Pending Accreditation',
      value: stats?.pendingAccreditation ?? 0,
      subtitle: 'Agents awaiting PRC review',
      icon: IconCertificate,
      color: '#D97706',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      filterRole: 'agent',
      filterStatus: 'pending',
    },
    {
      id: 'suspended',
      title: 'Suspended Accounts',
      value: stats?.suspendedAccounts ?? stats?.suspendedUsers ?? 0,
      subtitle: 'Restricted for compliance',
      icon: IconAlertTriangle,
      color: '#FF6B6B',
      bg: 'bg-red-50',
      border: 'border-red-200',
      filterRole: 'all',
      filterStatus: 'suspended',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected =
          (activeFilter?.role === c.filterRole || c.filterRole === 'all') &&
          activeFilter?.status === c.filterStatus;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter?.(c.filterRole, c.filterStatus)}
            className={`text-left p-4 rounded-xl border bg-white transition-all shadow-sm flex flex-col justify-between cursor-pointer ${
              isSelected
                ? 'ring-2 ring-[#0F766E] border-transparent shadow-md'
                : 'border-[#E2E8F0] hover:border-[#0F766E]/50 hover:shadow'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-2 rounded-lg ${c.bg} ${c.border} border`}>
                <Icon className="w-4 h-4" style={{ color: c.color }} />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-[#1E293B] font-mono">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded" />
                ) : (
                  c.value
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">{c.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
