export const PRESENCE_TTL_MS = 120_000;

const lastSeenMap = new Map<string, number>();
const streamCountsMap = new Map<string, number>();

export class AgentPresenceService {
  public static resetStore(): void {
    lastSeenMap.clear();
    streamCountsMap.clear();
  }

  public static markOnline(agentId: string, nowMs: number = Date.now()): void {
    if (!agentId) return;
    lastSeenMap.set(String(agentId), nowMs);
  }

  public static markOffline(agentId: string): void {
    if (!agentId) return;
    lastSeenMap.delete(String(agentId));
    streamCountsMap.delete(String(agentId));
  }

  public static setStreamConnected(agentId: string, connected: boolean): void {
    if (!agentId) return;
    const key = String(agentId);
    const current = streamCountsMap.get(key) || 0;
    if (connected) {
      streamCountsMap.set(key, current + 1);
    } else if (current <= 1) {
      streamCountsMap.delete(key);
    } else {
      streamCountsMap.set(key, current - 1);
    }
  }

  public static isOnline(agentId: string, nowMs: number = Date.now()): boolean {
    if (!agentId) return false;
    const key = String(agentId);
    if ((streamCountsMap.get(key) || 0) > 0) return true;
    const lastSeen = lastSeenMap.get(key);
    return typeof lastSeen === 'number' && nowMs - lastSeen <= PRESENCE_TTL_MS;
  }

  public static getOnlineAgentIds(nowMs: number = Date.now()): string[] {
    const ids = new Set<string>();
    for (const [id, count] of streamCountsMap.entries()) {
      if (count > 0) ids.add(id);
    }
    for (const [id, ts] of lastSeenMap.entries()) {
      if (nowMs - ts <= PRESENCE_TTL_MS) ids.add(id);
    }
    return Array.from(ids);
  }
}

export default AgentPresenceService;
