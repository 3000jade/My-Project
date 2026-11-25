import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChatLiveAgentCarousel from './ChatLiveAgentCarousel';

const sampleAgents = [
  {
    id: 'a1',
    name: 'Elena Rossi',
    avatar: null,
    verified: true,
    online: true,
    matchReason: 'Listing Agent',
    areas: ['BGC'],
    specialties: ['Condominium'],
    isListingAgent: true,
  },
  {
    id: 'a2',
    name: 'Marco Santos',
    avatar: null,
    verified: true,
    online: true,
    matchReason: 'BGC · Condominium',
    areas: ['BGC'],
    specialties: ['Condominium'],
    isListingAgent: false,
  },
];

describe('ChatLiveAgentCarousel', () => {
  it('renders familiar labels, online indicators, and side-by-side action buttons', () => {
    const onSelectAgent = vi.fn();
    const onBestMatch = vi.fn();
    const onLeaveMessage = vi.fn();

    render(
      <ChatLiveAgentCarousel
        agents={sampleAgents}
        isLoading={false}
        isExpanded={false}
        onSelectAgent={onSelectAgent}
        onBestMatch={onBestMatch}
        onLeaveMessage={onLeaveMessage}
      />
    );

    expect(screen.getByText('Available Agents')).toBeInTheDocument();
    expect(screen.getByText('2 online')).toBeInTheDocument();
    expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    expect(screen.getAllByText('Verified Agent')).toHaveLength(2);
    expect(screen.getAllByText('Online now')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: /Chat Now/i })[0]);
    expect(onSelectAgent).toHaveBeenCalledWith(sampleAgents[0]);

    fireEvent.click(screen.getByRole('button', { name: /Best Match/i }));
    expect(onBestMatch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Leave a Message/i }));
    expect(onLeaveMessage).toHaveBeenCalledTimes(1);
  });

  it('renders side-by-side Previous and Next carousel buttons', () => {
    render(
      <ChatLiveAgentCarousel
        agents={sampleAgents}
        isLoading={false}
        isExpanded={true}
        onSelectAgent={vi.fn()}
        onBestMatch={vi.fn()}
        onLeaveMessage={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Previous agent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next agent/i })).toBeInTheDocument();
  });
});
