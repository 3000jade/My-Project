import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerPropertyTypeSelect, { PRIMARY_PROPERTY_TYPES, SECONDARY_PROPERTY_TYPES } from './BrokerPropertyTypeSelect';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

describe('BrokerPropertyTypeSelect - Property Type Selection Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BrokerPropertyTypeSelect />
      </BrowserRouter>
    );
  };

  it('renders breadcrumbs, title, and the 3 primary asset classes with badges', () => {
    renderComponent();

    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
    expect(
      screen.getByText(/Choose the category of property you want to list/i)
    ).toBeInTheDocument();

    // Verify 3 Primary Assets
    expect(screen.getByText('Subdivision Lot')).toBeInTheDocument();
    expect(screen.getByText('House and Lot')).toBeInTheDocument();
    expect(screen.getByText('Condominium')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Vacant Land')).toBeInTheDocument();
    expect(screen.getByText('Single-Family')).toBeInTheDocument();
    expect(screen.getByText('Vertical Strata')).toBeInTheDocument();
  });

  it('navigates to creation studio with schema v1.0 canonical type when primary asset is clicked', () => {
    renderComponent();

    const lotBtn = screen.getByRole('button', { name: /Subdivision Lot/i });
    fireEvent.click(lotBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=residentialLot');

    const houseBtn = screen.getByRole('button', { name: /House and Lot/i });
    fireEvent.click(houseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=houseAndLot');

    const condoBtn = screen.getByRole('button', { name: /Condominium/i });
    fireEvent.click(condoBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=condominium');
  });

  it('renders secondary property types for commercial and alternative listings', () => {
    renderComponent();

    expect(screen.getByText('Commercial & Other Asset Classes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Townhouse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commercial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Warehouse/i })).toBeInTheDocument();
  });

  it('renders back navigation button to return to properties ledger', () => {
    renderComponent();
    const backBtn = screen.getByText('Back to Properties');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn.closest('a')).toHaveAttribute('href', '/broker/properties');
  });
});
