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
      furnishing: 'Semi-Furnished',
      lot_frontage: '18m',
      floor_level: '2nd Floor',
      tower_name: 'Pavilion North',
    };

    const normalized = normalizeProperty(rawDbRecord);

    expect(normalized.id).toBe('prop-uuid-123');
    expect(normalized.listing_id).toBe('MLS-PH-8123');
    expect(normalized.cadastralLotId).toBe('KEY-1234');
    expect(normalized.standard_status).toBe('Active');
    expect(normalized.living_area).toBe(850);
    expect(normalized.association_fee).toBe(12500);
    expect(normalized.subdivision_name).toBe('Ayala Alabang Village');
    expect(normalized.price_raw).toBe(185000000);
    expect(normalized.furnishing).toBe('Semi-Furnished');
    expect(normalized.lot_frontage).toBe('18m');
    expect(normalized.floor_level).toBe('2nd Floor');
    expect(normalized.tower_name).toBe('Pavilion North');
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
      taxAnnualAmount: 45000,
      yearBuilt: 2024,
      propertyCondition: 'RFO',
      transactionType: 'For Sale',
      interiorFeatures: ['Smart Home Automation', 'Wine Cellar'],
      exteriorFeatures: ['Private Swimming Pool', 'Covered Garage'],
      amenities: ['24/7 Security'],
      coverImage: 'https://images.unsplash.com/photo-1.jpg',
      galleryImages: ['https://images.unsplash.com/photo-2.jpg'],
      cadastralLotId: 'CAD-MAK-4821',
      furnishing: 'Fully Furnished',
      lot_frontage: '25m',
      floor_level: '45th Floor',
      tower_name: 'Tower One',
      buyerBrokerCommission: '3.0%',
      sellerDirectPhone: '+63 917 123 4567',
      privateRemarks: 'Lockbox code 4821. Call broker before showing.',
      latitude: '14.5501',
      longitude: '121.0502',
    };

    const payload = toApiPayload(studioFormState);

    expect(payload.title).toBe('Grand Penthouse Horizon');
    expect(payload.price).toBe(250000000);
    expect(payload.listingKey).toBe('CAD-MAK-4821');
    expect(payload.standardStatus).toBe('Pending Approval');
    expect(payload.location.city).toBe('Makati');
    expect(payload.location.subdivisionName).toBe('Forbes Park');
    expect(payload.location.towerName).toBe('Tower One');
    expect(payload.location.coordinates).toEqual({ lat: 14.5501, lng: 121.0502 });
    expect(payload.specs.beds).toBe(4);
    expect(payload.specs.livingArea).toBe(620);
    expect(payload.specs.yearBuilt).toBe(2024);
    expect(payload.specs.propertyCondition).toBe('RFO');
    expect(payload.specs.furnishing).toBe('Fully Furnished');
    expect(payload.specs.lotFrontage).toBe('25m');
    expect(payload.specs.floorLevel).toBe('45th Floor');
    expect(payload.specs.transactionType).toBe('For Sale');
    expect(payload.associationFee).toBe(25000);
    expect(payload.taxAnnualAmount).toBe(45000);
    expect(payload.customResoAttributes.cadastralLotId).toBe('CAD-MAK-4821');
    expect(payload.customResoAttributes.furnishing).toBe('Fully Furnished');
    expect(payload.customResoAttributes.lotFrontage).toBe('25m');
    expect(payload.interiorFeatures).toEqual(['Smart Home Automation', 'Wine Cellar']);
    expect(payload.exteriorFeatures).toEqual(['Private Swimming Pool', 'Covered Garage']);
    expect(payload.features).toEqual(['24/7 Security']);
    expect(payload.images).toEqual([
      'https://images.unsplash.com/photo-1.jpg',
      'https://images.unsplash.com/photo-2.jpg',
    ]);
    expect(payload.confidential.buyerAgencyCompensation).toBe('3.0%');
    expect(payload.confidential.sellerDirectPhone).toBe('+63 917 123 4567');
    expect(payload.confidential.privateRemarks).toContain('Lockbox code 4821');
  });

  it('correctly serializes Section 6 Media & Documentation items (Photos, FloorPlans, Videos, VirtualTours, Documents)', () => {
    const rawMediaState = {
      title: 'Modern Architecture Pavilion',
      price: '85000000',
      property_images: [
        { imageUrl: 'https://images.unsplash.com/photo-1.jpg', displayOrder: 1 },
        { imageUrl: 'https://images.unsplash.com/photo-2.jpg', displayOrder: 2 },
      ],
      media: [
        {
          mediaUrl: 'https://images.unsplash.com/photo-1.jpg',
          mediaCategory: 'Photo',
          orderIndex: 1,
          shortDescription: 'Primary Architectural Facade',
          mimeType: 'image/jpeg',
        },
        {
          mediaUrl: 'https://drive.google.com/file/d/sample-blueprint/view',
          mediaCategory: 'FloorPlan',
          orderIndex: 2,
          shortDescription: 'Ground Level Blueprint',
          mimeType: 'application/pdf',
        },
        {
          mediaUrl: 'https://www.youtube.com/watch?v=droneTour',
          mediaCategory: 'Video',
          orderIndex: 3,
          shortDescription: 'Aerial Drone Tour',
          mimeType: 'video/mp4',
        },
        {
          mediaUrl: 'https://my.matterport.com/show/?m=sampleMatterport',
          mediaCategory: 'VirtualTour',
          orderIndex: 4,
          shortDescription: '3D Matterport Digital Twin',
          mimeType: 'text/html',
        },
        {
          mediaUrl: 'https://drive.google.com/file/d/sample-cct-title/view',
          mediaCategory: 'Document',
          orderIndex: 5,
          shortDescription: 'Certified Condominium Certificate of Title',
          mimeType: 'application/pdf',
        },
      ],
    };

    const payload = toApiPayload(rawMediaState);

    expect(payload.propertyImages).toHaveLength(2);
    expect(payload.propertyImages[0].imageUrl).toBe('https://images.unsplash.com/photo-1.jpg');
    expect(payload.media).toBeDefined();
    expect(payload.media).toHaveLength(5);

    const categories = payload.media.map(m => m.mediaCategory);
    expect(categories).toEqual(['Photo', 'FloorPlan', 'Video', 'VirtualTour', 'Document']);

    const floorPlan = payload.media.find(m => m.mediaCategory === 'FloorPlan');
    expect(floorPlan.mediaUrl).toBe('https://drive.google.com/file/d/sample-blueprint/view');
    expect(floorPlan.mimeType).toBe('application/pdf');

    const video = payload.media.find(m => m.mediaCategory === 'Video');
    expect(video.mediaUrl).toContain('youtube.com');

    const virtualTour = payload.media.find(m => m.mediaCategory === 'VirtualTour');
    expect(virtualTour.mediaUrl).toContain('matterport.com');

    const document = payload.media.find(m => m.mediaCategory === 'Document');
    expect(document.shortDescription).toBe('Certified Condominium Certificate of Title');
  });

  it('populates corporate brokerage desk contact fallback when property is unassigned', () => {
    const unassignedProperty = {
      id: 'prop-unassigned-123',
      title: 'Bonifacio Global City Modern Loft',
      price: 45000000,
      agent_id: null,
      agent_name: null,
      list_agent_key: null,
    };

    const normalized = normalizeProperty(unassignedProperty);

    expect(normalized.isCorporateDesk).toBe(true);
    expect(normalized.is_corporate_desk).toBe(true);
    expect(normalized.agent_name).toBe('Human Shelter Realty Desk');
    expect(normalized.agentName).toBe('Human Shelter Realty Desk');
    expect(normalized.agentPhone).toBe('+63 2 8888 0000');
    expect(normalized.agentEmail).toBe('inquiries@humanshelterrealty.com');
    expect(normalized.agent).toEqual({
      id: null,
      name: 'Human Shelter Realty Desk',
      title: 'Corporate Brokerage Desk',
      brokerage: 'Human Shelter Realty',
      phone: '+63 2 8888 0000',
      email: 'inquiries@humanshelterrealty.com',
      isCorporateDesk: true,
    });
  });
});
