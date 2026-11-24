import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthContext from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import ChatHandoffForm from './ChatHandoffForm';

vi.mock('../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('ChatHandoffForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-fills name, email, and phone from AuthContext while keeping inputs editable', () => {
    const authValue = {
      user: {
        id: 'user-1',
        fullName: 'Maria Santos',
        email: 'maria@example.com',
        phone: '+63 917 555 0101',
      },
    };

    render(
      <AuthContext.Provider value={authValue}>
        <ChatHandoffForm onCancel={vi.fn()} onSuccess={vi.fn()} />
      </AuthContext.Provider>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone/i);

    expect(nameInput).toHaveValue('Maria Santos');
    expect(emailInput).toHaveValue('maria@example.com');
    expect(phoneInput).toHaveValue('+63 917 555 0101');

    fireEvent.change(nameInput, { target: { value: 'Maria Clara Santos' } });
    expect(nameInput).toHaveValue('Maria Clara Santos');
  });

  it('supports snake_case user fields (full_name and phone_number) from AuthContext', () => {
    const authValue = {
      user: {
        id: 'user-2',
        full_name: 'Juan Dela Cruz',
        email: 'juan@example.com',
        phone_number: '09181234567',
      },
    };

    render(
      <AuthContext.Provider value={authValue}>
        <ChatHandoffForm />
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Juan Dela Cruz');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('juan@example.com');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('09181234567');
  });

  it('renders cleanly in guest mode outside AuthProvider without throwing', () => {
    const onCancel = vi.fn();
    render(<ChatHandoffForm onCancel={onCancel} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders an attached property Badge when attachedProperty.title is provided', () => {
    render(
      <ChatHandoffForm
        attachedProperty={{
          id: 'prop-101',
          title: 'Serendra Two-Bedroom Suite',
          price: 24500000,
        }}
      />
    );

    expect(screen.getByText('Property: Serendra Two-Bedroom Suite')).toBeInTheDocument();
  });

  it('keeps submit disabled until RA 10173 consent is ticked and shows validation error if submitted without consent', () => {
    const { container } = render(<ChatHandoffForm />);

    const submitBtn = screen.getByRole('button', { name: /request licensed agent/i });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn.className).toContain('bg-[#FF6B6B]');
    expect(submitBtn.className).toContain('text-[#1E293B]');
    expect(submitBtn.className).not.toContain('text-white');

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana Reyes' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ana@example.com' } });

    const form = container.querySelector('form');
    fireEvent.submit(form);

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/RA 10173/i);

    const consentCheckbox = screen.getByRole('checkbox', { name: /RA 10173/i });
    fireEvent.click(consentCheckbox);

    expect(submitBtn).toBeEnabled();
  });

  it('submits enriched payload with handoffSummary, last 4 recentMessages, and attachedProperty, then calls onSuccess with reference ID', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: { id: 'INQ-2026-0099' },
      },
    });
    const onSuccess = vi.fn();

    const recentMessages = [
      { id: 1, type: 'user', text: 'First ignored message' },
      { id: 2, type: 'ai', text: 'Second message' },
      { id: 3, type: 'user', text: 'Looking for a 2BR in BGC' },
      { id: 4, type: 'ai', text: 'Serendra Two-Bedroom Suite is available.' },
      { id: 5, type: 'user', text: 'Can I schedule a viewing?' },
    ];

    render(
      <ChatHandoffForm
        attachedProperty={{
          id: 'prop-101',
          title: 'Serendra Two-Bedroom Suite',
          price: 24500000,
        }}
        handoffSummary="Buyer interested in BGC 2BR viewing this weekend."
        recentMessages={recentMessages}
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Carlos Mendoza' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'carlos@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+63 917 888 9999' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));

    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    const [url, payload] = apiClient.post.mock.calls[0];
    expect(url).toBe('/inquiries');
    expect(payload).toEqual({
      name: 'Carlos Mendoza',
      email: 'carlos@example.com',
      phone: '+63 917 888 9999',
      propertyId: 'prop-101',
      propertyTitle: 'Serendra Two-Bedroom Suite',
      propertyPrice: '24500000',
      message: [
        'Buyer interested in BGC 2BR viewing this weekend.',
        'AI: Second message',
        'Visitor: Looking for a 2BR in BGC',
        'AI: Serendra Two-Bedroom Suite is available.',
        'Visitor: Can I schedule a viewing?',
      ].join('\n'),
      source: 'ai_chatbot',
      preferredReplyChannel: 'chat',
      consentAccepted: true,
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('INQ-2026-0099');
    });
  });

  it('uses fallback message when handoffSummary and recentMessages are empty and falls back to submitted id', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} });
    const onSuccess = vi.fn();

    render(<ChatHandoffForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Liza Tan' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'liza@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/inquiries', {
        name: 'Liza Tan',
        email: 'liza@example.com',
        message: 'Visitor requested a licensed agent via AI Concierge.',
        source: 'ai_chatbot',
        preferredReplyChannel: 'chat',
        consentAccepted: true,
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('submitted');
    });
  });

  it('displays server error response or fallback error message when POST /inquiries fails', async () => {
    apiClient.post.mockRejectedValueOnce({
      response: { data: { error: 'Please provide a valid email address.' } },
    });

    render(<ChatHandoffForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please provide a valid email address.');
    });

    apiClient.post.mockRejectedValueOnce(new Error('Network down'));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not submit your inquiry. Please check your details.'
      );
    });
  });

  it('prefers formattedPrice string and coerces price 0 to "0" for createInquirySchema compatibility', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { id: 'INQ-PRICE' } } });

    const { unmount } = render(
      <ChatHandoffForm
        attachedProperty={{
          id: 'prop-201',
          title: 'Formatted Price Condo',
          price: 24500000,
          formattedPrice: '₱24,500,000',
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Elena Cruz' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'elena@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/inquiries',
        expect.objectContaining({
          propertyPrice: '₱24,500,000',
        })
      );
    });

    unmount();
    vi.clearAllMocks();

    render(
      <ChatHandoffForm
        attachedProperty={{
          id: 'prop-202',
          title: 'Zero Price Listing',
          price: 0,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Elena Cruz' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'elena@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /RA 10173/i }));
    fireEvent.click(screen.getByRole('button', { name: /request licensed agent/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/inquiries',
        expect.objectContaining({
          propertyPrice: '0',
        })
      );
    });
  });
});
