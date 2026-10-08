import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapsService } from './mapsService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('mapsService Frontend Integration with Nominatim OSM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('autocomplete passes input query and returns predictions array', async () => {
    const mockPredictions = [
      {
        placeId: 'osm_101',
        description: 'Bonifacio Global City, Taguig, Metro Manila, Philippines',
        mainText: 'Bonifacio Global City',
        secondaryText: 'Taguig, Metro Manila',
        latitude: 14.5489,
        longitude: 121.0503,
      },
    ];

    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockPredictions,
    });

    const results = await mapsService.autocomplete('BGC');

    expect(apiClient.get).toHaveBeenCalledWith('/maps/places/autocomplete', {
      params: { input: 'BGC', country: 'ph' },
    });
    expect(results).toEqual(mockPredictions);
  });

  it('autocomplete returns empty array on empty input or API failure', async () => {
    const emptyResult = await mapsService.autocomplete('   ');
    expect(emptyResult).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();

    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    const failedResult = await mapsService.autocomplete('Makati');
    expect(failedResult).toEqual([]);
  });

  it('geocode queries address and returns parsed geocoding object', async () => {
    const mockGeocode = {
      latitude: 14.5547,
      longitude: 121.0244,
      formattedAddress: 'Makati, Metro Manila, Philippines',
      city: 'Makati',
    };

    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockGeocode,
    });

    const result = await mapsService.geocode('Makati City');

    expect(apiClient.get).toHaveBeenCalledWith('/maps/geocode', {
      params: { address: 'Makati City', country: 'ph' },
    });
    expect(result).toEqual(mockGeocode);
  });

  it('reverse geocodes coordinates to structured address', async () => {
    const mockReverse = {
      latitude: 14.5547,
      longitude: 121.0244,
      formattedAddress: 'Ayala Avenue, Makati, Metro Manila, Philippines',
      road: 'Ayala Avenue',
      city: 'Makati',
    };

    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockReverse,
    });

    const result = await mapsService.reverse(14.5547, 121.0244);

    expect(apiClient.get).toHaveBeenCalledWith('/maps/reverse', {
      params: { lat: 14.5547, lng: 121.0244 },
    });
    expect(result).toEqual(mockReverse);
  });
});
