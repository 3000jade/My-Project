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
      updated_at: '2026-11-20T08:00:00.000Z',
    }),
    updateProfile: vi.fn().mockImplementation((updates) =>
      Promise.resolve({
        id: 'user-broker-1',
        name: updates.name || 'Alexander Sterling',
        email: updates.email || 'broker@pt.com',
        phone: updates.phone || '+63 918 555 0244',
        firm_name: updates.firm_name || 'Precision Trust Realty Operations Inc.',
        updated_at: '2026-11-20T09:00:00.000Z',
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
        updated_at: '2026-11-20T08:00:00.000Z',
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

describe('BrokerProfile Master-Detail Component', () => {
  it('renders identity banner with PRC/DHSUD expiry, audit date, and opens public card preview', async () => {
    render(
      <BrowserRouter>
        <BrokerProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alexander Sterling')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('identity-summary-banner');
    expect(banner).toHaveTextContent(/PRC-REB-0019582/i);
    expect(banner).toHaveTextContent(/2028-03-20/i);
    expect(banner).toHaveTextContent(/DHSUD-NCR-AA-2022-0941/i);
    expect(banner).toHaveTextContent(/2027-04-30/i);
    expect(banner).toHaveTextContent(/Last updated:/i);

    const firmInput = screen.getByLabelText(/Operating Entity \/ Firm Name/i);
    fireEvent.change(firmInput, { target: { value: 'Sterling Prime Realty' } });
    expect(banner).toHaveTextContent('Sterling Prime Realty');

    fireEvent.click(screen.getByRole('button', { name: /Preview Public Card/i }));
    await waitFor(() => {
      expect(screen.getByTestId('live-public-card-preview')).toBeInTheDocument();
    });
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
