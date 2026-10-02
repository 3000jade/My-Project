import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import propertyService from '../../../services/propertyService';

export default function AgentPropertyCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    transaction_type: 'For Sale',
    property_type: 'House & Lot',
    price: '',
    currency: '₱',
    price_term: 'Total Contract Price',
    location: '',
    address: '',
    description: '',
    bedrooms: '3',
    bathrooms: '3',
    parking: '1',
    floor_area: '',
    floor_area_unit: 'sqm',
    lot_area: '',
    lot_area_unit: 'sqm',
    floor_level: '',
    tower_name: '',
    status: 'AVAILABLE',
    is_published: true,
    amenities: ['24/7 Security', 'Swimming Pool']
  });

  const [displayPrice, setDisplayPrice] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState('');

  const allAmenities = [
    'Private Swimming Pool', 'Gym / Fitness Center', '24/7 Security',
    'Smart Home Automation', 'Wine Cellar', 'Private Elevator',
    'Staff Quarters', 'Solar Hybrid Power', 'Balcony / Terrace',
    'Garden / Courtyard', 'Covered Garage', 'Spa / Sauna',
    'Pet-Friendly', 'Lounge / Clubhouse', 'Function Room'
  ];

  const filteredAmenities = allAmenities.filter(a => a.toLowerCase().includes(amenitySearch.toLowerCase()));

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

      const res = await axios.post('http://localhost:5000/api/properties', {
        title: formData.title,
        price: Number(formData.price),
        propertyType: formData.property_type,
        transactionType: formData.transaction_type,
        location: formData.location,
        address: formData.address,
        description: formData.description,
        beds: formData.bedrooms === 'Studio' ? 0 : Number(formData.bedrooms.replace('+','')),
        baths: Number(formData.bathrooms.replace('+','')),
        parking: Number(formData.parking.replace('+','')),
        floorArea: Number(formData.floor_area),
        lotArea: formData.property_type === 'Condominium' ? 0 : Number(formData.lot_area),
        status: formData.status,
      }, { headers });

      const newPropertyId = res.data?.data?.id || res.id || res.data?.id;

      if (selectedFiles.length > 0 && newPropertyId) {
        const uploadData = new FormData();
        selectedFiles.forEach(file => {
          uploadData.append('media', file);
        });

        await propertyService.uploadMedia(newPropertyId, uploadData);
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert('Error creating property: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCondo = formData.property_type === 'Condominium';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Create New Property Listing"
        subtitle="Fill in verified property details, dimensions, and media assets aligning with official property records."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Properties", to: "/agent/properties" },
          { label: "New Listing" }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Core Details */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">home</span>
            1. Core Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Listing Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Modern Minimalist Villa in Ayala Alabang"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
              />
            </div>

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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Property Type *
              </label>
              <div className="relative">
                <select
                  value={formData.property_type}
                  onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer appearance-none transition-colors"
                >
                  <option value="House & Lot">House & Lot</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Estate">Estate</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Property Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Provide a comprehensive narrative describing the architectural style, design elements, orientation, and luxury finishings..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Pricing & Specs */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">payments</span>
            2. Pricing & Specs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pricing */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                  Listing Price *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="h-12 w-16 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 text-center appearance-none focus:outline-none focus:border-[#266F71]"
                    >
                      <option value="₱">₱</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="15,000,000"
                    value={displayPrice}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                    onFocus={handlePriceFocus}
                    className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold font-sans text-slate-800 focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                  Price Terms
                </label>
                <select
                  value={formData.price_term}
                  onChange={e => setFormData({ ...formData, price_term: e.target.value })}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer"
                >
                  <option value="Total Contract Price">Total Contract Price</option>
                  <option value="Per Month">Per Month</option>
                  <option value="Per Sqm">Per Sqm</option>
                  <option value="Gross">Gross Price</option>
                  <option value="Net">Net Price</option>
                </select>
              </div>
            </div>

            {/* Specs Steppers */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">bed</span>
                  Bedrooms
                </label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                  {['Studio', '1', '2', '3', '4+'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, bedrooms: val })}
                      className={`px-3 py-1 text-xs font-bold rounded ${formData.bedrooms === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">shower</span>
                  Bathrooms
                </label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                  {['1', '2', '3', '4+'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, bathrooms: val })}
                      className={`px-3 py-1 text-xs font-bold rounded ${formData.bathrooms === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">directions_car</span>
                  Parking Slots
                </label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                  {['0', '1', '2', '3', '4+'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, parking: val })}
                      className={`px-3 py-1 text-xs font-bold rounded ${formData.parking === val ? 'bg-[#266F71] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Areas & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Floor Area
              </label>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#266F71] focus-within:ring-1 focus-within:ring-[#266F71] transition-colors">
                <input
                  type="number"
                  placeholder="0"
                  value={formData.floor_area}
                  onChange={e => setFormData({ ...formData, floor_area: e.target.value })}
                  className="flex-1 h-12 px-4 bg-transparent outline-none text-sm font-bold text-slate-800"
                />
                <div className="flex border-l border-slate-200">
                  <button type="button" onClick={() => setFormData({ ...formData, floor_area_unit: 'sqm' })} className={`px-3 text-xs font-bold ${formData.floor_area_unit === 'sqm' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqm</button>
                  <button type="button" onClick={() => setFormData({ ...formData, floor_area_unit: 'sqft' })} className={`px-3 text-xs font-bold border-l border-slate-200 ${formData.floor_area_unit === 'sqft' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>sqft</button>
                </div>
              </div>
            </div>

            {!isCondo && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                  Lot Area
                </label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#266F71] focus-within:ring-1 focus-within:ring-[#266F71] transition-colors">
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.lot_area}
                    onChange={e => setFormData({ ...formData, lot_area: e.target.value })}
                    className="flex-1 h-12 px-4 bg-transparent outline-none text-sm font-bold text-slate-800"
                  />
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                    Floor Level
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14th Floor"
                    value={formData.floor_level}
                    onChange={e => setFormData({ ...formData, floor_level: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                    Tower / Building Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. West Tower"
                    value={formData.tower_name}
                    onChange={e => setFormData({ ...formData, tower_name: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 3: Location & Amenities */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">location_on</span>
            3. Location & Amenities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                City / Region Location *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Muntinlupa City, Metro Manila"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Complete Street Address *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 142 Acacia Avenue, Phase 2, Ayala Alabang"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none transition-colors"
              />
            </div>

            <div className="space-y-4 md:col-span-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                  Amenities & Features
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1.5 text-slate-400 text-[18px]">search</span>
                  <input 
                    type="text" 
                    placeholder="Search amenities..." 
                    value={amenitySearch}
                    onChange={e => setAmenitySearch(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-[#266F71]"
                  />
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
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[#266F71] bg-[#266F71] text-white shadow-sm'
                          : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Media Upload */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">photo_camera</span>
            4. High-Res Media
          </h3>

            <div 
              className={`relative border-2 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center transition-all cursor-pointer group ${isDragging ? 'border-[#266F71] bg-[#266F71]/5 scale-[1.01]' : 'border-slate-300 hover:border-[#266F71] bg-slate-50'}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-[#266F71]/10' : 'bg-slate-200 group-hover:bg-[#266F71]/10'}`}>
                <span className={`material-symbols-outlined text-[40px] transition-colors ${isDragging ? 'text-[#266F71]' : 'text-slate-500 group-hover:text-[#266F71]'}`}>cloud_upload</span>
              </div>
              <p className="text-sm font-bold text-slate-800 font-sans">
                Drag & Drop Photos/Videos Here
              </p>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-xs mx-auto">
                Upload up to 50MB per file. High-resolution horizontal photos (16:9) are recommended.
              </p>
            </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
            {selectedFiles.map((file, idx) => {
              const fileUrl = URL.createObjectURL(file);
              const isVideo = file.type.startsWith('video/');

              return (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm bg-slate-100">
                  {isVideo ? (
                    <video src={fileUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={fileUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 bg-[#266F71] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                      Set as Hero
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 5: Finalization */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-display font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">publish</span>
            5. Finalization
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-sans">
                Initial Operational Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer appearance-none"
                >
                  <option value="AVAILABLE">🟢 AVAILABLE (Active)</option>
                  <option value="RESERVED">🟡 RESERVED (Deposit)</option>
                  <option value="SOLD">🔴 SOLD (Closed)</option>
                  <option value="INACTIVE">⚪ INACTIVE (Draft)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 h-12">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                Publish Immediately
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#266F71]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Form Submission Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <Link
            to="/agent/properties"
            className="w-full sm:w-auto h-12 px-8 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold font-sans flex items-center justify-center transition-colors"
          >
            Cancel Draft
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto h-12 px-10 text-white rounded-lg text-sm font-bold font-sans flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#174849] hover:bg-[#266F71] hover:-translate-y-0.5 hover:shadow-lg'}`}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">save</span>
            )}
            {isSubmitting ? 'Saving Property...' : 'Save & Upload Property'}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <DashboardModal
        isOpen={showSuccessModal}
        onClose={() => navigate('/agent/properties')}
        title="Listing Saved successfully"
        subtitle="Your property listing and media have been registered in the database."
        actions={
          <button
            onClick={() => navigate('/agent/properties')}
            className="h-12 px-8 bg-[#266F71] text-white rounded-lg text-sm font-bold font-sans"
          >
            Go to Properties Directory
          </button>
        }
      >
        <div className="space-y-4 text-sm font-sans text-slate-600">
          <p>
            The property <strong className="text-slate-900">{formData.title || 'Untitled Property'}</strong> has been created with status <strong className="text-[#266F71]">{formData.status}</strong>.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 text-slate-500">
            <p><strong>Note:</strong> The property data and all media files have been securely pushed to the backend database and Google Drive.</p>
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
