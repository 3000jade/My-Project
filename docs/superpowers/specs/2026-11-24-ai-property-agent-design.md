---
title: AI Property Agent (V1) — Design Specification
date: 2026-11-24
status: draft-for-review
module: 08-ai-inquiry-assisted
approach: Option 1 — Smart Receptionist with Live Lookups
---

# AI Property Agent (V1) — Design Specification

## 1. Plain-English Overview

The **AI Property Agent** upgrades Human Shelter Realty's existing public corner chat box (`ChatWidget.jsx`) into a 24/7 front-desk helper for buyers and site visitors.

Instead of relying on a single basic keyword search and returning plain text only, the AI helper:
1. **Knows which home the visitor is currently viewing** on the public site.
2. **Uses live lookup helpers** to filter real published listings, inspect full visitor-safe property details, compare 2–3 properties side by side, and check real nearby places and drive times.
3. **Displays visual mini property cards and neat comparison tables** directly inside chat replies.
4. **Hands off a clean, pre-filled inquiry** to a PRC-licensed agent (attaching the selected property, auto-filling details for signed-in buyers, summarizing buyer preferences, and requiring Data Privacy Act RA 10173 consent).

### Version 1 Scope Boundaries

**In Scope:**
- Page-aware corner chat widget on all public routes (remains hidden on `/agent`, `/broker`, `/client`, and `/admin` portals).
- Multi-criteria natural-language property search across published, visitor-safe listings (city, price range, bedrooms, bathrooms, property type, transaction type, keywords).
- Side-by-side comparison of 2–3 published listings.
- Nearby places (schools, malls, hospitals, transit, highways) and commute estimates using existing `GoogleMapsService` helpers.
- General Philippine home-buying educational guidance with consistent RA 9646 disclosures.
- Structured visual replies: clickable mini property cards, comparison tables, and nearby-places lists.
- Smarter "Connect to Licensed Agent" handoff form into the existing `POST /api/inquiries` pipeline.

**Explicitly Out of Scope (Deferred to Future Versions):**
- Direct appointment/calendar booking or modifying agent schedules.
- Cross-visit persistent chat history across sessions/devices.
- Price negotiation, financing/tax guarantees, or acting as a PRC-licensed real estate broker/salesperson (prohibited under RA 9646).
- Internal agent/broker copilot features (reply drafting, listing copywriting).
- Dedicated full-page AI Home Finder route.

---

## 2. Architecture & Data Flow

### High-Level Flow

```text
Visitor sends message in ChatWidget
   │  (includes conversation window + optional pageContext: { route, propertyId })
   ▼
POST /api/chat  (chatRateLimiter → chatRequestSchema validation → ChatController)
   ▼
ChatService (Tool-Assisted Orchestrator, max 3 lookup rounds per request)
   ├── Tool 1: get_current_property(propertyId)
   │      └─ PropertyService (visitor-safe published lookup only)
   ├── Tool 2: search_properties({ city, propertyType, transactionType, minPrice, maxPrice, beds, baths, search, sortBy })
   │      └─ PropertyService.findProperties(..., 'visitor', undefined)
   ├── Tool 3: compare_properties({ propertyIds: string[] })
   │      └─ Fetches 2–3 visitor-safe published listings and builds aligned comparison rows
   └── Tool 4: get_nearby_and_commute({ propertyId })
          └─ Reads listing nearby metadata + GoogleMapsService.suggestNearbyPlaces & calculateCommuteMatrix
   ▼
Structured Chat Response returned to frontend:
   {
     message: string,
     cards?: ChatPropertyCard[],          // up to 3 verified published properties
     comparison?: ChatComparisonTable,    // 2–3 properties side-by-side
     nearby?: ChatNearbySummary,          // landmarks + commute estimates
     handoffDraft?: ChatHandoffDraft      // pre-extracted property + buyer summary
   }
   ▼
ChatWidget renders reply bubble + cards / comparison table / nearby summary
   │
   └── Visitor clicks "Ask Agent" (on card, banner, or quick action)
         └─ Opens consent-gated Handoff Form (auto-filled for signed-in buyers)
         └─ Submits POST /api/inquiries (source: 'ai_chatbot', consentAccepted: true)
```

### Core Units & Responsibilities

To keep each unit small, isolated, and independently testable:

1. **`backend/src/schemas/chat.schema.ts`**
   - Extends `chatRequestSchema` with an optional `pageContext` object:
     - `route?: string` (max 200 chars)
     - `propertyId?: string` (max 100 chars, trimmed)
   - Preserves strict role allow-listing (`'user' | 'assistant'` only), 2,000-char message cap, and 20-message window cap.

2. **`backend/src/services/chatTools.service.ts` *(New, focused module)***
   - Owns all 4 read-only lookup helpers and their strict visitor-safe DTO projections:
     - `getPublishedPropertyForChat(propertyId)` — returns null if missing or not publicly published; strips all confidential fields (`confidential`, internal broker notes, seller direct contact, lockbox info).
     - `searchPublishedPropertiesForChat(filters)` — wraps `PropertyService.findProperties` with `'visitor'` role, caps results at 3 cards (plus total count), formats clean price/specs/thumbnail fields.
     - `comparePublishedPropertiesForChat(propertyIds)` — fetches up to 3 distinct published listings and produces normalized comparison rows (`Price`, `Location`, `Type`, `Bedrooms`, `Bathrooms`, `Floor Area`, `Lot Area`, `Parking`, `Key Features`).
     - `getPropertyNearbyForChat(propertyId)` — checks the published listing's coordinates/address and calls `GoogleMapsService.suggestNearbyPlaces` and `GoogleMapsService.calculateCommuteMatrix` with a bounded timeout (5 seconds), falling back cleanly if maps data is unavailable.
   - Zero database writes. Every returned property ID is verified against published inventory before reaching the frontend.

3. **`backend/src/services/chat.service.ts`**
   - Coordinates the Groq / xAI chat completion loop with OpenAI-compatible function/tool calling (capped at **3 tool rounds** and a **20-second** overall request timeout).
   - If the active model/provider does not support native tool calling or returns a tool-call error, gracefully falls back to a deterministic single-pass lookup (current listing if `pageContext.propertyId` is set + keyword property search) so the chat never breaks.
   - Keeps `stripPromptInjectionInstructions` sanitization on all user messages and enforces the RA 9646 system prompt rules.
   - Assembles the structured response (`message`, `cards`, `comparison`, `nearby`, `handoffDraft`) directly from **server-verified tool outputs** — never trusting raw model-invented prices, IDs, or image URLs for UI cards.

4. **`backend/src/controllers/chat.controller.ts`**
   - Passes `messages` and `pageContext` to `chatService.generateChatResponse(...)`.
   - Returns `{ success: true, data: { message, cards, comparison, nearby, handoffDraft }, timestamp }`.
   - Continues masking upstream provider keys, URLs, and raw stack traces on errors.

5. **`frontend/src/services/chatService.js`**
   - Updates `sendMessage(messages, pageContext)` to send `{ messages, pageContext }` and return the structured response object `{ message, cards, comparison, nearby, handoffDraft }` (while remaining backwards-compatible if a plain string message is returned).

6. **Frontend Chat UI Modules (`frontend/src/modules/Chat/`)**
   - Keeps `ChatWidget.jsx` lean by splitting visual blocks into small focused components built with existing `shadcn/ui` primitives (`Card`, `Badge`, `Button`, `Input`, `Checkbox`, `Table`, `ScrollArea`, `Alert`) and `DESIGN.md` tokens (`#0F766E` teal, `#FF6B6B` coral, `#1E293B` slate text, `#64748B` muted text, `#E2E8F0` borders):
     - `ChatWidget.jsx` — floating bubble, page-awareness hook (`useLocation()` detecting `/properties/:id` and loading the active listing title/context), conversation state, adaptive quick-action chips.
     - `ChatPropertyCard.jsx` *(New)* — compact card rendered inside AI replies with thumbnail, title, city, formatted price, beds/baths, **View Home** link (`/properties/:id`), and **Ask Agent** action button.
     - `ChatComparisonCard.jsx` *(New)* — compact horizontally scrollable comparison table for 2–3 properties with quick **Ask Agent** actions.
     - `ChatNearbyCard.jsx` *(New)* — compact list of nearby landmarks (school, mall, hospital, transit, highway) and estimated drive times.
     - `ChatHandoffForm.jsx` *(New)* — extracted and upgraded escalation form that:
       - Auto-fills `name`, `email`, and `phone` from `AuthContext` when the visitor is signed in (still editable).
       - Displays the attached property chip when handing off from a listing page or a property card.
       - Sends a clean structured buyer summary (attached `propertyId`, `propertyTitle`, `propertyPrice`, extracted preferences, and recent highlights) to `POST /api/inquiries` with `source: 'ai_chatbot'` and mandatory `consentAccepted: true` (RA 10173).

---

## 3. Page Awareness & Adaptive UX Details

- **Route detection:** Inside `ChatWidget.jsx`, `useLocation()` checks whether the visitor is on `/properties/:id`.
  - When on `/properties/:id`, `ChatWidget` passes `pageContext: { route: pathname, propertyId: id }` with every message and calls `propertyService.getPropertyById(id)` when the chat opens to show a subtle banner under the chat header: `Currently viewing: <Listing Title>` (hiding the banner gracefully if the listing cannot be loaded).
  - When the visitor navigates to another property or back to the homepage, the banner and quick-suggestion buttons update automatically without wiping their current conversation.
- **Adaptive quick buttons:**
  - **General pages:** `Search by budget`, `Featured homes`, `Connect to Agent`
  - **Property detail page:** `What's nearby?`, `Compare similar homes`, `Ask Agent about this`

---

## 4. Safety, Compliance & Error Handling

### Legal & Privacy Guardrails
- **RA 9646 (Real Estate Service Act):** Header subtitle, greeting, and system prompt explicitly disclose that this is an automated AI assistant and not a PRC-licensed real estate broker or accredited salesperson. The AI never negotiates discounts, promises financing/loan approvals, guarantees tax amounts (CGT/DST/transfer taxes), or makes binding commitments.
- **RA 10173 (Data Privacy Act):** No personal contact details are collected or submitted until the visitor explicitly ticks the consent checkbox and submits `ChatHandoffForm`.
- **Visitor-Safe Data Boundary:** All property tools call `PropertyService` in `'visitor'` mode so unpublished drafts, archived listings, seller direct numbers, internal broker notes, and lockbox codes are never fetched or exposed.
- **Server-Verified Cards:** Every `ChatPropertyCard` and `ChatComparisonTable` row is hydrated strictly from server lookup results — the AI model selects which verified listings to highlight, never fabricating prices, URLs, or availability.

### Graceful Failure Behavior

| Failure Scenario | Expected Behavior |
| :--- | :--- |
| **No matching published listings** | AI states honestly that no exact published match was found, suggests loosening one filter (budget/area/bedrooms), and offers the **Connect to Licensed Agent** action. |
| **Unpublished or invalid `propertyId` in `pageContext`** | `getPublishedPropertyForChat` returns `null`; server ignores the ID silently without leaking existence or private data. |
| **Map / nearby lookup timeout or error** | `getPropertyNearbyForChat` catches the error within 5 seconds and returns an empty nearby notice; AI still answers listing facts and notes live distances are temporarily unavailable. |
| **AI provider does not support tool calling / returns malformed tool call** | `ChatService` falls back cleanly to single-pass grounded context (current property + keyword search) and still returns a helpful answer. |
| **AI provider outage / 20s timeout** | Controller returns a safe generic 500 error (zero leaked keys/URLs); `ChatWidget` displays a friendly retry message while keeping the **Connect to Licensed Agent** form fully functional. |
| **Prompt injection / spam attempts** | `chatRateLimiter` throttles floods, `chatRequestSchema` caps length/window and rejects `system` roles, and `stripPromptInjectionInstructions` sanitizes user inputs. |

---

## 5. Verification & Testing Plan

### Backend Automated Tests (Vitest)
- `chatTools.service.test.ts`:
  - `searchPublishedPropertiesForChat` passes structured filters (`city`, `minPrice`, `maxPrice`, `beds`, `propertyType`, `transactionType`) to `PropertyService.findProperties` in `'visitor'` mode and caps output at 3 cards.
  - `getPublishedPropertyForChat` returns `null` for unpublished/missing listings and strips confidential fields.
  - `comparePublishedPropertiesForChat` aligns 2–3 verified listings into normalized comparison rows and ignores invalid/duplicate IDs.
  - `getPropertyNearbyForChat` returns landmarks and commutes on success and degrades gracefully on `GoogleMapsService` errors/timeouts.
- `chat.service.test.ts` & `chat.schema.test.ts`:
  - Validates `pageContext` acceptance and bounds, while still rejecting client-supplied `system` roles.
  - Verifies tool-calling loop caps at 3 rounds, hydrates cards/comparisons strictly from verified tool outputs, falls back safely when tool calling is unsupported, and neutralizes prompt injection strings.

### Frontend Automated Tests (Vitest + React Testing Library)
- `ChatWidget.test.jsx` (expanded):
  - Displays the `Currently viewing: ...` banner and listing-specific quick buttons when rendered on `/properties/:id`.
  - Renders `ChatPropertyCard` with **View Home** and **Ask Agent** actions when `cards` are returned.
  - Renders `ChatComparisonCard` when `comparison` data is returned.
  - Renders `ChatNearbyCard` when `nearby` data is returned.
  - Clicking **Ask Agent** on a property card opens `ChatHandoffForm` with that property attached, pre-fills signed-in buyer info from `AuthContext`, blocks submission until RA 10173 consent is checked, and posts the enriched inquiry payload to `/inquiries`.
  - Keeps the handoff form usable even when `/chat` fails.

### End-to-End Live Walkthrough
- Open a published property listing in the browser, verify page-aware greeting/banner, ask *"What's nearby?"*, ask *"Compare this with condos in Makati under 20M"*, click **Ask Agent** on a returned card, submit with consent checked, and confirm the inquiry arrives in the Inquiries inbox with the attached listing and clean summary.
