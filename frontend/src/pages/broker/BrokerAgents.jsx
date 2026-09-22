import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { agentService } from '../../services/agentService';

export default function BrokerAgents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agentService.getAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load consultant directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Compute live KPI metrics
  const totalCount = agents.length;
  const verifiedCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'VERIFIED').length;
  const pendingCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'PENDING').length;
  const suspendedCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'SUSPENDED').length;

  const filtered = agents.filter(ag => {
    const name = ag.name || '';
    const email = ag.email || '';
    const license = ag.prc_license_no || '';
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      license.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (ag.verification_status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Consultant",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="font-bold text-[#174849] font-sans">{row.name}</p>
            <p className="text-xs text-gray-400 font-sans">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      render: (row) => (
        <span className="text-xs text-gray-600 font-sans">{row.phone}</span>
      )
    },
    {
      header: "Licensing Status",
      render: (row) => (
        <div>
          <StatusBadge status={row.verification_status} />
          <p className="text-[10px] text-gray-400 mt-1 font-sans">{row.prc_license_no}</p>
        </div>
      )
    },
    {
      header: "Listings",
      render: (row) => (
        <span className="font-semibold text-gray-700 font-sans">{row.assigned_properties_count} Properties</span>
      )
    },
    {
      header: "Active Inquiries",
      render: (row) => (
        <span className="font-semibold text-gray-700 font-sans">{row.active_inquiries_count} Leads</span>
      )
    },
    {
      header: "Closed Sales",
      render: (row) => (
        <span className="font-bold text-[#266F71] font-sans">
          {row.recorded_sales_count} Deals
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Link
          to={`/broker/agents/${row.id}`}
          className="px-3.5 py-1.5 rounded-lg bg-[#266F71] text-white hover:bg-[#174849] text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
        >
          Review Credentials
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Directory & Credential Verification"
        subtitle="Review consultant credentials, PRC licenses, DHSUD accreditations, and assign operational status."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Agents" }
        ]}
        actions={
          <button
            onClick={loadAgents}
            disabled={loading}
            className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">Total Consultants</p>
          <p className="text-2xl font-bold font-display text-[#174849] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-sans">Verified Active</p>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-sans">Pending Review</p>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-sans">Suspended</p>
          <p className="text-2xl font-bold font-display text-rose-600 mt-1">{suspendedCount}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load consultant directory: {error}</span>
          </div>
          <button
            onClick={loadAgents}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agent name, email, or PRC license..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Verification Statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Verified", value: "VERIFIED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Suspended", value: "SUSPENDED" },
            ]
          }
        ]}
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#266F71] border-t-transparent"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
            Loading consultant roster...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="badge"
          title="No consultants match your criteria"
          description="Try clearing your search or switching to another verification status."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/broker/agents/${row.id}`)}
        />
      )}
    </div>
  );
}
