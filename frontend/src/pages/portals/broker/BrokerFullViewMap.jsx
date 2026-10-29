import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconLayersLinked
} from '@tabler/icons-react';
import { mapsService } from '../../../services/mapsService';

// Official Google Maps Layer Options
const GOOGLE_MAP_LAYERS = [
  { id: 'm', label: 'Roadmap', description: 'Standard Google vector map' },
  { id: 'k', label: 'Satellite', description: 'High-res satellite imagery' },
  { id: 'h', label: 'Hybrid', description: 'Satellite with streets & labels' },
  { id: 'p', label: 'Terrain', description: 'Topographical elevation map' },
];

export default function BrokerFullViewMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  // Google Maps state
  // 'm' = Roadmap, 'k' = Satellite, 'h' = Hybrid, 'p' = Terrain
  const [mapType, setMapType] = useState('m');
  const [zoomLevel, setZoomLevel] = useState(16);
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

  // Update pin position
  const updatePosition = useCallback((lat, lng) => {
    const validLat = Number(lat);
    const validLng = Number(lng);
    if (isNaN(validLat) || isNaN(validLng)) return;

    setCurrentLat(validLat);
    setCurrentLng(validLng);
    performReverseGeocode(validLat, validLng);
  }, [performReverseGeocode]);

  // Construct official Google Maps Embed URL
  const googleMapsEmbedUrl = useMemo(() => {
    const lat = currentLat.toFixed(6);
    const lng = currentLng.toFixed(6);
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${zoomLevel}&output=embed`;
  }, [currentLat, currentLng, mapType, zoomLevel]);

  // Handler: Select autocomplete suggestion
  const handleSelectSuggestion = async (item) => {
    setShowSuggestions(false);
    setSearchQuery(item.description || item.mainText || '');
    if (item.latitude && item.longitude) {
      updatePosition(item.latitude, item.longitude);
    } else {
      try {
        const geo = await mapsService.geocode(item.description || item.mainText, 'ph');
        if (geo && geo.latitude && geo.longitude) {
          updatePosition(geo.latitude, geo.longitude);
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
        updatePosition(latitude, longitude);
        setZoomLevel(17);
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
                Google Maps Pinpoint Studio
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
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-100">
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

        {/* Official Google Maps Render Engine */}
        <div
          data-testid="fullview-google-map-canvas"
          className="w-full h-full"
        >
          <iframe
            key={`${currentLat.toFixed(6)}-${currentLng.toFixed(6)}-${mapType}-${zoomLevel}`}
            title="Google Maps Full View Pinpoint"
            src={googleMapsEmbedUrl}
            className="w-full h-full border-0 select-none"
            loading="lazy"
            allowFullScreen={false}
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Floating Right Plinth: Layers & Zoom Tools */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Layer Selector Plinth */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-1.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center gap-1">
              <IconLayersLinked size={12} />
              <span>Google Layers</span>
            </span>
            {GOOGLE_MAP_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setMapType(layer.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  mapType === layer.id
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
              onClick={() => setZoomLevel((prev) => Math.min(20, prev + 1))}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconPlus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(10, prev - 1))}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <IconMinus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(16)}
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
                onChange={(e) => updatePosition(parseFloat(e.target.value) || 0, currentLng)}
                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-0.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={currentLng}
                onChange={(e) => updatePosition(currentLat, parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">
            Official Google Maps pinpoint render. Adjust coordinates or search an address to reposition.
          </p>
        </div>
      </div>
    </div>
  );
}
