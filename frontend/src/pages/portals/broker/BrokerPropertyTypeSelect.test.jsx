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

describe('BrokerPropertyTypeSelect - 4-Grid Category Cards with Dropdowns', () => {
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

  it('renders clean breadcrumbs, title, and all 4 category cards without category descriptions or quick-pick pills', () => {
    renderComponent();

    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
    expect(screen.getByText('What type of property are you listing?')).toBeInTheDocument();

    // Verify 4 category cards render
    expect(screen.getByTestId('category-card-homes')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-land')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-commercial')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-industrial')).toBeInTheDocument();

    expect(screen.getByText('Homes & Living')).toBeInTheDocument();
    expect(screen.getByText('Lots & Land')).toBeInTheDocument();
    expect(screen.getByText('Commercial & Office')).toBeInTheDocument();
    expect(screen.getByText('Industrial & Storage')).toBeInTheDocument();

    // Verify no category description text is rendered
    expect(screen.queryByText(/Single-family homes, townhouses/i)).toBeNull();
    expect(screen.queryByText(/Subdivision lots, agricultural/i)).toBeNull();

    // Verify quick-pick tags are removed
    expect(screen.queryByTestId('quick-pick-houseAndLot')).toBeNull();
  });

  it('toggles the embedded dropdown box and displays property types with icon and name only (no item descriptions)', () => {
    renderComponent();

    // Initially menu is closed
    expect(screen.queryByTestId('category-dropdown-menu-homes')).not.toBeInTheDocument();

    // Click Homes trigger
    const trigger = screen.getByTestId('category-dropdown-trigger-homes');
    fireEvent.click(trigger);

    // Menu opens
    expect(screen.getByTestId('category-dropdown-menu-homes')).toBeInTheDocument();
    expect(screen.getByText('House and Lot')).toBeInTheDocument();
    expect(screen.getByText('Condominium')).toBeInTheDocument();

    // Verify item description is removed
    expect(screen.queryByText(/Standalone house with private yard/i)).toBeNull();

    // Click an option inside the dropdown
    const houseOption = screen.getByTestId('property-type-option-houseAndLot');
    fireEvent.click(houseOption);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=houseAndLot');
  });

  it('navigates when selecting a land type from the Lots & Land dropdown', () => {
    renderComponent();

    const trigger = screen.getByTestId('category-dropdown-trigger-land');
    fireEvent.click(trigger);

    const lotOption = screen.getByTestId('property-type-option-residentialLot');
    fireEvent.click(lotOption);
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=residentialLot');
  });

  it('supports selecting Warehouse from Industrial dropdown with keyboard enter', () => {
    renderComponent();

    // Open Industrial dropdown
    const indTrigger = screen.getByTestId('category-dropdown-trigger-industrial');
    fireEvent.click(indTrigger);

    const whOption = screen.getByTestId('property-type-option-warehouse');
    fireEvent.keyDown(whOption, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=warehouse');
  });

  it('exports valid property type collections for backward compatibility', () => {
    expect(Array.isArray(PRIMARY_PROPERTY_TYPES)).toBe(true);
    expect(Array.isArray(SECONDARY_PROPERTY_TYPES)).toBe(true);
    expect(Array.isArray(COMMON_PROPERTY_TYPES)).toBe(true);
    expect(COMMON_PROPERTY_TYPES.length).toBeGreaterThan(5);
  });
});
