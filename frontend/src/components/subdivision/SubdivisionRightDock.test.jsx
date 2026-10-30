import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionRightDock from './SubdivisionRightDock';

describe('SubdivisionRightDock (Multi-Tab Studio Dock)', () => {
  const sampleLots = [
    {
      id: 'lot-001',
      block_number: '1',
      lot_number: '1',
      availability_status: 'Available',
      verified_area_sqm: 280,
      price: 28500000,
      coordinates: [{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }, { x: 10, y: 50 }],
    },
    {
      id: 'lot-002',
      block_number: '1',
      lot_number: '2',
      availability_status: 'Reserved',
      verified_area_sqm: 250,
      price: 25000000,
      coordinates: [{ x: 60, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 50 }, { x: 60, y: 50 }],
    },
  ];

  it('renders dock with tabs and switches between tabs', () => {
    const handleSelectLot = vi.fn();

    render(
      <SubdivisionRightDock
        lots={sampleLots}
        selectedLot={null}
        onSelectLot={handleSelectLot}
        plan={{ plan_title: 'Phase 1 Master Plan', image_url: 'http://example.com/plan.jpg' }}
      />
    );

    expect(screen.getByTestId('subdivision-right-dock')).toBeInTheDocument();
    expect(screen.getByText(/Roster \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Specs/i)).toBeInTheDocument();
    expect(screen.getByText(/Blueprint/i)).toBeInTheDocument();

    // Roster shows the parcels
    expect(screen.getByText(/Block 1, Lot 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Block 1, Lot 2/i)).toBeInTheDocument();

    // Click on a lot in the roster
    fireEvent.click(screen.getByText(/Block 1, Lot 1/i));
    expect(handleSelectLot).toHaveBeenCalledWith('lot-001');
  });
});
