---
title: High-UX AI Chat & Live Streaming (V2) — Design Specification
date: 2026-11-24
status: draft-for-review
module: 08-ai-inquiry-assisted
approach: Approach 2 — Crisp White Architectural Shell + High-UX Core Bundle + Live Streaming
---

# High-UX AI Chat & Live Streaming (V2) — Design Specification

## 1. Plain-English Overview

This upgrade transforms Human Shelter Realty's public AI Property Concierge (`ChatWidget`) from a compact static teal box into a calm, gallery-like **Architectural SaaS** concierge with live word-by-word streaming, real lookup progress steps, a warm welcome experience, expandable side-panel layout, readable text formatting, 1-tap follow-up chips, and a 1-tap **`+ Compare`** property picker.

### Scope Boundaries

**In Scope:**
- **Crisp White "Architectural" Shell:** Clean white header (`1px` `#E2E8F0` border, teal AI icon badge + online dot, subtle `RA 9646` badge, quiet **New Chat**, **Expand / Collapse**, and **Close** icon buttons), soft `#F8FAFC` message canvas, and a modern rounded composer bar with a calm **`Talk to a Licensed Agent`** footer link.
- **Compact → Expandable Side Panel + Mobile Sheet:** Starts in the bottom-right corner on desktop, expands smoothly with 1 click into a tall right-side concierge panel (`w-xl` max viewport width minus margin, full viewport height minus margin) for comfortable reading of comparison tables and cards, and opens as a full-height slide-up sheet on mobile viewports (`< 640px`).
- **Warm Welcome Screen:** Shown when no visitor messages have been sent yet — displays a friendly greeting (*"How can I help you find your next home?"*), honest RA 9646 notice, and 4 clickable icon prompt cards (adapting automatically between general pages and `/properties/:id` or `/listing/:id` pages). Clears away cleanly as soon as the first message is sent (and returns when **New Chat** is clicked).
- **Live Streaming & Real Lookup Progress (`POST /api/chat/stream`):**
  - Emits real-time Server-Sent Events (`status`, `delta`, `result`, `error`, `done`) over `POST` fetch.
  - Displays live shimmering progress steps via `Trace` / `TraceLine` (*"Checking the home you're viewing..."*, *"Searching published homes..."*, *"Comparing properties side by side..."*, *"Looking up nearby schools, malls & drive times..."*, *"Writing your reply..."*).
  - Streams final reply text word-by-word, with a **Stop** button replacing Send while generating (aborting both browser reader and server upstream completion immediately).
  - Keeps existing `POST /api/chat` intact as a fallback if streaming fails before any text arrives.
- **Readable Safe Text Formatting:** Lightweight pure parser rendering `**bold**` spans and `-` / `*` bullet lists cleanly while escaping/rendering any raw HTML or `<script>` tags as harmless plain text.
- **1-Tap Contextual Follow-Up Chips:** 2–3 relevant next-step pills returned by the server (`followUpSuggestions: string[]`) and rendered directly under the latest AI reply (matching English or Tagalog/Taglish).
- **1-Tap `+ Compare` Picker Bar:** Adds a compact `+ Compare` / `Selected` toggle on every `ChatPropertyCard` (up to 3 properties). When 2–3 properties are selected, a sticky bar slides up above the composer (`2 selected · Compare Now` + clear button) to launch a verified side-by-side comparison in one click.
- **Smart Scroll & Reduced Motion:** Auto-follows incoming streamed text unless the user scrolls up (showing a compact **Jump to latest** button), and respects `prefers-reduced-motion`.

**Explicitly Out of Scope:**
- Direct appointment/calendar booking or database mutations.
- Persisting chat sessions across browser reloads or separate devices.
- Internal agent/broker copilot features.
- Rendering inside `/agent`, `/broker`, `/client`, or `/admin` dashboard portals.

---

## 2. Backend Streaming & Follow-Up Architecture

### Endpoints
1. **Existing `POST /api/chat` (preserved & enriched):**
   - Continues returning `{ success: true, data: ChatResponsePayload, timestamp }`, now including `followUpSuggestions?: string[]` (2–3 contextual follow-up pills).
2. **New `POST /api/chat/stream`:**
   - Protected by the exact same middleware chain: `chatRateLimiter` → `validateBody(chatRequestSchema)` → `sendMessageStream`.
   - Sets SSE headers (`Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`) and flushes headers immediately.
   - Connects `req.on('close', ...)` to an `AbortController` passed into `chatService.generateChatResponseStream(...)` so client disconnects or clicks on **Stop** immediately cancel upstream Groq/xAI requests.

### Stream Event Contract (`text/event-stream`)

| Event | JSON Payload | Purpose |
| :--- | :--- | :--- |
| `status` | `{ step: string, label: string }` | Real-time lookup progress shown in the chat's shimmering `Trace` line. |
| `delta` | `{ text: string }` | Incremental word/chunk text appended live to the active AI message bubble. |
| `result` | `ChatResponsePayload` | Final verified server-side payload (`message`, `cards`, `comparison`, `nearby`, `handoffDraft`, `suggestHandoff`, `handoffReason`, `followUpSuggestions`). |
| `error` | `{ error: string }` | Safe masked error message (never exposes keys, URLs, or stack traces). |
| `done` | `{ stopped?: boolean }` | Terminal stream marker before closing the HTTP response. |

### `ChatService.generateChatResponseStream` Flow
1. Runs the exact same sanitization (`stripPromptInjectionInstructions` on both `user` and `assistant` turns, `'user' | 'assistant'` role allow-list) and 20-second `REQUEST_TIMEOUT_MS` linked with the caller's disconnect `AbortSignal`.
2. If `pageContext?.propertyId` is present, emits `status` (`"Checking the home you're viewing..."`) and fetches the visitor-safe listing via `getPublishedPropertyForChat`.
3. Runs the bounded tool-calling loop (`MAX_TOOL_ROUNDS = 3`):
   - Before each tool call, emits the matching human-friendly `status` event:
     - `search_properties` → `"Searching published homes..."`
     - `compare_properties` → `"Comparing properties side by side..."`
     - `get_nearby_and_commute` → `"Looking up nearby schools, malls & drive times..."`
     - `get_current_property` → `"Checking property details..."`
   - Once the model stops requesting tools (or after round 3), emits `status` (`"Writing your reply..."`) and streams text chunks via `delta` events (using OpenAI-compatible SSE `stream: true` on synthesis passes, or chunking cleanly when a round-0 non-tool answer arrives directly without tools).
   - If round 0 returns HTTP 400 (model rejects tools), runs the existing single-pass grounded search fallback and streams the response with `includeTools: false`.
4. Computes `followUpSuggestions` via a pure deterministic helper in `backend/src/services/chatGuardrails.service.ts` (`buildFollowUpSuggestions({ userQuery, activeProperty, cards, comparison, nearby, suggestHandoff })`) — guaranteeing relevant, non-repetitive English or Tagalog/Taglish chips without extra LLM calls.
5. Emits `result` with the full verified `ChatResponsePayload` and `done`, then ends the response.

---

## 3. Frontend Component Structure & UX Architecture

All new and updated components strictly adhere to `DESIGN.md` (`#0F766E` teal, `#FF6B6B` coral paired strictly with `#1E293B` dark text, `#F8FAFC` alabaster ground, `#FFFFFF` surface, `#E2E8F0` `1px` borders, 8-point spacing scale, standard Tailwind typography `text-xs`/`text-sm`, reduced-motion fallbacks) and `shadcn/SKILL.md` (`flex flex-col gap-*`, `size-*`, `data-icon` inside `Button`, reusing `@/components/ui/*`).

| File | Action | Responsibility |
| :--- | :--- | :--- |
| `backend/src/types/chat.types.ts` | Modify | Add `followUpSuggestions?: string[]` to `ChatResponsePayload` and `ChatStreamEvent` union type. |
| `backend/src/services/chatGuardrails.service.ts` | Modify | Add deterministic `buildFollowUpSuggestions(...)` supporting English and Tagalog/Taglish. |
| `backend/src/services/chat.service.ts` | Modify | Add `generateChatResponseStream(messages, pageContext, callbacks, externalSignal)` reusing shared tool execution, fallback, and guardrail helpers; include `followUpSuggestions` in both JSON and stream responses. |
| `backend/src/controllers/chat.controller.ts` & `backend/src/routes/chat.routes.ts` | Modify | Add `sendMessageStream` controller handler and `POST /api/chat/stream` route behind `chatRateLimiter` + `validateBody(chatRequestSchema)`. |
| `frontend/src/services/chatService.js` | Modify | Preserve `followUpSuggestions` in `normalizeChatResponse` and add `streamMessage(messages, pageContext, { onStatus, onDelta, onResult, signal })` using native `fetch` + `ReadableStream` SSE parsing with automatic fallback to `sendMessage` if the stream fails before any delta arrives. |
| `frontend/src/modules/Chat/ChatMessageText.jsx` | Create | Safe pure React formatter rendering `**bold**` spans and `- ` / `* ` bullet lists without `dangerouslySetInnerHTML` (HTML/script payloads always render as harmless plain text). |
| `frontend/src/modules/Chat/ChatWelcomeView.jsx` | Create | Warm welcome greeting, RA 9646 pill badge, and 4 adaptive icon prompt cards (general pages vs. active listing page). |
| `frontend/src/modules/Chat/ChatPropertyCard.jsx` | Modify | Add optional `isSelectedForCompare`, `compareDisabled`, and `onToggleCompare` props rendering a compact `+ Compare` / `Selected` button alongside `View Home` and `Ask Agent`. |
| `frontend/src/modules/Chat/ChatWidget.jsx` | Modify | Crisp White Architectural shell (`New Chat`, `Expand/Collapse`, `Close`), mobile full-height sheet (`inset-0 sm:inset-auto`), `ChatWelcomeView` when empty, live `Trace`/`TraceLine` shimmer steps, streaming `ChatMessageText`, 1-tap `followUpSuggestions` chips, sticky `+ Compare` bar (`Compare Selected (N)`), smart scroll + `Jump to latest` button, Stop button during streaming, and sleek composer with quiet `Talk to a Licensed Agent` footer link. |

### Shell & Responsive Layout Behavior
- **Compact desktop (`!isExpanded`):** Fixed bottom-right card (`w-96 md:w-md max-w-[calc(100vw-2rem)] h-140 max-h-[80vh] rounded-xl bg-white border border-[#E2E8F0] shadow-xl`).
- **Expanded desktop (`isExpanded`):** Fixed right-side panel (`inset-y-4 right-4 w-xl max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-[#E2E8F0] shadow-xl`), giving comparison tables and property cards generous horizontal and vertical space.
- **Mobile (`< 640px`):** Full-viewport sheet (`inset-0 w-full h-full max-w-none max-h-none rounded-none sm:...`) so typing, scrolling, and the handoff form never clip.

---

## 4. Safety, Cancellation & Error Handling

| Scenario | Expected Behavior |
| :--- | :--- |
| **User clicks Stop mid-stream** | Calls `abortController.abort()`, stops reading SSE, marks the partial reply finalized (keeping any already-typed words), clears shimmer status, and re-enables typing immediately. Server `req.on('close')` aborts upstream fetch. |
| **User clicks New Chat** | Aborts any in-flight stream, clears messages, compare selection, and handoff state, and returns cleanly to `ChatWelcomeView`. |
| **Stream endpoint fails before first chunk** | `chatService.streamMessage` falls back automatically to `chatService.sendMessage` (`POST /api/chat`) once; if both fail, displays a polite retry notice and keeps `Talk to a Licensed Agent` working. |
| **User scrolls up during live typing** | Scroll listener detects distance from bottom (`> 48px`), pauses auto-scroll, and shows a compact **Jump to latest** button to snap back down. |
| **XSS / raw HTML in streamed text** | `ChatMessageText` parses strictly with React text/element nodes (`<strong>`, `<ul>`, `<li>`) — zero `dangerouslySetInnerHTML`, zero script execution. |
| **Comparison bar clicked (`Compare Selected`)** | Sends a clear compare prompt referencing the selected verified property titles/IDs (e.g., `"Compare these properties side by side: <Title 1> (ID: <id1>), <Title 2> (ID: <id2>)"`) so the server runs `compare_properties` directly and clears the tray. |

---

## 5. Verification & Testing Plan

### Backend Automated Tests (Vitest)
- `chatGuardrails.service.test.ts`: Verify `buildFollowUpSuggestions` returns 2–3 contextual English or Tagalog/Taglish chips for search results, comparisons, nearby views, handoff triggers, and active listings.
- `chat.service.test.ts`: Verify `generateChatResponseStream` emits `status` → `delta` → `result` in order, forwards tool progress labels, includes `followUpSuggestions`, handles AbortSignal cancellation cleanly, and preserves round-0 HTTP 400 fallback.

### Frontend Automated Tests (Vitest + React Testing Library)
- `ChatMessageText.test.jsx`: Verify `**bold**`, bullet lists, multi-paragraph formatting, and safe plain-text rendering of `<script>` / HTML payloads.
- `ChatCards.test.jsx`: Verify `+ Compare` toggle button on `ChatPropertyCard` (`Selected` state and disabled state when 3 properties are already picked) and `chatService.streamMessage` SSE parsing + fallback to `sendMessage`.
- `ChatWidget.test.jsx`: Verify Crisp White header controls (`New Chat`, `Expand/Collapse`, `Close`), `ChatWelcomeView` prompt cards (general vs. `/properties/:id`), live `Trace` status shimmer + streamed text + `Stop` button, 1-tap `followUpSuggestions` chips, and `+ Compare` sticky bar triggering a comparison.

### Live Playwright Chromium E2E (`frontend/e2e/ai-property-agent.spec.ts`)
- Desktop: Open chat → verify Warm Welcome Screen → tap prompt card → verify live streamed response + cards → click Expand into side panel → toggle `+ Compare` on 2 cards → click `Compare Selected` → verify comparison table → submit consent-gated RA 10173 handoff.
- Mobile (`375×667`): Open full-height sheet → verify welcome view, footer `Talk to a Licensed Agent`, and handoff form scrollability & submit reachability.
