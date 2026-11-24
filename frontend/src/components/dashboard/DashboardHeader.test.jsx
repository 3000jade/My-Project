import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
  formatNotificationTime: vi.fn(() => 'Just now'),
  getNotificationTargetPath: vi.fn(() => '/broker/inquiries'),
}));

describe('DashboardHeader User Display Name & Fallbacks', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders direct user.fullName and appropriate initials', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'broker@pt.com',
        role: 'broker',
        fullName: 'Broker',
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    expect(screen.getByText('Broker')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('renders user.profile.full_name when user.fullName is missing (page reload state)', () => {
    // This replicates the post-reload GET /api/auth/me response structure
    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'broker@pt.com',
        role: 'broker',
        profile: {
          id: 'user-1',
          email: 'broker@pt.com',
          full_name: 'Broker',
          role: 'broker',
        },
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    expect(screen.getByText('Broker')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
  });

  it('renders user.user_metadata.full_name when user.fullName and profile are missing', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'broker@pt.com',
        role: 'broker',
        user_metadata: {
          full_name: 'Broker User',
        },
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    expect(screen.getByText('Broker User')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('never displays hardcoded Maria Santos as default fallback for brokers without a name', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'broker@pt.com',
        role: 'broker',
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
    // Should fallback to neutral title or email username
    expect(screen.getAllByText(/Principal Broker|Broker|broker/i).length).toBeGreaterThan(0);
  });

  it('renders search input with placeholder and shortcut indicator', () => {
    useAuth.mockReturnValue({
      user: { id: 'u1', email: 'broker@pt.com', role: 'broker', fullName: 'Broker Admin' },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search properties, clients, or inquiries...');
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('displays Administrator instead of Principal Broker when role is admin', () => {
    useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@pt.com', role: 'admin', fullName: 'Admin' },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="admin" />
      </MemoryRouter>
    );

    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.queryByText('Principal Broker')).not.toBeInTheDocument();
  });

  it('shows 9+ unread badge on bell and All / Unread tabs inside popover', async () => {
    const manyUnread = Array.from({ length: 11 }, (_, idx) => ({
      id: `notif-${idx}`,
      title: `New inquiry #${idx + 1}`,
      message: 'Buyer asked a question',
      type: 'inquiry',
      is_read: false,
      created_at: new Date().toISOString(),
    }));
    notificationService.getNotifications.mockResolvedValueOnce(manyUnread);
    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'broker@pt.com', role: 'broker', fullName: 'Broker' },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <DashboardHeader role="broker" />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('notification-unread-badge')).toHaveTextContent('9+');

    fireEvent.click(screen.getByRole('button', { name: /Notifications \(11 unread\)/i }));
    expect(await screen.findByRole('tab', { name: /All \(11\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Unread \(11\)/i })).toBeInTheDocument();
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
  });
});
