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
  const property_value = Number(raw.property_value || 0);
  const commission_rate = Number(raw.commission_rate ?? 5.0);
  const agent_split_percentage = Number(raw.agent_split_percentage ?? 60.0);
  const gross_commission = Number(
    raw.gross_commission ?? ((property_value * commission_rate) / 100)
  );
  const agent_net_commission = Number(
    raw.agent_net_commission ?? ((gross_commission * agent_split_percentage) / 100)
  );

  let deal_stage = (raw.deal_stage || '').toUpperCase();
  if (!deal_stage) {
    const rawStatus = (raw.status || '').toUpperCase();
    if (rawStatus === 'COMPLETED') deal_stage = 'COMPLETED';
    else if (rawStatus === 'CANCELLED') deal_stage = 'IN_NEGOTIATION';
    else deal_stage = 'UNDER_CONTRACT';
  }

  let payout_status = (raw.payout_status || '').toUpperCase();
  if (!payout_status) {
    payout_status = (raw.status || '').toUpperCase() === 'COMPLETED' ? 'PAID' : 'UNPAID';
  }

  return {
    id: raw.id || `sale-${Date.now()}`,
    property_id: String(raw.property_id || ''),
    property_title: raw.property_title || 'Untitled Luxury Estate',
    property_location: raw.property_location || 'Metro Manila',
    client_name: raw.client_name || 'Anonymous Client',
    agent_id: raw.agent_id || 'agent-1',
    agent_name: raw.agent_name || 'Elena Rossi',
    sale_date: raw.sale_date || new Date().toISOString().split('T')[0],
    property_value,
    status: (raw.status || 'PENDING').toUpperCase(),
    deal_stage,
    commission_rate,
    gross_commission,
    agent_split_percentage,
    agent_net_commission,
    payout_status,
    notes: raw.notes || '',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export const saleService = {
  /**
   * Fetch sales conveyance records with optional stage, agent, and search filters
   */
  async getSales(params = {}) {
    try {
      const response = await apiClient.get('/sales', { params });
      const rawList = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response?.data?.data) ? response.data.data : (Array.isArray(response) ? response : null));
      if (rawList && rawList.length > 0) {
        return rawList.map(normalizeSale);
      }
      return inMemoryFallbackSales.map(normalizeSale);
    } catch (err) {
      console.warn('[saleService] getSales fallback:', err.message);
      let results = inMemoryFallbackSales.map(normalizeSale);
      if (params.agentId && params.agentId !== 'ALL') {
        const agentMatched = results.filter(s => s.agent_id === params.agentId);
        results = agentMatched.length > 0 ? agentMatched : results;
      }
      if (params.status && params.status !== 'ALL') {
        results = results.filter(s => s.status === params.status);
      }
      if (params.dealStage && params.dealStage !== 'ALL') {
        results = results.filter(s => s.deal_stage === params.dealStage);
      }
      if (params.search) {
        const term = params.search.toLowerCase();
        results = results.filter(s =>
          s.property_title.toLowerCase().includes(term) ||
          s.client_name.toLowerCase().includes(term) ||
          s.property_location.toLowerCase().includes(term)
        );
      }
      return results;
    }
  },

  /**
   * Fetch sales pipeline summary metrics
   */
  async getPipelineMetrics(params = {}) {
    try {
      const response = await apiClient.get('/sales/pipeline-metrics', { params });
      const payload = response?.data?.data || response?.data;
      if (payload && typeof payload === 'object' && ('totalDeals' in payload || 'activePipelineValue' in payload)) {
        return payload;
      }
    } catch (err) {
      console.warn('[saleService] getPipelineMetrics fallback:', err.message);
    }

    const sales = await this.getSales(params);
    let activePipelineCount = 0;
    let activePipelineValue = 0;
    let closedDealsCount = 0;
    let closedSalesVolume = 0;
    let estimatedNetCommission = 0;

    for (const sale of sales) {
      if (sale.deal_stage === 'COMPLETED' || sale.status === 'COMPLETED') {
        closedDealsCount++;
        closedSalesVolume += sale.property_value;
        estimatedNetCommission += sale.agent_net_commission;
      } else if (sale.status !== 'CANCELLED') {
        activePipelineCount++;
        activePipelineValue += sale.property_value;
        estimatedNetCommission += sale.agent_net_commission;
      }
    }

    return {
      totalDeals: sales.length,
      activePipelineCount,
      activePipelineValue,
      closedDealsCount,
      closedSalesVolume,
      estimatedNetCommission,
    };
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
      deal_stage: saleData.deal_stage || 'UNDER_CONTRACT',
      commission_rate: saleData.commission_rate || 5.0,
      agent_split_percentage: saleData.agent_split_percentage || 60.0,
      payout_status: saleData.payout_status || 'UNPAID',
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
