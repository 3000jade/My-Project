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

  it('allows filling Section 1 (Listing Overview) fields and verifies clean Add Property header, removal of agent dropdown and category grid', () => {
    renderComponent();

    // Verify PageHeader has clean title "Add Property" and no RESO jargon subtitle
    expect(screen.getByText('Add Property')).toBeInTheDocument();
    expect(screen.queryByText(/Modern SaaS registry compliant/i)).not.toBeInTheDocument();

    // Step 1: Listing Title input
    const titleInput = screen.getByPlaceholderText(/e\.g\. Modernist Cantilever Estate at Ayala Alabang/i);
    expect(titleInput).toBeInTheDocument();
    fireEvent.change(titleInput, { target: { value: 'Luxury Penthouse at The Proscenium' } });
    expect(titleInput.value).toBe('Luxury Penthouse at The Proscenium');

    // Tagline input
    const taglineInput = screen.getByPlaceholderText(/e\.g\. Elevated residential lot overlooking Laguna de Bay/i);
    expect(taglineInput).toBeInTheDocument();
    fireEvent.change(taglineInput, { target: { value: 'High-floor Rockwell corner unit' } });
    expect(taglineInput.value).toBe('High-floor Rockwell corner unit');

    // Verify Reference Code input is removed from Step 1 Listing Overview
    expect(screen.queryByPlaceholderText(/e\.g\. CAD-HAV-B12-L04/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MLS \/ Cadastral Reference Code/i)).not.toBeInTheDocument();

    // Verify Assigned Listing Agent and Category Option Grid are removed
    expect(screen.queryByText(/Assigned Listing Agent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Category \/ Type Classification/i)).not.toBeInTheDocument();

    // Verify Active Property Type badge and Change link exist
    expect(screen.getByText(/Type:/i)).toBeInTheDocument();
    expect(screen.getByText(/Change/i)).toBeInTheDocument();
  });

  it('navigates to Section 2 (Location & Address) and verifies tailored subdivision block/lot fields', () => {
    renderComponent();

    // Navigate to step 2: Location via stepper
    fireEvent.click(screen.getAllByText(/Location/i)[0]);

    // Verify location controls exist
    expect(screen.getByPlaceholderText(/Search Philippine address or landmark/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 142 Acacia Avenue, Phase 2/i)).toBeInTheDocument();

    // Verify tailored subdivision fields exist for residential lot / house and lot
    expect(screen.getByPlaceholderText(/e\.g\. Havila Highlands/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phase 2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Block 12')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Lot 4')).toBeInTheDocument();
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

  it('confirms property type cards are absent from Step 1 and handled by pre-creation gateway', () => {
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
      // Buttons with these names should NOT be present in Step 1 form
      expect(screen.queryByRole('button', { name: type })).not.toBeInTheDocument();
    });
  });

  it('receives Condominium via route param and activates conditional adaptations in Section 3', () => {
    mockLocation = { search: '?type=condominium', state: null };
    renderComponent();

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Lot Area input must be absent for Condominium
    expect(screen.queryByLabelText(/Lot Area \*/i)).not.toBeInTheDocument();
    // Floor Area must be present
    expect(screen.getByPlaceholderText(/e\.g\. (118|450)/i)).toBeInTheDocument();
  });

  it('adapts Section 3 for Subdivision Lot by hiding interior room fields when passed via route param', () => {
    mockLocation = { search: '?type=residentialLot', state: null };
    renderComponent();

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Floor area should not be rendered for land
    expect(screen.queryByPlaceholderText(/e\.g\. 450/i)).not.toBeInTheDocument();
    // Land informational notice should be visible
    expect(screen.getByText(/Vacant Land listing selected/i)).toBeInTheDocument();
  });

  it('renders Schema v1.0 specifications for Subdivision Lot (residentialLot) with dimensions, terrain, and title', () => {
    mockLocation = { search: '?type=residentialLot', state: null };
    renderComponent();

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Check tailored land fields
    expect(screen.getByPlaceholderText(/e\.g\. 15/i)).toBeInTheDocument(); // Road Frontage (m)
    expect(screen.getByPlaceholderText(/e\.g\. 18/i)).toBeInTheDocument(); // Lot Depth (m)
    expect(screen.getByText(/Topography \/ Terrain/i)).toBeInTheDocument();
    expect(screen.getByText(/Cadastral Survey Reference/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Title Status/i)).toBeInTheDocument();
  });

  it('renders Schema v1.0 specifications for Condominium with usable floor area and balcony view', () => {
    mockLocation = { search: '?type=condominium', state: null };
    renderComponent();

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText(/Specifications/i)[0]);

    // Check tailored condo fields
    expect(screen.getByPlaceholderText(/e\.g\. 118/i)).toBeInTheDocument(); // Floor Area
    expect(screen.getByText(/Balcony Details/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Makati CBD Skyline/i)).toBeInTheDocument(); // Balcony View Facing
  });

  it('initializes property type from URL query parameter ?type=Condominium', () => {
    mockLocation = { search: '?type=Condominium', state: null };
    renderComponent();

    expect(screen.getByText(/Type:\s*Condominium/i)).toBeInTheDocument();
  });

  it('renders Subdivision Master Plan banner in Step 2 and opens lot picker modal', () => {
    mockLocation = { search: '?type=houseAndLot', state: null };
    renderComponent();

    // Navigate to Step 2 (Location)
    fireEvent.click(screen.getAllByText(/Location/i)[0]);

    // Check Subdivision Master Plan banner
    expect(screen.getByText(/Subdivision Master Plan/i)).toBeInTheDocument();
    const selectBtn = screen.getByRole('button', { name: /Select from Subdivision Plan/i });
    expect(selectBtn).toBeInTheDocument();

    // Trigger modal open
    fireEvent.click(selectBtn);
    expect(screen.getByText(/Select from Subdivision Master Plan/i)).toBeInTheDocument();
  });

  it('renders condition state badge and agent placeholder in the listing preview card', () => {
    renderComponent();

    // The listing preview card should render the default condition state (e.g. RFO)
    const conditionBadges = screen.getAllByTestId('card-condition-badge');
    expect(conditionBadges.length).toBeGreaterThan(0);
    expect(conditionBadges[0]).toHaveTextContent(/RFO/i);

    // The listing preview card should render the agent placeholder
    const agentPlaceholder = screen.getByTestId('card-agent-placeholder');
    expect(agentPlaceholder).toBeInTheDocument();
    expect(agentPlaceholder).toHaveTextContent(/Human Shelter Desk/i);
    expect(agentPlaceholder).toHaveTextContent(/Listing Agent/i);
  });
});
