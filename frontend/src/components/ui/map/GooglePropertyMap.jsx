import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../../../services/googleMapsLoader';
import {
  createTeardropPinElement,
  createMinimalistMarkerElement,
  createPriceBadgeElement,
  createClusterBadgeElement,
  formatPriceBadge,
} from './googleMapMarkers';
import { getPropertyCoordinates, DEFAULT_METRO_MANILA_COORDS } from '../../../utils/propertyCoordinates';

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

const GENERAL_AREA_ZOOM = 14;
const GENERAL_AREA_RADIUS_M = 300;

function getGeneralAreaCoords(coords, id) {
  if (!coords) return coords;
  // Deterministic ~120m offset so the circle center is not the exact property
  const seedStr = String(id ?? '0');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const angle = (hash % 360) * (Math.PI / 180);
  return {
    lat: coords.lat + 0.00108 * Math.sin(angle),
    lng: coords.lng + 0.00108 * Math.cos(angle),
  };
}

export default function GooglePropertyMap({
  properties = [],
  selectedPropertyId = null,
  hoveredPropertyId = null,
  onSelectProperty,
  onHoverProperty,
  targetDistrict = null,
  className = '',
  showControls = true,
  singlePropertyMode = false,
  interactive = true,
  initialZoom = 15,
  lockZoom = false,
  generalAreaOnly = false,
  forceEmbed = false,
  recenterTrigger = 0,
  markerVariant = 'pin', // 'pin' (default teardrop) | 'dot' | 'pill'
}) {
  const containerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const leafletTileLayerRef = useRef(null);
  const markersRef = useRef(new Map()); // Map of property.id -> { marker, element, isSelected, isHovered }
  const onSelectPropertyRef = useRef(onSelectProperty);
  const onHoverPropertyRef = useRef(onHoverProperty);
  const prevRecenterTriggerRef = useRef(recenterTrigger);

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
  const [mapEngine, setMapEngine] = useState('initializing'); // 'google' | 'leaflet' | 'embed'
  const effectiveZoom = lockZoom
    ? GENERAL_AREA_ZOOM
    : singlePropertyMode
      ? initialZoom || 16
      : initialZoom;
  const [embedZoom, setEmbedZoom] = useState(effectiveZoom || 15);
  const [currentZoom, setCurrentZoom] = useState(effectiveZoom || 13);
  const [embedLayer, setEmbedLayer] = useState('m'); // 'm' | 'k' | 'h' | 'p'
  const [dismissedPreviewId, setDismissedPreviewId] = useState(null);

  onSelectPropertyRef.current = onSelectProperty;
  onHoverPropertyRef.current = onHoverProperty;

  // Reset dismissed preview whenever selectedPropertyId changes
  useEffect(() => {
    setDismissedPreviewId(null);
  }, [selectedPropertyId]);

  // Explicitly selected property (never triggered by hover, preventing camera hijacking)
  const selectedProperty = useMemo(() => {
    if (selectedPropertyId) {
      const found = properties.find((p) => String(p.id) === String(selectedPropertyId));
      if (found) return found;
    }
    return singlePropertyMode ? properties[0] || null : null;
  }, [selectedPropertyId, properties, singlePropertyMode]);

  // Derive active property for embed fallback
  const activeProperty = useMemo(() => {
    if (selectedProperty) return selectedProperty;
    if (hoveredPropertyId) {
      const found = properties.find((p) => String(p.id) === String(hoveredPropertyId));
      if (found) return found;
    }
    return singlePropertyMode ? properties[0] || null : null;
  }, [selectedProperty, hoveredPropertyId, properties, singlePropertyMode]);

  const activeCoords = useMemo(() => {
    if (activeProperty) {
      const c = getPropertyCoordinates(activeProperty);
      if (c && c.lat && c.lng) {
        return generalAreaOnly && singlePropertyMode ? getGeneralAreaCoords(c, activeProperty.id) : c;
      }
    }
    return { ...DEFAULT_METRO_MANILA_COORDS };
  }, [activeProperty, generalAreaOnly, singlePropertyMode]);

  // Construct official Google Maps Embed URL (used only if forceEmbed is requested)
  const googleMapsEmbedUrl = useMemo(() => {
    const lat = activeCoords.lat.toFixed(6);
    const lng = activeCoords.lng.toFixed(6);
    const z = lockZoom ? GENERAL_AREA_ZOOM : embedZoom;
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${embedLayer}&z=${z}&output=embed`;
  }, [activeCoords, embedLayer, embedZoom, lockZoom]);

  // Calculate default center across all valid properties
  const defaultCenter = useMemo(() => {
    if (properties.length > 0) {
      for (const prop of properties) {
        const c = getPropertyCoordinates(prop);
        if (c && c.lat && c.lng) {
          const resolved = generalAreaOnly && singlePropertyMode ? getGeneralAreaCoords(c, prop.id) : c;
          return [resolved.lat, resolved.lng];
        }
      }
    }
    return [DEFAULT_METRO_MANILA_COORDS.lat, DEFAULT_METRO_MANILA_COORDS.lng];
  }, [properties, generalAreaOnly, singlePropertyMode]);

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
              zoom: effectiveZoom,
              minZoom: lockZoom ? GENERAL_AREA_ZOOM : 1,
              maxZoom: lockZoom ? GENERAL_AREA_ZOOM : 21,
              disableDefaultUI: true,
              scrollwheel: interactive && !lockZoom,
              disableDoubleClickZoom: !interactive || lockZoom,
              gestureHandling: interactive ? 'greedy' : 'none',
              styles: LUXURY_MAP_STYLES,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
            });

            map.addListener('zoom_changed', () => {
              const z = map.getZoom();
              if (typeof z === 'number') setCurrentZoom(z);
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
          zoom: effectiveZoom,
          minZoom: lockZoom ? GENERAL_AREA_ZOOM : 1,
          maxZoom: lockZoom ? GENERAL_AREA_ZOOM : 21,
          zoomControl: false,
          scrollWheelZoom: interactive && !lockZoom,
          dragging: interactive,
          touchZoom: interactive && !lockZoom,
          doubleClickZoom: interactive && !lockZoom,
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

        map.on('zoomend', () => {
          if (containerRef.current?.clientWidth > 0 && typeof map.getZoom === 'function') {
            setCurrentZoom(map.getZoom());
          }
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
  }, [forceEmbed, singlePropertyMode, interactive, initialZoom, lockZoom]);

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
  // 3. MULTI-PIN & STACKED ANCHOR MARKER SYNCHRONIZATION
  // ==========================================
  useEffect(() => {
    if (mapEngine === 'embed') return;

    const existingMarkers = markersRef.current;
    const isAreaZoom = !singlePropertyMode && currentZoom >= 13 && currentZoom <= 14;

    const zoomToArea = (lat, lng) => {
      if (mapEngine === 'google' && googleMapInstanceRef.current) {
        googleMapInstanceRef.current.setCenter({ lat, lng });
        googleMapInstanceRef.current.setZoom(15);
      } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.setView([lat, lng], 15);
      }
      setCurrentZoom(15);
    };

    if (isAreaZoom) {
      const areaGroups = new Map();
      properties.forEach((prop) => {
        const coords = getPropertyCoordinates(prop);
        if (!coords || !coords.lat || !coords.lng) return;
        const label = String(prop.city || prop.location || prop.subdivision || 'Area').trim();
        const key = `area-${label.toLowerCase()}`;
        if (!areaGroups.has(key)) {
          areaGroups.set(key, { key, label, items: [], sumLat: 0, sumLng: 0 });
        }
        const grp = areaGroups.get(key);
        grp.items.push(prop);
        grp.sumLat += coords.lat;
        grp.sumLng += coords.lng;
      });

      const currentMarkerIds = new Set(areaGroups.keys());
      existingMarkers.forEach((markerObj, id) => {
        if (!currentMarkerIds.has(id)) {
          if (markerObj.marker?.setMap) markerObj.marker.setMap(null);
          if (markerObj.marker?.remove) markerObj.marker.remove();
          existingMarkers.delete(id);
        }
      });

      areaGroups.forEach((grp) => {
        const avgLat = grp.sumLat / grp.items.length;
        const avgLng = grp.sumLng / grp.items.length;
        const element = createClusterBadgeElement(grp.items.length, grp.label, () =>
          zoomToArea(avgLat, avgLng)
        );

        if (existingMarkers.has(grp.key)) {
          const markerObj = existingMarkers.get(grp.key);
          if (markerObj.count !== grp.items.length && markerObj.element) {
            markerObj.element.className = element.className;
            markerObj.element.innerHTML = element.innerHTML;
            markerObj.count = grp.items.length;
          }
          return;
        }

        if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
          const map = googleMapInstanceRef.current;
          const marker = window.google.maps.marker?.AdvancedMarkerElement
            ? new window.google.maps.marker.AdvancedMarkerElement({
                map,
                position: { lat: avgLat, lng: avgLng },
                content: element,
                title: `${grp.label} (${grp.items.length})`,
              })
            : new window.google.maps.Marker({
                map,
                position: { lat: avgLat, lng: avgLng },
                title: `${grp.label} (${grp.items.length})`,
              });
          existingMarkers.set(grp.key, { marker, element, count: grp.items.length });
        } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
          const map = leafletMapInstanceRef.current;
          const icon = L.divIcon({
            html: element,
            className: 'google-property-pin-container',
            iconSize: [140, 36],
            iconAnchor: [70, 18],
          });
          const marker = L.marker([avgLat, avgLng], { icon, zIndexOffset: 500 });
          if (marker && typeof marker.addTo === 'function') {
            marker.addTo(map);
          } else if (map && typeof map.addLayer === 'function') {
            map.addLayer(marker);
          }
          if (marker && typeof marker.on === 'function') {
            marker.on('click', () => zoomToArea(avgLat, avgLng));
          }
          existingMarkers.set(grp.key, { marker, element, count: grp.items.length });
        }
      });
      return;
    }

    const currentMarkerIds = new Set(properties.map((p) => p.id));

    // Remove obsolete markers
    existingMarkers.forEach((markerObj, id) => {
      if (!currentMarkerIds.has(id)) {
        if (markerObj.marker?.setMap) markerObj.marker.setMap(null); // Google Maps
        if (markerObj.marker?.remove) markerObj.marker.remove(); // Leaflet
        existingMarkers.delete(id);
      }
    });

    const isPriceZoom = currentZoom >= 15 && currentZoom <= 16;
    const zoomMode =
      isPriceZoom || markerVariant === 'pill'
        ? 'price'
        : markerVariant === 'dot'
          ? 'dot'
          : 'teardrop';

    // Helper to generate single marker element
    const createMarkerEl = (prop, isSel, isHov) => {
      const options = {
        isSelected: isSel,
        isHovered: isHov,
        onClick: (p) => {
          if (typeof onSelectPropertyRef.current === 'function') onSelectPropertyRef.current(p);
        },
        onHover: (p) => {
          if (typeof onHoverPropertyRef.current === 'function') {
            const resolved = typeof p === 'string'
              ? properties.find((item) => String(item.id) === p) || { id: p }
              : p;
            onHoverPropertyRef.current(resolved);
          }
        },
      };

      if (zoomMode === 'price') {
        return createPriceBadgeElement(prop, options);
      }
      if (zoomMode === 'dot') {
        return createMinimalistMarkerElement(prop, options);
      }
      return createTeardropPinElement(prop, options);
    };

    const isTeardrop = zoomMode === 'teardrop';

    // Render / Update Pins directly per property (no grouping)
    properties.forEach((singleProp) => {
      const markerId = singleProp.id;
      const coords = getPropertyCoordinates(singleProp);
      if (!coords || !coords.lat || !coords.lng) return;

      const isSelected = String(singleProp.id) === String(selectedPropertyId);
      const isHovered = String(singleProp.id) === String(hoveredPropertyId);
      const isAreaCircle = generalAreaOnly && singlePropertyMode;

      if (existingMarkers.has(markerId)) {
        const markerObj = existingMarkers.get(markerId);
        if (Boolean(markerObj.isAreaCircle) !== isAreaCircle) {
          if (markerObj.marker?.setMap) markerObj.marker.setMap(null);
          if (markerObj.marker?.remove) markerObj.marker.remove();
          existingMarkers.delete(markerId);
        } else if (
          !isAreaCircle &&
          (markerObj.isSelected !== isSelected ||
          markerObj.isHovered !== isHovered ||
          markerObj.zoomMode !== zoomMode)
        ) {
          const newEl = createMarkerEl(singleProp, isSelected, isHovered);

          if (markerObj.element) {
            markerObj.element.className = newEl.className;
            markerObj.element.innerHTML = newEl.innerHTML;
          }
          if (mapEngine === 'leaflet' && markerObj.marker && typeof markerObj.marker.setZIndexOffset === 'function') {
            markerObj.marker.setZIndexOffset(isSelected ? 2000 : 100);
          }

          markerObj.isSelected = isSelected;
          markerObj.isHovered = isHovered;
          markerObj.zoomMode = zoomMode;
        }
      }

      if (!existingMarkers.has(markerId)) {
        if (isAreaCircle) {
          const circleCoords = getGeneralAreaCoords(coords, singleProp.id);
          if (mapEngine === 'google' && googleMapInstanceRef.current && window.google?.maps?.Circle) {
            const circle = new window.google.maps.Circle({
              map: googleMapInstanceRef.current,
              center: { lat: circleCoords.lat, lng: circleCoords.lng },
              radius: GENERAL_AREA_RADIUS_M,
              strokeColor: '#0F766E',
              strokeOpacity: 0.75,
              strokeWeight: 2,
              fillColor: '#0F766E',
              fillOpacity: 0.16,
            });
            existingMarkers.set(markerId, { marker: circle, isAreaCircle: true });
          } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current && typeof L.circle === 'function') {
            const circle = L.circle([circleCoords.lat, circleCoords.lng], {
              radius: GENERAL_AREA_RADIUS_M,
              color: '#0F766E',
              weight: 2,
              opacity: 0.75,
              fillColor: '#0F766E',
              fillOpacity: 0.16,
            }).addTo(leafletMapInstanceRef.current);
            existingMarkers.set(markerId, { marker: circle, isAreaCircle: true });
          }
          return;
        }

        // Create brand new pin
        const element = createMarkerEl(singleProp, isSelected, isHovered);

        if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
          const map = googleMapInstanceRef.current;
          let marker;
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            marker = new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: coords.lat, lng: coords.lng },
              content: element,
              title: singleProp.title || 'Luxury Residence',
            });
          } else {
            marker = new window.google.maps.Marker({
              map,
              position: { lat: coords.lat, lng: coords.lng },
              title: singleProp.title,
            });
          }
          existingMarkers.set(markerId, { marker, element, isSelected, isHovered, zoomMode });
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
              if (typeof onSelectPropertyRef.current === 'function') {
                onSelectPropertyRef.current(singleProp);
              }
            });
            marker.on('mouseover', () => {
              if (typeof onHoverPropertyRef.current === 'function') onHoverPropertyRef.current(singleProp.id);
            });
            marker.on('mouseout', () => {
              if (typeof onHoverPropertyRef.current === 'function') onHoverPropertyRef.current(null);
            });
          }

          existingMarkers.set(markerId, { marker, element, isSelected, isHovered, zoomMode });
        }
      }
    });
  }, [properties, selectedPropertyId, hoveredPropertyId, mapEngine, markerVariant, currentZoom, singlePropertyMode, generalAreaOnly]);

  // ==========================================
  // 4. AUTO-FIT ALL BOUNDS & DISTRICT NAVIGATION
  // ==========================================
  const fitPropertiesBounds = useCallback(
    (preferMetroManilaCluster = false) => {
      if (properties.length === 0) return;

      const allCoords = [];
      const metroManilaCoords = [];

      properties.forEach((prop) => {
        const c = getPropertyCoordinates(prop);
        if (c && c.lat && c.lng) {
          allCoords.push(c);
          if (c.lat >= 14.30 && c.lat <= 14.80 && c.lng >= 120.85 && c.lng <= 121.25) {
            metroManilaCoords.push(c);
          }
        }
      });

      if (allCoords.length === 0) return;

      const coordsToFit =
        preferMetroManilaCluster &&
        !singlePropertyMode &&
        metroManilaCoords.length >= 2 &&
        metroManilaCoords.length >= allCoords.length * 0.5
          ? metroManilaCoords
          : allCoords;

      if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
        if (singlePropertyMode || coordsToFit.length === 1) {
          const c = coordsToFit[0];
          googleMapInstanceRef.current.setCenter({ lat: c.lat, lng: c.lng });
          googleMapInstanceRef.current.setZoom(16);
          return;
        }
        const bounds = new window.google.maps.LatLngBounds();
        coordsToFit.forEach((c) => {
          bounds.extend(new window.google.maps.LatLng(c.lat, c.lng));
        });
        googleMapInstanceRef.current.fitBounds(bounds, 48);
      } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
        const latLngs = coordsToFit.map((c) => [c.lat, c.lng]);
        if (singlePropertyMode || latLngs.length === 1) {
          leafletMapInstanceRef.current.setView(latLngs[0], 16);
        } else {
          leafletMapInstanceRef.current.fitBounds(latLngs, {
            padding: [48, 48],
            maxZoom: 16,
          });
        }
      }
    },
    [properties, mapEngine, singlePropertyMode]
  );

  const handleFitAll = useCallback(() => {
    fitPropertiesBounds(false);
  }, [fitPropertiesBounds]);

  // Fit pins automatically on initial load or non-viewport filter change
  useEffect(() => {
    if (targetDistrict && targetDistrict.name && targetDistrict.name !== 'All Metro Manila') return;

    if (properties.length > 0 && (mapEngine === 'google' || mapEngine === 'leaflet')) {
      fitPropertiesBounds(true);
    }
  }, [properties.length, mapEngine, fitPropertiesBounds, targetDistrict]);

  // Navigate to selected district preset or geocoded location
  useEffect(() => {
    if (!targetDistrict || !targetDistrict.lat || !targetDistrict.lng) return;

    if (targetDistrict.name === 'All Metro Manila' && properties.length > 0) {
      fitPropertiesBounds(true);
      return;
    }

    const zoom = targetDistrict.zoom || 14;
    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: targetDistrict.lat, lng: targetDistrict.lng });
      googleMapInstanceRef.current.setZoom(zoom);
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.setView([targetDistrict.lat, targetDistrict.lng], zoom, {
        animate: true,
      });
    }
  }, [targetDistrict, mapEngine, properties.length, fitPropertiesBounds]);

  // Center and zoom on selected property when selected from card list or pin click
  useEffect(() => {
    if (!selectedPropertyId) return;
    const prop = properties.find((p) => String(p.id) === String(selectedPropertyId));
    if (!prop) return;
    const c = getPropertyCoordinates(prop);
    if (!c || !c.lat || !c.lng) return;

    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: c.lat, lng: c.lng });
      const currentZoom = googleMapInstanceRef.current.getZoom?.() || 14;
      if (currentZoom < 16) {
        googleMapInstanceRef.current.setZoom(16);
      }
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      const currentZoom =
        typeof leafletMapInstanceRef.current.getZoom === 'function'
          ? leafletMapInstanceRef.current.getZoom()
          : 14;
      const nextZoom = Math.max(currentZoom || 14, 16);
      if (typeof leafletMapInstanceRef.current.setView === 'function') {
        leafletMapInstanceRef.current.setView([c.lat, c.lng], nextZoom, { animate: true });
      } else if (typeof leafletMapInstanceRef.current.panTo === 'function') {
        leafletMapInstanceRef.current.panTo([c.lat, c.lng], { animate: true });
      }
    }
  }, [selectedPropertyId, properties, mapEngine]);

  // Handle explicit recenter trigger (ONLY when recenterTrigger prop actually changes)
  useEffect(() => {
    if (recenterTrigger == null || recenterTrigger === 0) return;
    if (recenterTrigger === prevRecenterTriggerRef.current) return;
    prevRecenterTriggerRef.current = recenterTrigger;

    // Recalibrate map dimensions when visibility or recenter trigger toggles
    if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      if (typeof leafletMapInstanceRef.current.invalidateSize === 'function') {
        leafletMapInstanceRef.current.invalidateSize();
      }
    } else if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
      window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
    }

    if (selectedProperty) {
      const c = getPropertyCoordinates(selectedProperty);
      if (c && c.lat && c.lng) {
        const targetZoom = singlePropertyMode ? 16 : 15;
        if (mapEngine === 'google' && googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo({ lat: c.lat, lng: c.lng });
          googleMapInstanceRef.current.setZoom(targetZoom);
        } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
          leafletMapInstanceRef.current.setView([c.lat, c.lng], targetZoom, { animate: true });
        }
        return;
      }
    }

    if (properties.length > 0) {
      fitPropertiesBounds(true);
    }
  }, [recenterTrigger, selectedProperty, mapEngine, singlePropertyMode, properties.length, fitPropertiesBounds]);

  // Handle container resize (e.g. mobile tab switch from 'list' to 'map' or window viewport change)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let resizeTimer = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
              leafletMapInstanceRef.current.invalidateSize();
            } else if (mapEngine === 'google' && googleMapInstanceRef.current && window.google) {
              window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
            }
          }, 100);
        }
      }
    });

    observer.observe(container);

    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [mapEngine]);

  // Manual zoom control handlers
  const handleZoomIn = () => {
    if (lockZoom) return;
    if (mapEngine === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(Math.min(21, googleMapInstanceRef.current.getZoom() + 1));
    } else if (mapEngine === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.zoomIn();
    } else {
      setEmbedZoom((prev) => Math.min(21, prev + 1));
    }
  };

  const handleZoomOut = () => {
    if (lockZoom) return;
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
        className={`relative isolate z-0 w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-md">
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[36px] transition-colors cursor-pointer ${embedLayer === layer.id
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
      className={`relative isolate z-0 w-full h-full ${singlePropertyMode ? 'min-h-0' : 'min-h-[420px]'} bg-[#F8FAFC] overflow-hidden select-none ${className}`}
    >
      {/* Interactive Map Viewport Container */}
      <div ref={containerRef} className="w-full h-full" tabIndex={0} aria-label="Interactive Google Property Map" />

      {/* Floating Bauhaus Glass Minimal HUD Dock (Narrow & Compact) */}
      {showControls && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 p-1 bg-white/95 backdrop-blur-md rounded-full border border-[#E2E8F0] shadow-md max-w-[calc(100%-1rem)] overflow-x-auto no-scrollbar">
          {/* Layer Switcher */}
          <button
            type="button"
            onClick={() => setActiveLayer('vector')}
            aria-label="Street"
            title="Street View / Roadmap"
            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${activeLayer === 'vector'
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
            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${activeLayer === 'satellite'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            Satellite
          </button>

          <span className="w-px h-3.5 bg-slate-200 mx-0.5 shrink-0" />

          {/* Fit All Listings Action */}
          <button
            type="button"
            onClick={handleFitAll}
            title="Fit All Property Listings into View"
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 hover:text-[#0F766E] hover:bg-teal-50/70 rounded-full transition-colors cursor-pointer uppercase tracking-wider shrink-0"
          >
            <span className="material-symbols-outlined text-[13px]">crop_free</span>
            <span>Fit All</span>
          </button>
        </div>
      )}

      {/* Floating Selected Residence Preview Card (Interactive Mode) */}
      {selectedProperty && !singlePropertyMode && dismissedPreviewId !== selectedProperty.id && (
        <div
          data-testid="map-selected-property-card"
          className="absolute bottom-4 left-4 z-20 w-[calc(100%-5rem)] max-w-sm pointer-events-auto"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block text-[11px] font-mono text-[#0F766E] bg-[#CCFBF1]/70 border border-teal-200 px-2 py-0.5 rounded-sm font-semibold tabular-nums">
                  {formatPriceBadge(selectedProperty.price_raw || selectedProperty.price || 0, selectedProperty.currency)}
                </span>
                <h4 className="text-sm font-semibold text-[#1E293B] mt-1 line-clamp-1">
                  {selectedProperty.title || selectedProperty.name || 'Luxury Residence'}
                </h4>
                <p className="text-xs text-[#64748B] truncate mt-0.5">
                  {[
                    selectedProperty.subdivision || selectedProperty.location?.subdivisionName,
                    selectedProperty.city || selectedProperty.location?.city,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                    (typeof selectedProperty.location === 'string' ? selectedProperty.location : '') ||
                    'Metro Manila'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Dismiss property preview"
                onClick={() => setDismissedPreviewId(selectedProperty.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer shrink-0 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => navigate(`/properties/${selectedProperty.id}`)}
                className="flex-1 h-9 px-3 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>View Residence</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Manual Zoom Controls */}
      {!lockZoom && (
        <div
          data-testid="manual-zoom-controls"
          className="absolute bottom-20 right-4 sm:right-6 z-20 flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-1 pointer-events-auto"
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
      )}
    </div>
  );
}
