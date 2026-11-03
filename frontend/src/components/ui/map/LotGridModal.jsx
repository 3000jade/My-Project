import React, { useState } from 'react';
import { LayoutGrid, X, Check, Calculator, Layers } from 'lucide-react';

export default function LotGridModal({
  isOpen,
  onClose,
  onGenerateGrid,
}) {
  if (!isOpen) return null;

  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(5);
  const [widthMeters, setWidthMeters] = useState(10); // Frontage
  const [depthMeters, setDepthMeters] = useState(15); // Depth

  const safeRows = Math.max(1, Math.min(30, Number(rows) || 1));
  const safeCols = Math.max(1, Math.min(30, Number(cols) || 1));
  const safeWidth = Math.max(3, Number(widthMeters) || 10);
  const safeDepth = Math.max(3, Number(depthMeters) || 15);

  const totalLots = safeRows * safeCols;
  const lotArea = safeWidth * safeDepth;
  const totalBlockArea = totalLots * lotArea;
  const blockWidth = safeCols * safeWidth;
  const blockHeight = safeRows * safeDepth;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onGenerateGrid === 'function') {
      onGenerateGrid({
        rows: safeRows,
        cols: safeCols,
        widthMeters: safeWidth,
        depthMeters: safeDepth,
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
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Lot Grid</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Batch generate properties arranged in rows and columns
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Grid Layout Rows & Columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Rows
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Vertical blocks</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Columns
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={cols}
                onChange={(e) => setCols(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Horizontal blocks</span>
            </div>
          </div>

          {/* Individual Lot Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot Frontage (Width)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  step="0.5"
                  value={widthMeters}
                  onChange={(e) => setWidthMeters(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                  m
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot Depth (Length)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  step="0.5"
                  value={depthMeters}
                  onChange={(e) => setDepthMeters(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                  m
                </span>
              </div>
            </div>
          </div>

          {/* Calculated Grid Summary Card */}
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-teal-950">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Generated Grid Output</span>
              </span>
              <span className="font-mono bg-[#0F766E] text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                {totalLots} Lots
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-teal-200/40 text-[11px]">
              <div>
                <span className="text-[10px] text-teal-700 block">Single Lot Area</span>
                <span className="font-bold font-mono text-teal-950">{lotArea.toLocaleString()} m²</span>
              </div>
              <div>
                <span className="text-[10px] text-teal-700 block">Block Footprint</span>
                <span className="font-bold font-mono text-teal-950">{blockWidth}m × {blockHeight}m</span>
              </div>
              <div>
                <span className="text-[10px] text-teal-700 block">Total Area</span>
                <span className="font-bold font-mono text-teal-950">{totalBlockArea.toLocaleString()} m²</span>
              </div>
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
              <span>Generate {totalLots} Lots</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
