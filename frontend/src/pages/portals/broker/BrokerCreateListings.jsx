import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, 
  FileText, MapPin, Sliders, DollarSign, Sparkles, 
  Image as ImageIcon, Send, Lock, Building2, User, ChevronDown,
  LayoutGrid, List, Search, Building, Home, Trees, Store
} from 'lucide-react';
import { COMMON_PROPERTY_TYPES } from './BrokerPropertyTypeSelect';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, 
  Input, Label, Textarea, Alert, AlertTitle, AlertDescription,
  useToast, Toaster 
} from '../../../components/ui';
import propertyService, { normalizeProperty, toApiPayload } from '../../../services/propertyService';
import agentService from '../../../services/agentService';
import { useAuth } from '../../../context/AuthContext';
import mapsService from '../../../services/mapsService';
import phLocationService from '../../../services/phLocationService';
import driveService from '../../../services/driveService';
import { CadastralLocationPicker } from '../../../components/ui/map';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onPinMoved }) {
  const map = useMapEvents({
    click(e) {
      const nextPos = [e.latlng.lat, e.latlng.lng];
      setPosition(nextPos);
      if (onPinMoved) onPinMoved(nextPos);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          const nextPos = [pos.lat, pos.lng];
          setPosition(nextPos);
          if (onPinMoved) onPinMoved(nextPos);
        },
      }}
      position={position}
    />
  );
}

function SearchableSelect({
  id,
  label,
  required = false,
  value,
  options = [], // [{ value, label, sublabel }]
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  disabledPlaceholder = 'Unavailable',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  // Sync display search term with selected value when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(term) || 
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-[#1E293B] block mb-1.5">
          {label} {required && <span className="text-[#FF6B6B]">*</span>}
        </label>
      )}

      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full h-11 px-3 bg-white border rounded-lg text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
          disabled 
            ? 'bg-slate-50 text-slate-400 border-[#E2E8F0] cursor-not-allowed'
            : isOpen 
              ? 'border-[#0F766E] ring-1 ring-[#0F766E] shadow-2xs' 
              : 'border-[#CBD5E1] hover:border-slate-400 text-[#1E293B] shadow-2xs'
        }`}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {isOpen ? (
            <input
              ref={inputRef}
              id={id}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={selectedOption ? selectedOption.label : placeholder}
              className="w-full bg-transparent outline-none text-xs text-[#1E293B] placeholder-slate-400 font-medium"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
                if (e.key === 'Enter' && filteredOptions.length > 0) {
                  e.preventDefault();
                  handleSelect(filteredOptions[0]);
                }
              }}
            />
          ) : (
            <span className={`block truncate ${selectedOption ? 'text-[#1E293B]' : 'text-slate-400'}`}>
              {disabled ? disabledPlaceholder : selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!disabled && value && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear selection"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#0F766E]' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CBD5E1] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={`px-3 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-teal-50 text-[#0F766E] font-semibold' 
                      : 'hover:bg-slate-50 text-[#1E293B]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
              No matching results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
      <Toaster />
    </div>
  );
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const ROOM_QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['clean'],
  ],
};



export default function BrokerCreateListings({ isDrawer = false, onClose } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || location.state?.propertyType;

  const [availableAgents, setAvailableAgents] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const result = await (agentService.getAgents ? agentService.getAgents() : (agentService.default ? agentService.default.getAgents() : []));
        if (Array.isArray(result)) {
          setAvailableAgents(result);
        }
      } catch (err) {
        setAvailableAgents([]);
      }
    };
    fetchAgents();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    referenceCode: '',
    transaction_type: 'For Sale',
    property_type: (!isEditing && typeParam) ? typeParam : 'houseAndLot',
    property_condition: 'RFO',
    development_condition: '',
    price: '',
    currency: 'PHP',
    price_term: 'Total Contract Price',
    is_negotiable: false,
    location: '',
    city: '',
    address: '',
    subdivision: '',
    subdivision_name: '',
    phase: '',
    block: '',
    lot: '',
    building_name: '',
    tower_name: '',
    floor_level: '',
    unit_number: '',
    barangay: '',
    province: '',
    state_or_province: '',
    state: '',
    region: '',
    region_psgc_code: '',
    province_psgc_code: '',
    city_psgc_code: '',
    barangay_psgc_code: '',
    postal_code: '',
    unparsed_address: '',
    latitude: '',
    longitude: '',
    description: '',
    // Specifications Fields
    bedrooms_total: '3',
    bathrooms_total_integer: '3',
    bathrooms_full: '2',
    bathrooms_half: '1',
    living_area: '',
    living_area_units: 'Square Meters',
    lot_size_area: '',
    lot_size_units: 'Square Meters',
    stories_total: '2',
    parking_total: '2',
    parking_covered: '2',
    parking_open: '0',
    year_built: new Date().getFullYear().toString(),
    architectural_style: 'Modern Contemporary',
    property_condition: 'RFO',
    // Repeatable Room Details Section
    rooms: [
      {
        id: 'room-1',
        room_type: 'Primary Bedroom',
        room_level: '2nd Floor',
        room_length: '',
        room_width: '',
        room_dimensions_units: 'Meters',
        room_features: []
      }
    ],
    // Backward compatibility fallbacks
    bedrooms: '3',
    bathrooms: '3',
    parking: '2',
    floor_area: '',
    floor_area_unit: 'sqm',
    lot_area: '',
    lot_area_unit: 'sqm',
    lot_frontage: '',
    floor_level: '',
    tower_name: '',
    furnishing: 'Fully Furnished',
    status: 'AVAILABLE',
    standard_status: 'Active',
    is_published: true,
    is_featured: false,
    agent_id: '',
    agent_name: '',
    amenities: [],
    interior_features: [],
    exterior_features: [],
    // Broker specific & confidential fields
    listing_id: '',
    cadastralLotId: '',
    commissionSplit: '3.0%',
    lockboxCode: '',
    showingInstructions: '',
    privateNotes: '',
    seller_direct_phone: '',
    // Property Pricing & Terms Fields
    currency: 'PHP',
    rent_frequency: 'Monthly',
    lease_term: '12 Months',
    association_fee: '',
    associationFee: '',
    association_fee_frequency: 'Monthly',
    associationFeeFrequency: 'Monthly',
    association_fee_includes: [],
    security_deposit: '',
    advance_rent: '',
    taxAnnualAmount: '',
    originalListPrice: '',
    blueprintUrl: '',
    virtualTourUrl: ''
  });

  const [displayPrice, setDisplayPrice] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isDirty, setIsDirty] = useState(false);

  // =========================================================================
  // Section 6: Media & Documents Dedicated States
  // =========================================================================
  const [mediaPhotos, setMediaPhotos] = useState([]); // [{ id, imageUrl, displayOrder, isUploading, progress, error, file }]
  const [mediaFloorPlans, setMediaFloorPlans] = useState([]); // [{ id, mediaUrl, shortDescription, orderIndex, mimeType, isUploading, progress, error, file }]
  const [mediaVideos, setMediaVideos] = useState([]); // [{ id, mediaUrl, shortDescription, orderIndex, mimeType, isUploading, progress, error, file, isLink }]
  const [mediaVirtualTours, setMediaVirtualTours] = useState([]); // [{ id, mediaUrl, shortDescription, orderIndex, mimeType }]
  const [mediaDocuments, setMediaDocuments] = useState([]); // [{ id, mediaUrl, shortDescription, orderIndex, mimeType, isUploading, progress, error, file }]
  
  // UI Helpers & Previews
  const [videoSourceMode, setVideoSourceMode] = useState('upload'); // 'upload' | 'link'
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newTourUrl, setNewTourUrl] = useState('');
  const [newTourDesc, setNewTourDesc] = useState('');
  const [previewMediaItem, setPreviewMediaItem] = useState(null); // { type, url, title }
  const [itemToDelete, setItemToDelete] = useState(null); // { type, index, title, onConfirm }

  // Step 7 States: Public Preview, Step Navigation Memory, Submission Status & Errors
  const { user } = useAuth();
  const [returnToReview, setReturnToReview] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [isInternalInfoOpen, setIsInternalInfoOpen] = useState(false);
  const [savedStatusType, setSavedStatusType] = useState('Draft');
  const [createdPropertyId, setCreatedPropertyId] = useState(id && id !== 'new' ? id : null);
  const [submissionError, setSubmissionError] = useState(null);
  const [activeActionLabel, setActiveActionLabel] = useState('');

  // 7 Canonical Form Sections per PROPERTY_LISTING_FORM.md
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // PSGC Geographic Reference States
  const [geoRegions, setGeoRegions] = useState([]);
  const [geoProvinces, setGeoProvinces] = useState([]);
  const [geoCities, setGeoCities] = useState([]);
  const [geoBarangays, setGeoBarangays] = useState([]);
  const [zipSuggestions, setZipSuggestions] = useState([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null); // { type: 'info' | 'warning', message: string }

  // Nominatim Autocomplete & Reverse Geocoding States
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const mapSearchContainerRef = useRef(null);
  const latestPinRequestRef = useRef(0);

  // Unsaved changes alert
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Close address predictions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (mapSearchContainerRef.current && !mapSearchContainerRef.current.contains(e.target)) {
        setShowAddressSuggestions(false);
      }
    }
    if (showAddressSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddressSuggestions]);

  // Debounced address predictive autocomplete via Nominatim backend proxy
  useEffect(() => {
    const query = (mapSearchQuery || '').trim();
    if (query.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const results = await mapsService.autocomplete(query, 'ph');
        setAddressSuggestions(results || []);
        if (results && results.length > 0) {
          setShowAddressSuggestions(true);
        }
      } catch (err) {
        console.error('[BrokerCreateListings] Autocomplete error:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  const handleMapPositionChange = (pos) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, latitude: pos[0].toFixed(7), longitude: pos[1].toFixed(7) }));
  };

  // Reverse geocode when map pin is moved or map is clicked
  const handlePinMoved = async (pos) => {
    setIsDirty(true);
    const requestId = ++latestPinRequestRef.current;
    try {
      const geo = await mapsService.reverse(pos[0], pos[1]);
      if (geo && requestId === latestPinRequestRef.current) {
        setFormData(prev => ({
          ...prev,
          latitude: pos[0].toFixed(7),
          longitude: pos[1].toFixed(7),
        }));
      }
    } catch (err) {
      console.warn('[BrokerCreateListings] Reverse geocode error:', err);
    }
  };

  const mapPosition = formData.latitude && formData.longitude 
    ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] 
    : [14.5995, 120.9842]; // Default Manila

  // Forward geocode address via Nominatim backend proxy
  const handleGeocode = async (e, isSilent = false) => {
    if (e) e.preventDefault();
    const query = mapSearchQuery.trim();

    if (!query) return;
    
    setIsGeocoding(true);
    try {
      const geo = await mapsService.geocode(query, 'ph');
      if (geo && geo.latitude && geo.longitude) {
        setIsDirty(true);
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(geo.latitude).toFixed(7),
          longitude: parseFloat(geo.longitude).toFixed(7),
        }));
      } else {
        if (!isSilent) {
          alert('Could not find location coordinates automatically. Please position the pin manually on the map.');
        }
      }
    } catch (err) {
      console.error('[BrokerCreateListings] Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectAddressSuggestion = (item) => {
    setShowAddressSuggestions(false);
    setIsDirty(true);
    const chosenText = item.formattedAddress || item.description || item.mainText || '';
    setMapSearchQuery(chosenText);
    const nextLat = item.latitude ? parseFloat(item.latitude).toFixed(7) : formData.latitude;
    const nextLng = item.longitude ? parseFloat(item.longitude).toFixed(7) : formData.longitude;
    setFormData(prev => ({
      ...prev,
      latitude: nextLat,
      longitude: nextLng,
    }));
  };

  const handleGoogleMapsUrlPaste = async (e) => {
    const text = e.target.value;
    if (!text) return;

    let lat, lng;
    const pinMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      lat = pinMatch[1];
      lng = pinMatch[2];
    } else {
      const centerMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (centerMatch) {
        lat = centerMatch[1];
        lng = centerMatch[2];
      } else {
        const queryMatch = text.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (queryMatch) {
          lat = queryMatch[1];
          lng = queryMatch[2];
        }
      }
    }

    if (lat && lng) {
      const parsedLat = parseFloat(lat).toFixed(7);
      const parsedLng = parseFloat(lng).toFixed(7);
      
      setIsDirty(true);
      setFormData(prev => ({
        ...prev,
        latitude: parsedLat,
        longitude: parsedLng,
      }));
      e.target.value = '';

      try {
        const geo = await mapsService.reverse(parsedLat, parsedLng);
        if (geo) {
          setFormData(prev => ({
            ...prev,
            latitude: parsedLat,
            longitude: parsedLng,
            ...(geo.formattedAddress && { address: geo.formattedAddress }),
            ...(geo.city && { location: geo.city }),
            ...(geo.subdivision && { subdivision: geo.subdivision }),
            ...(geo.postalCode && { postal_code: geo.postalCode }),
          }));
        }
      } catch (err) {
        console.warn('[BrokerCreateListings] URL auto-fill reverse geocode failed:', err);
      }
    }
  };

  const PROPERTY_TYPE_CONFIGS = COMMON_PROPERTY_TYPES;
  const propertyTypeOptions = COMMON_PROPERTY_TYPES.map(c => c.id);
  const propertyConditionOptions = ['Brand New', 'RFO', 'Pre-selling', 'Newly Renovated', 'Well-Maintained', 'Bare Shell', 'Fitted', 'Needs Renovation / Fixer-Upper'];
  const architecturalStyleOptions = [
    'Modern Contemporary',
    'Brutalist Modernism',
    'Mid-Century Modern',
    'Tropical Modern',
    'Mediterranean / Spanish',
    'Colonial Revival',
    'Minimalist',
    'Industrial',
    'Traditional / Classical',
    'Modern High-Rise',
    'Japanese Contemporary',
    'Nordic Minimalist',
    'Other'
  ];
  const roomTypeOptions = [
    'Primary Bedroom',
    'Bedroom',
    'Guest Room',
    'Living Room',
    'Dining Room',
    'Kitchen',
    'Dirty Kitchen / Auxiliary Kitchen',
    'Family Room',
    'Den / Home Office',
    'Balcony / Terrace',
    'Maid\'s Room',
    'Driver\'s Quarters',
    'Storage Room',
    'Laundry / Utility Room',
    'Entertainment Room',
    'Gym / Fitness Room'
  ];
  const roomLevelOptions = [
    'Ground Floor',
    '2nd Floor',
    '3rd Floor',
    '4th Floor',
    'Basement',
    'Mezzanine',
    'Penthouse Level',
    'Roof Deck',
    'Attic'
  ];

  // Pricing & Terms Constants
  const currencyOptions = [
    { code: 'PHP', symbol: '₱', label: 'PHP (Philippine Peso)' },
    { code: 'USD', symbol: '$', label: 'USD (US Dollar)' },
    { code: 'EUR', symbol: '€', label: 'EUR (Euro)' },
    { code: 'GBP', symbol: '£', label: 'GBP (British Pound)' },
    { code: 'SGD', symbol: 'S$', label: 'SGD (Singapore Dollar)' },
    { code: 'JPY', symbol: '¥', label: 'JPY (Japanese Yen)' }
  ];

  const rentFrequencyOptions = ['Monthly', 'Weekly', 'Yearly'];
  const leaseTermOptions = ['Month to Month', '6 Months', '12 Months', '24 Months'];
  const associationFeeFrequencyOptions = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually', 'One-time'];
  const associationFeeIncludesOptions = [
    '24/7 Security & Guardhouse',
    'Common Area Maintenance',
    'Trash Collection & Disposal',
    'Clubhouse & Amenities Access',
    'Swimming Pool & Gym Maintenance',
    'Landscaping & Grounds Care',
    'Common Area Insurance',
    'Pest Control Services'
  ];

  const stepTitles = [
    'Listing Overview',
    'Location & Address',
    'Property Specifications',
    'Pricing & Terms',
    'Features & Amenities',
    'Photos & Maps',
    'Review & Publish'
  ];

  const interiorAmenitiesList = [
    'Smart Home Automation', 'Wine Cellar', 'Private Elevator',
    'Staff Quarters', 'Walk-in Closet', 'High Ceilings',
    'Chef\'s Kitchen', 'Marble Countertops', 'Home Office', 'Spa / Sauna'
  ];

  const exteriorAmenitiesList = [
    'Private Swimming Pool', 'Garden / Courtyard', 'Covered Garage',
    'Balcony / Terrace', 'Solar Hybrid Power', 'Rooftop Deck', 'Outdoor Gazebo'
  ];

  const communityAmenitiesList = [
    '24/7 Security', 'Gated Community', 'CCTV Surveillance',
    'Lounge / Clubhouse', 'Gym / Fitness Center', 'Pet-Friendly Community', 'Flood-Free Area'
  ];

  useEffect(() => {
    if (typeParam && !isEditing) {
      setFormData(prev => ({
        ...prev,
        property_type: typeParam,
      }));
    }
  }, [typeParam, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchProperty = async () => {
      try {
        const p = await propertyService.getPropertyById(id);
        if (p) {
          setFormData(prev => ({
            ...prev,
            title: p.title || '',
            property_type: p.property_type || p.type || 'House & Lot',
            property_condition: p.property_condition || p.specs?.propertyCondition || 'RFO',
            architectural_style: p.architectural_style || p.architecturalStyle || p.specs?.architecturalStyle || 'Modern Contemporary',
            transaction_type: p.transaction_type || p.specs?.transactionType || 'For Sale',
            price: p.price_raw || p.price || '',
            location: p.location?.city || p.city || p.location || '',
            city: p.location?.city || p.city || p.location || '',
            address: p.location?.address || p.address || '',
            subdivision: p.location?.subdivisionName || p.subdivision_name || '',
            subdivision_name: p.location?.subdivisionName || p.subdivision_name || '',
            building_name: p.location?.buildingName || p.location?.building_name || p.building_name || '',
            barangay: p.location?.barangay || p.barangay || '',
            province: p.location?.stateOrProvince || p.state_or_province || p.province || p.state || '',
            state_or_province: p.location?.stateOrProvince || p.state_or_province || p.province || p.state || '',
            state: p.location?.state || p.state || p.location?.stateOrProvince || p.state_or_province || '',
            region: p.location?.region || p.region || '',
            region_psgc_code: p.location?.region_psgc_code || p.location?.regionPsgcCode || p.region_psgc_code || '',
            province_psgc_code: p.location?.province_psgc_code || p.location?.provincePsgcCode || p.province_psgc_code || '',
            city_psgc_code: p.location?.city_psgc_code || p.location?.cityPsgcCode || p.city_psgc_code || '',
            barangay_psgc_code: p.location?.barangay_psgc_code || p.location?.barangayPsgcCode || p.barangay_psgc_code || '',
            unparsed_address: p.location?.unparsedAddress || p.unparsed_address || '',
            postal_code: p.location?.postalCode || p.postal_code || '',
            latitude: p.location?.coordinates?.lat || p.latitude || '',
            longitude: p.location?.coordinates?.lng || p.longitude || '',
            description: p.publicRemarks || p.description || '',
            status: p.status || 'AVAILABLE',
            standard_status: p.standard_status || p.standardStatus || 'Active',
            is_published: p.is_published !== undefined ? p.is_published : true,
            is_featured: p.is_featured !== undefined ? Boolean(p.is_featured) : (p.isFeatured !== undefined ? Boolean(p.isFeatured) : false),
            amenities: p.features || p.amenities || [],
            interior_features: p.interior_features || p.interiorFeatures || [],
            exterior_features: p.exterior_features || p.exteriorFeatures || [],
            // Specifications
            bedrooms_total: String(p.specs?.bedroomsTotal || p.bedrooms_total || p.specs?.beds || p.beds || '3'),
            bathrooms_total_integer: String(p.specs?.bathroomsTotalInteger || p.bathrooms_total_integer || p.specs?.baths || p.baths || '3'),
            bathrooms_full: String(p.specs?.bathroomsFull || p.bathrooms_full || '2'),
            bathrooms_half: String(p.specs?.bathroomsHalf || p.bathrooms_half || '1'),
            living_area: String(p.specs?.livingArea || p.living_area || p.livingArea || p.sqft || ''),
            living_area_units: p.specs?.livingAreaUnits || p.living_area_units || 'Square Meters',
            lot_size_area: String(p.specs?.lotSizeArea || p.lot_size_area || p.lotSizeArea || ''),
            lot_size_units: p.specs?.lotSizeUnits || p.lot_size_units || 'Square Meters',
            stories_total: String(p.specs?.storiesTotal || p.stories_total || '2'),
            parking_total: String(p.specs?.parkingTotal || p.parking_total || p.parking || '2'),
            parking_covered: String(p.specs?.parkingCovered || p.parking_covered || '2'),
            parking_open: String(p.specs?.parkingOpen || p.parking_open || '0'),
            year_built: String(p.specs?.yearBuilt || p.year_built || new Date().getFullYear()),
            rooms: Array.isArray(p.rooms) && p.rooms.length > 0 ? p.rooms.map((r, idx) => ({
              id: r.id || `room-${idx}-${Date.now()}`,
              room_type: r.room_type || r.roomType || 'Bedroom',
              room_level: r.room_level || r.roomLevel || 'Ground Floor',
              room_length: r.room_length ?? r.roomLength ?? '',
              room_width: r.room_width ?? r.roomWidth ?? '',
              room_dimensions_units: r.room_dimensions_units || r.roomDimensionsUnits || 'Meters',
              room_features: Array.isArray(r.room_features) ? r.room_features : (Array.isArray(r.roomFeatures) ? r.roomFeatures : [])
            })) : [
              {
                id: 'room-1',
                room_type: 'Primary Bedroom',
                room_level: '2nd Floor',
                room_length: '',
                room_width: '',
                room_dimensions_units: 'Meters',
                room_features: []
              }
            ],
            // Pricing & Terms
            currency: p.pricing?.currency || p.currency || p.listPriceCurrency || 'PHP',
            rent_frequency: p.pricing?.rentFrequency || p.rent_frequency || 'Monthly',
            lease_term: p.pricing?.leaseTerm || p.lease_term || '12 Months',
            association_fee: p.pricing?.associationFee ?? p.association_fee ?? p.associationFee ?? '',
            associationFee: p.pricing?.associationFee ?? p.association_fee ?? p.associationFee ?? '',
            association_fee_frequency: p.pricing?.associationFeeFrequency || p.association_fee_frequency || p.associationFeeFrequency || 'Monthly',
            associationFeeFrequency: p.pricing?.associationFeeFrequency || p.association_fee_frequency || p.associationFeeFrequency || 'Monthly',
            association_fee_includes: Array.isArray(p.pricing?.associationFeeIncludes) ? p.pricing.associationFeeIncludes : (Array.isArray(p.association_fee_includes) ? p.association_fee_includes : []),
            security_deposit: p.pricing?.securityDeposit ?? p.security_deposit ?? '',
            advance_rent: p.pricing?.advanceRent ?? p.advance_rent ?? '',
            // Backwards compatibility fallbacks
            floor_area: p.specs?.livingArea || p.livingArea || p.sqft || '',
            lot_area: p.specs?.lotSizeArea || p.lot_size_area || '',
            bedrooms: String(p.specs?.beds || p.bedrooms_total || '3'),
            bathrooms: String(p.specs?.baths || p.bathrooms_total_integer || '3'),
            parking: String(p.specs?.parkingTotal || p.parking || '2'),
            lot_frontage: p.customResoAttributes?.lotFrontage || '',
            floor_level: p.floor_level || '',
            tower_name: p.tower_name || '',
            furnishing: p.furnishing || 'Fully Furnished',
            listing_id: p.listing_id || '',
            cadastralLotId: p.listingKey || p.listing_key || '',
            commissionSplit: p.confidential?.buyerAgencyCompensation || p.buyer_agency_compensation || '3.0%',
            lockboxCode: p.confidential?.lockboxCode || p.lockbox_code || '',
            showingInstructions: p.confidential?.showingInstructions || p.showing_instructions || '',
            privateNotes: p.confidential?.privateRemarks || p.private_remarks || '',
            seller_direct_phone: p.confidential?.sellerDirectPhone || p.seller_direct_phone || '',
            taxAnnualAmount: p.taxAnnualAmount || p.tax_annual_amount || '',
            originalListPrice: p.originalListPrice || p.original_list_price || '',
            blueprintUrl: p.blueprintUrl || '',
            virtualTourUrl: p.virtualTourUrl || ''
          }));
          setDisplayPrice(Number(p.price_raw || p.price || 0).toLocaleString());

          // Populate Section 6: Photos from property_images or images
          if (Array.isArray(p.property_images) && p.property_images.length > 0) {
            setMediaPhotos(p.property_images.map((img, idx) => ({
              id: img.id || `photo-${idx}`,
              imageUrl: img.imageUrl || img.image_url,
              displayOrder: img.displayOrder || img.display_order || (idx + 1),
            })));
          } else if (Array.isArray(p.images) && p.images.length > 0) {
            setMediaPhotos(p.images.map((url, idx) => ({
              id: `photo-${idx}`,
              imageUrl: url,
              displayOrder: idx + 1,
            })));
          }

          // Populate Section 6: Media items (FloorPlan, Video, VirtualTour, Document)
          if (Array.isArray(p.media) && p.media.length > 0) {
            const plans = [];
            const vids = [];
            const tours = [];
            const docs = [];

            p.media.forEach((item, idx) => {
              const cat = item.mediaCategory || item.media_category;
              const formattedItem = {
                id: item.id || `media-${idx}`,
                mediaUrl: item.mediaUrl || item.media_url,
                shortDescription: item.shortDescription || item.short_description || '',
                orderIndex: item.orderIndex ?? item.order_index ?? (idx + 1),
                mimeType: item.mimeType || item.mime_type || '',
              };
              if (cat === 'FloorPlan') plans.push(formattedItem);
              else if (cat === 'Video') vids.push(formattedItem);
              else if (cat === 'VirtualTour') tours.push(formattedItem);
              else if (cat === 'Document') docs.push(formattedItem);
            });

            if (plans.length > 0) setMediaFloorPlans(plans.sort((a, b) => a.orderIndex - b.orderIndex));
            if (vids.length > 0) setMediaVideos(vids.sort((a, b) => a.orderIndex - b.orderIndex));
            if (tours.length > 0) setMediaVirtualTours(tours.sort((a, b) => a.orderIndex - b.orderIndex));
            if (docs.length > 0) setMediaDocuments(docs.sort((a, b) => a.orderIndex - b.orderIndex));
          } else {
            // Legacy fallbacks for blueprint and virtual tour URL if media table was empty
            if (p.virtualTourUrl) {
              setMediaVirtualTours([{
                id: 'tour-1',
                mediaUrl: p.virtualTourUrl,
                shortDescription: '3D Virtual Tour Showcase',
                orderIndex: 1,
                mimeType: 'text/html'
              }]);
            }
            if (p.blueprintUrl) {
              setMediaFloorPlans([{
                id: 'plan-1',
                mediaUrl: p.blueprintUrl,
                shortDescription: 'Architectural Blueprint Layout',
                orderIndex: 1,
                mimeType: 'application/pdf'
              }]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching property", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [id, isEditing]);

  // Load Regions on component mount
  useEffect(() => {
    const regions = phLocationService.getRegions();
    setGeoRegions(regions);
  }, []);

  // Sync provinces & cities when region changes
  useEffect(() => {
    if (!formData.region_psgc_code) {
      setGeoProvinces([]);
      setGeoCities([]);
      return;
    }
    const isProvApplicable = phLocationService.isProvinceApplicable(formData.region_psgc_code);
    if (isProvApplicable) {
      const provs = phLocationService.getProvinces(formData.region_psgc_code);
      setGeoProvinces(provs);
      if (formData.province_psgc_code) {
        const cities = phLocationService.getCities({
          regionCode: formData.region_psgc_code,
          provinceCode: formData.province_psgc_code
        });
        setGeoCities(cities);
      } else {
        setGeoCities([]);
      }
    } else {
      // Province inapplicable (e.g. NCR) - load cities directly by region
      setGeoProvinces([]);
      const cities = phLocationService.getCities({ regionCode: formData.region_psgc_code });
      setGeoCities(cities);
    }
  }, [formData.region_psgc_code, formData.province_psgc_code]);

  // Load Barangays when city changes
  useEffect(() => {
    let isCancelled = false;
    if (!formData.city_psgc_code) {
      setGeoBarangays([]);
      return;
    }

    const loadBarangays = async () => {
      setIsLoadingBarangays(true);
      try {
        const brgys = await phLocationService.getBarangays(formData.city_psgc_code);
        if (!isCancelled) {
          setGeoBarangays(brgys);
        }
      } catch (err) {
        console.error('Failed to load barangays:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingBarangays(false);
        }
      }
    };

    loadBarangays();
    return () => { isCancelled = true; };
  }, [formData.city_psgc_code]);

  // Update ZIP code suggestions when City or Barangay changes
  useEffect(() => {
    if (formData.location || formData.city) {
      const suggestions = phLocationService.getZipCodeSuggestions(
        formData.location || formData.city,
        formData.barangay
      );
      setZipSuggestions(suggestions);
    } else {
      setZipSuggestions([]);
    }
  }, [formData.location, formData.city, formData.barangay]);

  // Compute live unparsed address preview
  const liveUnparsedAddress = phLocationService.formatUnparsedAddress({
    buildingName: formData.building_name,
    address: formData.address,
    subdivisionName: formData.subdivision_name || formData.subdivision,
    barangay: formData.barangay,
    city: formData.location || formData.city,
    stateOrProvince: formData.state_or_province || formData.province,
    region: formData.region,
    postalCode: formData.postal_code,
  });

  // Memoized options for SearchableSelect controls
  const regionOptions = useMemo(() => {
    return geoRegions.map(r => ({ value: r.regionCode, label: r.regionName }));
  }, [geoRegions]);

  const provinceOptions = useMemo(() => {
    return geoProvinces.map(p => ({ value: p.provinceCode, label: p.provinceName }));
  }, [geoProvinces]);

  const cityOptions = useMemo(() => {
    return geoCities.map(c => ({ value: c.cityCode, label: c.cityName }));
  }, [geoCities]);

  const barangayOptions = useMemo(() => {
    return geoBarangays.map(b => ({ value: b.barangayCode, label: b.barangayName }));
  }, [geoBarangays]);

  // Handler: Region Selection with Cascading Clear
  const handleRegionSelect = (valOrEvent) => {
    const selectedRegionCode = valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target ? valOrEvent.target.value : valOrEvent;
    const selectedRegionObj = geoRegions.find(r => r.regionCode === selectedRegionCode);
    const regionName = selectedRegionObj ? selectedRegionObj.regionName : '';

    setIsDirty(true);

    const isPrevCityChosen = Boolean(formData.city_psgc_code || formData.location);
    if (isPrevCityChosen) {
      setLocationNotice({
        type: 'info',
        message: 'Parent Region modified: City/Municipality and Barangay have been cleared to ensure geographic accuracy. Street and subdivision details were preserved.'
      });
      setTimeout(() => setLocationNotice(null), 6000);
    }

    const isProvApplicable = phLocationService.isProvinceApplicable(selectedRegionCode);

    setFormData(prev => ({
      ...prev,
      region: regionName,
      region_psgc_code: selectedRegionCode,
      province_psgc_code: '',
      province: isProvApplicable ? '' : regionName,
      state_or_province: isProvApplicable ? '' : regionName,
      state: isProvApplicable ? '' : regionName,
      city_psgc_code: '',
      city: '',
      location: '',
      barangay_psgc_code: '',
      barangay: '',
    }));
    setMapSearchQuery(regionName ? `${regionName}, Philippines` : '');
  };

  // Handler: Province Selection with Cascading Clear
  const handleProvinceSelect = (valOrEvent) => {
    const selectedProvCode = valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target ? valOrEvent.target.value : valOrEvent;
    const selectedProvObj = geoProvinces.find(p => p.provinceCode === selectedProvCode);
    const provName = selectedProvObj ? selectedProvObj.provinceName : '';

    setIsDirty(true);

    const isPrevCityChosen = Boolean(formData.city_psgc_code || formData.location);
    if (isPrevCityChosen) {
      setLocationNotice({
        type: 'info',
        message: 'Parent Province modified: City/Municipality and Barangay have been cleared to prevent geographical mismatch. Street and subdivision details were preserved.'
      });
      setTimeout(() => setLocationNotice(null), 6000);
    }

    setFormData(prev => ({
      ...prev,
      province_psgc_code: selectedProvCode,
      province: provName,
      state_or_province: provName,
      state: provName,
      city_psgc_code: '',
      city: '',
      location: '',
      barangay_psgc_code: '',
      barangay: '',
    }));
    setMapSearchQuery(provName ? `${provName}, Philippines` : '');
  };

  // Handler: City / Municipality Selection
  const handleCitySelect = (valOrEvent) => {
    const selectedCityCode = valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target ? valOrEvent.target.value : valOrEvent;
    const selectedCityObj = geoCities.find(c => c.cityCode === selectedCityCode);
    const cityName = selectedCityObj ? selectedCityObj.cityName : '';

    setIsDirty(true);

    const isPrevBrgyChosen = Boolean(formData.barangay_psgc_code || formData.barangay);
    if (isPrevBrgyChosen) {
      setLocationNotice({
        type: 'info',
        message: 'City changed: Barangay selection cleared for re-selection in the new jurisdiction.'
      });
      setTimeout(() => setLocationNotice(null), 5000);
    }

    setFormData(prev => ({
      ...prev,
      city_psgc_code: selectedCityCode,
      city: cityName,
      location: cityName,
      barangay_psgc_code: '',
      barangay: '',
    }));
    setMapSearchQuery(cityName ? `${cityName}, ${formData.province || formData.region || 'Philippines'}` : '');
  };

  // Handler: Barangay Selection
  const handleBarangaySelect = (valOrEvent) => {
    const selectedBrgyCode = valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target ? valOrEvent.target.value : valOrEvent;
    const selectedBrgyObj = geoBarangays.find(b => b.barangayCode === selectedBrgyCode);
    const brgyName = selectedBrgyObj ? selectedBrgyObj.barangayName : '';

    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      barangay_psgc_code: selectedBrgyCode,
      barangay: brgyName,
    }));
  };

  const handlePriceChange = (e) => {
    setIsDirty(true);
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, price: rawVal }));
    setDisplayPrice(rawVal);
  };

  const handlePriceBlur = () => {
    if (formData.price) {
      setDisplayPrice(Number(formData.price).toLocaleString());
    }
  };

  const handlePriceFocus = () => {
    setDisplayPrice(formData.price);
  };

  const handleAmenityToggle = (amenity, category = 'amenities') => {
    setIsDirty(true);
    setFormData(prev => {
      const list = prev[category] || [];
      return {
        ...prev,
        [category]: list.includes(amenity)
          ? list.filter(a => a !== amenity)
          : [...list, amenity]
      };
    });
  };

  // =========================================================================
  // Section 6: Media & Documents Upload and Manipulation Handlers
  // =========================================================================

  // Upload a single file via driveService with graceful local fallback if unauthenticated
  const uploadSingleMediaFile = async (file, category, updateItemCallback) => {
    try {
      updateItemCallback({ isUploading: true, progress: 25, error: null });
      const targetPropertyId = id && id !== 'new' ? id : 'general';
      const uploaded = await driveService.uploadFile(file, targetPropertyId, category);
      const liveUrl = uploaded.directImageUrl || uploaded.webViewLink;
      updateItemCallback({
        isUploading: false,
        progress: 100,
        error: null,
        mediaUrl: liveUrl,
        imageUrl: liveUrl,
        mimeType: file.type || (category === 'Photos' ? 'image/jpeg' : 'application/octet-stream')
      });
    } catch (err) {
      console.warn('[BrokerCreateListings] Remote Drive upload unavailable:', err);
      // If unauthorized (e.g. session expired or preview mode), preserve local object URL so user is not blocked
      if (err.status === 401 || err.message?.includes('Unauthorized')) {
        const localBlobUrl = URL.createObjectURL(file);
        updateItemCallback({
          isUploading: false,
          progress: 100,
          error: null,
          mediaUrl: localBlobUrl,
          imageUrl: localBlobUrl,
          mimeType: file.type || (category === 'Photos' ? 'image/jpeg' : 'application/octet-stream')
        });
      } else {
        updateItemCallback({
          isUploading: false,
          progress: 0,
          error: err.response?.data?.error || err.message || 'Upload failed'
        });
      }
    }
  };

  // 1. Photos Handlers
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsDirty(true);

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not a valid image file.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the maximum 50MB file size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    const currentCount = mediaPhotos.length;
    const newItems = validFiles.map((file, idx) => ({
      id: `photo-new-${Date.now()}-${idx}`,
      imageUrl: URL.createObjectURL(file),
      displayOrder: currentCount + idx + 1,
      isUploading: true,
      progress: 10,
      error: null,
      file: file,
      mimeType: file.type || 'image/jpeg'
    }));

    setMediaPhotos(prev => [...prev, ...newItems]);

    // Kick off uploads for each
    newItems.forEach((item) => {
      uploadSingleMediaFile(item.file, 'Photos', (updates) => {
        setMediaPhotos(prev => prev.map(p => p.id === item.id ? { ...p, ...updates } : p));
      });
    });

    e.target.value = '';
  };

  const handlePhotoMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaPhotos.length) return;
    setIsDirty(true);
    setMediaPhotos(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    });
  };

  const handlePhotoSetCover = (index) => {
    if (index === 0) return;
    setIsDirty(true);
    setMediaPhotos(prev => {
      const copy = [...prev];
      const [cover] = copy.splice(index, 1);
      copy.unshift(cover);
      return copy.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    });
  };

  const handlePhotoReplace = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selected file is not an image.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Selected image exceeds the 50MB size limit.');
      return;
    }
    setIsDirty(true);
    const targetId = mediaPhotos[index]?.id;
    setMediaPhotos(prev => prev.map((p, idx) => idx === index ? {
      ...p,
      imageUrl: URL.createObjectURL(file),
      file,
      isUploading: true,
      progress: 10,
      error: null
    } : p));

    uploadSingleMediaFile(file, 'Photos', (updates) => {
      setMediaPhotos(prev => prev.map(p => p.id === targetId ? { ...p, ...updates } : p));
    });
  };

  const handlePhotoRetry = (index) => {
    const item = mediaPhotos[index];
    if (!item?.file) return;
    uploadSingleMediaFile(item.file, 'Photos', (updates) => {
      setMediaPhotos(prev => prev.map((p, idx) => idx === index ? { ...p, ...updates } : p));
    });
  };

  // 2. Floor Plans Handlers
  const handleFloorPlanUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsDirty(true);

    const validFiles = files.filter(f => {
      if (f.size > 50 * 1024 * 1024) {
        alert(`"${f.name}" exceeds 50MB.`);
        return false;
      }
      return true;
    });

    const currentCount = mediaFloorPlans.length;
    const newItems = validFiles.map((file, idx) => ({
      id: `floorplan-new-${Date.now()}-${idx}`,
      mediaUrl: URL.createObjectURL(file),
      shortDescription: file.name.replace(/\.[^/.]+$/, ""),
      orderIndex: currentCount + idx + 1,
      mimeType: file.type || 'application/pdf',
      isUploading: true,
      progress: 15,
      error: null,
      file: file
    }));

    setMediaFloorPlans(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      uploadSingleMediaFile(item.file, 'CAD', (updates) => {
        setMediaFloorPlans(prev => prev.map(p => p.id === item.id ? { ...p, ...updates } : p));
      });
    });

    e.target.value = '';
  };

  const handleFloorPlanMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaFloorPlans.length) return;
    setIsDirty(true);
    setMediaFloorPlans(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
    });
  };

  // 3. Videos Handlers
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsDirty(true);

    const validFiles = files.filter(f => {
      if (!f.type.startsWith('video/')) {
        alert(`"${f.name}" is not a valid video file.`);
        return false;
      }
      if (f.size > 100 * 1024 * 1024) {
        alert(`"${f.name}" exceeds maximum allowed 100MB.`);
        return false;
      }
      return true;
    });

    const currentCount = mediaVideos.length;
    const newItems = validFiles.map((file, idx) => ({
      id: `video-new-${Date.now()}-${idx}`,
      mediaUrl: URL.createObjectURL(file),
      shortDescription: file.name.replace(/\.[^/.]+$/, ""),
      orderIndex: currentCount + idx + 1,
      mimeType: file.type || 'video/mp4',
      isUploading: true,
      progress: 10,
      error: null,
      file: file,
      isLink: false
    }));

    setMediaVideos(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      uploadSingleMediaFile(item.file, 'Document', (updates) => {
        setMediaVideos(prev => prev.map(p => p.id === item.id ? { ...p, ...updates } : p));
      });
    });

    e.target.value = '';
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    if (!/^https?:\/\//i.test(newVideoUrl.trim())) {
      alert('Please enter a valid HTTP or HTTPS video URL.');
      return;
    }
    setIsDirty(true);
    const newItem = {
      id: `video-url-${Date.now()}`,
      mediaUrl: newVideoUrl.trim(),
      shortDescription: newVideoDesc.trim() || 'Featured Property Video',
      orderIndex: mediaVideos.length + 1,
      mimeType: 'video/mp4',
      isUploading: false,
      progress: 100,
      error: null,
      isLink: true
    };
    setMediaVideos(prev => [...prev, newItem]);
    setNewVideoUrl('');
    setNewVideoDesc('');
  };

  const handleVideoMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaVideos.length) return;
    setIsDirty(true);
    setMediaVideos(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
    });
  };

  // 4. Virtual Tours Handlers
  const handleAddVirtualTour = () => {
    if (!newTourUrl.trim()) return;
    if (!/^https?:\/\//i.test(newTourUrl.trim())) {
      alert('Please enter a valid HTTP or HTTPS tour URL.');
      return;
    }
    setIsDirty(true);
    const newItem = {
      id: `tour-${Date.now()}`,
      mediaUrl: newTourUrl.trim(),
      shortDescription: newTourDesc.trim() || 'Interactive 3D Virtual Tour',
      orderIndex: mediaVirtualTours.length + 1,
      mimeType: 'text/html'
    };
    setMediaVirtualTours(prev => [...prev, newItem]);
    setNewTourUrl('');
    setNewTourDesc('');
  };

  const handleTourMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaVirtualTours.length) return;
    setIsDirty(true);
    setMediaVirtualTours(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
    });
  };

  // 5. Documents Handlers
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsDirty(true);

    const validFiles = files.filter(f => {
      if (f.size > 50 * 1024 * 1024) {
        alert(`"${f.name}" exceeds 50MB.`);
        return false;
      }
      return true;
    });

    const currentCount = mediaDocuments.length;
    const newItems = validFiles.map((file, idx) => ({
      id: `doc-new-${Date.now()}-${idx}`,
      mediaUrl: URL.createObjectURL(file),
      shortDescription: file.name.replace(/\.[^/.]+$/, ""),
      orderIndex: currentCount + idx + 1,
      mimeType: file.type || 'application/pdf',
      isUploading: true,
      progress: 15,
      error: null,
      file: file
    }));

    setMediaDocuments(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      uploadSingleMediaFile(item.file, 'Document', (updates) => {
        setMediaDocuments(prev => prev.map(p => p.id === item.id ? { ...p, ...updates } : p));
      });
    });

    e.target.value = '';
  };

  const handleDocumentMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaDocuments.length) return;
    setIsDirty(true);
    setMediaDocuments(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
    });
  };

  // Check if any media uploads are currently running or have unresolved errors
  const hasActiveUploads = [
    ...mediaPhotos,
    ...mediaFloorPlans,
    ...mediaVideos,
    ...mediaDocuments
  ].some(item => item.isUploading);

  const hasUploadErrors = [
    ...mediaPhotos,
    ...mediaFloorPlans,
    ...mediaVideos,
    ...mediaDocuments
  ].some(item => Boolean(item.error));

  // Validation audit for Step 7: Distinguish database constraints (Draft requirements) from full publication requirements
  const draftValidationErrors = [];
  if (!formData.title || formData.title.trim().length === 0) {
    draftValidationErrors.push({ field: 'Title', step: 1, message: 'Property title is required by the database schema.' });
  }
  if (!formData.price || Number(formData.price) <= 0) {
    draftValidationErrors.push({ field: 'Price / Rent', step: 4, message: 'Valid positive price/rent amount is required by the database schema.' });
  }
  if (!formData.address || formData.address.trim().length === 0) {
    draftValidationErrors.push({ field: 'Street Address', step: 2, message: 'Street address is required by the database schema.' });
  }
  if (!formData.location && !formData.city) {
    draftValidationErrors.push({ field: 'City / Municipality', step: 2, message: 'City / Municipality is required by the database schema.' });
  }
  if (!formData.property_type) {
    draftValidationErrors.push({ field: 'Property Type', step: 1, message: 'Property type classification is required.' });
  }

  const finalValidationErrors = [...draftValidationErrors];
  if (formData.title && formData.title.trim().length < 3) {
    finalValidationErrors.push({ field: 'Title', step: 1, message: 'Provide a title with at least 3 characters.' });
  }
  if (!formData.region && !formData.region_psgc_code) {
    finalValidationErrors.push({ field: 'Region', step: 2, message: 'Select a region.' });
  }
  const isProvRequired = formData.region_psgc_code 
    ? phLocationService.isProvinceApplicable(formData.region_psgc_code) 
    : false;
  if (isProvRequired && !formData.province && !formData.state_or_province) {
    finalValidationErrors.push({ field: 'Province', step: 2, message: 'Select a province.' });
  }
  if (!formData.city && !formData.location) {
    finalValidationErrors.push({ field: 'City / Municipality', step: 2, message: 'Select a city or municipality.' });
  }
  if (!formData.barangay) {
    finalValidationErrors.push({ field: 'Barangay', step: 2, message: 'Select a barangay.' });
  }
  if (!formData.currency) {
    finalValidationErrors.push({ field: 'Currency', step: 4, message: 'Select currency.' });
  }
  if (formData.transaction_type === 'For Rent' && !formData.rent_frequency) {
    finalValidationErrors.push({ field: 'Rent Frequency', step: 4, message: 'Select rent frequency.' });
  }
  if (!formData.latitude || !formData.longitude) {
    finalValidationErrors.push({ field: 'Confirm map location', step: 2, message: 'Confirm map location pin.' });
  }
  if (mediaPhotos.length === 0) {
    finalValidationErrors.push({ field: 'Add a cover photo', step: 6, message: 'Add at least 1 cover photo.' });
  }

  const validationSummary = {
    hasTitle: Boolean(formData.title && formData.title.trim().length >= 3),
    hasPrice: Boolean(formData.price && Number(formData.price) > 0),
    hasAddress: Boolean(formData.address && formData.address.trim().length > 0),
    hasRegion: Boolean(formData.region || formData.region_psgc_code),
    hasProvince: isProvRequired ? Boolean(formData.province || formData.state_or_province) : true,
    hasCity: Boolean((formData.location || formData.city) && (formData.location || formData.city).trim().length > 0),
    hasBarangay: Boolean(formData.barangay && formData.barangay.trim().length > 0),
    hasCoordinates: Boolean(formData.latitude && formData.longitude),
    hasMedia: (mediaPhotos.length + mediaFloorPlans.length + mediaVideos.length + mediaVirtualTours.length + mediaDocuments.length) > 0,
    hasCoverPhoto: mediaPhotos.length > 0,
    draftErrors: draftValidationErrors,
    finalErrors: finalValidationErrors,
  };

  // Submit action handler supporting explicit Draft vs Publish vs Review workflows
  const executeSubmission = async (targetStandardStatus = 'Active') => {
    setSubmissionError(null);

    // Draft Validation vs Final Validation
    if (targetStandardStatus === 'Draft') {
      if (draftValidationErrors.length > 0) {
        setSubmissionError({
          title: 'Database Requirements Missing for Draft',
          message: `The database requires: ${draftValidationErrors.map(e => e.field).join(', ')}. Please provide these required fields.`,
          errors: draftValidationErrors
        });
        return;
      }
    } else {
      if (finalValidationErrors.length > 0) {
        setSubmissionError({
          title: 'Publication Requirements Incomplete',
          message: 'Please resolve the following required fields before submitting or publishing:',
          errors: finalValidationErrors
        });
        return;
      }
    }

    if (hasActiveUploads) {
      setSubmissionError({
        title: 'Uploads In Progress',
        message: 'Media files are still uploading. Please wait for uploads to complete before submitting.',
        errors: [{ field: 'Media & Documents', step: 6, message: 'Active uploads in progress' }]
      });
      return;
    }

    if (hasUploadErrors) {
      setSubmissionError({
        title: 'Unresolved Upload Failures',
        message: 'One or more media uploads failed. Please retry or remove failed items in Section 6 before submitting.',
        errors: [{ field: 'Media & Documents', step: 6, message: 'Unresolved media upload errors' }]
      });
      return;
    }

    // Set active progress label
    if (targetStandardStatus === 'Draft') {
      setActiveActionLabel('Saving...');
    } else if (targetStandardStatus === 'Pending Approval') {
      setActiveActionLabel('Submitting...');
    } else {
      setActiveActionLabel(isEditing ? 'Saving Changes...' : 'Publishing...');
    }

    setIsSubmitting(true);
    try {

      const isDraft = targetStandardStatus === 'Draft';
      const determinedStatus = isDraft ? 'INACTIVE' : (formData.status || 'AVAILABLE');
      
      // Serialize property_images (Photos)
      const formattedPropertyImages = mediaPhotos
        .filter(p => (p.imageUrl || p.mediaUrl) && !p.error)
        .map((p, idx) => ({
          imageUrl: p.mediaUrl || p.imageUrl,
          displayOrder: idx + 1
        }));

      // Serialize property_media (Photos, FloorPlan, Video, VirtualTour, Document)
      const formattedMedia = [
        ...mediaPhotos
          .filter(p => (p.mediaUrl || p.imageUrl) && !p.error)
          .map((p, idx) => ({
            mediaUrl: p.mediaUrl || p.imageUrl,
            mediaCategory: 'Photo',
            orderIndex: idx + 1,
            shortDescription: p.shortDescription || p.name || 'Listing Photo',
            mimeType: p.mimeType || 'image/jpeg'
          })),
        ...mediaFloorPlans.map((m, idx) => ({
          mediaUrl: m.mediaUrl,
          mediaCategory: 'FloorPlan',
          orderIndex: idx + 1,
          shortDescription: m.shortDescription || '',
          mimeType: m.mimeType || 'application/pdf'
        })),
        ...mediaVideos.map((m, idx) => ({
          mediaUrl: m.mediaUrl,
          mediaCategory: 'Video',
          orderIndex: idx + 1,
          shortDescription: m.shortDescription || '',
          mimeType: m.mimeType || 'video/mp4'
        })),
        ...mediaVirtualTours.map((m, idx) => ({
          mediaUrl: m.mediaUrl,
          mediaCategory: 'VirtualTour',
          orderIndex: idx + 1,
          shortDescription: m.shortDescription || '',
          mimeType: 'text/html'
        })),
        ...mediaDocuments.map((m, idx) => ({
          mediaUrl: m.mediaUrl,
          mediaCategory: 'Document',
          orderIndex: idx + 1,
          shortDescription: m.shortDescription || '',
          mimeType: m.mimeType || 'application/pdf'
        }))
      ];

      const payload = toApiPayload({
        ...formData,
        standardStatus: targetStandardStatus,
        status: determinedStatus,
        is_published: !isDraft,
        is_featured: Boolean(formData.is_featured),
        isFeatured: Boolean(formData.is_featured),
        property_images: formattedPropertyImages,
        images: formattedPropertyImages.map(img => img.imageUrl),
        media: formattedMedia,
        confidential: {
          privateRemarks: formData.privateNotes || '',
          showingInstructions: formData.showingInstructions || '',
          lockboxCode: formData.lockboxCode || '',
          buyerAgencyCompensation: formData.commissionSplit || '',
          sellerDirectPhone: formData.seller_direct_phone || '',
        }
      });

      let propertyId = id;
      if (isEditing) {
        if (user?.role === 'agent' && targetStandardStatus !== 'Draft') {
          // Agent proposing edits through existing proposeEdit workflow
          await propertyService.proposeEdit(id, payload, formData.privateNotes || 'Agent listing modification request');
        } else {
          await propertyService.updateProperty(id, payload);
        }
      } else {
        const res = await propertyService.createProperty(payload);
        propertyId = res?.id || res?.data?.id || id;
      }

      setIsDirty(false);
      setCreatedPropertyId(propertyId);
      setSavedStatusType(targetStandardStatus);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[BrokerCreateListings] Submission error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Error occurred while saving listing.';
      setSubmissionError({
        title: 'Submission Failed',
        message: errMsg,
        errors: []
      });
    } finally {
      setIsSubmitting(false);
      setActiveActionLabel('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user?.role === 'agent') {
      executeSubmission('Pending Approval');
    } else {
      executeSubmission('Active');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="material-symbols-outlined text-4xl text-[#0D4446] animate-spin">sync</span>
      </div>
    );
  }

  const isCondo = ['condominium', 'Condominium', 'Penthouse', 'Apartment', 'apartment'].includes(formData.property_type);
  const isLand = ['residentialLot', 'Subdivision Lot', 'Lot / Land', 'Vacant Land / Lot', 'Land'].includes(formData.property_type);
  const isHouseAndLot = ['houseAndLot', 'House and Lot', 'House & Lot', 'Townhouse', 'townhouse', 'Villa', 'villa'].includes(formData.property_type);

  return (
    <div className={`space-y-6 max-w-[1440px] mx-auto ${isDrawer ? 'pb-6' : 'pb-16'}`}>
      {!isDrawer && (
        <PageHeader
          title={isEditing ? "Edit Property Listing" : "Create New Property Listing"}
          subtitle="Modern SaaS registry compliant with RESO 2.0 standards and verified cadastral records."
          className="mb-6"
          breadcrumbs={[
            { label: 'Properties', to: '/broker/properties' },
            { label: isEditing ? 'Edit Listing' : 'New Listing' }
          ]}
          actions={
            <Link
              to="/broker/properties"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Properties</span>
            </Link>
          }
        />
      )}

      {/* 7-Step Navigation Stepper Header */}
      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs mb-6 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-bold">
                Step {currentStep} of 7
              </Badge>
              <span className="text-sm font-bold text-[#1E293B] dark:text-slate-100 font-display">
                {stepTitles[currentStep - 1]}
              </span>
            </div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:block">
              {Math.round(((currentStep - 1) / 6) * 100)}% Completed
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#0F766E] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep) / 7) * 100}%` }}
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar pt-1 pb-1">
            <div className="flex items-center justify-between min-w-[720px] relative">
              <div className="absolute top-4 left-8 right-8 h-[2px] bg-[#E2E8F0] dark:bg-slate-800 -z-0" />

              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <div 
                    key={stepNum} 
                    className="flex flex-col items-center flex-1 cursor-pointer transition-all hover:opacity-95 relative z-10"
                    onClick={() => setCurrentStep(stepNum)}
                  >
                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all shadow-2xs ${
                      isActive 
                        ? 'bg-[#0F766E] text-white ring-4 ring-[#0F766E]/15 border border-[#0F766E]' 
                        : isCompleted 
                        ? 'bg-[#0F766E] text-white border border-[#0F766E]' 
                        : 'bg-white dark:bg-slate-900 text-slate-500 border border-[#E2E8F0] dark:border-slate-700 hover:border-slate-400'
                    }`}>
                      {isCompleted ? <Check className="size-4 stroke-[2.5]" /> : stepNum}
                    </div>
                    <span className={`text-xs text-center transition-colors px-1 ${
                      isActive ? 'text-[#0F766E] dark:text-teal-400 font-bold' : isCompleted ? 'text-[#1E293B] dark:text-slate-200 font-medium' : 'text-[#64748B] dark:text-slate-400'
                    }`}>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (8 Cols) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================================= */}
        {/* SECTION 1: BASIC PROPERTY INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0F766E]" />
                <span>Section 1: Listing Overview</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Listing Title <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    {(formData.title || '').length} / 120
                  </span>
                </div>
                <input
                  required
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Modernist Cantilever Estate at Ayala Alabang"
                  value={formData.title}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, title: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-2xs"
                />
              </div>

              {/* Tagline / Marketing Headline */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Headline / Marketing Tagline
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    {(formData.tagline || '').length} / 160
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="e.g. Elevated residential lot overlooking Laguna de Bay"
                  value={formData.tagline || ''}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, tagline: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-2xs"
                />
              </div>

              {/* Reference Code & Transaction Purpose */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block h-5">
                  MLS / Cadastral Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAD-HAV-B12-L04"
                  value={formData.referenceCode || formData.listing_id || ''}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, referenceCode: e.target.value, listing_id: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-2xs font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block h-5">
                  Transaction Purpose <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1] h-11 items-center shadow-2xs">
                  {['For Sale', 'For Rent'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setIsDirty(true); setFormData({ ...formData, transaction_type: type }); }}
                      className={`flex-1 h-9 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        formData.transaction_type === type
                          ? 'bg-white text-[#0F766E] shadow-sm font-bold border border-[#0F766E]/20'
                          : 'text-[#64748B] hover:text-[#1E293B]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Development Condition Selector */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Development Stage & Condition
                  </label>
                  <Badge variant="secondary">Philippine Market Standard</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(isLand
                    ? ['Raw / Undeveloped Lot', 'Subdivision Phase Cut', 'Ready to Build']
                    : isCondo
                    ? ['Ready for Occupancy (RFO)', 'Pre-Selling', 'Resale']
                    : ['Brand New / RFO', 'Pre-Selling', 'Well-Maintained Resale', 'Renovated']
                  ).map(cond => {
                    const isSelected = formData.development_condition === cond || formData.property_condition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setFormData({ ...formData, development_condition: cond, property_condition: cond });
                        }}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-[#CBD5E1] text-[#1E293B]'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Listing Agent (PRC License) */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="assigned-agent-select" className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Assigned Listing Agent <span className="text-[#0F766E]">(PRC Broker / Salesperson)</span>
                  </label>
                  <Badge variant="outline">Supabase RLS Bound</Badge>
                </div>
                <select
                  id="assigned-agent-select"
                  value={formData.agent_id || ''}
                  onChange={(e) => {
                    setIsDirty(true);
                    const selectedId = e.target.value;
                    const selectedAgent = availableAgents.find(a => a.id === selectedId);
                    setFormData({
                      ...formData,
                      agent_id: selectedId,
                      list_agent_key: selectedId || null,
                      agent_name: selectedAgent ? selectedAgent.name : '',
                      assignedAgent: selectedAgent ? {
                        agentId: selectedAgent.id,
                        name: selectedAgent.name,
                        email: selectedAgent.email,
                        phone: selectedAgent.phone,
                        role: selectedAgent.role,
                        prcLicenseNo: selectedAgent.prc_license_no || selectedAgent.license_no || 'PRC-REB-0024891',
                        assignmentStatus: 'accepted'
                      } : null
                    });
                  }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-2xs"
                >
                  <option value="">Human Shelter Realty Corporate Brokerage Desk</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role || 'Licensed Agent'} • {agent.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Type Classification Option Cards */}
              <div className="space-y-2.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block">
                    Category / Type Classification <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <span className="text-xs text-[#64748B]">
                    Active: <strong className="text-[#0F766E] font-bold">
                      {(() => {
                        const match = COMMON_PROPERTY_TYPES.find(c => c.id === formData.property_type || c.name === formData.property_type);
                        return match ? match.name : (formData.property_type || 'House and Lot');
                      })()}
                    </strong>
                  </span>
                </div>

                <div 
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3" 
                  role="radiogroup" 
                  aria-label="Property Type Classification"
                >
                  {COMMON_PROPERTY_TYPES.map(config => {
                    const Icon = config.icon;
                    const isSelected = formData.property_type === config.id || formData.property_type === config.name;

                    return (
                      <button
                        key={config.id}
                        type="button"
                        role="button"
                        aria-label={config.name}
                        aria-pressed={isSelected}
                        data-testid={`property-type-${config.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        onClick={() => {
                          setIsDirty(true);
                          setFormData({ ...formData, property_type: config.id });
                        }}
                        className={`relative p-4 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 ${
                          isSelected
                            ? 'bg-teal-50/60 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
                            : 'bg-white border-[#E2E8F0] hover:border-[#0F766E]/50 hover:bg-slate-50 shadow-2xs'
                        }`}
                      >
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-slate-100 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white'
                          }`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
                          {config.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Synchronized accessible select fallback */}
                <select
                  aria-label="Category / Type"
                  value={formData.property_type}
                  onChange={e => {
                    setIsDirty(true);
                    setFormData({ ...formData, property_type: e.target.value });
                  }}
                  className="sr-only"
                >
                  {COMMON_PROPERTY_TYPES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block h-5">
                  Property Description <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="bg-white rounded-lg border border-[#CBD5E1] hover:border-slate-400 overflow-hidden shadow-2xs transition-colors focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E]">
                  <ReactQuill
                    theme="snow"
                    modules={QUILL_MODULES}
                    value={formData.description}
                    onChange={val => { setIsDirty(true); setFormData({ ...formData, description: val }); }}
                    placeholder="Describe spatial geometry, materials, lighting orientations, and architectural finishings..."
                    className="min-h-[140px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PROPERTY LOCATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Dynamic Notice Banner for Cascading Clears */}
            {locationNotice && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-[#0F766E] flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                <span className="leading-relaxed font-medium">{locationNotice.message}</span>
              </div>
            )}

            {/* 1. Map Location */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E] text-[18px]">pin_drop</span>
                  <span>Map Location</span>
                </h3>
              </div>

              {/* Predictive Search & URL Paste Strip */}
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3 relative z-30">
                <div className="flex flex-col sm:flex-row gap-2 relative z-30" ref={mapSearchContainerRef}>
                  <div className="relative flex-1 z-30">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Search Philippine address or landmark (e.g. Ayala Alabang, Muntinlupa)..."
                      value={mapSearchQuery}
                      onChange={e => setMapSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleGeocode(e); }}
                      className="w-full h-11 pl-10 pr-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-3.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 animate-spin">sync</span>
                      </div>
                    )}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-12 left-0 right-0 bg-white border border-[#CBD5E1] rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                        {addressSuggestions.map((item, idx) => (
                          <div
                            key={item.placeId || idx}
                            onClick={() => handleSelectAddressSuggestion(item)}
                            className="px-3.5 py-2.5 hover:bg-teal-50/60 cursor-pointer transition-colors flex items-start gap-2.5"
                          >
                            <span className="material-symbols-outlined text-[#0F766E] text-[16px] mt-0.5 shrink-0">location_on</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#1E293B] truncate">
                                {item.mainText || item.formattedAddress || item.description}
                              </p>
                              {item.secondaryText && (
                                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                                  {item.secondaryText}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="h-11 px-5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#115E59] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    {isGeocoding ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[16px]">travel_explore</span>}
                    Locate
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                  <span className="whitespace-nowrap">Or paste Google Maps Pin URL:</span>
                  <input
                    type="text"
                    placeholder="https://maps.app.goo.gl/... or @14.55,121.05"
                    onChange={handleGoogleMapsUrlPaste}
                    className="flex-1 h-8 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-xs text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors"
                  />
                </div>
              </div>

              {/* Cadastral Interactive Map */}
              <CadastralLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.address}
                onPositionChange={(pos) => {
                  handleMapPositionChange(pos);
                  handlePinMoved(pos);
                }}
                className="w-full"
              />

              {/* Cadastral Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-[#64748B]">Cadastral Presets:</span>
                {[
                  { name: 'BGC, Taguig', lat: 14.5547, lng: 121.0494, city: 'Taguig', subdivision: 'Bonifacio Global City' },
                  { name: 'Makati CBD', lat: 14.5547, lng: 121.0244, city: 'Makati', subdivision: 'Makati Central Business District' },
                  { name: 'Ortigas Center', lat: 14.5869, lng: 121.0614, city: 'Pasig', subdivision: 'Ortigas Center' },
                  { name: 'Cebu IT Park', lat: 10.3297, lng: 123.9063, city: 'Cebu City', subdivision: 'Cebu IT Park' },
                  { name: 'Clark Freeport', lat: 15.1856, lng: 120.5369, city: 'Angeles', subdivision: 'Clark Freeport Zone' }
                ].map(preset => {
                  const isActive = Math.abs(Number(formData.latitude) - preset.lat) < 0.0001 && Math.abs(Number(formData.longitude) - preset.lng) < 0.0001;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        handleMapPositionChange([preset.lat, preset.lng]);
                        handlePinMoved([preset.lat, preset.lng]);
                        setFormData(prev => ({
                          ...prev,
                          latitude: preset.lat.toFixed(7),
                          longitude: preset.lng.toFixed(7),
                          city: prev.city || preset.city,
                          location: prev.location || preset.city,
                          subdivision_name: prev.subdivision_name || preset.subdivision
                        }));
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#0F766E] text-white border-[#0F766E] font-semibold shadow-xs'
                          : 'bg-white hover:bg-teal-50 border-[#E2E8F0] text-[#0F766E] font-medium'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Coordinates: Latitude & Longitude Inputs */}
              <div className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#0F766E] text-[15px]">my_location</span>
                    <span>Coordinates (Latitude & Longitude)</span>
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Drag the map pin, search a location, or type directly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="geo-latitude" className="text-[11px] font-medium text-[#64748B] block">
                      Latitude
                    </label>
                    <div className="relative">
                      <input
                        id="geo-latitude"
                        type="text"
                        placeholder="e.g. 14.5995123"
                        value={formData.latitude || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, latitude: e.target.value }));
                        }}
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-xs font-mono text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="geo-longitude" className="text-[11px] font-medium text-[#64748B] block">
                      Longitude
                    </label>
                    <div className="relative">
                      <input
                        id="geo-longitude"
                        type="text"
                        placeholder="e.g. 120.9842123"
                        value={formData.longitude || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, longitude: e.target.value }));
                        }}
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-xs font-mono text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Area */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  <span>Area</span>
                </h4>
              </div>

              <div className="space-y-4">
                {/* First Row: Region | Province */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Region */}
                  <div className={!phLocationService.isProvinceApplicable(formData.region_psgc_code) ? 'md:col-span-2' : ''}>
                    <SearchableSelect
                      id="geo-region"
                      label="Region"
                      required={true}
                      value={formData.region_psgc_code || ''}
                      options={regionOptions}
                      onChange={handleRegionSelect}
                      placeholder="Select Region..."
                    />
                  </div>

                  {/* Province (Hidden entirely where it does not apply) */}
                  {phLocationService.isProvinceApplicable(formData.region_psgc_code) && (
                    <div>
                      <SearchableSelect
                        id="geo-province"
                        label="Province"
                        required={true}
                        disabled={!formData.region_psgc_code}
                        disabledPlaceholder="Choose Region first"
                        value={formData.province_psgc_code || ''}
                        options={provinceOptions}
                        onChange={handleProvinceSelect}
                        placeholder="Select Province..."
                      />
                    </div>
                  )}
                </div>

                {/* Second Row: City / Municipality | Barangay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City / Municipality */}
                  <div>
                    <SearchableSelect
                      id="geo-city"
                      label="City / Municipality"
                      required={true}
                      disabled={!formData.region_psgc_code || (phLocationService.isProvinceApplicable(formData.region_psgc_code) && !formData.province_psgc_code)}
                      disabledPlaceholder={!formData.region_psgc_code ? 'Choose Region first' : 'Choose Province first'}
                      value={formData.city_psgc_code || ''}
                      options={cityOptions}
                      onChange={handleCitySelect}
                      placeholder="Select City / Municipality..."
                    />
                  </div>

                  {/* Barangay */}
                  <div>
                    <SearchableSelect
                      id="geo-barangay"
                      label="Barangay"
                      required={true}
                      disabled={!formData.city_psgc_code || isLoadingBarangays}
                      disabledPlaceholder={isLoadingBarangays ? 'Loading Barangays...' : 'Choose City first'}
                      value={formData.barangay_psgc_code || ''}
                      options={barangayOptions}
                      onChange={handleBarangaySelect}
                      placeholder="Select Barangay..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Street Address */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  <span>Street Address</span>
                </h4>
              </div>

              <div className="space-y-4">
                {/* First Row: House / Unit / Street (more width) | ZIP Code */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* House / Unit / Street */}
                  <div className="space-y-1.5 md:col-span-8">
                    <label htmlFor="street-address-input" className="text-xs font-semibold text-[#1E293B] block">
                      House / Unit / Street <span className="text-[#FF6B6B]">*</span>
                    </label>
                    <input
                      id="street-address-input"
                      required
                      type="text"
                      placeholder="e.g. 142 Acacia Avenue, Phase 2"
                      value={formData.address}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, address: e.target.value }); }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-1.5 md:col-span-4">
                    <label htmlFor="zip-code-input" className="text-xs font-semibold text-[#1E293B] block">
                      ZIP Code
                    </label>
                    <input
                      id="zip-code-input"
                      type="text"
                      placeholder="e.g. 1780"
                      maxLength={10}
                      value={formData.postal_code}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, postal_code: e.target.value }); }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />

                    {/* Suggestions */}
                    {zipSuggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
                        {zipSuggestions.slice(0, 5).map(zip => (
                          <button
                            key={zip}
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setFormData(prev => ({ ...prev, postal_code: zip }));
                            }}
                            className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold border transition-colors cursor-pointer ${
                              formData.postal_code === zip
                                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            {zip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tailored Address Branching: Condo vs Subdivision */}
                {isCondo ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-1.5 md:col-span-6">
                      <label htmlFor="building-name-input" className="text-xs font-semibold text-[#1E293B] block">
                        Building Name <span className="text-[#FF6B6B]">*</span>
                      </label>
                      <input
                        id="building-name-input"
                        type="text"
                        placeholder="e.g. The Proscenium at Rockwell, Two Serendra"
                        value={formData.building_name || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, building_name: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-6">
                      <label htmlFor="tower-name-input" className="text-xs font-semibold text-[#1E293B] block">
                        Tower / Wing
                      </label>
                      <input
                        id="tower-name-input"
                        type="text"
                        placeholder="e.g. The Lincoln Tower"
                        value={formData.tower_name || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, tower_name: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-6">
                      <label htmlFor="floor-level-input" className="text-xs font-semibold text-[#1E293B] block">
                        Floor Level
                      </label>
                      <input
                        id="floor-level-input"
                        type="text"
                        placeholder="e.g. 28"
                        value={formData.floor_level || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, floor_level: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-6">
                      <label htmlFor="unit-number-input" className="text-xs font-semibold text-[#1E293B] block">
                        Unit Number
                      </label>
                      <input
                        id="unit-number-input"
                        type="text"
                        placeholder="e.g. Unit 28B"
                        value={formData.unit_number || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, unit_number: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-1.5 md:col-span-6">
                      <label htmlFor="subdivision-input" className="text-xs font-semibold text-[#1E293B] block">
                        Subdivision / Village Name
                      </label>
                      <input
                        id="subdivision-input"
                        type="text"
                        placeholder="e.g. Havila Highlands Executive Subdivision, Ayala Alabang"
                        value={formData.subdivision_name || formData.subdivision || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({
                            ...formData,
                            subdivision: e.target.value,
                            subdivision_name: e.target.value,
                          });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="phase-input" className="text-xs font-semibold text-[#1E293B] block">
                        Phase
                      </label>
                      <input
                        id="phase-input"
                        type="text"
                        placeholder="Phase 2"
                        value={formData.phase || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, phase: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="block-input" className="text-xs font-semibold text-[#1E293B] block">
                        Block
                      </label>
                      <input
                        id="block-input"
                        type="text"
                        placeholder="Block 12"
                        value={formData.block || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, block: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="lot-input" className="text-xs font-semibold text-[#1E293B] block">
                        Lot
                      </label>
                      <input
                        id="lot-input"
                        type="text"
                        placeholder="Lot 4"
                        value={formData.lot || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, lot: e.target.value });
                        }}
                        className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Full Address Preview */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Full Address Preview</span>
                </h4>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <p className="text-xs font-medium text-[#1E293B] leading-relaxed break-words">
                  {liveUnparsedAddress || <span className="text-slate-400 italic">Complete address details to preview full mailing address...</span>}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: SPECIFICATIONS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">straighten</span>
                  <span>Section 3: Property Specifications</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Define core dimensional specs, sanitary counts, architectural classification, and room breakdown.</p>
              </div>
              <span className="text-xs text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 font-semibold shrink-0">
                Mode: {formData.property_type}
              </span>
            </div>

            {/* Subtype conditional messaging */}
            {isLand && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Vacant Land listing selected: interior room specs, sanitary facilities, and room breakdowns are conditionally bypassed.</span>
              </div>
            )}

            {/* 1. DIMENSIONS & AREAS */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
                <span>Dimensions & Areas</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Floor Area & Unit */}
                {!isLand && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Floor Area
                    </label>
                    <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 450"
                        value={formData.living_area}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, living_area: val, floor_area: val });
                        }}
                        className="flex-1 min-w-0 h-11 px-4 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
                      />
                      <select
                        aria-label="Floor Area Unit"
                        value={formData.living_area_units}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, living_area_units: e.target.value, floor_area_unit: e.target.value === 'Square Meters' ? 'sqm' : 'sqft' });
                        }}
                        className="h-11 px-3 bg-slate-50 border-l border-[#CBD5E1] text-xs font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <option value="Square Meters">Square Meters (sqm)</option>
                        <option value="Square Feet">Square Feet (sqft)</option>
                      </select>
                    </div>
                    {formData.living_area && (
                      <p className="text-[11px] text-[#64748B]">
                        Equivalent: {formData.living_area_units === 'Square Meters' 
                          ? `${Math.round(Number(formData.living_area) * 10.7639).toLocaleString()} sqft` 
                          : `${(Number(formData.living_area) / 10.7639).toFixed(2)} sqm`}
                      </p>
                    )}
                  </div>
                )}

                {/* Lot Area & Unit */}
                {!isCondo && (
                  <div className="space-y-1.5">
                    <label htmlFor="lot-size-area-input" className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Lot Area <span className="text-[#FF6B6B]">*</span>
                    </label>
                    <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                      <input
                        id="lot-size-area-input"
                        aria-label="Lot Area"
                        required={!isCondo}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 600"
                        value={formData.lot_size_area}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, lot_size_area: val, lot_area: val });
                        }}
                        className="flex-1 min-w-0 h-11 px-4 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
                      />
                      <select
                        aria-label="Lot Area Unit"
                        value={formData.lot_size_units}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, lot_size_units: e.target.value, lot_area_unit: e.target.value === 'Square Meters' ? 'sqm' : 'sqft' });
                        }}
                        className="h-11 px-3 bg-slate-50 border-l border-[#CBD5E1] text-xs font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <option value="Square Meters">Square Meters (sqm)</option>
                        <option value="Square Feet">Square Feet (sqft)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Land Frontage / Access Road */}
                {isLand && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Lot Frontage / Road Access
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 25m frontage along 14m wide concrete road"
                      value={formData.lot_frontage}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, lot_frontage: e.target.value }); }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>
                )}

              </div>
            </div>

            {/* 2. ROOMS & BATHROOM COUNTS */}
            {!isLand && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-[16px]">hotel</span>
                  <span>Bedrooms & Bathrooms</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  
                  {/* Bedrooms */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.bedrooms_total}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, bedrooms_total: val, bedrooms: String(val) });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>

                  {/* Total Bathrooms */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Total Bathrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.bathrooms_total_integer}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, bathrooms_total_integer: val, bathrooms: String(val) });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>

                  {/* Full Bathrooms */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Full Bathrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.bathrooms_full}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, bathrooms_full: val });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>

                  {/* Half Bathrooms */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Half Bathrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.bathrooms_half}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, bathrooms_half: val });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* 3. STRUCTURE, ARCHITECTURE & CONDITION */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>Structure & Character</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                
                {/* Number of Floors */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={formData.stories_total}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                      setIsDirty(true);
                      setFormData({ ...formData, stories_total: val });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>

                {/* Year Built */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Year Built
                  </label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear() + 10}
                    placeholder="e.g. 2024"
                    value={formData.year_built}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, year_built: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>

                {/* Architectural Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Architectural Style
                  </label>
                  <select
                    value={formData.architectural_style}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, architectural_style: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    {architecturalStyleOptions.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Property Condition */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Property Condition
                  </label>
                  <select
                    value={formData.property_condition}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, property_condition: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    {propertyConditionOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Condo Specific: Floor Level & Tower */}
              {isCondo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Floor Level
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 28th Floor, Unit 2804"
                      value={formData.floor_level}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, floor_level: e.target.value }); }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Tower / Building Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Horizon Tower B"
                      value={formData.tower_name}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, tower_name: e.target.value }); }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. PARKING SPACES BREAKDOWN */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                <span>Parking Capacity</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Total Parking Spaces */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Total Parking Spaces
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.parking_total}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                      setIsDirty(true);
                      setFormData({ ...formData, parking_total: val, parking: String(val) });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>

                {/* Covered Parking Spaces */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Covered Parking Spaces
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.parking_covered}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                      setIsDirty(true);
                      setFormData({ ...formData, parking_covered: val });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>

                {/* Open Parking Spaces */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Open Parking Spaces
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.parking_open}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                      setIsDirty(true);
                      setFormData({ ...formData, parking_open: val });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>

              </div>
            </div>

            {/* 5. REPEATABLE ROOM DETAILS SECTION */}
            {!isLand && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                      <span>Room Details ({formData.rooms?.length || 0})</span>
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">Itemize individual rooms, dimensions, levels, and special architectural features.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setFormData(prev => ({
                        ...prev,
                        rooms: [
                          ...(prev.rooms || []),
                          {
                            id: `room-${Date.now()}`,
                            room_type: 'Bedroom',
                            room_level: '2nd Floor',
                            room_length: '',
                            room_width: '',
                            room_dimensions_units: 'Meters',
                            room_features: []
                          }
                        ]
                      }));
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Add Room</span>
                  </button>
                </div>

                {/* Rooms List */}
                {(!formData.rooms || formData.rooms.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC]">
                    <span className="material-symbols-outlined text-3xl text-slate-400">meeting_room</span>
                    <p className="text-xs font-semibold text-[#1E293B] mt-2">No individual room details added yet</p>
                    <p className="text-xs text-[#64748B] mt-1">Click "Add Room" to record dimensions and features for specific bedrooms, suites, and common areas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.rooms.map((room, roomIndex) => (
                      <div 
                        key={room.id || `room-${roomIndex}`} 
                        className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-5 space-y-4 transition-colors"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center">
                              {roomIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-[#1E293B]">
                              {room.room_type || `Room #${roomIndex + 1}`}
                            </span>
                            {room.room_level && (
                              <span className="text-[11px] text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                                {room.room_level}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setFormData(prev => ({
                                ...prev,
                                rooms: prev.rooms.filter((_, idx) => idx !== roomIndex)
                              }));
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Remove Room</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          
                          {/* Room Type */}
                          <div className="space-y-1.5 lg:col-span-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1E293B]">
                              Room Type <span className="text-[#FF6B6B]">*</span>
                            </label>
                            <select
                              value={room.room_type}
                              onChange={e => {
                                setIsDirty(true);
                                const updatedRooms = [...formData.rooms];
                                updatedRooms[roomIndex] = { ...room, room_type: e.target.value };
                                setFormData({ ...formData, rooms: updatedRooms });
                              }}
                              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                            >
                              {roomTypeOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          {/* Room Level / Floor */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1E293B]">
                              Floor / Level
                            </label>
                            <select
                              value={room.room_level}
                              onChange={e => {
                                setIsDirty(true);
                                const updatedRooms = [...formData.rooms];
                                updatedRooms[roomIndex] = { ...room, room_level: e.target.value };
                                setFormData({ ...formData, rooms: updatedRooms });
                              }}
                              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                            >
                              {roomLevelOptions.map(lvl => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                              ))}
                            </select>
                          </div>

                          {/* Dimensions: Length x Width */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1E293B]">
                              Length
                            </label>
                            <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="e.g. 5.5"
                                value={room.room_length}
                                onChange={e => {
                                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                                  setIsDirty(true);
                                  const updatedRooms = [...formData.rooms];
                                  updatedRooms[roomIndex] = { ...room, room_length: val };
                                  setFormData({ ...formData, rooms: updatedRooms });
                                }}
                                className="flex-1 min-w-0 h-10 px-3 bg-transparent outline-none text-xs font-semibold text-[#1E293B]"
                              />
                              <select
                                aria-label="Length Unit"
                                value={room.room_dimensions_units || 'Meters'}
                                onChange={e => {
                                  setIsDirty(true);
                                  const updatedRooms = [...formData.rooms];
                                  updatedRooms[roomIndex] = { ...room, room_dimensions_units: e.target.value };
                                  setFormData({ ...formData, rooms: updatedRooms });
                                }}
                                className="h-10 px-2 bg-slate-100 border-l border-[#CBD5E1] text-[11px] font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-200 transition-colors shrink-0"
                              >
                                <option value="Meters">m</option>
                                <option value="Feet">ft</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1E293B]">
                              Width
                            </label>
                            <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="e.g. 4.2"
                                value={room.room_width}
                                onChange={e => {
                                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                                  setIsDirty(true);
                                  const updatedRooms = [...formData.rooms];
                                  updatedRooms[roomIndex] = { ...room, room_width: val };
                                  setFormData({ ...formData, rooms: updatedRooms });
                                }}
                                className="flex-1 min-w-0 h-10 px-3 bg-transparent outline-none text-xs font-semibold text-[#1E293B]"
                              />
                              <select
                                aria-label="Measurement Unit"
                                value={room.room_dimensions_units || 'Meters'}
                                onChange={e => {
                                  setIsDirty(true);
                                  const updatedRooms = [...formData.rooms];
                                  updatedRooms[roomIndex] = { ...room, room_dimensions_units: e.target.value };
                                  setFormData({ ...formData, rooms: updatedRooms });
                                }}
                                className="h-10 px-2 bg-slate-100 border-l border-[#CBD5E1] text-[11px] font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-200 transition-colors shrink-0"
                              >
                                <option value="Meters">m</option>
                                <option value="Feet">ft</option>
                              </select>
                            </div>
                          </div>

                        </div>

                        {/* Room Features & Highlights Rich Text Editor */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1E293B]">
                              Room Features & Highlights
                            </label>
                            <span className="text-[10px] text-[#64748B] font-medium">Rich text enabled (bullet points, finishes, custom built-ins)</span>
                          </div>
                          <div className="border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                            <ReactQuill
                              theme="snow"
                              value={typeof room.room_features === 'string' ? room.room_features : (Array.isArray(room.room_features) ? (room.room_features.length > 0 ? `<ul>${room.room_features.map(f => `<li>${f}</li>`).join('')}</ul>` : '') : '')}
                              onChange={content => {
                                setIsDirty(true);
                                const updatedRooms = [...formData.rooms];
                                updatedRooms[roomIndex] = { ...room, room_features: content };
                                setFormData({ ...formData, rooms: updatedRooms });
                              }}
                              modules={ROOM_QUILL_MODULES}
                              placeholder="Detail finishes, fixtures, built-ins, and specific amenities (e.g. Ensuite Marble Bath, Walk-in Dressing Room, Private Veranda)..."
                              className="room-features-quill bg-white [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[#E2E8F0] [&_.ql-toolbar]:bg-slate-50/70 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[85px] [&_.ql-editor]:text-xs [&_.ql-editor]:text-[#1E293B] [&_.ql-editor]:leading-relaxed"
                            />
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: PRICING AND TERMS */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">payments</span>
                  <span>Section 4: Pricing & Terms</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Manage transaction pricing, standard currencies, association dues, and lease agreement terms.</p>
              </div>
              <span className="text-xs text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 font-semibold self-start sm:self-auto shrink-0">
                Type: {formData.transaction_type || 'For Sale'}
              </span>
            </div>

            {/* 1. PRICE GROUP */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">price_change</span>
                <span>{formData.transaction_type === 'For Rent' ? 'Rental Valuation' : 'Asking Price Valuation'}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Asking Price / Rent input with dynamic currency symbol */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    {formData.transaction_type === 'For Rent' ? 'Rent' : 'Asking Price'} <span className="text-[#FF6B6B] ml-0.5">*</span>
                  </label>
                  <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors overflow-hidden">
                    <div className="h-11 px-3.5 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-sm font-bold text-[#0F766E] select-none">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                    </div>
                    <input
                      required
                      type="text"
                      placeholder={formData.transaction_type === 'For Rent' ? "150,000" : "150,000,000"}
                      value={displayPrice}
                      onChange={handlePriceChange}
                      onBlur={handlePriceBlur}
                      onFocus={handlePriceFocus}
                      className="flex-1 h-11 px-4 bg-transparent text-base font-mono font-bold text-[#0F766E] placeholder:text-slate-400 outline-none min-w-0"
                    />
                    <div className="border-l border-[#CBD5E1] shrink-0">
                      <select
                        aria-label="Currency"
                        value={formData.currency}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, currency: e.target.value });
                        }}
                        className="h-11 px-3 bg-slate-50 text-xs font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        {currencyOptions.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formData.price ? (
                    <p className="text-[11px] font-mono text-[#0F766E] flex items-center gap-1 font-medium pt-0.5">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Formatted: {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}{Number(formData.price).toLocaleString()} {formData.transaction_type === 'For Rent' ? `/ ${formData.rent_frequency?.toLowerCase() || 'month'}` : ''}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">Enter total valuation amount</p>
                  )}
                </div>

                {/* Transactional Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Transaction Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, status: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="AVAILABLE">AVAILABLE (Active Inventory)</option>
                    <option value="RESERVED">RESERVED / UNDER CONTRACT</option>
                    <option value="SOLD">SOLD / CLOSED</option>
                    <option value="INACTIVE">INACTIVE (Deactivated)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* 2. ASSOCIATION DUES GROUP */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>Association Dues & Assessments</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Association Dues Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Association Dues
                  </label>
                  <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors overflow-hidden">
                    <div className="h-11 px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 8500"
                      value={formData.association_fee}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, association_fee: val, associationFee: val });
                      }}
                      className="flex-1 h-11 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0"
                    />
                  </div>
                  {formData.association_fee && Number(formData.association_fee) > 0 && (
                    <p className="text-[11px] text-[#0F766E] font-mono">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}{Number(formData.association_fee).toLocaleString()} / {formData.association_fee_frequency?.toLowerCase() || 'monthly'}
                    </p>
                  )}
                </div>

                {/* Dues Frequency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Dues Frequency
                  </label>
                  <select
                    value={formData.association_fee_frequency}
                    onChange={e => {
                      setIsDirty(true);
                      setFormData({ ...formData, association_fee_frequency: e.target.value, associationFeeFrequency: e.target.value });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    {associationFeeFrequencyOptions.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>

                {/* Services Included in Dues (Multiple Selection) */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] flex items-center justify-between">
                    <span>Services Included in Dues</span>
                    <span className="text-[10px] text-[#64748B] font-normal">Select all common services covered</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    {associationFeeIncludesOptions.map(service => {
                      const isChecked = Array.isArray(formData.association_fee_includes) && formData.association_fee_includes.includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            setFormData(prev => {
                              const curr = Array.isArray(prev.association_fee_includes) ? prev.association_fee_includes : [];
                              return {
                                ...prev,
                                association_fee_includes: isChecked
                                  ? curr.filter(s => s !== service)
                                  : [...curr, service]
                              };
                            });
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-teal-50 border-teal-300 text-[#0F766E] font-semibold shadow-2xs'
                              : 'bg-white border-[#CBD5E1] text-[#475569] hover:bg-slate-50'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[16px] ${isChecked ? 'text-[#0F766E]' : 'text-slate-400'}`}>
                            {isChecked ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span className="leading-snug">{service}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* 3. RENTAL TERMS GROUP (Conditionally rendered only for For Rent) */}
            {formData.transaction_type === 'For Rent' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="pb-1 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    <span>Rental Terms & Tenancy Conditions</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Define periodic frequency, minimum lease commitment, and tenant security guarantees.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  
                  {/* Rent Frequency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Rent Frequency <span className="text-[#FF6B6B]">*</span>
                    </label>
                    <select
                      value={formData.rent_frequency}
                      onChange={e => {
                        setIsDirty(true);
                        setFormData({ ...formData, rent_frequency: e.target.value });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                    >
                      {rentFrequencyOptions.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lease Term */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Lease Term
                    </label>
                    <select
                      value={formData.lease_term}
                      onChange={e => {
                        setIsDirty(true);
                        setFormData({ ...formData, lease_term: e.target.value });
                      }}
                      className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                    >
                      {leaseTermOptions.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  {/* Security Deposit Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Security Deposit
                    </label>
                    <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors overflow-hidden">
                      <div className="h-11 px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none">
                        {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 300000"
                        value={formData.security_deposit}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, security_deposit: val });
                        }}
                        className="flex-1 h-11 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0"
                      />
                    </div>
                  </div>

                  {/* Advance Rent Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Advance Rent
                    </label>
                    <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors overflow-hidden">
                      <div className="h-11 px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none">
                        {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 150000"
                        value={formData.advance_rent}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, advance_rent: val });
                        }}
                        className="flex-1 h-11 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: FEATURES AND AMENITIES */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">tune</span>
                Section 5: Features and Amenities Taxonomy
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#64748B] hidden sm:inline-flex items-center">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] mr-1.5">
                    {(formData.interior_features?.length || 0) + (formData.exterior_features?.length || 0) + (formData.amenities?.length || 0)}
                  </span>
                  selected
                </span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Filter amenities..."
                    value={amenitySearch}
                    onChange={e => setAmenitySearch(e.target.value)}
                    className="h-9 pl-8 pr-7 text-xs bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#1E293B] shadow-2xs transition-colors"
                  />
                  {amenitySearch && (
                    <button
                      type="button"
                      onClick={() => setAmenitySearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categorized Taxonomies */}
            <div className="space-y-6">
              
              {/* 5A: Interior Features */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">chair</span>
                    Interior & Spatial Finishes
                  </span>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    {formData.interior_features?.length || 0} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interiorAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).map(item => {
                    const isSelected = formData.interior_features.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleAmenityToggle(item, 'interior_features')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-[#0F766E] bg-[#0F766E] text-white font-semibold' 
                            : 'border-[#CBD5E1] text-[#1E293B] bg-white hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                        {item}
                      </button>
                    );
                  })}
                  {interiorAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">No matching interior features</p>
                  )}
                </div>
              </div>

              {/* 5B: Exterior Features */}
              <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">deck</span>
                    Exterior & Grounds Architecture
                  </span>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    {formData.exterior_features?.length || 0} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exteriorAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).map(item => {
                    const isSelected = formData.exterior_features.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleAmenityToggle(item, 'exterior_features')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-[#0F766E] bg-[#0F766E] text-white font-semibold' 
                            : 'border-[#CBD5E1] text-[#1E293B] bg-white hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                        {item}
                      </button>
                    );
                  })}
                  {exteriorAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">No matching exterior features</p>
                  )}
                </div>
              </div>

              {/* 5C: Community & Security */}
              <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    Community, Utilities & Security Infrastructure
                  </span>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    {formData.amenities?.length || 0} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {communityAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).map(item => {
                    const isSelected = formData.amenities.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleAmenityToggle(item, 'amenities')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-[#0F766E] bg-[#0F766E] text-white font-semibold' 
                            : 'border-[#CBD5E1] text-[#1E293B] bg-white hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                        {item}
                      </button>
                    );
                  })}
                  {communityAmenitiesList.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">No matching community amenities</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: MEDIA & DOCUMENTS */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">perm_media</span>
                  Section 6: Media & Documents
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Manage listing photography, architectural floor plans, video walk-throughs, virtual tours, and legal paperwork.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveUploads && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    Uploading assets...
                  </span>
                )}
                {hasUploadErrors && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Upload issues detected
                  </span>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 1. PHOTOS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>Photos</span>
                    <span className="text-slate-400 font-normal">({mediaPhotos.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload property photos. Drag or use controls to set photo order; position 1 receives the Cover Photo badge.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="photos-file-input"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <label
                    htmlFor="photos-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                    <span>Upload Photos</span>
                  </label>
                </div>
              </div>

              {mediaPhotos.length === 0 ? (
                <div className="p-8 border border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 mb-1">image_not_supported</span>
                  <p className="text-xs font-semibold text-[#64748B]">No photos added.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click “Upload Photos” to add property imagery (up to 50MB per file).</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaPhotos.map((photo, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                          if (!isNaN(fromIndex) && fromIndex !== index) {
                            handlePhotoMove(fromIndex, index);
                          }
                        }}
                        className={`group relative bg-white border rounded-lg overflow-hidden flex flex-col shadow-2xs transition-all ${
                          isCover ? 'border-[#0F766E] ring-1 ring-[#0F766E]' : 'border-[#CBD5E1] hover:border-slate-400'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={photo.imageUrl}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Cover Photo Badge */}
                          {isCover && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[#0F766E] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              Cover Photo
                            </span>
                          )}

                          {/* Upload Progress Overlay */}
                          {photo.isUploading && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-white">
                              <span className="material-symbols-outlined text-[20px] animate-spin mb-1">sync</span>
                              <span className="text-[11px] font-semibold">Uploading...</span>
                              <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-[#14B8A6] h-full transition-all duration-300" style={{ width: `${photo.progress}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Upload Error Overlay */}
                          {photo.error && (
                            <div className="absolute inset-0 bg-red-900/80 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-white text-center">
                              <span className="material-symbols-outlined text-[20px] text-red-200 mb-1">warning</span>
                              <span className="text-[11px] font-semibold text-red-100">Upload Failed</span>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handlePhotoRetry(index)}
                                  className="px-2 py-1 bg-white text-red-700 hover:bg-red-50 text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Retry Upload
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMediaPhotos(prev => prev.filter((_, idx) => idx !== index))}
                                  className="px-2 py-1 bg-red-800 text-white hover:bg-red-700 text-[10px] font-medium rounded cursor-pointer"
                                >
                                  Cancel Upload
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Preview trigger */}
                          <button
                            type="button"
                            onClick={() => setPreviewMediaItem({ type: 'image', url: photo.imageUrl, title: `Photo #${index + 1}` })}
                            className="absolute bottom-2 right-2 p-1.5 rounded bg-slate-900/70 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                            title="Preview"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                          </button>
                        </div>

                        {/* Order & Card Meta Footer */}
                        <div className="p-2.5 bg-white flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] text-[#64748B] font-semibold">
                              #{photo.displayOrder || index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handlePhotoMove(index, index - 1)}
                                className="p-1 text-slate-500 hover:text-[#0F766E] disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                                title="Move Up"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                              </button>
                              <button
                                type="button"
                                disabled={index === mediaPhotos.length - 1}
                                onClick={() => handlePhotoMove(index, index + 1)}
                                className="p-1 text-slate-500 hover:text-[#0F766E] disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                                title="Move Down"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                              </button>
                            </div>
                          </div>

                          {/* Action Strip */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => handlePhotoSetCover(index)}
                                className="px-2 py-1 bg-slate-50 hover:bg-teal-50 text-[#0F766E] rounded border border-slate-200 text-center font-semibold cursor-pointer"
                              >
                                Set as Cover
                              </button>
                            ) : (
                              <span className="px-2 py-1 bg-teal-50 text-[#0F766E] rounded text-center font-bold text-[10px]">
                                Current Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: 'Photo',
                                  index,
                                  title: `Photo #${index + 1}`,
                                  onConfirm: () => {
                                    setMediaPhotos(prev => prev.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, displayOrder: idx + 1 })));
                                    setIsDirty(true);
                                  }
                                });
                              }}
                              className="px-2 py-1 bg-slate-50 hover:bg-red-50 text-red-600 rounded border border-slate-200 text-center font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 2. FLOOR PLANS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">architecture</span>
                    <span>Floor Plans</span>
                    <span className="text-slate-400 font-normal">({mediaFloorPlans.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload architectural blueprints, schematic CAD plans, or unit layout drawings.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    id="floorplans-file-input"
                    className="hidden"
                    onChange={handleFloorPlanUpload}
                  />
                  <label
                    htmlFor="floorplans-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Upload Floor Plans</span>
                  </label>
                </div>
              </div>

              {mediaFloorPlans.length === 0 ? (
                <div className="p-6 border border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">architecture</span>
                  <p className="text-xs font-semibold text-[#64748B]">No floor plans added.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF and high-res floor plan images supported.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediaFloorPlans.map((plan, index) => {
                    const isPdf = plan.mimeType?.includes('pdf') || plan.mediaUrl?.toLowerCase().endsWith('.pdf');
                    return (
                      <div
                        key={plan.id}
                        className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Thumbnail / Icon */}
                          <div className="w-16 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {isPdf ? (
                              <span className="material-symbols-outlined text-red-600 text-[24px]">picture_as_pdf</span>
                            ) : (
                              <img src={plan.mediaUrl} alt={plan.shortDescription} className="w-full h-full object-cover" />
                            )}
                          </div>

                          {/* Description Input & Upload Progress */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={plan.shortDescription}
                              placeholder="Short Description (e.g. Ground Floor Schematic Layout)"
                              onChange={(e) => {
                                setIsDirty(true);
                                setMediaFloorPlans(prev => prev.map((p, idx) => idx === index ? { ...p, shortDescription: e.target.value } : p));
                              }}
                              className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none"
                            />
                            {plan.isUploading && (
                              <div className="flex items-center gap-2 text-[10px] text-[#0F766E]">
                                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                <span>Uploading floor plan ({plan.progress}%)...</span>
                              </div>
                            )}
                            {plan.error && (
                              <div className="flex items-center gap-2 text-[10px] text-red-600">
                                <span>Error: {plan.error}</span>
                                <button type="button" onClick={() => uploadSingleMediaFile(plan.file, 'CAD', (u) => setMediaFloorPlans(prev => prev.map((p, idx) => idx === index ? { ...p, ...u } : p)))} className="underline font-bold">
                                  Retry Upload
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controls & Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {/* Move Controls */}
                          <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleFloorPlanMove(index, index - 1)}
                              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Up"
                            >
                              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              disabled={index === mediaFloorPlans.length - 1}
                              onClick={() => handleFloorPlanMove(index, index + 1)}
                              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Down"
                            >
                              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            </button>
                          </div>

                          {/* Preview / Open Document */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isPdf) {
                                window.open(plan.mediaUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                setPreviewMediaItem({ type: 'image', url: plan.mediaUrl, title: plan.shortDescription || 'Floor Plan' });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                          >
                            {isPdf ? 'Open Document' : 'Preview'}
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => {
                              setItemToDelete({
                                type: 'Floor Plan',
                                index,
                                title: plan.shortDescription || `Floor Plan #${index + 1}`,
                                onConfirm: () => {
                                  setMediaFloorPlans(prev => prev.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, orderIndex: idx + 1 })));
                                  setIsDirty(true);
                                }
                              });
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 3. VIDEOS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">movie</span>
                    <span>Videos</span>
                    <span className="text-slate-400 font-normal">({mediaVideos.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Add cinematic walkthrough videos via direct file upload or external stream URL link.
                  </p>
                </div>
                {/* Video Source Switcher */}
                <div className="inline-flex rounded-lg border border-[#CBD5E1] p-0.5 bg-[#F8FAFC]">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('upload')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      videoSourceMode === 'upload' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Upload Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('link')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      videoSourceMode === 'link' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Add Video Link
                  </button>
                </div>
              </div>

              {/* Video Input Controls based on Source */}
              {videoSourceMode === 'upload' ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-[#1E293B]">Select Video File</p>
                    <p className="text-[11px] text-[#64748B]">MP4, WebM or MOV video up to 100MB.</p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      id="video-file-input"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    <label
                      htmlFor="video-file-input"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">video_call</span>
                      <span>Upload Video</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#1E293B] uppercase">Video URL</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or Vimeo link"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#1E293B] uppercase">Short Description</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Master Penthouse Drone Tour"
                          value={newVideoDesc}
                          onChange={(e) => setNewVideoDesc(e.target.value)}
                          className="flex-1 h-9 px-3 bg-white border border-[#CBD5E1] rounded text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
                        />
                        <button
                          type="button"
                          onClick={handleAddVideoUrl}
                          className="px-4 h-9 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded cursor-pointer shadow-2xs shrink-0"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mediaVideos.length === 0 ? (
                <div className="p-6 border border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">videocam_off</span>
                  <p className="text-xs font-semibold text-[#64748B]">No videos added.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediaVideos.map((vid, index) => (
                    <div
                      key={vid.id}
                      className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-16 h-12 rounded bg-slate-900 text-white shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">play_circle</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={vid.shortDescription}
                            placeholder="Video Description"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaVideos(prev => prev.map((v, idx) => idx === index ? { ...v, shortDescription: e.target.value } : v));
                            }}
                            className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none"
                          />
                          <p className="text-[11px] text-[#64748B] truncate font-mono">{vid.mediaUrl}</p>
                          {vid.isUploading && (
                            <div className="text-[10px] text-[#0F766E] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                              <span>Uploading video...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleVideoMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaVideos.length - 1}
                            onClick={() => handleVideoMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (vid.isLink) {
                              window.open(vid.mediaUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              setPreviewMediaItem({ type: 'video', url: vid.mediaUrl, title: vid.shortDescription || 'Listing Video' });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Video',
                              index,
                              title: vid.shortDescription || `Video #${index + 1}`,
                              onConfirm: () => {
                                setMediaVideos(prev => prev.filter((_, idx) => idx !== index).map((v, idx) => ({ ...v, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4. VIRTUAL TOURS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  <span>Virtual Tours</span>
                  <span className="text-slate-400 font-normal">({mediaVirtualTours.length})</span>
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Embed Matterport, Kuula, or 360° virtual tour URLs for interactive spatial navigation.
                </p>
              </div>

              {/* Add Tour Inputs */}
              <div className="p-4 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#1E293B] uppercase">Tour URL</label>
                    <input
                      type="url"
                      placeholder="https://my.matterport.com/show/?m=..."
                      value={newTourUrl}
                      onChange={(e) => setNewTourUrl(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#1E293B] uppercase">Short Description</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 3D Digital Twin Matterport Walkthrough"
                        value={newTourDesc}
                        onChange={(e) => setNewTourDesc(e.target.value)}
                        className="flex-1 h-9 px-3 bg-white border border-[#CBD5E1] rounded text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
                      />
                      <button
                        type="button"
                        onClick={handleAddVirtualTour}
                        className="px-4 h-9 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded cursor-pointer shadow-2xs shrink-0"
                      >
                        Add Tour
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {mediaVirtualTours.length === 0 ? (
                <div className="p-6 border border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">view_in_ar</span>
                  <p className="text-xs font-semibold text-[#64748B]">No virtual tours added.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediaVirtualTours.map((tour, index) => (
                    <div
                      key={tour.id}
                      className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded bg-teal-50 border border-teal-200 text-[#0F766E] shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">view_in_ar</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={tour.shortDescription}
                            placeholder="Tour Description"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaVirtualTours(prev => prev.map((t, idx) => idx === index ? { ...t, shortDescription: e.target.value } : t));
                            }}
                            className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none"
                          />
                          <p className="text-[11px] text-[#64748B] truncate font-mono">{tour.mediaUrl}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleTourMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaVirtualTours.length - 1}
                            onClick={() => handleTourMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(tour.mediaUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Open Tour
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Virtual Tour',
                              index,
                              title: tour.shortDescription || `Virtual Tour #${index + 1}`,
                              onConfirm: () => {
                                setMediaVirtualTours(prev => prev.filter((_, idx) => idx !== index).map((t, idx) => ({ ...t, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 5. DOCUMENTS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Documents</span>
                    <span className="text-slate-400 font-normal">({mediaDocuments.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload official disclosures, tax declarations, titles, or marketing brochures.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    id="documents-file-input"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                  <label
                    htmlFor="documents-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Upload Documents</span>
                  </label>
                </div>
              </div>

              {mediaDocuments.length === 0 ? (
                <div className="p-6 border border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">folder_off</span>
                  <p className="text-xs font-semibold text-[#64748B]">No documents added.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediaDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 text-slate-600 shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">description</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={doc.shortDescription}
                            placeholder="Document Description (e.g. Certified True Copy of Title)"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaDocuments(prev => prev.map((d, idx) => idx === index ? { ...d, shortDescription: e.target.value } : d));
                            }}
                            className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none"
                          />
                          {doc.isUploading && (
                            <div className="text-[10px] text-[#0F766E] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                              <span>Uploading document ({doc.progress}%)...</span>
                            </div>
                          )}
                          {doc.error && (
                            <div className="text-[10px] text-red-600 flex items-center gap-2">
                              <span>Error: {doc.error}</span>
                              <button type="button" onClick={() => uploadSingleMediaFile(doc.file, 'Document', (u) => setMediaDocuments(prev => prev.map((d, idx) => idx === index ? { ...d, ...u } : d)))} className="underline font-bold">
                                Retry Upload
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleDocumentMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaDocuments.length - 1}
                            onClick={() => handleDocumentMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(doc.mediaUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Open Document
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Document',
                              index,
                              title: doc.shortDescription || `Document #${index + 1}`,
                              onConfirm: () => {
                                setMediaDocuments(prev => prev.filter((_, idx) => idx !== index).map((d, idx) => ({ ...d, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confidential Broker Section */}
            <div className="p-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">lock</span>
                Confidential Broker Governance (Private & Redacted from Clients)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase">
                    Buyer Agency Commission
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3.0%"
                    value={formData.commissionSplit}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, commissionSplit: e.target.value }); }}
                    className="w-full h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase">
                    Lockbox Passcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4821"
                    value={formData.lockboxCode}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, lockboxCode: e.target.value }); }}
                    className="w-full h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-mono font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase">
                    Owner Direct Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 000 0000"
                    value={formData.seller_direct_phone}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, seller_direct_phone: e.target.value }); }}
                    className="w-full h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase">
                    Internal Showing Notes / Lockbox Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call listing agent 24 hours in advance. Keybox located at side gate column."
                    value={formData.showingInstructions}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, showingInstructions: e.target.value }); }}
                    className="w-full h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* SECTION 7: REVIEW AND SUBMIT */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div data-testid="broker-card" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[22px]">fact_check</span>
                    <span>Review Listing</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Check your details before publishing.
                  </p>
                </div>
                {/* Mobile Preview Action */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowPublicPreview(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Preview Listing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{submissionError.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmissionError(null)}
                    className="text-red-500 hover:text-red-800 cursor-pointer font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-red-600">{submissionError.message}</p>
                {Array.isArray(submissionError.errors) && submissionError.errors.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {submissionError.errors.map((err, idx) => (
                      <li key={idx}>
                        <strong className="text-red-800">{err.field}:</strong> {err.message}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setReturnToReview(true);
                            setCurrentStep(err.step);
                          }}
                          className="text-[#0F766E] font-semibold underline hover:text-[#115E59] ml-1 cursor-pointer"
                        >
                          Fix in step {err.step}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (user?.role === 'agent') {
                        executeSubmission('Pending Approval');
                      } else {
                        executeSubmission(isEditing ? formData.standard_status : 'Active');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded shadow-xs cursor-pointer transition-colors"
                  >
                    Retry Submission
                  </button>
                </div>
              </div>
            )}

            {/* Compact Missing Information Banner (Only displayed when required items are missing) */}
            {validationSummary.finalErrors.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    <span>Missing Information</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    {validationSummary.finalErrors.length} requirement{validationSummary.finalErrors.length === 1 ? '' : 's'} remaining
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {validationSummary.finalErrors.map((err, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white/90 border border-amber-200 rounded-md text-xs">
                      <span className="text-slate-700 truncate font-medium">{err.field}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReturnToReview(true);
                          setCurrentStep(err.step);
                        }}
                        className="text-[#0F766E] hover:text-[#115E59] font-semibold hover:underline shrink-0 text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Fix</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Clean Stacked Review Panel */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs divide-y divide-[#E2E8F0]">
              
              {/* 1. Basic Info */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">info</span>
                    <span>Basic Info</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(1);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[#64748B] block mb-0.5">Title</span>
                    <span className="font-semibold text-[#1E293B] text-sm">
                      {formData.title || <span className="text-amber-600 font-normal italic">Not provided</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Property Type</span>
                    <span className="font-medium text-[#1E293B]">{formData.property_type || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Transaction Type</span>
                    <span className="font-medium text-[#1E293B]">{formData.transaction_type || 'For Sale'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Property Condition</span>
                    <span className="font-medium text-[#1E293B]">{formData.property_condition || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Architectural Style</span>
                    <span className="font-medium text-[#1E293B]">{formData.architectural_style || 'Not provided'}</span>
                  </div>
                  {formData.description && (
                    <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                      <span className="text-[#64748B] block mb-1">Description</span>
                      <div 
                        className="text-slate-700 bg-slate-50 p-3 rounded-lg text-xs leading-relaxed max-h-40 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: formData.description }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Location */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">location_on</span>
                    <span>Location</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[#64748B] block mb-0.5">Generated Address</span>
                    <span className="font-medium text-[#1E293B] bg-slate-50 p-2.5 rounded-lg border border-slate-200 block text-xs">
                      {liveUnparsedAddress || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Region</span>
                    <span className="font-medium text-[#1E293B]">{formData.region || 'Not provided'}</span>
                  </div>
                  {phLocationService.isProvinceApplicable(formData.region_psgc_code) && (
                    <div>
                      <span className="text-[#64748B] block mb-0.5">Province</span>
                      <span className="font-medium text-[#1E293B]">{formData.province || 'Not provided'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#64748B] block mb-0.5">City / Municipality</span>
                    <span className="font-medium text-[#1E293B]">{formData.location || formData.city || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Barangay</span>
                    <span className="font-medium text-[#1E293B]">{formData.barangay || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Street Address</span>
                    <span className="font-medium text-[#1E293B]">{formData.address || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">ZIP Code</span>
                    <span className="font-medium text-[#1E293B]">{formData.postal_code || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Subdivision / Community</span>
                    <span className="font-medium text-[#1E293B]">{formData.subdivision_name || formData.subdivision || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Building Name</span>
                    <span className="font-medium text-[#1E293B]">{formData.building_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Coordinates (Latitude & Longitude)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#0F766E] font-medium">
                        {formData.latitude && formData.longitude 
                          ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}` 
                          : <span className="text-amber-600 font-sans font-normal italic">Not provided</span>}
                      </span>
                      {formData.latitude && formData.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${Number(formData.latitude).toFixed(6)},${Number(formData.longitude).toFixed(6)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline"
                        >
                          <span>Open in Google Maps</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="sm:col-span-2 mt-2 rounded-lg overflow-hidden border border-[#CBD5E1] bg-slate-50 relative aspect-[21/9]">
                      <iframe
                        title="Review Google Maps Cadastral Pinpoint"
                        src={`https://maps.google.com/maps?q=${Number(formData.latitude).toFixed(6)},${Number(formData.longitude).toFixed(6)}&t=m&z=15&output=embed`}
                        className="w-full h-full border-0 select-none"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Specifications */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">tune</span>
                    <span>Specifications</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(3);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Bedrooms</span>
                    <span className="font-medium text-[#1E293B]">{formData.bedrooms_total !== '' && formData.bedrooms_total !== undefined ? formData.bedrooms_total : (formData.bedrooms !== '' && formData.bedrooms !== undefined ? formData.bedrooms : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Bathrooms</span>
                    <span className="font-medium text-[#1E293B]">{formData.bathrooms_total_integer !== '' && formData.bathrooms_total_integer !== undefined ? formData.bathrooms_total_integer : (formData.bathrooms !== '' && formData.bathrooms !== undefined ? formData.bathrooms : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Floor Area</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.living_area || formData.floor_area 
                        ? `${formData.living_area || formData.floor_area} ${formData.living_area_units || formData.floor_area_unit || 'sqm'}` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Lot Area</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.lot_size_area || formData.lot_area 
                        ? `${formData.lot_size_area || formData.lot_area} ${formData.lot_size_units || formData.lot_area_unit || 'sqm'}` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Parking Spaces</span>
                    <span className="font-medium text-[#1E293B]">{formData.parking_total !== '' && formData.parking_total !== undefined ? formData.parking_total : (formData.parking !== '' && formData.parking !== undefined ? formData.parking : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Year Built</span>
                    <span className="font-medium text-[#1E293B]">{formData.year_built || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Pricing & Terms */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">payments</span>
                    <span>Pricing & Terms</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(4);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Price</span>
                    <span className="font-mono font-bold text-[#0F766E] text-base">
                      {formData.price 
                        ? `${formData.currency || 'PHP'} ${Number(formData.price).toLocaleString()}` 
                        : <span className="text-amber-600 font-sans font-normal italic text-xs">Price not entered</span>}
                    </span>
                  </div>
                  {formData.transaction_type === 'For Rent' && (
                    <div>
                      <span className="text-[#64748B] block mb-0.5">Rent Frequency</span>
                      <span className="font-medium text-[#1E293B]">{formData.rent_frequency || 'Monthly'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Association Dues</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.association_fee 
                        ? `${formData.currency || 'PHP'} ${Number(formData.association_fee).toLocaleString()} (${formData.association_fee_frequency || 'Monthly'})` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Price / Sqm</span>
                    <span className="font-mono text-[#1E293B]">
                      {formData.price && (formData.living_area || formData.floor_area)
                        ? `${formData.currency || 'PHP'} ${Math.round(Number(formData.price) / Number(formData.living_area || formData.floor_area)).toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Features & Amenities */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">auto_awesome</span>
                    <span>Features & Amenities</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(5);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Shared Amenities ({formData.amenities.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.amenities.length > 0 ? (
                        formData.amenities.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Indoor Features ({formData.interior_features.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.interior_features.length > 0 ? (
                        formData.interior_features.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Outdoor Features ({formData.exterior_features.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.exterior_features.length > 0 ? (
                        formData.exterior_features.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Media & Documents */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">photo_library</span>
                    <span>Media & Documents</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(6);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    {mediaPhotos[0] ? (
                      <img
                        src={mediaPhotos[0].imageUrl}
                        alt="Cover Photo"
                        className="w-16 h-12 rounded object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#1E293B]">
                        {mediaPhotos.length > 0 ? `${mediaPhotos.length} Photo${mediaPhotos.length === 1 ? '' : 's'}` : <span className="text-amber-600 font-normal italic">Add a cover photo</span>}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {mediaFloorPlans.length} Floor plan{mediaFloorPlans.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#64748B]">Additional Assets</p>
                    <p className="font-medium text-[#1E293B]">
                      {mediaVideos.length} Video{mediaVideos.length === 1 ? '' : 's'} • {mediaVirtualTours.length} Virtual tour{mediaVirtualTours.length === 1 ? '' : 's'} • {mediaDocuments.length} Document{mediaDocuments.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Listing Settings */}
            <div className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-lg space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-[#1E293B]">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">settings</span>
                <span>Listing Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Listing Status Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E293B] block">
                    Listing Status
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                      formData.standard_status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : formData.standard_status === 'Pending Approval' || formData.standard_status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : formData.standard_status === 'Draft'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-teal-50 text-[#0F766E] border-teal-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        formData.standard_status === 'Active'
                          ? 'bg-emerald-500'
                          : formData.standard_status === 'Pending Approval' || formData.standard_status === 'Pending'
                          ? 'bg-amber-500'
                          : formData.standard_status === 'Draft'
                          ? 'bg-slate-400'
                          : 'bg-[#0F766E]'
                      }`} />
                      {formData.standard_status || 'Draft'}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Read-only status
                    </span>
                  </div>
                </div>

                {/* Featured Property Toggle (Authorized Staff) */}
                {(!user || ['broker', 'admin'].includes(user?.role)) ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                      <label htmlFor="featured-toggle" className="text-xs font-semibold text-[#1E293B] cursor-pointer">
                        Featured Property
                      </label>
                      <button
                        type="button"
                        id="featured-toggle"
                        role="switch"
                        aria-checked={Boolean(formData.is_featured)}
                        onClick={() => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }));
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.is_featured ? 'bg-[#0F766E]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            formData.is_featured ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Highlight this listing on the homepage and search results.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold text-[#1E293B] block">
                      Featured Property
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      Featured property status requires broker or administrator authorization.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Information (Collapsible Section) */}
            {(!user || ['broker', 'agent', 'admin'].includes(user?.role)) && (
              <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsInternalInfoOpen(prev => !prev)}
                  className="w-full p-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0F766E]">lock</span>
                    <div>
                      <span className="text-xs font-bold text-[#1E293B] block">Internal Information</span>
                      <span className="text-[11px] text-[#64748B]">Visible only to authorized staff.</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isInternalInfoOpen ? 'rotate-180 text-[#0F766E]' : ''}`} />
                </button>

                {isInternalInfoOpen && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    {/* Private Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1E293B] block">
                        Private Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add confidential broker remarks or negotiation history..."
                        value={formData.privateNotes || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, privateNotes: e.target.value });
                        }}
                        className="w-full p-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Showing Instructions */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1E293B] block">
                        Showing Instructions
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Call listing agent 24 hours in advance. Lockbox located at side gate column."
                        value={formData.showingInstructions || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, showingInstructions: e.target.value });
                        }}
                        className="w-full p-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-xs text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Wizard Navigation Footer / Bottom Action Bar (Visible while scrolling) */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0] p-4 sm:p-5 -mx-4 sm:-mx-6 lg:-mx-8 mt-8 shadow-md">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={currentStep === 1 || isSubmitting}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="h-11 px-5"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
              {isDrawer ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-11 px-4 text-slate-600 hover:text-[#1E293B]"
                >
                  Cancel & Exit
                </Button>
              ) : (
                <Link
                  to="/broker/properties"
                  className="h-11 px-4 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-slate-600 hover:text-[#1E293B] text-xs font-semibold flex items-center transition-colors shadow-2xs"
                >
                  Cancel & Exit
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentStep < 7 ? (
                <>
                  {returnToReview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setReturnToReview(false);
                        setCurrentStep(7);
                      }}
                      className="w-full sm:w-auto h-11 px-5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border-teal-300"
                    >
                      <span>Return to Review</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                    className="w-full sm:w-auto h-11 px-6"
                  >
                    <span>Next Section</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Save Draft Action */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => executeSubmission('Draft')}
                    className="w-full sm:w-auto h-11 px-5"
                  >
                    {isSubmitting && activeActionLabel === 'Saving...' ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    ) : (
                      <FileText className="size-3.5 text-slate-500" />
                    )}
                    <span>{isSubmitting && activeActionLabel === 'Saving...' ? 'Saving…' : 'Save Draft'}</span>
                  </Button>

                  {/* Primary Workflow Action Button */}
                  {(() => {
                    const isAgent = user?.role === 'agent';

                    if (isEditing) {
                      if (isAgent) {
                        return (
                          <Button
                            type="button"
                            variant="coral"
                            disabled={isSubmitting}
                            onClick={() => executeSubmission('Pending Approval')}
                            className="w-full sm:w-auto h-11 px-7 font-bold"
                          >
                            {isSubmitting ? (
                              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span>{isSubmitting ? (activeActionLabel || 'Submitting…') : 'Submit Changes for Review'}</span>
                          </Button>
                        );
                      }
                      return (
                        <Button
                          type="button"
                          variant="default"
                          disabled={isSubmitting}
                          onClick={() => executeSubmission(formData.standard_status || 'Active')}
                          className="w-full sm:w-auto h-11 px-7 font-bold"
                        >
                          {isSubmitting ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          ) : (
                            <Check className="size-3.5 stroke-[3]" />
                          )}
                          <span>{isSubmitting ? (activeActionLabel || 'Saving…') : 'Save Changes'}</span>
                        </Button>
                      );
                    }

                    if (isAgent) {
                      return (
                        <Button
                          type="button"
                          variant="coral"
                          disabled={isSubmitting}
                          onClick={() => executeSubmission('Pending Approval')}
                          className="w-full sm:w-auto h-11 px-7 font-bold"
                        >
                          {isSubmitting ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          <span>{isSubmitting ? (activeActionLabel || 'Submitting…') : 'Submit for Review'}</span>
                        </Button>
                      );
                    }

                    return (
                      <Button
                        type="button"
                        variant="coral"
                        disabled={isSubmitting}
                        onClick={() => executeSubmission('Active')}
                        className="w-full sm:w-auto h-11 px-7 font-bold"
                      >
                        {isSubmitting ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>{isSubmitting ? (activeActionLabel || 'Publishing…') : 'Publish Listing'}</span>
                      </Button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>

    {/* Right Column: Listing Preview (Sticky Sidebar) */}
    <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-5">
      <div data-testid="broker-card" className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Listing Preview
          </h4>
          <span className="text-[11px] font-mono font-medium text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
            Step {currentStep} of 7
          </span>
        </div>

        {/* Media Preview / Cover Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center">
          {mediaPhotos.length > 0 ? (
            <img
              src={mediaPhotos[0].imageUrl}
              alt="Listing Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 gap-1">
              <ImageIcon className="w-7 h-7 text-slate-300 stroke-[1.5]" />
              <span className="text-[11px]">No cover photo uploaded</span>
            </div>
          )}
          <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded">
            {formData.transaction_type}
          </span>
          {formData.is_featured && (
            <span className="absolute top-2 right-2 bg-[#FF6B6B] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Title & Price */}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[#1E293B] line-clamp-2">
            {formData.title || <span className="text-slate-400 font-normal italic">Untitled Property</span>}
          </p>
          <p className="text-xl font-bold font-mono text-[#0F766E]">
            {formData.price 
              ? `${formData.currency || 'PHP'} ${Number(formData.price).toLocaleString()}` 
              : <span className="text-slate-400 font-sans text-xs">Price not entered</span>}
          </p>
        </div>

        {/* Essential Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Type</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">{formData.property_type || '—'}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Area</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">
              {formData.living_area || formData.floor_area 
                ? `${formData.living_area || formData.floor_area} ${formData.living_area_units || formData.floor_area_unit || 'sqm'}` 
                : '—'}
            </span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Bed / Bath</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">
              {formData.bedrooms_total || formData.bedrooms || 0} Beds • {formData.bathrooms_total_integer || formData.bathrooms || 0} Baths
            </span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Location</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">
              {formData.location || formData.city || '—'}
            </span>
          </div>
        </div>

        {/* Single Preview Listing Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowPublicPreview(true)}
            className="w-full h-10 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Preview Listing</span>
          </button>
        </div>
      </div>
    </div>
  </div>

      {/* Success Modal */}
      <DashboardModal
        isOpen={showSuccessModal}
        onClose={() => {
          if (isDrawer && onClose) onClose();
          else navigate('/broker/properties');
        }}
        title={
          savedStatusType === 'Draft' 
            ? "Listing Saved as Draft" 
            : savedStatusType === 'Pending Approval'
            ? "Listing Submitted for Review"
            : isEditing 
            ? "Listing Changes Saved" 
            : "Listing Published Successfully"
        }
        subtitle="Your property listing specifications and media assets have been recorded in the database."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {createdPropertyId && (
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/properties/${createdPropertyId}`);
                }}
                className="h-10 px-4 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                View Listing
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setShowPublicPreview(true);
              }}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Preview Listing
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDrawer && onClose) onClose();
                else navigate('/broker/properties');
              }}
              className="h-10 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Back to Listings
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-[#64748B]">
          <p>
            Property <strong className="text-[#1E293B]">{formData.title || 'Untitled Property'}</strong> has been registered with status: <strong className="text-[#0F766E] font-bold">{savedStatusType}</strong>.
          </p>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 text-[11px] text-[#64748B]">
            <div><span className="font-semibold text-slate-700">Property Identifier:</span> <span className="font-mono text-slate-800">{createdPropertyId || id || 'Pending'}</span></div>
            <div><span className="font-semibold text-slate-700">Cadastral Location:</span> {formData.location || 'Metro Manila'} (Coordinates: {formData.latitude || '14.5995'}, {formData.longitude || '120.9842'})</div>
            <div><span className="font-semibold text-slate-700">Valuation:</span> {formData.currency || 'PHP'} {Number(formData.price || 0).toLocaleString()}</div>
          </div>
        </div>
      </DashboardModal>

      {/* Public Listing Preview Modal (Strictly Redacting Confidential Fields) */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">public</span>
                  Public Listing Preview
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Exact rendering visible to buyers and clients (internal broker remarks & codes are strictly excluded).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                aria-label="Close Preview"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Media Gallery / Cover View */}
              <div className="relative aspect-video sm:aspect-21/9 rounded-xl overflow-hidden bg-slate-900 border border-[#E2E8F0]">
                {mediaPhotos.length > 0 ? (
                  <img
                    src={mediaPhotos[0].imageUrl}
                    alt="Cover Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageIcon className="w-10 h-10 text-slate-500 stroke-[1.5]" />
                    <span className="text-xs">No cover photo uploaded</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded">
                    {formData.transaction_type}
                  </span>
                  <span className="bg-[#0F766E] text-white text-xs font-semibold px-2.5 py-1 rounded">
                    {formData.property_type}
                  </span>
                  {formData.is_featured && (
                    <span className="bg-[#FF6B6B] text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
                {mediaPhotos.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded font-semibold">
                    1 of {mediaPhotos.length} Photos
                  </span>
                )}
              </div>

              {/* Title & Pricing Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1E293B]">
                    {formData.title || 'Untitled Property'}
                  </h2>
                  <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0F766E]">location_on</span>
                    {formData.address ? `${formData.address}, ${formData.location}` : formData.location || 'Metro Manila, Philippines'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold font-mono text-[#0F766E]">
                    {formData.currency || 'PHP'} {formData.price ? Number(formData.price).toLocaleString() : '0'}
                  </div>
                  {formData.transaction_type === 'For Rent' && (
                    <span className="text-xs text-[#64748B]">Per {formData.rent_frequency || 'Month'}</span>
                  )}
                </div>
              </div>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bedrooms</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.bedrooms_total || formData.bedrooms}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bathrooms</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.bathrooms_total_integer || formData.bathrooms}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Living Area</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.living_area || formData.floor_area || '—'} {formData.living_area_units || formData.floor_area_unit}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Parking</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.parking_total || formData.parking} Slots</span>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Property Description
                  </h4>
                  <div 
                    className="text-xs text-[#64748B] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}

              {/* Amenities & Features */}
              {([...formData.amenities, ...formData.interior_features, ...formData.exterior_features].length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Features & Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...formData.amenities, ...formData.interior_features, ...formData.exterior_features].map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] rounded-full text-xs font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Media Assets (Floor Plans, Videos, Tours) */}
              {(mediaFloorPlans.length > 0 || mediaVideos.length > 0 || mediaVirtualTours.length > 0) && (
                <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Interactive Media & Assets
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {mediaFloorPlans.map((plan, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">architecture</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{plan.shortDescription || `Floor Plan #${idx + 1}`}</span>
                        </div>
                        <a href={plan.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          View
                        </a>
                      </div>
                    ))}
                    {mediaVideos.map((vid, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">videocam</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{vid.shortDescription || `Video #${idx + 1}`}</span>
                        </div>
                        <a href={vid.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          Watch
                        </a>
                      </div>
                    ))}
                    {mediaVirtualTours.map((tour, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">360</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{tour.shortDescription || `Virtual Tour #${idx + 1}`}</span>
                        </div>
                        <a href={tour.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          Open Tour
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                Public Preview Mode • Confidential fields suppressed
              </span>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="h-10 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Done with Preview
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Media Preview Modal */}
      {previewMediaItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0F766E] text-[18px]">visibility</span>
                <span>{previewMediaItem.title || 'Media Preview'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setPreviewMediaItem(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              {previewMediaItem.type === 'video' ? (
                <video src={previewMediaItem.url} controls className="max-h-[65vh] max-w-full rounded" autoPlay />
              ) : (
                <img src={previewMediaItem.url} alt="Preview" className="max-h-[65vh] max-w-full object-contain rounded" />
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewMediaItem(null)}
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg hover:bg-[#115E59] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {itemToDelete && (
        <div role="dialog" aria-modal="true" aria-label="Remove Confirmation" data-testid="broker-dialog" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1E293B]">Remove this item from the listing?</h4>
              <p className="text-xs text-[#64748B] mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{itemToDelete.title}</span>? Unlinked assets will be excluded from the published listing.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.onConfirm) itemToDelete.onConfirm();
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
