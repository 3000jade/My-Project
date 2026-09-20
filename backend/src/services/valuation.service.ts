export interface ValuationInput {
  city: string;
  sqft: number;
  beds: number;
  baths: number;
  propertyType?: string;
  yearBuilt?: number;
  finishQuality?: 'standard' | 'luxury' | 'ultra-luxury';
}

export interface ValuationOutput {
  estimatedValue: number;
  formattedEstimatedValue: string;
  lowRange: number;
  formattedLowRange: string;
  highRange: number;
  formattedHighRange: string;
  confidenceScore: number;
  pricePerSqft: number;
  lastUpdated: string;
}

export class ValuationService {
  /**
   * Heuristic luxury valuation algorithm
   */
  public static calculateEstimate(input: ValuationInput): ValuationOutput {
    const sqft = Math.max(50, Number(input.sqft) || 250);
    const beds = Math.max(1, Number(input.beds) || 2);
    const baths = Math.max(1, Number(input.baths) || 2);

    // City baseline per sqft
    const cityRates: Record<string, number> = {
      makati: 280000,
      taguig: 260000,
      muntinlupa: 210000,
      quezon: 150000,
      pasig: 180000,
      mandaluyong: 170000,
      cebu: 140000,
    };

    const cleanCity = (input.city || '').toLowerCase().trim();
    const baseRate = cityRates[cleanCity] || 200000;

    // Quality multiplier
    let qualityFactor = 1.0;
    if (input.finishQuality === 'luxury') qualityFactor = 1.25;
    if (input.finishQuality === 'ultra-luxury') qualityFactor = 1.45;

    // Bed/bath amenity adjustment
    const amenityBonus = (beds * 0.05 + baths * 0.04) * baseRate * sqft;

    const baseCalculation = sqft * baseRate * qualityFactor + amenityBonus;
    const estimatedValue = Math.round(baseCalculation);
    const lowRange = Math.round(estimatedValue * 0.92);
    const highRange = Math.round(estimatedValue * 1.08);

    const pricePerSqft = Math.round(estimatedValue / sqft);
    const confidenceScore = cleanCity in cityRates ? 94 : 82;

    return {
      estimatedValue,
      formattedEstimatedValue: `₱${estimatedValue.toLocaleString()}`,
      lowRange,
      formattedLowRange: `₱${lowRange.toLocaleString()}`,
      highRange,
      formattedHighRange: `₱${highRange.toLocaleString()}`,
      confidenceScore,
      pricePerSqft,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default ValuationService;
