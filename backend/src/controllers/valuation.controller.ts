import { Request, Response } from 'express';
import { ValuationService } from '../services/valuation.service';
import type { ApiResponse } from '../types/api';

export class ValuationController {
  /**
   * POST /api/valuations/estimate
   */
  public static estimate(req: Request, res: Response<ApiResponse>): void {
    try {
      const { city, sqft, beds, baths, propertyType, yearBuilt, finishQuality } = req.body;

      if (!city || !sqft) {
        res.status(400).json({
          success: false,
          error: 'City and sqft dimensions are required to calculate valuation.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const estimate = ValuationService.calculateEstimate({
        city,
        sqft: Number(sqft),
        beds: Number(beds) || 2,
        baths: Number(baths) || 2,
        propertyType,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        finishQuality,
      });

      res.status(200).json({
        success: true,
        data: estimate,
        message: 'Valuation estimate calculated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error generating valuation estimate.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default ValuationController;
