import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertyQuickEditDrawer from './PropertyQuickEditDrawer';
import propertyService from '../../services/propertyService';

vi.mock('../../services/propertyService', () => ({
  default: {
    updateProperty: vi.fn(),
  },
  toApiPayload: vi.fn((data) => data),
}));

const mockProperty = {
  id: 'prop-101',
  listingKey: 'MLS-101',
  title: 'Alabang Sanctuary Villa',
  price: '₱120,000,000',
  price_raw: 120000000,
  type: 'Villa',
  livingArea: 850,
  status: 'PENDING',
  standardStatus: 'Pending Approval',
  associationFee: 15000,
  agentName: 'Elena Rossi',
  privateRemarks: 'Lockbox code 4492. Gate pass required at guardhouse.',
};

describe('PropertyQuickEditDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BrowserRouter>
        <PropertyQuickEditDrawer isOpen={false} property={mockProperty} onClose={vi.fn()} />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form fields with initial property data when open', () => {
    render(
      <BrowserRouter>
        <PropertyQuickEditDrawer isOpen={true} property={mockProperty} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Quick Edit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alabang Sanctuary Villa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120000000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Lockbox code 4492/i)).toBeInTheDocument();
  });

  it('transitions status on clicking 1-click status pills', () => {
    render(
      <BrowserRouter>
        <PropertyQuickEditDrawer isOpen={true} property={mockProperty} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const approvePill = screen.getByRole('button', { name: /Approve & Activate/i });
    expect(approvePill).toBeInTheDocument();

    fireEvent.click(approvePill);
    expect(approvePill.className).toMatch(/bg-emerald-600|border-emerald-600/);
  });

  it('persists updates via propertyService and calls onSave', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    propertyService.updateProperty.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <PropertyQuickEditDrawer
          isOpen={true}
          property={mockProperty}
          onClose={onClose}
          onSave={onSave}
        />
      </BrowserRouter>
    );

    const priceInput = screen.getByDisplayValue('120000000');
    fireEvent.change(priceInput, { target: { value: '125000000' } });

    const hoaInput = screen.getByDisplayValue('15000');
    fireEvent.change(hoaInput, { target: { value: '18000' } });

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
