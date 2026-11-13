import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropertyCard from './PropertyCard';

describe('PropertyCard Component', () => {
  const baseProperty = {
    id: 'prop-123',
    title: 'Luxury Villa in Tagaytay',
    status: 'AVAILABLE',
    standard_status: 'Active',
    transaction_type: 'For Sale',
    property_type: 'Single Family Residence',
    price: 15000000,
    address: '200 High Street',
    city: 'Tagaytay',
    province: 'Cavite',
    bedrooms_total: 4,
    bathrooms_total_integer: 3,
    living_area: 250,
    living_area_units: 'sqm',
    images: ['https://example.com/photo.jpg']
  };

  it('renders active property with "For Sale" badge and without Under Contract / Closed badges', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={baseProperty} />
      </MemoryRouter>
    );

    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByText('200 High Street, Tagaytay')).toBeInTheDocument();
    expect(screen.getByTestId('card-address-pin-icon')).toBeInTheDocument();
    expect(screen.queryByText('Luxury Villa in Tagaytay')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-status-badge')).toHaveTextContent('For Sale');
    expect(screen.queryByText(/Backup Inquiries Welcome/i)).not.toBeInTheDocument();

    const img = screen.getByAltText('200 High Street, Tagaytay');
    expect(img.className).not.toContain('grayscale');
  });

  it('renders under-contract property with Amber "Reserved" badge and no banner', () => {
    const underContractProp = {
      ...baseProperty,
      id: 'prop-under-contract',
      standard_status: 'Active Under Contract',
      status: 'RESERVED'
    };

    render(
      <MemoryRouter>
        <PropertyCard property={underContractProp} />
      </MemoryRouter>
    );

    const badge = screen.getByTestId('card-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Reserved');
    expect(badge).toHaveClass('text-amber-800', 'bg-amber-50/95');
    expect(screen.queryByText(/Backup Inquiries Welcome/i)).not.toBeInTheDocument();
  });

  it('renders closed/sold property with translucent card, bold "Sold" badge, and "View Past Sale" CTA', () => {
    const closedProp = {
      ...baseProperty,
      id: 'prop-closed',
      standard_status: 'Closed',
      status: 'SOLD'
    };

    render(
      <MemoryRouter>
        <PropertyCard property={closedProp} />
      </MemoryRouter>
    );

    // Translucent card styling (80% opacity)
    const card = screen.getByTestId('property-card');
    expect(card).toHaveClass('opacity-80');

    // Bold Sold badge
    const badge = screen.getByTestId('card-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Sold');
    expect(badge).toHaveClass('text-white', 'bg-rose-600');

    // No bottom banner
    expect(screen.queryByText(/Transaction Closed • Sold Benchmark/i)).not.toBeInTheDocument();

    // Price label indicates sold benchmark
    expect(screen.getByText('Sold benchmark')).toBeInTheDocument();

    // Button label is "View Past Sale"
    expect(screen.getByText(/View Past Sale/i)).toBeInTheDocument();

    // Image has subtle desaturation
    const img = screen.getByAltText('200 High Street, Tagaytay');
    expect(img.className).toContain('grayscale-[20%]');
    expect(img.className).toContain('opacity-90');
  });

  it('renders with isSelected or isHovered styling ring and elevated shadow', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PropertyCard property={baseProperty} isSelected={false} isHovered={false} />
      </MemoryRouter>
    );

    let card = screen.getByTestId('property-card');
    expect(card).toHaveClass('border-[#E2E8F0]');
    expect(card).not.toHaveClass('border-[#0F766E]');

    // When isSelected = true
    rerender(
      <MemoryRouter>
        <PropertyCard property={baseProperty} isSelected={true} isHovered={false} />
      </MemoryRouter>
    );
    card = screen.getByTestId('property-card');
    expect(card).toHaveClass('border-[#0F766E]', 'ring-2', 'ring-[#0F766E]/30');

    // When isHovered = true
    rerender(
      <MemoryRouter>
        <PropertyCard property={baseProperty} isSelected={false} isHovered={true} />
      </MemoryRouter>
    );
    card = screen.getByTestId('property-card');
    expect(card).toHaveClass('border-[#0F766E]', 'ring-2', 'ring-[#0F766E]/30');
  });

  it('triggers onMouseEnter and onMouseLeave callbacks', () => {
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();

    render(
      <MemoryRouter>
        <PropertyCard
          property={baseProperty}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </MemoryRouter>
    );

    const card = screen.getByTestId('property-card');

    fireEvent.mouseEnter(card);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(card);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('renders condition state badge and agent placeholder', () => {
    const propertyWithConditionAndAgent = {
      ...baseProperty,
      property_condition: 'Brand New',
      agent_name: 'John Dela Cruz'
    };

    render(
      <MemoryRouter>
        <PropertyCard property={propertyWithConditionAndAgent} />
      </MemoryRouter>
    );

    const conditionBadge = screen.getByTestId('card-condition-badge');
    expect(conditionBadge).toBeInTheDocument();
    expect(conditionBadge).toHaveTextContent('Brand New');

    const agentPlaceholder = screen.getByTestId('card-agent-placeholder');
    expect(agentPlaceholder).toBeInTheDocument();
    expect(agentPlaceholder).toHaveTextContent('John Dela Cruz');
  });

  it('calls onSelect on first click when not selected, and navigates on second click when selected', () => {
    const handleSelect = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <PropertyCard property={baseProperty} isSelected={false} onSelect={handleSelect} />
      </MemoryRouter>
    );

    const card = screen.getByTestId('property-card');
    fireEvent.click(card);
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(baseProperty);

    // Rerender with isSelected = true after first click
    rerender(
      <MemoryRouter>
        <PropertyCard property={baseProperty} isSelected={true} onSelect={handleSelect} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('card-map-focused-badge')).toHaveTextContent(/Pinned on Map/i);
    expect(screen.getByText('Open details')).toBeInTheDocument();
  });
});
