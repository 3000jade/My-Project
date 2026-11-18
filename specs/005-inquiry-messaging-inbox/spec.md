# Feature Specification: Inquiry Messaging Inbox

**Feature Branch**: `005-inquiry-messaging-inbox`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Design the inquiry page as a messaging page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Split-View Conversation Triage & Reply (Priority: P1)

As a Sales Agent or Broker, I want my inquiry management page to behave as a split-view messaging inbox so I can scan incoming client and AI Concierge conversations on the left, read and reply in the center thread without page reloads, and respond before the 30-minute response SLA expires.

**Why this priority**: Switching between a list table and separate detail pages slows down first-response times and causes SLA breaches on high-intent buyer leads.

**Independent Test**: Open the inquiry inbox, select a conversation in the left conversation list, type a reply in the center composer, and verify the sent message appears immediately in the thread and updates the conversation preview.

**Acceptance Scenarios**:

1. **Given** an agent has assigned inquiries, **When** they open the inquiry page, **Then** they see a searchable conversation list with queue filter tabs (`All`, `Unanswered`, `Overdue SLA`, `AI Chatbot Leads`), source/consent indicators, and SLA countdown pills alongside the active message thread.
2. **Given** an active conversation is selected, **When** the agent types a reply and presses Enter (or clicks Send), **Then** the reply is appended to the thread and becomes the latest snippet in the conversation list.
3. **Given** a user is on a narrow/mobile viewport, **When** they tap a conversation in the list, **Then** the view transitions to the message thread with a clear Back control to return to the conversation list.

---

### User Story 2 - Broker Supervisory Routing & PRC-Verified Assignment (Priority: P2)

As a Supervising Broker, I want to oversee all firm-wide conversations—including unassigned leads and AI Concierge escalations—and assign or reassign them to PRC-verified agents directly from the active conversation header.

**Why this priority**: Unassigned or overdue inquiries must be routed to eligible, PRC-verified agents immediately without forcing the Broker to leave the inbox.

**Independent Test**: Open the Broker inquiry inbox, filter to `Unassigned` or `AI Chatbot`, select a conversation, and assign a verified agent from the inline assignment selector.

**Acceptance Scenarios**:

1. **Given** a Broker is viewing the inquiry inbox, **When** they filter by `Unassigned`, `Overdue SLA`, or `AI Chatbot`, **Then** only matching firm-wide conversations are listed.
2. **Given** an inquiry is selected in the Broker inbox, **When** the Broker opens the assignment selector, **Then** only PRC-verified eligible agents are selectable, and assigning updates the inquiry's consultant immediately.
3. **Given** a Sales Agent is viewing the inquiry inbox, **When** they inspect their queue tabs and thread header, **Then** firm-wide `Unassigned` queues and Broker assignment controls are never visible or accessible.

---

### User Story 3 - Side-by-Side AI Qualification Context & Private Staff Notes (Priority: P3)

As a Sales Agent or Broker, I want a collapsible right-hand context rail showing the client dossier, referenced property, structured AI qualification summary with clickable message citations, and private staff notes so I have full context while replying without ever leaking internal notes to the client.

**Why this priority**: Agents need qualification insights (budget, timeline, readiness) and private internal notes visible while drafting replies, with strict separation between client-facing chat and internal staff notes.

**Independent Test**: Select an inquiry with an AI qualification summary and internal notes, click a citation badge in the right rail to highlight the referenced message in the center thread, and add a new private note in the guarded internal notes panel.

**Acceptance Scenarios**:

1. **Given** an inquiry has an AI qualification summary with message citations, **When** the staff member clicks a citation badge, **Then** the corresponding message in the center thread is scrolled into view and visually highlighted.
2. **Given** a staff member views the internal notes section, **When** they read or add a note, **Then** a persistent privacy notice indicates the note is private and never visible to clients or the AI Concierge, and private notes remain visually separate from the client reply composer.

---

### Edge Cases

- What happens when no conversations match the active search keyword or queue filter? The conversation list displays a clear empty state with a way to reset filters, and the center pane prompts the user to select a conversation.
- What happens when a user presses `Shift+Enter` in the reply composer? A newline is inserted rather than prematurely sending an incomplete message.
- What happens when an inquiry originated from the AI Concierge without explicit privacy consent? The source badge omits the `Consent Verified` indicator so staff can verify consent status before processing.
- What happens when a user's session is unauthorized for Broker-only actions? Firm-wide unassigned queues and quick-assign controls are omitted from Agent views.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The inquiry management page MUST present a 3-pane messaging workspace on desktop viewports (conversation list, active message thread with composer, and collapsible context rail) and a list-to-thread drill-down on mobile viewports.
- **FR-002**: The conversation list MUST support keyword search, queue filter tabs (`All`, `Unanswered`, `Overdue SLA`, `AI Chatbot`, plus Broker-only `Active`, `Inactive`, and `Unassigned`), and display each inquiry's origin (`AI Concierge` vs `Web Form`), RA 10173 consent status, and 30-minute SLA status.
- **FR-003**: Staff members MUST be able to switch between conversations without losing filter state and send client-facing replies directly from the center thread composer (`Enter` to send, `Shift+Enter` for newline).
- **FR-004**: The right-hand context rail MUST display client contact details, referenced property information, the structured AI qualification summary with clickable message citations that highlight the referenced message, and private internal staff notes.
- **FR-005**: Private internal staff notes MUST be visually isolated from the client reply composer and carry an explicit privacy notice stating they are never visible to clients or the AI Concierge.
- **FR-006**: The Broker messaging inbox MUST provide inline consultant assignment restricted to PRC-verified eligible agents, while the Sales Agent messaging inbox MUST restrict visibility to the agent's assigned conversations and omit Broker assignment controls.
- **FR-007**: Deep-link access to full inquiry dossier views (including protected audit trails and appointment scheduling) MUST remain accessible from the conversation header.

### Key Entities

- **Inquiry Conversation**: A client lead thread tied to a property or general request, carrying origin (`ai_chatbot` or form), privacy consent status, SLA timestamps, operational/business status, assigned agent, message history, AI qualification summary, and internal staff notes.
- **Message**: A chronological communication turn within a conversation attributed to client or staff, uniquely identifiable for citation highlighting.
- **AI Qualification Summary**: Structured buyer requirements, timeline, readiness, and next steps synthesized from the conversation, with citation references linking back to source messages.
- **Internal Staff Note**: A confidential staff-only annotation attached to an inquiry, isolated from client-facing channels.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sales Agents and Brokers can locate, select, and send a reply to an inquiry within a single page without full-page navigation, completing the reply flow in under 15 seconds.
- **SC-002**: 100% of `ai_chatbot` escalations display their origin badge, RA 10173 consent verification state, and 30-minute SLA indicator in both the conversation list and active thread header.
- **SC-003**: Clicking any AI summary citation badge scrolls to and highlights the referenced message bubble on 100% of cited messages present in the thread.
- **SC-004**: 0% of Sales Agent inbox views expose firm-wide `Unassigned` queues or Broker quick-assignment controls, and 0% of private internal notes appear in client-facing message bubbles.

## Assumptions

- Existing backend inquiry endpoints and data-access permissions enforce server-side authorization; the messaging inbox enforces matching UI-level role boundaries.
- Initial release updates threads via user actions (send, assign, add note, refresh) and optimistic UI updates; live push/WebSocket streaming is deferred to a subsequent phase.
- Existing full inquiry dossier routes remain available for specialized workflows such as protected audit log inspection and appointment scheduling.
