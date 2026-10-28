import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { inquiryService } from '../../../services/inquiryService';
import { useAuth } from '../../../context/AuthContext';

export default function AgentInquiries() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveAgentId = user?.id || 'agent-1';

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inquiryService.getInquiries({ agentId: effectiveAgentId });
      const list = Array.isArray(data) ? data : [];
      setInquiries(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve inquiries.');
    } finally {
      setLoading(false);
    }
  }, [effectiveAgentId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const filtered = inquiries.filter(inq => {
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Client",
      render: (row) => (
        <div>
          <p className="font-bold text-[#1E293B] font-sans">{row.client_name}</p>
          <p className="text-xs text-[#64748B] font-sans">{row.client_email}</p>
        </div>
      )
    },
    {
      header: "Property Interested",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#0F766E] font-sans">{row.property_title}</p>
          <p className="text-xs text-[#64748B] font-sans">{row.property_price}</p>
        </div>
      )
    },
    {
      header: "Last Message",
      render: (row) => (
        <p className="text-xs text-[#64748B] line-clamp-2 max-w-xs font-sans">
          "{row.last_message}"
        </p>
      )
    },
    {
      header: "Date Received",
      accessor: "created_at"
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
          to={`/agent/inquiries/${row.id}`}
          className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
        >
          View Thread
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Inquiries"
        subtitle="Review client messages, AI inquiry summaries, and coordinate appointment viewings."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Inquiries" }
        ]}
        actions={
          <button
            onClick={loadInquiries}
            disabled={loading}
            className="h-[46px] px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load inquiries: {error}</span>
          </div>
          <button
            onClick={loadInquiries}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, property, or inquiry keywords..."
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
          }
        ]}
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F766E] border-t-transparent"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
            Loading assigned inquiries...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your criteria"
          description="Try clearing your search or switching to another status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer hover:bg-[#115E59] transition-colors"
            >
              Show All Inquiries
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/agent/inquiries/${row.id}`)}
        />
      )}
    </div>
  );
}
