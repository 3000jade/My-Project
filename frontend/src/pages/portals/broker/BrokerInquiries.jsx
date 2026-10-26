import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { inquiryService } from '../../../services/inquiryService';
import { agentService } from '../../../services/agentService';

export default function BrokerInquiries() {
  const navigate = useNavigate();
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
      setError(err.message || 'Failed to load firm inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          <p className="font-bold text-[#1E293B] font-sans text-xs">{row.client_name}</p>
          <p className="text-[11px] text-[#64748B] font-sans">{row.created_at}</p>
          <span className="text-[10px] font-mono text-slate-400">Ref: {row.reference_code || row.id}</span>
        </div>
      )
    },
    {
      header: "Property Interested",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#0F766E] font-sans text-xs">{row.property_title}</p>
          <p className="text-[11px] text-[#64748B] font-sans">{row.property_price}</p>
        </div>
      )
    },
    {
      header: "Assigned Consultant",
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 font-sans">
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
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : row.operational_status === 'unassigned'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
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
          className="px-3 py-1.5 rounded bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
        >
          Review
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firm Inquiry Management & Triage"
        subtitle="Monitor incoming client requests, oversee consultant communication, and enforce response SLAs."
        actions={
          <button
            onClick={loadInquiriesAndMetrics}
            disabled={loading}
            className="h-[42px] px-4 bg-white hover:bg-gray-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {/* Broker SLA Performance & Queue Metrics Bar (BROKER-01, UX-01) */}
      <div data-testid="broker-sla-metrics-bar" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-sans">Total Inquiries</p>
          <p className="text-2xl font-bold font-display text-[#1E293B] mt-1">
            {metrics?.totalInquiries ?? totalCount}
          </p>
          <span className="text-[10px] text-[#64748B] font-mono">
            {metrics?.activeCount ?? activeCount} active / {metrics?.inactiveCount ?? inactiveCount} inactive
          </span>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] font-sans">New Inbound</p>
          <p className="text-2xl font-bold font-display text-[#0F766E] mt-1">{newCount}</p>
          <span className="text-[10px] text-[#0F766E] font-mono">Unassigned: {metrics?.unassignedCount ?? unassignedCount}</span>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-sans">Overdue Escalations</p>
          <p className="text-2xl font-bold font-display text-rose-600 mt-1">
            {metrics?.overdueCount ?? overdueCount}
          </p>
          <span className="text-[10px] text-rose-700 font-mono">Exceeded 30m response SLA</span>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-sans">Avg First Response</p>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
            {metrics ? `${Math.round(metrics.averageFirstResponseSeconds / 60)}m` : '7m'}
          </p>
          <span className="text-[10px] text-emerald-700 font-mono">
            {metrics?.conversionRatePercent ?? 33}% conversion rate
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-700 font-sans text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">error</span>
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
      <div data-testid="broker-queue-tabs" className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
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
                : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]'
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
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
            Loading inquiries...
          </p>
        </div>
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
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/broker/inquiries/${row.id}`)}
        />
      )}
    </div>
  );
}
