import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategoryAmenitiesPicker from './CategoryAmenitiesPicker';

describe('CategoryAmenitiesPicker', () => {
  it('renders land-specific amenities when property_type is residentialLot', () => {
    const setFormData = vi.fn();
    const setIsDirty = vi.fn();

    render(
      <CategoryAmenitiesPicker
        formData={{ property_type: 'residentialLot', amenities: [] }}
        setFormData={setFormData}
        setIsDirty={setIsDirty}
      />
    );

    expect(screen.getByText(/Electricity Grid Connection/i)).toBeInTheDocument();
    expect(screen.getByText(/Concrete Paved Road Access/i)).toBeInTheDocument();
    expect(screen.queryByText(/Wine Cellar/i)).not.toBeInTheDocument();
  });

  it('renders dwelling-specific amenities when property_type is houseAndLot', () => {
    const setFormData = vi.fn();
    const setIsDirty = vi.fn();

    render(
      <CategoryAmenitiesPicker
        formData={{ property_type: 'houseAndLot', amenities: [] }}
        setFormData={setFormData}
        setIsDirty={setIsDirty}
      />
    );

    expect(screen.getByText(/Smart Home Automation/i)).toBeInTheDocument();
    expect(screen.getByText(/Walk-in Closet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Concrete Paved Road Access/i)).not.toBeInTheDocument();
  });

  it('toggles an amenity selection and updates form state', () => {
    const setFormData = vi.fn();
    const setIsDirty = vi.fn();

    render(
      <CategoryAmenitiesPicker
        formData={{ property_type: 'houseAndLot', amenities: ['Wine Cellar'] }}
        setFormData={setFormData}
        setIsDirty={setIsDirty}
      />
    );

    const wineCellarBtn = screen.getByText(/Wine Cellar/i).closest('button');
    expect(wineCellarBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(wineCellarBtn);
    expect(setIsDirty).toHaveBeenCalledWith(true);
    expect(setFormData).toHaveBeenCalled();
  });

  it('allows adding a custom feature tag', () => {
    const setFormData = vi.fn();
    const setIsDirty = vi.fn();

    render(
      <CategoryAmenitiesPicker
        formData={{ property_type: 'houseAndLot', amenities: [] }}
        setFormData={setFormData}
        setIsDirty={setIsDirty}
      />
    );

    const input = screen.getByPlaceholderText(/Add custom feature/i);
    const addBtn = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'Helipad' } });
    fireEvent.click(addBtn);

    expect(setIsDirty).toHaveBeenCalledWith(true);
    expect(setFormData).toHaveBeenCalled();
  });
});

