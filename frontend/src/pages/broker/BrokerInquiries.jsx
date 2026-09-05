import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockInquiries } from '../../mockData/mockInquiries';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerInquiries() {
  const navigate = useNavigate();
  const [inquiries] = useState(mockInquiries);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const filtered = inquiries.filter(inq => {
    const matchesSearch = inq.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          inq.property_title.toLowerCase().includes(search.toLowerCase()) ||
                          inq.last_message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
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
        subtitle="Monitor incoming client requests, AI assistance notes, and oversee consultant communication."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Inquiries" }
        ]}
      />

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

      {filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your filters"
          description="Try selecting a different agent or clearing keyword filters."
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
