import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { stripHtml } from '@/pages/portals/broker/components/property-form/DescriptionEditorModal';
import {
  IconMapPin,
  IconBed,
  IconBath,
  IconDimensions,
  IconHeart,
  IconHeartFilled,
  IconShare,
  IconUser
} from '@tabler/icons-react';
import {
  Tag,
  KeyRound,
  Landmark,
  CheckCircle2,
  Clock,
  Hammer,
  Repeat,
  BadgeCheck,
  Car,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveDriveImageUrl } from '../../../services/driveService';
import { formatPropertyAddressHeading, formatMergedStatusPill } from '../../../services/propertyService';
import useViewingList from '../../../hooks/useViewingList';
import ViewPropertyButton from '../buttons/ViewPropertyButton';
import ShareListingModal from '../modals/ShareListingModal';
import PublicAgentProfileModal from '../modals/PublicAgentProfileModal';

function getTransactionIcon(transactionType = '', isRent = false) {
  const normalized = String(transactionType).toLowerCase();
  if (normalized.includes('foreclos')) return Landmark;
  if (isRent || normalized.includes('rent')) return KeyRound;
  return Tag;
}

function getConditionIcon(condition = '') {
  const normalized = String(condition).toLowerCase();
  if (normalized.includes('pre-sell') || normalized.includes('presell')) return Clock;
  if (normalized.includes('construct')) return Hammer;
  if (normalized.includes('resale')) return Repeat;
  if (normalized.includes('sold') || normalized.includes('closed')) return BadgeCheck;
  return CheckCircle2;
}

export default function PropertyCard({
  property = {},
  variant = 'vertical',
  variants,
  isSelected = false,
  isHovered = false,
  onSelect,
  onBrokerClick,
  onMouseEnter,
  onMouseLeave
}) {
  const navigate = useNavigate();
  const { isInViewingList, toggleViewingList } = useViewingList();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);

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
  const propertyTitle = formatPropertyAddressHeading(property, 'Metro Manila, Philippines');

  // Transaction classification & Badge: For Sale / For Rent
  const transactionType = property.transaction_type || property.transactionType || property.specs?.transactionType || '';
  const isRent = Boolean(
    (transactionType && transactionType.toLowerCase().includes('rent')) ||
    property.priceSuffix ||
    (property.status && property.status.toLowerCase().includes('rent'))
  );
  const typeBadgeLabel = isRent ? 'For Rent' : 'For Sale';
  const isFeatured = Boolean(property.is_featured || property.isFeatured);
  const statusPill = formatMergedStatusPill(property);

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
    formattedPriceDisplay = '-';
  }

  const priceWithFrequency = isRent && !formattedPriceDisplay.includes('/') && !formattedPriceDisplay.toLowerCase().includes('mo')
    ? `${formattedPriceDisplay} / ${rentFreq}`
    : formattedPriceDisplay;

  // Location mapping (City / Municipality, Province)
  const propertyDescription = stripHtml(
    property.description ||
    property.publicRemarks ||
    property.public_remarks ||
    ''
  );
  const city = property.city || property.location_raw?.city || property.location?.city || '';
  const province = property.state_or_province || property.province || property.location_raw?.stateOrProvince || property.location?.state || property.location?.stateOrProvince || '';
  const displayLocation = [city, province].filter(Boolean).join(', ') || (typeof property.location === 'string' ? property.location : 'Metro Manila, Philippines');

  // Specs: Bedrooms, Bathrooms, Parking, Floor Area with unit
  const beds = property.bedrooms_total ?? property.bedroomsTotal ?? property.beds ?? property.specs?.beds ?? property.specs?.bedroomsTotal ?? null;
  const baths = property.bathrooms_total_integer ?? property.bathroomsTotalInteger ?? property.baths ?? property.specs?.baths ?? property.specs?.bathroomsTotalInteger ?? null;
  const parking = property.parking_total ?? property.parkingTotal ?? property.parking ?? property.specs?.parkingTotal ?? null;
  const TransactionIcon = getTransactionIcon(transactionType, isRent);
  const ConditionIcon = getConditionIcon(property.property_condition || property.propertyCondition || property.condition || property.specs?.propertyCondition || property.specs?.condition || '');

  const floorAreaValue = property.living_area ?? property.livingArea ?? property.specs?.livingArea ?? property.sqm ?? property.floor_area ?? property.sqft ?? property.area ?? null;
  const floorAreaUnits = property.living_area_units || property.livingAreaUnits || property.specs?.livingAreaUnits || (property.sqm ? 'sqm' : (property.sqft ? 'sqft' : 'sqm'));
  let floorAreaFormatted = null;
  if (floorAreaValue != null) {
    const rawValStr = String(floorAreaValue);
    const num = Number(rawValStr.replace(/[^0-9.-]+/g, ''));
    const displayNum = !isNaN(num) && num > 0 ? num.toLocaleString() : floorAreaValue;
    const cleanUnits = String(floorAreaUnits).toLowerCase().includes('sq') || String(floorAreaUnits).toLowerCase().includes('meter') ? 'sqm' : floorAreaUnits;
    floorAreaFormatted = `${displayNum} ${cleanUnits}`;
  }

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
      navigate(`/properties/${propertyId}`, { state: { property } });
    }
  };

  // Two-step click behavior when onSelect is provided:
  // 1st click zooms into the marker on the map; 2nd click navigates to property details.
  const handleCardAction = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onSelect === 'function' && !isSelected) {
      onSelect(property);
      return;
    }
    handleNavigate();
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    toggleViewingList(property);
  };

  const isHighlighted = isSelected || isHovered;

  return (
    <>
      <motion.article
        variants={cardAnimation}
        onClick={handleCardAction}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid="property-card"
        data-property-id={propertyId}
        className={`group relative rounded-[28px] border p-4 transition-all duration-200 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full w-full select-none font-sans ${isClosed
            ? isHighlighted
              ? 'opacity-100 bg-white border-rose-400 ring-2 ring-rose-400/30 shadow-lg -translate-y-1'
              : 'opacity-80 hover:opacity-100 bg-white/90 backdrop-blur-xs border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
            : isHighlighted
              ? 'bg-white border-[#0F766E] ring-2 ring-[#0F766E]/30 shadow-xl -translate-y-1'
              : 'bg-white border-[#E2E8F0] shadow-xs hover:shadow-lg hover:border-[#0F766E]/50 hover:-translate-y-0.5'
          }`}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${propertyTitle}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardAction(e);
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
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${isClosed ? 'grayscale-[20%] opacity-90' : ''
                }`}
            />

            {/* Top-Left Pill: For sale / For rent + Condition State + RESO Status Badges */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[75%]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-medium text-[#1E293B] shadow-xs">
                <TransactionIcon className={`size-3.5 shrink-0 ${isRent ? 'text-amber-600' : 'text-[#0F766E]'}`} aria-hidden="true" />
                <span>{typeBadgeLabel}</span>
              </span>

              {condition && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-[#0F766E] shadow-xs border border-teal-100/60"
                  data-testid="card-condition-badge"
                >
                  <ConditionIcon className="size-3.5 shrink-0 text-[#0F766E]" aria-hidden="true" />
                  {condition}
                </span>
              )}

              {isSelected && typeof onSelect === 'function' && (
                <span
                  data-testid="card-map-focused-badge"
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0F766E] text-white text-[11px] font-semibold shadow-xs"
                >
                  Pinned on Map • Click again for details
                </span>
              )}
            </div>

            {/* Top-Right Round Buttons: Share + Heart (Favorite / Save) */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(true);
                }}
                aria-label="Share property"
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-[#64748B] hover:text-[#0F766E] flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <IconShare size={15} stroke={2} />
              </button>
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

            {/* Under Contract Contextual Overlay Banner */}
            {isUnderContract && (
              <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-3 text-center uppercase tracking-wider z-10 shadow-xs">
                Under Contract • Backup Inquiries Welcome
              </div>
            )}

            {/* Sold / Closed Contextual Overlay Banner */}
            {isClosed && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-3 text-center uppercase tracking-widest z-10 shadow-xs">
                Transaction Closed • Sold Benchmark
              </div>
            )}
          </div>

          {/* Content Section below photo */}
          <div className="space-y-3 px-1">
            {/* Coral dash + Uppercase Property Type */}
            <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="w-4 h-0.5 bg-[#E07A5F] rounded-full shrink-0" />
              <span className="truncate">{propertyType}</span>
            </div>

            {/* Property Title + Description + Address Subheader */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F4C5C] group-hover:text-[#0F766E] tracking-tight line-clamp-2 leading-tight transition-colors">
                <span>{propertyTitle}</span>
                <span className="text-[#E07A5F]">.</span>
              </h3>
              {propertyDescription && (
                <p className="text-xs font-medium text-on-surface-variant line-clamp-1">
                  {propertyDescription}
                </p>
              )}
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                <IconMapPin size={14} stroke={2} className="text-[#0F766E] shrink-0" aria-hidden="true" />
                <span className="truncate">{displayLocation}</span>
              </p>
            </div>

            {/* Key Specs Row: beds, baths, parking space, area */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500 font-medium pt-0.5">
              {Number(beds) !== 0 && (
                <div className="flex items-center gap-1.5">
                  <IconBed size={16} stroke={1.8} className="text-slate-400 shrink-0" />
                  <span>
                    <span className="font-medium text-slate-700">{beds != null ? beds : '—'}</span>{' '}
                    <span className="lowercase">Beds</span>
                  </span>
                </div>
              )}
              {Number(baths) !== 0 && (
                <div className="flex items-center gap-1.5">
                  <IconBath size={16} stroke={1.8} className="text-slate-400 shrink-0" />
                  <span>
                    <span className="font-medium text-slate-700">{baths != null ? baths : '—'}</span>{' '}
                    <span className="lowercase">Baths</span>
                  </span>
                </div>
              )}
              {Number(parking) !== 0 && (
                <div className="flex items-center gap-1.5">
                  <Car className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-slate-700">{parking != null ? parking : '—'}</span>{' '}
                    <span className="lowercase">parking space</span>
                  </span>
                </div>
              )}
              {!/^0(?:\.0+)?\b/.test(String(floorAreaFormatted || '').trim()) && (
                <div className="flex items-center gap-1.5">
                  <IconDimensions size={16} stroke={1.8} className="text-slate-400 shrink-0" />
                  <span>
                    {floorAreaFormatted ? (
                      <span className="font-medium text-slate-700 truncate max-w-[130px] inline-block align-bottom">
                        {floorAreaFormatted}
                      </span>
                    ) : (
                      <span>— m²</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Listing Agent Row */}
            <div className="pt-2 pb-0.5 border-t border-slate-100 flex items-center justify-between gap-2" data-testid="card-agent-placeholder">
              {(() => {
                const credentials =
                  property.credentials ||
                  property.customAttributes?.credentials ||
                  property.customResoAttributes?.credentials ||
                  property.custom_reso_attributes?.credentials ||
                  {};
                const brokerName =
                  property.broker_name ||
                  property.brokerName ||
                  credentials.brokerName ||
                  credentials.brokerage ||
                  'Human Shelter Realty';
                const brokerageName = credentials.brokerage || 'Human Shelter Realty';
                const brokerProfile = {
                  id: property.createdBy || property.created_by || 'broker-1',
                  name: brokerName,
                  brokerage_name: brokerageName,
                  team_name: 'Managing Broker',
                  email: property.broker_email || credentials.brokerEmail || 'inquiries@humanshelterrealty.com',
                  phone: property.broker_phone || credentials.contactNumber || '+63 2 8888 0000',
                };

                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                      <IconUser size={18} stroke={2} className="text-[#0F766E]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-[#1E293B] truncate leading-snug">
                        {agentName}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate leading-tight">
                        Assigned by{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onBrokerClick === 'function') {
                              onBrokerClick(brokerProfile);
                              return;
                            }
                            setIsBrokerModalOpen(true);
                          }}
                          className="font-semibold text-[#0F766E] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0F766E] rounded-xs cursor-pointer"
                        >
                          {brokerName}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })()}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (propertyId && propertyId !== 'listing-preview') {
                    navigate(`/properties/${propertyId}`, { state: { property, openInquiry: true } });
                  }
                }}
                className="h-6 px-2.5 gap-1 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] text-[10px] font-semibold normal-case tracking-normal shrink-0 transition-colors cursor-pointer"
              >
                <Mail className="size-3 shrink-0 text-[#FF8559]" aria-hidden="true" />
                <span>Inquire Now</span>
              </Button>
            </div>

            {/* Subtle Horizontal Divider */}
            <div className="border-t border-slate-100 pt-3" />

            {/* Footer: Selling Price & View Property Pill Button */}
            <div className="flex items-end justify-between gap-2 pt-0.5">
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">
                  {isClosed ? 'Sold benchmark' : isUnderContract ? 'Contract pending' : 'Selling Price'}
                </span>
                <p className={`text-xl sm:text-2xl font-bold tracking-tight ${isClosed ? 'text-slate-700' : 'text-[#0F4C5C]'
                  }`}>
                  {priceWithFrequency}
                </p>
              </div>

              <ViewPropertyButton
                onClick={handleCardAction}
                aria-label={isClosed ? 'View Past Sale' : 'View Details'}
                label={
                  isClosed
                    ? 'View Past Sale'
                    : isUnderContract
                      ? 'View Details'
                      : isSelected && typeof onSelect === 'function'
                        ? 'Open details'
                        : 'View property'
                }
                className={isClosed ? 'bg-slate-700 hover:bg-slate-800' : ''}
                title={
                  isClosed
                    ? 'View past sale record'
                    : isSelected && typeof onSelect === 'function'
                      ? 'Click again to open property details'
                      : 'Click to zoom on map, click again for details'
                }
              />
            </div>
          </div>
        </div>
      </motion.article>
      <ShareListingModal
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        listing={{
          ...property,
          id: propertyId,
          title: propertyTitle,
          formattedPrice: priceWithFrequency,
          address: displayLocation,
          coverImage,
        }}
      />
      <PublicAgentProfileModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        agent={{
          id: property.createdBy || property.created_by || 'broker-1',
          name:
            property.broker_name ||
            property.brokerName ||
            property.credentials?.brokerName ||
            property.customAttributes?.credentials?.brokerName ||
            property.customResoAttributes?.credentials?.brokerName ||
            property.custom_reso_attributes?.credentials?.brokerName ||
            property.credentials?.brokerage ||
            'Human Shelter Realty',
          brokerage_name:
            property.credentials?.brokerage ||
            property.customAttributes?.credentials?.brokerage ||
            property.customResoAttributes?.credentials?.brokerage ||
            property.custom_reso_attributes?.credentials?.brokerage ||
            'Human Shelter Realty',
          team_name: 'Managing Broker',
          email:
            property.broker_email ||
            property.credentials?.brokerEmail ||
            'inquiries@humanshelterrealty.com',
          phone:
            property.broker_phone ||
            property.credentials?.contactNumber ||
            '+63 2 8888 0000',
        }}
        onSendInquiry={
          propertyId && propertyId !== 'listing-preview'
            ? () => navigate(`/properties/${propertyId}`, { state: { property, openInquiry: true } })
            : undefined
        }
      />
    </>
  );
}
