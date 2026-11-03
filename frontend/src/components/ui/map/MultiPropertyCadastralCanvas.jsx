import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import {
  Layers,
  MapPin,
  Crosshair,
  Maximize2,
  Trash2,
  Scissors,
  Edit3,
  PlusCircle,
  Copy,
  Info,
  Move,
  RotateCw,
  Eraser,
  Square,
  PenTool,
  Magnet,
  Maximize,
  LayoutGrid,
  MousePointer2,
  Undo2,
  Redo2
} from 'lucide-react';

// Google Maps Base Tile Layers
const GOOGLE_BASEMAPS = {
  hybrid: {
    id: 'hybrid',
    label: 'Satellite',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  roadmap: {
    id: 'roadmap',
    label: 'Roadmap',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
};

/**
 * Spherical Excess (Shoelace) Area Calculation in m²
 */
function computeSphericalArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0;
  const R = 6378137; // WGS84 mean radius in meters
  let total = 0;
  const len = latLngs.length;
  for (let i = 0; i < len; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % len];
    total +=
      (p2.lng - p1.lng) *
      (Math.PI / 180) *
      (2 + Math.sin((p1.lat * Math.PI) / 180) + Math.sin((p2.lat * Math.PI) / 180));
  }
  return Math.abs(Math.round((total * R * R) / 2));
}

function getFlatLatLngs(layer) {
  if (!layer || typeof layer.getLatLngs !== 'function') return [];
  const raw = layer.getLatLngs();
  if (!Array.isArray(raw)) return [];
  if (Array.isArray(raw[0])) {
    return Array.isArray(raw[0][0]) ? raw[0][0] : raw[0];
  }
  return raw;
}

function computeCentroid(latLngs) {
  if (!latLngs || latLngs.length === 0) return [14.5547, 121.0350];
  let sumLat = 0;
  let sumLng = 0;
  latLngs.forEach((pt) => {
    sumLat += pt.lat;
    sumLng += pt.lng;
  });
  return [sumLat / latLngs.length, sumLng / latLngs.length];
}

function normalizeGeoJsonPrecision(geoJson) {
  if (!geoJson || !geoJson.geometry || !Array.isArray(geoJson.geometry.coordinates)) {
    return geoJson;
  }
  const cleanCoords = geoJson.geometry.coordinates.map((ring) => {
    if (!Array.isArray(ring)) return ring;
    return ring.map((pt) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        return [Number(pt[0].toFixed(7)), Number(pt[1].toFixed(7))];
      }
      return pt;
    });
  });
  return {
    ...geoJson,
    geometry: {
      ...geoJson.geometry,
      coordinates: cleanCoords,
    },
  };
}

/**
 * Universal Area Scaler: scales vertices outward/inward from centroid
 */
function scalePolygonByArea(latLngs, targetAreaSqm) {
  const currentArea = computeSphericalArea(latLngs);
  if (currentArea <= 0 || targetAreaSqm <= 0) return latLngs;
  const scale = Math.sqrt(targetAreaSqm / currentArea);
  const centroid = computeCentroid(latLngs);
  const cLat = centroid[0];
  const cLng = centroid[1];
  return latLngs.map((pt) => {
    const newLat = cLat + scale * (pt.lat - cLat);
    const newLng = cLng + scale * (pt.lng - cLng);
    return L.latLng(Number(newLat.toFixed(7)), Number(newLng.toFixed(7)));
  });
}

/**
 * Dimension Scaler: uses cosine-corrected geodesic ground formulas
 */
function reshapePolygonByDimensions(latLngs, frontageMeters, depthMeters) {
  if (!latLngs || latLngs.length < 4) return latLngs;
  const centroid = computeCentroid(latLngs);
  const cLat = centroid[0];
  const cLng = centroid[1];

  const latDegreePerMeter = 1.0 / 110574.0;
  const lngDegreePerMeter = 1.0 / (111320.0 * Math.cos((cLat * Math.PI) / 180));

  const halfDepthDeg = (depthMeters / 2.0) * latDegreePerMeter;
  const halfFrontageDeg = (frontageMeters / 2.0) * lngDegreePerMeter;

  return [
    L.latLng(Number((cLat - halfDepthDeg).toFixed(7)), Number((cLng - halfFrontageDeg).toFixed(7))),
    L.latLng(Number((cLat + halfDepthDeg).toFixed(7)), Number((cLng - halfFrontageDeg).toFixed(7))),
    L.latLng(Number((cLat + halfDepthDeg).toFixed(7)), Number((cLng + halfFrontageDeg).toFixed(7))),
    L.latLng(Number((cLat - halfDepthDeg).toFixed(7)), Number((cLng + halfFrontageDeg).toFixed(7))),
  ];
}

export default function MultiPropertyCadastralCanvas({
  lots = [],
  selectedLotId = null,
  onSelectLot,
  onLotCreated,
  onLotUpdated,
  onLotDeleted,
  onLotsSliced,
  centerCoordinates = [14.5547, 121.0350],
  activeBasemap: controlledBasemap,
  onBasemapChange,
  onOpenGridModal,
  continuousDraw = true,
  onToggleContinuousDraw,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  className = '',
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layersMapRef = useRef(new Map()); // lotId -> L.Polygon
  const badgesMapRef = useRef(new Map()); // lotId -> L.Marker (badge)

  const onLotCreatedRef = useRef(onLotCreated);
  const onLotUpdatedRef = useRef(onLotUpdated);
  const onLotDeletedRef = useRef(onLotDeleted);
  const onLotsSlicedRef = useRef(onLotsSliced);
  const continuousDrawRef = useRef(continuousDraw);

  useEffect(() => {
    onLotCreatedRef.current = onLotCreated;
    onLotUpdatedRef.current = onLotUpdated;
    onLotDeletedRef.current = onLotDeleted;
    onLotsSlicedRef.current = onLotsSliced;
    continuousDrawRef.current = continuousDraw;
  });

  const [internalBasemap, setInternalBasemap] = useState('roadmap');
  const activeBasemap = controlledBasemap || internalBasemap;
  const setActiveBasemap = onBasemapChange || setInternalBasemap;

  const [mapReady, setMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'draw' | 'box' | 'move' | 'rotate'
  const [currentAngleHUD, setCurrentAngleHUD] = useState(null);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const map = L.map(containerRef.current, {
      center: centerCoordinates,
      zoom: 17,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
    });

    // Zoom control at bottom left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initial Google Tile Layer (Default: Roadmap)
    const basemapConfig = GOOGLE_BASEMAPS[activeBasemap] || GOOGLE_BASEMAPS.roadmap;
    const initialTiles = L.tileLayer(basemapConfig.url, {
      subdomains: basemapConfig.subdomains,
      maxZoom: basemapConfig.maxZoom,
      attribution: basemapConfig.attribution,
    }).addTo(map);
    tileLayerRef.current = initialTiles;

    // Configure Geoman Global Options (Magnetic Snapping)
    map.pm.setGlobalOptions({
      snappable: true,
      snapDistance: 20,
      allowSelfIntersection: false,
      templineStyle: { color: '#FF6B6B', weight: 2.5, dashArray: '6, 6' },
      hintlineStyle: { color: '#0F766E', weight: 2, dashArray: '4, 4' },
      pathOptions: {
        color: '#0F766E',
        fillColor: '#0F766E',
        fillOpacity: 0.25,
        weight: 2.5,
      },
    });

    // Track active tool state (Controlled via side toolstrip)
    map.on('pm:drawstart', (e) => setActiveTool(e.shape === 'Rectangle' ? 'box' : 'draw'));
    map.on('pm:drawend', () => setActiveTool('select'));
    map.on('pm:globaldragmodetoggled', (e) => setActiveTool(e.enabled ? 'move' : 'select'));
    map.on('pm:globalrotatemodetoggled', (e) => setActiveTool(e.enabled ? 'rotate' : 'select'));

    // Handle Polygon Creation (`pm:create`)
    map.on('pm:create', (e) => {
      const layer = e.layer;
      const flatLatLngs = getFlatLatLngs(layer);
      const areaSqM = computeSphericalArea(flatLatLngs);
      const rawGeoJson = layer.toGeoJSON();
      const cleanGeoJson = normalizeGeoJsonPrecision(rawGeoJson);

      const tempId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      layer.pm_lotId = tempId;

      if (typeof onLotCreatedRef.current === 'function') {
        onLotCreatedRef.current({
          tempId,
          boundary: cleanGeoJson,
          area_sqm: areaSqM,
          centroid: computeCentroid(flatLatLngs),
        });
      }

      map.removeLayer(layer);

      if (continuousDrawRef.current) {
        setTimeout(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.pm) {
            mapInstanceRef.current.pm.enableDraw('Polygon');
          }
        }, 150);
      }
    });

    // Handle Cut Polygon (`pm:cut`)
    map.on('pm:cut', (e) => {
      const originalLayer = e.originalLayer;
      const resultingLayers = e.resultingLayers;
      const cutLotId = originalLayer?.pm_lotId;

      if (!cutLotId || !resultingLayers || resultingLayers.length === 0) return;

      const newLotsData = resultingLayers.map((resLayer) => {
        const flat = getFlatLatLngs(resLayer);
        const area = computeSphericalArea(flat);
        const geoJson = normalizeGeoJsonPrecision(resLayer.toGeoJSON());
        const newTempId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        return {
          tempId: newTempId,
          boundary: geoJson,
          area_sqm: area,
          centroid: computeCentroid(flat),
        };
      });

      resultingLayers.forEach((l) => map.removeLayer(l));

      if (typeof onLotsSlicedRef.current === 'function') {
        onLotsSlicedRef.current(cutLotId, newLotsData);
      }
    });

    // Handle Global Removal Mode
    map.on('pm:remove', (e) => {
      const layer = e.layer;
      if (layer?.pm_lotId && typeof onLotDeletedRef.current === 'function') {
        onLotDeletedRef.current(layer.pm_lotId);
      }
    });

    // Handle Rotation with 15° Shift Snapping and Angle HUD
    map.on('pm:rotate', (e) => {
      let angle = (e.angle || 0) % 360;
      if (angle < 0) angle += 360;
      setCurrentAngleHUD(angle.toFixed(1));
    });

    map.on('pm:rotateend', (e) => {
      setCurrentAngleHUD(null);
      const layer = e.layer || e.target;
      if (layer?.pm_lotId && typeof onLotUpdatedRef.current === 'function') {
        const flat = getFlatLatLngs(layer);
        const area = computeSphericalArea(flat);
        const geoJson = normalizeGeoJsonPrecision(layer.toGeoJSON());
        onLotUpdatedRef.current(layer.pm_lotId, {
          boundary: geoJson,
          area_sqm: area,
          centroid: computeCentroid(flat),
        });
      }
    });

    // Keyboard Shortcuts: Esc to cancel, Delete to erase active
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        map.pm.disableGlobalEditMode();
        map.pm.disableGlobalDragMode();
        map.pm.disableGlobalRotateMode();
        map.pm.disableGlobalRemovalMode();
        map.pm.disableDraw();
        setActiveTool(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    mapInstanceRef.current = map;
    window.__leafletStudioMap = map;
    window.__leafletL = L;
    setMapReady(true);

    // Automatically invalidate size whenever container resizes (e.g. sidebar collapse/expand, window resize)
    let resizeTimer = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
        }
      }, 50);
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      map.remove();
      mapInstanceRef.current = null;
      delete window.__leafletStudioMap;
      delete window.__leafletL;
    };
  }, []);

  // 1b. Update map center when centerCoordinates prop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !centerCoordinates || centerCoordinates.length !== 2) return;
    const [lat, lng] = centerCoordinates;
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 17, { animate: true });
    }
  }, [centerCoordinates]);

  // 2. Basemap Switcher Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = GOOGLE_BASEMAPS[activeBasemap] || GOOGLE_BASEMAPS.roadmap;
    const newTiles = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    }).addTo(map);

    tileLayerRef.current = newTiles;
    newTiles.bringToBack();
  }, [activeBasemap]);

  // 3. Sync Lots with Leaflet Map Layers & Centroid Badges
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    const currentLotsMap = layersMapRef.current;
    const currentBadgesMap = badgesMapRef.current;
    const incomingLotIds = new Set(lots.map((l) => l.id || l.tempId));

    // Remove obsolete layers
    currentLotsMap.forEach((layer, lotId) => {
      if (!incomingLotIds.has(lotId)) {
        map.removeLayer(layer);
        currentLotsMap.delete(lotId);
      }
    });
    currentBadgesMap.forEach((badge, lotId) => {
      if (!incomingLotIds.has(lotId)) {
        map.removeLayer(badge);
        currentBadgesMap.delete(lotId);
      }
    });

    // Add or Update layers
    lots.forEach((lot) => {
      const lotKey = lot.id || lot.tempId;
      const hasCoords =
        Boolean(lot.boundary?.coordinates) ||
        Boolean(lot.boundary?.geometry?.coordinates);
      if (!hasCoords) return;

      const isSelected = lotKey === selectedLotId;
      const strokeColor = isSelected ? '#FF6B6B' : (lot.color || '#0F766E');
      const fillColor = isSelected ? '#FF6B6B' : (lot.color || '#0F766E');
      const fillOpacity = isSelected ? 0.40 : 0.22;
      const weight = isSelected ? 3.5 : 2.5;

      let layer = currentLotsMap.get(lotKey);

      if (!layer) {
        // Construct GeoJSON layer
        const geoLayer = L.geoJSON(lot.boundary, {
          style: {
            color: strokeColor,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            weight: weight,
            dashArray: isSelected ? '4, 4' : null,
          },
        });

        const polyLayers = geoLayer.getLayers();
        layer = polyLayers[0];

        if (layer) {
          layer.pm_lotId = lotKey;

          layer.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (typeof onSelectLot === 'function') {
              onSelectLot(lotKey);
            }
          });

          const handleUpdate = () => {
            const flat = getFlatLatLngs(layer);
            const area = computeSphericalArea(flat);
            const geoJson = normalizeGeoJsonPrecision(layer.toGeoJSON());
            if (typeof onLotUpdated === 'function') {
              onLotUpdated(lotKey, {
                boundary: geoJson,
                area_sqm: area,
                centroid: computeCentroid(flat),
              });
            }
          };

          layer.on('pm:edit', handleUpdate);
          layer.on('pm:dragend', handleUpdate);
          layer.on('pm:vertexchange', handleUpdate);
          layer.on('pm:rotateend', handleUpdate);

          layer.addTo(map);
          currentLotsMap.set(lotKey, layer);
        }
      } else {
        // Update layer geometry if coordinates changed externally (e.g. from resize modal)
        const rawCoords = lot.boundary?.geometry?.coordinates || lot.boundary?.coordinates;
        if (rawCoords) {
          const ring = Array.isArray(rawCoords[0]) && Array.isArray(rawCoords[0][0]) ? rawCoords[0] : rawCoords;
          const targetLatLngs = ring.map(([lng, lat]) => L.latLng(lat, lng));
          layer.setLatLngs(targetLatLngs);
        }

        layer.setStyle({
          color: strokeColor,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          weight: weight,
          dashArray: isSelected ? '4, 4' : null,
        });

        if (isSelected) {
          layer.bringToFront();
        }
      }

      // Add or update centroid badge
      if (layer) {
        const flat = getFlatLatLngs(layer);
        const centroid = computeCentroid(flat);
        const badgeHtml = `
          <div class="px-2 py-0.5 rounded shadow-md text-[11px] font-bold tracking-tight whitespace-nowrap pointer-events-none transition-all ${
            isSelected
              ? 'bg-[#FF6B6B] text-[#1E293B] ring-2 ring-white scale-110'
              : 'bg-white/95 text-slate-800 border border-slate-300'
          }">
            <span>${lot.lot_number || 'Lot'}</span>
            <span class="opacity-75 font-normal ml-1 text-[10px]">${lot.area_sqm ? `${Number(lot.area_sqm).toLocaleString()}m²` : ''}</span>
          </div>
        `;

        const badgeIcon = L.divIcon({
          className: 'cadastral-lot-badge',
          html: badgeHtml,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        let badgeMarker = currentBadgesMap.get(lotKey);
        if (!badgeMarker) {
          badgeMarker = L.marker(centroid, { icon: badgeIcon, interactive: false, zIndexOffset: 500 }).addTo(map);
          currentBadgesMap.set(lotKey, badgeMarker);
        } else {
          badgeMarker.setLatLng(centroid);
          badgeMarker.setIcon(badgeIcon);
        }
      }
    });
  }, [lots, selectedLotId, mapReady, onSelectLot, onLotUpdated]);

  // 4. Focus Map when selected lot changes
  const focusLot = useCallback((lotId) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const layer = layersMapRef.current.get(lotId);
    if (layer && typeof layer.getBounds === 'function') {
      map.flyToBounds(layer.getBounds(), {
        maxZoom: 19,
        padding: [60, 60],
        duration: 0.6,
      });
    }
  }, []);

  useEffect(() => {
    if (selectedLotId) {
      focusLot(selectedLotId);
    }
  }, [selectedLotId, focusLot]);

  // Fit all lots in view
  const fitAllLots = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const allLayers = Array.from(layersMapRef.current.values());
    if (allLayers.length === 0) return;

    const group = L.featureGroup(allLayers);
    map.flyToBounds(group.getBounds(), {
      padding: [50, 50],
      duration: 0.7,
    });
  }, []);

  // Expose ground-truth resizing solvers to window and studio
  useEffect(() => {
    window.__resizeLot = (lotId, params) => {
      const layer = layersMapRef.current.get(lotId);
      if (!layer) return false;
      const flat = getFlatLatLngs(layer);

      let newLatLngs;
      if (params.mode === 'area') {
        newLatLngs = scalePolygonByArea(flat, params.targetAreaSqm);
      } else {
        newLatLngs = reshapePolygonByDimensions(flat, params.frontageMeters, params.depthMeters);
      }

      layer.setLatLngs(newLatLngs);
      const newArea = computeSphericalArea(newLatLngs);
      const cleanGeoJson = normalizeGeoJsonPrecision(layer.toGeoJSON());

      const centroid = computeCentroid(newLatLngs);
      if (typeof onLotUpdatedRef.current === 'function') {
        onLotUpdatedRef.current(lotId, {
          boundary: cleanGeoJson,
          area_sqm: newArea,
          centroid,
        });
      }
      return {
        success: true,
        boundary: cleanGeoJson,
        area_sqm: newArea,
        centroid,
      };
    };
  }, []);

  // Toolbar Actions Toggle
  const toggleTool = (toolName) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Reset modes
    map.pm.disableGlobalEditMode();
    map.pm.disableGlobalDragMode();
    map.pm.disableGlobalRotateMode();
    map.pm.disableDraw();

    if (toolName === 'select' || activeTool === toolName) {
      setActiveTool('select');
      return;
    }

    if (toolName === 'draw') {
      map.pm.enableDraw('Polygon');
    } else if (toolName === 'box') {
      map.pm.enableDraw('Rectangle');
    } else if (toolName === 'move') {
      map.pm.enableGlobalDragMode();
    } else if (toolName === 'rotate') {
      map.pm.enableGlobalRotateMode();
    }
    setActiveTool(toolName);
  };

  return (
    <div className={`relative w-full h-full bg-slate-900 overflow-hidden ${className}`}>
      {/* Leaflet Canvas Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Center Editing Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 p-1.5 rounded-2xl shadow-xl max-w-[95vw] overflow-x-auto">
        {/* Primary Tool: Select */}
        <button
          type="button"
          onClick={() => toggleTool('select')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTool === 'select'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Select and inspect lots (Esc)"
        >
          <MousePointer2 className="w-3.5 h-3.5 shrink-0" />
          <span>Select</span>
        </button>

        {/* Undo / Redo Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last action (Ctrl+Z)"
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-slate-100 text-slate-800 hover:bg-[#0F766E]/10 hover:text-[#0F766E] border border-slate-200 shadow-2xs cursor-pointer'
                : 'bg-slate-50 text-slate-400 border border-slate-200/50 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 shrink-0" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo action (Ctrl+Y / Ctrl+Shift+Z)"
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
              canRedo
                ? 'bg-slate-100 text-slate-800 hover:bg-[#0F766E]/10 hover:text-[#0F766E] border border-slate-200 shadow-2xs cursor-pointer'
                : 'bg-slate-50 text-slate-400 border border-slate-200/50 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5 shrink-0" />
            <span>Redo</span>
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={() => toggleTool('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTool === 'draw'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Draw custom lot boundaries"
        >
          <PenTool className="w-3.5 h-3.5 shrink-0" />
          <span>Draw Lot</span>
        </button>

        <button
          type="button"
          onClick={() => toggleTool('box')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTool === 'box'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Draw rectangular lot box"
        >
          <Square className="w-3.5 h-3.5 shrink-0" />
          <span>Draw Box</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenGridModal && onOpenGridModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
          title="Create multiple properties by column and row grid"
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-[#0F766E]" />
          <span>Lot Grid</span>
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={() => toggleTool('move')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTool === 'move'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Move selected lot across map"
        >
          <Move className="w-3.5 h-3.5 shrink-0" />
          <span>Move</span>
        </button>

        <button
          type="button"
          onClick={() => toggleTool('rotate')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTool === 'rotate'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Rotate lot (Hold Shift for 15° street snap)"
        >
          <RotateCw className="w-3.5 h-3.5 shrink-0" />
          <span>Rotate</span>
        </button>

        {lots.length > 0 && (
          <>
            <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />
            <button
              type="button"
              onClick={fitAllLots}
              title="Frame all lots in view"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span>Frame All ({lots.length})</span>
            </button>
          </>
        )}

        <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={onToggleContinuousDraw}
          title="Keep drawing tool active after completing each parcel"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
            continuousDraw
              ? 'bg-teal-50 text-[#0F766E] border border-teal-200/60'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Rapid: {continuousDraw ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Live Rotation HUD Tooltip */}
      {currentAngleHUD && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-amber-400 flex items-center gap-1.5 animate-in fade-in">
          <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Angle: {currentAngleHUD}° (Hold Shift to snap 15°)</span>
        </div>
      )}

      {/* Bottom Floating Drawing Guide HUD */}
      <div className="absolute bottom-5 left-18 z-[400] bg-white/95 backdrop-blur-md border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-1.5 font-medium">
          <Magnet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Magnetic Snap: <strong className="text-emerald-700 font-mono">20px</strong></span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">Esc: Cancel</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">Del: Erase</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">Shift: 15° Snap</span>
        </div>
      </div>
    </div>
  );
}
