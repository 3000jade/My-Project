import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerPropertyTypeSelect, { 
  PRIMARY_PROPERTY_TYPES, 
  SECONDARY_PROPERTY_TYPES, 
  COMMON_PROPERTY_TYPES 
} from './BrokerPropertyTypeSelect';

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

  it('renders breadcrumbs, clean title, and all property type cards with icons and names only', () => {
    renderComponent();

    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
    expect(screen.getByText('What type of property are you listing?')).toBeInTheDocument();

    // Verify all 8 property type cards render by accessible name
    expect(screen.getByRole('button', { name: /^Subdivision Lot$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^House and Lot$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Condominium$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Townhouse$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Commercial$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Apartment$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Villa$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Warehouse$/i })).toBeInTheDocument();
  });

  it('removes dense clutter: badges, specs, and secondary headers', () => {
    renderComponent();

    // Verify removed badges and headers
    expect(screen.queryByText(/Tailored Intake Studio/i)).toBeNull();
    expect(screen.queryByText(/Primary Philippine Asset Classes/i)).toBeNull();
    expect(screen.queryByText(/Schema v1.0 Tailored/i)).toBeNull();
    expect(screen.queryByText(/Commercial & Other Asset Classes/i)).toBeNull();

    // Verify removed sub-badges
    expect(screen.queryByText('Vacant Land')).toBeNull();
    expect(screen.queryByText('Single-Family')).toBeNull();
    expect(screen.queryByText('Vertical Strata')).toBeNull();

    // Verify removed spec pills
    expect(screen.queryByText(/Road Frontage/i)).toBeNull();
    expect(screen.queryByText(/Cadastral Lot Ref/i)).toBeNull();
  });

  it('navigates to creation studio when clicking any property type card', () => {
    renderComponent();

    const lotBtn = screen.getByRole('button', { name: /^Subdivision Lot$/i });
    fireEvent.click(lotBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=residentialLot');

    const houseBtn = screen.getByRole('button', { name: /^House and Lot$/i });
    fireEvent.click(houseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=houseAndLot');

    const condoBtn = screen.getByRole('button', { name: /^Condominium$/i });
    fireEvent.click(condoBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=condominium');

    const townhouseBtn = screen.getByRole('button', { name: /^Townhouse$/i });
    fireEvent.click(townhouseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=townhouse');
  });

  it('supports keyboard navigation via Enter and Space keys', () => {
    renderComponent();

    const villaBtn = screen.getByRole('button', { name: /^Villa$/i });
    fireEvent.keyDown(villaBtn, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=villa');

    const warehouseBtn = screen.getByRole('button', { name: /^Warehouse$/i });
    fireEvent.keyDown(warehouseBtn, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=warehouse');
  });

  it('renders back navigation button to return to properties ledger', () => {
    renderComponent();
    const backBtn = screen.getByText('Back to Properties');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn.closest('a')).toHaveAttribute('href', '/broker/properties');
  });
});
