import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import GooglePropertyMap from './GooglePropertyMap';

const mockProperties = [
  {
    id: 'prop-1',
    title: 'Rockwell Sky Penthouse',
    price_raw: 45000000,
    price: 45000000,
    currency: 'PHP',
    city: 'Makati',
    subdivision: 'Rockwell Center',
    latitude: 14.5670,
    longitude: 121.0365,
  },
  {
    id: 'prop-2',
    title: 'BGC Luxury Villa',
    price_raw: 95000000,
    price: 95000000,
    currency: 'PHP',
    city: 'Taguig',
    subdivision: 'Bonifacio Global City',
    latitude: 14.5505,
    longitude: 121.0478,
  }
];

describe('GooglePropertyMap component (Embed Interface)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders official Google Maps embed iframe with accurate coordinates', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
        />
      </MemoryRouter>
    );

    // Verify container and embed iframe
    expect(screen.getByTestId('google-property-map-embed')).toBeDefined();
    const iframe = screen.getByTitle(/Google Maps Property Pinpoint/i);
    expect(iframe).toBeDefined();
    expect(iframe.getAttribute('src')).toContain('14.567000');
    expect(iframe.getAttribute('src')).toContain('121.036500');
    expect(iframe.getAttribute('src')).toContain('t=m');

    // Verify layer controls
    expect(screen.getByText('Roadmap')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
    expect(screen.getByText('Hybrid')).toBeDefined();
    expect(screen.getByText('Terrain')).toBeDefined();

    // Verify residence popover card
    expect(screen.getByText('Rockwell Sky Penthouse')).toBeDefined();
    expect(screen.getByText(/View Residence/i)).toBeDefined();
  });

  it('updates Google Maps layer dynamically when layer button is clicked', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
        />
      </MemoryRouter>
    );

    const satelliteBtn = screen.getByText('Satellite');
    fireEvent.click(satelliteBtn);

    const iframeSatellite = screen.getByTitle(/Google Maps Property Pinpoint/i);
    expect(iframeSatellite.getAttribute('src')).toContain('t=k');

    const terrainBtn = screen.getByText('Terrain');
    fireEvent.click(terrainBtn);

    const iframeTerrain = screen.getByTitle(/Google Maps Property Pinpoint/i);
    expect(iframeTerrain.getAttribute('src')).toContain('t=p');
  });

  it('centers Google Maps view on newly selected property', () => {
    const { rerender } = render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByTitle(/Google Maps Property Pinpoint/i).getAttribute('src')).toContain('14.567000');

    // Rerender with prop-2 selected
    rerender(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-2"
          showControls={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByTitle(/Google Maps Property Pinpoint/i).getAttribute('src')).toContain('14.550500');
    expect(screen.getByText('BGC Luxury Villa')).toBeDefined();
  });
});
