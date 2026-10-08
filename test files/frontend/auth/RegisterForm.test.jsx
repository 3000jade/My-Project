import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../../../frontend/src/components/auth/RegisterForm';

describe('RegisterForm Component', () => {
  it('displays real-time password strength meter and blocks mismatched passwords', async () => {
    const handleRegister = vi.fn().mockResolvedValue();
    render(<RegisterForm onSubmitRegistration={handleRegister} />);

    const passInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    // Enter weak password
    fireEvent.change(passInput, { target: { value: '123' } });
    expect(screen.getByText(/Weak|Fair/i)).toBeInTheDocument();

    // Mismatched confirmation
    fireEvent.change(confirmInput, { target: { value: '456' } });
    
    // Check terms and submit
    const termsCheck = screen.getByLabelText(/Terms of Service/i);
    fireEvent.click(termsCheck);
    fireEvent.submit(submitBtn.closest('form'));

    expect(await screen.findByText(/Passphrases do not match/i)).toBeInTheDocument();
    expect(handleRegister).not.toHaveBeenCalled();
  });
});
