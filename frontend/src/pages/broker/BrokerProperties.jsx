import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockProperties } from '../../mockData/mockProperties';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerProperties() {
  const navigate = useNavigate();
  const [properties] = useState(mockProperties);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const filtered = properties.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesAgent = agentFilter === 'ALL' || item.agent_id === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const agentOptions = [
    { label: "All Agents", value: "ALL" },
    ...mockAgents.map(a => ({ label: a.name, value: a.id }))
  ];

  const columns = [
    {
      header: "Property",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.mainImage}
            alt={row.title}
            className="w-12 h-12 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <p className="font-bold text-[#174849] font-sans">{row.title}</p>
            <p className="text-xs text-gray-400 font-sans">{row.location}</p>
          </div>
        </div>
      )
    },
    {
      header: "Assigned Agent",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#266F71]">person</span>
          <span className="font-medium text-gray-800 font-sans">{row.agent_name || "Elena Rossi"}</span>
        </div>
      )
    },
    {
      header: "Type",
      accessor: "property_type"
    },
    {
      header: "Valuation",
      render: (row) => (
        <span className="font-bold text-[#266F71] font-sans">{row.price}</span>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Published State",
      render: (row) => (
        <span className={`text-xs font-bold ${row.is_published ? 'text-[#266F71]' : 'text-gray-400'}`}>
          {row.is_published ? '● Published' : '○ Draft'}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Link
          to={`/broker/properties/${row.id}`}
          className="px-3.5 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
        >
          Inspect
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firm Property Inventory Monitoring"
        subtitle="Monitor full agency portfolio, consultant listings distribution, and market publication readiness."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Property Monitoring" }
        ]}
      />

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search property portfolio by title or city..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "Available", value: "AVAILABLE" },
              { label: "Reserved", value: "RESERVED" },
              { label: "Sold", value: "SOLD" },
              { label: "Inactive", value: "INACTIVE" },
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
          icon="apartment"
          title="No properties found"
          description="Try broadening your agent or status filters."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/broker/properties/${row.id}`)}
        />
      )}
    </div>
  );
}
