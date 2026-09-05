import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockInquiries } from '../../mockData/mockInquiries';

export default function AgentInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState(mockInquiries.filter(i => i.agent_id === 'agent-1'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = inquiries.filter(inq => {
    const matchesSearch = inq.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          inq.property_title.toLowerCase().includes(search.toLowerCase()) ||
                          inq.last_message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Client",
      render: (row) => (
        <div>
          <p className="font-bold text-[#174849] font-sans">{row.client_name}</p>
          <p className="text-xs text-gray-400 font-sans">{row.client_email}</p>
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
      header: "Last Message",
      render: (row) => (
        <p className="text-xs text-gray-600 line-clamp-2 max-w-xs font-sans">
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
          className="px-3.5 py-1.5 rounded-lg bg-[#266F71] text-white hover:bg-[#174849] text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
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
      />

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

      {filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your criteria"
          description="Try clearing your search or switching to another status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
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
