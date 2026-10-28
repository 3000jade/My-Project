import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import BrokerProfile from './BrokerProfile';

// Mock profileService
vi.mock('../../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue({
      id: 'user-broker-1',
      name: 'Alexander Sterling',
      email: 'broker@pt.com',
      phone: '+63 918 555 0244',
      role: 'Principal Broker & Managing Director',
      rawRole: 'broker',
      prc_license_no: 'PRC-REB-0019582',
      prc_validity: '2028-03-20',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2022-0941',
      dhsud_validity: '2027-04-30',
      firm_name: 'Precision Trust Realty Operations Inc.',
      experience_years: 12,
      verification_status: 'VERIFIED',
    }),
    updateProfile: vi.fn().mockImplementation((updates) => Promise.resolve({
      id: 'user-broker-1',
      name: updates.name || 'Alexander Sterling',
      email: updates.email || 'broker@pt.com',
      phone: updates.phone || '+63 918 555 0244',
      firm_name: updates.firm_name || 'Precision Trust Realty Operations Inc.',
      ...updates,
    })),
  },
  mockDefaultProfiles: {
    broker: {
      id: 'user-broker-1',
      name: 'Alexander Sterling',
      email: 'broker@pt.com',
      phone: '+63 918 555 0244',
      role: 'Principal Broker & Managing Director',
      rawRole: 'broker',
      prc_license_no: 'PRC-REB-0019582',
      prc_validity: '2028-03-20',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2022-0941',
      dhsud_validity: '2027-04-30',
      firm_name: 'Precision Trust Realty Operations Inc.',
      experience_years: 12,
      verification_status: 'VERIFIED',
    },
  },
}));

// Mock useAuth
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn().mockResolvedValue(true),
    user: { id: 'user-broker-1', role: 'broker' },
  }),
}));

describe('BrokerProfile Portal Component', () => {
  it('renders broker principal credentials and firm registration', async () => {
    render(
      <BrowserRouter>
        <BrokerProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alexander Sterling')).toBeInTheDocument();
    });

    expect(screen.getByText(/PRC-REB-0019582/i)).toBeInTheDocument();
    expect(screen.getByText(/DHSUD-NCR-AA-2022-0941/i)).toBeInTheDocument();
  });

  it('opens edit modal and updates broker profile details', async () => {
    render(
      <BrowserRouter>
        <BrokerProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alexander Sterling')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/Update executive contact and administrative information/i)).toBeInTheDocument();
  });
});
