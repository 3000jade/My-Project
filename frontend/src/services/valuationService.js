// ==============================================================================
// Valuation Service
// Communicates with Express Backend RESTful API (/api/valuations)
// ==============================================================================

import apiClient from './apiClient';

export const valuationService = {
  /**
   * Request a real estate valuation estimate based on specs and location
   */
  async estimateValuation(propertyData) {
    const response = await apiClient.post('/valuations/estimate', propertyData);
    return response?.data || null;
  },
};

export default valuationService;
