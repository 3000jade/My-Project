import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminCmsPage from './AdminCmsPage';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    listAdminContents: vi.fn().mockResolvedValue([
      {
        id: '1',
        content_type: 'page',
        slug: 'about-us',
        title: 'About Human Shelter Realty',
        status: 'PUBLISHED',
        sort_order: 0,
      },
      {
        id: '2',
        content_type: 'article',
        slug: 'first-time-buyer-guide',
        title: 'First-Time Buyer Guide',
        status: 'DRAFT',
        sort_order: 1,
      },
    ]),
    listAdminCollections: vi.fn().mockResolvedValue([]),
    createContent: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn(),
  },
}));

vi.mock('@/services/propertyService', () => ({
  default: {
    getProperties: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('AdminCmsPage', () => {
  it('renders CMS tabs, KPI counts, and opens the content editor drawer', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('About Human Shelter Realty')).toBeTruthy();
    });

    expect(screen.getByText('Corporation Content Management')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Company Pages/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Featured Collections/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /New Company Pages/i }));
    await waitFor(() => {
      expect(screen.getByText(/Save as Draft to keep it private/i)).toBeTruthy();
    });

    expect(cmsService.listAdminContents).toHaveBeenCalled();
  });
});
