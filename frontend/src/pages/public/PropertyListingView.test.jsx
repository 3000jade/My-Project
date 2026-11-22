import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PropertyListingView from './PropertyListingView';

describe('PropertyListingView - RESO Schema Integrity & Compliance', () => {
  it('renders standard RESO fields for a fully populated listing', () => {
    render(
      <MemoryRouter initialEntries={['/properties/reso-fixture-101']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    // 1. RESO Schema Integrity Checks
    expect(screen.getByTestId('reso-standard-status')).toHaveTextContent('Active');
    expect(screen.getByTestId('reso-listing-id')).toHaveTextContent('RESO-2026-0042');
    expect(screen.getByTestId('reso-bedrooms')).toHaveTextContent('4');
    expect(screen.getByTestId('reso-bathrooms')).toHaveTextContent('3');
    expect(screen.getByTestId('reso-living-area')).toHaveTextContent('245.5 sqm');
    expect(screen.getByTestId('reso-lot-size')).toHaveTextContent('320 sqm');
    expect(screen.getByTestId('reso-hoa-fee')).toHaveTextContent('₱12,500');
    expect(screen.getByTestId('reso-year-built')).toHaveTextContent('2024');
    expect(screen.getByTestId('reso-public-remarks')).toHaveTextContent(/Bauhaus-inspired residence/i);
    expect(screen.getByTestId('reso-list-price')).toHaveTextContent('₱18,500,000');
    expect(screen.getByTestId('reso-list-office-name')).toHaveTextContent('Nordic Architectural Realty Group');
    expect(screen.getByTestId('reso-unit-number')).toHaveTextContent('Penthouse A');

    // 2. Compliance & Redaction Checks - STRICT
    const bodyText = document.body.textContent;
    expect(bodyText).not.toContain('CONFIDENTIAL: Gate code');
    expect(bodyText).not.toContain('#4829');
    expect(bodyText).not.toContain('Lockbox located behind gas meter');
    expect(bodyText).not.toContain('9921');
  });

  it('handles edge case null attributes without runtime errors or undefined/NaN output', () => {
    render(
      <MemoryRouter initialEntries={['/properties/reso-fixture-edge']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    // Check that StandardStatus handles compound status
    expect(screen.getByTestId('reso-standard-status')).toHaveTextContent('Active Under Contract');
    expect(screen.getByTestId('reso-listing-id')).toHaveTextContent('RESO-EDGE-001');

    // Null safety: verify no "undefined" or "NaN" rendered in DOM
    const bodyText = document.body.textContent;
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('Unit: undefined');
    expect(bodyText).not.toContain('₱NaN');

    // Redaction check for secret edge-case remarks
    expect(bodyText).not.toContain('SECRET: Do not disclose');
    expect(bodyText).not.toContain('1234 on door handle');
  });

  it('renders canonical TypeScript Property contract with object location and nested specs', async () => {
    // Dynamically mock propertyService.getPropertyById
    const { propertyService } = await import('../../services/propertyService');
    const mockCanonicalProperty = {
      id: 'canonical-ts-001',
      listingKey: 'CANONICAL-KEY-1',
      listingId: 'MLS-CANONICAL-99',
      title: 'Nordic Glass Penthouse',
      price: 28500000,
      formattedPrice: '₱28,500,000',
      standardStatus: 'Active',
      location: {
        address: '128 Valero Street',
        subdivisionName: 'Salcedo Village',
        city: 'Makati City',
        state: 'Metro Manila'
      },
      specs: {
        beds: 3,
        baths: 4,
        livingArea: 310,
        livingAreaUnits: 'sqm',
        lotSizeArea: 350,
        lotSizeUnits: 'sqm',
        yearBuilt: 2025
      },
      associationFee: 15000,
      publicRemarks: 'A pristine glass penthouse in the heart of Makati.',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9']
    };

    const spy = vi.spyOn(propertyService, 'getPropertyById').mockResolvedValue(mockCanonicalProperty);

    render(
      <MemoryRouter initialEntries={['/properties/canonical-ts-001']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for effect to hydrate property
    const statusElem = await screen.findByTestId('reso-standard-status');
    expect(statusElem).toHaveTextContent('Active');
    expect(screen.getByTestId('reso-listing-id')).toHaveTextContent('MLS-CANONICAL-99');
    expect(screen.getByTestId('reso-bedrooms')).toHaveTextContent('3');
    expect(screen.getByTestId('reso-bathrooms')).toHaveTextContent('4');
    expect(screen.getByTestId('reso-living-area')).toHaveTextContent('310 sqm');
    expect(screen.getByTestId('reso-year-built')).toHaveTextContent('2025');

    // Verify object location rendered as formatted string without throwing
    expect(document.body.textContent).toContain('128 Valero Street, Salcedo Village, Makati City, Metro Manila');

    spy.mockRestore();
  });

  it('adapts brochure specs for Studio condos and Vacant Lots using Create Listing fields', async () => {
    const { propertyService } = await import('../../services/propertyService');
    const spy = vi.spyOn(propertyService, 'getPropertyById').mockResolvedValueOnce({
      id: 'studio-condo-1',
      listing_id: 'HSR-STUDIO-01',
      title: 'Bright Studio at Rockwell',
      transaction_type: 'For Rent',
      property_type: 'Condominium',
      price: 45000,
      city: 'Makati',
      bedrooms_total: 0,
      bathrooms_total_integer: 1,
      living_area: 36,
      living_area_units: 'sqm',
      custom_reso_attributes: {
        propertyCategory: 'Residential',
        propertyStatus: 'Pre-Selling',
        turnoverDate: 'Q4 2027',
        credentials: { titleStatus: 'Clean Title' },
      },
      images: ['https://example.com/studio.jpg'],
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/properties/studio-condo-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('reso-bedrooms')).toHaveTextContent('Studio');
    expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByLabelText('Brochure Sections')).toBeInTheDocument();
    expect(screen.getByText('Q4 2027')).toBeInTheDocument();
    unmount();

    spy.mockResolvedValueOnce({
      id: 'vacant-lot-1',
      listing_id: 'HSR-LOT-01',
      title: 'Corner Lot in Nuvali',
      transaction_type: 'For Sale',
      property_type: 'Vacant Lot',
      price: 11880000,
      city: 'Calamba',
      lot_size_area: 330,
      lot_size_units: 'sqm',
      custom_reso_attributes: {
        propertyCategory: 'Land',
        credentials: { titleStatus: 'Clean Title' },
      },
      images: ['https://example.com/lot.jpg'],
    });

    render(
      <MemoryRouter initialEntries={['/properties/vacant-lot-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('reso-lot-size')).toHaveTextContent('330 sqm');
    expect(screen.queryByTestId('reso-bedrooms')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reso-bathrooms')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reso-living-area')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it('places status and price on hero gallery, keeps title and tagline in details, and moves actions to separate agent card alongside Step 4 sections', async () => {
    const { propertyService } = await import('../../services/propertyService');
    const spy = vi.spyOn(propertyService, 'getPropertyById').mockResolvedValueOnce({
      id: 'media-rich-1',
      listing_id: 'HSR-MEDIA-01',
      title: 'Gallery Villa',
      transaction_type: 'For Sale',
      property_type: 'House & Lot',
      standard_status: 'Active',
      price: 25000000,
      city: 'Makati',
      bedrooms_total: 3,
      bathrooms_total_integer: 2,
      living_area: 200,
      living_area_units: 'sqm',
      media: [
        {
          mediaUrl: 'https://example.com/cover.jpg',
          mediaCategory: 'Photo',
          galleryCategory: 'Cover',
          orderIndex: 1,
        },
        {
          mediaUrl: 'https://example.com/living.jpg',
          mediaCategory: 'Photo',
          galleryCategory: 'Living',
          shortDescription: 'Double-height ceiling with sunlit windows',
          orderIndex: 2,
        },
        {
          mediaUrl: 'https://example.com/floorplan.jpg',
          mediaCategory: 'FloorPlan',
          galleryCategory: 'FloorPlan',
          shortDescription: 'Ground and second floor layout',
          orderIndex: 3,
        },
        {
          mediaUrl: 'https://example.com/living-tour.mp4',
          mediaCategory: 'Video',
          galleryCategory: 'Living',
          shortDescription: 'Living room walkthrough',
          orderIndex: 4,
        },
      ],
      custom_reso_attributes: {
        propertyCategory: 'Residential',
        tagline: 'Sunlit corner villa near Greenbelt',
        categoryDescriptions: {
          Living: '<p>Spacious open living area facing the garden.</p>',
        },
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/media-rich-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    const hero = await screen.findByLabelText('Property Hero Gallery');
    expect(hero).toHaveTextContent('Selling Price');
    expect(hero).toHaveTextContent('₱25,000,000');
    expect(hero).toHaveTextContent('For Sale');
    expect(hero).toHaveTextContent('Active');
    expect(hero).not.toHaveTextContent('Schedule Viewing');
    expect(hero).not.toHaveTextContent('Inquire Now');
    expect(hero).not.toHaveTextContent('Property Contact');

    const detailsSection = container.querySelector('#sec-details');
    expect(detailsSection).toBeInTheDocument();
    expect(detailsSection).toHaveTextContent('Gallery Villa');
    expect(detailsSection).toHaveTextContent('Sunlit corner villa near Greenbelt');
    expect(detailsSection).not.toHaveTextContent('Selling Price');
    expect(detailsSection).not.toHaveTextContent('Schedule Viewing');
    expect(detailsSection).not.toHaveTextContent('Inquire Now');

    const agentSection = container.querySelector('#sec-agent');
    expect(agentSection).toBeInTheDocument();
    expect(agentSection).toHaveTextContent('Property Contact');
    expect(agentSection).toHaveTextContent('Schedule Viewing');
    expect(agentSection).toHaveTextContent('Inquire Now');

    expect(screen.getByRole('heading', { name: /Room Gallery & Videos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Floor Plan/i })).toBeInTheDocument();
    expect(screen.getByText('Spacious open living area facing the garden.')).toBeInTheDocument();
    expect(screen.getByText('Double-height ceiling with sunlit windows')).toBeInTheDocument();
    expect(screen.getByText('Living room walkthrough')).toBeInTheDocument();
    expect(screen.getByText('Ground and second floor layout')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders Pricing & Partnered Banks and Developer Description from custom_reso_attributes', async () => {
    const { propertyService } = await import('../../services/propertyService');
    const spy = vi.spyOn(propertyService, 'getPropertyById').mockResolvedValueOnce({
      id: 'banks-prop-1',
      title: 'Alabang Courtyard Home',
      price: 45000000,
      property_type: 'House & Lot',
      custom_reso_attributes: {
        pricePerSqm: '125,000',
        partneredBanks: [
          { bankName: 'BDO Unibank (Banco de Oro)', logoUrl: 'https://example.com/bdo.png' },
          { bankName: 'Pag-IBIG Fund (HDMF)', logoUrl: '' },
        ],
        paymentBreakdown: {
          reservationFee: '100000',
          downpayment: '20%',
          downpaymentTerm: '12 Months',
          loanableAmount: '36000000',
        },
        credentials: {
          developer: 'Ayala Land Premier',
          developerDescription: '<p>Master-planned residential community builder.</p>',
        },
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/banks-prop-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Pricing & Partnered Banks')).toBeInTheDocument();
    const paymentSection = container.querySelector('#sec-payment');
    expect(paymentSection).toHaveTextContent('Price per Sqm');
    expect(paymentSection).toHaveTextContent('125,000');
    expect(paymentSection).toHaveTextContent('Loanable Amount');
    expect(paymentSection).toHaveTextContent('36,000,000');
    expect(screen.getByText('BDO Unibank (Banco de Oro)')).toBeInTheDocument();
    expect(screen.getByAltText('BDO Unibank (Banco de Oro)')).toHaveAttribute(
      'src',
      'https://example.com/bdo.png'
    );
    expect(screen.getByText('Pag-IBIG Fund (HDMF)')).toBeInTheDocument();
    expect(screen.getByText('Developer Description')).toBeInTheDocument();
    expect(screen.getByText('Master-planned residential community builder.')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('hides bedroom chip when bedrooms_total is 0 for non-Studio/Condominium types', async () => {
    const { propertyService } = await import('../../services/propertyService');
    const spy = vi.spyOn(propertyService, 'getPropertyById').mockResolvedValueOnce({
      id: 'commercial-zero-beds-1',
      listing_id: 'HSR-COMM-01',
      title: 'BGC Retail Ground Unit',
      transaction_type: 'For Lease',
      property_type: 'Commercial Space',
      price: 180000,
      city: 'Taguig',
      bedrooms_total: 0,
      bathrooms_total_integer: 1,
      living_area: 120,
      living_area_units: 'sqm',
      images: ['https://example.com/commercial.jpg'],
    });

    render(
      <MemoryRouter initialEntries={['/properties/commercial-zero-beds-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('reso-living-area')).toHaveTextContent('120 sqm');
    expect(screen.queryByTestId('reso-bedrooms')).not.toBeInTheDocument();
    expect(screen.queryByText('Studio')).not.toBeInTheDocument();

    spy.mockRestore();
  });
});

