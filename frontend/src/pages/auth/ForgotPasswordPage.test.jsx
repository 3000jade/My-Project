import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input, submit button, and back-to-login link', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Recovery Link/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to Sign In/i)).toBeInTheDocument();
  });

  it('validates email format before submitting', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('calls authService.forgotPassword and displays neutral confirmation message', async () => {
    authService.forgotPassword.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringContaining('/reset-password')
      );
      expect(
        screen.getByText(/If an account exists for this email address/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Return to Sign In/i)).toBeInTheDocument();
    });
  });
});
