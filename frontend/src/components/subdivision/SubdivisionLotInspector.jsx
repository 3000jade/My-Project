import React from 'react';
import {
  X,
  Copy,
  Trash2,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Tag,
  DollarSign,
  Maximize2,
  Building,
  Square,
} from 'lucide-react';

export default function SubdivisionLotInspector({
  lot = null,
  onUpdateLot,
  onDuplicateLot,
  onDeleteLot,
  onRecalculateArea,
  onClose,
  className = '',
}) {
  if (!lot) {
    return (
      <div
        data-testid="subdivision-lot-inspector-empty"
        className={`bg-white border-l border-[#E2E8F0] p-6 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#1E293B]">No Lot Selected</h4>
          <p className="text-xs text-[#64748B] max-w-[200px] mt-1">
            Click on any boundary shape on the canvas or draw a new lot to view its specifications.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    if (onUpdateLot) {
      onUpdateLot({
        ...lot,
        [field]: value,
      });
    }
  };

  const handleSquareCorners = () => {
    if (!lot?.coordinates || lot.coordinates.length !== 4) return;
    const coords = lot.coordinates;
    const cx = coords.reduce((sum, p) => sum + p.x, 0) / 4;
    const cy = coords.reduce((sum, p) => sum + p.y, 0) / 4;

    const dx = coords[1].x - coords[0].x;
    const dy = coords[1].y - coords[0].y;
    let angle = Math.atan2(dy, dx);

    const deg = (angle * 180) / Math.PI;
    if (Math.abs(deg) <= 12 || Math.abs(deg - 180) <= 12 || Math.abs(deg + 180) <= 12) {
      angle = deg > 90 || deg < -90 ? Math.PI : 0;
    } else if (Math.abs(deg - 90) <= 12) {
      angle = Math.PI / 2;
    } else if (Math.abs(deg + 90) <= 12) {
      angle = -Math.PI / 2;
    }

    const w1 = Math.hypot(coords[1].x - coords[0].x, coords[1].y - coords[0].y);
    const w2 = Math.hypot(coords[2].x - coords[3].x, coords[2].y - coords[3].y);
    const width = (w1 + w2) / 2;

    const h1 = Math.hypot(coords[3].x - coords[0].x, coords[3].y - coords[0].y);
    const h2 = Math.hypot(coords[2].x - coords[1].x, coords[2].y - coords[1].y);
    const height = (h1 + h2) / 2;

    const halfW = width / 2;
    const halfH = height / 2;

    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const vx = -Math.sin(angle);
    const vy = Math.cos(angle);

    const squaredCoords = [
      { x: Math.round(cx - halfW * ux - halfH * vx), y: Math.round(cy - halfW * uy - halfH * vy) },
      { x: Math.round(cx + halfW * ux - halfH * vx), y: Math.round(cy + halfW * uy - halfH * vy) },
      { x: Math.round(cx + halfW * ux + halfH * vx), y: Math.round(cy + halfW * uy + halfH * vy) },
      { x: Math.round(cx - halfW * ux + halfH * vx), y: Math.round(cy - halfW * uy + halfH * vy) },
    ];

    if (onUpdateLot) {
      onUpdateLot({
        ...lot,
        coordinates: squaredCoords,
      });
    }
  };

  return (
    <div
      data-testid="subdivision-lot-inspector"
      className={`bg-white border-l border-[#E2E8F0] w-80 flex flex-col h-full shadow-lg ${className}`}
    >
      {/* Inspector Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold block">
            Lot Inspector
          </span>
          <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
            <span>
              Block {lot.block_number || '?'}, Lot {lot.lot_number || '?'}
            </span>
            {lot.is_verified ? (
              <span title="Human Verified">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              </span>
            ) : (
              <span title="Unverified AI Proposal">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Verification Status Banner (FR-016) */}
        {!lot.is_verified ? (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Unverified AI Suggestion</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              This lot boundary was generated by AI. It must be confirmed before map publication.
            </p>
            <button
              type="button"
              onClick={() => handleChange('is_verified', true)}
              className="w-full mt-1 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] cursor-pointer transition-colors"
            >
              Confirm & Mark Verified
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-200">
            <span className="text-[11px] font-medium text-teal-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Boundary Verified</span>
            </span>
            <button
              type="button"
              onClick={() => handleChange('is_verified', false)}
              className="text-[10px] text-teal-700 underline hover:text-teal-900 cursor-pointer"
            >
              Mark Unverified
            </button>
          </div>
        )}

        {/* Identifiers: Block & Lot Number (FR-024) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-semibold text-[#1E293B] block mb-1">Block Number *</label>
            <input
              type="text"
              value={lot.block_number || ''}
              onChange={(e) => handleChange('block_number', e.target.value)}
              placeholder="e.g. 1"
              className="w-full h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-[#1E293B] block mb-1">Lot Number *</label>
            <input
              type="text"
              value={lot.lot_number || ''}
              onChange={(e) => handleChange('lot_number', e.target.value)}
              placeholder="e.g. 15"
              className="w-full h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
            />
          </div>
        </div>

        {/* Feature Classification (FR-010) */}
        <div>
          <label className="font-semibold text-[#1E293B] block mb-1">Boundary Classification</label>
          <select
            value={lot.boundary_type || 'SaleableLot'}
            onChange={(e) => handleChange('boundary_type', e.target.value)}
            className="w-full h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
          >
            <option value="SaleableLot">Saleable Residential Lot</option>
            <option value="Road">Road / Circulation Network</option>
            <option value="Park">Open Space / Park</option>
            <option value="Facility">Community Facility / Clubhouse</option>
            <option value="Waterway">Drainage / Waterway</option>
            <option value="Other">Other Non-Saleable Feature</option>
          </select>
        </div>

        {/* Commercial Availability Status (FR-027, FR-028) */}
        {lot.boundary_type === 'SaleableLot' && (
          <div>
            <label className="font-semibold text-[#1E293B] block mb-1.5">Availability Status</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { status: 'Available', label: 'Available', color: 'border-teal-300 bg-teal-50 text-teal-800' },
                { status: 'Reserved', label: 'Reserved', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                { status: 'Sold', label: 'Sold', color: 'border-slate-300 bg-slate-100 text-slate-800' },
                { status: 'Unavailable', label: 'Unavailable', color: 'border-rose-300 bg-rose-50 text-rose-800' },
              ].map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => handleChange('availability_status', opt.status)}
                  className={`py-1 px-2 rounded-md border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                    lot.availability_status === opt.status
                      ? `${opt.color} ring-1 ring-offset-1 ring-slate-400 font-bold`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verified Area with Shoelace Recalculator (FR-024) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-[#1E293B]">Verified Land Area (m²) *</label>
            {onRecalculateArea && (
              <button
                type="button"
                onClick={() => onRecalculateArea(lot)}
                title="Calculate geometric area from polygon boundary"
                className="text-[10px] text-[#0F766E] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <Calculator className="w-3 h-3" />
                <span>Compute Area</span>
              </button>
            )}
          </div>
          <input
            type="number"
            min="1"
            step="0.01"
            value={lot.verified_area_sqm || ''}
            onChange={(e) => handleChange('verified_area_sqm', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 280.5"
            className="w-full h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
          />
        </div>

        {/* Price in PHP (FR-024) */}
        {lot.boundary_type === 'SaleableLot' && (
          <div>
            <label className="font-semibold text-[#1E293B] block mb-1">Price (PHP ₱)</label>
            <input
              type="number"
              min="0"
              step="10000"
              value={lot.price ?? ''}
              onChange={(e) =>
                handleChange('price', e.target.value === '' ? null : parseFloat(e.target.value))
              }
              placeholder="e.g. 28500000"
              className="w-full h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
            />
          </div>
        )}

        {/* Description / Orientation Notes */}
        <div>
          <label className="font-semibold text-[#1E293B] block mb-1">Lot Orientation & Remarks</label>
          <textarea
            rows={2}
            value={lot.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g. Corner lot facing morning sun and green corridor."
            className="w-full p-2 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none resize-none"
          />
        </div>

        {/* Boundary Geometry Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-[#64748B] space-y-1">
          <div className="flex justify-between">
            <span>Vertices Count:</span>
            <span className="font-mono font-semibold text-[#1E293B]">
              {lot.coordinates ? lot.coordinates.length : 0} points
            </span>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Tip: Drag corner handles on the canvas to reshape. Click midpoint '+' to insert a vertex.
          </p>

          {lot.coordinates?.length === 4 && (
            <button
              type="button"
              onClick={handleSquareCorners}
              title="Align all 4 corners to perfect 90° right angles"
              className="w-full mt-2 py-1.5 px-2 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              <Square className="w-3.5 h-3.5 text-teal-600" />
              <span>Square Corners (90° Orthogonal)</span>
            </button>
          )}
        </div>
      </div>

      {/* Inspector Footer Actions */}
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between gap-2">
        {onDuplicateLot && (
          <button
            type="button"
            onClick={() => onDuplicateLot(lot)}
            className="flex-1 py-1.5 px-2 bg-white border border-[#CBD5E1] hover:bg-slate-100 text-[#1E293B] font-semibold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Duplicate</span>
          </button>
        )}

        {onDeleteLot && (
          <button
            type="button"
            onClick={() => onDeleteLot(lot.id)}
            className="py-1.5 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
