import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders null when status is empty or falsy', () => {
    const { container: c1 } = render(<StatusBadge status="" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<StatusBadge status={null} />);
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(<StatusBadge status={undefined} />);
    expect(c3.firstChild).toBeNull();
  });

  it('renders Active and Available with Spruce Teal tokens', () => {
    const { rerender } = render(<StatusBadge status="ACTIVE" />);
    let badge = screen.getByText('ACTIVE');
    expect(badge).toHaveClass('bg-teal-50', 'text-teal-700', 'border-teal-200');

    rerender(<StatusBadge status="AVAILABLE" />);
    badge = screen.getByText('AVAILABLE');
    expect(badge).toHaveClass('bg-teal-50', 'text-teal-700', 'border-teal-200');

    rerender(<StatusBadge status="published" />);
    badge = screen.getByText('published');
    expect(badge).toHaveClass('bg-teal-50', 'text-teal-700', 'border-teal-200');
  });

  it('renders Closed and Sold with Slate Neutral tokens', () => {
    const { rerender } = render(<StatusBadge status="CLOSED" />);
    let badge = screen.getByText('CLOSED');
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700', 'border-slate-300');

    rerender(<StatusBadge status="SOLD" />);
    badge = screen.getByText('SOLD');
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700', 'border-slate-300');
  });

  it('renders Pending, Active Under Contract, and Pending Confirmation with Amber tokens', () => {
    const { rerender } = render(<StatusBadge status="PENDING" />);
    let badge = screen.getByText('PENDING');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700', 'border-amber-200');

    rerender(<StatusBadge status="Active Under Contract" />);
    badge = screen.getByText('Active Under Contract');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700', 'border-amber-200');

    rerender(<StatusBadge status="ACTIVE_UNDER_CONTRACT" />);
    badge = screen.getByText('ACTIVE_UNDER_CONTRACT');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700', 'border-amber-200');

    rerender(<StatusBadge status="PENDING CONFIRMATION" />);
    badge = screen.getByText('PENDING CONFIRMATION');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700', 'border-amber-200', 'font-bold');
  });

  it('renders Draft and Inactive with Slate Muted tokens', () => {
    const { rerender } = render(<StatusBadge status="DRAFT" />);
    let badge = screen.getByText('DRAFT');
    expect(badge).toHaveClass('bg-slate-50', 'text-slate-600', 'border-slate-200');

    rerender(<StatusBadge status="INACTIVE" />);
    badge = screen.getByText('INACTIVE');
    expect(badge).toHaveClass('bg-slate-50', 'text-slate-600', 'border-slate-200');
  });

  it('renders Action Required and Rejected with Rose/Coral tokens', () => {
    const { rerender } = render(<StatusBadge status="REJECTED" />);
    let badge = screen.getByText('REJECTED');
    expect(badge).toHaveClass('bg-rose-50', 'text-rose-700', 'border-rose-200');

    rerender(<StatusBadge status="ACTION REQUIRED" />);
    badge = screen.getByText('ACTION REQUIRED');
    expect(badge).toHaveClass('bg-rose-50', 'text-rose-700', 'border-rose-200', 'font-bold');

    rerender(<StatusBadge status="CANCELLED" />);
    badge = screen.getByText('CANCELLED');
    expect(badge).toHaveClass('bg-rose-50', 'text-rose-700', 'border-rose-200');
  });

  it('renders with custom className when passed', () => {
    render(<StatusBadge status="ACTIVE" className="shadow-lg custom-test-class" />);
    const badge = screen.getByText('ACTIVE');
    expect(badge).toHaveClass('shadow-lg', 'custom-test-class');
  });

  it('renders fallback styles for unknown statuses', () => {
    render(<StatusBadge status="UNKNOWN_STATUS_XYZ" />);
    const badge = screen.getByText('UNKNOWN_STATUS_XYZ');
    expect(badge).toHaveClass('bg-slate-50', 'text-slate-700', 'border-slate-200');
  });
});
