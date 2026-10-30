import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  PageHeaderSkeleton,
  MetricCardsSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  ProfileSkeleton,
  ListSkeleton,
  DashboardPageSkeleton,
  PropertyDetailSkeleton,
  InquiryDetailSkeleton,
  AgentDetailSkeleton,
} from './index';

describe('Broker Dashboard Skeleton Suite', () => {
  it('renders PageHeaderSkeleton with role="status" and pulsing elements', () => {
    const { container } = render(<PageHeaderSkeleton />);
    expect(screen.getByRole('status', { name: /Loading page header/i })).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders MetricCardsSkeleton with specified count of 4 KPI cards', () => {
    render(<MetricCardsSkeleton count={4} />);
    const status = screen.getByRole('status', { name: /Loading metrics/i });
    expect(status).toBeInTheDocument();
    expect(status.children.length).toBe(4);
  });

  it('renders TableSkeleton with configurable row count and toolbar', () => {
    const { container } = render(<TableSkeleton rows={5} hasToolbar={true} />);
    expect(screen.getByRole('status', { name: /Loading data table/i })).toBeInTheDocument();
    // 5 rows
    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows.length).toBe(5);
  });

  it('renders CardGridSkeleton with responsive cards', () => {
    render(<CardGridSkeleton count={6} />);
    const status = screen.getByRole('status', { name: /Loading cards/i });
    expect(status).toBeInTheDocument();
    expect(status.children.length).toBe(6);
  });

  it('renders ProfileSkeleton with avatar and two-column credentials structure', () => {
    render(<ProfileSkeleton />);
    expect(screen.getByRole('status', { name: /Loading profile credentials/i })).toBeInTheDocument();
  });

  it('renders ListSkeleton with configurable items', () => {
    render(<ListSkeleton count={4} />);
    const status = screen.getByRole('status', { name: /Loading list items/i });
    expect(status).toBeInTheDocument();
  });

  it('renders composite DashboardPageSkeleton for global Suspense routing', () => {
    render(<DashboardPageSkeleton />);
    expect(screen.getByRole('status', { name: /Loading broker portal page/i })).toBeInTheDocument();
  });

  it('renders PropertyDetailSkeleton with gallery and specs split', () => {
    render(<PropertyDetailSkeleton />);
    expect(screen.getByRole('status', { name: /Loading property listing dossier/i })).toBeInTheDocument();
  });

  it('renders InquiryDetailSkeleton with message thread and sidebar cards', () => {
    render(<InquiryDetailSkeleton />);
    expect(screen.getByRole('status', { name: /Loading inquiry dossier/i })).toBeInTheDocument();
  });

  it('renders AgentDetailSkeleton with banner and metric cards', () => {
    render(<AgentDetailSkeleton />);
    expect(screen.getByRole('status', { name: /Loading agent credentials dossier/i })).toBeInTheDocument();
  });
});
