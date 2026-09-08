import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import DashboardModal from '../../components/dashboard/DashboardModal';

export default function AgentPropertyCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'House & Lot',
    price: '',
    location: '',
    address: '',
    description: '',
    bedrooms: 3,
    bathrooms: 3,
    floor_area: '',
    lot_area: '',
    status: 'AVAILABLE',
    is_published: true,
    amenities: ['24/7 Security', 'Swimming Pool']
  });

  const [images, setImages] = useState([
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop"
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const availableAmenities = [
    'Private Swimming Pool', 'Gym / Fitness Center', '24/7 Security',
    'Smart Home Automation', 'Wine Cellar', 'Private Elevator',
    'Staff Quarters', 'Solar Hybrid Power', 'Balcony / Terrace',
    'Garden / Courtyard', 'Covered Garage', 'Spa / Sauna'
  ];

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pure UI action for this phase
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Create New Property Listing"
        subtitle="Fill in verified property details, dimensions, and media assets aligning with official property records."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Properties", to: "/agent/properties" },
          { label: "New Listing" }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">home</span>
            Core Property Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Property Title / Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Modern Minimalist Villa in Ayala Alabang"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Property Type *
              </label>
              <select
                value={formData.property_type}
                onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none cursor-pointer"
              >
                <option value="House & Lot">House & Lot</option>
                <option value="Condominium">Condominium</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Estate">Estate</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Listing Price (PHP ₱) *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 150000000"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                City / Region Location *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Muntinlupa City, Metro Manila"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Complete Street Address *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 142 Acacia Avenue, Phase 2, Ayala Alabang"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Property Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Provide a comprehensive narrative describing the architectural style, design elements, orientation, and luxury finishings..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dimensions & Layout */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">square_foot</span>
            Dimensions & Configuration
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={e => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={e => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Floor Area (sqm)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={formData.floor_area}
                onChange={e => setFormData({ ...formData, floor_area: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Lot Area (sqm)
              </label>
              <input
                type="number"
                placeholder="e.g. 750"
                value={formData.lot_area}
                onChange={e => setFormData({ ...formData, lot_area: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Amenities Selection */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">checklist</span>
            Amenities & Features
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableAmenities.map(amenity => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold font-sans transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#266F71] bg-[#266F71]/10 text-[#266F71]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <span>{amenity}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Imagery & Photography */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">photo_camera</span>
            Property Photography
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="Paste high-res image URL..."
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              className="flex-1 h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="h-[54px] px-6 bg-[#174849] hover:bg-[#266F71] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Add Photo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-gray-200">
                <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-[#266F71] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Main Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Status & Publication */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#266F71]">publish</span>
            Status & Publication
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#174849] font-sans">
                Initial Operational Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-[54px] px-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans focus:border-[#266F71] outline-none cursor-pointer"
              >
                <option value="AVAILABLE">AVAILABLE (Active for showings)</option>
                <option value="RESERVED">RESERVED (Earnest deposit hold)</option>
                <option value="SOLD">SOLD (Closed deed)</option>
                <option value="INACTIVE">INACTIVE (Off-market draft)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F0EC]/60 rounded-xl border border-gray-200/80 h-[54px] mt-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#174849] font-sans">
                Publish to Client Portal Immediately
              </span>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-5 h-5 accent-[#266F71] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Form Submission Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/agent/properties"
            className="h-[54px] px-8 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="h-[54px] px-10 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            Save Property Listing
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <DashboardModal
        isOpen={showSuccessModal}
        onClose={() => navigate('/agent/properties')}
        title="Listing Saved (Frontend Preview)"
        subtitle="Your property listing draft has been registered in the frontend workspace."
        actions={
          <button
            onClick={() => navigate('/agent/properties')}
            className="h-[46px] px-6 bg-[#266F71] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider"
          >
            Go to Properties Directory
          </button>
        }
      >
        <div className="space-y-4 text-sm font-sans text-gray-600">
          <p>
            The property <strong className="text-[#174849]">{formData.title || 'Untitled Property'}</strong> has been created with status <strong className="text-[#266F71]">{formData.status}</strong>.
          </p>
          <div className="p-4 bg-[#F1F0EC] rounded-xl text-xs space-y-1">
            <p><strong>Note:</strong> During this UI-only phase, no backend queries or database migrations were run. The data is managed in React state.</p>
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
