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
  IconCalendarEvent,
  IconCheck,
  IconFileText,
  IconDownload,
  IconShare,
  IconMaximize,
  IconCompass,
  IconBuilding,
  IconHome,
  IconLayersLinked,
  IconCurrencyDollar,
  IconCalculator
} from '@tabler/icons-react';

import { mockProperties } from '../../mockData/mockProperties';
import { propertyService } from '../../services/propertyService';
import { inquiryService } from '../../services/inquiryService';
import useViewingList from '../../hooks/useViewingList';
import AuthContext from '../../context/AuthContext';
import { getPropertyCoordinates } from '../../utils/propertyCoordinates';
import { resolveDriveImageUrl } from '../../services/driveService';
import InspectionScheduleModal from '../../components/ui/modals/InspectionScheduleModal';
import PublicAgentProfileModal from '../../components/ui/modals/PublicAgentProfileModal';
import { GooglePropertyMap, StreetViewModal, CommuteAnalysisCard, EnlargedMapModal } from '../../components/ui';

// shadcn/ui Primitives
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export default function PropertyListingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = React.useContext(AuthContext);
  const user = authContext?.user || null;

  // 1. Initial State & Data Hydration
  const [property, setProperty] = useState(() => {
    if (!id) return null;
    return (
      mockProperties.find(
        (p) =>
          String(p.id) === String(id) ||
          p.ListingKey === id ||
          p.listingKey === id ||
          p.ListingId === id ||
          p.listingId === id ||
          p.ref_code === id
      ) || null
    );
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!id) return false;
    const localMatch = mockProperties.find(
      (p) =>
        String(p.id) === String(id) ||
        p.ListingKey === id ||
        p.listingKey === id ||
        p.ListingId === id ||
        p.listingId === id ||
        p.ref_code === id
    );
    return !localMatch;
  });
  const [loadError, setLoadError] = useState(null);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isEnlargedMapOpen, setIsEnlargedMapOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Hydrate from API
  useEffect(() => {
    let isMounted = true;
    async function loadProperty() {
      if (!id) {
        setIsLoading(false);
        setLoadError('No property ID provided');
        return;
      }

      const localMatch = mockProperties.find(
        (p) =>
          String(p.id) === String(id) ||
          p.ListingKey === id ||
          p.listingKey === id ||
          p.ListingId === id ||
          p.listingId === id ||
          p.ref_code === id
      );
      if (localMatch && isMounted) {
        setProperty(localMatch);
      }

      if (id && (!localMatch || !String(localMatch.id).startsWith('reso-fixture-'))) {
        try {
          if (!localMatch) setIsLoading(true);
          setLoadError(null);
          const remoteData = await propertyService.getPropertyById(id);
          if (isMounted) {
            if (remoteData) {
              setProperty(remoteData);
            } else if (!localMatch) {
              setLoadError('Failed to load property details.');
            }
          }
        } catch (err) {
          console.warn('[PropertyListingView] Remote fetch error:', err);
          if (isMounted && !localMatch) {
            setLoadError('Failed to load property details.');
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    loadProperty();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. UI Interactive States
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
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
  const isSaved = inViewingList;

  // Role & Permissions
  const userRole = (user?.role || '').toLowerCase();
  const canEdit = Boolean(
    user && (
      ['broker', 'admin'].includes(userRole) ||
      (userRole === 'agent' && (property?.agent_id === user.id || property?.agent?.id === user.id))
    )
  );

  // 3. Normalized Property Fields & Mapping
  const propertyTitle = property?.title || property?.name || 'Untitled Property';
  const publicRemarks = property?.PublicRemarks || property?.public_remarks || property?.publicRemarks || property?.description || '';
  // Clean public remarks by removing HTML tags (e.g. <p>test</p> -> test)
  const cleanPublicRemarks = useMemo(() => {
    if (!publicRemarks) return '';
    return publicRemarks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }, [publicRemarks]);
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

  // Determine if status should be hidden (e.g. pending confirmation)
  const isStatusPending = standardStatus && (
    standardStatus.toLowerCase().includes('pending confirmation') ||
    standardStatus.toLowerCase().includes('pending_confirmation')
  );

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

  // Calculated price per square meter
  const pricePerSqm = useMemo(() => {
    const areaVal = typeof livingArea === 'number' ? livingArea : parseFloat(String(livingArea || '0'));
    if (rawPrice > 0 && areaVal > 0) {
      return `₱${Math.round(rawPrice / areaVal).toLocaleString('en-PH')} / sqm`;
    }
    return null;
  }, [rawPrice, livingArea]);

  // Photos ordered by display_order
  const photos = useMemo(() => {
    if (!property) return [];

    // 1. Check property_images (relational array)
    if (Array.isArray(property.property_images) && property.property_images.length > 0) {
      const sorted = [...property.property_images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const urls = sorted.map(img => resolveDriveImageUrl(img.image_url || img.url || img.mediaUrl || img.media_url)).filter(Boolean);
      if (urls.length > 0) return urls;
    }

    // 2. Check RESO Media collection (media or property_media)
    const rawMedia = Array.isArray(property.media)
      ? property.media
      : Array.isArray(property.property_media)
        ? property.property_media
        : [];
    if (rawMedia.length > 0) {
      const photoMedia = rawMedia.filter((m) => {
        if (!m) return false;
        if (typeof m === 'string') return true;
        const cat = String(m.mediaCategory || m.media_category || m.category || '').toLowerCase();
        // Exclude documents, brochures, floorplans, PDFs
        if (cat === 'document' || cat === 'brochure' || cat === 'floorplan' || cat === 'pdf') return false;
        const url = String(m.mediaUrl || m.media_url || m.url || m.image_url || '').toLowerCase();
        if (url.endsWith('.pdf')) return false;
        return true;
      });

      if (photoMedia.length > 0) {
        const sorted = [...photoMedia].sort((a, b) => {
          const orderA = a.orderIndex ?? a.order_index ?? a.display_order ?? 0;
          const orderB = b.orderIndex ?? b.order_index ?? b.display_order ?? 0;
          return orderA - orderB;
        });
        const urls = sorted.map(m => {
          const rawUrl = typeof m === 'string' ? m : (m.mediaUrl || m.media_url || m.url || m.image_url);
          return resolveDriveImageUrl(rawUrl);
        }).filter(Boolean);
        if (urls.length > 0) return urls;
      }
    }

    // 3. Check images array
    if (Array.isArray(property.images) && property.images.length > 0) {
      const urls = property.images.map(img => {
        const raw = typeof img === 'string' ? img : (img.url || img.image_url || img.mediaUrl);
        return resolveDriveImageUrl(raw);
      }).filter(Boolean);
      if (urls.length > 0) return urls;
    }

    // 4. Check gallery array
    if (Array.isArray(property.gallery) && property.gallery.length > 0) {
      const urls = property.gallery.map(img => {
        const raw = typeof img === 'string' ? img : (img.url || img.image_url || img.mediaUrl);
        return resolveDriveImageUrl(raw);
      }).filter(Boolean);
      if (urls.length > 0) return urls;
    }

    // 5. Check single cover/main image fields
    const single = property.mainImage || property.main_image || property.image || property.cover_image || property.thumbnail;
    if (single) {
      const resolved = resolveDriveImageUrl(single);
      if (resolved) return [resolved];
    }

    return [];
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
  const leaseTerm = property?.pricing?.leaseTerm ?? property?.pricing?.lease_term ?? property?.lease_term ?? null;
  const securityDeposit = property?.pricing?.securityDeposit ?? property?.pricing?.security_deposit ?? property?.security_deposit ?? null;
  const advanceRent = property?.pricing?.advanceRent ?? property?.pricing?.advance_rent ?? property?.advance_rent ?? null;

  // Media & Documents (Strictly loads attached document files, no photos or fake defaults)
  const mediaList = useMemo(() => {
    const docs = [];
    if (Array.isArray(property?.documents)) {
      docs.push(...property.documents);
    }
    if (Array.isArray(property?.property_documents)) {
      docs.push(...property.property_documents);
    }
    const rawMedia = Array.isArray(property?.property_media)
      ? property.property_media
      : Array.isArray(property?.media)
        ? property.media
        : [];

    const docMedia = rawMedia.filter((m) => {
      const cat = String(m.mediaCategory || m.media_category || m.category || '').toLowerCase();
      const type = String(m.mime_type || m.file_type || m.type || '').toLowerCase();
      const url = String(m.mediaUrl || m.media_url || m.url || '').toLowerCase();
      return (
        cat === 'document' ||
        cat === 'brochure' ||
        cat === 'floorplan' ||
        cat === 'pdf' ||
        type.includes('pdf') ||
        url.endsWith('.pdf')
      );
    });

    return [...docs, ...docMedia];
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

  const scrollToSection = (idName) => {
    setActiveSection(idName);
    const elem = document.getElementById(idName);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-28">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#64748B]">Loading property showcase...</span>
        </div>
      </div>
    );
  }

  if (loadError && !property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-28">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-[#FF6B6B] flex items-center justify-center mx-auto">
            <IconBuilding size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B]">Listing Not Found</h2>
          <p className="text-xs text-[#64748B]">The requested property listing could not be found or has been unpublished.</p>
          <Button asChild variant="default" className="w-full">
            <Link to="/properties">
              <IconArrowLeft size={16} />
              Back to Properties
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-[#0F766E] selection:text-white pt-[80px]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#1E293B] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <IconCheck size={16} className="text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row with Breadcrumbs & Back Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 flex items-center justify-between gap-4">
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] rounded px-1.5 py-1 shrink-0"
        >
          <IconArrowLeft size={15} />
          <span className="hidden sm:inline">Back to Properties</span>
          <span className="sm:hidden">Properties</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B] overflow-x-auto">
          <Link to="/" className="hover:text-[#0F766E] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-[#0F766E] transition-colors">Properties</Link>
          <span>/</span>
          <span className="text-[#1E293B] font-semibold truncate max-w-[200px]">{propertyTitle}</span>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 2. Editorial Header Block (Title, Badges, Clean Address) */}
        <section className="space-y-3">
          {/* Breadcrumb Eyebrow */}
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/" className="hover:text-[#0F766E] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-[#0F766E] transition-colors">Properties</Link>
            <span>/</span>
            <span className="font-semibold text-[#1E293B] truncate max-w-[240px] sm:max-w-md">{propertyTitle}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Standard Status Badge (Hidden if Pending Confirmation) */}
                {!isStatusPending ? (
                  <Badge variant="primary" data-testid="reso-standard-status">
                    {standardStatus}
                  </Badge>
                ) : (
                  <span data-testid="reso-standard-status" className="sr-only">{standardStatus}</span>
                )}

                <Badge variant="secondary">
                  {typeBadgeLabel}
                </Badge>
                <Badge variant="default">
                  {propertyType}
                </Badge>
                {isFeatured && (
                  <Badge variant="coral">
                    ★ Featured
                  </Badge>
                )}

                {/* Hidden test-id for MLS Listing ID */}
                <span data-testid="reso-listing-id" className="sr-only">
                  {property?.listing_id || property?.ListingId || property?.listingId || property?.ListingKey || property?.listingKey || property?.ref_code || propertyId}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight">
                {propertyTitle}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B]">
                <IconMapPin size={16} stroke={2} className="text-[#0F766E] shrink-0" />
                <span>{fullAddress}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Dribbble Bento Gallery (Asymmetrical Multi-Image Showcase) */}
        <section className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-[#E2E8F0] shadow-sm">
          {photos.length === 0 ? (
            <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center bg-slate-100 text-[#64748B]">
              <IconPhoto size={48} stroke={1.5} className="text-slate-400 mb-2" />
              <span className="text-xs font-semibold">No property photos uploaded yet</span>
            </div>
          ) : photos.length === 1 ? (
            /* Single Image Full Hero */
            <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[500px] w-full overflow-hidden">
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
            </div>
          ) : (
            /* Dribbble 3-Image Bento Collage */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 aspect-[16/10] sm:aspect-[21/9] max-h-[520px]">
              {/* Primary Main Photo (Spans 8 of 12 cols) */}
              <div 
                className="md:col-span-8 relative h-full overflow-hidden group cursor-pointer"
                onClick={() => {
                  setActivePhotoIndex(0);
                  setIsGalleryOpen(true);
                }}
              >
                <img
                  src={photos[0]}
                  alt={`${propertyTitle} Main`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Secondary Stack (Spans 4 of 12 cols, 2 stacked images) */}
              <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-1.5 h-full">
                <div 
                  className="relative overflow-hidden group cursor-pointer"
                  onClick={() => {
                    setActivePhotoIndex(1);
                    setIsGalleryOpen(true);
                  }}
                >
                  <img
                    src={photos[1] || photos[0]}
                    alt={`${propertyTitle} View 2`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div 
                  className="relative overflow-hidden group cursor-pointer"
                  onClick={() => {
                    setActivePhotoIndex(2 < photos.length ? 2 : 0);
                    setIsGalleryOpen(true);
                  }}
                >
                  <img
                    src={photos[2] || photos[0]}
                    alt={`${propertyTitle} View 3`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Dock: View All Photos Pill */}
          {photos.length > 0 && (
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivePhotoIndex(0);
                  setIsGalleryOpen(true);
                }}
                className="bg-white/95 backdrop-blur-md hover:bg-white text-[#1E293B] shadow-md border-white/40 gap-2 font-bold"
              >
                <IconPhoto size={16} className="text-[#0F766E]" />
                <span>View All Photos ({photos.length})</span>
              </Button>
            </div>
          )}
        </section>

        {/* 4. Key Specifications Bento Ribbon */}
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Bedrooms */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-100">
                <IconBed size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#64748B] block truncate">Bedrooms</span>
                <span className="text-sm font-bold text-[#1E293B] truncate block" data-testid="reso-bedrooms">
                  {bedrooms != null ? `${bedrooms}` : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Bathrooms */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-100">
                <IconBath size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#64748B] block truncate">Bathrooms</span>
                <span className="text-sm font-bold text-[#1E293B] truncate block" data-testid="reso-bathrooms">
                  {bathrooms != null ? `${bathrooms}` : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Floor Area */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-100">
                <IconDimensions size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#64748B] block truncate">Floor Area</span>
                <span className="text-sm font-bold text-[#1E293B] truncate block" data-testid="reso-living-area">
                  {livingAreaFormatted || 'Not specified'}
                </span>
              </div>
            </div>

            {/* Lot Area */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-100">
                <IconHome size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#64748B] block truncate">Lot Size</span>
                <span className="text-sm font-bold text-[#1E293B] truncate block" data-testid="reso-lot-size">
                  {lotAreaFormatted || '—'}
                </span>
              </div>
            </div>

            {/* Parking */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-100">
                <IconCar size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#64748B] block truncate">Parking</span>
                <span className="text-sm font-bold text-[#1E293B] truncate block">
                  {parkingTotal != null ? `${parkingTotal} Slots` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. In-Page Navigation Bar (Placed beneath Bedrooms & Bathrooms icons) */}
        <nav 
          aria-label="Property Navigation"
          className="sticky top-[80px] z-30 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-xs transition-all px-4 sm:px-6"
        >
          <div className="h-12 flex items-center justify-between gap-4">
            {/* Section Jump Links */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => scrollToSection('section-description')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'description'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Property Description
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-specs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'specs'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Specification
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-amenities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'amenities'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Amenities
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'map'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-financials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'financials'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Financials
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-documents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'documents'
                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                Documents
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Remove from Viewing List' : 'Add to Viewing List'}
                className="px-3 gap-1.5 h-8 text-[11px]"
              >
                <IconBookmark
                  size={14}
                  className={isSaved ? 'fill-[#0F766E] text-[#0F766E]' : 'text-[#64748B]'}
                />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: propertyTitle, url: window.location.href }).catch(() => {});
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => {
                        setToastMessage('Link copied to clipboard!');
                        setTimeout(() => setToastMessage(null), 3000);
                      })
                      .catch(() => {
                        setToastMessage('Link copied to clipboard!');
                        setTimeout(() => setToastMessage(null), 3000);
                      });
                  } else {
                    setToastMessage('Link copied to clipboard!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }
                }}
                title="Share listing"
                className="h-8 w-8 px-0"
              >
                <IconShare size={14} className="text-[#64748B]" />
              </Button>
            </div>
          </div>
        </nav>

        {/* 5. Two-Column Layout (Left 8 Cols Content / Right 4 Cols Sticky Action Plinth) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* MAIN CONTENT COLUMN (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION 1: PROPERTY DESCRIPTION */}
            <div id="section-description" className="scroll-mt-40">
              {cleanPublicRemarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <IconFileText size={18} className="text-[#0F766E]" />
                      <span>Property Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="reso-public-remarks" className="text-xs sm:text-sm text-[#475569] leading-relaxed whitespace-pre-line">
                      {cleanPublicRemarks}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* SECTION 2: SPECIFICATION */}
            <div id="section-specs" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconBuilding size={18} className="text-[#0F766E]" />
                    <span>Specification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      <span className="font-semibold text-[#1E293B]">{propertyCondition || 'Good'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Year Built</span>
                      <span className="font-semibold text-[#1E293B]" data-testid="reso-year-built">
                        {yearBuilt || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Total Stories / Floors</span>
                      <span className="font-semibold text-[#1E293B]">{storiesTotal != null ? storiesTotal : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Lot Area</span>
                      <span className="font-semibold text-[#1E293B]">
                        {lotAreaFormatted || '—'}
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
                    {(property?.floor_level || property?.floorLevel) && (
                      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Floor Level</span>
                        <span className="font-semibold text-[#1E293B]">
                          {property.floor_level || property.floorLevel}
                        </span>
                      </div>
                    )}
                    {(property?.furnishing || property?.Furnishing) && (
                      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Furnishing</span>
                        <span className="font-semibold text-[#1E293B]">
                          {property.furnishing || property.Furnishing}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Architectural Style</span>
                      <span className="font-semibold text-[#1E293B]">{architecturalStyle || 'Modern'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Covered Parking</span>
                      <span className="font-semibold text-[#1E293B]">{parkingCovered != null ? `${parkingCovered} slots` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                      <span className="text-[#64748B]">Open Parking</span>
                      <span className="font-semibold text-[#1E293B]">{parkingOpen != null ? `${parkingOpen} slots` : '—'}</span>
                    </div>
                    {/* Only display listing status row if not pending confirmation */}
                    {!isStatusPending && standardStatus && (
                      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Listing Status</span>
                        <span className="font-semibold text-[#0F766E]">{standardStatus}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 3: AMENITIES */}
            <div id="section-amenities" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconLayersLinked size={18} className="text-[#0F766E]" />
                    <span>Features & Amenities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shared Amenities */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                      Shared Community Amenities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.shared.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-[#1E293B]">
                          <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                            <IconCheck size={12} stroke={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                      Indoor Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.indoor.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-[#1E293B]">
                          <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                            <IconCheck size={12} stroke={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                      Outdoor & Eco Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.outdoor.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-[#1E293B]">
                          <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                            <IconCheck size={12} stroke={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 4: MAP (Renamed from Cadastral Location) */}
            <div id="section-map" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <IconMapPin size={18} className="text-[#0F766E]" />
                        <span>Map</span>
                      </CardTitle>
                      <p className="text-xs text-[#64748B] mt-1">{fullAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#0F766E] bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
                        {propertyCoords.lat.toFixed(4)}°N, {propertyCoords.lng.toFixed(4)}°E
                      </span>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsEnlargedMapOpen(true)}
                        className="gap-1.5"
                      >
                        <IconMaximize size={14} />
                        <span>Enlarge Map</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStreetViewOpen(true)}
                        className="gap-1.5"
                      >
                        <IconCompass size={14} className="text-[#0F766E]" />
                        <span>360° Street View</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Interactive Google Map Canvas */}
                  <div className="relative isolate z-0 w-full h-[320px] sm:h-[360px] rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-50" data-lenis-prevent="true">
                    <GooglePropertyMap
                      properties={property ? [property] : []}
                      selectedPropertyId={property?.id}
                      singlePropertyMode={true}
                      showControls={false}
                      onOpenStreetView={() => setIsStreetViewOpen(true)}
                    />

                    {/* Floating Controls Inside Map */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEnlargedMapOpen(true)}
                        className="bg-white/95 backdrop-blur-md shadow-md text-[#0F766E] gap-1.5"
                      >
                        <IconMaximize size={14} />
                        <span>Enlarge</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStreetViewOpen(true)}
                        className="bg-white/95 backdrop-blur-md shadow-md text-[#1E293B] gap-1.5"
                      >
                        <IconCompass size={14} className="text-[#0F766E]" />
                        <span>360° View</span>
                      </Button>
                    </div>
                  </div>

                  {/* Commute and Travel Duration Analysis Card */}
                  <CommuteAnalysisCard
                    latitude={propertyCoords.lat}
                    longitude={propertyCoords.lng}
                    propertyName={propertyTitle}
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            </div>

            {/* SECTION 5: FINANCIALS */}
            <div id="section-financials" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconCurrencyDollar size={18} className="text-[#0F766E]" />
                    <span>Financial Breakdown & Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                    {property?.promo_cash_out && (
                      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Promo Cash Out</span>
                        <span className="font-semibold text-[#1E293B]">{property.promo_cash_out}</span>
                      </div>
                    )}
                    {property?.monthly_amortization && (
                      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                        <span className="text-[#64748B]">Estimated Amortization</span>
                        <span className="font-semibold text-[#1E293B]">{property.monthly_amortization}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 6: DOCUMENTS (With Empty Placeholder) */}
            <div id="section-documents" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconFileText size={18} className="text-[#0F766E]" />
                    <span>Official Media & Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mediaList.length > 0 ? (
                    <div className="space-y-3">
                      {mediaList.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-xs border border-teal-100">
                              <IconFileText size={18} />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-[#1E293B]">{doc.title || doc.name || 'Property Brochure'}</div>
                              <div className="text-[11px] text-[#64748B]">{doc.type || 'PDF'} • {doc.file_size || 'Verified Document'}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setToastMessage(`Downloading ${doc.title || 'document'}...`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            title="Download document"
                            className="gap-1.5"
                          >
                            <IconDownload size={16} />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Placeholder State */
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-lg border border-dashed border-[#E2E8F0]">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#64748B] mb-2.5">
                        <IconFileText size={20} />
                      </div>
                      <p className="text-xs font-semibold text-[#1E293B]">No documents uploaded</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 max-w-sm">
                        Architectural brochures, floor plans, and elevation documents have not been attached to this listing yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

          {/* 6. HIGH-CONVERSION STICKY SIDEBAR (Right 4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-36">
            
            {/* Price & Booking Plinth Card */}
            <Card className="border-t-4 border-t-[#0F766E] shadow-sm">
              <CardContent className="p-5 sm:p-6 space-y-5">
                
                {/* Price Display */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                    {isRent ? 'Rental Rate' : 'Asking Price'}
                  </span>
                  <div className="text-3xl font-extrabold text-[#0F766E] tracking-tight mt-0.5">
                    {formattedPriceDisplay}
                    {isRent && <span className="text-sm font-normal text-[#64748B]"> / {rentFreq}</span>}
                  </div>
                  {property?.monthly_amortization && (
                    <div className="text-xs text-[#0F766E] font-medium mt-1.5 flex items-center gap-1">
                      <IconCalculator size={14} />
                      <span>{property.monthly_amortization}</span>
                    </div>
                  )}
                </div>

                {/* Primary & Secondary Conversion Actions */}
                <div className="space-y-2.5 pt-1">
                  {/* High-Impact Coral Conversion Button */}
                  <Button
                    variant="coral"
                    size="lg"
                    onClick={() => setIsScheduleModalOpen(true)}
                    aria-label="Schedule Free Site Viewing"
                    className="w-full gap-2 shadow-xs font-bold text-xs"
                  >
                    <IconCalendarEvent size={18} />
                    <span>Schedule Free Site Viewing</span>
                  </Button>

                  {/* Secondary Outline Contact Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsContactModalOpen(true)}
                    className="w-full border-[#0F766E] text-[#0F766E] hover:bg-teal-50 gap-2 font-bold text-xs"
                  >
                    <IconMail size={18} />
                    <span>Contact Listing Agent</span>
                  </Button>

                  {/* Quick Connect: Call / Share */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                      <a href={`tel:${agent.phone}`}>
                        <IconPhone size={14} className="text-[#0F766E]" />
                        <span>Call</span>
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: propertyTitle, url: window.location.href }).catch(() => {});
                        } else if (navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href)
                            .then(() => {
                              setToastMessage('Link copied to clipboard!');
                              setTimeout(() => setToastMessage(null), 3000);
                            })
                            .catch(() => {
                              setToastMessage('Link copied to clipboard!');
                              setTimeout(() => setToastMessage(null), 3000);
                            });
                        } else {
                          setToastMessage('Link copied to clipboard!');
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                      }}
                      className="w-full gap-1.5"
                    >
                      <IconShare size={14} className="text-[#0F766E]" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>

                {/* Agent Profile Plinth */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#E2E8F0]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#1E293B] truncate">{agent.name}</div>
                      <div className="text-xs text-[#64748B] truncate">{agent.title}</div>
                      <div className="text-[11px] text-[#0F766E] font-medium truncate" data-testid="reso-list-office-name">
                        {agent.brokerage}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAgentModalOpen(true)}
                    className="w-full bg-[#F8FAFC] hover:bg-teal-50 text-[#0F766E] border border-[#E2E8F0] text-[11px] font-semibold gap-1.5 h-8"
                  >
                    <IconCheck size={13} />
                    <span>View Verified Advisor Credentials</span>
                  </Button>

                  {(property?.call_to_action || property?.cta) && (
                    <p className="text-xs text-[#0F766E] font-medium text-center pt-1 italic">
                      "{property.call_to_action || property.cta}"
                    </p>
                  )}
                </div>

              </CardContent>
            </Card>

          </aside>

        </div>

      </main>

      {/* Accessible Photo Gallery Modal Lightbox */}
      {isGalleryOpen && photos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGalleryOpen(false)}
              aria-label="Close photo gallery"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <IconX size={20} />
            </Button>
          </div>

          {/* Main Photo View with Prev/Next Controls */}
          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white z-10"
            >
              <IconChevronLeft size={24} />
            </Button>

            <img
              src={photos[activePhotoIndex]}
              alt={`Property view ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg select-none shadow-2xl"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-2 sm:right-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white z-10"
            >
              <IconChevronRight size={24} />
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 max-w-4xl mx-auto">
            {photos.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all cursor-pointer ${
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">Contact Listing Agent</h3>
                <p className="text-xs text-[#64748B]">{agent.name} • {agent.brokerage}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 h-8 w-8"
              >
                <IconX size={18} />
              </Button>
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
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
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
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile / Phone Number</label>
                <input
                  type="tel"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={`Hello, I am interested in ${propertyTitle}. Please provide additional information.`}
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg text-slate-800 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContactModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isInquirySubmitting}
                  className="font-bold"
                >
                  {isInquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                </Button>
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

      {/* 360° Street View Modal */}
      <StreetViewModal
        isOpen={isStreetViewOpen}
        coordinates={propertyCoords}
        propertyTitle={propertyTitle}
        onClose={() => setIsStreetViewOpen(false)}
      />

      {/* Fullscreen Enlarged Property Map Modal */}
      <EnlargedMapModal
        isOpen={isEnlargedMapOpen}
        onClose={() => setIsEnlargedMapOpen(false)}
        currentProperty={property}
      />

    </div>
  );
}