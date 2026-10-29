import React, { useEffect, useState, useMemo } from 'react';

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
      </div>
    </div>
  );
}
