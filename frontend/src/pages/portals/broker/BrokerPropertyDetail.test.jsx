import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BrokerPropertyDetail from './BrokerPropertyDetail';
import propertyService from '../../../services/propertyService';

vi.mock('../../../services/propertyService', () => ({
  default: {
    getPropertyById: vi.fn(),
    updateProperty: vi.fn()
  },
  normalizeProperty: (p) => p
}));

const mockProperty = {
  id: 'prop-101',
  listingKey: 'HSR-10125001',
  listing_id: 'HSR-10125001',
  title: 'Skyline Grand Villa at Forbes Park',
  property_type: 'House & Lot',
  price: '₱250,000,000',
  price_raw: 250000000,
  address: '15 Forbes Avenue, Makati City',
  location: 'Makati City',
  city: 'Makati City',
  bedrooms: '5',
  bathrooms: '6',
  parking: '4',
  floor_area: '650',
  floor_area_unit: 'sqm',
  lot_area: '1200',
  lot_area_unit: 'sqm',
  year_built: '2023',
  furnishing: 'Fully Furnished',
  status: 'AVAILABLE',
  standard_status: 'Active',
  is_published: true,
  description: 'An ultra-luxurious modern tropical sanctuary in Forbes Park with private lap pool.',
  amenities: ['Private Swimming Pool', '24/7 Security'],
  interior_features: ['Wine Cellar', 'Private Elevator'],
  exterior_features: ['Covered Garage', 'Rooftop Deck'],
  confidential: {
    buyerAgencyCompensation: '3.5%',
    lockboxCode: '9842',
    showingInstructions: 'Call listing agent 24 hours prior. Gate passcode required.',
    sellerDirectPhone: '+63 917 111 2222'
  },
  commissionSplit: '3.5%',
  lockboxCode: '9842',
  showingInstructions: 'Call listing agent 24 hours prior. Gate passcode required.',
  seller_direct_phone: '+63 917 111 2222',
  mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200',
  images: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200'
  ]
};

describe('BrokerPropertyDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyService.getPropertyById.mockResolvedValue(mockProperty);
  });

  const renderComponent = (id = 'prop-101') => {
    return render(
      <MemoryRouter initialEntries={[`/broker/properties/${id}`]}>
        <Routes>
          <Route path="/broker/properties/:id" element={<BrokerPropertyDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders breadcrumbs, title, price, and action buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Skyline Grand Villa at Forbes Park')).toBeInTheDocument();
    });

    // Check breadcrumbs and actions
    expect(screen.getAllByText(/Properties/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Quick Edit/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Listings/i)).toBeInTheDocument();

    // Check price
    expect(screen.getByText(/250,000,000/i)).toBeInTheDocument();
  });

  it('renders architectural metrics and lot specifications', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Skyline Grand Villa at Forbes Park')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/5/).length).toBeGreaterThanOrEqual(1); // Beds
    expect(screen.getAllByText(/6/).length).toBeGreaterThanOrEqual(1); // Baths
    expect(screen.getAllByText(/650/).length).toBeGreaterThanOrEqual(1); // Floor area
    expect(screen.getAllByText(/1200/).length).toBeGreaterThanOrEqual(1); // Lot area
  });

  it('renders confidential broker governance details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Skyline Grand Villa at Forbes Park')).toBeInTheDocument();
    });

    const detailsTab = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(detailsTab);

    expect(screen.getByText(/3.5%/)).toBeInTheDocument();
    expect(screen.getByText(/9842/)).toBeInTheDocument();
    expect(screen.getByText(/Call listing agent 24 hours prior/i)).toBeInTheDocument();
  });

  it('toggles in-place edit mode, allows updating fields, and saves changes', async () => {
    propertyService.updateProperty.mockResolvedValue({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Skyline Grand Villa at Forbes Park')).toBeInTheDocument();
    });

    // Click "Edit Property"
    const editBtn = screen.getByRole('button', { name: /edit property/i });
    fireEvent.click(editBtn);

    // Editing mode banner should appear
    expect(screen.getByText(/Editing Mode/i)).toBeInTheDocument();

    // Title input should be editable
    const titleInput = screen.getByPlaceholderText(/Modern Luxury Condominium/i);
    expect(titleInput).toBeInTheDocument();
    fireEvent.change(titleInput, { target: { value: 'Updated Grand Villa' } });

    // Save changes
    const saveBtn = screen.getAllByRole('button', { name: /save changes/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(propertyService.updateProperty).toHaveBeenCalledWith('prop-101', expect.objectContaining({
        title: 'Updated Grand Villa'
      }));
    });
  });
});
