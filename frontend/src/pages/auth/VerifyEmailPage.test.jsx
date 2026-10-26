import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    resendVerification: vi.fn(),
  },
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders target email from query params and resend trigger', () => {
    render(
      <MemoryRouter initialEntries={['/verify-email?email=testclient@example.com']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('testclient@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Proceed to Sign In/i })).toBeInTheDocument();
  });

  it('calls authService.resendVerification and sets countdown cooldown', async () => {
    authService.resendVerification.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/verify-email?email=testclient@example.com']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const resendBtn = screen.getByRole('button', { name: /Resend Verification Email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith('testclient@example.com');
      expect(
        screen.getByText(/A fresh verification email has been dispatched/i)
      ).toBeInTheDocument();
      // Button should now show countdown
      expect(screen.getByText(/Resend available in \d+s/i)).toBeInTheDocument();
    });
  });
});
