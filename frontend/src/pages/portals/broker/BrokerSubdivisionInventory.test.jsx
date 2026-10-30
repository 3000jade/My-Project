import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BrokerSubdivisionInventory from './BrokerSubdivisionInventory';
import subdivisionService from '../../../services/subdivisionService';

vi.mock('../../../services/subdivisionService', () => ({
  default: {
    getSubdivisionById: vi.fn(),
    getLots: vi.fn(),
    saveDraftLots: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('BrokerSubdivisionInventory Component', () => {
  const mockProject = {
    id: 'sub-proj-001',
    name: 'Aura Residences',
    developer_name: 'Human Shelter Developments',
    location_address: 'BGC, Taguig',
    city: 'Taguig',
    latitude: 14.5489,
    longitude: 121.0503,
  };

  const mockLots = [
    {
      id: 'lot-1',
      project_id: 'sub-proj-001',
      block_number: '1',
      lot_number: '1',
      property_model: 'Luxury 4-BR Villa',
      availability_status: 'Available',
      verified_area_sqm: 280,
      floor_area_sqm: 215,
      price_php: 18500000,
      listing_status: 'Published',
      is_verified: true,
    },
    {
      id: 'lot-2',
      project_id: 'sub-proj-001',
      block_number: '1',
      lot_number: '2',
      property_model: 'Prime Vacant Lot',
      availability_status: 'Reserved',
      verified_area_sqm: 240,
      floor_area_sqm: 0,
      price_php: 9600000,
      listing_status: 'Draft',
      is_verified: true,
    },
    {
      id: 'lot-3',
      project_id: 'sub-proj-001',
      block_number: '2',
      lot_number: '1',
      property_model: 'Townhouse Unit',
      availability_status: 'Sold',
      verified_area_sqm: 180,
      floor_area_sqm: 130,
      price_php: 11000000,
      listing_status: 'Published',
      is_verified: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    subdivisionService.getSubdivisionById.mockResolvedValue({ data: mockProject });
    subdivisionService.getLots.mockResolvedValue({ data: mockLots });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BrokerSubdivisionInventory />} />
        </Routes>
      </BrowserRouter>
    );

  it('renders project header, breadcrumbs, and telemetry metrics', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Aura Residences — Lot & Property Inventory/i)).toBeInTheDocument();
    });

    // Telemetry Cards
    expect(screen.getByText(/Total Inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Available for Sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserved \/ Contract/i)).toBeInTheDocument();
    expect(screen.getByText(/Sold & Turned Over/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Valuation/i)).toBeInTheDocument();
  });

  it('renders inventory table with unit identifiers, prices, and status badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BLK 1 • LOT 1')).toBeInTheDocument();
    });

    expect(screen.getByText('BLK 1 • LOT 2')).toBeInTheDocument();
    expect(screen.getByText('BLK 2 • LOT 1')).toBeInTheDocument();
    expect(screen.getByText('Luxury 4-BR Villa')).toBeInTheDocument();
    expect(screen.getByText('₱18,500,000')).toBeInTheDocument();
  });

  it('filters lots when typing in search query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BLK 1 • LOT 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search block, lot, model, or price/i);
    fireEvent.change(searchInput, { target: { value: 'Townhouse' } });

    expect(screen.getByText('BLK 2 • LOT 1')).toBeInTheDocument();
    expect(screen.queryByText('BLK 1 • LOT 1')).not.toBeInTheDocument();
  });

  it('opens and submits Add Property Lot dialog', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Property \/ Lot/i })).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByRole('button', { name: /Add Property \/ Lot/i }));
    expect(screen.getByRole('heading', { name: 'Add New Property Lot' })).toBeInTheDocument();

    // Fill form
    const blockInput = screen.getByPlaceholderText('e.g. 1');
    fireEvent.change(blockInput, { target: { value: '4' } });

    const submitBtn = screen.getByRole('button', { name: 'Create Property Lot' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(subdivisionService.saveDraftLots).toHaveBeenCalledTimes(1);
    });
  });
});
