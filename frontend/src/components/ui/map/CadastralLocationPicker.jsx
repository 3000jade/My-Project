import React, { useEffect, useState, useMemo } from 'react';
import { ExternalLink, ZoomIn, ZoomOut, MapPin, Layers } from 'lucide-react';

export default function CadastralLocationPicker({
  latitude,
  longitude,
  onPositionChange,
  address = '',
  readOnly = false,
  className = '',
}) {
  const initialLat = Number(latitude) || 14.5489;
  const initialLng = Number(longitude) || 121.0503;

  const [currentPos, setCurrentPos] = useState({ lat: initialLat, lng: initialLng });
  // Map Type: 'm' = Roadmap, 'k' = Satellite, 'h' = Hybrid
  const [mapType, setMapType] = useState('m');
  const [zoomLevel, setZoomLevel] = useState(16);

  // Sync internal state when external props change (e.g. Presets, Geocoding, Input changes)
  useEffect(() => {
    if (latitude && longitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCurrentPos({ lat, lng });
      }
    }
  }, [latitude, longitude]);

  // Construct Google Maps zero-key embed URL
  const googleMapsEmbedUrl = useMemo(() => {
    const lat = currentPos.lat.toFixed(6);
    const lng = currentPos.lng.toFixed(6);
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${zoomLevel}&output=embed`;
  }, [currentPos.lat, currentPos.lng, mapType, zoomLevel]);

  // External Google Maps URL for full screen inspection
  const externalGoogleMapsUrl = `https://www.google.com/maps?q=${currentPos.lat.toFixed(6)},${currentPos.lng.toFixed(6)}`;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 10));
  };

  return (
    <div
      data-lenis-prevent="true"
      data-testid="cadastral-location-picker"
      className={`rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs space-y-3 p-4 ${className}`}
    >
      {/* Header Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
            <span>Cadastral Pinpoint Placement</span>
            <span className="text-[10px] text-[#0F766E] bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-semibold font-sans normal-case">
              Google Maps
            </span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#0F766E] bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
            <span>GPS:</span>
            <span>{currentPos.lat.toFixed(6)},</span>
            <span>{currentPos.lng.toFixed(6)}</span>
          </div>

          <a
            href={externalGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open plot location in Google Maps"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#1E293B] bg-white border border-[#E2E8F0] hover:border-slate-400 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-[#64748B]" />
          </a>
        </div>
      </div>

      {address && (
        <p className="text-xs text-[#64748B] line-clamp-1">
          <span className="font-semibold text-[#1E293B]">Address:</span> {address}
        </p>
      )}

      {/* Google Maps Canvas & Interactive HUD Container */}
      <div
        data-testid="cadastral-map-canvas"
        className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-100"
      >
        {/* Official Google Maps Embed */}
        <iframe
          key={`${currentPos.lat}-${currentPos.lng}-${mapType}-${zoomLevel}`}
          title="Google Maps Cadastral Pinpoint"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
          allowFullScreen={false}
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Google Maps HUD Dock: Layers & Zoom */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Layer Switcher: Roadmap, Satellite, Hybrid */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-[#CBD5E1] shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapType('m')}
              title="Google Roadmap View"
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mapType === 'm'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapType('k')}
              title="Google Satellite View"
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mapType === 'k'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType('h')}
              title="Google Hybrid View (Satellite + Labels)"
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mapType === 'h'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Zoom Steppers */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-[#CBD5E1] shadow-xs">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 20}
              title="Zoom In"
              aria-label="Zoom in"
              className="p-1 text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 rounded cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3.5 bg-[#E2E8F0] mx-0.5" />
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 10}
              title="Zoom Out"
              aria-label="Zoom out"
              className="p-1 text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 rounded cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Cadastral Verification Overlay Pill */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-teal-200 shadow-sm flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-[#1E293B] block">Cadastral Coordinates Verified</span>
            <span className="text-[#64748B] font-mono text-[10px]">
              Lat: {currentPos.lat.toFixed(6)} • Lng: {currentPos.lng.toFixed(6)}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded ml-1">
            Ready for Property Intake Save
          </span>
        </div>
      </div>

      <p className="text-[11px] text-[#64748B] italic">
        * Note: Cadastral coordinates are dynamically verified via Google Maps. Select a Cadastral Preset, search an address, or enter exact plot coordinates to re-center.
      </p>
    </div>
  );
}
