import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockProperties } from '../../mockData/mockProperties';

export default function AgentPropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const initialProperty = mockProperties.find(p => p.id === id) || mockProperties[0];
  const [property, setProperty] = useState(initialProperty);
  const [activeImage, setActiveImage] = useState(property.mainImage);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrice, setEditPrice] = useState(property.price);
  const [editStatus, setEditStatus] = useState(property.status);

  const togglePublished = () => {
    setProperty(prev => ({ ...prev, is_published: !prev.is_published }));
  };

  const handleSaveStatus = () => {
    setProperty(prev => ({ ...prev, price: editPrice, status: editStatus }));
    setShowEditModal(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={property.title}
        subtitle={`${property.property_type} • ${property.location}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Properties", to: "/agent/properties" },
          { label: property.title }
        ]}
        badge={<StatusBadge status={property.status} />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="h-[46px] px-4 rounded-xl border border-gray-300 hover:bg-white text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Client Preview
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="h-[46px] px-4 rounded-xl border border-gray-300 hover:bg-white text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Listing
            </button>
            <button
              onClick={togglePublished}
              className={`h-[46px] px-5 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all text-white shadow-sm ${
                property.is_published
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-[#266F71] hover:bg-[#174849]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {property.is_published ? 'unpublished' : 'publish'}
              </span>
              {property.is_published ? 'Unpublish' : 'Publish Listing'}
            </button>
          </div>
        }
      />

      {/* Gallery Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden bg-gray-100">
          <img
            src={activeImage}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <StatusBadge status={property.status} />
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md ${
              property.is_published ? 'bg-[#266F71]/80 text-white' : 'bg-gray-800/80 text-white'
            }`}>
              {property.is_published ? 'Live on Client Portal' : 'Unpublished Draft'}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xl font-display font-bold">
            {property.price}
          </div>
        </div>

        {/* Thumbnails */}
        {property.images && property.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  activeImage === img ? 'border-[#266F71] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Metrics Chips */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-sans mb-4">
              Property Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#F1F0EC]/60 rounded-xl">
                <span className="material-symbols-outlined text-[#266F71] text-[24px]">bed</span>
                <p className="text-lg font-bold font-display text-[#174849] mt-1">{property.bedrooms}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Bedrooms</p>
              </div>
              <div className="p-3 bg-[#F1F0EC]/60 rounded-xl">
                <span className="material-symbols-outlined text-[#266F71] text-[24px]">bathtub</span>
                <p className="text-lg font-bold font-display text-[#174849] mt-1">{property.bathrooms}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Bathrooms</p>
              </div>
              <div className="p-3 bg-[#F1F0EC]/60 rounded-xl">
                <span className="material-symbols-outlined text-[#266F71] text-[24px]">square_foot</span>
                <p className="text-lg font-bold font-display text-[#174849] mt-1">{property.floor_area || property.sqm}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Floor Area</p>
              </div>
              <div className="p-3 bg-[#F1F0EC]/60 rounded-xl">
                <span className="material-symbols-outlined text-[#266F71] text-[24px]">garage</span>
                <p className="text-lg font-bold font-display text-[#174849] mt-1">{property.parking || 2}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Parking Slots</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Property Narrative
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              {property.description}
            </p>
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500 font-sans">
              <span className="material-symbols-outlined text-[16px] text-[#266F71]">pin_drop</span>
              <span><strong>Official Address:</strong> {property.address}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Features & Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities && property.amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#F1F0EC]/60 rounded-xl text-xs font-semibold text-[#174849] font-sans">
                  <span className="material-symbols-outlined text-[18px] text-[#266F71]">check_circle</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Agent Info & Operational Control */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Assigned Consultant
            </h3>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                alt="Agent"
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-bold text-sm text-[#174849] font-sans">{property.agent_name || "Elena Rossi"}</p>
                <p className="text-xs text-gray-500 font-sans">Licensed Senior Agent</p>
                <span className="text-[10px] text-[#266F71] font-semibold">PRC-REB-0028491</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Quick Operational Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/agent/appointments"
                className="w-full py-2.5 px-4 bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-between transition-colors text-gray-700"
              >
                <span>Schedule Showing</span>
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              </Link>
              <Link
                to="/agent/inquiries"
                className="w-full py-2.5 px-4 bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-between transition-colors text-gray-700"
              >
                <span>Related Inquiries</span>
                <span className="material-symbols-outlined text-[18px]">forum</span>
              </Link>
              <Link
                to="/agent/sales"
                className="w-full py-2.5 px-4 bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-between transition-colors text-gray-700"
              >
                <span>Record Closed Sale</span>
                <span className="material-symbols-outlined text-[18px]">monetization_on</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Client Preview Modal */}
      <DashboardModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Client-Facing Preview"
        subtitle="This is how prospective high-net-worth clients experience this property on the public portal."
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="aspect-video rounded-xl overflow-hidden relative">
            <img src={property.mainImage} alt={property.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#174849] font-sans">
              {property.property_type}
            </div>
            <div className="absolute bottom-4 right-4 bg-[#266F71] text-white px-4 py-2 rounded-xl font-display font-bold text-xl">
              {property.price}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-[#174849]">{property.title}</h2>
            <p className="text-xs text-gray-500 mt-1 font-sans">{property.location}</p>
          </div>
          <p className="text-sm font-sans text-gray-600 leading-relaxed">{property.description}</p>
          <div className="p-4 bg-[#F1F0EC] rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sans">Ready to tour?</span>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 bg-[#FB8E5D] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Inquire via AI Concierge
            </button>
          </div>
        </div>
      </DashboardModal>

      {/* Edit Listing Modal */}
      <DashboardModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Listing Details"
        subtitle="Update operational status and pricing on this property listing."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStatus}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Save Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Price Display</label>
            <input
              type="text"
              value={editPrice}
              onChange={e => setEditPrice(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Property Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71] cursor-pointer"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="RESERVED">RESERVED</option>
              <option value="SOLD">SOLD</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
