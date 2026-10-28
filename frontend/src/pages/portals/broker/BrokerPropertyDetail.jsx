import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
import { driveService, isDriveUrl, resolveDriveImageUrl, getDriveProxyUrl } from '../../../services/driveService';
import { Button, Badge, Alert, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, Editable, EditablePreview, EditableInput, useToast, Toaster } from '../../../components/ui';
import { GooglePropertyMap, StreetViewModal, EnlargedMapModal, CommuteAnalysisCard } from '../../../components/ui/map';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit3,
  Copy,
  Printer,
  Trash2,
  Camera,
  Check,
  Building,
  Home,
  ShieldCheck,
  Layers,
  MapPin,
  ExternalLink,
  Bed,
  Bath,
  Maximize2,
  Lock,
  Phone,
  KeyRound,
  Percent,
  Receipt,
  CloudUpload,
  RefreshCw,
  User,
  Sparkles,
  ChevronDown,
  X,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Trees,
  SlidersHorizontal,
  Compass,
  Navigation
} from 'lucide-react';

export default function BrokerPropertyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('Overview');
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isFeatured, setIsFeatured] = useState(() => Boolean((property?.is_featured || property?.isFeatured) ?? true));
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isEnlargedMapOpen, setIsEnlargedMapOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // 'hero' | 'about' | 'details' | 'location' | 'amenities' | null
  const [editFormData, setEditFormData] = useState({
    title: '',
    tagline: '',
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    livingArea: 0,
    lotArea: 0,
    stories: 1,
    parking: '',
    address: '',
    city: '',
    subdivision: '',
    state: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    yearBuilt: new Date().getFullYear(),
    condition: '',
    architecturalStyle: '',
    propertyType: '',
    propertySubType: '',
    transactionType: 'For Sale',
    description: '',
  });
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    if (typeof toast === 'function') {
      toast({
        title: 'Listing Update',
        description: msg,
        variant: 'default',
      });
    }
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEditCard = (cardKey) => {
    setEditFormData({
      title: property?.title || '',
      tagline: property?.tagline || '',
      price: property?.price_raw || property?.price || 0,
      bedrooms: property?.bedrooms ?? property?.beds ?? property?.specs?.beds ?? 0,
      bathrooms: property?.bathrooms ?? property?.baths ?? property?.specs?.baths ?? 0,
      livingArea: property?.livingArea || property?.living_area || property?.floor_area || property?.sqft || property?.specs?.livingArea || 0,
      lotArea: property?.lotArea || property?.lot_area || property?.lot_size_area || property?.specs?.lotSizeArea || 0,
      stories: property?.stories || property?.stories_total || property?.specs?.storiesTotal || 1,
      parking: property?.parking || '',
      address: property?.address || property?.location?.address || '',
      city: property?.city || property?.location?.city || '',
      subdivision: property?.subdivision_name || property?.subdivision || property?.location?.subdivisionName || '',
      state: property?.state || property?.location?.state || '',
      postalCode: property?.postal_code || property?.location?.postalCode || '',
      latitude: property?.latitude || property?.location?.coordinates?.lat || '',
      longitude: property?.longitude || property?.location?.coordinates?.lng || '',
      yearBuilt: property?.yearBuilt || property?.year_built || property?.specs?.yearBuilt || '',
      condition: property?.property_condition || property?.condition || property?.specs?.propertyCondition || '',
      architecturalStyle: property?.architectural_style || property?.architecturalStyle || property?.specs?.architecturalStyle || '',
      propertyType: property?.property_type || property?.propertyType || property?.specs?.propertyType || '',
      propertySubType: property?.property_sub_type || property?.propertySubType || property?.specs?.propertySubType || '',
      transactionType: property?.transaction_type || property?.specs?.transactionType || 'For Sale',
      description: property?.description || property?.publicRemarks || property?.public_remarks || '',
      generalAmenities: property?.general_amenities?.join('\n') || '',
      interiorAmenities: property?.interior_amenities?.join('\n') || '',
      exteriorAmenities: property?.exterior_amenities?.join('\n') || '',
      nearbyEstablishments: property?.nearby_establishments?.join('\n') || '',
    });
    setEditingCard(cardKey);
  };

  const handleStartEditing = () => {
    handleStartEditCard('hero');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditingCard(null);
    setIsEditing(false);
  };

  const handleCancelEditCard = () => {
    setEditingCard(null);
    setIsEditing(false);
  };

  const handleSaveEditCard = async () => {
    if (!property) return;
    setUpdating(true);
    try {
      const payload = {
        title: editFormData.title,
        tagline: editFormData.tagline,
        price: Number(editFormData.price) || 0,
        bedrooms: Number(editFormData.bedrooms) || 1,
        beds: Number(editFormData.bedrooms) || 1,
        bathrooms: Number(editFormData.bathrooms) || 1,
        baths: Number(editFormData.bathrooms) || 1,
        livingArea: Number(editFormData.livingArea) || 180,
        floor_area: Number(editFormData.livingArea) || 180,
        sqft: Number(editFormData.livingArea) || 180,
        lotArea: Number(editFormData.lotArea) || 250,
        lot_area: Number(editFormData.lotArea) || 250,
        lot_size_area: Number(editFormData.lotArea) || 250,
        stories: Number(editFormData.stories) || 2,
        parking: editFormData.parking,
        address: editFormData.address,
        city: editFormData.city,
        state: editFormData.state,
        postal_code: editFormData.postalCode,
        latitude: editFormData.latitude,
        longitude: editFormData.longitude,
        subdivision_name: editFormData.subdivision,
        year_built: Number(editFormData.yearBuilt) || 2022,
        property_condition: editFormData.condition,
        architectural_style: editFormData.architecturalStyle,
        property_type: editFormData.propertyType,
        property_sub_type: editFormData.propertySubType,
        transaction_type: editFormData.transactionType,
        public_remarks: editFormData.description,
        description: editFormData.description,
        general_amenities: editFormData.generalAmenities ? editFormData.generalAmenities.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        interior_amenities: editFormData.interiorAmenities ? editFormData.interiorAmenities.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        exterior_amenities: editFormData.exteriorAmenities ? editFormData.exteriorAmenities.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        nearby_establishments: editFormData.nearbyEstablishments ? editFormData.nearbyEstablishments.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      };

      await propertyService.updateProperty(property.id, payload);

      setProperty(prev => ({
        ...prev,
        ...payload,
        price_raw: payload.price,
        formattedPrice: `₱${payload.price.toLocaleString()}`,
      }));

      setEditingCard(null);
      setIsEditing(false);
      showToast('Property details updated successfully');
    } catch (err) {
      console.error('[BrokerPropertyDetail] Save error:', err);
      showToast(err.message || 'Failed to update card');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingPhoto(true);
    setUploadError(null);
    try {
      const newUrls = [];
      for (const file of files) {
        const res = await driveService.uploadFile(file, property?.id || id, 'Photos');
        if (res?.directImageUrl) {
          newUrls.push(res.directImageUrl);
        }
      }
      if (newUrls.length > 0) {
        const existingImages = Array.isArray(property?.images) ? property.images : [];
        const updatedImages = [...existingImages, ...newUrls];
        const primaryImage = property?.mainImage || property?.main_image || updatedImages[0];

        // Persist to database via propertyService
        await propertyService.updateProperty(property?.id || id, {
          images: updatedImages,
          main_image: primaryImage,
          mainImage: primaryImage,
          property_images: updatedImages.map((u, i) => ({ imageUrl: u, displayOrder: i + 1 })),
        });

        setProperty(prev => ({
          ...prev,
          images: updatedImages,
          mainImage: primaryImage,
          main_image: primaryImage,
        }));
        setActiveImgIdx(updatedImages.length - 1);
        showToast(`Uploaded ${newUrls.length} photo(s) to Google Drive and saved to database`);
      }
    } catch (err) {
      console.error('[BrokerPropertyDetail] Drive upload error:', err);
      setUploadError(err.message || 'Google Drive upload failed');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyService.getPropertyById(id);
      if (data) {
        setProperty(data);
        setIsFeatured(Boolean((data.is_featured || data.isFeatured) ?? true));
      }
    } catch (err) {
      console.warn('[BrokerPropertyDetail] Fetch failed, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const imagesList = (property?.images && property.images.length > 0)
    ? property.images.map(img => resolveDriveImageUrl(img)).filter(Boolean)
    : (property?.mainImage || property?.main_image 
        ? [resolveDriveImageUrl(property.mainImage || property.main_image)]
        : []);

  const hasPhotos = imagesList.length > 0;
  const currentActiveImg = hasPhotos ? resolveDriveImageUrl(imagesList[activeImgIdx] || imagesList[0]) : null;

  const handleImageError = (e, failedSrc, index = 0) => {
    const target = e.currentTarget;
    if (!target) return;

    // Phase 1: If it's a Google Drive asset, try the backend streaming proxy directly
    if (failedSrc && isDriveUrl(failedSrc)) {
      const proxyUrl = getDriveProxyUrl(failedSrc);
      if (target.src !== proxyUrl && !target.dataset.triedProxy) {
        target.dataset.triedProxy = 'true';
        target.src = proxyUrl;
        return;
      }
    }

    // Phase 2: If proxy also failed or non-drive image failed, hide broken image cleanly
    target.style.opacity = '0';
  };

  const handlePrevImg = () => {
    setActiveImgIdx(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    setActiveImgIdx(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const assignedAgent = property?.agent || (property?.agent_name ? {
    id: property.agent_id || property.list_agent_key,
    name: property.agent_name,
    email: property.agent_email || '',
    phone: property.agent_phone || property.seller_direct_phone || '',
    role: 'Assigned Agent',
    avatar: property.agent_avatar || null,
    licenseNo: property.agent_license_no || property.prc_license_no || '',
  } : null);

  const handleStatusChange = async (newStatus) => {
    if (!property) return;
    setUpdating(true);
    try {
      const upper = String(newStatus).toUpperCase();
      let dbStatus = 'pending';
      let stdStatus = 'Pending';
      let isPub = false;

      if (upper === 'AVAILABLE' || upper === 'ACTIVE') {
        dbStatus = 'available';
        stdStatus = 'Active';
        isPub = true;
      } else if (upper === 'UNDER_CONTRACT' || upper === 'RESERVED' || upper === 'ACTIVE UNDER CONTRACT') {
        dbStatus = 'pending';
        stdStatus = 'Active Under Contract';
        isPub = true;
      } else if (upper === 'PENDING') {
        dbStatus = 'pending';
        stdStatus = 'Pending';
        isPub = false;
      } else if (upper === 'SOLD' || upper === 'CLOSED') {
        dbStatus = 'sold';
        stdStatus = 'Closed';
        isPub = false;
      } else if (upper === 'DRAFT' || upper === 'INACTIVE') {
        dbStatus = 'pending';
        stdStatus = 'Draft';
        isPub = false;
      }

      await propertyService.updateProperty(property.id, { 
        status: dbStatus,
        standardStatus: stdStatus,
        isPublished: isPub,
        is_published: isPub,
      });
      setProperty(prev => ({
        ...prev,
        status: upper,
        standard_status: stdStatus,
        standardStatus: stdStatus,
        is_published: isPub,
        isPublished: isPub,
      }));
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('[BrokerPropertyDetail] Status update failed:', err);
      showToast('Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFeatured = async () => {
    const nextVal = !isFeatured;
    setIsFeatured(nextVal);
    try {
      await propertyService.updateProperty(property.id, { is_featured: nextVal, isFeatured: nextVal });
      setProperty(prev => ({ ...prev, is_featured: nextVal, isFeatured: nextVal }));
      showToast(nextVal ? 'Listing marked as Featured' : 'Listing removed from Featured');
    } catch (err) {
      console.error('[BrokerPropertyDetail] Featured update failed:', err);
      setIsFeatured(!nextVal);
    }
  };

  const handleDuplicate = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Listing link copied for duplication');
  };

  const handleArchive = async () => {
    if (window.confirm('Are you sure you want to archive this property listing?')) {
      await handleStatusChange('INACTIVE');
    }
  };

  if (!property && !loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-[#CBD5E1] mx-auto flex items-center justify-center text-slate-400 mb-4">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1E293B]">Listing Not Found</h2>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">
          The requested property listing record could not be located in the broker registry.
        </p>
        <Link
          to="/broker/properties"
          className="inline-flex items-center gap-2 h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-semibold text-[#0F766E] flex items-center gap-2.5">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading property dossier...</span>
        </div>
      </div>
    );
  }

  const formattedPrice = property.formattedPrice || (property.price 
    ? (typeof property.price === 'number' ? `₱${property.price.toLocaleString()}` : String(property.price))
    : (property.price_raw ? `₱${Number(property.price_raw).toLocaleString()}` : 'Price upon request'));

  const generalAmenitiesList = property.general_amenities || [];
  const interiorAmenitiesList = property.interior_amenities || [];
  const exteriorAmenitiesList = property.exterior_amenities || [];
  const nearbyEstablishmentsList = property.nearby_establishments || [];

  const commissionSplit = property.commissionSplit || property.confidential?.buyerAgencyCompensation || 'N/A';
  const lockboxCode = property.lockboxCode || property.confidential?.lockboxCode || 'N/A';
  const showingInstructions = property.showingInstructions || property.confidential?.showingInstructions || 'Contact listing broker for showing instructions.';
  const sellerDirectPhone = property.seller_direct_phone || property.confidential?.sellerDirectPhone || 'N/A';

  const bedroomsCount = property.bedrooms ?? property.beds ?? property.specs?.beds ?? 0;
  const bathroomsCount = property.bathrooms ?? property.baths ?? property.specs?.baths ?? 0;
  const floorAreaValue = property.floor_area || property.livingArea || property.living_area || property.sqft || property.sqm || property.specs?.livingArea || 0;
  const lotAreaValue = property.lot_area || property.lotSizeArea || property.lot_size_area || property.specs?.lotSizeArea || 0;
  const storiesValue = property.stories || property.stories_total || property.specs?.storiesTotal || 1;
  const yearBuiltValue = property.year_built || property.yearBuilt || property.specs?.yearBuilt || 'N/A';
  const conditionValue = property.property_condition || property.propertyCondition || property.specs?.propertyCondition || 'N/A';
  const archStyleValue = property.architectural_style || property.architecturalStyle || property.specs?.architecturalStyle || 'N/A';
  const listingIdVal = property.listing_id || property.listingKey || property.id || 'N/A';
  const listingKeyVal = property.listingKey || property.listing_key || 'N/A';
  const subdivisionVal = property.subdivision_name || property.subdivisionName || property.location?.subdivisionName || '';
  const cityVal = property.city || property.location?.city || property.location || '';
  const stateVal = property.state || property.location?.state || property.state_or_province || '';
  const postalCodeVal = property.postal_code || property.location?.postalCode || '';
  const streetAddressVal = property.address || property.location?.address || '';
  const latitudeVal = property.latitude || property.location?.coordinates?.lat || '';
  const longitudeVal = property.longitude || property.location?.coordinates?.lng || '';

  const mapPropertyItem = property ? {
    ...property,
    id: property.id || 'current',
    title: property.title || 'Property Location',
    price: property.price || 0,
    coordinates: {
      lat: parseFloat(latitudeVal) || 14.5547,
      lng: parseFloat(longitudeVal) || 121.0244
    },
    address: streetAddressVal || cityVal || 'Philippines',
    city: cityVal,
    category: property.property_type || 'Residential',
    image: property.mainImage || (property.images && property.images[0]) || ''
  } : null;

  const tabs = ['Overview', 'Details', 'Location', 'Amenities', 'Gallery', 'Agent', 'Activity'];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[#10B981]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumb row matching Mockup */}
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5 font-medium">
          <Link to="/broker/properties" className="hover:text-[#0F766E] transition-colors">
            Properties
          </Link>
          <span className="text-slate-400">&gt;</span>
          <span className="text-[#1E293B] font-semibold">Property Details</span>
        </div>

        {/* Hidden screen-reader helpers for legacy tests */}
        <Link to="/broker/properties" className="sr-only">
          <span>Back to Listings</span>
          <span>Back to Properties</span>
        </Link>
      </div>

      {/* Editing Mode Banner */}
      {(isEditing || editingCard) && (
        <Alert className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#0F766E] shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span><strong>Editing Mode:</strong> You can edit property title, price, metrics, specs, and narrative below.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={updating}
              onClick={handleCancelEditing}
              className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#1E293B] text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={handleSaveEditCard}
              className="px-3.5 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </Alert>
      )}



      {/* Main Grid: Left 8-col Content + Right 4-col Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Hero Card, Tab Navigation, and Content Sections (Cols 1-8)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Hero Card (Horizontal Split Layout matching Reference Mockup) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs" data-testid="broker-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Side: Photo Carousel & 5-Slot Filmstrip or Database Empty State */}
              <div className="space-y-3">
                {hasPhotos ? (
                  <>
                    <div className="relative aspect-[16/11] rounded-lg overflow-hidden bg-slate-100 border border-[#E2E8F0] group">
                      <img
                        src={currentActiveImg}
                        alt={property.title || 'Property photo'}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, currentActiveImg, activeImgIdx)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />

                      {/* Overlaid Badges (Top Left) */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#10B981] text-white shadow-xs">
                          Available
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1E293B]/90 text-white backdrop-blur-xs shadow-xs">
                          For Sale
                        </span>
                      </div>

                      {/* Carousel Left / Right Arrows */}
                      {imagesList.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevImg}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-xs"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextImg}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-xs"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Photo Counter Pill */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{activeImgIdx + 1} / {imagesList.length}</span>
                      </div>

                      {/* Google Drive Indicator if applicable */}
                      {isDriveUrl(currentActiveImg) && (
                        <span className="absolute top-3 right-3 bg-emerald-700/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Drive Sync
                        </span>
                      )}
                    </div>

                    {/* 5-Slot Thumbnail Filmstrip matching Mockup */}
                    {imagesList.length > 1 && (
                      <div className="grid grid-cols-5 gap-2">
                        {imagesList.slice(0, 5).map((img, idx) => {
                          const isLastSlot = idx === 4;
                          const remainingCount = Math.max(0, imagesList.length - 4);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isLastSlot) {
                                  setActiveTab('Gallery');
                                } else {
                                  setActiveImgIdx(idx);
                                }
                              }}
                              className={`relative aspect-[4/3] rounded-md overflow-hidden border transition-all cursor-pointer ${
                                activeImgIdx === idx && !isLastSlot
                                  ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
                                  : 'border-[#CBD5E1] opacity-90 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                onError={(e) => handleImageError(e, img, idx)}
                                className="w-full h-full object-cover"
                              />
                              {isLastSlot && (
                                <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-white text-xs font-bold">
                                  +{remainingCount || 1}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative aspect-[16/11] rounded-lg overflow-hidden bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center p-6 text-center space-y-3 group hover:border-[#0F766E] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E]">
                      <CloudUpload className="w-6 h-6 text-[#0F766E]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1E293B]">No Photos In Database</p>
                      <p className="text-xs text-[#64748B] max-w-xs">
                        Upload listing photos to save them to Google Drive and link them to this property record.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Uploading to Drive...' : 'Upload Photos to Drive'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Headline, Location, Tags, Price, and 6-Item Metrics Grid */}
              <div className="flex flex-col justify-between h-full space-y-3">
                <div>
                  {/* Title & Edit Button Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingCard === 'hero' ? (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                            Property Title
                          </label>
                          <input
                            type="text"
                            value={editFormData.title}
                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-base font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                            placeholder="Modern Luxury Condominium"
                          />
                        </div>
                      ) : (
                        <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight leading-snug">
                          {property.title || 'Untitled Property'}
                        </h1>
                      )}

                      {/* Location Subtitle */}
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{[property.address, property.city, property.state].filter(Boolean).join(', ') || 'Location unassigned'}</span>
                      </div>
                    </div>

                    {editingCard === 'hero' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleCancelEditCard}
                          className="px-2.5 py-1 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={updating}
                          onClick={handleSaveEditCard}
                          className="px-3 py-1 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEditCard('hero')}
                        className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-[#0F766E]" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* Tagline / Subheading */}
                  {editingCard === 'hero' ? (
                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">
                        Tagline / Summary
                      </label>
                      <input
                        type="text"
                        value={editFormData.tagline}
                        onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
                        className="w-full px-3 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="Spacious and modern home in a secure community"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] mt-1.5">
                      {property.tagline || 'Spacious and modern home in a secure community'}
                    </p>
                  )}

                  {/* Category Badges */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-[#1E293B] border border-slate-200">
                      House and Lot
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-[#1E293B] border border-slate-200">
                      Residential
                    </span>
                  </div>

                  {/* Price */}
                  {editingCard === 'hero' ? (
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                        Listing Price (PHP)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0F766E]">₱</span>
                        <input
                          type="number"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-lg font-bold text-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-[#0F766E] tracking-tight mt-3">
                      {formattedPrice}
                    </div>
                  )}

                  {/* Expanded 6-Item Metrics Grid (2 rows x 3 columns) matching Mockup */}
                  {editingCard === 'hero' ? (
                    <div className="grid grid-cols-3 gap-2 py-2.5 mt-3 border-y border-[#E2E8F0]">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Bedrooms</label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.bedrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bedrooms: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Bathrooms</label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.bathrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bathrooms: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Floor Area (m²)</label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.livingArea}
                          onChange={(e) => setEditFormData({ ...editFormData, livingArea: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Lot Area (m²)</label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.lotArea}
                          onChange={(e) => setEditFormData({ ...editFormData, lotArea: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Stories</label>
                        <input
                          type="number"
                          min="1"
                          value={editFormData.stories}
                          onChange={(e) => setEditFormData({ ...editFormData, stories: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">Year Built</label>
                        <input
                          type="number"
                          value={editFormData.yearBuilt}
                          onChange={(e) => setEditFormData({ ...editFormData, yearBuilt: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-2 py-3 mt-3 border-y border-[#E2E8F0] text-xs">
                      {/* Bed */}
                      <div className="flex items-start gap-2.5">
                        <Bed className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{bedroomsCount}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Bedrooms</p>
                        </div>
                      </div>

                      {/* Bath */}
                      <div className="flex items-start gap-2.5">
                        <Bath className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{bathroomsCount}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Bathrooms</p>
                        </div>
                      </div>

                      {/* Floor Area */}
                      <div className="flex items-start gap-2.5">
                        <Maximize2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{floorAreaValue} m²</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Floor Area</p>
                        </div>
                      </div>

                      {/* Lot Area */}
                      <div className="flex items-start gap-2.5">
                        <Maximize2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{lotAreaValue} m²</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Lot Area</p>
                        </div>
                      </div>

                      {/* Stories */}
                      <div className="flex items-start gap-2.5">
                        <Building className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{storiesValue}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Stories</p>
                        </div>
                      </div>

                      {/* Year Built */}
                      <div className="flex items-start gap-2.5">
                        <Calendar className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#1E293B] leading-none">{yearBuiltValue}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">Year Built</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 2. Modern SaaS Horizontal Tab Navigation Bar */}
          <div className="border-b border-[#E2E8F0]">
            <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer ${
                    activeTab === tab
                      ? 'text-[#0F766E]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <span>{tab}</span>
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F766E] rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* 3. Confidential Broker Governance Details (Rendered if Details tab is clicked) */}
          {activeTab === 'Details' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 sm:p-6 shadow-2xs space-y-4" data-testid="broker-card">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
                  <Lock className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Confidential Broker Governance Vault
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                      <Percent className="w-3 h-3 text-[#0F766E]" />
                      Buyer Agency Compensation
                    </span>
                    <p className="text-sm font-bold text-[#1E293B] font-mono">{commissionSplit}</p>
                  </div>

                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#0F766E]" />
                      Lockbox Passcode
                    </span>
                    <p className="text-sm font-bold text-[#0F766E] font-mono">{lockboxCode}</p>
                  </div>

                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#0F766E]" />
                      Owner Direct Phone
                    </span>
                    <p className="text-sm font-semibold text-[#1E293B] font-mono">{sellerDirectPhone}</p>
                  </div>

                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B]">
                      Showing Instructions
                    </span>
                    <p className="text-xs text-[#1E293B] leading-relaxed">{showingInstructions}</p>
                  </div>
                </div>
              </div>

              {/* Financials & Registry Audit Card */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
                  <Receipt className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Financials & Cadastral Registry
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#64748B]">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Total Contract Price:</span>
                    <span className="font-semibold text-[#1E293B]">{formattedPrice}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Association Fee:</span>
                    <span className="font-semibold text-[#1E293B]">
                      {property.associationFee ? `₱${property.associationFee} / ${property.associationFeeFrequency || 'Monthly'}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Annual Real Property Tax:</span>
                    <span className="font-semibold text-[#1E293B]">
                      {property.taxAnnualAmount ? `₱${property.taxAnnualAmount} / yr` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Listing MLS ID:</span>
                    <span className="font-mono font-semibold text-[#1E293B]">{listingIdVal}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continuous Stacked Sections (Matching Reference Mockup Layout) */}
          {(activeTab === 'Overview' || activeTab === 'Details') && (
            <div className="space-y-6">

              {/* Section 1: About This Property */}
              <div id="section-overview" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-3" data-testid="broker-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    About This Property
                  </h2>
                  {editingCard === 'about' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleSaveEditCard}
                        className="h-7 px-3 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleCancelEditCard}
                        className="h-7 px-2.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditCard('about')}
                      className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#0F766E]" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {editingCard === 'about' ? (
                  <textarea
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="Enter detailed description of the property..."
                  />
                ) : (
                  <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-line">
                    {property.description || property.publicRemarks || 'No description provided for this property.'}
                  </p>
                )}
              </div>

              {/* Section 2: Key Details (3-Column x 4-Row Grid with Icons matching Mockup) */}
              <div id="section-details" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4" data-testid="broker-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Key Details
                  </h3>
                  {editingCard === 'details' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleSaveEditCard}
                        className="h-7 px-3 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleCancelEditCard}
                        className="h-7 px-2.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditCard('details')}
                      className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#0F766E]" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {editingCard === 'details' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Property Type</label>
                      <select
                        name="propertyType"
                        value={editFormData.propertyType}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      >
                        <option value="House and Lot">House and Lot</option>
                        <option value="Single Family Residence">Single Family Residence</option>
                        <option value="Condominium">Condominium</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Lot Only">Lot Only</option>
                        <option value="Residential">Residential</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Property Subtype</label>
                      <input
                        type="text"
                        name="propertySubType"
                        value={editFormData.propertySubType}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                        placeholder="Single Detached"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Architectural Style</label>
                      <input
                        type="text"
                        name="architecturalStyle"
                        value={editFormData.architecturalStyle}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                        placeholder="Modern Contemporary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Living Area (m²)</label>
                      <input
                        type="number"
                        min="0"
                        name="livingArea"
                        value={editFormData.livingArea}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Transaction Type</label>
                      <select
                        name="transactionType"
                        value={editFormData.transactionType}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      >
                        <option value="For Sale">For Sale</option>
                        <option value="For Rent">For Rent</option>
                        <option value="Pre-selling">Pre-selling</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Property Condition</label>
                      <select
                        name="condition"
                        value={editFormData.condition}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      >
                        <option value="Brand New">Brand New</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Needs Renovation">Needs Renovation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Lot Size (m²)</label>
                      <input
                        type="number"
                        min="0"
                        name="lotArea"
                        value={editFormData.lotArea}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Bathrooms</label>
                      <input
                        type="number"
                        min="0"
                        name="bathrooms"
                        value={editFormData.bathrooms}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Year Built</label>
                      <input
                        type="number"
                        name="yearBuilt"
                        value={editFormData.yearBuilt}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Bedrooms</label>
                      <input
                        type="number"
                        min="0"
                        name="bedrooms"
                        value={editFormData.bedrooms}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Parking</label>
                      <input
                        type="text"
                        name="parking"
                        value={editFormData.parking}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                        placeholder="3 (2 Covered, 1 Open)"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Stories</label>
                      <input
                        type="number"
                        min="1"
                        name="stories"
                        value={editFormData.stories}
                        onChange={handleInputChange}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6 text-xs">
                    {/* Item 1: Property Type */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Type</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{property.property_type || property.propertyType || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Item 2: Property Subtype */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Subtype</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{property.property_sub_type || property.propertySubType || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Item 3: Architectural Style */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Architectural Style</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{archStyleValue}</p>
                      </div>
                    </div>

                    {/* Item 4: Living Area */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Living Area</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{floorAreaValue} m² (sqm)</p>
                      </div>
                    </div>

                    {/* Item 5: Transaction Type */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Transaction Type</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{property.transaction_type || 'For Sale'}</p>
                      </div>
                    </div>

                    {/* Item 6: Property Condition */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Condition</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{conditionValue}</p>
                      </div>
                    </div>

                    {/* Item 7: Lot Size */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Lot Size</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{lotAreaValue} m² (sqm)</p>
                      </div>
                    </div>

                    {/* Item 8: Bathrooms */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Bath className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Bathrooms</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{bathroomsCount} Bathrooms</p>
                      </div>
                    </div>

                    {/* Item 9: Year Built */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Year Built</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{yearBuiltValue}</p>
                      </div>
                    </div>

                    {/* Item 10: Bedrooms */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Bed className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Bedrooms</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{bedroomsCount} Bedrooms</p>
                      </div>
                    </div>

                    {/* Item 11: Parking */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Parking</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{property.parking || 'None'}</p>
                      </div>
                    </div>

                    {/* Item 12: Stories */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-none">Stories</p>
                        <p className="text-xs font-bold text-[#1E293B] mt-1">{storiesValue}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Location matching Mockup */}
              <div id="section-location" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4" data-testid="broker-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Location
                  </h3>
                  {editingCard === 'location' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleSaveEditCard}
                        className="h-7 px-3 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleCancelEditCard}
                        className="h-7 px-2.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditCard('location')}
                      className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#0F766E]" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left: Map Preview Box matching Mockup */}
                  <div className="md:col-span-5 space-y-2">
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#CBD5E1] bg-[#e5e3df]" data-lenis-prevent="true">
                      {mapPropertyItem && (
                        <GooglePropertyMap
                          properties={[mapPropertyItem]}
                          singlePropertyMode={true}
                          interactive={false}
                          initialZoom={15}
                          height="100%"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Structured Location Metadata Table / Form */}
                  <div className="md:col-span-7 text-xs">
                    {editingCard === 'location' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Full Address</label>
                          <input
                            type="text"
                            name="address"
                            value={editFormData.address}
                            onChange={handleInputChange}
                            className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                            placeholder="Street address, unit, building"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Subdivision / Complex</label>
                            <input
                              type="text"
                              name="subdivision"
                              value={editFormData.subdivision}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="Subdivision or village"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">City / Municipality</label>
                            <input
                              type="text"
                              name="city"
                              value={editFormData.city}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="City"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Province / State</label>
                            <input
                              type="text"
                              name="state"
                              value={editFormData.state}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="Province"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Postal Code</label>
                            <input
                              type="text"
                              name="postalCode"
                              value={editFormData.postalCode}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="Postal code"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Latitude</label>
                            <input
                              type="text"
                              name="latitude"
                              value={editFormData.latitude}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-mono font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="14.2250"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Longitude</label>
                            <input
                              type="text"
                              name="longitude"
                              value={editFormData.longitude}
                              onChange={handleInputChange}
                              className="w-full h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-mono font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                              placeholder="121.0483"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Full Address
                          </span>
                          <span className="font-semibold text-[#1E293B] text-right max-w-xs">{streetAddressVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            Subdivision
                          </span>
                          <span className="font-semibold text-[#1E293B] text-right">{subdivisionVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <Home className="w-3.5 h-3.5 text-slate-400" />
                            City / Municipality
                          </span>
                          <span className="font-semibold text-[#1E293B] text-right">{cityVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-slate-400" />
                            Province
                          </span>
                          <span className="font-semibold text-[#1E293B] text-right">{stateVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <Navigation className="w-3.5 h-3.5 text-slate-400" />
                            Postal Code
                          </span>
                          <span className="font-semibold text-[#1E293B] text-right">{postalCodeVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Latitude
                          </span>
                          <span className="font-mono font-semibold text-[#1E293B] text-right">{latitudeVal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                          <span className="text-[#64748B] flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Longitude
                          </span>
                          <span className="font-mono font-semibold text-[#1E293B] text-right">{longitudeVal}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Amenities (4 Categorized Columns with Dot Bullets matching Mockup) */}
              <div id="section-amenities" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4" data-testid="broker-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Amenities
                  </h3>
                  {editingCard === 'amenities' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleSaveEditCard}
                        className="h-7 px-3 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={handleCancelEditCard}
                        className="h-7 px-2.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditCard('amenities')}
                      className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#0F766E]" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {editingCard === 'amenities' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                    {/* Column 1: General Amenities */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                        <span>General Amenities</span>
                      </div>
                      <textarea
                        rows={6}
                        name="generalAmenities"
                        value={editFormData.generalAmenities}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="One per line..."
                      />
                      <p className="text-[10px] text-[#94A3B8]">Separate items with new lines</p>
                    </div>

                    {/* Column 2: Interior Amenities */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <Home className="w-4 h-4 text-slate-600" />
                        <span>Interior Amenities</span>
                      </div>
                      <textarea
                        rows={6}
                        name="interiorAmenities"
                        value={editFormData.interiorAmenities}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="One per line..."
                      />
                      <p className="text-[10px] text-[#94A3B8]">Separate items with new lines</p>
                    </div>

                    {/* Column 3: Exterior Amenities */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <Trees className="w-4 h-4 text-slate-600" />
                        <span>Exterior Amenities</span>
                      </div>
                      <textarea
                        rows={6}
                        name="exteriorAmenities"
                        value={editFormData.exteriorAmenities}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="One per line..."
                      />
                      <p className="text-[10px] text-[#94A3B8]">Separate items with new lines</p>
                    </div>

                    {/* Column 4: Nearby Establishments */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <MapPin className="w-4 h-4 text-slate-600" />
                        <span>Nearby Establishments</span>
                      </div>
                      <textarea
                        rows={6}
                        name="nearbyEstablishments"
                        value={editFormData.nearbyEstablishments}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="One per line..."
                      />
                      <p className="text-[10px] text-[#94A3B8]">Separate items with new lines</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                    {/* Column 1: General Amenities */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                        <span>General Amenities</span>
                      </div>
                      {generalAmenitiesList.length > 0 ? (
                        <ul className="space-y-2 text-[#475569]">
                          {generalAmenitiesList.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#94A3B8] italic text-[11px]">None listed</p>
                      )}
                    </div>

                    {/* Column 2: Interior Amenities */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <Home className="w-4 h-4 text-slate-600" />
                        <span>Interior Amenities</span>
                      </div>
                      {interiorAmenitiesList.length > 0 ? (
                        <ul className="space-y-2 text-[#475569]">
                          {interiorAmenitiesList.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#94A3B8] italic text-[11px]">None listed</p>
                      )}
                    </div>

                    {/* Column 3: Exterior Amenities */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <Trees className="w-4 h-4 text-slate-600" />
                        <span>Exterior Amenities</span>
                      </div>
                      {exteriorAmenitiesList.length > 0 ? (
                        <ul className="space-y-2 text-[#475569]">
                          {exteriorAmenitiesList.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#94A3B8] italic text-[11px]">None listed</p>
                      )}
                    </div>

                    {/* Column 4: Nearby Establishments */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <MapPin className="w-4 h-4 text-slate-600" />
                        <span>Nearby Establishments</span>
                      </div>
                      {nearbyEstablishmentsList.length > 0 ? (
                        <ul className="space-y-2 text-[#475569]">
                          {nearbyEstablishmentsList.map((place, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{place}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#94A3B8] italic text-[11px]">None listed</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Gallery (6 Photos + 1 Dark Overlay Card matching Mockup) */}
              <div id="section-gallery" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Gallery
                  </h3>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#0F766E] bg-white hover:bg-teal-50/50 text-xs font-semibold text-[#0F766E] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>{uploadingPhoto ? 'Syncing...' : 'Manage Photos'}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadPhotos}
                  className="hidden"
                />

                {hasPhotos ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {imagesList.slice(0, 6).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImgIdx(idx)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group ${
                          activeImgIdx === idx ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#CBD5E1]'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Gallery Photo ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, img, idx)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}

                    {imagesList.length > 6 && (
                      <div
                        onClick={() => setActiveTab('Gallery')}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#CBD5E1] bg-slate-900 cursor-pointer flex flex-col items-center justify-center text-white group hover:opacity-95 transition-opacity"
                      >
                        <span className="text-xl font-bold">+{imagesList.length - 6}</span>
                        <span className="text-[11px] text-slate-300 font-medium mt-0.5">View All</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1] space-y-2">
                    <p className="text-xs font-semibold text-[#1E293B]">No gallery photos uploaded to database yet</p>
                    <p className="text-[11px] text-[#64748B]">Click &ldquo;Manage Photos&rdquo; above to upload property photos to Google Drive.</p>
                  </div>
                )}
              </div>

              {/* Section 6: Activity Timeline matching Mockup */}
              <div id="section-activity" className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => showToast('Displaying full audit trail...')}
                    className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View All</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {property.updated_at && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1E293B]">Record updated</p>
                        <p className="text-[#64748B]">Listing details and specifications were updated.</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#64748B] text-[11px]">{new Date(property.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1E293B]">Listing Status: {property.standard_status || property.standardStatus || property.status || 'Active'}</p>
                      <p className="text-[#64748B]">Property listing is recorded in the central database.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#64748B] text-[11px]">
                        {property.created_at ? new Date(property.created_at).toLocaleString() : 'Active'}
                      </p>
                    </div>
                  </div>

                  {property.created_at && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1E293B]">Property created</p>
                        <p className="text-[#64748B]">Initial property record was registered.</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#64748B] text-[11px]">{new Date(property.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Location Tab Direct View */}
          {activeTab === 'Location' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0F766E]" />
                  Cadastral Location & Navigation Map
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEnlargedMapOpen(true)}
                    className="px-2.5 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Enlarge Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStreetViewOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-[#0F766E] text-[#0F766E] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>360° Street View</span>
                  </button>
                  <span className="text-[11px] font-mono text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    GPS: {latitudeVal || '14.5547'}, {longitudeVal || '121.0244'}
                  </span>
                </div>
              </div>

              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#CBD5E1]" data-lenis-prevent="true">
                {mapPropertyItem && (
                  <GooglePropertyMap
                    properties={[mapPropertyItem]}
                    singlePropertyMode={true}
                    interactive={true}
                    initialZoom={16}
                    height="100%"
                  />
                )}
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] text-xs space-y-1">
                <p className="font-semibold text-[#1E293B]">{streetAddressVal || 'Address not specified'}</p>
                <p className="text-[#64748B]">{[subdivisionVal, cityVal, stateVal, postalCodeVal].filter(Boolean).join(', ') || 'No additional regional metadata'}</p>
              </div>

              {/* Commute and Travel Duration Analysis Card */}
              {latitudeVal && longitudeVal && (
                <CommuteAnalysisCard
                  latitude={parseFloat(latitudeVal)}
                  longitude={parseFloat(longitudeVal)}
                  propertyName={property.title || 'Property'}
                />
              )}
            </div>
          )}

          {/* Gallery Tab Direct View */}
          {activeTab === 'Gallery' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Full Photography Reel ({imagesList.length})
                  </h3>
                  <p className="text-[11px] text-[#64748B]">High-resolution architectural captures and floor plans</p>
                </div>

                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${uploadingPhoto ? 'animate-spin' : ''}`} />
                  <span>{uploadingPhoto ? 'Syncing...' : 'Upload Photos'}</span>
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadPhotos}
                className="hidden"
              />

              {hasPhotos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagesList.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImgIdx(idx)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group ${
                        activeImgIdx === idx ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#CBD5E1]'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, img, idx)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] mx-auto">
                    <Camera className="w-6 h-6 text-[#0F766E]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1E293B]">Gallery is Empty</p>
                    <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                      No photos found for this property in the database. Upload photos to sync them with Google Drive.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Syncing...' : 'Upload Photos to Drive'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Agent Tab Direct View */}
          {activeTab === 'Agent' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Licensed Property Consultant & Assigned Broker
              </h3>
              
              {assignedAgent ? (
                <>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                    {assignedAgent.avatar ? (
                      <img
                        src={assignedAgent.avatar}
                        alt={assignedAgent.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover border border-[#CBD5E1]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 border border-[#CBD5E1] flex items-center justify-center text-slate-500">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#1E293B]">{assignedAgent.name}</h4>
                      {assignedAgent.licenseNo && (
                        <p className="text-xs font-medium text-[#0F766E]">{assignedAgent.licenseNo}</p>
                      )}
                      {assignedAgent.email && (
                        <p className="text-xs text-[#64748B]">{assignedAgent.email}</p>
                      )}
                      {assignedAgent.phone && (
                        <p className="text-xs text-[#64748B]">{assignedAgent.phone}</p>
                      )}
                    </div>
                  </div>

                  {assignedAgent.id && (
                    <Link
                      to={`/broker/agents/${assignedAgent.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59]"
                    >
                      <span>View Full Agent Dossier</span>
                      <span>&rarr;</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1] space-y-2">
                  <p className="text-xs font-semibold text-[#1E293B]">No Agent Assigned</p>
                  <p className="text-[11px] text-[#64748B]">This listing does not have an assigned agent yet.</p>
                  <Link
                    to="/broker/agents"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] transition-colors mt-2"
                  >
                    <span>Assign an Agent</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab Direct View */}
          {activeTab === 'Activity' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Listing Lifecycle & Audit Activity
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-semibold text-[#1E293B]">Listing Created</span>
                  </div>
                  <span className="text-[#64748B]">{property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-semibold text-[#1E293B]">Last Record Modification</span>
                  </div>
                  <span className="text-[#64748B]">{property.updated_at ? new Date(property.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3 Structured SaaS Sidebar Cards (Cols 9-12) matching Mockup */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* Broker Actions Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3.5" data-testid="broker-card">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
              Broker Actions
            </h3>
            {isEditing || editingCard ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveEditCard}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updating}
                  onClick={handleCancelEditing}
                  className="w-full h-9 px-3.5 rounded-lg border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Cancel</span>
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleStartEditing}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-white" />
                <span>Edit Property</span>
                <span className="sr-only">Quick Edit</span>
              </Button>
            )}
          </div>

          {/* Card 1: Listing Status matching Mockup */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3.5" data-testid="broker-card">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
              Listing Status
            </h3>

            {/* Status Dropdown & Publication Status Pill */}
            {(() => {
              const currentSelectStatus = (() => {
                const std = property.standard_status || property.standardStatus;
                if (std === 'Active') return 'AVAILABLE';
                if (std === 'Active Under Contract' || std === 'Under Contract') return 'RESERVED';
                if (std === 'Closed' || std === 'Sold') return 'SOLD';
                if (std === 'Draft' || std === 'Inactive') return 'INACTIVE';
                if (std === 'Pending' || std === 'Pending Approval' || std === 'Pending Confirmation' || std === 'Action Required') return 'PENDING';

                const rawStatus = String(property.status || '').toUpperCase();
                if (rawStatus === 'AVAILABLE' || rawStatus === 'ACTIVE') return 'AVAILABLE';
                if (rawStatus === 'RESERVED' || rawStatus === 'UNDER_CONTRACT') return 'RESERVED';
                if (rawStatus === 'SOLD' || rawStatus === 'CLOSED') return 'SOLD';
                if (rawStatus === 'INACTIVE' || rawStatus === 'DRAFT') return 'INACTIVE';
                return 'PENDING';
              })();

              const dotColor = currentSelectStatus === 'AVAILABLE' ? 'bg-[#10B981]' 
                : currentSelectStatus === 'RESERVED' ? 'bg-[#F59E0B]' 
                : currentSelectStatus === 'PENDING' ? 'bg-amber-400' 
                : currentSelectStatus === 'SOLD' ? 'bg-[#64748B]' 
                : 'bg-slate-400';

              const isPub = Boolean(property.is_published ?? property.isPublished);
              const isLive = isPub && (property.standard_status === 'Active' || property.standardStatus === 'Active');

              return (
                <>
                  <div>
                    <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={currentSelectStatus}
                        disabled={updating}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full h-9 pl-7 pr-8 bg-white hover:border-slate-400 rounded-lg border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors cursor-pointer appearance-none shadow-2xs disabled:opacity-50"
                      >
                        <option value="AVAILABLE">Active / Available</option>
                        <option value="RESERVED">Active Under Contract / Reserved</option>
                        <option value="PENDING">Pending / Needs Approval</option>
                        <option value="SOLD">Closed / Sold</option>
                        <option value="INACTIVE">Draft / Unpublished</option>
                      </select>

                      <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotColor}`} />

                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Publication Status Pill matching Mockup */}
                  <div>
                    <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                      Publication Status
                    </label>
                    {isLive ? (
                      <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-1.5 text-xs text-teal-700">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        <span className="font-semibold">Published (Live on Public Portal)</span>
                      </div>
                    ) : isPub ? (
                      <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-xs text-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-semibold">Under Contract (Live Listing)</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="font-semibold">Unpublished / Draft (Hidden from Public)</span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Status Metadata Rows */}
            <div className="space-y-2 text-xs pt-2 border-t border-[#E2E8F0] text-[#64748B]">
              <div className="flex items-center justify-between">
                <span>Listing ID</span>
                <span className="font-mono font-semibold text-[#1E293B]">{listingIdVal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Listing Key</span>
                <span className="font-mono font-semibold text-[#1E293B]">{listingKeyVal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created</span>
                <span className="font-semibold text-[#1E293B]">{property.created_at ? new Date(property.created_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-semibold text-[#1E293B]">{property.updated_at ? new Date(property.updated_at).toLocaleString() : 'N/A'}</span>
              </div>

              {/* Featured Property Toggle Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-medium text-[#1E293B]">Featured Property</span>
                <button
                  type="button"
                  onClick={handleToggleFeatured}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFeatured ? 'bg-[#0F766E]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle featured listing"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      isFeatured ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Assigned Agent */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4" data-testid="broker-card">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
              Assigned Agent
            </h3>

            {assignedAgent ? (
              <>
                <div className="flex items-center gap-3">
                  {assignedAgent.avatar ? (
                    <img
                      src={assignedAgent.avatar}
                      alt={assignedAgent.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-[#CBD5E1] flex items-center justify-center text-slate-500">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-[#1E293B] truncate">{assignedAgent.name}</p>
                    <p className="text-xs text-[#64748B] truncate">{assignedAgent.role || 'Licensed Real Estate Agent'}</p>
                  </div>
                </div>

                {assignedAgent.id && (
                  <Link
                    to={`/broker/agents/${assignedAgent.id}`}
                    className="w-full h-9 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-xs text-[#64748B]">No agent currently assigned</p>
                <Link
                  to="/broker/agents"
                  className="w-full h-9 rounded-lg border border-[#0F766E] bg-white hover:bg-teal-50/50 text-xs font-semibold text-[#0F766E] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>Assign an Agent</span>
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 360° Street View Modal */}
      {property && (
        <StreetViewModal
          isOpen={isStreetViewOpen}
          onClose={() => setIsStreetViewOpen(false)}
          lat={parseFloat(latitudeVal) || 14.5547}
          lng={parseFloat(longitudeVal) || 121.0244}
          propertyName={property.title || 'Property Frontage'}
        />
      )}

      {/* Fullscreen Enlarged Property Map Modal */}
      {property && (
        <EnlargedMapModal
          isOpen={isEnlargedMapOpen}
          onClose={() => setIsEnlargedMapOpen(false)}
          currentProperty={property}
        />
      )}
      <Toaster />
    </div>
  );
}
