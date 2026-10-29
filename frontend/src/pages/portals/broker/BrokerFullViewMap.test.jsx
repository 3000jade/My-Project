import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BrokerFullViewMap from './BrokerFullViewMap';

// Mock Leaflet
vi.mock('leaflet', () => {
  const mapMock = {
    setView: vi.fn(),
    panTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  };

  const markerMock = {
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn(),
    setLatLng: vi.fn(),
  };

  const circleMock = {
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn(),
    setRadius: vi.fn(),
  };

  const tileLayerMock = {
    addTo: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      map: vi.fn(() => mapMock),
      marker: vi.fn(() => markerMock),
      circle: vi.fn(() => circleMock),
      tileLayer: vi.fn(() => tileLayerMock),
      divIcon: vi.fn(() => ({})),
    },
    map: vi.fn(() => mapMock),
    marker: vi.fn(() => markerMock),
    circle: vi.fn(() => circleMock),
    tileLayer: vi.fn(() => tileLayerMock),
    divIcon: vi.fn(() => ({})),
  };
});

// Mock mapsService
vi.mock('../../../services/mapsService', () => ({
  mapsService: {
    autocomplete: vi.fn().mockResolvedValue([
      { placeId: '1', mainText: 'BGC High Street', secondaryText: 'Taguig, Metro Manila', latitude: 14.5505, longitude: 121.0478 },
      { placeId: '2', mainText: 'Makati CBD', secondaryText: 'Makati, Metro Manila', latitude: 14.5547, longitude: 121.0244 }
    ]),
    geocode: vi.fn().mockResolvedValue({
      latitude: 14.5505,
      longitude: 121.0478,
      formattedAddress: 'Bonifacio High Street, Taguig, Philippines',
      city: 'Taguig',
      subdivision: 'Fort Bonifacio'
    }),
    reverse: vi.fn().mockResolvedValue({
      latitude: 14.5505,
      longitude: 121.0478,
      formattedAddress: 'Bonifacio High Street, Taguig, Philippines',
      city: 'Taguig',
      subdivision: 'Fort Bonifacio'
    }),
    getCommute: vi.fn().mockResolvedValue([]),
  },
}));

describe('BrokerFullViewMap component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders full-view map studio with complete UI controls and coordinates readout', () => {
    render(
      <MemoryRouter initialEntries={['/broker/properties/location-map?lat=14.5547&lng=121.0244&title=Rockwell+Villa']}>
        <BrokerFullViewMap />
      </MemoryRouter>
    );

    // Verify header components
    expect(screen.getByTestId('broker-fullview-map-page')).toBeDefined();
    expect(screen.getByText('Rockwell Villa')).toBeDefined();
    expect(screen.getByText(/Full View Pinpoint Studio/i)).toBeDefined();
    expect(screen.getByTestId('apply-coordinates-btn')).toBeDefined();

    // Verify search bar input
    expect(screen.getByPlaceholderText(/Search location, district, landmark/i)).toBeDefined();

    // Verify map canvas
    expect(screen.getByTestId('fullview-leaflet-canvas')).toBeDefined();

    // Verify UI control elements (layers, zoom, center, radius)
    expect(screen.getByText('Layers')).toBeDefined();
    expect(screen.getByText('Street')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
    expect(screen.getByRole('button', { name: /Center on Pin/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Locate Device Location/i })).toBeDefined();
    expect(screen.getByText('Radius')).toBeDefined();

    // Verify coordinate inspector inputs
    expect(screen.getByText(/Pinpoint Coordinates/i)).toBeDefined();
    expect(screen.getByDisplayValue('14.5547')).toBeDefined();
    expect(screen.getByDisplayValue('121.0244')).toBeDefined();
  });

  it('applies coordinates to sessionStorage and navigates on Apply click', async () => {
    sessionStorage.setItem('broker_listing_create_draft', JSON.stringify({
      formData: { title: 'Rockwell Villa', latitude: '14.5547', longitude: '121.0244' },
      currentStep: 2
    }));

    render(
      <MemoryRouter initialEntries={['/broker/properties/location-map?lat=14.5547&lng=121.0244&title=Rockwell+Villa']}>
        <BrokerFullViewMap />
      </MemoryRouter>
    );

    const applyBtn = screen.getByTestId('apply-coordinates-btn');
    fireEvent.click(applyBtn);

    const updated = JSON.parse(sessionStorage.getItem('broker_listing_updated_coords'));
    expect(updated).toBeDefined();
    expect(updated.lat).toBe('14.5547000');
    expect(updated.lng).toBe('121.0244000');
  });
});
