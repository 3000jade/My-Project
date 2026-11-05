import { describe, it, expect } from 'vitest';
import {
  isLandFamily,
  isStrataFamily,
  isDwellingFamily,
  isCommercialFamily,
  isIndustrialFamily,
  getAssetFamily,
  CATEGORY_AMENITIES_MAP
} from './propertyTypeConfig';

describe('propertyTypeConfig category helpers and amenity mappings', () => {
  it('correctly classifies dwelling family', () => {
    expect(isDwellingFamily('houseAndLot')).toBe(true);
    expect(isDwellingFamily('townhouse')).toBe(true);
    expect(isDwellingFamily('condominium')).toBe(false);
  });

  it('correctly classifies strata family', () => {
    expect(isStrataFamily('condominium')).toBe(true);
    expect(isStrataFamily('houseAndLot')).toBe(false);
  });

  it('correctly classifies land family', () => {
    expect(isLandFamily('residentialLot')).toBe(true);
    expect(isLandFamily('agriculturalLot')).toBe(true);
    expect(isLandFamily('Subdivision Lot')).toBe(true);
    expect(isLandFamily('Farm / Agricultural Land')).toBe(true);
  });

  it('correctly classifies commercial family', () => {
    expect(isCommercialFamily('officeSpace')).toBe(true);
    expect(isCommercialFamily('retailStore')).toBe(true);
    expect(isCommercialFamily('commercialBuilding')).toBe(true);
  });

  it('correctly classifies industrial family', () => {
    expect(isIndustrialFamily('warehouse')).toBe(true);
    expect(isIndustrialFamily('Warehouse / Logistics Hub')).toBe(true);
  });

  it('provides tailored amenities for all categories', () => {
    expect(CATEGORY_AMENITIES_MAP.dwelling).toContain('Smart Home Automation');
    expect(CATEGORY_AMENITIES_MAP.strata).toContain('Private Balcony');
    expect(CATEGORY_AMENITIES_MAP.land).toContain('Concrete Paved Road Access');
    expect(CATEGORY_AMENITIES_MAP.commercial).toContain('100% Full Power Backup Generator');
    expect(CATEGORY_AMENITIES_MAP.industrial).toContain('3-Phase Industrial Power Supply');
  });
});

