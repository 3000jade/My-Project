import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWelcomeView from './ChatWelcomeView';

const sampleListing = {
  id: 'prop-101',
  title: 'Serendra Two-Bedroom Suite',
  city: 'Taguig',
};

describe('ChatWelcomeView', () => {
  it('renders the warm gallery header, teal Bot badge, and RA 9646 disclosure', () => {
    const { container } = render(<ChatWelcomeView onSelectPrompt={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: /how can i help you find your next home\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Automated AI Property Concierge — not a PRC-licensed broker (RA 9646).')
    ).toBeInTheDocument();

    const iconBadge = container.querySelector('.bg-\\[\\#CCFBF1\\].text-\\[\\#0F766E\\]');
    expect(iconBadge).not.toBeNull();
    expect(iconBadge.className).toContain('size-10');
    expect(iconBadge.className).toContain('rounded-xl');
  });

  it('renders the 4 general prompt tiles when no activeListing is present and dispatches exact prompts', () => {
    const onSelectPrompt = vi.fn();
    const onAskAgent = vi.fn();

    render(<ChatWelcomeView onSelectPrompt={onSelectPrompt} onAskAgent={onAskAgent} />);

    const expectedGeneralTiles = [
      { label: 'Homes under ₱20M', prompt: 'Help me find published homes under ₱20M' },
      { label: 'Featured homes', prompt: 'Show me your featured published homes' },
      { label: 'Condos in Makati or BGC', prompt: 'Show me condos for sale in Makati or BGC' },
      {
        label: 'How buying works',
        prompt: 'What are the basic steps to buy a property in the Philippines?',
      },
    ];

    expectedGeneralTiles.forEach(({ label, prompt }, index) => {
      const btn = screen.getByRole('button', { name: label });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onSelectPrompt).toHaveBeenNthCalledWith(index + 1, prompt);
    });

    expect(screen.queryByRole('button', { name: "What's nearby?" })).toBeNull();
    expect(onAskAgent).not.toHaveBeenCalled();
  });

  it('falls back to general prompt tiles when activeListing lacks a title', () => {
    render(<ChatWelcomeView activeListing={{ id: 'prop-999' }} onSelectPrompt={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Homes under ₱20M' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "What's nearby?" })).toBeNull();
  });

  it('renders the 4 listing-specific tiles when activeListing.title is present and wires onAskAgent', () => {
    const onSelectPrompt = vi.fn();
    const onAskAgent = vi.fn();

    render(
      <ChatWelcomeView
        activeListing={sampleListing}
        onSelectPrompt={onSelectPrompt}
        onAskAgent={onAskAgent}
      />
    );

    const expectedListingPrompts = [
      { label: "What's nearby?", prompt: "What's nearby this property?" },
      { label: 'Compare similar homes', prompt: 'Compare this home with similar published listings' },
      {
        label: 'Key specs & monthly dues',
        prompt: 'Tell me the key features, sizes, and monthly association dues of this listing',
      },
    ];

    expectedListingPrompts.forEach(({ label, prompt }, index) => {
      const btn = screen.getByRole('button', { name: label });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onSelectPrompt).toHaveBeenNthCalledWith(index + 1, prompt);
    });

    const askAgentBtn = screen.getByRole('button', { name: 'Ask an agent about this' });
    fireEvent.click(askAgentBtn);
    expect(onAskAgent).toHaveBeenCalledTimes(1);
    expect(onAskAgent).toHaveBeenCalledWith(sampleListing);
    expect(onSelectPrompt).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('button', { name: 'Homes under ₱20M' })).toBeNull();
  });

  it('lays out prompt tiles in a responsive 2-column grid with 8-point spacing', () => {
    const { container } = render(<ChatWelcomeView onSelectPrompt={vi.fn()} />);
    const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.gap-2');
    expect(grid).not.toBeNull();
  });
});
