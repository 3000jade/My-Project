import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropertyDetailModal from './PropertyDetailModal';
import propertyService from '../../../services/propertyService';

// Mock viewing list hook
vi.mock('../../../hooks/useViewingList', () => ({
  default: () => ({
    isInViewingList: vi.fn().mockReturnValue(false),
    toggleViewingList: vi.fn(),
  })
}));

const mockSingleProperty = {
  id: 'prop-200',
  ref_code: 'REF-200-BGC',
  title: 'Aurelia Prime Penthouse BGC',
  name: 'Aurelia Prime Penthouse BGC',
  status: 'AVAILABLE',
  property_type: 'Condominium',
  price: '₱165,000,000',
  price_raw: 165000000,
  location: 'Bonifacio Global City',
  city: 'Taguig City',
  bedrooms: 3,
  bathrooms: 3,
  sqm: '195 sqm',
  description: 'Exclusive luxury penthouse living with panoramic skyline views.',
  images: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200'
  ]
};

// Mock propertyService
vi.mock('../../../services/propertyService', () => ({
  default: {
    getPropertyById: vi.fn(),
  }
}));

// Mock mockProperties
vi.mock('../../../mockData/mockProperties', () => ({
  mockProperties: [mockSingleProperty]
}));

describe('PropertyDetailModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyService.getPropertyById.mockResolvedValue(mockSingleProperty);
  });

  it('does not render when propertyId search param is absent', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/properties']}>
        <PropertyDetailModal />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders property title, price, and specs when propertyId is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/properties?propertyId=prop-200']}>
        <PropertyDetailModal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Aurelia Prime Penthouse BGC')).toBeInTheDocument();
      expect(screen.getByText(/165,000,000/)).toBeInTheDocument();
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2); // beds and baths
      expect(screen.getByText(/195 sqm/)).toBeInTheDocument();
    });
  });

  it('renders modern action triggers', async () => {
    render(
      <MemoryRouter initialEntries={['/properties?propertyId=prop-200']}>
        <PropertyDetailModal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Schedule Free Site Viewing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add to Viewing List/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Open Full Listing View/i })).toBeInTheDocument();
    });
  });
});
