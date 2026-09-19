import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProperties } from '../mockData/mockProperties';
import useViewingList from '../hooks/useViewingList';
import PropertyGalleryMosaic from '../components/ui/PropertyGalleryMosaic';
import FinancingCalculator from '../components/ui/FinancingCalculator';
import InspectionScheduleModal from '../components/ui/InspectionScheduleModal';

export default function PropertyListingView() {
  const { id } = useParams();
  const { isInViewingList, toggleViewingList } = useViewingList();

  const [property, setProperty] = useState(() => {
    const found = mockProperties.find(p => p.id === id || p.ref_code === id);
    return found || mockProperties[0];
  });

  useEffect(() => {
    const found = mockProperties.find(p => p.id === id || p.ref_code === id);
    if (found) {
      setProperty(found);
    }
  }, [id]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [agentMessage, setAgentMessage] = useState(
    `Hi ${property.agent?.name || 'Jayson Canonico'}, I am interested in ${property.title} at ${property.development || 'Urban Deca Homes Ortigas'} (Ref: ${property.ref_code || 'MLSPH91M99LRH7'}). Please contact me for a free site viewing.`
  );
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const isSaved = isInViewingList(property.id);

  const handleCopyRef = () => {
    const textToCopy = property.ref_code || 'MLSPH91M99LRH7';
    navigator.clipboard?.writeText(textToCopy);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleSendAgentInquiry = (e) => {
    e.preventDefault();
    const payload = {
      event: 'AUTOMATED_BROKER_INQUIRY_DISPATCH',
      listing_id: property.id,
      reference_code: property.ref_code || 'MLSPH91M99LRH7',
      assigned_agent: property.agent?.name || 'Jayson Canonico',
      sender_name: senderName,
      sender_phone: senderPhone,
      message: agentMessage,
      timestamp: new Date().toISOString()
    };

    console.log('[Automated Broker Routing] Direct message dispatched:', payload);
    setInquirySent(true);
    setToastMessage('Direct message dispatched to Jayson Canonico via automated broker routing!');
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleScheduleSuccess = (schedulePayload) => {
    setToastMessage(
      `Viewing scheduled for ${schedulePayload.scheduled_date} (${schedulePayload.time_slot})! Assigned to ${schedulePayload.assigned_agent}.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="min-h-screen bg-white text-[#1c2224] pb-24 pt-24 font-sans antialiased">
      {/* Toast Notification Banner - Clean White Theme */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-white text-[#183d3b] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#e1e5df] transition-all animate-bounce">
          <span className="material-symbols-outlined text-[#c4683c]">verified</span>
          <span className="text-xs font-bold tracking-wide font-sans">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation Strip */}
        <nav className="flex items-center gap-2 text-xs text-[#5f6b6f] overflow-x-auto whitespace-nowrap py-1 font-sans">
          <Link to="/" className="hover:text-[#c4683c] transition-colors">Home</Link>
          <span className="text-[#c2c9bf]">/</span>
          <Link to="/properties" className="hover:text-[#c4683c] transition-colors">Properties</Link>
          <span className="text-[#c2c9bf]">/</span>
          <span>{property.city || 'Pasig City'}</span>
          <span className="text-[#c2c9bf]">/</span>
          <span>{property.barangay || 'Rosario'}</span>
          <span className="text-[#c2c9bf]">/</span>
          <span className="text-[#183d3b] font-semibold truncate max-w-xs">
            {property.development || 'Urban Deca Homes Ortigas'}
          </span>
        </nav>

        {/* SECTION 1: LISTING IDENTIFICATION & STATUS HEADER */}
        <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#e1e5df]">
            {/* Status Chips with Scandinavian Soft Functionalism Accents */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-sans bg-[#183d3b]/10 text-[#183d3b] border border-[#183d3b]/20">
                {property.status || 'For Sale'}
              </span>
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-sans bg-[#c4683c]/10 text-[#c4683c] border border-[#c4683c]/20">
                {property.unit_status || 'New'}
              </span>
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-sans bg-[#ecefe9] text-[#1c2224] border border-[#e1e5df]">
                {property.property_type || 'Residential Condominium'}
              </span>
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-sans bg-[#fcf1eb] text-[#c4683c] border border-[#c4683c]/20">
                {property.tenure || 'Perpetual Ownership (Freehold)'}
              </span>
            </div>

            {/* Listing ID & MLS Reference Strip (Geist Mono Telemetry) */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-[#ecefe9] px-3 py-1.5 rounded-xl border border-[#e1e5df]">
                <span className="text-[#7a868a]">ID:</span>
                <span className="font-semibold text-[#1c2224]">{property.id}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#fcf1eb] px-3 py-1.5 rounded-xl border border-[#c4683c]/30">
                <span className="text-[#c4683c] font-semibold">Ref:</span>
                <span className="font-extrabold text-[#c4683c]">{property.ref_code || 'MLSPH91M99LRH7'}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="ml-1 text-[#c4683c] hover:text-[#b0572d] hover:scale-110 transition-transform"
                  title="Copy Reference Code"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedRef ? 'done' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Title & Geographic Subhead in Fraunces / Satoshi */}
          <div className="mt-5">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-[#183d3b] leading-[1.2] tracking-tight">
              {property.title}
            </h1>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-[#5f6b6f] mt-2.5 font-sans">
              <span className="material-symbols-outlined text-[#c4683c] text-[18px]">location_on</span>
              <span className="font-medium text-[#1c2224]">{property.development || 'Urban Deca Homes Ortigas'}</span> •{' '}
              <span>{property.thoroughfare || 'Ortigas Avenue Extension'}</span>,{' '}
              <span>{property.barangay || 'Rosario'}</span>,{' '}
              <span>{property.city || 'Pasig City'}</span>,{' '}
              <span>{property.region || 'Metro Manila (NCR), Philippines'}</span>
            </p>
          </div>
        </div>

        {/* Media Mosaic Gallery */}
        <PropertyGalleryMosaic
          images={property.images || property.gallery || [property.mainImage]}
          title={property.title}
        />

        {/* MAIN BODY: 2-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT CONTENT COLUMN (65% width / 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECTION 3: KEY METRICS PILL BAR */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-white border border-[#e1e5df] rounded-3xl p-4 md:p-6 shadow-sm">
              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">bed</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.bedrooms || 2}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Bedrooms</p>
              </div>

              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">bathtub</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.bathrooms || 1}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Bathroom</p>
              </div>

              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">square_foot</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.sqm || '30.60 sqm'}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Floor Area</p>
              </div>

              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">stairs</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.floor_level || '6th Floor'}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Floor Level</p>
              </div>

              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">chair</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.furnishing || 'Bare'}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Furnishing</p>
              </div>

              <div className="text-center p-3 rounded-2xl bg-[#ecefe9]/60">
                <span className="material-symbols-outlined text-[#183d3b] text-xl">calendar_today</span>
                <p className="font-display text-lg font-medium text-[#183d3b] mt-0.5">{property.year_built || 2023}</p>
                <p className="text-[10px] text-[#7a868a] uppercase tracking-wider font-bold font-sans">Year Built</p>
              </div>
            </div>

            {/* SECTION 2: PRICING & FINANCING ENGINE */}
            <FinancingCalculator
              totalContractPrice={property.price_raw || 3000000}
              promoCashOut={property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
              startingAmortization={property.monthly_amortization || 'Starting at PHP 15,000 / month'}
            />

            {/* SECTION 3: DETAILED SPECIFICATIONS TABLE */}
            <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-6 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#c4683c]">tune</span>
                Unit & Space Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-sans">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Property Type</span>
                  <span className="font-bold text-[#183d3b]">{property.property_type || 'Residential Condominium'}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Floor Area</span>
                  <span className="font-bold font-mono text-[#183d3b]">{property.sqm || '30.60 sqm'}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Bedrooms</span>
                  <span className="font-bold text-[#183d3b]">{property.bedrooms || 2} Bedrooms</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Bathrooms</span>
                  <span className="font-bold text-[#183d3b]">{property.bathrooms || 1} Bathroom</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Floor Level</span>
                  <span className="font-bold text-[#183d3b]">{property.floor_level || '6th Floor'}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Furnishing</span>
                  <span className="font-bold text-[#183d3b]">{property.furnishing || 'Bare'}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Year Built</span>
                  <span className="font-bold font-mono text-[#183d3b]">{property.year_built || 2023}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60">
                  <span className="text-[#5f6b6f] font-medium">Tenure</span>
                  <span className="font-bold text-[#183d3b]">{property.tenure || 'Perpetual Ownership (Freehold)'}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 sm:col-span-2">
                  <span className="text-[#5f6b6f] font-medium">Terrain & Drainage</span>
                  <span className="font-bold text-[#2d6a4f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    {property.terrain || 'Flood-Free Area'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}
            <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-4 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#c4683c]">map</span>
                Geographic Location & Neighborhood
              </h2>

              <p className="text-xs sm:text-sm text-[#5f6b6f] leading-relaxed mb-6 font-sans">
                Situated prominently within <strong className="text-[#183d3b] font-semibold">{property.development || 'Urban Deca Homes Ortigas'}</strong> along{' '}
                <strong className="text-[#183d3b] font-semibold">{property.thoroughfare || 'Ortigas Avenue Extension'}</strong> in Barangay{' '}
                <strong className="text-[#183d3b] font-semibold">{property.barangay || 'Rosario'}</strong>, <strong className="text-[#183d3b] font-semibold">{property.city || 'Pasig City'}</strong>. The development provides rapid arterial access to the Ortigas Central Business District, Eastwood City, Bridgetowne Destination Estate, and the C-5 transit corridor.
              </p>

              {/* Geographic Cadastral Pin Card - White Theme */}
              <div className="relative rounded-2xl overflow-hidden bg-white text-[#1c2224] p-6 border border-[#e1e5df] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c4683c] font-mono">Cadastral Pin</span>
                    <h3 className="font-display text-lg font-medium mt-1 text-[#183d3b]">{property.development || 'Urban Deca Homes Ortigas'}</h3>
                    <p className="text-xs text-[#5f6b6f] mt-1 font-sans">Ortigas Avenue Extension, Rosario, Pasig City</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Urban Deca Homes Ortigas, Ortigas Avenue Extension, Rosario, Pasig City')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[54px] px-6 rounded-xl bg-[#183d3b] text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#122e2c] transition-all shadow-md active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* SECTION 5: AMENITIES & COMMUNITY POLICIES */}
            <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-6 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#c4683c]">verified_user</span>
                Amenities & Building Policies
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 font-sans">
                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#183d3b]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#183d3b] text-xl">shield</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">{property.security || '24/7 Gated Security'}</p>
                    <p className="text-[11px] text-[#7a868a]">CCTV & roving guards</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#c4683c]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#c4683c] text-xl">pets</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">{property.pet_policy || 'Pet-Friendly'}</p>
                    <p className="text-[11px] text-[#7a868a]">Pets allowed in building</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#183d3b]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#183d3b] text-xl">real_estate_agent</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">{property.tenure || 'Perpetual Ownership (Freehold)'}</p>
                    <p className="text-[11px] text-[#7a868a]">Lifetime condominium title</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#2d6a4f] text-xl">water_drop</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">{property.terrain || 'Flood-Free Area'}</p>
                    <p className="text-[11px] text-[#7a868a]">Elevated road infrastructure</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#183d3b]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#183d3b] text-xl">sports_gymnastics</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">Community Clubhouse</p>
                    <p className="text-[11px] text-[#7a868a]">Social hall & events lounge</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecefe9]/50 border border-[#e1e5df]/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#183d3b]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#183d3b] text-xl">park</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#183d3b]">Pocket Parks</p>
                    <p className="text-[11px] text-[#7a868a]">Green open landscaped areas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY ACTION RAIL (35% width / 4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 font-sans">
            {/* Quick Price Card - White Theme */}
            <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#7a868a] font-sans">
                Total Contract Price
              </span>
              <div className="font-display text-3xl sm:text-4xl font-normal text-[#183d3b] mt-1">
                ₱{(property.price_raw || 3000000).toLocaleString()}
              </div>

              <div className="mt-3.5 flex items-center justify-between text-xs py-2.5 px-3.5 bg-[#fcf1eb] rounded-2xl border border-[#c4683c]/30 text-[#c4683c]">
                <span className="font-semibold">Promo Cash-Out:</span>
                <span className="font-extrabold">{property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}</span>
              </div>

              <div className="mt-2 text-xs text-[#5f6b6f] font-medium">
                {property.monthly_amortization || 'Starting at PHP 15,000 / month'}
              </div>

              {/* SECTION 7: VIEWING LIST AGGREGATE TRIGGER */}
              <div className="mt-5 pt-5 border-t border-[#e1e5df] space-y-3">
                <button
                  type="button"
                  onClick={() => toggleViewingList(property)}
                  className={`w-full h-[54px] rounded-2xl text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isSaved
                      ? 'bg-[#2d6a4f] hover:bg-[#24543e] text-white'
                      : 'bg-white hover:bg-gray-50 text-[#183d3b] border-2 border-[#183d3b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isSaved ? 'check_circle' : 'playlist_add'}
                  </span>
                  {isSaved ? 'In Viewing List' : 'Add to Viewing List'}
                </button>
                <p className="text-[11px] text-[#7a868a] text-center font-sans">
                  Populates your personal Viewing List aggregate for comparison & routing.
                </p>

                {/* SECTION 7: INSPECTION SCHEDULE TRIGGER */}
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full h-[54px] rounded-2xl bg-[#c4683c] hover:bg-[#b0572d] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 shadow-lg shadow-[#c4683c]/20 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  Schedule Free Site Viewing
                </button>
              </div>
            </div>

            {/* SECTION 6: CONTACT & BROKERAGE CARD - White Theme */}
            <div className="bg-white border border-[#e1e5df] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#e1e5df]">
                <img
                  src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={property.agent?.name || 'Jayson Canonico'}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-[#e1e5df]"
                />
                <div>
                  <h3 className="text-sm font-bold text-[#183d3b] font-sans">
                    {property.agent?.name || 'Jayson Canonico'}
                  </h3>
                  <p className="text-xs text-[#c4683c] font-semibold mt-0.5 font-sans">
                    {property.agent?.title || 'Real Estate Agent'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-md font-sans">
                    Verified Brokerage
                  </span>
                </div>
              </div>

              <div className="mt-4 font-sans">
                <p className="text-xs font-bold text-[#183d3b]">
                  {property.call_to_action || property.agent?.cta || 'Direct message for free site viewing'}
                </p>

                {inquirySent ? (
                  <div className="mt-4 p-4 rounded-2xl bg-[#e8eeea] border border-[#183d3b]/20 text-center">
                    <span className="material-symbols-outlined text-[#2d6a4f] text-2xl">check_circle</span>
                    <p className="text-xs font-bold text-[#183d3b] mt-1">Message Dispatched</p>
                    <p className="text-[11px] text-[#5f6b6f] mt-0.5">
                      Jayson Canonico has been notified via automated broker routing.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendAgentInquiry} className="mt-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#ecefe9]/40 text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number (09XX XXX XXXX)"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#ecefe9]/40 text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      required
                    />
                    <textarea
                      rows={3}
                      value={agentMessage}
                      onChange={(e) => setAgentMessage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#e1e5df] bg-[#ecefe9]/40 text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-[54px] rounded-2xl bg-[#183d3b] hover:bg-[#122e2c] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Send Direct Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Inspection Schedule Drawer/Modal */}
      <InspectionScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        property={property}
        onScheduleSuccess={handleScheduleSuccess}
      />
    </div>
  );
}
