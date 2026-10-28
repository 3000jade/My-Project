import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';

describe('DashboardSidebar Navigation', () => {
  it('renders broker navigation links without Clients section', () => {
    render(
      <MemoryRouter initialEntries={['/broker/dashboard']}>
        <DashboardSidebar role="broker" />
      </MemoryRouter>
    );

    // Verify presence of broker navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Verify semantic group headings
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Analytics & System')).toBeInTheDocument();

    // Verify support card
    expect(screen.getByText('Need Assistance?')).toBeInTheDocument();
    expect(screen.getByText('Go to Help Center')).toBeInTheDocument();

    // Verify Clients is NOT rendered in broker navigation
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
  });

  it('renders Settings link pointing to /broker/profile', () => {
    render(
      <MemoryRouter initialEntries={['/broker/dashboard']}>
        <DashboardSidebar role="broker" />
      </MemoryRouter>
    );

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/broker/profile');
  });
});
