import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BrokerPropertyEditStudio from './BrokerPropertyEditStudio';
import propertyService from '../../../services/propertyService';

vi.mock('../../../services/propertyService', () => ({
  default: {
    getPropertyById: vi.fn(),
    updateProperty: vi.fn(),
    createProperty: vi.fn(),
  },
  normalizeProperty: vi.fn((p) => ({
    ...p,
    title: p.title || 'Ayala Alabang Modern Bauhaus Sanctuary',
    price_raw: p.price_raw || p.price || 185000000,
    price: p.price || '₱185,000,000',
    type: p.property_type || p.type || 'Estate',
    livingArea: p.living_area || p.livingArea || 1200,
    status: p.status || 'AVAILABLE',
    standardStatus: p.standard_status || p.standardStatus || 'Active',
    subdivisionName: p.subdivision_name || 'Ayala Alabang Village',
    associationFee: p.association_fee || 12500,
    buyerAgencyCompensation: p.buyer_agency_compensation || '3.00%',
    blueprintUrl: p.blueprint_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
  })),
  toApiPayload: vi.fn((data) => data),
}));

describe('BrokerPropertyEditStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderStudio = (route = '/broker/properties/prop-101/edit') => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/broker/properties/:id/edit" element={<BrokerPropertyEditStudio />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders studio header, breadcrumbs, auto-save status and publish button', async () => {
    propertyService.getPropertyById.mockResolvedValue({
      success: true,
      data: {
        id: 'prop-101',
        title: 'Modern Architectural Villa',
        price_raw: 185000000,
        type: 'Estate',
      }
    });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Publish Live/i })).toBeInTheDocument();
      expect(screen.getByText(/Saved just now|Saving/i)).toBeInTheDocument();
    });
  });

  it('renders all 5 progressive disclosure accordions', async () => {
    propertyService.getPropertyById.mockResolvedValue({
      success: true,
      data: { id: 'prop-101' }
    });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByText('Physical Specs & Dimensions')).toBeInTheDocument();
      expect(screen.getByText('Location & Neighborhood Cadastre')).toBeInTheDocument();
      expect(screen.getByText('Carrying Costs & HOA')).toBeInTheDocument();
      expect(screen.getByText('Broker Confidential & Co-Broke')).toBeInTheDocument();
      expect(screen.getByText('Media & CAD Blueprints')).toBeInTheDocument();
    });
  });

  it('toggles dual-mode preview between Photography and CAD Blueprint', async () => {
    propertyService.getPropertyById.mockResolvedValue({
      success: true,
      data: { id: 'prop-101' }
    });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^CAD Blueprint$/i })).toBeInTheDocument();
    });

    const cadToggle = screen.getByRole('button', { name: /^CAD Blueprint$/i });
    fireEvent.click(cadToggle);

    expect(screen.getByText(/CAD Architectural Blueprint/i)).toBeInTheDocument();
  });

  it('toggles metric and imperial units in preview', async () => {
    propertyService.getPropertyById.mockResolvedValue({
      success: true,
      data: { id: 'prop-101', living_area: 1000 }
    });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'sq ft' })).toBeInTheDocument();
    });

    const sqftBtn = screen.getByRole('button', { name: 'sq ft' });
    fireEvent.click(sqftBtn);

    // 1000 m² * 10.7639 ≈ 10,764 sq ft
    expect(screen.getByText(/10,764 sq ft Living/i)).toBeInTheDocument();
  });

  it('triggers debounced auto-save on field change', async () => {
    propertyService.getPropertyById.mockResolvedValue({
      success: true,
      data: { id: 'prop-101' }
    });
    propertyService.updateProperty.mockResolvedValue({ success: true });

    renderStudio();

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Ayala Alabang Modern Bauhaus Sanctuary|Modern Architectural Villa/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue(/Ayala Alabang Modern Bauhaus Sanctuary|Modern Architectural Villa/i);
    fireEvent.change(titleInput, { target: { value: 'Newly Renamed Masterpiece' } });

    await waitFor(() => {
      expect(screen.getByText(/Saving\.\.\./i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(propertyService.updateProperty).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
