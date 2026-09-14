import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StarTwinkleCanvas from './StarTwinkleCanvas';

describe('StarTwinkleCanvas', () => {
  it('renders canvas with correct class names and attributes', () => {
    const { container } = render(<StarTwinkleCanvas starCount={40} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pointer-events-none');
  });
});
