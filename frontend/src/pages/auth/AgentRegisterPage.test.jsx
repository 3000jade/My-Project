import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentRegisterPage from './AgentRegisterPage';
import { invitationService } from '../../services/invitationService';

vi.mock('../../services/invitationService', () => ({
  invitationService: {
    validateToken: vi.fn(),
    registerAgent: vi.fn(),
  },
}));

vi.mock('../../services/agentCredentialsService', () => ({
  agentCredentialsService: {
    uploadCredential: vi.fn(),
    getDocumentContentUrl: vi.fn((id, token) => `/api/agent-credentials/${id}/content${token ? `?token=${token}` : ''}`),
  },
}));

vi.mock('../../services/driveService', () => ({
  driveService: {
    uploadFile: vi.fn(),
  },
}));

describe('AgentRegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invalid token view when no token is provided in URL', async () => {
    render(
      <MemoryRouter initialEntries={['/register/agent']}>
        <AgentRegisterPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Invalid or Redeemed Invitation')).toBeInTheDocument();
    expect(screen.getByText(/Invitation token is missing from the URL/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
  });

  it('renders dedicated expired state when token is expired after 72h window', async () => {
    invitationService.validateToken.mockResolvedValue({
      valid: false,
      reason: 'EXPIRED',
      email: 'expired.agent@example.com',
      error: 'Invitation token is expired.',
    });

    render(
      <MemoryRouter initialEntries={['/register/agent?token=expired-token-123']}>
        <AgentRegisterPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Invitation Link Has Expired')).toBeInTheDocument();
    expect(screen.getByText(/LINK EXPIRED \(72H WINDOW\)/i)).toBeInTheDocument();
    expect(screen.getByText(/valid for 72 hours from dispatch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact principal broker to reissue/i })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: /return to login/i })).toHaveAttribute('href', '/login');
  });

  it('renders active onboarding form with locked email when token is valid', async () => {
    invitationService.validateToken.mockResolvedValue({
      valid: true,
      email: 'verified.agent@hsr.com',
      id: 'inv-123',
    });

    render(
      <MemoryRouter initialEntries={['/register/agent?token=valid-token-xyz']}>
        <AgentRegisterPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Agent Credential Registration')).toBeInTheDocument();
    
    // Check locked email field
    const emailInput = screen.getByDisplayValue('verified.agent@hsr.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(screen.getByText('Locked to Invitation')).toBeInTheDocument();

    // Check presence of required credential fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^account password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prc real estate license no/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prc validity date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dhsud accreditation no/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dhsud validity date/i)).toBeInTheDocument();
  });

  it('submits registration successfully and displays pending broker review view', async () => {
    invitationService.validateToken.mockResolvedValue({
      valid: true,
      email: 'julian.vance@hsr.com',
      id: 'inv-456',
    });

    invitationService.registerAgent.mockResolvedValue({
      success: true,
      message: 'Consultant registration successfully submitted.',
    });

    render(
      <MemoryRouter initialEntries={['/register/agent?token=valid-token-abc']}>
        <AgentRegisterPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Agent Credential Registration')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Julian Vance' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+63 917 555 4321' } });
    fireEvent.change(screen.getByLabelText(/^account password/i), { target: { value: 'Secret123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Secret123!' } });
    fireEvent.change(screen.getByLabelText(/prc real estate license no/i), { target: { value: 'PRC-REB-0089123' } });
    fireEvent.change(screen.getByLabelText(/prc validity date/i), { target: { value: '2027-12-31' } });
    fireEvent.change(screen.getByLabelText(/dhsud accreditation no/i), { target: { value: 'DHSUD-NCR-AA-2024-9988' } });
    fireEvent.change(screen.getByLabelText(/dhsud validity date/i), { target: { value: '2026-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /complete agent onboarding/i }));

    await waitFor(() => {
      expect(invitationService.registerAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'valid-token-abc',
          email: 'julian.vance@hsr.com',
          fullName: 'Julian Vance',
          phone: '+63 917 555 4321',
          prcLicenseNo: 'PRC-REB-0089123',
          dhsudAccreditationNo: 'DHSUD-NCR-AA-2024-9988',
        })
      );
    });

    expect(await screen.findByText('Onboarding Dossier Submitted')).toBeInTheDocument();
    expect(screen.getByText('PENDING BROKER REVIEW')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed to login/i })).toBeInTheDocument();
  });
});
