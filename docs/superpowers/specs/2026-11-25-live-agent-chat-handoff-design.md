---
title: Live Agent Chat Handoff & Smart Agent Carousel — Design Specification
date: 2026-11-25
status: draft-for-review
module: 08-ai-inquiry-assisted
approach: Option 1 — Reuse Built-In Inquiry Messaging + Smart Auto-Matching + Live Agent Carousel
---

# Live Agent Chat Handoff & Smart Agent Carousel — Design Specification

## 1. Plain-English Overview

This feature upgrades Human Shelter Realty's floating chat box (`ChatWidget`) so visitors — both guests and logged-in clients — can switch smoothly from the AI Property Concierge into a **real-time live chat with a verified, online licensed agent** right inside the same chat box.

Instead of blindly dumping every request into an unassigned inbox, the system checks which qualified agents are actively online right now, ranks them by **area and property-type match** (breaking ties by **least busy**), and shows a clean, medium-scale **horizontal carousel of Live Agent Cards** right inside the chat. Visitors can swipe/scroll through the recommended agents and pick one — or tap **Best Match** to connect immediately.

### Scope Boundaries

**In Scope:**
- **Live Agent Selection Carousel (High-UX, Medium Scale):** Horizontal snap-scrolling card carousel inside `ChatWidget` with left/right arrow controls, dot indicators, side-by-side action buttons, responsive breakpoints (mobile sheet, compact desktop, expanded desktop), and common, familiar labels.
- **In-Box Live Chat Mode (Guests & Logged-In Users):** Switching `ChatWidget` from AI mode to Live Agent mode without forcing guests to create an account (using a private, conversation-scoped guest chat pass stored in browser `sessionStorage`), while logged-in clients use their normal session.
- **Smart Agent Ranking & Eligibility Engine:** Filtering strictly by verified status, non-expired PRC & DHSUD credentials, *Available* status, Asia/Manila weekly schedule hours, blackout dates, workload capacity, and real-time portal presence — then ranking by listing owner, area/location match, property-type match, and fewest active chats.
- **2-Minute Auto-Pass & Offline Fallback:** Automatically passing the live chat to the next best online agent if the chosen agent doesn't reply within 2 minutes, and switching cleanly to **Leave a Message** (with AI summary attached) when no agents are online.
- **Reuse of Existing Agent Portal Messages:** Agents receive and reply to live chats inside their existing `InquiryMessagingWorkspace` (no separate inbox to learn), plus a quiet 30-second portal presence check-in and optional **Service Areas** / **Property Specialties** tags on agent profiles.

**Explicitly Out of Scope:**
- Voice/video calling or screen sharing.
- Replacing the backend live stream with a third-party paid chat SaaS or Supabase Realtime channels (we reuse the existing `inquiryStream` SSE pipeline).
- Multi-agent group chats (each live chat has one active assigned agent at a time).
- Direct calendar appointment booking inside the chat box.

---

## 2. High-UX & Responsive UI Design (Strictly `DESIGN.md` & `shadcn/ui`)

All components use `DESIGN.md` tokens (`#0F766E` Primary Teal, `#FF8559` Coral with `#FFFFFF` text for primary conversion CTA, `#F8FAFC` alabaster ground, `#FFFFFF` card surface, `#E2E8F0` `1px` borders, 8-point spacing scale, `rounded-xl` cards, `min-h-11` (`44px`) touch targets, and `prefers-reduced-motion` fallbacks) and reuse `shadcn/ui` primitives (`Card`, `Button`, `Badge`, `Avatar`, `Alert`, `Input`, `Checkbox`, `Label`, `Skeleton`) with `lucide-react` icons.

### 2.1 Common, Familiar Labels & Necessary Information Only

Every card and control uses plain, everyday wording and shows only what helps the visitor decide — never internal IDs, raw license numbers, or email addresses:

| Element | Familiar Label / Format | Purpose |
| :--- | :--- | :--- |
| Panel Heading | **`Available Agents`** (with live count, e.g., `3 online`) | Immediate clarity on who can help right now |
| Online Status | **`● Online now`** (`bg-emerald-50 text-emerald-700 border-emerald-200`, dot `#10B981`) | Clear real-time availability signal |
| Trust Cue | **`Verified Agent`** (with `ShieldCheck` icon) | Reassures visitor without cluttering with PRC/DHSUD jargon |
| Match Reason | **`Listing Agent`**, **`BGC · Condos`**, or **`Makati · House & Lot`** | Explains *why* this agent was recommended |
| Card CTA | **`Chat Now`** | Direct, familiar action |
| Panel Footer (Side-by-Side) | **`Best Match`** (Primary Coral `#FF8559` + `#FFFFFF`) & **`Leave a Message`** (Outline `#FFFFFF` + `#1E293B`) | One-tap auto-pick alongside a zero-pressure fallback |
| Live Chat Header | **`Live Chat · [Agent Name]`** + **`● Online`** + **`End Chat`** button | Clear visual switch from AI mode to human mode |
| Auto-Pass Notice | **`Connecting you with another available agent...`** | Reassuring status if the 2-minute timer triggers |
| Offline State | **`All agents are currently offline`** + **`Leave a Message`** form | Honest expectation setting with zero dead ends |

### 2.2 Medium-Scale Card & Carousel Anatomy

- **Card Proportions (Medium Scale):**
  - Generous `p-4` (`16px`) interior padding, `gap-4` (`16px`) vertical rhythm, `rounded-xl` (`12px`) corners, `bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow`.
  - Top row: `size-12` (`48px`) circular `Avatar` with bottom-right `size-3` `#10B981` online dot + Agent Name (`text-base font-semibold text-[#1E293B]`) + `Verified Agent` muted subtitle (`text-xs text-[#64748B]`).
  - Middle row: Clean match summary (`MapPin` + Area, `Building2` + Property Type, or `Home` + `Listing Agent`) in `text-sm text-[#1E293B]`.
  - Bottom row: Full-width medium `Button` (`min-h-11 text-sm font-semibold`, `#0F766E` teal fill with white text, `Chat Now`) so clicking is effortless.
- **Horizontal Carousel Mechanics:**
  - Scroll container uses `flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2` with `data-lenis-prevent="true"` (so page smooth-scroll never hijacks horizontal swiping) and hidden native scrollbar clutter.
  - **Side-by-Side Carousel Navigation:** Top-right of the `Available Agents` header has side-by-side **Previous (`ChevronLeft`)** and **Next (`ChevronRight`)** `Button` (`variant="outline"`, `size="icon"`, `min-h-11 min-w-11` on mobile, `size-9` on desktop) that smoothly scroll by one card width, disabled cleanly at start/end.
  - **Dot Indicators:** Subtle row of clickable dot indicators centered beneath the cards (`bg-[#0F766E]` active pill, `bg-[#CBD5E1]` inactive dot) synced via `IntersectionObserver` / scroll position.
  - **Side-by-Side Panel Actions:** Directly below the carousel, a 2-column row (`grid grid-cols-2 gap-2`) places **`Best Match`** and **`Leave a Message`** side by side at equal `min-h-11` height. (Note: Inside the selection panel, **`Best Match`** uses the single coral `#FF8559` conversion accent, while individual card buttons use teal `#0F766E` or outline, preventing competing coral CTAs.)
  - **Reduced Motion:** `motion-reduce:scroll-auto` disables smooth-scroll animations when the user prefers reduced motion.

### 2.3 Responsive UI Breakpoints

| Viewport / Widget State | Breakpoint | Carousel Card Width & Visible Count | Navigation & Button Layout |
| :--- | :--- | :--- | :--- |
| **Mobile Full-Sheet** | `< 640px` (`default`) | `w-[85%] shrink-0 snap-center` — **1 full medium card + 15% peek** of the next card to invite horizontal swiping | Touch swipe + side-by-side Prev/Next (`min-h-11 min-w-11`); footer `grid-cols-2 gap-2` side-by-side buttons |
| **Compact Desktop Widget** (`!isExpanded`) | `>= 640px` (`sm:` / `md:`, widget `w-96` / `md:w-md`) | `w-[82%] shrink-0 snap-start` — **1 full medium card + edge peek** of the next card | Side-by-side Prev/Next icon buttons + dot indicators + `grid-cols-2 gap-2` side-by-side footer buttons |
| **Expanded Desktop Side Panel** (`isExpanded`) | `>= 1024px` (`lg:`, widget `w-xl`) | `w-[48%] shrink-0 snap-start` — **2 medium cards side by side**, scrolling horizontally for 3rd+ cards | Side-by-side Prev/Next icon buttons + dot indicators + `grid-cols-2 gap-4` side-by-side footer buttons |

---

## 3. Agent Eligibility, Online Presence & Smart Ranking Engine

### 3.1 Real-Time Online Presence (`AgentPresenceService`)
- New lightweight service `backend/src/services/agentPresence.service.ts` tracks `lastSeenAt` per `agentId` in memory (plus automatic presence mark whenever an agent is connected to `subscribeInquiryStream`).
- **Agent Portal Heartbeat:** While an agent is signed into `/agent/*`, the portal layout sends `POST /api/agents/me/presence` every **30 seconds** (pausing when the tab is hidden or logged out).
- **Online Threshold:** An agent is considered **online** if they have an active stream connection OR checked in within the last **120 seconds**.

### 3.2 Hard Eligibility Gate (Must-Pass)
Before any agent is ranked or shown in the carousel, they must pass ALL checks in `AgentEligibilityService.evaluate(agentId, 'receive_lead')` + two additions:
1. `verification_status === 'VERIFIED'`, `membership_status === 'active'`, `onboarding_status === 'complete'`.
2. Non-empty, non-expired **PRC license** and **DHSUD accreditation** (`Asia/Manila`).
3. `routing_availability === 'available'`.
4. Not on a **blackout date** (`Asia/Manila`).
5. **Within weekly schedule hours** (`Asia/Manila` day-of-week & `start`–`end` window — added to `AgentAvailabilityService.isAvailableForRoutingNow`).
6. Under workload cap (`active_inquiries_count < max_active_inquiries`).
7. **Currently online** (`AgentPresenceService.isOnline(agentId) === true`).

### 3.3 Ranking & Tie-Breaking Ladder (`LiveAgentRoutingService`)
New focused service `backend/src/services/liveAgentRouting.service.ts` scores all online, eligible agents against the visitor's context (`propertyId`, `city`/`district`, `propertyType` inferred from the active listing or recent chat filters):

1. **Listing Owner Bonus (`+100` pts):** Visitor is on a specific property page and this agent is the listing's assigned agent → badge **`Listing Agent`**.
2. **Area / Location Match (`+50` pts):** Agent's `service_areas`, `location_branch`, or active published listings match the target city/district → badge **`[City]`**.
3. **Property Type Match (`+30` pts):** Agent's `property_specialties` or active published listings match the target property type → badge **`[Property Type]`**.
4. **Tie-Breaker — Least Busy:** Agents with equal match scores are sorted by ascending `active_inquiries_count` (fewest active chats first), then by `agent.id` for deterministic ordering.
5. **Output:** Returns the top **5** ranked online agents for the carousel (visitor-safe DTO: `{ id, name, avatar, verified: true, online: true, matchReason, areas, specialties, isListingAgent }`).

### 3.4 Optional Agent Specialty Fields
- Extend agent profile metadata (`agent_v2_metadata` in `supporting_documents` + `shared/types/agent.ts`) with optional `service_areas: string[]` and `property_specialties: string[]` editable from the Agent Portal availability/profile settings.
- If an agent hasn't filled these in yet, `LiveAgentRoutingService` automatically falls back to their `location_branch` and the `city`/`property_type` of their assigned published properties so smart matching works on day one.

---

## 4. Live Connection, Guest Security & 2-Minute Auto-Pass

### 4.1 API Endpoints

| Endpoint | Auth | Purpose |
| :--- | :--- | :--- |
| `GET /api/chat/live-agents` | Public (rate-limited) | Returns ranked online eligible agents (`?propertyId=&city=&propertyType=`) for the carousel, plus `{ onlineCount }`. |
| `POST /api/chat/live-handoff` | Public or JWT | Validates privacy consent (`consentAccepted: true`), creates/resumes an `InquiryItem` (`source: 'ai_chatbot_live'`), assigns the chosen agent (or top ranked), attaches the AI summary, starts the 2-minute reply timer, and returns `{ inquiryId, referenceCode, agent, liveChatToken? }`. |
| `GET /api/chat/live/:inquiryId/stream` | Guest `liveChatToken` or JWT | Subscribes the visitor's `ChatWidget` to live SSE events (`message`, `agent_reassigned`, `fallback_offline`, `chat_closed`) for that single `inquiryId`. |
| `POST /api/chat/live/:inquiryId/messages` | Guest `liveChatToken` or JWT | Appends a visitor message to `InquiryService.addMessage` and pushes it live to the assigned agent's `InquiryMessagingWorkspace`. |
| `GET /api/chat/live/:inquiryId/messages` | Guest `liveChatToken` or JWT | Fetches message history on page refresh or Wi-Fi reconnect so no messages are lost. |
| `POST /api/agents/me/presence` | Agent JWT | Quiet 30-second check-in updating `AgentPresenceService`. |

### 4.2 Guest Chat Pass Security
- For guest visitors, the server signs a short-lived HMAC-SHA256 token (`liveChatToken`, 24-hour expiry) containing `{ inquiryId, email, exp }` using `config.jwtSecret` (never guessable, verified with timing-safe comparison).
- Every guest live endpoint verifies that the token's `inquiryId` matches `:inquiryId`. A guest token can **never** read or send messages to any other inquiry and **never** sees internal agent notes or staff-only AI summaries.
- `ChatWidget` saves `{ inquiryId, liveChatToken, agent, property }` in `sessionStorage` so refreshing the page or browsing to another listing keeps the live chat open seamlessly.

### 4.3 2-Minute Auto-Pass & Offline Fallback
- When `POST /api/chat/live-handoff` assigns an agent, `LiveAgentRoutingService` schedules a **120-second** check (also evaluated lazily if polled) for that `inquiryId`.
- If `firstHumanResponseAt` is still empty after 2 minutes:
  1. Re-queries ranked online eligible agents excluding previously tried `agentId`s.
  2. **If another online agent exists:** Reassigns the inquiry, logs an audit event (`inquiry.live_auto_passed`), notifies the new agent via `inquiryStream` + `NotificationService`, and pushes an `agent_reassigned` SSE event to the visitor's chat box (*"Connecting you with [New Agent Name]..."*).
  3. **If no online agents remain:** Moves the inquiry to `operationalStatus: 'unassigned'`, alerts the brokerage queue, and pushes a `fallback_offline` event to the visitor (*"Our agents are currently assisting other clients. Your conversation is saved (Ref: INQ-...) and an agent will reach out shortly."*).

---

## 5. Error Handling & Edge Cases

| Scenario | Expected Behavior |
| :--- | :--- |
| **Chosen agent goes offline right before click** | `POST /api/chat/live-handoff` re-checks eligibility atomically; if the chosen agent is no longer online/eligible, it returns HTTP `409` with `{ code: 'AGENT_UNAVAILABLE', nextBestAgent }` so the UI smoothly offers a 1-tap switch to the next match or refreshes the carousel. |
| **Wi-Fi drops during live chat** | The chat box shows a calm amber *"Reconnecting..."* banner, retries the live stream with backoff, and calls `GET /api/chat/live/:inquiryId/messages` to fill any missed messages. |
| **Visitor sends message while in Live Chat mode** | Messages route exclusively to `POST /api/chat/live/:inquiryId/messages` — the AI bot stays paused so there are never duplicate bot + human replies. |
| **Visitor clicks "End Chat"** | Clears the active live chat session from `ChatWidget` state & `sessionStorage` (keeping the conversation safely archived in Inquiries) and returns smoothly to AI mode. |
| **Zero agents online when clicking "Talk to a Live Agent"** | Skips the carousel completely and opens the existing consent-gated **Leave a Message** form (`ChatHandoffForm`) with a friendly offline banner. |

---

## 6. File Map & Component Boundaries

| File | Action | Responsibility |
| :--- | :--- | :--- |
| `shared/types/agent.ts` | Modify | Add optional `service_areas?: string[]` and `property_specialties?: string[]` to `AgentProfileDTO`. |
| `backend/src/services/agentPresence.service.ts` | Create | Track real-time agent portal presence (`markOnline`, `markOffline`, `isOnline`, `getOnlineAgentIds`). |
| `backend/src/services/agentAvailability.service.ts` | Modify | Enforce `weekly_schedule` start/end hours in `Asia/Manila` inside `isAvailableForRoutingNow`. |
| `backend/src/services/liveAgentRouting.service.ts` | Create | Filter eligible online agents, score by listing owner / area / property type / least busy, return visitor-safe cards, and manage the 2-minute auto-pass timer. |
| `backend/src/utils/inquiryStream.ts` | Modify | Support visitor subscribers scoped strictly to a single `inquiryId` (`subscribeVisitorInquiryStream`) and push live agent replies & reassignment events to them; mark agents online while subscribed. |
| `backend/src/controllers/chatLive.controller.ts` & `backend/src/routes/chat.routes.ts` | Create / Modify | Wire `GET /api/chat/live-agents`, `POST /api/chat/live-handoff`, `GET /api/chat/live/:inquiryId/stream`, `POST/GET /api/chat/live/:inquiryId/messages`, and HMAC guest token verification. |
| `backend/src/controllers/agent.controller.ts` & `backend/src/routes/agent.routes.ts` | Modify | Add `POST /api/agents/me/presence` heartbeat endpoint and allow updating `service_areas` / `property_specialties`. |
| `frontend/src/modules/Chat/ChatLiveAgentCarousel.jsx` | Create | High-UX medium-scale horizontal snap-scroll carousel of Live Agent Cards, side-by-side Prev/Next & Best Match / Leave a Message buttons, dot indicators, and responsive breakpoints. |
| `frontend/src/modules/Chat/ChatHandoffForm.jsx` | Modify | Support both "Start Live Chat with [Selected Agent / Best Match]" (live handoff) and "Leave a Message" (offline fallback) modes cleanly. |
| `frontend/src/modules/Chat/ChatWidget.jsx` & `frontend/src/services/chatService.js` | Modify | Integrate Live Agent Carousel panel, live chat mode header & messaging stream, `sessionStorage` persistence, reconnect banner, and `End Chat` return to AI mode. |
| `frontend/src/components/dashboard/DashboardLayout.jsx` | Modify | Quiet 30-second presence check-in while an agent is active in the Agent Portal. |

---

## 7. Verification & Testing Plan

### Backend Automated Tests (Vitest)
- `agentPresence.service.test.ts`: Verify 120-second online window, expiration, and explicit offline marking.
- `agentAvailability.service.test.ts`: Verify `weekly_schedule` time-of-day enforcement in `Asia/Manila` alongside blackout dates and capacity caps.
- `liveAgentRouting.service.test.ts`: Verify unverified/expired/offline/over-capacity agents are excluded; verify ranking order (listing owner > area + property type > area > property type > least busy); verify 2-minute auto-pass reassigns to the next online agent and falls back to unassigned queue when none remain.
- `chatLive.controller.test.ts`: Verify HMAC guest token scoping (blocks reading/posting to another inquiry), `409 AGENT_UNAVAILABLE` when a chosen agent drops offline, and live message delivery.

### Frontend Automated Tests (Vitest + React Testing Library)
- `ChatLiveAgentCarousel.test.jsx`: Verify medium-scale card rendering with familiar labels (`Online now`, `Verified Agent`, `Chat Now`), side-by-side `Best Match` / `Leave a Message` and Prev/Next buttons, carousel navigation, and offline state skipping the carousel.
- `ChatWidget.test.jsx`: Verify switching from AI mode → Live Agent Carousel → Consent form → Live Chat mode, sending/receiving live messages, `agent_reassigned` notice, `End Chat` returning to AI mode, and `sessionStorage` recovery after remount.
