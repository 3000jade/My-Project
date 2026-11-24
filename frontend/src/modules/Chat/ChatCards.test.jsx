import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      followUpSuggestions: [],
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
      followUpSuggestions: [],
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
      followUpSuggestions: [],
    });
  });

  it('sanitizes followUpSuggestions by trimming strings and filtering invalid or empty entries', async () => {
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Here are your Taguig condos.',
        followUpSuggestions: ['  Compare these two  ', '', '   ', null, 42, 'Check nearby schools'],
      },
    });

    const result = await chatService.sendMessage([{ role: 'user', content: 'Taguig condos' }]);

    expect(result.followUpSuggestions).toEqual(['Compare these two', 'Check nearby schools']);
  });
});

function createSseStreamResponse(chunks, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  let index = 0;

  return {
    ok,
    status,
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) {
              return { done: true, value: undefined };
            }
            const next = chunks[index++];
            if (next instanceof Error) {
              throw next;
            }
            return { done: false, value: encoder.encode(next) };
          },
          releaseLock: vi.fn(),
          cancel: vi.fn(),
        };
      },
    },
  };
}

describe('chatService.streamMessage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete apiClient.defaults;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
    delete apiClient.defaults;
  });

  it('parses SSE frames across partial chunks and CRLF boundaries, forwarding auth token and pageContext', async () => {
    localStorage.setItem('cp_auth_token', 'jwt-token-123');
    apiClient.defaults = { baseURL: 'http://localhost:5000/api/' };

    const chunks = [
      'event: status\r\ndata: {"phase":"searching","label":"Searching listings..."}\r',
      '\n\r\nevent: delta\ndata: {"text":"Here is "}\n\n',
      'event: delta\ndata: {"text":"Serendra."}\n\n',
      'event: result\ndata: {"message":"Here is Serendra.","cards":[],"followUpSuggestions":["  Book a tour  ",""]}\n\n',
      'event: done\ndata: {}\n\n',
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce(createSseStreamResponse(chunks));

    const onStatus = vi.fn();
    const onDelta = vi.fn();
    const onResult = vi.fn();

    const messages = [{ role: 'user', content: 'Show me Serendra' }];
    const pageContext = { route: '/properties/prop-101', propertyId: 'prop-101' };

    const result = await chatService.streamMessage(messages, pageContext, {
      onStatus,
      onDelta,
      onResult,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/chat/stream',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: 'Bearer jwt-token-123',
        },
        body: JSON.stringify({ messages, pageContext }),
      })
    );

    expect(onStatus).toHaveBeenCalledWith({ phase: 'searching', label: 'Searching listings...' });
    expect(onDelta).toHaveBeenNthCalledWith(1, 'Here is ');
    expect(onDelta).toHaveBeenNthCalledWith(2, 'Serendra.');
    expect(result).toEqual({
      message: 'Here is Serendra.',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: ['Book a tour'],
    });
    expect(onResult).toHaveBeenCalledWith(result);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('falls back once to sendMessage and calls onResult when fetch fails before any delta or result', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Fallback reply',
        followUpSuggestions: ['Ask an agent'],
      },
    });

    const onResult = vi.fn();
    const messages = [{ role: 'user', content: 'Hello' }];

    const result = await chatService.streamMessage(messages, undefined, { onResult });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/chat/stream',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
      })
    );
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith('/chat', { messages }, { timeout: 25000 });
    expect(result).toEqual({
      message: 'Fallback reply',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: ['Ask an agent'],
    });
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it('falls back once to sendMessage when stream returns non-OK HTTP status', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(createSseStreamResponse([], { ok: false, status: 502 }));
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: 'Recovered via POST /chat',
    });

    const onResult = vi.fn();
    const result = await chatService.streamMessage(
      [{ role: 'user', content: 'Condos in Makati' }],
      undefined,
      { onResult }
    );

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Recovered via POST /chat');
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it('falls back once to sendMessage when stream read fails before any delta or result arrives', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        createSseStreamResponse([
          'event: status\ndata: {"label":"Checking..."}\n\n',
          new Error('Stream disconnected'),
        ])
      );
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: { message: 'Recovered after early drop' },
    });

    const onResult = vi.fn();
    const result = await chatService.streamMessage([{ role: 'user', content: 'Hi' }], undefined, {
      onResult,
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Recovered after early drop');
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it('re-throws AbortError immediately and NEVER triggers sendMessage fallback', async () => {
    const controller = new AbortController();
    const abortErr = new Error('Aborted by user');
    abortErr.name = 'AbortError';

    globalThis.fetch = vi.fn().mockImplementationOnce(() => {
      controller.abort();
      return Promise.reject(abortErr);
    });

    const onResult = vi.fn();

    await expect(
      chatService.streamMessage([{ role: 'user', content: 'Stop me' }], undefined, {
        signal: controller.signal,
        onResult,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('throws when an SSE error event arrives without falling back to sendMessage', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      createSseStreamResponse([
        'event: error\ndata: {"error":"Assistant temporarily unavailable"}\n\n',
        'event: done\ndata: {}\n\n',
      ])
    );

    await expect(
      chatService.streamMessage([{ role: 'user', content: 'Trigger error' }])
    ).rejects.toThrow('Assistant temporarily unavailable');

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('returns normalized accumulated delta text when stream completes without a result event', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      createSseStreamResponse([
        'event: delta\ndata: {"text":"Hello "}\n\n',
        'event: delta\ndata: {"text":"from BGC!"}\n\n',
        'event: done\ndata: {}\n\n',
      ])
    );

    const onDelta = vi.fn();
    const result = await chatService.streamMessage([{ role: 'user', content: 'Hi' }], undefined, {
      onDelta,
    });

    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      message: 'Hello from BGC!',
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: [],
    });
    expect(apiClient.post).not.toHaveBeenCalled();
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

  it('omits the compare toggle button when onToggleCompare is not provided', () => {
    render(<ChatPropertyCard property={sampleProperty} />);

    expect(screen.queryByRole('button', { name: /compare/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /selected/i })).toBeNull();
  });

  it('renders + Compare toggle button when onToggleCompare is provided and calls it on click', () => {
    const onToggleCompare = vi.fn();

    render(
      <ChatPropertyCard
        property={sampleProperty}
        onToggleCompare={onToggleCompare}
      />
    );

    const compareBtn = screen.getByRole('button', { name: /\+ compare/i });
    expect(compareBtn).toHaveAttribute('aria-pressed', 'false');
    expect(compareBtn).not.toBeDisabled();

    fireEvent.click(compareBtn);
    expect(onToggleCompare).toHaveBeenCalledTimes(1);
    expect(onToggleCompare).toHaveBeenCalledWith(sampleProperty);
  });

  it('renders Selected state when isSelectedForCompare is true and keeps button enabled even when compareDisabled is true', () => {
    const onToggleCompare = vi.fn();

    render(
      <ChatPropertyCard
        property={sampleProperty}
        isSelectedForCompare
        compareDisabled
        onToggleCompare={onToggleCompare}
      />
    );

    const selectedBtn = screen.getByRole('button', { name: /selected/i });
    expect(selectedBtn).toHaveAttribute('aria-pressed', 'true');
    expect(selectedBtn).not.toBeDisabled();
    expect(selectedBtn.className).toContain('bg-[#0F766E]');

    fireEvent.click(selectedBtn);
    expect(onToggleCompare).toHaveBeenCalledWith(sampleProperty);
  });

  it('disables + Compare button when compareDisabled is true and property is not selected', () => {
    const onToggleCompare = vi.fn();

    render(
      <ChatPropertyCard
        property={sampleProperty}
        isSelectedForCompare={false}
        compareDisabled
        onToggleCompare={onToggleCompare}
      />
    );

    const compareBtn = screen.getByRole('button', { name: /\+ compare/i });
    expect(compareBtn).toHaveAttribute('aria-pressed', 'false');
    expect(compareBtn).toBeDisabled();

    fireEvent.click(compareBtn);
    expect(onToggleCompare).not.toHaveBeenCalled();
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
