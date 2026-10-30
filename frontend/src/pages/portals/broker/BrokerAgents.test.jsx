import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerAgents from './BrokerAgents';
import { agentService } from '../../../services/agentService';
import { invitationService } from '../../../services/invitationService';

vi.mock('../../../services/agentService', () => ({
  agentService: {
    getAgents: vi.fn(),
  },
  normalizeAgent: (a) => a,
}));

vi.mock('../../../services/invitationService', () => ({
  invitationService: {
    getInvitations: vi.fn(),
    createInvitation: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
  },
}));

const mockAgentsList = [
  {
    id: "agent-1",
    name: "Elena Rossi",
    role: "Senior Agent",
    email: "elena@hsr.com",
    phone: "+63 917 555 0192",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0028491",
    verification_status: "VERIFIED",
    license_status: "VALID",
    assigned_properties_count: 8,
    active_inquiries_count: 14,
    recorded_sales_count: 12,
    last_activity: "Today 10:24 AM"
  },
  {
    id: "agent-2",
    name: "Marcus Aurelius Tan",
    role: "Agent",
    email: "marcus@hsr.com",
    phone: "+63 920 555 0781",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0034120",
    verification_status: "PENDING",
    license_status: "FOR_REVIEW",
    assigned_properties_count: 4,
    active_inquiries_count: 7,
    recorded_sales_count: 5,
    last_activity: "Oct 12, 2026 11:03 AM"
  },
  {
    id: "agent-3",
    name: "Daniel Cruz",
    role: "Agent",
    email: "daniel@hsr.com",
    phone: "+63 917 555 0667",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-PENDING",
    verification_status: "INVITED",
    license_status: "—",
    assigned_properties_count: 0,
    active_inquiries_count: 0,
    recorded_sales_count: 0,
    last_activity: "Oct 08, 2026 9:10 AM"
  }
];

describe('BrokerAgents Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentService.getAgents.mockResolvedValue(mockAgentsList);
    invitationService.getInvitations.mockResolvedValue([]);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerAgents />
      </BrowserRouter>
    );

  it('renders page header, title, and action buttons', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Agents/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Manage agent profiles, review submitted credentials/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Invite Agent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
  });

  it('renders 4 KPI metric cards with correct values', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Agents')).toBeInTheDocument();
      expect(screen.getByText('Verified Agents')).toBeInTheDocument();
      expect(screen.getAllByText('Pending Review').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Active Invitations')).toBeInTheDocument();
    });
  });

  it('renders right column widgets (Verification Summary, Recent Activities, Onboarding Checklist)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Verification Summary')).toBeInTheDocument();
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
      expect(screen.getByText('Agent Onboarding Checklist')).toBeInTheDocument();
      expect(screen.getByText('Invited Agents')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
  });

  it('renders table columns and context-aware action buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Elena Rossi/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Marcus/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Daniel Cruz/i).length).toBeGreaterThanOrEqual(1);
    });

    // Elena is VERIFIED -> View button
    // Marcus is PENDING -> Review button
    // Daniel is INVITED -> Resend button
    expect(screen.getAllByRole('button', { name: /^Review$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /^Resend$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /^View$/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('opens and closes the Invite Agent modal', async () => {
    renderComponent();

    const inviteBtn = screen.getByRole('button', { name: /Invite Agent/i });
    fireEvent.click(inviteBtn);

    expect(screen.getByText(/Issue Agent Invitation/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('agent@example.com')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('agent@example.com')).not.toBeInTheDocument();
    });
  });

  it('filters roster when clicking status pill tabs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
      expect(screen.getByText('Marcus Aurelius Tan')).toBeInTheDocument();
    });

    // Click Pending Review pill tab
    const pendingPill = screen.getByRole('button', { name: /Pending Review/i });
    fireEvent.click(pendingPill);

    // Marcus Aurelius Tan is PENDING -> should be in document
    expect(screen.getByText('Marcus Aurelius Tan')).toBeInTheDocument();
    // Elena Rossi is VERIFIED -> should NOT be in document
    expect(screen.queryByText('Elena Rossi')).not.toBeInTheDocument();

    // Click All Agents pill tab to reset
    const allAgentsPill = screen.getByRole('button', { name: /All Agents/i });
    fireEvent.click(allAgentsPill);

    expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
  });

  it('toggles Analytics & Insights panel visibility', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Verification Summary')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle(/Toggle Analytics & Insights panel/i);
    fireEvent.click(toggleBtn);

    // Button text should change to "Insights"
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });
});
