/**
 * Subdivision Map Geometry & Pre-Flight Validation Service
 * Enforces FR-016, FR-025, FR-031, FR-032, FR-033
 */

export interface Point {
  x: number;
  y: number;
}

export interface LotInput {
  id?: string;
  project_id?: string;
  plan_id?: string;
  block_number: string;
  lot_number: string;
  boundary_type?: 'SaleableLot' | 'Road' | 'Park' | 'Facility' | 'Waterway' | 'Other';
  availability_status?: 'Available' | 'Reserved' | 'Sold' | 'Unavailable';
  verified_area_sqm: number;
  price?: number | null;
  description?: string | null;
  coordinates: Point[];
  is_verified?: boolean;
}

export interface ValidationError {
  lotId?: string;
  blockNumber?: string;
  lotNumber?: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    totalLots: number;
    saleableLots: number;
    unverifiedCount: number;
    totalAreaSqm: number;
  };
}

export class SubdivisionValidationService {
  /**
   * Calculates the enclosed area of a polygon using the Shoelace formula.
   * Works on any 2D coordinates.
   */
  calculateShoelaceArea(points: Point[]): number {
    if (!points || points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Helper: checks if orientation of triplet (p, q, r) is collinear (0), clockwise (1), or counterclockwise (2)
   */
  private orientation(p: Point, q: Point, r: Point): number {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(val) < 1e-9) return 0; // collinear
    return val > 0 ? 1 : 2; // clockwise or counterclockwise
  }

  /**
   * Helper: checks if point q lies on segment pr
   */
  private onSegment(p: Point, q: Point, r: Point): boolean {
    return (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    );
  }

  /**
   * Checks if segment p1q1 and segment p2q2 intersect strictly
   */
  private doSegmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
    const o1 = this.orientation(p1, q1, p2);
    const o2 = this.orientation(p1, q1, q2);
    const o3 = this.orientation(p2, q2, p1);
    const o4 = this.orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) {
      return true;
    }

    // Special cases
    if (o1 === 0 && this.onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && this.onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && this.onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && this.onSegment(p2, q1, q2)) return true;

    return false;
  }

  /**
   * Checks if a polygon contains any self-intersecting edges
   */
  hasSelfIntersection(points: Point[]): boolean {
    const n = points.length;
    if (n < 4) return false; // Triangles cannot self-intersect

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const q1 = points[(i + 1) % n];

      // Check against all other non-adjacent edges
      for (let j = i + 1; j < n; j++) {
        // Skip adjacent edges and the wrap-around closing edge
        if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) {
          continue;
        }

        const p2 = points[j];
        const q2 = points[(j + 1) % n];

        if (this.doSegmentsIntersect(p1, q1, p2, q2)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Comprehensive Pre-Flight Validation for Draft Lots
   */
  validateDraft(lots: LotInput[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const blockLotMap = new Set<string>();

    let totalAreaSqm = 0;
    let unverifiedCount = 0;
    let saleableLots = 0;

    lots.forEach((lot, index) => {
      const lotRef = `Block ${lot.block_number || '?'}, Lot ${lot.lot_number || '?'}`;
      const isSaleable = (lot.boundary_type || 'SaleableLot') === 'SaleableLot';

      if (isSaleable) saleableLots++;

      // 1. Check coordinates minimum length (FR-031)
      if (!lot.coordinates || lot.coordinates.length < 3) {
        errors.push({
          lotId: lot.id,
          blockNumber: lot.block_number,
          lotNumber: lot.lot_number,
          code: 'INCOMPLETE_POLYGON',
          message: `${lotRef}: Polygon must have at least 3 vertices (found ${lot.coordinates ? lot.coordinates.length : 0}).`,
          severity: 'error',
        });
      } else {
        // 2. Check for self-intersection (FR-031)
        if (this.hasSelfIntersection(lot.coordinates)) {
          errors.push({
            lotId: lot.id,
            blockNumber: lot.block_number,
            lotNumber: lot.lot_number,
            code: 'SELF_INTERSECTING_BOUNDARY',
            message: `${lotRef}: Boundary polygon edges cross or self-intersect. Please adjust vertex handles.`,
            severity: 'error',
          });
        }
      }

      // 3. Enforce Unique Block and Lot combination (FR-025)
      const blockStr = (lot.block_number || '').trim().toUpperCase();
      const lotStr = (lot.lot_number || '').trim().toUpperCase();

      if (!blockStr || !lotStr) {
        errors.push({
          lotId: lot.id,
          blockNumber: lot.block_number,
          lotNumber: lot.lot_number,
          code: 'MISSING_IDENTIFIER',
          message: `Lot shape #${index + 1} is missing Block Number or Lot Number.`,
          severity: 'error',
        });
      } else {
        const key = `${blockStr}:${lotStr}`;
        if (blockLotMap.has(key)) {
          errors.push({
            lotId: lot.id,
            blockNumber: lot.block_number,
            lotNumber: lot.lot_number,
            code: 'DUPLICATE_BLOCK_LOT',
            message: `Duplicate identifier detected: Block ${blockStr}, Lot ${lotStr} is assigned multiple times.`,
            severity: 'error',
          });
        } else {
          blockLotMap.add(key);
        }
      }

      // 4. Check Area Consistency (FR-024)
      const area = Number(lot.verified_area_sqm);
      if (isNaN(area) || area <= 0) {
        errors.push({
          lotId: lot.id,
          blockNumber: lot.block_number,
          lotNumber: lot.lot_number,
          code: 'INVALID_AREA',
          message: `${lotRef}: Verified area must be a positive number greater than 0 sqm.`,
          severity: 'error',
        });
      } else {
        totalAreaSqm += area;
      }

      // 5. Hard Safety Gate: Unverified AI boundaries block publication (FR-016, FR-033)
      if (lot.is_verified === false) {
        unverifiedCount++;
        errors.push({
          lotId: lot.id,
          blockNumber: lot.block_number,
          lotNumber: lot.lot_number,
          code: 'UNVERIFIED_AI_BOUNDARY',
          message: `${lotRef}: AI-generated boundary must be reviewed and marked verified before publishing.`,
          severity: 'error',
        });
      }

      // 6. Pricing warnings for saleable lots
      if (isSaleable && (lot.price === null || lot.price === undefined || Number(lot.price) <= 0)) {
        warnings.push({
          lotId: lot.id,
          blockNumber: lot.block_number,
          lotNumber: lot.lot_number,
          code: 'UNPRICED_SALEABLE_LOT',
          message: `${lotRef}: Asking price is not set for this saleable lot.`,
          severity: 'warning',
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalLots: lots.length,
        saleableLots,
        unverifiedCount,
        totalAreaSqm: Number(totalAreaSqm.toFixed(2)),
      },
    };
  }
}

export const subdivisionValidationService = new SubdivisionValidationService();
