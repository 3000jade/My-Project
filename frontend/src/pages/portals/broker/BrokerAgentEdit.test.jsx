import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BrokerAgentEdit from './BrokerAgentEdit';
import { agentService } from '../../../services/agentService';

vi.mock('../../../services/agentService', () => ({
  agentService: {
    getAgentById: vi.fn(),
    updateAgent: vi.fn(),
  },
}));

const mockAgent = {
  id: 'agent-1',
  name: 'Elena Rossi',
  role: 'Senior Real Estate Agent',
  email: 'elena@hsr.com',
  phone: '+63 917 555 0192',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  prc_license_no: 'PRC-REB-0028491',
  prc_validity: '2027-08-15',
  dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
  dhsud_validity: '2026-12-31',
  bio: 'Senior Luxury Property Consultant'
};

describe('BrokerAgentEdit Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentService.getAgentById.mockResolvedValue(mockAgent);
    agentService.updateAgent.mockResolvedValue(mockAgent);
  });

  const renderComponent = (agentId = 'agent-1') =>
    render(
      <MemoryRouter initialEntries={[`/broker/agents/${agentId}/edit`]}>
        <Routes>
          <Route path="/broker/agents/:id/edit" element={<BrokerAgentEdit />} />
          <Route path="/broker/agents/:id" element={<div>Agent Dossier</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('renders edit agent page with navigation tabs and personal info fields', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Agent Profile/i, level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText('Personal Information').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Contact Information').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Professional Licenses').length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue('Elena Rossi')).toBeInTheDocument();
    });
  });

  it('switches between edit sections when tabs are clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Elena Rossi')).toBeInTheDocument();
    });

    const contactTab = screen.getByRole('button', { name: /Contact Information/i });
    fireEvent.click(contactTab);

    expect(screen.getByDisplayValue('elena@hsr.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+63 917 555 0192')).toBeInTheDocument();
  });
});
