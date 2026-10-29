import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropertyFilterEngine } from '../hooks/usePropertyFilterEngine';
import { normalizeProperty, resolveCanonicalStandardStatus } from '../services/propertyService';
import { getPropertyCoordinates } from '../utils/propertyCoordinates';

// Sample mock database dataset representing rows returned from Supabase / PostgreSQL
const mockDatabaseProperties = [
  {
    id: 'db-prop-101',
    listing_id: 'MLS-2026-001',
    title: 'Aurelia Residences Sky Suite',
    transaction_type: 'For Sale',
    transactionType: 'For Sale',
    property_type: 'Condominium',
    property_type_id: 2,
    price: 125000000,
    list_price_currency: 'PHP',
    standard_status: 'Active',
    bedrooms_total: 3,
    bathrooms_total_integer: 4,
    living_area: 280,
    city: 'Taguig',
    district: 'BGC',
    location: {
      address: '5th Ave & 26th St, Bonifacio Global City, Taguig',
      city: 'Taguig',
      province: 'Metro Manila',
      postalCode: '1634',
      coordinates: { latitude: 14.5489, longitude: 121.0503 }
    },
    subdivision_name: 'Aurelia Residences',
    is_featured: true,
  },
  {
    id: 'db-prop-102',
    listing_id: 'MLS-2026-002',
    title: 'Modern Minimalist Villa Forbes Park',
    transaction_type: 'For Sale',
    transactionType: 'For Sale',
    property_type: 'House',
    property_type_id: 1,
    price: 480000000,
    list_price_currency: 'PHP',
    standard_status: 'Active Under Contract',
    bedrooms_total: 5,
    bathrooms_total_integer: 6,
    living_area: 850,
    city: 'Makati',
    district: 'Makati',
    location: {
      address: 'Cambridge Circle, Forbes Park, Makati',
      city: 'Makati',
      province: 'Metro Manila',
      postalCode: '1219',
      coordinates: { latitude: 14.5441, longitude: 121.0366 }
    },
    subdivision_name: 'Forbes Park',
    is_featured: true,
  },
  {
    id: 'db-prop-103',
    listing_id: 'MLS-2026-003',
    title: 'The Proscenium Luxury 2BR Flat',
    transaction_type: 'For Rent',
    transactionType: 'For Rent',
    property_type: 'Condominium',
    property_type_id: 2,
    price: 180000,
    list_price_currency: 'PHP',
    standard_status: 'Active',
    bedrooms_total: 2,
    bathrooms_total_integer: 2,
    living_area: 120,
    city: 'Makati',
    district: 'Makati',
    location: {
      address: 'Estrella St, Rockwell Center, Makati',
      city: 'Makati',
      province: 'Metro Manila',
      postalCode: '1200',
      coordinates: { latitude: 14.5670, longitude: 121.0365 }
    },
    subdivision_name: 'Rockwell Center',
    is_featured: false,
  },
  {
    id: 'db-prop-104',
    listing_id: 'MLS-2026-004',
    title: 'Ortigas East Masterplanned Commercial Lot',
    transaction_type: 'Pre-Selling',
    transactionType: 'Pre-Selling',
    property_type: 'Lot',
    property_type_id: 4,
    price: 75000000,
    list_price_currency: 'PHP',
    standard_status: 'Active',
    bedrooms_total: 0,
    bathrooms_total_integer: 0,
    lot_size_area: 1200,
    city: 'Pasig',
    district: 'Ortigas / Pasig',
    location: {
      address: 'E. Rodriguez Jr. Ave, Ortigas East, Pasig',
      city: 'Pasig',
      province: 'Metro Manila',
      postalCode: '1604',
      coordinates: { latitude: 14.5866, longitude: 121.0827 }
    },
    subdivision_name: 'Ortigas East',
    is_featured: false,
  }
];

describe('Database Data Validation & Normalization Engine', () => {
  it('validates database schema price invariants (> 0, numeric, and positive currency)', () => {
    mockDatabaseProperties.forEach((dbRow) => {
      const normalized = normalizeProperty(dbRow);
      expect(typeof normalized.price_raw).toBe('number');
      expect(normalized.price_raw).toBeGreaterThan(0);
      expect(normalized.listPriceCurrency || normalized.currency).toBe('PHP');
      expect(normalized.price).toBeDefined();
    });
  });

  it('validates RESO standard_status canonical alignment against database rules', () => {
    const validResoStatuses = ['Active', 'Active Under Contract', 'Pending', 'Closed', 'Draft'];

    mockDatabaseProperties.forEach((dbRow) => {
      const resolved = resolveCanonicalStandardStatus(dbRow.standard_status, dbRow.status);
      expect(validResoStatuses).toContain(resolved);
    });

    // Test legacy database status conversions
    expect(resolveCanonicalStandardStatus(null, 'available')).toBe('Active');
    expect(resolveCanonicalStandardStatus(null, 'reserved')).toBe('Active Under Contract');
    expect(resolveCanonicalStandardStatus(null, 'sold')).toBe('Closed');
    expect(resolveCanonicalStandardStatus(null, 'draft')).toBe('Draft');
  });

  it('validates geographic coordinates adhere to Philippine boundaries', () => {
    mockDatabaseProperties.forEach((dbRow) => {
      const coords = getPropertyCoordinates(dbRow);
      expect(typeof coords.lat).toBe('number');
      expect(typeof coords.lng).toBe('number');

      // Philippine geographic bounding limits
      expect(coords.lat).toBeGreaterThanOrEqual(4.0);
      expect(coords.lat).toBeLessThanOrEqual(22.0);
      expect(coords.lng).toBeGreaterThanOrEqual(116.0);
      expect(coords.lng).toBeLessThanOrEqual(127.0);
    });
  });

  it('safely normalizes incomplete or legacy database records without throwing', () => {
    const corruptedRecord = {
      id: 'corrupted-1',
      title: 'Missing Price & Coordinates',
      price: null,
      location: null,
      coordinates: undefined,
    };

    const normalized = normalizeProperty(corruptedRecord);
    expect(normalized).toBeDefined();
    expect(normalized.price_raw).toBe(0);
    expect(normalized.title).toBe('Missing Price & Coordinates');

    const coords = getPropertyCoordinates(normalized);
    expect(coords.lat).toBeDefined();
    expect(coords.lng).toBeDefined();
  });
});

describe('Functional Filter Engine Verification (Multi-Criteria Testing)', () => {
  const normalizedProperties = mockDatabaseProperties.map(normalizeProperty);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters accurately by transaction type (For Sale vs For Rent vs Pre-Selling)', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    // Initial state: 'All' returns all properties
    expect(result.current.filteredProperties.length).toBe(4);

    // Filter For Sale
    act(() => {
      result.current.setFilter('transactionType', 'For Sale');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(2);
    expect(result.current.filteredProperties.every(p => p.transactionType === 'For Sale')).toBe(true);

    // Filter For Rent
    act(() => {
      result.current.setFilter('transactionType', 'For Rent');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].id).toBe('db-prop-103');

    // Filter Pre-Selling
    act(() => {
      result.current.setFilter('transactionType', 'Pre-Selling');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].id).toBe('db-prop-104');
  });

  it('filters accurately by keyword search across title, city, and subdivision', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    // Keyword matching subdivision
    act(() => {
      result.current.setFilter('keyword', 'Rockwell');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].title).toContain('The Proscenium');

    // Keyword matching city
    act(() => {
      result.current.setFilter('keyword', 'Taguig');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].title).toContain('Aurelia Residences');
  });

  it('filters accurately by price range boundaries (minPrice and maxPrice)', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    // Filter properties between 100M and 200M
    act(() => {
      result.current.setFilter('minPrice', 100000000);
      result.current.setFilter('maxPrice', 200000000);
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].price_raw).toBe(125000000);
  });

  it('filters accurately by bedroom count', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    // Filter properties with 3 bedrooms
    act(() => {
      result.current.setFilter('beds', '3');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].bedrooms_total || result.current.filteredProperties[0].bedrooms).toBe(3);

    // Filter properties with 5 bedrooms (should match 4+)
    act(() => {
      result.current.setFilter('beds', '4+');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].bedrooms_total || result.current.filteredProperties[0].bedrooms).toBe(5);
  });

  it('filters accurately by district presets', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    // Filter BGC / Taguig
    act(() => {
      result.current.setFilter('district', 'BGC / Taguig');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].city).toBe('Taguig');

    // Filter Ortigas / Pasig
    act(() => {
      result.current.setFilter('district', 'Ortigas / Pasig');
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].city).toBe('Pasig');
  });

  it('calculates activeFilterCount correctly and supports clearFilters', () => {
    const { result } = renderHook(() => usePropertyFilterEngine(normalizedProperties));

    expect(result.current.activeFilterCount).toBe(0);

    act(() => {
      result.current.setFilter('district', 'BGC / Taguig');
      result.current.setFilter('beds', '3');
      result.current.setFilter('minPrice', 50000000);
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // 3 active filters (district, beds, price)
    expect(result.current.activeFilterCount).toBe(3);

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.activeFilterCount).toBe(0);
    // clearFilters sets transactionType to 'For Sale' by default, matching 2 properties
    expect(result.current.filteredProperties.length).toBe(2);
  });
});
