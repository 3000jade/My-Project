import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './spinner';

describe('Spinner UI Primitive', () => {
  it('renders inline spinner with default size and animate-spin class', () => {
    const { container } = render(<Spinner data-testid="inline-spinner" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
    expect(svg).toHaveClass('text-[#0F766E]');
    expect(svg).toHaveClass('w-6');
    expect(svg).toHaveClass('h-6');
  });

  it('renders with custom size', () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4');
    expect(svg).toHaveClass('h-4');
  });

  it('renders centered card with role="status" and text label', () => {
    render(<Spinner centered text="Loading consultant directory..." />);
    const status = screen.getByRole('status', { name: /loading consultant directory/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('py-20');
    expect(status).toHaveClass('rounded-md');
    expect(screen.getByText('Loading consultant directory...')).toBeInTheDocument();
  });
});
