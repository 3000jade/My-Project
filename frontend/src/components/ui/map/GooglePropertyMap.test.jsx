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

    // Verify individual price pins at default zoom 15
    expect(marker1.className).toContain('#0F766E');
    expect(marker1.textContent).toContain('â‚±45M');

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

describe('GooglePropertyMap Multi-Property Pinpoint & MultiUnitDrawer', () => {
  const coLocatedProperties = [
    {
      id: 'tower-u1',
      title: 'One Serendra Unit 10A',
      building_name: 'One Serendra',
      price_raw: 28000000,
      price: 'â‚±28,000,000',
      currency: 'PHP',
      city: 'Taguig',
      latitude: 14.5512,
      longitude: 121.0501,
      unit_number: '10A',
      bedrooms: 1,
      bathrooms: 1,
    },
    {
      id: 'tower-u2',
      title: 'One Serendra Unit 24C',
      building_name: 'One Serendra',
      price_raw: 45000000,
      price: 'â‚±45,000,000',
      currency: 'PHP',
      city: 'Taguig',
      latitude: 14.5512,
      longitude: 121.0501,
      unit_number: '24C',
      bedrooms: 2,
      bathrooms: 2,
    },
    {
      id: 'single-lot',
      title: 'Ayala Alabang Lot',
      price_raw: 80000000,
      price: 'â‚±80,000,000',
      currency: 'PHP',
      city: 'Muntinlupa',
      latitude: 14.4239,
      longitude: 121.0264,
    },
  ];

  it('renders individual pins directly without grouping or MultiUnitDrawer', () => {
    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={coLocatedProperties}
          onSelectProperty={handleSelect}
          showControls={true}
        />
      </MemoryRouter>
    );

    const firstMarker = screen.getByTestId('map-marker-tower-u1');
    const secondMarker = screen.getByTestId('map-marker-tower-u2');
    const singleMarker = screen.getByTestId('map-marker-single-lot');

    expect(firstMarker).toBeDefined();
    expect(secondMarker).toBeDefined();
    expect(singleMarker).toBeDefined();

    fireEvent.click(firstMarker);
    expect(handleSelect).toHaveBeenCalledWith(coLocatedProperties[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('groups pins by area (e.g. Marikina) when zoom is between 13 and 14 and zooms to 15 on click', () => {
    const areaProps = [
      { id: 'm1', title: 'Marikina House 1', city: 'Marikina', price: 8500000, latitude: 14.6507, longitude: 121.1029 },
      { id: 'm2', title: 'Marikina House 2', city: 'Marikina', price: 9500000, latitude: 14.6520, longitude: 121.1040 },
      { id: 'mk1', title: 'Makati Condo', city: 'Makati', price: 18000000, latitude: 14.5547, longitude: 121.0244 },
    ];

    render(
      <MemoryRouter>
        <GooglePropertyMap properties={areaProps} initialZoom={13} showControls={true} />
      </MemoryRouter>
    );

    const marikinaPin = screen.getByTestId('area-cluster-marikina');
    const makatiPin = screen.getByTestId('area-cluster-makati');
    expect(marikinaPin.textContent).toContain('Marikina Â· 2');
    expect(makatiPin.textContent).toContain('Makati Â· 1');
    expect(screen.queryByTestId('map-marker-m1')).toBeNull();

    fireEvent.click(marikinaPin);
    const m1Pin = screen.getByTestId('map-marker-m1');
    const m2Pin = screen.getByTestId('map-marker-m2');
    expect(m1Pin.textContent).toContain('â‚±8.5M');
    expect(m2Pin.textContent).toContain('â‚±9.5M');
  });

  it('locks zoom controls and omits 360° Street View when lockZoom is true', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap
          properties={mockProperties}
          selectedPropertyId="101"
          singlePropertyMode={true}
          lockZoom={true}
          generalAreaOnly={true}
        />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('manual-zoom-controls')).toBeNull();
    expect(screen.queryByText(/360° Street View/i)).toBeNull();
  });

  it('omits Districts and Search as I move map buttons from the map HUD', () => {
    render(
      <MemoryRouter>
        <GooglePropertyMap properties={mockProperties} showControls={true} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /Districts/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Search as I move map/i })).toBeNull();
  });
});
