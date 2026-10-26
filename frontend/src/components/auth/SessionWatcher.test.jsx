import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionWatcher from './SessionWatcher';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  authService: {
    extendSession: vi.fn(),
  },
}));

describe('SessionWatcher Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no authenticated user is present', () => {
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    const { container } = render(<SessionWatcher />);
    expect(container.firstChild).toBeNull();
  });

  it('does not display SessionTimeoutModal while active', () => {
    useAuth.mockReturnValue({
      user: { id: 'u1', role: 'agent' },
      logout: mockLogout,
    });

    render(<SessionWatcher />);
    expect(screen.queryByText(/Session Expiring/i)).not.toBeInTheDocument();
  });
});
