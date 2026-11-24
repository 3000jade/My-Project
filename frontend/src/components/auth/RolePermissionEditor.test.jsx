import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RolePermissionEditor from './RolePermissionEditor';
import apiClient from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('RolePermissionEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMockApi = (usersList = []) => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: {
            data: {
              totalUsers: usersList.length || 3,
              activeToday: 2,
              pendingAccreditation: 1,
              suspendedAccounts: 0,
            },
          },
        });
      }
      return Promise.resolve({
        data: {
          users: usersList,
          total: usersList.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  };

  it('loads and displays KPI strip and user accounts with accreditation', async () => {
    setupMockApi([
      { id: 'u1', fullName: 'Kerby Broker', email: 'broker@pt.com', role: 'broker', status: 'active' },
      { id: 'u2', fullName: 'Carlos Agent', email: 'agent@pt.com', role: 'agent', status: 'active', prc_license_no: '0098765' },
      { id: 'u3', fullName: 'New Agent', email: 'newagent@pt.com', role: 'agent', status: 'active' },
    ]);

    render(<RolePermissionEditor />);

    await waitFor(() => {
      expect(screen.getByText('Total Accounts')).toBeInTheDocument();
      expect(screen.getByText('Active Accounts')).toBeInTheDocument();
      expect(screen.getByText('Pending Accreditation')).toBeInTheDocument();
      expect(screen.getByText('Kerby Broker')).toBeInTheDocument();
      expect(screen.getByText('Carlos Agent')).toBeInTheDocument();
      expect(screen.getByText('PRC #0098765')).toBeInTheDocument();
      expect(screen.getByText('PRC: Unregistered')).toBeInTheDocument();
      expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 1 to 3 of 3 accounts');
    });
  });

  it('enforces self-lockout prevention for the current admin user', async () => {
    setupMockApi([
      { id: 'admin-1', fullName: 'Admin User', email: 'admin@pt.com', role: 'admin', status: 'active' },
      { id: 'u2', fullName: 'Other User', email: 'other@pt.com', role: 'client', status: 'active' },
    ]);

    render(<RolePermissionEditor currentUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    // First two are filters (Role, Status), third is admin-1, fourth is u2
    const adminRoleSelect = selects[2];
    const otherRoleSelect = selects[3];

    expect(adminRoleSelect).toBeDisabled();
    expect(otherRoleSelect).not.toBeDisabled();

    // The suspend button for the admin user should be disabled
    const suspendButtons = screen.getAllByRole('button', { name: /^suspend$/i });
    expect(suspendButtons[0]).toBeDisabled();
    expect(suspendButtons[1]).not.toBeDisabled();
  });

  it('opens two-step confirmation modal when clicking suspend and submits reason', async () => {
    setupMockApi([
      { id: 'u2', fullName: 'Other User', email: 'other@pt.com', role: 'client', status: 'active' },
    ]);
    apiClient.patch.mockResolvedValue({ data: { success: true } });

    render(<RolePermissionEditor currentUserId="admin-id" />);

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });

    // Click Suspend on Other User
    const suspendButton = screen.getByRole('button', { name: /^suspend$/i });
    fireEvent.click(suspendButton);

    // Modal should appear
    expect(screen.getByText('Suspend User Account')).toBeInTheDocument();
    expect(screen.getByText(/Documented Justification/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm suspension/i });
    expect(confirmButton).toBeDisabled(); // Disabled without reason

    // Enter reason
    const textarea = screen.getByPlaceholderText(/Enter justification for compliance audit/i);
    fireEvent.change(textarea, { target: { value: 'Suspicious login pattern detected' } });

    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/admin/users/u2/status', {
        status: 'SUSPENDED',
        reason: 'Suspicious login pattern detected',
      });
      expect(screen.getByText(/User status changed to suspended/i)).toBeInTheDocument();
    });
  });

  it('opens agent credential drawer when clicking View on agent row', async () => {
    setupMockApi([
      {
        id: 'agent-1',
        fullName: 'Carlos Agent',
        email: 'agent@pt.com',
        role: 'agent',
        status: 'active',
        prc_license_no: '0098765',
        prc_validity: '2027-12-31',
        dhsud_accreditation_no: 'DHSUD-00123',
      },
    ]);

    render(<RolePermissionEditor />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Agent')).toBeInTheDocument();
    });

    const viewButton = screen.getByRole('button', { name: /^view$/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Professional Accreditation')).toBeInTheDocument();
      expect(screen.getByText('PRC Real Estate Broker/Salesperson License')).toBeInTheDocument();
      expect(screen.getByText('DHSUD Housing & Urban Dev Accreditation')).toBeInTheDocument();
      expect(screen.getByText('DHSUD-00123')).toBeInTheDocument();
    });

    // Click close drawer
    const closeButton = screen.getByRole('button', { name: /close drawer/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Professional Accreditation')).not.toBeInTheDocument();
    });
  });

  it('requires two-step confirmation modal before updating a user role', async () => {
    setupMockApi([
      { id: 'u2', fullName: 'Candidate User', email: 'user@pt.com', role: 'client', status: 'active' },
    ]);
    apiClient.patch.mockResolvedValue({ data: { success: true } });

    render(<RolePermissionEditor currentUserId="admin-id" />);

    await waitFor(() => {
      expect(screen.getByText('Candidate User')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    // First two are filters (Role, Status), third is u2's role select
    const userRoleSelect = selects[2];
    expect(userRoleSelect.value).toBe('client');

    // Change to admin
    fireEvent.change(userRoleSelect, { target: { value: 'admin' } });

    // API should NOT be called immediately
    expect(apiClient.patch).not.toHaveBeenCalled();

    // Modal should appear
    expect(screen.getByText('Confirm Role Modification')).toBeInTheDocument();
    expect(screen.getByText('Elevated Authority Warning:')).toBeInTheDocument();

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm role change/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/admin/users/u2/role', {
        role: 'admin',
      });
      expect(screen.getByText(/User role successfully updated to admin/i)).toBeInTheDocument();
    });
  });
});
