# High-UX AI Chat & Live Streaming (V2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the public AI Property Concierge into a crisp white Architectural SaaS chat with a warm welcome screen, 1-click expandable right-side panel (and mobile full-height sheet), live SSE word-by-word streaming with real tool progress shimmer (`Trace`), safe bold/bullet text formatting, 1-tap follow-up chips, and a 1-tap `+ Compare` property picker bar.

**Architecture:** The backend extends `chatGuardrails.service.ts` with a deterministic bilingual `buildFollowUpSuggestions` helper and adds a streaming SSE endpoint (`POST /api/chat/stream`) in `chat.service.ts`, `chat.controller.ts`, and `chat.routes.ts` that emits live `status`, `delta`, `result`, `error`, and `done` frames while preserving `POST /api/chat` as a full fallback. The frontend adds `chatService.streamMessage`, pure React formatter `ChatMessageText.jsx`, `ChatWelcomeView.jsx`, `+ Compare` toggle support on `ChatPropertyCard.jsx`, and refactors `ChatWidget.jsx` into the crisp white expandable shell with `Trace` progress, Stop button, smart scroll, follow-up chips, and sticky compare tray.

**Tech Stack:** TypeScript 7, Express 5, Zod 4, Vitest 5 (backend); React 19, React Router 7, Tailwind CSS 4, `shadcn/ui` (`Trace`, `Card`, `Badge`, `Button`, `Input`), Framer Motion, Vitest + React Testing Library, Playwright Chromium (frontend).

**Spec:** `docs/superpowers/specs/2026-11-24-high-ux-ai-chat-design.md`

## Global Constraints

- Follow `DESIGN.md` strictly: `#0F766E` teal, `#FF6B6B` coral paired ONLY with `#1E293B` dark text (NEVER white text on coral), `#F8FAFC` alabaster canvas, `#FFFFFF` crisp white surfaces, `#E2E8F0` hairline borders, 8-point spacing scale (`p-2`, `p-4`, `gap-1`, `gap-2`, `gap-4`), standard Tailwind typography (`text-xs`, `text-sm`), `size-*` for square elements, `flex flex-col gap-*` instead of `space-y-*`, and `prefers-reduced-motion` guards.
- Reuse existing `shadcn/ui` primitives in `frontend/src/components/ui/` (`Trace`, `TraceLine`, `TraceIcon`, `TraceTitle`, `Card`, `Badge`, `Button`, `Input`, `Separator`) and use `data-icon="inline-start"`/`"inline-end"` without sizing classes on icons inside `Button`.
- Preserve ALL existing safety & legal guardrails: RA 9646 disclosures, RA 10173 privacy consent gate, visitor-safe `'client'` allow-list property lookups, `stripPromptInjectionInstructions` on both `user` and `assistant` turns, 20-message / 2,000-char bounds, `chatRateLimiter`, masked upstream errors, and `data-lenis-prevent="true"` on scroll containers.
- Preserve all unrelated local changes in the git working tree; stage only the exact files modified by each task.
- Shell note (Windows PowerShell 5.1): use `; if ($?) { ... }` instead of `&&` when chaining commands.
- After final code changes, run `graphify update .` per `.agents/rules/graphify.md`.

---

## File Structure

| File | Action | Responsibility |
| :--- | :--- | :--- |
| `backend/src/types/chat.types.ts` | Modify | Add `followUpSuggestions?: string[]`, `ChatStreamEvent`, and `ChatStreamCallbacks`. |
| `backend/src/services/chatGuardrails.service.ts` | Modify | Add deterministic bilingual `buildFollowUpSuggestions(...)` helper. |
| `backend/src/services/chatGuardrails.service.test.ts` | Modify | Unit tests for `buildFollowUpSuggestions` (English + Tagalog/Taglish across search, compare, nearby, handoff, active listing). |
| `backend/src/services/chat.service.ts` | Modify | Add `generateChatResponseStream(...)` emitting live `status`, `delta`, and verified `result` events with `AbortSignal` support; include `followUpSuggestions` in both JSON & stream responses. |
| `backend/src/controllers/chat.controller.ts` | Modify | Add `sendMessageStream` SSE controller handler with `req.on('close')` abort wiring and safe masked errors. |
| `backend/src/routes/chat.routes.ts` | Modify | Register `POST /api/chat/stream` behind `chatRateLimiter` and `validateBody(chatRequestSchema)`. |
| `backend/src/services/chat.service.test.ts` | Modify | Unit tests for `generateChatResponseStream` (event sequence, tool statuses, abort cancellation, fallback) and `sendMessageStream` SSE formatting. |
| `frontend/src/services/chatService.js` | Modify | Preserve `followUpSuggestions` and add `streamMessage(messages, pageContext, callbacks)` with native `fetch` SSE reader and automatic fallback to `sendMessage`. |
| `frontend/src/modules/Chat/ChatMessageText.jsx` | Create | Safe pure React formatter rendering `**bold**` spans and bullet lists without `dangerouslySetInnerHTML`. |
| `frontend/src/modules/Chat/ChatMessageText.test.jsx` | Create | Unit tests for bold, bullet lists, multi-paragraph rendering, and XSS `<script>` plain-text safety. |
| `frontend/src/modules/Chat/ChatWelcomeView.jsx` | Create | Warm welcome greeting, RA 9646 pill badge, and 4 adaptive icon prompt cards (general pages vs. active listing page). |
| `frontend/src/modules/Chat/ChatWelcomeView.test.jsx` | Create | Unit tests for general vs. listing-page prompt cards and click callbacks. |
| `frontend/src/modules/Chat/ChatPropertyCard.jsx` | Modify | Add optional `+ Compare` / `Selected` toggle button (`isSelectedForCompare`, `compareDisabled`, `onToggleCompare`). |
| `frontend/src/modules/Chat/ChatCards.test.jsx` | Modify | Add tests for `ChatPropertyCard` compare toggle and `chatService.streamMessage` SSE parsing + fallback. |
| `frontend/src/modules/Chat/ChatWidget.jsx` | Modify | Crisp White Architectural shell (`New Chat`, `Expand/Collapse`, `Close`), mobile full-height sheet, `ChatWelcomeView`, live `Trace` shimmer, streamed `ChatMessageText`, Stop button, 1-tap `followUpSuggestions` chips, sticky `+ Compare` bar, smart scroll + `Jump to latest`, and calm composer footer. |
| `frontend/src/modules/Chat/ChatWidget.test.jsx` | Modify | Expanded integration tests for welcome screen, streaming + Trace + Stop, Expand toggle, New Chat, follow-up chips, and `+ Compare` tray. |
| `frontend/e2e/ai-property-agent.spec.ts` | Modify | Live Playwright Chromium E2E testing Desktop (welcome → live stream → expand → `+ Compare` 2 cards → compare table → handoff) & Mobile `375×667` full-height sheet. |
| `docs/modules/08-ai-inquiry-assisted/INDEX.md` | Modify | Register the V2 High-UX AI Chat design spec & plan in the module registry. |

---

### Task 1: Stream Contracts & Bilingual Follow-Up Suggestions

**Files:**
- Modify: `backend/src/types/chat.types.ts:85-101`
- Modify: `backend/src/services/chatGuardrails.service.ts:1-73`
- Test: `backend/src/services/chatGuardrails.service.test.ts`

**Interfaces:**
- Produces:
  - `ChatResponsePayload.followUpSuggestions?: string[]`
  - `ChatStreamStatusPayload`, `ChatStreamCallbacks` in `backend/src/types/chat.types.ts`
  - `buildFollowUpSuggestions(input: ChatFollowUpInput): string[]` in `backend/src/services/chatGuardrails.service.ts`

- [ ] **Step 1: Write failing tests in `backend/src/services/chatGuardrails.service.test.ts`**

Append to `backend/src/services/chatGuardrails.service.test.ts`:

```ts
import { buildFollowUpSuggestions } from './chatGuardrails.service';

describe('buildFollowUpSuggestions', () => {
  it('returns comparison and budget follow-ups when 2+ cards are returned in English', () => {
    const chips = buildFollowUpSuggestions({
      userQuery: 'Show me condos in Makati under 20M',
      cards: [
        { id: 'p1', title: 'Makati Loft', city: 'Makati', formattedPrice: '₱18M' } as any,
        { id: 'p2', title: 'BGC Suite', city: 'Taguig', formattedPrice: '₱19M' } as any,
      ],
    });
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips.length).toBeLessThanOrEqual(3);
    expect(chips.some((c) => /compare/i.test(c))).toBe(true);
  });

  it('returns Taglish follow-up chips when visitor writes in Tagalog/Taglish', () => {
    const chips = buildFollowUpSuggestions({
      userQuery: 'May 3-bedroom bahay ba kayo sa Alabang?',
      cards: [{ id: 'p1', title: 'Alabang Villa', city: 'Muntinlupa', formattedPrice: '₱24M' } as any],
    });
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips.some((c) => /malapit|mas mura|compare|ibang/i.test(c))).toBe(true);
  });

  it('returns active-listing chips when viewing a property with no cards returned', () => {
    const chips = buildFollowUpSuggestions({
      userQuery: 'Does this have a pool?',
      activeProperty: { id: 'p9', title: 'Alabang Villa' } as any,
    });
    expect(chips).toContain("What's nearby this property?");
  });

  it('returns broader-search suggestions when handoff is suggested for no_matches', () => {
    const chips = buildFollowUpSuggestions({
      userQuery: 'Villas in Batanes under 2M',
      suggestHandoff: true,
      handoffReason: 'no_matches',
    });
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips.some((c) => /featured|broader|other/i.test(c))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/chatGuardrails.service.test.ts`
Expected: FAIL because `buildFollowUpSuggestions` is not exported yet.

- [ ] **Step 3: Update `backend/src/types/chat.types.ts` and `backend/src/services/chatGuardrails.service.ts`**

Add to `backend/src/types/chat.types.ts`:

```ts
export interface ChatStreamStatusPayload {
  step: string;
  label: string;
}

export interface ChatStreamCallbacks {
  onStatus?: (status: ChatStreamStatusPayload) => void;
  onDelta?: (text: string) => void;
}
```
And add `followUpSuggestions?: string[];` onto `ChatResponsePayload`.

Add `buildFollowUpSuggestions` to `backend/src/services/chatGuardrails.service.ts`:

```ts
import type {
  ChatComparisonTable,
  ChatHandoffReason,
  ChatNearbySummary,
  ChatPropertyCard,
  ChatPropertyDetail,
} from '../types/chat.types';

export interface ChatFollowUpInput {
  userQuery: string;
  activeProperty?: ChatPropertyDetail | null;
  cards?: ChatPropertyCard[];
  comparison?: ChatComparisonTable;
  nearby?: ChatNearbySummary;
  suggestHandoff?: boolean;
  handoffReason?: ChatHandoffReason;
}

const TAGALOG_HINT_REGEX =
  /\b(ba|po|kayo|nito|dito|saan|magkano|bahay|presyo|malapit|tawad|baha|binabaha|pwede|meron|mayroon|gusto|hanap|naman)\b/i;

export function isTagalogOrTaglish(text: string): boolean {
  return TAGALOG_HINT_REGEX.test(String(text || ''));
}

export function buildFollowUpSuggestions(input: ChatFollowUpInput): string[] {
  const taglish = isTagalogOrTaglish(input.userQuery);
  const cards = Array.isArray(input.cards) ? input.cards : [];

  if (input.handoffReason === 'no_matches') {
    return taglish
      ? ['Ipakita ang featured homes', 'Maghanap sa ibang lungsod', 'Mas mataas na budget']
      : ['Show featured homes', 'Try a wider budget range', 'Explore Makati or BGC'];
  }

  if (input.comparison && input.comparison.properties.length >= 2) {
    return taglish
      ? ['Ano ang malapit sa unang property?', 'May iba pa bang katulad nito?', 'Paano ang proseso ng pagbili?']
      : ["What's nearby the first property?", 'Show more similar homes', 'How do buying steps work?'];
  }

  if (cards.length >= 2) {
    return taglish
      ? ['I-compare ang top 2 homes', 'May mas mura pa ba?', 'Ano ang malapit sa unang home?']
      : ['Compare the top 2 homes', 'Show lower-priced options', "What's nearby the first home?"];
  }

  if (cards.length === 1) {
    return taglish
      ? ['Ano ang malapit dito?', 'May iba pang katulad nito?', 'Paano ang bank financing?']
      : ["What's nearby this property?", 'Compare with similar listings', 'How does bank financing work?'];
  }

  if (input.nearby) {
    return taglish
      ? ['I-compare sa ibang katulad na home', 'Ano ang key features at dues nito?', 'Paano ang proseso ng pagbili?']
      : ['Compare with similar homes', 'Key features & monthly dues', 'How do buying steps work?'];
  }

  if (input.activeProperty) {
    return taglish
      ? ['Ano ang malapit dito?', 'I-compare sa katulad na bahay', 'Magkano ang monthly dues?']
      : ["What's nearby this property?", 'Compare with similar homes', 'Key features & monthly dues'];
  }

  return taglish
    ? ['Ipakita ang featured homes', 'Homes under ₱20M', 'Condos sa Makati o BGC']
    : ['Show featured homes', 'Homes under ₱20M', 'Condos in Makati or BGC'];
}
```

- [ ] **Step 4: Run test & TypeScript build**

Run: `npm --prefix backend run test -- src/services/chatGuardrails.service.test.ts; if ($?) { npm --prefix backend run build }`
Expected: PASS (all guardrail & follow-up tests pass, 0 TS errors).

- [ ] **Step 5: Commit**

```powershell
git add -- backend/src/types/chat.types.ts backend/src/services/chatGuardrails.service.ts backend/src/services/chatGuardrails.service.test.ts; if ($?) { git commit -m "feat(chat): add stream event types and bilingual follow-up suggestions" -- backend/src/types/chat.types.ts backend/src/services/chatGuardrails.service.ts backend/src/services/chatGuardrails.service.test.ts }
```

---

### Task 2: Backend Live Streaming (`POST /api/chat/stream`) & `ChatService.generateChatResponseStream`

**Files:**
- Modify: `backend/src/services/chat.service.ts`
- Modify: `backend/src/controllers/chat.controller.ts`
- Modify: `backend/src/routes/chat.routes.ts`
- Test: `backend/src/services/chat.service.test.ts`

**Interfaces:**
- Consumes: `ChatStreamCallbacks`, `ChatResponsePayload`, `buildFollowUpSuggestions` from Task 1
- Produces:
  - `ChatService.generateChatResponseStream(messages, pageContext?, callbacks?, externalSignal?): Promise<ChatResponsePayload>`
  - `sendMessageStream` in `backend/src/controllers/chat.controller.ts`
  - `POST /api/chat/stream` in `backend/src/routes/chat.routes.ts`

- [ ] **Step 1: Write failing tests in `backend/src/services/chat.service.test.ts`**

Add tests covering:
1. `generateChatResponseStream` emits `status` events (`checking_active_listing`, `searching_properties`, `writing_reply`), streams `delta` chunks from upstream SSE (`stream: true`) or chunked direct reply, and returns verified `cards` + `followUpSuggestions`.
2. `generateChatResponseStream` respects `externalSignal` abort without throwing unhandled errors after abort.
3. `sendMessageStream` writes `Content-Type: text/event-stream; charset=utf-8`, formats `event: status`, `event: delta`, `event: result`, `event: done`, and emits masked `event: error` on upstream failure (never leaking keys/URLs).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/chat.service.test.ts`
Expected: FAIL because `generateChatResponseStream` and `sendMessageStream` do not exist yet.

- [ ] **Step 3: Implement streaming support in `chat.service.ts`, `chat.controller.ts`, and `chat.routes.ts`**

Key implementation details (zero duplication — refactor shared orchestration inside `ChatService` via an internal `runChatOrchestration(messages, pageContext, callbacks, externalSignal)` called by both `generateChatResponse` and `generateChatResponseStream`):
- Tool progress labels emitted via `callbacks?.onStatus`:
  - Active listing prefetch: `{ step: 'active_listing', label: "Checking the home you're viewing..." }`
  - `get_current_property`: `{ step: 'current_property', label: 'Checking property details...' }`
  - `search_properties`: `{ step: 'search_properties', label: 'Searching published homes...' }`
  - `compare_properties`: `{ step: 'compare_properties', label: 'Comparing properties side by side...' }`
  - `get_nearby_and_commute`: `{ step: 'nearby_lookup', label: 'Looking up nearby schools, malls & drive times...' }`
  - Final text generation: `{ step: 'writing_reply', label: 'Writing your reply...' }`
- Streaming helper `requestStreamingCompletion(...)`:
  - Sends `stream: true` on tool-free synthesis passes (after tools finish or on HTTP 400 fallback) and parses `data: {...}\n\n` OpenAI SSE lines using `response.body.getReader()` + `TextDecoder`, invoking `callbacks.onDelta(chunk)` for every non-empty `choices[0].delta.content`.
  - When a round-0 tool-enabled turn returns direct content without requesting any tools, emits `status: writing_reply` and emits `callbacks.onDelta` in clean word-group chunks so the UI still renders live streaming smoothly without an extra API call.
- Attach `followUpSuggestions: buildFollowUpSuggestions(...)` onto `ChatResponsePayload` for BOTH `generateChatResponse` and `generateChatResponseStream`.
- Link `externalSignal` to the internal `AbortController` (listening to `'abort'` and cleaning up the listener in `finally`).
- In `chat.controller.ts`, `sendMessageStream`:
  - Sets `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`, and calls `res.flushHeaders?.()`.
  - Wires `req.on('close', () => { if (!res.writableEnded) abortController.abort(); })`.
  - Writes SSE frames via helper `writeSseEvent(res, eventName, data)` guarded by `!res.writableEnded`.
  - On catch: if `abortController.signal.aborted`, closes quietly; otherwise logs internally and emits `event: error` with the masked safe message + `event: done`, then `res.end()`.
- In `chat.routes.ts`, register:
  `router.post('/stream', chatRateLimiter, validateBody(chatRequestSchema), sendMessageStream);`

- [ ] **Step 4: Run all backend chat tests & `tsc` build**

Run: `npm --prefix backend run test -- src/schemas/chat.schema.test.ts src/services/chatGuardrails.service.test.ts src/services/chatTools.service.test.ts src/services/chat.service.test.ts; if ($?) { npm --prefix backend run build }`
Expected: PASS (all backend chat tests pass, 0 TS errors).

- [ ] **Step 5: Commit**

```powershell
git add -- backend/src/services/chat.service.ts backend/src/controllers/chat.controller.ts backend/src/routes/chat.routes.ts backend/src/services/chat.service.test.ts; if ($?) { git commit -m "feat(chat): add live SSE streaming endpoint and tool status events" -- backend/src/services/chat.service.ts backend/src/controllers/chat.controller.ts backend/src/routes/chat.routes.ts backend/src/services/chat.service.test.ts }
```

---

### Task 3: Frontend `chatService.streamMessage` & Safe `ChatMessageText.jsx`

**Files:**
- Modify: `frontend/src/services/chatService.js`
- Create: `frontend/src/modules/Chat/ChatMessageText.jsx`
- Create Test: `frontend/src/modules/Chat/ChatMessageText.test.jsx`
- Modify Test: `frontend/src/modules/Chat/ChatCards.test.jsx`

**Interfaces:**
- Consumes: `POST /api/chat/stream` SSE event format (`status`, `delta`, `result`, `error`, `done`) + `POST /api/chat` fallback
- Produces:
  - `chatService.streamMessage(messages, pageContext, { onStatus, onDelta, onResult, signal })` returning normalized `ChatResponsePayload` (with `followUpSuggestions: string[]`)
  - `ChatMessageText({ text })` pure React component

- [ ] **Step 1: Write failing tests (`ChatMessageText.test.jsx` + `streamMessage` tests in `ChatCards.test.jsx`)**

Create `frontend/src/modules/Chat/ChatMessageText.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessageText from './ChatMessageText';

describe('ChatMessageText', () => {
  it('renders bold highlights and bullet lists cleanly', () => {
    render(
      <ChatMessageText
        text={'Here are two options:\n- **Makati Loft** — ₱18,000,000\n- **BGC Suite** — ₱19,500,000'}
      />
    );

    expect(screen.getByText('Here are two options:')).toBeInTheDocument();
    const boldEl = screen.getByText('Makati Loft');
    expect(boldEl.tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders HTML and script payloads strictly as harmless plain text', () => {
    render(<ChatMessageText text={'<script>window.__xss=1</script>**Safe** <img src=x onerror=alert(1)>'} />);

    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText(/<script>window.__xss=1<\/script>/)).toBeInTheDocument();
    expect(screen.getByText('Safe').tagName).toBe('STRONG');
  });
});
```

Add `chatService.streamMessage` tests to `frontend/src/modules/Chat/ChatCards.test.jsx` verifying:
- Parses `event: status`, `event: delta`, and `event: result` frames from a mocked `fetch` `ReadableStream` and returns normalized payload including `followUpSuggestions`.
- Automatically falls back to `chatService.sendMessage` (`POST /api/chat`) if `/api/chat/stream` fails before any `delta` text arrives.
- Re-throws `AbortError` without triggering fallback when aborted via `AbortController`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend run test -- src/modules/Chat/ChatMessageText.test.jsx src/modules/Chat/ChatCards.test.jsx`
Expected: FAIL because `ChatMessageText` and `chatService.streamMessage` do not exist yet.

- [ ] **Step 3: Create `ChatMessageText.jsx` and update `chatService.js`**

Create `frontend/src/modules/Chat/ChatMessageText.jsx`:
- Pure React parser splitting paragraphs and `- ` / `* ` / `• ` / `1. ` list blocks into `<p>` and `<ul><li>` elements (using `flex flex-col gap-2`, zero `space-y-*`, zero `dangerouslySetInnerHTML`).
- Inline parser splitting `**bold**` segments into `<strong>` elements while keeping all other text as literal React text children.

Update `frontend/src/services/chatService.js`:
- Include `followUpSuggestions: Array.isArray(raw?.followUpSuggestions) ? raw.followUpSuggestions.filter((s) => typeof s === 'string' && s.trim()) : []` in `normalizeChatResponse`.
- Add `streamMessage(messages, pageContext, { onStatus, onDelta, onResult, signal } = {})`:
  - Resolves base URL from `apiClient.defaults.baseURL || '/api'` and attaches `Authorization` header if `localStorage.getItem('hsr_auth_token')` or `apiClient.defaults.headers?.common?.Authorization` exists.
  - Calls `fetch(`${baseUrl}/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(payload), signal })`.
  - Reads chunks with `TextDecoder` and splits complete SSE blocks (`\n\n`), dispatching `onStatus`, `onDelta`, and `onResult`.
  - If `signal?.aborted` or error name is `'AbortError'`, re-throws immediately.
  - If an error occurs before any `delta` or `result` was received (and not aborted), falls back once to `chatService.sendMessage(messages, pageContext)`.

- [ ] **Step 4: Run frontend tests**

Run: `npm --prefix frontend run test -- src/modules/Chat/ChatMessageText.test.jsx src/modules/Chat/ChatCards.test.jsx`
Expected: PASS (all tests pass, 0 failures).

- [ ] **Step 5: Commit**

```powershell
git add -- frontend/src/services/chatService.js frontend/src/modules/Chat/ChatMessageText.jsx frontend/src/modules/Chat/ChatMessageText.test.jsx frontend/src/modules/Chat/ChatCards.test.jsx; if ($?) { git commit -m "feat(chat): add SSE streamMessage client and safe ChatMessageText formatter" -- frontend/src/services/chatService.js frontend/src/modules/Chat/ChatMessageText.jsx frontend/src/modules/Chat/ChatMessageText.test.jsx frontend/src/modules/Chat/ChatCards.test.jsx }
```

---

### Task 4: Warm Welcome Screen (`ChatWelcomeView.jsx`) & `+ Compare` Property Card Toggle

**Files:**
- Create: `frontend/src/modules/Chat/ChatWelcomeView.jsx`
- Create Test: `frontend/src/modules/Chat/ChatWelcomeView.test.jsx`
- Modify: `frontend/src/modules/Chat/ChatPropertyCard.jsx`
- Modify Test: `frontend/src/modules/Chat/ChatCards.test.jsx`

**Interfaces:**
- Produces:
  - `ChatWelcomeView({ activeListing, onSelectPrompt, onAskAgent })`
  - `ChatPropertyCard({ property, onAskAgent, onNavigate, isSelectedForCompare, compareDisabled, onToggleCompare })`

- [ ] **Step 1: Write failing tests (`ChatWelcomeView.test.jsx` + compare toggle tests in `ChatCards.test.jsx`)**

Create `frontend/src/modules/Chat/ChatWelcomeView.test.jsx`:
- Renders warm greeting (*"How can I help you find your next home?"*), honest RA 9646 disclosure badge/copy (*"not a PRC-licensed broker"*), and 4 general prompt cards (`Homes under ₱20M`, `Featured homes`, `Condos in Makati or BGC`, `How buying works`); clicking a card invokes `onSelectPrompt` with its prompt text.
- When `activeListing` is provided, renders listing-specific prompt cards (`What's nearby?`, `Compare similar homes`, `Key specs & monthly dues`, `Ask an agent about this`); clicking `Ask an agent about this` invokes `onAskAgent(activeListing)`.

Add test to `ChatCards.test.jsx`:
- When `onToggleCompare` is provided on `ChatPropertyCard`, renders `+ Compare` button (switching to `Selected` with `aria-pressed="true"` when `isSelectedForCompare` is true, and disabled when `compareDisabled && !isSelectedForCompare`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend run test -- src/modules/Chat/ChatWelcomeView.test.jsx src/modules/Chat/ChatCards.test.jsx`
Expected: FAIL because `ChatWelcomeView` doesn't exist and `ChatPropertyCard` lacks `+ Compare`.

- [ ] **Step 3: Create `ChatWelcomeView.jsx` and update `ChatPropertyCard.jsx`**

Create `frontend/src/modules/Chat/ChatWelcomeView.jsx`:
- Clean `flex flex-col gap-4` layout inside the soft `#F8FAFC` message area.
- Teal icon badge (`size-10 rounded-xl bg-[#CCFBF1] text-[#0F766E]`), heading `How can I help you find your next home?`, concise RA 9646 note (`Automated AI concierge · Not a PRC-licensed broker (RA 9646)`), and a `grid grid-cols-1 sm:grid-cols-2 gap-2` of 4 clickable white `Card`/button tiles (`border border-[#E2E8F0] hover:border-[#0F766E] rounded-lg p-4 text-left bg-white`) with Lucide icons (`Search`, `Sparkles`, `Building2`, `BookOpen` on general pages; `MapPin`, `GitCompareArrows`, `FileText`, `UserCheck` on listing pages).
- Zero arbitrary pixel values, zero `space-y-*`.

Update `frontend/src/modules/Chat/ChatPropertyCard.jsx`:
- When `onToggleCompare` is passed, render a 3rd compact button in `CardFooter`:
  - `variant={isSelectedForCompare ? 'default' : 'outline'}` `size="sm"` `aria-pressed={Boolean(isSelectedForCompare)}` `disabled={Boolean(compareDisabled && !isSelectedForCompare)}`
  - Shows `<Check data-icon="inline-start" /> Selected` when selected, or `<GitCompareArrows data-icon="inline-start" /> + Compare` when unselected.

- [ ] **Step 4: Run tests**

Run: `npm --prefix frontend run test -- src/modules/Chat/ChatWelcomeView.test.jsx src/modules/Chat/ChatCards.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- frontend/src/modules/Chat/ChatWelcomeView.jsx frontend/src/modules/Chat/ChatWelcomeView.test.jsx frontend/src/modules/Chat/ChatPropertyCard.jsx frontend/src/modules/Chat/ChatCards.test.jsx; if ($?) { git commit -m "feat(chat): add warm ChatWelcomeView prompt cards and + Compare toggle on property cards" -- frontend/src/modules/Chat/ChatWelcomeView.jsx frontend/src/modules/Chat/ChatWelcomeView.test.jsx frontend/src/modules/Chat/ChatPropertyCard.jsx frontend/src/modules/Chat/ChatCards.test.jsx }
```

---

### Task 5: Crisp White Expandable `ChatWidget.jsx`, Live `Trace` Shimmer, Compare Bar, Playwright E2E & Docs

**Files:**
- Modify: `frontend/src/modules/Chat/ChatWidget.jsx`
- Modify: `frontend/src/modules/Chat/ChatWidget.test.jsx`
- Modify: `frontend/e2e/ai-property-agent.spec.ts`
- Modify: `docs/modules/08-ai-inquiry-assisted/INDEX.md`

**Interfaces:**
- Consumes: `chatService.streamMessage`, `ChatMessageText`, `ChatWelcomeView`, `ChatPropertyCard` (`+ Compare`), `ChatComparisonCard`, `ChatNearbyCard`, `ChatHandoffForm`, `@/components/ui/trace` (`Trace`, `TraceLine`, `TraceIcon`, `TraceTitle`)

- [ ] **Step 1: Expand `frontend/src/modules/Chat/ChatWidget.test.jsx` with failing tests**

Cover:
1. Crisp White header renders `AI Property Concierge`, `RA 9646` badge, and `New chat`, `Expand chat` / `Collapse chat`, and `Close chat` buttons.
2. Opening chat with zero user messages shows `ChatWelcomeView` (adaptive on `/properties/:id` with `Currently viewing: ...` strip); clicking a welcome card streams a reply and clears the welcome screen.
3. Live streaming renders `Trace` status shimmer (`"Searching published homes..."`), appends live `delta` text via `ChatMessageText`, displays a `Stop generating` button while streaming (clicking it aborts the stream and keeps partial text), and renders 1-tap `followUpSuggestions` chips once complete.
4. Clicking `+ Compare` on 2 `ChatPropertyCard` items shows sticky `Compare Selected (2)` bar; clicking it sends a comparison request and clears selection.
5. Clicking `New chat` aborts any in-flight stream, resets messages and compare tray, and returns to `ChatWelcomeView`.
6. Preserves existing RA 9646, XSS plain-text safety, 20-message / 2,000-char bounds, `publicView: 'true'`, inline coral `Connect to Licensed Agent` button (dark `#1E293B` text), and error fallback keeping `Talk to a Licensed Agent` reachable.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend run test -- src/modules/Chat/ChatWidget.test.jsx`
Expected: FAIL because `ChatWidget.jsx` still uses the old teal header, static greeting, and non-streaming `sendMessage`.

- [ ] **Step 3: Refactor `frontend/src/modules/Chat/ChatWidget.jsx` and update `INDEX.md`**

Key details in `ChatWidget.jsx`:
- **Crisp White Architectural Shell:**
  - Compact desktop: `w-96 md:w-md max-w-[calc(100vw-2rem)] h-140 max-h-[80vh]`
  - Expanded desktop (`isExpanded`): `fixed inset-y-4 right-4 w-xl max-w-[calc(100vw-2rem)]`
  - Mobile (`< 640px`): `fixed inset-0 sm:inset-auto w-full h-full sm:w-96 ... rounded-none sm:rounded-xl`
  - White header (`bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between gap-2`) with teal `size-10 rounded-full bg-[#0F766E] text-white` icon + green online dot, `AI Property Concierge`, subtle `Badge` (`RA 9646`), and 3 ghost icon buttons: **New chat** (`RotateCcw`), **Expand/Collapse** (`Maximize2`/`Minimize2`, hidden on `< sm`), and **Close** (`X`).
- **Welcome State (`messages.length === 0`):** Renders `<ChatWelcomeView activeListing={currentActiveListing} onSelectPrompt={(prompt) => handleSend(null, prompt)} onAskAgent={(prop) => openHandoff(prop)} />`.
- **Live Streaming & `Trace` Status:**
  - Uses `abortControllerRef` + `chatService.streamMessage(apiMessages, pageContext, { onStatus, onDelta, onResult, signal })`.
  - While `isStreaming && activeStatus`, renders `@/components/ui/trace` (`Trace` → `TraceLine status="running"` → `TraceIcon` + `TraceTitle`) showing live status text!
  - Streams `delta` chunks into the active AI message rendered by `<ChatMessageText text={msg.text} />`.
  - While `isStreaming`, the submit button transforms into a **Stop generating** (`Square` icon) button calling `abortControllerRef.current?.abort()`.
- **1-Tap Follow-Up Chips:** Below the latest finalized AI message (when `!isStreaming && Array.isArray(msg.followUpSuggestions)`), renders clean rounded-full outline pill buttons (`hover:border-[#0F766E] hover:text-[#0F766E]`).
- **Sticky `+ Compare` Bar:** Tracks `selectedCompare` (up to 3 `{ id, title }`). When `selectedCompare.length > 0`, renders a sleek bar above the composer showing `N selected` + `Compare Now` (enabled when `>= 2`, sends `"Compare these properties side by side: ..."` and clears selection) + `Clear` button.
- **Smart Scroll + Jump to Latest:** Tracks `isNearBottom` on scroll (`scrollHeight - scrollTop - clientHeight <= 48`); only auto-scrolls when `isNearBottom` is true, otherwise shows a compact floating **Jump to latest** button.
- **Modern Composer & Calm Footer:** Rounded input bar (`maxLength={2000}`) with Send/Stop button + quiet footer strip underneath with `Talk to a Licensed Agent` link (`onClick={() => openHandoff(currentActiveListing)}`).
- Update `docs/modules/08-ai-inquiry-assisted/INDEX.md` with the 2026-11-24 V2 High-UX design spec row.

- [ ] **Step 4: Update `frontend/e2e/ai-property-agent.spec.ts` and run full verification + live Playwright Chromium E2E**

Update `frontend/e2e/ai-property-agent.spec.ts` to intercept `/api/chat/stream` with real `text/event-stream` (`status` → `delta` → `result` → `done`) and verify:
- Desktop: Welcome view → adaptive `/properties/:id` prompt card → live streamed reply + nearby card → follow-up chip → property cards → Expand side panel → toggle `+ Compare` on 2 cards → click `Compare Now` → side-by-side comparison table → consent-gated RA 10173 handoff.
- Mobile (`375×667`): Full-height sheet → welcome view → `Talk to a Licensed Agent` → scrollable handoff form with reachable submit button.

Run full verification:
```powershell
npm --prefix backend run test -- src/schemas/chat.schema.test.ts src/services/chatGuardrails.service.test.ts src/services/chatTools.service.test.ts src/services/chat.service.test.ts; if ($?) { npm --prefix backend run build }; if ($?) { npm --prefix frontend run test -- src/modules/Chat/ }; if ($?) { npm --prefix frontend run build }
```
Then run Playwright Chromium E2E against `vite preview --port 5179` and verify 2/2 pass!

- [ ] **Step 5: Commit & update `graphify`**

```powershell
git add -- frontend/src/modules/Chat/ChatWidget.jsx frontend/src/modules/Chat/ChatWidget.test.jsx frontend/e2e/ai-property-agent.spec.ts docs/modules/08-ai-inquiry-assisted/INDEX.md; if ($?) { git commit -m "feat(chat): redesign ChatWidget with crisp white expandable shell, live streaming, welcome cards, and compare bar" -- frontend/src/modules/Chat/ChatWidget.jsx frontend/src/modules/Chat/ChatWidget.test.jsx frontend/e2e/ai-property-agent.spec.ts docs/modules/08-ai-inquiry-assisted/INDEX.md }; if ($?) { graphify update . }
```
