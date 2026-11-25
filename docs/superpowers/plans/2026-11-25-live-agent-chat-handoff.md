# Live Agent Chat Handoff & Smart Agent Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable visitors (guests and logged-in clients) to switch seamlessly from the AI Property Concierge inside `ChatWidget` into a real-time live chat with an eligible, online licensed agent chosen via a high-UX, medium-scale horizontal carousel of recommended agent cards or one-tap Best Match.

**Architecture:** Reuse the existing `inquiries` / `inquiry_messages` store and `inquiryStream` SSE relay so agents reply inside their existing `InquiryMessagingWorkspace` with zero third-party chat SaaS. Add `AgentPresenceService` (30s portal heartbeat, 120s online window), `Asia/Manila` weekly-schedule enforcement in `AgentAvailabilityService`, and `LiveAgentRoutingService` (listing owner > area > property type > least busy + 2-minute auto-pass), exposed through visitor-scoped HMAC-signed guest chat endpoints and a responsive `ChatLiveAgentCarousel` inside `ChatWidget`.

**Tech Stack:** Node.js · Express · TypeScript · Vitest · React 19 · Tailwind CSS v4 · shadcn/ui · lucide-react · Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-25-live-agent-chat-handoff-design.md`](../specs/2026-11-25-live-agent-chat-handoff-design.md)

## Global Constraints

- Strictly follow `DESIGN.md`: `#0F766E` Primary Teal, `#FF8559` Coral paired strictly with `#FFFFFF` white text, `#F8FAFC` alabaster canvas, `#FFFFFF` card surface, `#E2E8F0` `1px` borders, `#1E293B` primary text, `#64748B` secondary text, `#10B981` emerald online dot, 8-point spacing scale (`gap-2`, `gap-4`, `p-4`), `rounded-xl` cards, `min-h-11` (`44px`) touch targets, `motion-reduce:scroll-auto` / `motion-reduce:transition-none`.
- Always reuse `shadcn/ui` primitives from `frontend/src/components/ui/` (`Card`, `Button`, `Badge`, `Avatar`, `Alert`, `Input`, `Checkbox`, `Label`, `Skeleton`) and `lucide-react` icons.
- Use common, familiar labels only (`Available Agents`, `Online now`, `Verified Agent`, `Chat Now`, `Best Match`, `Leave a Message`, `End Chat`) and never expose agent private emails, phone numbers, internal notes, or raw license numbers in public chat DTOs.
- Guest live chat tokens must be HMAC-SHA256 signed with `config.jwtSecret`, 24-hour expiry, timing-safe verified, and strictly scoped to a single `inquiryId`.
- Run `graphify update .` after completing code edits.

---

### Task 1: Agent Presence Service, Weekly Schedule Hours & Specialty Types

**Files:**
- Modify: `shared/types/agent.ts:130-160`
- Create: `backend/src/services/agentPresence.service.ts`
- Test: `backend/src/services/agentPresence.service.test.ts`
- Modify: `backend/src/services/agentAvailability.service.ts:193-226`
- Test: `backend/src/services/agentAvailability.service.test.ts`

**Interfaces:**
- Consumes: `AgentAvailabilityScheduleDTO` from `shared/types/agent.ts`
- Produces:
  - `AgentPresenceService.markOnline(agentId: string, nowMs?: number): void`
  - `AgentPresenceService.markOffline(agentId: string): void`
  - `AgentPresenceService.setStreamConnected(agentId: string, connected: boolean): void`
  - `AgentPresenceService.isOnline(agentId: string, nowMs?: number): boolean`
  - `AgentPresenceService.getOnlineAgentIds(nowMs?: number): string[]`
  - `AgentPresenceService.resetStore(): void`
  - `AgentAvailabilityService.isAvailableForRoutingNow(schedule, activeInquiriesCount?, now?)` returning `{ available: boolean; reason?: 'UNAVAILABLE' | 'BLACKOUT_DATE' | 'CAPACITY_REACHED' | 'OUTSIDE_SCHEDULE' }`

- [ ] **Step 1: Write failing tests for `AgentPresenceService` and weekly schedule enforcement**

Create `backend/src/services/agentPresence.service.test.ts`:
```ts
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
```

Create `backend/src/services/agentAvailability.service.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { AgentAvailabilityService } from './agentAvailability.service';

describe('AgentAvailabilityService.isAvailableForRoutingNow', () => {
  it('allows routing during enabled Asia/Manila weekly schedule hours', () => {
    const sched = AgentAvailabilityService.createDefaultSchedule('agent-1', 'available');
    // Wednesday 2026-11-25 10:30 Asia/Manila = 02:30 UTC
    const wedMorningManila = new Date('2026-11-25T10:30:00+08:00');
    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 2, wedMorningManila)).toEqual({
      available: true,
    });
  });

  it('blocks routing outside enabled Asia/Manila weekly schedule hours or on disabled Sunday', () => {
    const sched = AgentAvailabilityService.createDefaultSchedule('agent-1', 'available');
    const wedLateNight = new Date('2026-11-25T21:15:00+08:00');
    const sundayNoon = new Date('2026-11-29T12:00:00+08:00');

    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 0, wedLateNight)).toEqual({
      available: false,
      reason: 'OUTSIDE_SCHEDULE',
    });
    expect(AgentAvailabilityService.isAvailableForRoutingNow(sched, 0, sundayNoon)).toEqual({
      available: false,
      reason: 'OUTSIDE_SCHEDULE',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; npx vitest run src/services/agentPresence.service.test.ts src/services/agentAvailability.service.test.ts`
Expected: FAIL (`agentPresence.service` not found, `OUTSIDE_SCHEDULE` not returned yet).

- [ ] **Step 3: Implement `AgentPresenceService`, weekly schedule check, and specialty fields**

Add `service_areas?: string[];` and `property_specialties?: string[];` to `AgentProfileDTO` in `shared/types/agent.ts`.

Create `backend/src/services/agentPresence.service.ts`:
```ts
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
      lastSeenMap.set(key, Date.now());
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
```

Update `isAvailableForRoutingNow` in `backend/src/services/agentAvailability.service.ts` to also enforce `weekly_schedule` in `Asia/Manila` (UTC+8):
```ts
const MANILA_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Inside isAvailableForRoutingNow, after blackout_dates check:
const manilaDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const dayKey = MANILA_DAYS[manilaDate.getUTCDay()];
const dayWindow = schedule.weekly_schedule?.[dayKey];
if (dayWindow) {
  if (!dayWindow.enabled) {
    return { available: false, reason: 'OUTSIDE_SCHEDULE' };
  }
  const hh = String(manilaDate.getUTCHours()).padStart(2, '0');
  const mm = String(manilaDate.getUTCMinutes()).padStart(2, '0');
  const currentHHMM = `${hh}:${mm}`;
  if (dayWindow.start && currentHHMM < dayWindow.start) {
    return { available: false, reason: 'OUTSIDE_SCHEDULE' };
  }
  if (dayWindow.end && currentHHMM > dayWindow.end) {
    return { available: false, reason: 'OUTSIDE_SCHEDULE' };
  }
}
```
And ensure `AgentEligibilityService` handles `'OUTSIDE_SCHEDULE'` by mapping it cleanly to `'UNAVAILABLE'` (or adding `'OUTSIDE_SCHEDULE'` to `EligibilityFailureReason`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; npx vitest run src/services/agentPresence.service.test.ts src/services/agentAvailability.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/types/agent.ts backend/src/services/agentPresence.service.ts backend/src/services/agentPresence.service.test.ts backend/src/services/agentAvailability.service.ts backend/src/services/agentAvailability.service.test.ts backend/src/services/agentEligibility.service.ts
git commit -m "feat(chat): add agent presence tracker and Asia/Manila schedule enforcement"
```

---

### Task 2: Smart Live Agent Ranking & 2-Minute Auto-Pass Engine

**Files:**
- Create: `backend/src/services/liveAgentRouting.service.ts`
- Test: `backend/src/services/liveAgentRouting.service.test.ts`

**Interfaces:**
- Consumes: `AgentService.listAgents`, `AgentEligibilityService.evaluate`, `AgentPresenceService.isOnline`, `PropertyService` (or property lookup), `InquiryService`
- Produces:
  - `LiveAgentCardDTO`: `{ id: string; name: string; avatar: string | null; verified: true; online: true; matchReason: string; areas: string[]; specialties: string[]; isListingAgent: boolean; activeChats: number }`
  - `LiveAgentRoutingService.getRecommendedLiveAgents(context: { propertyId?: string; city?: string; district?: string; propertyType?: string; excludeAgentIds?: string[]; limit?: number }, now?: Date): Promise<{ agents: LiveAgentCardDTO[]; onlineCount: number }>`
  - `LiveAgentRoutingService.scheduleAutoPass(inquiryId: string, initialAgentId: string, context: { propertyId?: string; city?: string; propertyType?: string }, timeoutMs?: number): void`
  - `LiveAgentRoutingService.evaluateAutoPass(inquiryId: string, triedAgentIds?: string[]): Promise<{ action: 'already_answered' | 'reassigned' | 'fallback_offline'; newAgent?: LiveAgentCardDTO }>`
  - `LiveAgentRoutingService.cancelAutoPass(inquiryId: string): void`

- [ ] **Step 1: Write failing tests for ranking, filtering, and 2-minute auto-pass**

Create `backend/src/services/liveAgentRouting.service.test.ts`:
```ts
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

describe('LiveAgentRoutingService.getRecommendedLiveAgents', () => {
  beforeEach(() => {
    AgentPresenceService.resetStore();
    vi.restoreAllMocks();
  });

  it('excludes offline or ineligible agents and never leaks email or phone', async () => {
    AgentPresenceService.markOnline('agent-online');
    const result = await LiveAgentRoutingService.rankCandidates(
      [
        { id: 'agent-online', name: 'Elena Rossi', avatar: null, location_branch: 'BGC', service_areas: ['BGC'], property_specialties: ['Condominium'], active_inquiries_count: 1 },
        { id: 'agent-offline', name: 'Offline Agent', avatar: null, location_branch: 'BGC', service_areas: ['BGC'], property_specialties: ['Condominium'], active_inquiries_count: 0 },
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; npx vitest run src/services/liveAgentRouting.service.test.ts`
Expected: FAIL (`liveAgentRouting.service` not found).

- [ ] **Step 3: Implement `LiveAgentRoutingService`**

Create `backend/src/services/liveAgentRouting.service.ts` implementing:
- `scoreLiveAgentCandidate(candidate, context)` with `+100` listing owner, `+50` area/city/district match (case-insensitive substring match against `areas` & `location_branch`), `+30` property type match, and plain-English `matchReason` (`Listing Agent`, `BGC · Condominium`, `BGC`, `Condominium`, or `Available Specialist`).
- `compareScoredCandidates(a, b)` sorting by `b.score - a.score || a.agent.activeChats - b.agent.activeChats || a.agent.id.localeCompare(b.agent.id)`.
- `rankCandidates(rawAgents, context, deps)` enforcing `AgentPresenceService.isOnline(id)` + `excludeAgentIds` + `AgentEligibilityService.evaluate(id, 'receive_lead', now)` and returning visitor-safe `LiveAgentCardDTO[]` capped to `limit` (default 5).
- `getRecommendedLiveAgents(context, now)` fetching agents via `AgentService.listAgents`, enriching areas/specialties from each agent's published listings when `service_areas`/`property_specialties` are empty, and delegating to `rankCandidates`.
- `scheduleAutoPass` / `evaluateAutoPass` / `cancelAutoPass`: tracks a `Map<string, { timer: NodeJS.Timeout; triedAgentIds: string[]; context }>` with default `120_000`ms (2 minutes). When triggered and `inquiry.firstHumanResponseAt` is still falsy, picks the next online eligible agent excluding `triedAgentIds`; if found, reassigns inquiry, publishes `agent_reassigned` to visitor + agent streams, and schedules the next 2-minute check; if none left, sets `operationalStatus = 'unassigned'`, alerts brokerage queue, and publishes `fallback_offline` to the visitor stream.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; npx vitest run src/services/liveAgentRouting.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/services/liveAgentRouting.service.ts backend/src/services/liveAgentRouting.service.test.ts
git commit -m "feat(chat): add smart live agent ranking and 2-minute auto-pass routing"
```

---

### Task 3: Visitor Live Stream, Guest HMAC Token & Live Chat API Endpoints

**Files:**
- Modify: `backend/src/utils/inquiryStream.ts:1-78`
- Create: `backend/src/controllers/chatLive.controller.ts`
- Test: `backend/src/controllers/chatLive.controller.test.ts`
- Modify: `backend/src/routes/chat.routes.ts:1-15`
- Modify: `backend/src/controllers/agent.controller.ts`
- Modify: `backend/src/routes/agent.routes.ts:24-27`

**Interfaces:**
- Consumes: `LiveAgentRoutingService`, `InquiryService`, `AgentPresenceService`, `config.jwtSecret`
- Produces:
  - `subscribeVisitorInquiryStream(inquiryId: string, res: Response): () => void`
  - `publishVisitorInquiryEvent(inquiryId: string, event: string, payload: Record<string, unknown>): void`
  - `signLiveChatToken(inquiryId: string, email: string): string`
  - `verifyLiveChatToken(token: string, expectedInquiryId: string): { valid: boolean; email?: string }`
  - Routes under `/api/chat`: `GET /live-agents`, `POST /live-handoff`, `GET /live/:inquiryId/stream`, `GET /live/:inquiryId/messages`, `POST /live/:inquiryId/messages`
  - Route under `/api/agents`: `POST /me/presence` (requires `requireAuth` + `requireRole(['agent', 'broker', 'admin'])`)

- [ ] **Step 1: Write failing tests for guest token security and live chat controller**

Create `backend/src/controllers/chatLive.controller.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { signLiveChatToken, verifyLiveChatToken } from './chatLive.controller';

describe('Guest Live Chat HMAC Token', () => {
  it('accepts a valid token for the matching inquiryId', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const check = verifyLiveChatToken(token, 'inq-123');
    expect(check.valid).toBe(true);
    expect(check.email).toBe('guest@example.com');
  });

  it('rejects a token used against a different inquiryId', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const check = verifyLiveChatToken(token, 'inq-999');
    expect(check.valid).toBe(false);
  });

  it('rejects a tampered token', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyLiveChatToken(tampered, 'inq-123').valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; npx vitest run src/controllers/chatLive.controller.test.ts`
Expected: FAIL (`chatLive.controller` not found).

- [ ] **Step 3: Implement visitor stream support, `chatLive.controller.ts`, routes, and agent presence endpoint**

1. Update `backend/src/utils/inquiryStream.ts`:
   - In `subscribeInquiryStream`, when `role === 'agent'`, call `AgentPresenceService.setStreamConnected(userId, true)` on subscribe and `setStreamConnected(userId, false)` on cleanup.
   - Add `visitorSubscribers = new Map<string, Set<Response>>()` with `subscribeVisitorInquiryStream(inquiryId, res)` and `publishVisitorInquiryEvent(inquiryId, event, payload)`.
   - Inside `publishInquiryEvent(event, payload)`, when `payload.inquiryId` has visitor subscribers, forward visitor-safe events (`message`, `agent_reassigned`, `fallback_offline`, `chat_closed`) so replies from `InquiryMessagingWorkspace` reach `ChatWidget` immediately!
2. Create `backend/src/controllers/chatLive.controller.ts` with:
   - `signLiveChatToken` & `verifyLiveChatToken` using Node `crypto.createHmac('sha256', config.jwtSecret)` + `crypto.timingSafeEqual` (24-hour TTL).
   - `getLiveAgents`: reads `propertyId`, `city`, `district`, `propertyType` query params and returns `{ success: true, data: { agents, onlineCount } }`.
   - `startLiveHandoff`: validates `name`, `email`, `consentAccepted === true`; re-checks chosen `selectedAgentId` (or picks top online agent); returns HTTP `409` `{ success: false, code: 'AGENT_UNAVAILABLE', data: { nextBestAgent } }` if the specifically chosen agent just went offline; otherwise creates inquiry (`source: 'ai_chatbot_live'`, `preferredReplyChannel: 'chat'`), attaches AI summary, schedules 2-minute auto-pass via `LiveAgentRoutingService.scheduleAutoPass`, and returns `{ inquiryId, referenceCode, agent, liveChatToken }`.
   - `streamLiveChat`: verifies guest `token` query param (or JWT) for `:inquiryId` and opens `subscribeVisitorInquiryStream`.
   - `getLiveMessages` & `postLiveMessage`: verifies guest `X-Live-Chat-Token` header / query token (or JWT) for `:inquiryId`, sanitizes out internal notes/summaries, and reads/adds messages via `InquiryService`.
3. Wire routes in `backend/src/routes/chat.routes.ts` (behind `chatRateLimiter`) and `POST /me/presence` in `backend/src/routes/agent.routes.ts` + `AgentController.pingPresence`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; npx vitest run src/controllers/chatLive.controller.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/utils/inquiryStream.ts backend/src/controllers/chatLive.controller.ts backend/src/controllers/chatLive.controller.test.ts backend/src/routes/chat.routes.ts backend/src/controllers/agent.controller.ts backend/src/routes/agent.routes.ts
git commit -m "feat(chat): add visitor live chat endpoints, guest HMAC token, and agent presence ping"
```

---

### Task 4: High-UX Medium-Scale `ChatLiveAgentCarousel` Component

**Files:**
- Create: `frontend/src/modules/Chat/ChatLiveAgentCarousel.jsx`
- Test: `frontend/src/modules/Chat/ChatLiveAgentCarousel.test.jsx`

**Interfaces:**
- Consumes: `Card`, `CardContent`, `Button`, `Badge`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Skeleton` from `@/components/ui/*`; `ChevronLeft`, `ChevronRight`, `ShieldCheck`, `MapPin`, `Building2`, `Home`, `MessageSquare`, `Sparkles`, `Mail` from `lucide-react`
- Produces:
  - `ChatLiveAgentCarousel({ agents, isLoading, isExpanded, onSelectAgent, onBestMatch, onLeaveMessage, onClose })`

- [ ] **Step 1: Write failing UI tests for `ChatLiveAgentCarousel`**

Create `frontend/src/modules/Chat/ChatLiveAgentCarousel.test.jsx`:
```jsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/modules/Chat/ChatLiveAgentCarousel.test.jsx`
Expected: FAIL (`ChatLiveAgentCarousel` not found).

- [ ] **Step 3: Implement `ChatLiveAgentCarousel.jsx`**

Create `frontend/src/modules/Chat/ChatLiveAgentCarousel.jsx` following `DESIGN.md` and the spec:
- Header row: `Available Agents` (`text-sm font-semibold text-[#1E293B]`), emerald live count (`● {agents.length} online`), and **side-by-side Previous / Next** icon buttons (`ChevronLeft`, `ChevronRight`, `variant="outline"`, `min-h-11 min-w-11 sm:min-h-9 sm:min-w-9`).
- Horizontal snap carousel (`ref={trackRef}`, `flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto pb-2`, `data-lenis-prevent="true"`):
  - Responsive card width: `isExpanded ? 'w-[85%] sm:w-[82%] lg:w-[48%]' : 'w-[85%] sm:w-[82%]'` with `shrink-0 snap-center sm:snap-start`.
  - Medium-scale `Card` (`rounded-xl border border-[#E2E8F0] bg-white shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col gap-4`):
    - Top: `Avatar` (`size-12`) with `#10B981` online status dot + Name (`text-base font-semibold text-[#1E293B]`) + `Verified Agent` (`ShieldCheck` + `text-xs text-[#64748B]`) + `Online now` emerald status tag.
    - Middle: Match reason (`Home` for `Listing Agent`, `MapPin` for area/specialty) in `text-sm text-[#1E293B]`.
    - Bottom: `Button` (`w-full min-h-11 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold`, `Chat Now`).
- Dot pagination row synced to scroll index.
- Side-by-side footer actions (`grid grid-cols-2 gap-2`):
  - **`Best Match`** (`min-h-11 bg-[#FF8559] hover:bg-[#F07144] text-white font-semibold`)
  - **`Leave a Message`** (`variant="outline"`, `min-h-11 border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F1F5F9] font-semibold`)
- Loading state uses 2 `Skeleton` cards in the same medium proportions.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend; npx vitest run src/modules/Chat/ChatLiveAgentCarousel.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/modules/Chat/ChatLiveAgentCarousel.jsx frontend/src/modules/Chat/ChatLiveAgentCarousel.test.jsx
git commit -m "feat(chat): add high-UX medium-scale ChatLiveAgentCarousel component"
```

---

### Task 5: Frontend Live Chat Service, Consent Handoff Mode & Agent Presence Heartbeat

**Files:**
- Modify: `frontend/src/services/chatService.js`
- Modify: `frontend/src/modules/Chat/ChatHandoffForm.jsx`
- Modify: `frontend/src/modules/Chat/ChatHandoffForm.test.jsx`
- Modify: `frontend/src/components/dashboard/DashboardLayout.jsx`

**Interfaces:**
- Consumes: `/api/chat/live-agents`, `/api/chat/live-handoff`, `/api/chat/live/:inquiryId/messages`, `/api/chat/live/:inquiryId/stream`, `/api/agents/me/presence`
- Produces:
  - `chatService.getLiveAgents({ propertyId, city, district, propertyType })`
  - `chatService.startLiveHandoff(payload)`
  - `chatService.getLiveMessages(inquiryId, liveChatToken)`
  - `chatService.sendLiveMessage(inquiryId, content, liveChatToken)`
  - `chatService.subscribeLiveChat(inquiryId, liveChatToken, { onMessage, onAgentReassigned, onFallbackOffline, onError })`
  - `ChatHandoffForm` supporting `mode="live" | "offline"` and `selectedAgent` prop

- [ ] **Step 1: Add failing test for `ChatHandoffForm` live mode**

Add a test case in `frontend/src/modules/Chat/ChatHandoffForm.test.jsx` verifying that when `mode="live"` and `selectedAgent={{ id: 'a1', name: 'Elena Rossi' }}` are passed, the form shows `"Start Live Chat with Elena Rossi"`, submits to `chatService.startLiveHandoff`, and calls `onLiveConnected(sessionData)` on success.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/modules/Chat/ChatHandoffForm.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement `chatService` live methods, `ChatHandoffForm` live mode, and `DashboardLayout` presence ping**

1. Add `getLiveAgents`, `startLiveHandoff`, `getLiveMessages`, `sendLiveMessage`, and `subscribeLiveChat` (using `EventSource` or `fetch` SSE reader with `liveChatToken` / JWT) to `frontend/src/services/chatService.js`.
2. Update `frontend/src/modules/Chat/ChatHandoffForm.jsx` so:
   - In `mode="live"`, heading shows `"Start Live Chat"` (or `"Chat with {selectedAgent.name}"`), submit button shows `"Start Live Chat"`, calls `chatService.startLiveHandoff(...)`, handles `409 AGENT_UNAVAILABLE` cleanly by offering the `nextBestAgent`, and invokes `onLiveConnected(result)`.
   - In `mode="offline"` (default), preserves existing `"Leave a Message"` / `POST /inquiries` behavior so all existing tests stay green.
3. Update `frontend/src/components/dashboard/DashboardLayout.jsx` to run a quiet `useEffect` interval (every 30s, only when `effectiveRole === 'agent'` and `document.visibilityState === 'visible'`) calling `apiClient.post('/agents/me/presence')` (swallowing network errors silently).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend; npx vitest run src/modules/Chat/ChatHandoffForm.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/services/chatService.js frontend/src/modules/Chat/ChatHandoffForm.jsx frontend/src/modules/Chat/ChatHandoffForm.test.jsx frontend/src/components/dashboard/DashboardLayout.jsx
git commit -m "feat(chat): wire live chat service, live handoff form mode, and agent portal presence ping"
```

---

### Task 6: `ChatWidget` Live Agent Mode Integration & Full Verification

**Files:**
- Modify: `frontend/src/modules/Chat/ChatWidget.jsx`
- Modify: `frontend/src/modules/Chat/ChatWidget.test.jsx`

**Interfaces:**
- Consumes: `ChatLiveAgentCarousel`, `ChatHandoffForm` (`mode="live" | "offline"`), `chatService` live methods, `sessionStorage` key `hsr_live_chat_session`
- Produces: Complete end-to-end AI → Live Agent Carousel → Consent → Live Chat → End Chat flow inside `ChatWidget`

- [ ] **Step 1: Add failing integration tests to `ChatWidget.test.jsx`**

Add tests in `frontend/src/modules/Chat/ChatWidget.test.jsx` covering:
1. Clicking **"Talk to a Licensed Agent"** fetches `chatService.getLiveAgents` and renders `ChatLiveAgentCarousel` when agents are online.
2. When `getLiveAgents` returns `[]`, skips the carousel and opens the offline **Leave a Message** form with `"All agents are currently offline"`.
3. Selecting an agent card → submitting consent switches `ChatWidget` header to `"Live Chat · Elena Rossi"` with `"End Chat"` button; typing a message calls `chatService.sendLiveMessage` (NOT `chatService.streamMessage`); incoming SSE `message` appends the agent's reply live; clicking `"End Chat"` clears `sessionStorage` and returns to AI mode.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run src/modules/Chat/ChatWidget.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Integrate Live Agent Carousel & Live Chat Mode into `ChatWidget.jsx`**

Update `frontend/src/modules/Chat/ChatWidget.jsx`:
- Add state: `livePanelState` (`'idle' | 'carousel' | 'handoff_live' | 'handoff_offline'`), `liveAgents`, `isLoadingAgents`, `selectedLiveAgent`, `liveSession` (restored from `sessionStorage.getItem('hsr_live_chat_session')`), `liveMessages`, `liveConnectionState` (`'connected' | 'reconnecting'`).
- `openHandoff`: calls `chatService.getLiveAgents({ propertyId, city, propertyType })`; if agents exist, opens `ChatLiveAgentCarousel`; if none, opens `ChatHandoffForm` in `mode="offline"` with offline notice.
- When `liveSession` is active:
  - Header displays **`Live Chat · {liveSession.agent?.name || 'Licensed Agent'}`**, green **`● Online`** dot, and **`End Chat`** button.
  - Subscribes via `chatService.subscribeLiveChat(...)` and fetches missed messages via `chatService.getLiveMessages(...)` on mount/reconnect.
  - Handles `agent_reassigned` (updates agent name + inserts friendly notice *"Connecting you with [Name]..."*) and `fallback_offline` (shows saved reference code notice).
  - Composer sends messages exclusively via `chatService.sendLiveMessage(...)` (AI stays paused).
  - Clicking **`End Chat`** closes the stream, clears `sessionStorage`, and returns to AI mode.

- [ ] **Step 4: Run full backend + frontend chat & agent test suites and update graphify**

Run:
```powershell
cd backend; npx vitest run src/services/agentPresence.service.test.ts src/services/agentAvailability.service.test.ts src/services/liveAgentRouting.service.test.ts src/controllers/chatLive.controller.test.ts src/services/chat.service.test.ts
cd ..\frontend; npx vitest run src/modules/Chat/ChatLiveAgentCarousel.test.jsx src/modules/Chat/ChatHandoffForm.test.jsx src/modules/Chat/ChatWidget.test.jsx
cd ..; graphify update .
```
Expected: All tests PASS and graphify index updates cleanly.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/modules/Chat/ChatWidget.jsx frontend/src/modules/Chat/ChatWidget.test.jsx
git commit -m "feat(chat): integrate live agent carousel and in-box live chat mode into ChatWidget"
```
