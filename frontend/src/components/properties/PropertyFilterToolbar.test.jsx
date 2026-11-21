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
      draft: 2,
      pendingApproval: 3,
      published: 15,
      unpublished: 3,
      closed: 2,
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

  it('renders omni-search input and single unified Filters button without column filter', () => {
    render(<PropertyFilterToolbar {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search properties/i)).toBeInTheDocument();
    expect(screen.getByTestId('unified-filter-btn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /customize columns/i })).not.toBeInTheDocument();
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

  it('opens unified Filters popover and calls onStatusTabChange when selecting a status option', () => {
    const onStatusTabChange = vi.fn();
    render(<PropertyFilterToolbar {...defaultProps} onStatusTabChange={onStatusTabChange} />);

    fireEvent.click(screen.getByTestId('unified-filter-btn'));

    expect(screen.getByTestId('status-option-DRAFT')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-PENDING_APPROVAL')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-PUBLISHED')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-UNPUBLISHED')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-CLOSED')).toBeInTheDocument();

    const publishedOption = screen.getByTestId('status-option-PUBLISHED');
    fireEvent.click(publishedOption);

    expect(onStatusTabChange).toHaveBeenCalledWith('PUBLISHED');
  });

  it('renders active filter chips and badge count on unified Filters button, allows removing chips, and resets all', () => {
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

    expect(screen.getByTestId('unified-filter-btn')).toHaveTextContent('2');
    expect(screen.getByText(/showing 8 of 25 listings/i)).toBeInTheDocument();
    expect(screen.getByText(/search: "penthouse"/i)).toBeInTheDocument();
    expect(screen.getByText('Type: Condominium')).toBeInTheDocument();
    expect(screen.getByText('Location: Makati')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/remove type filter/i));
    expect(onTypeChange).toHaveBeenCalledWith('ALL');

    fireEvent.click(screen.getByLabelText(/remove search filter/i));
    expect(onSearchChange).toHaveBeenCalledWith('');

    fireEvent.click(screen.getByLabelText(/remove location filter/i));
    expect(onLocationChange).toHaveBeenCalledWith('ALL');

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onResetFilters).toHaveBeenCalled();
  });

  it('supports price range changes and displays inline error when min > max', () => {
    const onPriceRangeChange = vi.fn();
    const { rerender } = render(
      <PropertyFilterToolbar
        {...defaultProps}
        priceRange={{ min: '', max: '' }}
        onPriceRangeChange={onPriceRangeChange}
      />
    );

    fireEvent.click(screen.getByTestId('unified-filter-btn'));

    const minInput = screen.getByPlaceholderText(/min/i);
    fireEvent.change(minInput, { target: { value: '5000000' } });
    expect(onPriceRangeChange).toHaveBeenCalled();

    rerender(
      <PropertyFilterToolbar
        {...defaultProps}
        priceRange={{ min: '50000000', max: '10000000' }}
        onPriceRangeChange={onPriceRangeChange}
      />
    );

    expect(screen.getByText(/minimum price cannot be higher than maximum price/i)).toBeInTheDocument();
    expect(screen.getByText(/price:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/remove price filter/i));
    expect(onPriceRangeChange).toHaveBeenCalledWith({ min: '', max: '' });
  });
});
