import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  projectToChatCard,
  getPublishedPropertyForChat,
  searchPublishedPropertiesForChat,
  comparePublishedPropertiesForChat,
  getPropertyNearbyForChat,
} from './chatTools.service';
import { PropertyService } from './property.service';
import { GoogleMapsService } from './googleMaps.service';

function makePublishedProperty(overrides: Record<string, any> = {}) {
  return {
    id: 'prop-101',
    title: 'The Horizon Residence',
    price: 45000000,
    formattedPrice: '₱45,000,000',
    associationFee: 15000,
    associationFeeFrequency: 'Monthly',
    mainImage: 'https://example.com/main.jpg',
    images: ['https://example.com/main.jpg', 'https://example.com/2.jpg'],
    location: {
      address: '5th Ave, BGC',
      subdivisionName: 'Bonifacio Global City',
      buildingName: 'Horizon Tower',
      city: 'Taguig',
      coordinates: { lat: 14.551, lng: 121.05 },
    },
    specs: {
      beds: 3,
      baths: 3,
      bedroomsTotal: 3,
      bathroomsTotalInteger: 3,
      livingArea: 185,
      sqft: 185,
      lotSizeArea: null,
      parkingTotal: 2,
      propertyType: 'Condominium',
      transactionType: 'For Sale',
    },
    features: ['Infinity Pool', 'Gym', 'Concierge'],
    interiorFeatures: ['Gym', 'Smart Lighting'],
    exteriorFeatures: ['Balcony'],
    publicRemarks: 'Spacious corner unit overlooking the park.',
    standardStatus: 'Active',
    status: 'available',
    isPublished: true,
    confidential: {
      privateRemarks: 'Owner relocating urgently',
      lockboxCode: '9911',
      sellerDirectPhone: '+63 917 000 1234',
      showingInstructions: 'Use service elevator',
    },
    private_remarks: 'Secret snake_case remark',
    seller_direct_phone: '+63 917 000 1234',
    lockbox_code: '9911',
    ...overrides,
  };
}

describe('chatTools.service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('projectToChatCard', () => {
    it('projects only allow-listed public fields and strips confidential data', () => {
      const prop = makePublishedProperty();
      const card = projectToChatCard(prop);

      expect(card).toEqual({
        id: 'prop-101',
        title: 'The Horizon Residence',
        city: 'Taguig',
        price: 45000000,
        formattedPrice: '₱45,000,000',
        propertyType: 'Condominium',
        transactionType: 'For Sale',
        bedrooms: 3,
        bathrooms: 3,
        floorArea: 185,
        lotArea: null,
        parking: 2,
        mainImage: 'https://example.com/main.jpg',
        status: 'Active',
      });

      const serialized = JSON.stringify(card);
      expect(serialized).not.toContain('confidential');
      expect(serialized).not.toContain('9911');
      expect(serialized).not.toContain('+63 917 000 1234');
      expect(serialized).not.toContain('Owner relocating urgently');
      expect(serialized).not.toContain('Secret snake_case remark');
    });
  });

  describe('getPublishedPropertyForChat', () => {
    it('calls PropertyService.findPropertyById in visitor mode and returns sanitized ChatPropertyDetail', async () => {
      const manyFeatures = Array.from({ length: 15 }, (_, i) => `Feature ${i + 1}`);
      manyFeatures.push('Feature 1', 'Feature 2'); // duplicates
      const longRemarks = 'A'.repeat(750);

      const prop = makePublishedProperty({
        features: manyFeatures,
        interiorFeatures: [],
        exteriorFeatures: [],
        publicRemarks: longRemarks,
      });

      const spy = vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(prop as any);

      const detail = await getPublishedPropertyForChat('  prop-101  ');

      expect(spy).toHaveBeenCalledWith('prop-101', undefined, 'visitor', undefined);
      expect(detail).not.toBeNull();
      expect(detail!.id).toBe('prop-101');
      expect(detail!.address).toBe('5th Ave, BGC');
      expect(detail!.subdivisionName).toBe('Bonifacio Global City');
      expect(detail!.buildingName).toBe('Horizon Tower');
      expect(detail!.associationFee).toBe(15000);
      expect(detail!.associationFeeFrequency).toBe('Monthly');
      expect(detail!.coordinates).toEqual({ lat: 14.551, lng: 121.05 });
      expect(detail!.features).toHaveLength(12);
      expect(new Set(detail!.features).size).toBe(12);
      expect(detail!.publicRemarks).toHaveLength(600);

      const serialized = JSON.stringify(detail);
      expect(serialized).not.toContain('9911');
      expect(serialized).not.toContain('Owner relocating urgently');
      expect(serialized).not.toContain('+63 917 000 1234');
    });

    it('rejects unpublished properties (isPublished: false or is_published: false)', async () => {
      vi.spyOn(PropertyService, 'findPropertyById')
        .mockResolvedValueOnce(makePublishedProperty({ isPublished: false }) as any)
        .mockResolvedValueOnce(makePublishedProperty({ isPublished: undefined, is_published: false }) as any);

      expect(await getPublishedPropertyForChat('prop-unpub-1')).toBeNull();
      expect(await getPublishedPropertyForChat('prop-unpub-2')).toBeNull();
    });

    it.each([
      'Draft',
      'draft',
      'Pending Approval',
      'Pending Confirmation',
      'Action Required',
      'Hold',
      'Canceled',
      'Cancelled',
      'Expired',
    ])('rejects non-public standardStatus "%s"', async (standardStatus) => {
      vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(
        makePublishedProperty({ standardStatus, isPublished: true }) as any
      );

      expect(await getPublishedPropertyForChat('prop-blocked')).toBeNull();
    });

    it('returns null for blank ID or missing property', async () => {
      const spy = vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(null);
      expect(await getPublishedPropertyForChat('   ')).toBeNull();
      expect(spy).not.toHaveBeenCalled();

      expect(await getPublishedPropertyForChat('missing-id')).toBeNull();
      expect(spy).toHaveBeenCalledWith('missing-id', undefined, 'visitor', undefined);
    });
  });

  describe('searchPublishedPropertiesForChat', () => {
    it('forwards filters in visitor mode with page=1, limit=3, filters drafts, and caps at 3 cards', async () => {
      const props = [
        makePublishedProperty({ id: 'p1', title: 'Unit 1' }),
        makePublishedProperty({ id: 'p2', title: 'Draft Unit', standardStatus: 'Draft' }),
        makePublishedProperty({ id: 'p3', title: 'Unit 3' }),
        makePublishedProperty({ id: 'p4', title: 'Unit 4' }),
        makePublishedProperty({ id: 'p5', title: 'Unit 5' }),
      ];

      const spy = vi.spyOn(PropertyService, 'findProperties').mockResolvedValue({
        properties: props as any,
        total: 10,
        page: 1,
        limit: 3,
        totalPages: 4,
      });

      const res = await searchPublishedPropertiesForChat({
        city: 'Taguig',
        minPrice: 20000000,
        maxPrice: 60000000,
        beds: 3,
        sortBy: 'price_asc',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Taguig',
          minPrice: 20000000,
          maxPrice: 60000000,
          beds: 3,
          sortBy: 'price_asc',
          page: 1,
          limit: 3,
        }),
        'visitor',
        undefined
      );

      expect(res.cards).toHaveLength(3);
      expect(res.cards.map((c) => c.id)).toEqual(['p1', 'p3', 'p4']);
      expect(res.totalMatches).toBe(9); // 10 minus the 1 filtered draft
      expect(JSON.stringify(res.cards)).not.toContain('9911');
    });
  });

  describe('comparePublishedPropertiesForChat', () => {
    it('deduplicates IDs, caps at 3, and returns null when fewer than 2 valid published properties resolve', async () => {
      vi.spyOn(PropertyService, 'findPropertyById').mockImplementation(async (id: string) => {
        if (id === 'p1') return makePublishedProperty({ id: 'p1', title: 'Prop 1' }) as any;
        if (id === 'p-draft') return makePublishedProperty({ id: 'p-draft', standardStatus: 'Draft' }) as any;
        return null;
      });

      // Duplicate single ID -> < 2 unique IDs
      expect(await comparePublishedPropertiesForChat(['p1', 'p1'])).toBeNull();

      // 1 valid + 1 draft -> < 2 valid published
      expect(await comparePublishedPropertiesForChat(['p1', 'p-draft'])).toBeNull();
    });

    it('returns properties and 9 aligned comparison rows for 2-3 valid published properties (deduped & capped at 3)', async () => {
      const spy = vi.spyOn(PropertyService, 'findPropertyById').mockImplementation(async (id: string) => {
        if (id === 'p1') return makePublishedProperty({ id: 'p1', title: 'Prop 1', formattedPrice: '₱30,000,000' }) as any;
        if (id === 'p2') return makePublishedProperty({ id: 'p2', title: 'Prop 2', formattedPrice: '₱40,000,000' }) as any;
        if (id === 'p3') return makePublishedProperty({ id: 'p3', title: 'Prop 3', formattedPrice: '₱50,000,000' }) as any;
        if (id === 'p4') return makePublishedProperty({ id: 'p4', title: 'Prop 4', formattedPrice: '₱60,000,000' }) as any;
        return null;
      });

      const table = await comparePublishedPropertiesForChat(['p1', 'p1', 'p2', 'p3', 'p4']);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(table).not.toBeNull();
      expect(table!.properties.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      expect(table!.rows.map((r) => r.label)).toEqual([
        'Price',
        'Location',
        'Type',
        'Bedrooms',
        'Bathrooms',
        'Floor Area',
        'Lot Area',
        'Parking',
        'Key Features',
      ]);
      for (const row of table!.rows) {
        expect(row.values).toHaveLength(3);
      }
      expect(table!.rows[0].values).toEqual(['₱30,000,000', '₱40,000,000', '₱50,000,000']);
    });
  });

  describe('getPropertyNearbyForChat', () => {
    it('returns null when property is not published or missing without calling GoogleMapsService', async () => {
      vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(
        makePublishedProperty({ isPublished: false }) as any
      );
      const nearbySpy = vi.spyOn(GoogleMapsService, 'suggestNearbyPlaces');
      const commuteSpy = vi.spyOn(GoogleMapsService, 'calculateCommuteMatrix');

      expect(await getPropertyNearbyForChat('prop-draft')).toBeNull();
      expect(nearbySpy).not.toHaveBeenCalled();
      expect(commuteSpy).not.toHaveBeenCalled();
    });

    it('returns landmarks and max 3 commutes when maps succeed', async () => {
      vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(makePublishedProperty() as any);
      vi.spyOn(GoogleMapsService, 'suggestNearbyPlaces').mockResolvedValue({
        highway: 'C-5 (4 mins)',
        transit: 'BGC Bus (3 mins)',
        school: 'ISM (5 mins)',
        hospital: 'St. Luke’s BGC (5 mins)',
        mall: 'High Street (4 mins)',
        nearbyPins: [],
        source: 'city_fallback',
      });
      vi.spyOn(GoogleMapsService, 'calculateCommuteMatrix').mockResolvedValue([
        { destination: 'A', destinationName: 'Hub 1', distanceText: '1.2 km', distanceMeters: 1200, durationText: '5 mins', durationSeconds: 300, mode: 'driving' },
        { destination: 'B', destinationName: 'Hub 2', distanceText: '3.4 km', distanceMeters: 3400, durationText: '12 mins', durationSeconds: 720, mode: 'driving' },
        { destination: 'C', destinationName: 'Hub 3', distanceText: '5.6 km', distanceMeters: 5600, durationText: '20 mins', durationSeconds: 1200, mode: 'driving' },
        { destination: 'D', destinationName: 'Hub 4', distanceText: '8.0 km', distanceMeters: 8000, durationText: '30 mins', durationSeconds: 1800, mode: 'driving' },
      ]);

      const summary = await getPropertyNearbyForChat('prop-101');

      expect(summary).not.toBeNull();
      expect(summary!.propertyId).toBe('prop-101');
      expect(summary!.propertyTitle).toBe('The Horizon Residence');
      expect(summary!.landmarks).toHaveLength(5);
      expect(summary!.commutes).toHaveLength(3);
      expect(summary!.unavailable).toBe(false);
    });

    it('gracefully degrades without throwing when map services fail or time out', async () => {
      vi.spyOn(PropertyService, 'findPropertyById').mockResolvedValue(makePublishedProperty() as any);
      vi.spyOn(GoogleMapsService, 'suggestNearbyPlaces').mockRejectedValue(new Error('Maps API down'));
      vi.spyOn(GoogleMapsService, 'calculateCommuteMatrix').mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      const summary = await getPropertyNearbyForChat('prop-101', 30);

      expect(summary).toEqual({
        propertyId: 'prop-101',
        propertyTitle: 'The Horizon Residence',
        landmarks: [],
        commutes: [],
        unavailable: true,
      });
    });
  });
});
