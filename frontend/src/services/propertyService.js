// ==============================================================================
// Property Service
// Communicates EXCLUSIVELY with the Express Backend RESTful API (/api/properties)
// ==============================================================================

import apiClient from './apiClient';
import { resolveDriveImageUrl } from './driveService';

/**
 * Helper to parse a nullable number, preserving 0 while returning null for null/undefined/empty string
 */
function parseNullableNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Resolves the canonical RESO StandardStatus from incoming standardStatus or legacy status.
 */
export function resolveCanonicalStandardStatus(standardStatus, status) {
  if (standardStatus && typeof standardStatus === 'string' && standardStatus.trim()) {
    const lower = standardStatus.trim().toLowerCase();
    if (lower === 'active') return 'Active';
    if (lower === 'active under contract' || lower === 'under contract' || lower === 'reserved') return 'Active Under Contract';
    if (lower === 'pending') return 'Pending';
    if (lower === 'closed' || lower === 'sold') return 'Closed';
    if (lower === 'pending approval' || lower === 'needs approval') return 'Pending Approval';
    if (lower === 'pending confirmation') return 'Pending Confirmation';
    if (lower === 'action required') return 'Action Required';
    if (lower === 'draft') return 'Draft';
    if (lower === 'canceled' || lower === 'cancelled') return 'Canceled';
    if (lower === 'expired') return 'Expired';
    return standardStatus.trim();
  }

  if (status && typeof status === 'string' && status.trim()) {
    const lower = status.trim().toLowerCase();
    if (lower === 'available' || lower === 'active') return 'Active';
    if (lower === 'sold' || lower === 'closed') return 'Closed';
    if (lower === 'reserved' || lower === 'under contract' || lower === 'active under contract') return 'Active Under Contract';
    if (lower === 'pending') return 'Pending';
    if (lower === 'draft' || lower === 'inactive') return 'Draft';
  }

  return 'Active';
}

/**
 * Normalizes raw property items from Supabase / Express backend or mock fixtures
 * into a consistent, UI-safe format.
 */
export function normalizeProperty(rawItem = {}) {
  const mediaPhotos = Array.isArray(rawItem.media)
    ? rawItem.media.filter(m => (m.mediaCategory === 'Photo' || m.media_category === 'Photo') && (m.mediaUrl || m.media_url)).map(m => m.mediaUrl || m.media_url)
    : (Array.isArray(rawItem.property_media)
        ? rawItem.property_media.filter(m => (m.media_category === 'Photo' || m.mediaCategory === 'Photo') && (m.media_url || m.mediaUrl)).map(m => m.media_url || m.mediaUrl)
        : []);

  const propertyImagesPhotos = Array.isArray(rawItem.property_images)
    ? rawItem.property_images.map(img => img.imageUrl || img.image_url).filter(Boolean)
    : [];

  const combinedRawImages = Array.from(new Set([
    ...(rawItem.mainImage || rawItem.main_image ? [rawItem.mainImage || rawItem.main_image] : []),
    ...(Array.isArray(rawItem.images) ? rawItem.images : []),
    ...propertyImagesPhotos,
    ...mediaPhotos,
    ...(rawItem.image || rawItem.cover_image ? [rawItem.image || rawItem.cover_image] : [])
  ])).filter(Boolean);

  const images = combinedRawImages.map(resolveDriveImageUrl).filter(Boolean);
  const mainImage = resolveDriveImageUrl(rawItem.mainImage || rawItem.main_image) || (images.length > 0 ? images[0] : null);

  let locationString = '';
  if (typeof rawItem.location === 'string' && rawItem.location.trim()) {
    locationString = rawItem.location;
  } else if (rawItem.location && typeof rawItem.location === 'object') {
    const parts = [rawItem.location.address, rawItem.location.city, rawItem.location.state].filter(Boolean);
    locationString = parts.length > 0 ? parts.join(', ') : (rawItem.location.city || '');
  } else if (rawItem.address || rawItem.city) {
    locationString = [rawItem.address, rawItem.city, rawItem.state].filter(Boolean).join(', ');
  }

  const rawNumericPrice = typeof rawItem.price === 'number'
    ? rawItem.price
    : Number(String(rawItem.price || '0').replace(/[^0-9.-]+/g, '')) || 0;

  const displayPrice = rawItem.formattedPrice ||
    (typeof rawItem.price === 'string' && rawItem.price.startsWith('₱') ? rawItem.price : null) ||
    (rawNumericPrice > 0 ? `₱${rawNumericPrice.toLocaleString()}` : null);

  const canonicalStandardStatus = resolveCanonicalStandardStatus(
    rawItem.standard_status || rawItem.standardStatus,
    rawItem.status
  );

  const normalizedStatus = (rawItem.status || (canonicalStandardStatus === 'Active' ? 'AVAILABLE' : canonicalStandardStatus === 'Closed' ? 'SOLD' : 'PENDING')).toUpperCase();

  const isPublished = rawItem.is_published !== undefined
    ? Boolean(rawItem.is_published)
    : (rawItem.isPublished !== undefined
        ? Boolean(rawItem.isPublished)
        : (normalizedStatus !== 'SOLD' && normalizedStatus !== 'INACTIVE'));

  const explicitAgentName = rawItem.agent_name || rawItem.agentName || rawItem.agent?.name || '';
  const agentId = rawItem.agent_id || rawItem.agentId || null;
  const isCorporateDesk = !explicitAgentName && !agentId && !rawItem.list_agent_key && !rawItem.listAgentKey;
  const agentName = explicitAgentName || (isCorporateDesk ? 'Human Shelter Realty Desk' : '');
  const agentPhone = rawItem.agent_phone || rawItem.agentPhone || rawItem.agent?.phone || (isCorporateDesk ? '+63 2 8888 0000' : '');
  const agentEmail = rawItem.agent_email || rawItem.agentEmail || rawItem.agent?.email || (isCorporateDesk ? 'inquiries@humanshelterrealty.com' : '');

  const bedroomsTotal = parseNullableNumber(rawItem.bedrooms_total ?? rawItem.bedroomsTotal ?? rawItem.specs?.bedroomsTotal ?? rawItem.beds ?? rawItem.specs?.beds ?? rawItem.bedrooms);
  const bathroomsTotal = parseNullableNumber(rawItem.bathrooms_total_integer ?? rawItem.bathroomsTotalInteger ?? rawItem.specs?.bathroomsTotalInteger ?? rawItem.baths ?? rawItem.specs?.baths ?? rawItem.bathrooms);
  const livingArea = parseNullableNumber(rawItem.living_area ?? rawItem.livingArea ?? rawItem.specs?.livingArea ?? rawItem.floor_area ?? rawItem.sqft);
  const livingAreaUnits = rawItem.living_area_units || rawItem.livingAreaUnits || rawItem.specs?.livingAreaUnits || 'Square Meters';
  const lotSizeArea = parseNullableNumber(rawItem.lot_size_area ?? rawItem.lotSizeArea ?? rawItem.specs?.lotSizeArea ?? rawItem.lot_area);
  const lotSizeUnits = rawItem.lot_size_units || rawItem.lotSizeUnits || rawItem.specs?.lotSizeUnits || 'Square Meters';

  const listingId = rawItem.listing_id || rawItem.listingId || null;
  const listingKey = rawItem.listing_key || rawItem.listingKey || (rawItem.id ? `KEY-${rawItem.id}` : null);

  return {
    ...rawItem,
    id: String(rawItem.id || `prop-${Date.now()}`),
    title: rawItem.title || rawItem.name || 'Untitled Property',
    tagline: rawItem.tagline || '',
    mainImage,
    image: mainImage || (images.length > 0 ? images[0] : null),
    thumbnail: mainImage || (images.length > 0 ? images[0] : null),
    images,
    location: locationString,
    location_raw: rawItem.location,
    address: rawItem.address || rawItem.location?.address || '',
    city: rawItem.city || rawItem.location?.city || '',
    state: rawItem.state || rawItem.location?.state || rawItem.state_or_province || rawItem.location?.stateOrProvince || '',
    state_or_province: rawItem.state_or_province || rawItem.location?.stateOrProvince || rawItem.state || rawItem.location?.state || '',
    province: rawItem.state_or_province || rawItem.location?.stateOrProvince || rawItem.state || rawItem.location?.state || '',
    subdivision_name: rawItem.subdivision_name || rawItem.location?.subdivisionName || rawItem.subdivisionName || '',
    subdivisionName: rawItem.subdivision_name || rawItem.location?.subdivisionName || rawItem.subdivisionName || '',
    subdivision_project_id: rawItem.subdivision_project_id || rawItem.subdivisionProjectId || null,
    subdivisionProjectId: rawItem.subdivision_project_id || rawItem.subdivisionProjectId || null,
    subdivision_lot_id: rawItem.subdivision_lot_id || rawItem.subdivisionLotId || null,
    subdivisionLotId: rawItem.subdivision_lot_id || rawItem.subdivisionLotId || null,
    building_name: rawItem.building_name || rawItem.location?.buildingName || rawItem.location?.building_name || rawItem.buildingName || '',
    buildingName: rawItem.building_name || rawItem.location?.buildingName || rawItem.location?.building_name || rawItem.buildingName || '',
    postal_code: rawItem.postal_code || rawItem.location?.postalCode || rawItem.postalCode || '',
    postalCode: rawItem.postal_code || rawItem.location?.postalCode || rawItem.postalCode || '',
    region: rawItem.region || rawItem.location?.region || '',
    region_psgc_code: rawItem.region_psgc_code || rawItem.location?.region_psgc_code || rawItem.location?.regionPsgcCode || '',
    province_psgc_code: rawItem.province_psgc_code || rawItem.location?.province_psgc_code || rawItem.location?.provincePsgcCode || '',
    city_psgc_code: rawItem.city_psgc_code || rawItem.location?.city_psgc_code || rawItem.location?.cityPsgcCode || '',
    barangay: rawItem.barangay || rawItem.location?.barangay || '',
    barangay_psgc_code: rawItem.barangay_psgc_code || rawItem.location?.barangay_psgc_code || rawItem.location?.barangayPsgcCode || '',
    unparsed_address: rawItem.unparsed_address || rawItem.location?.unparsedAddress || rawItem.location?.unparsed_address || '',
    unparsedAddress: rawItem.unparsed_address || rawItem.location?.unparsedAddress || rawItem.location?.unparsed_address || '',
    latitude: rawItem.latitude ?? rawItem.location?.coordinates?.lat ?? '',
    longitude: rawItem.longitude ?? rawItem.location?.coordinates?.lng ?? '',
    price: displayPrice,
    price_raw: rawNumericPrice,
    formattedPrice: displayPrice,
    property_type: rawItem.property_type || rawItem.specs?.propertyType || rawItem.propertyType || '',
    propertyType: rawItem.property_type || rawItem.specs?.propertyType || rawItem.propertyType || '',
    property_type_id: rawItem.property_type_id ?? rawItem.propertyTypeId ?? rawItem.specs?.propertyTypeId ?? null,
    propertyTypeId: rawItem.property_type_id ?? rawItem.propertyTypeId ?? rawItem.specs?.propertyTypeId ?? null,
    property_sub_type: rawItem.property_sub_type || rawItem.propertySubType || rawItem.specs?.propertySubType || '',
    propertySubType: rawItem.property_sub_type || rawItem.propertySubType || rawItem.specs?.propertySubType || '',
    status: normalizedStatus,
    is_published: isPublished,
    isPublished: isPublished,
    agent_id: agentId,
    agent_name: agentName,
    agentName: agentName,
    agent_phone: agentPhone,
    agentPhone: agentPhone,
    agent_email: agentEmail,
    agentEmail: agentEmail,
    is_corporate_desk: isCorporateDesk,
    isCorporateDesk: isCorporateDesk,
    agent: rawItem.agent ? {
      ...rawItem.agent,
      isCorporateDesk: Boolean(rawItem.agent.isCorporateDesk ?? isCorporateDesk),
    } : {
      id: agentId,
      name: agentName,
      title: isCorporateDesk ? 'Corporate Brokerage Desk' : 'Senior Property Specialist',
      brokerage: 'Human Shelter Realty',
      phone: agentPhone,
      email: agentEmail,
      isCorporateDesk,
    },
    list_agent_key: rawItem.list_agent_key || rawItem.listAgentKey || null,
    listAgentKey: rawItem.list_agent_key || rawItem.listAgentKey || null,
    created_at: rawItem.created_at || rawItem.createdAt || null,
    createdAt: rawItem.createdAt || rawItem.created_at || null,
    beds: bedroomsTotal,
    baths: bathroomsTotal,
    sqft: rawItem.sqft || rawItem.specs?.sqft || null,
    features: Array.isArray(rawItem.features) ? rawItem.features : [],
    listing_id: listingId,
    listing_key: listingKey,
    standard_status: canonicalStandardStatus,
    standardStatus: canonicalStandardStatus,
    transaction_type: rawItem.transaction_type || rawItem.specs?.transactionType || rawItem.transactionType || rawItem.customAttributes?.canonicalPayload?.transactionType || (rawItem.pricing?.rentFrequency ? 'For Rent' : 'For Sale'),
    transactionType: rawItem.transactionType || rawItem.transaction_type || rawItem.specs?.transactionType || rawItem.customAttributes?.canonicalPayload?.transactionType || (rawItem.pricing?.rentFrequency ? 'For Rent' : 'For Sale'),
    district: rawItem.district || rawItem.location?.district || rawItem.location?.subdivisionName || rawItem.subdivisionName || rawItem.location?.city || rawItem.city || '',
    association_fee: rawItem.pricing?.associationFee ?? rawItem.pricing?.association_fee ?? rawItem.association_fee ?? rawItem.associationFee ?? 0,
    associationFee: rawItem.pricing?.associationFee ?? rawItem.pricing?.association_fee ?? rawItem.association_fee ?? rawItem.associationFee ?? 0,
    association_fee_frequency: rawItem.pricing?.associationFeeFrequency ?? rawItem.pricing?.association_fee_frequency ?? rawItem.association_fee_frequency ?? rawItem.associationFeeFrequency ?? 'Monthly',
    associationFeeFrequency: rawItem.pricing?.associationFeeFrequency ?? rawItem.pricing?.association_fee_frequency ?? rawItem.association_fee_frequency ?? rawItem.associationFeeFrequency ?? 'Monthly',
    currency: rawItem.pricing?.currency || rawItem.currency || rawItem.listPriceCurrency || rawItem.list_price_currency || 'PHP',
    rent_frequency: rawItem.pricing?.rentFrequency || rawItem.pricing?.rent_frequency || rawItem.rent_frequency || null,
    lease_term: rawItem.pricing?.leaseTerm || rawItem.pricing?.lease_term || rawItem.lease_term || '',
    association_fee_includes: Array.isArray(rawItem.pricing?.associationFeeIncludes || rawItem.pricing?.association_fee_includes || rawItem.association_fee_includes)
      ? (rawItem.pricing?.associationFeeIncludes || rawItem.pricing?.association_fee_includes || rawItem.association_fee_includes)
      : [],
    security_deposit: rawItem.pricing?.securityDeposit ?? rawItem.pricing?.security_deposit ?? rawItem.security_deposit ?? '',
    advance_rent: rawItem.pricing?.advanceRent ?? rawItem.pricing?.advance_rent ?? rawItem.advance_rent ?? '',
    pricing: rawItem.pricing || {},
    tax_annual_amount: rawItem.tax_annual_amount ?? rawItem.taxAnnualAmount ?? null,
    taxAnnualAmount: rawItem.tax_annual_amount ?? rawItem.taxAnnualAmount ?? null,
    living_area: livingArea,
    livingArea: livingArea,
    living_area_units: livingAreaUnits,
    livingAreaUnits: livingAreaUnits,
    lot_size_area: lotSizeArea,
    lotSizeArea: lotSizeArea,
    lot_size_units: lotSizeUnits,
    lotSizeUnits: lotSizeUnits,
    bedrooms_total: bedroomsTotal,
    bathrooms_total_integer: bathroomsTotal,
    bathrooms_full: rawItem.bathrooms_full ?? rawItem.bathroomsFull ?? rawItem.specs?.bathroomsFull ?? null,
    bathrooms_half: rawItem.bathrooms_half ?? rawItem.bathroomsHalf ?? rawItem.specs?.bathroomsHalf ?? null,
    stories_total: rawItem.stories_total ?? rawItem.storiesTotal ?? rawItem.specs?.storiesTotal ?? null,
    parking_total: rawItem.parking_total ?? rawItem.parkingTotal ?? rawItem.specs?.parkingTotal ?? null,
    parking_covered: rawItem.parking_covered ?? rawItem.parkingCovered ?? rawItem.specs?.parkingCovered ?? null,
    parking_open: rawItem.parking_open ?? rawItem.parkingOpen ?? rawItem.specs?.parkingOpen ?? null,
    year_built: rawItem.year_built ?? rawItem.yearBuilt ?? rawItem.specs?.yearBuilt ?? null,
    architectural_style: rawItem.architectural_style ?? rawItem.architecturalStyle ?? rawItem.specs?.architecturalStyle ?? '',
    property_condition: rawItem.property_condition ?? rawItem.propertyCondition ?? rawItem.specs?.propertyCondition ?? '',
    furnishing: rawItem.furnishing || rawItem.specs?.furnishing || rawItem.custom_reso_attributes?.furnishing || rawItem.customResoAttributes?.furnishing || '',
    lot_frontage: rawItem.lot_frontage || rawItem.lotFrontage || rawItem.specs?.lotFrontage || rawItem.custom_reso_attributes?.lotFrontage || rawItem.customResoAttributes?.lotFrontage || '',
    floor_level: rawItem.floor_level || rawItem.floorLevel || rawItem.specs?.floorLevel || rawItem.custom_reso_attributes?.floorLevel || rawItem.customResoAttributes?.floorLevel || '',
    tower_name: rawItem.tower_name || rawItem.towerName || rawItem.location?.towerName || rawItem.custom_reso_attributes?.towerName || rawItem.customResoAttributes?.towerName || '',
    cadastralLotId: rawItem.listing_key || rawItem.listingKey || rawItem.custom_reso_attributes?.cadastralLotId || rawItem.customResoAttributes?.cadastralLotId || '',
    rooms: Array.isArray(rawItem.rooms) ? rawItem.rooms.map((r, idx) => ({
      id: r.id || `room-${idx}-${Date.now()}`,
      room_type: r.room_type || r.roomType || 'Bedroom',
      room_level: r.room_level || r.roomLevel || 'Ground Floor',
      room_length: r.room_length ?? r.roomLength ?? '',
      room_width: r.room_width ?? r.roomWidth ?? '',
      room_dimensions_units: r.room_dimensions_units || r.roomDimensionsUnits || 'Meters',
      room_features: Array.isArray(r.room_features) ? r.room_features : (Array.isArray(r.roomFeatures) ? r.roomFeatures : (typeof (r.room_features || r.roomFeatures) === 'string' ? (r.room_features || r.roomFeatures).split(',').map(s => s.trim()).filter(Boolean) : []))
    })) : [],
    subdivision_name: rawItem.subdivision_name || rawItem.subdivisionName || rawItem.location?.subdivisionName || '',
    subdivisionName: rawItem.subdivision_name || rawItem.subdivisionName || rawItem.location?.subdivisionName || '',
    confidential: rawItem.confidential || {
      buyerAgencyCompensation: rawItem.buyer_agency_compensation || '',
      privateRemarks: rawItem.private_remarks || '',
      showingInstructions: rawItem.showing_instructions || '',
      lockboxCode: rawItem.lockbox_code || '',
      sellerDirectPhone: rawItem.seller_direct_phone || '',
    },
    property_images: Array.isArray(rawItem.property_images) ? rawItem.property_images : [],
    media: Array.isArray(rawItem.media) ? rawItem.media : [],
  };
}

/**
 * Helper to parse a nonnegative number, returning undefined if empty or invalid
 */
function parseNonnegativeNumber(val) {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : Math.max(0, num);
}

/**
 * Helper to parse a nonnegative integer, returning undefined if empty or invalid
 */
function parseNonnegativeInt(val) {
  if (val === undefined || val === null || val === '') return undefined;
  const num = parseInt(val, 10);
  return isNaN(num) ? undefined : Math.max(0, num);
}

/**
 * Converts ergonomic flat Studio form state into structured, Zod-compliant DTO
 * for the Express backend (/api/properties).
 */
export function toApiPayload(item = {}) {
  const numericPrice = typeof item.price === 'number'
    ? item.price
    : Number(String(item.price || 0).replace(/[^0-9.-]+/g, '')) || 0;

  const rawAssocFee = item.association_fee ?? item.associationFee;
  const numericAssocFee = typeof rawAssocFee === 'number'
    ? rawAssocFee
    : Number(String(rawAssocFee || 0).replace(/[^0-9.-]+/g, '')) || 0;

  const rawTax = item.tax_annual_amount ?? item.taxAnnualAmount;
  const numericTax = rawTax !== undefined && rawTax !== null && rawTax !== ''
    ? (typeof rawTax === 'number' ? rawTax : Number(String(rawTax).replace(/[^0-9.-]+/g, '')) || undefined)
    : undefined;

  const rawOriginalPrice = item.original_list_price ?? item.originalListPrice;
  const numericOriginalPrice = rawOriginalPrice
    ? (typeof rawOriginalPrice === 'number' ? rawOriginalPrice : Number(String(rawOriginalPrice).replace(/[^0-9.-]+/g, '')) || numericPrice)
    : numericPrice;

  const resolvedCoordinates = item.coordinates || (item.latitude && item.longitude ? {
    lat: Number(item.latitude),
    lng: Number(item.longitude)
  } : undefined);

  // Specifications calculation & mapping
  const bedroomsTotal = parseNonnegativeInt(item.bedrooms_total ?? item.bedroomsTotal ?? item.bedrooms ?? item.beds);
  const bathroomsTotalInteger = parseNonnegativeInt(item.bathrooms_total_integer ?? item.bathroomsTotalInteger ?? item.bathrooms ?? item.baths);
  const bathroomsFull = parseNonnegativeInt(item.bathrooms_full ?? item.bathroomsFull);
  const bathroomsHalf = parseNonnegativeInt(item.bathrooms_half ?? item.bathroomsHalf);

  const livingArea = parseNonnegativeNumber(item.living_area ?? item.livingArea ?? item.floor_area);
  const livingAreaUnits = item.living_area_units || item.livingAreaUnits || 'Square Meters';

  const lotSizeArea = parseNonnegativeNumber(item.lot_size_area ?? item.lotSizeArea ?? item.lot_area);
  const lotSizeUnits = item.lot_size_units || item.lotSizeUnits || 'Square Meters';

  // Compute required sqft from living area conversion or lot size fallback for residentialLot
  let computedSqft = undefined;
  if (livingArea !== undefined && livingArea > 0) {
    if (livingAreaUnits === 'Square Meters') {
      computedSqft = Math.round(livingArea * 10.7639);
    } else {
      computedSqft = Math.round(livingArea);
    }
  } else if (item.sqft) {
    computedSqft = Number(item.sqft);
  } else if (lotSizeArea !== undefined && lotSizeArea > 0) {
    if (lotSizeUnits === 'Square Meters') {
      computedSqft = Math.round(lotSizeArea * 10.7639);
    } else {
      computedSqft = Math.round(lotSizeArea);
    }
  }

  const storiesTotal = parseNonnegativeInt(item.stories_total ?? item.storiesTotal ?? item.stories);
  const parkingTotal = parseNonnegativeInt(item.parking_total ?? item.parkingTotal ?? item.parking);
  const parkingCovered = parseNonnegativeInt(item.parking_covered ?? item.parkingCovered);
  const parkingOpen = parseNonnegativeInt(item.parking_open ?? item.parkingOpen);
  const yearBuilt = parseNonnegativeInt(item.year_built ?? item.yearBuilt);

  // Format rooms array
  const formattedRooms = Array.isArray(item.rooms) ? item.rooms.map(room => ({
    roomType: room.room_type || room.roomType || 'Bedroom',
    roomLevel: room.room_level || room.roomLevel || undefined,
    roomLength: parseNonnegativeNumber(room.room_length ?? room.roomLength),
    roomWidth: parseNonnegativeNumber(room.room_width ?? room.roomWidth),
    roomDimensionsUnits: (room.room_dimensions_units || room.roomDimensionsUnits || 'Meters') === 'Feet' ? 'Feet' : 'Meters',
    roomFeatures: Array.isArray(room.room_features) 
      ? room.room_features 
      : (Array.isArray(room.roomFeatures) 
          ? room.roomFeatures 
          : (typeof (room.room_features || room.roomFeatures) === 'string' 
              ? (room.room_features || room.roomFeatures).split(',').map(s => s.trim()).filter(Boolean) 
              : []))
  })) : undefined;

  // Resolve and synchronize standardStatus, status, and isPublished
  const rawStandardStatus = item.standardStatus || item.standard_status;
  const rawStatus = (item.status || '').toUpperCase();

  let resolvedStandardStatus = rawStandardStatus;
  if (!resolvedStandardStatus) {
    if (rawStatus === 'AVAILABLE' || rawStatus === 'ACTIVE') {
      resolvedStandardStatus = 'Active';
    } else if (rawStatus === 'UNDER CONTRACT' || rawStatus === 'ACTIVE UNDER CONTRACT' || rawStatus === 'RESERVED') {
      resolvedStandardStatus = 'Active Under Contract';
    } else if (rawStatus === 'SOLD' || rawStatus === 'CLOSED') {
      resolvedStandardStatus = 'Closed';
    } else {
      resolvedStandardStatus = 'Draft';
    }
  } else {
    resolvedStandardStatus = resolveCanonicalStandardStatus(resolvedStandardStatus, item.status);
  }

  let derivedStatus = 'pending';
  if (resolvedStandardStatus === 'Active') {
    derivedStatus = 'available';
  } else if (resolvedStandardStatus === 'Closed' || rawStatus === 'SOLD') {
    derivedStatus = 'sold';
  } else {
    derivedStatus = 'pending';
  }

  const resolvedIsPublished = item.is_published !== undefined
    ? Boolean(item.is_published)
    : (item.isPublished !== undefined
        ? Boolean(item.isPublished)
        : (resolvedStandardStatus === 'Active'));

  const resolvedListAgentKey = item.listAgentKey || item.list_agent_key || item.agentId || item.agent_id || item.assignedAgent?.agentId || item.assignedAgent?.id || undefined;

  // Canonical Schema v1.0 payload construction
  const rawPropType = String(item.property_type || item.propertyType || '').toLowerCase();
  let canonicalPropertyType = 'houseAndLot';
  if (rawPropType.includes('lot') || rawPropType.includes('land')) {
    canonicalPropertyType = 'residentialLot';
  } else if (rawPropType.includes('condo') || rawPropType.includes('apartment') || rawPropType.includes('penthouse')) {
    canonicalPropertyType = 'condominium';
  } else if (rawPropType.includes('house') || rawPropType.includes('townhouse') || rawPropType.includes('villa')) {
    canonicalPropertyType = 'houseAndLot';
  }

  const assignedAgentObj = item.assignedAgent ? {
    agentId: item.assignedAgent.agentId || item.assignedAgent.id || resolvedListAgentKey,
    name: item.assignedAgent.name || item.agent_name || '',
    email: item.assignedAgent.email || item.agent_email || '',
    role: item.assignedAgent.role || 'agent',
    prcLicenseNo: item.assignedAgent.prcLicenseNo || item.assignedAgent.license_no || item.assignedAgent.licenseNumber || 'PRC-REB-0024891',
    assignmentStatus: item.assignedAgent.assignmentStatus || 'accepted',
    assignedAt: item.assignedAgent.assignedAt || new Date().toISOString()
  } : (resolvedListAgentKey ? {
    agentId: resolvedListAgentKey,
    name: item.agent_name || item.agentName || 'Assigned Agent',
    email: item.agent_email || item.agentEmail || '',
    role: 'agent',
    prcLicenseNo: 'PRC-REB-0024891',
    assignmentStatus: 'assigned',
    assignedAt: new Date().toISOString()
  } : undefined);

  let canonicalPropertyDetails = {};
  if (canonicalPropertyType === 'residentialLot') {
    canonicalPropertyDetails = {
      subdivision: {
        id: item.subdivisionId || item.subdivision_id || null,
        name: (item.subdivision_name || item.subdivisionName || item.subdivision || '').trim(),
        phase: item.phase || item.subdivision_phase || '',
        block: item.block || item.subdivision_block || '',
        lot: item.lot || item.subdivision_lot || ''
      },
      landUse: item.landUse || item.land_use || 'residential',
      lotArea: {
        value: lotSizeArea || 0,
        unit: 'sqm'
      },
      frontage: (item.frontage_meters ?? item.frontage) !== undefined && (item.frontage_meters ?? item.frontage) !== null && (item.frontage_meters ?? item.frontage) !== '' ? {
        value: Number(item.frontage_meters ?? item.frontage),
        unit: 'm'
      } : undefined,
      depth: (item.depth_meters ?? item.depth) !== undefined && (item.depth_meters ?? item.depth) !== null && (item.depth_meters ?? item.depth) !== '' ? {
        value: Number(item.depth_meters ?? item.depth),
        unit: 'm'
      } : undefined,
      lotPosition: item.lot_position || item.lotPosition || undefined,
      terrain: item.terrain || undefined,
      facingDirection: item.facing_direction || item.facingDirection || undefined,
      developmentCondition: item.development_condition || item.developmentCondition || 'vacant',
      readyToBuild: item.ready_to_build !== undefined ? Boolean(item.ready_to_build) : (item.readyToBuild !== undefined ? Boolean(item.readyToBuild) : true),
      cadastralReference: item.cadastral_reference || item.cadastralReference || item.referenceCode || item.reference_code || undefined,
      title: {
        type: item.title_type || item.titleType || 'tct',
        reportedStatus: item.title_status || item.titleStatus || 'clean',
        verificationStatus: item.title_verification_status || item.titleVerificationStatus || 'unverified'
      }
    };
  } else if (canonicalPropertyType === 'condominium') {
    canonicalPropertyDetails = {
      building: {
        id: item.buildingId || item.building_id || null,
        name: (item.building_name || item.buildingName || '').trim(),
        tower: item.tower_name || item.towerName || item.tower || '',
        floorLevel: item.floor_level || item.floorLevel || '',
        unitNumber: item.unit_number || item.unitNumber || ''
      },
      floorArea: {
        value: livingArea || 0,
        unit: 'sqm'
      },
      balcony: {
        hasBalcony: Boolean(item.has_balcony || item.hasBalcony || item.balcony_area || item.balconyArea),
        area: parseNullableNumber(item.balcony_area ?? item.balconyArea),
        viewFacing: item.balcony_facing || item.balconyFacing || undefined
      },
      unitLayout: item.unit_layout || item.unitLayout || undefined,
      parking: {
        slots: parkingTotal || 0,
        slotNumbers: item.parking_slot_numbers || item.parkingSlotNumbers || undefined
      },
      furnishing: item.furnishing || undefined,
      title: {
        type: 'cct',
        reportedStatus: item.title_status || item.titleStatus || 'clean',
        verificationStatus: item.title_verification_status || item.titleVerificationStatus || 'unverified'
      }
    };
  } else {
    // houseAndLot
    canonicalPropertyDetails = {
      subdivision: {
        id: item.subdivisionId || item.subdivision_id || null,
        name: (item.subdivision_name || item.subdivisionName || item.subdivision || '').trim(),
        phase: item.phase || item.subdivision_phase || '',
        block: item.block || item.subdivision_block || '',
        lot: item.lot || item.subdivision_lot || ''
      },
      lotArea: {
        value: lotSizeArea || 0,
        unit: 'sqm'
      },
      floorArea: {
        value: livingArea || 0,
        unit: 'sqm'
      },
      stories: storiesTotal || 1,
      bedrooms: bedroomsTotal || 1,
      bathrooms: bathroomsTotalInteger || 1,
      carport: parkingTotal || 0,
      maidsRoom: Boolean(item.has_maids_room || item.hasMaidsRoom),
      title: {
        type: item.title_type || item.titleType || 'tct',
        reportedStatus: item.title_status || item.titleStatus || 'clean',
        verificationStatus: item.title_verification_status || item.titleVerificationStatus || 'unverified'
      }
    };
  }

  const rawPhotos = Array.isArray(item.images)
    ? item.images
    : (Array.isArray(item.property_images)
        ? item.property_images.map(p => p.imageUrl || p.image_url)
        : (item.image ? [item.image] : []));

  const canonicalPhotos = rawPhotos.filter(Boolean).map((img, idx) => ({
    id: `photo-${String(idx + 1).padStart(3, '0')}`,
    url: typeof img === 'string' ? img : (img.url || img.imageUrl || ''),
    caption: typeof img === 'object' ? (img.caption || '') : '',
    altText: typeof img === 'object' ? (img.altText || '') : '',
    sortOrder: idx,
    isPlaceholder: Boolean(typeof img === 'object' && img.isPlaceholder)
  }));

  const canonicalPayload = {
    schemaVersion: '1.0',
    id: item.id || undefined,
    referenceCode: item.referenceCode || item.reference_code || item.cadastral_reference || item.cadastralReference || undefined,
    propertyType: canonicalPropertyType,
    transactionType: item.transactionType || item.transaction_type || 'sale',
    title: (item.title || 'Untitled Property').trim(),
    tagline: item.tagline || '',
    description: item.description || item.publicRemarks || null,
    status: {
      publication: resolvedIsPublished ? 'published' : 'draft',
      availability: derivedStatus === 'available' ? 'available' : (derivedStatus === 'sold' ? 'sold' : 'underContract')
    },
    isFeatured: Boolean(item.isFeatured || item.is_featured),
    assignedAgent: assignedAgentObj,
    location: {
      countryCode: item.countryCode || 'PH',
      region: item.region || (item.location && typeof item.location === 'object' ? item.location.region : undefined),
      province: (item.province || item.stateOrProvince || item.state || (item.location && typeof item.location === 'object' ? (item.location.province || item.location.state) : '') || '').trim(),
      city: (item.city || (item.location && typeof item.location === 'object' ? item.location.city : '') || '').trim(),
      barangay: item.barangay || (item.location && typeof item.location === 'object' ? item.location.barangay : undefined),
      postalCode: item.postalCode || item.postal_code || (item.location && typeof item.location === 'object' ? item.location.postalCode : undefined),
      streetAddress: item.streetAddress || item.address || (item.location && typeof item.location === 'object' ? item.location.address : undefined),
      coordinates: resolvedCoordinates ? {
        latitude: resolvedCoordinates.lat,
        longitude: resolvedCoordinates.lng
      } : undefined,
      publicDisplay: {
        showExactAddress: item.showExactAddress ?? false,
        mapPrecision: item.mapPrecision || 'approximate'
      }
    },
    propertyDetails: canonicalPropertyDetails,
    pricing: {
      amount: numericPrice,
      currency: item.currency || item.listPriceCurrency || 'PHP'
    },
    amenities: Array.isArray(item.amenities) ? item.amenities : (Array.isArray(item.features) ? item.features : []),
    infrastructure: Array.isArray(item.infrastructure) ? item.infrastructure : [],
    media: {
      coverImageId: canonicalPhotos.length > 0 ? canonicalPhotos[0].id : null,
      photos: canonicalPhotos,
      documents: Array.isArray(item.documents) ? item.documents : []
    },
    internal: {
      privateRemarks: item.privateRemarks || item.privateNotes || (item.confidential && item.confidential.privateRemarks) || '',
      showingInstructions: item.showingInstructions || (item.confidential && item.confidential.showingInstructions) || ''
    }
  };

  return {
    title: (item.title || 'Untitled Luxury Property').trim(),
    tagline: item.tagline || '',
    listingKey: item.cadastralLotId || item.listingKey || item.listing_key || undefined,
    listingId: item.listing_id || item.listingId || undefined,
    price: numericPrice,
    propertyTypeId: Number(item.property_type_id || item.propertyTypeId || item.specs?.propertyTypeId || 1),
    property_type_id: Number(item.property_type_id || item.propertyTypeId || item.specs?.propertyTypeId || 1),
    listPriceCurrency: item.listPriceCurrency || item.list_price_currency || 'PHP',
    originalListPrice: numericOriginalPrice,
    associationFee: numericAssocFee,
    associationFeeFrequency: item.associationFeeFrequency || item.association_fee_frequency || 'Monthly',
    taxAnnualAmount: numericTax,
    isFeatured: item.is_featured !== undefined ? Boolean(item.is_featured) : (item.isFeatured !== undefined ? Boolean(item.isFeatured) : false),
    is_featured: item.is_featured !== undefined ? Boolean(item.is_featured) : (item.isFeatured !== undefined ? Boolean(item.isFeatured) : false),
    standardStatus: resolvedStandardStatus,
    standard_status: resolvedStandardStatus,
    status: derivedStatus,
    isPublished: resolvedIsPublished,
    is_published: resolvedIsPublished,
    publicRemarks: item.publicRemarks || item.description || '',
    location: {
      address: (item.address || item.location || '').trim(),
      unparsedAddress: item.unparsedAddress || item.unparsed_address || undefined,
      subdivisionName: (item.subdivisionName || item.subdivision_name || item.subdivision || '').trim() || undefined,
      buildingName: (item.buildingName || item.building_name || '').trim() || undefined,
      building_name: (item.buildingName || item.building_name || '').trim() || undefined,
      towerName: item.tower_name || item.towerName || undefined,
      city: (item.city || item.location || '').trim(),
      state: (item.state || item.province || item.state_or_province || item.stateOrProvince || '').trim() || undefined,
      stateOrProvince: (item.stateOrProvince || item.state_or_province || item.province || item.state || '').trim() || undefined,
      postalCode: (item.postalCode || item.postal_code || '').trim() || undefined,
      region: item.region || undefined,
      regionPsgcCode: item.region_psgc_code || item.regionPsgcCode || undefined,
      region_psgc_code: item.region_psgc_code || item.regionPsgcCode || undefined,
      provincePsgcCode: item.province_psgc_code || item.provincePsgcCode || undefined,
      province_psgc_code: item.province_psgc_code || item.provincePsgcCode || undefined,
      cityPsgcCode: item.city_psgc_code || item.cityPsgcCode || undefined,
      city_psgc_code: item.city_psgc_code || item.cityPsgcCode || undefined,
      barangay: item.barangay || undefined,
      barangayPsgcCode: item.barangay_psgc_code || item.barangayPsgcCode || undefined,
      barangay_psgc_code: item.barangay_psgc_code || item.barangayPsgcCode || undefined,
      coordinates: resolvedCoordinates,
    },
    specs: {
      beds: bedroomsTotal ?? 1,
      baths: bathroomsTotalInteger ?? 1,
      bedroomsTotal: bedroomsTotal ?? 1,
      bathroomsTotalInteger: bathroomsTotalInteger ?? 1,
      bathroomsFull: bathroomsFull,
      bathroomsHalf: bathroomsHalf,
      storiesTotal: storiesTotal,
      sqft: computedSqft || 100,
      livingArea: livingArea,
      livingAreaUnits: livingAreaUnits,
      lotSizeArea: lotSizeArea,
      lotSizeUnits: lotSizeUnits,
      propertyType: item.propertyType || item.property_type || 'Estate',
      propertyTypeId: Number(item.property_type_id || item.propertyTypeId || item.specs?.propertyTypeId || 1),
      propertySubType: item.propertySubType || item.property_sub_type || '',
      propertyCondition: item.propertyCondition || item.property_condition || undefined,
      furnishing: item.furnishing || undefined,
      lotFrontage: item.lot_frontage || item.lotFrontage || undefined,
      floorLevel: item.floor_level || item.floorLevel || undefined,
      transactionType: item.transactionType || item.transaction_type || 'For Sale',
      yearBuilt: yearBuilt,
      parkingTotal: parkingTotal,
      parkingCovered: parkingCovered,
      parkingOpen: parkingOpen,
    },
    architecturalStyle: item.architectural_style || item.architecturalStyle || undefined,
    rooms: formattedRooms && formattedRooms.length > 0 ? formattedRooms : undefined,
    features: Array.isArray(item.features) ? item.features : (Array.isArray(item.amenities) ? item.amenities : []),
    interiorFeatures: Array.isArray(item.interiorFeatures) ? item.interiorFeatures : (Array.isArray(item.interior_features) ? item.interior_features : []),
    exteriorFeatures: Array.isArray(item.exteriorFeatures) ? item.exteriorFeatures : (Array.isArray(item.exterior_features) ? item.exterior_features : []),
    images: item.coverImage ? [item.coverImage, ...(item.galleryImages || [])] : (item.images || []),
    propertyImages: Array.isArray(item.property_images) ? item.property_images : (Array.isArray(item.propertyImages) ? item.propertyImages : undefined),
    media: Array.isArray(item.media) ? item.media : undefined,
    confidential: {
      buyerAgencyCompensation: item.buyerAgencyCompensation || item.buyerBrokerCommission || item.commissionSplit || item.confidential?.buyerAgencyCompensation || '',
      privateRemarks: item.privateRemarks || item.privateNotes || item.confidential?.privateRemarks || '',
      showingInstructions: item.showingInstructions || item.confidential?.showingInstructions || '',
      lockboxCode: item.lockboxCode || item.confidential?.lockboxCode || '',
      sellerDirectPhone: item.sellerDirectPhone || item.seller_direct_phone || item.confidential?.sellerDirectPhone || '',
    },
    pricing: {
      currency: item.currency || item.listPriceCurrency || 'PHP',
      rentFrequency: item.transaction_type === 'For Rent' || item.transactionType === 'For Rent' ? (item.rent_frequency || item.rentFrequency || 'Monthly') : undefined,
      leaseTerm: item.transaction_type === 'For Rent' || item.transactionType === 'For Rent' ? (item.lease_term || item.leaseTerm || '12 Months') : undefined,
      associationFee: parseNonnegativeNumber(item.association_fee ?? item.associationFee),
      associationFeeFrequency: item.association_fee_frequency || item.associationFeeFrequency || 'Monthly',
      associationFeeIncludes: Array.isArray(item.association_fee_includes) ? item.association_fee_includes : (Array.isArray(item.associationFeeIncludes) ? item.associationFeeIncludes : []),
      securityDeposit: parseNonnegativeNumber(item.security_deposit ?? item.securityDeposit),
      advanceRent: parseNonnegativeNumber(item.advance_rent ?? item.advanceRent),
    },
    customResoAttributes: {
      ...(item.customResoAttributes || {}),
      canonicalPayload: canonicalPayload,
      furnishing: item.furnishing || undefined,
      lotFrontage: item.lot_frontage || item.lotFrontage || undefined,
      floorLevel: item.floor_level || item.floorLevel || undefined,
      towerName: item.tower_name || item.towerName || undefined,
      cadastralLotId: item.cadastralLotId || undefined,
    },
    agentId: resolvedListAgentKey,
    agent_id: resolvedListAgentKey,
    listAgentKey: resolvedListAgentKey,
    subdivision_project_id: item.subdivision_project_id || item.subdivisionProjectId || null,
    subdivisionProjectId: item.subdivision_project_id || item.subdivisionProjectId || null,
    subdivision_lot_id: item.subdivision_lot_id || item.subdivisionLotId || null,
    subdivisionLotId: item.subdivision_lot_id || item.subdivisionLotId || null,
  };
}

export const propertyService = {
  /**
   * Fetch properties with optional query filters (city, propertyType, minPrice, maxPrice, status, agentId, page, limit)
   */
  async getProperties(params = {}) {
    const response = await apiClient.get('/properties', { params });
    const rawList = Array.isArray(response?.data)
      ? response.data
      : (Array.isArray(response) ? response : []);

    const normalizedList = rawList.map(normalizeProperty);

    return {
      success: response?.success ?? true,
      data: normalizedList,
      total: response?.total ?? normalizedList.length,
      page: response?.page ?? 1,
      limit: response?.limit ?? 10,
      totalPages: response?.totalPages ?? 1,
    };
  },

  /**
   * Fetch total count of properties matching optional query filters
   */
  async countProperties(params = {}) {
    const response = await apiClient.get('/properties/count', { params });
    return response?.count ?? response?.data?.count ?? 0;
  },

  /**
   * Fetch a single property by its ID
   */
  async getPropertyById(id) {
    const response = await apiClient.get(`/properties/${id}`);
    const raw = response?.data || response;
    return raw ? normalizeProperty(raw) : null;
  },

  /**
   * Create a new property listing (requires authentication)
   */
  async createProperty(propertyData) {
    const response = await apiClient.post('/properties', propertyData);
    return response?.data ? normalizeProperty(response.data) : response;
  },

  /**
   * Update an existing property listing (requires authentication)
   */
  async updateProperty(id, propertyData) {
    const response = await apiClient.put(`/properties/${id}`, propertyData);
    return response?.data ? normalizeProperty(response.data) : response;
  },

  /**
   * Delete a property listing (requires authentication)
   */
  async deleteProperty(id) {
    const response = await apiClient.delete(`/properties/${id}`);
    return response;
  },

  /**
   * Upload media files to a property
   */
  async uploadMedia(id, formData) {
    // Note: We use the underlying axios instance to ensure FormData isn't stringified
    // and let the browser set the boundary for Content-Type
    const response = await apiClient.post(`/properties/${id}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response?.data || response;
  },

  /**
   * Submit proposed modifications to an assigned property (Agent Workflow)
   */
  async proposeEdit(propertyId, proposedChanges, agentNotes = '') {
    const response = await apiClient.post(`/properties/${propertyId}/propose-edit`, {
      proposedChanges,
      agentNotes,
    });
    return response?.data || response;
  },

  /**
   * List edit requests with status or property filters
   */
  async getEditRequests(params = {}) {
    const response = await apiClient.get('/properties/edit-requests', { params });
    return response;
  },

  /**
   * Fetch single edit request by ID
   */
  async getEditRequestById(requestId) {
    const response = await apiClient.get(`/properties/edit-requests/${requestId}`);
    return response?.data || response;
  },

  /**
   * Approve an edit request (Broker / Admin)
   */
  async approveEditRequest(requestId, reviewNotes = '') {
    const response = await apiClient.post(`/properties/edit-requests/${requestId}/approve`, {
      reviewNotes,
    });
    return response?.data || response;
  },

  /**
   * Reject an edit request with required remarks (Broker / Admin)
   */
  async rejectEditRequest(requestId, rejectionReason) {
    const response = await apiClient.post(`/properties/edit-requests/${requestId}/reject`, {
      rejectionReason,
    });
    return response?.data || response;
  },

  /**
   * Cancel a pending edit request (Agent)
   */
  async cancelEditRequest(requestId) {
    const response = await apiClient.post(`/properties/edit-requests/${requestId}/cancel`);
    return response?.data || response;
  },

  /**
   * Accept an assigned property listing (Agent)
   */
  async acceptAssignment(propertyId) {
    const response = await apiClient.patch(`/properties/${propertyId}/accept-assignment`);
    return response?.data || response;
  },

  /**
   * Decline an assigned property listing (Agent)
   */
  async declineAssignment(propertyId, reason = '') {
    const response = await apiClient.patch(`/properties/${propertyId}/decline-assignment`, {
      reason,
    });
    return response?.data || response;
  },

  /**
   * Reassign a property listing to a new agent (Broker / Admin)
   */
  async reassignAgent(propertyId, newAgentId) {
    const response = await apiClient.patch(`/properties/${propertyId}/reassign-agent`, {
      newAgentId,
    });
    return response?.data || response;
  }
};

export default propertyService;
