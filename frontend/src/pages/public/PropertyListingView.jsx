import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  Maximize2,
  Share2,
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Route,
  TrainFront,
  GraduationCap,
  Cross,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';

import { mockProperties } from '../../mockData/mockProperties';
import { propertyService, formatPropertyAddressHeading } from '../../services/propertyService';
import { inquiryService } from '../../services/inquiryService';
import useViewingList from '../../hooks/useViewingList';
import AuthContext from '../../context/AuthContext';
import { mapsService } from '../../services/mapsService';
import {
  getPropertyCoordinates,
  DEFAULT_METRO_MANILA_COORDS,
  isWithinPhilippineBounds,
} from '../../utils/propertyCoordinates';
import { resolveDriveImageUrl } from '../../services/driveService';
import {
  isLandFamily,
  isStrataFamily,
} from '../portals/broker/components/property-form/propertyTypeConfig';
import { stripHtml } from '../portals/broker/components/property-form/DescriptionEditorModal';
import InspectionScheduleModal from '../../components/ui/modals/InspectionScheduleModal';
import PublicAgentProfileModal from '../../components/ui/modals/PublicAgentProfileModal';
import ShareListingModal from '../../components/ui/modals/ShareListingModal';
import {
  GooglePropertyMap,
  CommuteAnalysisCard,
  EnlargedMapModal,
  PropertyBrochureGallery,
  PropertyHeroDetailsCard,
  PropertyMediaShowcaseSection,
  PropertyAgentCard,
  Toaster,
  useToast,
} from '../../components/ui';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function findLocalProperty(id) {
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
}

function formatPhpCurrency(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (!Number.isFinite(num) || num <= 0) return String(val);
  return `₱${num.toLocaleString('en-PH')}`;
}

function SectionHeading({ eyebrow, title, rightSlot }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          <span className="w-4 h-0.5 bg-[#FF8559] rounded-full shrink-0" aria-hidden="true" />
          <span>{eyebrow}</span>
        </div>
        <CardTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
          <span>{title}</span>
          <span className="text-[#FF8559]">.</span>
        </CardTitle>
      </div>
      {rightSlot}
    </div>
  );
}

export default function PropertyListingView() {
  const { id } = useParams();
  const location = useLocation();
  const passedProperty = location?.state?.property || null;
  const authContext = React.useContext(AuthContext);
  const user = authContext?.user || null;

  const [property, setProperty] = useState(() => {
    if (passedProperty && (!id || String(passedProperty.id) === String(id))) {
      return passedProperty;
    }
    return findLocalProperty(id);
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (passedProperty && (!id || String(passedProperty.id) === String(id))) {
      return false;
    }
    if (!id) return false;
    return !findLocalProperty(id);
  });
  const [loadError, setLoadError] = useState(null);
  const [isEnlargedMapOpen, setIsEnlargedMapOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('sec-details');
  const lenis = useLenis();
  const isManualScrollingRef = useRef(false);
  const manualScrollTimeoutRef = useRef(null);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { toast } = useToast();

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  const loadProperty = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setLoadError('No property ID provided.');
      return;
    }

    const localMatch = findLocalProperty(id);
    if (localMatch) {
      setProperty(localMatch);
    }

    if (!localMatch || !String(localMatch.id).startsWith('reso-fixture-')) {
      try {
        if (!localMatch) setIsLoading(true);
        setLoadError(null);
        const remoteData = await propertyService.getPropertyById(id, { publicView: 'true' });
        if (remoteData) {
          setProperty(remoteData);
        } else if (!localMatch) {
          setLoadError('The requested property listing could not be found.');
        }
      } catch (err) {
        console.warn('[PropertyListingView] Remote fetch error:', err);
        if (!localMatch) {
          setLoadError('Could not load property details right now.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const { isInViewingList, toggleViewingList } = useViewingList();
  const propertyId = property?.id || id || '';
  const isSaved = propertyId ? isInViewingList(propertyId) : false;

  const custom = useMemo(
    () => property?.customResoAttributes || property?.custom_reso_attributes || {},
    [property]
  );

  // Core Create Listing & Properties Table Fields
  const propertyTitle = property?.title || property?.name || 'Untitled Property';
  const propertyTagline = property?.tagline || custom.tagline || '';
  const listingRef =
    property?.listing_id ||
    property?.ListingId ||
    property?.listingId ||
    property?.ListingKey ||
    property?.listingKey ||
    property?.ref_code ||
    propertyId;

  const propertyCategory = custom.propertyCategory || property?.propertyCategory || '';
  const propertyType =
    property?.property_type ||
    property?.propertyType ||
    property?.specs?.propertyType ||
    property?.PropertyType ||
    'Residential';

  const isVacantLot = isLandFamily(propertyType) || propertyCategory === 'Land';
  const isCondo = isStrataFamily(propertyType);

  const transactionType =
    property?.transaction_type ||
    property?.transactionType ||
    property?.specs?.transactionType ||
    '';
  const isRent = Boolean(
    property?.rent_frequency ||
    property?.priceSuffix ||
    (transactionType && transactionType.toLowerCase().includes('rent')) ||
    (property?.status && property?.status.toLowerCase().includes('rent'))
  );
  const transactionLabel = transactionType || (isRent ? 'For Rent' : 'For Sale');
  const isFeatured = Boolean(property?.is_featured || property?.isFeatured);

  const standardStatus =
    property?.StandardStatus ||
    property?.standardStatus ||
    property?.standard_status ||
    property?.status ||
    'Active';
  const isStatusPending =
    standardStatus &&
    (standardStatus.toLowerCase().includes('pending confirmation') ||
      standardStatus.toLowerCase().includes('pending_confirmation'));

  const propertyCondition =
    custom.propertyStatus ||
    property?.property_condition ||
    property?.propertyCondition ||
    property?.specs?.propertyCondition ||
    property?.unit_status ||
    '';

  const cleanPublicRemarks = useMemo(() => {
    const raw =
      property?.PublicRemarks ||
      property?.public_remarks ||
      property?.publicRemarks ||
      property?.description ||
      '';
    return raw ? stripHtml(raw) : '';
  }, [property]);

  // Pricing & Payment Breakdown (Step 1)
  const rawPrice =
    property?.ListPrice ??
    property?.price_raw ??
    (typeof property?.price === 'number'
      ? property.price
      : Number(String(property?.price || '0').replace(/[^0-9.-]+/g, '')) || 0);
  const rentFreq =
    property?.rent_frequency ||
    property?.pricing?.rentFrequency ||
    (property?.priceSuffix ? property.priceSuffix.replace(/^\s*\/?\s*/, '') : 'mo');
  const currency = property?.currency || property?.pricing?.currency || 'PHP';
  const currencySymbol = currency === 'PHP' ? '₱' : currency;

  const formattedPriceDisplay = useMemo(() => {
    if (property?.formattedPrice) return property.formattedPrice;
    if (rawPrice > 0) return `${currencySymbol}${rawPrice.toLocaleString('en-PH')}`;
    if (typeof property?.price === 'string' && property.price.trim()) return property.price;
    return 'Price on Request';
  }, [property, rawPrice, currencySymbol]);

  const livingArea =
    property?.LivingArea ??
    property?.living_area ??
    property?.livingArea ??
    property?.specs?.livingArea ??
    property?.sqm ??
    property?.floor_area ??
    null;
  const livingAreaUnits =
    property?.LivingAreaUnits ||
    property?.living_area_units ||
    property?.livingAreaUnits ||
    property?.specs?.livingAreaUnits ||
    'sqm';
  const livingAreaFormatted =
    livingArea != null && livingArea !== '' ? `${livingArea} ${livingAreaUnits}` : null;

  const lotArea =
    property?.LotSizeArea ??
    property?.lot_size_area ??
    property?.lotSizeArea ??
    property?.specs?.lotSizeArea ??
    property?.lot_area ??
    null;
  const lotAreaUnits =
    property?.LotSizeUnits ||
    property?.lot_size_units ||
    property?.lotSizeUnits ||
    property?.specs?.lotSizeUnits ||
    'sqm';
  const lotAreaFormatted = lotArea != null && lotArea !== '' ? `${lotArea} ${lotAreaUnits}` : null;

  const pricePerSqm = useMemo(() => {
    if (custom.pricePerSqm) {
      const formatted = formatPhpCurrency(custom.pricePerSqm);
      return formatted ? `${formatted} / sqm` : null;
    }
    const basisArea = isVacantLot ? lotArea : livingArea || lotArea;
    const areaVal =
      typeof basisArea === 'number' ? basisArea : parseFloat(String(basisArea || '0'));
    if (rawPrice > 0 && areaVal > 0) {
      return `₱${Math.round(rawPrice / areaVal).toLocaleString('en-PH')} / sqm`;
    }
    return null;
  }, [custom.pricePerSqm, isVacantLot, lotArea, livingArea, rawPrice]);

  const assocFee =
    property?.AssociationFee ??
    property?.pricing?.associationFee ??
    property?.pricing?.association_fee ??
    property?.association_fee ??
    property?.associationFee ??
    null;
  const paymentBreakdown = custom.paymentBreakdown || null;
  const partneredBanks = Array.isArray(custom.partneredBanks) ? custom.partneredBanks : [];
  const leaseTerm =
    property?.pricing?.leaseTerm ?? property?.pricing?.lease_term ?? property?.lease_term ?? null;
  const securityDeposit =
    property?.pricing?.securityDeposit ??
    property?.pricing?.security_deposit ??
    property?.security_deposit ??
    null;
  const advanceRent =
    property?.pricing?.advanceRent ??
    property?.pricing?.advance_rent ??
    property?.advance_rent ??
    null;

  // Location (Step 2)
  const region = property?.region || property?.location?.region || '';
  const city =
    property?.City ||
    property?.city ||
    property?.location_raw?.city ||
    property?.location?.city ||
    '';
  const province =
    property?.StateOrProvince ||
    property?.state_or_province ||
    property?.province ||
    property?.location_raw?.stateOrProvince ||
    property?.location?.state ||
    property?.location?.stateOrProvince ||
    '';
  const postalCode =
    property?.postal_code || property?.PostalCode || property?.postalCode || property?.location?.postalCode || '';
  const locationHeader = [city, province].filter(Boolean).join(', ') || 'Metro Manila, Philippines';

  const fullAddress = useMemo(() => {
    if (!property) return 'Metro Manila, Philippines';
    if (typeof property.location === 'string' && property.location.trim()) return property.location;
    const rawParts = [
      property.building_name ||
      property.buildingName ||
      property.location?.buildingName ||
      property.location?.building_name,
      property.address || property.location?.address,
      property.subdivision_name || property.subdivisionName || property.location?.subdivisionName,
      property.barangay || property.location?.barangay
        ? `Brgy. ${(property.barangay || property.location?.barangay || '').replace(/^brgy\.?\s*/i, '')}`
        : null,
      property.city || property.City || property.location?.city,
      property.state_or_province ||
      property.StateOrProvince ||
      property.province ||
      property.location?.stateOrProvince ||
      property.location?.state,
      postalCode,
      'Philippines',
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
  }, [property, postalCode, locationHeader]);

  const rawMapPrivacy = custom.mapPinPrivacy || 'Exact Location';
  const isGeneralAreaOnly =
    rawMapPrivacy === 'General Area Only' || rawMapPrivacy === 'Approximate Area (250m)';

  const displayAddress = useMemo(() => {
    if (!isGeneralAreaOnly) return fullAddress;
    if (!property) return 'Metro Manila, Philippines';
    const rawParts = [
      property.barangay || property.location?.barangay
        ? `Brgy. ${(property.barangay || property.location?.barangay || '').replace(/^brgy\.?\s*/i, '')}`
        : null,
      city,
      province,
      'Philippines',
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
  }, [isGeneralAreaOnly, fullAddress, property, city, province, locationHeader]);

  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const baseCoords = useMemo(
    () => (property ? getPropertyCoordinates(property) : { ...DEFAULT_METRO_MANILA_COORDS }),
    [property]
  );
  const propertyCoords = geocodedCoords || baseCoords;

  useEffect(() => {
    let isMounted = true;
    setGeocodedCoords(null);
    const rawLat = Number(property?.latitude || property?.location?.coordinates?.lat);
    const rawLng = Number(property?.longitude || property?.location?.coordinates?.lng);
    const hasRawGps = !isNaN(rawLat) && !isNaN(rawLng) && isWithinPhilippineBounds(rawLat, rawLng);

    if (!hasRawGps && fullAddress && !fullAddress.includes('Address pending')) {
      mapsService
        .geocode(fullAddress)
        .then((res) => {
          if (isMounted && res && res.latitude && res.longitude) {
            const lat = Number(res.latitude);
            const lng = Number(res.longitude);
            if (isWithinPhilippineBounds(lat, lng)) {
              setGeocodedCoords({ lat, lng });
            }
          }
        })
        .catch(() => { });
    }
    return () => {
      isMounted = false;
    };
  }, [property?.id, fullAddress]);

  // Specs & Features (Step 3)
  const bedrooms =
    property?.BedroomsTotal ??
    property?.bedrooms_total ??
    property?.bedroomsTotal ??
    property?.specs?.bedroomsTotal ??
    property?.specs?.beds ??
    property?.bedrooms ??
    property?.beds ??
    null;
  const bathrooms =
    property?.BathroomsTotalInteger ??
    property?.bathrooms_total_integer ??
    property?.bathroomsTotalInteger ??
    property?.specs?.bathroomsTotalInteger ??
    property?.specs?.baths ??
    property?.bathrooms ??
    property?.baths ??
    null;
  const parkingTotal =
    property?.parking_total ??
    property?.parkingTotal ??
    property?.specs?.parkingTotal ??
    property?.parking ??
    null;
  const storiesTotal =
    property?.StoriesTotal ??
    property?.stories_total ??
    property?.storiesTotal ??
    property?.specs?.storiesTotal ??
    null;
  const yearBuilt =
    property?.YearBuilt ??
    property?.year_built ??
    property?.yearBuilt ??
    property?.specs?.yearBuilt ??
    null;
  const turnoverDate = custom.turnoverDate || '';
  const furnishing = custom.furnishing || property?.furnishing || '';
  const turnoverCondition = custom.turnoverCondition || '';
  const flooringType = custom.flooringType || '';
  const kitchenType = custom.kitchenType || '';
  const unitNumber =
    property?.unit_number || property?.unitNumber || property?.UnitNumber || custom.unitNumber || '';
  const floorLevel = custom.floorLevel || property?.floor_level || property?.floorLevel || '';
  const subdivisionName =
    property?.subdivision_name || property?.subdivisionName || property?.location?.subdivisionName || '';
  const buildingName =
    property?.building_name ||
    property?.buildingName ||
    property?.location?.buildingName ||
    property?.location?.building_name ||
    '';
  const towerName = custom.towerName || property?.tower_name || property?.towerName || '';
  const phase =
    custom.phase || property?.phase || custom.canonicalPayload?.propertyDetails?.subdivision?.phase || '';
  const block =
    custom.block || property?.block || custom.canonicalPayload?.propertyDetails?.subdivision?.block || '';
  const lot =
    custom.lot || property?.lot || custom.canonicalPayload?.propertyDetails?.subdivision?.lot || '';

  const featureSections = useMemo(() => {
    const groups = [];
    const extraSpaces = Array.isArray(custom.extraSpaces) ? custom.extraSpaces : [];
    const security = Array.isArray(custom.securityFeatures) ? custom.securityFeatures : [];
    const amenities = Array.isArray(property?.features)
      ? property.features
      : Array.isArray(property?.amenities)
        ? property.amenities
        : [];
    const utilities = Array.isArray(custom.utilities) ? custom.utilities : [];
    const indoor = Array.isArray(property?.interior_features)
      ? property.interior_features
      : Array.isArray(property?.interiorFeatures)
        ? property.interiorFeatures
        : [];
    const outdoor = Array.isArray(property?.exterior_features)
      ? property.exterior_features
      : Array.isArray(property?.exteriorFeatures)
        ? property.exteriorFeatures
        : [];

    if (extraSpaces.length > 0) groups.push({ label: 'Extra Spaces', items: extraSpaces });
    if (security.length > 0) groups.push({ label: 'Security', items: security });
    if (amenities.length > 0) groups.push({ label: 'Amenities', items: amenities });
    if (utilities.length > 0) groups.push({ label: 'Utilities', items: utilities });
    if (indoor.length > 0) groups.push({ label: 'Interior Features', items: indoor });
    if (outdoor.length > 0) groups.push({ label: 'Exterior Features', items: outdoor });
    return groups;
  }, [property, custom]);

  const nearbyRows = useMemo(() => {
    const np = custom.nearbyPlaces || {};
    return [
      { label: 'Nearest Highway', value: np.highway, icon: Route },
      { label: 'Nearest Transit', value: np.transit, icon: TrainFront },
      { label: 'Nearest School', value: np.school, icon: GraduationCap },
      { label: 'Nearest Hospital', value: np.hospital, icon: Cross },
      { label: 'Nearest Mall', value: np.mall, icon: ShoppingBag },
    ].filter((r) => Boolean(r.value && String(r.value).trim()));
  }, [custom.nearbyPlaces]);

  const nearbyPins = useMemo(
    () => (Array.isArray(custom.nearbyPlacesPins) ? custom.nearbyPlacesPins : []),
    [custom.nearbyPlacesPins]
  );

  // Step 4: Photos, Categorized Areas (captions + categoryDescriptions + categoryVideos), and Floor Plans
  const { photos, roomGalleryAreas, floorPlanItems } = useMemo(() => {
    if (!property) {
      return { photos: [], roomGalleryAreas: [], floorPlanItems: [] };
    }

    const rawMedia = Array.isArray(property.media)
      ? property.media
      : Array.isArray(property.property_media)
        ? property.property_media
        : [];

    const categoryDescriptions = custom.categoryDescriptions || {};
    const categoryVideos = custom.categoryVideos || {};
    const allLightboxUrls = [];
    const areaMap = new Map();
    const fpItems = [];

    const ensureArea = (key, label = key) => {
      if (!areaMap.has(key)) {
        areaMap.set(key, {
          key,
          label,
          description: categoryDescriptions[key] || '',
          photos: [],
          video: null,
        });
      }
      return areaMap.get(key);
    };

    if (rawMedia.length > 0) {
      const visualItems = rawMedia
        .filter((m) => {
          if (!m) return false;
          const cat = String(m.mediaCategory || m.media_category || m.category || '').toLowerCase();
          const url = String(m.mediaUrl || m.media_url || m.url || m.image_url || '').toLowerCase();
          if (cat === 'video' || cat === 'document' || cat === 'brochure' || cat === 'pdf') return false;
          if (url.endsWith('.pdf')) return false;
          return Boolean(m.mediaUrl || m.media_url || m.url || m.image_url);
        })
        .sort((a, b) => {
          const catA = String(a.mediaCategory || a.media_category || '').toLowerCase();
          const catB = String(b.mediaCategory || b.media_category || '').toLowerCase();
          if (catA !== 'floorplan' && catB === 'floorplan') return -1;
          if (catA === 'floorplan' && catB !== 'floorplan') return 1;
          return (a.orderIndex ?? a.order_index ?? a.display_order ?? 0) -
            (b.orderIndex ?? b.order_index ?? b.display_order ?? 0);
        });

      visualItems.forEach((m) => {
        const resolved = resolveDriveImageUrl(m.mediaUrl || m.media_url || m.url || m.image_url);
        if (!resolved) return;
        const idx = allLightboxUrls.length;
        allLightboxUrls.push(resolved);

        const mediaCat = String(m.mediaCategory || m.media_category || '').toLowerCase();
        const rawGalCat = m.galleryCategory || m.gallery_category || '';
        const rawCaption = (m.shortDescription || m.short_description || '').trim();
        const isGenericCaption =
          !rawCaption ||
          rawCaption === 'Property Photo' ||
          rawCaption === 'Listing Photo' ||
          rawCaption === rawGalCat;
        const caption = isGenericCaption ? '' : rawCaption;

        if (mediaCat === 'floorplan' || rawGalCat === 'FloorPlan') {
          fpItems.push({ url: resolved, caption, lightboxIndex: idx });
        } else if (rawGalCat && rawGalCat !== 'Cover') {
          const area = ensureArea(rawGalCat, rawGalCat);
          area.photos.push({ url: resolved, caption, lightboxIndex: idx });
        }
      });

      // Attach Video items from property_media
      rawMedia
        .filter((m) => String(m?.mediaCategory || m?.media_category || '').toLowerCase() === 'video')
        .forEach((m) => {
          const url = m.mediaUrl || m.media_url;
          if (!url) return;
          const catKey = m.galleryCategory || m.gallery_category || 'Video Tour';
          const savedMeta = categoryVideos[catKey] || {};
          const area = ensureArea(catKey, catKey);
          area.video = {
            mediaUrl: url,
            thumbnailUrl: savedMeta.thumbnailUrl ? resolveDriveImageUrl(savedMeta.thumbnailUrl) : '',
            shortDescription: m.shortDescription || m.short_description || savedMeta.shortDescription || '',
            mimeType: m.mimeType || m.mime_type || 'video/mp4',
          };
        });
    }

    // Also include categoryDescriptions or categoryVideos stored in custom_reso_attributes even if no photo rows matched
    Object.entries(categoryDescriptions).forEach(([catKey, desc]) => {
      if (desc && String(desc).trim()) {
        ensureArea(catKey, catKey);
      }
    });
    Object.entries(categoryVideos).forEach(([catKey, vid]) => {
      if (vid?.mediaUrl) {
        const area = ensureArea(catKey, catKey);
        if (!area.video) {
          area.video = {
            mediaUrl: vid.mediaUrl,
            thumbnailUrl: vid.thumbnailUrl ? resolveDriveImageUrl(vid.thumbnailUrl) : '',
            shortDescription: vid.shortDescription || '',
            mimeType: vid.mimeType || 'video/mp4',
          };
        }
      }
    });

    if (allLightboxUrls.length === 0) {
      let fallbackUrls = [];
      if (Array.isArray(property.property_images) && property.property_images.length > 0) {
        fallbackUrls = [...property.property_images]
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((img) => resolveDriveImageUrl(img.image_url || img.url || img.mediaUrl || img.media_url))
          .filter(Boolean);
      } else if (Array.isArray(property.images) && property.images.length > 0) {
        fallbackUrls = property.images
          .map((img) => resolveDriveImageUrl(typeof img === 'string' ? img : img.url || img.image_url || img.mediaUrl))
          .filter(Boolean);
      } else {
        const single =
          property.mainImage || property.main_image || property.image || property.cover_image || property.thumbnail;
        const resolved = single ? resolveDriveImageUrl(single) : null;
        if (resolved) fallbackUrls = [resolved];
      }
      allLightboxUrls.push(...fallbackUrls);
    }

    const areas = Array.from(areaMap.values()).filter(
      (a) => a.photos.length > 0 || Boolean(a.description && a.description.trim()) || Boolean(a.video)
    );

    return {
      photos: allLightboxUrls,
      roomGalleryAreas: areas,
      floorPlanItems: fpItems,
    };
  }, [property, custom]);

  // Step 5 Credentials & Contact
  const credentials = custom.credentials || {};
  const cleanDeveloperDescription = useMemo(
    () => stripHtml(credentials.developerDescription || ''),
    [credentials.developerDescription]
  );
  const credentialRows = useMemo(
    () =>
      [
        { label: 'Developer', value: credentials.developer },
        { label: 'Brokerage', value: credentials.brokerage || property?.listOfficeName },
        { label: 'DHSUD License No.', value: credentials.dhsudLicenseNo },
      ].filter((r) => Boolean(r.value && String(r.value).trim())),
    [credentials, property?.listOfficeName]
  );

  const agent = useMemo(() => {
    const baseAgent = property?.agent && typeof property.agent === 'object' ? property.agent : {};
    return {
      name:
        credentials.assignedAgent ||
        baseAgent.name ||
        baseAgent.fullName ||
        property?.agent_name ||
        property?.agentName ||
        'Human Shelter Desk',
      title: baseAgent.title || 'Listing Contact',
      brokerage:
        credentials.brokerage ||
        baseAgent.brokerage ||
        property?.listOfficeName ||
        'Human Shelter Realty',
      phone:
        credentials.contactNumber ||
        baseAgent.phone ||
        property?.agent_phone ||
        '+63 917 555 8920',
      email:
        credentials.contactEmail ||
        baseAgent.email ||
        property?.agent_email ||
        'agent@humanshelter.ph',
      messengerUrl: credentials.messengerUrl || '',
      facebookUrl: credentials.facebookUrl || '',
      whatsapp: credentials.whatsapp || '',
      license: credentials.prcLicenseNo || baseAgent.license || 'PRC #0023419',
      avatar: baseAgent.avatar || baseAgent.profile_image_url || '',
    };
  }, [property, credentials]);

  const hasPaymentContent = Boolean(
    paymentBreakdown?.reservationFee ||
    paymentBreakdown?.downpayment ||
    paymentBreakdown?.loanableAmount ||
    paymentBreakdown?.monthlyAmortization ||
    paymentBreakdown?.moveInFees ||
    custom.pricePerSqm ||
    partneredBanks.length > 0 ||
    assocFee != null ||
    isRent ||
    rawPrice > 0
  );

  const navItems = useMemo(() => {
    const items = [
      { id: 'sec-details', label: 'Property Details' },
      { id: 'sec-specs', label: 'Specifications' },
    ];
    if (roomGalleryAreas.length > 0) items.push({ id: 'sec-media', label: 'Room Gallery & Videos' });
    if (floorPlanItems.length > 0) items.push({ id: 'sec-floorplan', label: 'Floor Plan' });
    if (featureSections.length > 0) items.push({ id: 'sec-features', label: 'Features' });
    items.push({ id: 'sec-location', label: 'Location & Map' });
    items.push({ id: 'sec-agent', label: 'Agent' });
    if (hasPaymentContent) items.push({ id: 'sec-payment', label: 'Pricing & Banks' });
    if (credentialRows.length > 0 || cleanDeveloperDescription) items.push({ id: 'sec-credentials', label: 'Legal Details' });
    return items;
  }, [
    roomGalleryAreas.length,
    floorPlanItems.length,
    featureSections.length,
    hasPaymentContent,
    credentialRows.length,
    cleanDeveloperDescription,
  ]);

  // Handlers
  const handleSaveToggle = () => {
    toggleViewingList(property);
    toast({
      title: 'Saved Properties',
      description: isSaved ? 'Removed from saved properties' : 'Saved to your properties',
      variant: 'success',
    });
  };

  const handleOpenGallery = (index = 0) => {
    if (photos.length === 0) return;
    setActivePhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
    setIsGalleryOpen(true);
  };

  const handlePrevPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Scroll-spy: keep active tab synced as the user scrolls manually
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;

    const sectionIds = navItems.map((item) => item.id);
    const elements = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0 && visible[0].target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-176px 0px -55% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [navItems, property]);

  useEffect(() => {
    return () => {
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (!elem) return;

    isManualScrollingRef.current = true;
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }
    manualScrollTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 650);

    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(elem, { offset: -176 });
    } else if (typeof elem.scrollIntoView === 'function') {
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
        agent_id: property?.list_agent_key || property?.listAgentKey || property?.agent_id || property?.agent?.id,
        clientId: user?.id,
      });
      setIsContactModalOpen(false);
      toast({
        title: 'Inquiry Sent',
        description: 'Inquiry sent! The listing contact will reach out soon.',
        variant: 'success',
      });
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    } catch (err) {
      toast({
        title: 'Could Not Send Inquiry',
        description: err?.data?.error || err?.message || 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  // Loading Shimmer Skeleton State (DESIGN.md Section 8.2)
  if (isLoading && !property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col gap-6" role="status" aria-label="Loading property showcase">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-8 h-72 rounded-xl" />
            <Skeleton className="lg:col-span-4 h-72 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State (DESIGN.md Section 8.2)
  if (loadError && !property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-28">
        <Card className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <CardContent className="p-6 flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertTitle>Listing Unavailable</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="lg" onClick={loadProperty} className="flex-1 min-h-11 rounded-lg">
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
              <Button asChild variant="default" size="lg" className="flex-1 min-h-11 rounded-lg">
                <Link to="/properties">
                  <ArrowLeft data-icon="inline-start" />
                  Back to Properties
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subdivisionSummary = [
    subdivisionName,
    [phase, block, lot].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' — ');

  const buildingSummary = [buildingName, towerName].filter(Boolean).join(' · ');

  const specRows = [
    { label: 'Property Type', value: propertyType },
    { label: 'Transaction', value: transactionLabel },
    ...(propertyCondition ? [{ label: 'Property Status', value: propertyCondition }] : []),
    ...(region ? [{ label: 'Region', value: region }] : []),
    ...(postalCode ? [{ label: 'Postal Code', value: postalCode }] : []),
    ...(subdivisionSummary ? [{ label: 'Subdivision', value: subdivisionSummary }] : []),
    ...(buildingSummary ? [{ label: 'Building / Tower', value: buildingSummary }] : []),
    ...(unitNumber ? [{ label: 'Unit Number', value: unitNumber, testId: 'reso-unit-number' }] : []),
    ...(!isVacantLot && isCondo && floorLevel ? [{ label: 'Floor Level', value: floorLevel }] : []),
    ...(!isVacantLot && !isCondo && storiesTotal != null ? [{ label: 'Storeys', value: String(storiesTotal) }] : []),
    ...(lotAreaFormatted ? [{ label: 'Lot Area', value: lotAreaFormatted }] : []),
    ...(!isVacantLot && livingAreaFormatted ? [{ label: 'Floor Area', value: livingAreaFormatted }] : []),
    ...(!isVacantLot && furnishing ? [{ label: 'Furnishing', value: furnishing }] : []),
    ...(!isVacantLot && turnoverDate
      ? [{ label: 'Turnover Date', value: turnoverDate, testId: 'reso-year-built' }]
      : !isVacantLot && yearBuilt
        ? [{ label: 'Year Built', value: String(yearBuilt), testId: 'reso-year-built' }]
        : []),
    ...(!isVacantLot && turnoverCondition ? [{ label: 'Turnover Condition', value: turnoverCondition }] : []),
    ...(!isVacantLot && flooringType ? [{ label: 'Flooring', value: flooringType }] : []),
    ...(!isVacantLot && kitchenType ? [{ label: 'Kitchen', value: kitchenType }] : []),
    ...(!isStatusPending && standardStatus
      ? [{ label: 'Listing Availability', value: standardStatus }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-[#0F766E] selection:text-white pt-24 pb-12">
      <main className="flex flex-col gap-6">
        {/* 1. DYNAMIC-WIDTH HERO SECTION (Images Only) */}
        <section
          aria-label="Property Hero Gallery"
          className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 min-h-11 px-2 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Properties</span>
            </Link>

            <Badge
              variant="outline"
              data-testid="reso-listing-id"
              className="text-xs text-[#64748B] bg-white border-[#E2E8F0] px-3 py-1 rounded-full"
            >
              Ref No. {listingRef}
            </Badge>
          </div>

          <PropertyBrochureGallery
            photos={photos}
            title={propertyTitle}
            transactionLabel={transactionLabel}
            propertyCondition={propertyCondition}
            isFeatured={isFeatured}
            standardStatus={standardStatus}
            isStatusPending={isStatusPending}
            isRent={isRent}
            rentFreq={rentFreq}
            formattedPriceDisplay={formattedPriceDisplay}
            pricePerSqm={pricePerSqm}
            onOpenGallery={handleOpenGallery}
          />
        </section>

        {/* 2. NAVIGATION PANEL BENEATH HERO + BROCHURE SECTIONS */}
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-6">
          <nav
            aria-label="Brochure Sections"
            className="sticky top-24 z-30 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? 'location' : undefined}
                    onClick={() => scrollToSection(item.id)}
                    className={`min-h-11 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${isActive
                        ? 'bg-[#CCFBF1] text-[#0F766E]'
                        : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
                className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
              >
                <Bookmark
                  data-icon="inline-start"
                  className={isSaved ? 'fill-[#0F766E] text-[#0F766E]' : 'text-[#64748B]'}
                />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsShareOpen(true)}
                aria-label="Share listing"
                className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
              >
                <Share2 data-icon="inline-start" className="text-[#64748B]" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </nav>

          {/* 3. PROPERTY DETAILS + BROCHURE SPREAD (8 / 4 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Column (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              {/* Property Details Section (Title, Tagline, Location & Specs) */}
              <section id="sec-details" className="scroll-mt-44">
                <PropertyHeroDetailsCard
                  propertyType={propertyType}
                  propertyCategory={propertyCategory}
                  title={propertyTitle}
                  tagline={propertyTagline}
                  fullAddress={displayAddress}
                  isVacantLot={isVacantLot}
                  bedrooms={bedrooms}
                  bathrooms={bathrooms}
                  parkingTotal={parkingTotal}
                  livingAreaFormatted={livingAreaFormatted}
                  lotAreaFormatted={lotAreaFormatted}
                />
              </section>

              {/* Property Specifications Card */}
              <section id="sec-specs" className="scroll-mt-44">
                <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                  <CardHeader className="p-6 pb-4">
                    <SectionHeading
                      eyebrow="Specifications"
                      title="Property Specifications"
                    />
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex flex-col gap-4">
                    {cleanPublicRemarks && (
                      <div
                        data-testid="reso-public-remarks"
                        className="pt-4 border-t border-[#E2E8F0] text-sm text-[#1E293B] leading-relaxed whitespace-pre-line"
                      >
                        {cleanPublicRemarks}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm border-t border-[#E2E8F0] pt-4">
                      {specRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-4 py-2 border-b border-[#E2E8F0]"
                        >
                          <span className="text-[#64748B]">{row.label}</span>
                          <span
                            data-testid={row.testId}
                            className="font-semibold text-[#1E293B] text-right"
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Step 4 Missing Sections: Room Gallery & Videos + Dedicated Floor Plan */}
              <PropertyMediaShowcaseSection
                areas={roomGalleryAreas}
                floorPlans={floorPlanItems}
                onOpenGallery={handleOpenGallery}
              />

              {/* Features & Utilities Card */}
              {featureSections.length > 0 && (
                <section id="sec-features" className="scroll-mt-44">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Amenities"
                        title="Features & Utilities"
                      />
                    </CardHeader>
                    <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-4">
                      {featureSections.map((group) => (
                        <div key={group.label} className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                            {group.label}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
                              <Badge
                                key={item}
                                variant="secondary"
                                className="rounded-full normal-case tracking-normal font-medium px-3 py-1"
                              >
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Location, Nearby Places & Map */}
              <section id="sec-location" className="scroll-mt-44">
                <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                  <CardHeader className="p-6 pb-4">
                    <SectionHeading
                      eyebrow="Neighborhood"
                      title="Location & Nearby Places"
                      rightSlot={
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setIsEnlargedMapOpen(true)}
                            className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
                          >
                            <Maximize2 data-icon="inline-start" className="text-[#0F766E]" />
                            Enlarge Map
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(propertyCoords.lat)},${encodeURIComponent(propertyCoords.lng)}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
                          >
                            <Compass data-icon="inline-start" className="text-[#0F766E]" />
                            360° Street View
                          </Button>
                        </div>
                      }
                    />
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="size-4 text-[#0F766E] shrink-0" />
                      <span>
                        {isGeneralAreaOnly
                          ? 'Map Pin: General Area Only'
                          : 'Map Pin: Exact Location'}
                        {region ? ` · ${region}` : ''}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-4">
                    {nearbyRows.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {nearbyRows.map((row) => {
                          const RowIcon = row.icon;
                          return (
                            <div
                              key={row.label}
                              className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-4"
                            >
                              <div className="size-8 rounded-full bg-[#CCFBF1] border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center shrink-0">
                                <RowIcon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs text-[#64748B] block">{row.label}</span>
                                <span className="text-sm font-semibold text-[#1E293B] block truncate">
                                  {row.value}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {nearbyPins.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nearbyPins.map((pin, idx) => (
                          <Badge
                            key={pin.id || idx}
                            variant="outline"
                            className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B] rounded-full normal-case tracking-normal"
                          >
                            {pin.name || pin.label || pin.category}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div
                      className="relative isolate z-0 w-full h-80 rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]"
                      data-lenis-prevent="true"
                    >
                      <GooglePropertyMap
                        properties={
                          property
                            ? [{ ...property, latitude: propertyCoords.lat, longitude: propertyCoords.lng }]
                            : []
                        }
                        selectedPropertyId={property?.id}
                        singlePropertyMode={true}
                        showControls={false}
                        initialZoom={isGeneralAreaOnly ? 14 : 16}
                        lockZoom={isGeneralAreaOnly}
                        generalAreaOnly={isGeneralAreaOnly}
                      />
                    </div>

                    <CommuteAnalysisCard
                      latitude={propertyCoords.lat}
                      longitude={propertyCoords.lng}
                      propertyName={propertyTitle}
                    />
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Rail (4 Cols): Separate Agent Card, Payment Breakdown & Legal Details */}
            <aside className="lg:col-span-4 flex flex-col gap-6 min-w-0 lg:sticky lg:top-44">
              <section id="sec-agent" className="scroll-mt-44">
                <PropertyAgentCard
                  agent={agent}
                  onScheduleViewing={() => setIsScheduleModalOpen(true)}
                  onContactAgent={() => setIsContactModalOpen(true)}
                  onOpenAgentModal={() => setIsAgentModalOpen(true)}
                />
              </section>

              {hasPaymentContent && (
                <section id="sec-payment" className="scroll-mt-44">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Financing"
                        title="Pricing & Partnered Banks"
                      />
                    </CardHeader>
                    <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-4 text-sm">
                      <div className="flex flex-col gap-2">
                        {rawPrice > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Selling Price</span>
                            <span className="font-mono font-semibold text-[#1E293B]">
                              {formattedPriceDisplay}
                            </span>
                          </div>
                        )}
                        {pricePerSqm && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Price per Sqm</span>
                            <span className="font-mono font-semibold text-[#1E293B]">
                              {pricePerSqm}
                            </span>
                          </div>
                        )}
                        {Number(String(paymentBreakdown?.reservationFee ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Reservation Fee</span>
                            <span className="font-semibold text-[#1E293B]">
                              {formatPhpCurrency(paymentBreakdown.reservationFee)}
                            </span>
                          </div>
                        )}
                        {paymentBreakdown?.downpayment && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Downpayment</span>
                            <span className="font-semibold text-[#1E293B]">
                              {paymentBreakdown.downpayment}
                              {paymentBreakdown.downpaymentTerm ? ` (${paymentBreakdown.downpaymentTerm})` : ''}
                            </span>
                          </div>
                        )}
                        {Number(String(paymentBreakdown?.loanableAmount ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Loanable Amount</span>
                            <span className="font-mono font-semibold text-[#1E293B]">
                              {formatPhpCurrency(paymentBreakdown.loanableAmount)}
                            </span>
                          </div>
                        )}
                        {paymentBreakdown?.loanTerm && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Loan Term</span>
                            <span className="font-semibold text-[#1E293B]">{paymentBreakdown.loanTerm}</span>
                          </div>
                        )}
                        {Number(String(paymentBreakdown?.monthlyAmortization ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Est. Monthly</span>
                            <span className="font-semibold text-[#1E293B]">
                              {formatPhpCurrency(paymentBreakdown.monthlyAmortization)} / mo
                            </span>
                          </div>
                        )}
                        {Number(String(paymentBreakdown?.moveInFees ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Move-in Fees</span>
                            <span className="font-semibold text-[#1E293B]">
                              {formatPhpCurrency(paymentBreakdown.moveInFees)}
                            </span>
                          </div>
                        )}
                        {isRent && (
                          <>
                            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                              <span className="text-[#64748B]">Minimum Lease Term</span>
                              <span className="font-semibold text-[#1E293B]">{leaseTerm || '12 Months'}</span>
                            </div>
                            {Number(String(securityDeposit ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                                <span className="text-[#64748B]">Security Deposit</span>
                                <span className="font-semibold text-[#1E293B]">
                                  {formatPhpCurrency(securityDeposit)}
                                </span>
                              </div>
                            )}
                            {Number(String(advanceRent ?? '').replace(/[^0-9.-]/g, '')) > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                                <span className="text-[#64748B]">Advance Rent</span>
                                <span className="font-semibold text-[#1E293B]">
                                  {formatPhpCurrency(advanceRent)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {Number(assocFee) > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">HOA Fee</span>
                            <span
                              data-testid="reso-hoa-fee"
                              className="font-semibold text-[#1E293B]"
                            >
                              {`₱${Number(assocFee).toLocaleString('en-PH')}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {partneredBanks.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                            Partnered Banks
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {partneredBanks.map((bank) => (
                              <Badge
                                key={bank.bankName}
                                variant="outline"
                                className="rounded-full bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B] px-3 py-1 normal-case tracking-normal"
                              >
                                {bank.logoUrl && (
                                  <img
                                    src={bank.logoUrl}
                                    alt={bank.bankName}
                                    className="size-4 object-contain rounded-sm"
                                  />
                                )}
                                <span>{bank.bankName}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}

              {(credentialRows.length > 0 || cleanDeveloperDescription) && (
                <section id="sec-credentials" className="scroll-mt-44">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Credentials"
                        title="Legal & Project Details"
                      />
                    </CardHeader>
                    <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-3 text-sm">
                      {credentialRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-4 py-2 border-b border-[#E2E8F0]"
                        >
                          <span className="text-[#64748B]">{row.label}</span>
                          <span className="font-semibold text-[#1E293B] text-right">{row.value}</span>
                        </div>
                      ))}
                      {cleanDeveloperDescription && (
                        <div className="pt-2 flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                            Developer Description
                          </span>
                          <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
                            {cleanDeveloperDescription}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>

      {/* Accessible Photo Gallery Lightbox */}
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
          <div className="flex items-center justify-between text-white pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold">{propertyTitle}</h3>
              <p className="text-xs text-[#CBD5E1]">
                Photo {activePhotoIndex + 1} of {photos.length}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsGalleryOpen(false)}
              aria-label="Close photo gallery"
              className="size-11 text-white hover:bg-white/20 rounded-full"
            >
              <X />
            </Button>
          </div>

          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-6 size-11 rounded-full bg-black/60 hover:bg-black/90 text-white z-10"
            >
              <ChevronLeft />
            </Button>

            <img
              src={photos[activePhotoIndex]}
              alt={`${propertyTitle} view ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg select-none shadow-2xl"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-2 sm:right-6 size-11 rounded-full bg-black/60 hover:bg-black/90 text-white z-10"
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-3 max-w-4xl mx-auto">
            {photos.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activePhotoIndex === idx ? 'border-[#0F766E] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
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
          <Card className="bg-white rounded-xl max-w-md w-full border border-[#E2E8F0] shadow-xl">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-[#E2E8F0]">
              <div>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Contact Listing Agent
                </CardTitle>
                <CardDescription className="text-xs">
                  {agent.name} · {agent.brokerage}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsContactModalOpen(false)}
                aria-label="Close contact dialog"
                className="size-11 rounded-lg"
              >
                <X />
              </Button>
            </CardHeader>

            <CardContent className="p-6 pt-4">
              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#1E293B]">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="h-11 px-4 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#1E293B]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="juan@example.com"
                    className="h-11 px-4 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#1E293B]">Mobile / Phone Number</label>
                  <input
                    type="tel"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className="h-11 px-4 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#1E293B]">Message</label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`Hello, I am interested in ${propertyTitle}.`}
                    className="p-4 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsContactModalOpen(false)}
                    className="min-h-11 rounded-lg normal-case tracking-normal"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    loading={isInquirySubmitting}
                    className="min-h-11 rounded-lg normal-case tracking-normal font-semibold"
                  >
                    {isInquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Integrated Modals */}
      <InspectionScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        property={property}
        onScheduleSuccess={() => {
          toast({
            title: 'Viewing Scheduled',
            description: 'Viewing appointment scheduled successfully!',
            variant: 'success',
          });
        }}
      />

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

      <EnlargedMapModal
        isOpen={isEnlargedMapOpen}
        onClose={() => setIsEnlargedMapOpen(false)}
        currentProperty={
          property ? { ...property, latitude: propertyCoords.lat, longitude: propertyCoords.lng } : null
        }
      />

      <ShareListingModal
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        listing={
          property
            ? {
              ...property,
              id,
              title: propertyTitle,
              formattedPrice: formattedPriceDisplay,
              address: displayAddress,
              coverImage: photos?.[0],
            }
            : null
        }
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
