import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import BrokerProfile from './BrokerProfile';
import { DashboardThemeProvider } from '../../../context/DashboardThemeContext';

vi.mock('../../../services/profileService', () => {
  const service = {
    getProfile: vi.fn().mockResolvedValue({
      id: 'user-broker-1',
      name: 'Alexander Sterling',
      email: 'broker@pt.com',
      phone: '+63 918 555 0244',
      role: 'Principal Broker & Managing Director',
      rawRole: 'broker',
      bio: 'Principal Broker & Managing Director overseeing firm listings.',
      prc_license_no: 'PRC-REB-0019582',
      prc_validity: '2028-03-20',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2022-0941',
      dhsud_validity: '2027-04-30',
      firm_name: 'Precision Trust Realty Operations Inc.',
      experience_years: 12,
      ui_preferences: { font_size: 'standard' },
      verification_status: 'VERIFIED',
    }),
    updateProfile: vi.fn().mockImplementation((updates) =>
      Promise.resolve({
        id: 'user-broker-1',
        name: updates.name || 'Alexander Sterling',
        email: updates.email || 'broker@pt.com',
        phone: updates.phone || '+63 918 555 0244',
        firm_name: updates.firm_name || 'Precision Trust Realty Operations Inc.',
        ...updates,
      })
    ),
  };

  return {
    default: service,
    profileService: service,
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
        ui_preferences: { font_size: 'standard' },
        verification_status: 'VERIFIED',
      },
    },
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn().mockResolvedValue(true),
    user: { id: 'user-broker-1', role: 'broker' },
  }),
}));

describe('BrokerProfile Studio Component', () => {
  it('renders broker executive card preview and updates firm name inline', async () => {
    render(
      <BrowserRouter>
        <BrokerProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alexander Sterling')).toBeInTheDocument();
    });

    expect(screen.getByTestId('broker-profile-studio')).toBeInTheDocument();
    expect(screen.getByTestId('live-public-card-preview')).toBeInTheDocument();

    const firmInput = screen.getByLabelText(/Operating Entity \/ Firm Name/i);
    fireEvent.change(firmInput, { target: { value: 'Sterling Prime Realty' } });
    expect(screen.getByText('Sterling Prime Realty')).toBeInTheDocument();
  });

  it('renders Appearance & Typography Density card with 3 options and updates density on selection', async () => {
    render(
      <BrowserRouter>
        <DashboardThemeProvider>
          <BrokerProfile />
        </DashboardThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('typography-density-card')).toBeInTheDocument();
    });

    expect(screen.getByText(/Appearance & Typography Density/i)).toBeInTheDocument();
    expect(screen.getByTestId('density-option-compact')).toBeInTheDocument();
    expect(screen.getByTestId('density-option-standard')).toBeInTheDocument();
    expect(screen.getByTestId('density-option-comfortable')).toBeInTheDocument();

    expect(screen.getByTestId('density-option-standard')).toHaveAttribute('aria-pressed', 'true');

    const compactBtn = screen.getByTestId('density-option-compact');
    await act(async () => {
      fireEvent.click(compactBtn);
    });
    expect(compactBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/data-dashboard-density="compact"/i)).toBeInTheDocument();

    const comfortableBtn = screen.getByTestId('density-option-comfortable');
    await act(async () => {
      fireEvent.click(comfortableBtn);
    });
    expect(comfortableBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/data-dashboard-density="comfortable"/i)).toBeInTheDocument();
  });
});
