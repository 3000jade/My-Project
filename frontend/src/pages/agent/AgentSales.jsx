import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockSales } from '../../mockData/mockSales';

export default function AgentSales() {
  const [sales] = useState(mockSales.filter(s => s.agent_id === 'agent-1'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);

  const filtered = sales.filter(s => {
    const matchesSearch = s.property_title.toLowerCase().includes(search.toLowerCase()) ||
                          s.client_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = filtered
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.property_value, 0);

  const columns = [
    {
      header: "Property",
      render: (row) => (
        <div>
          <p className="font-bold text-[#174849] font-sans">{row.property_title}</p>
          <p className="text-xs text-gray-400 font-sans">{row.property_location}</p>
        </div>
      )
    },
    {
      header: "Client",
      accessor: "client_name"
    },
    {
      header: "Sale Date",
      accessor: "sale_date"
    },
    {
      header: "Property Value",
      render: (row) => (
        <span className="font-bold text-[#266F71] font-sans">
          ₱{row.property_value.toLocaleString()}
        </span>
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
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedSale(row); }}
          className="px-3 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors"
        >
          View Record
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Monitoring"
        subtitle="Track closed transactions, verified property valuations, and pending contract milestones."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Sales Monitoring" }
        ]}
      />

      {/* Value Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Total Closed Valuation (Filtered)
          </span>
          <p className="text-3xl font-display font-bold text-[#174849] mt-0.5">
            ₱{totalValue.toLocaleString()}
          </p>
        </div>
        <div className="text-xs font-sans text-gray-500 max-w-sm">
          <strong>Note:</strong> Sales monitoring system records transaction values and legal conveyance dates for real estate operations.
        </div>
      </div>

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by property or client name..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Pending", value: "PENDING" },
              { label: "Cancelled", value: "CANCELLED" },
            ]
          }
        ]}
      />

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => setSelectedSale(row)}
      />

      {/* Sale Detail Modal */}
      <DashboardModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Sales Record Details"
        subtitle={`Transaction ID: ${selectedSale?.id}`}
        actions={
          <button
            onClick={() => setSelectedSale(null)}
            className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
          >
            Close Record
          </button>
        }
      >
        {selectedSale && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-[#F1F0EC] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Property Valuation</p>
                <p className="text-2xl font-display font-bold text-[#266F71]">
                  ₱{selectedSale.property_value.toLocaleString()}
                </p>
              </div>
              <StatusBadge status={selectedSale.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Property</p>
                <p className="font-semibold text-[#174849] mt-1">{selectedSale.property_title}</p>
                <p className="text-xs text-gray-500">{selectedSale.property_location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Client</p>
                <p className="font-semibold text-[#174849] mt-1">{selectedSale.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Execution Date</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.sale_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Handling Agent</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.agent_name}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Operational Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selectedSale.notes}
              </p>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
