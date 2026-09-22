import React, { useState } from 'react';
import DashboardModal from './DashboardModal';
import { mockAgents } from '../../mockData/mockAgents';

const PROPERTY_TYPES = [
  'House & Lot',
  'Condominium',
  'Penthouse',
  'Estate',
  'Villa',
  'Commercial',
  'Townhouse',
];

const ARCHITECTURAL_STYLES = [
  'Modern Minimalist',
  'Modern Tropical',
  'Contemporary Brutalist',
  'Neo-Classical',
  'Industrial Luxury',
  'Mediterranean',
];

const FURNISHING_OPTIONS = [
  'Fully Furnished',
  'Semi-Furnished',
  'Bare / Unfurnished',
];

const AVAILABLE_AMENITIES = [
  'Private Swimming Pool',
  '24/7 Security',
  'Smart Home Automation',
  'Wine Cellar',
  'Private Elevator',
  'Staff Quarters',
  'Solar Hybrid Power',
  'Balcony / Terrace',
  'Garden / Courtyard',
  'Covered Garage',
  'Spa / Sauna',
  'Gym / Fitness Center',
  'Flood-Free Area',
  'Pet-Friendly Community',
];

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';

export default function CreateListingModal({
  isOpen,
  onClose,
  onSubmit,
  agents = mockAgents,
}) {
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    property_type: 'House & Lot',
    price: '',
    status: 'AVAILABLE',
    address: '',
    city: 'Muntinlupa City',
    state: 'Metro Manila',
    bedrooms: 3,
    bathrooms: 3,
    floor_area: '',
    lot_area: '',
    parking: 2,
    furnishing: 'Fully Furnished',
    architectural_style: 'Modern Minimalist',
    description: '',
    amenities: ['24/7 Security', 'Private Swimming Pool'],
    agent_id: agents[0]?.id || 'agent-1',
    is_published: true,
  });

  const [images, setImages] = useState([DEFAULT_COVER_IMAGE]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAddImage = () => {
    const trimmed = imageUrlInput.trim();
    if (trimmed) {
      setImages((prev) => [...prev, trimmed]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const formattedPricePreview = () => {
    const num = Number(String(formData.price).replace(/[^0-9.-]+/g, ''));
    if (!num || isNaN(num) || num <= 0) return null;
    return `₱${num.toLocaleString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const rawPrice = Number(String(formData.price).replace(/[^0-9.-]+/g, ''));
    if (!formData.title || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }
    if (!rawPrice || rawPrice <= 0) {
      setError('Please provide a valid listing valuation price.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Official street address is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City / municipality location is required.');
      return;
    }

    const selectedAgent = agents.find((a) => a.id === formData.agent_id) || agents[0];

    const payload = {
      title: formData.title.trim(),
      tagline: formData.tagline.trim(),
      property_type: formData.property_type,
      propertyType: formData.property_type,
      price: rawPrice,
      formattedPrice: `₱${rawPrice.toLocaleString()}`,
      status: formData.status.toLowerCase(),
      is_published: formData.is_published,
      location: {
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        coordinates: { lat: 14.55, lng: 121.05 },
      },
      address: formData.address.trim(),
      city: formData.city.trim(),
      specs: {
        beds: Number(formData.bedrooms) || 1,
        baths: Number(formData.bathrooms) || 1,
        sqft: Number(formData.floor_area) || 0,
        propertyType: formData.property_type,
        yearBuilt: new Date().getFullYear(),
      },
      bedrooms: Number(formData.bedrooms) || 1,
      bathrooms: Number(formData.bathrooms) || 1,
      floor_area: Number(formData.floor_area) || 0,
      lot_area: Number(formData.lot_area) || 0,
      parking: Number(formData.parking) || 0,
      furnishing: formData.furnishing,
      architectural_style: formData.architectural_style,
      description: formData.description.trim() || `${formData.property_type} in ${formData.city.trim()}`,
      amenities: formData.amenities,
      features: formData.amenities,
      mainImage: images[0] || DEFAULT_COVER_IMAGE,
      images: images.length > 0 ? images : [DEFAULT_COVER_IMAGE],
      agent_id: selectedAgent?.id || 'agent-1',
      agent_name: selectedAgent?.name || 'Elena Rossi',
      agent: selectedAgent || {
        id: 'agent-1',
        name: 'Elena Rossi',
        title: 'Senior Property Consultant',
      },
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      console.error('[CreateListingModal] Submit failed:', err);
      setError(err?.message || 'Failed to save listing. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Property Listing"
      subtitle="Register an architectural estate into the agency portfolio with verified valuation, specifications, and assigned consultant."
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-sans">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Core Identification & Valuation */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">home</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              1. Core Identification & Valuation
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Property Title / Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Modern Minimalist Villa in Ayala Alabang"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Tagline / Architectural Narrative Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Refined Brutalist Modernism overlooking park reserves"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Property Category *
              </label>
              <select
                value={formData.property_type}
                onChange={(e) => handleInputChange('property_type', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                  Listing Valuation (PHP ₱) *
                </label>
                {formattedPricePreview() && (
                  <span className="text-xs font-bold font-sans text-[#266F71]">
                    {formattedPricePreview()}
                  </span>
                )}
              </div>
              <input
                required
                type="text"
                placeholder="e.g. 150000000"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Registry */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">location_on</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              2. Location & Registry
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Official Street Address *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 142 Acacia Avenue, Phase 2, Ayala Alabang"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                City / Municipality *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Muntinlupa City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Province / Region
              </label>
              <input
                type="text"
                placeholder="e.g. Metro Manila"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dimensions & Architectural Configuration */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">square_foot</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              3. Dimensions & Architectural Specifications
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Floor Area (sqm)
              </label>
              <input
                type="number"
                placeholder="e.g. 520"
                value={formData.floor_area}
                onChange={(e) => handleInputChange('floor_area', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Lot Area (sqm)
              </label>
              <input
                type="number"
                placeholder="e.g. 750"
                value={formData.lot_area}
                onChange={(e) => handleInputChange('lot_area', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Parking Slots
              </label>
              <input
                type="number"
                min="0"
                value={formData.parking}
                onChange={(e) => handleInputChange('parking', parseInt(e.target.value) || 0)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Furnishing
              </label>
              <select
                value={formData.furnishing}
                onChange={(e) => handleInputChange('furnishing', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none cursor-pointer"
              >
                {FURNISHING_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Architectural Style
              </label>
              <select
                value={formData.architectural_style}
                onChange={(e) => handleInputChange('architectural_style', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none cursor-pointer"
              >
                {ARCHITECTURAL_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
              Narrative Description
            </label>
            <textarea
              rows={3}
              placeholder="Highlight architectural finishes, master suite layout, orientation, and luxury provisions..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full p-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
            />
          </div>
        </div>

        {/* Section 4: Amenities & Features */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">checklist</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              4. Curated Amenities & Features
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold font-sans transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#266F71] bg-[#266F71]/10 text-[#266F71] shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <span className="truncate mr-1">{amenity}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] shrink-0 text-[#266F71]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Media Assets */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">photo_camera</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              5. Photography & Media
            </h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="Paste high-resolution image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="h-[54px] px-6 bg-[#174849] hover:bg-[#266F71] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer shrink-0"
            >
              Add Photo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden aspect-video border border-gray-200 bg-gray-100"
              >
                <img
                  src={img}
                  alt={`Listing Media ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_COVER_IMAGE;
                  }}
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                    title="Remove Photo"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-[#266F71] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                    Main Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Broker Executive Delegation & Governance */}
        <div className="p-5 sm:p-6 bg-[#F1F0EC]/40 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200/80">
            <span className="material-symbols-outlined text-[#266F71]">admin_panel_settings</span>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#174849]">
              6. Consultant Assignment & Operational Status
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Assigned Property Consultant *
              </label>
              <select
                value={formData.agent_id}
                onChange={(e) => handleInputChange('agent_id', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none cursor-pointer"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {agent.prc_license_no ? `(${agent.prc_license_no})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Initial Listing Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none cursor-pointer"
              >
                <option value="AVAILABLE">AVAILABLE (Active for showings)</option>
                <option value="RESERVED">RESERVED (Under Contract)</option>
                <option value="SOLD">SOLD (Closed deed)</option>
                <option value="INACTIVE">INACTIVE (Off-market draft)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/80 h-[54px] mt-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#174849] font-sans">
                Publish Immediately
              </span>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => handleInputChange('is_published', e.target.checked)}
                className="w-5 h-5 accent-[#266F71] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200/80">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="h-[54px] px-6 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[54px] px-8 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSubmitting ? 'sync' : 'save'}
            </span>
            <span>{isSubmitting ? 'Saving Estate...' : 'Save Property Listing'}</span>
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}
