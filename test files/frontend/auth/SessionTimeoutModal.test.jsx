import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionTimeoutModal from '../../../frontend/src/components/auth/SessionTimeoutModal';

describe('SessionTimeoutModal Component', () => {
  it('renders countdown clock and calls onExtendSession when clicked', () => {
    const handleExtend = vi.fn();
    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={45}
        onExtendSession={handleExtend}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText(/Session Expiring/i)).toBeInTheDocument();
    expect(screen.getByText(/45s/i)).toBeInTheDocument();

    const extendBtn = screen.getByRole('button', { name: /Extend Session/i });
    fireEvent.click(extendBtn);
    expect(handleExtend).toHaveBeenCalledTimes(1);
  });
});
