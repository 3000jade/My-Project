import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerAgents() {
  const navigate = useNavigate();
  const [agents] = useState(mockAgents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = agents.filter(ag => {
    const matchesSearch = ag.name.toLowerCase().includes(search.toLowerCase()) ||
                          ag.email.toLowerCase().includes(search.toLowerCase()) ||
                          ag.prc_license_no.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ag.verification_status === statusFilter;
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
      />

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

      {filtered.length === 0 ? (
        <EmptyState
          icon="badge"
          title="No agents found"
          description="Try broadening your verification status criteria."
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
