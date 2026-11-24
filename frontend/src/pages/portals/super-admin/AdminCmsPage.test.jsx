import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCmsPage from './AdminCmsPage';
import cmsService from '@/services/cmsService';

vi.mock('@/services/cmsService', () => ({
  default: {
    listAdminContents: vi.fn(),
    createContent: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn(),
    uploadMedia: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));

const MOCK_ITEMS = [
  {
    id: 'b1',
    content_type: 'banner',
    slug: 'open-house',
    title: 'Open House Weekend',
    summary: 'Visit our BGC models',
    payload: { cta_label: 'Explore', cta_url: '/properties' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'pt1',
    content_type: 'partner',
    slug: 'ayala-land',
    title: 'Ayala Land',
    media_url: 'https://example.com/ayala.png',
    payload: { partner_type: 'developer' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'pt2',
    content_type: 'partner',
    slug: 'draft-bank',
    title: 'Draft Partner Bank',
    payload: { partner_type: 'bank' },
    status: 'DRAFT',
    sort_order: 2,
  },
  {
    id: 's1',
    content_type: 'staff',
    slug: 'gina-punzalan',
    title: 'Gina Punzalan',
    media_url: '/images/staff/gina-punzalan.jpg',
    payload: { department: 'Business Development & Growth', role: 'Senior Business Development' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'o1',
    content_type: 'office',
    slug: 'makati-main',
    title: 'Makati Main Office',
    payload: { address: '123 Ayala Ave, Makati', phone: '+63 2 8888 0000' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
  {
    id: 'g1',
    content_type: 'article',
    slug: 'buyer-guide-1',
    title: 'First-Time Buyer Guide',
    summary: 'Steps to buy a home',
    body: 'Full article body here.',
    payload: { category: 'Buyers' },
    status: 'PUBLISHED',
    sort_order: 1,
  },
];

describe('AdminCmsPage (Live View Editor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cmsService.listAdminContents.mockResolvedValue(MOCK_ITEMS);
    cmsService.updateContent.mockImplementation(async (id, patch) => {
      const existing = MOCK_ITEMS.find((i) => i.id === id) || { id };
      return { ...existing, ...patch };
    });
    cmsService.createContent.mockImplementation(async (payload) => ({
      id: 'created-1',
      ...payload,
    }));
    cmsService.deleteContent.mockResolvedValue();
    cmsService.uploadMedia.mockResolvedValue({
      url: '/api/drive/media/new-photo',
      fileId: 'new-photo',
      fileName: 'photo.jpg',
    });
  });

  it('renders all 4 live page tabs with instant inline text editing and no form drawer', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /Homepage/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /About Us/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Contact/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Guides/i })).toBeInTheDocument();

    // Click banner title directly on the live canvas to edit inline
    fireEvent.click(screen.getByRole('button', { name: /Edit banner title Open House Weekend/i }));
    const input = screen.getByDisplayValue('Open House Weekend');
    fireEvent.change(input, { target: { value: 'Grand Launch Weekend' } });
    fireEvent.click(screen.getByRole('button', { name: /Save value/i }));

    await waitFor(() => {
      expect(cmsService.updateContent).toHaveBeenCalledWith('b1', {
        title: 'Grand Launch Weekend',
      });
    });
  });

  it('adds a new starter card directly on the canvas with zero form drawer', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Open House Weekend')).toBeInTheDocument();
    });

    const aboutTab = screen.getByRole('tab', { name: /About Us/i });
    fireEvent.mouseDown(aboutTab, { button: 0, ctrlKey: false });
    fireEvent.click(aboutTab);
    await waitFor(() => {
      expect(screen.getByText('Gina Punzalan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Staff Member/i }));

    await waitFor(() => {
      expect(cmsService.createContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: 'staff',
          status: 'DRAFT',
        })
      );
      expect(screen.getByText('New Team Member')).toBeInTheDocument();
    });
  });

  it('hides drafts and edit controls in Preview as Visitor mode', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Draft Partner Bank')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Preview as Visitor/i }));

    expect(screen.queryByText('Draft Partner Bank')).toBeNull();
    expect(screen.queryByRole('button', { name: /Add Banner/i })).toBeNull();
    expect(screen.getByText('Ayala Land')).toBeInTheDocument();
  });

  it('toggles Live/Hidden and confirms permanent deletion via CmsDeleteDialog', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Draft Partner Bank')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Publish Draft Partner Bank/i }));
    await waitFor(() => {
      expect(cmsService.updateContent).toHaveBeenCalledWith('pt2', { status: 'PUBLISHED' });
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Ayala Land/i }));
    await waitFor(() => {
      expect(screen.getByText(/Delete .*Ayala Land/i)).toBeInTheDocument();
    });
    expect(cmsService.deleteContent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete Permanently/i }));
    await waitFor(() => {
      expect(cmsService.deleteContent).toHaveBeenCalledWith('pt1');
    });
  });

  it('supports inline image upload directly on a card via LiveEditableImage', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Ayala Land')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Change image for Ayala Land/i }));
    const fileInput = screen.getByLabelText(/Upload image for Ayala Land/i);
    const file = new File(['img'], 'ayala-new.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(cmsService.uploadMedia).toHaveBeenCalledWith(file);
      expect(cmsService.updateContent).toHaveBeenCalledWith('pt1', {
        media_url: '/api/drive/media/new-photo',
      });
    });
  });
});
