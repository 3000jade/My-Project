import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveAgentRoutingService, scoreLiveAgentCandidate } from './liveAgentRouting.service';
import { AgentPresenceService } from './agentPresence.service';

describe('scoreLiveAgentCandidate', () => {
  it('ranks listing owner first, then area + property type match, then least busy', () => {
    const listingOwner = scoreLiveAgentCandidate(
      { id: 'a1', name: 'Owner', areas: ['Makati'], specialties: ['Condominium'], activeChats: 5 },
      { listingAgentId: 'a1', city: 'BGC', propertyType: 'Condominium' }
    );
    const bgcCondoBusy = scoreLiveAgentCandidate(
      { id: 'a2', name: 'Busy BGC', areas: ['BGC'], specialties: ['Condominium'], activeChats: 6 },
      { listingAgentId: 'a1', city: 'BGC', propertyType: 'Condominium' }
    );
    const bgcCondoFree = scoreLiveAgentCandidate(
      { id: 'a3', name: 'Free BGC', areas: ['BGC'], specialties: ['Condominium'], activeChats: 1 },
      { listingAgentId: 'a1', city: 'BGC', propertyType: 'Condominium' }
    );
    const bgcOnly = scoreLiveAgentCandidate(
      { id: 'a4', name: 'BGC Only', areas: ['BGC'], specialties: ['Lot'], activeChats: 0 },
      { listingAgentId: 'a1', city: 'BGC', propertyType: 'Condominium' }
    );

    const ordered = [bgcOnly, bgcCondoBusy, listingOwner, bgcCondoFree].sort(
      LiveAgentRoutingService.compareScoredCandidates
    );
    expect(ordered.map((c) => c.agent.id)).toEqual(['a1', 'a3', 'a2', 'a4']);
    expect(listingOwner.matchReason).toBe('Listing Agent');
    expect(bgcCondoFree.matchReason).toBe('BGC · Condominium');
  });
});

describe('LiveAgentRoutingService.rankCandidates', () => {
  beforeEach(() => {
    AgentPresenceService.resetStore();
    vi.restoreAllMocks();
  });

  it('excludes offline or ineligible agents and never leaks email or phone', async () => {
    AgentPresenceService.markOnline('agent-online');
    const result = await LiveAgentRoutingService.rankCandidates(
      [
        {
          id: 'agent-online',
          name: 'Elena Rossi',
          email: 'elena@example.com',
          phone: '+639171234567',
          avatar: null,
          location_branch: 'BGC',
          service_areas: ['BGC'],
          property_specialties: ['Condominium'],
          active_inquiries_count: 1,
        },
        {
          id: 'agent-offline',
          name: 'Offline Agent',
          email: 'offline@example.com',
          avatar: null,
          location_branch: 'BGC',
          service_areas: ['BGC'],
          property_specialties: ['Condominium'],
          active_inquiries_count: 0,
        },
      ],
      { city: 'BGC', propertyType: 'Condominium' },
      { checkEligibility: async () => ({ allowed: true }) }
    );

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].id).toBe('agent-online');
    expect((result.agents[0] as any).email).toBeUndefined();
    expect((result.agents[0] as any).phone).toBeUndefined();
  });
});
