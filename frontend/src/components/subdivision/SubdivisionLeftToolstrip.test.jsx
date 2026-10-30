import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionLeftToolstrip from './SubdivisionLeftToolstrip';

describe('SubdivisionLeftToolstrip (CAD Left Vertical Dock)', () => {
  it('renders all CAD drafting tools and fires onSelectTool', () => {
    const handleSelectTool = vi.fn();
    const handleUndo = vi.fn();
    const handleRedo = vi.fn();

    render(
      <SubdivisionLeftToolstrip
        activeTool="select"
        onSelectTool={handleSelectTool}
        canUndo={true}
        canRedo={false}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
    );

    expect(screen.getByTestId('subdivision-left-toolstrip')).toBeInTheDocument();

    // Select tool
    const selectBtn = screen.getByTitle(/Select \(V\)/i);
    expect(selectBtn).toBeInTheDocument();

    // Polygon tool
    const polyBtn = screen.getByTitle(/Draw Polygon \(P\)/i);
    expect(polyBtn).toBeInTheDocument();
    fireEvent.click(polyBtn);
    expect(handleSelectTool).toHaveBeenCalledWith('polygon');

    // Slice tool
    const sliceBtn = screen.getByTitle(/Slice Boundary \(K\)/i);
    expect(sliceBtn).toBeInTheDocument();
    fireEvent.click(sliceBtn);
    expect(handleSelectTool).toHaveBeenCalledWith('slice');

    // Undo button
    const undoBtn = screen.getByTitle(/Undo \(Ctrl\+Z\)/i);
    expect(undoBtn).not.toBeDisabled();
    fireEvent.click(undoBtn);
    expect(handleUndo).toHaveBeenCalledTimes(1);

    // Redo button is disabled
    const redoBtn = screen.getByTitle(/Redo \(Ctrl\+Y\)/i);
    expect(redoBtn).toBeDisabled();
  });
});
