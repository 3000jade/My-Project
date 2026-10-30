import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button UI Primitive with Loading State', () => {
  it('renders standard button without loading spinner by default', () => {
    render(<Button>Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
    expect(btn.querySelector('.animate-spin')).toBeNull();
  });

  it('renders loading spinner and disables button when loading={true}', () => {
    render(<Button loading>Submit Action</Button>);
    const btn = screen.getByRole('button', { name: /submit action/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.animate-spin')).not.toBeNull();
  });

  it('renders correctly asChild without Slot children errors', () => {
    render(
      <Button asChild variant="outline" size="sm">
        <a href="/broker/reports">Reports Link</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: /reports link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/broker/reports');
    expect(link.className).toContain('border-[#E2E8F0]');
  });
});
