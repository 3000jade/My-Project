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
};

export default propertyService;
