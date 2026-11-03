import React, { useState } from 'react';
import {
  MapPin,
  Trash2,
  Copy,
  Scissors,
  Maximize2,
  Eraser,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Coins,
  CheckCircle2,
  Clock,
  Home,
  Tag
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Active Under Contract', label: 'Under Contract', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Pending', label: 'Pending', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Draft', label: 'Draft', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

const PROPERTY_TYPES = [
  { value: 'residentialLot', label: 'Subdivision Lot' },
  { value: 'houseAndLot', label: 'House & Lot' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
];

export default function LotPropertiesCard({
  lot,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onSlice,
  onOpenResize,
}) {
  const [isExpanded, setIsExpanded] = useState(isSelected);

  const lotKey = lot.id || lot.tempId;

  const handlePriceChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? Number(rawVal) : 0;
    onUpdate(lotKey, { price: num });
  };

  const handleLotNumberChange = (e) => {
    onUpdate(lotKey, { lot_number: e.target.value });
  };

  const handleTypeChange = (e) => {
    onUpdate(lotKey, { property_type: e.target.value });
  };

  const handleStatusChange = (e) => {
    onUpdate(lotKey, { status: e.target.value });
  };

  return (
    <div
      onClick={() => onSelect(lotKey)}
      className={`group relative rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-emerald-50/40 border-[#0F766E] shadow-sm ring-1 ring-[#0F766E]/30'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          {/* Lot Title & Icon */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-[#0F766E]/10 group-hover:text-[#0F766E]'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={lot.lot_number || ''}
              onChange={handleLotNumberChange}
              placeholder="e.g. Lot 101"
              className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0F766E] focus:outline-hidden px-1 py-0.5 rounded transition-all w-28 truncate"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Area Badge */}
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
              {lot.area_sqm ? `${Number(lot.area_sqm).toLocaleString()} m²` : '0 m²'}
            </span>
          </div>

          {/* Actions: Expand/Collapse */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Price & Status Quick Strip */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-semibold text-slate-500">₱</span>
            <input
              type="text"
              value={lot.price ? Number(lot.price).toLocaleString('en-US') : ''}
              onChange={handlePriceChange}
              placeholder="0.00"
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-md px-2 py-1 transition-all"
            />
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={lot.status || 'Active'}
              onChange={handleStatusChange}
              className="text-[11px] font-semibold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden focus:border-[#0F766E] cursor-pointer"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-3 bg-slate-50/60 rounded-b-xl space-y-2.5" onClick={(e) => e.stopPropagation()}>
          {/* Property Type Selector */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Property Type
            </label>
            <select
              value={lot.property_type || 'residentialLot'}
              onChange={handleTypeChange}
              className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-hidden focus:border-[#0F766E] cursor-pointer"
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price per sqm metric */}
          {lot.price > 0 && lot.area_sqm > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Price per m²:</span>
              <span className="font-mono font-semibold text-slate-700">
                ₱{Math.round(lot.price / lot.area_sqm).toLocaleString()}/m²
              </span>
            </div>
          )}

          {/* Action Footer: Common Real Estate Tools */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicate && onDuplicate(lotKey)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#0F766E] font-medium transition-colors cursor-pointer"
                title="Duplicate geometry onto adjacent parcel"
              >
                <Copy className="w-3 h-3" />
                <span>Clone</span>
              </button>

              <button
                type="button"
                onClick={() => onSlice && onSlice(lotKey)}
                className="inline-flex items-center gap-1 text-[11px] text-[#0F766E] hover:text-teal-800 font-medium transition-colors cursor-pointer"
                title="Split parcel in two"
              >
                <Scissors className="w-3 h-3" />
                <span>Split</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenResize && onOpenResize(lot)}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                title="Resize by exact m² or dimensions"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Resize</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDelete && onDelete(lotKey)}
              className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
              title="Erase lot"
            >
              <Eraser className="w-3 h-3" />
              <span>Erase</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
