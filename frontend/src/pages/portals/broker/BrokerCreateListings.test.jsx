import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerCreateListings from './BrokerCreateListings';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
let mockLocation = { search: '', state: null };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({ id: undefined }), // 'new' mode
    Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>
  };
});

// Mock Auth Context
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'broker-1',
      name: 'Broker Admin',
      role: 'broker',
      email: 'broker@humanshelter.ph'
    }
  })
}));

// Mock Property Service
vi.mock('../../../services/propertyService', () => ({
  default: {
    createProperty: vi.fn().mockResolvedValue({ id: 'new-prop-123', listing_key: 'HSR-9999' }),
    updateProperty: vi.fn().mockResolvedValue({ id: 'new-prop-123' }),
    getPropertyById: vi.fn().mockResolvedValue(null),
    uploadImage: vi.fn().mockResolvedValue({ url: 'https://placehold.co/800x600.jpg' })
  },
  normalizeProperty: (p) => p,
  toApiPayload: (d) => d
}));

// Mock Agent Service
vi.mock('../../../services/agentService', () => ({
  agentService: {
    getAgents: vi.fn().mockResolvedValue([
      { id: 'agent-1', name: 'Elena Rossi', email: 'elena@humanshelter.ph', role: 'Agent', assigned_properties_count: 5 },
      { id: 'agent-2', name: 'Alexander Sterling', email: 'alex@humanshelter.ph', role: 'Agent', assigned_properties_count: 2 }
    ])
  }
}));

// Mock Maps & Location Services
vi.mock('../../../services/mapsService', () => ({
  default: {
    searchAddressSuggestions: vi.fn().mockResolvedValue([]),
    reverseGeocodeCoordinates: vi.fn().mockResolvedValue({ formattedAddress: 'Makati, Metro Manila' })
  }
}));

vi.mock('../../../services/phLocationService', () => ({
  default: {
    getRegions: vi.fn().mockReturnValue([{ regionCode: '13', regionName: 'National Capital Region (NCR)' }]),
    getProvinces: vi.fn().mockReturnValue([{ provinceCode: '1339', provinceName: 'Metro Manila' }]),
    isProvinceApplicable: vi.fn().mockReturnValue(false),
    getCities: vi.fn().mockReturnValue([{ cityCode: '133901', cityName: 'Makati City' }]),
    getBarangays: vi.fn().mockResolvedValue([{ barangayCode: '133901001', barangayName: 'Bel-Air' }]),
    getZipSuggestions: vi.fn().mockReturnValue(['1209']),
    formatUnparsedAddress: vi.fn().mockReturnValue('Unit 42B, Makati City, Philippines')
  },
  phLocationService: {
    getRegions: vi.fn().mockReturnValue([{ regionCode: '13', regionName: 'National Capital Region (NCR)' }]),
    getProvinces: vi.fn().mockReturnValue([{ provinceCode: '1339', provinceName: 'Metro Manila' }]),
    isProvinceApplicable: vi.fn().mockReturnValue(false),
    getCities: vi.fn().mockReturnValue([{ cityCode: '133901', cityName: 'Makati City' }]),
    getBarangays: vi.fn().mockResolvedValue([{ barangayCode: '133901001', barangayName: 'Bel-Air' }]),
    getZipSuggestions: vi.fn().mockReturnValue(['1209']),
    formatUnparsedAddress: vi.fn().mockReturnValue('Unit 42B, Makati City, Philippines')
  }
}));

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: () => <div data-testid="mock-marker" />,
  useMapEvents: () => ({ flyTo: vi.fn() })
}));

// Mock React Quill Rich Text Editor
vi.mock('react-quill-new', () => ({
  default: ({ value, onChange, placeholder }) => (
    <textarea
      data-testid="mock-quill"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

describe('BrokerCreateListings - Form Fields & Step Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { search: '', state: null };
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BrokerCreateListings />
      </BrowserRouter>
    );
  };

  it('renders the 7-step navigation header with real-world broker milestone names and step badge', () => {
    renderComponent();

    // Verify all 7 real-world broker milestones appear in the navigation bar
    expect(screen.getAllByText('Listing Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Location & Address')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Property Specifications')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pricing & Terms')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Features & Amenities')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Photos & Maps')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Review & Publish')[0]).toBeInTheDocument();

    // Stepper header badge
    expect(screen.getAllByText(/Step 1 of 7/i)[0]).toBeInTheDocument();
  });

  it('allows filling Section 1 (Basic Info) fields and updates title', () => {
    renderComponent();

    // Step 1: Listing Title input
    const titleInput = screen.getByPlaceholderText(/e\.g\. Modernist Cantilever Estate at Ayala Alabang/i);
    expect(titleInput).toBeInTheDocument();

    // Test filling title
    fireEvent.change(titleInput, { target: { value: 'Luxury Penthouse at The Proscenium' } });
    expect(titleInput.value).toBe('Luxury Penthouse at The Proscenium');
  });

  it('renders Step 1 without any agent selector controls (decoupled to agent management)', () => {
    renderComponent();

    // Verify agent controls are absent from Step 1
    expect(screen.queryByText(/Assign Agent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select an Agent/i)).not.toBeInTheDocument();
  });

  it('navigates to Section 2 (Location & Address) and verifies address fields', () => {
    renderComponent();

    // Navigate to step 2: Location via stepper
    fireEvent.click(screen.getAllByText(/Location/i)[0]);

    // Verify location controls exist
    expect(screen.getByPlaceholderText(/Search Philippine address or landmark/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 142 Acacia Avenue, Phase 2/i)).toBeInTheDocument();
  });

  it('navigates to Section 3 (Property Specifications) and checks architectural and dimension fields', () => {
    renderComponent();

    // Navigate to Step 3: Specifications
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Check presence of Section 3 heading and floor area input
    expect(screen.getByText(/Section 3:.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 450/i)).toBeInTheDocument();
  });

  it('navigates to Section 4 (Pricing & Terms) and verifies price formatting', () => {
    renderComponent();

    // Navigate to Step 4: Pricing & Terms
    fireEvent.click(screen.getAllByText(/Pricing & Terms/i)[0]);

    // Find price input (placeholder: 150,000,000)
    const priceInput = screen.getByPlaceholderText('150,000,000');
    expect(priceInput).toBeInTheDocument();

    // Input raw number
    fireEvent.change(priceInput, { target: { value: '55000000' } });
    fireEvent.blur(priceInput);

    // Formatted price check with comma formatting
    expect(priceInput.value).toBe('55,000,000');
  });

  it('navigates to Section 7 (Review & Publish) and verifies submission actions', () => {
    renderComponent();

    // Click step 7: Review & Publish
    fireEvent.click(screen.getAllByText(/Review/i)[0]);

    // Should render review summary and publish buttons
    expect(screen.getByText(/Publish Listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Save Draft/i)).toBeInTheDocument();
  });

  it('renders all 8 common property type option cards in Step 1', () => {
    renderComponent();

    const expectedTypes = [
      'House and Lot',
      'Condominium',
      'Townhouse',
      'Subdivision Lot',
      'Commercial',
      'Apartment',
      'Villa',
      'Warehouse',
    ];

    expectedTypes.forEach(type => {
      expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
    });
  });

  it('selects a property type card and activates conditional adaptations in Section 3', () => {
    renderComponent();

    // Select Condominium card
    const condoCard = screen.getByRole('button', { name: /Condominium/i });
    fireEvent.click(condoCard);

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Lot Area input must be absent for Condominium
    expect(screen.queryByLabelText(/Lot Area \*/i)).not.toBeInTheDocument();
    // Floor Area must be present
    expect(screen.getByPlaceholderText(/e\.g\. 450/i)).toBeInTheDocument();
  });

  it('adapts Section 3 for Subdivision Lot by hiding interior room fields', () => {
    renderComponent();

    // Select Subdivision Lot
    const landCard = screen.getByRole('button', { name: /Subdivision Lot/i });
    fireEvent.click(landCard);

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Floor area should not be rendered for land
    expect(screen.queryByPlaceholderText(/e\.g\. 450/i)).not.toBeInTheDocument();
    // Land informational notice should be visible
    expect(screen.getByText(/Vacant Land listing selected/i)).toBeInTheDocument();
  });

  it('initializes property type from URL query parameter ?type=Condominium', () => {
    mockLocation = { search: '?type=Condominium', state: null };
    renderComponent();

    expect(screen.getByText(/Active:/i)).toHaveTextContent('Condominium');
  });
});
