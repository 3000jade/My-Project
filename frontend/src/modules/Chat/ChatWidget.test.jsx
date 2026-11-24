import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import { chatService } from '../../services/chatService';
import { propertyService } from '../../services/propertyService';
import apiClient from '../../services/apiClient';

vi.mock('../../services/chatService', () => ({
  chatService: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
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

function mockStreamSuccess(payload, { statusLabel = null, chunks = [] } = {}) {
  return async (_messages, _pageContext, { onStatus, onDelta, onResult } = {}) => {
    if (statusLabel) {
      onStatus?.({ step: 'tool', label: statusLabel });
    }
    for (const chunk of chunks) {
      onDelta?.(chunk);
    }
    const normalized = {
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: [],
      ...payload,
    };
    onResult?.(normalized);
    return normalized;
  };
}

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders the Crisp White header, RA 9646 badge, ChatWelcomeView, lenis guard, and calm footer outside a Router', () => {
    const { container } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    expect(screen.getByRole('heading', { name: 'AI Property Concierge' })).toBeInTheDocument();
    expect(screen.getByText('RA 9646')).toBeInTheDocument();
    expect(screen.getByText(/How can I help you find your next home\?/i)).toBeInTheDocument();
    expect(screen.getByText(/not a PRC-licensed broker/i)).toBeInTheDocument();
    expect(container.querySelector('[data-lenis-prevent="true"]')).not.toBeNull();

    // Header actions: New chat, Expand chat, Close chat
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close chat/i })).toBeInTheDocument();

    // General welcome prompt tiles
    expect(screen.getByRole('button', { name: /homes under ₱20m/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /featured homes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /condos in makati or bgc/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how buying works/i })).toBeInTheDocument();

    // Calm footer handoff link
    expect(screen.getByRole('button', { name: /talk to a licensed agent/i })).toBeInTheDocument();
  });

  it('expands and collapses the desktop side panel and resets to ChatWelcomeView on New chat', async () => {
    chatService.streamMessage.mockImplementationOnce(
      mockStreamSuccess({
        message: 'Here are featured published homes.',
        followUpSuggestions: ['Filter under ₱15M'],
      })
    );

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const panel = screen.getByTestId('chat-widget-panel');
    expect(panel.className).toContain('fixed');
    expect(panel.className).toContain('inset-0');
    expect(panel.className).toContain('sm:w-96');
    expect(panel.className).not.toContain('sm:w-xl');

    fireEvent.click(screen.getByRole('button', { name: /expand chat/i }));
    expect(panel.className).toContain('sm:fixed');
    expect(panel.className).toContain('sm:w-xl');
    expect(screen.getByRole('button', { name: /collapse chat/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /collapse chat/i }));
    expect(panel.className).toContain('sm:static');
    expect(panel.className).toContain('sm:w-96');

    // Send a prompt from ChatWelcomeView
    fireEvent.click(screen.getByRole('button', { name: /featured homes/i }));

    await waitFor(() => {
      expect(screen.getByText('Here are featured published homes.')).toBeInTheDocument();
    });
    expect(screen.queryByText(/How can I help you find your next home\?/i)).not.toBeInTheDocument();

    // Click New chat -> returns cleanly to ChatWelcomeView
    fireEvent.click(screen.getByRole('button', { name: /new chat/i }));
    expect(screen.getByText(/How can I help you find your next home\?/i)).toBeInTheDocument();
    expect(screen.queryByText('Here are featured published homes.')).not.toBeInTheDocument();
  });

  it('shows live Trace shimmer during streaming, streams formatted text, renders nearby card, and triggers 1-tap follow-up chips', async () => {
    propertyService.getPropertyById.mockResolvedValueOnce({
      id: 'prop-42',
      title: 'Makati Sky Penthouse',
      price: 32000000,
    });

    let triggerStatus;
    let triggerDelta;
    let resolveFirstStream;

    chatService.streamMessage
      .mockImplementationOnce((_messages, _pageContext, { onStatus, onDelta, onResult }) => {
        triggerStatus = onStatus;
        triggerDelta = onDelta;
        return new Promise((resolve) => {
          resolveFirstStream = () => {
            const payload = {
              message: 'Here are **nearby** landmarks for Makati Sky Penthouse.\n- Greenbelt 5',
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
              followUpSuggestions: ['Compare similar homes', 'Ask about monthly dues'],
            };
            onResult?.(payload);
            resolve(payload);
          };
        });
      })
      .mockImplementationOnce(
        mockStreamSuccess({
          message: 'Association dues are verified by the assigned licensed broker.',
          followUpSuggestions: [],
        })
      );

    const { container } = render(
      <MemoryRouter initialEntries={['/properties/prop-42']}>
        <ChatWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    await waitFor(() => {
      expect(propertyService.getPropertyById).toHaveBeenCalledWith('prop-42', {
        publicView: 'true',
      });
      expect(screen.getByText(/Currently viewing: Makati Sky Penthouse/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /what's nearby\?/i }));

    // Trigger live status event -> Trace shimmer appears
    await act(async () => {
      triggerStatus({ step: 'nearby', label: 'Looking up nearby schools, malls & drive times...' });
    });

    const traceLine = container.querySelector('[data-slot="trace-line"][data-status="running"]');
    expect(traceLine).not.toBeNull();
    expect(screen.getByText('Looking up nearby schools, malls & drive times...')).toBeInTheDocument();

    // Stream delta chunk -> formatted via ChatMessageText
    await act(async () => {
      triggerDelta('Here are **nearby** landmarks');
    });
    expect(screen.getByText('nearby').tagName).toBe('STRONG');

    // Finalize first stream
    await act(async () => {
      resolveFirstStream();
    });

    await waitFor(() => {
      expect(screen.getByText('Nearby Makati Sky Penthouse')).toBeInTheDocument();
      expect(screen.getAllByText('Greenbelt 5').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('BGC')).toBeInTheDocument();
      expect(screen.getByText(/15 mins/)).toBeInTheDocument();
    });

    // Trace disappears once finalized
    expect(container.querySelector('[data-slot="trace-line"]')).toBeNull();

    // Follow-up chips appear under latest finalized AI message
    const duesChip = screen.getByRole('button', { name: 'Ask about monthly dues' });
    expect(duesChip).toBeInTheDocument();

    fireEvent.click(duesChip);

    await waitFor(() => {
      expect(chatService.streamMessage).toHaveBeenCalledTimes(2);
      expect(chatService.streamMessage.mock.calls[1][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Ask about monthly dues' }),
        ])
      );
      expect(chatService.streamMessage.mock.calls[1][1]).toEqual({
        route: '/properties/prop-42',
        propertyId: 'prop-42',
      });
      expect(
        screen.getByText('Association dues are verified by the assigned licensed broker.')
      ).toBeInTheDocument();
    });
  });

  it('aborts an active stream when Stop generating is clicked, preserving streamed words and re-enabling input', async () => {
    let capturedSignal;
    let triggerDelta;
    let rejectStream;

    chatService.streamMessage.mockImplementationOnce((_messages, _pageContext, { onStatus, onDelta, signal }) => {
      capturedSignal = signal;
      triggerDelta = onDelta;
      onStatus?.({ step: 'writing', label: 'Writing your reply...' });
      return new Promise((_resolve, reject) => {
        rejectStream = reject;
      });
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Show Taguig homes' } });
    fireEvent.submit(input.closest('form'));

    await act(async () => {
      triggerDelta('Partial reply words');
    });

    const stopBtn = screen.getByRole('button', { name: /stop generating/i });
    expect(stopBtn).toBeInTheDocument();

    fireEvent.click(stopBtn);

    expect(capturedSignal.aborted).toBe(true);

    // Simulate stream rejecting with AbortError after abort
    await act(async () => {
      const abortErr = new Error('The operation was aborted.');
      abortErr.name = 'AbortError';
      rejectStream(abortErr);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Partial reply words')).toBeInTheDocument();
    expect(screen.queryByText(/temporarily unavailable/i)).not.toBeInTheDocument();
  });

  it('supports 1-tap + Compare bar on property cards and launches side-by-side comparison when Compare Selected is clicked', async () => {
    chatService.streamMessage
      .mockImplementationOnce(
        mockStreamSuccess({
          message: 'Here are two Taguig condos.',
          cards: [sampleProperty, secondProperty],
        })
      )
      .mockImplementationOnce(
        mockStreamSuccess({
          message: 'Here is the side-by-side comparison.',
          comparison: {
            properties: [sampleProperty, secondProperty],
            rows: [{ label: 'Price', values: ['PHP 24,500,000', 'PHP 18,000,000'] }],
          },
        })
      );

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Condos in Taguig' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Serendra Two-Bedroom Suite')).toBeInTheDocument();
      expect(screen.getByText('One Uptown Residence')).toBeInTheDocument();
    });

    const compareButtons = screen.getAllByRole('button', { name: /\+ compare/i });
    expect(compareButtons).toHaveLength(2);

    // Select first property -> bar shows 1 selected, Compare Selected (1) disabled
    fireEvent.click(compareButtons[0]);
    const compareNowOne = screen.getByRole('button', { name: /compare selected \(1\)/i });
    expect(compareNowOne).toBeDisabled();

    // Select second property -> Compare Selected (2) enabled
    fireEvent.click(screen.getByRole('button', { name: /\+ compare/i }));
    const compareNowTwo = screen.getByRole('button', { name: /compare selected \(2\)/i });
    expect(compareNowTwo).toBeEnabled();

    fireEvent.click(compareNowTwo);

    await waitFor(() => {
      expect(chatService.streamMessage).toHaveBeenCalledTimes(2);
      const sentMessages = chatService.streamMessage.mock.calls[1][0];
      expect(sentMessages[sentMessages.length - 1].content).toBe(
        'Compare these properties side by side: Serendra Two-Bedroom Suite (ID: prop-101), One Uptown Residence (ID: prop-102)'
      );
      expect(screen.getByText('Side-by-Side Comparison')).toBeInTheDocument();
    });

    // Compare bar clears after submission
    expect(screen.queryByRole('button', { name: /compare selected/i })).not.toBeInTheDocument();
  });

  it('shows Jump to latest when scrolled up and scrolls back to bottom on click', async () => {
    chatService.streamMessage.mockImplementationOnce(
      mockStreamSuccess({
        message: 'Here are the listings you requested.',
      })
    );

    const { container } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Show homes' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Here are the listings you requested.')).toBeInTheDocument();
    });

    const scrollArea = container.querySelector('[data-lenis-prevent="true"]');
    Object.defineProperty(scrollArea, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollArea, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollArea, 'scrollTop', { value: 100, configurable: true, writable: true });

    fireEvent.scroll(scrollArea);

    const jumpBtn = screen.getByRole('button', { name: /jump to latest/i });
    expect(jumpBtn).toBeInTheDocument();

    window.HTMLElement.prototype.scrollIntoView.mockClear();
    fireEvent.click(jumpBtn);

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('renders HTML/script payloads from AI responses as harmless plain text', async () => {
    chatService.streamMessage.mockImplementationOnce(
      mockStreamSuccess({
        message: '<script>window.__xss=1</script>Hello buyer',
      })
    );

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('<script>window.__xss=1</script>Hello buyer')).toBeInTheDocument();
    });
    expect(document.querySelector('script')).toBeNull();
  });

  it('renders property and comparison cards and routes card-triggered handoff with attached property, summary, and RA 10173 consent', async () => {
    chatService.streamMessage.mockImplementationOnce(
      mockStreamSuccess({
        message: 'Here are matching condos in Taguig.',
        cards: [sampleProperty],
        comparison: {
          properties: [sampleProperty, secondProperty],
          rows: [{ label: 'Price', values: ['PHP 24,500,000', 'PHP 18,000,000'] }],
        },
        handoffDraft: {
          summary: 'Buyer wants a 2BR condo in BGC under 25M.',
        },
      })
    );
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'INQ-9001' } } });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
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
          propertyPrice: 'PHP 24,500,000',
          source: 'ai_chatbot',
          preferredReplyChannel: 'chat',
          consentAccepted: true,
          message: expect.stringContaining('Buyer wants a 2BR condo in BGC under 25M.'),
        })
      );
      expect(screen.getByText(/INQ-9001/)).toBeInTheDocument();
    });
  });

  it('keeps ChatHandoffForm reachable via Talk to a Licensed Agent when chatService.streamMessage fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    chatService.streamMessage.mockRejectedValueOnce(new Error('Upstream timeout'));
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'INQ-FALLBACK' } } });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Help me find a house' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const fallbackMsg = screen.getByText(/temporarily unavailable/i);
      expect(fallbackMsg).toBeInTheDocument();
      expect(fallbackMsg).toHaveTextContent(/Talk to a Licensed Agent/i);
    });

    fireEvent.click(screen.getByRole('button', { name: /talk to a licensed agent/i }));

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

  it('caps apiMessages at 20 turns and omits empty-text messages before calling chatService.streamMessage', async () => {
    let replyCount = 0;
    chatService.streamMessage
      .mockImplementationOnce(
        mockStreamSuccess({
          message: '   ',
          cards: [sampleProperty],
        })
      )
      .mockImplementation(async (_messages, _pageContext, { onResult } = {}) => {
        replyCount += 1;
        const payload = {
          message: `Reply ${replyCount}`,
          cards: [],
          comparison: null,
          nearby: null,
          handoffDraft: null,
          suggestHandoff: false,
          handoffReason: null,
          followUpSuggestions: [],
        };
        onResult?.(payload);
        return payload;
      });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');

    for (let i = 1; i <= 12; i += 1) {
      fireEvent.change(input, { target: { value: `Message ${i}` } });
      fireEvent.submit(input.closest('form'));
      await waitFor(() => {
        expect(chatService.streamMessage).toHaveBeenCalledTimes(i);
        if (i === 1) {
          expect(screen.getByText('Serendra Two-Bedroom Suite')).toBeInTheDocument();
        } else {
          expect(screen.getByText(`Reply ${i - 1}`)).toBeInTheDocument();
        }
      });
    }

    const secondTurnMessages = chatService.streamMessage.mock.calls[1][0];
    expect(secondTurnMessages.every((m) => m.content.trim().length > 0)).toBe(true);
    expect(secondTurnMessages.map((m) => m.content)).toEqual(['Message 1', 'Message 2']);

    const lastTurnMessages = chatService.streamMessage.mock.calls[11][0];
    expect(lastTurnMessages).toHaveLength(20);
    expect(lastTurnMessages.every((m) => m.content.trim().length > 0)).toBe(true);
    expect(lastTurnMessages[lastTurnMessages.length - 1]).toEqual({
      role: 'user',
      content: 'Message 12',
    });
  });

  it('supports /listing/:id alias and slug/listing-key routes via routePropertyId with publicView=true', async () => {
    propertyService.getPropertyById.mockResolvedValueOnce({
      id: 'uuid-999',
      title: 'BGC Listing Key Condo',
      price: 19500000,
    });

    render(
      <MemoryRouter initialEntries={['/listing/MLS-PH-001']}>
        <ChatWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    await waitFor(() => {
      expect(propertyService.getPropertyById).toHaveBeenCalledWith('MLS-PH-001', {
        publicView: 'true',
      });
      expect(screen.getByText(/Currently viewing: BGC Listing Key Condo/i)).toBeInTheDocument();
    });
  });

  it('truncates >2,000-character user input and assistant replies to <= 2,000 chars before sending apiMessages', async () => {
    const longUserInput = 'u'.repeat(2400);
    const longAssistantReply = 'a'.repeat(2600);

    chatService.streamMessage
      .mockImplementationOnce(
        mockStreamSuccess({
          message: longAssistantReply,
        })
      )
      .mockImplementationOnce(
        mockStreamSuccess({
          message: 'Follow-up acknowledged.',
        })
      );

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '2000');

    fireEvent.change(input, { target: { value: longUserInput } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(chatService.streamMessage).toHaveBeenCalledTimes(1);
    });

    const firstCallMessages = chatService.streamMessage.mock.calls[0][0];
    expect(firstCallMessages[firstCallMessages.length - 1].content).toHaveLength(2000);

    fireEvent.change(input, { target: { value: 'Follow-up question' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(chatService.streamMessage).toHaveBeenCalledTimes(2);
    });

    const secondCallMessages = chatService.streamMessage.mock.calls[1][0];
    expect(secondCallMessages.every((m) => m.content.length <= 2000)).toBe(true);
    const resentAssistant = secondCallMessages.find(
      (m) => m.role === 'assistant' && m.content.startsWith('aaaa')
    );
    expect(resentAssistant).toBeDefined();
    expect(resentAssistant.content).toHaveLength(2000);
  });

  it('renders an inline Connect to Licensed Agent button with dark ink on coral when suggestHandoff is true', async () => {
    propertyService.getPropertyById.mockResolvedValueOnce({
      id: 'prop-42',
      title: 'Alabang Courtyard Villa',
      formattedPrice: '₱28,000,000',
    });
    chatService.streamMessage.mockImplementationOnce(
      mockStreamSuccess({
        message: 'A PRC-licensed agent can verify flood history and schedule your site visit.',
        handoffDraft: {
          propertyId: 'prop-42',
          propertyTitle: 'Alabang Courtyard Villa',
          propertyPrice: '₱28,000,000',
          summary: 'Visitor asked about flood risk and viewing.',
        },
        suggestHandoff: true,
        handoffReason: 'safety_or_flood',
      })
    );

    render(
      <MemoryRouter initialEntries={['/properties/prop-42']}>
        <ChatWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));
    await waitFor(() => {
      expect(screen.getByText(/Currently viewing: Alabang Courtyard Villa/i)).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Binabaha ba dito pag bagyo?' } });
    fireEvent.submit(input.closest('form'));

    const inlineCta = await screen.findByRole('button', { name: /connect to licensed agent/i });
    expect(inlineCta).toHaveClass('bg-[#FF6B6B]', 'text-[#1E293B]');
    expect(inlineCta).not.toHaveClass('text-white');

    fireEvent.click(inlineCta);
    expect(screen.getByRole('button', { name: /request licensed agent/i })).toBeInTheDocument();
    expect(screen.getByText(/Property: Alabang Courtyard Villa/i)).toBeInTheDocument();
  });

  it('uses auto scroll behavior when prefers-reduced-motion is enabled', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    try {
      render(<ChatWidget />);
      fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

      await waitFor(() => {
        expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'auto',
        });
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
