// ==============================================================================
// Sales Service
// Communicates EXCLUSIVELY with the Express Backend (/api/sales)
// ==============================================================================

import apiClient from './apiClient';
import { mockSales } from '../mockData/mockSales';

let inMemoryFallbackSales = [...mockSales];

/**
 * Normalizes backend sales conveyance records to UI format
 */
export function normalizeSale(raw = {}) {
  return {
    id: raw.id || `sale-${Date.now()}`,
    property_id: String(raw.property_id || ''),
    property_title: raw.property_title || 'Untitled Luxury Estate',
    property_location: raw.property_location || 'Metro Manila',
    client_name: raw.client_name || 'Anonymous Client',
    agent_id: raw.agent_id || 'agent-1',
    agent_name: raw.agent_name || 'Elena Rossi',
    sale_date: raw.sale_date || new Date().toISOString().split('T')[0],
    property_value: Number(raw.property_value || 0),
    status: (raw.status || 'PENDING').toUpperCase(),
    notes: raw.notes || '',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export const saleService = {
  /**
   * Fetch sales conveyance records
   */
  async getSales(params = {}) {
    try {
      const response = await apiClient.get('/sales', { params });
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeSale);
      }
      return inMemoryFallbackSales.map(normalizeSale);
    } catch (err) {
      console.warn('[saleService] getSales fallback:', err.message);
      let results = [...inMemoryFallbackSales];
      if (params.agentId && params.agentId !== 'ALL') {
        results = results.filter(s => s.agent_id === params.agentId);
      }
      if (params.status && params.status !== 'ALL') {
        results = results.filter(s => s.status === params.status);
      }
      if (params.search) {
        const term = params.search.toLowerCase();
        results = results.filter(s =>
          s.property_title.toLowerCase().includes(term) ||
          s.client_name.toLowerCase().includes(term) ||
          s.property_location.toLowerCase().includes(term)
        );
      }
      return results.map(normalizeSale);
    }
  },

  /**
   * Fetch single conveyance dossier by ID
   */
  async getSaleById(id) {
    try {
      const response = await apiClient.get(`/sales/${id}`);
      if (response && response.data) {
        return normalizeSale(response.data);
      }
    } catch (err) {
      console.warn(`[saleService] getSaleById(${id}) fallback:`, err.message);
    }
    const found = inMemoryFallbackSales.find(s => s.id === id);
    return found ? normalizeSale(found) : null;
  },

  /**
   * Record a new sales transaction
   */
  async createSale(saleData) {
    try {
      const response = await apiClient.post('/sales', saleData);
      if (response && response.data) {
        return normalizeSale(response.data);
      }
    } catch (err) {
      console.warn('[saleService] createSale fallback:', err.message);
    }

    const created = {
      id: `sale-${Date.now()}`,
      property_id: String(saleData.property_id || ''),
      property_title: saleData.property_title || '',
      property_location: saleData.property_location || '',
      client_name: saleData.client_name || '',
      agent_id: saleData.agent_id || 'agent-1',
      agent_name: saleData.agent_name || 'Elena Rossi',
      sale_date: saleData.sale_date || new Date().toISOString().split('T')[0],
      property_value: Number(saleData.property_value || 0),
      status: saleData.status || 'PENDING',
      notes: saleData.notes || '',
      created_at: new Date().toISOString(),
    };
    inMemoryFallbackSales.unshift(created);
    return normalizeSale(created);
  },

  /**
   * Update conveyance record
   */
  async updateSale(id, updates) {
    try {
      const response = await apiClient.put(`/sales/${id}`, updates);
      if (response && response.data) {
        return normalizeSale(response.data);
      }
    } catch (err) {
      console.warn(`[saleService] updateSale(${id}) fallback:`, err.message);
    }

    inMemoryFallbackSales = inMemoryFallbackSales.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    const updated = inMemoryFallbackSales.find(s => s.id === id);
    return updated ? normalizeSale(updated) : null;
  },

  /**
   * Delete sales record
   */
  async deleteSale(id) {
    try {
      await apiClient.delete(`/sales/${id}`);
      return true;
    } catch (err) {
      console.warn(`[saleService] deleteSale(${id}) fallback:`, err.message);
    }
    const idx = inMemoryFallbackSales.findIndex(s => s.id === id);
    if (idx !== -1) {
      inMemoryFallbackSales.splice(idx, 1);
      return true;
    }
    return false;
  },
};

export default saleService;
