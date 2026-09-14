import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VectorHUDOverlay from './VectorHUDOverlay';

describe('VectorHUDOverlay', () => {
  it('renders technical coordinate markers and architectural spec labels', () => {
    render(<VectorHUDOverlay opacity={1} />);
    expect(screen.getByText(/14\.5995° N, 120\.9842° E/i)).toBeInTheDocument();
    expect(screen.getByText(/EL \+28\.40M/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 3 • DAHLIA ENCLAVE/i)).toBeInTheDocument();
  });
});
