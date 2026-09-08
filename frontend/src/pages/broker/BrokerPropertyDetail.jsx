import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { mockProperties } from '../../mockData/mockProperties';
import { mockAgents } from '../../mockData/mockAgents';

export default function BrokerPropertyDetail() {
  const { id } = useParams();
  const property = mockProperties.find(p => p.id === id) || mockProperties[0];
  const assignedAgent = mockAgents.find(a => a.id === property.agent_id) || mockAgents[0];

  const [activeImg, setActiveImg] = useState(property.mainImage);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={property.title}
        subtitle={`${property.property_type} • Supervised Listing Audit`}
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Property Monitoring", to: "/broker/properties" },
          { label: property.title }
        ]}
        badge={<StatusBadge status={property.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/broker/agents/${assignedAgent.id}`}
              className="h-[46px] px-4 rounded-xl border border-gray-300 hover:bg-white text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              View Handling Agent
            </Link>
          </div>
        }
      />

      {/* Main Image Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
        <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-gray-100">
          <img src={activeImg} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
            <StatusBadge status={property.status} />
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white">
              {property.is_published ? '● Live on Client Portal' : '○ Draft Only'}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-[#266F71] text-white px-5 py-2.5 rounded-xl text-2xl font-display font-bold">
            {property.price}
          </div>
        </div>

        {property.images && property.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImg(img)}
                className={`w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  activeImg === img ? 'border-[#266F71] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans mb-4">
              Property Architectural Metrics
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
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Parking</p>
              </div>
            </div>
          </div>

          {/* Description & Address */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Property Narrative & Registry
            </h3>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              {property.description}
            </p>
            <div className="pt-3 border-t border-gray-100 text-xs font-sans text-gray-500">
              <strong>Official Street Address:</strong> {property.address}
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Agent & Audit Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Assigned Consultant
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={assignedAgent.avatar}
                alt={assignedAgent.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-bold text-sm text-[#174849] font-sans">{assignedAgent.name}</p>
                <p className="text-xs text-gray-500 font-sans">{assignedAgent.email}</p>
                <p className="text-[10px] text-[#266F71] font-semibold">{assignedAgent.prc_license_no}</p>
              </div>
            </div>
            <Link
              to={`/broker/agents/${assignedAgent.id}`}
              className="block w-full text-center py-2 bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Consultant Profile
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Listing Operational Status
            </h3>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Listed Date:</span>
                <span className="font-semibold text-gray-800">{property.created_at}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Publication:</span>
                <span className="font-semibold text-[#266F71]">Approved & Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
