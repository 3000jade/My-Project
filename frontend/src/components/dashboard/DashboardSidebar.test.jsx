import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';

describe('DashboardSidebar Navigation', () => {
  it('renders broker navigation links with Settings at the end and no support card', () => {
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
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Verify semantic group headings
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Analytics & System')).toBeInTheDocument();

    // Verify support card was removed per specification
    expect(screen.queryByText('Need Assistance?')).not.toBeInTheDocument();
    expect(screen.queryByText('Go to Help Center')).not.toBeInTheDocument();

    // Verify Clients and Tasks are NOT rendered in broker navigation
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });

  it('renders Settings link pinned at the end pointing to /broker/profile with contrast pill design', () => {
    render(
      <MemoryRouter initialEntries={['/broker/dashboard']}>
        <DashboardSidebar role="broker" />
      </MemoryRouter>
    );

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/broker/profile');
    expect(settingsLink).toHaveClass('rounded-full');
  });

  it('highlights active item with teal base, circular coral icon badge, and rounded-full pill styling', () => {
    render(
      <MemoryRouter initialEntries={['/broker/profile']}>
        <DashboardSidebar role="broker" />
      </MemoryRouter>
    );

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveClass('bg-[#0F766E]');
    expect(settingsLink).toHaveClass('rounded-full');

    // Circular coral badge inside active link
    const coralBadge = settingsLink.querySelector('.bg-\\[\\#FF6B6B\\]');
    expect(coralBadge).toBeInTheDocument();
    expect(coralBadge).toHaveClass('rounded-full');

    const aside = screen.getByLabelText('Dashboard Sidebar');
    expect(aside).toHaveClass('rounded-r-2xl');
  });
});
