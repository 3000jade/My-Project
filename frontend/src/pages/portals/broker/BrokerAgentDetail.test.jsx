import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BrokerAgentDetail from './BrokerAgentDetail';
import { agentService } from '../../../services/agentService';

vi.mock('../../../services/agentService', () => ({
  agentService: {
    getAgentById: vi.fn(),
    updateAgentStatus: vi.fn(),
  },
  normalizeAgent: (a) => a,
}));

const mockAgent = {
  id: 'agent-1',
  name: 'Elena Rossi',
  role: 'Senior Agent',
  email: 'elena@hsr.com',
  phone: '+63 917 555 0192',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  prc_license_no: 'PRC-REB-0028491',
  prc_validity: '2027-08-15',
  dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
  dhsud_validity: '2026-12-31',
  verification_status: 'PENDING',
  experience_years: 6,
  bio: 'Senior Luxury Property Consultant specializing in Makati.',
  supporting_documents: [
    { name: 'PRC_License_Elena.pdf', webViewLink: 'https://drive.google.com/file/d/test1' }
  ]
};

describe('BrokerAgentDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentService.getAgentById.mockResolvedValue(mockAgent);
    agentService.updateAgentStatus.mockResolvedValue({
      ...mockAgent,
      verification_status: 'VERIFIED'
    });
  });

  const renderComponent = (agentId = 'agent-1') =>
    render(
      <MemoryRouter initialEntries={[`/broker/agents/${agentId}`]}>
        <Routes>
          <Route path="/broker/agents/:id" element={<BrokerAgentDetail />} />
          <Route path="/broker/agents" element={<div>Agents Roster</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('renders breadcrumbs, agent profile plinth, and regulatory dossier', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Elena Rossi/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('elena@hsr.com')).toBeInTheDocument();
      expect(screen.getByText('+63 917 555 0192')).toBeInTheDocument();
      expect(screen.getByText('PRC-REB-0028491')).toBeInTheDocument();
      expect(screen.getByText('DHSUD-NCR-AA-2023-0182')).toBeInTheDocument();
    });
  });

  it('renders Google Drive supporting document attachments', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('PRC_License_Elena.pdf')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Inspect on Drive/i })).toHaveAttribute('href', 'https://drive.google.com/file/d/test1');
    });
  });

  it('allows managing broker to open Approve & Verify modal and apply status', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Approve & Verify/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Approve & Verify/i }));

    expect(screen.getByText(/Confirm Verification Status Change/i)).toBeInTheDocument();

    const applyBtn = screen.getByRole('button', { name: /Apply Status/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(agentService.updateAgentStatus).toHaveBeenCalledWith('agent-1', 'VERIFIED');
    });
  });
});
