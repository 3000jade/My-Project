import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
  it('renders Style 1 (trend) with value, trend pill, and footer', () => {
    render(
      <KpiCard
        variant="trend"
        title="Monthly Sales Volume"
        value="₱18.4M"
        trend="12.4%"
        trendDirection="up"
        icon={DollarSign}
        footerText="vs. ₱16.3M last month"
      />
    );

    expect(screen.getByText('Monthly Sales Volume')).toBeInTheDocument();
    expect(screen.getByText('₱18.4M')).toBeInTheDocument();
    expect(screen.getByText('12.4%')).toBeInTheDocument();
    expect(screen.getByText('vs. ₱16.3M last month')).toBeInTheDocument();
  });

  it('renders Style 2 (sparkline) with SVG sparkline', () => {
    const { container } = render(
      <KpiCard
        variant="sparkline"
        title="Property Inquiries"
        value="1,284"
        trend="+18.2%"
        sparklineData={[10, 14, 12, 20, 18, 28]}
        footerText="Peak: 142 leads on Tue"
      />
    );

    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(container.querySelector('svg path')).toBeTruthy();
  });

  it('renders Style 3 (progress) with accessible progressbar', () => {
    render(
      <KpiCard
        variant="progress"
        title="Quarterly Lot Sales"
        value="34"
        targetLabel="/ 40 target lots"
        progress={85}
        helperText="6 more lots needed"
      />
    );

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '85');
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders Style 4 (breakdown) with segment legend items', () => {
    render(
      <KpiCard
        variant="breakdown"
        title="Active Listings"
        value="142"
        segments={[
          { label: 'Available', value: 94, color: 'primary' },
          { label: 'Reserved', value: 31, color: 'amber' },
          { label: 'Draft', value: 17, color: 'slate' },
        ]}
      />
    );

    expect(screen.getByText('94 Available')).toBeInTheDocument();
    expect(screen.getByText('31 Reserved')).toBeInTheDocument();
    expect(screen.getByText('17 Draft')).toBeInTheDocument();
  });

  it('renders Style 5 (action) and triggers onAction when clicked', () => {
    const handleAction = vi.fn();
    render(
      <KpiCard
        variant="action"
        title="Pending Broker Approvals"
        value="6"
        statusLabel="Needs Review"
        helperText="2 waiting > 48 hrs"
        footerText="Avg. wait: 19 hrs"
        actionLabel="Review queue"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('Needs Review')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /review queue/i }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton state when loading is true', () => {
    render(<KpiCard loading title="Hidden" value="0" />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders compact (sm) and standard minimal (md) sizes', () => {
    render(
      <>
        <KpiCard size="sm" title="Compact Metric" value="42" statusLabel="New" />
        <KpiCard size="md" title="Standard Metric" value="₱18.4M" trend="+12%" />
      </>
    );

    expect(screen.getByText('Compact Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Standard Metric')).toBeInTheDocument();
    expect(screen.getByText('₱18.4M')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
});
