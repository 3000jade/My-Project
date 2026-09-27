import { describe, it, expect } from 'vitest';
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
});
