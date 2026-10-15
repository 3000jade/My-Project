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
  IconBookmarkFilled
} from '@tabler/icons-react';
import { resolveDriveImageUrl } from '../../../services/driveService';
import useViewingList from '../../../hooks/useViewingList';

export default function PropertyCard({ property = {}, variant = 'vertical', variants }) {
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
  
  const floorAreaValue = property.living_area ?? property.livingArea ?? property.specs?.livingArea ?? property.sqm ?? property.floor_area ?? property.sqft ?? null;
  const floorAreaUnits = property.living_area_units || property.livingAreaUnits || property.specs?.livingAreaUnits || (property.sqm ? 'sqm' : (property.sqft ? 'sqft' : 'sqm'));
  const floorAreaFormatted = floorAreaValue != null ? `${floorAreaValue} ${floorAreaUnits}` : null;

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

  return (
    <motion.article
      variants={cardAnimation}
      onClick={handleNavigate}
      className="group relative bg-[#FFFFFF] rounded-lg border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E]/40 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full w-full select-none"
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
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
            }}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges: For Sale/Rent + Featured */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="backdrop-blur-md bg-white/95 text-[#0F766E] text-[11px] font-bold px-2.5 py-1 rounded shadow-xs border border-[#E2E8F0]/80 uppercase tracking-wide">
              {typeBadgeLabel}
            </span>
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

          {/* Property Type Tag at bottom edge of image */}
          <div className="absolute bottom-3 left-3 z-10">
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
        </div>
      </div>

      {/* Card Footer: View Details Action */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0F766E] group-hover:text-[#115E59] transition-colors flex items-center gap-1">
          View Details
          <IconArrowRight size={14} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
        </span>
        <span className="text-[11px] font-mono text-[#64748B]">
          {property.listing_id || property.ref_code || ''}
        </span>
      </div>
    </motion.article>
  );
}
