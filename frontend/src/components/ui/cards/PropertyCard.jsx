import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  IconMapPin, 
  IconBed, 
  IconBath, 
  IconDimensions,
  IconArrowRight,
  IconHeart,
  IconHeartFilled,
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

  // Title mapping (Name -> properties.title)
  const propertyTitle = property.title || property.name || 'Untitled Property';

  // Transaction classification & Badge: For Sale / For Rent
  const transactionType = property.transaction_type || property.transactionType || property.specs?.transactionType || '';
  const isRent = Boolean(
    (transactionType && transactionType.toLowerCase().includes('rent')) ||
    property.priceSuffix ||
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
    formattedPriceDisplay = `₱ ${rawPrice.toLocaleString('en-PH')}`;
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
      className={`group relative rounded-[28px] border p-4 transition-all duration-300 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full w-full select-none font-sans ${
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
      <div className="space-y-4">
        {/* Cover Photo Container with Rounded Curvature & Image Badges */}
        <div className="relative aspect-[16/11] rounded-[20px] overflow-hidden bg-slate-100 border border-slate-200/80 group shrink-0">
          <img
            src={coverImage}
            alt={propertyTitle}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
            }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
              isClosed ? 'grayscale-[35%] opacity-90' : ''
            }`}
          />

          {/* Top-Left Pill: • For sale / For rent + Condition State + RESO Status Badges */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[70%]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-medium text-[#1E293B] shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isRent ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{typeBadgeLabel}</span>
            </span>

            {condition && (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-[#0F766E] shadow-xs border border-teal-100/60"
                data-testid="card-condition-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                {condition}
              </span>
            )}

            {isUnderContract && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-amber-50/95 text-amber-800 border border-amber-300 text-[11px] font-bold shadow-xs uppercase tracking-wide" 
                data-testid="card-status-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Under Contract
              </span>
            )}

            {isClosed && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-slate-100/95 text-slate-700 border border-slate-300 text-[11px] font-bold shadow-xs uppercase tracking-wide" 
                data-testid="card-status-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Closed / Sold
              </span>
            )}

            {isFeatured && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FF6B6B] text-white text-[11px] font-bold shadow-xs uppercase tracking-wide">
                Featured
              </span>
            )}
          </div>

          {/* Top-Right Round Button: Heart (Favorite / Save) */}
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={handleSaveToggle}
              aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-rose-500 flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              {isSaved ? (
                <IconHeartFilled size={16} className="text-rose-500" />
              ) : (
                <IconHeart size={16} stroke={2} className="text-rose-500" />
              )}
            </button>
          </div>

          {/* Bottom-Left Pill: Location pin & location name */}
          <div className="absolute bottom-3 left-3 z-10 max-w-[85%]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-xs font-medium text-[#1E293B] shadow-xs truncate">
              <div className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <IconMapPin size={11} stroke={2.5} className="text-rose-500" />
              </div>
              <span className="truncate">{displayLocation}</span>
            </div>
          </div>

          {/* Under Contract Contextual Overlay Banner */}
          {isUnderContract && (
            <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-3 text-center uppercase tracking-wider z-10 shadow-xs">
              Under Contract • Backup Inquiries Welcome
            </div>
          )}
        </div>

        {/* Content Section below photo */}
        <div className="space-y-3 px-1">
          {/* Coral dash + Uppercase Property Type */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#E07A5F] rounded-full" />
              <span className="truncate">{propertyType}</span>
            </div>
            {condition && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] font-semibold text-[10px] tracking-normal border border-teal-200/60 capitalize">
                {condition}
              </span>
            )}
          </div>

          {/* Property Title with Coral Period */}
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F4C5C] group-hover:text-[#0F766E] tracking-tight line-clamp-2 leading-tight transition-colors">
            <span>{propertyTitle}</span>
            <span className="text-[#E07A5F]">.</span>
          </h3>

          {/* Key Specs Row: beds, baths, area */}
          <div className="flex items-center gap-4 sm:gap-5 text-xs text-slate-500 font-medium pt-0.5">
            <div className="flex items-center gap-1.5">
              <IconBed size={16} stroke={1.8} className="text-slate-400 shrink-0" />
              <span>
                <span className="font-medium text-slate-700">{beds != null ? beds : '—'}</span>{' '}
                <span className="lowercase">Beds</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBath size={16} stroke={1.8} className="text-slate-400 shrink-0" />
              <span>
                <span className="font-medium text-slate-700">{baths != null ? baths : '—'}</span>{' '}
                <span className="lowercase">Baths</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconDimensions size={16} stroke={1.8} className="text-slate-400 shrink-0" />
              <span>
                {floorAreaFormatted ? (
                  <span className="font-medium text-slate-700 truncate max-w-[100px] inline-block align-bottom">
                    {floorAreaFormatted}
                  </span>
                ) : (
                  <span>— m²</span>
                )}
              </span>
            </div>
          </div>

          {/* Assigned Agent Placeholder */}
          <div className="pt-2 pb-0.5 border-t border-slate-100 flex items-center justify-between" data-testid="card-agent-placeholder">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                <IconUser size={14} stroke={2} className="text-[#0F766E]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[#1E293B] truncate leading-tight">
                  {agentName}
                </span>
                <span className="block text-[10px] text-slate-400 truncate leading-tight">
                  Listing Agent • Assigned Desk
                </span>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              Corporate Desk
            </span>
          </div>

          {/* Subtle Horizontal Divider */}
          <div className="border-t border-slate-100 pt-3" />

          {/* Footer: Asking Price & View Property Pill Button */}
          <div className="flex items-end justify-between gap-2 pt-0.5">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Asking price</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0F4C5C] tracking-tight">
                {priceWithFrequency}
              </p>
            </div>

            <button
              type="button"
              onClick={handleNavigate}
              aria-label="View Details"
              className="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#0F6266] hover:bg-[#0c4e51] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer group/btn shrink-0"
              title="View property"
            >
              <span>View property</span>
              <div className="w-6 h-6 rounded-full bg-[#E07A5F] text-white flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
                <IconArrowRight size={13} stroke={2.5} className="-rotate-45" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
