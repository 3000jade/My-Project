import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerPropertyTypeSelect from './BrokerPropertyTypeSelect';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

describe('BrokerPropertyTypeSelect - Property Type Selection Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BrokerPropertyTypeSelect />
      </BrowserRouter>
    );
  };

  it('renders breadcrumbs, title, and all 8 common property type options', () => {
    renderComponent();

    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
    expect(
      screen.getByText(/Choose the category of property you want to list/i)
    ).toBeInTheDocument();

    const commonTypes = [
      'House & Lot',
      'Condominium',
      'Townhouse',
      'Lot / Land',
      'Commercial',
      'Apartment',
      'Villa',
      'Warehouse',
    ];

    commonTypes.forEach((type) => {
      expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
    });
  });

  it('navigates to creation studio with query parameter when a property type is clicked', () => {
    renderComponent();

    const condoBtn = screen.getByRole('button', { name: 'Condominium' });
    fireEvent.click(condoBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=Condominium');
  });

  it('renders back navigation button to return to properties ledger', () => {
    renderComponent();
    const backBtn = screen.getByText('Back to Properties');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn.closest('a')).toHaveAttribute('href', '/broker/properties');
  });
});
