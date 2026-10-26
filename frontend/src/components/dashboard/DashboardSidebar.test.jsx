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

    // Verify Clients is NOT rendered in broker navigation
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
  });
});
