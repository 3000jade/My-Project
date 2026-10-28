import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerProperties from './BrokerProperties';
import propertyService from '../../../services/propertyService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock propertyService
vi.mock('../../../services/propertyService', () => ({
  default: {
    getProperties: vi.fn(),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
    getEditRequests: vi.fn().mockResolvedValue([])
  },
  normalizeProperty: (p) => p
}));

const mockData = [
  {
    id: 'prop-1',
    listingKey: 'HSR-10125001',
    title: 'Aurelia Modernist Penthouse at BGC',
    property_type: 'Condo',
    address: '8th Avenue cor. 36th Street',
    city: 'Bonifacio Global City, Taguig City',
    price: 158000000,
    price_raw: 158000000,
    livingArea: 188,
    bedrooms: 3,
    bathrooms: 3,
    standard_status: 'Active',
    status: 'AVAILABLE'
  },
  {
    id: 'prop-2',
    listingKey: 'HSR-10125002',
    title: 'Bespoke Rockwell Sky Penthouse',
    property_type: 'Condo',
    address: 'Rockwell Drive',
    city: 'Makati, Philippines',
    price: 125000000,
    price_raw: 125000000,
    livingArea: 180,
    bedrooms: 3,
    bathrooms: 3,
    standard_status: 'Draft',
    status: 'INACTIVE'
  },
  {
    id: 'prop-3',
    listingKey: 'HSR-10125003',
    title: 'Dasmarinas Village Sanctuary',
    property_type: 'House & Lot',
    address: '42 Palm Avenue',
    city: 'Dasmarinas Village, Makati',
    price: 295000000,
    price_raw: 295000000,
    livingArea: 250,
    bedrooms: 4,
    bathrooms: 3,
    standard_status: 'Pending Approval',
    status: 'PENDING'
  }
];

describe('BrokerProperties Page (Mockup & Modern SaaS Layout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyService.getProperties.mockResolvedValue({ data: mockData });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerProperties />
      </BrowserRouter>
    );

  it('renders breadcrumbs, title, and action buttons', async () => {
    renderComponent();

    const allListingsElements = await screen.findAllByText('All Listings');
    expect(allListingsElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Property Listings')).toBeInTheDocument();
    expect(screen.getByText('Manage and organize your property listings.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();

    const newListingBtn = screen.getByRole('link', { name: /new listing/i });
    expect(newListingBtn).toBeInTheDocument();
    expect(newListingBtn).toHaveAttribute('href', '/broker/properties/select-type');
  });

  it('renders pill status tabs with counts matching mockup', async () => {
    renderComponent();

    // Check tabs by role and accessible name
    expect(await screen.findByRole('button', { name: /all listings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /needs approval/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /under contract/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /closed/i })).toBeInTheDocument();
  });

  it('renders table columns with specifications and bold price', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    expect(screen.getByText('ID: HSR-10125001')).toBeInTheDocument();
    expect(screen.getByText('8th Avenue cor. 36th Street')).toBeInTheDocument();
    expect(screen.getByText('Bonifacio Global City, Taguig City')).toBeInTheDocument();
    expect(screen.getByText('188 m²')).toBeInTheDocument();
    expect(screen.getByText('₱158,000,000')).toBeInTheDocument();
  });

  it('filters listings by clicking on status pill tabs', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    expect(screen.getByText('Dasmarinas Village Sanctuary')).toBeInTheDocument();

    // Click 'Needs Approval' tab
    const needsApprovalTab = screen.getByRole('button', { name: /needs approval/i });
    fireEvent.click(needsApprovalTab);

    // Only 'Dasmarinas Village Sanctuary' (Pending Approval) should remain
    expect(screen.getByText('Dasmarinas Village Sanctuary')).toBeInTheDocument();
    expect(screen.queryByText('Aurelia Modernist Penthouse at BGC')).toBeNull();
  });

  it('allows duplicating a listing via the Copy action button', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
    expect(duplicateButtons.length).toBeGreaterThanOrEqual(1);

    // Click duplicate on first row
    fireEvent.click(duplicateButtons[0]);

    // Check for duplicated row with (Copy) suffix
    await waitFor(() => {
      expect(screen.getByText('Aurelia Modernist Penthouse at BGC (Copy)')).toBeInTheDocument();
    });
  });

  it('does not render the removed View button in the Actions column', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    // Verify no "View" action link exists
    expect(screen.queryByRole('link', { name: /^view$/i })).toBeNull();
    expect(screen.queryByTitle('View Details')).toBeNull();
  });

  it('navigates to the broker property detail page when clicking a listed property row', async () => {
    renderComponent();

    const propertyRow = await screen.findByText('Aurelia Modernist Penthouse at BGC');
    fireEvent.click(propertyRow);

    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/prop-1');
  });

  it('switches view mode between Table, Grid, and Cadastral Map View', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const mapViewBtn = screen.getByRole('button', { name: /Cadastral Map View/i });
    expect(mapViewBtn).toBeInTheDocument();
    fireEvent.click(mapViewBtn);

    expect(screen.getByTestId('cadastral-split-view')).toBeInTheDocument();
    expect(screen.getByTestId('map-property-card-prop-1')).toBeInTheDocument();

    const gridViewBtn = screen.getByRole('button', { name: /Grid View/i });
    fireEvent.click(gridViewBtn);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    expect(screen.getByTestId('grid-property-card-prop-1')).toBeInTheDocument();
  });
});
