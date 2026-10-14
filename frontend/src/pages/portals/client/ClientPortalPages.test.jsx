import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClientDashboard from './ClientDashboard';
import ClientSavedProperties from './ClientSavedProperties';
import ClientInquiries from './ClientInquiries';
import ClientProfile from './ClientProfile';

// Mock clientUserService
vi.mock('../../../services/clientUserService', () => ({
  clientUserService: {
    getClientProfile: vi.fn().resolveValue?.() || vi.fn().mockResolvedValue({
      id: 'client-001',
      name: 'Sophia Isabella Laurel',
      firstName: 'Sophia',
      lastName: 'Laurel',
      email: 'client@pt.com',
      phone: '+63 917 555 8899',
      role: 'Registered Client',
      preferredLocation: 'Bonifacio Global City, Taguig',
      investmentBudget: '₱50,000,000 - ₱120,000,000',
    }),
    getSavedProperties: vi.fn().mockResolvedValue([
      {
        id: 'prop-1',
        title: 'Modern BGC Sky Penthouse',
        name: 'Modern BGC Sky Penthouse',
        price: '₱65,000,000',
        location: 'Bonifacio Global City, Taguig',
        area: '180 sqm',
        bedrooms: 3,
        bathrooms: 3,
        propertyType: 'Condominium',
      },
    ]),
    getClientInquiries: vi.fn().mockResolvedValue([
      {
        id: 'inq-101',
        property_title: 'Ayala Alabang Estate',
        property_price: '₱185,000,000',
        status: 'NEW',
        last_message: 'Requesting Saturday site inspection.',
        created_at: '2026-10-10 14:00',
        agent_name: 'Elena Rossi',
        messages: [
          {
            id: 'm1',
            sender: 'client',
            content: 'Requesting Saturday site inspection.',
          },
        ],
      },
    ]),
    removeSavedProperty: vi.fn().mockResolvedValue([]),
    saveProperty: vi.fn().mockResolvedValue([]),
    updateClientProfile: vi.fn().mockImplementation((data) => Promise.resolve(data)),
    changePassword: vi.fn().mockResolvedValue({ success: true }),
    addInquiryMessage: vi.fn().mockResolvedValue({
      id: 'inq-101',
      property_title: 'Ayala Alabang Estate',
      messages: [],
    }),
  },
}));

describe('Client User Management Module Pages', () => {
  it('renders ClientDashboard with overview stats and greetings', async () => {
    render(
      <BrowserRouter>
        <ClientDashboard />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Saved Properties/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Active Inquiries/i).length).toBeGreaterThan(0);
  });

  it('renders ClientSavedProperties with search bar and action buttons', async () => {
    render(
      <BrowserRouter>
        <ClientSavedProperties />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Search saved properties/i)).toBeDefined();
  });

  it('renders ClientInquiries with inquiry status filters', async () => {
    render(
      <BrowserRouter>
        <ClientInquiries />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /^ALL$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^NEW$/i })).toBeDefined();
  });

  it('renders ClientProfile with personal information details', async () => {
    render(
      <BrowserRouter>
        <ClientProfile />
      </BrowserRouter>
    );

    expect(screen.getByText(/Change Passphrase/i)).toBeDefined();
    expect(screen.getByText(/Communication Settings/i)).toBeDefined();
  });
});
