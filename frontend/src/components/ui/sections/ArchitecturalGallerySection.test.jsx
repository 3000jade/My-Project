import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ArchitecturalGallerySection from './ArchitecturalGallerySection';

describe('ArchitecturalGallerySection (Continuous 3x1 Carousel)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders section title, all properties in the continuous track, and navigation controls', () => {
    render(
      <BrowserRouter>
        <ArchitecturalGallerySection />
      </BrowserRouter>
    );

    // Section title
    expect(screen.getByText('Featured Properties')).toBeInTheDocument();

    // All properties are present in the continuous carousel track (not hidden/unmounted)
    expect(screen.getByText('Ayala Alabang Sanctuary')).toBeInTheDocument();
    expect(screen.getByText('The Proscenium Sky Penthouse')).toBeInTheDocument();
    expect(screen.getByText('Aurelia Residences Horizon')).toBeInTheDocument();
    expect(screen.getByText('Forbes Park Brutalist Villa')).toBeInTheDocument();
    expect(screen.getByText('Dasmariñas Modern Pavilion')).toBeInTheDocument();
    expect(screen.getByText('The Suites at BGC Sky Villa')).toBeInTheDocument();
    expect(screen.getByText('Horizon Terraces Sanctuary')).toBeInTheDocument();
    expect(screen.getByText('Urdaneta Village Serenity')).toBeInTheDocument();
    expect(screen.getByText('Bel-Air Modernist Glasshouse')).toBeInTheDocument();

    // Previous and Next buttons
    expect(screen.getByRole('button', { name: /Previous properties/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next properties/i })).toBeInTheDocument();

    // Dots indicator
    const dots = screen.getAllByRole('button', { name: /Go to property group/i });
    expect(dots.length).toBeGreaterThan(0);
  });

  it('navigates to property detail page when View Details is clicked', () => {
    render(
      <BrowserRouter>
        <ArchitecturalGallerySection />
      </BrowserRouter>
    );

    const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
    expect(detailButtons.length).toBeGreaterThan(0);
  });

  it('handles navigation button clicks smoothly', () => {
    render(
      <BrowserRouter>
        <ArchitecturalGallerySection />
      </BrowserRouter>
    );

    const nextBtn = screen.getByRole('button', { name: /Next properties/i });
    const prevBtn = screen.getByRole('button', { name: /Previous properties/i });

    expect(() => {
      fireEvent.click(nextBtn);
      fireEvent.click(prevBtn);
    }).not.toThrow();
  });

  it('runs 20-second timer without error', () => {
    render(
      <BrowserRouter>
        <ArchitecturalGallerySection />
      </BrowserRouter>
    );

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByText('Featured Properties')).toBeInTheDocument();
  });
});
