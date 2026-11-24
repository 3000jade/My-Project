import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import cmsService from '@/services/cmsService';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/services/cmsService', () => ({
  default: {
    getPublicContents: vi.fn(),
    getPublicContentBySlug: vi.fn(),
    updateContent: vi.fn(),
    createContent: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AboutPage CMS staff directory integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    cmsService.getPublicContentBySlug.mockResolvedValue(null);
  });

  it('renders published CMS staff grouped by payload.department with role and replaces mock staff', async () => {
    cmsService.getPublicContents.mockImplementation((type) => {
      if (type === 'staff') {
        return Promise.resolve([
          {
            id: 'st-1',
            title: 'Clara Mendoza',
            media_url: 'https://cdn.example.com/clara.jpg',
            payload: {
              department: 'Executive Advisory',
              role: 'Managing Director',
            },
          },
          {
            id: 'st-2',
            title: 'Mateo Reyes',
            media_url: '',
            payload: {
              department: 'Executive Advisory',
              role: 'Senior Broker',
            },
          },
          {
            id: 'st-3',
            title: 'Lia Santos',
            media_url: '',
            payload: {
              department: '',
              role: 'Client Relations',
            },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('staff');
    });

    expect(await screen.findByText('Executive Advisory')).toBeInTheDocument();
    expect(screen.getByText('2 Members')).toBeInTheDocument();
    expect(screen.getByText('Clara Mendoza')).toBeInTheDocument();
    expect(screen.getByText('Managing Director')).toBeInTheDocument();
    expect(screen.getByText('Mateo Reyes')).toBeInTheDocument();
    expect(screen.getByText('Senior Broker')).toBeInTheDocument();

    expect(screen.getByText('Our Team')).toBeInTheDocument();
    expect(screen.getByText('1 Member')).toBeInTheDocument();
    expect(screen.getByText('Lia Santos')).toBeInTheDocument();
    expect(screen.getByText('Client Relations')).toBeInTheDocument();

    // Built-in mock staff should not appear when CMS staff are published
    expect(screen.queryByText('Gina Punzalan')).not.toBeInTheDocument();
  });

  it('falls back to built-in mockAbout.js staff when CMS returns empty or rejects', async () => {
    cmsService.getPublicContents.mockResolvedValueOnce([]);

    const { unmount } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('staff');
    });

    expect(screen.getByText('Business Development & Growth')).toBeInTheDocument();
    expect(screen.getByText('Gina Punzalan')).toBeInTheDocument();

    unmount();

    cmsService.getPublicContents.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText('Gina Punzalan')).toBeInTheDocument();
  });
});

describe('ContactPage CMS channels and office branches integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    window.scrollTo = vi.fn();
  });

  it('renders published contact-us channels, safe external URLs, and published office branch cards', async () => {
    cmsService.getPublicContentBySlug.mockImplementation((type, slug) => {
      if (type === 'page' && slug === 'contact-us') {
        return Promise.resolve({
          id: 'page-contact',
          slug: 'contact-us',
          title: 'Connect with Private Advisory',
          summary: 'Speak directly with our senior property specialists in Metro Manila.',
          payload: {
            whatsapp_url: 'https://wa.me/639181234567',
            calendly_url: 'https://calendly.com/humanshelter/advisory',
            contact_email: 'advisory@humanshelter.ph',
          },
        });
      }
      return Promise.resolve(null);
    });

    cmsService.getPublicContents.mockImplementation((type) => {
      if (type === 'office') {
        return Promise.resolve([
          {
            id: 'off-1',
            title: 'BGC Flagship Office',
            media_url: 'https://cdn.example.com/bgc-office.jpg',
            payload: {
              address: '30th Street cor. 9th Ave, Bonifacio Global City, Taguig',
              phone: '+63 2 8888 1234',
              hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
              map_url: 'https://maps.google.com/?q=BGC+Taguig',
            },
          },
          {
            id: 'off-2',
            title: 'Alabang South Hub',
            media_url: '',
            payload: {
              address: 'Filinvest City, Alabang, Muntinlupa',
              phone: '+63 2 8777 5678',
              hours: 'Mon–Fri, 9:00 AM – 5:00 PM',
              map_url: 'javascript:alert(1)',
            },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContentBySlug).toHaveBeenCalledWith('page', 'contact-us');
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('office');
    });

    expect(await screen.findByText('Connect with Private Advisory')).toBeInTheDocument();
    expect(
      screen.getByText('Speak directly with our senior property specialists in Metro Manila.')
    ).toBeInTheDocument();
    expect(screen.getByText('advisory@humanshelter.ph')).toBeInTheDocument();

    const whatsappLink = screen.getByRole('link', { name: /Chat on WhatsApp/i });
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/639181234567');
    expect(whatsappLink).toHaveAttribute('target', '_blank');
    expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer');

    const calendlyLink = screen.getByRole('link', { name: /Book a Coffee Chat/i });
    expect(calendlyLink).toHaveAttribute('href', 'https://calendly.com/humanshelter/advisory');
    expect(calendlyLink).toHaveAttribute('target', '_blank');
    expect(calendlyLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByText('Our Office Branches')).toBeInTheDocument();
    expect(screen.getByText('BGC Flagship Office')).toBeInTheDocument();
    expect(
      screen.getByText('30th Street cor. 9th Ave, Bonifacio Global City, Taguig')
    ).toBeInTheDocument();
    expect(screen.getByText('+63 2 8888 1234')).toBeInTheDocument();
    expect(screen.getByText('Mon–Sat, 9:00 AM – 6:00 PM')).toBeInTheDocument();

    const mapLinks = screen.getAllByRole('link', { name: /View on Map/i });
    expect(mapLinks).toHaveLength(1);
    expect(mapLinks[0]).toHaveAttribute('href', 'https://maps.google.com/?q=BGC+Taguig');
    expect(mapLinks[0]).toHaveAttribute('target', '_blank');
    expect(mapLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByText('Alabang South Hub')).toBeInTheDocument();
    expect(screen.getByText('Filinvest City, Alabang, Muntinlupa')).toBeInTheDocument();
  });

  it('falls back to default Contact copy and safe URLs when CMS returns null/empty or unsafe URLs', async () => {
    cmsService.getPublicContentBySlug.mockResolvedValueOnce({
      id: 'page-unsafe',
      slug: 'contact-us',
      title: '',
      summary: '',
      payload: {
        whatsapp_url: 'javascript:alert(1)',
        calendly_url: 'data:text/html,evil',
      },
    });
    cmsService.getPublicContents.mockResolvedValueOnce([]);

    const { unmount } = render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContentBySlug).toHaveBeenCalledWith('page', 'contact-us');
      expect(cmsService.getPublicContents).toHaveBeenCalledWith('office');
    });

    expect(screen.getByText('Ready to start the conversation?')).toBeInTheDocument();
    expect(
      screen.getByText(/Whether you're ready to buy, thinking of selling/i)
    ).toBeInTheDocument();
    expect(screen.getByText('hello@humanshelter.ph')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chat on WhatsApp/i })).toHaveAttribute(
      'href',
      'https://wa.me/639170000000'
    );
    expect(screen.getByRole('link', { name: /Book a Coffee Chat/i })).toHaveAttribute(
      'href',
      'https://calendly.com'
    );
    expect(screen.queryByText('Our Office Branches')).not.toBeInTheDocument();

    unmount();

    cmsService.getPublicContentBySlug.mockRejectedValueOnce(new Error('Offline'));
    cmsService.getPublicContents.mockRejectedValueOnce(new Error('Offline'));

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(cmsService.getPublicContents).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText('Ready to start the conversation?')).toBeInTheDocument();
    expect(screen.queryByText('Our Office Branches')).not.toBeInTheDocument();
  });

  it('supports admin inline live editing of ContactPage headline', async () => {
    useAuth.mockReturnValue({ user: { id: 'admin-1', role: 'admin' } });
    cmsService.getPublicContentBySlug.mockResolvedValueOnce({
      id: 'page-contact-1',
      slug: 'contact-us',
      title: 'Initial Contact Title',
      summary: 'Initial summary copy.',
      payload: {},
    });
    cmsService.getPublicContents.mockResolvedValueOnce([]);
    cmsService.updateContent.mockResolvedValueOnce({
      id: 'page-contact-1',
      slug: 'contact-us',
      title: 'Updated Contact Title',
      summary: 'Initial summary copy.',
      payload: {},
    });

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Initial Contact Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit Page/i }));
    const editButtons = screen.getAllByRole('button', { name: /Edit value/i });
    fireEvent.click(editButtons[0]);

    const input = screen.getByDisplayValue('Initial Contact Title');
    fireEvent.change(input, { target: { value: 'Updated Contact Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(cmsService.updateContent).toHaveBeenCalledWith('page-contact-1', {
        title: 'Updated Contact Title',
      });
    });
  });
});
