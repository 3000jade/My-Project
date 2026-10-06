import React from 'react';
import { PHILIPPINE_BASEMAPS } from '../../../mockData/mockMapDistricts';

/**
 * MapLayerControl - Bauhaus Floating Glass HUD Dock
 * Allows toggling between Street, Satellite, Architectural Light basemaps
 * and toggling Philippine Prime District polygon overlays.
 */
export default function MapLayerControl({
  activeBasemap = 'osm-standard',
  onBasemapChange,
  showDistricts = false,
  onToggleDistricts,
  className = ''
}) {
  const basemapOptions = [
    { id: 'osm-standard', label: 'Street', icon: 'map' },
    { id: 'esri-satellite', label: 'Satellite', icon: 'satellite_alt' },
    { id: 'carto-light', label: 'Light', icon: 'light_mode' }
  ];

  return (
    <div
      data-lenis-prevent="true"
      className={`inline-flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-gray-200/80 shadow-sm pointer-events-auto select-none ${className}`}
    >
      {/* Basemap Switcher Segment */}
      <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-full">
        {basemapOptions.map((opt) => {
          const isActive = activeBasemap === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onBasemapChange && onBasemapChange(opt.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-[#174849] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#174849] hover:bg-white/60'
              }`}
              title={`Switch to ${PHILIPPINE_BASEMAPS[opt.id]?.label || opt.label}`}
            >
              <span className="material-symbols-outlined text-[13px]">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-gray-200" />

      {/* District Boundaries Overlay Toggle */}
      <button
        type="button"
        onClick={() => onToggleDistricts && onToggleDistricts()}
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
          showDistricts
            ? 'bg-[#E76F51] text-white shadow-xs'
            : 'bg-white text-gray-700 hover:text-[#174849] border border-gray-200/60'
        }`}
        title="Toggle Philippine Prime Business Districts Overlay"
      >
        <span className="material-symbols-outlined text-[13px]">
          {showDistricts ? 'layers' : 'layers_clear'}
        </span>
        <span>Districts</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            showDistricts ? 'bg-white' : 'bg-gray-400'
          }`}
        />
      </button>
    </div>
  );
}
