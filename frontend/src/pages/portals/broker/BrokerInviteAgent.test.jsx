import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerInviteAgent from './BrokerInviteAgent';
import { invitationService } from '../../../services/invitationService';

vi.mock('../../../services/invitationService', () => ({
  invitationService: {
    createInvitation: vi.fn(),
  },
}));

describe('BrokerInviteAgent Wizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invitationService.createInvitation.mockResolvedValue({
      token: 'test_token_123',
      email: 'juan@example.com'
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerInviteAgent />
      </BrowserRouter>
    );

  it('renders step 1 (Agent Information) and navigates with valid inputs', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Invite Agent/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Full Legal Name/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Juan Dela Cruz/i);
    fireEvent.change(nameInput, { target: { value: 'Juan Dela Cruz' } });

    const nextBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // Should now be on Step 2 (Contact Details)
    expect(screen.getAllByText(/Contact Details/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. agent@hsr.com/i)).toBeInTheDocument();
  });

  it('validates email format in step 2 matching field validation rules', async () => {
    renderComponent();

    const nameInput = screen.getByPlaceholderText(/e.g. Juan Dela Cruz/i);
    fireEvent.change(nameInput, { target: { value: 'Juan Dela Cruz' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    const emailInput = screen.getByPlaceholderText(/e.g. agent@hsr.com/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'agent@hsr.com' } });
    expect(screen.getByText(/Valid email format/i)).toBeInTheDocument();
  });
});
