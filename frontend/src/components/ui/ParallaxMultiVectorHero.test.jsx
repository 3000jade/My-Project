import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParallaxMultiVectorHero from './ParallaxMultiVectorHero';

describe('ParallaxMultiVectorHero', () => {
  it('renders initial title and triggers action callbacks with compliant h-[54px] buttons', () => {
    const onExplore = vi.fn();
    const onRequestValuation = vi.fn();

    render(
      <ParallaxMultiVectorHero
        onExplore={onExplore}
        onRequestValuation={onRequestValuation}
      />
    );

    // Initial heading & badge
    expect(screen.getAllByText(/DAHLIA ENCLAVE/i).length).toBeGreaterThanOrEqual(1);

    // Check buttons with strict h-[54px] height
    const exploreBtn = screen.getByRole('button', { name: /explore residences/i });
    const valuationBtn = screen.getByRole('button', { name: /schedule private viewing/i });

    expect(exploreBtn).toHaveClass('h-[54px]');
    expect(valuationBtn).toHaveClass('h-[54px]');

    fireEvent.click(exploreBtn);
    expect(onExplore).toHaveBeenCalledTimes(1);

    fireEvent.click(valuationBtn);
    expect(onRequestValuation).toHaveBeenCalledTimes(1);
  });
});
