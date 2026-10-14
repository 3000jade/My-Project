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
});

