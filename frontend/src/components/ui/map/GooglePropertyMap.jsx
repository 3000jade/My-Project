import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../../../services/googleMapsLoader';
import {
  createTeardropPinElement,
  createMinimalistMarkerElement,
  createPriceBadgeElement,
  formatPriceBadge,
} from './googleMapMarkers';
import { getPropertyCoordinates } from '../../../utils/propertyCoordinates';

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
  onHoverProperty,
  onBoundsChange,
  targetDistrict = null,
  className = '',
  showControls = true,
  searchAsMove = false,
  showSearchAsMove = true,
  onToggleSearchAsMove,
  singlePropertyMode = false,
  interactive = true,
  initialZoom = 14,
  onOpenStreetView,
  forceEmbed = false,
  markerVariant = 'pin', // 'pin' (default teardrop) | 'dot' | 'pill'
}) {
  const containerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const leafletTileLayerRef = useRef(null);
  const markersRef = useRef(new Map()); // Map of property.id -> { marker, element, isSelected, isHovered }
  const debounceTimerRef = useRef(null);

  const hasRouter = useInRouterContext();
  const routerNavigate = hasRouter ? useNavigate() : null;
  const navigate = useCallback(
    (url) => {
      if (routerNavigate) {
        routerNavigate(url);
      } else if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    },
    [routerNavigate]
  );

  const [activeLayer, setActiveLayer] = useState('vector'); // 'vector' (Roadmap) | 'satellite' (Hybrid) | 'terrain'
  const [showDistricts, setShowDistricts] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(searchAsMove);
  const [mapEngine, setMapEngine] = useState('initializing'); // 'google' | 'leaflet' | 'embed'
  const [embedZoom, setEmbedZoom] = useState(initialZoom || 15);
  const [embedLayer, setEmbedLayer] = useState('m'); // 'm' | 'k' | 'h' | 'p'

  // Derive active property for embed fallback
  const activeProperty = useMemo(() => {
    if (selectedPropertyId) {
      const found = properties.find((p) => p.id === selectedPropertyId);
      if (found) return found;
    }
    if (hoveredPropertyId) {
      const found = properties.find((p) => p.id === hoveredPropertyId);
      if (found) return found;
    }
    return singlePropertyMode ? properties[0] || null : null;
  }, [selectedPropertyId, hoveredPropertyId, properties, singlePropertyMode]);

  const activeCoords = useMemo(() => {
    if (activeProperty) {
      const c = getPropertyCoordinates(activeProperty);
      if (c && c.lat && c.lng) return c;
    }
    return { lat: 14.5489, lng: 121.0503 }; // Default Metro Manila
  }, [activeProperty]);

  // Construct official Google Maps Embed URL (used only if forceEmbed is requested)
  const googleMapsEmbedUrl = useMemo(() => {
    const lat = activeCoords.lat.toFixed(6);
    const lng = activeCoords.lng.toFixed(6);
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${embedLayer}&z=${embedZoom}&output=embed`;
  }, [activeCoords, embedLayer, embedZoom]);

  // Calculate default center across all valid properties
  const defaultCenter = useMemo(() => {
    if (properties.length > 0) {
      for (const prop of properties) {
        const c = getPropertyCoordinates(prop);
        if (c && c.lat && c.lng) return [c.lat, c.lng];
      }
    }
    return [14.5489, 121.0503];
  }, [properties]);

  // ==========================================
  // 1. ENGINE INITIALIZATION (Google vs Leaflet Tiles)
  // ==========================================
  useEffect(() => {
    if (forceEmbed) {
      setMapEngine('embed');
      return;
    }

    let isCancelled = false;

    async function initEngine() {
      // Step A: Attempt Native Google Maps JavaScript API
      if (isGoogleMapsConfigured()) {
        try {
          const google = await loadGoogleMapsApi();
          if (isCancelled) return;
          if (google && containerRef.current) {
            const map = new google.maps.Map(containerRef.current, {
              center: { lat: defaultCenter[0], lng: defaultCenter[1] },
              zoom: singlePropertyMode ? 16 : initialZoom,
              minZoom: 1,
              maxZoom: 21,
              disableDefaultUI: true,
              gestureHandling: interactive ? 'greedy' : 'none',
              styles: LUXURY_MAP_STYLES,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
            });

            // Idle bounds listener
            map.addListener('idle', () => {
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => {
                if (typeof onBoundsChange === 'function' && isSearchActive) {
                  const bounds = map.getBounds();
                  if (bounds) {
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();
                    onBoundsChange({
                      north: ne.lat(),
                      east: ne.lng(),
                      south: sw.lat(),
                      west: sw.lng(),
                    });
                  }
                }
              }, 350);
            });

            googleMapInstanceRef.current = map;
            setMapEngine('google');
            return;
          }
        } catch (err) {
          console.warn('[GooglePropertyMap] Google Maps JS API init error, falling back to Google tiles canvas:', err);
        }
      }

      // Step B: Resilient Fallback - Interactive Canvas with Google Maps Tiles (Multi-Pin)
      if (isCancelled || !containerRef.current) return;

      try {
        if (leafletMapInstanceRef.current) {
          leafletMapInstanceRef.current.remove();
          leafletMapInstanceRef.current = null;
        }

        const map = L.map(containerRef.current, {
          center: defaultCenter,
          zoom: singlePropertyMode ? 16 : initialZoom,
          minZoom: 1,
          maxZoom: 21,
          zoomControl: false,
          scrollWheelZoom: interactive,
          dragging: interactive,
          touchZoom: interactive,
          doubleClickZoom: interactive,
          attributionControl: false,
        });

        // Add Google Roadmap Tiles with full zoom range 1 to 21
        const tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          minZoom: 1,
          maxZoom: 21,
          maxNativeZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }).addTo(map);

        leafletTileLayerRef.current = tileLayer;

        // Moveend listener for bounding box changes
        map.on('moveend', () => {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            if (typeof onBoundsChange === 'function' && isSearchActive) {
              const bounds = map.getBounds();
              if (bounds) {
                onBoundsChange({
                  north: bounds.getNorth(),
                  east: bounds.getEast(),
                  south: bounds.getSouth(),
                  west: bounds.getWest(),
                });
              }
            }
          }, 350);
        });

        leafletMapInstanceRef.current = map;
        setMapEngine('leaflet');
      } catch (e) {
        console.error('[GooglePropertyMap] Error creating tile canvas:', e);
      }
    }

    initEngine();

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (leafletMapInstanceRef.current) {
        try {
          if (typeof leafletMapInstanceRef.current.stop === 'function') {
            leafletMapInstanceRef.current.stop();
          }
          leafletMapInstanceRef.current.remove();
        } catch {
          // ignore cleanup errors during unmount
        }
        leafletMapInstanceRef.current = null;
      }
      googleMapInstanceRef.current = null;
    };
  }, [forceEmbed, singlePropertyMode, interactive, initialZoom]);

  // ==========================================
  // 2. LAYER SWITCHING (Vector vs Satellite)
  // ==========================================
  useEffect(() => {
    if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
      const map = googleMapInstanceRef.current;
      if (activeLayer === 'satellite' || activeLayer === 'hybrid') {
        map.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
      } else if (activeLayer === 'terrain') {
        map.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
      } else {
        map.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
      }
    } else if (mapEngine === 'leaflet' && leafletTileLayerRef.current) {
      const isSat = activeLayer === 'satellite' || activeLayer === 'hybrid';
      const isTerrain = activeLayer === 'terrain';
      let layerCode = 'm'; // roadmap
      if (isSat) layerCode = 'y'; // hybrid satellite + labels
      else if (isTerrain) layerCode = 'p'; // terrain
      leafletTileLayerRef.current.setUrl(`https://mt1.google.com/vt/lyrs=${layerCode}&x={x}&y={y}&z={z}`);
    }
  }, [activeLayer, mapEngine]);

  // ==========================================
  // 3. MULTI-PIN MARKER SYNCHRONIZATION
  // ==========================================
  useEffect(() => {
    if (mapEngine === 'embed') return;

    const existingMarkers = markersRef.current;
    const currentPropertyIds = new Set(properties.map((p) => p.id));

    // Remove obsolete markers
    existingMarkers.forEach((markerObj, id) => {
      if (!currentPropertyIds.has(id)) {
        if (markerObj.marker?.setMap) markerObj.marker.setMap(null); // Google Maps
        if (markerObj.marker?.remove) markerObj.marker.remove(); // Leaflet
        existingMarkers.delete(id);
      }
    });

    // Helper to generate marker element
    const createMarkerEl = (prop, isSel, isHov) => {
      const options = {
        isSelected: isSel,
        isHovered: isHov,
        onClick: (p) => {
          if (typeof onSelectProperty === 'function') onSelectProperty(p);
        },
        onHover: (p) => {
          if (typeof onHoverProperty === 'function') {
            onHoverProperty(p);
          }
        },
      };

      if (markerVariant === 'pill') {
        return createPriceBadgeElement(prop, options);
      }
      if (markerVariant === 'dot') {
        return createMinimalistMarkerElement(prop, options);
      }
      return createTeardropPinElement(prop, options);
    };

    const isTeardrop = markerVariant === 'pin' || markerVariant === 'teardrop';

    // Render / Update Pins for ALL properties
    properties.forEach((prop) => {
      const coords = getPropertyCoordinates(prop);
      if (!coords || !coords.lat || !coords.lng) return;

      const isSelected = prop.id === selectedPropertyId;
      const isHovered = prop.id === hoveredPropertyId;

      if (existingMarkers.has(prop.id)) {
        const markerObj = existingMarkers.get(prop.id);
        if (markerObj.isSelected !== isSelected || markerObj.isHovered !== isHovered) {
          const newEl = createMarkerEl(prop, isSelected, isHovered);

          if (mapEngine === 'google') {
            if (markerObj.marker && markerObj.marker.content) {
              markerObj.marker.content = newEl;
            } else if (markerObj.element?.parentNode) {
              markerObj.element.parentNode.replaceChild(newEl, markerObj.element);
            }
          } else if (mapEngine === 'leaflet' && markerObj.marker) {
            const iconSize = isTeardrop
              ? (isSelected ? [34, 44] : [28, 36])
              : (isSelected || isHovered ? [100, 38] : [24, 24]);
            const iconAnchor = isTeardrop
              ? (isSelected ? [17, 44] : [14, 36])
              : (isSelected || isHovered ? [50, 19] : [12, 12]);

            const icon = L.divIcon({
              html: newEl,
              className: 'google-property-pin-container',
              iconSize,
              iconAnchor,
            });
            markerObj.marker.setIcon(icon);
            markerObj.marker.setZIndexOffset(isSelected ? 2000 : 100);
          }

          markerObj.element = newEl;
          markerObj.isSelected = isSelected;
          markerObj.isHovered = isHovered;
        }
      } else {
        // Create brand new pin
        const element = createMarkerEl(prop, isSelected, isHovered);

        if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
          const map = googleMapInstanceRef.current;
          let marker;
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: coords.lat, lng: coords.lng },
              content: element,
              title: prop.title || 'Luxury Residence',
            });
          } else {
            marker = new window.google.maps.Marker({
              map,
              position: { lat: coords.lat, lng: coords.lng },
              title: prop.title,
            });
          }
          existingMarkers.set(prop.id, { marker, element, isSelected, isHovered });
        } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
          const map = leafletMapInstanceRef.current;
          const iconSize = isTeardrop
            ? (isSelected ? [34, 44] : [28, 36])
            : (isSelected || isHovered ? [100, 38] : [24, 24]);
          const iconAnchor = isTeardrop
            ? (isSelected ? [17, 44] : [14, 36])
            : (isSelected || isHovered ? [50, 19] : [12, 12]);

          const icon = L.divIcon({
            html: element,
            className: 'google-property-pin-container',
            iconSize,
            iconAnchor,
          });

          const marker = L.marker([coords.lat, coords.lng], {
            icon,
            zIndexOffset: isSelected ? 2000 : 100,
          });

          if (marker && typeof marker.addTo === 'function') {
            marker.addTo(map);
          } else if (map && typeof map.addLayer === 'function') {
            map.addLayer(marker);
          }

          if (marker && typeof marker.on === 'function') {
            marker.on('click', () => {
              if (typeof onSelectProperty === 'function') onSelectProperty(prop);
            });
            marker.on('mouseover', () => {
              if (typeof onHoverProperty === 'function') onHoverProperty(prop);
            });
            marker.on('mouseout', () => {
              if (typeof onHoverProperty === 'function') onHoverProperty(null);
            });
          }

          existingMarkers.set(prop.id, { marker, element, isSelected, isHovered });
        }
      }
    });
  }, [properties, selectedPropertyId, hoveredPropertyId, mapEngine, markerVariant, onSelectProperty, onHoverProperty]);

  // ==========================================
  // 4. AUTO-FIT ALL BOUNDS ACTION
  // ==========================================
  const handleFitAll = useCallback(() => {
    if (properties.length === 0) return;

    if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasCoords = false;
      properties.forEach((prop) => {
        const c = getPropertyCoordinates(prop);
        if (c && c.lat && c.lng) {
          bounds.extend(new window.google.maps.LatLng(c.lat, c.lng));
          hasCoords = true;
        }
      });
      if (hasCoords) {
        googleMapInstanceRef.current.fitBounds(bounds, 48);
      }
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      const latLngs = [];
      properties.forEach((prop) => {
        const c = getPropertyCoordinates(prop);
        if (c && c.lat && c.lng) {
          latLngs.push([c.lat, c.lng]);
        }
      });
      if (latLngs.length > 0) {
        leafletMapInstanceRef.current.fitBounds(latLngs, {
          padding: [48, 48],
          maxZoom: 16,
        });
      }
    }
  }, [properties, mapEngine]);

  // Fit all pins automatically on initial load or district change
  useEffect(() => {
    if (properties.length > 0 && (mapEngine === 'google' || mapEngine === 'leaflet')) {
      handleFitAll();
    }
  }, [properties.length, mapEngine, handleFitAll, targetDistrict]);

  // Center on selected property when selected from card list or pin click
  useEffect(() => {
    if (!selectedPropertyId) return;
    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (!prop) return;
    const c = getPropertyCoordinates(prop);
    if (!c || !c.lat || !c.lng) return;

    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: c.lat, lng: c.lng });
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.panTo([c.lat, c.lng], { animate: true });
    }
  }, [selectedPropertyId, properties, mapEngine]);

  // Manual zoom control handlers
  const handleZoomIn = () => {
    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(Math.min(21, googleMapInstanceRef.current.getZoom() + 1));
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.zoomIn();
    } else {
      setEmbedZoom((prev) => Math.min(21, prev + 1));
    }
  };

  const handleZoomOut = () => {
    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(Math.max(1, googleMapInstanceRef.current.getZoom() - 1));
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.zoomOut();
    } else {
      setEmbedZoom((prev) => Math.max(1, prev - 1));
    }
  };

  // ==========================================
  // RENDER IFRAME EMBED (when explicitly requested)
  // ==========================================
  if (forceEmbed) {
    return (
      <div
        data-lenis-prevent="true"
        data-testid="google-property-map-embed"
        className={`relative w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
      >
        <iframe
          key={`${activeCoords.lat.toFixed(6)}-${activeCoords.lng.toFixed(6)}-${embedLayer}-${embedZoom}`}
          title="Google Maps Property Pinpoint"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
          allowFullScreen={false}
          referrerPolicy="no-referrer-when-downgrade"
        />

        {showControls && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-md">
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
          </div>
        )}

        {/* Floating Residence Card Popover for Embed Mode */}
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

  // ==========================================
  // RENDER INTERACTIVE MINIMAL GOOGLE MAP
  // ==========================================
  return (
    <div
      data-lenis-prevent="true"
      data-testid="google-property-map-interactive"
      className={`relative w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
    >
      {/* Interactive Map Viewport Container */}
      <div ref={containerRef} className="w-full h-full" tabIndex={0} aria-label="Interactive Google Property Map" />

      {/* Floating Bauhaus Glass Minimal HUD Dock */}
      {showControls && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-md">
          {/* Layer Switcher */}
          <button
            type="button"
            onClick={() => setActiveLayer('vector')}
            aria-label="Street"
            title="Street View / Roadmap"
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeLayer === 'vector'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('satellite')}
            aria-label="Satellite"
            title="Satellite Imagery"
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeLayer === 'satellite'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setShowDistricts((prev) => !prev)}
            aria-label="Districts"
            title="Toggle Philippine Prime Business Districts"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              showDistricts
                ? 'bg-[#FF6B6B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Districts</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showDistricts ? 'bg-white' : 'bg-slate-300'}`} />
          </button>

          <span className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Fit All Listings Action */}
          <button
            type="button"
            onClick={handleFitAll}
            title="Fit All Property Listings into View"
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-[#0F766E] hover:bg-teal-50/70 rounded-full transition-colors cursor-pointer uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[14px]">crop_free</span>
            <span>Fit All</span>
          </button>

          {/* Search As I Move */}
          {showSearchAsMove && (
            <button
              type="button"
              onClick={() => {
                const next = !isSearchActive;
                setIsSearchActive(next);
                if (typeof onToggleSearchAsMove === 'function') onToggleSearchAsMove(next);
              }}
              aria-label="Search as I move map"
              title="Search as I move map"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isSearchActive ? 'bg-teal-50 text-[#0F766E]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSearchActive ? 'bg-[#0F766E] animate-pulse' : 'bg-slate-300'}`} />
              <span className="whitespace-nowrap">Search as I move map</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Bottom-Right Manual Zoom Controls */}
      <div
        data-testid="manual-zoom-controls"
        className="absolute bottom-20 right-4 sm:right-6 z-[1000] flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-1 pointer-events-auto"
      >
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer font-bold text-lg select-none"
        >
          +
        </button>
        <span className="w-6 h-px bg-slate-200 my-0.5" />
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer font-bold text-lg select-none"
        >
          −
        </button>
      </div>
    </div>
  );
}
