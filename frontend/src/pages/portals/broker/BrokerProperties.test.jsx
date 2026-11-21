import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerProperties from './BrokerProperties';
import propertyService from '../../../services/propertyService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock propertyService
vi.mock('../../../services/propertyService', () => ({
  default: {
    getProperties: vi.fn(),
    createProperty: vi.fn((p) => Promise.resolve({ ...p, id: 'prop-dup' })),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
    getEditRequests: vi.fn().mockResolvedValue([])
  },
  normalizeProperty: (p) => p
}));

const mockData = [
  {
    id: 'prop-1',
    listingKey: 'HSR-10125001',
    title: 'Aurelia Modernist Penthouse at BGC',
    property_type: 'Condo',
    address: '8th Avenue cor. 36th Street',
    city: 'Bonifacio Global City, Taguig City',
    price: 158000000,
    price_raw: 158000000,
    livingArea: 188,
    bedrooms: 3,
    bathrooms: 3,
    standard_status: 'Active',
    status: 'AVAILABLE'
  },
  {
    id: 'prop-2',
    listingKey: 'HSR-10125002',
    title: 'Bespoke Rockwell Sky Penthouse',
    property_type: 'Condo',
    address: 'Rockwell Drive',
    city: 'Makati, Philippines',
    price: 125000000,
    price_raw: 125000000,
    livingArea: 180,
    bedrooms: 3,
    bathrooms: 3,
    standard_status: 'Draft',
    status: 'INACTIVE'
  },
  {
    id: 'prop-3',
    listingKey: 'HSR-10125003',
    title: 'Dasmarinas Village Sanctuary',
    property_type: 'House & Lot',
    address: '42 Palm Avenue',
    city: 'Dasmarinas Village, Makati',
    price: 295000000,
    price_raw: 295000000,
    livingArea: 250,
    bedrooms: 4,
    bathrooms: 3,
    standard_status: 'Pending Approval',
    status: 'PENDING'
  }
];

describe('BrokerProperties Page (Mockup & Modern SaaS Layout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    propertyService.getProperties.mockResolvedValue({ data: mockData });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerProperties />
      </BrowserRouter>
    );

  it('renders breadcrumbs, title, and action buttons', async () => {
    renderComponent();

    const allListingsElements = await screen.findAllByText('All Listings');
    expect(allListingsElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Property Listings')).toBeInTheDocument();
    expect(screen.getByText('Manage and organize your property listings.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();

    const newListingBtn = screen.getByRole('link', { name: /new listing/i });
    expect(newListingBtn).toBeInTheDocument();
    expect(newListingBtn).toHaveAttribute('href', '/broker/properties/create');
  });

  it('renders unified Filters button with status options and counts', async () => {
    renderComponent();

    const filterBtn = await screen.findByTestId('unified-filter-btn');
    expect(filterBtn).toBeInTheDocument();

    // Open unified Filters popover
    fireEvent.click(filterBtn);

    expect(screen.getByTestId('status-option-DRAFT')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-PENDING_APPROVAL')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-PUBLISHED')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-UNPUBLISHED')).toBeInTheDocument();
    expect(screen.getByTestId('status-option-CLOSED')).toBeInTheDocument();
  });

  it('renders table columns with specifications and bold price', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    expect(screen.getByText('ID: HSR-10125001')).toBeInTheDocument();
    expect(screen.getByText('8th Avenue cor. 36th Street')).toBeInTheDocument();
    expect(screen.getByText('Bonifacio Global City, Taguig City')).toBeInTheDocument();
    expect(screen.getByText('188 m²')).toBeInTheDocument();
    expect(screen.getByText('₱158,000,000')).toBeInTheDocument();
  });

  it('filters listings by clicking on status option from unified Filters popover', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    expect(screen.getByText('Dasmarinas Village Sanctuary')).toBeInTheDocument();

    // Open unified Filters popover
    const filterBtn = await screen.findByTestId('unified-filter-btn');
    fireEvent.click(filterBtn);

    // Click 'Pending Approval' option
    const pendingApprovalOption = screen.getByTestId('status-option-PENDING_APPROVAL');
    fireEvent.click(pendingApprovalOption);

    // Only 'Dasmarinas Village Sanctuary' (Pending Approval) should remain
    expect(screen.getByText('Dasmarinas Village Sanctuary')).toBeInTheDocument();
    expect(screen.queryByText('Aurelia Modernist Penthouse at BGC')).toBeNull();
  });

  it('allows duplicating a listing via the More Options dropdown menu', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    expect(moreButtons.length).toBeGreaterThanOrEqual(1);

    // Open More Options dropdown on first row
    fireEvent.pointerDown(moreButtons[0]);
    fireEvent.click(moreButtons[0]);

    // Find and click Duplicate Property menu item
    const duplicateBtn = await screen.findByRole('menuitem', { name: /duplicate property/i });
    fireEvent.click(duplicateBtn);

    // Check for duplicated row with (Copy) suffix
    await waitFor(() => {
      expect(screen.getByText('Aurelia Modernist Penthouse at BGC (Copy)')).toBeInTheDocument();
    });
  });

  it('does not render the removed View button in the Actions column', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    // Verify no "View" action link exists
    expect(screen.queryByRole('link', { name: /^view$/i })).toBeNull();
    expect(screen.queryByTitle('View Details')).toBeNull();
  });

  it('navigates directly to the listing editor when clicking a listed property row', async () => {
    renderComponent();

    const propertyRow = await screen.findByText('Aurelia Modernist Penthouse at BGC');
    fireEvent.click(propertyRow);

    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/prop-1/edit');
  });

  it('does not render Quick Edit or Dossier links across the portal', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();
    expect(screen.queryByText(/Quick Edit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dossier/i)).not.toBeInTheDocument();
  });

  it('switches view mode between Table, Grid, and Map View', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const mapViewBtn = screen.getByRole('button', { name: /Map View|Map/i });
    expect(mapViewBtn).toBeInTheDocument();
    fireEvent.click(mapViewBtn);

    expect(screen.getByTestId('cadastral-split-view')).toBeInTheDocument();
    expect(screen.getByTestId('map-property-card-prop-1')).toBeInTheDocument();

    const gridViewBtn = screen.getByRole('button', { name: /Grid View/i });
    fireEvent.click(gridViewBtn);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    expect(screen.getByTestId('grid-property-card-prop-1')).toBeInTheDocument();
  });

  it('allows broker to archive a property via row action and updates status', async () => {
    propertyService.updateProperty.mockResolvedValueOnce({ success: true });
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    expect(moreButtons.length).toBeGreaterThan(0);
    fireEvent.pointerDown(moreButtons[0]);
    fireEvent.click(moreButtons[0]);

    const archiveBtn = await screen.findByRole('menuitem', { name: /archive listing/i });
    fireEvent.click(archiveBtn);

    // Modal opens
    expect(await screen.findByText('Archive Property Listing?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /^Archive Listing$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(propertyService.updateProperty).toHaveBeenCalledWith(
        'prop-1',
        expect.objectContaining({ status: 'inactive', standard_status: 'Closed' })
      );
    });
  });

  it('allows broker to permanently delete a property with confirmation dialog', async () => {
    propertyService.deleteProperty.mockResolvedValueOnce({ success: true });
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    expect(moreButtons.length).toBeGreaterThan(0);
    fireEvent.pointerDown(moreButtons[0]);
    fireEvent.click(moreButtons[0]);

    const deleteBtn = await screen.findByRole('menuitem', { name: /delete property/i });
    fireEvent.click(deleteBtn);

    // Delete modal opens
    expect(await screen.findByText('Permanently Delete Listing?')).toBeInTheDocument();
    expect(screen.getByText('Caution: Irreversible Deletion')).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Delete Permanently/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(propertyService.deleteProperty).toHaveBeenCalledWith('prop-1');
    });
  });

  it('does not render column filter button and clamps pagination to page 1 when filtering from page 2', async () => {
    const manyRows = Array.from({ length: 10 }, (_, idx) => ({
      ...mockData[0],
      id: `prop-page-${idx + 1}`,
      listingKey: `HSR-2026-0${idx + 1}`,
      title: idx === 9 ? 'Unique Makati Courtyard Penthouse' : `BGC Residence ${idx + 1}`,
    }));
    propertyService.getProperties.mockResolvedValueOnce({ data: manyRows });
    renderComponent();

    expect(await screen.findByText('BGC Residence 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /customize columns/i })).not.toBeInTheDocument();

    // Navigate to Page 2
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('Unique Makati Courtyard Penthouse')).toBeInTheDocument();

    // Search for an item that shrinks results to 1 page -> should clamp back to Page 1 cleanly
    const searchInput = screen.getByPlaceholderText(/search properties/i);
    fireEvent.change(searchInput, { target: { value: 'BGC Residence 1' } });

    expect(await screen.findByText('BGC Residence 1')).toBeInTheDocument();
  });

  it('supports sorting by clicking the Price column header', async () => {
    renderComponent();

    expect(await screen.findByText('Aurelia Modernist Penthouse at BGC')).toBeInTheDocument();

    const priceHeaderBtn = screen.getByRole('button', { name: /^price$/i });
    fireEvent.click(priceHeaderBtn);

    const rows = screen.getAllByRole('row');
    // Row 1 (after header) should be highest price (Dasmarinas 295M)
    expect(rows[1]).toHaveTextContent('Dasmarinas Village Sanctuary');

    fireEvent.click(priceHeaderBtn);
    const rowsAsc = screen.getAllByRole('row');
    // Row 1 after second click should be lowest price (Bespoke Rockwell 125M)
    expect(rowsAsc[1]).toHaveTextContent('Bespoke Rockwell Sky Penthouse');
  });

  it('displays Assigned Agent or Unassigned, dismisses New/Edited on click, opens edit modal, and never renders Removed', async () => {
    const now = Date.now();
    const createdIso = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const editedIso = new Date(now - 5 * 60 * 1000).toISOString();

    propertyService.getProperties.mockResolvedValueOnce({
      data: [
        {
          ...mockData[0],
          id: 'prop-new-1',
          title: 'Fresh Unassigned Listing',
          created_at: createdIso,
          updated_at: createdIso,
        },
        {
          ...mockData[1],
          id: 'prop-edited-1',
          title: 'Edited Assigned Listing',
          agentName: 'Maria Santos',
          created_at: createdIso,
          updated_at: editedIso,
          lastEdit: {
            editedAt: editedIso,
            editedByName: 'Principal Broker',
            editedByRole: 'broker',
            changes: [{ field: 'Price', from: '120000000', to: '125000000' }],
          },
        },
      ],
    });

    renderComponent();

    expect(await screen.findByText('Fresh Unassigned Listing')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.queryByText('Removed')).not.toBeInTheDocument();

    // Clicking New dismisses it immediately
    const newBtn = screen.getByRole('button', { name: 'New' });
    fireEvent.click(newBtn);
    expect(screen.queryByRole('button', { name: 'New' })).not.toBeInTheDocument();

    // Clicking Edited dismisses it immediately AND opens the Edit Details modal
    const editedBtn = screen.getByRole('button', { name: 'Edited' });
    fireEvent.click(editedBtn);
    expect(screen.queryByRole('button', { name: 'Edited' })).not.toBeInTheDocument();

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Listing Edit Details')).toBeInTheDocument();
    expect(within(dialog).getByText(/Principal Broker/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Price')).toBeInTheDocument();
    expect(within(dialog).getByText(/120000000/)).toBeInTheDocument();
    expect(within(dialog).getByText(/125000000/)).toBeInTheDocument();
  });
});
