import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  X,
  Check,
  Ruler,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function LotResizeModal({
  isOpen,
  onClose,
  lot,
  onApplyResize,
}) {
  if (!isOpen || !lot) return null;

  const currentArea = Number(lot.area_sqm) || 0;
  const isFourSided = (() => {
    const rawCoords = lot.boundary?.geometry?.coordinates || lot.boundary?.coordinates;
    if (!rawCoords) return false;
    const ring = Array.isArray(rawCoords[0]) && Array.isArray(rawCoords[0][0]) ? rawCoords[0] : rawCoords;
    // Ring has 5 coordinates (4 vertices + closing point)
    return ring.length === 5;
  })();

  const [activeTab, setActiveTab] = useState('area'); // 'area' | 'dimensions'
  const [targetArea, setTargetArea] = useState(currentArea || 150);
  const [unit, setUnit] = useState('sqm'); // 'sqm' | 'ha'
  const [frontage, setFrontage] = useState(10);
  const [depth, setDepth] = useState(Math.round(currentArea > 0 ? currentArea / 10 : 15));

  useEffect(() => {
    if (lot) {
      setTargetArea(currentArea);
      setFrontage(10);
      setDepth(Math.round(currentArea > 0 ? currentArea / 10 : 15));
    }
  }, [lot, currentArea]);

  // Compute calculated target in sqm
  const calculatedSqm = activeTab === 'area'
    ? (unit === 'ha' ? Number(targetArea) * 10000 : Number(targetArea))
    : Number(frontage) * Number(depth);

  const diffSqm = calculatedSqm - currentArea;
  const percentChange = currentArea > 0 ? ((diffSqm / currentArea) * 100).toFixed(1) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (calculatedSqm <= 0) return;

    if (activeTab === 'area') {
      onApplyResize(lot.id || lot.tempId, {
        mode: 'area',
        targetAreaSqm: calculatedSqm,
      });
    } else {
      onApplyResize(lot.id || lot.tempId, {
        mode: 'dimensions',
        frontageMeters: Number(frontage),
        depthMeters: Number(depth),
        targetAreaSqm: calculatedSqm,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Resize {lot.lot_number || 'Parcel'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Current Size: <strong className="text-slate-800 font-mono">{currentArea.toLocaleString()} m²</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 m-3 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('area')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'area'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            By Target Area (m² / ha)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dimensions')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dimensions'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            By Dimensions (Meters)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 pt-1 space-y-4">
          {activeTab === 'area' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desired Target Area
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
                    placeholder="e.g. 200"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#0F766E] cursor-pointer"
                  >
                    <option value="sqm">Square Meters (m²)</option>
                    <option value="ha">Hectares (ha)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Uniformly scales the polygon outward/inward from its center while preserving all survey boundary angles and road alignment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frontage (Width)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={frontage}
                      onChange={(e) => setFrontage(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      m
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Depth (Length)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      m
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200/60 text-[11px] text-teal-800 leading-relaxed">
                Uses WGS84 geodesic formulas with <code className="font-mono font-bold">cos(latitude)</code> correction to ensure survey-grade ground accuracy on Google Maps.
              </div>
            </div>
          )}

          {/* Preview Delta Badge */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Calculated Size
              </span>
              <span className="text-sm font-bold font-mono text-slate-800">
                {calculatedSqm.toLocaleString()} m²
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`px-2 py-0.5 rounded-md font-mono ${
                diffSqm > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : diffSqm < 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {diffSqm > 0 ? `+${diffSqm.toLocaleString()} m²` : `${diffSqm.toLocaleString()} m²`}
                {currentArea > 0 && ` (${diffSqm >= 0 ? '+' : ''}${percentChange}%)`}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0D625C] text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Resize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
