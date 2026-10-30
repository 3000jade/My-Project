import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionAiDock from '../../../components/subdivision/SubdivisionAiDock';
import SubdivisionLotInspector from '../../../components/subdivision/SubdivisionLotInspector';

describe('SubdivisionAiDock', () => {
  it('renders suggested boundary candidate card with confidence and area (FR-013)', () => {
    const handleAccept = vi.fn();
    const candidate = {
      coordinates: [
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 50, y: 50 },
        { x: 10, y: 50 },
      ],
      estimatedAreaSqm: 280,
      confidence: 0.92,
      is_verified: false,
    };

    render(
      <SubdivisionAiDock
        candidate={candidate}
        onAcceptCandidate={handleAccept}
      />
    );

    expect(screen.getByTestId('subdivision-ai-dock')).toBeInTheDocument();
    expect(screen.getByText('92% Confidence')).toBeInTheDocument();
    expect(screen.getByText('280 m²')).toBeInTheDocument();
    expect(screen.getByText(/Boundary is marked unverified/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Accept Boundary/i }));
    expect(handleAccept).toHaveBeenCalledTimes(1);
  });

  it('renders OCR recognition tray with Block and Lot numbers (FR-019)', () => {
    const handleApply = vi.fn();
    const ocrResult = {
      detectedText: 'BLK 4 LOT 12',
      confidence: 0.88,
      blockNumber: '4',
      lotNumber: '12',
    };

    render(
      <SubdivisionAiDock
        ocrResult={ocrResult}
        onApplyOcr={handleApply}
      />
    );

    expect(screen.getByText(/Recognized Identifiers/i)).toBeInTheDocument();
    expect(screen.getByText('88% Match')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Apply to Selected Lot Record/i }));
    expect(handleApply).toHaveBeenCalledWith(ocrResult);
  });
});

describe('SubdivisionLotInspector', () => {
  const mockLot = {
    id: 'lot-001',
    block_number: '3',
    lot_number: '15',
    verified_area_sqm: 320,
    price: 4500000,
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    is_verified: false,
  };

  it('renders lot metadata fields and triggers status update callback', () => {
    const handleUpdate = vi.fn();
    const handleRecalc = vi.fn();

    render(
      <SubdivisionLotInspector
        lot={mockLot}
        onUpdateLot={handleUpdate}
        onRecalculateArea={handleRecalc}
      />
    );

    expect(screen.getByText(/Block 3, Lot 15/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('320')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4500000')).toBeInTheDocument();

    // Switch to Reserved
    fireEvent.click(screen.getByRole('button', { name: 'Reserved' }));
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ availability_status: 'Reserved' })
    );

    // Recalculate area
    fireEvent.click(screen.getByRole('button', { name: /Compute Area/i }));
    expect(handleRecalc).toHaveBeenCalledTimes(1);
  });
});
