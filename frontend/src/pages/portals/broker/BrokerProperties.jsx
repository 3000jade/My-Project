import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, TrendingUp, DollarSign, CheckCircle2, 
  Plus, RefreshCw, Edit3, ExternalLink, SlidersHorizontal 
} from 'lucide-react';
import MetricCard from '../../../components/dashboard/MetricCard';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import DataTable from '../../../components/dashboard/DataTable';
import StatusBadge from '../../../components/ui/core/StatusBadge';
import PropertyQuickEditDrawer from '../../../components/cms/PropertyQuickEditDrawer';
import CreateListingModal from '../../../components/dashboard/CreateListingModal';
import { mockProperties } from '../../../mockData/mockProperties';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
import { cn } from '../../../utils/cn';

export default function BrokerProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [quickDrawerProperty, setQuickDrawerProperty] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProperties = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await propertyService.getProperties();
      if (response?.data && response.data.length > 0) {
        setProperties(response.data);
      } else {
        setProperties(mockProperties.map(normalizeProperty));
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to mock properties:', err);
      setError('Live database API unreachable. Switched to firm local fallback records.');
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

    properties.forEach((p) => {
      totalValuation += p.price_raw || p.price || 0;
      const st = String(p.status).toUpperCase();
      if (st === 'AVAILABLE' || st === 'ACTIVE') availableCount++;
      else if (st === 'UNDER CONTRACT' || st === 'RESERVED' || st === 'PENDING') reservedCount++;
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
      reservedCount
    };
  }, [properties]);

  // Count agent submissions needing broker approval
  const needsApprovalCount = useMemo(() => {
    return properties.filter(p => {
      const st = String(p.standard_status || p.standardStatus || '').toUpperCase();
      return st === 'PENDING APPROVAL';
    }).length;
  }, [properties]);

  const tabCounts = useMemo(() => {
    let active = 0;
    let contract = 0;
    let closed = 0;
    properties.forEach(p => {
      const s = String(p.status || '').toUpperCase();
      const std = String(p.standard_status || p.standardStatus || '').toUpperCase();
      if (std === 'ACTIVE' || s === 'AVAILABLE') active++;
      if (std === 'ACTIVE UNDER CONTRACT' || s === 'RESERVED' || s === 'UNDER CONTRACT') contract++;
      if (std === 'CLOSED' || s === 'SOLD') closed++;
    });
    return { active, contract, closed };
  }, [properties]);

  // Filtering
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch = 
        !search ||
        (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
        (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
        (p.listingKey && p.listingKey.toLowerCase().includes(search.toLowerCase())) ||
        (p.id && String(p.id).toLowerCase().includes(search.toLowerCase()));

      const pStatus = String(p.status || '').toUpperCase();
      const pStdStatus = String(p.standard_status || p.standardStatus || '').toUpperCase();
      const sFilter = statusFilter.toUpperCase();

      let matchesTab = true;
      if (activeTab === 'NEEDS_APPROVAL') {
        matchesTab = pStdStatus === 'PENDING APPROVAL';
      } else if (activeTab === 'ACTIVE') {
        matchesTab = pStdStatus === 'ACTIVE' || pStatus === 'AVAILABLE';
      } else if (activeTab === 'CONTRACT') {
        matchesTab = pStdStatus === 'ACTIVE UNDER CONTRACT' || pStatus === 'RESERVED' || pStatus === 'UNDER CONTRACT';
      } else if (activeTab === 'CLOSED') {
        matchesTab = pStdStatus === 'CLOSED' || pStatus === 'SOLD';
      }

      const matchesStatus = 
        sFilter === 'ALL' ||
        pStatus === sFilter ||
        (sFilter === 'RESERVED' && (pStatus === 'UNDER CONTRACT' || pStatus === 'RESERVED' || pStatus === 'PENDING'));

      return matchesSearch && matchesTab && matchesStatus;
    });
  }, [properties, search, statusFilter, activeTab]);

  // Checkbox selection logic
  const handleToggleSelect = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectAll = (keys) => {
    setSelectedKeys(prev => {
      const allSelected = keys.every(k => prev.has(k));
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach(k => next.delete(k));
      } else {
        keys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const handleInlineApprove = async (e, row) => {
    e.stopPropagation();
    const targetId = row.id || row.listingKey;
    setProperties(prev => prev.map(p => {
      if ((p.id || p.listingKey) === targetId) {
        return {
          ...p,
          standard_status: 'Active',
          standardStatus: 'Active',
          status: 'AVAILABLE'
        };
      }
      return p;
    }));
    showToast(`Approved & published "${row.title}"`);
    try {
      await propertyService.updateProperty(targetId, {
        standardStatus: 'Active',
        status: 'AVAILABLE'
      });
    } catch (err) {
      console.warn('API update failed, preserved locally:', err);
    }
  };

  const handleBatchStatusUpdate = async (newStatus, newStandardStatus) => {
    const keysToUpdate = Array.from(selectedKeys);
    setProperties(prev => prev.map(p => {
      const key = p.listingKey || p.id;
      if (selectedKeys.has(key)) {
        return {
          ...p,
          status: newStatus,
          standard_status: newStandardStatus || newStatus,
          standardStatus: newStandardStatus || newStatus,
        };
      }
      return p;
    }));
    showToast(`Updated ${keysToUpdate.length} listings to "${newStatus}"`);
    setSelectedKeys(new Set());

    try {
      await Promise.allSettled(
        keysToUpdate.map(id => propertyService.updateProperty(id, {
          status: newStatus,
          standardStatus: newStandardStatus || newStatus
        }))
      );
    } catch (err) {
      console.warn('Batch update API dispatch partial failure:', err);
    }
  };

  const handleCreateListing = async (newListingData) => {
    try {
      const created = await propertyService.createProperty(newListingData);
      const normalized = normalizeProperty(created || newListingData);
      setProperties(prev => [normalized, ...prev]);
      showToast(`Successfully created listing: ${normalized.title}`);
      return normalized;
    } catch (err) {
      console.error('Failed to create property:', err);
      const fallback = normalizeProperty({
        ...newListingData,
        id: `local-${Date.now()}`,
      });
      setProperties(prev => [fallback, ...prev]);
      showToast(`Listing created locally: ${fallback.title}`);
      return fallback;
    }
  };

  const handleQuickDrawerSave = (updated) => {
    setProperties(prev => prev.map(p => {
      if ((p.listingKey || p.id) === (updated.listingKey || updated.id)) {
        return { ...p, ...updated };
      }
      return p;
    }));
    showToast(`Saved changes to "${updated.title}"`);
  };

  // Columns with clean human labels (Executive 6-Column Ledger)
  const columns = [
    {
      header: "Property",
      className: "min-w-[260px]",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.mainImage || row.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=120&auto=format&fit=crop"}
            alt={row.title}
            className="w-10 h-10 rounded-lg object-cover border border-[#E5EBEB] shrink-0"
          />
          <div className="truncate min-w-0">
            <span className="font-semibold text-[#0F172A] block truncate text-xs">
              {row.title}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[10px] text-slate-400">
                ID: {row.listingKey || `PH-${row.id}`}
              </span>
              {(row.agent_name || row.agent?.full_name || row.agentName) && (
                <span className="inline-flex items-center text-[10px] font-sans text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded truncate max-w-[110px]">
                  {row.agent_name || row.agent?.full_name || row.agentName}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Location",
      className: "min-w-[150px]",
      render: (row) => (
        <div>
          <span className="text-slate-700 truncate block text-xs font-medium">
            {row.location || row.city || "Ayala Alabang, Muntinlupa"}
          </span>
          {(row.subdivision_name || row.subdivisionName || row.neighborhood) && (
            <span className="text-[10px] text-slate-400 block truncate">
              {row.subdivision_name || row.subdivisionName || row.neighborhood}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Specs",
      className: "w-32 text-xs",
      render: (row) => {
        const area = row.livingArea || row.living_area || row.specs?.livingArea || 0;
        const beds = row.bedrooms || row.beds || row.specs?.beds;
        const baths = row.bathrooms || row.baths || row.specs?.baths;
        return (
          <div>
            <span className="font-mono text-slate-800 block text-xs">
              {area ? `${area.toLocaleString()} m²` : (row.property_type || row.type || 'Estate')}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {beds ? `${beds} bds` : ''}{beds && baths ? ' • ' : ''}{baths ? `${baths} ba` : ''}
              {!beds && !baths && (row.property_type || row.type || 'Estate')}
            </span>
          </div>
        );
      }
    },
    {
      header: "Price & Carrying",
      className: "w-36 font-mono text-xs text-right",
      render: (row) => {
        const hoa = row.association_fee || row.associationFee;
        return (
          <div className="text-right">
            <span className="font-bold text-[#0D4446] block">
              ₱{(row.price_raw || row.price || 0).toLocaleString()}
            </span>
            {hoa ? (
              <span className="text-[10px] text-slate-400 block">
                +₱{Number(hoa).toLocaleString()}/mo HOA
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      header: "Status",
      className: "w-32",
      render: (row) => {
        const std = String(row.standard_status || row.standardStatus || '');
        const isPendingApproval = std.toUpperCase() === 'PENDING APPROVAL';
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={row.standardStatus || row.standard_status || row.status} />
            {isPendingApproval && (
              <button
                type="button"
                onClick={(e) => handleInlineApprove(e, row)}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                title="Approve and publish to Active status"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Approve</span>
              </button>
            )}
          </div>
        );
      }
    },
    {
      header: "Actions",
      className: "w-28 text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setQuickDrawerProperty(row)}
            className="p-1 rounded text-slate-400 hover:text-[#0D4446] hover:bg-[#0D4446]/5 transition-colors cursor-pointer"
            title="Quick Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/broker/properties/${row.id || row.listingKey}/edit`}
            className="p-1 rounded text-slate-400 hover:text-[#0D4446] hover:bg-[#0D4446]/5 transition-colors"
            title="Open Studio Workshop"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`/properties/${row.id || row.listingKey}`}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-[#F4F5F4] transition-colors"
            title="View Public Listing"
          >
            <span className="text-[10px] font-mono font-semibold">VIEW</span>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Metric Summary Plinths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inventory"
          value={portfolioStats.totalCount}
          subtitle="estates in portfolio"
          icon={Building2}
          trend="+2 this month"
        />
        <MetricCard
          title="Portfolio Valuation"
          value={portfolioStats.totalValuation}
          subtitle="Aggregate list price"
          icon={DollarSign}
        />
        <MetricCard
          title="Market Ready"
          value={portfolioStats.availableCount}
          subtitle="available for viewing"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Under Contract"
          value={portfolioStats.reservedCount}
          subtitle="pending buyer closing"
          icon={TrendingUp}
        />
      </div>

      {/* Connection Notice / Fallback Banner */}
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

      {/* Search & Filter Header Strip */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-[#0F172A]">Property Inventory</h1>
            <p className="text-xs text-slate-500">Manage real estate listings and client presentation assets.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProperties(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8DFDF] bg-white hover:bg-[#F4F5F4] text-xs font-mono text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E76F51] hover:bg-[#D65C3E] text-white text-xs font-mono font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Listing</span>
            </button>
            <Link
              to="/broker/properties/new/edit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8DFDF] bg-white hover:bg-[#F4F5F4] text-xs font-mono text-slate-700 transition-colors cursor-pointer"
              title="Open Split-Screen Edit Studio"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio</span>
            </Link>
          </div>
        </div>

        {/* Executive Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#D8DFDF] pb-2 overflow-x-auto text-xs font-mono">
          {[
            { id: 'ALL', label: 'All Listings', count: properties.length },
            { id: 'NEEDS_APPROVAL', label: 'Needs Approval', count: needsApprovalCount, badge: true },
            { id: 'ACTIVE', label: 'Active', count: tabCounts.active },
            { id: 'CONTRACT', label: 'Active Under Contract', count: tabCounts.contract },
            { id: 'CLOSED', label: 'Closed', count: tabCounts.closed },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "bg-[#0D4446] text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : tab.badge && tab.count > 0
                    ? "bg-amber-100 text-amber-800 font-bold border border-amber-300"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

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
              ]
            }
          ]}
        />
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-3 border-[#0D4446] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-sans font-bold text-gray-500">
            Querying Firm Architectural Database...
          </p>
        </div>
      ) : (
        /* High-Density Data Grid */
        <DataTable
          columns={columns}
          data={filteredProperties}
          keyField="id"
          pageSize={8}
          selectable={true}
          selectedKeys={selectedKeys}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onRowClick={(row) => setQuickDrawerProperty(row)}
          emptyMessage="No properties found"
        />
      )}

      {/* Floating Batch Action Bar */}
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-4 text-xs border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded-full bg-[#14B8A6] text-[#070D0E] font-bold flex items-center justify-center text-[10px]">
              {selectedKeys.size}
            </span>
            <span className="text-slate-300">selected</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => handleBatchStatusUpdate('AVAILABLE', 'Active')}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              Approve & Activate
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('RESERVED', 'Active Under Contract')}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Set Under Contract
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('SOLD', 'Closed')}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Set Closed
            </button>
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-slate-400 hover:text-white underline cursor-pointer ml-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Quick Edit Drawer */}
      <PropertyQuickEditDrawer
        isOpen={Boolean(quickDrawerProperty)}
        property={quickDrawerProperty}
        onClose={() => setQuickDrawerProperty(null)}
        onSave={handleQuickDrawerSave}
      />

      {/* Create New Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateListing}
      />

    </div>
  );
}
