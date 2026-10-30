import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyFilterToolbar from './PropertyFilterToolbar';

describe('PropertyFilterToolbar Component', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    statusTab: 'ALL',
    onStatusTabChange: vi.fn(),
    statusCounts: {
      all: 25,
      active: 15,
      needsApproval: 3,
      proposals: 2,
      pendingConfirmation: 1,
      actionRequired: 1,
      reserved: 2,
      sold: 1,
      draft: 0
    },
    selectedType: 'ALL',
    onTypeChange: vi.fn(),
    selectedLocation: 'ALL',
    onLocationChange: vi.fn(),
    locationOptions: ['Makati', 'BGC, Taguig', 'Alabang, Muntinlupa'],
    priceRange: { min: '', max: '' },
    onPriceRangeChange: vi.fn(),
    sortBy: 'newest',
    onSortByChange: vi.fn(),
    onResetFilters: vi.fn(),
    totalCount: 25,
    filteredCount: 25
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders omni-search input and status dropdown with count', () => {
    render(<PropertyFilterToolbar {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search properties/i)).toBeInTheDocument();
    expect(screen.getByTestId('status-filter-dropdown-btn')).toBeInTheDocument();
    expect(screen.getByText(/All Listings/i)).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input and clears on X button click', () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(<PropertyFilterToolbar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText(/search properties/i);
    fireEvent.change(searchInput, { target: { value: 'Modern Villa' } });
    expect(onSearchChange).toHaveBeenCalledWith('Modern Villa');

    rerender(<PropertyFilterToolbar {...defaultProps} search="Modern Villa" onSearchChange={onSearchChange} />);

    const clearBtn = screen.getByLabelText(/clear search/i);
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('calls onStatusTabChange when selecting a status option from dropdown', () => {
    const onStatusTabChange = vi.fn();
    render(<PropertyFilterToolbar {...defaultProps} onStatusTabChange={onStatusTabChange} />);

    const dropdownBtn = screen.getByTestId('status-filter-dropdown-btn');
    fireEvent.click(dropdownBtn);

    const activeOption = screen.getByTestId('status-option-ACTIVE');
    expect(activeOption).toBeInTheDocument();
    fireEvent.click(activeOption);

    expect(onStatusTabChange).toHaveBeenCalledWith('ACTIVE');
  });

  it('renders active filter chips when filters are applied (selectedType, search, location), allows removing individual chips via dismiss button, and calls onResetFilters when clicking Clear All', () => {
    const onSearchChange = vi.fn();
    const onTypeChange = vi.fn();
    const onLocationChange = vi.fn();
    const onResetFilters = vi.fn();

    render(
      <PropertyFilterToolbar
        {...defaultProps}
        search="Penthouse"
        onSearchChange={onSearchChange}
        selectedType="Condominium"
        onTypeChange={onTypeChange}
        selectedLocation="Makati"
        onLocationChange={onLocationChange}
        onResetFilters={onResetFilters}
        filteredCount={8}
        totalCount={25}
      />
    );

    expect(screen.getByText(/showing 8 of 25 listings/i)).toBeInTheDocument();
    expect(screen.getByText(/search: "penthouse"/i)).toBeInTheDocument();
    expect(screen.getByText('Type: Condominium')).toBeInTheDocument();
    expect(screen.getByText('Location: Makati')).toBeInTheDocument();

    const removeTypeChipBtn = screen.getByLabelText(/remove type filter/i);
    fireEvent.click(removeTypeChipBtn);
    expect(onTypeChange).toHaveBeenCalledWith('ALL');

    const removeSearchChipBtn = screen.getByLabelText(/remove search filter/i);
    fireEvent.click(removeSearchChipBtn);
    expect(onSearchChange).toHaveBeenCalledWith('');

    const removeLocationChipBtn = screen.getByLabelText(/remove location filter/i);
    fireEvent.click(removeLocationChipBtn);
    expect(onLocationChange).toHaveBeenCalledWith('ALL');

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllBtn);
    expect(onResetFilters).toHaveBeenCalled();
  });

  it('supports price range changes', () => {
    const onPriceRangeChange = vi.fn();
    const { rerender } = render(
      <PropertyFilterToolbar
        {...defaultProps}
        priceRange={{ min: '', max: '' }}
        onPriceRangeChange={onPriceRangeChange}
      />
    );

    // Open price range selector
    const priceButton = screen.getByRole('button', { name: /price/i });
    expect(priceButton).toBeInTheDocument();
    fireEvent.click(priceButton);

    const minInput = screen.getByPlaceholderText(/min/i);
    fireEvent.change(minInput, { target: { value: '5000000' } });
    expect(onPriceRangeChange).toHaveBeenCalled();

    // Rerender with active price filter
    rerender(
      <PropertyFilterToolbar
        {...defaultProps}
        priceRange={{ min: '5000000', max: '20000000' }}
        onPriceRangeChange={onPriceRangeChange}
      />
    );

    expect(screen.getByText(/price:/i)).toBeInTheDocument();

    const removePriceChipBtn = screen.getByLabelText(/remove price filter/i);
    fireEvent.click(removePriceChipBtn);
    expect(onPriceRangeChange).toHaveBeenCalledWith({ min: '', max: '' });
  });

  it('renders columns popover, displays available columns, and allows toggling column visibility', () => {
    const onVisibleColumnsChange = vi.fn();
    const availableColumns = [
      { id: 'property', label: 'Property', isLocked: true },
      { id: 'price', label: 'Price' },
      { id: 'specs', label: 'Specs' },
    ];
    const visibleColumns = ['property', 'price', 'specs'];

    render(
      <PropertyFilterToolbar
        {...defaultProps}
        availableColumns={availableColumns}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />
    );

    const columnsBtn = screen.getByRole('button', { name: /customize columns/i });
    expect(columnsBtn).toBeInTheDocument();
    fireEvent.click(columnsBtn);

    expect(screen.getByText('Table Columns')).toBeInTheDocument();
    expect(screen.getByLabelText(/^property$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^price$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^specs$/i)).toBeInTheDocument();

    // Property is locked -> its checkbox should be disabled
    const propertyCheckbox = screen.getAllByRole('checkbox')[0];
    expect(propertyCheckbox).toBeDisabled();

    // Price checkbox is enabled -> toggle it
    const priceCheckbox = screen.getAllByRole('checkbox')[1];
    expect(priceCheckbox).not.toBeDisabled();
    fireEvent.click(priceCheckbox);
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['property', 'specs']);

    // Click "Show All" button
    const showAllBtn = screen.getByText('Show All');
    fireEvent.click(showAllBtn);
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['property', 'price', 'specs']);
  });
});
