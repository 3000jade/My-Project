import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionBottomViewportDock from './SubdivisionBottomViewportDock';

describe('SubdivisionBottomViewportDock (Bottom Viewport HUD)', () => {
  it('renders zoom steppers, opacity slider, and ground switchers', () => {
    const handleZoomIn = vi.fn();
    const handleZoomOut = vi.fn();
    const handleFit = vi.fn();
    const handleChangeOpacity = vi.fn();
    const handleToggleBackground = vi.fn();

    render(
      <SubdivisionBottomViewportDock
        zoom={1.25}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFit}
        planOpacity={0.8}
        onChangeOpacity={handleChangeOpacity}
        backgroundMode="white"
        onToggleBackgroundMode={handleToggleBackground}
      />
    );

    expect(screen.getByTestId('subdivision-bottom-viewport-dock')).toBeInTheDocument();
    expect(screen.getByText('125%')).toBeInTheDocument();

    // Zoom in
    fireEvent.click(screen.getByTitle(/Zoom In/i));
    expect(handleZoomIn).toHaveBeenCalledTimes(1);

    // Zoom out
    fireEvent.click(screen.getByTitle(/Zoom Out/i));
    expect(handleZoomOut).toHaveBeenCalledTimes(1);

    // Fit to screen
    fireEvent.click(screen.getByTitle(/Fit Canvas to Screen/i));
    expect(handleFit).toHaveBeenCalledTimes(1);

    // Satellite toggle
    const satBtn = screen.getByText(/Satellite/i);
    fireEvent.click(satBtn);
    expect(handleToggleBackground).toHaveBeenCalledWith('satellite');
  });
});
