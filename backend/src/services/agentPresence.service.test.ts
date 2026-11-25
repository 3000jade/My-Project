import { beforeEach, describe, expect, it } from 'vitest';
import { AgentPresenceService, PRESENCE_TTL_MS } from './agentPresence.service';

describe('AgentPresenceService', () => {
  beforeEach(() => {
    AgentPresenceService.resetStore();
  });

  it('marks an agent online within the 120-second TTL and offline after expiry', () => {
    const t0 = Date.UTC(2026, 10, 25, 2, 0, 0);
    AgentPresenceService.markOnline('agent-1', t0);

    expect(AgentPresenceService.isOnline('agent-1', t0 + 60_000)).toBe(true);
    expect(AgentPresenceService.getOnlineAgentIds(t0 + 60_000)).toEqual(['agent-1']);
    expect(AgentPresenceService.isOnline('agent-1', t0 + PRESENCE_TTL_MS + 1)).toBe(false);
    expect(AgentPresenceService.getOnlineAgentIds(t0 + PRESENCE_TTL_MS + 1)).toEqual([]);
  });

  it('treats agents with an active stream connection as online even after heartbeat TTL', () => {
    const t0 = Date.UTC(2026, 10, 25, 2, 0, 0);
    AgentPresenceService.setStreamConnected('agent-2', true);
    expect(AgentPresenceService.isOnline('agent-2', t0 + 999_999)).toBe(true);

    AgentPresenceService.setStreamConnected('agent-2', false);
    expect(AgentPresenceService.isOnline('agent-2', t0 + 999_999)).toBe(false);
  });

  it('marks an agent offline immediately when markOffline is called', () => {
    const t0 = Date.UTC(2026, 10, 25, 2, 0, 0);
    AgentPresenceService.markOnline('agent-3', t0);
    AgentPresenceService.markOffline('agent-3');
    expect(AgentPresenceService.isOnline('agent-3', t0)).toBe(false);
  });
});
