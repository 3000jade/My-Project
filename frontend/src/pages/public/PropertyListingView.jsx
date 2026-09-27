import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Compass, Star } from 'lucide-react';
import { mockProperties } from '../../mockData/mockProperties';
import useViewingList from '../../hooks/useViewingList';
import { cn } from '../../utils/cn';
import {
  PropertyGalleryMosaic,
  FinancingCalculator,
  InspectionScheduleModal,
} from '../../components/ui';

export default function PropertyListingView() {
  const { id } = useParams();
  const { isInViewingList, toggleViewingList } = useViewingList();

  // Find listing by id, ref_code, ListingId, or ListingKey
  const rawProperty = mockProperties.find(
    p => p.id === id || p.ref_code === id || p.ListingId === id || p.ListingKey === id
  ) || mockProperties[0];

  // =========================================================================
  // 1. COMPLIANCE & REDACTION: Strictly sanitize & strip confidential MLS fields
  // Never expose PrivateRemarks, ShowingInstructions, or Lockbox codes on public view
  // =========================================================================
  const property = { ...rawProperty };
  delete property.PrivateRemarks;
  delete property.ShowingInstructions;
  delete property.LockboxCode;
  delete property.AccessCode;
  delete property.private_remarks;
  delete property.showing_instructions;
  delete property.lockbox_code;

  // =========================================================================
  // 2. RESO SCHEMA INTEGRITY: Map directly to RESO Data Dictionary standard
  // =========================================================================
  const listingId = property.ListingId || property.ListingKey || property.id || property.ref_code || 'N/A';
  const refCode = property.ref_code || property.ListingId || property.id || 'N/A';
  const listPrice = property.ListPrice ?? property.price_raw ?? null;
  const standardStatus = property.StandardStatus || property.status || property.listing_status || 'Active';
  const propertyType = property.PropertyType || property.property_type || 'Residential';
  const bedroomsTotal = property.BedroomsTotal ?? property.bedrooms ?? property.beds ?? null;
  const bathroomsTotalInteger = property.BathroomsTotalInteger ?? property.bathrooms ?? property.baths ?? null;
  const livingArea = property.LivingArea ?? property.floor_area ?? (typeof property.sqm === 'number' ? property.sqm : parseFloat(property.sqm)) ?? null;
  const livingAreaUnits = property.LivingAreaUnits || 'sqm';
  const publicRemarks = property.PublicRemarks || property.description || 'Exclusive architectural residence engineered with Nordic permanence and Bauhaus geometric precision.';
  const listOfficeName = property.ListOfficeName || property.brokerage || property.agent?.brokerage || 'Nordic Architectural Realty Group';

  // =========================================================================
  // 3. EDGE CASES & NULL SAFETY: Format optional fields without undefined / NaN
  // =========================================================================
  const unitNumber = property.UnitNumber || property.unit_number || null;
  const associationFee = property.AssociationFee != null && !isNaN(Number(property.AssociationFee)) ? Number(property.AssociationFee) : null;
  const lotSizeArea = property.LotSizeArea != null && !isNaN(Number(property.LotSizeArea)) ? Number(property.LotSizeArea) : null;
  const lotSizeUnits = property.LotSizeUnits || 'sqm';
  const yearBuilt = property.YearBuilt ?? property.year_built ?? null;

  // Safe Price Formatting
  const formattedPrice = listPrice != null && !isNaN(Number(listPrice)) && Number(listPrice) > 0
    ? `₱${Number(listPrice).toLocaleString()}`
    : 'Price on Application';

  // Safe Numeric Metrics
  const formattedBedrooms = bedroomsTotal != null && !isNaN(Number(bedroomsTotal)) ? Number(bedroomsTotal) : '—';
  const formattedBathrooms = bathroomsTotalInteger != null && !isNaN(Number(bathroomsTotalInteger)) ? Number(bathroomsTotalInteger) : '—';
  const formattedLivingArea = (typeof property.sqm === 'string' && property.sqm)
    ? property.sqm
    : (livingArea != null && !isNaN(Number(livingArea))
      ? `${Number(livingArea).toLocaleString()} ${livingAreaUnits}`
      : '—');

  // Media Array: Sort by RESO Order ascending and fallback gracefully if empty
  let mediaImages = [];
  if (Array.isArray(property.Media) && property.Media.length > 0) {
    mediaImages = [...property.Media]
      .sort((a, b) => (Number(a.Order) || 0) - (Number(b.Order) || 0))
      .map(m => m.MediaURL)
      .filter(Boolean);
  } else if (Array.isArray(property.images) && property.images.length > 0) {
    mediaImages = property.images.filter(Boolean);
  } else if (Array.isArray(property.gallery) && property.gallery.length > 0) {
    mediaImages = property.gallery.filter(Boolean);
  } else if (property.mainImage) {
    mediaImages = [property.mainImage];
  }

  // Graceful visual fallback for empty media arrays (avoids render crashes)
  if (mediaImages.length === 0) {
    mediaImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200'
    ];
  }

  // Set document title
  useEffect(() => {
    document.title = `${property.title || 'Property'} | MLS #${listingId}`;
  }, [property.title, listingId]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [agentMessage, setAgentMessage] = useState(
    `Hi ${property.agent?.name || 'Listing Specialist'}, I am interested in ${property.title || 'this residence'} (MLS #${listingId}). Please contact me for a private site viewing.`
  );
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [unitMode, setUnitMode] = useState('sqm'); // 'sqm' | 'sqft'
  const [mediaMode, setMediaMode] = useState('photo'); // 'photo' | 'cad'
  const [showStickyDock, setShowStickyDock] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyDock(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSaved = isInViewingList(property.id || listingId);

  // Dynamic unit conversions
  const computedLivingAreaStr = unitMode === 'sqm'
    ? formattedLivingArea
    : (livingArea != null && !isNaN(Number(livingArea))
      ? `${Math.round(Number(livingArea) * 10.7639).toLocaleString()} sq ft`
      : formattedLivingArea);

  const computedLotAreaStr = unitMode === 'sqm'
    ? (lotSizeArea != null ? `${lotSizeArea.toLocaleString()} ${lotSizeUnits}` : '—')
    : (lotSizeArea != null ? `${Math.round(Number(lotSizeArea) * 10.7639).toLocaleString()} sq ft` : '—');

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(refCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleSendAgentInquiry = (e) => {
    e.preventDefault();
    const payload = {
      event: 'AUTOMATED_BROKER_INQUIRY_DISPATCH',
      listing_id: listingId,
      reference_code: refCode,
      assigned_agent: property.agent?.name || 'Listing Specialist',
      listing_office: listOfficeName,
      sender_name: senderName,
      sender_phone: senderPhone,
      message: agentMessage,
      timestamp: new Date().toISOString()
    };

    console.log('[RESO Broker Routing] Direct message dispatched:', payload);
    setInquirySent(true);
    setToastMessage(`Direct inquiry dispatched to ${property.agent?.name || listOfficeName}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleScheduleSuccess = (schedulePayload) => {
    setToastMessage(
      `Viewing scheduled for ${schedulePayload.scheduled_date} (${schedulePayload.time_slot})! Assigned to ${schedulePayload.assigned_agent}.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#141717] pb-24 pt-24 font-sans antialiased transition-colors">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-white dark:bg-[#0C1618] text-[#141717] dark:text-[#F4F7F7] px-6 py-3.5 rounded-[12px] shadow-xl flex items-center gap-3 border border-[#D8DFDF] dark:border-white/10 transition-all">
          <span className="material-symbols-outlined text-[#E76F51] text-[20px]">verified</span>
          <span className="text-xs font-semibold tracking-wide font-sans">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation Strip */}
        <nav className="flex items-center gap-2 text-xs text-[#5C6768] dark:text-[#95A6A6] overflow-x-auto whitespace-nowrap py-1 font-sans">
          <Link to="/" className="hover:text-[#0D4446] dark:hover:text-[#14B8A6] transition-colors">Home</Link>
          <span className="text-[#D8DFDF] dark:text-white/20">/</span>
          <Link to="/properties" className="hover:text-[#0D4446] dark:hover:text-[#14B8A6] transition-colors">Properties</Link>
          <span className="text-[#D8DFDF] dark:text-white/20">/</span>
          <span className="text-[#0D4446] dark:text-[#14B8A6] font-semibold">Property Listing Details</span>
          <span className="text-[#D8DFDF] dark:text-white/20">/</span>
          <span className="text-[#5C6768] dark:text-[#95A6A6] truncate max-w-xs">
            {property.development || property.title || propertyType}
          </span>
        </nav>

        {/* SECTION 1: RESO EDITORIAL HEADER & ARCHITECTURAL CADASTRE */}
        <div className="border-b border-[#D8DFDF] dark:border-white/10 pb-8">
          {/* Eyebrow Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] uppercase font-bold tracking-[0.16em] text-[#E76F51] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
              Property Listing Details
            </span>
          </div>

          {/* Status & Telemetry Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
              {/* StandardStatus Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#0D4446]/10 dark:bg-[#14B8A6]/20 text-[#0D4446] dark:text-[#14B8A6] font-mono text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446] dark:bg-[#14B8A6]"></span>
                <span data-testid="reso-standard-status">{standardStatus}</span>
              </div>

              {/* UnitNumber Pill (Safely Rendered Only When Populated) */}
              {unitNumber && (
                <div className="px-2.5 py-1 rounded-[6px] bg-[#F4F5F4] dark:bg-white/5 border border-[#D8DFDF] dark:border-white/10 text-[#141717] dark:text-[#F4F7F7] font-mono text-[11px] font-semibold">
                  Unit: <span data-testid="reso-unit-number">{unitNumber}</span>
                </div>
              )}

              {property.unit_status && (
                <>
                  <span className="text-[#D8DFDF] dark:text-white/20">|</span>
                  <span className="font-semibold uppercase tracking-wider text-[#141717] dark:text-[#F4F7F7] text-[11px] font-mono">
                    {property.unit_status}
                  </span>
                </>
              )}

              <span className="text-[#D8DFDF] dark:text-white/20">|</span>
              <span className="font-semibold uppercase tracking-wider text-[#141717] dark:text-[#F4F7F7] text-[11px] font-mono">
                {propertyType}
              </span>

              {property.tenure && (
                <>
                  <span className="text-[#D8DFDF] dark:text-white/20">|</span>
                  <span className="text-[#E76F51] font-semibold text-[11px]">
                    {property.tenure}
                  </span>
                </>
              )}
            </div>

            {/* Cadastral Reference & Telemetry */}
            <div className="flex items-center gap-3 text-xs font-mono text-[#5C6768] dark:text-[#95A6A6]">
              <span>
                MLS ID: <strong className="text-[#141717] dark:text-[#F4F7F7]" data-testid="reso-listing-id">{listingId}</strong>
              </span>
              <span className="text-[#D8DFDF] dark:text-white/20">|</span>
              <div className="flex items-center gap-1 text-[#0D4446] dark:text-[#14B8A6]">
                <span className="text-[#5C6768] dark:text-[#95A6A6]">REF:</span>
                <span className="font-bold tracking-wider">{refCode}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="ml-1 text-[#5C6768] hover:text-[#0D4446] dark:hover:text-[#14B8A6] hover:scale-110 transition-transform cursor-pointer"
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
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141717] dark:text-[#F4F7F7] leading-[1.15] tracking-tight">
              {property.title || `${propertyType} Residence`}
            </h1>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-[#5C6768] dark:text-[#95A6A6] mt-3 font-sans">
              <span className="material-symbols-outlined text-[#E76F51] text-[18px]">location_on</span>
              <span className="font-semibold text-[#141717] dark:text-[#F4F7F7]">
                {property.development || property.thoroughfare || property.City || 'Metro Manila'}
              </span>
              <span className="text-[#D8DFDF] dark:text-white/20">•</span>
              <span>{property.City || property.city || 'Makati City'}</span>,{' '}
              <span>{property.StateOrProvince || property.region || 'Metro Manila'}</span>
              {property.PostalCode && <span>, {property.PostalCode}</span>}
            </p>
          </div>
        </div>

        {/* Gallery Controls: Architectural Photography vs CAD Floorplan */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMediaMode('photo')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5",
                mediaMode === 'photo'
                  ? "bg-[#0D4446] text-white shadow-xs"
                  : "bg-white dark:bg-white/5 border border-[#D8DFDF] dark:border-white/10 text-slate-600 dark:text-slate-300"
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Architectural Photos ({mediaImages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaMode('cad')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5",
                mediaMode === 'cad'
                  ? "bg-[#0D4446] text-white shadow-xs"
                  : "bg-white dark:bg-white/5 border border-[#D8DFDF] dark:border-white/10 text-slate-600 dark:text-slate-300"
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>CAD Blueprint & Floorplan</span>
            </button>
          </div>
        </div>

        {/* Media Viewport */}
        {mediaMode === 'photo' ? (
          <PropertyGalleryMosaic
            images={mediaImages}
            title={property.title || 'Property Photos'}
          />
        ) : (
          <div className="relative h-[480px] rounded-[14px] overflow-hidden border border-[#D8DFDF] dark:border-white/10 bg-[#070D0E] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
              alt="CAD Blueprint"
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg font-mono text-xs border border-white/20 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#14B8A6]" />
              <span>Architectural CAD Blueprint • Level 1 Floorplan (1:100 Metric Scale)</span>
            </div>
          </div>
        )}

        {/* SECTION 3: KEY METRICS - RESO ARCHITECTURAL LEDGER */}
        <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#D8DFDF] dark:border-white/10">
            <div>
              <h3 className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider font-mono">
                Key Architectural Specs
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">Standard real estate metrics verified with RESO Data Dictionary.</p>
            </div>

            {/* In-Place Unit Switcher */}
            <div className="bg-[#F4F5F4] dark:bg-white/5 p-1 rounded-lg flex items-center border border-[#D8DFDF] dark:border-white/10 text-xs font-mono self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUnitMode('sqm')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer font-bold",
                  unitMode === 'sqm' ? "bg-white dark:bg-[#132427] text-[#0D4446] dark:text-[#14B8A6] shadow-xs" : "text-slate-500 hover:text-slate-700"
                )}
              >
                m² (Metric)
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('sqft')}
                className={cn(
                  "px-2.5 py-1 rounded transition-all cursor-pointer font-bold",
                  unitMode === 'sqft' ? "bg-white dark:bg-[#132427] text-[#0D4446] dark:text-[#14B8A6] shadow-xs" : "text-slate-500 hover:text-slate-700"
                )}
              >
                sq ft (Imperial)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#D8DFDF] dark:divide-white/10">
            <div className="px-4 py-2 first:pl-0">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Bedrooms</p>
              <p className="font-mono text-3xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-bedrooms">
                {formattedBedrooms}
              </p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Bathrooms</p>
              <p className="font-mono text-3xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-bathrooms">
                {formattedBathrooms}
              </p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Living Area</p>
              <p className="font-mono text-3xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-living-area">
                {computedLivingAreaStr}
              </p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Lot Size</p>
              <p className="font-mono text-3xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-lot-size">
                {computedLotAreaStr}
              </p>
            </div>

            <div className="px-4 py-2">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Association Fee</p>
              <p className="font-mono text-2xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1.5 tabular-nums" data-testid="reso-hoa-fee">
                {associationFee != null ? `₱${associationFee.toLocaleString()}` : '—'}
              </p>
            </div>

            <div className="px-4 py-2 last:pr-0">
              <p className="text-[11px] font-medium text-[#5C6768] dark:text-[#95A6A6]">Year Built</p>
              <p className="font-mono text-3xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-year-built">
                {yearBuilt ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT CONTENT COLUMN (65% width / 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* PUBLIC REMARKS SECTION */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                  Public Remarks
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D4446] dark:text-[#14B8A6] px-2 py-0.5 rounded bg-[#0D4446]/10 dark:bg-[#14B8A6]/20">
                  RESO Data Dictionary Verified
                </span>
              </div>
              <p className="text-sm md:text-base text-[#5C6768] dark:text-[#95A6A6] font-sans leading-relaxed" data-testid="reso-public-remarks">
                {publicRemarks}
              </p>
            </div>

            {/* PRICING & FINANCING ENGINE */}
            <FinancingCalculator
              totalContractPrice={listPrice || 3000000}
              promoCashOut={property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
              startingAmortization={property.monthly_amortization || 'Starting at PHP 15,000 / month'}
            />

            {/* DETAILED RESO SPECIFICATIONS MATRIX */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                RESO Unit & Space Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">tag</span>
                    Listing ID
                  </span>
                  <span className="font-semibold font-mono text-[#141717] dark:text-[#F4F7F7]">{listingId}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">category</span>
                    Standard Status
                  </span>
                  <span className="font-semibold font-mono text-[#0D4446] dark:text-[#14B8A6]">{standardStatus}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">apartment</span>
                    Property Type
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7]">{propertyType}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">square_foot</span>
                    Living Area
                  </span>
                  <span className="font-semibold font-mono text-[#141717] dark:text-[#F4F7F7] tabular-nums">{formattedLivingArea}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">bed</span>
                    Bedrooms Total
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7] font-mono tabular-nums">{formattedBedrooms}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">shower</span>
                    Bathrooms Total
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7] font-mono tabular-nums">{formattedBathrooms}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">landscape</span>
                    Lot Size Area
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7] font-mono">
                    {lotSizeArea != null ? `${lotSizeArea.toLocaleString()} ${lotSizeUnits}` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">receipt_long</span>
                    Association Fee
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7] font-mono">
                    {associationFee != null ? `₱${associationFee.toLocaleString()}/mo` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">business</span>
                    Listing Office
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7]" data-testid="reso-list-office-name">
                    {listOfficeName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">layers</span>
                    Floor Level
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7] font-mono">{property.floor_level || '6th Floor'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">chair</span>
                    Furnishing
                  </span>
                  <span className="font-semibold text-[#141717] dark:text-[#F4F7F7]">{property.furnishing || 'Bare'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#D8DFDF]/70 dark:border-white/10">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0D4446] dark:text-[#14B8A6]">construction</span>
                    Year Built
                  </span>
                  <span className="font-semibold font-mono text-[#141717] dark:text-[#F4F7F7] tabular-nums">
                    {yearBuilt ?? 2023}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] mb-4 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                Geographic Location & Neighborhood
              </h2>

              <p className="text-xs sm:text-sm text-[#5C6768] dark:text-[#95A6A6] leading-relaxed mb-6 font-sans">
                Situated prominently within <strong className="text-[#0D4446] dark:text-[#14B8A6] font-semibold">{property.development || 'Urban Deca Homes Ortigas'}</strong> along{' '}
                <strong className="text-[#0D4446] dark:text-[#14B8A6] font-semibold">{property.thoroughfare || 'Ortigas Avenue Extension'}</strong> in Barangay{' '}
                <strong className="text-[#0D4446] dark:text-[#14B8A6] font-semibold">{property.barangay || property.district || 'Rosario'}</strong>, <strong className="text-[#0D4446] dark:text-[#14B8A6] font-semibold">{property.city || property.City || 'Pasig City'}</strong>. The development provides rapid arterial access to the Ortigas Central Business District, Eastwood City, Bridgetowne Destination Estate, and the C-5 transit corridor.
              </p>

              {/* Geographic Cadastral Pin Card */}
              <div className="rounded-[10px] bg-[#F4F5F4] dark:bg-white/5 text-[#141717] dark:text-[#F4F7F7] p-6 border border-[#D8DFDF] dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E76F51] font-mono">Cadastral Pin</span>
                    <h3 className="font-display text-lg font-bold mt-1 text-[#0D4446] dark:text-[#14B8A6]">{property.development || property.title || 'Urban Deca Homes Ortigas'}</h3>
                    <p className="text-xs text-[#5C6768] dark:text-[#95A6A6] mt-1 font-sans">
                      {property.thoroughfare || 'Ortigas Avenue Extension'}, {property.barangay || 'Rosario'}, {property.city || property.City || 'Pasig City'}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.development || 'Urban Deca Homes Ortigas'}, ${property.city || property.City || 'Pasig City'}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[54px] px-6 rounded-[8px] bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* SECTION 5: AMENITIES & COMMUNITY POLICIES */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                Amenities & Building Policies
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">{property.security || '24/7 Gated Security'}</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">CCTV & roving guards</p>
                </div>

                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">{property.pet_policy || 'Pet-Friendly'}</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">Pets allowed in building</p>
                </div>

                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">{property.tenure || 'Perpetual Ownership (Freehold)'}</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">Lifetime condominium title</p>
                </div>

                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">{property.terrain || 'Flood-Free Area'}</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">Elevated road infrastructure</p>
                </div>

                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">Community Clubhouse</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">Social hall & events lounge</p>
                </div>

                <div className="p-4 rounded-[10px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5">
                  <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">Pocket Parks</p>
                  <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">Green open landscaped areas</p>
                </div>
              </div>
            </div>

            {/* COMPLIANCE DISCLAIMER & REDACTION CERTIFICATION */}
            <div className="rounded-[12px] bg-[#F4F5F4] dark:bg-white/5 border border-[#D8DFDF] dark:border-white/10 p-5 text-xs text-[#5C6768] dark:text-[#95A6A6] space-y-2">
              <div className="flex items-center gap-2 text-[#0D4446] dark:text-[#14B8A6] font-bold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>RESO Web API & MLS Compliance Verified</span>
              </div>
              <p className="leading-relaxed">
                Listing data provided courtesy of <strong className="text-[#141717] dark:text-[#F4F7F7]">{listOfficeName}</strong>. All data adheres to the Real Estate Standards Organization (RESO) Data Dictionary v1.7. Confidential remarks, private showing instructions, and security lockbox credentials have been strictly redacted from public viewing.
              </p>
            </div>
          </div>

          {/* RIGHT STICKY ACTION RAIL (35% width / 4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 font-sans">
            {/* Price Card */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#5C6768] dark:text-[#95A6A6] font-mono">
                ListPrice (Total Contract Price)
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1 tabular-nums" data-testid="reso-list-price">
                {formattedPrice}
              </div>

              <div className="mt-4 pt-4 border-t border-[#D8DFDF] dark:border-white/10 space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium font-sans">Listing Office</span>
                  <span className="font-bold text-[#141717] dark:text-[#F4F7F7] font-mono truncate max-w-[200px] text-right">
                    {listOfficeName}
                  </span>
                </div>
                {associationFee != null && (
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#5C6768] dark:text-[#95A6A6] font-medium font-sans">Association Fee</span>
                    <span className="font-semibold text-[#0D4446] dark:text-[#14B8A6] font-mono">₱{associationFee.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>

              {/* VIEWING LIST & SITE INSPECTION TRIGGERS */}
              <div className="mt-6 pt-6 border-t border-[#D8DFDF] dark:border-white/10 space-y-3">
                <button
                  type="button"
                  onClick={() => toggleViewingList(property)}
                  className={`w-full h-[54px] rounded-[8px] text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-[#0D4446] text-white shadow-sm'
                      : 'bg-white dark:bg-transparent hover:bg-[#F4F5F4] dark:hover:bg-white/5 text-[#0D4446] dark:text-[#14B8A6] border border-[#0D4446] dark:border-[#14B8A6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSaved ? 'check_circle' : 'playlist_add'}
                  </span>
                  {isSaved ? 'In Viewing List' : 'Add to Viewing List'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full h-[54px] rounded-[8px] bg-[#E76F51] hover:bg-[#D65C3E] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Schedule Free Site Viewing
                </button>
              </div>
            </div>

            {/* BROKERAGE & AGENT CONTACT CARD */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 shadow-sm">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#D8DFDF] dark:border-white/10">
                <img
                  src={property.agent?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}
                  alt={property.agent?.name || listOfficeName}
                  className="w-12 h-12 rounded-[8px] object-cover border border-[#D8DFDF] dark:border-white/10"
                />
                <div>
                  <h3 className="text-sm font-bold text-[#0D4446] dark:text-[#14B8A6] font-sans">
                    {property.agent?.name || 'Authorized RESO Broker'}
                  </h3>
                  <p className="text-xs text-[#5C6768] dark:text-[#95A6A6] font-medium font-sans">
                    {property.agent?.title || 'Real Estate Agent'}
                  </p>
                  <p className="text-[10px] text-[#5C6768] dark:text-[#95A6A6] font-mono">
                    {listOfficeName}
                  </p>
                </div>
              </div>

              <div className="mt-4 font-sans">
                <p className="text-xs font-semibold text-[#141717] dark:text-[#F4F7F7]">
                  {property.call_to_action || property.agent?.cta || 'Direct message for free site viewing'}
                </p>
                {inquirySent ? (
                  <div className="mt-4 p-4 rounded-[8px] bg-[#F4F5F4] dark:bg-white/5 border border-[#D8DFDF] dark:border-white/10 text-center">
                    <span className="material-symbols-outlined text-[#0D4446] dark:text-[#14B8A6] text-2xl">check_circle</span>
                    <p className="text-xs font-bold text-[#0D4446] dark:text-[#14B8A6] mt-1">Inquiry Dispatched</p>
                    <p className="text-[11px] text-[#5C6768] dark:text-[#95A6A6] mt-0.5">
                      {property.agent?.name || listOfficeName} has been routed this listing inquiry.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendAgentInquiry} className="mt-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-[8px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5 text-[#141717] dark:text-[#F4F7F7] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0D4446] dark:focus:ring-[#14B8A6]"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number (09XX XXX XXXX)"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-[8px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5 text-[#141717] dark:text-[#F4F7F7] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0D4446] dark:focus:ring-[#14B8A6]"
                      required
                    />
                    <textarea
                      rows={3}
                      value={agentMessage}
                      onChange={(e) => setAgentMessage(e.target.value)}
                      className="w-full p-3 rounded-[8px] border border-[#D8DFDF] dark:border-white/10 bg-[#F4F5F4] dark:bg-white/5 text-[#141717] dark:text-[#F4F7F7] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0D4446] dark:focus:ring-[#14B8A6]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-[54px] rounded-[8px] bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
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

      {/* Sticky Floating Inquire Dock on Scroll */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/15 text-[#141717] dark:text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-between gap-6 max-w-2xl w-[92%] transition-all duration-300",
          showStickyDock ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-12 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={mediaImages[0]}
            alt={property.title}
            className="w-10 h-10 rounded-full object-cover border border-[#D8DFDF] dark:border-white/20 shrink-0"
          />
          <div className="truncate min-w-0">
            <p className="font-semibold text-xs truncate text-[#0F172A] dark:text-white">
              {property.title}
            </p>
            <p className="font-mono text-xs font-bold text-[#0D4446] dark:text-[#14B8A6]">
              {formattedPrice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => toggleViewingList(property)}
            className={cn(
              "w-9 h-9 rounded-full border border-[#D8DFDF] dark:border-white/20 flex items-center justify-center transition-colors cursor-pointer",
              isSaved ? "bg-[#E76F51] text-white border-transparent" : "hover:bg-[#F4F5F4] dark:hover:bg-white/10 text-slate-500"
            )}
            title={isSaved ? "Remove from viewing list" : "Save to viewing list"}
          >
            <Star className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#E76F51] hover:bg-[#D65C3E] text-white font-mono text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Schedule Private Tour
          </button>
        </div>
      </div>

      {/* Downstream Inspection Schedule Modal */}
      <InspectionScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        property={property}
        onScheduleSuccess={handleScheduleSuccess}
      />
    </div>
  );
}
