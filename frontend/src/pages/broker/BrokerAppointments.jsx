import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { appointmentService } from '../../services/appointmentService';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load firm appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Compute live KPI metrics
  const totalCount = appointments.length;
  const requestedCount = appointments.filter(a => (a.status || '').toUpperCase() === 'REQUESTED').length;
  const confirmedCount = appointments.filter(a => (a.status || '').toUpperCase() === 'CONFIRMED').length;
  const completedCount = appointments.filter(a => (a.status || '').toUpperCase() === 'COMPLETED').length;

  const filtered = appointments.filter(a => {
    const client = a.client_name || '';
    const property = a.property_title || '';
    const notes = a.notes || '';
    const matchesSearch =
      client.toLowerCase().includes(search.toLowerCase()) ||
      property.toLowerCase().includes(search.toLowerCase()) ||
      notes.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (a.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || a.agent_id === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const agentOptions = [
    { label: "All Agents", value: "ALL" },
    ...mockAgents.map(ag => ({ label: ag.name, value: ag.id }))
  ];

  const columns = [
    {
      header: "Client & Contact",
      render: (row) => (
        <div>
          <p className="font-bold text-[#174849] font-sans">{row.client_name}</p>
          <p className="text-xs text-gray-400 font-sans">{row.client_phone}</p>
        </div>
      )
    },
    {
      header: "Property Interested",
      render: (row) => (
        <span className="font-semibold text-[#266F71] font-sans">{row.property_title}</span>
      )
    },
    {
      header: "Assigned Agent",
      render: (row) => (
        <span className="font-medium text-gray-800 font-sans">{row.agent_name}</span>
      )
    },
    {
      header: "Date & Time",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 font-sans">{row.appointment_date}</p>
          <p className="text-xs text-gray-400 font-sans">{row.appointment_time}</p>
        </div>
      )
    },
    {
      header: "Type",
      render: (row) => (
        <span className="text-xs px-2.5 py-1 rounded-md bg-[#F1F0EC] text-[#174849] font-medium font-sans">
          {row.appointment_type}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firm-Wide Appointment Monitoring"
        subtitle="Supervise client ocular inspections, online video presentations, and contract execution schedules."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Appointments" }
        ]}
        actions={
          <button
            onClick={loadAppointments}
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">Total Scheduled</p>
          <p className="text-2xl font-bold font-display text-[#174849] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-sans">Pending Requests</p>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1">{requestedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#266F71] font-sans">Confirmed Visits</p>
          <p className="text-2xl font-bold font-display text-[#266F71] mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-sans">Completed</p>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load firm appointments: {error}</span>
          </div>
          <button
            onClick={loadAppointments}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client or property..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "Requested", value: "REQUESTED" },
              { label: "Confirmed", value: "CONFIRMED" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled", value: "CANCELLED" },
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
            Loading scheduled appointments...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="event"
          title="No appointments match your filters"
          description="Try clearing your agent or status selection."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setAgentFilter('ALL'); }}
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
        />
      )}
    </div>
  );
}
