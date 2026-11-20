import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AgentProfile from './AgentProfile';

vi.mock('../../../services/agentService', () => ({
  agentService: {
    getMyProfile: vi.fn().mockResolvedValue({
      id: 'user-agent-1',
      name: 'Elena Rossi',
      email: 'agent@pt.com',
      phone: '+63 917 555 0192',
      role: 'Senior Real Estate Consultant',
      rawRole: 'agent',
      bio: 'Senior Luxury Property Consultant specializing in exclusive enclaves.',
      prc_license_no: 'PRC-REB-0028491',
      prc_validity: '2027-08-15',
      dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
      dhsud_validity: '2026-12-31',
      brokerage_name: 'Human Shelter Realty',
      team_name: 'Luxury Residential Advisory',
      location_branch: 'Makati & BGC Prime',
      experience_years: 6,
      verification_status: 'VERIFIED',
    }),
  },
  computeAgentCompleteness: vi.fn().mockReturnValue({
    percent: 100,
    isComplete: true,
    missingFields: [],
    checklist: [
      { key: 'name', label: 'Full Name', completed: true },
      { key: 'prc_license_no', label: 'PRC License', completed: true },
    ],
  }),
}));

vi.mock('../../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue({}),
    updateProfile: vi.fn().mockImplementation((updates) =>
      Promise.resolve({
        id: 'user-agent-1',
        name: updates.name || 'Elena Rossi',
        phone: updates.phone || '+63 917 555 0192',
        ...updates,
      })
    ),
  },
  mockDefaultProfiles: {
    agent: {
      id: 'user-agent-1',
      name: 'Elena Rossi',
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

describe('AgentProfile Studio Component', () => {
  it('renders the 2-column studio with live preview and safe regulatory badges', async () => {
    render(
      <BrowserRouter>
        <AgentProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    });

    expect(screen.getByTestId('agent-profile-studio')).toBeInTheDocument();
    expect(screen.getByTestId('live-public-card-preview')).toBeInTheDocument();
    expect(screen.getByText(/PRC Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/DHSUD Accredited/i)).toBeInTheDocument();
  });

  it('updates live preview on inline edit and flags broker review when PRC license changes', async () => {
    render(
      <BrowserRouter>
        <AgentProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Elena Rossi-Santos' } });
    expect(screen.getByText('Elena Rossi-Santos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /PRC & DHSUD/i }));
    const prcInput = screen.getByLabelText(/PRC License Number/i);
    fireEvent.change(prcInput, { target: { value: 'PRC-REB-9999999' } });

    expect(screen.getByText(/Broker Review Will Be Queued/i)).toBeInTheDocument();
  });
});
