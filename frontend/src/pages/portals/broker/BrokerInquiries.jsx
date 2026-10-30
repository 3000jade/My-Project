import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Building2, Clock, Sparkles, ChevronRight, Search } from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { Card, CardContent, useToast, Toaster, Spinner } from '../../../components/ui';
import { TableSkeleton } from '../../../components/dashboard/skeletons';
import { inquiryService } from '../../../services/inquiryService';
import { agentService } from '../../../services/agentService';

const AVATAR_BG_COLORS = [
  'bg-teal-700 text-teal-100',
  'bg-indigo-700 text-indigo-100',
  'bg-sky-700 text-sky-100',
  'bg-emerald-700 text-emerald-100',
  'bg-amber-700 text-amber-100',
  'bg-rose-700 text-rose-100',
  'bg-violet-700 text-violet-100',
];

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

export default function BrokerInquiries() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, INACTIVE, UNASSIGNED, UNANSWERED, OVERDUE
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [agents, setAgents] = useState([]);

  const loadInquiriesAndMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, agentList] = await Promise.all([
        inquiryService.getInquiries(),
        agentService.getAgents().catch(() => []),
      ]);
      setInquiries(Array.isArray(data) ? data : []);
      setAgents(Array.isArray(agentList) ? agentList : []);
      if (typeof inquiryService.getBrokerMetrics === 'function') {
        const met = await inquiryService.getBrokerMetrics().catch(() => null);
        if (met) setMetrics(met);
      }
    } catch (err) {
      const msg = err.message || 'Failed to load firm inquiries.';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInquiriesAndMetrics();
  }, [loadInquiriesAndMetrics]);

  // Compute live KPI stats
  const totalCount = inquiries.length;
  const newCount = inquiries.filter(i => (i.status || '').toUpperCase() === 'NEW').length;
  const activeCount = inquiries.filter((i) => i.business_status !== 'inactive').length;
  const inactiveCount = inquiries.filter((i) => i.business_status === 'inactive').length;
  const unassignedCount = inquiries.filter((i) => i.operational_status === 'unassigned' || !i.agent_id).length;
  const overdueCount = inquiries.filter((i) => i.operational_status === 'overdue').length;

  const filtered = inquiries.filter((inq) => {
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || inq.agent_id === agentFilter;

    let matchesTab = true;
    if (activeTab === 'ACTIVE') {
      matchesTab = inq.business_status !== 'inactive';
    } else if (activeTab === 'INACTIVE') {
      matchesTab = inq.business_status === 'inactive';
    } else if (activeTab === 'UNASSIGNED') {
      matchesTab = inq.operational_status === 'unassigned' || !inq.agent_id;
    } else if (activeTab === 'OVERDUE') {
      matchesTab = inq.operational_status === 'overdue';
    }

    return matchesSearch && matchesStatus && matchesAgent && matchesTab;
  });

  const agentOptions = [
    { label: "All Agents", value: "ALL" },
    ...agents.map(a => ({ label: a.name || a.fullName, value: a.id }))
  ];

  const columns = [
    {
      header: "Client & Inbound Date",
      render: (row) => {
        const initials = getInitials(row.client_name);
        const avatarBg = getAvatarColor(row.client_name);
        const isOverdue = row.operational_status === 'overdue';
        const isNew = (row.status || '').toUpperCase() === 'NEW';
        const isUnassigned = row.operational_status === 'unassigned' || !row.agent_id;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-1 self-stretch rounded-full shrink-0 ${
                isOverdue
                  ? 'bg-rose-500'
                  : isNew
                  ? 'bg-[#0F766E]'
                  : isUnassigned
                  ? 'bg-amber-400'
                  : 'bg-transparent'
              }`}
            />
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${avatarBg}`}
              >
                {initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  isOverdue
                    ? 'bg-rose-500'
                    : isNew
                    ? 'bg-[#0F766E] animate-pulse'
                    : isUnassigned
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                title={
                  isOverdue
                    ? 'Overdue SLA'
                    : isNew
                    ? 'New Inbound'
                    : isUnassigned
                    ? 'Unassigned'
                    : 'Active'
                }
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-[#1E293B] dark:text-slate-100 font-sans text-xs truncate">
                  {row.client_name}
                </p>
                {isNew && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                    New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-sans truncate">
                {row.client_email || row.client_phone || row.created_at}
              </p>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                Ref: {row.reference_code || row.id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Latest Message",
      render: (row) => (
        <div className="max-w-xs sm:max-w-sm space-y-1">
          <div className="flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 dark:text-slate-200 font-sans line-clamp-2 italic font-normal leading-relaxed">
              {row.last_message ? (
                `“${row.last_message}”`
              ) : (
                <span className="text-slate-400 dark:text-slate-500 not-italic">No message excerpt</span>
              )}
            </p>
          </div>
          {row.ai_summary && (
            <div className="flex items-center gap-1 text-[10px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900 w-fit">
              <Sparkles className="w-2.5 h-2.5 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="truncate max-w-[240px] font-sans font-medium">{row.ai_summary}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Property Interested",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
            <p className="font-semibold text-[#0F766E] dark:text-teal-400 font-sans text-xs truncate max-w-[180px]">
              {row.property_title || 'General Inquiry'}
            </p>
          </div>
          {row.property_price && (
            <p className="text-[11px] font-mono text-[#64748B] dark:text-slate-400 pl-5">
              {row.property_price}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Assigned Consultant",
      render: (row) => {
        const isAssigned = Boolean(row.agent_name);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isAssigned
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isAssigned ? getInitials(row.agent_name) : '!'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans truncate">
                {row.agent_name || <span className="text-amber-700 dark:text-amber-400 font-bold">Unassigned</span>}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block">
                {isAssigned ? 'Consultant' : 'Awaiting routing'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Operational State",
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                row.operational_status === 'overdue'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : row.operational_status === 'unassigned'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {row.operational_status === 'overdue' ? 'Overdue SLA' : row.operational_status || 'normal'}
            </span>
            {row.business_status === 'inactive' && (
              <span className="text-[9px] font-mono uppercase text-slate-400">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#64748B] dark:text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{row.created_at || 'Recent'}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Link
          to={`/broker/inquiries/${row.id}`}
          aria-label={`View inquiry from ${row.client_name}`}
          title="View Inquiry"
          className="w-8 h-8 rounded-lg bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white transition-all inline-flex items-center justify-center shadow-2xs hover:shadow-xs shrink-0"
        >
          <Search className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto font-sans" data-testid="broker-inquiries-portal">
      <Toaster />
      <PageHeader
        title="Inquiries"
        subtitle="Monitor incoming client requests, oversee consultant communication, and enforce response SLAs."
        actions={
          <button
            onClick={loadInquiriesAndMetrics}
            disabled={loading}
            aria-label="Refresh firm inquiries"
            className="h-[42px] px-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {/* Broker SLA Performance & Queue Metrics Bar (BROKER-01, UX-01) with Card Primitives */}
      <div data-testid="broker-sla-metrics-bar" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">Total Inquiries</p>
            <p className="text-2xl font-bold font-display text-[#1E293B] dark:text-slate-100 mt-1">
              {metrics?.totalInquiries ?? totalCount}
            </p>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono">
              {metrics?.activeCount ?? activeCount} active / {metrics?.inactiveCount ?? inactiveCount} inactive
            </span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400 font-sans">New Inbound</p>
            <p className="text-2xl font-bold font-display text-[#0F766E] dark:text-teal-400 mt-1">{newCount}</p>
            <span className="text-[10px] text-[#0F766E] dark:text-teal-400 font-mono">Unassigned: {metrics?.unassignedCount ?? unassignedCount}</span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-sans">Overdue Escalations</p>
            <p className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">
              {metrics?.overdueCount ?? overdueCount}
            </p>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono">Exceeded 30m response SLA</span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">Avg First Response</p>
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? `${Math.round(metrics.averageFirstResponseSeconds / 60)}m` : '7m'}
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
              {metrics?.conversionRatePercent ?? 33}% conversion rate
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center justify-between text-rose-700 dark:text-rose-300 font-sans text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-base">error</span>
            <span>Failed to load firm inquiries: {error}</span>
          </div>
          <button
            onClick={loadInquiriesAndMetrics}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Queue Tabs (Active/Inactive, Unassigned, Overdue) */}
      <div data-testid="broker-queue-tabs" className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: `All Inquiries (${totalCount})` },
          { key: 'ACTIVE', label: `Active Pipeline (${activeCount})` },
          { key: 'INACTIVE', label: `Inactive (${inactiveCount})` },
          { key: 'UNASSIGNED', label: `Unassigned (${unassignedCount})` },
          { key: 'OVERDUE', label: `Overdue SLA (${overdueCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, property, or inquiry snippet..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "New", value: "NEW" },
              { label: "Assigned", value: "ASSIGNED" },
              { label: "Resolved", value: "RESOLVED" },
              { label: "Reopened", value: "REOPENED" },
            ]
          },
          {
            value: agentFilter,
            onChange: setAgentFilter,
            options: agentOptions
          }
        ]}
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your filters"
          description="Try selecting a different tab or clearing keyword filters."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setAgentFilter('ALL'); setActiveTab('ALL'); }}
              className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-lg border border-[#E2E8F0] dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Messaging Application Inbox Toolbar */}
          <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 flex items-center justify-center border border-teal-200/60 dark:border-teal-900">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-[#1E293B] dark:text-slate-100 font-sans text-xs uppercase tracking-wider">
                Inquiry Conversations
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold">
                {filtered.length} {filtered.length === 1 ? 'thread' : 'threads'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-sans text-[#64748B] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue SLA
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></span> Unread / New
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Unassigned
              </span>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/broker/inquiries/${row.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
