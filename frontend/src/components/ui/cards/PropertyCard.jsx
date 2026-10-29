import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  IconMapPin, 
  IconBed, 
  IconBath, 
  IconDimensions,
  IconArrowRight,
  IconBookmark,
  IconBookmarkFilled,
  IconUser
} from '@tabler/icons-react';
import { resolveDriveImageUrl } from '../../../services/driveService';
import useViewingList from '../../../hooks/useViewingList';

export default function PropertyCard({ 
  property = {}, 
  variant = 'vertical', 
  variants,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave
}) {
  const navigate = useNavigate();
  const { isInViewingList, toggleViewingList } = useViewingList();
  
  // Animation config
  const cardAnimation = variants || {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  // Safe Property Identification & Navigation Target
  const propertyId = property.id || property.ListingKey || property.listingKey || property.ListingId || property.listingId || property.ref_code || '';
  const isSaved = propertyId ? isInViewingList(propertyId) : false;

  // Derive canonical RESO status
  const standardStatus = property.standard_status || property.standardStatus || property.StandardStatus || (property.status === 'AVAILABLE' ? 'Active' : property.status === 'SOLD' ? 'Closed' : property.status === 'RESERVED' ? 'Active Under Contract' : property.status || 'Active');
  const lowerStatus = String(standardStatus).toLowerCase();
  const isUnderContract = lowerStatus.includes('contract') || lowerStatus.includes('reserved');
  const isClosed = lowerStatus.includes('closed') || lowerStatus.includes('sold');
  const isActive = !isUnderContract && !isClosed;

  // Title mapping (Name -> properties.title)
  const propertyTitle = property.title || property.name || 'Untitled Property';

  // Transaction classification & Badge: For Sale / For Rent
  const transactionType = property.transaction_type || property.transactionType || property.specs?.transactionType || '';
  const isRent = Boolean(
    property.rent_frequency ||
    property.priceSuffix ||
    (transactionType && transactionType.toLowerCase().includes('rent')) ||
    (property.status && property.status.toLowerCase().includes('rent'))
  );
  const typeBadgeLabel = isRent ? 'For Rent' : 'For Sale';
  const isFeatured = Boolean(property.is_featured || property.isFeatured);

  // Property Type
  const propertyType = property.property_type || property.propertyType || property.specs?.propertyType || property.PropertyType || 'Residential';

  // Price formatting
  const rawPrice = property.price_raw ?? (typeof property.price === 'number' ? property.price : Number(String(property.price || '0').replace(/[^0-9.-]+/g, '')) || 0);
  const rentFreq = property.rent_frequency || property.pricing?.rentFrequency || (property.priceSuffix ? property.priceSuffix.replace(/^\s*\/?\s*/, '') : 'mo');
  
  let formattedPriceDisplay = '';
  if (property.formattedPrice) {
    formattedPriceDisplay = property.formattedPrice;
  } else if (rawPrice > 0) {
    formattedPriceDisplay = `₱${rawPrice.toLocaleString('en-PH')}`;
  } else if (typeof property.price === 'string' && property.price.trim()) {
    formattedPriceDisplay = property.price;
  } else {
    formattedPriceDisplay = 'Price on Request';
  }

  const priceWithFrequency = isRent && !formattedPriceDisplay.includes('/') && !formattedPriceDisplay.toLowerCase().includes('mo')
    ? `${formattedPriceDisplay} / ${rentFreq}`
    : formattedPriceDisplay;

  // Location mapping (City / Municipality, Province)
  const city = property.city || property.location_raw?.city || property.location?.city || '';
  const province = property.state_or_province || property.province || property.location_raw?.stateOrProvince || property.location?.state || property.location?.stateOrProvince || '';
  const displayLocation = [city, province].filter(Boolean).join(', ') || (typeof property.location === 'string' ? property.location : 'Metro Manila, Philippines');

  // Specs: Bedrooms, Bathrooms, Floor Area with unit
  const beds = property.bedrooms_total ?? property.bedroomsTotal ?? property.beds ?? property.specs?.beds ?? property.specs?.bedroomsTotal ?? null;
  const baths = property.bathrooms_total_integer ?? property.bathroomsTotalInteger ?? property.baths ?? property.specs?.baths ?? property.specs?.bathroomsTotalInteger ?? null;
  
  const floorAreaValue = property.living_area ?? property.livingArea ?? property.specs?.livingArea ?? property.sqm ?? property.floor_area ?? property.sqft ?? property.area ?? null;
  const floorAreaUnits = property.living_area_units || property.livingAreaUnits || property.specs?.livingAreaUnits || (property.sqm ? 'sqm' : (property.sqft ? 'sqft' : 'sqm'));
  const floorAreaFormatted = floorAreaValue != null ? (String(floorAreaValue).includes('sq') ? floorAreaValue : `${floorAreaValue} ${floorAreaUnits}`) : null;

  // Condition state & Assigned agent
  const condition = property.property_condition || property.propertyCondition || property.condition || property.specs?.propertyCondition || property.specs?.condition || '';
  const agentName = property.agent_name || property.agentName || property.agent?.name || property.assigned_agent?.full_name || property.assignedAgent?.full_name || 'Human Shelter Desk';

  // Cover photo with fallback
  const rawImage = (Array.isArray(property.images) && property.images[0]) ||
    (Array.isArray(property.property_images) && property.property_images[0]?.image_url) ||
    property.mainImage ||
    property.image ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
  const coverImage = resolveDriveImageUrl(rawImage);

  const handleNavigate = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    }
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    toggleViewingList(property);
  };

  const isHighlighted = isSelected || isHovered;

  return (
    <motion.article
      variants={cardAnimation}
      onClick={handleNavigate}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="property-card"
      data-property-id={propertyId}
      className={`group relative rounded-lg border transition-all duration-300 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full w-full select-none ${
        isHighlighted
          ? 'border-[#0F766E] ring-2 ring-[#0F766E]/30 shadow-lg -translate-y-1.5 bg-teal-50/10'
          : 'bg-[#FFFFFF] border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E]/40 hover:-translate-y-1'
      }`}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${propertyTitle}`}
      onKeyDown={(e) => { 
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigate();
        }
      }}
    >
      <div>
        {/* Cover Photo Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <img
            src={coverImage}
            alt={propertyTitle}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
            }}
            className={`w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out ${
              isClosed ? 'grayscale-[35%] opacity-90' : ''
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges: For Sale/Rent + Status (Under Contract / Closed) + Condition + Featured */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span className="backdrop-blur-md bg-white/95 text-[#0F766E] text-[11px] font-bold px-2.5 py-1 rounded shadow-xs border border-[#E2E8F0]/80 uppercase tracking-wide">
              {typeBadgeLabel}
            </span>
            {condition && (
              <span 
                className="backdrop-blur-md bg-white/95 text-[#0F766E] text-[11px] font-bold px-2.5 py-1 rounded shadow-xs border border-teal-100 uppercase tracking-wide flex items-center gap-1"
                data-testid="card-condition-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                {condition}
              </span>
            )}
            {isUnderContract && (
              <span 
                className="backdrop-blur-md bg-amber-50/95 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-1 rounded shadow-xs uppercase tracking-wide flex items-center gap-1.5" 
                data-testid="card-status-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Under Contract
              </span>
            )}
            {isClosed && (
              <span 
                className="backdrop-blur-md bg-slate-100/95 text-slate-700 border border-slate-300 text-[11px] font-bold px-2 py-1 rounded shadow-xs uppercase tracking-wide flex items-center gap-1.5" 
                data-testid="card-status-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Closed / Sold
              </span>
            )}
            {isFeatured && (
              <span className="backdrop-blur-md bg-[#FF6B6B] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs uppercase tracking-wide">
                Featured
              </span>
            )}
          </div>

          {/* Independent Save / Favorite Action */}
          <button
            type="button"
            onClick={handleSaveToggle}
            aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            {isSaved ? (
              <IconBookmarkFilled size={16} className="text-[#0F766E]" />
            ) : (
              <IconBookmark size={16} stroke={2} />
            )}
          </button>

          {/* Under Contract contextual banner */}
          {isUnderContract && (
            <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-3 text-center uppercase tracking-wider z-10 shadow-xs">
              Under Contract • Backup Inquiries Welcome
            </div>
          )}

          {/* Property Type Tag at bottom edge of image */}
          <div className={`absolute left-3 z-10 ${isUnderContract ? 'bottom-8' : 'bottom-3'}`}>
            <span className="backdrop-blur-sm bg-slate-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded tracking-wide">
              {propertyType}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-xl sm:text-2xl font-extrabold text-[#0F766E] font-sans tracking-tight leading-tight">
              {priceWithFrequency}
            </div>
          </div>

          {/* Property Name & Location */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors line-clamp-1 leading-snug">
              {propertyTitle}
            </h3>
            <p className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
              <IconMapPin size={14} stroke={2} className="shrink-0 text-[#0F766E]" />
              <span className="truncate">{displayLocation}</span>
            </p>
          </div>

          {/* Key Specs Pill Bar */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
            {/* Bedrooms */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                <IconBed size={14} stroke={2} className="text-[#0F766E]" />
                Beds
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#1E293B] mt-0.5">
                {beds != null ? beds : '—'}
              </span>
            </div>

            {/* Bathrooms */}
            <div className="flex flex-col items-center justify-center border-x border-[#E2E8F0]">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                <IconBath size={14} stroke={2} className="text-[#0F766E]" />
                Baths
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#1E293B] mt-0.5">
                {baths != null ? baths : '—'}
              </span>
            </div>

            {/* Floor Area */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                <IconDimensions size={14} stroke={2} className="text-[#0F766E]" />
                Area
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#1E293B] mt-0.5 truncate max-w-full px-1">
                {floorAreaFormatted || '—'}
              </span>
            </div>
          </div>

          {/* Agent Placeholder */}
          <div className="pt-1 flex items-center justify-between text-xs text-[#64748B]" data-testid="card-agent-placeholder">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                <IconUser size={13} stroke={2} className="text-[#0F766E]" />
              </div>
              <span className="text-xs text-[#1E293B] font-medium truncate">
                {agentName}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              Verified Agent
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: View Details Action */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
        <button
          type="button"
          onClick={handleNavigate}
          aria-label="View Details"
          className="text-xs font-semibold text-[#0F766E] group-hover:text-[#115E59] transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 text-left"
        >
          View Details
          <IconArrowRight size={14} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <span className="text-[11px] font-mono text-[#64748B]">
          {property.listing_id || property.ref_code || ''}
        </span>
      </div>
    </motion.article>
  );
}
