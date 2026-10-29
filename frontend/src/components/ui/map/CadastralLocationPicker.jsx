import React, { useEffect, useState, useMemo } from 'react';

export default function CadastralLocationPicker({
  latitude,
  longitude,
  onPositionChange,
  onOpenFullView,
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

  return (
    <div
      data-lenis-prevent="true"
      data-testid="cadastral-location-picker"
      className={`w-full ${className}`}
    >
      {/* Google Maps Clean Canvas */}
      <div
        data-testid="cadastral-map-canvas"
        className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#CBD5E1] bg-slate-100 shadow-2xs"
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

        {/* Full View Button (Opens Dedicated Map Page) */}
        {typeof onOpenFullView === 'function' && (
          <button
            type="button"
            onClick={onOpenFullView}
            data-testid="cadastral-fullview-btn"
            title="Open Full View Map Studio"
            aria-label="Open Full View Map Studio"
            className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-white text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 border border-slate-200/90 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <svg
              className="w-4.5 h-4.5 text-slate-700 hover:text-[#0F766E] transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h6v6" />
              <path d="M9 3H3v6" />
              <path d="M9 21H3v-6" />
              <path d="M15 21h6v-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
