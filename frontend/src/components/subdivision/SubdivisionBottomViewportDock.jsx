import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Grid,
  Map,
  Sliders,
} from 'lucide-react';

/**
 * SubdivisionBottomViewportDock
 * Floating glassmorphic dock pinned at bottom center of the canvas
 * housing viewport zoom, blueprint opacity blend slider, grid toggle, and satellite mode.
 */
export default function SubdivisionBottomViewportDock({
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
  showGrid = true,
  onToggleGrid,
  backgroundMode = 'white',
  onToggleBackgroundMode,
  className = '',
}) {
  return (
    <div
      data-testid="subdivision-bottom-viewport-dock"
      className={`flex items-center gap-3 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl text-xs select-none z-20 ${className}`}
    >
      {/* Zoom Steppers & Fit */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center font-mono font-bold text-[11px] text-slate-800">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (+)"
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onFitToScreen}
          title="Fit Canvas to Screen (F)"
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer ml-0.5"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <span className="w-px h-5 bg-slate-200" />

      {/* Blueprint Opacity Blend Slider */}
      <div className="flex items-center gap-2" title="Blueprint Graphic Opacity">
        <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={planOpacity}
          onChange={(e) => onChangeOpacity && onChangeOpacity(parseFloat(e.target.value))}
          className="w-20 accent-[#0F766E] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
        />
        <span className="font-mono text-[10px] text-slate-500 w-7">
          {Math.round(planOpacity * 100)}%
        </span>
      </div>

      <span className="w-px h-5 bg-slate-200" />

      {/* Blueprint Layer Visibility */}
      <button
        type="button"
        onClick={onTogglePlanImage}
        title={showPlanImage ? 'Hide Blueprint Graphic' : 'Show Blueprint Graphic'}
        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
          showPlanImage
            ? 'bg-teal-50 border-teal-200 text-teal-700'
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
        }`}
      >
        {showPlanImage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* Lot Vectors Visibility */}
      <button
        type="button"
        onClick={onToggleBoundaries}
        title={showBoundaries ? 'Hide Lot Boundaries' : 'Show Lot Boundaries'}
        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
          showBoundaries
            ? 'bg-teal-50 border-teal-200 text-teal-700'
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
      </button>

      {/* Grid Dot Matrix Toggle */}
      {onToggleGrid && (
        <button
          type="button"
          onClick={onToggleGrid}
          title={showGrid ? 'Hide CAD Grid' : 'Show CAD Grid'}
          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
            showGrid
              ? 'bg-teal-50 border-teal-200 text-teal-700'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      )}

      <span className="w-px h-5 bg-slate-200" />

      {/* Canvas Ground Mode: White Board vs Satellite */}
      <div className="flex items-center p-0.5 bg-slate-100/80 rounded-xl border border-slate-200/70 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => onToggleBackgroundMode('white')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            backgroundMode === 'white'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          White
        </button>
        <button
          type="button"
          onClick={() => onToggleBackgroundMode('satellite')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            backgroundMode === 'satellite'
              ? 'bg-white text-teal-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="w-3 h-3 text-teal-600" />
          <span>Satellite</span>
        </button>
      </div>
    </div>
  );
}
