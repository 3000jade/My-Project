import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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

const MOCK_ITEMS = [
  {
    id: 'b1',
    content_type: 'banner',
    slug: 'spring-open-house',
    title: 'Spring Open House Banner',
    summary: 'Tour our newest homes this weekend.',
    status: 'PUBLISHED',
    sort_order: 0,
    payload: { cta_label: 'Explore Listings', cta_url: '/properties' },
  },
  {
    id: 'p1',
    content_type: 'page',
    slug: 'about-us',
    title: 'About Human Shelter Realty',
    summary: 'Our heritage and values.',
    status: 'PUBLISHED',
    sort_order: 0,
    payload: {},
  },
  {
    id: 'o1',
    content_type: 'office',
    slug: 'bgc-head-office',
    title: 'BGC Main Branch',
    status: 'DRAFT',
    sort_order: 1,
    payload: {
      address: 'High Street South Corporate Plaza, BGC',
      phone: '+63 2 8123 4567',
      hours: 'Mon-Sat 9:00 AM - 6:00 PM',
    },
  },
  {
    id: 's1',
    content_type: 'staff',
    slug: 'maria-santos',
    title: 'Maria Santos',
    status: 'PUBLISHED',
    sort_order: 0,
    payload: {
      role: 'Senior Sales Director',
      department: 'Sales Department',
    },
  },
  {
    id: 'pr1',
    content_type: 'partner',
    slug: 'ayala-land',
    title: 'Ayala Land',
    status: 'PUBLISHED',
    sort_order: 0,
    payload: {
      partner_type: 'developer',
      website_url: 'https://ayalaland.com.ph',
    },
  },
  {
    id: 'aw1',
    content_type: 'award',
    slug: 'top-brokerage-2025',
    title: 'Top Brokerage Award',
    status: 'DRAFT',
    sort_order: 1,
    payload: {
      year: '2025',
      organization: 'Lamudi Outlook',
      media_type: 'image',
      featured: true,
    },
  },
];

function activateTab(tabName) {
  const tab = screen.getByRole('tab', { name: tabName });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
  return tab;
}

describe('AdminCmsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cmsService.listAdminContents.mockResolvedValue(MOCK_ITEMS);
    cmsService.createContent.mockResolvedValue({ id: 'new-1' });
    cmsService.updateContent.mockResolvedValue({ id: 'updated-1' });
    cmsService.deleteContent.mockResolvedValue();
  });

  it('renders all 6 realty tabs, KPI cards, switches to Company & Contact, and filters by Draft status pill', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open House Banner')).toBeInTheDocument();
    });

    // Portal header rule: no stacked portal title above page content
    expect(screen.queryByText('Corporation Content Management')).not.toBeInTheDocument();

    // All 6 realty tabs present
    expect(screen.getByRole('tab', { name: /Banners & Announcements/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Company & Contact/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Staff Directory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Partners & Awards/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Buyer Guides/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /FAQs/i })).toBeInTheDocument();

    // 3 KPI tiles: 4 published, 2 drafts, 4 active sections out of 6
    expect(screen.getByText('Published Items')).toBeInTheDocument();
    expect(screen.getByText('Drafts Pending')).toBeInTheDocument();
    expect(screen.getByText('Active Sections')).toBeInTheDocument();
    expect(screen.getByText('4 / 6')).toBeInTheDocument();

    // Switch to Company & Contact and verify both page and office items appear
    activateTab(/Company & Contact/i);

    await waitFor(() => {
      expect(screen.getByText('About Human Shelter Realty')).toBeInTheDocument();
      expect(screen.getByText('BGC Main Branch')).toBeInTheDocument();
    });

    // Filter by Draft status pill -> only BGC Main Branch remains
    fireEvent.click(screen.getByRole('button', { name: /^Draft$/i }));

    expect(screen.getByText('BGC Main Branch')).toBeInTheDocument();
    expect(screen.queryByText('About Human Shelter Realty')).not.toBeInTheDocument();
  });

  it('shows tailored Staff Directory fields and hides raw Web Address slug input', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open House Banner')).toBeInTheDocument();
    });

    activateTab(/Staff Directory/i);

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Staff Member/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Job Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Web Address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/URL Slug/i)).not.toBeInTheDocument();
  });

  it('switches sub-types in Partners & Awards drawer between Partner Category and Award fields', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open House Banner')).toBeInTheDocument();
    });

    activateTab(/Partners & Awards/i);

    await waitFor(() => {
      expect(screen.getByText('Ayala Land')).toBeInTheDocument();
      expect(screen.getByText('Top Brokerage Award')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Partner or Award/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Partner Category/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Awarding Organization/i)).not.toBeInTheDocument();

    // Toggle to Award / Honor sub-type
    fireEvent.click(screen.getByRole('button', { name: /Award \/ Honor/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Awarding Organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Partner Category/i)).not.toBeInTheDocument();
  });

  it('opens CmsDeleteDialog on Delete and only calls deleteContent after confirming Delete Permanently', async () => {
    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open House Banner')).toBeInTheDocument();
    });

    const actionsTrigger = screen.getByRole('button', {
      name: /Actions for Spring Open House Banner/i,
    });
    fireEvent.keyDown(actionsTrigger, { key: 'ArrowDown' });

    const deleteMenuItem = await screen.findByRole('menuitem', { name: /Delete/i });
    fireEvent.click(deleteMenuItem);

    // Confirmation dialog appears and deleteContent has NOT been called yet
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/Delete “Spring Open House Banner”\?/i)).toBeInTheDocument();
    expect(cmsService.deleteContent).not.toHaveBeenCalled();

    // Confirm permanent deletion
    fireEvent.click(within(dialog).getByRole('button', { name: /Delete Permanently/i }));

    await waitFor(() => {
      expect(cmsService.deleteContent).toHaveBeenCalledWith('b1');
    });
  });

  it('submits clean payloads without media_type on non-award items and keeps drawer open on save error', async () => {
    cmsService.createContent.mockRejectedValueOnce(new Error('Network error'));

    render(<AdminCmsPage />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open House Banner')).toBeInTheDocument();
    });

    activateTab(/Staff Directory/i);
    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Staff Member/i }));

    fireEvent.change(await screen.findByLabelText(/Full Name/i), {
      target: { value: 'Juan Dela Cruz' },
    });
    fireEvent.change(screen.getByLabelText(/Job Role/i), {
      target: { value: 'Branch Manager' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Content/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Drawer stays open and retains typed values after save failure
    expect(screen.getByDisplayValue('Juan Dela Cruz')).toBeInTheDocument();

    // Verify submitted payload omitted slug and media_type
    expect(cmsService.createContent).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type: 'staff',
        title: 'Juan Dela Cruz',
        payload: {
          role: 'Branch Manager',
          department: 'Business Development & Growth',
        },
        status: 'DRAFT',
        sort_order: 0,
      })
    );
    const submittedArg = cmsService.createContent.mock.calls[0][0];
    expect(submittedArg).not.toHaveProperty('slug');
    expect(submittedArg.payload).not.toHaveProperty('media_type');
  });
});
