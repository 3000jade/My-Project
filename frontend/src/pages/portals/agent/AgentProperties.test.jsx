import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentProperties from './AgentProperties';
import propertyService from '../../../services/propertyService';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'agent-1', role: 'agent', full_name: 'Elena Rossi' },
  }),
}));

vi.mock('../../../services/propertyService', () => ({
  default: {
    getProperties: vi.fn(),
    getEditRequests: vi.fn(),
    acceptAssignment: vi.fn(),
    declineAssignment: vi.fn(),
  },
}));

describe('AgentProperties Inbox & Assigned By Broker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyService.getEditRequests.mockResolvedValue({ data: [] });
  });

  it('renders New Assignments inbox with Assigned by Broker label and Accept/Decline actions', async () => {
    propertyService.getProperties.mockResolvedValueOnce({
      data: [
        {
          id: 'prop-pending-1',
          title: 'Makati Horizon Penthouse',
          location: { address: 'Ayala Ave, Makati' },
          price: '₱85,000,000',
          assignment_status: 'PENDING_CONFIRMATION',
          standard_status: 'Pending Confirmation',
          status: 'pending',
          assigned_by_name: 'Alexander Sterling',
        },
        {
          id: 'prop-active-1',
          title: 'Forbes Park Villa',
          location: { address: 'Forbes Park, Makati' },
          price: '₱210,000,000',
          assignment_status: 'ACCEPTED',
          standard_status: 'Active',
          status: 'available',
          assigned_by_name: 'Broker Admin',
        },
      ],
    });

    render(
      <MemoryRouter>
        <AgentProperties />
      </MemoryRouter>
    );

    expect(await screen.findByText('New Assignments (1)')).toBeInTheDocument();
    expect(screen.getAllByText('Assigned by Alexander Sterling').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Assigned by Broker Admin')).toBeInTheDocument();

    const inbox = screen.getByRole('region', { name: /new assigned properties inbox/i });
    const acceptBtn = inbox.querySelector('button:has(svg.lucide-check)') || screen.getAllByRole('button', { name: /accept/i })[0];
    fireEvent.click(acceptBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
