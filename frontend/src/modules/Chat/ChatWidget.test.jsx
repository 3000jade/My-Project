import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWidget from './ChatWidget';
import { chatService } from '../../services/chatService';
import apiClient from '../../services/apiClient';

vi.mock('../../services/chatService', () => ({
  chatService: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders the RA 9646 AI Property Concierge disclosure when opened', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));

    expect(screen.getByText('AI Property Concierge')).toBeInTheDocument();
    expect(screen.getByText(/not a PRC-licensed broker/i)).toBeInTheDocument();
  });

  it('renders HTML/script payloads from AI responses as harmless plain text', async () => {
    chatService.sendMessage.mockResolvedValueOnce('<script>window.__xss=1</script>Hello buyer');

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

  it('requires RA 10173 privacy consent before submitting escalation to /inquiries', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'INQ-9001' } } });

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button', { name: /toggle ai property concierge/i }));
    fireEvent.click(screen.getByRole('button', { name: /contact agent/i }));

    const submitBtn = screen.getByRole('button', { name: /request licensed agent/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'maria@example.com' } });
    fireEvent.click(screen.getByRole('checkbox'));

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/inquiries',
        expect.objectContaining({
          name: 'Maria Santos',
          email: 'maria@example.com',
          source: 'ai_chatbot',
          preferredReplyChannel: 'chat',
          consentAccepted: true,
        })
      );
      expect(screen.getByText(/INQ-9001/)).toBeInTheDocument();
    });
  });
});
