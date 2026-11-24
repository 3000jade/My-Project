import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { chatService } from '../../services/chatService';
import ChatPropertyCard from './ChatPropertyCard';
import ChatComparisonCard from './ChatComparisonCard';
import ChatNearbyCard from './ChatNearbyCard';

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

describe('chatService.sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards pageContext when route or propertyId is present and normalizes object responses', async () => {
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Here is a matching home in Taguig.',
        cards: [sampleProperty],
      },
    });

    const messages = [{ role: 'user', content: 'Tell me about this condo' }];
    const pageContext = { route: '/properties/prop-101', propertyId: 'prop-101' };

    const result = await chatService.sendMessage(messages, pageContext);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/chat',
      {
        messages,
        pageContext,
      },
      { timeout: 25000 }
    );
    expect(result).toEqual({
      message: 'Here is a matching home in Taguig.',
      cards: [sampleProperty],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
    });
  });

  it('omits pageContext when neither route nor propertyId is provided', async () => {
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Welcome to Human Shelter Realty.',
        cards: [],
        comparison: null,
        nearby: null,
        handoffDraft: { summary: 'General inquiry' },
      },
    });

    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await chatService.sendMessage(messages, {});

    expect(apiClient.post).toHaveBeenCalledWith('/chat', { messages }, { timeout: 25000 });
    expect(result).toEqual({
      message: 'Welcome to Human Shelter Realty.',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: { summary: 'General inquiry' },
      suggestHandoff: false,
      handoffReason: null,
    });
  });

  it('normalizes legacy plain string responses for backwards compatibility', async () => {
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: 'Legacy text reply',
    });

    const result = await chatService.sendMessage([{ role: 'user', content: 'Hi' }]);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/chat',
      {
        messages: [{ role: 'user', content: 'Hi' }],
      },
      { timeout: 25000 }
    );
    expect(result).toEqual({
      message: 'Legacy text reply',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
    });
  });
});

describe('ChatPropertyCard', () => {
  it('renders property details, View Home link, and coral Ask Agent button with dark ink', () => {
    const onAskAgent = vi.fn();
    const onNavigate = vi.fn();

    render(
      <ChatPropertyCard
        property={sampleProperty}
        onAskAgent={onAskAgent}
        onNavigate={onNavigate}
      />
    );

    const img = screen.getByRole('img', { name: /serendra two-bedroom suite/i });
    expect(img).toHaveAttribute('src', 'https://example.com/serendra.jpg');

    expect(screen.getByText('Serendra Two-Bedroom Suite')).toBeInTheDocument();
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByText('PHP 24,500,000')).toBeInTheDocument();
    expect(screen.getByText('Taguig')).toBeInTheDocument();
    expect(screen.getByText(/2 Beds/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Baths/i)).toBeInTheDocument();

    const viewHomeLink = screen.getByRole('link', { name: /view home/i });
    expect(viewHomeLink).toHaveAttribute('href', '/properties/prop-101');
    fireEvent.click(viewHomeLink);
    expect(onNavigate).toHaveBeenCalledWith(sampleProperty);

    const askBtn = screen.getByRole('button', { name: /ask agent/i });
    expect(askBtn.className).toContain('bg-[#FF6B6B]');
    expect(askBtn.className).toContain('text-[#1E293B]');
    expect(askBtn.className).not.toContain('text-white');

    fireEvent.click(askBtn);
    expect(onAskAgent).toHaveBeenCalledWith(sampleProperty);
  });

  it('renders No photo fallback and omits null bedrooms/bathrooms', () => {
    const lotProperty = {
      ...sampleProperty,
      id: 'prop-102',
      title: 'Ayala Westgrove Corner Lot',
      mainImage: null,
      bedrooms: null,
      bathrooms: null,
    };

    render(<ChatPropertyCard property={lotProperty} />);

    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByText(/bed/i)).toBeNull();
    expect(screen.queryByText(/bath/i)).toBeNull();
  });
});

describe('ChatComparisonCard', () => {
  it('returns null when fewer than 2 properties are provided', () => {
    const { container } = render(
      <ChatComparisonCard
        comparison={{
          properties: [{ id: 'prop-1', title: 'Single Condo', city: 'Makati', formattedPrice: 'PHP 12M' }],
          rows: [{ label: 'Price', values: ['PHP 12M'] }],
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders Side-by-Side Comparison table and Ask about action buttons', () => {
    const onAskAgent = vi.fn();
    const propA = { id: 'prop-1', title: 'The Rise Makati', city: 'Makati', formattedPrice: 'PHP 10,000,000' };
    const propB = { id: 'prop-2', title: 'One Uptown BGC', city: 'Taguig', formattedPrice: 'PHP 15,000,000' };

    render(
      <ChatComparisonCard
        comparison={{
          properties: [propA, propB],
          rows: [
            { label: 'Price', values: ['PHP 10,000,000', 'PHP 15,000,000'] },
            { label: 'Bedrooms', values: ['1', '2'] },
          ],
        }}
        onAskAgent={onAskAgent}
      />
    );

    expect(screen.getByText('Side-by-Side Comparison')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'The Rise Makati' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'One Uptown BGC' })).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('PHP 10,000,000')).toBeInTheDocument();
    expect(screen.getByText('PHP 15,000,000')).toBeInTheDocument();
    expect(screen.getByText('Bedrooms')).toBeInTheDocument();

    const askPropB = screen.getByRole('button', { name: /ask about one uptown bgc/i });
    expect(askPropB.className).toContain('max-w-full');
    expect(askPropB.querySelector('span.truncate')).not.toBeNull();
    fireEvent.click(askPropB);
    expect(onAskAgent).toHaveBeenCalledWith(propB);
  });
});

describe('ChatNearbyCard', () => {
  it('returns null when nearby is null or undefined', () => {
    const { container } = render(<ChatNearbyCard nearby={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders unavailable fallback notice when nearby.unavailable is true', () => {
    render(
      <ChatNearbyCard
        nearby={{
          propertyId: 'prop-101',
          propertyTitle: 'Serendra Two-Bedroom Suite',
          landmarks: [],
          commutes: [],
          unavailable: true,
        }}
      />
    );

    expect(screen.getByText('Nearby Serendra Two-Bedroom Suite')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Live distance details are temporarily unavailable right now. Connect with a licensed agent for exact travel times.'
      )
    ).toBeInTheDocument();
  });

  it('renders landmarks and Estimated Drive Times commutes when available', () => {
    render(
      <ChatNearbyCard
        nearby={{
          propertyId: 'prop-101',
          propertyTitle: 'Serendra Two-Bedroom Suite',
          landmarks: [
            { category: 'school', label: 'British School Manila' },
            { category: 'mall', label: 'Bonifacio High Street' },
            { category: 'hospital', label: "St. Luke's Medical Center BGC" },
            { category: 'transit', label: 'BGC Bus Stop' },
            { category: 'highway', label: 'C-5 Road' },
          ],
          commutes: [
            { destinationName: 'Makati CBD', distanceText: '4.2 km', durationText: '18 mins' },
            { destinationName: 'NAIA Terminal 3', distanceText: '8.5 km', durationText: '25 mins' },
          ],
          unavailable: false,
        }}
      />
    );

    expect(screen.getByText('Nearby Serendra Two-Bedroom Suite')).toBeInTheDocument();
    expect(screen.getByText('School')).toBeInTheDocument();
    expect(screen.getByText('British School Manila')).toBeInTheDocument();
    expect(screen.getByText('Mall')).toBeInTheDocument();
    expect(screen.getByText('Bonifacio High Street')).toBeInTheDocument();
    expect(screen.getByText('Hospital')).toBeInTheDocument();
    expect(screen.getByText("St. Luke's Medical Center BGC")).toBeInTheDocument();
    expect(screen.getByText('Transit')).toBeInTheDocument();
    expect(screen.getByText('BGC Bus Stop')).toBeInTheDocument();
    expect(screen.getByText('Highway')).toBeInTheDocument();
    expect(screen.getByText('C-5 Road')).toBeInTheDocument();

    expect(screen.getByText('Estimated Drive Times')).toBeInTheDocument();
    expect(screen.getByText('Makati CBD')).toBeInTheDocument();
    expect(screen.getByText(/18 mins/)).toBeInTheDocument();
    expect(screen.getByText(/4.2 km/)).toBeInTheDocument();
    expect(screen.getByText('NAIA Terminal 3')).toBeInTheDocument();
  });
});
