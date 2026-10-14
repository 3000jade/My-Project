import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProperties } from '../../mockData/mockProperties';
import { propertyService } from '../../services/propertyService';
import useViewingList from '../../hooks/useViewingList';
import { getPropertyCoordinates } from '../../utils/propertyCoordinates';
import InspectionScheduleModal from '../../components/ui/modals/InspectionScheduleModal';
import { resolveDriveImageUrl } from '../../services/driveService';

export default function PropertyListingView() {
  const { id } = useParams();
  
  // Safe initial property lookup supporting string IDs, RESO keys, and numeric IDs
  const [property, setProperty] = useState(() => {
    if (!id) return mockProperties[0] || null;
    return mockProperties.find(p => 
      String(p.id) === String(id) || 
      p.ListingKey === id || 
      p.listingKey === id ||
      p.ListingId === id ||
      p.listingId === id ||
      p.ref_code === id
    ) || mockProperties[0] || null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Asynchronously hydrate from backend API while preserving fixture fallback
  useEffect(() => {
    let isMounted = true;
    async function loadProperty() {
      const localMatch = mockProperties.find(p => 
        String(p.id) === String(id) || 
        p.ListingKey === id || 
        p.listingKey === id ||
        p.ListingId === id || 
        p.listingId === id ||
        p.ref_code === id
      );
      if (localMatch) {
        setProperty(localMatch);
      }

      if (id && (!localMatch || !String(localMatch.id).startsWith('reso-fixture-'))) {
        try {
          setIsLoading(true);
          const remoteData = await propertyService.getPropertyById(id);
          if (isMounted && remoteData) {
            setProperty(remoteData);
          }
        } catch (err) {
          console.warn('[PropertyListingView] Remote fetch fallback to local:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    loadProperty();
    return () => { isMounted = false; };
  }, [id]);

  // UI Interactive States
  const [activePhotoModal, setActivePhotoModal] = useState(false);
  const [activeFloorTab, setActiveFloorTab] = useState(0);
  const [tourType, setTourType] = useState('inperson');
  const [selectedDate, setSelectedDate] = useState('today');
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Global Viewing List Hook
  const { isInViewingList, toggleViewingList } = useViewingList();
  const inViewingList = property ? isInViewingList(property.id) : false;

  // Safe Location String Resolver (Prevents Object Render Crash when location is an object)
  const propertyLocation = useMemo(() => {
    if (!property) return "Metro Manila, Philippines";
    if (typeof property.location === 'string' && property.location.trim()) {
      return property.location;
    }
    if (property.location && typeof property.location === 'object') {
      const parts = [
        property.location.address,
        property.location.subdivisionName,
        property.location.city,
        property.location.state || property.location.stateOrProvince
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
      if (property.location.city) return property.location.city;
    }
    if (property.address || property.city) {
      return [property.address, property.city, property.state].filter(Boolean).join(', ');
    }
    return "Rolling Hills Subdivision, New Manila, Quezon City";
  }, [property]);

  // Safe Data Extraction & Null Guards (RESO 2.0 & TypeScript Schema Compliance)
  const standardStatus = property?.StandardStatus || property?.standardStatus || property?.standard_status || property?.status || property?.listing_status || 'Active';
  const listingId = property?.ListingId || property?.listingId || property?.listing_id || property?.ListingKey || property?.listingKey || property?.ref_code || property?.id || 'RESO-2026-0042';
  
  const rawPrice = property?.ListPrice ?? property?.price_raw ?? (typeof property?.price === 'number' ? property.price : null);
  const formattedPrice = property?.formattedPrice || (rawPrice != null && !isNaN(rawPrice)
    ? `₱${Number(rawPrice).toLocaleString('en-PH')}`
    : (typeof property?.price === 'string' && property.price.trim() ? property.price : 'Price on Request'));

  const bedrooms = property?.BedroomsTotal ?? property?.bedroomsTotal ?? property?.specs?.bedroomsTotal ?? property?.specs?.beds ?? property?.bedrooms ?? property?.beds ?? null;
  const bathrooms = property?.BathroomsTotalInteger ?? property?.bathroomsTotalInteger ?? property?.specs?.bathroomsTotalInteger ?? property?.specs?.baths ?? property?.bathrooms ?? property?.baths ?? null;
  
  const livingAreaNumeric = property?.LivingArea ?? property?.livingArea ?? property?.living_area ?? property?.specs?.livingArea ?? property?.specs?.sqft ?? property?.floor_area ?? (property?.sqm ? parseFloat(property.sqm) : null);
  const livingAreaFormatted = property?.LivingArea != null
    ? `${property.LivingArea} ${property.LivingAreaUnits || property.livingAreaUnits || 'sqm'}`
    : (property?.livingArea != null
      ? `${property.livingArea} ${property.livingAreaUnits || 'sqm'}`
      : (property?.living_area != null
        ? `${property.living_area} ${property.livingAreaUnits || 'sqm'}`
        : (property?.specs?.livingArea != null
          ? `${property.specs.livingArea} ${property.specs.livingAreaUnits || property.livingAreaUnits || 'sqm'}`
          : (property?.specs?.sqft != null
            ? `${property.specs.sqft} sqft`
            : (property?.sqm || property?.area || (property?.floor_area != null ? `${property.floor_area} sqm` : null))))));

  const lotSize = property?.LotSizeArea ?? property?.lotSizeArea ?? property?.lot_size_area ?? property?.specs?.lotSizeArea ?? property?.lot_area ?? null;
  const lotSizeUnits = property?.LotSizeUnits || property?.lotSizeUnits || property?.lot_size_units || property?.specs?.lotSizeUnits || 'sqm';
  const lotSizeFormatted = lotSize != null ? `${lotSize} ${lotSizeUnits}` : null;

  const hoaFee = property?.AssociationFee ?? property?.associationFee ?? property?.association_fee ?? null;
  const hoaFeeFormatted = hoaFee != null && !isNaN(hoaFee) ? `₱${Number(hoaFee).toLocaleString('en-PH')}` : null;

  const yearBuilt = property?.YearBuilt ?? property?.yearBuilt ?? property?.year_built ?? property?.specs?.yearBuilt ?? null;
  const unitNumber = property?.UnitNumber || property?.unitNumber || null;
  const listOfficeName = property?.ListOfficeName || property?.listOfficeName || property?.agent?.brokerage || 'Nordic Architectural Realty Group';
  const publicRemarks = property?.PublicRemarks || property?.publicRemarks || property?.description || '';

  // Extract photos safely supporting RESO Media array and images list
  const photos = useMemo(() => {
    if (!property) return [];
    let list = [];
    const mediaList = property.Media || property.media;
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      const extracted = mediaList.map(m => m.MediaURL || m.mediaUrl || m.url).filter(Boolean);
      if (extracted.length > 0) list = extracted;
    } else if (Array.isArray(property.images) && property.images.length > 0) {
      list = property.images;
    } else if (Array.isArray(property.gallery) && property.gallery.length > 0) {
      list = property.gallery;
    } else {
      list = [
        property.mainImage || property.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ];
    }
    return list.map(resolveDriveImageUrl);
  }, [property]);

  // Derived Title & Location
  const propertyTitle = property?.title || property?.name || "Modern Duplex in Rolling Hills";
  const propertyCoords = useMemo(() => property ? getPropertyCoordinates(property) : null, [property]);
  const pricePerSqm = (rawPrice && livingAreaNumeric) ? `~₱${Math.round(rawPrice / livingAreaNumeric).toLocaleString('en-PH')} / sqm` : "~₱83,820 / sqm";

  // Dynamic Mortgage Calculator
  const calculatedMortgage = useMemo(() => {
    const principal = rawPrice || 18500000;
    const downAmount = principal * (downPaymentPercent / 100);
    const loanAmount = principal - downAmount;
    const monthlyRate = 0.07 / 12;
    const totalMonths = loanTermYears * 12;
    if (loanAmount <= 0) return 0;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(monthlyPayment);
  }, [rawPrice, downPaymentPercent, loanTermYears]);

  // Dynamic Similar Properties (derived from real catalog)
  const similarList = useMemo(() => {
    const currentId = String(property?.id || id);
    const currentType = (property?.PropertyType || property?.propertyType || property?.property_type || '').toLowerCase();

    const candidates = mockProperties.filter(p => {
      if (String(p.id) === currentId || p.ListingId === currentId || p.ref_code === currentId) return false;
      if (String(p.id).startsWith('reso-fixture-')) return false;
      return true;
    });

    candidates.sort((a, b) => {
      const aType = (a.PropertyType || a.propertyType || a.property_type || '').toLowerCase();
      const bType = (b.PropertyType || b.propertyType || b.property_type || '').toLowerCase();
      const aMatch = (aType && aType === currentType) ? 1 : 0;
      const bMatch = (bType && bType === currentType) ? 1 : 0;
      return bMatch - aMatch;
    });

    return candidates.slice(0, 3);
  }, [property, id]);

  if (!property) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#FBFBF9] font-sans text-[#141717] flex items-center justify-center p-6">
          <div className="text-sm font-semibold text-[#0D4446] flex items-center gap-2">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading property details...
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FBFBF9] font-sans text-[#141717] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl border border-[#D8DFDF] shadow-sm">
          <span className="material-symbols-outlined text-4xl text-[#0D4446]">apartment</span>
          <h2 className="text-xl font-bold font-display text-[#141717]">Listing Not Found</h2>
          <p className="text-sm text-[#5C6768]">No property details are currently available for this listing.</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D4446] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#083335] transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] font-sans text-[#141717] pb-24 antialiased selection:bg-[#0D4446] selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#0D4446] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-teal-500/30 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-teal-300">check_circle</span>
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-7">
        
        {/* BREADCRUMB & ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C6768]">
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-[#0D4446]">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-[#0D4446]">Properties</Link>
            <span>/</span>
            <span className="text-[#0D4446] font-semibold">Property Listing Details</span>
            <span>/</span>
            <span className="text-[#141717] font-semibold truncate max-w-[240px]">{propertyTitle}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 font-medium">
            <button 
              onClick={() => {
                toggleViewingList(property);
                setToastMessage(inViewingList ? 'Removed from viewing list' : 'Added to viewing list');
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                inViewingList 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'text-[#5C6768] border-[#D8DFDF] hover:bg-[#F4F5F4]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {inViewingList ? 'bookmark_added' : 'bookmark'}
              </span>
              {inViewingList ? 'In Viewing List' : 'Add to Viewing List'}
            </button>
            <span className="w-1 h-1 rounded-full bg-[#D8DFDF]"></span>
            <span className="font-mono uppercase tracking-wider text-[11px] text-[#8E9A9B]">
              Ref: {property.ref_code || ''} {property.id ? `(${property.id})` : ''} • ID: <span data-testid="reso-listing-id">{listingId}</span>
            </span>
          </div>
        </div>
      </main>

      {/* 2. DYNAMIC FULL-WIDTH IMMERSIVE PHOTO GALLERY (Device Width edge-to-edge with inner responsive container) */}
      <section className="w-full relative overflow-hidden bg-white shadow-xs border-y border-[#E5EBEB] my-6">
        <div className="w-full max-w-[1920px] mx-auto px-0 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 sm:gap-2.5 h-[340px] sm:h-[460px] md:h-[540px] lg:h-[620px] sm:rounded-2xl overflow-hidden">
            
            {/* Primary Hero Photo (Left 8 Cols) */}
            <div 
              className="lg:col-span-8 relative h-full group cursor-pointer overflow-hidden" 
              onClick={() => setActivePhotoModal(true)}
            >
              <img 
                src={photos[0]} 
                alt="Main View" 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
              
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                <span 
                  data-testid="reso-standard-status" 
                  className="bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {standardStatus}
                </span>
                <span className="bg-white/95 text-[#0D4446] border border-[#E5EBEB] text-xs font-bold px-3 py-1.5 rounded-md shadow-sm">
                  {property.unit_status || 'Ready for Occupancy'}
                </span>
                {property.transactionType && (
                  <span className="bg-white/95 text-[#5C6768] border border-[#E5EBEB] text-xs font-bold px-3 py-1.5 rounded-md shadow-sm">
                    {property.transactionType}
                  </span>
                )}
              </div>

              {/* Floating Quick Action Buttons */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActivePhotoModal(true); }}
                  className="px-3.5 py-2 bg-white/90 backdrop-blur-md text-[#0D4446] text-xs font-bold rounded-lg shadow border border-white/80 hover:bg-white flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_library</span>
                  View {photos.length > 3 ? `${photos.length} Photos` : '24 Photos'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); alert('Launching 360° Virtual Tour...'); }}
                  className="px-3.5 py-2 bg-white/90 backdrop-blur-md text-[#0D4446] text-xs font-bold rounded-lg shadow border border-white/80 hover:bg-white flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  360° Virtual Tour
                </button>
              </div>
            </div>

            {/* Secondary Photo Stack (Right 4 Cols) */}
            <div className="hidden lg:grid col-span-4 grid-rows-3 gap-2.5 h-full">
              <div 
                className="relative h-full overflow-hidden group cursor-pointer"
                onClick={() => setActivePhotoModal(true)}
              >
                <img 
                  src={photos[1] || photos[0]} 
                  alt="Living Area" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <span className="absolute bottom-2 left-3 text-[11px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">Living Room</span>
              </div>
              
              <div 
                className="relative h-full overflow-hidden group cursor-pointer"
                onClick={() => setActivePhotoModal(true)}
              >
                <img 
                  src={photos[2] || photos[0]} 
                  alt="Bedroom Suite" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <span className="absolute bottom-2 left-3 text-[11px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">Primary Suite</span>
              </div>

              {/* Floor Plan Teaser Plinth */}
              <div 
                onClick={() => {
                  const el = document.getElementById('floor-plans-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative h-full bg-[#0D4446] text-white p-4 flex flex-col justify-between cursor-pointer group hover:bg-[#083335] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-teal-200">Architectural Cadastral</span>
                  <span className="material-symbols-outlined text-teal-200 text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Floor Plans & Blueprints</div>
                  <p className="text-[11px] text-teal-100/80 mt-0.5">3 Levels, Room Specs & Dimensions</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT CONTAINER (Rest of Page) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* 3. OVERVIEW & KEY FACTS STRIP */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(13,68,70,0.05)] border border-[#E5EBEB]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#E5EBEB]">
            <div>
              <div className="text-xs font-semibold text-[#0D4446] mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {propertyLocation}
              </div>
              <h1 className="font-['Manrope'] text-2xl sm:text-3xl font-extrabold text-[#141717] tracking-tight">
                {propertyTitle}
              </h1>
              {publicRemarks && (
                <p data-testid="reso-public-remarks" className="text-sm text-[#5C6768] leading-relaxed mt-2.5 max-w-3xl">
                  {publicRemarks}
                </p>
              )}
            </div>

            {/* Price Plinth */}
            <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-5 min-w-[260px] shadow-sm">
              <span className="text-[11px] font-semibold text-[#5C6768] uppercase tracking-wider block mb-1">Listing Price</span>
              <div data-testid="reso-list-price" className="font-['Manrope'] text-3xl font-extrabold text-[#0D4446]">
                {formattedPrice}
              </div>
              
              {/* Optional Financing Promo Terms */}
              {property.promo_cash_out && (
                <div className="text-xs text-[#0D4446] font-semibold mt-1">
                  Promo Cash-out: {property.promo_cash_out}
                </div>
              )}
              {property.monthly_amortization && (
                <div className="text-xs text-[#5C6768] font-medium">
                  {property.monthly_amortization}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-[#5C6768] pt-3 mt-3 border-t border-[#E5EBEB]">
                <span>Price / Area:</span>
                <span className="font-bold text-[#141717]">{pricePerSqm}</span>
              </div>
              {hoaFeeFormatted && (
                <div className="flex justify-between items-center text-xs text-[#5C6768] pt-1.5">
                  <span>HOA Dues:</span>
                  <span data-testid="reso-hoa-fee" className="font-bold text-[#141717]">{hoaFeeFormatted}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4-Pill Key Metrics Plinth */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6">
            <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0D4446] shadow-xs">
                <span className="material-symbols-outlined text-[20px]">bed</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#141717]">
                  <span data-testid="reso-bedrooms">{bedrooms ?? '4'}</span> Bedrooms
                </div>
                <div className="text-[11px] text-[#5C6768]">+ Maid's Quarters</div>
              </div>
            </div>

            <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0D4446] shadow-xs">
                <span className="material-symbols-outlined text-[20px]">bathtub</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#141717]">
                  <span data-testid="reso-bathrooms">{bathrooms ?? '3'}</span> Bathrooms
                </div>
                <div className="text-[11px] text-[#5C6768]">En-suite Bathrooms</div>
              </div>
            </div>

            <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0D4446] shadow-xs">
                <span className="material-symbols-outlined text-[20px]">square_foot</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#141717]">
                  <span data-testid="reso-living-area">{livingAreaFormatted || '245.5 sqm'}</span>
                </div>
                <div className="text-[11px] text-[#5C6768]">
                  Lot: <span data-testid="reso-lot-size">{lotSizeFormatted || '320 sqm'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0D4446] shadow-xs">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#141717]">{property.parking || 2} Garage Slots</div>
                <div className="text-[11px] text-[#5C6768]">
                  {property.floor_level ? `${property.floor_level} • ` : ''}Covered Parking
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MAIN TWO-COLUMN CONTENT GRID (65% Information / 35% Sticky Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Comprehensive Property Information (65%) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION A: Property Details */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(13,68,70,0.05)] border border-[#E5EBEB]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E5EBEB]">
                <h2 className="font-['Manrope'] text-xl font-bold text-[#0D4446] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  Property Details
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-mono text-[#0D4446] bg-[#0D4446]/5 border border-[#0D4446]/10 px-2.5 py-1 rounded flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    Updated: Sep 27, 2026 (Today)
                  </span>
                  <span className="text-[11px] font-mono text-[#5C6768] bg-[#F4F5F4] border border-[#E5EBEB] px-2.5 py-1 rounded">
                    Listed: Sep 15, 2026
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3.5 text-sm">
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Property Type</span>
                  <span className="font-semibold text-[#141717]">{property.PropertyType || property.property_type || 'Residential Condominium'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Year Built</span>
                  <span data-testid="reso-year-built" className="font-semibold text-[#141717]">{yearBuilt || '2024'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Furnishing</span>
                  <span className="font-semibold text-[#141717]">{property.furnishing || 'Semi-Furnished (Built-ins)'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Orientation</span>
                  <span className="font-semibold text-[#141717]">{property.orientation || 'North-East (Morning Sun)'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Property Condition</span>
                  <span className="font-semibold text-emerald-700">{property.unit_status || 'Ready for Occupancy'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Listing Status</span>
                  <span className="font-semibold text-[#0D4446]">{standardStatus}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Date Listed</span>
                  <span className="font-semibold text-[#141717]">Sep 15, 2026</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Days on Market</span>
                  <span className="font-semibold text-[#141717]">12 Days</span>
                </div>
                
                {unitNumber && (
                  <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                    <span className="text-[#5C6768]">Unit / Suite</span>
                    <span data-testid="reso-unit-number" className="font-semibold text-[#141717]">{unitNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                  <span className="text-[#5C6768]">Listing Brokerage</span>
                  <span data-testid="reso-list-office-name" className="font-semibold text-[#141717]">{listOfficeName}</span>
                </div>

                {property.development && (
                  <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                    <span className="text-[#5C6768]">Development</span>
                    <span className="font-semibold text-[#141717]">{property.development}</span>
                  </div>
                )}
                {property.thoroughfare && (
                  <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                    <span className="text-[#5C6768]">Thoroughfare</span>
                    <span className="font-semibold text-[#141717]">{property.thoroughfare}</span>
                  </div>
                )}
                {property.district && (
                  <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                    <span className="text-[#5C6768]">District / Barangay</span>
                    <span className="font-semibold text-[#141717]">{property.district}</span>
                  </div>
                )}
                {property.city && (
                  <div className="flex justify-between py-2 border-b border-[#E5EBEB]">
                    <span className="text-[#5C6768]">City</span>
                    <span className="font-semibold text-[#141717]">{property.city}</span>
                  </div>
                )}
              </div>

              {/* Architectural Features Pills */}
              <div className="mt-6 pt-5 border-t border-[#E5EBEB]">
                <span className="text-xs font-semibold text-[#5C6768] uppercase tracking-wider block mb-3">Key Features & Amenities</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {property.amenities && Array.isArray(property.amenities) ? (
                    property.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">High-Ceiling Foyer</span>
                      <span className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">Dual Kitchen Setup</span>
                      <span className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">Walk-in Master Closet</span>
                      <span className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">Rooftop Sky Deck</span>
                      <span className="px-3 py-1.5 bg-[#F4F5F4] rounded-md font-medium text-[#141717]">Covered Parking</span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION B: Floor Plans */}
            <section id="floor-plans-section" className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(13,68,70,0.05)] border border-[#E5EBEB]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5EBEB]">
                <div>
                  <h2 className="font-['Manrope'] text-xl font-bold text-[#0D4446] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">architecture</span>
                    Floor Plans
                  </h2>
                  <p className="text-xs text-[#5C6768] mt-0.5">Select a level to inspect architectural room specs</p>
                </div>
                <button 
                  onClick={() => alert('Downloading official high-resolution blueprint PDF...')}
                  className="px-3.5 py-2 border border-[#D8DFDF] hover:border-[#0D4446] hover:bg-[#F4F5F4] text-xs font-bold text-[#141717] rounded-lg transition-colors flex items-center gap-1.5 self-start"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download Blueprint (PDF)
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2 mb-4 border-b border-[#E5EBEB] pb-2">
                {['Ground Floor (Level 1)', 'Second Floor (Level 2)', 'Third Floor & Terrace (Level 3)'].map((tabLabel, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFloorTab(idx)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeFloorTab === idx
                        ? 'bg-[#0D4446] text-white shadow-sm'
                        : 'bg-[#F4F5F4] text-[#5C6768] hover:text-[#0D4446]'
                    }`}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>

              {/* Active Floor Content */}
              <div className="bg-[#FBFBF9] border border-[#E5EBEB] rounded-xl p-5">
                {activeFloorTab === 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-[#141717]">Level 1 • 120 sqm</span>
                      <span className="text-xs font-mono text-[#5C6768]">Living, Dining & Auxiliary Service</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#141717]">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Living & Dining:</b> Open-concept layout with floor-to-ceiling glass fenestration.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Kitchens:</b> Quartz show kitchen with center island + separate auxiliary dirty kitchen.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Service & Garage:</b> 2-car covered garage + maid's quarters with private en-suite bath.
                      </li>
                    </ul>
                  </div>
                )}

                {activeFloorTab === 1 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-[#141717]">Level 2 • 115 sqm</span>
                      <span className="text-xs font-mono text-[#5C6768]">Master Sanctuary & Junior Suite</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#141717]">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Master Suite:</b> 38 sqm bedroom with walk-in dressing wardrobe and dual vanity bath.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Private Balcony:</b> North-East orientation with morning sun exposure.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Bedroom 2:</b> Spacious junior suite with dedicated study alcove and private bath.
                      </li>
                    </ul>
                  </div>
                )}

                {activeFloorTab === 2 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-[#141717]">Level 3 • 105 sqm</span>
                      <span className="text-xs font-mono text-[#5C6768]">Guest Bedrooms & Sky Deck</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#141717]">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Bedrooms 3 & 4:</b> Symmetrically planned en-suites suitable for family or executive home office.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D4446]"></span>
                        <b>Rooftop Terrace:</b> 45 sqm open-air terrace with panoramic district skyline views.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION C: Location & Nearby Landmarks */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(13,68,70,0.05)] border border-[#E5EBEB]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5EBEB]">
                <div>
                  <h2 className="font-['Manrope'] text-xl font-bold text-[#0D4446] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">near_me</span>
                    Location & Nearby
                  </h2>
                  <p className="text-xs text-[#5C6768] mt-0.5">{propertyLocation}</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                  Gated Enclave
                </span>
              </div>

              {/* Map Preview Plinth with OpenStreetMap */}
              <div className="relative w-full h-[240px] rounded-xl overflow-hidden mb-6 border border-[#E5EBEB] bg-slate-100 flex items-center justify-center">
                <iframe 
                  title="OpenStreetMap Property View"
                  className="w-full h-full border-0 pointer-events-auto"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${propertyCoords.lng - 0.008}%2C${propertyCoords.lat - 0.006}%2C${propertyCoords.lng + 0.008}%2C${propertyCoords.lat + 0.006}&layer=mapnik&marker=${propertyCoords.lat}%2C${propertyCoords.lng}`}
                />
                
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-[#E5EBEB] flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
                  <span className="font-mono text-[10px] font-bold text-[#0D4446] tracking-wider uppercase">
                    OSM: {propertyCoords.lat.toFixed(4)}°N, {propertyCoords.lng.toFixed(4)}°E
                  </span>
                </div>

                <a 
                  href={`https://www.openstreetmap.org/?mlat=${propertyCoords.lat}&mlon=${propertyCoords.lng}#map=16/${propertyCoords.lat}/${propertyCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-white/95 text-[#0D4446] hover:bg-white text-xs font-bold rounded-lg shadow border border-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open in OpenStreetMap</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>

              {/* POI Structured Cards */}
              <span className="text-xs font-semibold text-[#5C6768] uppercase tracking-wider block mb-3">Nearby Key Landmarks</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] border border-[#E5EBEB]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🚆</span>
                    <div>
                      <div className="font-bold text-[#141717]">Gilmore LRT-2 Station</div>
                      <div className="text-[11px] text-[#5C6768]">Transit Hub</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#0D4446]">900 m</div>
                    <div className="text-[10px] text-[#5C6768]">10 min walk</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] border border-[#E5EBEB]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🛍️</span>
                    <div>
                      <div className="font-bold text-[#141717]">Robinsons Magnolia</div>
                      <div className="text-[11px] text-[#5C6768]">Shopping & Dining</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#0D4446]">1.1 km</div>
                    <div className="text-[10px] text-[#5C6768]">4 min drive</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] border border-[#E5EBEB]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏥</span>
                    <div>
                      <div className="font-bold text-[#141717]">St. Luke’s Medical Center</div>
                      <div className="text-[11px] text-[#5C6768]">Tertiary Hospital</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#0D4446]">1.8 km</div>
                    <div className="text-[10px] text-[#5C6768]">6 min drive</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBFBF9] border border-[#E5EBEB]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎓</span>
                    <div>
                      <div className="font-bold text-[#141717]">Xavier School / ICA</div>
                      <div className="text-[11px] text-[#5C6768]">Private Academy</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#0D4446]">2.4 km</div>
                    <div className="text-[10px] text-[#5C6768]">8 min drive</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION D: Legal & Property Records */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(13,68,70,0.05)] border border-[#E5EBEB]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5EBEB]">
                <div>
                  <h2 className="font-['Manrope'] text-xl font-bold text-[#0D4446] flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">verified_user</span>
                    Legal & Property Records
                  </h2>
                  <p className="text-xs text-[#5C6768] mt-0.5">Verified broker documentation and title due diligence</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                  Audit Passed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9]">
                  <div className="font-semibold text-[#5C6768] uppercase tracking-wider mb-1">📜 Title Status</div>
                  <div className="font-bold text-sm text-[#141717]">{property.tenure || 'Clean Transfer Certificate (TCT)'}</div>
                  <div className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {property.security || 'Perpetual Ownership (Freehold)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9]">
                  <div className="font-semibold text-[#5C6768] uppercase tracking-wider mb-1">⚖️ Encumbrances</div>
                  <div className="font-bold text-sm text-[#141717]">None Recorded</div>
                  <div className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Zero bank liens or third-party mortgages
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9]">
                  <div className="font-semibold text-[#5C6768] uppercase tracking-wider mb-1">🧾 Real Property Tax (RPT)</div>
                  <div className="font-bold text-sm text-[#141717]">Up to Date (Current Year)</div>
                  <div className="text-[#5C6768] mt-1">Official city tax clearance verified</div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5EBEB] bg-[#FBFBF9]">
                  <div className="font-semibold text-[#5C6768] uppercase tracking-wider mb-1">🌊 Flood Elevation Risk</div>
                  <div className="font-bold text-sm text-emerald-700">{property.terrain || 'Flood-Free Area'}</div>
                  <div className="text-[#5C6768] mt-1">{property.pet_policy || 'Elevated natural highland terrain'}</div>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky Conversion & Tools (35%) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[96px]">
            
            {/* TOOL 1: Schedule a Tour (10% High-Impact Accent) */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(13,68,70,0.06)] border border-[#E5EBEB] border-t-4 border-t-[#E76F51]">
              <h3 className="font-['Manrope'] text-lg font-bold text-[#0D4446] mb-1">Schedule a Tour</h3>
              <p className="text-xs text-[#5C6768] mb-4">Choose an inspection type and select your preferred day</p>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F5F4] rounded-lg mb-4">
                <button 
                  onClick={() => setTourType('inperson')}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    tourType === 'inperson' 
                      ? 'bg-white text-[#0D4446] shadow-sm' 
                      : 'text-[#5C6768] hover:text-[#0D4446]'
                  }`}
                >
                  🚶 In-Person
                </button>
                <button 
                  onClick={() => setTourType('video')}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    tourType === 'video' 
                      ? 'bg-white text-[#0D4446] shadow-sm' 
                      : 'text-[#5C6768] hover:text-[#0D4446]'
                  }`}
                >
                  💻 Video Call
                </button>
              </div>

              {/* Date Selector Chips */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-[#5C6768] block mb-2">Select Date</span>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedDate('today')}
                    className={`p-2.5 rounded-lg text-center transition-all ${
                      selectedDate === 'today'
                        ? 'border-2 border-[#0D4446] bg-[#0D4446]/5'
                        : 'border border-[#D8DFDF] bg-white hover:border-[#0D4446]'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-[#0D4446] uppercase">Today</div>
                    <div className="text-sm font-extrabold text-[#0D4446]">Sep 27</div>
                  </button>

                  <button 
                    onClick={() => setSelectedDate('tomorrow')}
                    className={`p-2.5 rounded-lg text-center transition-all ${
                      selectedDate === 'tomorrow'
                        ? 'border-2 border-[#0D4446] bg-[#0D4446]/5'
                        : 'border border-[#D8DFDF] bg-white hover:border-[#0D4446]'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-[#5C6768] uppercase">Tomorrow</div>
                    <div className="text-sm font-bold text-[#141717]">Sep 28</div>
                  </button>

                  <button 
                    onClick={() => setSelectedDate('custom')}
                    className={`p-2.5 rounded-lg text-center transition-all ${
                      selectedDate === 'custom'
                        ? 'border-2 border-[#0D4446] bg-[#0D4446]/5'
                        : 'border border-[#D8DFDF] bg-white hover:border-[#0D4446]'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-[#5C6768] uppercase">Custom</div>
                    <div className="text-sm font-bold text-[#141717]">📅 Pick</div>
                  </button>
                </div>
              </div>

              {/* Preferred Time Window */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-[#5C6768] block mb-1.5">Preferred Time Window</label>
                <select className="w-full text-xs font-medium bg-white border border-[#D8DFDF] rounded-lg p-2.5 text-[#141717] outline-none focus:border-[#0D4446]">
                  <option>Morning (10:00 AM – 12:00 PM)</option>
                  <option>Early Afternoon (1:00 PM – 3:00 PM)</option>
                  <option>Late Afternoon (3:30 PM – 5:30 PM)</option>
                </select>
              </div>

              {/* Primary 10% Coral Accent CTA Buttons */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => alert('Tour Request Confirmed! Our licensed broker will contact you shortly.')}
                  className="w-full py-3.5 bg-[#E76F51] hover:bg-[#D65C3E] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Request This Time
                </button>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full py-2.5 border border-[#0D4446] text-[#0D4446] hover:bg-[#0D4446] hover:text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Schedule Free Site Viewing
                </button>
              </div>
              <div className="text-[10px] text-center text-[#8E9A9B] mt-2">Free cancellation • Direct confirmation with broker</div>
            </div>

            {/* TOOL 2: Contact Agent */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(13,68,70,0.06)] border border-[#E5EBEB]">
              <h3 className="font-['Manrope'] text-lg font-bold text-[#0D4446] mb-4">Contact Agent</h3>
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#E5EBEB]">
                <img 
                  src={property.agent?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"} 
                  alt="Broker" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
                <div>
                  <div className="font-bold text-sm text-[#141717]">{property.agent?.name || property.agent_name || "Maria Santos"}</div>
                  <div className="text-xs text-[#5C6768]">{property.agent?.title || "Real Estate Agent"}</div>
                  <div className="text-[11px] text-[#0D4446] font-semibold mt-0.5">
                    PRC Lic. #0023419 • {listOfficeName}
                  </div>
                </div>
              </div>

              {property.agent?.cta && (
                <div className="text-xs text-[#0D4446] bg-[#0D4446]/5 p-2.5 rounded-lg mb-3 font-semibold">
                  {property.agent.cta}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => alert('Opening WhatsApp chat with broker...')}
                  className="w-full py-2.5 border border-[#D8DFDF] hover:border-emerald-600 hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">chat</span>
                  Message on WhatsApp
                </button>
                <button 
                  onClick={() => alert(`Calling broker at ${property.agent?.phone || '+63 917 555 8920'}...`)}
                  className="w-full py-2.5 border border-[#D8DFDF] hover:border-[#0D4446] hover:bg-[#F4F5F4] text-[#141717] text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0D4446]">call</span>
                  Call {property.agent?.phone || "+63 917 555 8920"}
                </button>
              </div>
            </div>

            {/* TOOL 3: Payment Calculator */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(13,68,70,0.06)] border border-[#E5EBEB]">
              <h3 className="font-['Manrope'] text-lg font-bold text-[#0D4446] mb-1">Payment Calculator</h3>
              <p className="text-xs text-[#5C6768] mb-4">Estimate monthly bank loan repayments</p>

              <div className="p-4 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB] mb-4 text-center">
                <div className="text-[11px] font-semibold text-[#5C6768] uppercase tracking-wide">Estimated Monthly</div>
                <div className="text-2xl font-extrabold text-[#0D4446] font-['Manrope'] my-0.5">
                  ₱{calculatedMortgage.toLocaleString('en-PH')}
                </div>
                <div className="text-[11px] text-[#8E9A9B]">Principal & Interest ({loanTermYears}-yr @ 7%)</div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-[#5C6768]">Down Payment</span>
                    <span className="text-[#141717] font-bold">{downPaymentPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5" 
                    value={downPaymentPercent} 
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full cursor-pointer accent-[#0D4446]" 
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-[#5C6768]">Loan Term</span>
                    <span className="text-[#141717] font-bold">{loanTermYears} Years</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="30" 
                    step="5" 
                    value={loanTermYears} 
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                    className="w-full cursor-pointer accent-[#0D4446]" 
                  />
                </div>
              </div>
            </div>

            {/* TOOL 4: Documents */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(13,68,70,0.06)] border border-[#E5EBEB]">
              <h3 className="font-['Manrope'] text-lg font-bold text-[#0D4446] mb-3">Documents</h3>
              <div className="space-y-2.5">
                <button 
                  onClick={() => alert('Downloading Property Brochure PDF...')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#FBFBF9] border border-[#E5EBEB] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">PDF</div>
                    <div>
                      <div className="text-xs font-semibold text-[#141717]">Property Brochure</div>
                      <div className="text-[11px] text-[#8E9A9B]">Specs & Features (4.2 MB)</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[#5C6768]">download</span>
                </button>

                <button 
                  onClick={() => alert('Downloading Subdivision Guidelines PDF...')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#FBFBF9] border border-[#E5EBEB] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-teal-50 text-[#0D4446] flex items-center justify-center font-bold text-xs">PDF</div>
                    <div>
                      <div className="text-xs font-semibold text-[#141717]">Subdivision Guidelines</div>
                      <div className="text-[11px] text-[#8E9A9B]">HOA Rules (1.8 MB)</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[#5C6768]">download</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* 5. SIMILAR HOMES SECTION */}
        <section className="pt-10 border-t border-[#E5EBEB]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-['Manrope'] text-2xl font-bold text-[#0D4446]">Similar Homes</h2>
              <p className="text-xs text-[#5C6768] mt-0.5">Handpicked architectural properties in Quezon City and San Juan</p>
            </div>
            <Link to="/properties" className="text-xs font-bold text-[#0D4446] hover:text-[#E76F51] flex items-center gap-1 transition-colors">
              View All Properties
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarList.map((item) => {
              const itemPrice = item.formattedPrice || (item.ListPrice ? `₱${Number(item.ListPrice).toLocaleString('en-PH')}` : (item.price || 'Price on Request'));
              const itemBeds = item.BedroomsTotal ?? item.bedroomsTotal ?? item.specs?.beds ?? item.beds ?? 3;
              const itemBaths = item.BathroomsTotalInteger ?? item.bathroomsTotalInteger ?? item.specs?.baths ?? item.baths ?? 2;
              const itemArea = item.LivingArea ?? item.livingArea ?? item.sqm ?? item.floor_area ?? 180;
              const itemImg = (item.images && item.images[0]) || item.mainImage || item.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
              const itemLocation = typeof item.location === 'string' ? item.location : (item.city || 'Metro Manila');

              return (
                <Link 
                  key={item.id} 
                  to={`/properties/${item.id}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E5EBEB] shadow-sm hover:shadow-md transition-all group cursor-pointer block"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={itemImg} 
                      alt={item.title || item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute top-3 left-3 bg-white/95 text-[#0D4446] text-[10px] font-bold px-2 py-1 rounded shadow-xs">
                      {item.unit_status || 'Ready for Occupancy'}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="font-['Manrope'] font-extrabold text-lg text-[#0D4446] mb-1">{itemPrice}</div>
                    <div className="text-sm font-bold text-[#141717] truncate">{item.title || item.name}</div>
                    <div className="text-xs text-[#5C6768] mt-1">{itemBeds} Beds • {itemBaths} Baths • {itemArea} sqm</div>
                    <div className="text-xs text-[#8E9A9B] flex items-center gap-1 mt-3 pt-3 border-t border-[#E5EBEB]">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {itemLocation}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </main>

      {/* 6. FULL PHOTO GALLERY LIGHTBOX MODAL */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8">
          <button 
            onClick={() => setActivePhotoModal(false)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white text-black font-bold text-xl flex items-center justify-center shadow-lg hover:bg-[#E76F51] hover:text-white transition-colors z-[210]"
          >
            &times;
          </button>
          <div className="max-w-5xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5EBEB]">
              <div>
                <h3 className="font-['Manrope'] text-lg font-bold text-[#0D4446]">Property Gallery</h3>
                <p className="text-xs text-[#5C6768]">{propertyTitle} • {photos.length} Verified Photos</p>
              </div>
              <span className="text-xs font-mono text-[#0D4446] bg-[#F4F5F4] px-3 py-1 rounded">
                Architectural Series
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((src, i) => (
                <img 
                  key={i} 
                  src={src} 
                  alt={`Photo ${i + 1}`} 
                  className="rounded-lg object-cover h-[220px] w-full border border-[#E5EBEB]" 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. SCHEDULE SITE VIEWING MODAL */}
      <InspectionScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        property={property}
        onScheduleSuccess={() => {
          setToastMessage('Inspection appointment requested successfully!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

    </div>
  );
}
