import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnifiedSearchBar from './UnifiedSearchBar';
import { mapsService } from '../../../services/mapsService';

vi.mock('../../../services/mapsService', () => ({
  mapsService: {
    autocomplete: vi.fn(),
    geocode: vi.fn(),
    reverse: vi.fn(),
  },
}));

describe('UnifiedSearchBar - Nominatim (OpenStreetMap) Integration', () => {
  const defaultFilters = {
    keyword: '',
    transactionType: 'All',
    propertyType: 'All',
    minPrice: null,
    maxPrice: null,
    district: '',
    beds: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and controls properly', () => {
    render(
      <UnifiedSearchBar
        filters={defaultFilters}
        setFilter={vi.fn()}
        onOpenFiltersDrawer={vi.fn()}
      />
    );

    const input = screen.getByTestId('unified-search-input');
    expect(input).toBeDefined();
    expect(input.getAttribute('placeholder')).toContain('Nominatim OSM');
  });

  it('fetches and displays Nominatim predictions when typing in search input', async () => {
    const mockPredictions = [
      {
        placeId: 'osm-1',
        mainText: 'Bonifacio High Street',
        secondaryText: 'Taguig, Metro Manila, Philippines',
        description: 'Bonifacio High Street, Taguig',
        latitude: 14.5505,
        longitude: 121.0478,
      },
      {
        placeId: 'osm-2',
        mainText: 'Bonifacio Global City',
        secondaryText: 'Taguig, Metro Manila',
        description: 'Bonifacio Global City, Taguig',
        latitude: 14.5489,
        longitude: 121.0503,
      },
    ];

    mapsService.autocomplete.mockResolvedValueOnce(mockPredictions);

    const setFilterMock = vi.fn();
    const { rerender } = render(
      <UnifiedSearchBar
        filters={defaultFilters}
        setFilter={setFilterMock}
        onOpenFiltersDrawer={vi.fn()}
      />
    );

    const input = screen.getByTestId('unified-search-input');
    fireEvent.change(input, { target: { value: 'Boni' } });

    expect(setFilterMock).toHaveBeenCalledWith('keyword', 'Boni');

    // Rerender with updated keyword filter to simulate parent state update
    rerender(
      <UnifiedSearchBar
        filters={{ ...defaultFilters, keyword: 'Boni' }}
        setFilter={setFilterMock}
        onOpenFiltersDrawer={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mapsService.autocomplete).toHaveBeenCalledWith('Boni', 'ph');
    });

    await waitFor(() => {
      expect(screen.getByTestId('nominatim-autocomplete-dropdown')).toBeDefined();
      expect(screen.getByText('Bonifacio High Street')).toBeDefined();
      expect(screen.getByText('Bonifacio Global City')).toBeDefined();
    });
  });

  it('selecting a Nominatim suggestion triggers setFilter and onFlyToDistrict', async () => {
    const mockPredictions = [
      {
        placeId: 'osm-makati',
        mainText: 'Legazpi Village',
        secondaryText: 'Makati, Metro Manila',
        description: 'Legazpi Village, Makati',
        latitude: 14.5547,
        longitude: 121.0244,
      },
    ];

    mapsService.autocomplete.mockResolvedValueOnce(mockPredictions);

    const setFilterMock = vi.fn();
    const onFlyToDistrictMock = vi.fn();

    const { rerender } = render(
      <UnifiedSearchBar
        filters={{ ...defaultFilters, keyword: 'Legazpi' }}
        setFilter={setFilterMock}
        onFlyToDistrict={onFlyToDistrictMock}
      />
    );

    await waitFor(() => {
      expect(mapsService.autocomplete).toHaveBeenCalledWith('Legazpi', 'ph');
    });

    await waitFor(() => {
      expect(screen.getByText('Legazpi Village')).toBeDefined();
    });

    const suggestionItem = screen.getByTestId('autocomplete-item-0');
    fireEvent.click(suggestionItem);

    expect(setFilterMock).toHaveBeenCalledWith('keyword', 'Legazpi Village');
    expect(onFlyToDistrictMock).toHaveBeenCalledWith({
      name: 'Legazpi Village',
      lat: 14.5547,
      lng: 121.0244,
      zoom: 15,
    });
  });

  it('clearing the keyword resets search and closes dropdown', async () => {
    const setFilterMock = vi.fn();

    render(
      <UnifiedSearchBar
        filters={{ ...defaultFilters, keyword: 'Makati' }}
        setFilter={setFilterMock}
      />
    );

    const clearBtn = screen.getByTitle('Clear search');
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);

    expect(setFilterMock).toHaveBeenCalledWith('keyword', '');
  });

  it('renders quick filters and district scroller in 2-row layout', () => {
    const setFilterMock = vi.fn();
    const onFlyToDistrictMock = vi.fn();

    render(
      <UnifiedSearchBar
        filters={defaultFilters}
        setFilter={setFilterMock}
        onFlyToDistrict={onFlyToDistrictMock}
      />
    );

    // Property Type, Price Range, Bedrooms, Filters button are all rendered in row 1
    expect(screen.getByText('All Property Types')).toBeDefined();
    expect(screen.getByText('Price Range')).toBeDefined();
    expect(screen.getByText('Bedrooms')).toBeDefined();
    expect(screen.getByText('Filters')).toBeDefined();

    // District scroller is rendered in row 2
    expect(screen.getByText('Districts:')).toBeDefined();
    expect(screen.getByText('All Metro Manila')).toBeDefined();
    expect(screen.getByText('BGC / Taguig')).toBeDefined();

    // Clicking a district preset
    const bgcButton = screen.getByText('BGC / Taguig');
    fireEvent.click(bgcButton);

    expect(setFilterMock).toHaveBeenCalledWith('district', 'BGC / Taguig');
    expect(onFlyToDistrictMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'BGC / Taguig', lat: 14.5505, lng: 121.0478 })
    );
  });
});
