import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { getPropertyCoordinates, formatPricePill } from '../../../utils/propertyCoordinates';

export default function PropertyMap({
  properties = [],
  selectedPropertyId = null,
  hoveredPropertyId = null,
  onSelectProperty,
  onBoundsChange,
  targetDistrict = null,
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const [searchOnMove, setSearchOnMove] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Manila / Makati center default
    const map = L.map(mapContainerRef.current, {
      center: [14.5547, 121.0350],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // OpenStreetMap standard tiles - clean, free, no API key required
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom controls bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Listen to map pan/zoom for "Search as I move the map"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMoveEnd = () => {
      if (!searchOnMove || !onBoundsChange) return;

      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }

      moveTimeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      }, 300);
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      if (map && typeof map.off === 'function') {
        map.off('moveend', handleMoveEnd);
      }
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    };
  }, [searchOnMove, onBoundsChange]);

  // Handle Target District Fly-to
  useEffect(() => {
    if (!mapInstanceRef.current || !targetDistrict) return;
    mapInstanceRef.current.flyTo(
      [targetDistrict.lat, targetDistrict.lng],
      targetDistrict.zoom || 14,
      { duration: 1.2 }
    );
  }, [targetDistrict]);

  // Update Markers when properties, selection, or hover changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    if (!properties || properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    properties.forEach((property) => {
      const { lat, lng } = getPropertyCoordinates(property);
      const isSelected = selectedPropertyId === property.id;
      const isHovered = hoveredPropertyId === property.id;
      const isHighlighted = isSelected || isHovered;
      const pricePill = formatPricePill(property.price, property.price_raw);

      // Custom Luxury HTML Pin Marker
      const markerHtml = `
        <div class="property-map-pin ${isHighlighted ? 'is-active' : ''}" style="cursor: pointer;">
          <div class="pin-pill ${
            isHighlighted
              ? 'bg-[#174849] text-white shadow-xl scale-110 border-[#E76F51]'
              : 'bg-white text-[#174849] border-gray-200/90 shadow-md hover:border-[#174849] hover:scale-105'
          }"
               style="
                 display: inline-flex;
                 align-items: center;
                 gap: 4px;
                 padding: 6px 12px;
                 border-radius: 9999px;
                 font-family: inherit;
                 font-size: 11px;
                 font-weight: 800;
                 letter-spacing: -0.01em;
                 border-width: ${isHighlighted ? '2px' : '1px'};
                 white-space: nowrap;
                 transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                 transform-origin: center bottom;
               ">
            <span style="display:inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: ${
              isHighlighted ? '#E76F51' : '#174849'
            };"></span>
            <span>${pricePill}</span>
          </div>
          <div class="pin-arrow" style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${isHighlighted ? '#174849' : '#ffffff'};
            margin: -1px auto 0 auto;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-property-div-icon',
        html: markerHtml,
        iconSize: [80, 36],
        iconAnchor: [40, 36],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: isHighlighted ? 1000 : 100
      });

      // Interactive popup preview
      const popupContent = document.createElement('div');
      popupContent.className = 'property-popup-card';
      popupContent.innerHTML = `
        <div style="width: 240px; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; border-radius: 16px;">
          <div style="position: relative; width: 100%; height: 130px; overflow: hidden; background: #f3f4f6;">
            <img src="${property.image || property.mainImage || ''}" alt="${property.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(23,72,73,0.9); backdrop-filter: blur(8px); color: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">
              ${property.price || ''}
            </div>
          </div>
          <div style="padding: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: #174849; line-height: 1.25; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
              ${property.name}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
              <span>📍</span> <span>${property.location || property.city || ''}</span>
            </div>
            <div style="display: flex; gap: 8px; font-size: 10px; font-weight: 700; color: #4b5563; margin-bottom: 10px; text-transform: uppercase;">
              <span>${property.beds || 0} Beds</span> • <span>${property.baths || 0} Baths</span> • <span>${property.area || property.sqm || ''}</span>
            </div>
            <button id="view-property-btn-${property.id}" style="width: 100%; background: #174849; color: white; border: none; padding: 7px 0; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.2s;">
              View Residence →
            </button>
          </div>
        </div>
      `;

      // Bind button click inside popup
      const btn = popupContent.querySelector(`#view-property-btn-${property.id}`);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigate(`/properties/${property.id}`);
        });
      }

      marker.bindPopup(popupContent, {
        maxWidth: 260,
        className: 'custom-leaflet-popup',
        closeButton: true
      });

      marker.on('click', () => {
        if (onSelectProperty) {
          onSelectProperty(property);
        }
      });

      markersGroup.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    // Auto-fit bounds if we have valid pins and not user-controlled panning
    if (!searchOnMove && bounds.isValid() && properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14
      });
    }
  }, [properties, selectedPropertyId, hoveredPropertyId, onSelectProperty, navigate, searchOnMove]);

  // Recenter helper
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const bounds = markersLayerRef.current.getBounds();
    if (bounds && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[450px] overflow-hidden ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        {/* "Search as I move the map" Toggle Checkbox */}
        <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-gray-200/80 shadow-sm pointer-events-auto cursor-pointer hover:bg-white transition-all select-none">
          <input
            type="checkbox"
            checked={searchOnMove}
            onChange={(e) => {
              setSearchOnMove(e.target.checked);
              if (!e.target.checked && onBoundsChange) {
                onBoundsChange(null); // Clear bounding box restriction
              }
            }}
            className="w-3.5 h-3.5 rounded text-[#174849] accent-[#174849] cursor-pointer"
          />
          <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">
            Search as I move map
          </span>
        </label>

        {/* Telemetry Count + Recenter Button */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-gray-200/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#174849] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#174849]">
              {properties.length} {properties.length === 1 ? 'Location' : 'Locations'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-[#174849] text-[11px] font-bold uppercase tracking-wider rounded-full border border-gray-200/80 shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            title="Fit all properties into view"
          >
            <span className="material-symbols-outlined text-[15px]">crop_free</span>
            <span className="hidden md:inline">Fit All</span>
          </button>
        </div>
      </div>

      {/* Global Leaflet Marker & Popup Custom Styles */}
      <style>{`
        .custom-property-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid rgba(23, 72, 73, 0.1) !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: inherit !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
