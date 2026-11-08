import { describe, it, expect } from 'vitest';
import { groupPropertiesByCoordinates, getPriceRangeText } from './groupPropertiesByCoordinates';

describe('groupPropertiesByCoordinates', () => {
  it('returns empty array when input is empty or invalid', () => {
    expect(groupPropertiesByCoordinates([])).toEqual([]);
    expect(groupPropertiesByCoordinates(null)).toEqual([]);
    expect(groupPropertiesByCoordinates(undefined)).toEqual([]);
  });

  it('preserves single properties without clustering', () => {
    const properties = [
      { id: '1', title: 'Single House', latitude: 14.55123, longitude: 121.05123, price: 5000000 }
    ];

    const result = groupPropertiesByCoordinates(properties);
    expect(result).toHaveLength(1);
    expect(result[0].isCluster).toBe(false);
    expect(result[0].count).toBe(1);
    expect(result[0].properties[0].id).toBe('1');
    expect(result[0].lat).toBeCloseTo(14.55123, 4);
    expect(result[0].lng).toBeCloseTo(121.05123, 4);
  });

  it('groups multiple properties at the exact same coordinates into one cluster', () => {
    const properties = [
      { id: 'u1', title: 'Unit 10A', building_name: 'The Grand Tower', latitude: 14.5547, longitude: 121.035, price: 4000000 },
      { id: 'u2', title: 'Unit 14B', building_name: 'The Grand Tower', latitude: 14.5547, longitude: 121.035, price: 6500000 },
      { id: 'u3', title: 'Penthouse', building_name: 'The Grand Tower', latitude: 14.5547, longitude: 121.035, price: 12000000 },
    ];

    const result = groupPropertiesByCoordinates(properties);
    expect(result).toHaveLength(1);
    expect(result[0].isCluster).toBe(true);
    expect(result[0].count).toBe(3);
    expect(result[0].title).toBe('The Grand Tower');
    expect(result[0].priceRange).toContain('₱4M - ₱12M');
    expect(result[0].properties.map(p => p.id)).toEqual(['u1', 'u2', 'u3']);
  });

  it('groups properties with near-identical coordinates (< 15 meters)', () => {
    // 0.00005 degrees latitude is approx 5.5 meters
    const properties = [
      { id: 'p1', title: 'Tower Unit 1', latitude: 14.554700, longitude: 121.035000, price: 5000000 },
      { id: 'p2', title: 'Tower Unit 2', latitude: 14.554730, longitude: 121.035040, price: 5500000 },
      { id: 'p3', title: 'Far House', latitude: 14.590000, longitude: 121.080000, price: 8000000 },
    ];

    const result = groupPropertiesByCoordinates(properties);
    expect(result).toHaveLength(2);

    const cluster = result.find(g => g.isCluster);
    const single = result.find(g => !g.isCluster);

    expect(cluster).toBeDefined();
    expect(cluster.count).toBe(2);
    expect(cluster.properties.map(p => p.id)).toEqual(['p1', 'p2']);

    expect(single).toBeDefined();
    expect(single.properties[0].id).toBe('p3');
  });

  it('handles coordinate extraction from nested fields (coords, location, lat/lng)', () => {
    const properties = [
      { id: 'a', title: 'Unit A', coords: { lat: 14.55, lng: 121.05 } },
      { id: 'b', title: 'Unit B', lat: 14.55, lng: 121.05 },
    ];

    const result = groupPropertiesByCoordinates(properties);
    expect(result).toHaveLength(1);
    expect(result[0].isCluster).toBe(true);
    expect(result[0].count).toBe(2);
  });
});

describe('getPriceRangeText', () => {
  it('formats single price properly', () => {
    expect(getPriceRangeText([5000000])).toBe('₱5M');
  });

  it('formats min and max range properly', () => {
    expect(getPriceRangeText([3500000, 7000000, 12000000])).toBe('₱3.5M - ₱12M');
  });
});

