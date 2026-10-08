import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../../../frontend/src/components/layout/Header';
import * as AuthContext from '../../../../frontend/src/context/AuthContext';

describe('Header Navigation & Profile Dock', () => {
  it('renders login and register buttons when unauthenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /^Login$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Register$/i })).toBeInTheDocument();
  });

  it('renders user avatar and role badge and opens profile dropdown when authenticated', () => {
    const mockLogout = vi.fn();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'usr-1',
        fullName: 'Alexander Wright',
        email: 'alex@kerby.ph',
        role: 'broker'
      },
      isAuthenticated: true,
      logout: mockLogout
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // Login/Register links should not be present
    expect(screen.queryByRole('link', { name: /^Login$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Register$/i })).not.toBeInTheDocument();

    // User profile button with name and role
    expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('BROKER')).toBeInTheDocument();

    // Open dropdown
    const profileBtn = screen.getByRole('button', { name: /Alexander Wright/i });
    fireEvent.click(profileBtn);

    expect(screen.getByText('alex@kerby.ph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();

    // Click Sign Out
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
