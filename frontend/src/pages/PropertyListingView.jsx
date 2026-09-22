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
      {/* Toast Notification Banner - Editorial Card */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-white text-[#183d3b] px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-[#e1e5df] transition-all">
          <span className="material-symbols-outlined text-[#c4683c] text-[20px]">verified</span>
          <span className="text-xs font-semibold tracking-wide font-sans">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation Strip */}
        <nav className="flex items-center gap-2 text-xs text-[#7a868a] overflow-x-auto whitespace-nowrap py-1 font-sans">
          <Link to="/" className="hover:text-[#183d3b] transition-colors">Home</Link>
          <span className="text-[#c2c9bf]">/</span>
          <Link to="/properties" className="hover:text-[#183d3b] transition-colors">Properties</Link>
          <span className="text-[#c2c9bf]">/</span>
          <span>{property.city || 'Pasig City'}</span>
          <span className="text-[#c2c9bf]">/</span>
          <span>{property.barangay || 'Rosario'}</span>
          <span className="text-[#c2c9bf]">/</span>
          <span className="text-[#183d3b] font-medium truncate max-w-xs">
            {property.development || 'Urban Deca Homes Ortigas'}
          </span>
        </nav>

        {/* SECTION 1: EDITORIAL HEADER & ARCHITECTURAL CADASTRE */}
        <div className="border-b border-[#e1e5df] pb-8">
          {/* Architectural Cadastre Metadata Strip (Replaces generic pill chips) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#183d3b]"></span>
                <span className="font-bold uppercase tracking-[0.16em] text-[#183d3b] text-[11px]">
                  {property.status || 'For Sale'}
                </span>
              </div>
              <span className="text-[#c2c9bf]">|</span>
              <span className="font-semibold uppercase tracking-wider text-[#1c2224] text-[11px]">
                {property.unit_status || 'New'}
              </span>
              <span className="text-[#c2c9bf]">|</span>
              <span className="font-medium text-[#5f6b6f] text-[11px]">
                {property.property_type || 'Residential Condominium'}
              </span>
              <span className="text-[#c2c9bf]">|</span>
              <span className="text-[#c4683c] font-semibold text-[11px]">
                {property.tenure || 'Perpetual Ownership (Freehold)'}
              </span>
            </div>

            {/* Cadastral Reference & Telemetry */}
            <div className="flex items-center gap-3 text-xs font-mono text-[#5f6b6f]">
              <span className="text-[#7a868a]">
                ID: <span className="font-semibold text-[#1c2224]">{property.id}</span>
              </span>
              <span className="text-[#c2c9bf]">|</span>
              <div className="flex items-center gap-1 text-[#183d3b]">
                <span className="text-[#7a868a]">REF:</span>
                <span className="font-bold tracking-wider">{property.ref_code || 'MLSPH91M99LRH7'}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="ml-1 text-[#7a868a] hover:text-[#183d3b] hover:scale-110 transition-transform"
                  title="Copy Reference Code"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedRef ? 'done' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Title & Geographic Subhead */}
          <div className="mt-3">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-[#183d3b] leading-[1.15] tracking-tight">
              {property.title}
            </h1>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-[#5f6b6f] mt-3 font-sans">
              <span className="material-symbols-outlined text-[#c4683c] text-[18px]">location_on</span>
              <span className="font-semibold text-[#1c2224]">{property.development || 'Urban Deca Homes Ortigas'}</span>
              <span className="text-[#c2c9bf]">•</span>
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

        {/* SECTION 3: KEY METRICS - ARCHITECTURAL LEDGER STRIP (Replaces generic pill/icon boxes) */}
        <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#e1e5df]">
            <div className="px-4 py-2 first:pl-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Bedrooms</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.bedrooms || 2}</p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Bathrooms</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.bathrooms || 1}</p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Floor Area</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.sqm || '30.60 sqm'}</p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Floor Level</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.floor_level || '6th Floor'}</p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Furnishing</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.furnishing || 'Bare'}</p>
            </div>

            <div className="px-4 py-2 last:pr-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a] font-sans">Year Built</p>
              <p className="font-display text-3xl font-light text-[#183d3b] mt-1">{property.year_built || 2023}</p>
            </div>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT CONTENT COLUMN (65% width / 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECTION 1.5: THE BROKER'S NOTE (Why This Property) */}
            <div className="bg-[#f9f9f7] border border-[#e1e5df] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-normal text-[#183d3b] mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#c4683c]">format_quote</span>
                Why This Property
              </h2>
              <p className="text-sm md:text-base text-gray-600 font-sans leading-relaxed italic">
                {property.broker_note || "This residence represents a rare intersection of architectural intent and location. We specifically selected this unit for its commanding, unobstructed views and the pristine condition of its bespoke interiors. It's an exceptional asset for both end-use and long-term equity holding."}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-[#e1e5df]">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop" alt="Broker" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0f1722] uppercase tracking-wider">{property.agent?.name || 'Marcus Reyes'}</div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Principal Broker</div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PRICING & FINANCING ENGINE */}
            <FinancingCalculator
              totalContractPrice={property.price_raw || 3000000}
              promoCashOut={property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
              startingAmortization={property.monthly_amortization || 'Starting at PHP 15,000 / month'}
            />

            {/* SECTION 3: DETAILED SPECIFICATIONS MATRIX */}
            <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c4683c]"></span>
                Unit & Space Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">apartment</span>
                    Property Type
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.property_type || 'Residential Condominium'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">square_foot</span>
                    Floor Area
                  </span>
                  <span className="font-semibold font-mono text-[#1c2224]">{property.sqm || '30.60 sqm'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">bed</span>
                    Bedrooms
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.bedrooms || 2} Bedrooms</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">shower</span>
                    Bathrooms
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.bathrooms || 1} Bathroom</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">layers</span>
                    Floor Level
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.floor_level || '6th Floor'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">chair</span>
                    Furnishing
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.furnishing || 'Bare'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">construction</span>
                    Year Built
                  </span>
                  <span className="font-semibold font-mono text-[#1c2224]">{property.year_built || 2023}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    Tenure
                  </span>
                  <span className="font-semibold text-[#1c2224]">{property.tenure || 'Perpetual Ownership (Freehold)'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#e1e5df]/80 sm:col-span-2">
                  <span className="text-[#7a868a] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">landscape</span>
                    Terrain & Drainage
                  </span>
                  <span className="font-semibold text-[#2d6a4f] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]"></span>
                    {property.terrain || 'Flood-Free Area'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}
            <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-4 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c4683c]"></span>
                Geographic Location & Neighborhood
              </h2>

              <p className="text-xs sm:text-sm text-[#5f6b6f] leading-relaxed mb-6 font-sans">
                Situated prominently within <strong className="text-[#183d3b] font-semibold">{property.development || 'Urban Deca Homes Ortigas'}</strong> along{' '}
                <strong className="text-[#183d3b] font-semibold">{property.thoroughfare || 'Ortigas Avenue Extension'}</strong> in Barangay{' '}
                <strong className="text-[#183d3b] font-semibold">{property.barangay || 'Rosario'}</strong>, <strong className="text-[#183d3b] font-semibold">{property.city || 'Pasig City'}</strong>. The development provides rapid arterial access to the Ortigas Central Business District, Eastwood City, Bridgetowne Destination Estate, and the C-5 transit corridor.
              </p>

              {/* Geographic Cadastral Pin Card */}
              <div className="rounded-xl bg-[#fafafa] text-[#1c2224] p-6 border border-[#e1e5df]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c4683c] font-mono">Cadastral Pin</span>
                    <h3 className="font-display text-lg font-normal mt-1 text-[#183d3b]">{property.development || 'Urban Deca Homes Ortigas'}</h3>
                    <p className="text-xs text-[#7a868a] mt-1 font-sans">Ortigas Avenue Extension, Rosario, Pasig City</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Urban Deca Homes Ortigas, Ortigas Avenue Extension, Rosario, Pasig City')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[54px] px-6 rounded-xl bg-[#183d3b] text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#122e2c] transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* SECTION 5: AMENITIES & COMMUNITY POLICIES */}
            <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-normal text-[#183d3b] mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c4683c]"></span>
                Amenities & Building Policies
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">{property.security || '24/7 Gated Security'}</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">CCTV & roving guards</p>
                </div>

                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">{property.pet_policy || 'Pet-Friendly'}</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">Pets allowed in building</p>
                </div>

                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">{property.tenure || 'Perpetual Ownership (Freehold)'}</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">Lifetime condominium title</p>
                </div>

                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">{property.terrain || 'Flood-Free Area'}</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">Elevated road infrastructure</p>
                </div>

                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">Community Clubhouse</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">Social hall & events lounge</p>
                </div>

                <div className="p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa]">
                  <p className="text-xs font-bold text-[#183d3b]">Pocket Parks</p>
                  <p className="text-[11px] text-[#7a868a] mt-0.5">Green open landscaped areas</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY ACTION RAIL (35% width / 4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 font-sans">
            {/* Price Card */}
            <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#7a868a] font-sans">
                Total Contract Price
              </span>
              <div className="font-display text-3xl sm:text-4xl font-light text-[#183d3b] mt-1">
                ₱{(property.price_raw || 3000000).toLocaleString()}
              </div>

              <div className="mt-4 pt-4 border-t border-[#e1e5df] space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[#7a868a] font-medium">Promo Cash-Out</span>
                  <span className="font-bold text-[#c4683c]">{property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[#7a868a] font-medium">Monthly Amortization</span>
                  <span className="font-semibold text-[#183d3b]">{property.monthly_amortization || 'Starting at PHP 15,000 / month'}</span>
                </div>
              </div>

              {/* SECTION 7: VIEWING LIST AGGREGATE TRIGGER */}
              <div className="mt-6 pt-6 border-t border-[#e1e5df] space-y-3">
                <button
                  type="button"
                  onClick={() => toggleViewingList(property)}
                  className={`w-full h-[54px] rounded-xl text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all ${
                    isSaved
                      ? 'bg-[#2d6a4f] text-white shadow-sm'
                      : 'bg-white hover:bg-gray-50 text-[#183d3b] border border-[#183d3b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
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
                  className="w-full h-[54px] rounded-xl bg-[#c4683c] hover:bg-[#b0572d] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Schedule Free Site Viewing
                </button>
              </div>
            </div>

            {/* SECTION 6: CONTACT & BROKERAGE CARD */}
            <div className="bg-white border border-[#e1e5df] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#e1e5df]">
                <img
                  src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={property.agent?.name || 'Jayson Canonico'}
                  className="w-12 h-12 rounded-xl object-cover border border-[#e1e5df]"
                />
                <div>
                  <h3 className="text-sm font-bold text-[#183d3b] font-sans">
                    {property.agent?.name || 'Jayson Canonico'}
                  </h3>
                  <p className="text-xs text-[#7a868a] font-medium font-sans">
                    {property.agent?.title || 'Real Estate Agent'}
                  </p>
                </div>
              </div>

              <div className="mt-4 font-sans">
                <p className="text-xs font-semibold text-[#183d3b]">
                  {property.call_to_action || property.agent?.cta || 'Direct message for free site viewing'}
                </p>

                {inquirySent ? (
                  <div className="mt-4 p-4 rounded-xl bg-[#fafafa] border border-[#e1e5df] text-center">
                    <span className="material-symbols-outlined text-[#2d6a4f] text-2xl">check_circle</span>
                    <p className="text-xs font-bold text-[#183d3b] mt-1">Message Dispatched</p>
                    <p className="text-[11px] text-[#7a868a] mt-0.5">
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
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#fafafa] text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#183d3b]"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number (09XX XXX XXXX)"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#fafafa] text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#183d3b]"
                      required
                    />
                    <textarea
                      rows={3}
                      value={agentMessage}
                      onChange={(e) => setAgentMessage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#e1e5df] bg-[#fafafa] text-[#1c2224] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#183d3b]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-[54px] rounded-xl bg-[#183d3b] hover:bg-[#122e2c] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
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
