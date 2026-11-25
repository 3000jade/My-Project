import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '@/services/googleMapsLoader';
import { LUXURY_MAP_STYLES } from '@/components/ui/map/GooglePropertyMap';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Interactive location picker & viewer powered by Google Maps JS API (when configured)
 * with vanilla Leaflet fallback (using Google Maps road tiles — no react-leaflet or OSM).
 */
export default function LocationPinMap({
  position = [14.5995, 120.9842],
  zoom = 13,
  interactive = true,
  showApproximateCircle = false,
  onChange,
  extraPins = [],
  className = 'h-72 w-full',
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const extraMarkersRef = useRef([]);
  const modeRef = useRef(null);

  const lat = Number(position?.[0]) || 14.5995;
  const lng = Number(position?.[1]) || 120.9842;

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const cleanup = () => {
      extraMarkersRef.current.forEach((m) => m.setMap ? m.setMap(null) : m.remove?.());
      extraMarkersRef.current = [];
      if (circleRef.current) {
        if (circleRef.current.setMap) circleRef.current.setMap(null);
        else circleRef.current.remove?.();
        circleRef.current = null;
      }
      if (markerRef.current) {
        if (markerRef.current.setMap) markerRef.current.setMap(null);
        else markerRef.current.remove?.();
        markerRef.current = null;
      }
      if (mapInstanceRef.current && modeRef.current === 'leaflet') {
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
      modeRef.current = null;
    };

    async function initMap() {
      if (isGoogleMapsConfigured()) {
        try {
          const google = await loadGoogleMapsApi();
          if (cancelled || !google?.maps || !container) return;

          modeRef.current = 'google';
          const map = new google.maps.Map(container, {
            center: { lat, lng },
            zoom,
            styles: LUXURY_MAP_STYLES,
            disableDefaultUI: false,
            streetViewControl: false,
            mapTypeControl: false,
          });
          mapInstanceRef.current = map;

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            draggable: interactive,
            title: 'Property Location',
          });
          markerRef.current = marker;

          if (interactive) {
            map.addListener('click', (e) => {
              const next = [e.latLng.lat(), e.latLng.lng()];
              marker.setPosition({ lat: next[0], lng: next[1] });
              onChange?.(next);
            });
            marker.addListener('dragend', (e) => {
              const next = [e.latLng.lat(), e.latLng.lng()];
              onChange?.(next);
            });
          }

          return;
        } catch {
          // Fall through cleanly to vanilla Leaflet
        }
      }

      if (cancelled || !container) return;

      modeRef.current = 'leaflet';
      const map = L.map(container, {
        center: [lat, lng],
        zoom,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: interactive }).addTo(map);
      markerRef.current = marker;

      if (interactive) {
        map.on('click', (e) => {
          const next = [e.latlng.lat, e.latlng.lng];
          marker.setLatLng(next);
          onChange?.(next);
        });
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange?.([pos.lat, pos.lng]);
        });
      }
    }

    initMap();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [interactive]);

  // Sync center & primary marker position smoothly when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (modeRef.current === 'google') {
      marker.setPosition({ lat, lng });
      map.panTo({ lat, lng });
      if (zoom) map.setZoom(zoom);
    } else if (modeRef.current === 'leaflet') {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], zoom || map.getZoom());
    }
  }, [lat, lng, zoom]);

  // Render optional 250m privacy circle when Neighborhood Only mode is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map) return;

    if (circleRef.current) {
      if (circleRef.current.setMap) circleRef.current.setMap(null);
      else circleRef.current.remove?.();
      circleRef.current = null;
    }

    if (!showApproximateCircle) {
      if (marker) {
        if (marker.setOpacity) marker.setOpacity(1);
      }
      return;
    }

    if (marker && marker.setOpacity) {
      marker.setOpacity(0.55);
    }

    if (modeRef.current === 'google' && window.google?.maps) {
      circleRef.current = new window.google.maps.Circle({
        map,
        center: { lat, lng },
        radius: 250,
        fillColor: '#0F766E',
        fillOpacity: 0.16,
        strokeColor: '#0F766E',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        clickable: false,
      });
    } else if (modeRef.current === 'leaflet') {
      circleRef.current = L.circle([lat, lng], {
        radius: 250,
        color: '#0F766E',
        weight: 2,
        opacity: 0.7,
        fillColor: '#0F766E',
        fillOpacity: 0.16,
        interactive: false,
      }).addTo(map);
    }
  }, [lat, lng, showApproximateCircle]);

  // Render optional secondary pins (Nearby Places)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    extraMarkersRef.current.forEach((m) => (m.setMap ? m.setMap(null) : m.remove?.()));
    extraMarkersRef.current = [];

    const validPins = (extraPins || []).filter(
      (p) => !isNaN(Number(p.lat)) && !isNaN(Number(p.lng))
    );

    if (modeRef.current === 'google' && window.google?.maps) {
      validPins.forEach((pin) => {
        const gm = new window.google.maps.Marker({
          position: { lat: Number(pin.lat), lng: Number(pin.lng) },
          map,
          title: pin.label || pin.category,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#0F766E',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });
        extraMarkersRef.current.push(gm);
      });
    } else if (modeRef.current === 'leaflet') {
      validPins.forEach((pin) => {
        const cm = L.circleMarker([Number(pin.lat), Number(pin.lng)], {
          radius: 7,
          fillColor: '#0F766E',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95,
        })
          .bindTooltip(pin.label || pin.category, { direction: 'top' })
          .addTo(map);
        extraMarkersRef.current.push(cm);
      });
    }
  }, [extraPins, lat, lng]);

  return (
    <div
      ref={containerRef}
      data-testid="location-pin-map"
      className={`${className}${interactive ? ' touch-none' : ''}`}
      style={{ isolation: 'isolate', zIndex: 0 }}
    />
  );
}
