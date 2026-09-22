import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { saleService } from '../../services/saleService';

export default function AgentSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await saleService.getSales({ agentId: 'agent-1', role: 'agent' });
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message ? `Failed to load sales records: ${err.message}` : 'Failed to load sales records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filtered = sales.filter(s => {
    const propertyTitle = s.property_title || '';
    const clientName = s.client_name || '';
    const propertyLocation = s.property_location || '';
    const matchesSearch = propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
                          clientName.toLowerCase().includes(search.toLowerCase()) ||
                          propertyLocation.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const totalValue = filtered
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + (Number(s.property_value) || 0), 0);

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
          ₱{(Number(row.property_value) || 0).toLocaleString()}
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
          className="px-3 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
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
        actions={
          <button
            onClick={loadSales}
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

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadSales}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Value Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Total Closed Valuation (Filtered)
          </span>
          <p className="text-3xl font-display font-bold text-[#174849] mt-0.5">
            {`₱${totalValue.toLocaleString()}`}
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

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3 bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#266F71]">
            progress_activity
          </span>
          <p className="text-sm font-sans font-medium">Loading sales records...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setSelectedSale(row)}
        />
      )}

      {/* Record Inspection Modal */}
      <DashboardModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Transaction Record Details"
        subtitle={`Transaction Ref: ${selectedSale?.id}`}
        actions={
          <button
            onClick={() => setSelectedSale(null)}
            className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
          >
            Close
          </button>
        }
      >
        {selectedSale && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-[#F1F0EC] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Transaction Value</p>
                <p className="text-2xl font-display font-bold text-[#266F71]">
                  ₱{(Number(selectedSale.property_value) || 0).toLocaleString()}
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
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Purchaser</p>
                <p className="font-semibold text-[#174849] mt-1">{selectedSale.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Closing Date</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.sale_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Status</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.status}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Audit Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selectedSale.notes || 'No notes attached.'}
              </p>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
