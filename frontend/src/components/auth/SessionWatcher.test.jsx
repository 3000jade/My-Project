import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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

  it('resets inactivity timer on re-login after session timeout so user is not logged out immediately', () => {
    vi.useFakeTimers();
    let currentUser = { id: 'u1', role: 'agent' };
    const mockLogoutFn = vi.fn(() => {
      currentUser = null;
    });

    useAuth.mockImplementation(() => ({
      user: currentUser,
      logout: mockLogoutFn,
    }));

    const { rerender } = render(<SessionWatcher />);

    // Fast-forward to trigger idle timeout
    act(() => {
      vi.advanceTimersByTime(1801 * 1000);
    });
    expect(mockLogoutFn).toHaveBeenCalledTimes(1);

    // Simulate AuthContext updating to user: null upon logout
    currentUser = null;
    act(() => {
      rerender(<SessionWatcher />);
    });

    // Fast-forward 10 seconds while user is on login page
    act(() => {
      vi.advanceTimersByTime(10 * 1000);
    });

    // Simulate user logging in again (same mounted SessionWatcher instance)
    currentUser = { id: 'u1', role: 'agent' };
    act(() => {
      rerender(<SessionWatcher />);
    });

    // Advance 5 seconds into the newly authenticated session
    act(() => {
      vi.advanceTimersByTime(5 * 1000);
    });

    // It should NOT have called logout again!
    expect(mockLogoutFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
