import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AgentProfile from './AgentProfile';

// Mock profileService
vi.mock('../../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue({
      id: 'user-agent-1',
      name: 'Elena Rossi',
      firstName: 'Elena',
      lastName: 'Rossi',
      email: 'agent@pt.com',
      phone: '+63 917 555 0192',
      role: 'Senior Real Estate Consultant',
      rawRole: 'agent',
      bio: 'Senior Luxury Property Consultant specializing in exclusive enclaves.',
      prc_license_no: 'PRC-REB-0028491',
      prc_validity: '2027-08-15',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
      dhsud_validity: '2026-12-31',
      firm_name: 'Precision Trust Realty Operations Inc.',
      experience_years: 6,
      verification_status: 'VERIFIED',
    }),
    updateProfile: vi.fn().mockImplementation((updates) => Promise.resolve({
      id: 'user-agent-1',
      name: updates.name || 'Elena Rossi',
      phone: updates.phone || '+63 917 555 0192',
      ...updates,
    })),
  },
  mockDefaultProfiles: {
    agent: {
      id: 'user-agent-1',
      name: 'Elena Rossi',
      firstName: 'Elena',
      lastName: 'Rossi',
      email: 'agent@pt.com',
      phone: '+63 917 555 0192',
      role: 'Senior Real Estate Consultant',
      rawRole: 'agent',
      bio: 'Senior Luxury Property Consultant.',
      prc_license_no: 'PRC-REB-0028491',
      prc_validity: '2027-08-15',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
      dhsud_validity: '2026-12-31',
      firm_name: 'Precision Trust Realty Operations Inc.',
      experience_years: 6,
      verification_status: 'VERIFIED',
    },
  },
}));

describe('AgentProfile Portal Component', () => {
  it('renders agent profile details and PRC/DHSUD regulatory credentials', async () => {
    render(
      <BrowserRouter>
        <AgentProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    });

    expect(screen.getByText(/PRC-REB-0028491/i)).toBeInTheDocument();
    expect(screen.getByText(/DHSUD-NCR-AA-2023-0182/i)).toBeInTheDocument();
  });

  it('opens edit profile modal with Edit Profile button', async () => {
    render(
      <BrowserRouter>
        <AgentProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/Update your agent credentials/i)).toBeInTheDocument();
  });
});
