import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerCreateListings from './BrokerCreateListings';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BrokerCreateListings />
      </BrowserRouter>
    );
  };

  it('renders the 7-step navigation header with canonical section names', () => {
    renderComponent();

    // Verify all 7 steps appear in the navigation bar
    expect(screen.getAllByText('Basic Info')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Location')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Specifications')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pricing & Terms')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Amenities')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Media & Documents')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Review & Submit')[0]).toBeInTheDocument();
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

  it('navigates to Section 2 (Location) and verifies address fields', () => {
    renderComponent();

    // Navigate to step 2: Location via stepper
    fireEvent.click(screen.getAllByText('Location')[0]);

    // Verify location controls exist
    expect(screen.getByPlaceholderText(/Search Philippine address or landmark/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 142 Acacia Avenue, Phase 2/i)).toBeInTheDocument();
  });

  it('navigates to Section 3 (Specifications) and checks architectural and dimension fields', () => {
    renderComponent();

    // Navigate to Step 3: Specifications
    fireEvent.click(screen.getAllByText('Specifications')[0]);

    // Check presence of Section 3 heading and floor area input
    expect(screen.getByText(/Section 3: Specifications/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 450/i)).toBeInTheDocument();
  });

  it('navigates to Section 4 (Pricing & Terms) and verifies price formatting', () => {
    renderComponent();

    // Navigate to Step 4: Pricing & Terms
    fireEvent.click(screen.getAllByText('Pricing & Terms')[0]);

    // Find price input (placeholder: 150,000,000)
    const priceInput = screen.getByPlaceholderText('150,000,000');
    expect(priceInput).toBeInTheDocument();

    // Input raw number
    fireEvent.change(priceInput, { target: { value: '55000000' } });
    fireEvent.blur(priceInput);

    // Formatted price check with comma formatting
    expect(priceInput.value).toBe('55,000,000');
  });

  it('navigates to Section 7 (Review & Submit) and verifies submission actions', () => {
    renderComponent();

    // Click step 7: Review & Submit
    fireEvent.click(screen.getAllByText('Review & Submit')[0]);

    // Should render review summary and publish buttons
    expect(screen.getByText(/Publish Listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Save Draft/i)).toBeInTheDocument();
  });
});
