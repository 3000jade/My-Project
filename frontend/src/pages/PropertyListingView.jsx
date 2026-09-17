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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black text-gray-900 dark:text-gray-100 pb-20 pt-24">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 transition-all animate-bounce">
          <span className="material-symbols-outlined text-amber-500">verified</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation Strip */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap py-1">
          <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-amber-600 transition-colors">Properties</Link>
          <span>/</span>
          <span>{property.city || 'Pasig City'}</span>
          <span>/</span>
          <span>{property.barangay || 'Rosario'}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">
            {property.development || 'Urban Deca Homes Ortigas'}
          </span>
        </nav>

        {/* SECTION 1: LISTING IDENTIFICATION & STATUS HEADER */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
            {/* Status Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
                {property.status || 'For Sale'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40">
                {property.unit_status || 'New'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                {property.property_type || 'Residential Condominium'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {property.tenure || 'Perpetual Ownership (Freehold)'}
              </span>
            </div>

            {/* Listing ID & MLS Reference Strip */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700">
                <span className="text-gray-400">ID:</span>
                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{property.id}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <span className="text-amber-700 dark:text-amber-400 font-semibold">Ref:</span>
                <span className="font-mono font-extrabold text-amber-900 dark:text-amber-200">{property.ref_code || 'MLSPH91M99LRH7'}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="ml-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 hover:scale-110 transition-transform"
                  title="Copy Reference Code"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedRef ? 'done' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Title & Geographic Subhead */}
          <div className="mt-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight">
              {property.title}
            </h1>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">location_on</span>
              <span>{property.development || 'Urban Deca Homes Ortigas'}</span> •{' '}
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-4 md:p-6 shadow-sm">
              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">bed</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.bedrooms || 2}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bedrooms</p>
              </div>

              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">bathtub</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.bathrooms || 1}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bathroom</p>
              </div>

              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">square_foot</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.sqm || '30.60 sqm'}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Floor Area</p>
              </div>

              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">stairs</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.floor_level || '6th Floor'}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Floor Level</p>
              </div>

              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">chair</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.furnishing || 'Bare'}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Furnishing</p>
              </div>

              <div className="text-center p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/40">
                <span className="material-symbols-outlined text-amber-600 text-xl">calendar_today</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{property.year_built || 2023}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Year Built</p>
              </div>
            </div>

            {/* SECTION 2: PRICING & FINANCING ENGINE */}
            <FinancingCalculator
              totalContractPrice={property.price_raw || 3000000}
              promoCashOut={property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
              startingAmortization={property.monthly_amortization || 'Starting at PHP 15,000 / month'}
            />

            {/* SECTION 3: DETAILED SPECIFICATIONS TABLE */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">tune</span>
                Unit & Space Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Property Type</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.property_type || 'Residential Condominium'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Floor Area</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.sqm || '30.60 sqm'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Bedrooms</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.bedrooms || 2} Bedrooms</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Bathrooms</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.bathrooms || 1} Bathroom</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Floor Level</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.floor_level || '6th Floor'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Furnishing</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.furnishing || 'Bare'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Year Built</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.year_built || 2023}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Tenure</span>
                  <span className="font-bold text-gray-900 dark:text-white">{property.tenure || 'Perpetual Ownership (Freehold)'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Terrain & Drainage</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    {property.terrain || 'Flood-Free Area'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">map</span>
                Geographic Location & Neighborhood
              </h2>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Situated prominently within <strong>{property.development || 'Urban Deca Homes Ortigas'}</strong> along{' '}
                <strong>{property.thoroughfare || 'Ortigas Avenue Extension'}</strong> in Barangay{' '}
                <strong>{property.barangay || 'Rosario'}</strong>, <strong>{property.city || 'Pasig City'}</strong>. The development provides rapid arterial access to the Ortigas Central Business District, Eastwood City, Bridgetowne Destination Estate, and the C-5 transit corridor.
              </p>

              {/* Simulated Map / Coordinates Card */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-900 text-white p-6 border border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Development Pin</span>
                    <h3 className="text-base font-bold mt-0.5">{property.development || 'Urban Deca Homes Ortigas'}</h3>
                    <p className="text-xs text-gray-400 mt-1">Ortigas Avenue Extension, Rosario, Pasig City</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Urban Deca Homes Ortigas, Ortigas Avenue Extension, Rosario, Pasig City')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[54px] px-5 rounded-xl bg-white text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* SECTION 5: AMENITIES & COMMUNITY POLICIES */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">verified_user</span>
                Amenities & Building Policies
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">shield</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{property.security || '24/7 Gated Security'}</p>
                    <p className="text-[11px] text-gray-500">CCTV & roving guards</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">pets</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{property.pet_policy || 'Pet-Friendly'}</p>
                    <p className="text-[11px] text-gray-500">Pets allowed in building</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">real_estate_agent</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{property.tenure || 'Perpetual Ownership (Freehold)'}</p>
                    <p className="text-[11px] text-gray-500">Lifetime condominium title</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">water_drop</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{property.terrain || 'Flood-Free Area'}</p>
                    <p className="text-[11px] text-gray-500">Elevated road infrastructure</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">sports_gymnastics</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Community Clubhouse</p>
                    <p className="text-[11px] text-gray-500">Social hall & events lounge</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">park</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Pocket Parks</p>
                    <p className="text-[11px] text-gray-500">Green open landscaped areas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY ACTION RAIL (35% width / 4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Quick Price Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
                Total Contract Price
              </span>
              <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                ₱{(property.price_raw || 3000000).toLocaleString()}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs py-2 px-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                <span className="font-semibold">Promo Cash-Out:</span>
                <span className="font-extrabold">{property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}</span>
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {property.monthly_amortization || 'Starting at PHP 15,000 / month'}
              </div>

              {/* SECTION 7: VIEWING LIST AGGREGATE TRIGGER */}
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                <button
                  type="button"
                  onClick={() => toggleViewingList(property)}
                  className={`w-full h-[54px] rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isSaved
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isSaved ? 'check_circle' : 'playlist_add'}
                  </span>
                  {isSaved ? 'In Viewing List' : 'Add to Viewing List'}
                </button>
                <p className="text-[11px] text-gray-500 text-center">
                  Populates your personal Viewing List aggregate for comparison & routing.
                </p>

                {/* SECTION 7: INSPECTION SCHEDULE TRIGGER */}
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full h-[54px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  Schedule Free Site Viewing
                </button>
              </div>
            </div>

            {/* SECTION 6: CONTACT & BROKERAGE CARD */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <img
                  src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={property.agent?.name || 'Jayson Canonico'}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {property.agent?.name || 'Jayson Canonico'}
                  </h3>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    {property.agent?.title || 'Real Estate Agent'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    Verified Brokerage
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {property.call_to_action || property.agent?.cta || 'Direct message for free site viewing'}
                </p>

                {inquirySent ? (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center">
                    <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mt-1">Message Dispatched</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
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
                      className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number (09XX XXX XXXX)"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <textarea
                      rows={3}
                      value={agentMessage}
                      onChange={(e) => setAgentMessage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-[54px] rounded-2xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
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
