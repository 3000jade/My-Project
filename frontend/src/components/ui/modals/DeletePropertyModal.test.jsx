import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeletePropertyModal from './DeletePropertyModal';

describe('DeletePropertyModal Component', () => {
  const mockProperty = {
    id: 'prop-102',
    listingKey: 'HSR-TEST-DRAFT',
    title: 'Draft Duplicate Lot',
    price: 6500000,
  };

  it('renders single property delete dialog with warning message and caution alert', () => {
    render(
      <DeletePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        property={mockProperty}
      />
    );

    expect(screen.getByText('Permanently Delete Listing?')).toBeInTheDocument();
    expect(screen.getByText('Draft Duplicate Lot')).toBeInTheDocument();
    expect(screen.getByText('₱6,500,000')).toBeInTheDocument();
    expect(screen.getByText('Caution: Irreversible Deletion')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete Permanently/i })).toBeInTheDocument();
  });

  it('renders batch mode with item count', () => {
    render(
      <DeletePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedCount={5}
      />
    );

    expect(screen.getByText('Permanently Delete 5 Listings?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete 5 Listings/i })).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <DeletePropertyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        property={mockProperty}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Delete Permanently/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
