import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error state when no recovery token is provided in URL', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/No recovery token detected in the URL/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Request New Reset Link/i })
    ).toBeInTheDocument();
  });

  it('renders password fields when token is present and validates matching passwords', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-test-token-123']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();

    const newPassInput = screen.getByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/^Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Update Password/i });

    fireEvent.change(newPassInput, { target: { value: 'NewSecret123!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'Mismatch456!' } });

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    fireEvent.change(confirmPassInput, { target: { value: 'NewSecret123!' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls authService.resetPassword and presents success state upon valid submission', async () => {
    authService.resetPassword.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-test-token-123']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/^Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Update Password/i });

    fireEvent.change(newPassInput, { target: { value: 'NewSecret123!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewSecret123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: 'valid-test-token-123',
        newPassword: 'NewSecret123!',
      });
      expect(
        screen.getByText(/Your password has been successfully updated/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    });
  });
});
