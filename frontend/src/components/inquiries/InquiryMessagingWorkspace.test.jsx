import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InquiryMessagingWorkspace from './InquiryMessagingWorkspace';

const mockInquiries = [
  {
    id: 'inq-1',
    client_name: 'Maria Clara',
    client_email: 'maria@example.com',
    property_title: 'Makati Sky Penthouse',
    property_price: 'PHP 45M',
    last_message: 'Is viewing available tomorrow?',
    created_at: new Date().toISOString(),
    status: 'NEW',
    source: 'ai_chatbot',
    consentAccepted: true,
    operational_status: 'awaiting_agent',
    business_status: 'active',
    messages: [
      { id: 'm-1', sender: 'client', sender_name: 'Maria Clara', timestamp: '10:00', content: 'Is viewing available tomorrow?' },
    ],
    latest_ai_summary: {
      generationStatus: 'ready',
      sections: {
        clientOverview: { summary: 'Serious penthouse buyer.' },
        propertyRequirements: {
          targetProperty: { value: 'Makati Sky Penthouse', sourceMessageIds: ['m-1'], basis: 'explicit' },
          budget: { value: 'PHP 45M' },
        },
        timelineAndUrgency: { timeframe: { value: 'Immediate' }, urgencyLevel: 'high' },
        qualificationAndReadiness: { financingMode: { value: 'Cash' } },
      },
    },
    internal_notes: [{ id: 'n-1', authorName: 'Agent', content: 'VIP lead', timestamp: '2026-11-13' }],
  },
];

describe('InquiryMessagingWorkspace', () => {
  it('sends replies with Enter/submit and highlights cited messages on citation click', async () => {
    const onSendMessage = vi.fn().mockResolvedValueOnce(undefined);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(
      <MemoryRouter>
        <InquiryMessagingWorkspace
          role="agent"
          inquiries={mockInquiries}
          selectedId="inq-1"
          onSelectInquiry={vi.fn()}
          onSendMessage={onSendMessage}
        />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Reply to Maria Clara/i);
    fireEvent.change(textarea, { target: { value: 'Yes, 2 PM tomorrow works!' } });
    fireEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('inq-1', 'Yes, 2 PM tomorrow works!');
    });

    fireEvent.click(screen.getByText('Cited (1)'));
    const citedWrapper = document.getElementById('msg-m-1');
    const citedBubble = citedWrapper.querySelector('div.rounded-2xl');
    expect(citedBubble.className).toContain('ring-2');
  });
});
