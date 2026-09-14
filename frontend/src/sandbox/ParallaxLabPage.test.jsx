import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParallaxLabPage from './ParallaxLabPage';

describe('ParallaxLabPage', () => {
  it('renders lab header and allows switching between Pan, Zoom, and Arc modes', () => {
    render(<ParallaxLabPage />);

    // Header title
    expect(screen.getByText(/Anime Parallax/i)).toBeInTheDocument();
    expect(screen.getByText(/Motion Lab/i)).toBeInTheDocument();

    // Mode Buttons
    const zoomTab = screen.getByRole('button', { name: /parallax zoom/i });
    const panTab = screen.getByRole('button', { name: /parallax pan/i });
    const arcTab = screen.getByRole('button', { name: /parallax arc/i });

    expect(zoomTab).toBeInTheDocument();
    expect(panTab).toBeInTheDocument();
    expect(arcTab).toBeInTheDocument();

    // Click Pan tab
    fireEvent.click(panTab);
    expect(screen.getByText(/Differential Velocity Multipliers/i)).toBeInTheDocument();

    // Click Arc tab
    fireEvent.click(arcTab);
    expect(screen.getByText(/Counter-Directional Motion/i)).toBeInTheDocument();
  });
});
