import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  HelpCircle,
  Building2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import LotPropertiesCard from './LotPropertiesCard';

export default function MultiPropertyLedgerSidebar({
  lots = [],
  selectedLotId = null,
  parentSubdivision = null,
  onSelectLot,
  onUpdateLot,
  onDeleteLot,
  onDuplicateLot,
  onSliceLot,
  onOpenResizeLot,
  onAddManualLot,
  onClearAllLots,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalArea = 0;
    let totalValue = 0;
    lots.forEach((l) => {
      totalArea += Number(l.area_sqm) || 0;
      totalValue += Number(l.price) || 0;
    });
    const hectares = (totalArea / 10000).toFixed(2);
    return {
      count: lots.length,
      totalArea,
      hectares,
      totalValue,
    };
  }, [lots]);

  // Filtered Lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const matchesSearch =
        !searchQuery ||
        (lot.lot_number && lot.lot_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lot.title && lot.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (lot.status && lot.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [lots, searchQuery, statusFilter]);

  if (isCollapsed) {
    return (
      <div className="h-full bg-white border-r border-slate-200 flex flex-col items-center py-4 px-2 z-10 w-12 shadow-sm">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Open Side Ledger"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-6 flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 rotate-90 whitespace-nowrap mt-4">
            LEDGER ({lots.length})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-96 max-w-sm bg-slate-50/70 border-r border-slate-200 flex flex-col z-10 shadow-lg ${className}`}
    >
      {/* Sidebar Top Header */}
      <div className="p-4 bg-white border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Lot Ledger</h2>
              <p className="text-[11px] text-slate-500">
                {lots.length} {lots.length === 1 ? 'property' : 'properties'} mapped
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Parent Subdivision Context Badge */}
        {parentSubdivision && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Building2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-teal-950 truncate block">
                  {parentSubdivision.name}
                </span>
                <span className="text-[10px] text-teal-700 block truncate">
                  {parentSubdivision.city || parentSubdivision.province_state || 'Master Subdivision'}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#0F766E] text-white">
              Parent
            </span>
          </div>
        )}

        {/* Aggregate KPI Strip */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Land Area
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-bold font-mono text-slate-800">
                {metrics.totalArea.toLocaleString()} m²
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({metrics.hectares} ha)</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Inventory Value
            </span>
            <span className="text-xs font-bold font-mono text-[#0F766E] mt-0.5 block truncate">
              ₱{metrics.totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lot #..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-hidden focus:border-[#0F766E] cursor-pointer"
          >
            <option value="ALL">All</option>
            <option value="Active">Available</option>
            <option value="Active Under Contract">Contract</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Scrollable Lot Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {lots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">No properties mapped yet</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
              Use the <strong>Polygon</strong> or <strong>Rectangle</strong> tool on the map to trace your first lot.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[10px] text-left space-y-1">
              <p className="font-semibold">💡 Rapid Mapping Tips:</p>
              <p>• Adjacent vertices snap together automatically (20px).</p>
              <p>• Rapid Draw is ON: finish one lot and immediately click to draw the next.</p>
              <p>• Use Cut to slice master land parcels into sub-lots.</p>
            </div>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No lots match "{searchQuery}"
          </div>
        ) : (
          filteredLots.map((lot) => {
            const lotKey = lot.id || lot.tempId;
            return (
              <LotPropertiesCard
                key={lotKey}
                lot={lot}
                isSelected={lotKey === selectedLotId}
                onSelect={onSelectLot}
                onUpdate={onUpdateLot}
                onDelete={onDeleteLot}
                onDuplicate={onDuplicateLot}
                onSlice={onSliceLot}
                onOpenResize={onOpenResizeLot}
              />
            );
          })
        )}
      </div>

      {/* Footer Batch Operations */}
      {lots.length > 0 && (
        <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClearAllLots}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          <span className="text-[11px] font-medium text-slate-400">
            {lots.length} total lots
          </span>
        </div>
      )}
    </div>
  );
}
