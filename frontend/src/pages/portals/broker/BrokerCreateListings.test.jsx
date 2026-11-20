import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerCreateListings from './BrokerCreateListings';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const mockNavigate = vi.fn();
let mockLocation = { search: '', state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({ id: undefined }),
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'broker-1',
      full_name: 'Principal Broker',
      name: 'Principal Broker',
      role: 'broker',
      email: 'broker@humanshelter.ph',
      prc_license: '0099887',
      phone: '+63 917 000 0000',
    },
  }),
}));

vi.mock('../../../services/propertyService', () => ({
  default: {
    getPropertyTypes: vi.fn().mockResolvedValue([]),
    createProperty: vi.fn().mockResolvedValue({ id: 'new-prop-123', listing_key: 'HSR-9999' }),
    updateProperty: vi.fn().mockResolvedValue({ id: 'new-prop-123' }),
    getPropertyById: vi.fn().mockResolvedValue(null),
    uploadImage: vi.fn().mockResolvedValue({ url: 'https://placehold.co/800x600.jpg' }),
  },
  normalizeProperty: (p) => p,
  toApiPayload: (d) => d,
}));

vi.mock('../../../services/agentService', () => {
  const agentsList = [
    {
      id: 'agent-1',
      full_name: 'Elena Rossi',
      email: 'elena@humanshelter.ph',
      prc_license: '0011223',
      phone: '+63 917 111 2222',
    },
    {
      id: 'agent-2',
      full_name: 'Alexander Sterling',
      email: 'alex@humanshelter.ph',
      prc_license: '0044556',
      phone: '+63 917 333 4444',
    },
  ];
  return {
    default: {
      getAgents: vi.fn().mockResolvedValue(agentsList),
    },
    agentService: {
      getAgents: vi.fn().mockResolvedValue(agentsList),
    },
  };
});

vi.mock('../../../services/mapsService', () => ({
  default: {
    autocomplete: vi.fn().mockResolvedValue([]),
    geocode: vi.fn().mockResolvedValue(null),
    reverse: vi.fn().mockResolvedValue({ formattedAddress: 'Makati, Metro Manila' }),
    suggestNearbyPlaces: vi.fn().mockResolvedValue({ nearbyPlaces: {}, pins: [] }),
  },
}));

vi.mock('../../../services/driveService', () => ({
  default: {
    uploadListingPhoto: vi.fn().mockResolvedValue({ url: 'https://placehold.co/800x600.jpg' }),
    uploadListingVideo: vi.fn().mockResolvedValue({ url: 'https://placehold.co/video.mp4' }),
  },
  resolveDriveImageUrl: (u) => u,
}));

vi.mock('../../../services/phLocationService', () => ({
  default: {
    getRegions: vi.fn().mockReturnValue([{ regionCode: '13', regionName: 'National Capital Region (NCR)' }]),
    getProvinces: vi.fn().mockReturnValue([]),
    isProvinceApplicable: vi.fn().mockReturnValue(false),
    getCities: vi.fn().mockReturnValue([{ cityCode: '137602', cityName: 'City Of Makati' }]),
    getBarangays: vi.fn().mockResolvedValue([{ barangayCode: '137602002', barangayName: 'Bel-Air' }]),
  },
}));

vi.mock('./components/property-form/LocationPinMap', () => ({
  default: () => <div data-testid="mock-map" />,
}));

vi.mock('react-quill-new', () => ({
  default: ({ value, onChange, placeholder }) => (
    <textarea
      data-testid="mock-quill"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('BrokerCreateListings - 5-Step Flow, Auto Ref Code, Multi-Bank & Sticky Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { search: '', state: null };
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerCreateListings />
      </BrowserRouter>
    );

  it('renders 5-step header, required legend without (Optional), and sticky preview sidebar', () => {
    const { container } = renderComponent();

    expect(screen.getByRole('heading', { name: 'Create Property Listing' })).toBeInTheDocument();
    expect(screen.getByText('Details & Price')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Specs & Features')).toBeInTheDocument();
    expect(screen.getByText('Photos & Floor Plan')).toBeInTheDocument();
    expect(screen.getByText('Review & Publish')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();

    expect(screen.getByText(/Required fields/i)).toBeInTheDocument();
    expect(screen.queryByText(/\(Optional\)/i)).not.toBeInTheDocument();

    const stickyAside = container.querySelector('aside');
    expect(stickyAside).toBeTruthy();
    expect(stickyAside.className).toContain('lg:sticky');
    expect(stickyAside.className).toContain('lg:top-20');
  });

  it('displays auto-generated read-only Reference Code and manual Price per Sqm without auto-calc', () => {
    renderComponent();

    expect(screen.getByText('Auto-generated on save')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/HSR-2026-001/i)).not.toBeInTheDocument();

    expect(screen.queryByText('Auto-calculated')).not.toBeInTheDocument();
    expect(screen.queryByText('Add area in Step 3')).not.toBeInTheDocument();

    const pricePerSqmInput = screen.getByLabelText('Price per Sqm (PHP)');
    expect(pricePerSqmInput.tagName).toBe('INPUT');
    fireEvent.change(pricePerSqmInput, { target: { value: '185,000' } });
    expect(pricePerSqmInput.value).toBe('185,000');
  });

  it('supports selecting multiple Partnered Banks without bank category body text', async () => {
    renderComponent();

    const trigger = screen.getByRole('button', { name: /Partnered Banks/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('BDO Unibank (Banco de Oro)')).toBeInTheDocument();
    });

    expect(screen.queryByText('Major Commercial and Universal Banks')).not.toBeInTheDocument();
    expect(screen.queryByText('Government & Thrift / Foreign Partner Lenders')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('BDO Unibank (Banco de Oro)'));
    fireEvent.click(screen.getByText('Pag-IBIG Fund (HDMF)'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove BDO Unibank (Banco de Oro)' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Pag-IBIG Fund (HDMF)' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Major Commercial and Universal Banks')).not.toBeInTheDocument();
    expect(screen.queryByText('Government & Thrift / Foreign Partner Lenders')).not.toBeInTheDocument();
  });

  it('syncs Live Buyer Preview card and maps legacy ?type=condoUnit query slug cleanly', () => {
    mockLocation = { search: '?type=condoUnit', state: null };
    renderComponent();

    expect(screen.getAllByText(/Condo Unit \(by cut\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('CONDOUNIT')).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Listing Title/i);
    fireEvent.change(titleInput, { target: { value: 'Skyline Residence BGC' } });
    expect(screen.getByRole('heading', { name: /Skyline Residence BGC/i })).toBeInTheDocument();
  });

  it('navigates across steps with zero (Optional) tags and shows Publish Listing in Step 5', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Location'));
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.queryByText(/\(Optional\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Specs & Features'));
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    expect(screen.queryByText(/\(Optional\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Photos & Floor Plan'));
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
    expect(screen.queryByText(/\(Optional\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Review & Publish'));
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(screen.queryByText(/\(Optional\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish Listing' })).toBeInTheDocument();
  });
});
