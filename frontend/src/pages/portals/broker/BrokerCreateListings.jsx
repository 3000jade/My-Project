import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { MotionConfig, motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  MapPin,
  Sliders,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Save,
  Send,
  CheckCircle2,
  Eye,
  RotateCcw,
} from 'lucide-react';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '../../../components/ui';
<<<<<<< HEAD
import propertyService, {
  normalizeProperty,
  toApiPayload,
  formatPropertyAddressHeading,
  formatPropertyDeveloperName,
  formatMergedStatusPill,
  resolvePropertyLifecycleState,
} from '../../../services/propertyService';
=======
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import propertyService, { toApiPayload } from '../../../services/propertyService';
>>>>>>> property-tech-v3.0
import agentService from '../../../services/agentService';
import { useAuth } from '../../../context/AuthContext';
import mapsService from '../../../services/mapsService';
import phLocationService from '../../../services/phLocationService';
import driveService from '../../../services/driveService';

import ListingSkeleton from './components/property-form/ListingSkeleton';
import ListingStepIdentityPricing from './components/property-form/ListingStepIdentityPricing';
import ListingStepLocation from './components/property-form/ListingStepLocation';
import ListingStepSpecsFeatures from './components/property-form/ListingStepSpecsFeatures';
import ListingStepMedia from './components/property-form/ListingStepMedia';
import ListingStepCredentialsReview from './components/property-form/ListingStepCredentialsReview';
import ListingPreviewCard from './components/property-form/ListingPreviewCard';
import LocationPinMap from './components/property-form/LocationPinMap';
import { getPropertyTypeConfig } from './components/property-form/propertyTypeConfig';

const STEPS = [
  { id: 1, title: 'Details & Price', icon: Tag },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Specs & Features', icon: Sliders },
  { id: 4, title: 'Photos & Floor Plan', icon: ImageIcon },
  { id: 5, title: 'Review & Publish', icon: ShieldCheck },
];

const INITIAL_FORM_DATA = {
  listing_id: '',
  title: '',
  transaction_type: 'For Sale',
  propertyCategory: 'Residential',
  property_type: 'House & Lot',
  property_type_id: 1,
  propertyStatus: 'Ready for Occupancy',
  property_condition: 'Ready for Occupancy',
  price: '',
  pricePerSqm: '',
  partneredBanks: [],
  selectedGalleryAreas: [],
  customGalleryCategories: [],
  categoryDescriptions: {},
  paymentBreakdown: {
    reservationFee: '',
    downpayment: '',
    downpaymentTerm: '',
    loanTerm: '15 Years',
    monthlyAmortization: '',
    moveInFees: '',
  },
  association_fee: '',
  associationFee: '',
  // Location
  region: '',
  region_psgc_code: '',
  province: '',
  state_or_province: '',
  state: '',
  province_psgc_code: '',
  city: '',
  location: '',
  city_psgc_code: '',
  barangay: '',
  barangay_psgc_code: '',
  address: '',
  building_name: '',
  tower_name: '',
  floor_level: '',
  unit_number: '',
  latitude: '',
  longitude: '',
  mapPinPrivacy: 'Exact Location',
  // Specs & Features
  lot_size_area: '',
  living_area: '',
  bedrooms_total: '3',
  bathrooms_total_integer: '2',
  parking_total: '1',
  furnishing: 'None',
  securityFeatures: [],
  amenities: [],
  utilities: [],
  nearbyPlaces: {
    highway: '',
    transit: '',
    school: '',
    hospital: '',
    mall: '',
  },
  nearbyPlacesPins: [],
  // Media
  description: '',
  // Credentials & Agent Permissions
  list_agent_key: null,
  handlerMode: null,
  agentPermissions: {
    canEditListing: true,
    notifyBrokerOnChange: true,
  },
  credentials: {
    developer: '',
    developerDescription: '',
    brokerage: 'Human Shelter Realty',
    dhsudLicenseNo: '',
    assignedAgent: '',
    prcLicenseNo: '',
    brokerDhsudLicenseNo: '',
    contactNumber: '',
    contactEmail: '',
    messengerUrl: '',
    facebookUrl: '',
    whatsapp: '',
  },
  status: 'AVAILABLE',
  standard_status: 'Active',
  is_published: true,
  is_featured: false,
};

export default function BrokerCreateListings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isEditing = Boolean(id && id !== 'new');

  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  const stepParam = Number(queryParams.get('step'));

  const [currentStep, setCurrentStep] = useState(
    stepParam >= 1 && stepParam <= 5 ? stepParam : 1
  );
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeActionLabel, setActiveActionLabel] = useState('');
  const [submissionError, setSubmissionError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState(null);
  const [savedStatusType, setSavedStatusType] = useState('Active');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [missingFieldsModal, setMissingFieldsModal] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [mediaPhotos, setMediaPhotos] = useState([]);
  const [categoryVideos, setCategoryVideos] = useState({});

  // PSGC Geographic state
  const [geoRegions, setGeoRegions] = useState([]);
  const [geoProvinces, setGeoProvinces] = useState([]);
  const [geoCities, setGeoCities] = useState([]);
  const [geoBarangays, setGeoBarangays] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);

  // Map Geocoding state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const latestPinRequestRef = useRef(0);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Initial lookups: property types, agents, regions
  useEffect(() => {
    setGeoRegions(phLocationService.getRegions());

    propertyService
      .getPropertyTypes?.()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setPropertyTypes(list);
      })
      .catch(() => { });

    agentService
      .getAgents?.()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setAgents(list);
      })
      .catch(() => { });
  }, []);

  // Pre-fill type from URL param when creating
  useEffect(() => {
    if (typeParam && !isEditing) {
      const matched = getPropertyTypeConfig(typeParam);
      setFormData((prev) => ({
        ...prev,
        property_type: matched?.name || typeParam,
        property_type_id: matched?.dbTypeId || prev.property_type_id,
      }));
    }
  }, [typeParam, isEditing]);

  // Load existing listing in edit mode
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;

    const fetchProperty = async () => {
      try {
        const p = await propertyService.getPropertyById(id);
        if (!p || cancelled) return;

        const custom = p.customResoAttributes || p.custom_reso_attributes || {};
        const numericPrice = Number(p.price_raw ?? p.price ?? 0);

        setFormData((prev) => ({
          ...prev,
          listing_id: p.listing_id || p.listingId || '',
          title: p.title || '',
          description: p.description || p.publicRemarks || '',
          transaction_type: p.transaction_type || p.specs?.transactionType || 'For Sale',
          propertyCategory: custom.propertyCategory || 'Residential',
          property_type: p.property_type || p.type || 'House & Lot',
          property_type_id: p.property_type_id || p.specs?.propertyTypeId || 1,
          propertyStatus: custom.propertyStatus || p.property_condition || 'Ready for Occupancy',
          property_condition: p.property_condition || 'Ready for Occupancy',
          price: numericPrice > 0 ? numericPrice.toLocaleString() : '',
          pricePerSqm: custom.pricePerSqm || '',
          partneredBanks: Array.isArray(custom.partneredBanks) ? custom.partneredBanks : [],
          selectedGalleryAreas: Array.isArray(custom.selectedGalleryAreas) ? custom.selectedGalleryAreas : [],
          customGalleryCategories: Array.isArray(custom.customGalleryCategories) ? custom.customGalleryCategories : [],
          categoryDescriptions: custom.categoryDescriptions || {},
          paymentBreakdown: custom.paymentBreakdown || prev.paymentBreakdown,
          association_fee: p.association_fee ?? p.associationFee ?? '',
          associationFee: p.association_fee ?? p.associationFee ?? '',
          // Location
          region: p.location?.region || p.region || '',
          region_psgc_code: p.location?.region_psgc_code || p.region_psgc_code || '',
          province: p.location?.stateOrProvince || p.state_or_province || '',
          state_or_province: p.location?.stateOrProvince || p.state_or_province || '',
          state: p.location?.stateOrProvince || p.state_or_province || '',
          province_psgc_code: p.location?.province_psgc_code || p.province_psgc_code || '',
          city: p.location?.city || p.city || '',
          location: p.location?.city || p.city || '',
          city_psgc_code: p.location?.city_psgc_code || p.city_psgc_code || '',
          barangay: p.location?.barangay || p.barangay || '',
          barangay_psgc_code: p.location?.barangay_psgc_code || p.barangay_psgc_code || '',
          address: p.location?.address || p.address || '',
          building_name: p.location?.buildingName || p.building_name || '',
          tower_name: custom.towerName || p.tower_name || '',
          floor_level: custom.floorLevel || p.floor_level || '',
          latitude: p.location?.coordinates?.lat || p.latitude || '',
          longitude: p.location?.coordinates?.lng || p.longitude || '',
          mapPinPrivacy: custom.mapPinPrivacy || 'Exact Location',
          // Specs
          lot_size_area: String(p.specs?.lotSizeArea ?? p.lot_size_area ?? ''),
          living_area: String(p.specs?.livingArea ?? p.living_area ?? ''),
          bedrooms_total: String(p.specs?.bedroomsTotal ?? p.bedrooms_total ?? '3'),
          bathrooms_total_integer: String(p.specs?.bathroomsTotalInteger ?? p.bathrooms_total_integer ?? '2'),
          parking_total: String(p.specs?.parkingTotal ?? p.parking_total ?? '1'),
          furnishing: custom.furnishing || p.furnishing || 'None',
          securityFeatures: Array.isArray(custom.securityFeatures) ? custom.securityFeatures : [],
          amenities: Array.isArray(p.features) ? p.features : p.amenities || [],
          utilities: Array.isArray(custom.utilities) ? custom.utilities : [],
          nearbyPlaces: custom.nearbyPlaces || prev.nearbyPlaces,
          nearbyPlacesPins: Array.isArray(custom.nearbyPlacesPins) ? custom.nearbyPlacesPins : [],
          description: p.publicRemarks || p.description || '',
          list_agent_key: p.list_agent_key || p.listAgentKey || null,
          loaded_agent_key: p.list_agent_key || p.listAgentKey || null,
          assignment_status: p.assignment_status || p.assignmentStatus || custom.assignment_status || '',
          handlerMode: custom.handlerMode || null,
          agentPermissions: custom.agentPermissions || prev.agentPermissions,
          credentials: custom.credentials || prev.credentials,
          status: p.status || 'AVAILABLE',
          standard_status: p.standard_status || p.standardStatus || 'Active',
          is_published: p.is_published !== undefined ? Boolean(p.is_published) : true,
          is_featured: Boolean(p.is_featured),
        }));

        // Populate categorized photos
        if (Array.isArray(p.media) && p.media.length > 0) {
          const loadedPhotos = p.media
            .filter((m) => ['Photo', 'FloorPlan'].includes(m.mediaCategory || m.media_category))
            .map((m, idx) => ({
              id: m.id || `photo-${idx}`,
              imageUrl: m.mediaUrl || m.media_url,
              mediaUrl: m.mediaUrl || m.media_url,
              galleryCategory:
                m.galleryCategory ||
                m.gallery_category ||
                ((m.mediaCategory || m.media_category) === 'FloorPlan'
                  ? 'FloorPlan'
                  : idx === 0
                    ? 'Cover'
                    : 'Living'),
              shortDescription: m.shortDescription || m.short_description || '',
              displayOrder: m.orderIndex ?? m.order_index ?? idx + 1,
              mimeType: m.mimeType || m.mime_type || 'image/jpeg',
            }));
          setMediaPhotos(loadedPhotos);

          const savedVideos = { ...(custom.categoryVideos || {}) };
          p.media
            .filter((m) => (m.mediaCategory || m.media_category) === 'Video')
            .forEach((m) => {
              const catKey = m.galleryCategory || m.gallery_category || 'Living';
              savedVideos[catKey] = {
                mediaUrl: m.mediaUrl || m.media_url,
                shortDescription: m.shortDescription || m.short_description || '',
                mimeType: m.mimeType || m.mime_type || 'video/mp4',
                thumbnailUrl: savedVideos[catKey]?.thumbnailUrl || '',
                fileName: savedVideos[catKey]?.fileName || `${catKey} Video`,
              };
            });
          if (Object.keys(savedVideos).length > 0) {
            setCategoryVideos(savedVideos);
          }
        } else if (Array.isArray(p.images) && p.images.length > 0) {
          setMediaPhotos(
            p.images.map((url, idx) => ({
              id: `photo-${idx}`,
              imageUrl: url,
              mediaUrl: url,
              galleryCategory: idx === 0 ? 'Cover' : 'Living',
              shortDescription: '',
              displayOrder: idx + 1,
              mimeType: 'image/jpeg',
            }))
          );
        }
      } catch (err) {
        console.error('[BrokerCreateListings] Failed to load listing:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  // Cascading PSGC Effects
  useEffect(() => {
    if (!formData.region_psgc_code) {
      setGeoProvinces([]);
      return;
    }
    if (!phLocationService.isProvinceApplicable(formData.region_psgc_code)) {
      setGeoProvinces([]);
      setIsLoadingProvinces(false);
      return;
    }
    setIsLoadingProvinces(true);
    try {
      const res = phLocationService.getProvinces(formData.region_psgc_code);
      setGeoProvinces(Array.isArray(res) ? res : []);
    } finally {
      setIsLoadingProvinces(false);
    }
  }, [formData.region_psgc_code]);

  useEffect(() => {
    if (!formData.region_psgc_code) {
      setGeoCities([]);
      return;
    }
    const isProvApplicable = phLocationService.isProvinceApplicable(formData.region_psgc_code);
    if (isProvApplicable && !formData.province_psgc_code) {
      setGeoCities([]);
      return;
    }
    setIsLoadingCities(true);
    try {
      const res = isProvApplicable
        ? phLocationService.getCities({ provinceCode: formData.province_psgc_code })
        : phLocationService.getCities({ regionCode: formData.region_psgc_code });
      setGeoCities(Array.isArray(res) ? res : []);
    } finally {
      setIsLoadingCities(false);
    }
  }, [formData.region_psgc_code, formData.province_psgc_code]);

  useEffect(() => {
    if (!formData.city_psgc_code) {
      setGeoBarangays([]);
      return;
    }
    let cancelled = false;
    setIsLoadingBarangays(true);
    Promise.resolve(phLocationService.getBarangays(formData.city_psgc_code))
      .then((res) => {
        if (!cancelled) setGeoBarangays(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setGeoBarangays([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBarangays(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.city_psgc_code]);

  // PSGC Selection Handlers (supports both shadcn Select string value and native event)
  const extractVal = (valOrEvent) =>
    typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value || '';

  const handleRegionSelect = (valOrEvent) => {
    const code = extractVal(valOrEvent);
    const regObj = geoRegions.find((r) => r.regionCode === code);
    const regName = regObj ? regObj.regionName : '';
    const isProvApplicable = phLocationService.isProvinceApplicable(code);

    setIsDirty(true);
    if (formData.city_psgc_code || formData.city) {
      setLocationNotice({
        type: 'info',
        message: 'Region changed — city and barangay were cleared so they stay matched.',
      });
      setTimeout(() => setLocationNotice(null), 5000);
    }

    setFormData((prev) => ({
      ...prev,
      region: regName,
      region_psgc_code: code,
      province_psgc_code: '',
      province: isProvApplicable ? '' : regName,
      state_or_province: isProvApplicable ? '' : regName,
      state: isProvApplicable ? '' : regName,
      city_psgc_code: '',
      city: '',
      location: '',
      barangay_psgc_code: '',
      barangay: '',
    }));
    if (regName) setMapSearchQuery(`${regName}, Philippines`);
  };

  const handleProvinceSelect = (valOrEvent) => {
    const code = extractVal(valOrEvent);
    const provObj = geoProvinces.find((p) => p.provinceCode === code);
    const provName = provObj ? provObj.provinceName : '';
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      province_psgc_code: code,
      province: provName,
      state_or_province: provName,
      state: provName,
      city_psgc_code: '',
      city: '',
      location: '',
      barangay_psgc_code: '',
      barangay: '',
    }));
    if (provName) setMapSearchQuery(`${provName}, Philippines`);
  };

  const handleCitySelect = (valOrEvent) => {
    const code = extractVal(valOrEvent);
    const cityObj = geoCities.find((c) => c.cityCode === code);
    const cityName = cityObj ? cityObj.cityName : '';
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      city_psgc_code: code,
      city: cityName,
      location: cityName,
      barangay_psgc_code: '',
      barangay: '',
    }));
    if (cityName) {
      setMapSearchQuery(`${cityName}, ${formData.province || formData.region || 'Philippines'}`);
    }
  };

  const handleBarangaySelect = (valOrEvent) => {
    const code = extractVal(valOrEvent);
    const brgyObj = geoBarangays.find((b) => b.barangayCode === code);
    const brgyName = brgyObj ? brgyObj.barangayName : '';
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      barangay_psgc_code: code,
      barangay: brgyName,
    }));
  };

  // Price Input Formatting
  const handlePriceChange = (e) => {
    setIsDirty(true);
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setFormData((prev) => ({ ...prev, price: raw }));
  };

  const handlePriceFocus = () => {
    const raw = String(formData.price || '').replace(/,/g, '');
    setFormData((prev) => ({ ...prev, price: raw }));
  };

  const handlePriceBlur = () => {
    const num = Number(String(formData.price || '').replace(/[^0-9.]/g, ''));
    if (num > 0) {
      setFormData((prev) => ({ ...prev, price: num.toLocaleString() }));
    }
  };

  // Map Geocoding & Pin
  const mapPosition =
    formData.latitude && formData.longitude
      ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
      : [14.5995, 120.9842];

  const handleMapPositionChange = (pos) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      latitude: pos[0].toFixed(7),
      longitude: pos[1].toFixed(7),
    }));
  };

  const handlePinMoved = async (pos) => {
    const reqId = ++latestPinRequestRef.current;
    try {
      const geo = await mapsService.reverse(pos[0], pos[1]);
      if (geo && reqId === latestPinRequestRef.current) {
        setFormData((prev) => ({
          ...prev,
          latitude: pos[0].toFixed(7),
          longitude: pos[1].toFixed(7),
        }));
      }
    } catch {
      // Ignore reverse geocode errors when offline
    }
  };

  const handleGeocode = async (e) => {
    if (e) e.preventDefault();
    const query = mapSearchQuery.trim();
    if (!query) return;
    setIsGeocoding(true);
    try {
      const geo = await mapsService.geocode(query, 'ph');
      if (geo?.latitude && geo?.longitude) {
        setIsDirty(true);
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(geo.latitude).toFixed(7),
          longitude: parseFloat(geo.longitude).toFixed(7),
        }));
        setAddressSuggestions([]);
      }
    } catch (err) {
      console.error('[BrokerCreateListings] Geocode error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced Google Maps address predictions when typing in Step 2 search box
  useEffect(() => {
    const query = (mapSearchQuery || '').trim();
    if (query.length < 3 || currentStep !== 2) {
      if (query.length < 3) setAddressSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await mapsService.autocomplete(query, 'ph');
        if (!cancelled && Array.isArray(results)) {
          setAddressSuggestions(results);
        }
      } catch {
        // Ignore transient autocomplete errors
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mapSearchQuery, currentStep]);

  const handleSelectAddressSuggestion = async (item) => {
    const label = item.description || item.display_name || item.label || item.mainText || '';
    setMapSearchQuery(label);
    setAddressSuggestions([]);
    const lat = item.lat || item.latitude;
    const lng = item.lon || item.lng || item.longitude;
    if (lat && lng) {
      handleMapPositionChange([parseFloat(lat), parseFloat(lng)]);
      return;
    }
    if (label) {
      setIsGeocoding(true);
      try {
        const geo = await mapsService.geocode(label, 'ph');
        if (geo?.latitude && geo?.longitude) {
          handleMapPositionChange([parseFloat(geo.latitude), parseFloat(geo.longitude)]);
        }
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  const handleSuggestNearbyPlaces = async () => {
    const result = await mapsService.suggestNearbyPlaces({
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      address: formData.address,
      barangay: formData.barangay,
      city: formData.city || formData.location,
      province: formData.province,
      region: formData.region,
    });
    if (result) {
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        nearbyPlaces: {
          highway: result.highway || prev.nearbyPlaces?.highway || '',
          transit: result.transit || prev.nearbyPlaces?.transit || '',
          school: result.school || prev.nearbyPlaces?.school || '',
          hospital: result.hospital || prev.nearbyPlaces?.hospital || '',
          mall: result.mall || prev.nearbyPlaces?.mall || '',
        },
        nearbyPlacesPins: Array.isArray(result.nearbyPins) ? result.nearbyPins : prev.nearbyPlacesPins,
      }));
    }
  };

  // Categorized Photo Upload Handlers
  const uploadSingleMediaFile = async (file, category, updateItemCallback) => {
    try {
      updateItemCallback({ isUploading: true, error: null });
      const targetPropertyId = id && id !== 'new' ? id : 'general';
      const uploaded = await driveService.uploadFile(file, targetPropertyId, category);
      const liveUrl = uploaded.directImageUrl || uploaded.webViewLink;
      updateItemCallback({
        isUploading: false,
        error: null,
        mediaUrl: liveUrl,
        imageUrl: liveUrl,
        mimeType: file.type || 'image/jpeg',
      });
    } catch (err) {
      const isAuth = err.status === 401 || err.response?.status === 401;
      updateItemCallback({
        isUploading: false,
        error: isAuth
          ? 'Session expired. Please sign in again before uploading.'
          : err.response?.data?.error || err.message || 'Upload failed',
        mediaUrl: null,
      });
    }
  };

  const handleUploadBankLogo = async (bankName, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsDirty(true);
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      partneredBanks: (prev.partneredBanks || []).map((b) =>
        b.bankName === bankName ? { ...b, logoUrl: localPreview } : b
      ),
    }));
    try {
      const targetPropertyId = id && id !== 'new' ? id : 'general';
      const uploaded = await driveService.uploadFile(file, targetPropertyId, 'Photos');
      const liveUrl = uploaded.directImageUrl || uploaded.webViewLink;
      if (liveUrl) {
        setFormData((prev) => ({
          ...prev,
          partneredBanks: (prev.partneredBanks || []).map((b) =>
            b.bankName === bankName ? { ...b, logoUrl: liveUrl } : b
          ),
        }));
      }
    } catch {
      // Keep local preview if offline or unauthenticated
    }
  };

  const handleUploadCategoryFiles = (galleryCategory, fileList, maxLimit = 5) => {
    const existingCount = mediaPhotos.filter((p) => p.galleryCategory === galleryCategory).length;
    const remainingSlots = Math.max(0, maxLimit - existingCount);
    if (remainingSlots === 0) return;

    const files = Array.from(fileList || [])
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots);
    if (files.length === 0) return;
    setIsDirty(true);

    const newItems = files.map((file, idx) => ({
      id: `photo-${galleryCategory}-${Date.now()}-${idx}`,
      imageUrl: URL.createObjectURL(file),
      mediaUrl: null,
      galleryCategory,
      shortDescription: '',
      displayOrder: mediaPhotos.length + idx + 1,
      isUploading: true,
      error: null,
      file,
      mimeType: file.type || 'image/jpeg',
    }));

    setMediaPhotos((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => {
      uploadSingleMediaFile(item.file, 'Photos', (updates) => {
        setMediaPhotos((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, ...updates } : p))
        );
      });
    });
  };

  const handleUploadCategoryVideo = async (galleryCategory, file) => {
    if (!file) return;
    setIsDirty(true);
    setCategoryVideos((prev) => ({
      ...prev,
      [galleryCategory]: {
        ...(prev[galleryCategory] || {}),
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        isUploading: true,
        error: null,
      },
    }));

    try {
      const targetPropertyId = id && id !== 'new' ? id : 'general';
      const uploaded = await driveService.uploadFile(file, targetPropertyId, 'Videos');
      const liveUrl = uploaded.directImageUrl || uploaded.webViewLink;
      setCategoryVideos((prev) => ({
        ...prev,
        [galleryCategory]: {
          ...(prev[galleryCategory] || {}),
          mediaUrl: liveUrl,
          isUploading: false,
          error: null,
        },
      }));
    } catch (err) {
      setCategoryVideos((prev) => ({
        ...prev,
        [galleryCategory]: {
          ...(prev[galleryCategory] || {}),
          isUploading: false,
          error: err.response?.data?.error || err.message || 'Video upload failed',
        },
      }));
    }
  };

  const handleAddCategoryVideoUrl = (galleryCategory, url) => {
    setIsDirty(true);
    setCategoryVideos((prev) => ({
      ...prev,
      [galleryCategory]: {
        ...(prev[galleryCategory] || {}),
        mediaUrl: url,
        fileName: url,
        mimeType: 'video/mp4',
        isUploading: false,
        error: null,
      },
    }));
  };

  const handleUploadCategoryVideoThumbnail = async (galleryCategory, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsDirty(true);
    const localPreview = URL.createObjectURL(file);
    setCategoryVideos((prev) => ({
      ...prev,
      [galleryCategory]: {
        ...(prev[galleryCategory] || {}),
        thumbnailUrl: localPreview,
      },
    }));
    try {
      const targetPropertyId = id && id !== 'new' ? id : 'general';
      const uploaded = await driveService.uploadFile(file, targetPropertyId, 'Photos');
      const liveUrl = uploaded.directImageUrl || uploaded.webViewLink;
      if (liveUrl) {
        setCategoryVideos((prev) => ({
          ...prev,
          [galleryCategory]: {
            ...(prev[galleryCategory] || {}),
            thumbnailUrl: liveUrl,
          },
        }));
      }
    } catch {
      // Keep local preview if offline
    }
  };

  const handleUpdateCategoryVideo = (galleryCategory, patch) => {
    setIsDirty(true);
    setCategoryVideos((prev) => ({
      ...prev,
      [galleryCategory]: {
        ...(prev[galleryCategory] || {}),
        ...patch,
      },
    }));
  };

  const handleRemoveCategoryVideo = (galleryCategory) => {
    setIsDirty(true);
    setCategoryVideos((prev) => {
      const next = { ...prev };
      delete next[galleryCategory];
      return next;
    });
  };

  const handleAddCategoryImageUrl = (galleryCategory, url) => {
    setIsDirty(true);
    setMediaPhotos((prev) => [
      ...prev,
      {
        id: `photo-url-${galleryCategory}-${Date.now()}`,
        imageUrl: url,
        mediaUrl: url,
        galleryCategory,
        shortDescription: '',
        displayOrder: prev.length + 1,
        isUploading: false,
        error: null,
        mimeType: 'image/jpeg',
      },
    ]);
  };

  const handleUpdatePhotoItem = (photoId, patch) => {
    setIsDirty(true);
    setMediaPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...patch } : p))
    );
  };

  const handleRemovePhotoItem = (photoId) => {
    setIsDirty(true);
    setMediaPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleRetryPhotoItem = (photoId) => {
    const target = mediaPhotos.find((p) => p.id === photoId);
    if (!target?.file) return;
    uploadSingleMediaFile(target.file, 'Photos', (updates) => {
      setMediaPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p))
      );
    });
  };

  const hasActiveUploads =
    mediaPhotos.some((p) => p.isUploading) ||
    Object.values(categoryVideos).some((v) => v?.isUploading);
  const hasUploadErrors =
    mediaPhotos.some((p) => Boolean(p.error)) ||
    Object.values(categoryVideos).some((v) => Boolean(v?.error));

  const coverPhotoUrl = useMemo(() => {
    const cover = mediaPhotos.find((p) => p.galleryCategory === 'Cover' && !p.error);
    return cover?.imageUrl || cover?.mediaUrl || mediaPhotos[0]?.imageUrl || '';
  }, [mediaPhotos]);

  // Validation & Submission
  const validateForSubmit = (isDraft) => {
    const errors = [];
    if (!formData.title?.trim()) {
      errors.push({ field: 'Listing Title', value: 'Empty', step: 1, message: 'Add a listing title in Step 1.' });
    }
    const numericPrice = Number(String(formData.price || '').replace(/[^0-9.]/g, '')) || 0;
    if (!numericPrice) {
      errors.push({ field: 'Price', value: 'Not set', step: 1, message: 'Enter a selling price or monthly rent in Step 1.' });
    }
    if (!isDraft) {
      if (!(formData.city || formData.location)) {
        errors.push({ field: 'City', value: 'Not selected', step: 2, message: 'Select a city in Step 2.' });
      }
      if (!formData.address?.trim()) {
        errors.push({ field: 'Street Address', value: 'Empty', step: 2, message: 'Enter a street address in Step 2.' });
      }
      if (mediaPhotos.length === 0) {
        errors.push({ field: 'Cover Photo', value: '0 photos', step: 4, message: 'Upload at least 1 photo in Step 4.' });
      }
      const hasAssignedAgent = Boolean(
        formData.list_agent_key || formData.assignedAgent?.trim() || formData.credentials?.assignedAgent?.trim()
      );
      if (!hasAssignedAgent) {
        errors.push({ field: 'Assigned Agent', value: 'No agent assigned', step: 5, message: 'Assign an agent in Step 5 before publishing.' });
      }
    }
    return errors;
  };

  const executeSubmission = async (targetStandardStatus = 'Active') => {
    setSubmissionError(null);
    const isDraft = targetStandardStatus === 'Draft';
    const errors = validateForSubmit(isDraft);
    if (errors.length > 0) {
      if (!isDraft) {
        setMissingFieldsModal({ errors });
        return;
      }
      setSubmissionError({
        title: 'Missing Draft Basics',
        message: 'Please fill in the highlighted items below:',
        errors,
      });
      return;
    }

    if (hasActiveUploads) {
      setSubmissionError({
        title: 'Photos Still Uploading',
        message: 'Please wait a moment for your photo uploads to finish.',
        errors: [],
      });
      return;
    }

    if (hasUploadErrors) {
      setSubmissionError({
        title: 'Photo Upload Needs Attention',
        message: 'One or more photos failed to upload. Please retry or remove them in Step 4.',
        errors: [],
      });
      return;
    }

    setActiveActionLabel(
      isDraft
        ? 'Saving Draft...'
        : targetStandardStatus === 'Pending Approval'
          ? 'Submitting...'
          : isEditing
            ? 'Saving Changes...'
            : 'Publishing...'
    );
    setIsSubmitting(true);

    try {
      const validPhotos = mediaPhotos.filter(
        (p) =>
          (p.mediaUrl || p.imageUrl) &&
          !p.error &&
          !String(p.mediaUrl || p.imageUrl || '').startsWith('blob:')
      );

      // Sort Cover first, then categorized gallery order
      const sortedPhotos = [...validPhotos].sort((a, b) => {
        if (a.galleryCategory === 'Cover' && b.galleryCategory !== 'Cover') return -1;
        if (b.galleryCategory === 'Cover' && a.galleryCategory !== 'Cover') return 1;
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });

      const formattedPropertyImages = sortedPhotos.map((p, idx) => ({
        imageUrl: p.mediaUrl || p.imageUrl,
        displayOrder: idx + 1,
      }));

      const formattedVideos = Object.entries(categoryVideos)
        .filter(([, v]) => v?.mediaUrl && !v.error && !String(v.mediaUrl).startsWith('blob:'))
        .map(([catKey, v], idx) => ({
          mediaUrl: v.mediaUrl,
          mediaCategory: 'Video',
          galleryCategory: catKey,
          orderIndex: sortedPhotos.length + idx + 1,
          shortDescription: v.shortDescription || `${catKey} Video`,
          mimeType: v.mimeType || 'video/mp4',
        }));

      const formattedMedia = [
        ...sortedPhotos.map((p, idx) => ({
          mediaUrl: p.mediaUrl || p.imageUrl,
          mediaCategory: p.galleryCategory === 'FloorPlan' ? 'FloorPlan' : 'Photo',
          galleryCategory: p.galleryCategory || 'Living',
          orderIndex: idx + 1,
          shortDescription: p.shortDescription || p.galleryCategory || 'Property Photo',
          mimeType: p.mimeType || 'image/jpeg',
        })),
        ...formattedVideos,
      ];

      const isSelfHandledBroker =
        user?.role !== 'agent' &&
        Boolean(user?.id) &&
        String(formData.list_agent_key || '') === String(user.id);
      const isConfirmedForPublish =
        isSelfHandledBroker ||
        (isEditing &&
          String(formData.assignment_status || '').toUpperCase() === 'ACCEPTED' &&
          String(formData.list_agent_key || '') === String(formData.loaded_agent_key || ''));
      const effectiveStandardStatus = isDraft
        ? 'Draft'
        : (isConfirmedForPublish ? targetStandardStatus : 'Pending Confirmation');
      const effectiveIsPublished = !isDraft && isConfirmedForPublish;

      const payload = toApiPayload({
        ...formData,
        ...(isSelfHandledBroker ? { assignmentStatus: 'ACCEPTED', assignment_status: 'ACCEPTED' } : {}),
        credentials: {
          ...(formData.credentials || {}),
          brokerName:
            formData.credentials?.brokerName ||
            user?.full_name ||
            user?.name ||
            '',
        },
        categoryVideos,
        standardStatus: effectiveStandardStatus,
        status: isDraft || !effectiveIsPublished ? 'PENDING' : formData.status || 'AVAILABLE',
        is_published: effectiveIsPublished,
        property_images: formattedPropertyImages,
        images: formattedPropertyImages.map((img) => img.imageUrl),
        media: formattedMedia,
      });

      let propertyId = id;
      if (isEditing) {
        if (user?.role === 'agent' && !isDraft) {
          await propertyService.proposeEdit(id, payload, 'Agent listing update');
        } else {
          await propertyService.updateProperty(id, payload);
        }
      } else {
        const res = await propertyService.createProperty(payload);
        propertyId = res?.id || res?.data?.id || id;
      }

      setIsDirty(false);
      setCreatedPropertyId(propertyId);
      setSavedStatusType(effectiveStandardStatus);
      setShowSuccessModal(true);
    } catch (err) {
      setSubmissionError({
        title: 'Could Not Save Listing',
        message: err.response?.data?.error || err.message || 'Something went wrong while saving.',
        errors: [],
      });
    } finally {
      setIsSubmitting(false);
      setActiveActionLabel('');
    }
  };

  if (isLoading) {
    return <ListingSkeleton />;
  }

  return (
<<<<<<< HEAD
    <div className={`mx-auto w-full max-w-7xl flex flex-col gap-4 p-4 md:p-6 ${isDrawer ? 'pb-6' : 'pb-16'}`}>
      {!isDrawer && (
        <PageHeader
          title={isEditing ? "Edit Property Listing" : "Add Property"}
          className="mb-0!"
          breadcrumbs={[
            { label: 'Properties', to: '/broker/properties' },
            { label: isEditing ? 'Edit Listing' : 'New Listing' }
          ]}
          actions={
            <Link
              to="/broker/properties"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Properties</span>
            </Link>
          }
        />
      )}

      {/* 7-Step Navigation Stepper Header */}
      <Card data-testid="broker-card" className="min-w-0 bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs rounded-md overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="default" className="font-bold">
                Step {currentStep} of 7
              </Badge>
              <span className="text-sm font-bold text-[#1E293B] dark:text-slate-100 font-display">
                {stepTitles[currentStep - 1]}
              </span>
            </div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:block">
              {Math.round(((currentStep - 1) / 6) * 100)}% Completed
            </div>
          </div>

          <div ref={stepTrackRef} className="overflow-x-auto custom-scrollbar py-1">
            <div className="flex items-center justify-between min-w-[720px] relative">
              <div className="absolute top-[22px] left-8 right-8 h-[2px] bg-[#E2E8F0] dark:bg-slate-800 -z-0" />

              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <button
                    key={stepNum} 
                    type="button"
                    aria-label={`Step ${stepNum}: ${title}`}
                    aria-current={isActive ? 'step' : undefined}
                    className="flex min-h-11 flex-col items-center flex-1 rounded-md p-1 cursor-pointer transition-colors hover:opacity-95 relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E]"
                    onClick={() => setCurrentStep(stepNum)}
                  >
                    <span className={`size-9 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all shadow-2xs ${
                      isActive 
                        ? 'bg-[#0F766E] text-white ring-4 ring-[#0F766E]/15 border border-[#0F766E]' 
                        : isCompleted 
                        ? 'bg-[#0F766E] text-white border border-[#0F766E]' 
                        : 'bg-white dark:bg-slate-900 text-slate-500 border border-[#E2E8F0] dark:border-slate-700 hover:border-slate-400'
                    }`}>
                      {isCompleted ? <Check className="size-4 stroke-[2.5]" /> : stepNum}
                    </span>
                    <span className={`text-xs text-center transition-colors px-1 ${
                      isActive ? 'text-[#0F766E] dark:text-teal-400 font-bold' : isCompleted ? 'text-[#1E293B] dark:text-slate-200 font-medium' : 'text-[#64748B] dark:text-slate-400'
                    }`}>
                      {title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-4">
        {/* Left Form Column (8 Cols) */}
        <div className="min-w-0 lg:col-span-8 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">

        {/* ========================================================================= */}
        {/* SECTION 1: BASIC PROPERTY INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0F766E]" />
                <span>Section 1: Listing Overview</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold text-[#0F766E] border-teal-200 bg-teal-50">
                  Type: {(() => {
                    const match = COMMON_PROPERTY_TYPES.find(c => c.id === formData.property_type || c.name === formData.property_type);
                    return match ? match.name : (formData.property_type || 'House and Lot');
                  })()}
                </Badge>
                <Link
                  to="/broker/properties/types"
                  className="text-xs text-[#0F766E] hover:underline font-semibold"
                >
                  Change
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="developer-name-input" className="text-sm font-semibold text-[#1E293B]">
                    Developer Name <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    {(formData.developer_name || formData.title || '').length} / 120
                  </span>
                </div>
                <input
                  id="developer-name-input"
                  data-testid="developer-name-input"
                  required
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Ayala Land Premier, Rockwell Land, Shang Properties"
                  value={formData.developer_name ?? formData.title ?? ''}
                  onChange={e => {
                    setIsDirty(true);
                    setFormData({
                      ...formData,
                      developer_name: e.target.value,
                      title: e.target.value,
                    });
                  }}
                  className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                />
              </div>

              {/* Tagline / Marketing Headline */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-[#1E293B]">
                    Headline / Marketing Tagline
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    {(formData.tagline || '').length} / 160
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="e.g. Elevated residential lot overlooking Laguna de Bay"
                  value={formData.tagline || ''}
                  onChange={e => { setIsDirty(true); setFormData({ ...formData, tagline: e.target.value }); }}
                  className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-colors shadow-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                />
              </div>

              {/* Single Merged Property Status (replaces separate Transaction Purpose & bulky status box) */}
              <div className="flex flex-col gap-2 md:col-span-2" data-testid="property-status-row">
                <label className="text-sm font-semibold text-[#1E293B] block">
                  Property Status <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'For Sale', label: 'For Sale' },
                    { key: 'For Rent', label: 'For Rent' },
                    { key: 'Reserved', label: 'Reserved' },
                    { key: 'Sold', label: 'Sold' },
                    { key: 'Draft', label: 'Draft' }
                  ].map(option => {
                    const currentLifecycle = resolvePropertyLifecycleState(formData);
                    const isSelected = currentLifecycle.lifecycleKey === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          const nextState = resolvePropertyLifecycleState(option.key);
                          setFormData(prev => ({
                            ...prev,
                            transaction_type: nextState.transactionType,
                            status: nextState.status,
                            standard_status: nextState.standardStatus,
                            is_published: nextState.isPublished,
                          }));
                        }}
                        className={`px-5 h-11 md:h-10 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                          isSelected
                            ? 'bg-white text-[#0F766E] font-bold border-2 border-[#0F766E] shadow-2xs'
                            : 'bg-white text-[#1E293B] border border-[#CBD5E1] hover:border-slate-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Development Condition Selector */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-[#1E293B]">
                    Development Stage & Condition
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(isLand
                    ? ['Raw / Undeveloped Lot', 'Subdivision Phase Cut', 'Ready to Build']
                    : isCondo
                    ? ['Ready for Occupancy (RFO)', 'Pre-Selling', 'Resale']
                    : ['Brand New / RFO', 'Pre-Selling', 'Well-Maintained Resale', 'Renovated']
                  ).map(cond => {
                    const isSelected = formData.development_condition === cond || formData.property_condition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setFormData({ ...formData, development_condition: cond, property_condition: cond });
                        }}
                        className={`min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 px-3 py-2 text-sm whitespace-normal font-semibold rounded-md border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                          isSelected
                            ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-[#CBD5E1] text-[#1E293B]'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#1E293B] block">
                  Property Description <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="bg-white rounded-md border border-[#CBD5E1] hover:border-slate-400 overflow-hidden shadow-2xs transition-colors focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E]">
                  <ReactQuill
                    theme="snow"
                    modules={QUILL_MODULES}
                    value={formData.description}
                    onChange={val => { setIsDirty(true); setFormData({ ...formData, description: val }); }}
                    placeholder="Describe spatial geometry, materials, lighting orientations, and architectural finishings..."
                    className="min-h-[140px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PROPERTY LOCATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Dynamic Notice Banner for Cascading Clears */}
            {locationNotice && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-[#0F766E] flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                <span className="leading-relaxed font-medium">{locationNotice.message}</span>
              </div>
            )}

            {/* 1. Map Location */}
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E] text-[18px]">pin_drop</span>
                  <span>Map Location</span>
                </h3>
              </div>

              {/* Predictive Search & URL Paste Strip */}
              <div className="p-4 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex flex-col gap-3 relative z-30">
                <div className="flex flex-col sm:flex-row gap-2 relative z-30" ref={mapSearchContainerRef}>
                  <div className="relative flex-1 z-30">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Search Philippine address or landmark (e.g. Ayala Alabang, Muntinlupa)..."
                      value={mapSearchQuery}
                      onChange={e => setMapSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleGeocode(e); }}
                      className="w-full pl-10 pr-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-3.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 animate-spin">sync</span>
                      </div>
                    )}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#CBD5E1] rounded-md shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                        {addressSuggestions.map((item, idx) => (
                          <div
                            key={item.placeId || idx}
                            onClick={() => handleSelectAddressSuggestion(item)}
                            className="px-3.5 py-2.5 hover:bg-teal-50/60 cursor-pointer transition-colors flex items-start gap-2.5"
                          >
                            <span className="material-symbols-outlined text-[#0F766E] text-[16px] mt-0.5 shrink-0">location_on</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#1E293B] truncate">
                                {item.mainText || item.formattedAddress || item.description}
                              </p>
                              {item.secondaryText && (
                                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                                  {item.secondaryText}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-5 bg-[#0F766E] text-white rounded-md text-xs font-semibold hover:bg-[#115E59] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    {isGeocoding ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[16px]">travel_explore</span>}
                    Locate
                  </button>
                </div>

                <div className="flex min-w-0 flex-col gap-2 pt-1 border-t border-[#E2E8F0] text-xs text-[#64748B] md:flex-row md:items-center">
                  <span className="shrink-0">Or paste Google Maps Pin URL:</span>
                  <input
                    type="text"
                    placeholder="https://maps.app.goo.gl/... or @14.55,121.05"
                    onChange={handleGoogleMapsUrlPaste}
                    className="min-w-0 flex-none md:flex-1 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  />
                </div>
              </div>

              {/* Cadastral Interactive Map */}
              <CadastralLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                boundary={formData.lot_boundary}
                onBoundaryChange={(geoJson) => {
                  setIsDirty(true);
                  setFormData(prev => ({ ...prev, lot_boundary: geoJson }));
                }}
                address={formData.address}
                onPositionChange={(pos) => {
                  handleMapPositionChange(pos);
                  handlePinMoved(pos);
                }}
                onOpenFullView={handleOpenFullViewMap}
                className="w-full"
              />

              <div className="flex items-center justify-between px-3 py-2 bg-teal-50/70 border border-teal-200/80 rounded-md text-xs">
                <span className="text-teal-950 font-medium">Mapping multiple subdivided lots or an entire phase?</span>
                <Link
                  to="/broker/properties/studio"
                  className="font-bold text-[#0F766E] hover:text-teal-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Map Studio</span>
                  <span className="text-sm font-bold">→</span>
                </Link>
              </div>

              {/* Coordinates: Latitude & Longitude Inputs */}
              <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#0F766E] text-[15px]">my_location</span>
                    <span>Coordinates (Latitude & Longitude)</span>
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Drag the map pin, search a location, or type directly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="geo-latitude" className="text-sm font-medium text-[#64748B] block">
                      Latitude
                    </label>
                    <div className="relative">
                      <input
                        id="geo-latitude"
                        type="text"
                        placeholder="e.g. 14.5995123"
                        value={formData.latitude || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, latitude: e.target.value }));
                        }}
                        className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-mono text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="geo-longitude" className="text-sm font-medium text-[#64748B] block">
                      Longitude
                    </label>
                    <div className="relative">
                      <input
                        id="geo-longitude"
                        type="text"
                        placeholder="e.g. 120.9842123"
                        value={formData.longitude || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, longitude: e.target.value }));
                        }}
                        className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-mono text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Area */}
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  <span>Area</span>
                </h4>
              </div>

              <div className="flex flex-col gap-3">
                {/* First Row: Region | Province */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Region */}
                  <div className={!phLocationService.isProvinceApplicable(formData.region_psgc_code) ? 'md:col-span-2' : ''}>
                    <SearchableSelect
                      id="geo-region"
                      label="Region"
                      required={true}
                      value={formData.region_psgc_code || ''}
                      options={regionOptions}
                      onChange={handleRegionSelect}
                      placeholder="Select Region..."
                    />
                  </div>

                  {/* Province (Hidden entirely where it does not apply) */}
                  {phLocationService.isProvinceApplicable(formData.region_psgc_code) && (
                    <div>
                      <SearchableSelect
                        id="geo-province"
                        label="Province"
                        required={true}
                        disabled={!formData.region_psgc_code}
                        disabledPlaceholder="Choose Region first"
                        value={formData.province_psgc_code || ''}
                        options={provinceOptions}
                        onChange={handleProvinceSelect}
                        placeholder="Select Province..."
                      />
                    </div>
                  )}
                </div>

                {/* Second Row: City / Municipality | Barangay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City / Municipality */}
                  <div>
                    <SearchableSelect
                      id="geo-city"
                      label="City / Municipality"
                      required={true}
                      disabled={!formData.region_psgc_code || (phLocationService.isProvinceApplicable(formData.region_psgc_code) && !formData.province_psgc_code)}
                      disabledPlaceholder={!formData.region_psgc_code ? 'Choose Region first' : 'Choose Province first'}
                      value={formData.city_psgc_code || ''}
                      options={cityOptions}
                      onChange={handleCitySelect}
                      placeholder="Select City / Municipality..."
                    />
                  </div>

                  {/* Barangay */}
                  <div>
                    <SearchableSelect
                      id="geo-barangay"
                      label="Barangay"
                      required={true}
                      disabled={!formData.city_psgc_code || isLoadingBarangays}
                      disabledPlaceholder={isLoadingBarangays ? 'Loading Barangays...' : 'Choose City first'}
                      value={formData.barangay_psgc_code || ''}
                      options={barangayOptions}
                      onChange={handleBarangaySelect}
                      placeholder="Select Barangay..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Street Address */}
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  <span>Street Address</span>
                </h4>
              </div>

              <div className="flex flex-col gap-3">
                {/* First Row: House / Unit / Street (more width) | ZIP Code */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* House / Unit / Street */}
                  <div className="flex flex-col gap-2 md:col-span-8">
                    <label htmlFor="street-address-input" className="text-sm font-semibold text-[#1E293B] block">
                      House / Unit / Street <span className="text-[#FF6B6B]">*</span>
                    </label>
                    <input
                      id="street-address-input"
                      required
                      type="text"
                      placeholder="e.g. 142 Acacia Avenue, Phase 2"
                      value={formData.address}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, address: e.target.value }); }}
                      className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />
                  </div>

                  {/* ZIP Code */}
                  <div className="flex flex-col gap-2 md:col-span-4">
                    <label htmlFor="zip-code-input" className="text-sm font-semibold text-[#1E293B] block">
                      ZIP Code
                    </label>
                    <input
                      id="zip-code-input"
                      type="text"
                      placeholder="e.g. 1780"
                      maxLength={10}
                      value={formData.postal_code}
                      onChange={e => { setIsDirty(true); setFormData({ ...formData, postal_code: e.target.value }); }}
                      className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-mono text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />

                    {/* Suggestions */}
                    {zipSuggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
                        {zipSuggestions.slice(0, 5).map(zip => (
                          <button
                            key={zip}
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setFormData(prev => ({ ...prev, postal_code: zip }));
                            }}
                            className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold border transition-colors cursor-pointer ${
                              formData.postal_code === zip
                                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            {zip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tailored Address Branching: Condo vs Subdivision */}
                {isCondo ? (
                  <CondoLocationFields
                    formData={formData}
                    setFormData={setFormData}
                    setIsDirty={setIsDirty}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <SubdivisionLocationFields
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                      subdivisionsList={subdivisionsList}
                      isCustomSubdivisionMode={isCustomSubdivisionMode}
                      setIsCustomSubdivisionMode={setIsCustomSubdivisionMode}
                      setIsSubdivisionModalOpen={setIsSubdivisionModalOpen}
                      handleSubdivisionSelect={handleSubdivisionSelect}
                    />

                    {/* Cadastral Studio Lots Integration Card */}
                      {Boolean(formData.subdivision_project_id) && (
                        <div className="pt-3 mt-1 border-t border-slate-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-[#0F766E]">map</span>
                              <span>Cadastral Mapped Lots</span>
                              {isLoadingLots && <span className="text-[11px] text-slate-400 font-normal">Loading lots...</span>}
                              {!isLoadingLots && (
                                <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                                  {availableLots.length} {availableLots.length === 1 ? 'lot' : 'lots'} mapped
                                </span>
                              )}
                            </span>
                            <a
                              href={`/broker/properties/studio?subdivision_id=${formData.subdivision_project_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open in Cadastral Studio</span>
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </div>

                          {availableLots.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-8">
                                <select
                                  id="cadastral-lot-picker"
                                  value={formData.subdivision_lot_id || ''}
                                  onChange={e => handleCadastralLotSelect(e.target.value)}
                                  className="w-full px-3 bg-white border border-teal-300 rounded-md text-sm font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none cursor-pointer h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                                >
                                  <option value="">-- Choose Cadastral Mapped Lot (Auto-Fills Details) --</option>
                                  {availableLots.map(lot => (
                                    <option key={lot.id} value={lot.id}>
                                      Block {lot.block_number}, Lot {lot.lot_number} — {lot.verified_area_sqm} m² ({lot.availability_status || 'Available'}{lot.price ? ` • ₱${Number(lot.price).toLocaleString()}` : ''})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-4 text-[11px] text-[#64748B]">
                                Selecting a mapped lot auto-populates lot area (m²), block, lot, and coordinates.
                              </div>
                            </div>
                          ) : !isLoadingLots ? (
                            <div className="p-3 bg-white/70 border border-dashed border-slate-300 rounded-md text-xs text-[#64748B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span>No cadastral parcels mapped for this project yet. You can draw boundaries in Studio.</span>
                              <a
                                href={`/broker/properties/studio?subdivision_id=${formData.subdivision_project_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#0F766E] font-semibold text-xs rounded-md shadow-2xs inline-flex items-center gap-1 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px]">draw</span>
                                <span>Draw Lots in Studio</span>
                              </a>
                            </div>
                          ) : null}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Full Address Preview */}
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Full Address Preview</span>
                </h4>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                <p className="text-xs font-medium text-[#1E293B] leading-relaxed break-words">
                  {liveUnparsedAddress || <span className="text-slate-400 italic">Complete address details to preview full mailing address...</span>}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: SPECIFICATIONS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">straighten</span>
                  <span>Section 3: Property Specifications</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Define core dimensional specs, sanitary counts, architectural classification, and room breakdown.</p>
              </div>
              <span className="text-xs text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 font-semibold shrink-0">
                Mode: {formData.property_type}
              </span>
            </div>

            {/* Subtype conditional messaging */}
            {isLand && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Vacant Land listing selected: interior room specs, sanitary facilities, and room breakdowns are conditionally bypassed.</span>
              </div>
            )}

            {/* Adaptive Property Specifications Component */}
            {isLand ? (
              <SubdivisionLotSpecs formData={formData} setFormData={setFormData} setIsDirty={setIsDirty} />
            ) : isCondo ? (
              <CondominiumSpecs formData={formData} setFormData={setFormData} setIsDirty={setIsDirty} />
            ) : (
              <HouseAndLotSpecs formData={formData} setFormData={setFormData} setIsDirty={setIsDirty} />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: PRICING AND TERMS */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">payments</span>
                  <span>Section 4: Pricing & Terms</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Manage transaction pricing, standard currencies, association dues, and lease agreement terms.</p>
              </div>
              <span className="text-xs text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 font-semibold self-start sm:self-auto shrink-0">
                Type: {formData.transaction_type || 'For Sale'}
              </span>
            </div>

            {/* 1. PRICE GROUP */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">price_change</span>
                <span>{formData.transaction_type === 'For Rent' ? 'Rental Valuation' : 'Price Valuation'}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                
                {/* Price / Rent input with dynamic currency symbol */}
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm font-medium text-[#1E293B]">
                    {formData.transaction_type === 'For Rent' ? 'Rent' : 'Price'} <span className="text-[#FF6B6B] ml-0.5">*</span>
                  </label>
                  <div className="flex items-center rounded-md border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors overflow-hidden">
                    <div className="px-3.5 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-sm font-bold text-[#0F766E] select-none h-11 md:h-10 [@media(pointer:coarse)]:h-11">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                    </div>
                    <input
                      required
                      type="text"
                      placeholder={formData.transaction_type === 'For Rent' ? "150,000" : "150,000,000"}
                      value={displayPrice}
                      onChange={handlePriceChange}
                      onBlur={handlePriceBlur}
                      onFocus={handlePriceFocus}
                      className="flex-1 px-4 bg-transparent text-sm font-mono font-bold text-[#0F766E] placeholder:text-slate-400 outline-none min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />
                    <div className="border-l border-[#CBD5E1] shrink-0">
                      <select
                        aria-label="Currency"
                        value={formData.currency}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, currency: e.target.value });
                        }}
                        className="px-3 bg-slate-50 text-sm font-bold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      >
                        {currencyOptions.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formData.price ? (
                    <>
                      <p className="text-[11px] font-mono text-[#0F766E] flex items-center gap-1 font-medium pt-0.5">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Formatted: {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}{Number(formData.price).toLocaleString()} {formData.transaction_type === 'For Rent' ? `/ ${formData.rent_frequency?.toLowerCase() || 'month'}` : ''}
                      </p>
                      {Boolean(formData.price && formData.lot_size_area && Number(formData.lot_size_area) > 0) && (
                        <div className="mt-2 p-2.5 bg-teal-50/80 border border-teal-200/70 rounded-md flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-teal-900 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-[#0F766E]">calculate</span>
                            <span>Calculated Rate per m²:</span>
                          </div>
                          <span className="text-xs font-bold font-mono text-[#0F766E] bg-white px-2 py-0.5 rounded border border-teal-200 shadow-none">
                            ₱{Math.round(Number(formData.price) / Number(formData.lot_size_area)).toLocaleString()} / m²
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">Enter total valuation amount</p>
                  )}
                </div>



              </div>
            </div>

            {/* 2. ASSOCIATION DUES GROUP */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>Association Dues & Assessments</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                
                {/* Association Dues Amount */}
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm font-medium text-[#1E293B]">
                    Association Dues
                  </label>
                  <div className="flex items-center rounded-md border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors overflow-hidden">
                    <div className="px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none h-11 md:h-10 [@media(pointer:coarse)]:h-11">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 8500"
                      value={formData.association_fee}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        setIsDirty(true);
                        setFormData({ ...formData, association_fee: val, associationFee: val });
                      }}
                      className="flex-1 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />
                  </div>
                  {formData.association_fee && Number(formData.association_fee) > 0 && (
                    <p className="text-[11px] text-[#0F766E] font-mono">
                      {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}{Number(formData.association_fee).toLocaleString()} / {formData.association_fee_frequency?.toLowerCase() || 'monthly'}
                    </p>
                  )}
                </div>

                {/* Dues Frequency */}
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="text-sm font-medium text-[#1E293B]">
                    Dues Frequency
                  </label>
                  <select
                    value={formData.association_fee_frequency}
                    onChange={e => {
                      setIsDirty(true);
                      setFormData({ ...formData, association_fee_frequency: e.target.value, associationFeeFrequency: e.target.value });
                    }}
                    className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  >
                    {associationFeeFrequencyOptions.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>

                {/* Services Included in Dues (Multiple Selection) */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                    <span>Services Included in Dues</span>
                    <span className="text-[10px] text-[#64748B] font-normal">Select all common services covered</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                    {associationFeeIncludesOptions.map(service => {
                      const isChecked = Array.isArray(formData.association_fee_includes) && formData.association_fee_includes.includes(service);
                      return (
                        <button
                          key={service}
                          role="checkbox"
                          aria-checked={isChecked}
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            setFormData(prev => {
                              const curr = Array.isArray(prev.association_fee_includes) ? prev.association_fee_includes : [];
                              return {
                                ...prev,
                                association_fee_includes: isChecked
                                  ? curr.filter(s => s !== service)
                                  : [...curr, service]
                              };
                            });
                          }}
                          className={`flex min-h-11 md:min-h-8 [@media(pointer:coarse)]:min-h-11 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                            isChecked
                              ? 'bg-teal-50 text-[#0F766E] font-medium'
                              : 'bg-white text-[#475569] hover:bg-slate-50'
                          }`}
                        >
                          <span className={`material-symbols-outlined shrink-0 text-[18px] ${isChecked ? 'text-[#0F766E]' : 'text-slate-400'}`}>
                            {isChecked ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span className="min-w-0 leading-5">{service}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* 3. RENTAL TERMS GROUP (Conditionally rendered only for For Rent) */}
            {formData.transaction_type === 'For Rent' && (
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                <div className="pb-1 border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    <span>Rental Terms & Tenancy Conditions</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Define periodic frequency, minimum lease commitment, and tenant security guarantees.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3">
                  
                  {/* Rent Frequency */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm font-medium text-[#1E293B]">
                      Rent Frequency <span className="text-[#FF6B6B]">*</span>
                    </label>
                    <select
                      value={formData.rent_frequency}
                      onChange={e => {
                        setIsDirty(true);
                        setFormData({ ...formData, rent_frequency: e.target.value });
                      }}
                      className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-semibold text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    >
                      {rentFrequencyOptions.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lease Term */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm font-medium text-[#1E293B]">
                      Lease Term
                    </label>
                    <select
                      value={formData.lease_term}
                      onChange={e => {
                        setIsDirty(true);
                        setFormData({ ...formData, lease_term: e.target.value });
                      }}
                      className="w-full px-4 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none cursor-pointer shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    >
                      {leaseTermOptions.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  {/* Security Deposit Amount */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm font-medium text-[#1E293B]">
                      Security Deposit
                    </label>
                    <div className="flex items-center rounded-md border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors overflow-hidden">
                      <div className="px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none h-11 md:h-10 [@media(pointer:coarse)]:h-11">
                        {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 300000"
                        value={formData.security_deposit}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, security_deposit: val });
                        }}
                        className="flex-1 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                  </div>

                  {/* Advance Rent Amount */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm font-medium text-[#1E293B]">
                      Advance Rent
                    </label>
                    <div className="flex items-center rounded-md border border-[#CBD5E1] bg-white hover:border-slate-400 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors overflow-hidden">
                      <div className="px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#64748B] select-none h-11 md:h-10 [@media(pointer:coarse)]:h-11">
                        {currencyOptions.find(c => c.code === formData.currency)?.symbol || '₱'}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 150000"
                        value={formData.advance_rent}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setIsDirty(true);
                          setFormData({ ...formData, advance_rent: val });
                        }}
                        className="flex-1 px-4 bg-transparent text-sm font-semibold text-[#1E293B] outline-none min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: FEATURES AND AMENITIES */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E]">tune</span>
                <span>Section 5: Features and Amenities</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#64748B] hidden sm:inline-flex items-center">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] mr-1.5">
                    {(formData.interior_features?.length || 0) + (formData.exterior_features?.length || 0) + (formData.amenities?.length || 0)}
                  </span>
                  selected
                </span>
              </div>
            </div>

            <CategoryAmenitiesPicker
              formData={formData}
              setFormData={setFormData}
              setIsDirty={setIsDirty}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: MEDIA & DOCUMENTS */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div data-testid="broker-card" className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">perm_media</span>
                  Section 6: Media & Documents
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Manage listing photography, architectural floor plans, video walk-throughs, virtual tours, and legal paperwork.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveUploads && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    Uploading assets...
                  </span>
                )}
                {hasUploadErrors && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Upload issues detected
                  </span>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 1. PHOTOS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>Photos</span>
                    <span className="text-slate-400 font-normal">({mediaPhotos.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload property photos. Drag or use controls to set photo order; position 1 receives the Cover Photo badge.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="photos-file-input"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <label
                    htmlFor="photos-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold rounded-md cursor-pointer transition-colors shadow-2xs min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 justify-center whitespace-normal"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                    <span>Upload Photos</span>
                  </label>
                </div>
              </div>

              {mediaPhotos.length === 0 ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined inline-block max-w-full overflow-hidden text-[36px] text-slate-300 mb-1">image_not_supported</span>
                  <p className="text-xs font-semibold text-[#64748B]">No photos added.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click “Upload Photos” to add property imagery (up to 50MB per file).</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {mediaPhotos.map((photo, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                          if (!isNaN(fromIndex) && fromIndex !== index) {
                            handlePhotoMove(fromIndex, index);
                          }
                        }}
                        className={`group relative bg-white border rounded-lg overflow-hidden flex flex-col shadow-2xs transition-all ${
                          isCover ? 'border-[#0F766E] ring-1 ring-[#0F766E]' : 'border-[#CBD5E1] hover:border-slate-400'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={photo.imageUrl}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Cover Photo Badge */}
                          {isCover && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[#0F766E] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              Cover Photo
                            </span>
                          )}

                          {/* Upload Progress Overlay */}
                          {photo.isUploading && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-white">
                              <span className="material-symbols-outlined text-[20px] animate-spin mb-1">sync</span>
                              <span className="text-[11px] font-semibold">Uploading...</span>
                              <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-[#14B8A6] h-full transition-all duration-300" style={{ width: `${photo.progress}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Upload Error Overlay */}
                          {photo.error && (
                            <div className="absolute inset-0 bg-red-900/80 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-white text-center">
                              <span className="material-symbols-outlined text-[20px] text-red-200 mb-1">warning</span>
                              <span className="text-[11px] font-semibold text-red-100">Upload Failed</span>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handlePhotoRetry(index)}
                                  className="px-2 py-1 bg-white text-red-700 hover:bg-red-50 text-[10px] font-bold rounded cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                                >
                                  Retry Upload
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMediaPhotos(prev => prev.filter((_, idx) => idx !== index))}
                                  className="px-2 py-1 bg-red-800 text-white hover:bg-red-700 text-[10px] font-medium rounded cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                                >
                                  Cancel Upload
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Preview trigger */}
                          <button
                            type="button"
                            onClick={() => setPreviewMediaItem({ type: 'image', url: photo.imageUrl, title: `Photo #${index + 1}` })}
                            className="absolute bottom-2 right-2 p-1.5 rounded bg-slate-900/70 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Preview"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                          </button>
                        </div>

                        {/* Order & Card Meta Footer */}
                        <div className="p-2.5 bg-white flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] text-[#64748B] font-semibold">
                              #{photo.displayOrder || index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handlePhotoMove(index, index - 1)}
                                className="p-1 text-slate-500 hover:text-[#0F766E] disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                                title="Move Up"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                              </button>
                              <button
                                type="button"
                                disabled={index === mediaPhotos.length - 1}
                                onClick={() => handlePhotoMove(index, index + 1)}
                                className="p-1 text-slate-500 hover:text-[#0F766E] disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                                title="Move Down"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                              </button>
                            </div>
                          </div>

                          {/* Action Strip */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => handlePhotoSetCover(index)}
                                className="px-2 py-1 bg-slate-50 hover:bg-teal-50 text-[#0F766E] rounded border border-slate-200 text-center font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                              >
                                Set as Cover
                              </button>
                            ) : (
                              <span className="px-2 py-1 bg-teal-50 text-[#0F766E] rounded text-center font-bold text-[10px]">
                                Current Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: 'Photo',
                                  index,
                                  title: `Photo #${index + 1}`,
                                  onConfirm: () => {
                                    setMediaPhotos(prev => prev.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, displayOrder: idx + 1 })));
                                    setIsDirty(true);
                                  }
                                });
                              }}
                              className="px-2 py-1 bg-slate-50 hover:bg-red-50 text-red-600 rounded border border-slate-200 text-center font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 2. FLOOR PLANS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">architecture</span>
                    <span>Floor Plans</span>
                    <span className="text-slate-400 font-normal">({mediaFloorPlans.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload architectural blueprints, schematic CAD plans, or unit layout drawings.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    id="floorplans-file-input"
                    className="hidden"
                    onChange={handleFloorPlanUpload}
                  />
                  <label
                    htmlFor="floorplans-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] text-sm font-semibold rounded-md cursor-pointer transition-colors shadow-2xs min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 justify-center whitespace-normal"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Upload Floor Plans</span>
                  </label>
                </div>
              </div>

              {mediaFloorPlans.length === 0 ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1 inline-block max-w-full overflow-hidden">architecture</span>
                  <p className="text-xs font-semibold text-[#64748B]">No floor plans added.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF and high-res floor plan images supported.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mediaFloorPlans.map((plan, index) => {
                    const isPdf = plan.mimeType?.includes('pdf') || plan.mediaUrl?.toLowerCase().endsWith('.pdf');
                    return (
                      <div
                        key={plan.id}
                        className="p-3 bg-white border border-[#CBD5E1] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Thumbnail / Icon */}
                          <div className="w-16 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {isPdf ? (
                              <span className="material-symbols-outlined text-red-600 text-[24px]">picture_as_pdf</span>
                            ) : (
                              <img src={plan.mediaUrl} alt={plan.shortDescription} className="w-full h-full object-cover" />
                            )}
                          </div>

                          {/* Description Input & Upload Progress */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <input
                              type="text"
                              value={plan.shortDescription}
                              placeholder="Short Description (e.g. Ground Floor Schematic Layout)"
                              onChange={(e) => {
                                setIsDirty(true);
                                setMediaFloorPlans(prev => prev.map((p, idx) => idx === index ? { ...p, shortDescription: e.target.value } : p));
                              }}
                              className="w-full px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-sm text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                            />
                            {plan.isUploading && (
                              <div className="flex items-center gap-2 text-[10px] text-[#0F766E]">
                                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                <span>Uploading floor plan ({plan.progress}%)...</span>
                              </div>
                            )}
                            {plan.error && (
                              <div className="flex items-center gap-2 text-[10px] text-red-600">
                                <span>Error: {plan.error}</span>
                                <button type="button" onClick={() => uploadSingleMediaFile(plan.file, 'CAD', (u) => setMediaFloorPlans(prev => prev.map((p, idx) => idx === index ? { ...p, ...u } : p)))} className="underline font-bold min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11">
                                  Retry Upload
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controls & Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {/* Move Controls */}
                          <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleFloorPlanMove(index, index - 1)}
                              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                              title="Move Up"
                            >
                              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              disabled={index === mediaFloorPlans.length - 1}
                              onClick={() => handleFloorPlanMove(index, index + 1)}
                              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                              title="Move Down"
                            >
                              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            </button>
                          </div>

                          {/* Preview / Open Document */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isPdf) {
                                window.open(plan.mediaUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                setPreviewMediaItem({ type: 'image', url: plan.mediaUrl, title: plan.shortDescription || 'Floor Plan' });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                          >
                            {isPdf ? 'Open Document' : 'Preview'}
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => {
                              setItemToDelete({
                                type: 'Floor Plan',
                                index,
                                title: plan.shortDescription || `Floor Plan #${index + 1}`,
                                onConfirm: () => {
                                  setMediaFloorPlans(prev => prev.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, orderIndex: idx + 1 })));
                                  setIsDirty(true);
                                }
                              });
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 3. VIDEOS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">movie</span>
                    <span>Videos</span>
                    <span className="text-slate-400 font-normal">({mediaVideos.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Add cinematic walkthrough videos via direct file upload or external stream URL link.
                  </p>
                </div>
                {/* Video Source Switcher */}
                <div className="inline-flex rounded-md border border-[#CBD5E1] p-0.5 bg-[#F8FAFC]">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('upload')}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors cursor-pointer min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 ${
                      videoSourceMode === 'upload' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Upload Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('link')}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors cursor-pointer min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 ${
                      videoSourceMode === 'link' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Add Video Link
                  </button>
                </div>
              </div>

              {/* Video Input Controls based on Source */}
              {videoSourceMode === 'upload' ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-[#1E293B]">Select Video File</p>
                    <p className="text-[11px] text-[#64748B]">MP4, WebM or MOV video up to 100MB.</p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      id="video-file-input"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    <label
                      htmlFor="video-file-input"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold rounded-md cursor-pointer transition-colors shadow-2xs min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 justify-center whitespace-normal"
                    >
                      <span className="material-symbols-outlined text-[16px]">video_call</span>
                      <span>Upload Video</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-[#CBD5E1] rounded-md bg-[#F8FAFC] flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#1E293B]">Video URL</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or Vimeo link"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="w-full px-3 bg-white border border-[#CBD5E1] rounded text-sm text-[#1E293B] outline-none focus:border-[#0F766E] h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#1E293B]">Short Description</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Master Penthouse Drone Tour"
                          value={newVideoDesc}
                          onChange={(e) => setNewVideoDesc(e.target.value)}
                          className="flex-1 px-3 bg-white border border-[#CBD5E1] rounded text-sm text-[#1E293B] outline-none focus:border-[#0F766E] h-11 md:h-10 [@media(pointer:coarse)]:h-11 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={handleAddVideoUrl}
                          className="px-4 h-auto bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded cursor-pointer shadow-2xs shrink-0 min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mediaVideos.length === 0 ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1 inline-block max-w-full overflow-hidden">videocam_off</span>
                  <p className="text-xs font-semibold text-[#64748B]">No videos added.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mediaVideos.map((vid, index) => (
                    <div
                      key={vid.id}
                      className="p-3 bg-white border border-[#CBD5E1] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-16 h-12 rounded bg-slate-900 text-white shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">play_circle</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <input
                            type="text"
                            value={vid.shortDescription}
                            placeholder="Video Description"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaVideos(prev => prev.map((v, idx) => idx === index ? { ...v, shortDescription: e.target.value } : v));
                            }}
                            className="w-full px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-sm text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                          />
                          <p className="text-[11px] text-[#64748B] truncate font-mono">{vid.mediaUrl}</p>
                          {vid.isUploading && (
                            <div className="text-[10px] text-[#0F766E] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                              <span>Uploading video...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleVideoMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaVideos.length - 1}
                            onClick={() => handleVideoMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (vid.isLink) {
                              window.open(vid.mediaUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              setPreviewMediaItem({ type: 'video', url: vid.mediaUrl, title: vid.shortDescription || 'Listing Video' });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Video',
                              index,
                              title: vid.shortDescription || `Video #${index + 1}`,
                              onConfirm: () => {
                                setMediaVideos(prev => prev.filter((_, idx) => idx !== index).map((v, idx) => ({ ...v, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4. VIRTUAL TOURS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  <span>Virtual Tours</span>
                  <span className="text-slate-400 font-normal">({mediaVirtualTours.length})</span>
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Embed Matterport, Kuula, or 360° virtual tour URLs for interactive spatial navigation.
                </p>
              </div>

              {/* Add Tour Inputs */}
              <div className="p-4 border border-[#CBD5E1] rounded-md bg-[#F8FAFC] flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#1E293B]">Tour URL</label>
                    <input
                      type="url"
                      placeholder="https://my.matterport.com/show/?m=..."
                      value={newTourUrl}
                      onChange={(e) => setNewTourUrl(e.target.value)}
                      className="w-full px-3 bg-white border border-[#CBD5E1] rounded text-sm text-[#1E293B] outline-none focus:border-[#0F766E] h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#1E293B]">Short Description</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 3D Digital Twin Matterport Walkthrough"
                        value={newTourDesc}
                        onChange={(e) => setNewTourDesc(e.target.value)}
                        className="flex-1 px-3 bg-white border border-[#CBD5E1] rounded text-sm text-[#1E293B] outline-none focus:border-[#0F766E] h-11 md:h-10 [@media(pointer:coarse)]:h-11 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleAddVirtualTour}
                        className="px-4 h-auto bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded cursor-pointer shadow-2xs shrink-0 min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                      >
                        Add Tour
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {mediaVirtualTours.length === 0 ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1 inline-block max-w-full overflow-hidden">view_in_ar</span>
                  <p className="text-xs font-semibold text-[#64748B]">No virtual tours added.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mediaVirtualTours.map((tour, index) => (
                    <div
                      key={tour.id}
                      className="p-3 bg-white border border-[#CBD5E1] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded bg-teal-50 border border-teal-200 text-[#0F766E] shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">view_in_ar</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <input
                            type="text"
                            value={tour.shortDescription}
                            placeholder="Tour Description"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaVirtualTours(prev => prev.map((t, idx) => idx === index ? { ...t, shortDescription: e.target.value } : t));
                            }}
                            className="w-full px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-sm text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                          />
                          <p className="text-[11px] text-[#64748B] truncate font-mono">{tour.mediaUrl}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleTourMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaVirtualTours.length - 1}
                            onClick={() => handleTourMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(tour.mediaUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Open Tour
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Virtual Tour',
                              index,
                              title: tour.shortDescription || `Virtual Tour #${index + 1}`,
                              onConfirm: () => {
                                setMediaVirtualTours(prev => prev.filter((_, idx) => idx !== index).map((t, idx) => ({ ...t, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 5. DOCUMENTS SECTION */}
            {/* --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F766E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Documents</span>
                    <span className="text-slate-400 font-normal">({mediaDocuments.length})</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload official disclosures, tax declarations, titles, or marketing brochures.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    id="documents-file-input"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                  <label
                    htmlFor="documents-file-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F766E] border border-[#0F766E] text-sm font-semibold rounded-md cursor-pointer transition-colors shadow-2xs min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 justify-center whitespace-normal"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Upload Documents</span>
                  </label>
                </div>
              </div>

              {mediaDocuments.length === 0 ? (
                <div className="p-4 border border-dashed border-[#CBD5E1] rounded-md text-center bg-[#F8FAFC]">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1 inline-block max-w-full overflow-hidden">folder_off</span>
                  <p className="text-xs font-semibold text-[#64748B]">No documents added.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mediaDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-[#CBD5E1] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 text-slate-600 shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">description</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <input
                            type="text"
                            value={doc.shortDescription}
                            placeholder="Document Description (e.g. Certified True Copy of Title)"
                            onChange={(e) => {
                              setIsDirty(true);
                              setMediaDocuments(prev => prev.map((d, idx) => idx === index ? { ...d, shortDescription: e.target.value } : d));
                            }}
                            className="w-full px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-sm text-[#1E293B] focus:border-[#0F766E] focus:bg-white outline-none h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                          />
                          {doc.isUploading && (
                            <div className="text-[10px] text-[#0F766E] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                              <span>Uploading document ({doc.progress}%)...</span>
                            </div>
                          )}
                          {doc.error && (
                            <div className="text-[10px] text-red-600 flex items-center gap-2">
                              <span>Error: {doc.error}</span>
                              <button type="button" onClick={() => uploadSingleMediaFile(doc.file, 'Document', (u) => setMediaDocuments(prev => prev.map((d, idx) => idx === index ? { ...d, ...u } : d)))} className="underline font-bold min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11">
                                Retry Upload
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleDocumentMove(index, index - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaDocuments.length - 1}
                            onClick={() => handleDocumentMove(index, index + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(doc.mediaUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Open Document
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({
                              type: 'Document',
                              index,
                              title: doc.shortDescription || `Document #${index + 1}`,
                              onConfirm: () => {
                                setMediaDocuments(prev => prev.filter((_, idx) => idx !== index).map((d, idx) => ({ ...d, orderIndex: idx + 1 })));
                                setIsDirty(true);
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded text-xs font-semibold cursor-pointer min-h-11 min-w-11 md:min-h-10 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confidential Broker Section */}
            <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">lock</span>
                Confidential Broker Governance (Private & Redacted from Clients)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#64748B]">
                    Buyer Agency Commission
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3.0%"
                    value={formData.commissionSplit}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, commissionSplit: e.target.value }); }}
                    className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#64748B]">
                    Lockbox Passcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4821"
                    value={formData.lockboxCode}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, lockboxCode: e.target.value }); }}
                    className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-mono font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#64748B]">
                    Owner Direct Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 000 0000"
                    value={formData.seller_direct_phone}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, seller_direct_phone: e.target.value }); }}
                    className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
                  <label className="text-sm font-semibold text-[#64748B]">
                    Internal Showing Notes / Lockbox Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call listing agent 24 hours in advance. Keybox located at side gate column."
                    value={formData.showingInstructions}
                    onChange={e => { setIsDirty(true); setFormData({ ...formData, showingInstructions: e.target.value }); }}
                    className="w-full px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-medium text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-none transition-colors h-11 md:h-10 [@media(pointer:coarse)]:h-11"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* SECTION 7: REVIEW AND SUBMIT */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div data-testid="broker-card" className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[22px]">fact_check</span>
                    <span>Review Listing</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Check your details before publishing.
                  </p>
                </div>
                {/* Mobile Preview Action */}
                <div className="lg:hidden">
                  <ViewPropertyButton
                    onClick={() => setShowPublicPreview(true)}
                    label="Preview Listing"
                    size="sm"
                    title="Preview Listing"
                    className="min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11"
                  />
                </div>
              </div>
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{submissionError.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmissionError(null)}
                    className="text-red-500 hover:text-red-800 cursor-pointer font-bold text-sm min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-red-600">{submissionError.message}</p>
                {Array.isArray(submissionError.errors) && submissionError.errors.length > 0 && (
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-red-600">
                    {submissionError.errors.map((err, idx) => (
                      <li key={idx}>
                        <strong className="text-red-800">{err.field}:</strong> {err.message}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setReturnToReview(true);
                            setCurrentStep(err.step);
                          }}
                          className="text-[#0F766E] font-semibold underline hover:text-[#115E59] ml-1 cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          Fix in step {err.step}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (user?.role === 'agent') {
                        executeSubmission('Pending Approval');
                      } else {
                        executeSubmission(isEditing ? formData.standard_status : 'Active');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded shadow-xs cursor-pointer transition-colors min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    Retry Submission
                  </button>
                </div>
              </div>
            )}

            {/* Compact Missing Information Banner (Only displayed when required items are missing) */}
            {validationSummary.finalErrors.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-md space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    <span>Missing Information</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    {validationSummary.finalErrors.length} requirement{validationSummary.finalErrors.length === 1 ? '' : 's'} remaining
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {validationSummary.finalErrors.map((err, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white/90 border border-amber-200 rounded-md text-sm">
                      <span className="min-w-0 break-words text-slate-700 font-medium">{err.field}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReturnToReview(true);
                          setCurrentStep(err.step);
                        }}
                        className="text-[#0F766E] hover:text-[#115E59] font-semibold hover:underline shrink-0 text-[11px] flex items-center gap-0.5 cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                      >
                        <span>Fix</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Clean Stacked Review Panel */}
            <div className="bg-white rounded-md border border-[#E2E8F0] shadow-xs divide-y divide-[#E2E8F0]">
              
              {/* 1. Basic Info */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">info</span>
                    <span>Basic Info</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(1);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="sm:col-span-2">
                    <span className="text-[#64748B] block mb-0.5">Title</span>
                    <span className="font-semibold text-[#1E293B] text-sm">
                      {formData.title || <span className="text-amber-600 font-normal italic">Not provided</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Property Type</span>
                    <span className="font-medium text-[#1E293B]">{formData.property_type || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Transaction Type</span>
                    <span className="font-medium text-[#1E293B]">{formData.transaction_type || 'For Sale'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Property Condition</span>
                    <span className="font-medium text-[#1E293B]">{formData.property_condition || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Architectural Style</span>
                    <span className="font-medium text-[#1E293B]">{formData.architectural_style || 'Not provided'}</span>
                  </div>
                  {formData.description && (
                    <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                      <span className="text-[#64748B] block mb-1">Description</span>
                      <div 
                        className="text-slate-700 bg-slate-50 p-3 rounded-md text-sm leading-relaxed max-h-40 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: formData.description }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Location */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">location_on</span>
                    <span>Location</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="sm:col-span-2">
                    <span className="text-[#64748B] block mb-0.5">Generated Address</span>
                    <span className="font-medium text-[#1E293B] bg-slate-50 p-2.5 rounded-md border border-slate-200 block text-xs">
                      {liveUnparsedAddress || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Region</span>
                    <span className="font-medium text-[#1E293B]">{formData.region || 'Not provided'}</span>
                  </div>
                  {phLocationService.isProvinceApplicable(formData.region_psgc_code) && (
                    <div>
                      <span className="text-[#64748B] block mb-0.5">Province</span>
                      <span className="font-medium text-[#1E293B]">{formData.province || 'Not provided'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#64748B] block mb-0.5">City / Municipality</span>
                    <span className="font-medium text-[#1E293B]">{formData.location || formData.city || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Barangay</span>
                    <span className="font-medium text-[#1E293B]">{formData.barangay || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Street Address</span>
                    <span className="font-medium text-[#1E293B]">{formData.address || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">ZIP Code</span>
                    <span className="font-medium text-[#1E293B]">{formData.postal_code || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Subdivision / Community</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1E293B]">{formData.subdivision_name || formData.subdivision || 'Not provided'}</span>
                      {formData.subdivision_lot_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                          <span className="material-symbols-outlined text-[11px]">layers</span>
                          Block {formData.block}, Lot {formData.lot}
                        </span>
                      )}
                    </div>
                    {formData.subdivision_project_id && (
                      <a
                        href={`/subdivisions/${formData.subdivision_project_id}/map`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline mt-1"
                      >
                        <span>Interactive Plan View</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    )}
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Building Name</span>
                    <span className="font-medium text-[#1E293B]">{formData.building_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Coordinates (Latitude & Longitude)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#0F766E] font-medium">
                        {formData.latitude && formData.longitude 
                          ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}` 
                          : <span className="text-amber-600 font-sans font-normal italic">Not provided</span>}
                      </span>
                      {formData.latitude && formData.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${Number(formData.latitude).toFixed(6)},${Number(formData.longitude).toFixed(6)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline"
                        >
                          <span>Open in Google Maps</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="sm:col-span-2 mt-2 rounded-md overflow-hidden border border-[#CBD5E1] bg-slate-50 relative aspect-[21/9]">
                      <iframe
                        title="Review Google Maps Cadastral Pinpoint"
                        src={`https://maps.google.com/maps?q=${Number(formData.latitude).toFixed(6)},${Number(formData.longitude).toFixed(6)}&t=m&z=15&output=embed`}
                        className="w-full h-full border-0 select-none"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Specifications */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">tune</span>
                    <span>Specifications</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(3);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Bedrooms</span>
                    <span className="font-medium text-[#1E293B]">{formData.bedrooms_total !== '' && formData.bedrooms_total !== undefined ? formData.bedrooms_total : (formData.bedrooms !== '' && formData.bedrooms !== undefined ? formData.bedrooms : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Bathrooms</span>
                    <span className="font-medium text-[#1E293B]">{formData.bathrooms_total_integer !== '' && formData.bathrooms_total_integer !== undefined ? formData.bathrooms_total_integer : (formData.bathrooms !== '' && formData.bathrooms !== undefined ? formData.bathrooms : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Floor Area</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.living_area || formData.floor_area 
                        ? `${formData.living_area || formData.floor_area} ${formData.living_area_units || formData.floor_area_unit || 'sqm'}` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Lot Area</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.lot_size_area || formData.lot_area 
                        ? `${formData.lot_size_area || formData.lot_area} ${formData.lot_size_units || formData.lot_area_unit || 'sqm'}` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Parking Spaces</span>
                    <span className="font-medium text-[#1E293B]">{formData.parking_total !== '' && formData.parking_total !== undefined ? formData.parking_total : (formData.parking !== '' && formData.parking !== undefined ? formData.parking : 'Not provided')}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Year Built</span>
                    <span className="font-medium text-[#1E293B]">{formData.year_built || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Pricing & Terms */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">payments</span>
                    <span>Pricing & Terms</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(4);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Price</span>
                    <span className="font-mono font-bold text-[#0F766E] text-base">
                      {formData.price 
                        ? `${formData.currency || 'PHP'} ${Number(formData.price).toLocaleString()}` 
                        : <span className="text-amber-600 font-sans font-normal italic text-xs">Price not entered</span>}
                    </span>
                  </div>
                  {formData.transaction_type === 'For Rent' && (
                    <div>
                      <span className="text-[#64748B] block mb-0.5">Rent Frequency</span>
                      <span className="font-medium text-[#1E293B]">{formData.rent_frequency || 'Monthly'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Association Dues</span>
                    <span className="font-medium text-[#1E293B]">
                      {formData.association_fee 
                        ? `${formData.currency || 'PHP'} ${Number(formData.association_fee).toLocaleString()} (${formData.association_fee_frequency || 'Monthly'})` 
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Price / Sqm</span>
                    <span className="font-mono text-[#1E293B]">
                      {formData.price && (formData.living_area || formData.floor_area)
                        ? `${formData.currency || 'PHP'} ${Math.round(Number(formData.price) / Number(formData.living_area || formData.floor_area)).toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Features & Amenities */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">auto_awesome</span>
                    <span>Features & Amenities</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(5);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Shared Amenities ({formData.amenities.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.amenities.length > 0 ? (
                        formData.amenities.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Indoor Features ({formData.interior_features.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.interior_features.length > 0 ? (
                        formData.interior_features.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Outdoor Features ({formData.exterior_features.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.exterior_features.length > 0 ? (
                        formData.exterior_features.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-[#1E293B] rounded-md text-[11px] font-medium border border-slate-200">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Media & Documents */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0F766E] text-[18px]">photo_library</span>
                    <span>Media & Documents</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToReview(true);
                      setCurrentStep(6);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    {mediaPhotos[0] ? (
                      <img
                        src={mediaPhotos[0].imageUrl}
                        alt="Cover Photo"
                        className="w-16 h-12 rounded object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#1E293B]">
                        {mediaPhotos.length > 0 ? `${mediaPhotos.length} Photo${mediaPhotos.length === 1 ? '' : 's'}` : <span className="text-amber-600 font-normal italic">Add a cover photo</span>}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {mediaFloorPlans.length} Floor plan{mediaFloorPlans.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[#64748B]">Additional Assets</p>
                    <p className="font-medium text-[#1E293B]">
                      {mediaVideos.length} Video{mediaVideos.length === 1 ? '' : 's'} • {mediaVirtualTours.length} Virtual tour{mediaVirtualTours.length === 1 ? '' : 's'} • {mediaDocuments.length} Document{mediaDocuments.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Listing Settings */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-md flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-[#1E293B]">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">settings</span>
                <span>Listing Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 items-center">
                {/* Listing Status Badge */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#1E293B] block">
                    Listing Status
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                      formData.standard_status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : formData.standard_status === 'Pending Approval' || formData.standard_status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : formData.standard_status === 'Draft'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-teal-50 text-[#0F766E] border-teal-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        formData.standard_status === 'Active'
                          ? 'bg-emerald-500'
                          : formData.standard_status === 'Pending Approval' || formData.standard_status === 'Pending'
                          ? 'bg-amber-500'
                          : formData.standard_status === 'Draft'
                          ? 'bg-slate-400'
                          : 'bg-[#0F766E]'
                      }`} />
                      {formData.standard_status || 'Draft'}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Read-only status
                    </span>
                  </div>
                </div>

                {/* Featured Property Toggle (Authorized Staff) */}
                {(!user || ['broker', 'admin'].includes(user?.role)) ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                      <label htmlFor="featured-toggle" className="text-sm font-semibold text-[#1E293B] cursor-pointer">
                        Featured Property
                      </label>
                      <button
                        type="button"
                        id="featured-toggle"
                        role="switch"
                        aria-checked={Boolean(formData.is_featured)}
                        onClick={() => {
                          setIsDirty(true);
                          setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }));
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none after:absolute after:-inset-y-2.5 after:-inset-x-1 ${
                          formData.is_featured ? 'bg-[#0F766E]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            formData.is_featured ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Highlight this listing on the homepage and search results.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 opacity-60">
                    <label className="text-sm font-semibold text-[#1E293B] block">
                      Featured Property
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      Featured property status requires broker or administrator authorization.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Information (Collapsible Section) */}
            {(!user || ['broker', 'agent', 'admin'].includes(user?.role)) && (
              <div className="bg-white border border-[#E2E8F0] rounded-md shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsInternalInfoOpen(prev => !prev)}
                  className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer min-h-11 min-w-11 md:min-h-8 md:min-w-8 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0F766E]">lock</span>
                    <div>
                      <span className="text-xs font-bold text-[#1E293B] block">Internal Information</span>
                      <span className="text-[11px] text-[#64748B]">Visible only to authorized staff.</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isInternalInfoOpen ? 'rotate-180 text-[#0F766E]' : ''}`} />
                </button>

                {isInternalInfoOpen && (
                  <div className="p-4 pt-0 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in duration-150">
                    {/* Private Notes */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#1E293B] block">
                        Private Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add confidential broker remarks or negotiation history..."
                        value={formData.privateNotes || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, privateNotes: e.target.value });
                        }}
                        className="w-full p-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Showing Instructions */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#1E293B] block">
                        Showing Instructions
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Call listing agent 24 hours in advance. Lockbox located at side gate column."
                        value={formData.showingInstructions || ''}
                        onChange={e => {
                          setIsDirty(true);
                          setFormData({ ...formData, showingInstructions: e.target.value });
                        }}
                        className="w-full p-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Wizard Navigation Footer / Bottom Action Bar (Visible while scrolling) */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0] p-3 rounded-md shadow-xs">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
=======
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Link
                to="/broker/properties"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline w-fit"
              >
                <ArrowLeft className="size-4" />
                Back to Listings
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B]">
                {isEditing ? 'Edit Property Listing' : 'Create Property Listing'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
>>>>>>> property-tech-v3.0
              <Button
                type="button"
                variant="outline"
                onClick={() => setMobilePreviewOpen(true)}
                className="lg:hidden min-h-11 px-3.5 border-[#E2E8F0] bg-white text-[#1E293B] font-semibold rounded-lg cursor-pointer"
              >
                <Eye className="size-4 mr-1.5 text-[#0F766E]" />
                Preview
              </Button>
              {!isEditing && isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmResetOpen(true)}
                  className="min-h-11 px-3.5 border-[#E2E8F0] bg-white text-[#1E293B] font-semibold rounded-lg cursor-pointer"
                >
                  <RotateCcw className="size-4 mr-1.5 text-[#FF6B6B]" />
                  Reset
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => executeSubmission('Draft')}
                className="min-h-11 px-4 border-[#E2E8F0] bg-white text-[#1E293B] font-semibold rounded-lg cursor-pointer"
              >
                <Save className="size-4 mr-2 text-[#0F766E]" />
                {isSubmitting && activeActionLabel === 'Saving Draft...'
                  ? 'Saving Draft...'
                  : 'Save Draft'}
              </Button>
            </div>
          </div>

          {/* 5-Step Progress Bar */}
          <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
            <CardContent className="p-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`relative min-h-11 px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-left transition-colors cursor-pointer ${isActive ? 'text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="create-listing-step-pill"
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                        className="absolute inset-0 rounded-lg bg-[#0F766E] shadow-xs"
                      />
                    )}
                    <span
                      className={`relative z-10 size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive
                        ? 'bg-white/20 text-white'
                        : isCompleted
                          ? 'bg-[#F0FDFA] text-[#0F766E]'
                          : 'bg-[#F8FAFC] text-[#64748B]'
                        }`}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Icon className="size-3.5" />
                      )}
                    </span>
                    <div className="relative z-10 min-w-0">
                      <p
                        className={`text-[11px] font-medium ${isActive ? 'text-white/80' : 'text-[#64748B]'
                          }`}
                      >
                        Step {step.id}
                      </p>
                      <p className="text-xs font-semibold truncate">{step.title}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <p className="text-xs text-[#64748B] px-1">
            <span className="text-[#FF6B6B] font-bold">*</span> Required fields
          </p>

          {/* Validation / Submission Alert */}
          {submissionError && (
            <Alert className="bg-white border-[#FF6B6B] rounded-xl">
              <AlertCircle className="size-4 text-[#FF6B6B]" />
              <AlertTitle className="text-[#1E293B] font-bold">
                {submissionError.title}
              </AlertTitle>
              <AlertDescription className="text-sm text-[#475569] flex flex-col gap-2">
                <span>{submissionError.message}</span>
                {submissionError.errors?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {submissionError.errors.map((err, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentStep(err.step)}
                        className="px-2.5 py-1 rounded-md bg-[#FFF5F5] border border-[#FF6B6B]/40 text-xs font-semibold text-[#FF6B6B] hover:bg-red-50 cursor-pointer"
                      >
                        Step {err.step}: {err.field}
                      </button>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 8/4 Bento Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                >
                  {currentStep === 1 && (
                    <ListingStepIdentityPricing
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                      propertyTypes={propertyTypes}
                      onPriceChange={handlePriceChange}
                      onPriceFocus={handlePriceFocus}
                      onPriceBlur={handlePriceBlur}
                      onUploadBankLogo={handleUploadBankLogo}
                    />
                  )}

                  {currentStep === 2 && (
                    <ListingStepLocation
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                      geoRegions={geoRegions}
                      geoProvinces={geoProvinces}
                      geoCities={geoCities}
                      geoBarangays={geoBarangays}
                      isGeoLoading={{
                        provinces: isLoadingProvinces,
                        cities: isLoadingCities,
                        barangays: isLoadingBarangays,
                      }}
                      locationNotice={locationNotice}
                      onRegionSelect={handleRegionSelect}
                      onProvinceSelect={handleProvinceSelect}
                      onCitySelect={handleCitySelect}
                      onBarangaySelect={handleBarangaySelect}
                      mapSearchQuery={mapSearchQuery}
                      setMapSearchQuery={setMapSearchQuery}
                      onGeocode={handleGeocode}
                      isGeocoding={isGeocoding}
                      addressSuggestions={addressSuggestions}
                      onSelectAddressSuggestion={handleSelectAddressSuggestion}
                      onSuggestNearbyPlaces={handleSuggestNearbyPlaces}
                      renderMap={() => (
                        <LocationPinMap
                          position={mapPosition}
                          zoom={formData.latitude ? 15 : 11}
                          onChange={(pos) => {
                            handleMapPositionChange(pos);
                            handlePinMoved(pos);
                          }}
                          className="h-72 w-full"
                        />
                      )}
                    />
                  )}

                  {currentStep === 3 && (
                    <ListingStepSpecsFeatures
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                    />
                  )}

                  {currentStep === 4 && (
                    <ListingStepMedia
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                      mediaPhotos={mediaPhotos}
                      categoryVideos={categoryVideos}
                      onUploadCategoryFiles={handleUploadCategoryFiles}
                      onAddCategoryImageUrl={handleAddCategoryImageUrl}
                      onUpdatePhotoItem={handleUpdatePhotoItem}
                      onRemovePhotoItem={handleRemovePhotoItem}
                      onRetryPhotoItem={handleRetryPhotoItem}
                      onUploadCategoryVideo={handleUploadCategoryVideo}
                      onAddCategoryVideoUrl={handleAddCategoryVideoUrl}
                      onUploadCategoryVideoThumbnail={handleUploadCategoryVideoThumbnail}
                      onUpdateCategoryVideo={handleUpdateCategoryVideo}
                      onRemoveCategoryVideo={handleRemoveCategoryVideo}
                    />
                  )}

                  {currentStep === 5 && (
                    <ListingStepCredentialsReview
                      formData={formData}
                      setFormData={setFormData}
                      setIsDirty={setIsDirty}
                      user={user}
                      agents={agents}
                      mediaPhotosCount={mediaPhotos.length}
                      onJumpToStep={setCurrentStep}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Step Footer Navigation (Single Solid Primary CTA) */}
              <Card className="sticky bottom-2 z-20 lg:static bg-white border-[#E2E8F0] rounded-xl shadow-md lg:shadow-xs">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                        className="min-h-11 px-4 border-[#E2E8F0] text-[#1E293B] font-semibold rounded-lg cursor-pointer"
                      >
                        <ArrowLeft className="size-4 mr-2" />
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
                        className="min-h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
                      >
                        Next Step
                        <ArrowRight className="size-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          executeSubmission(
                            user?.role === 'agent' ? 'Pending Approval' : 'Active'
                          )
                        }
                        className="min-h-11 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
                      >
                        <Send className="size-4 mr-2" />
                        {isSubmitting
                          ? activeActionLabel
                          : user?.role === 'agent'
                            ? 'Submit for Review'
                            : isEditing
                              ? 'Save Changes'
                              : 'Publish Listing'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sticky Live Preview Sidebar */}
            <aside className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
              <ListingPreviewCard
                formData={formData}
                user={user}
                coverPhotoUrl={coverPhotoUrl}
                currentStep={currentStep}
                totalSteps={STEPS.length}
              />
            </aside>
          </div>
        </div>

        {/* Success Modal */}
        <DashboardModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/broker/properties');
          }}
          title={
            savedStatusType === 'Draft'
              ? 'Draft Saved'
              : savedStatusType === 'Pending Confirmation'
                ? 'Saved — Pending Agent Confirmation'
                : savedStatusType === 'Pending Approval'
                  ? 'Submitted for Review'
                  : 'Listing Published'
          }
        >
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="size-12 rounded-full bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-sm text-[#475569]">
              {savedStatusType === 'Draft'
                ? 'Your listing draft has been saved. You can finish and publish it anytime.'
                : savedStatusType === 'Pending Confirmation'
                  ? 'Saved, but not published yet. The assigned agent must confirm before this listing goes live.'
                  : 'Your property listing is saved and ready.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {createdPropertyId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/properties/${createdPropertyId}`)}
                  className="min-h-11 px-4 border-[#E2E8F0] text-[#1E293B] font-semibold rounded-lg cursor-pointer"
                >
                  View Listing
                </Button>
              )}
              <Button
                type="button"
                onClick={() => navigate('/broker/properties')}
                className="min-h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
              >
                Go to My Listings
              </Button>
            </div>
          </div>
        </DashboardModal>

        {/* Mobile Preview Drawer */}
        <Drawer open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen} direction="bottom">
          <DrawerContent className="max-h-[85vh] bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <DrawerHeader>
              <DrawerTitle className="text-base font-bold text-[#1E293B]">
                Live Buyer Preview
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2 overflow-y-auto">
              <ListingPreviewCard
                formData={formData}
                user={user}
                coverPhotoUrl={coverPhotoUrl}
                currentStep={currentStep}
                totalSteps={STEPS.length}
              />
            </div>
            <DrawerFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMobilePreviewOpen(false)}
                className="min-h-11 w-full border-[#E2E8F0] bg-white font-semibold rounded-lg"
              >
                Close Preview
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Reset Confirmation Dialog */}
        <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
          <DialogContent className="max-w-md bg-white border-[#E2E8F0] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                Clear all entered listing details?
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                This will reset the form fields back to blank defaults.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-11 px-4 border-[#E2E8F0] rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setFormData(INITIAL_FORM_DATA);
                  setMediaPhotos([]);
                  setCategoryVideos({});
                  setIsDirty(false);
                  setCurrentStep(1);
                  setConfirmResetOpen(false);
                }}
                className="min-h-11 px-4 rounded-lg"
              >
                Confirm Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Missing Required Fields Warning Modal (Save as Draft Only) */}
        <Dialog open={Boolean(missingFieldsModal)} onOpenChange={(open) => !open && setMissingFieldsModal(null)}>
          <DialogContent className="max-w-lg bg-white border-[#E2E8F0] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2.5 pr-6">
                <span className="size-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
                </span>
                Cannot Publish Listing
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                Some required details are still missing. Complete them below to publish, or save your progress as a draft.
              </DialogDescription>
            </DialogHeader>

            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Field
                    </th>
                    <th className="py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Current Value
                    </th>
                    <th className="py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {(missingFieldsModal?.errors || []).map((err, idx) => (
                    <tr key={`${err.field}-${idx}`} className="hover:bg-[#F8FAFC]/70 transition-colors">
                      <td className="py-2.5 px-3.5 align-middle">
                        <span className="text-xs font-semibold text-[#1E293B] block">{err.field}</span>
                      </td>
                      <td className="py-2.5 px-3.5 align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {err.value || 'Missing'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 align-middle text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMissingFieldsModal(null);
                            setCurrentStep(err.step);
                          }}
                          className="h-7 px-2.5 text-xs font-medium border-[#E2E8F0] bg-white hover:bg-[#F0FDFA] hover:text-[#0F766E] hover:border-[#0F766E]/30 rounded-md cursor-pointer"
                        >
                          Step {err.step}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(() => {
              const missingDraftBasics = (missingFieldsModal?.errors || []).some(
                (e) => e.field === 'Listing Title' || e.field === 'Price'
              );
              return (
                <>
                  {missingDraftBasics && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Add Listing Title and Price first to save as a draft.
                    </p>
                  )}
                  <DialogFooter className="gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMissingFieldsModal(null)}
                      className="min-h-11 px-4 border-[#E2E8F0] rounded-lg cursor-pointer"
                    >
                      Go Back & Fix
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting || missingDraftBasics}
                      onClick={() => {
                        setMissingFieldsModal(null);
                        executeSubmission('Draft');
                      }}
                      className="min-h-11 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <Save className="size-4 mr-2" />
                      Save as Draft
                    </Button>
                  </DialogFooter>
                </>
<<<<<<< HEAD
              ) : (
                <>
                  {/* Save Draft Action */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => executeSubmission('Draft')}
                    className="w-full sm:w-auto h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-5"
                  >
                    {isSubmitting && activeActionLabel === 'Saving...' ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    ) : (
                      <FileText className="size-3.5 text-slate-500" />
                    )}
                    <span>{isSubmitting && activeActionLabel === 'Saving...' ? 'Saving…' : 'Save Draft'}</span>
                  </Button>

                  {/* Primary Workflow Action Button */}
                  {(() => {
                    const isAgent = user?.role === 'agent';

                    if (isEditing) {
                      if (isAgent) {
                        return (
                          <Button
                            type="button"
                            variant="coral"
                            disabled={isSubmitting}
                            onClick={() => executeSubmission('Pending Approval')}
                            className="w-full sm:w-auto h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-7 font-bold"
                          >
                            {isSubmitting ? (
                              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span>{isSubmitting ? (activeActionLabel || 'Submitting…') : 'Submit Changes for Review'}</span>
                          </Button>
                        );
                      }
                      return (
                        <Button
                          type="button"
                          variant="default"
                          disabled={isSubmitting}
                          onClick={() => executeSubmission(formData.standard_status || 'Active')}
                          className="w-full sm:w-auto h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-7 font-bold"
                        >
                          {isSubmitting ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          ) : (
                            <Check className="size-3.5 stroke-[3]" />
                          )}
                          <span>{isSubmitting ? (activeActionLabel || 'Saving…') : 'Save Changes'}</span>
                        </Button>
                      );
                    }

                    if (isAgent) {
                      return (
                        <Button
                          type="button"
                          variant="coral"
                          disabled={isSubmitting}
                          onClick={() => executeSubmission('Pending Approval')}
                          className="w-full sm:w-auto h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-7 font-bold"
                        >
                          {isSubmitting ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          <span>{isSubmitting ? (activeActionLabel || 'Submitting…') : 'Submit for Review'}</span>
                        </Button>
                      );
                    }

                    return (
                      <Button
                        type="button"
                        variant="coral"
                        disabled={isSubmitting}
                        onClick={() => executeSubmission(formData.standard_status || 'Active')}
                        className="w-full sm:w-auto h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 px-7 font-bold"
                      >
                        {isSubmitting ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>{isSubmitting ? (activeActionLabel || 'Publishing…') : 'Publish Listing'}</span>
                      </Button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>

    {/* Right Column: Listing Preview (Sticky Sidebar) */}
    <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
      {/* Step Indicator Header Bar */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
          Listing Preview
        </h4>
        <Badge variant="outline" className="text-[11px] font-mono text-[#0F766E] border-[#0F766E]/30 bg-teal-50/50">
          Step {currentStep} of 7
        </Badge>
      </div>

      {/* Modern Card replicating Image 2 using shadcn Card */}
      <Card data-testid="broker-card" className="bg-white rounded-[28px] border border-[#E2E8F0] p-4 shadow-sm space-y-4 overflow-hidden font-sans">
        {/* Cover Photo Container with Rounded Curvature & Image Badges */}
        <div className="relative aspect-[16/11] rounded-[20px] overflow-hidden bg-slate-100 border border-slate-200/80 group">
          {mediaPhotos.length > 0 ? (
            <img
              src={mediaPhotos[0].imageUrl}
              alt="Listing Cover"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop"
                alt="Default preview"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-white text-center p-4">
                <ImageIcon className="w-6 h-6 mb-1 opacity-90 drop-shadow" />
                <span className="text-[11px] font-medium drop-shadow">No cover photo uploaded</span>
              </div>
            </div>
          )}

          {/* Top-Left Pills: Max 2 pills (Pill 1: Merged Status, Pill 2: Condition) - No circle dots */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[78%]">
            <span 
              data-testid="card-status-badge"
              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xs shadow-xs ${
                formData.standard_status === 'Closed' || formData.status === 'SOLD'
                  ? 'bg-rose-600 text-white border border-rose-700'
                  : formData.standard_status === 'Active Under Contract' || formData.status === 'RESERVED'
                    ? 'bg-amber-50/95 text-amber-800 border border-amber-300'
                    : 'bg-white/95 text-[#1E293B] border border-slate-200/80'
              }`}
            >
              {resolvePropertyLifecycleState(formData).lifecycleKey}
            </span>
            {(formData.property_condition || formData.development_condition) && (
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-[#0F766E] shadow-xs border border-teal-100/60"
                data-testid="card-condition-badge"
              >
                {formData.property_condition || formData.development_condition}
              </span>
            )}
          </div>

          {/* Top-Right Round Button: Heart (Favorite) */}
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-rose-500 flex items-center justify-center shadow-xs transition-transform hover:scale-110 cursor-pointer"
              aria-label="Save to favorites"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            </button>
          </div>
        </div>

        {/* Content Section below photo */}
        <div className="space-y-3 px-1">
          {/* Coral dash + Uppercase Property Type + Condition State */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#E07A5F] rounded-full" />
              <span>{formData.property_type || 'PROPERTY TYPE'}</span>
            </div>
            {(formData.property_condition || formData.development_condition) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] font-semibold text-[10px] tracking-normal border border-teal-200/60 capitalize">
                {formData.property_condition || formData.development_condition}
              </span>
            )}
          </div>

          {/* Property Address Heading with Map Pin Icon & Coral Period */}
          <h3
            data-testid="preview-card-address-heading"
            className="text-xl sm:text-2xl font-bold text-[#0F4C5C] tracking-tight line-clamp-2 leading-tight flex items-center gap-2"
          >
            <span className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-[#E07A5F] shrink-0">
              <MapPin className="w-4 h-4 text-[#E07A5F]" />
            </span>
            <span className="truncate">
              {formatPropertyAddressHeading({ ...formData, title: '' }, 'Property address')}
              <span className="text-[#E07A5F]">.</span>
            </span>
          </h3>

          {/* Key Specs Row: beds, baths, area */}
          <div className="flex items-center gap-4 sm:gap-5 text-xs text-slate-500 font-medium pt-0.5">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{formData.bedrooms_total || formData.bedrooms ? `${formData.bedrooms_total || formData.bedrooms} beds` : '— beds'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-slate-400" />
              <span>{formData.bathrooms_total_integer || formData.bathrooms ? `${formData.bathrooms_total_integer || formData.bathrooms} baths` : '— baths'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-slate-400" />
              <span>
                {formData.living_area || formData.floor_area 
                  ? `${formData.living_area || formData.floor_area} m²` 
                  : '— m²'}
              </span>
            </div>
          </div>

          {/* Assigned Agent Placeholder */}
          <div className="pt-2 pb-0.5 border-t border-slate-100 flex items-center justify-between" data-testid="card-agent-placeholder">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                <User className="w-3.5 h-3.5 text-[#0F766E]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[#1E293B] truncate leading-tight">
                  {formData.agent_name || 'Human Shelter Desk'}
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

          {/* Footer: Price & View Property Pill Button */}
          <div className="flex items-end justify-between gap-2 pt-0.5">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Price</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0F4C5C] tracking-tight">
                {formData.price 
                  ? `₱ ${Number(formData.price).toLocaleString()}` 
                  : '₱ Price'}
              </p>
            </div>

            <ViewPropertyButton
              onClick={() => setShowPublicPreview(true)}
              title="Preview Listing"
            />
          </div>
        </div>
      </Card>
    </div>
  </div>

      {/* Success Modal */}
      <DashboardModal
        isOpen={showSuccessModal}
        onClose={() => {
          if (isDrawer && onClose) onClose();
          else navigate('/broker/properties');
        }}
        title={
          savedStatusType === 'Draft' 
            ? "Listing Saved as Draft" 
            : savedStatusType === 'Pending Approval'
            ? "Listing Submitted for Review"
            : isEditing 
            ? "Listing Changes Saved" 
            : "Listing Published Successfully"
        }
        subtitle="Your property listing specifications and media assets have been recorded in the database."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {createdPropertyId && (
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/properties/${createdPropertyId}`);
                }}
                className="h-10 px-4 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                View Listing
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setShowPublicPreview(true);
              }}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Preview Listing
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDrawer && onClose) onClose();
                else navigate('/broker/properties');
              }}
              className="h-10 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Back to Listings
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-[#64748B]">
          <p>
            Property <strong className="text-[#1E293B]">{formData.title || 'Untitled Property'}</strong> has been registered with status: <strong className="text-[#0F766E] font-bold">{savedStatusType}</strong>.
          </p>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1 text-[11px] text-[#64748B]">
            <div><span className="font-semibold text-slate-700">Property Identifier:</span> <span className="font-mono text-slate-800">{createdPropertyId || id || 'Pending'}</span></div>
            <div><span className="font-semibold text-slate-700">Cadastral Location:</span> {formData.location || 'Metro Manila'} (Coordinates: {formData.latitude || '14.5995'}, {formData.longitude || '120.9842'})</div>
            <div><span className="font-semibold text-slate-700">Valuation:</span> {formData.currency || 'PHP'} {Number(formData.price || 0).toLocaleString()}</div>
          </div>
        </div>
      </DashboardModal>

      {/* Public Listing Preview Modal (Strictly Redacting Confidential Fields) */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E]">public</span>
                  Public Listing Preview
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Exact rendering visible to buyers and clients (internal broker remarks & codes are strictly excluded).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                aria-label="Close Preview"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Media Gallery / Cover View */}
              <div className="relative aspect-video sm:aspect-21/9 rounded-xl overflow-hidden bg-slate-900 border border-[#E2E8F0]">
                {mediaPhotos.length > 0 ? (
                  <img
                    src={mediaPhotos[0].imageUrl}
                    alt="Cover Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageIcon className="w-10 h-10 text-slate-500 stroke-[1.5]" />
                    <span className="text-xs">No cover photo uploaded</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded">
                    {formData.transaction_type}
                  </span>
                  <span className="bg-[#0F766E] text-white text-xs font-semibold px-2.5 py-1 rounded">
                    {formData.property_type}
                  </span>
                  {formData.is_featured && (
                    <span className="bg-[#FF6B6B] text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
                {mediaPhotos.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded font-semibold">
                    1 of {mediaPhotos.length} Photos
                  </span>
                )}
              </div>

              {/* Address & Pricing Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1E293B]">
                    {formatPropertyAddressHeading(formData, 'Property Address')}
                  </h2>
                  <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0F766E]">domain</span>
                    {formatPropertyDeveloperName(formData, 'Independent Developer')}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold font-mono text-[#0F766E]">
                    {formData.currency || 'PHP'} {formData.price ? Number(formData.price).toLocaleString() : '0'}
                  </div>
                  {formData.transaction_type === 'For Rent' && (
                    <span className="text-xs text-[#64748B]">Per {formData.rent_frequency || 'Month'}</span>
                  )}
                </div>
              </div>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bedrooms</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.bedrooms_total || formData.bedrooms}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bathrooms</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.bathrooms_total_integer || formData.bathrooms}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Living Area</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.living_area || formData.floor_area || '—'} {formData.living_area_units || formData.floor_area_unit}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Parking</span>
                  <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{formData.parking_total || formData.parking} Slots</span>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Property Description
                  </h4>
                  <div 
                    className="text-xs text-[#64748B] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}

              {/* Amenities & Features */}
              {([...formData.amenities, ...formData.interior_features, ...formData.exterior_features].length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Features & Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...formData.amenities, ...formData.interior_features, ...formData.exterior_features].map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] rounded-full text-xs font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Media Assets (Floor Plans, Videos, Tours) */}
              {(mediaFloorPlans.length > 0 || mediaVideos.length > 0 || mediaVirtualTours.length > 0) && (
                <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Interactive Media & Assets
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {mediaFloorPlans.map((plan, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">architecture</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{plan.shortDescription || `Floor Plan #${idx + 1}`}</span>
                        </div>
                        <a href={plan.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          View
                        </a>
                      </div>
                    ))}
                    {mediaVideos.map((vid, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">videocam</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{vid.shortDescription || `Video #${idx + 1}`}</span>
                        </div>
                        <a href={vid.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          Watch
                        </a>
                      </div>
                    ))}
                    {mediaVirtualTours.map((tour, idx) => (
                      <div key={idx} className="p-3 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[#0F766E] text-[18px]">360</span>
                          <span className="text-xs font-semibold text-[#1E293B] truncate">{tour.shortDescription || `Virtual Tour #${idx + 1}`}</span>
                        </div>
                        <a href={tour.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0F766E] font-semibold underline">
                          Open Tour
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                Public Preview Mode • Confidential fields suppressed
              </span>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="h-10 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Done with Preview
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Media Preview Modal */}
      {previewMediaItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0F766E] text-[18px]">visibility</span>
                <span>{previewMediaItem.title || 'Media Preview'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setPreviewMediaItem(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              {previewMediaItem.type === 'video' ? (
                <video src={previewMediaItem.url} controls className="max-h-[65vh] max-w-full rounded" autoPlay />
              ) : (
                <img src={previewMediaItem.url} alt="Preview" className="max-h-[65vh] max-w-full object-contain rounded" />
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewMediaItem(null)}
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg hover:bg-[#115E59] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Place Subdivision Project Creation Modal */}
      <SubdivisionCreateModal
        isOpen={isSubdivisionModalOpen}
        onClose={() => setIsSubdivisionModalOpen(false)}
        onCreated={handleSubdivisionCreated}
      />

      {/* Remove Confirmation Modal */}
      {itemToDelete && (
        <div role="dialog" aria-modal="true" aria-label="Remove Confirmation" data-testid="broker-dialog" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1E293B]">Remove this item from the listing?</h4>
              <p className="text-xs text-[#64748B] mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{itemToDelete.title}</span>? Unlinked assets will be excluded from the published listing.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.onConfirm) itemToDelete.onConfirm();
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
=======
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
>>>>>>> property-tech-v3.0
  );
}
