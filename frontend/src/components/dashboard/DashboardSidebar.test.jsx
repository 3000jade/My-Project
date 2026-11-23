import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('../../services/inquiryService', () => ({
  inquiryService: {
    getInquiries: vi.fn().mockResolvedValue([{ id: '1', status: 'NEW' }]),
  },
}));

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

function renderSidebar(initialEntry = '/broker/dashboard', role = 'broker') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TooltipProvider>
        <SidebarProvider>
          <DashboardSidebar role={role} />
        </SidebarProvider>
      </TooltipProvider>
    </MemoryRouter>
  );
}

describe('DashboardSidebar Navigation', () => {
  it('renders broker navigation links with Settings at the end and no support card', () => {
    renderSidebar('/broker/dashboard', 'broker');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Analytics & System')).toBeInTheDocument();

    expect(screen.queryByText('Quick Search...')).not.toBeInTheDocument();
    expect(screen.queryByText('Need Assistance?')).not.toBeInTheDocument();
    expect(screen.queryByText('Go to Help Center')).not.toBeInTheDocument();
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });

  it('renders Settings link pinned at the end pointing to /broker/profile with small rounded styling', () => {
    renderSidebar('/broker/dashboard', 'broker');

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/broker/profile');
    expect(settingsLink).toHaveClass('rounded-md');
  });

  it('highlights active item with Deep Forest Teal theme and teal base', () => {
    renderSidebar('/broker/profile', 'broker');

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveClass('bg-[#0F766E]');
    expect(settingsLink).toHaveClass('text-white');
    expect(settingsLink).toHaveClass('rounded-md');

    const aside = screen.getByLabelText('Dashboard Sidebar');
    expect(aside).toHaveAttribute('data-sidebar-theme', 'deep-teal');
  });
});
