import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { Card, CardContent, useToast, Toaster } from '../../../components/ui';
import { inquiryService } from '../../../services/inquiryService';
import { agentService } from '../../../services/agentService';

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
      render: (row) => (
        <div>
          <p className="font-bold text-[#1E293B] dark:text-slate-100 font-sans text-xs">{row.client_name}</p>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-sans">{row.created_at}</p>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Ref: {row.reference_code || row.id}</span>
        </div>
      )
    },
    {
      header: "Property Interested",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#0F766E] dark:text-teal-400 font-sans text-xs">{row.property_title}</p>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-sans">{row.property_price}</p>
        </div>
      )
    },
    {
      header: "Assigned Consultant",
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">
          {row.agent_name || "Unassigned"}
        </span>
      )
    },
    {
      header: "Operational State",
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              row.operational_status === 'overdue'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : row.operational_status === 'unassigned'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {row.operational_status || 'normal'}
          </span>
          {row.business_status === 'inactive' && (
            <span className="text-[9px] font-mono uppercase text-slate-400">Inactive</span>
          )}
        </div>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Link
          to={`/broker/inquiries/${row.id}`}
          aria-label={`Review inquiry from ${row.client_name}`}
          className="px-3 py-1.5 rounded bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
        >
          Review
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto font-sans" data-testid="broker-inquiries-portal">
      <Toaster />
      <PageHeader
        title="Firm Inquiry Management & Triage"
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
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
            Loading inquiries...
          </p>
        </Card>
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
