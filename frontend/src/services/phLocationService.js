/**
 * Philippine Geographic Reference Service (PSA PSGC & PHLPost Zip Codes)
 * Dataset version: PSA PSGC (Philippine Standard Geographic Code) v2024 / PHLPost
 */

import regionsData from '../data/geo/regions.json';
import provincesData from '../data/geo/provinces.json';
import citiesData from '../data/geo/cities.json';
import zipcodesData from '../data/geo/zipcodes.json';

// Dynamic cache for barangays (loaded lazily on demand)
let cachedBarangays = null;

export const phLocationService = {
  /**
   * Get all PSA PSGC Regions
   */
  getRegions() {
    return regionsData.map(r => ({
      regionCode: r.region_code,
      regionName: r.region_name,
      psgcCode: r.psgc_code,
      id: r.id,
    }));
  },

  /**
   * Get Provinces filtered by Region Code.
   * Note: For NCR (Region 13), provinces represent administrative districts or may be skipped.
   */
  getProvinces(regionCode) {
    if (!regionCode) return [];
    return provincesData
      .filter(p => p.region_code === String(regionCode))
      .map(p => ({
        provinceCode: p.province_code,
        provinceName: p.province_name,
        psgcCode: p.psgc_code,
        regionCode: p.region_code,
      }));
  },

  /**
   * Determine if a region has conventional provinces or if province is optional/inapplicable (e.g. NCR)
   */
  isProvinceApplicable(regionCode) {
    if (!regionCode) return true;
    // Region 13 is NCR (Metro Manila)
    if (String(regionCode) === '13' || String(regionCode) === '130000000') {
      return false;
    }
    const provs = this.getProvinces(regionCode);
    return provs.length > 0;
  },

  /**
   * Get Cities / Municipalities filtered by Province Code or Region Code (e.g. for NCR)
   */
  getCities({ regionCode, provinceCode }) {
    if (!regionCode && !provinceCode) return [];

    let filtered = [];
    if (provinceCode) {
      filtered = citiesData.filter(c => c.province_code === String(provinceCode));
    } else if (regionCode) {
      // In NCR or standalone, match by region_desc
      filtered = citiesData.filter(c => String(c.region_desc) === String(regionCode));
    }

    return filtered.map(c => ({
      cityCode: c.city_code,
      cityName: c.city_name,
      psgcCode: c.psgc_code,
      provinceCode: c.province_code,
      regionDesc: c.region_desc,
    }));
  },

  /**
   * Lazily loads and filters Barangays by City Code
   */
  async getBarangays(cityCode) {
    if (!cityCode) return [];

    if (!cachedBarangays) {
      const module = await import('../data/geo/barangays.json');
      cachedBarangays = module.default || module;
    }

    const matched = cachedBarangays.filter(b => b.c === String(cityCode));
    return matched.map(b => ({
      barangayCode: b.b,
      barangayName: b.n,
      psgcCode: b.b, // PSGC 9-digit / 10-digit code
      cityCode: b.c,
    }));
  },

  /**
   * Find matching ZIP code suggestions for a given City name and optional Barangay name from PHLPost reference
   */
  getZipCodeSuggestions(cityName, barangayName = '') {
    if (!cityName) return [];
    const cleanCity = cityName.toLowerCase().replace(/city of|city|\./g, '').trim();
    const cleanBrgy = (barangayName || '').toLowerCase().trim();

    const matches = zipcodesData.filter(item => {
      const area = item.area.toLowerCase();
      return area.includes(cleanCity);
    });

    if (matches.length === 0) return [];

    // Prioritize if barangay matches area
    if (cleanBrgy) {
      const brgyMatch = matches.filter(m => m.area.toLowerCase().includes(cleanBrgy));
      if (brgyMatch.length > 0) {
        return Array.from(new Set(brgyMatch.map(m => m.zip)));
      }
    }

    // Return unique suggestions
    const uniqueZips = Array.from(new Set(matches.map(m => m.zip)));
    return uniqueZips.slice(0, 10);
  },

  /**
   * Helper to format a complete Philippine unparsed address
   */
  formatUnparsedAddress({ buildingName, address, subdivisionName, barangay, city, stateOrProvince, region, postalCode }) {
    const rawParts = [];
    if (buildingName && buildingName.trim()) rawParts.push(buildingName.trim());
    if (address && address.trim()) rawParts.push(address.trim());
    if (subdivisionName && subdivisionName.trim()) rawParts.push(subdivisionName.trim());
    if (barangay && barangay.trim()) {
      const cleanBrgy = barangay.trim().replace(/^brgy\.?\s*/i, '');
      rawParts.push(`Brgy. ${cleanBrgy}`);
    }
    if (city && city.trim()) rawParts.push(city.trim());
    if (stateOrProvince && stateOrProvince.trim()) {
      rawParts.push(stateOrProvince.trim());
    } else if (region && region.trim()) {
      rawParts.push(region.trim());
    }
    if (postalCode && postalCode.trim()) rawParts.push(postalCode.trim());
    rawParts.push('Philippines');

    // Filter out duplicates and case-insensitive identical adjacent or repeated parts
    const seen = new Set();
    const parts = [];
    for (const part of rawParts) {
      const normalized = part.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        parts.push(part);
      }
    }

    return parts.join(', ');
  }
};

export default phLocationService;
