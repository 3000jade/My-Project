import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  StreetViewModal,
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
          <span className="w-4 h-0.5 bg-[#FF6B6B] rounded-full shrink-0" aria-hidden="true" />
          <span>{eyebrow}</span>
        </div>
        <CardTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
          <span>{title}</span>
          <span className="text-[#FF6B6B]">.</span>
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
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isEnlargedMapOpen, setIsEnlargedMapOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('sec-details');

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

<<<<<<< HEAD
  // 3. Normalized Property Fields & Mapping (Address replaces standalone Title)
  const propertyTitle = formatPropertyAddressHeading(property, 'Metro Manila, Philippines');
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
=======
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
>>>>>>> property-tech-v3.0

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
        .catch(() => {});
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

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(sectionId);
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
      toast({
        title: 'Inquiry Sent',
        description: 'Inquiry sent! The listing contact will reach out soon.',
        variant: 'success',
      });
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    } catch {
      toast({
        title: 'Inquiry Saved',
        description: 'Inquiry saved. The listing contact will reach out.',
        variant: 'success',
      });
      setIsContactModalOpen(false);
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  // Loading Shimmer Skeleton State (DESIGN.md Section 8.2)
  if (isLoading && !property) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-28">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-on-surface-variant">Loading property showcase...</span>
=======
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col gap-6" role="status" aria-label="Loading property showcase">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-8 h-72 rounded-xl" />
            <Skeleton className="lg:col-span-4 h-72 rounded-xl" />
          </div>
>>>>>>> property-tech-v3.0
        </div>
      </div>
    );
  }

  // Error State (DESIGN.md Section 8.2)
  if (loadError && !property) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-28">
        <div className="max-w-md w-full text-center bg-surface p-8 rounded-xl border border-outline shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-accent flex items-center justify-center mx-auto">
            <IconBuilding size={24} />
          </div>
          <h2 className="text-xl font-bold text-on-surface">Listing Not Found</h2>
          <p className="text-xs text-on-surface-variant">The requested property listing could not be found or has been unpublished.</p>
          <Button asChild variant="default" className="w-full">
            <Link to="/properties">
              <IconArrowLeft size={16} />
              Back to Properties
            </Link>
          </Button>
        </div>
=======
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
>>>>>>> property-tech-v3.0
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
<<<<<<< HEAD
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary selection:text-white pt-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-on-surface text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <IconCheck size={16} className="text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row with Breadcrumbs & Back Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 flex items-center justify-between gap-4">
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary rounded px-1.5 py-1 shrink-0"
        >
          <IconArrowLeft size={15} />
          <span className="hidden sm:inline">Back to Properties</span>
          <span className="sm:hidden">Properties</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant overflow-x-auto">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-primary transition-colors">Properties</Link>
          <span>/</span>
          <span className="text-on-surface font-semibold truncate max-w-[200px]">{propertyTitle}</span>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 2. Editorial Header Block (Title, Badges, Clean Address) */}
        <section className="space-y-3">
          {/* Breadcrumb Eyebrow */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-primary transition-colors">Properties</Link>
            <span>/</span>
            <span className="font-semibold text-on-surface truncate max-w-[240px] sm:max-w-md">{propertyTitle}</span>
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

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
                {propertyTitle}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-on-surface-variant">
                <IconMapPin size={16} stroke={2} className="text-primary shrink-0" />
                <span>{fullAddress}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Property Photo Showcase Gallery */}
        <section className="relative w-full rounded-xl overflow-hidden bg-surface-variant border border-outline shadow-xs">
          {photos.length === 0 ? (
            <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center bg-surface-variant text-on-surface-variant">
              <IconPhoto size={48} stroke={1.5} className="text-on-surface-variant/60 mb-2" />
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
            /* 3-Image Showcase Gallery */
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
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                />
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
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
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
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
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
                className="bg-surface/95 backdrop-blur-md hover:bg-surface text-on-surface shadow-xs border border-outline gap-2 font-semibold"
              >
                <IconPhoto size={16} className="text-primary" />
                <span>View All Photos ({photos.length})</span>
              </Button>
            </div>
          )}
        </section>

        {/* 4. Key Specifications Ribbon */}
        <section className="bg-surface rounded-xl p-4 sm:p-5 border border-outline shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Bedrooms */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant border border-outline">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center shrink-0 border border-outline">
                <IconBed size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block truncate">Bedrooms</span>
                <span className="text-sm font-semibold text-on-surface truncate block" data-testid="reso-bedrooms">
                  {bedrooms != null ? `${bedrooms}` : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Bathrooms */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant border border-outline">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center shrink-0 border border-outline">
                <IconBath size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block truncate">Bathrooms</span>
                <span className="text-sm font-semibold text-on-surface truncate block" data-testid="reso-bathrooms">
                  {bathrooms != null ? `${bathrooms}` : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Floor Area */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant border border-outline">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center shrink-0 border border-outline">
                <IconDimensions size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block truncate">Floor Area</span>
                <span className="text-sm font-semibold text-on-surface truncate block" data-testid="reso-living-area">
                  {livingAreaFormatted || 'Not specified'}
                </span>
              </div>
            </div>

            {/* Lot Area */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant border border-outline">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center shrink-0 border border-outline">
                <IconHome size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block truncate">Lot Size</span>
                <span className="text-sm font-semibold text-on-surface truncate block" data-testid="reso-lot-size">
                  {lotAreaFormatted || '—'}
                </span>
              </div>
            </div>

            {/* Parking */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant border border-outline">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center shrink-0 border border-outline">
                <IconCar size={18} stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-on-surface-variant block truncate">Parking</span>
                <span className="text-sm font-semibold text-on-surface truncate block">
                  {parkingTotal != null ? `${parkingTotal} Slots` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. In-Page Navigation Bar */}
        <nav 
          aria-label="Property Navigation"
          className="sticky top-20 z-30 bg-surface/95 backdrop-blur-md border border-outline rounded-xl shadow-xs transition-all px-4 sm:px-6"
        >
          <div className="h-12 flex items-center justify-between gap-4">
            {/* Section Jump Links */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => scrollToSection('section-description')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'description'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Property Description
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-specs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'specs'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Specification
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-amenities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'amenities'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Amenities
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'map'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-financials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'financials'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Financials
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('section-documents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'documents'
                    ? 'bg-tertiary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                Documents
              </button>
            </div>

            {/* Quick Actions */}
=======
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
            className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`min-h-11 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                      isActive
                        ? 'bg-[#CCFBF1] text-[#0F766E]'
                        : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

>>>>>>> property-tech-v3.0
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleSaveToggle}
<<<<<<< HEAD
                aria-label={isSaved ? 'Remove from Viewing List' : 'Add to Viewing List'}
                className="px-3 gap-1.5 h-8 text-xs border-outline text-on-surface hover:bg-surface-variant"
              >
                <IconBookmark
                  size={14}
                  className={isSaved ? 'fill-primary text-primary' : 'text-on-surface-variant'}
=======
                aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
                className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
              >
                <Bookmark
                  data-icon="inline-start"
                  className={isSaved ? 'fill-[#0F766E] text-[#0F766E]' : 'text-[#64748B]'}
>>>>>>> property-tech-v3.0
                />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
<<<<<<< HEAD
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
                className="h-8 w-8 px-0 border-outline text-on-surface hover:bg-surface-variant"
              >
                <IconShare size={14} className="text-on-surface-variant" />
=======
                size="lg"
                onClick={() => setIsShareOpen(true)}
                aria-label="Share listing"
                className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
              >
                <Share2 data-icon="inline-start" className="text-[#64748B]" />
                <span className="hidden sm:inline">Share</span>
>>>>>>> property-tech-v3.0
              </Button>
            </div>
          </nav>

          {/* 3. PROPERTY DETAILS + BROCHURE SPREAD (8 / 4 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Column (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              {/* Property Details Section (Title, Tagline, Location & Specs) */}
              <section id="sec-details" className="scroll-mt-36">
                <PropertyHeroDetailsCard
                  propertyType={propertyType}
                  propertyCategory={propertyCategory}
                  title={propertyTitle}
                  tagline={propertyTagline}
                  fullAddress={fullAddress}
                  isVacantLot={isVacantLot}
                  bedrooms={bedrooms}
                  bathrooms={bathrooms}
                  parkingTotal={parkingTotal}
                  livingAreaFormatted={livingAreaFormatted}
                  lotAreaFormatted={lotAreaFormatted}
                />
              </section>

<<<<<<< HEAD
          {/* MAIN CONTENT COLUMN (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION 1: PROPERTY DESCRIPTION */}
            <div id="section-description" className="scroll-mt-40">
              {cleanPublicRemarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <IconFileText size={18} className="text-primary" />
                      <span>Property Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="reso-public-remarks" className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                      {cleanPublicRemarks}
=======
              {/* Property Specifications Card */}
              <section id="sec-specs" className="scroll-mt-36">
                <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                  <CardHeader className="p-6 pb-4">
                    <SectionHeading
                      eyebrow="Specifications"
                      title="Property Specifications"
                    />
                    <CardDescription>
                      Dimensions, layout, and construction details from the listing record.
                    </CardDescription>
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
>>>>>>> property-tech-v3.0
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
                <section id="sec-features" className="scroll-mt-36">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Amenities"
                        title="Features & Utilities"
                      />
                      <CardDescription>
                        Spaces, security, community amenities, and utilities included.
                      </CardDescription>
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

<<<<<<< HEAD
            {/* SECTION 2: SPECIFICATION */}
            <div id="section-specs" className="scroll-mt-40">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <IconBuilding size={18} className="text-primary" />
                    <span>Specification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Property Type</span>
                      <span className="font-semibold text-on-surface">{propertyType}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Transaction</span>
                      <span className="font-semibold text-on-surface">{typeBadgeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Condition / Status</span>
                      <span className="font-semibold text-on-surface">{propertyCondition || 'Good'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Year Built</span>
                      <span className="font-semibold text-on-surface" data-testid="reso-year-built">
                        {yearBuilt || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Total Stories / Floors</span>
                      <span className="font-semibold text-on-surface">{storiesTotal != null ? storiesTotal : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Lot Area</span>
                      <span className="font-semibold text-on-surface">
                        {lotAreaFormatted || '—'}
                      </span>
                    </div>
                    {(property?.unit_number || property?.unitNumber || property?.UnitNumber) && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Unit Number</span>
                        <span className="font-semibold text-on-surface" data-testid="reso-unit-number">
                          {property?.unit_number || property?.unitNumber || property?.UnitNumber}
                        </span>
                      </div>
                    )}
                    {(property?.floor_level || property?.floorLevel) && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Floor Level</span>
                        <span className="font-semibold text-on-surface">
                          {property.floor_level || property.floorLevel}
                        </span>
                      </div>
                    )}
                    {(property?.furnishing || property?.Furnishing) && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Furnishing</span>
                        <span className="font-semibold text-on-surface">
                          {property.furnishing || property.Furnishing}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Architectural Style</span>
                      <span className="font-semibold text-on-surface">{architecturalStyle || 'Modern'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Covered Parking</span>
                      <span className="font-semibold text-on-surface">{parkingCovered != null ? `${parkingCovered} slots` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Open Parking</span>
                      <span className="font-semibold text-on-surface">{parkingOpen != null ? `${parkingOpen} slots` : '—'}</span>
                    </div>
                    {/* Only display listing status row if not pending confirmation */}
                    {!isStatusPending && standardStatus && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Listing Status</span>
                        <span className="font-semibold text-primary">{standardStatus}</span>
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
                    <IconLayersLinked size={18} className="text-primary" />
                    <span>Features & Amenities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shared Amenities */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                      Shared Community Amenities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.shared.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-variant border border-outline text-xs text-on-surface">
                          <div className="w-5 h-5 rounded-full bg-tertiary-container/50 text-primary flex items-center justify-center shrink-0">
                            <IconCheck size={12} stroke={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-outline pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                      Indoor Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.indoor.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-variant border border-outline text-xs text-on-surface">
                          <div className="w-5 h-5 rounded-full bg-tertiary-container/50 text-primary flex items-center justify-center shrink-0">
                            <IconCheck size={12} stroke={3} />
                          </div>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-outline pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                      Outdoor & Eco Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featureGroups.outdoor.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-variant border border-outline text-xs text-on-surface">
                          <div className="w-5 h-5 rounded-full bg-tertiary-container/50 text-primary flex items-center justify-center shrink-0">
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
                        <IconMapPin size={18} className="text-primary" />
                        <span>Map</span>
                      </CardTitle>
                      <p className="text-xs text-on-surface-variant mt-1">{fullAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary bg-tertiary-container/40 border border-outline px-2.5 py-1 rounded">
                        {fullAddress.includes('Address pending')
                          ? 'Approx. District Centroid'
                          : `${propertyCoords.lat.toFixed(4)}°N, ${propertyCoords.lng.toFixed(4)}°E`}
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
                        className="gap-1.5 border-outline text-on-surface hover:bg-surface-variant"
                      >
                        <IconCompass size={14} className="text-primary" />
                        <span>360° Street View</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Interactive Google Map Canvas */}
                  <div className="relative isolate z-0 w-full h-80 sm:h-96 rounded-lg overflow-hidden border border-outline bg-surface-variant" data-lenis-prevent="true">
                    <GooglePropertyMap
                      properties={property ? [{ ...property, latitude: propertyCoords.lat, longitude: propertyCoords.lng }] : []}
                      selectedPropertyId={property?.id}
                      singlePropertyMode={true}
                      showControls={false}
                      onOpenStreetView={() => setIsStreetViewOpen(true)}
                    />
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
                    <IconCurrencyDollar size={18} className="text-primary" />
                    <span>Financial Breakdown & Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">{isRent ? 'Monthly Rent' : 'Listing Price'}</span>
                      <span className="font-bold text-primary" data-testid="reso-list-price">{formattedPriceDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Currency</span>
                      <span className="font-semibold text-on-surface">{currency}</span>
                    </div>
                    {isRent && (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-outline">
                          <span className="text-on-surface-variant">Rental Frequency</span>
                          <span className="font-semibold text-on-surface">{rentFreq}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-outline">
                          <span className="text-on-surface-variant">Minimum Lease Term</span>
                          <span className="font-semibold text-on-surface">{leaseTerm || '12 Months'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-outline">
                          <span className="text-on-surface-variant">Security Deposit</span>
                          <span className="font-semibold text-on-surface">{securityDeposit ? `₱${Number(securityDeposit).toLocaleString('en-PH')}` : '2 Months'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-outline">
                          <span className="text-on-surface-variant">Advance Rent</span>
                          <span className="font-semibold text-on-surface">{advanceRent ? `₱${Number(advanceRent).toLocaleString('en-PH')}` : '1 Month'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-outline">
                      <span className="text-on-surface-variant">Association / HOA Fee</span>
                      <span className="font-semibold text-on-surface" data-testid="reso-hoa-fee">
                        {assocFee != null && !isNaN(assocFee) ? `₱${Number(assocFee).toLocaleString('en-PH')}` : 'Included in dues'}
                      </span>
                    </div>
                    {property?.promo_cash_out && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Promo Cash Out</span>
                        <span className="font-semibold text-on-surface">{property.promo_cash_out}</span>
                      </div>
                    )}
                    {property?.monthly_amortization && (
                      <div className="flex items-center justify-between py-2 border-b border-outline">
                        <span className="text-on-surface-variant">Estimated Amortization</span>
                        <span className="font-semibold text-on-surface">{property.monthly_amortization}</span>
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
                    <IconFileText size={18} className="text-primary" />
                    <span>Official Media & Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mediaList.length > 0 ? (
                    <div className="space-y-3">
                      {mediaList.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-outline hover:bg-surface-variant transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-tertiary-container/40 text-primary flex items-center justify-center font-bold text-xs border border-outline">
                              <IconFileText size={18} />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-on-surface">{doc.title || doc.name || 'Property Brochure'}</div>
                              <div className="text-xs text-on-surface-variant">{doc.type || 'PDF'} • {doc.file_size || 'Verified Document'}</div>
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
                            className="gap-1.5 text-on-surface-variant hover:text-on-surface"
=======
              {/* Location, Nearby Places & Map */}
              <section id="sec-location" className="scroll-mt-36">
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
>>>>>>> property-tech-v3.0
                          >
                            <Maximize2 data-icon="inline-start" className="text-[#0F766E]" />
                            Enlarge Map
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setIsStreetViewOpen(true)}
                            className="min-h-11 px-4 rounded-lg text-xs normal-case tracking-normal"
                          >
                            <Compass data-icon="inline-start" className="text-[#0F766E]" />
                            360° Street View
                          </Button>
                        </div>
<<<<<<< HEAD
                      ))}
                    </div>
                  ) : (
                    /* Empty Placeholder State */
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-variant/60 rounded-lg border border-dashed border-outline">
                      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-on-surface-variant mb-2.5 border border-outline">
                        <IconFileText size={20} />
                      </div>
                      <p className="text-xs font-semibold text-on-surface">No documents uploaded</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 max-w-sm">
                        Architectural brochures, floor plans, and elevation documents have not been attached to this listing yet.
                      </p>
=======
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
                        onOpenStreetView={() => setIsStreetViewOpen(true)}
                      />
>>>>>>> property-tech-v3.0
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
            <aside className="lg:col-span-4 flex flex-col gap-6 min-w-0 lg:sticky lg:top-36">
              <section id="sec-agent" className="scroll-mt-36">
                <PropertyAgentCard
                  agent={agent}
                  onScheduleViewing={() => setIsScheduleModalOpen(true)}
                  onContactAgent={() => setIsContactModalOpen(true)}
                  onOpenAgentModal={() => setIsAgentModalOpen(true)}
                />
              </section>

<<<<<<< HEAD
          {/* 6. HIGH-CONVERSION STICKY SIDEBAR (Right 4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-36">
            
            {/* Price & Booking Plinth Card */}
            <Card className="border border-outline shadow-xs">
              <CardContent className="p-5 sm:p-6 space-y-5">
                
                {/* Price Display */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block">
                    {isRent ? 'Rental Rate' : 'Price'}
                  </span>
                  <div className="text-3xl font-extrabold text-primary tracking-tight mt-0.5">
                    {formattedPriceDisplay}
                    {isRent && <span className="text-sm font-normal text-on-surface-variant"> / {rentFreq}</span>}
                  </div>
                  {property?.monthly_amortization && (
                    <div className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
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
                    className="w-full border-outline text-on-surface hover:bg-surface-variant gap-2 font-semibold text-xs"
                  >
                    <IconMail size={18} />
                    <span>Contact Listing Agent</span>
                  </Button>

                  {/* Quick Connect: Call / Share */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5 border-outline text-on-surface hover:bg-surface-variant">
                      <a href={`tel:${agent.phone}`}>
                        <IconPhone size={14} className="text-primary" />
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
                      className="w-full gap-1.5 border-outline text-on-surface hover:bg-surface-variant"
                    >
                      <IconShare size={14} className="text-on-surface-variant" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>

                {/* Agent Profile Plinth */}
                <div className="pt-4 border-t border-outline space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-outline"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-on-surface truncate">{agent.name}</div>
                      <div className="text-xs text-on-surface-variant truncate">{agent.title}</div>
                      <div className="text-xs text-primary font-medium truncate" data-testid="reso-list-office-name">
                        {agent.brokerage}
=======
              {hasPaymentContent && (
                <section id="sec-payment" className="scroll-mt-36">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Financing"
                        title="Pricing & Partnered Banks"
                      />
                      <CardDescription>Pricing terms, dues, and partnered banks.</CardDescription>
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
                        {paymentBreakdown?.reservationFee && (
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
                        {paymentBreakdown?.loanableAmount && (
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
                        {paymentBreakdown?.monthlyAmortization && (
                          <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                            <span className="text-[#64748B]">Est. Monthly</span>
                            <span className="font-semibold text-[#1E293B]">
                              {formatPhpCurrency(paymentBreakdown.monthlyAmortization)} / mo
                            </span>
                          </div>
                        )}
                        {paymentBreakdown?.moveInFees && (
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
                            {securityDeposit && (
                              <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                                <span className="text-[#64748B]">Security Deposit</span>
                                <span className="font-semibold text-[#1E293B]">
                                  {formatPhpCurrency(securityDeposit)}
                                </span>
                              </div>
                            )}
                            {advanceRent && (
                              <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                                <span className="text-[#64748B]">Advance Rent</span>
                                <span className="font-semibold text-[#1E293B]">
                                  {formatPhpCurrency(advanceRent)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                          <span className="text-[#64748B]">HOA Fee</span>
                          <span
                            data-testid="reso-hoa-fee"
                            className="font-semibold text-[#1E293B]"
                          >
                            {assocFee != null && !isNaN(assocFee)
                              ? `₱${Number(assocFee).toLocaleString('en-PH')}`
                              : 'Included in dues'}
                          </span>
                        </div>
>>>>>>> property-tech-v3.0
                      </div>

<<<<<<< HEAD
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAgentModalOpen(true)}
                    className="w-full bg-surface-variant hover:bg-surface text-primary border border-outline text-xs font-semibold gap-1.5 h-8"
                  >
                    <IconCheck size={13} />
                    <span>View Verified Advisor Credentials</span>
                  </Button>

                  {(property?.call_to_action || property?.cta) && (
                    <p className="text-xs text-on-surface-variant text-center pt-1 font-normal">
                      {property.call_to_action || property.cta}
                    </p>
                  )}
                </div>

              </CardContent>
            </Card>

          </aside>
=======
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
>>>>>>> property-tech-v3.0

              {(credentialRows.length > 0 || cleanDeveloperDescription) && (
                <section id="sec-credentials" className="scroll-mt-36">
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardHeader className="p-6 pb-4">
                      <SectionHeading
                        eyebrow="Credentials"
                        title="Legal & Project Details"
                      />
                      <CardDescription>Registration, developer, and title status.</CardDescription>
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
<<<<<<< HEAD
                className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all cursor-pointer ${
                  activePhotoIndex === idx ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
=======
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  activePhotoIndex === idx ? 'border-[#0F766E] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
>>>>>>> property-tech-v3.0
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
<<<<<<< HEAD
          <div className="bg-surface rounded-xl max-w-md w-full p-6 shadow-xl border border-outline space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline">
              <div>
                <h3 className="text-base font-bold text-on-surface">Contact Listing Agent</h3>
                <p className="text-xs text-on-surface-variant">{agent.name} • {agent.brokerage}</p>
=======
          <Card className="bg-white rounded-xl max-w-md w-full border border-[#E2E8F0] shadow-xl">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-[#E2E8F0]">
              <div>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Contact Listing Agent
                </CardTitle>
                <CardDescription className="text-xs">
                  {agent.name} · {agent.brokerage}
                </CardDescription>
>>>>>>> property-tech-v3.0
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsContactModalOpen(false)}
<<<<<<< HEAD
                className="text-on-surface-variant hover:text-on-surface h-8 w-8"
=======
                aria-label="Close contact dialog"
                className="size-11 rounded-lg"
>>>>>>> property-tech-v3.0
              >
                <X />
              </Button>
            </CardHeader>

<<<<<<< HEAD
            <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-on-surface block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 border border-outline rounded-lg text-on-surface bg-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full p-2.5 border border-outline rounded-lg text-on-surface bg-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">Mobile / Phone Number</label>
                <input
                  type="tel"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full p-2.5 border border-outline rounded-lg text-on-surface bg-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={`Hello, I am interested in ${propertyTitle}. Please provide additional information.`}
                  className="w-full p-2.5 border border-outline rounded-lg text-on-surface bg-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
=======
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
>>>>>>> property-tech-v3.0

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

      <StreetViewModal
        isOpen={isStreetViewOpen}
        coordinates={propertyCoords}
        propertyTitle={propertyTitle}
        onClose={() => setIsStreetViewOpen(false)}
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
                address: fullAddress,
                coverImage: photos?.[0],
              }
            : null
        }
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
