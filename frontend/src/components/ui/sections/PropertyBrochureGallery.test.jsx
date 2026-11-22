import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyBrochureGallery from './PropertyBrochureGallery';

describe('PropertyBrochureGallery (Hero Gallery with Status & Price)', () => {
  it('renders photos, status pills, price summary, and the All Photos trigger', () => {
    const onOpenGallery = vi.fn();

    render(
      <PropertyBrochureGallery
        photos={[
          'https://example.com/cover.jpg',
          'https://example.com/living.jpg',
          'https://example.com/kitchen.jpg',
        ]}
        title="Ayala Alabang Villa"
        transactionLabel="For Sale"
        propertyCondition="Ready for Occupancy"
        standardStatus="Active"
        isFeatured={true}
        formattedPriceDisplay="₱25,000,000"
        pricePerSqm={100000}
        onOpenGallery={onOpenGallery}
      />
    );

    expect(screen.getByAltText('Ayala Alabang Villa cover photo')).toBeInTheDocument();
    expect(screen.getByAltText('Ayala Alabang Villa preview 2')).toBeInTheDocument();
    expect(screen.getByAltText('Ayala Alabang Villa preview 3')).toBeInTheDocument();
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByText('Ready for Occupancy')).toBeInTheDocument();
    expect(screen.getByTestId('reso-standard-status')).toHaveTextContent('Active');
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Selling Price')).toBeInTheDocument();
    expect(screen.getByTestId('reso-list-price')).toHaveTextContent('₱25,000,000');

    fireEvent.click(screen.getByLabelText('View Ayala Alabang Villa photo 2'));
    expect(onOpenGallery).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('All Photos (3)'));
    expect(onOpenGallery).toHaveBeenCalledWith(0);
  });

  it('renders clean empty state when no photos are provided', () => {
    render(
      <PropertyBrochureGallery
        photos={[]}
        title="Empty Lot"
        transactionLabel="For Sale"
        formattedPriceDisplay="₱5,000,000"
      />
    );
    expect(screen.getByText('No photos uploaded yet')).toBeInTheDocument();
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByTestId('reso-list-price')).toHaveTextContent('₱5,000,000');
  });
});
