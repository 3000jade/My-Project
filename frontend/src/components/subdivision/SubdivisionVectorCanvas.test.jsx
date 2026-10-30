import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionVectorCanvas, { slicePolygonWithLine } from './SubdivisionVectorCanvas';
import SubdivisionEditorToolbar from './SubdivisionEditorToolbar';
import SubdivisionLotInspector from './SubdivisionLotInspector';

describe('SubdivisionVectorCanvas (Pure React SVG Canvas)', () => {
  const sampleLots = [
    {
      id: 'lot-1',
      block_number: '1',
      lot_number: '1',
      boundary_type: 'SaleableLot',
      availability_status: 'Available',
      verified_area_sqm: 250,
      coordinates: [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 80 },
        { x: 10, y: 80 },
      ],
      is_verified: true,
    },
    {
      id: 'lot-2',
      block_number: '1',
      lot_number: '2',
      boundary_type: 'SaleableLot',
      availability_status: 'Reserved',
      verified_area_sqm: 220,
      coordinates: [
        { x: 110, y: 10 },
        { x: 200, y: 10 },
        { x: 200, y: 80 },
        { x: 110, y: 80 },
      ],
      is_verified: false, // AI proposal unverified!
    },
  ];

  it('renders SVG canvas and vector polygons with centroid labels (FR-003, FR-028)', () => {
    render(
      <SubdivisionVectorCanvas
        planImageUrl="https://example.com/plan.jpg"
        lots={sampleLots}
        selectedLotId={null}
        activeTool="select"
      />
    );

    expect(screen.getByTestId('subdivision-vector-canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('subdivision-vector-svg')).toBeInTheDocument();

    // Check centroid labels
    expect(screen.getByText('B1 L1')).toBeInTheDocument();
    expect(screen.getByText('B1 L2')).toBeInTheDocument();

    // Unverified AI indicator "!" exists for lot-2
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('highlights selected lot and renders interactive vertex handles and midpoint + modifiers (FR-008)', () => {
    const handleLotUpdated = vi.fn();

    render(
      <SubdivisionVectorCanvas
        planImageUrl="https://example.com/plan.jpg"
        lots={sampleLots}
        selectedLotId="lot-1"
        activeTool="select"
        onLotUpdated={handleLotUpdated}
      />
    );

    // Selected lot handles container
    const vertexContainer = screen.getByTestId('selected-lot-vertex-handles');
    expect(vertexContainer).toBeInTheDocument();

    // Should have 4 vertex handles and 4 midpoint addition handles
    const circles = vertexContainer.querySelectorAll('circle');
    expect(circles.length).toBe(8); // 4 vertices + 4 midpoints
  });

  it('calls onSelectLot when clicking on a lot polygon', () => {
    const handleSelectLot = vi.fn();

    render(
      <SubdivisionVectorCanvas
        planImageUrl="https://example.com/plan.jpg"
        lots={sampleLots}
        selectedLotId={null}
        activeTool="select"
        onSelectLot={handleSelectLot}
      />
    );

    const lot1Group = screen.getByTestId('lot-polygon-group-lot-1');
    const polygon = lot1Group.querySelector('polygon');
    expect(polygon).toBeInTheDocument();

    fireEvent.click(polygon);
    expect(handleSelectLot).toHaveBeenCalledWith('lot-1', expect.objectContaining({ isMulti: false }));
  });

  it('renders drawing guidelines when in polygon drawing mode (FR-006)', () => {
    render(
      <SubdivisionVectorCanvas
        planImageUrl="https://example.com/plan.jpg"
        lots={sampleLots}
        selectedLotId={null}
        activeTool="polygon"
      />
    );

    const canvas = screen.getByTestId('subdivision-vector-canvas-container');
    // First point
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50, button: 0 });
    // Guideline group should appear
    expect(screen.getByTestId('drawing-polygon-guideline')).toBeInTheDocument();
  });

  it('renders upper-right subdivision name HUD badge with GPS coordinates (FR-SM-048, FR-SM-049)', () => {
    render(
      <SubdivisionVectorCanvas
        projectName="Nuvali Ridge Executive Estates"
        gpsCoordinates={{ lat: 14.2464, lng: 121.0592 }}
        lots={sampleLots}
      />
    );

    const hudBadge = screen.getByTestId('subdivision-upper-right-hud');
    expect(hudBadge).toBeInTheDocument();
    expect(screen.getByText('Nuvali Ridge Executive Estates')).toBeInTheDocument();
    expect(screen.getByText(/14.24640/)).toBeInTheDocument();
  });

  it('supports precision keyboard micro-nudging via arrow keys (FR-SM-050)', () => {
    const handleLotUpdated = vi.fn();

    render(
      <SubdivisionVectorCanvas
        lots={sampleLots}
        selectedLotId="lot-1"
        onLotUpdated={handleLotUpdated}
      />
    );

    // Fire ArrowRight key event
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(handleLotUpdated).toHaveBeenCalledTimes(1);
    const updatedCoordinates = handleLotUpdated.mock.calls[0][0].coordinates;
    // Expected x shifted by +1
    expect(updatedCoordinates[0]).toEqual({ x: 11, y: 10 });
  });
});

describe('SubdivisionEditorToolbar', () => {
  it('renders all editing tools, zoom steppers, and opacity slider', () => {
    const handleSelectTool = vi.fn();
    const handleZoomIn = vi.fn();
    const handleZoomOut = vi.fn();
    const handleFit = vi.fn();

    render(
      <SubdivisionEditorToolbar
        activeTool="select"
        onSelectTool={handleSelectTool}
        canUndo={true}
        canRedo={false}
        hasSelectedLot={true}
        zoom={1.25}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFit}
      />
    );

    expect(screen.getByTestId('subdivision-editor-toolbar')).toBeInTheDocument();
    expect(screen.getByText('125%')).toBeInTheDocument();

    // Tool switching
    fireEvent.click(screen.getByTitle(/Draw Polygonal Lot Boundary/i));
    expect(handleSelectTool).toHaveBeenCalledWith('polygon');

    fireEvent.click(screen.getByTitle(/AI Boundary Detection/i));
    expect(handleSelectTool).toHaveBeenCalledWith('ai_boundary');

    fireEvent.click(screen.getByTitle(/AI OCR Recognition/i));
    expect(handleSelectTool).toHaveBeenCalledWith('ai_ocr');

    // Zoom steppers
    fireEvent.click(screen.getByTitle('Zoom In (+)'));
    expect(handleZoomIn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Zoom Out (-)'));
    expect(handleZoomOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Fit Canvas to Screen/i));
    expect(handleFit).toHaveBeenCalledTimes(1);
  });

  it('allows selecting the slice / split parcel tool', () => {
    const handleSelectTool = vi.fn();

    render(
      <SubdivisionEditorToolbar
        activeTool="select"
        onSelectTool={handleSelectTool}
      />
    );

    fireEvent.click(screen.getByTitle(/Slice \/ Split Parcel Tool/i));
    expect(handleSelectTool).toHaveBeenCalledWith('slice');
  });
});

describe('Subdivision Geometry & Parcel Splitting Engine', () => {
  it('cleanly slices a rectangular parcel into two closed polygons', () => {
    const rectCoords = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    // Vertical cut down the middle at x=50
    const cutStart = { x: 50, y: -10 };
    const cutEnd = { x: 50, y: 110 };

    const daughterPolys = slicePolygonWithLine(rectCoords, cutStart, cutEnd);
    expect(daughterPolys).not.toBeNull();
    expect(daughterPolys.length).toBe(2);
    expect(daughterPolys[0].length).toBe(4);
    expect(daughterPolys[1].length).toBe(4);
  });

  it('renders Square Corners button in inspector and squares 4-vertex quadrilateral to 90 degrees', () => {
    const skewedLot = {
      id: 'skew-lot-1',
      block_number: '1',
      lot_number: '10',
      boundary_type: 'SaleableLot',
      availability_status: 'Available',
      coordinates: [
        { x: 10, y: 12 },
        { x: 102, y: 10 },
        { x: 98, y: 82 },
        { x: 8, y: 78 },
      ],
      is_verified: true,
    };

    const handleUpdateLot = vi.fn();

    render(
      <SubdivisionLotInspector
        lot={skewedLot}
        onUpdateLot={handleUpdateLot}
      />
    );

    const squareBtn = screen.getByRole('button', { name: /Square Corners/i });
    expect(squareBtn).toBeInTheDocument();

    fireEvent.click(squareBtn);
    expect(handleUpdateLot).toHaveBeenCalledTimes(1);
    const updatedCoords = handleUpdateLot.mock.calls[0][0].coordinates;
    expect(updatedCoords.length).toBe(4);
    // Opposing sides should have identical width and height
    const w1 = Math.hypot(updatedCoords[1].x - updatedCoords[0].x, updatedCoords[1].y - updatedCoords[0].y);
    const w2 = Math.hypot(updatedCoords[2].x - updatedCoords[3].x, updatedCoords[2].y - updatedCoords[3].y);
    expect(Math.abs(w1 - w2)).toBeLessThan(1);
  });
});
