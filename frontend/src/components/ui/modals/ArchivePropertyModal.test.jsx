import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArchivePropertyModal from './ArchivePropertyModal';

describe('ArchivePropertyModal Component', () => {
  const mockProperty = {
    id: 'prop-101',
    listingKey: 'HSR-AURELIA',
    title: 'Aurelia Modernist Penthouse',
    price: 45000000,
    mainImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  };

  it('renders single property archive dialog with title, price, and reassurance bullets', () => {
    render(
      <ArchivePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        property={mockProperty}
      />
    );

    expect(screen.getByText('Archive Property Listing?')).toBeInTheDocument();
    expect(screen.getByText('Aurelia Modernist Penthouse')).toBeInTheDocument();
    expect(screen.getByText('₱45,000,000')).toBeInTheDocument();
    expect(screen.getByText('Preserved with 1-Click Reactivation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archive Listing/i })).toBeInTheDocument();
  });

  it('renders batch mode when selectedCount is provided', () => {
    render(
      <ArchivePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedCount={3}
      />
    );

    expect(screen.getByText('Archive 3 Property Listings?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archive 3 Listings/i })).toBeInTheDocument();
  });

  it('calls onConfirm when clicking Archive button', () => {
    const handleConfirm = vi.fn();
    render(
      <ArchivePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        property={mockProperty}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Archive Listing/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
