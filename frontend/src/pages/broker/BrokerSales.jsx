import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { saleService } from '../../services/saleService';
import { agentService } from '../../services/agentService';

export default function BrokerSales() {
  const [sales, setSales] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, agentsData] = await Promise.all([
        saleService.getSales(),
        agentService.getAgents().catch(() => [])
      ]);
      setSales(Array.isArray(salesData) ? salesData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err) {
      setError(err.message ? `Failed to load firm sales registry: ${err.message}` : 'Failed to load firm sales registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = sales.filter(s => {
    const propertyTitle = s.property_title || '';
    const clientName = s.client_name || '';
    const propertyLocation = s.property_location || '';
    const matchesSearch = propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
                          clientName.toLowerCase().includes(search.toLowerCase()) ||
                          propertyLocation.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || s.agent_id === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const totalClosedValuation = filtered
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + (Number(s.property_value) || 0), 0);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      const updated = await saleService.updateSale(id, { status: newStatus });
      setSales(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      if (selectedSale && selectedSale.id === id) {
        setSelectedSale(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.warn('Failed to update sales status:', err.message);
      setSales(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } finally {
      setUpdating(false);
    }
  };

  const agentOptions = [
    { label: "All Consultants", value: "ALL" },
    ...agents.map(a => ({ label: a.name, value: a.id }))
  ];

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
      header: "Buyer / Client",
      accessor: "client_name"
    },
    {
      header: "Handling Consultant",
      accessor: "agent_name"
    },
    {
      header: "Deed Date",
      accessor: "sale_date"
    },
    {
      header: "Recorded Valuation",
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
          Inspect Record
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firm-Wide Sales Audit & Monitoring"
        subtitle="Complete registry of property conveyance agreements, recorded valuations, and deed closing audits."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Sales Audit" }
        ]}
        actions={
          <button
            onClick={loadData}
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
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Total Closed Valuation (Filtered)
          </span>
          <p className="text-3xl font-display font-bold text-[#174849] mt-0.5">
            {`₱${totalClosedValuation.toLocaleString()}`}
          </p>
        </div>
        <div className="text-xs font-sans text-gray-500 max-w-sm">
          <strong>Compliance Notice:</strong> Sales records serve for supervisory real estate operational monitoring. No banking or payment gateway is processed.
        </div>
      </div>

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by property, client, or location..."
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
          },
          {
            value: agentFilter,
            onChange: setAgentFilter,
            options: agentOptions
          }
        ]}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3 bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#266F71]">
            progress_activity
          </span>
          <p className="text-sm font-sans font-medium">Loading conveyance registry...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setSelectedSale(row)}
        />
      )}

      {/* Sale Detail Modal */}
      <DashboardModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Sales Conveyance Record Audit"
        subtitle={`Audit ID: ${selectedSale?.id}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {selectedSale?.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleUpdateStatus(selectedSale.id, 'COMPLETED')}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
                >
                  {updating ? 'Processing...' : 'Mark as Completed / Conveyed'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSale.id, 'CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel Conveyance
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedSale(null)}
              className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
            >
              Close Dossier
            </button>
          </div>
        }
      >
        {selectedSale && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-[#F1F0EC] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Transaction Valuation</p>
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
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Purchasing Client</p>
                <p className="font-semibold text-[#174849] mt-1">{selectedSale.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Execution Date</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.sale_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Assigned Consultant</p>
                <p className="font-medium text-gray-800 mt-1">{selectedSale.agent_name}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Audit Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selectedSale.notes || 'No audit notes attached.'}
              </p>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
