import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProperties } from '../../../mockData/mockProperties';
import { mockAgents } from '../../../mockData/mockAgents';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
import { driveService, isDriveUrl } from '../../../services/driveService';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MoreHorizontal,
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
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function BrokerPropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(() => {
    const fallback = mockProperties.find(p => p.id === id) || mockProperties[0];
    return fallback ? normalizeProperty(fallback) : null;
  });
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('Overview');
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isFeatured, setIsFeatured] = useState(() => Boolean(property?.is_featured || property?.isFeatured));
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    tagline: '',
    price: 0,
    bedrooms: 4,
    bathrooms: 3,
    livingArea: 180,
    lotArea: 250,
    stories: 2,
    parking: '2-Car Garage',
    address: '',
    city: '',
    subdivision: '',
    state: 'Laguna',
    postalCode: '4026',
    yearBuilt: 2022,
    condition: 'Brand New',
    architecturalStyle: 'Modern Contemporary',
    propertyType: 'House and Lot',
    propertySubType: 'Single Family Home',
    transactionType: 'For Sale',
    description: '',
  });
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleStartEditing = () => {
    setEditFormData({
      title: property?.title || '',
      tagline: property?.tagline || '',
      price: property?.price_raw || property?.price || 0,
      bedrooms: property?.bedrooms || property?.beds || 4,
      bathrooms: property?.bathrooms || property?.baths || 3,
      livingArea: property?.livingArea || property?.living_area || property?.floor_area || property?.sqft || 180,
      lotArea: property?.lotArea || property?.lot_area || property?.lot_size_area || 250,
      stories: property?.stories || 2,
      parking: property?.parking || '2-Car Garage',
      address: property?.address || 'Block 12, Lot 5, Ridgeview Estates, Nuvali',
      city: property?.city || 'Santa Rosa',
      subdivision: property?.subdivision_name || property?.subdivision || 'Ridgeview Estates Nuvali',
      state: property?.state || 'Laguna',
      postalCode: property?.postal_code || '4026',
      yearBuilt: property?.yearBuilt || property?.year_built || 2022,
      condition: property?.property_condition || property?.condition || 'Brand New',
      architecturalStyle: property?.architectural_style || property?.architecturalStyle || 'Modern Contemporary',
      propertyType: property?.property_type || property?.propertyType || 'House and Lot',
      propertySubType: property?.property_sub_type || property?.propertySubType || 'Single Family Home',
      transactionType: property?.transaction_type || 'For Sale',
      description: property?.description || property?.publicRemarks || property?.public_remarks || '',
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEditing = async () => {
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
        subdivision_name: editFormData.subdivision,
        year_built: Number(editFormData.yearBuilt) || 2022,
        property_condition: editFormData.condition,
        architectural_style: editFormData.architecturalStyle,
        property_type: editFormData.propertyType,
        property_sub_type: editFormData.propertySubType,
        transaction_type: editFormData.transactionType,
        public_remarks: editFormData.description,
        description: editFormData.description,
      };

      await propertyService.updateProperty(property.id, payload);

      setProperty(prev => ({
        ...prev,
        ...payload,
        price_raw: payload.price,
        formattedPrice: `₱${payload.price.toLocaleString()}`,
      }));

      setIsEditing(false);
      showToast('Property details updated successfully');
    } catch (err) {
      console.error('[BrokerPropertyDetail] Save error:', err);
      showToast(err.message || 'Failed to update property');
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
        const updatedImages = [...(property?.images || []), ...newUrls];
        setProperty(prev => ({
          ...prev,
          images: updatedImages,
          mainImage: prev?.mainImage || newUrls[0]
        }));
        setActiveImgIdx(updatedImages.length - newUrls.length);
        showToast(`Uploaded ${newUrls.length} photo(s) to Google Drive`);
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
        setIsFeatured(Boolean(data.is_featured || data.isFeatured));
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
    ? property.images
    : [property?.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'];

  const currentActiveImg = imagesList[activeImgIdx] || imagesList[0];

  const handlePrevImg = () => {
    setActiveImgIdx(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    setActiveImgIdx(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const assignedAgent = property 
    ? (mockAgents.find(a => a.id === property.agent_id || a.id === property.list_agent_key) || property.agent || mockAgents[0]) 
    : mockAgents[0];

  const handleStatusChange = async (newStatus) => {
    if (!property) return;
    setUpdating(true);
    try {
      await propertyService.updateProperty(property.id, { 
        status: newStatus.toLowerCase(),
        standardStatus: newStatus === 'AVAILABLE' ? 'Active' : newStatus === 'SOLD' ? 'Closed' : 'Pending'
      });
      setProperty(prev => ({
        ...prev,
        status: newStatus.toUpperCase(),
        standard_status: newStatus === 'AVAILABLE' ? 'Active' : newStatus === 'SOLD' ? 'Closed' : 'Pending',
        is_published: newStatus.toUpperCase() !== 'SOLD' && newStatus.toUpperCase() !== 'INACTIVE',
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
    : (property.price_raw ? `₱${Number(property.price_raw).toLocaleString()}` : '₱12,500,000'));

  const interiorFeatures = (property.interior_features && property.interior_features.length > 0)
    ? property.interior_features
    : ['Built-in Wardrobes', 'Air Conditioning', 'Modern Kitchen', "Maid's Room", 'Walk-in Closet', 'Service Area'];

  const exteriorFeatures = (property.exterior_features && property.exterior_features.length > 0)
    ? property.exterior_features
    : ['2-Car Garage', 'Landscaped Garden', 'Balcony', 'Covered Patio', 'Perimeter Fence'];

  const communityAmenities = (property.amenities && property.amenities.length > 0)
    ? property.amenities
    : ['Clubhouse', 'Swimming Pool', '24/7 Security', 'Basketball Court', 'Playground', 'Gated Community'];

  const nearbyEstablishments = [
    { name: 'Ayala Malls Solenad', distance: '2.5 km' },
    { name: 'QualiMed Hospital', distance: '3.0 km' },
    { name: 'Xavier School Nuvali', distance: '1.8 km' },
    { name: 'Miriam College', distance: '2.2 km' },
    { name: 'S&R Membership Shopping', distance: '4.0 km' },
  ];

  const commissionSplit = property.commissionSplit || property.confidential?.buyerAgencyCompensation || '3.5%';
  const lockboxCode = property.lockboxCode || property.confidential?.lockboxCode || '9842';
  const showingInstructions = property.showingInstructions || property.confidential?.showingInstructions || 'Call listing agent 24 hours prior. Gate passcode required.';
  const sellerDirectPhone = property.seller_direct_phone || property.confidential?.sellerDirectPhone || '+63 917 111 2222';

  const bedroomsCount = property.bedrooms || property.beds || property.specs?.beds || '4';
  const bathroomsCount = property.bathrooms || property.baths || property.specs?.baths || '3';
  const floorAreaValue = property.floor_area || property.livingArea || property.living_area || property.sqft || property.sqm || property.specs?.livingArea || '180';
  const lotAreaValue = property.lot_area || property.lotSizeArea || property.lot_size_area || property.specs?.lotSizeArea || '250';
  const storiesValue = property.stories || 2;
  const yearBuiltValue = property.year_built || property.yearBuilt || property.specs?.yearBuilt || '2022';
  const conditionValue = property.property_condition || property.propertyCondition || property.specs?.propertyCondition || 'Brand New';
  const archStyleValue = property.architectural_style || property.architecturalStyle || property.specs?.architecturalStyle || 'Modern Contemporary';
  const listingIdVal = property.listing_id || property.listingKey || property.id || 'HBR-2024-000123';
  const listingKeyVal = property.listingKey || 'HBRN-00123';
  const subdivisionVal = property.subdivision_name || property.subdivisionName || property.location?.subdivisionName || 'Ridgeview Estates Nuvali';
  const cityVal = property.city || property.location?.city || property.location || 'Sta. Rosa';
  const stateVal = property.state || property.location?.state || property.state_or_province || 'Laguna';
  const postalCodeVal = property.postal_code || property.location?.postalCode || '4026';
  const streetAddressVal = property.address || property.location?.address || 'Block 12, Lot 5, Ridgeview Estates, Nuvali';

  const tabs = ['Overview', 'Details', 'Location', 'Amenities', 'Gallery', 'Agent', 'Activity'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[#10B981]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumbs & Back Link */}
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5 font-medium">
          <Link to="/broker/properties" className="hover:text-[#0F766E] transition-colors">
            Properties
          </Link>
          <span>&gt;</span>
          <span className="text-[#1E293B] font-semibold">Property Details</span>
        </div>

        <Link
          to="/broker/properties"
          className="flex items-center gap-1.5 text-xs font-medium text-[#0F766E] hover:text-[#115E59] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Properties</span>
          <span className="sr-only">Back to Listings</span>
        </Link>
      </div>

      {/* Editing Mode Banner */}
      {isEditing && (
        <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#0F766E] shadow-2xs animate-in fade-in duration-200">
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
              onClick={handleSaveEditing}
              className="px-3.5 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{updating ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left 8-col Content + Right 4-col Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Hero Card, Tab Navigation, and Content Sections (Cols 1-8)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Hero Card (Horizontal Split Layout matching Reference Mockup) */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Side: Photo Carousel & Filmstrip */}
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-[#E2E8F0] group">
                  <img
                    src={currentActiveImg}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />

                  {/* Overlaid Badges (Top Left) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#10B981] text-white shadow-xs">
                      {property.status === 'AVAILABLE' ? 'Available' : property.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1E293B] text-white shadow-xs">
                      {property.transaction_type || 'For Sale'}
                    </span>
                  </div>

                  {/* Carousel Left / Right Arrows */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImg}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImg}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Photo Counter Pill (Bottom Right) */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{activeImgIdx + 1} / {imagesList.length}</span>
                  </div>

                  {/* Google Drive Indicator if applicable */}
                  {isDriveUrl(currentActiveImg) && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-700/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Drive Sync
                    </span>
                  )}
                </div>

                {/* 4-Slot Thumbnail Filmstrip */}
                <div className="grid grid-cols-4 gap-2">
                  {imagesList.slice(0, 4).map((img, idx) => {
                    const isLastSlot = idx === 3 && imagesList.length > 4;
                    const remainingCount = imagesList.length - 4;

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
                            : 'border-[#CBD5E1] opacity-85 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        {isLastSlot && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                            +{remainingCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Headline, Location, Tags, Price, and 6-Item Metrics Grid */}
              <div className="flex flex-col justify-between h-full space-y-3">
                <div>
                  {/* Title & Edit Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
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
                          {property.title}
                        </h1>
                      )}

                      {/* Location Subtitle */}
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                        <span>{subdivisionVal}, {cityVal}, {stateVal}</span>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* Tagline / Subheading */}
                  {isEditing ? (
                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">
                        Tagline / Summary
                      </label>
                      <input
                        type="text"
                        value={editFormData.tagline}
                        onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
                        className="w-full px-3 py-1 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                        placeholder="e.g. Spacious and modern home in a secure community"
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
                      {property.property_type || 'House and Lot'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-[#1E293B] border border-slate-200">
                      {property.property_sub_type || 'Residential'}
                    </span>
                  </div>

                  {/* Price */}
                  {isEditing ? (
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

                  {/* Expanded 6-Item Metrics Grid (2 rows x 3 columns) */}
                  {isEditing ? (
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 mt-3 border-y border-[#E2E8F0] text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Bed className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{bedroomsCount}</p>
                          <p className="text-[10px] text-[#64748B]">Bedrooms</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Bath className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{bathroomsCount}</p>
                          <p className="text-[10px] text-[#64748B]">Bathrooms</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{floorAreaValue} m²</p>
                          <p className="text-[10px] text-[#64748B]">Floor Area</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{lotAreaValue} m²</p>
                          <p className="text-[10px] text-[#64748B]">Lot Area</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{storiesValue}</p>
                          <p className="text-[10px] text-[#64748B]">Stories</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{yearBuiltValue}</p>
                          <p className="text-[10px] text-[#64748B]">Year Built</p>
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

          {/* 3. Confidential Broker Governance Details (Displayed when Details tab is active) */}
          {activeTab === 'Details' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#CBD5E1] p-5 sm:p-6 shadow-2xs space-y-4">
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
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
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
                      {property.associationFee ? `₱${property.associationFee} / ${property.associationFeeFrequency || 'Monthly'}` : '₱4,500 / Monthly'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Annual Real Property Tax:</span>
                    <span className="font-semibold text-[#1E293B]">
                      {property.taxAnnualAmount ? `₱${property.taxAnnualAmount} / yr` : '₱28,000 / yr'}
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

          {/* Continuous Stacked Sections (Rendered for Overview or when corresponding tab is selected) */}
          {(activeTab === 'Overview' || activeTab === 'Details') && (
            <div className="space-y-6">

              {/* Section 1: About This Property */}
              <div id="section-overview" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    About This Property
                  </h2>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#1E293B] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="Enter detailed description of the property..."
                  />
                ) : (
                  <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-line">
                    {property.description || property.publicRemarks || 
                      'This stunning 4-bedroom modern home in Nuvali offers contemporary living with spacious interiors, high ceilings, and premium finishes. Located in a secure, exclusive gated community, the property features an open-concept living and dining area, a gourmet kitchen with built-in appliances, and a master suite with a walk-in closet and en-suite bathroom.\n\nEnjoy outdoor living with a beautifully landscaped garden and covered patio. Close to top schools, shopping centers, and recreational parks.'}
                  </p>
                )}
              </div>

              {/* Section 2: Key Details (3-Column x 4-Row Grid with Icons) */}
              <div id="section-details" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Key Details
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Item 1: Property Type */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Type</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{property.property_type || 'House and Lot'}</p>
                    </div>
                  </div>

                  {/* Item 2: Property Subtype */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Subtype</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{property.property_sub_type || 'Single Family Home'}</p>
                    </div>
                  </div>

                  {/* Item 3: Architectural Style */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Architectural Style</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{archStyleValue}</p>
                    </div>
                  </div>

                  {/* Item 4: Living Area */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Living Area</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{floorAreaValue} m²</p>
                    </div>
                  </div>

                  {/* Item 5: Transaction Type */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Transaction Type</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{property.transaction_type || 'For Sale'}</p>
                    </div>
                  </div>

                  {/* Item 6: Property Condition */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Property Condition</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{conditionValue}</p>
                    </div>
                  </div>

                  {/* Item 7: Lot Size */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Lot Size</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{lotAreaValue} m²</p>
                    </div>
                  </div>

                  {/* Item 8: Bathrooms */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Bath className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Bathrooms</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{bathroomsCount} (2 Full + 1 Half)</p>
                    </div>
                  </div>

                  {/* Item 9: Year Built */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Year Built</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{yearBuiltValue}</p>
                    </div>
                  </div>

                  {/* Item 10: Bedrooms */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Bedrooms</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{bedroomsCount} {Number(bedroomsCount) === 1 ? 'Bedroom' : 'Bedrooms'}</p>
                    </div>
                  </div>

                  {/* Item 11: Parking */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Parking</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{property.parking || '2-Car Garage'}</p>
                    </div>
                  </div>

                  {/* Item 12: Stories */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] font-medium leading-none">Stories</p>
                      <p className="text-xs font-bold text-[#1E293B] mt-1">{storiesValue}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Location */}
              <div id="section-location" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Location
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left: Map Preview Box */}
                  <div className="md:col-span-5 space-y-2">
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#CBD5E1] bg-slate-100">
                      <iframe
                        title="Property Map Location"
                        className="w-full h-full border-0 pointer-events-none opacity-90"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(streetAddressVal + ', ' + cityVal)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      />
                      
                      {/* Map Pin Marker Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#CBD5E1] shadow-md flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                          <MapPin className="w-4 h-4 text-[#0F766E] fill-[#0F766E]" />
                          <span>{cityVal}, {stateVal}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const query = encodeURIComponent(`${streetAddressVal}, ${cityVal}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }}
                      className="w-full h-8 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* Right: Location Metadata List */}
                  <div className="md:col-span-7 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">Full Address</span>
                      <span className="font-semibold text-[#1E293B] text-right">{streetAddressVal}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">Subdivision</span>
                      <span className="font-semibold text-[#1E293B] text-right">{subdivisionVal}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">City / Municipality</span>
                      <span className="font-semibold text-[#1E293B] text-right">{cityVal}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">Province</span>
                      <span className="font-semibold text-[#1E293B] text-right">{stateVal}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">Postal Code</span>
                      <span className="font-semibold text-[#1E293B] text-right">{postalCodeVal}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#64748B]">Coordinates</span>
                      <span className="font-mono font-semibold text-[#0F766E] text-right">
                        {property.latitude || '14.2385° N'}, {property.longitude || '121.0583° E'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Amenities (4 Categorized Columns) */}
              <div id="section-amenities" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Amenities
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                  {/* Column 1: General Amenities */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[#1E293B] text-xs">General Amenities</h4>
                    <div className="space-y-2">
                      {communityAmenities.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[#475569]">
                          <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Interior Amenities */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[#1E293B] text-xs">Interior Amenities</h4>
                    <div className="space-y-2">
                      {interiorFeatures.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[#475569]">
                          <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Exterior Amenities */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[#1E293B] text-xs">Exterior Amenities</h4>
                    <div className="space-y-2">
                      {exteriorFeatures.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[#475569]">
                          <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Nearby Establishments */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[#1E293B] text-xs">Nearby Establishments</h4>
                    <div className="space-y-2">
                      {nearbyEstablishments.map((place, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[#475569]">
                          <span>{place.name}</span>
                          <span className="text-[#64748B] text-[11px] font-medium">{place.distance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Gallery */}
              <div id="section-gallery" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Gallery
                  </h3>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagesList.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImgIdx(idx)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group ${
                        activeImgIdx === idx ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#CBD5E1]'
                      }`}
                    >
                      <img src={img} alt={`Gallery Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {idx === 3 && imagesList.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                          +{imagesList.length - 4} View All
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Activity Timeline */}
              <div id="section-activity" className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
                    Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => showToast('Displaying full audit trail...')}
                    className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 transition-colors"
                  >
                    <span>View All</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                      <Edit3 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E293B]">Property updated</p>
                      <p className="text-[#64748B]">Details updated by Maria Santos</p>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] font-medium">2 hours ago</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E293B]">Status changed</p>
                      <p className="text-[#64748B]">Changed to Published by Maria Santos</p>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] font-medium">Yesterday, 3:45 PM</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E293B]">Photos updated</p>
                      <p className="text-[#64748B]">8 new photos added by Maria Santos</p>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] font-medium">3 days ago</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E293B]">Property created</p>
                      <p className="text-[#64748B]">Created by Maria Santos</p>
                    </div>
                    <span className="text-[#94A3B8] text-[11px] font-medium">Jan 15, 2024, 10:30 AM</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Location Tab Direct View */}
          {activeTab === 'Location' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0F766E]" />
                  Cadastral Location & Navigation Map
                </h3>
                <span className="text-[11px] font-mono text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  GPS: {property.latitude || '14.2385° N'}, {property.longitude || '121.0583° E'}
                </span>
              </div>

              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#CBD5E1]">
                <iframe
                  title="Full Property Map"
                  className="w-full h-full border-0"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(streetAddressVal + ', ' + cityVal)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#CBD5E1] text-xs space-y-1">
                <p className="font-semibold text-[#1E293B]">{streetAddressVal}</p>
                <p className="text-[#64748B]">
                  {subdivisionVal && `${subdivisionVal}, `}
                  {cityVal}, {stateVal} {postalCodeVal}
                </p>
              </div>
            </div>
          )}

          {/* Amenities Tab Direct View */}
          {activeTab === 'Amenities' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Features & Amenities Taxonomy
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
                    General Amenities
                  </span>
                  {communityAmenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[#475569]">
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
                    Interior Amenities
                  </span>
                  {interiorFeatures.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[#475569]">
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
                    Exterior Amenities
                  </span>
                  {exteriorFeatures.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[#475569]">
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-wider">
                    Nearby Establishments
                  </span>
                  {nearbyEstablishments.map((place, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[#475569]">
                      <span>{place.name}</span>
                      <span className="text-[#64748B] text-[11px]">{place.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gallery Tab Direct View */}
          {activeTab === 'Gallery' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagesList.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group ${
                      activeImgIdx === idx ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#CBD5E1]'
                    }`}
                  >
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {isDriveUrl(img) && (
                      <span className="absolute bottom-1 right-1 bg-emerald-700 text-white text-[8px] font-mono px-1 rounded">
                        Drive
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Tab Direct View */}
          {activeTab === 'Agent' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Licensed Property Consultant & Assigned Broker
              </h3>
              
              <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                {assignedAgent.avatar ? (
                  <img
                    src={assignedAgent.avatar}
                    alt={assignedAgent.name}
                    className="w-16 h-16 rounded-full object-cover border border-[#CBD5E1]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 border border-[#CBD5E1] flex items-center justify-center text-slate-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#1E293B]">{assignedAgent.name}</h4>
                  <p className="text-xs font-medium text-[#0F766E]">{assignedAgent.prc_license_no || 'Licensed Real Estate Broker'}</p>
                  <p className="text-xs text-[#64748B]">{assignedAgent.email}</p>
                  <p className="text-xs text-[#64748B]">{assignedAgent.phone || '+63 917 555 0192'}</p>
                </div>
              </div>

              <Link
                to={`/broker/agents/${assignedAgent.id || 'agent-1'}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59]"
              >
                <span>View Full Agent Dossier</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}

          {/* Activity Tab Direct View */}
          {activeTab === 'Activity' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Listing Lifecycle & Audit Activity
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-semibold text-[#1E293B]">Listing Created</span>
                  </div>
                  <span className="text-[#64748B]">{property.created_at || 'Jan 15, 2024'}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-semibold text-[#1E293B]">Last Record Modification</span>
                  </div>
                  <span className="text-[#64748B]">{property.updated_at || 'Oct 01, 2024'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3 Structured SaaS Sidebar Cards (Cols 9-12)                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* Card 1: Listing Status */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
              Listing Status
            </h3>

            {/* Interactive Status Selector with Semantic Dot */}
            <div className="relative">
              <select
                value={String(property.status).toUpperCase()}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-10 pl-8 pr-8 bg-white hover:border-slate-400 rounded-lg border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-colors cursor-pointer appearance-none shadow-2xs disabled:opacity-50"
              >
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Pending / Reserved</option>
                <option value="SOLD">Closed / Sold</option>
                <option value="INACTIVE">Inactive / Draft</option>
              </select>

              <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
                property.status === 'AVAILABLE' ? 'bg-[#10B981]' : property.status === 'RESERVED' ? 'bg-[#F59E0B]' : property.status === 'SOLD' ? 'bg-[#64748B]' : 'bg-slate-400'
              }`} />

              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Publication Status Pill matching Mockup */}
            <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium">Publication Status</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Published
              </span>
            </div>

            {/* Status Metadata Rows */}
            <div className="space-y-2.5 text-xs pt-3 border-t border-[#E2E8F0] text-[#64748B]">
              <div className="flex items-center justify-between">
                <span>Listing ID</span>
                <span className="font-mono font-semibold text-[#1E293B]">{listingIdVal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Listing Key</span>
                <span className="font-mono font-semibold text-[#1E293B]">{listingKeyVal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Date Created</span>
                <span className="font-semibold text-[#1E293B]">{property.created_at || 'Jan 15, 2024 10:30 AM'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-semibold text-[#1E293B]">{property.updated_at || 'Oct 01, 2024 06:25 PM'}</span>
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

          {/* Card 2: Assigned Agent matching Mockup */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight">
              Assigned Agent
            </h3>

            <div className="flex items-center gap-3">
              {assignedAgent.avatar ? (
                <img
                  src={assignedAgent.avatar}
                  alt={assignedAgent.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-[#CBD5E1] flex items-center justify-center text-slate-500">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#1E293B] truncate">{assignedAgent.name || 'Maria Santos'}</p>
                <p className="text-xs text-[#64748B] truncate">Licensed Real Estate Agent</p>
              </div>
            </div>

            <Link
              to={`/broker/agents/${assignedAgent.id || 'agent-1'}`}
              className="w-full h-9 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>View Profile</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Card 3: Broker Actions */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-2.5">
            <h3 className="text-sm font-bold text-[#1E293B] tracking-tight mb-2">
              Broker Actions
            </h3>

            {/* Edit Property Button (Solid Teal Primary Action) */}
            {isEditing ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveEditing}
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
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleCancelEditing}
                  className="w-full h-10 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-white" />
                <span>Edit Property</span>
                <span className="sr-only">Quick Edit</span>
              </button>
            )}

            {/* Approve Changes */}
            <button
              type="button"
              onClick={() => showToast('Changes approved successfully')}
              className="w-full h-10 px-3.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Approve Changes</span>
            </button>

            {/* Request Revision */}
            <button
              type="button"
              onClick={() => showToast('Revision request sent to agent')}
              className="w-full h-10 px-3.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-700 font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Request Revision</span>
            </button>

            {/* Duplicate Listing */}
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full h-10 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Duplicate Listing</span>
            </button>

            {/* Print Details */}
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-10 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Details</span>
            </button>

            {/* Archive Property */}
            <button
              type="button"
              onClick={handleArchive}
              className="w-full h-10 px-3.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center justify-start gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Archive Property</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
