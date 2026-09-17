import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PropertyListingView from './PropertyListingView';

describe('PropertyListingView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = (path = '/properties/cmtdur9ap00011041l5curjy2') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders complete listing reference details for cmtdur9ap00011041l5curjy2', () => {
    renderComponent();

    // Section 1: Identification
    expect(screen.getAllByText(/BEST ORTIGAS PASIG CONDO FOR SALE 2 BEDROOM CONDO/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MLSPH91M99LRH7/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cmtdur9ap00011041l5curjy2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Residential Condominium/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/For Sale/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New/i).length).toBeGreaterThan(0);

    // Section 2: Pricing & Financing
    expect(screen.getAllByText(/₱3,000,000/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PHP 5,000 to PHP 20,000/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Starting at PHP 15,000 \/ month/i).length).toBeGreaterThan(0);

    // Section 3: Space & Unit Specs
    expect(screen.getAllByText(/30.60 sqm/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/6th Floor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bare/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2023/i).length).toBeGreaterThan(0);

    // Section 4: Geographic Location
    expect(screen.getAllByText(/Urban Deca Homes Ortigas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ortigas Avenue Extension/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rosario/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pasig City/i).length).toBeGreaterThan(0);

    // Section 5: Amenities & Policies
    expect(screen.getAllByText(/Perpetual Ownership \(Freehold\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/24\/7 Gated Security/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pet-Friendly/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Flood-Free Area/i).length).toBeGreaterThan(0);

    // Section 6: Contact & Brokerage
    expect(screen.getAllByText(/Jayson Canonico/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Real Estate Agent/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Direct message for free site viewing/i).length).toBeGreaterThan(0);
  });

  it('toggles Viewing List aggregate state (Section 7)', () => {
    renderComponent();

    const addBtn = screen.getByRole('button', { name: /Add to Viewing List/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('button', { name: /In Viewing List/i })).toBeInTheDocument();
  });

  it('opens inspection schedule modal when Schedule Free Site Viewing is clicked (Section 7)', () => {
    renderComponent();

    const scheduleBtns = screen.getAllByRole('button', { name: /Schedule Free Site Viewing/i });
    fireEvent.click(scheduleBtns[0]);

    expect(screen.getByText(/Target Move-In Window/i)).toBeInTheDocument();
  });
});
