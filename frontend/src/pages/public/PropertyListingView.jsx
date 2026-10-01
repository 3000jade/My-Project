import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProperties } from '../../mockData/mockProperties';

export default function PropertyListingView() {
  const { id } = useParams();
  
  // Safe property lookup supporting string IDs, RESO keys, and numeric IDs
  const property = useMemo(() => {
    if (!id) return mockProperties[0];
    return mockProperties.find(p => 
      String(p.id) === String(id) || 
      p.ListingKey === id || 
      p.ListingId === id ||
      p.ref_code === id
    ) || mockProperties[0];
  }, [id]);

  // UI Interactive States
  const [activePhotoModal, setActivePhotoModal] = useState(false);
  const [activeFloorTab, setActiveFloorTab] = useState(0);
  const [tourType, setTourType] = useState('inperson');
  const [selectedDate, setSelectedDate] = useState('today');
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [inViewingList, setInViewingList] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Safe Data Extraction & Null Guards (RESO 2.0 Compliance)
  const standardStatus = property.StandardStatus || property.standard_status || property.status || property.listing_status || 'Active';
  const listingId = property.ListingId || property.listing_id || property.ref_code || 'RESO-2026-0042';
  
  const rawPrice = property.ListPrice ?? property.price_raw ?? null;
  const formattedPrice = rawPrice != null && !isNaN(rawPrice)
    ? `₱${Number(rawPrice).toLocaleString('en-PH')}`
    : (property.price || 'Price on Request');

  const bedrooms = property.BedroomsTotal ?? property.bedrooms ?? property.beds ?? null;
  const bathrooms = property.BathroomsTotalInteger ?? property.bathrooms ?? property.baths ?? null;
  
  const livingAreaNumeric = property.LivingArea ?? property.floor_area ?? (property.sqm ? parseFloat(property.sqm) : null);
  const livingAreaFormatted = property.LivingArea != null
    ? `${property.LivingArea} ${property.LivingAreaUnits || 'sqm'}`
    : (property.sqm || property.area || (property.floor_area != null ? `${property.floor_area} sqm` : null));

  const lotSize = property.LotSizeArea ?? property.lot_area ?? null;
  const lotSizeUnits = property.LotSizeUnits || 'sqm';
  const lotSizeFormatted = lotSize != null ? `${lotSize} ${lotSizeUnits}` : null;

  const hoaFee = property.AssociationFee ?? property.association_fee ?? null;
  const hoaFeeFormatted = hoaFee != null && !isNaN(hoaFee) ? `₱${Number(hoaFee).toLocaleString('en-PH')}` : null;

  const yearBuilt = property.YearBuilt ?? property.year_built ?? null;
  const unitNumber = property.UnitNumber || null;
  const listOfficeName = property.ListOfficeName || property.agent?.brokerage || 'Nordic Architectural Realty Group';
  const publicRemarks = property.PublicRemarks || property.description || '';

  // Extract photos safely
  const photos = useMemo(() => {
    if (property.Media && Array.isArray(property.Media) && property.Media.length > 0) {
      return property.Media.map(m => m.MediaURL || m.url).filter(Boolean);
    }
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images;
    }
    if (property.gallery && Array.isArray(property.gallery) && property.gallery.length > 0) {
      return property.gallery;
    }
    return [
      property.mainImage || property.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ];
  }, [property]);

  // Derived Title & Location
  const propertyTitle = property.title || property.name || "Modern Duplex in Rolling Hills";
  const propertyLocation = property.location || (property.address ? `${property.address}, ${property.city || ''}` : "Rolling Hills Subdivision, New Manila, Quezon City");
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

  return (
    <div className="min-h-screen bg-[#FBFBF9] font-sans text-[#141717] pb-24 antialiased selection:bg-[#0D4446] selection:text-white">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5EBEB] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-['Manrope'] font-bold text-xl text-[#0D4446] flex items-center gap-2.5 tracking-tight">
              <span className="w-7 h-7 bg-[#0D4446] text-white rounded flex items-center justify-center font-extrabold text-sm">N</span>
              NordicEstate
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5C6768]">
              <Link to="/properties" className="text-[#0D4446]">Buy</Link>
              <Link to="/rent" className="hover:text-[#0D4446] transition-colors">Rent</Link>
              <Link to="/commercial" className="hover:text-[#0D4446] transition-colors">Commercial</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <button 
              onClick={() => setInViewingList(!inViewingList)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                inViewingList 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'text-[#5C6768] border-[#D8DFDF] hover:bg-[#F4F5F4]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {inViewingList ? 'bookmark_added' : 'bookmark'}
              </span>
              {inViewingList ? 'In Viewing List' : 'Add to Viewing List'}
            </button>
            <Link to="/login" className="px-4 py-2 bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
              Log In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-7">
        
        {/* BREADCRUMB & METADATA BAR (With Property Listing Details Eyebrow) */}
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
            <span className="font-mono uppercase tracking-wider text-[11px] text-[#8E9A9B]">
              Ref: {property.ref_code || ''} {property.id ? `(${property.id})` : ''} • ID: <span data-testid="reso-listing-id">{listingId}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D8DFDF]"></span>
            <span className="text-[#0D4446] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Updated: Sep 27, 2026 (Today)
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D8DFDF]"></span>
            <span>Listed: Sep 15, 2026</span>
          </div>
        </div>

        {/* 2. IMMERSIVE PHOTO GALLERY (65% / 35% Split) */}
        <section className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E5EBEB]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-[420px] sm:h-[480px] lg:h-[520px]">
            
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
        </section>

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
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5EBEB]">
                <h2 className="font-['Manrope'] text-xl font-bold text-[#0D4446] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  Property Details
                </h2>
                <span className="text-[11px] font-mono text-[#0D4446] bg-[#0D4446]/5 border border-[#0D4446]/10 px-2.5 py-1 rounded">
                  Updated: Sep 27, 2026
                </span>
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

              {/* Map Preview Plinth */}
              <div className="relative w-full h-[220px] rounded-xl overflow-hidden mb-6 border border-[#E5EBEB] bg-slate-100 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Location Map Preview" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D4446]/60 via-transparent to-black/20"></div>
                
                <div className="absolute flex flex-col items-center">
                  <div className="bg-[#E76F51] text-white p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div className="bg-white text-[#141717] text-xs font-bold px-3 py-1 rounded-full shadow mt-1">
                    {property.development || "Rolling Hills Subdivision"}
                  </div>
                </div>

                <button 
                  onClick={() => alert('Opening Google Maps coordinates...')}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 text-[#0D4446] hover:bg-white text-xs font-bold rounded-lg shadow border border-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Open in Maps</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
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
            {[
              {
                id: 'sim-1',
                price: '₱26,800,000',
                title: 'Modern Townhouse in San Juan',
                location: 'San Juan City',
                specs: '3 Beds • 4 Baths • 280 sqm',
                img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              },
              {
                id: 'sim-2',
                price: '₱31,000,000',
                title: 'Corner Architectural Villa',
                location: 'New Manila, Quezon City',
                specs: '4 Beds • 5 Baths • 380 sqm',
                img: 'https://images.unsplash.com/photo-1613490908677-742a17088b68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              },
              {
                id: 'sim-3',
                price: '₱29,500,000',
                title: 'Contemporary Duplex Residence',
                location: 'Scout Area, Quezon City',
                specs: '4 Beds • 4 Baths • 320 sqm',
                img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              }
            ].map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl overflow-hidden border border-[#E5EBEB] shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => alert(`Navigating to ${item.title}...`)}
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-3 left-3 bg-white/95 text-[#0D4446] text-[10px] font-bold px-2 py-1 rounded shadow-xs">
                    Ready for Occupancy
                  </span>
                </div>
                <div className="p-5">
                  <div className="font-['Manrope'] font-extrabold text-lg text-[#0D4446] mb-1">{item.price}</div>
                  <div className="text-sm font-bold text-[#141717] truncate">{item.title}</div>
                  <div className="text-xs text-[#5C6768] mt-1">{item.specs}</div>
                  <div className="text-xs text-[#8E9A9B] flex items-center gap-1 mt-3 pt-3 border-t border-[#E5EBEB]">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {item.location}
                  </div>
                </div>
              </div>
            ))}
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
      {showScheduleModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-[#E5EBEB]">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-[#5C6768] hover:text-[#141717] text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="font-['Manrope'] text-xl font-bold text-[#0D4446] mb-2">Schedule Free Site Viewing</h3>
            <p className="text-xs text-[#5C6768] mb-4">Coordinate directly with our licensed property specialist.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#141717] block mb-1">Target Move-In Window</label>
                <select className="w-full text-xs font-medium p-2.5 border border-[#D8DFDF] rounded-lg outline-none focus:border-[#0D4446]">
                  <option>Immediate (Within 30 Days)</option>
                  <option>1 - 3 Months</option>
                  <option>3 - 6 Months</option>
                  <option>Investment / Exploring</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#141717] block mb-1">Full Name</label>
                <input type="text" placeholder="Your name" className="w-full text-xs p-2.5 border border-[#D8DFDF] rounded-lg outline-none focus:border-[#0D4446]" />
              </div>

              <div>
                <label className="text-xs font-bold text-[#141717] block mb-1">Contact Number</label>
                <input type="tel" placeholder="+63 9XX XXX XXXX" className="w-full text-xs p-2.5 border border-[#D8DFDF] rounded-lg outline-none focus:border-[#0D4446]" />
              </div>

              <button 
                onClick={() => {
                  alert('Viewing schedule confirmed! Our broker will contact you to coordinate.');
                  setShowScheduleModal(false);
                }}
                className="w-full py-3 bg-[#E76F51] hover:bg-[#D65C3E] text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                Confirm Viewing Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
