import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicSubdivisionMap from './PublicSubdivisionMap';
import subdivisionService from '../../services/subdivisionService';

vi.mock('../../services/subdivisionService', () => ({
  default: {
    getPublicMap: vi.fn(),
  },
  subdivisionService: {
    getPublicMap: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'mock-subdivision-1' }),
    Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>
  };
});

// Mock Canvas
vi.mock('../../components/subdivision/SubdivisionVectorCanvas', () => ({
  default: ({ lots, onSelectLot, selectedLotId }) => (
    <div data-testid="vector-canvas">
      <div>Vector Canvas ({lots.length} lots)</div>
      {lots.map((lot) => (
        <button
          key={lot.id}
          type="button"
          onClick={() => onSelectLot(lot)}
          data-testid={`lot-shape-${lot.id}`}
        >
          Lot {lot.block_number}-{lot.lot_number}
        </button>
      ))}
    </div>
  )
}));

const mockPublicMapData = {
  success: true,
  data: {
    project: {
      id: 'mock-subdivision-1',
      name: 'Havila Highlands Estate',
      city: 'Antipolo',
      province: 'Rizal',
      created_at: new Date().toISOString()
    },
    plan: {
      id: 'plan-1',
      image_url: 'https://placehold.co/1200x800.jpg',
      original_width: 1200,
      original_height: 800
    },
    lots: [
      {
        id: 'lot-1',
        block_number: '12',
        lot_number: '4',
        lot_type: 'SALEABLE_LOT',
        availability_status: 'AVAILABLE',
        verified_area_sqm: 240,
        price: 3600000,
        remarks: 'Prime corner lot overlooking valley',
        boundary_polygon: [{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }, { x: 10, y: 50 }]
      },
      {
        id: 'lot-2',
        block_number: '12',
        lot_number: '5',
        lot_type: 'SALEABLE_LOT',
        availability_status: 'RESERVED',
        verified_area_sqm: 180,
        price: 2700000,
        boundary_polygon: [{ x: 60, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 50 }, { x: 60, y: 50 }]
      },
      {
        id: 'lot-3',
        block_number: '14',
        lot_number: '1',
        lot_type: 'SALEABLE_LOT',
        availability_status: 'SOLD',
        verified_area_sqm: 200,
        price: 3000000,
        boundary_polygon: [{ x: 110, y: 10 }, { x: 150, y: 10 }, { x: 150, y: 50 }, { x: 110, y: 50 }]
      }
    ],
    versionNumber: 1,
    publishedAt: new Date().toISOString()
  }
};

describe('PublicSubdivisionMap - Visitor Interactive Experience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then displays published project header and stats', async () => {
    subdivisionService.getPublicMap.mockResolvedValue(mockPublicMapData);

    render(
      <BrowserRouter>
        <PublicSubdivisionMap />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading Subdivision Master Plan/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Havila Highlands Estate/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/v1\.0 Published/i)).toBeInTheDocument();
    expect(screen.getByText(/Antipolo, Rizal/i)).toBeInTheDocument();
    expect(screen.getByText(/Vector Canvas \(3 lots\)/i)).toBeInTheDocument();
  });

  it('filters lots list by search keyword', async () => {
    subdivisionService.getPublicMap.mockResolvedValue(mockPublicMapData);

    render(
      <BrowserRouter>
        <PublicSubdivisionMap />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Havila Highlands Estate/i })).toBeInTheDocument();
    });

    // Check search input
    const searchInput = screen.getByPlaceholderText(/Search Block or Lot/i);
    fireEvent.change(searchInput, { target: { value: 'Block 14' } });

    expect(screen.getByText(/Block 14, Lot 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Block 12, Lot 4/i)).not.toBeInTheDocument();
  });

  it('filters lots list by availability status', async () => {
    subdivisionService.getPublicMap.mockResolvedValue(mockPublicMapData);

    render(
      <BrowserRouter>
        <PublicSubdivisionMap />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Havila Highlands Estate/i })).toBeInTheDocument();
    });

    // Filter to Available only
    const availableFilterBtn = screen.getByRole('button', { name: /^Available$/i });
    fireEvent.click(availableFilterBtn);

    expect(screen.getByText(/Block 12, Lot 4/i)).toBeInTheDocument();
    expect(screen.queryByText(/Block 12, Lot 5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Block 14, Lot 1/i)).not.toBeInTheDocument();
  });

  it('selects a lot and displays details drawer and inquiry trigger', async () => {
    subdivisionService.getPublicMap.mockResolvedValue(mockPublicMapData);

    render(
      <BrowserRouter>
        <PublicSubdivisionMap />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Havila Highlands Estate/i })).toBeInTheDocument();
    });

    // Click on lot 1 shape
    const lotShape = screen.getByTestId('lot-shape-lot-1');
    fireEvent.click(lotShape);

    // Detail slide-over should open
    expect(screen.getByText(/Subdivision Lot Details/i)).toBeInTheDocument();
    expect(screen.getAllByText(/240 m²/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Prime corner lot overlooking valley/i)).toBeInTheDocument();

    // Trigger inquiry modal
    const inquireBtn = screen.getByRole('button', { name: /Inquire About Lot/i });
    fireEvent.click(inquireBtn);

    expect(screen.getByRole('heading', { name: /Inquire About Lot/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maria Santos/i)).toBeInTheDocument();
  });

  it('displays unavailable message gracefully when API returns error', async () => {
    subdivisionService.getPublicMap.mockRejectedValue(new Error('Published version not found'));

    render(
      <BrowserRouter>
        <PublicSubdivisionMap />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Map Currently Unavailable/i)).toBeInTheDocument();
    });
  });
});
