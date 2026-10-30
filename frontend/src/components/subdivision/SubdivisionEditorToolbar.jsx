import React from 'react';
import {
  MousePointer,
  Hand,
  Pentagon,
  Square,
  Scissors,
  Sparkles,
  ScanText,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Sliders,
} from 'lucide-react';

export default function SubdivisionEditorToolbar({
  activeTool = 'select',
  onSelectTool,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDuplicateLot,
  onDeleteLot,
  hasSelectedLot = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  planOpacity = 0.85,
  onChangeOpacity,
  showPlanImage = true,
  onTogglePlanImage,
  showBoundaries = true,
  onToggleBoundaries,
  showLabels = true,
  onToggleLabels,
  backgroundMode = 'white',
  onToggleBackgroundMode,
  className = '',
}) {
  return (
    <div
      data-testid="subdivision-editor-toolbar"
      className={`flex flex-wrap items-center justify-between gap-2 p-2 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-md ${className}`}
    >
      {/* 1. Primary Vector & AI Toolset */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          title="Pointer / Select Tool (V)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'select'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          <span className="hidden sm:inline">Select</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('pan')}
          title="Pan Canvas Tool (H / Spacebar)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'pan'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
          }`}
        >
          <Hand className="w-4 h-4" />
          <span className="hidden sm:inline">Pan</span>
        </button>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        <button
          type="button"
          onClick={() => onSelectTool('polygon')}
          title="Draw Polygonal Lot Boundary (P)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'polygon'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
          }`}
        >
          <Pentagon className="w-4 h-4" />
          <span className="hidden sm:inline">Polygon</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('rectangle')}
          title="Draw Rectangular Lot Boundary (R)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'rectangle'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
          }`}
        >
          <Square className="w-4 h-4" />
          <span className="hidden sm:inline">Rectangle</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('slice')}
          title="Slice / Split Parcel Tool (S) - Click and drag a line across a lot to slice into two"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'slice'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span className="hidden sm:inline">Slice</span>
        </button>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        {/* AI Smart Tools */}
        <button
          type="button"
          onClick={() => onSelectTool('ai_boundary')}
          title="AI Boundary Detection (Click or Box lot to auto-trace)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'ai_boundary'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Boundary</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('ai_ocr')}
          title="AI OCR Recognition (Box lot to scan Block and Lot numbers)"
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTool === 'ai_ocr'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100'
          }`}
        >
          <ScanText className="w-4 h-4 text-amber-500" />
          <span>AI OCR</span>
        </button>
      </div>

      {/* 2. Boundary Edit Actions & History Stack (FR-007, FR-009) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        <button
          type="button"
          onClick={onDuplicateLot}
          disabled={!hasSelectedLot}
          title="Duplicate Selected Lot (Ctrl+D)"
          className="p-2 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDeleteLot}
          disabled={!hasSelectedLot}
          title="Delete Selected Lot (Del)"
          className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        {/* 3. Layer Visibility Toggles */}
        <button
          type="button"
          onClick={onTogglePlanImage}
          title={showPlanImage ? 'Hide Blueprint Graphic' : 'Show Blueprint Graphic'}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            showPlanImage ? 'text-[#0F766E] bg-teal-50' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          {showPlanImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleBoundaries}
          title={showBoundaries ? 'Hide Lot Vectors' : 'Show Lot Vectors'}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            showBoundaries ? 'text-[#0F766E] bg-teal-50' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* 4. Background Plan Opacity Slider (FR-004) */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={planOpacity}
            onChange={(e) => onChangeOpacity && onChangeOpacity(parseFloat(e.target.value))}
            title={`Blueprint Opacity: ${Math.round(planOpacity * 100)}%`}
            className="w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
          />
          <span className="font-mono text-[10px] text-slate-600 w-7">
            {Math.round(planOpacity * 100)}%
          </span>
        </div>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        {/* Background Mode Toggle: White Canvas vs Satellite */}
        <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onToggleBackgroundMode && onToggleBackgroundMode('white')}
            title="White Drafting Background (Default)"
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              backgroundMode === 'white'
                ? 'bg-white text-[#0F766E] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            White
          </button>
          <button
            type="button"
            onClick={() => onToggleBackgroundMode && onToggleBackgroundMode('satellite')}
            title="Satellite Ground Background"
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              backgroundMode === 'satellite'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
        </div>

        <span className="w-px h-5 bg-[#CBD5E1] mx-1" />

        {/* 5. Viewport Zoom Steppers & Fit to Screen (FR-004) */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 text-[#1E293B] hover:bg-white rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] font-semibold text-[#1E293B] px-1.5 select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-1.5 text-[#1E293B] hover:bg-white rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onFitToScreen}
            title="Fit Canvas to Screen (F)"
            className="p-1.5 text-[#1E293B] hover:bg-white rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
