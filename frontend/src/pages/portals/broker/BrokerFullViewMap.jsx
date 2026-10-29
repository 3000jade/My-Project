import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  IconArrowLeft,
  IconMapPin,
  IconSearch,
  IconCheck,
  IconCrosshair,
  IconPlus,
  IconMinus,
  IconCopy,
  IconCurrentLocation,
  IconX,
  IconLayersLinked,
  IconRuler2
} from '@tabler/icons-react';
import { mapsService } from '../../../services/mapsService';
import { PHILIPPINE_BASEMAPS } from '../../../mockData/mockMapDistricts';

// Extended basemap definitions with terrain
const MAP_LAYERS = {
  ...PHILIPPINE_BASEMAPS,
  'opentopo-terrain': {
    id: 'opentopo-terrain',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxZoom: 17
  }
};

export default function BrokerFullViewMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Read initial coordinates and metadata from URL or sessionStorage
  const paramLat = parseFloat(searchParams.get('lat'));
  const paramLng = parseFloat(searchParams.get('lng'));
  const paramAddress = searchParams.get('address') || '';
  const paramTitle = searchParams.get('title') || 'Property Listing';
  const returnUrl = searchParams.get('returnUrl') || '/broker/properties/create';

  const defaultLat = !isNaN(paramLat) ? paramLat : 14.5547;
  const defaultLng = !isNaN(paramLng) ? paramLng : 121.0503;

  const [currentLat, setCurrentLat] = useState(defaultLat);
  const [currentLng, setCurrentLng] = useState(defaultLng);
  const [address, setAddress] = useState(paramAddress);
  const [resolvedCity, setResolvedCity] = useState('');
  const [resolvedBarangay, setResolvedBarangay] = useState('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Map state
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('osm-standard');
  const [radiusKm, setRadiusKm] = useState(0); // 0 = off, 1, 3, 5
  const [copied, setCopied] = useState(false);

  // Search & Geocoding Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address predictive autocomplete via mapsService
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await mapsService.autocomplete(q, 'ph');
        setSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
      } catch (err) {
        console.warn('[BrokerFullViewMap] Autocomplete error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reverse geocode whenever coordinates change
  const performReverseGeocode = useCallback(async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const geo = await mapsService.reverse(lat, lng);
      if (geo && geo.formattedAddress) {
        setAddress(geo.formattedAddress);
        if (geo.city) setResolvedCity(geo.city);
        if (geo.subdivision) setResolvedBarangay(geo.subdivision);
      }
    } catch (err) {
      console.warn('[BrokerFullViewMap] Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Update pin position and pan map
  const updatePosition = useCallback((lat, lng, shouldPan = true) => {
    const validLat = Number(lat);
    const validLng = Number(lng);
    if (isNaN(validLat) || isNaN(validLng)) return;

    setCurrentLat(validLat);
    setCurrentLng(validLng);

    if (markerRef.current) {
      markerRef.current.setLatLng([validLat, validLng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([validLat, validLng]);
    }
    if (shouldPan && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([validLat, validLng]);
    }

    performReverseGeocode(validLat, validLng);
  }, [performReverseGeocode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Custom Luxury Coral/Teal Pin Marker
    const customPinIcon = L.divIcon({
      className: 'custom-pinpoint-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing">
          <div class="w-10 h-10 rounded-full bg-[#0F766E]/20 animate-ping absolute -top-1"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0F766E] to-[#115E59] border-2 border-white shadow-xl flex items-center justify-center text-white relative z-10 transition-transform hover:scale-110">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="w-2.5 h-2.5 bg-[#FF6B6B] rounded-full border-2 border-white absolute -bottom-1 shadow-md"></div>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44]
    });

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
    });

    // Default Tile Layer
    const layerDef = MAP_LAYERS[activeLayer] || MAP_LAYERS['osm-standard'];
    const tileLayer = L.tileLayer(layerDef.url, {
      attribution: layerDef.attribution,
      maxZoom: layerDef.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Draggable Marker
    const marker = L.marker([currentLat, currentLng], {
      icon: customPinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      updatePosition(lat, lng, false);
    });

    markerRef.current = marker;

    // Click anywhere on map to reposition pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updatePosition(lat, lng, true);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Sync Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const layerDef = MAP_LAYERS[activeLayer] || MAP_LAYERS['osm-standard'];

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(layerDef.url, {
      attribution: layerDef.attribution,
      maxZoom: layerDef.maxZoom,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Sync Radius Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (radiusKm <= 0) {
      if (circleRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      return;
    }

    const radiusMeters = radiusKm * 1000;
    if (circleRef.current) {
      circleRef.current.setLatLng([currentLat, currentLng]);
      circleRef.current.setRadius(radiusMeters);
    } else {
      const circle = L.circle([currentLat, currentLng], {
        radius: radiusMeters,
        color: '#0F766E',
        fillColor: '#0F766E',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(mapInstanceRef.current);
      circleRef.current = circle;
    }
  }, [radiusKm, currentLat, currentLng]);

  // Handler: Select autocomplete suggestion
  const handleSelectSuggestion = async (item) => {
    setShowSuggestions(false);
    setSearchQuery(item.description || item.mainText || '');
    if (item.latitude && item.longitude) {
      updatePosition(item.latitude, item.longitude, true);
    } else {
      try {
        const geo = await mapsService.geocode(item.description || item.mainText, 'ph');
        if (geo && geo.latitude && geo.longitude) {
          updatePosition(geo.latitude, geo.longitude, true);
        }
      } catch (err) {
        console.warn('[BrokerFullViewMap] Geocode suggestion error:', err);
      }
    }
  };

  // Handler: Browser Geolocation "Locate Me"
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updatePosition(latitude, longitude, true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
        }
      },
      (err) => {
        alert('Could not retrieve device location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handler: Copy coordinates
  const handleCopyCoordinates = () => {
    const text = `${currentLat.toFixed(7)}, ${currentLng.toFixed(7)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handler: Apply Coordinates & Return to Listing Studio
  const handleApplyAndReturn = () => {
    try {
      // 1. Store updated coordinates for the parent studio to absorb
      sessionStorage.setItem('broker_listing_updated_coords', JSON.stringify({
        lat: currentLat.toFixed(7),
        lng: currentLng.toFixed(7),
        address: address,
        city: resolvedCity,
        barangay: resolvedBarangay
      }));

      // 2. Also update existing draft object in sessionStorage if present
      const draftRaw = sessionStorage.getItem('broker_listing_create_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.formData) {
          draft.formData.latitude = currentLat.toFixed(7);
          draft.formData.longitude = currentLng.toFixed(7);
          if (address) draft.formData.address = address;
          if (resolvedCity) draft.formData.city = resolvedCity;
          if (resolvedBarangay) draft.formData.barangay = resolvedBarangay;
          draft.currentStep = 2;
          sessionStorage.setItem('broker_listing_create_draft', JSON.stringify(draft));
        }
      }
    } catch (e) {
      console.warn('[BrokerFullViewMap] SessionStorage save error:', e);
    }

    // Navigate back to studio with step=2
    navigate(`${returnUrl}?step=2`);
  };

  // Handler: Cancel / Go Back
  const handleCancel = () => {
    navigate(`${returnUrl}?step=2`);
  };

  return (
    <div
      data-testid="broker-fullview-map-page"
      className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-900 select-none font-sans"
    >
      {/* Top Header Control Plinth */}
      <header className="shrink-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between gap-3 z-30 shadow-xs">
        {/* Left: Back button & Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleCancel}
            title="Return to Listing Studio"
            className="h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <IconArrowLeft size={16} className="text-[#0F766E]" />
            <span className="hidden sm:inline">Back to Studio</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#1E293B] truncate">
                {paramTitle}
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]"></span>
                Full View Pinpoint Studio
              </span>
            </div>
            <p className="text-xs text-[#64748B] truncate mt-0.5 flex items-center gap-1">
              <IconMapPin size={13} className="text-[#0F766E] shrink-0" />
              <span>{address || 'Position the pin or search an address below'}</span>
              {isReverseGeocoding && (
                <span className="text-[10px] text-[#0F766E] font-medium animate-pulse ml-1">
                  Resolving address...
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Live Coordinates & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Coordinates Chip */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-700">
            <span>LAT: <strong className="text-[#0F766E]">{currentLat.toFixed(6)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>LNG: <strong className="text-[#0F766E]">{currentLng.toFixed(6)}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleApplyAndReturn}
            data-testid="apply-coordinates-btn"
            className="h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow cursor-pointer active:scale-95"
          >
            <IconCheck size={16} />
            <span>Apply Coordinates to Listing</span>
          </button>
        </div>
      </header>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {/* Top Floating Search Bar */}
        <div
          ref={searchContainerRef}
          className="absolute top-4 left-4 right-4 sm:right-auto sm:w-96 z-20"
        >
          <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md">
            <span className="pl-3.5 text-slate-400">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, district, landmark..."
              className="w-full h-11 px-3 text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <IconX size={16} />
              </button>
            )}
            {isSearching && (
              <span className="pr-3 text-[#0F766E] animate-spin">
                <IconCrosshair size={16} />
              </span>
            )}
          </div>

          {/* Autocomplete Flyout */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 z-30">
              {suggestions.map((item, idx) => (
                <div
                  key={item.placeId || idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 text-xs text-slate-700 hover:bg-teal-50/70 hover:text-[#0F766E] cursor-pointer flex items-start gap-2.5 transition-colors"
                >
                  <IconMapPin size={15} className="text-[#0F766E] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.mainText || item.description}</p>
                    {item.secondaryText && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.secondaryText}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          data-testid="fullview-leaflet-canvas"
          className="w-full h-full"
        />

        {/* Floating Right Plinth: Layers & Zoom Tools */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Layer Selector Plinth */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-1.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center gap-1">
              <IconLayersLinked size={12} />
              <span>Layers</span>
            </span>
            {Object.values(MAP_LAYERS).map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayer(layer.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  activeLayer === layer.id
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Zoom & Positioning Controls */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-1 flex flex-col divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconPlus size={18} />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconMinus size={18} />
            </button>
            <button
              type="button"
              onClick={() => updatePosition(currentLat, currentLng, true)}
              title="Center on Pin"
              aria-label="Center on Pin"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconCrosshair size={18} />
            </button>
            <button
              type="button"
              onClick={handleLocateMe}
              title="Locate Device Location (GPS)"
              aria-label="Locate Device Location"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconCurrentLocation size={18} />
            </button>
          </div>

          {/* Radius Overlay Tool */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-1.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center gap-1">
              <IconRuler2 size={12} />
              <span>Radius</span>
            </span>
            {[
              { val: 0, label: 'Off' },
              { val: 1, label: '1 km' },
              { val: 3, label: '3 km' },
              { val: 5, label: '5 km' }
            ].map(r => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRadiusKm(r.val)}
                className={`px-2 py-1 rounded text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  radiusKm === r.val
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Bottom Left: Coordinate Inspector & Copy */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-3 max-w-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <IconMapPin size={14} className="text-[#0F766E]" />
              <span>Pinpoint Coordinates</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-[#0F766E] border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <IconCopy size={11} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-0.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={currentLat}
                onChange={(e) => updatePosition(parseFloat(e.target.value) || 0, currentLng, false)}
                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-0.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={currentLng}
                onChange={(e) => updatePosition(currentLat, parseFloat(e.target.value) || 0, false)}
                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">
            Tip: Click anywhere or drag the teal pin on the map to set exact property placement.
          </p>
        </div>
      </div>
    </div>
  );
}
