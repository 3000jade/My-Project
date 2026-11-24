import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentInquiries from './agent/AgentInquiries';
import BrokerInquiries from './broker/BrokerInquiries';
import { inquiryService } from '../../services/inquiryService';
import { agentService } from '../../services/agentService';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'agent-1', role: 'agent' } }),
}));

vi.mock('../../services/inquiryService', () => ({
  inquiryService: {
    getInquiries: vi.fn(),
    getBrokerMetrics: vi.fn(),
    assignAgent: vi.fn(),
  },
}));

vi.mock('../../services/agentService', () => ({
  agentService: {
    getAgents: vi.fn(),
  },
}));

const sampleInquiries = [
  {
    id: 'inq-1',
    client_name: 'Maria Clara',
    client_email: 'maria@example.com',
    property_title: 'Makati Sky Penthouse',
    property_price: 'PHP 45M',
    last_message: 'Is viewing available tomorrow?',
    created_at: new Date().toISOString(),
    status: 'NEW',
    source: 'ai_chatbot',
    consentAccepted: true,
    operational_status: 'overdue',
    business_status: 'active',
    agent_id: 'agent-1',
    agent_name: 'Elena Rossi',
  },
  {
    id: 'inq-2',
    client_name: 'Jose Rizal',
    client_email: 'jose@example.com',
    property_title: 'BGC Garden Villa',
    property_price: 'PHP 30M',
    last_message: 'Requesting floor plan',
    created_at: new Date().toISOString(),
    status: 'ASSIGNED',
    source: 'property_page',
    operational_status: 'unassigned',
    business_status: 'active',
    agent_id: null,
    agent_name: null,
  },
];

describe('Inquiry Management Role Parity & RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inquiryService.getInquiries.mockResolvedValue(sampleInquiries);
    inquiryService.getBrokerMetrics.mockResolvedValue(null);
    agentService.getAgents.mockResolvedValue([
      { id: 'agent-1', name: 'Elena Rossi', verification_status: 'VERIFIED' },
      { id: 'agent-pending', name: 'Pending Agent', verification_status: 'PENDING' },
    ]);
  });

  it('AgentInquiries renders KPI strip, AI Chatbot tab, and omits Unassigned / quick-assign controls', async () => {
    render(
      <MemoryRouter>
        <AgentInquiries />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Maria Clara').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Assigned Total')).toBeInTheDocument();
    expect(screen.getByText('AI Chatbot Leads')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Chatbot Leads/i })).toBeInTheDocument();

    // Agent portal must NOT expose firm-wide Unassigned tab or Broker quick-assign select
    expect(screen.queryByRole('button', { name: /^Unassigned/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Quick assign consultant/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /AI Chatbot Leads/i }));
    expect(screen.getAllByText('Maria Clara').length).toBeGreaterThan(0);
    expect(screen.queryByText('Jose Rizal')).not.toBeInTheDocument();
  });

  it('BrokerInquiries renders AI Chatbot tab and PRC-verified QuickAssign control', async () => {
    inquiryService.assignAgent.mockResolvedValueOnce({ ...sampleInquiries[1], agent_id: 'agent-1' });

    render(
      <MemoryRouter>
        <BrokerInquiries />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jose Rizal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Jose Rizal'));
    expect(screen.getByRole('button', { name: /AI Chatbot/i })).toBeInTheDocument();

    const select = screen.getByLabelText('Quick assign consultant for Jose Rizal');
    const optionTexts = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(optionTexts).toContain('Elena Rossi');
    expect(optionTexts).not.toContain('Pending Agent');

    fireEvent.change(select, { target: { value: 'agent-1' } });
    await waitFor(() => {
      expect(inquiryService.assignAgent).toHaveBeenCalledWith(
        'inq-2',
        'agent-1',
        'Quick-assigned by Broker'
      );
    });
  });
});

