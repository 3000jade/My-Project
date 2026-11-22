import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from './LiveCmsEditor';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('LiveCmsEditor', () => {
  it('hides the Edit Page floating bar for non-admin users', () => {
    useAuth.mockReturnValue({ user: { id: 'u1', role: 'client' } });

    render(
      <MemoryRouter>
        <LiveEditProvider>
          <LiveEditableText value="Public Headline" onSave={vi.fn()} />
          <LiveEditFloatingBar />
        </LiveEditProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Headline')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit Page/i })).not.toBeInTheDocument();
  });

  it('allows an admin to toggle Edit Page, edit inline text, and save', () => {
    useAuth.mockReturnValue({ user: { id: 'a1', role: 'admin' } });
    const handleSave = vi.fn();

    render(
      <MemoryRouter>
        <LiveEditProvider>
          <h1>
            <LiveEditableText value="Old Headline" onSave={handleSave} />
          </h1>
          <LiveEditFloatingBar />
        </LiveEditProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Edit Page/i }));
    expect(screen.getByRole('button', { name: /Done Editing/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit value/i }));
    const input = screen.getByDisplayValue('Old Headline');
    fireEvent.change(input, { target: { value: 'New Live Headline' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSave).toHaveBeenCalledWith('New Live Headline');
  });
});
