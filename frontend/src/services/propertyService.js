// ==============================================================================
// Property Service
// Communicates EXCLUSIVELY with the Express Backend RESTful API (/api/properties)
// ==============================================================================

import apiClient from './apiClient';

/**
 * Normalizes raw property items from Supabase / Express backend or mock fixtures
 * into a consistent, UI-safe format.
 */
export function normalizeProperty(rawItem = {}) {
  const images = Array.isArray(rawItem.images) && rawItem.images.length > 0
    ? rawItem.images
    : [rawItem.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'];

  const mainImage = rawItem.mainImage || images[0];

  let locationString = 'Metro Manila';
  if (typeof rawItem.location === 'string' && rawItem.location.trim()) {
    locationString = rawItem.location;
  } else if (rawItem.location && typeof rawItem.location === 'object') {
    const parts = [rawItem.location.address, rawItem.location.city, rawItem.location.state].filter(Boolean);
    locationString = parts.length > 0 ? parts.join(', ') : (rawItem.location.city || 'Metro Manila');
  } else if (rawItem.address || rawItem.city) {
    locationString = [rawItem.address, rawItem.city, rawItem.state].filter(Boolean).join(', ');
  }

  const rawNumericPrice = typeof rawItem.price === 'number'
    ? rawItem.price
    : Number(String(rawItem.price || '0').replace(/[^0-9.-]+/g, '')) || 0;

  const displayPrice = rawItem.formattedPrice ||
    (typeof rawItem.price === 'string' && rawItem.price.startsWith('₱') ? rawItem.price : null) ||
    (rawNumericPrice > 0 ? `₱${rawNumericPrice.toLocaleString()}` : 'Price on Request');

  const normalizedStatus = (rawItem.status || 'AVAILABLE').toUpperCase();

  const isPublished = rawItem.is_published !== undefined
    ? Boolean(rawItem.is_published)
    : (normalizedStatus !== 'SOLD' && normalizedStatus !== 'INACTIVE');

  const agentName = rawItem.agent_name || rawItem.agentName || rawItem.agent?.name || 'Elena Rossi';
  const agentId = rawItem.agent_id || rawItem.agentId || rawItem.createdBy || 'agent-1';

  return {
    ...rawItem,
    id: String(rawItem.id || `prop-${Date.now()}`),
    title: rawItem.title || rawItem.name || 'Prime Luxury Residence',
    tagline: rawItem.tagline || '',
    mainImage,
    images,
    location: locationString,
    location_raw: rawItem.location,
    price: displayPrice,
    price_raw: rawNumericPrice,
    formattedPrice: displayPrice,
    property_type: rawItem.property_type || rawItem.specs?.propertyType || rawItem.propertyType || 'Estate',
    propertyType: rawItem.property_type || rawItem.specs?.propertyType || rawItem.propertyType || 'Estate',
    status: normalizedStatus,
    is_published: isPublished,
    agent_id: agentId,
    agent_name: agentName,
    agent: rawItem.agent || {
      id: agentId,
      name: agentName,
      title: 'Senior Property Consultant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    beds: rawItem.beds || rawItem.specs?.beds || rawItem.bedrooms || 1,
    baths: rawItem.baths || rawItem.specs?.baths || rawItem.bathrooms || 1,
    sqft: rawItem.sqft || rawItem.specs?.sqft || rawItem.floor_area || 0,
    features: Array.isArray(rawItem.features) ? rawItem.features : [],
    listing_id: rawItem.listing_id || rawItem.listingId || `MLS-${String(rawItem.id || '').slice(0, 8).toUpperCase() || 'PH-8123'}`,
    listing_key: rawItem.listing_key || rawItem.listingKey || `KEY-${rawItem.id}`,
    standard_status: rawItem.standard_status || rawItem.standardStatus || (normalizedStatus === 'AVAILABLE' ? 'Active' : normalizedStatus === 'RESERVED' || normalizedStatus === 'UNDER CONTRACT' ? 'Active Under Contract' : normalizedStatus === 'SOLD' ? 'Closed' : normalizedStatus),
    standardStatus: rawItem.standard_status || rawItem.standardStatus || (normalizedStatus === 'AVAILABLE' ? 'Active' : normalizedStatus === 'RESERVED' || normalizedStatus === 'UNDER CONTRACT' ? 'Active Under Contract' : normalizedStatus === 'SOLD' ? 'Closed' : normalizedStatus),
    association_fee: rawItem.association_fee ?? rawItem.associationFee ?? 0,
    associationFee: rawItem.association_fee ?? rawItem.associationFee ?? 0,
    association_fee_frequency: rawItem.association_fee_frequency || rawItem.associationFeeFrequency || 'Monthly',
    associationFeeFrequency: rawItem.association_fee_frequency || rawItem.associationFeeFrequency || 'Monthly',
    tax_annual_amount: rawItem.tax_annual_amount ?? rawItem.taxAnnualAmount ?? null,
    taxAnnualAmount: rawItem.tax_annual_amount ?? rawItem.taxAnnualAmount ?? null,
    living_area: rawItem.living_area ?? rawItem.livingArea ?? rawItem.sqft ?? rawItem.specs?.livingArea ?? 100,
    livingArea: rawItem.living_area ?? rawItem.livingArea ?? rawItem.sqft ?? rawItem.specs?.livingArea ?? 100,
    living_area_units: rawItem.living_area_units || rawItem.livingAreaUnits || 'Square Meters',
    livingAreaUnits: rawItem.living_area_units || rawItem.livingAreaUnits || 'Square Meters',
    lot_size_area: rawItem.lot_size_area ?? rawItem.lotSizeArea ?? null,
    lotSizeArea: rawItem.lot_size_area ?? rawItem.lotSizeArea ?? null,
    lot_size_units: rawItem.lot_size_units || rawItem.lotSizeUnits || 'Square Meters',
    lotSizeUnits: rawItem.lot_size_units || rawItem.lotSizeUnits || 'Square Meters',
    subdivision_name: rawItem.subdivision_name || rawItem.subdivisionName || rawItem.location?.subdivisionName || '',
    subdivisionName: rawItem.subdivision_name || rawItem.subdivisionName || rawItem.location?.subdivisionName || '',
    confidential: rawItem.confidential || {
      buyerAgencyCompensation: rawItem.buyer_agency_compensation || '',
      privateRemarks: rawItem.private_remarks || '',
      showingInstructions: rawItem.showing_instructions || '',
      lockboxCode: rawItem.lockbox_code || '',
    },
    media: Array.isArray(rawItem.media) ? rawItem.media : [],
  };
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

  return {
    title: (item.title || 'Untitled Luxury Property').trim(),
    tagline: item.tagline || '',
    price: numericPrice,
    listPriceCurrency: item.listPriceCurrency || item.list_price_currency || 'PHP',
    originalListPrice: item.originalListPrice || item.original_list_price ? Number(item.originalListPrice || item.original_list_price) : numericPrice,
    associationFee: numericAssocFee,
    associationFeeFrequency: item.associationFeeFrequency || item.association_fee_frequency || 'Monthly',
    taxAnnualAmount: item.taxAnnualAmount ? Number(item.taxAnnualAmount) : undefined,
    standardStatus: item.standardStatus || item.standard_status || (item.status === 'AVAILABLE' ? 'Active' : item.status === 'UNDER CONTRACT' ? 'Active Under Contract' : item.status === 'SOLD' ? 'Closed' : 'Draft'),
    location: {
      address: item.address || item.location || 'Metro Manila',
      subdivisionName: item.subdivisionName || item.subdivision_name || '',
      city: item.city || 'Metro Manila',
      state: item.state || 'Metro Manila',
      postalCode: item.postalCode || item.postal_code || '1000',
    },
    specs: {
      beds: Number(item.bedrooms || item.beds) || 1,
      baths: Number(item.bathrooms || item.baths) || 1,
      bedroomsTotal: Number(item.bedrooms || item.beds) || 1,
      bathroomsTotalInteger: Number(item.bathrooms || item.baths) || 1,
      storiesTotal: Number(item.stories || item.stories_total) || 1,
      sqft: Number(item.livingArea || item.living_area || item.sqft) || 100,
      livingArea: Number(item.livingArea || item.living_area || item.sqft) || 100,
      livingAreaUnits: item.livingAreaUnits || item.living_area_units || 'Square Meters',
      lotSizeArea: item.lotSizeArea ? Number(item.lotSizeArea) : undefined,
      lotSizeUnits: item.lotSizeUnits || 'Square Meters',
      propertyType: item.propertyType || item.property_type || 'Estate',
      yearBuilt: item.yearBuilt ? Number(item.yearBuilt) : new Date().getFullYear(),
    },
    features: Array.isArray(item.features) ? item.features : [],
    images: item.coverImage ? [item.coverImage, ...(item.galleryImages || [])] : (item.images || []),
    confidential: {
      buyerAgencyCompensation: item.buyerAgencyCompensation || item.buyerBrokerCommission || item.confidential?.buyerAgencyCompensation || '',
      privateRemarks: item.privateRemarks || item.confidential?.privateRemarks || '',
      showingInstructions: item.showingInstructions || item.confidential?.showingInstructions || '',
      lockboxCode: item.lockboxCode || item.confidential?.lockboxCode || '',
    },
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
  }
};

export default propertyService;
