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
          propertyCategory: p.property_category || p.propertyCategory || custom.propertyCategory || 'Residential',
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
          association_fee: p.association_fee ?? p.associationFee ?? custom.associationFee ?? '',
          associationFee: p.association_fee ?? p.associationFee ?? custom.associationFee ?? '',
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
          unit_number:
            custom.unitNumber ||
            custom.canonicalPayload?.propertyDetails?.building?.unitNumber ||
            p.unit_number ||
            p.unitNumber ||
            '',
          latitude: p.location?.coordinates?.lat || p.latitude || '',
          longitude: p.location?.coordinates?.lng || p.longitude || '',
          mapPinPrivacy: p.map_pin_privacy || p.mapPinPrivacy || custom.mapPinPrivacy || 'Exact Location',
          // Specs
          lot_size_area: String(p.specs?.lotSizeArea ?? p.lot_size_area ?? ''),
          living_area: String(p.specs?.livingArea ?? p.living_area ?? ''),
          bedrooms_total: String(p.specs?.bedroomsTotal ?? p.bedrooms_total ?? '3'),
          bathrooms_total_integer: String(p.specs?.bathroomsTotalInteger ?? p.bathrooms_total_integer ?? '2'),
          parking_total: String(p.specs?.parkingTotal ?? p.parking_total ?? '1'),
          furnishing: p.furnishing || custom.furnishing || 'None',
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
          credentials: {
            ...prev.credentials,
            ...(custom.credentials || {}),
            developer:
              p.developer_name ||
              p.developerName ||
              custom.credentials?.developer ||
              prev.credentials.developer ||
              '',
          },
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                  <RotateCcw className="size-4 mr-1.5 text-[#FF8559]" />
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
            <span className="text-[#FF8559] font-bold">*</span> Required fields
          </p>

          {/* Validation / Submission Alert */}
          {submissionError && (
            <Alert className="bg-white border-[#FF8559] rounded-xl">
              <AlertCircle className="size-4 text-[#FF8559]" />
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
                        className="px-2.5 py-1 rounded-md bg-[#FFF5F5] border border-[#FF8559]/40 text-xs font-semibold text-[#FF8559] hover:bg-red-50 cursor-pointer"
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
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
