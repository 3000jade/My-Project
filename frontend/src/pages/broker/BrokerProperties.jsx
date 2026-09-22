import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import CreateListingModal from '../../components/dashboard/CreateListingModal';
import { mockProperties } from '../../mockData/mockProperties';
import { mockAgents } from '../../mockData/mockAgents';
import propertyService, { normalizeProperty } from '../../services/propertyService';

export default function BrokerProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(null);

  const handleCreateListing = async (newPropertyData) => {
    try {
      const created = await propertyService.createProperty(newPropertyData);
      const normalized = normalizeProperty(created || newPropertyData);
      setProperties((prev) => [normalized, ...prev]);
      setCreationSuccess(`Listing "${normalized.title}" successfully added to agency inventory.`);
      setTimeout(() => setCreationSuccess(null), 6000);
    } catch (err) {
      console.warn('[BrokerProperties] createProperty backend error, applying offline fallback:', err);
      const fallbackNormalized = normalizeProperty(newPropertyData);
      setProperties((prev) => [fallbackNormalized, ...prev]);
      setCreationSuccess(`Listing "${fallbackNormalized.title}" added to local inventory.`);
      setTimeout(() => setCreationSuccess(null), 6000);
    }
  };

  const fetchProperties = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await propertyService.getProperties();
      if (response?.data && response.data.length > 0) {
        setProperties(response.data);
      } else {
        // Fall back gracefully to luxury fixtures if DB is freshly created with 0 rows
        setProperties(mockProperties.map(normalizeProperty));
      }
    } catch (err) {
      console.warn('[BrokerProperties] Remote API unreachable, engaging offline fixtures:', err);
      setError('Live database API unreachable. Displaying cached inventory fixtures.');
      setProperties(mockProperties.map(normalizeProperty));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Executive KPI summary calculations
  const portfolioStats = useMemo(() => {
    const totalCount = properties.length;
    let totalValuation = 0;
    let availableCount = 0;
    let reservedCount = 0;
    let soldCount = 0;

    properties.forEach((p) => {
      totalValuation += p.price_raw || 0;
      const st = String(p.status).toUpperCase();
      if (st === 'AVAILABLE') availableCount++;
      else if (st === 'RESERVED' || st === 'PENDING') reservedCount++;
      else if (st === 'SOLD') soldCount++;
    });

    const formattedValuation = totalValuation >= 1_000_000_000
      ? `₱${(totalValuation / 1_000_000_000).toFixed(2)}B`
      : totalValuation >= 1_000_000
        ? `₱${(totalValuation / 1_000_000).toFixed(1)}M`
        : totalValuation > 0
          ? `₱${totalValuation.toLocaleString()}`
          : '₱0';

    return {
      totalCount,
      totalValuation: formattedValuation,
      availableCount,
      reservedCount,
      soldCount,
    };
  }, [properties]);

  // Combined filtering
  const filtered = useMemo(() => {
    return properties.filter((item) => {
      const q = search.toLowerCase().trim();
      const loc = typeof item.location === 'string' ? item.location.toLowerCase() : '';
      const agent = typeof item.agent_name === 'string' ? item.agent_name.toLowerCase() : '';
      const pType = typeof item.property_type === 'string' ? item.property_type.toLowerCase() : '';

      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        loc.includes(q) ||
        agent.includes(q) ||
        pType.includes(q);

      const normalizedStatus = String(item.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;

      const currentAgentId = item.agent_id || item.createdBy || item.agentId;
      const matchesAgent = agentFilter === 'ALL' || currentAgentId === agentFilter;

      return matchesSearch && matchesStatus && matchesAgent;
    });
  }, [properties, search, statusFilter, agentFilter]);

  // Dynamic agent options
  const agentOptions = useMemo(() => {
    const agentMap = new Map();
    mockAgents.forEach((a) => agentMap.set(a.id, a.name));
    properties.forEach((p) => {
      if (p.agent_id && p.agent_name) {
        agentMap.set(p.agent_id, p.agent_name);
      }
    });

    return [
      { label: 'All Agents', value: 'ALL' },
      ...Array.from(agentMap.entries()).map(([value, label]) => ({ label, value })),
    ];
  }, [properties]);

  // Quick inline status update
  const handleQuickStatusUpdate = async (row, e) => {
    e.stopPropagation();
    const current = String(row.status).toUpperCase();
    const nextStatus = current === 'AVAILABLE' ? 'RESERVED' : current === 'RESERVED' ? 'AVAILABLE' : 'AVAILABLE';
    setUpdatingId(row.id);

    try {
      await propertyService.updateProperty(row.id, { status: nextStatus.toLowerCase() });
      setProperties((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      console.error('[BrokerProperties] Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      header: 'Property',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.mainImage}
            alt={row.title}
            className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-100 shrink-0"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
            }}
          />
          <div className="min-w-0">
            <p className="font-bold text-[#174849] font-sans truncate">{row.title}</p>
            <p className="text-xs text-gray-400 font-sans truncate">
              {typeof row.location === 'string' ? row.location : 'Metro Manila'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Agent',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#266F71]">person</span>
          <span className="font-medium text-gray-800 font-sans">{row.agent_name || 'Elena Rossi'}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'property_type',
    },
    {
      header: 'Valuation',
      render: (row) => (
        <span className="font-bold text-[#266F71] font-sans">{row.price}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Published State',
      render: (row) => (
        <span
          className={`text-xs font-bold ${
            row.is_published ? 'text-[#266F71]' : 'text-gray-400'
          }`}
        >
          {row.is_published ? '● Published' : '○ Draft'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={updatingId === row.id}
            onClick={(e) => handleQuickStatusUpdate(row, e)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-[#266F71] hover:text-[#266F71] text-[10px] font-bold font-sans uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            title="Toggle status between Available and Reserved"
          >
            {updatingId === row.id ? 'Updating...' : row.status === 'AVAILABLE' ? 'Mark Reserved' : 'Mark Available'}
          </button>
          <Link
            to={`/broker/properties/${row.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
          >
            Inspect
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firm Property Inventory Monitoring"
        subtitle="Supervise full agency portfolio, consultant listings distribution, and real-time database valuation metrics."
        breadcrumbs={[
          { label: 'Dashboard', to: '/broker/dashboard' },
          { label: 'Property Monitoring' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchProperties(true)}
              disabled={isRefreshing || loading}
              className="h-[46px] px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Inventory'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-[46px] px-5 rounded-xl bg-[#266F71] hover:bg-[#1f5a5c] text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Listing</span>
            </button>
          </div>
        }
      />

      {/* Executive KPI Portfolio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Total Inventory
          </p>
          <p className="text-2xl font-bold font-display text-[#174849]">
            {portfolioStats.totalCount}
            <span className="text-xs font-sans font-normal text-gray-500 ml-1.5">estates</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Portfolio Valuation
          </p>
          <p className="text-2xl font-bold font-display text-[#266F71]">
            {portfolioStats.totalValuation}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Market Ready
          </p>
          <p className="text-2xl font-bold font-display text-emerald-700">
            {portfolioStats.availableCount}
            <span className="text-xs font-sans font-normal text-gray-500 ml-1.5">available</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
            Under Contract
          </p>
          <p className="text-2xl font-bold font-display text-[#D96B37]">
            {portfolioStats.reservedCount}
            <span className="text-xs font-sans font-normal text-gray-500 ml-1.5">pending</span>
          </p>
        </div>
      </div>

      {/* Connection Notice / Graceful Fallback Banner */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchProperties()}
            className="font-bold underline uppercase tracking-wider hover:text-amber-900 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Creation Success Banner */}
      {creationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span className="font-medium">{creationSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setCreationSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search inventory by title, address, agent, or property type..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Available', value: 'AVAILABLE' },
              { label: 'Reserved', value: 'RESERVED' },
              { label: 'Sold', value: 'SOLD' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
          },
          {
            value: agentFilter,
            onChange: setAgentFilter,
            options: agentOptions,
          },
        ]}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-3 border-[#266F71] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-sans font-bold text-gray-500">
            Querying Firm Architectural Database...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="apartment"
          title="No properties found"
          description="No estate records match your active query. Try resetting your search term or filtering criteria."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/broker/properties/${row.id}`)}
        />
      )}

      {/* Create New Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateListing}
        agents={mockAgents}
      />
    </div>
  );
}
