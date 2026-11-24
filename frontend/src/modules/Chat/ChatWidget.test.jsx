import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import { chatService } from '../../services/chatService';
import { propertyService } from '../../services/propertyService';
import apiClient from '../../services/apiClient';

vi.mock('../../services/chatService', () => ({
  chatService: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertyById: vi.fn(),
  },
}));

vi.mock('../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

const sampleProperty = {
  id: 'prop-101',
  title: 'Serendra Two-Bedroom Suite',
  city: 'Taguig',
  price: 24500000,
  formattedPrice: 'PHP 24,500,000',
  propertyType: 'Condominium',
  transactionType: 'For Sale',
  bedrooms: 2,
  bathrooms: 2,
  floorArea: 98,
  lotArea: null,
  parking: 1,
  mainImage: 'https://example.com/serendra.jpg',
  status: 'published',
};

const secondProperty = {
  id: 'prop-102',
  title: 'One Uptown Residence',
  city: 'Taguig',
  price: 18000000,
  formattedPrice: 'PHP 18,000,000',
  propertyType: 'Condominium',
  transactionType: 'For Sale',
  bedrooms: 1,
  bathrooms: 1,
  floorArea: 62,
  lotArea: null,
  parking: 1,
  mainImage: null,
  status: 'published',
};

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders the RA 9646 disclosure, lenis scroll guard, and general quick actions outside a Router', () => {
    const { container } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    expect(screen.getByText('AI Property Concierge')).toBeInTheDocument();
    expect(screen.getByText(/Automated Assistant · RA 9646/i)).toBeInTheDocument();
    expect(screen.getByText(/not a PRC-licensed broker/i)).toBeInTheDocument();
    expect(container.querySelector('[data-lenis-prevent="true"]')).not.toBeNull();

    expect(screen.getByRole('button', { name: /search by budget/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /featured homes/i })).toBeInTheDocument();

    const connectBtn = screen.getByRole('button', { name: /connect to agent/i });
    expect(connectBtn.className).toContain('bg-[#FF6B6B]');
    expect(connectBtn.className).toContain('text-[#1E293B]');
    expect(connectBtn.className).not.toContain('text-white');
  });

  it('detects /properties/:id routes, shows Currently viewing banner, forwards pageContext, and renders nearby card', async () => {
    propertyService.getPropertyById.mockResolvedValueOnce({
      id: 'prop-42',
      title: 'Makati Sky Penthouse',
      price: 32000000,
    });

    chatService.sendMessage.mockResolvedValueOnce({
      message: 'Here are the landmarks near Makati Sky Penthouse.',
      cards: [],
      comparison: null,
      nearby: {
        propertyId: 'prop-42',
        propertyTitle: 'Makati Sky Penthouse',
        landmarks: [{ category: 'mall', label: 'Greenbelt 5' }],
        commutes: [{ destinationName: 'BGC', durationText: '15 mins', distanceText: '4.1 km' }],
        unavailable: false,
      },
      handoffDraft: null,
    });

    render(
      <MemoryRouter initialEntries={['/properties/prop-42']}>
        <ChatWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    await waitFor(() => {
      expect(propertyService.getPropertyById).toHaveBeenCalledWith('prop-42');
      expect(screen.getByText(/Currently viewing: Makati Sky Penthouse/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /compare similar/i })).toBeInTheDocument();
    const askAgentQuickBtn = screen.getByRole('button', { name: /^ask agent$/i });
    expect(askAgentQuickBtn.className).toContain('bg-[#FF6B6B]');
    expect(askAgentQuickBtn.className).toContain('text-[#1E293B]');
    expect(askAgentQuickBtn.className).not.toContain('text-white');

    fireEvent.click(screen.getByRole('button', { name: /what's nearby\?/i }));

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: "What's nearby?" }),
        ]),
        { route: '/properties/prop-42', propertyId: 'prop-42' }
      );
      expect(screen.getByText('Nearby Makati Sky Penthouse')).toBeInTheDocument();
      expect(screen.getByText('Greenbelt 5')).toBeInTheDocument();
      expect(screen.getByText('BGC')).toBeInTheDocument();
      expect(screen.getByText(/15 mins/)).toBeInTheDocument();
    });
  });

  it('renders HTML/script payloads from AI responses as harmless plain text', async () => {
    chatService.sendMessage.mockResolvedValueOnce({
      message: '<script>window.__xss=1</script>Hello buyer',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('<script>window.__xss=1</script>Hello buyer')).toBeInTheDocument();
    });
    expect(document.querySelector('script')).toBeNull();
  });

  it('renders property and comparison cards and routes card-triggered handoff with attached property, summary, and RA 10173 consent', async () => {
    chatService.sendMessage.mockResolvedValueOnce({
      message: 'Here are matching condos in Taguig.',
      cards: [sampleProperty],
      comparison: {
        properties: [sampleProperty, secondProperty],
        rows: [{ label: 'Price', values: ['PHP 24,500,000', 'PHP 18,000,000'] }],
      },
      nearby: null,
      handoffDraft: {
        summary: 'Buyer wants a 2BR condo in BGC under 25M.',
      },
    });
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'INQ-9001' } } });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: '2BR condo in BGC' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Here are matching condos in Taguig.')).toBeInTheDocument();
      expect(screen.getByText('Side-by-Side Comparison')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^ask agent$/i }));

    expect(screen.getByText('Property: Serendra Two-Bedroom Suite')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /request licensed agent/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'maria@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));

    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/inquiries',
        expect.objectContaining({
          name: 'Maria Santos',
          email: 'maria@example.com',
          propertyId: 'prop-101',
          propertyTitle: 'Serendra Two-Bedroom Suite',
          propertyPrice: 24500000,
          source: 'ai_chatbot',
          preferredReplyChannel: 'chat',
          consentAccepted: true,
          message: expect.stringContaining('Buyer wants a 2BR condo in BGC under 25M.'),
        })
      );
      expect(screen.getByText(/INQ-9001/)).toBeInTheDocument();
    });
  });

  it('keeps ChatHandoffForm reachable when chatService.sendMessage fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    chatService.sendMessage.mockRejectedValueOnce(new Error('Upstream timeout'));
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'INQ-FALLBACK' } } });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Help me find a house' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const fallbackMsg = screen.getByText(/temporarily unavailable/i);
      expect(fallbackMsg).toBeInTheDocument();
      expect(fallbackMsg).toHaveTextContent(/Connect to Agent/i);
    });

    fireEvent.click(screen.getByRole('button', { name: /connect to agent/i }));

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jose Rizal' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jose@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/inquiries',
        expect.objectContaining({
          name: 'Jose Rizal',
          email: 'jose@example.com',
          source: 'ai_chatbot',
          consentAccepted: true,
        })
      );
      expect(screen.getByText(/INQ-FALLBACK/)).toBeInTheDocument();
    });

    errorSpy.mockRestore();
  });
});
