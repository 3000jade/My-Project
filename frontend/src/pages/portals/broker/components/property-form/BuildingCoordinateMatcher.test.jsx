import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BuildingCoordinateMatcher from './BuildingCoordinateMatcher';

describe('BuildingCoordinateMatcher', () => {
  it('renders nothing when buildingName is empty or short', () => {
    const { container } = render(
      <BuildingCoordinateMatcher buildingName="On" onApplyCoordinates={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders match pill when matching known building is typed', () => {
    render(
      <BuildingCoordinateMatcher
        buildingName="One Serendra"
        currentLatitude={null}
        currentLongitude={null}
        onApplyCoordinates={vi.fn()}
      />
    );

    expect(screen.getByTestId('building-coordinate-match-pill')).toBeDefined();
    expect(screen.getByText('One Serendra')).toBeDefined();
    expect(screen.getByText('Snap to Building Pin')).toBeDefined();
  });

  it('triggers onApplyCoordinates with exact coordinates when snap button is clicked', () => {
    const onApply = vi.fn();
    render(
      <BuildingCoordinateMatcher
        buildingName="One Serendra"
        currentLatitude={null}
        currentLongitude={null}
        onApplyCoordinates={onApply}
      />
    );

    fireEvent.click(screen.getByText('Snap to Building Pin'));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 14.5512,
        longitude: 121.0501,
        city: 'Taguig',
      })
    );
  });

  it('displays anchored indicator when coordinates already match the building pin', () => {
    render(
      <BuildingCoordinateMatcher
        buildingName="One Serendra"
        currentLatitude="14.5512"
        currentLongitude="121.0501"
        onApplyCoordinates={vi.fn()}
      />
    );

    expect(screen.getByTestId('anchor-snapped-indicator')).toBeDefined();
    expect(screen.getByText(/Anchored to One Serendra pin/i)).toBeDefined();
  });
});

