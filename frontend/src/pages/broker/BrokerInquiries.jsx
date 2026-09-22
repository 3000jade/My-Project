import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { inquiryService } from '../../services/inquiryService';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inquiryService.getInquiries();
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load firm inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Compute live KPI stats
  const totalCount = inquiries.length;
  const newCount = inquiries.filter(i => (i.status || '').toUpperCase() === 'NEW').length;
  const activeCount = inquiries.filter(i => {
    const s = (i.status || '').toUpperCase();
    return s === 'ASSIGNED' || s === 'CONTACTED' || s === 'REOPENED';
  }).length;
  const resolvedCount = inquiries.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length;

  const filtered = inquiries.filter(inq => {
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || inq.agent_id === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const agentOptions = [
    { label: "All Agents", value: "ALL" },
    ...mockAgents.map(a => ({ label: a.name, value: a.id }))
  ];

  const columns = [
    {
      header: "Client & Inbound Date",
      render: (row) => (
        <div>
          <p className="font-bold text-[#174849] font-sans">{row.client_name}</p>
          <p className="text-xs text-gray-400 font-sans">{row.created_at}</p>
        </div>
      )
    },
    {
      header: "Property Interested",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#266F71] font-sans">{row.property_title}</p>
          <p className="text-xs text-gray-400 font-sans">{row.property_price}</p>
        </div>
      )
    },
    {
      header: "Assigned Consultant",
      render: (row) => (
        <span className="text-xs font-semibold text-gray-700 font-sans">
          {row.agent_name || "Unassigned"}
        </span>
      )
    },
    {
      header: "Latest Context",
      render: (row) => (
        <p className="text-xs text-gray-600 line-clamp-1 max-w-xs font-sans">
          "{row.last_message}"
        </p>
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
          className="px-3.5 py-1.5 rounded-lg bg-[#266F71] text-white hover:bg-[#174849] text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
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
        subtitle="Monitor incoming client requests, oversee consultant communication, and streamline deal triage."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Inquiries" }
        ]}
        actions={
          <button
            onClick={loadInquiries}
            disabled={loading}
            className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">Total Inquiries</p>
          <p className="text-2xl font-bold font-display text-[#174849] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#266F71] font-sans">New Inbound</p>
          <p className="text-2xl font-bold font-display text-[#266F71] mt-1">{newCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-sans">In Progress</p>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-sans">Resolved Deals</p>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load firm inquiries: {error}</span>
          </div>
          <button
            onClick={loadInquiries}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

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
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#266F71] border-t-transparent"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
            Loading inquiries...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your filters"
          description="Try selecting a different agent or clearing keyword filters."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setAgentFilter('ALL'); }}
              className="px-4 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
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
