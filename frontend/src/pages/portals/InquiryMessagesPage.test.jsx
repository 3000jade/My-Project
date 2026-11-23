import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InquiryMessagesPage from './InquiryMessagesPage';
import { inquiryService } from '../../services/inquiryService';
import { agentService } from '../../services/agentService';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'agent-1', fullName: 'Carmela Del Rosario', role: 'agent' },
  }),
}));

vi.mock('../../services/inquiryService', () => ({
  inquiryService: {
    getInquiries: vi.fn(),
    getInquiryById: vi.fn(),
    addMessage: vi.fn(),
    addNote: vi.fn(),
    assignAgent: vi.fn(),
    generateAiSummary: vi.fn(),
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
    client_name: 'Sofia Mendoza',
    property_title: 'Makati Penthouse',
    status: 'NEW',
    source: 'ai_chatbot',
    consentAccepted: true,
    operational_status: 'awaiting_agent',
    business_status: 'active',
    agent_id: 'agent-1',
    agent_name: 'Carmela Del Rosario',
    last_message: 'Interested in viewing this weekend.',
    messages: [
      { id: 'm1', sender: 'client', sender_name: 'Sofia Mendoza', content: 'Interested in viewing this weekend.', timestamp: '10:00' },
    ],
    internal_notes: [],
  },
  {
    id: 'inq-2',
    client_name: 'Marco Reyes',
    property_title: 'BGC Loft',
    status: 'ASSIGNED',
    source: 'property_page',
    consentAccepted: true,
    operational_status: 'accepted',
    business_status: 'active',
    agent_id: 'agent-1',
    agent_name: 'Carmela Del Rosario',
    last_message: 'Can you share floor plans?',
    messages: [
      { id: 'm2', sender: 'client', sender_name: 'Marco Reyes', content: 'Can you share floor plans?', timestamp: '10:05' },
    ],
    internal_notes: [],
  },
];

describe('InquiryMessagesPage (Rung 2 & Rung 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inquiryService.getInquiries.mockResolvedValue(sampleInquiries);
    inquiryService.getInquiryById.mockImplementation(async (id) =>
      sampleInquiries.find((i) => i.id === id) || null
    );
    agentService.getAgents.mockResolvedValue([
      { id: 'agent-1', name: 'Carmela Del Rosario', verification_status: 'VERIFIED' },
    ]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('hydrates selected inquiry via getInquiryById and enforces Agent RBAC boundaries', async () => {
    render(
      <MemoryRouter initialEntries={['/agent/inquiries/messages/inq-2']}>
        <Routes>
          <Route path="/agent/inquiries/messages/:id" element={<InquiryMessagesPage role="agent" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(inquiryService.getInquiryById).toHaveBeenCalledWith('inq-2');
    });

    expect(screen.getAllByRole('link', { name: /Inquiry Dashboard/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('button', { name: /Unassigned/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Assign Inquiry/i)).not.toBeInTheDocument();
  });

  it('wires AI summary refresh and shows Broker-only Unassigned tab when role="broker"', async () => {
    inquiryService.generateAiSummary.mockResolvedValue({
      id: 'sum-1',
      status: 'ready',
      sections: { requirements: ['3BR penthouse'], timeline: 'Next month', readiness: 'High', nextSteps: ['Schedule tour'] },
    });

    render(
      <MemoryRouter initialEntries={['/broker/inquiries/messages/inq-1']}>
        <Routes>
          <Route path="/broker/inquiries/messages/:id" element={<InquiryMessagesPage role="broker" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unassigned/i })).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh AI/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(inquiryService.generateAiSummary).toHaveBeenCalledWith('inq-1');
    });
  });
});
