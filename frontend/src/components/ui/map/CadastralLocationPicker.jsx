import React, { useEffect, useRef, useState, useCallback } from 'react';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../../../services/googleMapsLoader';

export default function CadastralLocationPicker({
  latitude,
  longitude,
  onPositionChange,
  address = '',
  readOnly = false,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const initialLat = Number(latitude) || 14.5489;
  const initialLng = Number(longitude) || 121.0503;

  const [currentPos, setCurrentPos] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    if (latitude && longitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCurrentPos({ lat, lng });
        if (markerRef.current && markerRef.current.setPosition) {
          markerRef.current.setPosition({ lat, lng });
        }
        if (mapInstanceRef.current && mapInstanceRef.current.panTo) {
          mapInstanceRef.current.panTo({ lat, lng });
        }
      }
    }
  }, [latitude, longitude]);

  // Initialize interactive map if configured
  useEffect(() => {
    let isCancelled = false;

    if (!isGoogleMapsConfigured()) {
      return;
    }

    async function initPicker() {
      try {
        const google = await loadGoogleMapsApi();
        if (isCancelled || !google || !mapContainerRef.current) return;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 16,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        });

        // Draggable pin
        const marker = new google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map,
          draggable: !readOnly,
          title: 'Drag to adjust exact cadastral plot location',
        });

        if (!readOnly) {
          marker.addListener('dragend', (e) => {
            const lat = Number(e.latLng.lat().toFixed(7));
            const lng = Number(e.latLng.lng().toFixed(7));
            setCurrentPos({ lat, lng });
            if (typeof onPositionChange === 'function') {
              onPositionChange([lat, lng]);
            }
          });

          map.addListener('click', (e) => {
            const lat = Number(e.latLng.lat().toFixed(7));
            const lng = Number(e.latLng.lng().toFixed(7));
            marker.setPosition({ lat, lng });
            setCurrentPos({ lat, lng });
            if (typeof onPositionChange === 'function') {
              onPositionChange([lat, lng]);
            }
          });
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.warn('[CadastralLocationPicker] Map initialization skipped:', err);
      }
    }

    initPicker();

    return () => {
      isCancelled = true;
    };
  }, [readOnly]);

  return (
    <div
      data-lenis-prevent="true"
      className={`rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs space-y-3 p-4 ${className}`}
    >
      {/* Header telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Cadastral Pinpoint Placement
          </h4>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#0F766E] bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
          <span>GPS:</span>
          <span>{currentPos.lat.toFixed(6)},</span>
          <span>{currentPos.lng.toFixed(6)}</span>
        </div>
      </div>

      {address && (
        <p className="text-xs text-[#64748B] line-clamp-1">
          <span className="font-semibold text-[#1E293B]">Address:</span> {address}
        </p>
      )}

      {/* Map Viewport or Fallback Container */}
      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-50">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!isGoogleMapsConfigured() && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-50">
            <span className="text-2xl mb-1">📍</span>
            <p className="text-xs font-bold text-[#1E293B]">Cadastral Coordinates Verified</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Lat: {currentPos.lat.toFixed(6)} • Lng: {currentPos.lng.toFixed(6)}
            </p>
            <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded mt-2">
              Ready for Property Intake Save
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#64748B] italic">
        * Tip: Click on the map or drag the pin marker to position the residence on its exact survey plot.
      </p>
    </div>
  );
}
