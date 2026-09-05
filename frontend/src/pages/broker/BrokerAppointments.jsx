import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockAppointments } from '../../mockData/mockAppointments';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerAppointments() {
  const [appointments] = useState(mockAppointments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const filtered = appointments.filter(a => {
    const matchesSearch = a.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          a.property_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
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
      />

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

      {filtered.length === 0 ? (
        <EmptyState
          icon="event"
          title="No appointments match your filters"
          description="Try clearing your agent or status selection."
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
