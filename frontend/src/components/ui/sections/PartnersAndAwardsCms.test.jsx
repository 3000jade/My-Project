import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartnersSection from './PartnersSection';
import AwardsShowcase from './AwardsShowcase';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    getPublicContents: vi.fn(),
  },
}));

describe('PartnersSection CMS integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders published developer and bank partner logos and safe external links', async () => {
    cmsService.getPublicContents.mockImplementation((type) => {
      if (type === 'partner') {
        return Promise.resolve([
          {
            id: 'p-dev-1',
            title: 'Ayala Land Premier',
            media_url: 'https://cdn.example.com/ayala.png',
            payload: {
              partner_type: 'developer',
              website_url: 'https://ayalaland.com.ph',
            },
          },
          {
            id: 'p-dev-2',
            title: 'Rockwell Land',
            media_url: '',
            payload: {
              partner_type: 'developer',
              website_url: 'javascript:alert(1)',
            },
          },
          {
            id: 'p-bank-1',
            title: 'BPI Wealth',
            media_url: 'https://cdn.example.com/bpi.png',
            payload: {
              partner_type: 'bank',
              website_url: 'https://bpi.com.ph',
            },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter>
        <PartnersSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('partner');
    });

    const devLogos = await screen.findAllByAltText('Ayala Land Premier');
    expect(devLogos.length).toBeGreaterThanOrEqual(1);
    expect(devLogos[0]).toHaveAttribute('src', 'https://cdn.example.com/ayala.png');

    const bankLogos = await screen.findAllByAltText('BPI Wealth');
    expect(bankLogos.length).toBeGreaterThanOrEqual(1);
    expect(bankLogos[0]).toHaveAttribute('src', 'https://cdn.example.com/bpi.png');

    // Typographic fallback badge when media_url is empty
    const rockwellBadges = screen.getAllByText('Rockwell Land');
    expect(rockwellBadges.length).toBeGreaterThanOrEqual(1);

    // Safe http(s) link wraps the card
    const ayalaLinks = screen.getAllByRole('link', { name: /Ayala Land Premier/i });
    expect(ayalaLinks[0]).toHaveAttribute('href', 'https://ayalaland.com.ph/');
    expect(ayalaLinks[0]).toHaveAttribute('target', '_blank');
    expect(ayalaLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');

    // Unsafe javascript: URL is not rendered as a link
    expect(screen.queryByRole('link', { name: /Rockwell Land/i })).not.toBeInTheDocument();

    // Placeholders should no longer be rendered when both groups have CMS partners
    expect(screen.queryByAltText('Partner Developer Mockup')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Partner Bank Mockup')).not.toBeInTheDocument();
  });

  it('falls back to placeholder mocks when CMS returns empty or rejects', async () => {
    cmsService.getPublicContents.mockResolvedValueOnce([]);

    const { unmount } = render(
      <MemoryRouter>
        <PartnersSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('partner');
    });

    expect(screen.getAllByAltText('Partner Developer Mockup').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('Partner Bank Mockup').length).toBeGreaterThan(0);

    unmount();

    cmsService.getPublicContents.mockRejectedValueOnce(new Error('Network offline'));

    render(
      <MemoryRouter>
        <PartnersSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledTimes(2);
    });

    expect(screen.getAllByAltText('Partner Developer Mockup').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('Partner Bank Mockup').length).toBeGreaterThan(0);
  });
});

describe('AwardsShowcase CMS integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders published awards in Historical Honors grid and featured media in carousel', async () => {
    cmsService.getPublicContents.mockImplementation((type) => {
      if (type === 'award') {
        return Promise.resolve([
          {
            id: 'a-1',
            title: 'Philippine Property Awards Winner',
            summary: 'Recognized for premier residential advisory.',
            media_url: 'https://cdn.example.com/award-1.jpg',
            payload: {
              year: '2026',
              organization: 'PropertyGuru Asia',
              media_type: 'image',
              featured: true,
            },
          },
          {
            id: 'a-2',
            title: 'Regional Brokerage Honor',
            summary: 'Honored for regional volume.',
            media_url: 'https://cdn.example.com/award-2.jpg',
            payload: {
              year: '2025',
              organization: 'Asia Realty Guild',
              media_type: 'image',
              featured: false,
            },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<AwardsShowcase />);

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('award');
    });

    // Historical Honors grid contains both published awards
    expect(await screen.findByText('2026')).toBeInTheDocument();
    expect(screen.getByText('PropertyGuru Asia')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('Regional Brokerage Honor')).toBeInTheDocument();
    expect(screen.getByText('Asia Realty Guild')).toBeInTheDocument();

    // Featured carousel slide uses featured award media and summary
    const carouselImg = screen.getByAltText('Philippine Property Awards Winner');
    expect(carouselImg).toHaveAttribute('src', 'https://cdn.example.com/award-1.jpg');
    expect(screen.getByText('Recognized for premier residential advisory.')).toBeInTheDocument();

    // Non-featured award (featured: false) is excluded from carousel slides
    expect(screen.queryByAltText('Regional Brokerage Honor')).not.toBeInTheDocument();

    // Only 1 featured slide -> 1 slide pagination dot
    expect(screen.getAllByRole('button', { name: /Go to slide/i })).toHaveLength(1);

    // Clicking next/prev on a 1-slide carousel keeps rendering safely
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 1' }));
    expect(screen.getByAltText('Philippine Property Awards Winner')).toBeInTheDocument();

    // Built-in default honors should be replaced
    expect(screen.queryByText('Top Luxury Brokerage Firm')).not.toBeInTheDocument();
  });

  it('falls back to built-in honors and slides when CMS returns empty or rejects', async () => {
    cmsService.getPublicContents.mockResolvedValueOnce([]);

    const { unmount } = render(<AwardsShowcase />);

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('award');
    });

    expect(screen.getByText('Top Luxury Brokerage Firm')).toBeInTheDocument();
    expect(screen.getByText('Asian Real Estate Awards')).toBeInTheDocument();
    expect(screen.getByText('Best Luxury Brokerage 2025')).toBeInTheDocument();

    unmount();

    cmsService.getPublicContents.mockRejectedValueOnce(new Error('API unreachable'));

    render(<AwardsShowcase />);

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText('Top Luxury Brokerage Firm')).toBeInTheDocument();
  });
});
