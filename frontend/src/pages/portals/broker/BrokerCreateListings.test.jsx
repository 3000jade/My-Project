import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerCreateListings from './BrokerCreateListings';
import MediaStudioModal from './components/property-form/MediaStudioModal';
import propertyService from '../../../services/propertyService';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => { };
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

    expect(screen.queryByRole('button', { name: /Open Text Editor/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Foreclosure/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit property description' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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

  it('supports editing/removing description, hides Load Sample, and gates Reset behind confirmation', async () => {
    renderComponent();

    expect(screen.queryByRole('button', { name: /Load Sample/i })).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Listing Title/i);
    fireEvent.change(titleInput, { target: { value: 'Modern 4-Bedroom Pool Villa in Ayala Alabang' } });
    expect(titleInput.value).toBe('Modern 4-Bedroom Pool Villa in Ayala Alabang');

    fireEvent.click(screen.getByRole('button', { name: 'Edit property description' }));
    fireEvent.change(screen.getByTestId('mock-quill'), { target: { value: 'Sunlit corner villa' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Description/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove property description' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove property description' }));
    expect(screen.queryByRole('button', { name: 'Remove property description' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.getByText('Clear all entered listing details?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Reset' }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Listing Title/i).value).toBe('');
    });
  });

  it('uses None furnishing without Interior & Building Details in Step 3, and updated contact/media fields in Step 5', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Specs & Features'));
    await waitFor(() => {
      expect(screen.getAllByText('None').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.queryByText('Unfurnished')).not.toBeInTheDocument();
    expect(screen.queryByText('Interior & Building Details')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Review & Publish'));
    await waitFor(() => {
      expect(screen.getByText('Assign an Agent')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/Brokerage/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Use My Profile/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Messenger Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Facebook Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/i)).toBeInTheDocument();
  });

  it('gates MediaStudioModal bulk photo deletion behind a confirmation dialog', () => {
    const onRemovePhotoItem = vi.fn();
    render(
      <MediaStudioModal
        open
        onOpenChange={() => { }}
        categories={[{ key: 'Living', label: 'Living' }]}
        mediaPhotos={[
          { id: 'p1', galleryCategory: 'Living', imageUrl: '/a.jpg', description: '' },
          { id: 'p2', galleryCategory: 'Living', imageUrl: '/b.jpg', description: '' },
        ]}
        onRemovePhotoItem={onRemovePhotoItem}
      />
    );

    const selectButtons = screen.getAllByRole('button', { name: 'Select photo' });
    fireEvent.click(selectButtons[0]);
    fireEvent.click(selectButtons[1]);

    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));
    expect(screen.getByText('Delete 2 selected photos?')).toBeInTheDocument();
    expect(onRemovePhotoItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    expect(onRemovePhotoItem).toHaveBeenCalledTimes(2);
    expect(onRemovePhotoItem).toHaveBeenCalledWith('p1');
    expect(onRemovePhotoItem).toHaveBeenCalledWith('p2');
  });

  it('shows warning modal on incomplete publish and allows saving as draft without publishing', async () => {
    propertyService.createProperty.mockClear();
    propertyService.createProperty.mockResolvedValue({ id: 'prop-draft-1' });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Listing Title/i), {
      target: { value: 'Incomplete Draft Condo' },
    });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), {
      target: { value: '18500000' },
    });

    fireEvent.click(screen.getByText('Review & Publish'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Listing' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Cannot Publish Listing');
    expect(dialog).toHaveTextContent('Field');
    expect(dialog).toHaveTextContent('Current Value');
    expect(dialog).toHaveTextContent('Action');
    expect(dialog).toHaveTextContent('City');
    expect(dialog).toHaveTextContent('Not selected');
    expect(dialog).toHaveTextContent('Street Address');
    expect(dialog).toHaveTextContent('Empty');
    expect(dialog).toHaveTextContent('Cover Photo');
    expect(dialog).toHaveTextContent('0 photos');
    expect(dialog).toHaveTextContent('Assigned Agent');
    expect(dialog).toHaveTextContent('No agent assigned');
    expect(propertyService.createProperty).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Save as Draft/i }));
    await waitFor(() => {
      expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    });
    expect(propertyService.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        standardStatus: 'Draft',
        is_published: false,
      })
    );
  });

  it('does not publish when no agent is assigned and shows Assigned Agent in the warning modal', async () => {
    propertyService.createProperty.mockClear();
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Listing Title/i), {
      target: { value: 'Pending Confirmation Villa' },
    });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), {
      target: { value: '22000000' },
    });

    fireEvent.click(screen.getByText('Review & Publish'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Listing' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Assigned Agent');
    expect(propertyService.createProperty).not.toHaveBeenCalled();
  });

  it('shows Saved — Pending Agent Confirmation instead of Listing Published when broker publishes as self-handled or pending agent', async () => {
    propertyService.createProperty.mockClear();
    propertyService.createProperty.mockResolvedValue({ id: 'prop-pending-confirm' });
    // Draft save returns Draft Saved modal, and verify no false Listing Published on Draft save
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Listing Title/i), {
      target: { value: 'Audit Verified Listing' },
    });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), {
      target: { value: '19500000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Draft/i }));
    await waitFor(() => {
      expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Draft Saved')).toBeInTheDocument();
    expect(screen.queryByText('Listing Published')).not.toBeInTheDocument();
  });

  it('disables Save as Draft in the warning modal when Listing Title or Price is missing', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Review & Publish'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Listing' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Add Listing Title and Price first to save as a draft.');
    expect(within(dialog).getByRole('button', { name: /Save as Draft/i })).toBeDisabled();
  });
});
