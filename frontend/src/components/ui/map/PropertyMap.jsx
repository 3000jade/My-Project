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
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Manila / Makati center default
    const map = L.map(mapContainerRef.current, {
      center: [14.5547, 121.0350],
      zoom: 12,
      zoomControl: false, // Custom placed zoom control
      scrollWheelZoom: true,
    });

    // CartoDB Voyager tiles - ultra clean modern architectural theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Custom Zoom controls at bottom-right
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

      // Create Luxury HTML Pin Marker
      const markerHtml = `
        <div class="property-map-pin ${isHighlighted ? 'is-active' : ''}" style="cursor: pointer;">
          <div class="pin-pill ${isHighlighted ? 'bg-[#174849] text-white shadow-xl scale-110 border-[#E76F51]' : 'bg-white text-[#174849] border-gray-200/90 shadow-md hover:border-[#174849] hover:scale-105'}"
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
            <span style="display:inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: ${isHighlighted ? '#E76F51' : '#174849'};"></span>
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
              <span>??</span> <span>${property.location || property.city || ''}</span>
            </div>
            <div style="display: flex; gap: 8px; font-size: 10px; font-weight: 700; color: #4b5563; margin-bottom: 10px; text-transform: uppercase;">
              <span>${property.beds || 0} Beds</span> � <span>${property.baths || 0} Baths</span> � <span>${property.area || property.sqm || ''}</span>
            </div>
            <button id="view-property-btn-${property.id}" style="width: 100%; background: #174849; color: white; border: none; padding: 7px 0; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.2s;">
              View Residence ?
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

    // Auto-fit bounds if we have valid pins
    if (bounds.isValid() && properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14
      });
    }
  }, [properties, selectedPropertyId, hoveredPropertyId, onSelectProperty, navigate]);

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
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Telemetry Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-gray-200/80 shadow-sm pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#174849] animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#174849]">
            {properties.length} {properties.length === 1 ? 'Location' : 'Locations'} Pinned
          </span>
        </div>

        <button
          onClick={handleRecenter}
          className="px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-[#174849] text-[11px] font-bold uppercase tracking-wider rounded-full border border-gray-200/80 shadow-sm hover:shadow transition-all pointer-events-auto flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">crop_free</span>
          <span>Fit All</span>
        </button>
      </div>

      {/* Custom Global Popup Styling */}
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
