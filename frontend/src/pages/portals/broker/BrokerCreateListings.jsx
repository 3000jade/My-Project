import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, 
  FileText, MapPin, Sliders, DollarSign, Sparkles, 
  Image as ImageIcon, Send, Lock, Building2, User, ChevronDown
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import propertyService, { normalizeProperty, toApiPayload } from '../../../services/propertyService';
import mapsService from '../../../services/mapsService';
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

const BROKER_AGENTS = [
  { id: 'agent-1', name: 'Elena Rossi', title: 'Senior Property Consultant' },
  { id: 'agent-2', name: 'Alexander Sterling', title: 'Principal Architectural Director' },
  { id: 'agent-3', name: 'Victoria Vance', title: 'Luxury Portfolio Specialist' },
  { id: 'agent-4', name: 'Marcus Chen', title: 'Managing Partner & Broker' },
  { id: 'agent-5', name: 'Sofia Laurent', title: 'Commercial Acquisitions Lead' },
];

export default function BrokerCreateListings({ isDrawer = false, onClose } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const [formData, setFormData] = useState({
    title: '',
    transaction_type: 'For Sale',
    property_type: 'House & Lot',
    property_condition: 'RFO',
    price: '',
    currency: '₱',
    price_term: 'Total Contract Price',
    is_negotiable: false,
    location: '',
    address: '',
    subdivision: '',
    barangay: '',
    province: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    description: '',
    bedrooms: '3',
    bathrooms: '3',
    stories_total: '1',
    parking: '1',
    floor_area: '',
    floor_area_unit: 'sqm',
    lot_area: '',
    lot_area_unit: 'sqm',
    lot_frontage: '',
    floor_level: '',
    tower_name: '',
    furnishing: 'Fully Furnished',
    year_built: new Date().getFullYear().toString(),
    status: 'AVAILABLE',
    standard_status: 'Active',
    is_published: true,
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
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
    associationFee: '',
    associationFeeFrequency: 'Monthly',
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
  const [savedStatusType, setSavedStatusType] = useState('Active');
  const [amenitySearch, setAmenitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isDirty, setIsDirty] = useState(false);

  // 7 Canonical Form Sections per PROPERTY_LISTING_FORM.md
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Nominatim Autocomplete & Reverse Geocoding States
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const mapSearchContainerRef = useRef(null);

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
    try {
      const geo = await mapsService.reverse(pos[0], pos[1]);
      if (geo) {
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
    setFormData(prev => ({
      ...prev,
      latitude: item.latitude ? parseFloat(item.latitude).toFixed(7) : prev.latitude,
      longitude: item.longitude ? parseFloat(item.longitude).toFixed(7) : prev.longitude,
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

  const [propertyTypeOptions, setPropertyTypeOptions] = useState(() => {
    const saved = localStorage.getItem('customPropertyTypes');
    return saved ? JSON.parse(saved) : ['House & Lot', 'Condominium', 'Townhouse', 'Commercial', 'Penthouse', 'Estate', 'Vacant Land / Lot', 'Villa'];
  });
  const [propertyConditionOptions, setPropertyConditionOptions] = useState(() => {
    const saved = localStorage.getItem('customPropertyConditions');
    return saved ? JSON.parse(saved) : ['Pre-selling', 'RFO', 'Bare Shell', 'Fitted', 'Raw Land', 'Fully Titled'];
  });
  const [manageCategoryModal, setManageCategoryModal] = useState({ isOpen: false, type: null });
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const cat = newCategoryInput.trim();
    if (manageCategoryModal.type === 'propertyType') {
      if (!propertyTypeOptions.includes(cat)) {
        const newOpts = [...propertyTypeOptions, cat];
        setPropertyTypeOptions(newOpts);
        localStorage.setItem('customPropertyTypes', JSON.stringify(newOpts));
      }
      setFormData({ ...formData, property_type: cat });
    } else {
      if (!propertyConditionOptions.includes(cat)) {
        const newOpts = [...propertyConditionOptions, cat];
        setPropertyConditionOptions(newOpts);
        localStorage.setItem('customPropertyConditions', JSON.stringify(newOpts));
      }
      setFormData({ ...formData, property_condition: cat });
    }
    setNewCategoryInput('');
  };

  const stepTitles = [
    'Basic Info',
    'Location',
    'Specifications',
    'Pricing & Terms',
    'Amenities',
    'Media & Docs',
    'Review & Submit'
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
    if (!isEditing) return;
    const fetchProperty = async () => {
      try {
        const p = await propertyService.getPropertyById(id);
        if (p) {
          setFormData(prev => ({
            ...prev,
            title: p.title || '',
            property_type: p.property_type || p.type || 'House & Lot',
            property_condition: p.property_condition || 'RFO',
            transaction_type: p.transaction_type || 'For Sale',
            price: p.price_raw || p.price || '',
            location: p.location?.city || p.city || p.location || '',
            address: p.location?.address || p.address || '',
            subdivision: p.location?.subdivisionName || p.subdivision_name || '',
            barangay: p.location?.barangay || p.barangay || '',
            province: p.location?.province || p.province || '',
            postal_code: p.location?.postalCode || p.postal_code || '',
            latitude: p.location?.coordinates?.lat || p.latitude || '',
            longitude: p.location?.coordinates?.lng || p.longitude || '',
            description: p.publicRemarks || p.description || '',
            status: p.status || 'AVAILABLE',
            standard_status: p.standard_status || p.standardStatus || 'Active',
            is_published: p.is_published !== undefined ? p.is_published : true,
            amenities: p.features || p.amenities || [],
            interior_features: p.interior_features || p.interiorFeatures || [],
            exterior_features: p.exterior_features || p.exteriorFeatures || [],
            floor_area: p.specs?.livingArea || p.livingArea || p.sqft || '',
            lot_area: p.specs?.lotSizeArea || p.lot_size_area || '',
            lot_frontage: p.customResoAttributes?.lotFrontage || '',
            floor_level: p.floor_level || '',
            tower_name: p.tower_name || '',
            furnishing: p.furnishing || 'Fully Furnished',
            year_built: String(p.specs?.yearBuilt || p.year_built || new Date().getFullYear()),
            bedrooms: String(p.specs?.beds || p.bedrooms_total || '3'),
            bathrooms: String(p.specs?.baths || p.bathrooms_total_integer || '3'),
            stories_total: String(p.specs?.storiesTotal || p.stories_total || '1'),
            parking: String(p.specs?.parkingTotal || p.parking || '1'),
            listing_id: p.listing_id || '',
            cadastralLotId: p.listingKey || p.listing_key || '',
            commissionSplit: p.confidential?.buyerAgencyCompensation || p.buyer_agency_compensation || '3.0%',
            lockboxCode: p.confidential?.lockboxCode || p.lockbox_code || '',
            showingInstructions: p.confidential?.showingInstructions || p.showing_instructions || '',
            privateNotes: p.confidential?.privateRemarks || p.private_remarks || '',
            seller_direct_phone: p.confidential?.sellerDirectPhone || p.seller_direct_phone || '',
            associationFee: p.associationFee || p.association_fee || '',
            associationFeeFrequency: p.associationFeeFrequency || p.association_fee_frequency || 'Monthly',
            taxAnnualAmount: p.taxAnnualAmount || p.tax_annual_amount || '',
            originalListPrice: p.originalListPrice || p.original_list_price || '',
            blueprintUrl: p.blueprintUrl || '',
            virtualTourUrl: p.virtualTourUrl || ''
          }));
          setDisplayPrice(Number(p.price_raw || p.price || 0).toLocaleString());
        }
      } catch (error) {
        console.error("Error fetching property", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [id, isEditing]);

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

  const handleFileChange = (e) => {
    if (e.target.files) {
      setIsDirty(true);
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsDirty(true);
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = (index) => {
    setIsDirty(true);
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit action handler supporting explicit Draft vs Publish workflows
  const executeSubmission = async (targetStandardStatus = 'Active') => {
    if (targetStandardStatus === 'Active') {
      if (!formData.title || formData.title.trim().length < 3) {
        alert('Please provide a listing title of at least 3 characters.');
        setCurrentStep(1);
        return;
      }
      if (!formData.price || Number(formData.price) <= 0) {
        alert('Please specify a valid positive listing price.');
        setCurrentStep(4);
        return;
      }
      if (!formData.address.trim()) {
        alert('Please enter a valid complete property address.');
        setCurrentStep(2);
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        alert('Please ensure the property location is pinned on the map in Section 2.');
        setCurrentStep(2);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isDraft = targetStandardStatus === 'Draft';
      const determinedStatus = isDraft ? 'INACTIVE' : (formData.status || 'AVAILABLE');
      
      const payload = toApiPayload({
        ...formData,
        standardStatus: targetStandardStatus,
        status: determinedStatus,
        is_published: !isDraft,
      });

      let propertyId = id;
      if (isEditing) {
        await propertyService.updateProperty(id, payload);
      } else {
        const res = await propertyService.createProperty(payload);
        propertyId = res?.id || res?.data?.id;
      }

      if (selectedFiles.length > 0 && propertyId) {
        const uploadData = new FormData();
        selectedFiles.forEach(file => {
          uploadData.append('media', file);
        });
        await propertyService.uploadMedia(propertyId, uploadData);
      }

      setIsDirty(false);
      setSavedStatusType(targetStandardStatus);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[BrokerCreateListings] Submission error:', err);
      alert('Error saving property: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSubmission('Active');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="material-symbols-outlined text-4xl text-[#0D4446] animate-spin">sync</span>
      </div>
    );
  }

  const isCondo = formData.property_type === 'Condominium';
  const isLand = formData.property_type === 'Vacant Land / Lot' || formData.property_type === 'Land';

  // Section 7 Validation Checklist state
  const validationSummary = {
    hasTitle: Boolean(formData.title && formData.title.trim().length >= 3),
    hasPrice: Boolean(formData.price && Number(formData.price) > 0),
    hasAddress: Boolean(formData.address && formData.address.trim().length > 0),
    hasCoordinates: Boolean(formData.latitude && formData.longitude),
    hasMedia: selectedFiles.length > 0,
  };

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
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#E2E8F0] shadow-xs mb-6 overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-between min-w-[720px] relative">
          {/* Subtle background connecting track */}
          <div className="absolute top-4 left-8 right-8 h-[2px] bg-[#E2E8F0] -z-0" />

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
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all shadow-2xs ${
                  isActive 
                    ? 'bg-[#0F766E] text-white ring-4 ring-[#0F766E]/15 border border-[#0F766E]' 
                    : isCompleted 
                    ? 'bg-[#0F766E] text-white border border-[#0F766E]' 
                    : 'bg-white text-slate-500 border border-[#E2E8F0] hover:border-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : stepNum}
                </div>
                <span className={`text-xs text-center transition-colors ${
                  isActive ? 'text-[#0F766E] font-bold' : isCompleted ? 'text-[#1E293B] font-medium' : 'text-[#64748B]'
                }`}>
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (8 Cols) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================================= */}
        {/* SECTION 1: BASIC PROPERTY INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0F766E]" />
                <span>Section 1: Basic Property Information</span>
              </h3>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                    ID: {id}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium bg-slate-100 text-[#475569] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
                    New Listing Draft
                  </span>
                )}
                <span className="text-[11px] font-mono bg-teal-50 text-[#0F766E] border border-teal-200 px-2.5 py-1 rounded-md font-semibold">
                  MLS: {formData.listing_id || 'MLS-PENDING'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 md:col-span-3">
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

              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] truncate">
                    Category / Type <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setManageCategoryModal({ isOpen: true, type: 'propertyType' })}
                    className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer whitespace-nowrap pl-2 shrink-0"
                  >
                    + Manage
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formData.property_type}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, property_type: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer appearance-none shadow-2xs transition-colors"
                  >
                    {propertyTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block h-5">
                  Assigned Consultant
                </label>
                <div className="relative">
                  <select
                    value={formData.agent_id}
                    onChange={e => {
                      const agent = BROKER_AGENTS.find(a => a.id === e.target.value);
                      setIsDirty(true);
                      setFormData({ 
                        ...formData, 
                        agent_id: e.target.value,
                        agent_name: agent ? agent.name : formData.agent_name 
                      });
                    }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer appearance-none shadow-2xs transition-colors"
                  >
                    {BROKER_AGENTS.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Property Description <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    Rich Text Formatting
                  </span>
                </div>
                <div className="bg-white rounded-lg border border-[#CBD5E1] hover:border-slate-400 overflow-hidden shadow-2xs transition-colors focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E]">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={val => { setIsDirty(true); setFormData({ ...formData, description: val }); }}
                    placeholder="Describe spatial geometry, materials, lighting orientations, and architectural finishings..."
                    className="min-h-[140px]"
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Highlight key architectural elements, finishes, views, and amenities for prospective clients.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PROPERTY LOCATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">pin_drop</span>
                <span>Section 2: Property Location & Cadastral Pin</span>
              </h3>
              <span className="text-xs text-[#64748B]">
                Interactive Geocoding & Map Placement
              </span>
            </div>

            {/* Predictive Search Strip */}
            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
              <div className="flex flex-col sm:flex-row gap-2" ref={mapSearchContainerRef}>
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search Philippine address or landmark (e.g. Ayala Alabang, Muntinlupa)..."
                    value={mapSearchQuery}
                    onChange={e => setMapSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGeocode(e); }}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                  />
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectAddressSuggestion(item)}
                          className="px-4 py-2 hover:bg-[#F8FAFC] text-xs text-[#1E293B] cursor-pointer border-b border-[#E2E8F0] last:border-none"
                        >
                          {item.formattedAddress || item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="h-11 px-5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#115E59] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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

            {/* Interactive Map */}
            <div className="rounded-lg overflow-hidden border border-[#CBD5E1] h-72 relative">
              <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={formData.latitude && formData.longitude ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] : null} 
                  setPosition={handleMapPositionChange}
                  onPinMoved={handlePinMoved}
                />
              </MapContainer>
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md border border-teal-200 text-[11px] font-mono text-[#0F766E] shadow-sm z-[1000] flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                <span>Pin: {formData.latitude || '14.55'}, {formData.longitude || '121.05'}</span>
              </div>
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Complete Street Address <span className="text-[#FF6B6B]">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 142 Acacia Avenue, Phase 2"
                  value={formData.address}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, address: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Subdivision / Building Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ayala Alabang Village"
                  value={formData.subdivision}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, subdivision: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Barangay
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ayala Alabang"
                  value={formData.barangay}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, barangay: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  City / Municipality <span className="text-[#FF6B6B]">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Muntinlupa City"
                  value={formData.location}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, location: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Province / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro Manila (NCR)"
                  value={formData.province}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, province: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: SPECIFICATIONS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">straighten</span>
                <span>Section 3: Dimensions & Architectural Configuration</span>
              </h3>
              <span className="text-xs text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 font-semibold">
                Mode: {formData.property_type}
              </span>
            </div>

            {/* Subtype conditional messaging */}
            {isLand && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Vacant Land listing selected: interior room specs (Bedrooms, Bathrooms, Floors) are conditionally bypassed.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              
              {/* Floor / Living Area (Hidden for vacant land) */}
              {!isLand && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Floor / Living Area
                  </label>
                  <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.floor_area}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, floor_area: e.target.value }); }}
                      className="flex-1 h-11 px-4 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
                    />
                    <div className="flex border-l border-[#CBD5E1]">
                      <button 
                        type="button" 
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, floor_area_unit: 'sqm' }); }} 
                        className={`px-3 text-xs font-bold transition-colors cursor-pointer ${formData.floor_area_unit === 'sqm' ? 'bg-[#0F766E] text-white' : 'bg-slate-50 text-[#64748B] hover:text-[#1E293B]'}`}
                      >
                        sqm
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, floor_area_unit: 'sqft' }); }} 
                        className={`px-3 text-xs font-bold border-l border-[#CBD5E1] transition-colors cursor-pointer ${formData.floor_area_unit === 'sqft' ? 'bg-[#0F766E] text-white' : 'bg-slate-50 text-[#64748B] hover:text-[#1E293B]'}`}
                      >
                        sqft
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lot Area (Hidden for Condominium) */}
              {!isCondo && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Lot Size Area <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-lg overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.lot_area}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, lot_area: e.target.value }); }}
                      className="flex-1 h-11 px-4 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
                    />
                    <div className="flex border-l border-[#CBD5E1]">
                      <button 
                        type="button" 
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, lot_area_unit: 'sqm' }); }} 
                        className={`px-3 text-xs font-bold transition-colors cursor-pointer ${formData.lot_area_unit === 'sqm' ? 'bg-[#0F766E] text-white' : 'bg-slate-50 text-[#64748B] hover:text-[#1E293B]'}`}
                      >
                        sqm
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, lot_area_unit: 'sqft' }); }} 
                        className={`px-3 text-xs font-bold border-l border-[#CBD5E1] transition-colors cursor-pointer ${formData.lot_area_unit === 'sqft' ? 'bg-[#0F766E] text-white' : 'bg-slate-50 text-[#64748B] hover:text-[#1E293B]'}`}
                      >
                        sqft
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lot Frontage for Land */}
              {isLand && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Lot Frontage / Road Access
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24m Frontage, 12m wide access road"
                    value={formData.lot_frontage}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, lot_frontage: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                  />
                </div>
              )}

              {/* Bedrooms Stepper (Omitted for Land) */}
              {!isLand && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Bedrooms
                  </label>
                  <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1] h-11 items-center shadow-2xs">
                    {['Studio', '1', '2', '3', '4', '5+'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, bedrooms: val }); }}
                        className={`flex-1 h-9 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          formData.bedrooms === val ? 'bg-[#0F766E] text-white shadow-xs font-bold' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bathrooms Stepper (Omitted for Land) */}
              {!isLand && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Bathrooms
                  </label>
                  <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1] h-11 items-center shadow-2xs">
                    {['1', '2', '3', '4', '5+'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setIsDirty(true); setFormData({ ...formData, bathrooms: val }); }}
                        className={`flex-1 h-9 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          formData.bathrooms === val ? 'bg-[#0F766E] text-white shadow-xs font-bold' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parking Slots Stepper */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Parking Spaces
                </label>
                <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1] h-11 items-center shadow-2xs">
                  {['0', '1', '2', '3', '4+'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setIsDirty(true); setFormData({ ...formData, parking: val }); }}
                      className={`flex-1 h-9 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        formData.parking === val ? 'bg-[#0F766E] text-white shadow-xs font-bold' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condo Specific: Floor Level & Tower */}
              {isCondo && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                      Floor Level
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 28th Floor"
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
                </>
              )}

              {/* Year Built */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Year Built / Completed
                </label>
                <input
                  type="number"
                  placeholder="2024"
                  value={formData.year_built}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, year_built: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              {/* Furnishing Status */}
              {!isLand && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                    Furnishing Status
                  </label>
                  <select
                    value={formData.furnishing}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, furnishing: e.target.value }); }}
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Bare / Unfurnished">Bare / Unfurnished</option>
                  </select>
                </div>
              )}

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
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: PRICING AND AVAILABILITY */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">payments</span>
                Section 4: Pricing and Availability Status
              </h3>
              <span className="text-xs text-[#64748B]">
                Base Currency & Financial Terms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Price input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Listing Valuation Price <span className="text-[#FF6B6B] ml-0.5">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-2xs transition-colors overflow-hidden">
                  <div className="h-11 px-3.5 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-sm font-bold text-[#0F766E] select-none">
                    ₱
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="150,000,000"
                    value={displayPrice}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                    onFocus={handlePriceFocus}
                    className="flex-1 h-11 px-4 bg-transparent text-base font-mono font-bold text-[#0F766E] placeholder:text-slate-400 outline-none"
                  />
                </div>
                {formData.price ? (
                  <p className="text-[11px] font-mono text-[#0F766E] flex items-center gap-1 font-medium pt-0.5">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Formatted: ₱{Number(formData.price).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B]">Enter total valuation amount (PHP)</p>
                )}
              </div>

              {/* Price Term */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Price Basis / Term
                </label>
                <select
                  value={formData.price_term}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, price_term: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="Total Contract Price">Total Contract Price (TCP)</option>
                  <option value="Per Month">Monthly Rental Basis</option>
                  <option value="Per Sqm">Per Square Meter Valuation</option>
                  <option value="Gross">Gross Seller Price</option>
                  <option value="Net">Net Seller Proceeds</option>
                </select>
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

              {/* Publication Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Publication Status
                </label>
                <select
                  value={formData.standard_status}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, standard_status: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="Draft">Draft (Private in Review)</option>
                  <option value="Pending Approval">Pending Approval (Agent Submitted)</option>
                  <option value="Active">Active (Publicly Listed)</option>
                </select>
              </div>

              {/* Negotiable Checkbox Card */}
              <div className="md:col-span-2 pt-1">
                <label
                  htmlFor="negotiable-checkbox"
                  className="flex items-center gap-3 p-3.5 rounded-lg border border-[#CBD5E1] hover:border-[#0F766E]/40 bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    id="negotiable-checkbox"
                    checked={formData.is_negotiable}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, is_negotiable: e.target.checked }); }}
                    className="w-4 h-4 text-[#0F766E] accent-[#0F766E] rounded border-slate-300 focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#1E293B]">Price is open to qualified negotiation</span>
                    <p className="text-[11px] text-[#64748B]">Allows prospective buyers to submit earnest deposit proposals for review.</p>
                  </div>
                </label>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: FEATURES AND AMENITIES */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
        {/* SECTION 6: MEDIA AND DOCUMENTS */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">perm_media</span>
                Section 6: Media Assets & Confidential Documentation
              </h3>
              <span className="text-xs text-[#64748B]">
                Cloud Storage & Encrypted Records
              </span>
            </div>

            {/* Media Uploader */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                isDragging ? 'border-[#0F766E] bg-[#0F766E]/5 scale-[1.01]' : 'border-[#CBD5E1] hover:border-[#0F766E] bg-white hover:bg-slate-50/50'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('broker-file-upload').click()}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="broker-file-upload"
              />
              <span className="material-symbols-outlined text-[40px] text-[#0F766E] mb-2">cloud_upload</span>
              <p className="text-sm font-bold text-[#1E293B]">
                Drag & Drop Architectural Photography / Video Assets
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Upload up to 50MB per file. The first selected photo acts as the Primary Cover Viewport.
              </p>
            </div>

            {/* Attached files preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {selectedFiles.map((file, idx) => {
                  const fileUrl = URL.createObjectURL(file);
                  const isVideo = file.type.startsWith('video/');
                  return (
                    <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video border border-[#CBD5E1] shadow-2xs bg-slate-100">
                      {isVideo ? (
                        <video src={fileUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={fileUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 bg-[#0F766E] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs">
                          Hero Cover
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Virtual Tour & Blueprint URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0]">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Virtual Tour 3D / Matterport URL
                </label>
                <input
                  type="url"
                  placeholder="https://my.matterport.com/show/?m=..."
                  value={formData.virtualTourUrl}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, virtualTourUrl: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                  Architectural Blueprint / CAD Link
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... or Blueprint file reference"
                  value={formData.blueprintUrl}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, blueprintUrl: e.target.value }); }}
                  className="w-full h-11 px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-lg text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-2xs transition-colors"
                />
              </div>
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
        {/* SECTION 7: REVIEW AND SUBMIT */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">fact_check</span>
                Section 7: Review & Verification Ledger
              </h3>
              <span className="text-xs text-[#64748B]">
                Audited Submission Ready
              </span>
            </div>

            {/* Validation Checklist Alert */}
            <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                Publication Readiness Audit:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${validationSummary.hasTitle ? 'text-emerald-600' : 'text-[#FF6B6B]'}`}>
                    {validationSummary.hasTitle ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-[#1E293B]">Listing Title (≥3 chars)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${validationSummary.hasPrice ? 'text-emerald-600' : 'text-[#FF6B6B]'}`}>
                    {validationSummary.hasPrice ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-[#1E293B]">Listing Price Validated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${validationSummary.hasAddress ? 'text-emerald-600' : 'text-[#FF6B6B]'}`}>
                    {validationSummary.hasAddress ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-[#1E293B]">Complete Street Address</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${validationSummary.hasCoordinates ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {validationSummary.hasCoordinates ? 'check_circle' : 'warning'}
                  </span>
                  <span className="text-[#1E293B]">Map Pin Coordinates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${validationSummary.hasMedia ? 'text-emerald-600' : 'text-[#64748B]'}`}>
                    {validationSummary.hasMedia ? 'check_circle' : 'info'}
                  </span>
                  <span className="text-[#1E293B]">Media Attached ({selectedFiles.length})</span>
                </div>
              </div>
            </div>

            {/* Section Breakdown Cards with Edit Jumps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Basic */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">1. Basic Information</span>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                <p className="text-sm font-bold text-[#1E293B]">{formData.title || <span className="text-[#FF6B6B]">Missing Title</span>}</p>
                <p className="text-xs text-[#64748B]">{formData.property_type} • {formData.transaction_type}</p>
              </div>

              {/* Card 2: Location */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">2. Property Location</span>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                <p className="text-sm font-bold text-[#1E293B]">{formData.address || <span className="text-[#FF6B6B]">Missing Address</span>}</p>
                <p className="text-xs text-[#64748B]">{formData.location || 'Metro Manila'} (Pin: {formData.latitude || 'None'})</p>
              </div>

              {/* Card 3: Specs */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">3. Specifications</span>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                {isLand ? (
                  <p className="text-xs text-[#1E293B]">Lot Area: {formData.lot_area || 0} {formData.lot_area_unit} • Frontage: {formData.lot_frontage || 'Standard'}</p>
                ) : (
                  <p className="text-xs text-[#1E293B]">
                    {formData.bedrooms} Beds • {formData.bathrooms} Baths • {formData.floor_area || 0} {formData.floor_area_unit} Floor Area
                  </p>
                )}
                <p className="text-xs text-[#64748B]">Condition: {formData.property_condition}</p>
              </div>

              {/* Card 4: Pricing */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">4. Pricing & Availability</span>
                  <button type="button" onClick={() => setCurrentStep(4)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                <p className="text-sm font-mono font-bold text-[#0F766E]">
                  ₱{Number(formData.price || 0).toLocaleString()} PHP ({formData.price_term})
                </p>
                <p className="text-xs text-[#64748B]">Status: {formData.status} • Standard: {formData.standard_status}</p>
              </div>

              {/* Card 5: Features */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">5. Features & Amenities</span>
                  <button type="button" onClick={() => setCurrentStep(5)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                <p className="text-xs text-[#1E293B]">
                  {formData.interior_features.length} Interior • {formData.exterior_features.length} Exterior • {formData.amenities.length} Community
                </p>
              </div>

              {/* Card 6: Media */}
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E]">6. Media & Legal</span>
                  <button type="button" onClick={() => setCurrentStep(6)} className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer">
                    Edit Section
                  </button>
                </div>
                <p className="text-xs text-[#1E293B]">
                  {selectedFiles.length} file(s) queued for Google Drive storage
                </p>
                <p className="text-xs text-[#64748B]">Commission: {formData.commissionSplit}</p>
              </div>

            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className={`h-11 px-5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                currentStep === 1 
                  ? 'border-[#CBD5E1]/60 text-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] shadow-2xs'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Section</span>
            </button>
            {isDrawer ? (
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-slate-600 hover:text-[#1E293B] text-xs font-semibold flex items-center transition-colors cursor-pointer shadow-2xs"
              >
                Cancel & Exit
              </button>
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
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                className="w-full sm:w-auto h-11 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Next Section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => executeSubmission('Draft')}
                  className="w-full sm:w-auto h-11 px-5 bg-white hover:bg-slate-50 text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-11 px-7 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Registering...' : (isEditing ? 'Update & Publish' : 'Publish Listing')}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </form>
    </div>

    {/* Right Column: Live Listing Summary & Progress Assistant (4 Cols) */}
    <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-5">
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Live Listing Summary
          </h4>
          <span className="text-[11px] font-mono font-medium text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
            Step {currentStep} of 7
          </span>
        </div>

        {/* Media preview banner */}
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center">
          {selectedFiles.length > 0 ? (
            <img
              src={selectedFiles[0] instanceof File ? URL.createObjectURL(selectedFiles[0]) : (selectedFiles[0]?.preview || selectedFiles[0]?.url || selectedFiles[0])}
              alt="Listing Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 gap-1">
              <ImageIcon className="w-7 h-7 text-slate-300 stroke-[1.5]" />
              <span className="text-[11px]">No media uploaded yet</span>
            </div>
          )}
          <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded">
            {formData.transaction_type}
          </span>
        </div>

        {/* Title & Valuation */}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[#1E293B] line-clamp-2">
            {formData.title || <span className="text-slate-400 font-normal italic">Untitled Property Listing</span>}
          </p>
          <p className="text-xl font-bold font-mono text-[#0F766E]">
            {formData.price ? `₱${Number(formData.price).toLocaleString()}` : <span className="text-slate-400 font-sans text-sm">Valuation pending</span>}
          </p>
        </div>

        {/* Essential Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Type</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">{formData.property_type}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Area</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">{formData.floor_area ? `${formData.floor_area} ${formData.floor_area_unit}` : '—'}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Bed / Bath</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">{formData.bedrooms} Beds • {formData.bathrooms} Baths</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
            <span className="block text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Location</span>
            <span className="font-semibold text-[#1E293B] truncate block mt-0.5">{formData.location || '—'}</span>
          </div>
        </div>

        {/* Publication Readiness Checklist */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Publication Readiness
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {Object.values(validationSummary).filter(Boolean).length}/5 Completed
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#1E293B]">Title (≥3 characters)</span>
              {validationSummary.hasTitle ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#1E293B]">Listing Price Validated</span>
              {validationSummary.hasPrice ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#1E293B]">Street Address Added</span>
              {validationSummary.hasAddress ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#1E293B]">Cadastral GPS Coordinates</span>
              {validationSummary.hasCoordinates ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#1E293B]">Property Photos ({selectedFiles.length})</span>
              {validationSummary.hasMedia ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
          </div>
        </div>

        {/* Quick Save Draft Action */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => executeSubmission('Draft')}
            className="w-full h-10 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Working Draft</span>
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
        title={savedStatusType === 'Draft' ? "Listing Saved as Draft" : "Listing Published Successfully"}
        subtitle="Your property listing specifications and media assets have been registered in the database."
        actions={
          <button
            onClick={() => {
              if (isDrawer && onClose) onClose();
              else navigate('/broker/properties');
            }}
            className="h-11 px-8 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
          >
            Return to Properties Ledger
          </button>
        }
      >
        <div className="space-y-4 text-xs text-[#64748B]">
          <p>
            Property <strong className="text-[#1E293B]">{formData.title || 'Untitled Property'}</strong> registered with publication status: <strong className="text-[#0F766E]">{savedStatusType}</strong>.
          </p>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] font-mono text-[#64748B]">
            Cadastral Coordinates: {formData.latitude || '14.55'}, {formData.longitude || '121.05'}
          </div>
        </div>
      </DashboardModal>

      {/* Category Management Modal */}
      <DashboardModal
        isOpen={manageCategoryModal.isOpen}
        onClose={() => setManageCategoryModal({ isOpen: false, type: null })}
        title={manageCategoryModal.type === 'propertyType' ? "Manage Property Types" : "Manage Conditions"}
        subtitle="Add custom real estate categories stored in your browser session."
        actions={
          <button
            onClick={() => setManageCategoryModal({ isOpen: false, type: null })}
            className="h-9 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategoryInput}
              onChange={e => setNewCategoryInput(e.target.value)}
              className="flex-1 h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 h-10 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </DashboardModal>

    </div>
  );
}
