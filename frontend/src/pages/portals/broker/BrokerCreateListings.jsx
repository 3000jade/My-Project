import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
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

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
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
          setPosition([pos.lat, pos.lng]);
        },
      }}
      position={position}
    />
  );
}

export default function BrokerCreateListings() {
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
    location: '',
    address: '',
    subdivision: '',
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
    floor_level: '',
    tower_name: '',
    status: 'AVAILABLE',
    is_published: true,
    amenities: [],
    // Broker specific fields
    listing_id: '',
    cadastralLotId: '',
    commissionSplit: '',
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
  const [amenitySearch, setAmenitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);

  const [currentStep, setCurrentStep] = useState(1);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleMapPositionChange = (pos) => {
    setFormData(prev => ({ ...prev, latitude: pos[0].toFixed(7), longitude: pos[1].toFixed(7) }));
  };

  const mapPosition = formData.latitude && formData.longitude 
    ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] 
    : [14.5995, 120.9842]; // Default Manila

  const handleGeocode = async (isSilent = false) => {
    const query = `${formData.address || ''}, ${formData.subdivision || ''}, ${formData.location || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim();
    if (!query || query === ',') return;
    
    setIsGeocoding(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(res.data[0].lat).toFixed(7),
          longitude: parseFloat(res.data[0].lon).toFixed(7)
        }));
      } else {
        if (!isSilent) {
          alert('Could not find exact location automatically. Please pin it manually on the map.');
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const [propertyTypeOptions, setPropertyTypeOptions] = useState(() => {
    const saved = localStorage.getItem('customPropertyTypes');
    return saved ? JSON.parse(saved) : ['House & Lot', 'Condominium', 'Townhouse', 'Commercial', 'Penthouse', 'Estate'];
  });
  const [propertyConditionOptions, setPropertyConditionOptions] = useState(() => {
    const saved = localStorage.getItem('customPropertyConditions');
    return saved ? JSON.parse(saved) : ['Pre-selling', 'RFO', 'Bare Shell', 'Fitted'];
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

  const handleRemoveCategory = (cat) => {
    if (manageCategoryModal.type === 'propertyType') {
      const newOpts = propertyTypeOptions.filter(c => c !== cat);
      setPropertyTypeOptions(newOpts);
      localStorage.setItem('customPropertyTypes', JSON.stringify(newOpts));
      if (formData.property_type === cat && newOpts.length > 0) {
        setFormData({ ...formData, property_type: newOpts[0] });
      }
    } else {
      const newOpts = propertyConditionOptions.filter(c => c !== cat);
      setPropertyConditionOptions(newOpts);
      localStorage.setItem('customPropertyConditions', JSON.stringify(newOpts));
      if (formData.property_condition === cat && newOpts.length > 0) {
        setFormData({ ...formData, property_condition: newOpts[0] });
      }
    }
  };
  const stepTitles = [
    'Property Details & Type',
    'Pricing & Terms',
    'Location & Address',
    'Features & Amenities',
    'Photos & Media',
    'Legal & Title',
    'Review & Publish'
  ];

  const allAmenities = [
    'Private Swimming Pool', 'Gym / Fitness Center', '24/7 Security',
    'Smart Home Automation', 'Wine Cellar', 'Private Elevator',
    'Staff Quarters', 'Solar Hybrid Power', 'Balcony / Terrace',
    'Garden / Courtyard', 'Covered Garage', 'Spa / Sauna',
    'Pet-Friendly', 'Lounge / Clubhouse', 'Function Room'
  ];

  const filteredAmenities = allAmenities.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase()));

  useEffect(() => {
    if (!isEditing) return;
    const fetchProperty = async () => {
      try {
        const p = await propertyService.getPropertyById(id);
        if (p) {
          setFormData(prev => ({
            ...prev,
            title: p.title || '',
            property_type: p.type || 'House & Lot',
            property_condition: p.property_condition || 'RFO',
            transaction_type: p.transaction_type || 'For Sale',
            price: p.price_raw || p.price || '',
            location: p.location || p.city || '',
            address: p.address || '',
            description: p.description || '',
            status: p.status || 'AVAILABLE',
            is_published: p.is_published !== undefined ? p.is_published : true,
            amenities: p.amenities || [],
            floor_area: p.specs?.livingArea || p.livingArea || '',
            lot_area: p.specs?.lotArea || p.lot_size_area || '',
            bedrooms: String(p.specs?.beds || p.bedrooms_total || '3'),
            bathrooms: String(p.specs?.baths || p.bathrooms_total_integer || '3'),
            stories_total: String(p.stories_total || p.specs?.stories || '1'),
            parking: String(p.specs?.parking || p.parking || '1'),
            listing_id: p.listing_id || '',
            cadastralLotId: p.cadastral_lot_id || p.listingKey || '',
            commissionSplit: p.confidential?.buyerAgencyCompensation || p.buyer_agency_compensation || '',
            lockboxCode: p.confidential?.lockboxCode || p.lockbox_code || '',
            showingInstructions: p.confidential?.showingInstructions || p.showing_instructions || '',
            privateNotes: p.confidential?.privateRemarks || p.private_remarks || '',
            seller_direct_phone: p.confidential?.sellerDirectPhone || p.seller_direct_phone || '',
            associationFee: p.associationFee || p.association_fee || '',
            associationFeeFrequency: p.association_fee_frequency || 'Monthly',
            taxAnnualAmount: p.tax_annual_amount || '',
            originalListPrice: p.original_list_price || '',
            blueprintUrl: p.blueprintUrl || p.blueprint_url || '',
            virtualTourUrl: p.virtualTourUrl || p.virtual_tour_url || ''
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

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
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
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        title: formData.title,
        price: Number(formData.price),
        propertyType: formData.property_type,
        propertyCondition: formData.property_condition,
        transactionType: formData.transaction_type,
        location: formData.location,
        address: formData.address,
        description: formData.description,
        beds: formData.bedrooms === 'Studio' ? 0 : Number(formData.bedrooms.replace('+', '')),
        baths: Number(formData.bathrooms.replace('+', '')),
        storiesTotal: Number(formData.stories_total),
        parking: Number(formData.parking.replace('+', '')),
        floorArea: Number(formData.floor_area),
        lotArea: formData.property_type === 'Condominium' ? 0 : Number(formData.lot_area),
        status: formData.status,
        amenities: formData.amenities,
        is_published: formData.is_published,
        // Broker specifics
        listing_id: formData.listing_id,
        cadastral_lot_id: formData.cadastralLotId,
        buyer_agency_compensation: formData.commissionSplit,
        lockbox_code: formData.lockboxCode,
        showing_instructions: formData.showingInstructions,
        private_remarks: formData.privateNotes,
        seller_direct_phone: formData.seller_direct_phone,
        association_fee: Number(formData.associationFee),
        association_fee_frequency: formData.associationFeeFrequency,
        tax_annual_amount: Number(formData.taxAnnualAmount),
        original_list_price: Number(formData.originalListPrice),
        blueprint_url: formData.blueprintUrl,
        virtual_tour_url: formData.virtualTourUrl
      };

      let propertyId = id;
      if (isEditing) {
        await propertyService.updateProperty(id, payload);
      } else {
        const res = await axios.post('http://localhost:5000/api/properties', payload, { headers });
        propertyId = res.data?.data?.id || res.id || res.data?.id;
      }

      if (selectedFiles.length > 0 && propertyId) {
        const uploadData = new FormData();
        selectedFiles.forEach(file => {
          uploadData.append('media', file);
        });
        await propertyService.uploadMedia(propertyId, uploadData);
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert('Error saving property: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="material-symbols-outlined text-4xl text-[#266F71] animate-spin">sync</span>
      </div>
    );
  }

  const isCondo = formData.property_type === 'Condominium';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={isEditing ? "Edit Property Listing" : "Create New Property Listing"}
        subtitle="Manage verified property details, broker confidential specs, and media assets."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Properties", to: "/broker/properties" },
          { label: isEditing ? "Edit Listing" : "New Listing" }
        ]}
      />

      {/* Stepper Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex overflow-x-auto gap-4 custom-scrollbar">
        {stepTitles.map((title, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          return (
            <div key={stepNum} className="flex flex-col items-center flex-shrink-0 w-32 cursor-pointer transition-opacity" onClick={() => setCurrentStep(stepNum)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${isActive ? 'bg-[#266F71] text-white ring-4 ring-[#266F71]/20' : isCompleted ? 'bg-[#266F71] text-white' : 'bg-slate-100 text-slate-400'}`}>
                {isCompleted ? <span className="material-symbols-outlined text-[16px]">check</span> : stepNum}
              </div>
              <span className={`text-[10px] uppercase tracking-wider text-center font-bold ${isActive ? 'text-[#266F71]' : 'text-slate-400'}`}>
                {title}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1: Property Details & Type */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">home</span>
              Step 1: Property Details & Type
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                  Transaction Type
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {['For Sale', 'For Rent'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, transaction_type: type })}
                      className={`flex-1 h-10 text-sm font-semibold rounded-md transition-all ${formData.transaction_type === type ? 'bg-white text-[#266F71] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                    Property Type *
                  </label>
                  <button type="button" onClick={() => setManageCategoryModal({ isOpen: true, type: 'propertyType' })} className="text-[10px] font-bold text-[#266F71] hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Manage
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formData.property_type}
                    onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer appearance-none transition-colors"
                  >
                    {propertyTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                    Property Condition
                  </label>
                  <button type="button" onClick={() => setManageCategoryModal({ isOpen: true, type: 'propertyCondition' })} className="text-[10px] font-bold text-[#266F71] hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Manage
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formData.property_condition}
                    onChange={e => setFormData({ ...formData, property_condition: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer appearance-none transition-colors"
                  >
                    {propertyConditionOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Listing Title *</label>
                <input required type="text" placeholder="e.g. Modern Minimalist Villa in Ayala Alabang" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Property Description *</label>
                <div className="bg-white rounded-lg border border-slate-200 focus-within:border-[#266F71] focus-within:ring-1 focus-within:ring-[#266F71] transition-colors [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:border-none [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-sm [&_.ql-editor]:font-sans [&_.ql-editor]:text-slate-700">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.description} 
                    onChange={content => setFormData({ ...formData, description: content })} 
                    placeholder="Provide a comprehensive narrative..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Floor Area</label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#266F71] focus-within:ring-1 focus-within:ring-[#266F71] transition-colors">
                  <input type="number" placeholder="0" value={formData.floor_area} onChange={e => setFormData({ ...formData, floor_area: e.target.value })} className="flex-1 h-12 px-4 bg-transparent outline-none text-sm font-bold text-slate-800" />
                  <div className="flex border-l border-slate-200">
                    <button type="button" onClick={() => setFormData({ ...formData, floor_area_unit: 'sqm' })} className={`px-3 text-xs font-bold ${formData.floor_area_unit === 'sqm' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqm</button>
                    <button type="button" onClick={() => setFormData({ ...formData, floor_area_unit: 'sqft' })} className={`px-3 text-xs font-bold border-l border-slate-200 ${formData.floor_area_unit === 'sqft' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqft</button>
                  </div>
                </div>
              </div>
              {!isCondo && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Lot Area</label>
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#266F71] focus-within:ring-1 focus-within:ring-[#266F71] transition-colors">
                    <input type="number" placeholder="0" value={formData.lot_area} onChange={e => setFormData({ ...formData, lot_area: e.target.value })} className="flex-1 h-12 px-4 bg-transparent outline-none text-sm font-bold text-slate-800" />
                    <div className="flex border-l border-slate-200">
                      <button type="button" onClick={() => setFormData({ ...formData, lot_area_unit: 'sqm' })} className={`px-3 text-xs font-bold ${formData.lot_area_unit === 'sqm' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqm</button>
                      <button type="button" onClick={() => setFormData({ ...formData, lot_area_unit: 'sqft' })} className={`px-3 text-xs font-bold border-l border-slate-200 ${formData.lot_area_unit === 'sqft' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqft</button>
                    </div>
                  </div>
                </div>
              )}
              {isCondo && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Floor Level</label>
                    <input type="text" placeholder="e.g. 14th Floor" value={formData.floor_level} onChange={e => setFormData({ ...formData, floor_level: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Tower / Building Name</label>
                    <input type="text" placeholder="e.g. West Tower" value={formData.tower_name} onChange={e => setFormData({ ...formData, tower_name: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
                  </div>
                </>
              )}

              {/* Rooms & Parking */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">bed</span> Bedrooms</label>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                    {['Studio', '1', '2', '3', '4+'].map(val => (
                      <button key={val} type="button" onClick={() => setFormData({ ...formData, bedrooms: val })} className={`flex-1 py-1 text-xs font-bold rounded ${formData.bedrooms === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}>{val}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">shower</span> Bathrooms</label>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                    {['1', '2', '3', '4+'].map(val => (
                      <button key={val} type="button" onClick={() => setFormData({ ...formData, bathrooms: val })} className={`flex-1 py-1 text-xs font-bold rounded ${formData.bathrooms === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}>{val}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">layers</span> Stories / Levels</label>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                    {['1', '2', '3', '4+'].map(val => (
                      <button key={val} type="button" onClick={() => setFormData({ ...formData, stories_total: val })} className={`flex-1 py-1 text-xs font-bold rounded ${formData.stories_total === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}>{val}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">directions_car</span> Parking</label>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                    {['0', '1', '2', '3', '4+'].map(val => (
                      <button key={val} type="button" onClick={() => setFormData({ ...formData, parking: val })} className={`flex-1 py-1 text-xs font-bold rounded ${formData.parking === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}>{val}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Terms */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">payments</span>
              Step 2: Pricing & Terms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Listing Price *</label>
                <div className="flex items-center gap-2">
                  <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="h-12 w-16 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 text-center outline-none focus:border-[#266F71]">
                    <option value="₱">₱</option>
                    <option value="$">$</option>
                  </select>
                  <input required type="text" placeholder="15,000,000" value={displayPrice} onChange={handlePriceChange} onBlur={handlePriceBlur} onFocus={handlePriceFocus} className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold font-sans text-slate-800 focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Original List Price</label>
                <input type="number" placeholder="0" value={formData.originalListPrice} onChange={e => setFormData({ ...formData, originalListPrice: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Annual Tax (PHP)</label>
                <input type="number" placeholder="0" value={formData.taxAnnualAmount} onChange={e => setFormData({ ...formData, taxAnnualAmount: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">HOA / Condo Dues</label>
                <input type="number" placeholder="0" value={formData.associationFee} onChange={e => setFormData({ ...formData, associationFee: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Billing Cycle</label>
                <select value={formData.associationFeeFrequency} onChange={e => setFormData({ ...formData, associationFeeFrequency: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] outline-none">
                  <option value="Monthly">Monthly</option>
                  <option value="Annually">Annually</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location & Address */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">location_on</span>
              Step 3: Location & Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Street Address *</label>
                <input required type="text" placeholder="e.g. 142 Acacia Avenue" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} onBlur={() => handleGeocode(true)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Neighborhood / Subdivision</label>
                <input type="text" placeholder="e.g. Ayala Alabang Village" value={formData.subdivision} onChange={e => setFormData({ ...formData, subdivision: e.target.value })} onBlur={() => handleGeocode(true)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">City / Municipality *</label>
                <input required type="text" placeholder="e.g. Muntinlupa City" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} onBlur={() => handleGeocode(true)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Postal / Zip Code</label>
                <input type="text" placeholder="e.g. 1780" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} onBlur={() => handleGeocode(true)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
              </div>

              {/* Geolocation Section */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#266F71] text-[18px]">public</span>
                    Map Geolocation
                  </h4>
                  <button 
                    type="button" 
                    onClick={handleGeocode} 
                    disabled={isGeocoding}
                    className="h-9 px-4 bg-slate-100 text-[#266F71] text-xs font-bold rounded-md hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isGeocoding ? 'sync' : 'search'}</span>
                    {isGeocoding ? 'Locating...' : 'Find on Map'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Interactive Map */}
                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 z-10 relative bg-slate-50">
                    <MapContainer center={mapPosition} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker 
                        position={formData.latitude && formData.longitude ? mapPosition : null} 
                        setPosition={handleMapPositionChange} 
                      />
                    </MapContainer>
                  </div>

                  {/* Manual Coordinate Inputs */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Latitude</label>
                      <input type="number" step="0.0000001" placeholder="e.g. 14.417534" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans font-mono focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Longitude</label>
                      <input type="number" step="0.0000001" placeholder="e.g. 121.026115" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans font-mono focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Features & Amenities */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">star</span>
              Step 4: Features & Amenities
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Amenities List</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1.5 text-slate-400 text-[18px]">search</span>
                  <input type="text" placeholder="Search amenities..." value={amenitySearch} onChange={e => setAmenitySearch(e.target.value)} className="h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-[#266F71]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {filteredAmenities.map(amenity => {
                  const isSelected = formData.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${isSelected ? 'border-[#266F71] bg-[#266F71] text-white shadow-sm' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Photos & Media */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">photo_camera</span>
              Step 5: Photos & Media (or Virtual Tour)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">CAD Blueprint URL</label>
                <input type="url" placeholder="https://.../blueprint.jpg" value={formData.blueprintUrl} onChange={e => setFormData({ ...formData, blueprintUrl: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">3D Virtual Tour Embed URL</label>
                <input type="url" placeholder="https://my.matterport.com/show/?m=..." value={formData.virtualTourUrl} onChange={e => setFormData({ ...formData, virtualTourUrl: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] outline-none" />
              </div>
            </div>
            <div className={`relative border-2 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center transition-all cursor-pointer group ${isDragging ? 'border-[#266F71] bg-[#266F71]/5' : 'border-slate-300 hover:border-[#266F71] bg-slate-50'}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => document.getElementById('file-upload').click()}>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" id="file-upload" />
              <div className="p-4 rounded-full mb-4 bg-slate-200 group-hover:bg-[#266F71]/10">
                <span className="material-symbols-outlined text-[40px] text-slate-500 group-hover:text-[#266F71]">cloud_upload</span>
              </div>
              <p className="text-sm font-bold text-slate-800 font-sans">Drag & Drop Photos/Videos Here</p>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-xs mx-auto">Upload up to 50MB per file. 16:9 recommended.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {selectedFiles.map((file, idx) => {
                const fileUrl = URL.createObjectURL(file);
                const isVideo = file.type.startsWith('video/');
                return (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm bg-slate-100">
                    {isVideo ? <video src={fileUrl} className="w-full h-full object-cover" muted /> : <img src={fileUrl} alt="Upload" className="w-full h-full object-cover" />}
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><span className="material-symbols-outlined text-[16px]">close</span></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Legal & Title */}
        {currentStep === 6 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">gavel</span>
              Step 6: Legal & Title (Documentation)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Listing / MLS ID</label>
                  <input type="text" placeholder="e.g. MLS-84920" value={formData.listing_id} onChange={e => setFormData({ ...formData, listing_id: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-[#0D4446] focus:bg-white focus:border-[#266F71] outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Cadastral Parcel ID (Registry)</label>
                  <input type="text" placeholder="e.g. LOT-449-BLK-12" value={formData.cadastralLotId} onChange={e => setFormData({ ...formData, cadastralLotId: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-[#0D4446] focus:bg-white focus:border-[#266F71] outline-none transition-colors" />
                </div>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 space-y-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-orange-500 text-[18px]">lock</span>
                  <h4 className="text-sm font-bold text-orange-900">Broker Confidential (Internal Only)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-800 font-sans">Seller Direct Phone</label>
                    <input type="text" placeholder="e.g. +63 917 123 4567" value={formData.seller_direct_phone} onChange={e => setFormData({ ...formData, seller_direct_phone: e.target.value })} className="w-full h-12 px-4 bg-white border border-orange-200 rounded-lg text-sm font-bold font-sans text-orange-900 focus:border-orange-400 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-800 font-sans">Co-Broke Compensation</label>
                    <input type="text" placeholder="e.g. 3.00%" value={formData.commissionSplit} onChange={e => setFormData({ ...formData, commissionSplit: e.target.value })} className="w-full h-12 px-4 bg-white border border-orange-200 rounded-lg text-sm font-bold font-sans text-orange-900 focus:border-orange-400 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-800 font-sans">Lockbox / Access Code</label>
                    <input type="text" placeholder="e.g. 4492-B" value={formData.lockboxCode} onChange={e => setFormData({ ...formData, lockboxCode: e.target.value })} className="w-full h-12 px-4 bg-white border border-orange-200 rounded-lg text-sm font-sans text-orange-900 focus:border-orange-400 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-800 font-sans">Showing Instructions</label>
                    <input type="text" placeholder="Owner requires 24h advance notice." value={formData.showingInstructions} onChange={e => setFormData({ ...formData, showingInstructions: e.target.value })} className="w-full h-12 px-4 bg-white border border-orange-200 rounded-lg text-sm font-sans text-orange-900 focus:border-orange-400 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-800 font-sans">Private Notes</label>
                    <input type="text" placeholder="Gate security requires valid broker license." value={formData.privateNotes} onChange={e => setFormData({ ...formData, privateNotes: e.target.value })} className="w-full h-12 px-4 bg-white border border-orange-200 rounded-lg text-sm font-sans text-orange-900 focus:border-orange-400 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review & Publish */}
        {currentStep === 7 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#266F71]">publish</span>
              Step 7: Review & Publish
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">Initial Operational Status</label>
                <div className="relative">
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:border-[#266F71] outline-none cursor-pointer appearance-none">
                    <option value="AVAILABLE">🟢 AVAILABLE (Active)</option>
                    <option value="RESERVED">🟡 RESERVED (Deposit)</option>
                    <option value="SOLD">🔴 SOLD (Closed)</option>
                    <option value="INACTIVE">⚪ INACTIVE (Draft)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 h-12">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">Publish Immediately</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#266F71]"></div>
                </label>
              </div>
            </div>

            {/* Review Summary */}
            <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-slate-700">Quick Review</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li><strong>Title:</strong> {formData.title || <span className="text-red-500">Missing</span>}</li>
                <li><strong>Price:</strong> {formData.currency} {displayPrice || <span className="text-red-500">Missing</span>}</li>
                <li><strong>Location:</strong> {formData.location || <span className="text-red-500">Missing</span>}</li>
                <li><strong>Photos Attached:</strong> {selectedFiles.length} files</li>
              </ul>
            </div>
          </div>
        )}

        {/* Form Wizard Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className={`h-12 px-6 rounded-lg border text-sm font-bold font-sans flex items-center justify-center transition-colors ${currentStep === 1 ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer'}`}
            >
              Previous Step
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                className="w-full sm:w-auto h-12 px-8 bg-[#174849] hover:bg-[#266F71] text-white rounded-lg text-sm font-bold font-sans shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                Next Step <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto h-12 px-10 text-white rounded-lg text-sm font-bold font-sans flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#E76F51] hover:bg-[#D65C3E] hover:-translate-y-0.5 hover:shadow-lg'}`}
              >
                {isSubmitting ? <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                {isSubmitting ? 'Saving Property...' : (isEditing ? 'Update Property' : 'Publish Property')}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <DashboardModal
        isOpen={showSuccessModal}
        onClose={() => navigate('/broker/properties')}
        title="Listing Saved successfully"
        subtitle="Your property listing and media have been registered in the database."
        actions={
          <button
            onClick={() => navigate('/broker/properties')}
            className="h-12 px-8 bg-[#266F71] text-white rounded-lg text-sm font-bold font-sans"
          >
            Go to Properties Directory
          </button>
        }
      >
        <div className="space-y-4 text-sm font-sans text-slate-600">
          <p>
            The property <strong className="text-slate-900">{formData.title || 'Untitled Property'}</strong> has been {isEditing ? 'updated' : 'created'} with status <strong className="text-[#266F71]">{formData.status}</strong>.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 text-slate-500">
            <p><strong>Note:</strong> The property data and all media files have been securely pushed to the backend database and Google Drive.</p>
          </div>
        </div>
      </DashboardModal>
      <DashboardModal
        isOpen={manageCategoryModal.isOpen}
        onClose={() => setManageCategoryModal({ isOpen: false, type: null })}
        title={manageCategoryModal.type === 'propertyType' ? 'Manage Property Types' : 'Manage Property Conditions'}
        subtitle="Add or remove categories for your listings. Changes are saved automatically."
        actions={
          <button
            onClick={() => setManageCategoryModal({ isOpen: false, type: null })}
            className="h-10 px-6 bg-[#266F71] text-white rounded-lg text-sm font-bold font-sans"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Add new category..." 
              value={newCategoryInput} 
              onChange={e => setNewCategoryInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#266F71]"
            />
            <button type="button" onClick={handleAddCategory} className="h-10 px-4 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800">Add</button>
          </div>
          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
            {(manageCategoryModal.type === 'propertyType' ? propertyTypeOptions : propertyConditionOptions).map(opt => (
              <div key={opt} className="flex items-center justify-between p-3 hover:bg-slate-50 group">
                <span className="text-sm text-slate-700 font-medium">{opt}</span>
                <button type="button" onClick={() => handleRemoveCategory(opt)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
