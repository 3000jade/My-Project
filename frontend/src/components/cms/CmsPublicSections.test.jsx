import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CmsPublicBanner, CmsPublicCollectionsAndFaqs } from './CmsPublicSections';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    getPublicContents: vi.fn(),
    getPublicCollections: vi.fn(),
  },
}));

describe('CmsPublicSections', () => {
  it('renders published banner, featured collections, and FAQs', async () => {
    cmsService.getPublicContents.mockImplementation((type) => {
      if (type === 'banner') {
        return Promise.resolve([
          {
            id: 'b1',
            title: 'Open House Weekend',
            summary: 'Visit BGC & Makati residences',
            payload: { cta_label: 'Browse', cta_url: '/properties' },
          },
        ]);
      }
      if (type === 'faq') {
        return Promise.resolve([
          {
            id: 'f1',
            title: 'How do I book a viewing?',
            body: 'Click Request Viewing on any listing.',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    cmsService.getPublicCollections.mockResolvedValue([
      {
        id: 'c1',
        title: 'Featured Metro Homes',
        description: 'Hand-picked residences',
        items: [
          {
            id: 'ci1',
            custom_badge: 'Hot',
            property: { id: 'p1', title: 'BGC Sky Loft', city: 'Taguig', price: 25000000 },
          },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <CmsPublicBanner />
        <CmsPublicCollectionsAndFaqs />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
      expect(screen.getByText('Featured Metro Homes')).toBeInTheDocument();
      expect(screen.getByText('BGC Sky Loft')).toBeInTheDocument();
      expect(screen.getByText('How do I book a viewing?')).toBeInTheDocument();
    });
  });

  it('renders nothing when no CMS content is published', async () => {
    cmsService.getPublicContents.mockResolvedValue([]);
    cmsService.getPublicCollections.mockResolvedValue([]);

    const { container } = render(
      <MemoryRouter>
        <CmsPublicBanner />
        <CmsPublicCollectionsAndFaqs />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicCollections).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();
  });
});
