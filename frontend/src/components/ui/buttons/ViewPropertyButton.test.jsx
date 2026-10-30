import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewPropertyButton from './ViewPropertyButton';

describe('ViewPropertyButton Component', () => {
  it('renders default button with label "View property" and coral badge', () => {
    const handleClick = vi.fn();
    render(<ViewPropertyButton onClick={handleClick} />);

    const button = screen.getByRole('button', { name: /View property/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('rounded-full');
    expect(button).toHaveClass('bg-[#0F766E]');

    const badge = screen.getByTestId('coral-arrow-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#FF6B6B]');
    expect(badge).toHaveClass('rounded-full');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as react-router Link when "to" is provided', () => {
    render(
      <MemoryRouter>
        <ViewPropertyButton to="/properties/test-123" label="Explore listing" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Explore listing/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/properties/test-123');
  });

  it('renders as external link <a> with target="_blank" when external URL or target provided', () => {
    render(
      <ViewPropertyButton
        href="https://example.com/property"
        target="_blank"
        label="View live property"
      />
    );

    const link = screen.getByRole('link', { name: /View live property/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/property');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('adapts to size="sm" and size="lg"', () => {
    const { rerender } = render(<ViewPropertyButton size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('text-[11px]');

    rerender(<ViewPropertyButton size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-sm');
  });
});
