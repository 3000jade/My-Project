import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiUnitDrawer from './MultiUnitDrawer';

describe('MultiUnitDrawer', () => {
  const mockCluster = {
    id: 'anchor-14.5547-121.0350',
    title: 'The Grand Residences',
    priceRange: '₱4.5M - ₱12M',
    count: 2,
    city: 'Makati City',
    properties: [
      {
        id: 'u1',
        title: 'Luxury 1BR Suite',
        unit_number: 'Unit 12B',
        tower_name: 'East Tower',
        floor_level: '12',
        price: '₱4,500,000',
        bedrooms: 1,
        bathrooms: 1,
        floor_area_sqm: 45,
      },
      {
        id: 'u2',
        title: 'Executive Penthouse',
        unit_number: 'PH-01',
        tower_name: 'East Tower',
        floor_level: '45',
        price: '₱12,000,000',
        bedrooms: 3,
        bathrooms: 3.5,
        floor_area_sqm: 160,
      },
    ],
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <MultiUnitDrawer isOpen={false} cluster={mockCluster} onClose={vi.fn()} onSelectProperty={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders cluster title, unit count, and properties when open', () => {
    render(
      <MultiUnitDrawer isOpen={true} cluster={mockCluster} onClose={vi.fn()} onSelectProperty={vi.fn()} />
    );

    expect(screen.getByText('The Grand Residences')).toBeDefined();
    expect(screen.getByText(/2 Residences/i)).toBeDefined();
    expect(screen.getByText('Luxury 1BR Suite')).toBeDefined();
    expect(screen.getByText('Executive Penthouse')).toBeDefined();
  });

  it('calls onSelectProperty when clicking a unit card', () => {
    const onSelect = vi.fn();
    render(
      <MultiUnitDrawer isOpen={true} cluster={mockCluster} onClose={vi.fn()} onSelectProperty={onSelect} />
    );

    const unitCard = screen.getByTestId('unit-card-u1');
    fireEvent.click(unitCard);
    expect(onSelect).toHaveBeenCalledWith(mockCluster.properties[0]);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <MultiUnitDrawer isOpen={true} cluster={mockCluster} onClose={onClose} onSelectProperty={vi.fn()} />
    );

    const closeBtn = screen.getByLabelText(/close drawer/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

