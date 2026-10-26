import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
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
});
