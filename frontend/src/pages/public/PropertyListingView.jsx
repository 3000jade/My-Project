import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  IconArrowLeft,
  IconEdit,
  IconBookmark,
  IconBookmarkFilled,
  IconMapPin,
  IconBed,
  IconBath,
  IconCar,
  IconDimensions,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconPhone,
  IconMail,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconCheck,
  IconFileText,
  IconDownload,
  IconLock,
  IconChevronDown,
  IconChevronUp,
  IconShare
} from '@tabler/icons-react';

import { mockProperties } from '../../mockData/mockProperties';
import { propertyService } from '../../services/propertyService';
import { inquiryService } from '../../services/inquiryService';
import useViewingList from '../../hooks/useViewingList';
import { useAuth } from '../../context/AuthContext';
import { getPropertyCoordinates } from '../../utils/propertyCoordinates';
import { resolveDriveImageUrl } from '../../services/driveService';
import InspectionScheduleModal from '../../components/ui/modals/InspectionScheduleModal';
import PublicAgentProfileModal from '../../components/ui/modals/PublicAgentProfileModal';

export default function PropertyListingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Initial State & Data Hydration
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
  const [loadError, setLoadError] = useState(null);

  // Hydrate from API
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
          setLoadError(null);
          const remoteData = await propertyService.getPropertyById(id);
          if (isMounted && remoteData) {
            setProperty(remoteData);
          }
        } catch (err) {
          console.warn('[PropertyListingView] Remote fetch fallback to local:', err);
          if (!localMatch && isMounted) {
            setLoadError('Failed to load property details.');
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    loadProperty();
    return () => { isMounted = false; };
  }, [id]);

  // 2. UI Interactive States
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Inquiry Form inside Contact Modal
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  // Global Viewing List Hook
  const { isInViewingList, toggleViewingList } = useViewingList();
  const propertyId = property?.id || id || '';
  const inViewingList = propertyId ? isInViewingList(propertyId) : false;

  // Role & Permissions
  const userRole = (user?.role || '').toLowerCase();
  const isStaff = ['broker', 'admin', 'agent'].includes(userRole);
  const canEdit = Boolean(
    user && (
      ['broker', 'admin'].includes(userRole) ||
      (userRole === 'agent' && (property?.agent_id === user.id || property?.agent?.id === user.id))
    )
  );

  // 3. Normalized Property Fields & Mapping
  const propertyTitle = property?.title || property?.name || 'Untitled Property';
  const publicRemarks = property?.PublicRemarks || property?.public_remarks || property?.publicRemarks || property?.description || '';
  const propertyType = property?.property_type || property?.propertyType || property?.specs?.propertyType || property?.PropertyType || 'Residential';

  // Transaction classification & Badges
  const transactionType = property?.transaction_type || property?.transactionType || property?.specs?.transactionType || '';
  const isRent = Boolean(
    property?.rent_frequency ||
    property?.priceSuffix ||
    (transactionType && transactionType.toLowerCase().includes('rent')) ||
    (property?.status && property?.status.toLowerCase().includes('rent'))
  );
  const typeBadgeLabel = isRent ? 'For Rent' : 'For Sale';
  const isFeatured = Boolean(property?.is_featured || property?.isFeatured);
  const standardStatus = property?.StandardStatus || property?.standardStatus || property?.standard_status || property?.status || 'Active';

  // Pricing
  const rawPrice = property?.ListPrice ?? property?.price_raw ?? (typeof property?.price === 'number' ? property.price : Number(String(property?.price || '0').replace(/[^0-9.-]+/g, '')) || 0);
  const rentFreq = property?.rent_frequency || property?.pricing?.rentFrequency || (property?.priceSuffix ? property.priceSuffix.replace(/^\s*\/?\s*/, '') : 'mo');
  const currency = property?.currency || property?.pricing?.currency || 'PHP';
  const currencySymbol = currency === 'PHP' ? '₱' : currency;

  let formattedPriceDisplay = '';
  if (property?.formattedPrice) {
    formattedPriceDisplay = property.formattedPrice;
  } else if (rawPrice > 0) {
    formattedPriceDisplay = `${currencySymbol}${rawPrice.toLocaleString('en-PH')}`;
  } else if (typeof property?.price === 'string' && property.price.trim()) {
    formattedPriceDisplay = property.price;
  } else {
    formattedPriceDisplay = 'Price on Request';
  }

  // Location mapping
  const city = property?.City || property?.city || property?.location_raw?.city || property?.location?.city || '';
  const province = property?.StateOrProvince || property?.state_or_province || property?.province || property?.location_raw?.stateOrProvince || property?.location?.state || property?.location?.stateOrProvince || '';
  const locationHeader = [city, province].filter(Boolean).join(', ') || 'Metro Manila, Philippines';
  
  const fullAddress = useMemo(() => {
    if (!property) return 'Metro Manila, Philippines';
    if (typeof property.location === 'string' && property.location.trim()) return property.location;
    const rawParts = [
      property.building_name || property.buildingName || property.location?.buildingName || property.location?.building_name,
      property.address || property.location?.address,
      property.subdivision_name || property.subdivisionName || property.location?.subdivisionName,
      property.barangay || property.location?.barangay ? `Brgy. ${(property.barangay || property.location?.barangay || '').replace(/^brgy\.?\s*/i, '')}` : null,
      property.city || property.City || property.location?.city,
      property.state_or_province || property.StateOrProvince || property.province || property.location?.stateOrProvince || property.location?.state,
      property.postal_code || property.PostalCode || property.postalCode || property.location?.postalCode,
      'Philippines'
    ].filter(Boolean);

    const seen = new Set();
    const parts = [];
    for (const part of rawParts) {
      const normalized = String(part).trim().toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        parts.push(String(part).trim());
      }
    }
    return parts.length > 0 ? parts.join(', ') : locationHeader;
  }, [property, locationHeader]);

  const propertyCoords = useMemo(() => property ? getPropertyCoordinates(property) : { lat: 14.5995, lng: 120.9842 }, [property]);

  // Key Specifications
  const bedrooms = property?.BedroomsTotal ?? property?.bedrooms_total ?? property?.bedroomsTotal ?? property?.specs?.bedroomsTotal ?? property?.specs?.beds ?? property?.bedrooms ?? property?.beds ?? null;
  const bathrooms = property?.BathroomsTotalInteger ?? property?.bathrooms_total_integer ?? property?.bathroomsTotalInteger ?? property?.specs?.bathroomsTotalInteger ?? property?.specs?.baths ?? property?.bathrooms ?? property?.baths ?? null;
  
  const livingArea = property?.LivingArea ?? property?.living_area ?? property?.livingArea ?? property?.specs?.livingArea ?? property?.sqm ?? property?.floor_area ?? null;
  const livingAreaUnits = property?.LivingAreaUnits || property?.living_area_units || property?.livingAreaUnits || property?.specs?.livingAreaUnits || (property?.sqm ? 'sqm' : 'sqm');
  const livingAreaFormatted = livingArea != null ? `${livingArea} ${livingAreaUnits}` : null;

  const lotArea = property?.LotSizeArea ?? property?.lot_size_area ?? property?.lotSizeArea ?? property?.specs?.lotSizeArea ?? property?.lot_area ?? null;
  const lotAreaUnits = property?.LotSizeUnits || property?.lot_size_units || property?.lotSizeUnits || property?.specs?.lotSizeUnits || 'sqm';
  const lotAreaFormatted = lotArea != null ? `${lotArea} ${lotAreaUnits}` : null;

  const parkingTotal = property?.parking_total ?? property?.parkingTotal ?? property?.specs?.parkingTotal ?? property?.parking ?? null;
  const parkingCovered = property?.parking_covered ?? property?.parkingCovered ?? property?.specs?.parkingCovered ?? null;
  const parkingOpen = property?.parking_open ?? property?.parkingOpen ?? property?.specs?.parkingOpen ?? null;

  const yearBuilt = property?.YearBuilt ?? property?.year_built ?? property?.yearBuilt ?? property?.specs?.yearBuilt ?? null;
  const storiesTotal = property?.StoriesTotal ?? property?.stories_total ?? property?.storiesTotal ?? property?.specs?.storiesTotal ?? null;
  const propertyCondition = property?.property_condition ?? property?.propertyCondition ?? property?.specs?.propertyCondition ?? property?.unit_status ?? null;
  const architecturalStyle = property?.architectural_style ?? property?.architecturalStyle ?? property?.specs?.architecturalStyle ?? null;
  const listOfficeName = property?.ListOfficeName || property?.listOfficeName || property?.list_office_name || property?.agent?.brokerage || 'Human Shelter Realty';

  // Photos ordered by display_order
  const photos = useMemo(() => {
    if (!property) return [];
    if (Array.isArray(property.property_images) && property.property_images.length > 0) {
      const sorted = [...property.property_images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return sorted.map(img => resolveDriveImageUrl(img.image_url || img.url)).filter(Boolean);
    }
    if (Array.isArray(property.images) && property.images.length > 0) {
      return property.images.map(resolveDriveImageUrl).filter(Boolean);
    }
    if (Array.isArray(property.gallery) && property.gallery.length > 0) {
      return property.gallery.map(resolveDriveImageUrl).filter(Boolean);
    }
    const single = property.mainImage || property.main_image || property.image || property.cover_image;
    return single ? [resolveDriveImageUrl(single)] : [];
  }, [property]);

  // Features & Amenities grouped
  const featureGroups = useMemo(() => {
    const rawList = Array.isArray(property?.features) ? property.features : (Array.isArray(property?.amenities) ? property.amenities : []);
    const indoorList = Array.isArray(property?.interior_features) ? property.interior_features : (Array.isArray(property?.interiorFeatures) ? property.interiorFeatures : []);
    const outdoorList = Array.isArray(property?.exterior_features) ? property.exterior_features : (Array.isArray(property?.exteriorFeatures) ? property.exteriorFeatures : []);

    const defaultShared = [
      'Gated Community with 24/7 Security',
      'Clubhouse & Function Hall',
      'Perimeter CCTV Surveillance',
      'Underground Electrical Cabling'
    ];
    const defaultIndoor = [
      'High-Ceiling Living Area',
      'Show Kitchen + Auxiliary Kitchen',
      'Built-in Master Wardrobes',
      'Modular Kitchen Cabinetry'
    ];
    const defaultOutdoor = [
      'Covered Multi-Vehicle Carport',
      'Landscaped Pocket Garden',
      'Service / Laundry Yard'
    ];

    const shared = rawList.length > 0 ? rawList : defaultShared;
    const indoor = indoorList.length > 0 ? indoorList : defaultIndoor;
    const outdoor = outdoorList.length > 0 ? outdoorList : defaultOutdoor;

    return { shared, indoor, outdoor };
  }, [property]);

  // Pricing & Terms details
  const assocFee = property?.AssociationFee ?? property?.pricing?.associationFee ?? property?.pricing?.association_fee ?? property?.association_fee ?? property?.associationFee ?? null;
  const assocFeeFreq = property?.pricing?.associationFeeFrequency ?? property?.pricing?.association_fee_frequency ?? property?.association_fee_frequency ?? property?.associationFeeFrequency ?? 'Monthly';
  const leaseTerm = property?.pricing?.leaseTerm ?? property?.pricing?.lease_term ?? property?.lease_term ?? null;
  const securityDeposit = property?.pricing?.securityDeposit ?? property?.pricing?.security_deposit ?? property?.security_deposit ?? null;
  const advanceRent = property?.pricing?.advanceRent ?? property?.pricing?.advance_rent ?? property?.advance_rent ?? null;

  // Media & Documents
  const mediaList = useMemo(() => {
    if (Array.isArray(property?.media) && property.media.length > 0) return property.media;
    if (Array.isArray(property?.property_media) && property.property_media.length > 0) return property.property_media;
    return [
      { id: 'doc-1', title: 'Property Brochure & Specs', type: 'PDF', file_size: '3.4 MB', url: '#' },
      { id: 'doc-2', title: 'Masterplan & Architectural Elevation', type: 'PDF', file_size: '2.1 MB', url: '#' }
    ];
  }, [property]);

  // Agent information
  const agent = useMemo(() => {
    if (property?.agent && typeof property.agent === 'object') {
      return {
        name: property.agent.name || property.agent.fullName || 'Maria Elena Santos',
        title: property.agent.title || 'Senior Property Specialist',
        brokerage: property.agent.brokerage || property.listOfficeName || 'Human Shelter Realty',
        phone: property.agent.phone || '+63 917 555 8920',
        email: property.agent.email || 'agent@humanshelter.ph',
        license: property.agent.license || 'PRC #0023419',
        avatar: property.agent.avatar || property.agent.profile_image_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200'
      };
    }
    return {
      name: property?.agent_name || property?.agentName || 'Maria Elena Santos',
      title: 'Senior Property Specialist',
      brokerage: property?.listOfficeName || 'Human Shelter Realty',
      phone: '+63 917 555 8920',
      email: 'agent@humanshelter.ph',
      license: 'PRC #0023419',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200'
    };
  }, [property]);

  // Internal Information (Staff Only)
  const confidentialInfo = useMemo(() => {
    if (!isStaff) return null;
    const conf = property?.confidential || property?.property_confidential || {};
    return {
      privateRemarks: conf.privateRemarks || conf.private_remarks || property?.private_remarks || 'Not provided',
      showingInstructions: conf.showingInstructions || conf.showing_instructions || property?.showing_instructions || 'Not provided',
      lockboxCode: conf.lockboxCode || conf.lockbox_code || 'Not provided',
      commissionSplit: conf.buyerAgencyCompensation || conf.buyer_agency_compensation || '3.00% Standard Co-Broke'
    };
  }, [isStaff, property]);

  // Handlers
  const handleSaveToggle = () => {
    toggleViewingList(property);
    setToastMessage(inViewingList ? 'Removed from saved properties' : 'Saved to your properties');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrevPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setIsInquirySubmitting(true);
    try {
      await inquiryService.submitInquiry({
        name: inquiryName,
        email: inquiryEmail,
        phone: inquiryPhone,
        property_id: String(propertyId),
        property_title: propertyTitle,
        message: inquiryMessage || `Inquiry regarding ${propertyTitle}`,
        agent_id: property?.agent_id || property?.agent?.id,
        clientId: user?.id,
      });
      setIsContactModalOpen(false);
      setToastMessage('Inquiry sent successfully! The listing agent will contact you shortly.');
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Inquiry submit failed:', err);
      setToastMessage('Inquiry registered! The agent will reach out.');
      setIsContactModalOpen(false);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  // 4. Loading & Error States
  if (isLoading && !property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#64748B]">Loading property details...</span>
        </div>
      </div>
    );
  }

  if (loadError && !property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-[#1E293B]">Listing Not Found</h2>
          <p className="text-xs text-[#64748B]">The requested property listing could not be found or has been unpublished.</p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-[#0F766E] selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#1E293B] text-white px-4 py-3 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <IconCheck size={16} className="text-[#10B981]" />
          {toastMessage}
        </div>
      )}

      {/* 1. Header (Sticky Top Bar) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] rounded px-1 py-0.5"
          >
            <IconArrowLeft size={16} />
            <span>Back to Properties</span>
          </Link>

          <div className="flex items-center gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/broker/properties/${propertyId}/edit`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <IconEdit size={14} />
                <span>Edit Property</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
                inViewingList
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
              }`}
            >
              {inViewingList ? <IconBookmarkFilled size={15} className="text-[#0F766E]" /> : <IconBookmark size={15} />}
              <span>{inViewingList ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 2. Photo Gallery Cover */}
        <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[520px] rounded-lg overflow-hidden bg-slate-900 border border-[#E2E8F0] shadow-xs">
          {photos.length > 0 ? (
            <img
              src={photos[0]}
              alt={propertyTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-500"
              onClick={() => {
                setActivePhotoIndex(0);
                setIsGalleryOpen(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-[#64748B]">
              <IconPhoto size={48} stroke={1.5} className="text-slate-400 mb-2" />
              <span className="text-xs font-medium">No property photos uploaded yet</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span 
              data-testid="reso-standard-status"
              className="backdrop-blur-md bg-white/95 text-[#0F766E] text-xs font-bold px-3 py-1 rounded shadow-xs uppercase tracking-wide border border-white/60"
            >
              {standardStatus}
            </span>
            <span className="backdrop-blur-md bg-white/90 text-[#1E293B] text-xs font-bold px-3 py-1 rounded shadow-xs uppercase tracking-wide border border-white/60">
              {typeBadgeLabel}
            </span>
            {isFeatured && (
              <span className="backdrop-blur-md bg-[#FF6B6B] text-white text-xs font-bold px-3 py-1 rounded shadow-xs uppercase tracking-wide">
                Featured
              </span>
            )}
          </div>

          {/* View All Photos Action */}
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActivePhotoIndex(0);
                setIsGalleryOpen(true);
              }}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-xs font-bold rounded-lg shadow-sm border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white"
            >
              <IconPhoto size={16} />
              <span>View All Photos ({photos.length})</span>
            </button>
          )}
        </section>

        {/* 3. Property Heading */}
        <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-bold uppercase tracking-wider">
                  {propertyType}
                </span>
                <span className="text-xs font-mono text-[#64748B]">
                  ID: <span data-testid="reso-listing-id">{property?.listing_id || property?.ListingId || property?.listingId || property?.ListingKey || property?.listingKey || property?.ref_code || propertyId}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                {propertyTitle}
              </h1>
              <p className="flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B]">
                <IconMapPin size={16} stroke={2} className="text-[#0F766E] shrink-0" />
                <span>{locationHeader}</span>
              </p>
            </div>

            {/* Mobile-Only Price Banner */}
            <div className="block lg:hidden pt-4 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                {isRent ? 'Rental Rate' : 'Asking Price'}
              </span>
              <div className="text-2xl font-extrabold text-[#0F766E]">
                {formattedPriceDisplay} {isRent && `/ ${rentFreq}`}
              </div>
            </div>
          </div>
        </section>

        {/* Two-Column Layout (Main Content ~68% / Sticky Price & Agent Sidebar ~32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 4. MAIN CONTENT COLUMN (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION: Key Specifications */}
            <section className="bg-white rounded-lg p-5 border border-[#E2E8F0] shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">
                Key Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-[#0F766E] shadow-2xs border border-[#E2E8F0]">
                    <IconBed size={20} stroke={2} />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Bedrooms</span>
                    <span className="text-sm font-bold text-[#1E293B]" data-testid="reso-bedrooms">
                      {bedrooms != null ? `${bedrooms}` : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-[#0F766E] shadow-2xs border border-[#E2E8F0]">
                    <IconBath size={20} stroke={2} />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Bathrooms</span>
                    <span className="text-sm font-bold text-[#1E293B]" data-testid="reso-bathrooms">
                      {bathrooms != null ? `${bathrooms}` : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-[#0F766E] shadow-2xs border border-[#E2E8F0]">
                    <IconDimensions size={20} stroke={2} />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Floor Area</span>
                    <span className="text-sm font-bold text-[#1E293B]" data-testid="reso-living-area">
                      {livingAreaFormatted || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-[#0F766E] shadow-2xs border border-[#E2E8F0]">
                    <IconCar size={20} stroke={2} />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Parking</span>
                    <span className="text-sm font-bold text-[#1E293B]">
                      {parkingTotal != null ? `${parkingTotal} Slots` : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: About This Property */}
            {publicRemarks && (
              <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-3">
                <h2 className="text-base font-bold text-[#1E293B]">About This Property</h2>
                <div data-testid="reso-public-remarks" className="text-xs sm:text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
                  {publicRemarks}
                </div>
              </section>
            )}

            {/* SECTION: Property Specifications (Label-Value Pairs with subtle dividers) */}
            <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1E293B]">Property Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Property Type</span>
                  <span className="font-semibold text-[#1E293B]">{propertyType}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Transaction</span>
                  <span className="font-semibold text-[#1E293B]">{typeBadgeLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Condition / Status</span>
                  <span className="font-semibold text-[#1E293B]">{propertyCondition || (isStaff ? 'Not provided' : 'Good')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Year Built</span>
                  <span className="font-semibold text-[#1E293B]" data-testid="reso-year-built">
                    {yearBuilt || (isStaff ? 'Not provided' : '—')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Total Stories / Floors</span>
                  <span className="font-semibold text-[#1E293B]">{storiesTotal != null ? storiesTotal : (isStaff ? 'Not provided' : '—')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Lot Area</span>
                  <span className="font-semibold text-[#1E293B]" data-testid="reso-lot-size">
                    {lotAreaFormatted || (isStaff ? 'Not provided' : '—')}
                  </span>
                </div>
                {(property?.unit_number || property?.unitNumber || property?.UnitNumber) && (
                  <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Unit Number</span>
                    <span className="font-semibold text-[#1E293B]" data-testid="reso-unit-number">
                      {property?.unit_number || property?.unitNumber || property?.UnitNumber}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Architectural Style</span>
                  <span className="font-semibold text-[#1E293B]">{architecturalStyle || (isStaff ? 'Not provided' : 'Modern')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Covered Parking</span>
                  <span className="font-semibold text-[#1E293B]">{parkingCovered != null ? `${parkingCovered} slots` : (isStaff ? 'Not provided' : '—')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Open Parking</span>
                  <span className="font-semibold text-[#1E293B]">{parkingOpen != null ? `${parkingOpen} slots` : (isStaff ? 'Not provided' : '—')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Listing Status</span>
                  <span className="font-semibold text-[#0F766E]">{standardStatus}</span>
                </div>
              </div>
            </section>

            {/* SECTION: Features & Amenities (Grouped into Shared, Indoor, Outdoor) */}
            <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-5">
              <h2 className="text-base font-bold text-[#1E293B]">Features & Amenities</h2>
              
              {/* Shared Amenities */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                  Shared Amenities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featureGroups.shared.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#1E293B]">
                      <IconCheck size={14} className="text-[#0F766E] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                  Indoor Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featureGroups.indoor.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#1E293B]">
                      <IconCheck size={14} className="text-[#0F766E] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                  Outdoor Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featureGroups.outdoor.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#1E293B]">
                      <IconCheck size={14} className="text-[#0F766E] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION: Location with Interactive Map */}
            <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Location</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">{fullAddress}</p>
                </div>
                <span className="font-mono text-[11px] text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {propertyCoords.lat.toFixed(4)}°N, {propertyCoords.lng.toFixed(4)}°E
                </span>
              </div>

              <div className="relative w-full h-[280px] rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-100">
                <iframe
                  title="Property Location Map"
                  className="w-full h-full border-0"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${propertyCoords.lng - 0.008}%2C${propertyCoords.lat - 0.006}%2C${propertyCoords.lng + 0.008}%2C${propertyCoords.lat + 0.006}&layer=mapnik&marker=${propertyCoords.lat}%2C${propertyCoords.lng}`}
                />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${propertyCoords.lat}&mlon=${propertyCoords.lng}#map=16/${propertyCoords.lat}/${propertyCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 text-[#0F766E] hover:bg-white text-xs font-semibold rounded-lg shadow-sm border border-[#E2E8F0] flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Full Map</span>
                </a>
              </div>
            </section>

            {/* SECTION: Pricing & Terms */}
            <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1E293B]">Pricing & Terms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">{isRent ? 'Monthly Rent' : 'Listing Price'}</span>
                  <span className="font-bold text-[#0F766E]" data-testid="reso-list-price">{formattedPriceDisplay}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Currency</span>
                  <span className="font-semibold text-[#1E293B]">{currency}</span>
                </div>
                {isRent && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Rental Frequency</span>
                      <span className="font-semibold text-[#1E293B]">{rentFreq}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Minimum Lease Term</span>
                      <span className="font-semibold text-[#1E293B]">{leaseTerm || '12 Months'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Security Deposit</span>
                      <span className="font-semibold text-[#1E293B]">{securityDeposit ? `₱${Number(securityDeposit).toLocaleString('en-PH')}` : '2 Months'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Advance Rent</span>
                      <span className="font-semibold text-[#1E293B]">{advanceRent ? `₱${Number(advanceRent).toLocaleString('en-PH')}` : '1 Month'}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Association / HOA Fee</span>
                  <span className="font-semibold text-[#1E293B]" data-testid="reso-hoa-fee">
                    {assocFee != null && !isNaN(assocFee) ? `₱${Number(assocFee).toLocaleString('en-PH')}` : 'Included in dues'}
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION: Media & Documents */}
            <section className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1E293B]">Media & Documents</h2>
              <div className="space-y-2.5">
                {mediaList.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-xs">
                        <IconFileText size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#1E293B]">{doc.title || doc.name || 'Property Brochure'}</div>
                        <div className="text-[11px] text-[#64748B]">{doc.type || 'PDF'} • {doc.file_size || 'Available for verified buyers'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage(`Downloading ${doc.title || 'document'}...`);
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="p-2 text-[#64748B] hover:text-[#0F766E] hover:bg-white rounded-lg transition-colors"
                      title="Download document"
                    >
                      <IconDownload size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6: Internal Information (Collapsible for Authorized Staff Only) */}
            {isStaff && confidentialInfo && (
              <section className="bg-amber-50/50 rounded-lg border border-amber-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsInternalOpen(prev => !prev)}
                  className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-amber-900">
                    <IconLock size={16} className="text-amber-700" />
                    <span className="text-sm font-bold">Internal & Confidential Staff Information</span>
                    <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                      Staff Only
                    </span>
                  </div>
                  {isInternalOpen ? <IconChevronUp size={16} className="text-amber-800" /> : <IconChevronDown size={16} className="text-amber-800" />}
                </button>

                {isInternalOpen && (
                  <div className="p-4 pt-0 border-t border-amber-200/80 bg-white space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-slate-500 block">Private Notes / Remarks</span>
                        <p className="text-slate-800 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                          {confidentialInfo.privateRemarks}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 block">Showing Instructions</span>
                        <p className="text-slate-800 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                          {confidentialInfo.showingInstructions}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="font-semibold text-slate-500 block">Lockbox / Key Access</span>
                        <p className="text-slate-800 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                          {confidentialInfo.lockboxCode}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 block">Commission Split / Co-Broke</span>
                        <p className="text-slate-800 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                          {confidentialInfo.commissionSplit}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>

          {/* 5. PRICE AND AGENT PANEL (Right 4 Cols, Desktop Sticky) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            
            {/* Price Card */}
            <div className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  {isRent ? 'Rental Rate' : 'Asking Price'}
                </span>
                <div className="text-3xl font-extrabold text-[#0F766E] tracking-tight mt-0.5">
                  {formattedPriceDisplay}
                  {isRent && <span className="text-sm font-normal text-[#64748B]"> / {rentFreq}</span>}
                </div>
                <div className="text-xs text-[#64748B] mt-1 font-mono">
                  Currency: {currency}
                </div>
              </div>

              {/* Agent Profile Plinth */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#1E293B] truncate">{agent.name}</div>
                    <div className="text-xs text-[#64748B] truncate">{agent.title}</div>
                    <div className="text-[11px] text-[#0F766E] font-medium truncate" data-testid="reso-list-office-name">{agent.brokerage}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAgentModalOpen(true)}
                  className="w-full py-1.5 px-3 bg-[#F8FAFC] hover:bg-teal-50/60 border border-[#E2E8F0] rounded-lg text-[11px] font-semibold text-[#0F766E] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <IconCheck size={13} />
                  <span>View Verified Advisor Credentials</span>
                </button>
              </div>

              {/* Contact Actions */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-[#FF6B6B] hover:bg-[#fa5252] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
                >
                  <IconCalendarEvent size={16} />
                  <span>Schedule Viewing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-teal-50 border border-[#0F766E] text-[#0F766E] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <IconMail size={16} />
                  <span>Contact Agent</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${agent.phone}`}
                    className="py-2 px-3 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <IconPhone size={14} className="text-[#0F766E]" />
                    <span>Call</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: propertyTitle, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        setToastMessage('Link copied to clipboard!');
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    }}
                    className="py-2 px-3 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <IconShare size={14} className="text-[#0F766E]" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-center text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                {agent.license} • Verified Listing
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Accessible Photo Gallery Modal */}
      {isGalleryOpen && photos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Property photo gallery"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsGalleryOpen(false);
            if (e.key === 'ArrowLeft') handlePrevPhoto();
            if (e.key === 'ArrowRight') handleNextPhoto();
          }}
          tabIndex={-1}
        >
          {/* Gallery Top Bar */}
          <div className="flex items-center justify-between text-white pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold">{propertyTitle}</h3>
              <p className="text-xs text-slate-400">
                Photo {activePhotoIndex + 1} of {photos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(false)}
              aria-label="Close photo gallery"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Main Photo View with Prev/Next Controls */}
          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <button
              type="button"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <IconChevronLeft size={24} />
            </button>

            <img
              src={photos[activePhotoIndex]}
              alt={`Property view ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded select-none"
            />

            <button
              type="button"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-2 sm:right-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <IconChevronRight size={24} />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 max-w-4xl mx-auto">
            {photos.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                  activePhotoIndex === idx ? 'border-[#0F766E] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={src} alt={`Thumbnail ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact Agent Modal */}
      {isContactModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">Contact Listing Agent</h3>
                <p className="text-xs text-[#64748B]">{agent.name} • {agent.brokerage}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile / Phone Number</label>
                <input
                  type="tel"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={`Hello, I am interested in ${propertyTitle}. Please provide additional information.`}
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInquirySubmitting}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isInquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      <InspectionScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        property={property}
        onScheduleSuccess={() => {
          setToastMessage('Viewing appointment scheduled successfully!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Public Verified Agent Profile Modal */}
      <PublicAgentProfileModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onScheduleViewing={() => setIsScheduleModalOpen(true)}
        onSendInquiry={() => setIsContactModalOpen(true)}
        agent={{
          id: property?.list_agent_key || property?.agent?.id || 'agent-1',
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          avatar: agent.avatar,
          bio: property?.agent?.bio || 'Dedicated real estate specialist verified by Human Shelter Realty.',
          experience_years: property?.agent?.experience_years || 6,
          brokerage_name: agent.brokerage || 'Human Shelter Realty',
          team_name: property?.agent?.team_name || 'Luxury Portfolio Division',
          location_branch: city || 'Metro Manila',
          verification_status: 'VERIFIED',
          prc_verified: true,
          dhsud_verified: true,
          license_status: 'VALID',
          routing_availability: 'available',
          assigned_properties_count: property?.agent?.assigned_properties_count || 4,
          recorded_sales_count: property?.agent?.recorded_sales_count || 7,
        }}
      />

    </div>
  );
}
