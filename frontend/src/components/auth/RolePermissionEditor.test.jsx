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

  it('loads and displays user accounts', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        users: [
          { id: 'u1', fullName: 'Kerby Broker', email: 'broker@pt.com', role: 'broker', status: 'active' },
          { id: 'u2', fullName: 'Carlos Agent', email: 'agent@pt.com', role: 'agent', status: 'suspended' },
        ],
      },
    });

    render(<RolePermissionEditor />);

    await waitFor(() => {
      expect(screen.getByText('Kerby Broker')).toBeInTheDocument();
      expect(screen.getByText('Carlos Agent')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  it('calls apiClient.patch when role selector changes', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        users: [
          { id: 'u1', fullName: 'Kerby Broker', email: 'broker@pt.com', role: 'broker', status: 'active' },
        ],
      },
    });
    apiClient.patch.mockResolvedValue({ data: { success: true } });

    render(<RolePermissionEditor />);

    await waitFor(() => {
      expect(screen.getByText('Kerby Broker')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const userRoleSelect = selects[selects.length - 1]; // user table row select
    fireEvent.change(userRoleSelect, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/admin/users/u1/role', { role: 'admin' });
      expect(screen.getByText(/User role successfully updated to admin/i)).toBeInTheDocument();
    });
  });
});
