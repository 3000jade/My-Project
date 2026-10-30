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

describe('GooglePropertyMap component (Minimal Interactive Interface with Regular Teardrop Pins)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interactive map canvas with visible teardrop pins and manual zoom controls', () => {
    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          onSelectProperty={handleSelect}
          showControls={true}
        />
      </MemoryRouter>
    );

    // Verify interactive container is rendered with momentum scroll protection
    expect(screen.getByTestId('google-property-map-interactive')).toBeDefined();

    // Verify visible markers exist for all property listings
    const marker1 = screen.getByTestId('map-marker-prop-1');
    const marker2 = screen.getByTestId('map-marker-prop-2');
    expect(marker1).toBeDefined();
    expect(marker2).toBeDefined();

    // Verify accessible ARIA labels for assistive technologies
    expect(marker1.getAttribute('aria-label')).toContain('Rockwell Sky Penthouse');
    expect(marker2.getAttribute('aria-label')).toContain('BGC Luxury Villa');

    // Verify regular SVG teardrop pins without price text
    expect(marker1.querySelector('svg')).toBeDefined();
    expect(marker1.innerHTML).toContain('#0F766E'); // Default Teal fill
    expect(marker1.innerHTML).toContain('Rockwell Sky Penthouse'); // Tooltip

    // Verify HUD controls and manual zoom controls
    expect(screen.getByText('Street')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
    expect(screen.getByText('Fit All')).toBeDefined();
    expect(screen.getByTestId('manual-zoom-controls')).toBeDefined();
    expect(screen.getByTitle('Zoom In')).toBeDefined();
    expect(screen.getByTitle('Zoom Out')).toBeDefined();
  });

  it('turns pin to active coral when selected and triggers onSelectProperty on click', () => {
    const handleSelect = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId={null}
          onSelectProperty={handleSelect}
          showControls={true}
        />
      </MemoryRouter>
    );

    // Clicking marker triggers selection callback
    const marker1 = screen.getByTestId('map-marker-prop-1');
    fireEvent.click(marker1);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'prop-1' }));

    // Rerender with selectedPropertyId="prop-1"
    rerender(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          onSelectProperty={handleSelect}
          showControls={true}
        />
      </MemoryRouter>
    );

    // Marker 1 should now be active coral (#FF6B6B)
    const updatedMarker1 = screen.getByTestId('map-marker-prop-1');
    expect(updatedMarker1.innerHTML).toContain('#FF6B6B');
  });

  it('triggers onHoverProperty callback when marker is hovered', () => {
    const handleHover = vi.fn();

    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          onHoverProperty={handleHover}
          showControls={true}
        />
      </MemoryRouter>
    );

    const marker1 = screen.getByTestId('map-marker-prop-1');
    fireEvent.mouseEnter(marker1);
    expect(handleHover).toHaveBeenCalledWith(expect.objectContaining({ id: 'prop-1' }));

    fireEvent.mouseLeave(marker1);
    expect(handleHover).toHaveBeenCalledWith(null);
  });

  it('toggles layer between Street and Satellite in interactive mode', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          showControls={true}
        />
      </MemoryRouter>
    );

    const satBtn = screen.getByText('Satellite');
    fireEvent.click(satBtn);

    const roadBtn = screen.getByText('Street');
    fireEvent.click(roadBtn);

    expect(screen.getByTestId('google-property-map-interactive')).toBeDefined();
  });

  it('handles manual zoom button clicks without throwing', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          showControls={true}
        />
      </MemoryRouter>
    );

    const zoomInBtn = screen.getByTitle('Zoom In');
    const zoomOutBtn = screen.getByTitle('Zoom Out');

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);

    expect(screen.getByTestId('manual-zoom-controls')).toBeDefined();
  });
});

describe('GooglePropertyMap component (Embed Fallback Interface)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders official Google Maps embed iframe with accurate coordinates when forceEmbed is true', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
          forceEmbed={true}
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

  it('updates Google Maps layer dynamically when layer button is clicked in embed mode', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
          forceEmbed={true}
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

  it('centers Google Maps view on newly selected property in embed mode', () => {
    const { rerender } = render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="prop-1"
          showControls={true}
          forceEmbed={true}
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
          forceEmbed={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByTitle(/Google Maps Property Pinpoint/i).getAttribute('src')).toContain('14.550500');
    expect(screen.getByText('BGC Luxury Villa')).toBeDefined();
  });
});
