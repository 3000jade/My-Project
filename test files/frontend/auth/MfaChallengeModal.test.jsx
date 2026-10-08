import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MfaChallengeModal from '../../../frontend/src/components/auth/MfaChallengeModal';

describe('MfaChallengeModal Component', () => {
  it('renders 6-digit OTP input boxes and auto-submits on completion', async () => {
    const handleVerify = vi.fn().mockResolvedValue();
    render(<MfaChallengeModal isOpen={true} onVerifyCode={handleVerify} onClose={vi.fn()} />);

    expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);

    // Simulate typing 1 2 3 4 5 6
    '123456'.split('').forEach((digit, idx) => {
      fireEvent.change(inputs[idx], { target: { value: digit } });
    });

    await waitFor(() => {
      expect(handleVerify).toHaveBeenCalledWith('123456');
    });
  });
});
