import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../../../services/googleMapsLoader';
import { createPriceBadgeElement, formatPriceBadge } from './googleMapMarkers';
import { getPropertyCoordinates } from '../../../utils/propertyCoordinates';
import PropertyMap from './PropertyMap';

/**
 * Modern SaaS cartographic styling JSON for Google Maps Vector Canvas.
 * Directly adheres to design.md tokens:
 * - Canvas: #F8FAFC
 * - Water: #E0F2FE
 * - Greenery: #ECFDF5
 * - Roads: #FFFFFF with #E2E8F0 borders
 * - Text: #1E293B
 */
export const LUXURY_MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#F8FAFC' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#E0F2FE' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#ECFDF5' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E2E8F0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CBD5E1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#F1F5F9' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1E293B' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#FFFFFF' }, { weight: 2 }],
  },
];

export default function GooglePropertyMap({
  properties = [],
  selectedPropertyId = null,
  hoveredPropertyId = null,
  onSelectProperty,
  onBoundsChange,
  targetDistrict = null,
  className = '',
  showControls = true,
  searchAsMove = true,
  onToggleSearchAsMove,
  singlePropertyMode = false,
  interactive = true,
  initialZoom = 15,
  onOpenStreetView,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const hasRouter = useInRouterContext();
  const routerNavigate = hasRouter ? useNavigate() : null;
  const navigate = useCallback((url) => {
    if (routerNavigate) {
      routerNavigate(url);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, [routerNavigate]);

  const [useFallback, setUseFallback] = useState(!isGoogleMapsConfigured());
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState('vector'); // 'vector' | 'hybrid' | 'terrain'
  const [isSearchActive, setIsSearchActive] = useState(searchAsMove);
  const [activePopupProperty, setActivePopupProperty] = useState(null);
  const [embedZoom, setEmbedZoom] = useState(initialZoom || 15);
  const [embedLayer, setEmbedLayer] = useState('m'); // 'm' | 'k' | 'h' | 'p'

  // Derive active property and coordinates for Google Maps Embed
  const activeProperty = useMemo(() => {
    if (activePopupProperty) return activePopupProperty;
    if (selectedPropertyId) {
      const found = properties.find((p) => p.id === selectedPropertyId);
      if (found) return found;
    }
    if (hoveredPropertyId) {
      const found = properties.find((p) => p.id === hoveredPropertyId);
      if (found) return found;
    }
    return properties[0] || null;
  }, [activePopupProperty, selectedPropertyId, hoveredPropertyId, properties]);

  const activeCoords = useMemo(() => {
    if (activeProperty) {
      const c = getPropertyCoordinates(activeProperty);
      if (c && c.lat && c.lng) return c;
    }
    return { lat: 14.5489, lng: 121.0503 };
  }, [activeProperty]);

  // Construct official Google Maps Embed URL
  const googleMapsEmbedUrl = useMemo(() => {
    const lat = activeCoords.lat.toFixed(6);
    const lng = activeCoords.lng.toFixed(6);
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${embedLayer}&z=${embedZoom}&output=embed`;
  }, [activeCoords, embedLayer, embedZoom]);

  // Initialize Google Maps instance if configured
  useEffect(() => {
    let isCancelled = false;

    if (!isGoogleMapsConfigured()) {
      setUseFallback(true);
      return;
    }

    async function initGoogleMap() {
      try {
        const google = await loadGoogleMapsApi();
        if (isCancelled || !google || !containerRef.current) {
          setUseFallback(true);
          return;
        }

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: 14.5489, lng: 121.0503 }, // Metro Manila BGC / Makati default
          zoom: singlePropertyMode ? 16 : 13,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: LUXURY_MAP_STYLES,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        // Debounced bounds change listener for "Search As I Move"
        map.addListener('idle', () => {
          if (!mapInstanceRef.current) return;
          const bounds = map.getBounds();
          if (!bounds) return;

          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            if (typeof onBoundsChange === 'function' && isSearchActive) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onBoundsChange({
                north: ne.lat(),
                east: ne.lng(),
                south: sw.lat(),
                west: sw.lng(),
              });
            }
          }, 350);
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.warn('[GooglePropertyMap] Error initializing Google Maps, falling back to Leaflet:', err);
        setUseFallback(true);
      }
    }

    initGoogleMap();

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [singlePropertyMode, isSearchActive]);

  // Update map type when activeLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;
    if (activeLayer === 'hybrid') {
      map.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
    } else if (activeLayer === 'terrain') {
      map.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
    } else {
      map.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
    }
  }, [activeLayer]);

  // Sync Markers with properties
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google) return;

    const map = mapInstanceRef.current;
    const existingMarkers = markersRef.current;

    // Remove obsolete markers
    existingMarkers.forEach((markerObj, id) => {
      if (!properties.some((p) => p.id === id)) {
        if (markerObj.marker?.setMap) markerObj.marker.setMap(null);
        existingMarkers.delete(id);
      }
    });

    // Add or update markers
    properties.forEach((prop) => {
      const coords = getPropertyCoordinates(prop);
      if (!coords || !coords.lat || !coords.lng) return;

      const isSelected = prop.id === selectedPropertyId || prop.id === hoveredPropertyId;

      if (existingMarkers.has(prop.id)) {
        const markerObj = existingMarkers.get(prop.id);
        if (markerObj.isSelected !== isSelected) {
          // Re-render element with updated state
          const newEl = createPriceBadgeElement(prop, {
            isSelected,
            onClick: (p) => {
              setActivePopupProperty(p);
              if (typeof onSelectProperty === 'function') onSelectProperty(p);
            },
          });
          if (markerObj.element && markerObj.element.parentNode) {
            markerObj.element.parentNode.replaceChild(newEl, markerObj.element);
            markerObj.element = newEl;
            markerObj.isSelected = isSelected;
          }
        }
      } else {
        // Create new marker
        const element = createPriceBadgeElement(prop, {
          isSelected,
          onClick: (p) => {
            setActivePopupProperty(p);
            if (typeof onSelectProperty === 'function') onSelectProperty(p);
          },
        });

        let marker;
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: coords.lat, lng: coords.lng },
            content: element,
            title: prop.title,
          });
        } else {
          // Standard OverlayView fallback for custom HTML
          marker = new window.google.maps.Marker({
            map,
            position: { lat: coords.lat, lng: coords.lng },
            title: prop.title,
          });
        }

        existingMarkers.set(prop.id, { marker, element, isSelected });
      }
    });
  }, [properties, selectedPropertyId, hoveredPropertyId, mapReady, onSelectProperty]);

  // Fit all markers action
  const handleFitAll = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || properties.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    properties.forEach((prop) => {
      const c = getPropertyCoordinates(prop);
      if (c && c.lat && c.lng) {
        bounds.extend(new window.google.maps.LatLng(c.lat, c.lng));
      }
    });
    mapInstanceRef.current.fitBounds(bounds, 48);
  }, [properties]);

  // If Google Maps JS API key is unconfigured, render Official Google Maps Embed Interface
  if (useFallback) {
    return (
      <div
        data-lenis-prevent="true"
        data-testid="google-property-map-embed"
        className={`relative w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
      >
        {/* Official Google Maps Embed Iframe */}
        <iframe
          key={`${activeCoords.lat.toFixed(6)}-${activeCoords.lng.toFixed(6)}-${embedLayer}-${embedZoom}`}
          title="Google Maps Property Pinpoint"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
          allowFullScreen={false}
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Google Cartographic Control Dock */}
        {showControls && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-md">
            {/* Layer Switchers */}
            {[
              { id: 'm', label: 'Roadmap' },
              { id: 'k', label: 'Satellite' },
              { id: 'h', label: 'Hybrid' },
              { id: 'p', label: 'Terrain' },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setEmbedLayer(layer.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[36px] transition-colors cursor-pointer ${
                  embedLayer === layer.id
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
                }`}
              >
                {layer.label}
              </button>
            ))}

            <span className="w-px h-5 bg-[#E2E8F0]" />

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setEmbedZoom((prev) => Math.min(20, prev + 1))}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer font-bold text-base"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setEmbedZoom((prev) => Math.max(10, prev - 1))}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer font-bold text-base"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setEmbedZoom(13);
                setActivePopupProperty(null);
              }}
              title="Fit All Properties"
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#0F766E] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              Fit All
            </button>
            {searchAsMove && (
              <button
                type="button"
                onClick={() => {
                  const next = !isSearchActive;
                  setIsSearchActive(next);
                  if (onToggleSearchAsMove) onToggleSearchAsMove(next);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
                  isSearchActive ? 'text-[#0F766E] bg-teal-50' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Search as I move
              </button>
            )}
          </div>
        )}

        {/* Floating Residence Card Popover */}
        {activeProperty && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 pointer-events-auto">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden p-3.5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                    {formatPriceBadge(activeProperty.price_raw || activeProperty.price || 0, activeProperty.currency)}
                  </span>
                  <h4 className="text-sm font-bold text-[#1E293B] mt-1 line-clamp-1">
                    {activeProperty.title || activeProperty.name || 'Luxury Residence'}
                  </h4>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">
                    {[activeProperty.subdivision, activeProperty.city].filter(Boolean).join(', ') ||
                      activeProperty.location ||
                      'Metro Manila'}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2 pt-1">
                {onOpenStreetView && (
                  <button
                    type="button"
                    onClick={() => {
                      const coords = getPropertyCoordinates(activeProperty);
                      onOpenStreetView(coords);
                    }}
                    className="flex-1 h-9 px-3 bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    360° Street View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/properties/${activeProperty.id}`)}
                  className="flex-1 h-9 px-4 bg-[#FF6B6B] hover:bg-[#FF5252] text-[#1E293B] text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Residence</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-lenis-prevent="true"
      className={`relative w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
    >
      {/* Map Viewport Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Bauhaus Glass HUD Dock */}
      {showControls && !singlePropertyMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-sm">
          {/* Search As I Move */}
          <button
            type="button"
            onClick={() => {
              const next = !isSearchActive;
              setIsSearchActive(next);
              if (typeof onToggleSearchAsMove === 'function') onToggleSearchAsMove(next);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] transition-colors flex items-center gap-1.5 ${
              isSearchActive
                ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSearchActive ? 'bg-[#0F766E]' : 'bg-slate-300'}`} />
            <span>Search as I move</span>
          </button>

          <span className="w-px h-5 bg-[#E2E8F0]" />

          {/* Layer Switcher */}
          <button
            type="button"
            onClick={() => setActiveLayer('vector')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[44px] transition-colors ${
              activeLayer === 'vector'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Vector
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('hybrid')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[44px] transition-colors ${
              activeLayer === 'hybrid'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Satellite
          </button>

          <span className="w-px h-5 bg-[#E2E8F0]" />

          {/* Fit All Button */}
          <button
            type="button"
            onClick={handleFitAll}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-[#1E293B] hover:bg-slate-100 min-h-[44px] transition-colors"
          >
            Fit All
          </button>
        </div>
      )}

      {/* Interactive Residence Popover Overlay */}
      {activePopupProperty && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                  {formatPriceBadge(activePopupProperty.price || 0, activePopupProperty.currency)}
                </span>
                <h4 className="text-sm font-bold text-[#1E293B] mt-1 line-clamp-1">
                  {activePopupProperty.title || 'Luxury Residence'}
                </h4>
                <p className="text-xs text-[#64748B]">
                  {[activePopupProperty.subdivision, activePopupProperty.city].filter(Boolean).join(', ') ||
                    'Metro Manila'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopupProperty(null)}
                aria-label="Close popover"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>

            {/* CTAs strictly adhering to design.md Approved Coral Button */}
            <div className="flex items-center gap-2 pt-1">
              {onOpenStreetView && (
                <button
                  type="button"
                  onClick={() => {
                    const coords = getPropertyCoordinates(activePopupProperty);
                    onOpenStreetView(coords);
                  }}
                  className="flex-1 h-10 px-3 bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  360° Street View
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/properties/${activePopupProperty.id}`)}
                className="flex-1 h-10 px-4 bg-[#FF6B6B] hover:bg-[#FF5252] text-[#1E293B] text-xs font-bold rounded-lg transition-colors shadow-xs min-h-[44px] flex items-center justify-center gap-1"
              >
                <span>View Residence</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
