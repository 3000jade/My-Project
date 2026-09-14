import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Page Integration', () => {
  it('renders ParallaxMultiVectorHero and hero-sentinel anchor', () => {
    const { container } = render(
      <BrowserRouter>
        <Home setIsDarkTheme={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/DAHLIA ENCLAVE/i).length).toBeGreaterThanOrEqual(1);
    const sentinel = container.querySelector('#hero-sentinel');
    expect(sentinel).toBeInTheDocument();
  });
});
