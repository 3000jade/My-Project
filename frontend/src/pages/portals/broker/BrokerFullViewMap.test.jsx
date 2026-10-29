import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BrokerFullViewMap from './BrokerFullViewMap';

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

describe('BrokerFullViewMap component (Google Maps Render)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders Google Maps full-view studio with complete UI controls and coordinates readout', () => {
    render(
      <MemoryRouter initialEntries={['/broker/properties/location-map?lat=14.5547&lng=121.0244&title=Rockwell+Villa']}>
        <BrokerFullViewMap />
      </MemoryRouter>
    );

    // Verify header components
    expect(screen.getByTestId('broker-fullview-map-page')).toBeDefined();
    expect(screen.getByText('Rockwell Villa')).toBeDefined();
    expect(screen.getByText(/Google Maps Pinpoint Studio/i)).toBeDefined();
    expect(screen.getByTestId('apply-coordinates-btn')).toBeDefined();

    // Verify search bar input
    expect(screen.getByPlaceholderText(/Search location, district, landmark/i)).toBeDefined();

    // Verify official Google Maps canvas and embed iframe
    expect(screen.getByTestId('fullview-google-map-canvas')).toBeDefined();
    const iframe = screen.getByTitle(/Google Maps Full View Pinpoint/i);
    expect(iframe).toBeDefined();
    expect(iframe.getAttribute('src')).toContain('14.554700');
    expect(iframe.getAttribute('src')).toContain('121.024400');
    expect(iframe.getAttribute('src')).toContain('t=m');

    // Verify UI control elements (Google layers, zoom, center)
    expect(screen.getByText('Google Layers')).toBeDefined();
    expect(screen.getByText('Roadmap')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
    expect(screen.getByText('Hybrid')).toBeDefined();
    expect(screen.getByText('Terrain')).toBeDefined();
    expect(screen.getByRole('button', { name: /Center on Pin/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Locate Device Location/i })).toBeDefined();

    // Verify coordinate inspector inputs
    expect(screen.getByText(/Pinpoint Coordinates/i)).toBeDefined();
    expect(screen.getByDisplayValue('14.5547')).toBeDefined();
    expect(screen.getByDisplayValue('121.0244')).toBeDefined();
  });

  it('switches Google map layers dynamically when user clicks layer buttons', () => {
    render(
      <MemoryRouter initialEntries={['/broker/properties/location-map?lat=14.5547&lng=121.0244&title=Rockwell+Villa']}>
        <BrokerFullViewMap />
      </MemoryRouter>
    );

    const satelliteBtn = screen.getByText('Satellite');
    fireEvent.click(satelliteBtn);

    const iframeSatellite = screen.getByTitle(/Google Maps Full View Pinpoint/i);
    expect(iframeSatellite.getAttribute('src')).toContain('t=k');

    const terrainBtn = screen.getByText('Terrain');
    fireEvent.click(terrainBtn);

    const iframeTerrain = screen.getByTitle(/Google Maps Full View Pinpoint/i);
    expect(iframeTerrain.getAttribute('src')).toContain('t=p');
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
