import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PropertiesPage from './PropertiesPage';

// Mock Google Maps & Leaflet to prevent Canvas/WebGL issues in jsdom
vi.mock('../../components/ui/map/GooglePropertyMap', () => ({
  default: () => <div data-testid="mock-google-property-map">Mock Google Property Map</div>,
}));

vi.mock('../../components/ui/map/PropertyMap', () => ({
  default: () => <div data-testid="mock-property-map">Mock Property Map</div>,
}));

vi.mock('../../components/ui/modals/StreetViewModal', () => ({
  default: () => <div data-testid="mock-streetview-modal">Mock Street View</div>,
}));

// Mock propertyService
const { mockData } = vi.hoisted(() => ({
  mockData: [
    {
      id: 'prop-1',
      title: 'Bespoke Rockwell Sky Penthouse',
      name: 'Bespoke Rockwell Sky Penthouse',
      price: 125000000,
      price_raw: 125000000,
      city: 'Makati',
      location: 'Makati',
      bedrooms: 3,
      bathrooms: 4,
      propertyType: 'Condominium',
      standard_status: 'Active',
      status: 'Active',
    },
    {
      id: 'prop-2',
      title: 'Havila Highlands Estate',
      name: 'Havila Highlands Estate',
      price: 45000000,
      price_raw: 45000000,
      city: 'Antipolo',
      location: 'Rizal',
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'House',
      standard_status: 'Active',
      status: 'Active',
    },
  ],
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn().mockResolvedValue({ data: mockData }),
    getPublicProperties: vi.fn().mockResolvedValue({ data: mockData }),
  },
  default: {
    getProperties: vi.fn().mockResolvedValue({ data: mockData }),
    getPublicProperties: vi.fn().mockResolvedValue({ data: mockData }),
  },
}));

describe('PropertiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <PropertiesPage />
      </MemoryRouter>
    );
  };

  it('does NOT render "Available Properties" header or "Newest Additions" sort dropdown on the page', async () => {
    renderComponent();

    // Verify "Available Properties" header is completely removed
    expect(screen.queryByRole('heading', { name: /available properties/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^available properties$/i)).not.toBeInTheDocument();

    // Verify "Newest Additions" dropdown is removed from main view
    expect(screen.queryByText(/^sort$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/newest additions/i)).not.toBeInTheDocument();
  });

  it('renders the search bar, district scroller, and property listings container', async () => {
    renderComponent();

    // Search bar is present
    expect(screen.getByTestId('unified-search-input')).toBeInTheDocument();

    // Split map or map container is present
    expect(await screen.findByTestId('mock-google-property-map')).toBeInTheDocument();
  });

  it('renders AllFiltersDrawer with sort order options relocated inside it', async () => {
    renderComponent();

    // Open filters drawer
    const filtersBtn = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersBtn);

    // Sort Order section is present inside the drawer
    expect(await screen.findByText('Sort Order')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /newest additions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /price: high to low/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /price: low to high/i })).toBeInTheDocument();
  });
});
