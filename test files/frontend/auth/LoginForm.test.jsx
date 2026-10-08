import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../../frontend/src/components/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders input fields, reveal toggle, and submits credentials', async () => {
    const handleLogin = vi.fn().mockResolvedValue();
    render(<LoginForm onSubmitCredentials={handleLogin} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const rememberMeCheck = screen.getByLabelText(/Remember me/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'client@kerby.ph' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(rememberMeCheck);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith({
        email: 'client@kerby.ph',
        password: 'Secret123!',
        rememberMe: true
      });
    });
  });

  it('toggles password masking visibility', () => {
    render(<LoginForm onSubmitCredentials={vi.fn()} />);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/Toggle password visibility/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
