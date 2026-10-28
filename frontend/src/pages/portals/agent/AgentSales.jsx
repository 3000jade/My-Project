import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import MetricCard from '../../../components/dashboard/MetricCard';
import { saleService } from '../../../services/saleService';
import { useAuth } from '../../../context/AuthContext';

const STAGE_CONFIG = {
  ALL: { label: 'All Deals', color: 'bg-gray-100 text-gray-700' },
  IN_NEGOTIATION: { label: 'In Negotiation', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  UNDER_CONTRACT: { label: 'Under Contract', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONVEYANCE: { label: 'Conveyance / Closing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Completed Deal', color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

export default function AgentSales() {
  const { user } = useAuth();
  const effectiveAgentId = user?.id || 'agent-1';

  const [sales, setSales] = useState([]);
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    activePipelineCount: 0,
    activePipelineValue: 0,
    closedDealsCount: 0,
    closedSalesVolume: 0,
    estimatedNetCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, metricsData] = await Promise.all([
        saleService.getSales({ agentId: effectiveAgentId, role: 'agent' }),
        saleService.getPipelineMetrics({ agentId: effectiveAgentId, role: 'agent' }),
      ]);
      setSales(Array.isArray(salesData) ? salesData : []);
      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (err) {
      setError(err.message ? `Failed to load sales pipeline: ${err.message}` : 'Failed to load sales pipeline.');
    } finally {
      setLoading(false);
    }
  }, [effectiveAgentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = sales.filter((s) => {
    const propertyTitle = s.property_title || '';
    const clientName = s.client_name || '';
    const propertyLocation = s.property_location || '';
    const matchesSearch =
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyLocation.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesStage =
      stageFilter === 'ALL' || (s.deal_stage || '').toUpperCase() === stageFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesStage;
  });

  const columns = [
    {
      header: 'Property',
      render: (row) => (
        <div>
          <p className="font-bold text-[#1E293B] font-sans">{row.property_title}</p>
          <p className="text-xs text-gray-400 font-sans">{row.property_location}</p>
        </div>
      ),
    },
    {
      header: 'Purchaser',
      accessor: 'client_name',
    },
    {
      header: 'Deal Stage',
      render: (row) => {
        const stage = row.deal_stage || (row.status === 'COMPLETED' ? 'COMPLETED' : 'UNDER_CONTRACT');
        const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.UNDER_CONTRACT;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.color} font-sans uppercase tracking-wider`}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Property Value',
      render: (row) => (
        <span className="font-bold text-[#0F766E] font-sans">
          ₱{(Number(row.property_value) || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Net Commission',
      render: (row) => (
        <div>
          <span className="font-bold text-[#1E293B] font-sans text-xs">
            ₱{(Number(row.agent_net_commission) || 0).toLocaleString()}
          </span>
          <p className="text-[10px] text-gray-400">
            {row.commission_rate}% rate • {row.agent_split_percentage}% split
          </p>
        </div>
      ),
    },
    {
      header: 'Payout Status',
      render: (row) => {
        const isPaid = (row.payout_status || '').toUpperCase() === 'PAID';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-sans ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {row.payout_status || (row.status === 'COMPLETED' ? 'PAID' : 'UNPAID')}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSale(row);
          }}
          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#0F766E] hover:text-white text-[#1E293B] text-xs font-bold font-sans uppercase tracking-wider transition-all cursor-pointer shadow-xs"
        >
          View Dossier
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Deal Pipeline & Commissions"
        subtitle="Track real-time deal stages, legal conveyances, and net commission split earnings."
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Sales & Deal Pipeline' },
        ]}
        actions={
          <button
            onClick={loadData}
            disabled={loading}
            className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#1E293B] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Sync Deals</span>
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

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Closed Sales Volume"
          value={`₱${(metrics.closedSalesVolume || 0).toLocaleString()}`}
          icon="verified"
          subtitle={`${metrics.closedDealsCount || 0} completed conveyances`}
        />
        <MetricCard
          title="Active Pipeline Value"
          value={`₱${(metrics.activePipelineValue || 0).toLocaleString()}`}
          icon="monetization_on"
          subtitle={`${metrics.activePipelineCount || 0} active deals in flight`}
        />
        <MetricCard
          title="Est. Net Commission"
          value={`₱${(metrics.estimatedNetCommission || 0).toLocaleString()}`}
          icon="account_balance_wallet"
          subtitle="Earned & projected net payout"
        />
        <MetricCard
          title="Total Deals Managed"
          value={metrics.totalDeals || sales.length || 0}
          icon="handshake"
          subtitle="Historical & live transactions"
        />
      </div>

      {/* Pipeline Stage Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'ALL', label: 'All Transactions' },
          { id: 'IN_NEGOTIATION', label: '1. In Negotiation' },
          { id: 'UNDER_CONTRACT', label: '2. Under Contract' },
          { id: 'CONVEYANCE', label: '3. Conveyance / Closing' },
          { id: 'COMPLETED', label: '4. Completed & Paid' },
        ].map((tab) => {
          const isActive = stageFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by property, location, or purchaser..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ],
          },
        ]}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3 bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#0F766E]">
            progress_activity
          </span>
          <p className="text-sm font-sans font-medium">Synchronizing live sales pipeline...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setSelectedSale(row)}
        />
      )}

      {/* Deal Conveyance Dossier Modal */}
      <DashboardModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Deal Conveyance & Commission Dossier"
        subtitle={`Transaction Ref: ${selectedSale?.id}`}
        actions={
          <button
            onClick={() => setSelectedSale(null)}
            className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
          >
            Close Dossier
          </button>
        }
      >
        {selectedSale && (
          <div className="space-y-6 font-sans">
            {/* Header Stage Pill */}
            <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Property Valuation</p>
                <p className="text-2xl font-display font-bold text-[#0F766E]">
                  ₱{(Number(selectedSale.property_value) || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Pipeline Stage
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F766E] text-white">
                  {selectedSale.deal_stage}
                </span>
              </div>
            </div>

            {/* Property & Client Info */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Property Item</p>
                <p className="font-bold text-[#1E293B] mt-0.5">{selectedSale.property_title}</p>
                <p className="text-xs text-gray-500">{selectedSale.property_location}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Client / Buyer</p>
                <p className="font-bold text-[#1E293B] mt-0.5">{selectedSale.client_name}</p>
                <p className="text-xs text-gray-500">Closing Target: {selectedSale.sale_date}</p>
              </div>
            </div>

            {/* Transparent Commission Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#0F766E]">
                    calculate
                  </span>
                  Commission Breakdown & Split
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Status: <strong>{selectedSale.payout_status}</strong>
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Valuation:</span>
                  <span className="font-medium text-gray-800">
                    ₱{(Number(selectedSale.property_value) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Brokerage Commission Rate:</span>
                  <span className="font-medium text-gray-800">{selectedSale.commission_rate}%</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Gross Commission:</span>
                  <span className="font-medium text-gray-800">
                    ₱{(Number(selectedSale.gross_commission) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Agent Split Allocation:</span>
                  <span className="font-medium text-gray-800">{selectedSale.agent_split_percentage}%</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0F766E] pt-2 border-t border-dashed border-gray-200">
                  <span>Estimated Agent Net Payout:</span>
                  <span>₱{(Number(selectedSale.agent_net_commission) || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div className="pt-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                Conveyance & Audit Notes
              </p>
              <p className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                {selectedSale.notes || 'No legal conveyance notes attached.'}
              </p>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
