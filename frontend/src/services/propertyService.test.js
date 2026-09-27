import { describe, it, expect } from 'vitest';
import { normalizeProperty, toApiPayload } from './propertyService';

describe('propertyService RESO 2.0 Adapters', () => {
  it('normalizes raw database record with RESO 2.0 fields', () => {
    const rawDbRecord = {
      id: 'prop-uuid-123',
      listing_key: 'KEY-1234',
      listing_id: 'MLS-PH-8123',
      title: 'Ayala Alabang Contemporary Villa',
      price: 185000000,
      standard_status: 'Active',
      status: 'available',
      living_area: 850,
      living_area_units: 'Square Meters',
      association_fee: 12500,
      association_fee_frequency: 'Monthly',
      subdivision_name: 'Ayala Alabang Village',
      city: 'Muntinlupa',
      beds: 5,
      baths: 6,
    };

    const normalized = normalizeProperty(rawDbRecord);

    expect(normalized.id).toBe('prop-uuid-123');
    expect(normalized.listing_id).toBe('MLS-PH-8123');
    expect(normalized.standard_status).toBe('Active');
    expect(normalized.living_area).toBe(850);
    expect(normalized.association_fee).toBe(12500);
    expect(normalized.subdivision_name).toBe('Ayala Alabang Village');
    expect(normalized.price_raw).toBe(185000000);
  });

  it('converts flat studio form state into structured API payload (toApiPayload)', () => {
    const studioFormState = {
      title: 'Grand Penthouse Horizon',
      price: '250000000',
      standardStatus: 'Pending Approval',
      location: '88 Cambridge Circle',
      city: 'Makati',
      subdivisionName: 'Forbes Park',
      bedrooms: 4,
      bathrooms: 5,
      livingArea: 620,
      livingAreaUnits: 'Square Meters',
      associationFee: 25000,
      coverImage: 'https://images.unsplash.com/photo-1.jpg',
      galleryImages: ['https://images.unsplash.com/photo-2.jpg'],
      buyerBrokerCommission: '3.0%',
      privateRemarks: 'Lockbox code 4821. Call broker before showing.',
    };

    const payload = toApiPayload(studioFormState);

    expect(payload.title).toBe('Grand Penthouse Horizon');
    expect(payload.price).toBe(250000000);
    expect(payload.standardStatus).toBe('Pending Approval');
    expect(payload.location.city).toBe('Makati');
    expect(payload.location.subdivisionName).toBe('Forbes Park');
    expect(payload.specs.beds).toBe(4);
    expect(payload.specs.livingArea).toBe(620);
    expect(payload.associationFee).toBe(25000);
    expect(payload.images).toEqual([
      'https://images.unsplash.com/photo-1.jpg',
      'https://images.unsplash.com/photo-2.jpg',
    ]);
    expect(payload.confidential.buyerAgencyCompensation).toBe('3.0%');
    expect(payload.confidential.privateRemarks).toContain('Lockbox code 4821');
  });
});
