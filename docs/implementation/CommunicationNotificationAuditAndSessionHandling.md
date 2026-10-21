# Property Listing Inquiry Management — Scope and AI Implementation Workflow

Status: Proposed specification consolidated from stakeholder requirements and research. Current code, database schema, and deployed behavior have not been inspected. Component names describe responsibilities, not mandatory technologies.

## 1. Purpose and stakeholders

Manage property inquiries from guest submission or registered client chat through assignment, communication, follow-up, and closure. Provide broker oversight, accountable history, reliable notifications, and AI-generated client summaries.

| Stakeholder | Responsibilities |
|---|---|
| Client / visitor | Inquire about a listing; registered clients can request an agent and chat. |
| Sales Agent | Respond, manage assigned inquiries, record notes, arrange next steps, and review AI summaries. |
| Broker | Monitor brokerage inquiries, assign/reassign agents, resolve escalations, and review performance. |

## 2. Entry paths

### 2.1 Guest inquiry

- No website account is required.
- Capture name, email and/or phone according to the supported reply channels, question, listing, and source.
- Validate contact formats and apply submission rate limits and abuse controls.
- Create one inquiry and show a reference and confirmation.
- Notify the responsible agent or place it in the brokerage's unassigned queue.
- Keep supplied contact details unverified until verified.
- Define how staff reply to guests through the selected phone/email channel.
- Do not expose private inquiry history through a guessable identifier or matching email alone.

### 2.2 Registered agent chat

- Client clicks Request an Agent on a listing.
- Require registration/sign-in before creating an authenticated chat request.
- Preserve listing context through authentication; use only validated return destinations.
- Create or resume the appropriate inquiry without accidental duplicate requests.
- Route to an eligible agent, notify them, and show waiting/connection state.
- Support an unassigned queue, unavailable-agent fallback, timeout, and broker escalation.
- Identify the assigned agent and relevant listing in the conversation.

Routing policy and email-verification requirements remain decisions to resolve during discovery.

## 3. Inquiry lifecycle

Business status is Active or Inactive.

- Active: ongoing inquiry or outstanding response, viewing, or follow-up.
- Inactive: resolved, withdrawn, closed, duplicate, or no longer pursued; require an outcome/reason.
- Authorized staff change status; record actor, time, reason, and previous/new values.
- Reactivation preserves history and records the reason.
- Ending chat, signing out, or generating a report does not automatically inactivate an inquiry.
- Track operational conditions separately: unassigned, awaiting agent, awaiting client, overdue.
- Preserve listing context when a listing is unpublished, unavailable, or transferred; define the appropriate staff response.
- Define rules for repeated inquiries on the same listing and merging duplicates without losing provenance.

## 4. Client–Agent chat

Provide a familiar, accessible web chat interface:

- Conversation list, listing preview, agent identity, message bubbles, timestamps, pagination, and date separators.
- Message composer, keyboard controls, unread badges, and appropriate focus behavior.
- Sending, saved, failed, and retry states; distinguish server persistence from recipient delivery/read evidence.
- Read receipts only after an authorized recipient actually views the message under the defined rule.
- Optional typing indicators and online presence; these must not imply guaranteed agent availability.
- Protected attachments with allowed types, size limits, validation, and appropriate scanning.
- Responsive desktop/mobile layouts with loading, empty, error, offline, restricted-access, and unavailable-agent states.
- Persist messages server-side and resume history across refreshes and permitted devices.
- Keep staff-only notes separate from client-visible messages and notifications.
- Define message editing/redaction rules and preserve relevant audit history.

One inquiry may contain multiple chat sessions. A session is a communication episode, not the inquiry itself.

## 5. Agent workspace and broker monitoring

### Agent workspace

- Assigned/shared inquiry inbox with search, filters, unread and overdue indicators.
- Listing/client context, conversation history, contact attempts and outcomes.
- Staff-only notes, follow-up tasks, due dates, and reminders.
- Viewing requests and links to existing calendar/viewing functionality.
- Status/outcome controls and AI client-summary review.

### Broker monitoring

- Brokerage-scoped dashboard with Active/Inactive, unassigned, unanswered, and overdue queues.
- Filters by listing, agent, source, status, and date.
- Assign/reassign eligible agents while preserving history and applying updated access.
- Review follow-up completion, escalations, outcomes, and authorized AI summaries.
- Explicitly define whether brokers may read conversation contents and internal notes.
- Define first-response time, business-hours treatment, response targets, and handoff/conversion metrics.
- Separate automatic acknowledgements from human agent responses in reporting.

## 6. AI client summary report

Generate an internal summary after the configured conversation-completion event. Explicit staff action is a proposed initial trigger; inactivity-based generation requires a defined rule.

Include:

1. Client identity/contact details, with account data and conversation-stated details clearly distinguished.
2. Related listing(s), property requirements, preferred locations, budget, and preferences.
3. Buying/renting intent, urgency, and timeline.
4. Main questions, answers, concerns, and unresolved items.
5. Agreed next steps, responsible person, follow-up dates, and viewing requests.
6. Recorded inquiry status as of the report timestamp.

Requirements:

- Use a saved, authorized conversation snapshot and link key facts to source messages.
- Mark absent details Not provided; distinguish explicit facts from inferred suggestions.
- Treat conversation content as data, not instructions to perform actions or change permissions.
- Do not automatically overwrite verified client details or change inquiry status.
- Separate generation states Pending, Generating, Ready, Failed, and Outdated from review state.
- Support retry, staff corrections, review attribution, and version history.
- New messages mark the prior summary outdated under a defined rule.
- Preserve the covered message range, generation time, model/template version, and correction history.
- Agent and authorized Broker access are included; client sharing requires a separate content/access rule.
- Guest inquiries retain their submitted details; summarization of subsequent recorded communications must be explicitly scoped.

## 7. Audit tracking

### Events

Record inquiry creation; assignment/acceptance/decline/reassignment; status and outcome changes; closure/reopening/merge; chat start/end; message edits/redactions; note changes; attachment removal; follow-up/viewing changes; AI generation/review/corrections; exports; access changes; and notification dispatch/failure/retry events.

Keep normal chat contents in message storage rather than duplicating full transcripts into audit logs.

### Event fields and controls

- Unique event ID, server timestamp, event type, actor identity/type, brokerage and affected record IDs.
- Outcome, reason, correlation ID, and relevant previous/new values with sensitive fields excluded.
- Distinguish human, guest, system, and integration actors; do not invent authenticated identity for guests.
- Capture important changes and their audit events atomically.
- Ordinary users cannot alter audit records; corrections generate additional events.
- Separate protected audit evidence from the simplified activity timeline shown to users.
- Define privileged administration, retention, redaction/deletion, exports, and audit-access controls.
- Never log passwords, authentication tokens, raw session credentials, or unnecessary personal data.

### Components

Audit recorder, protected event store, inquiry activity timeline, broker audit viewer, change-details panel, and authorized export controls.

## 8. Notifications

Support in-system, email, and a configured phone channel. SMS, WhatsApp, or calls remain an explicit product decision; a phone number alone does not define delivery behavior.

| Trigger | Recipient | Proposed behavior |
|---|---|---|
| Inquiry/chat request | Assigned agent or unassigned brokerage queue | System plus configured email/phone alerts |
| Agent assignment/reassignment | New agent; relevant client update | Notify ownership changes without exposing internal reasons |
| New chat message | Other authorized participant | System; external alert when appropriate |
| Unanswered request | Agent, then Broker | Timed reminder and escalation |
| Follow-up/viewing due or changed | Relevant participants | Reminder/change notification |
| AI summary ready/failed | Agent; Broker visibility | Ready indicator or actionable failure |
| Inquiry closed/reopened | Relevant participants | Relevant status update |
| Repeated delivery failure | Responsible staff | Actionable system alert |

Requirements:

- One inquiry/event can produce multiple channel deliveries without creating duplicate inquiries.
- Define channel recipients, required versus optional events, preferences, quiet hours, and escalation exceptions.
- Persist a notification job with the business change, then dispatch asynchronously.
- Deduplicate jobs by event, recipient, and channel; handle uncertain provider outcomes without blind repeated sends.
- Track each attempt, provider reference, timestamps, and sanitized errors.
- Record queued/sent/delivered/failed and read only when channel evidence supports it; system read status is separate from email/phone delivery.
- Verify provider callbacks and safely handle duplicate, delayed, or out-of-order updates.
- Apply bounded retries, failure visibility, and recovery/reconciliation where provider status is uncertain.
- Recheck access, ownership, and trigger relevance before delayed dispatch.
- Group frequent chat alerts and avoid unnecessary external alerts while the user is viewing that conversation.
- Use minimal previews and authorized links; do not include internal notes, full AI reports, or sensitive client details in general notifications.

Components: notification centre, unread badge, preferences, template manager, delivery queue/workers, channel adapters, callback handlers, delivery history, and reminder/escalation scheduler.

## 9. Web session handling

### 9.1 Separate session concepts

| Concept | Meaning |
|---|---|
| Authentication session | Client/Agent/Broker signed-in access and its expiry/revocation |
| Chat session | A waiting, ongoing, or ended communication episode |
| Connection state | Connecting, connected, reconnecting, or offline browser transport |
| Inquiry status | Active or Inactive business record |
| Agent availability | Whether an agent accepts new requests |

Logging out or losing connectivity does not delete a conversation, end its business lifecycle, or imply inquiry inactivity.

### 9.2 Authentication lifecycle

- Reuse the website's existing authentication/session system after inspecting it.
- Validate identity, account status, brokerage membership, and record permissions server-side.
- Renew credentials through the supported authentication mechanism; serialize concurrent refresh attempts where needed.
- Configure server-enforced idle and absolute expiry appropriate to each role; values remain to be defined.
- Warn before expiry when possible, then require reauthentication to resume protected activity.
- Background chat heartbeats must not silently count as deliberate user activity for idle-timeout rules.
- On expiry, stop protected reads/sends, close or invalidate realtime subscriptions, clear private UI state, and show a sign-in prompt.
- On logout, revoke the intended session scope server-side, stop subscriptions, and synchronize logout across tabs.
- Provide a defined all-device revocation path and account-disable behavior.
- After reauthentication, reauthorize the inquiry before restoring its view.
- Do not put credentials in URLs or logs. Use secure cookie attributes and CSRF protection where cookie-based architecture applies, following the existing provider's supported design.

### 9.3 Refresh, disconnect, and reconnect

- Recover authorized inquiry history from server storage on refresh.
- Display connection state and never label an unsaved message as delivered.
- Give outgoing messages a stable client-generated request ID and enforce server uniqueness for safe retries.
- After reconnecting, authenticate again and retrieve missed messages from a server cursor with stable ordering/deduplication.
- Show a pending send as uncertain when acknowledgement is lost; reconcile by request ID before resending.
- Limit automatic retry/backoff and offer a manual retry state.
- Multi-tab/device activity must not create duplicate messages, sessions, assignments, or unread counters.
- Clear account-scoped drafts and caches on logout/account switch. Sensitive drafts should not remain in shared-browser persistent storage by default.
- Handle browser sleep, restored tabs, expired credentials, and listing removal gracefully.

### 9.4 Realtime access

- Authorize subscriptions and message actions by inquiry membership and brokerage rules.
- Reevaluate access on logout, account disablement, role changes, and agent reassignment; reject further actions and remove unauthorized subscriptions.
- Use encrypted transport, validate connection origins where applicable, and apply connection/message rate limits.
- Presence uses a bounded heartbeat expiry and is informational; a tab closing must not automatically close the inquiry.
- Define when chat ends and who can end/reopen it; retain the transcript and audit event.

### Components

Authentication adapter, session coordinator, expiry/reauthentication prompt, cross-tab synchronizer, chat connection manager, message acknowledgement/reconciliation service, presence tracker, and access-revocation handler.

## 10. Logical data and service components

Inspect and reuse existing entities before proposing new tables.

- Client/contact profile, guest inquiry contact, listing, brokerage, and agent membership.
- Inquiry and assignment history.
- Conversation/chat sessions, participants, messages, attachments, and read cursors.
- Internal notes, follow-up tasks, viewing links, and activity events.
- AI report versions and review history.
- Notification jobs, delivery attempts, and preferences.
- Protected audit events and existing authentication-session infrastructure.

Keep brokerage and record ownership explicit. Define uniqueness constraints, permitted transitions, pagination, indexes, concurrency rules, and retention. Keep message acknowledgement, notification delivery, and human response metrics separate.

## 11. Acceptance and end-to-end verification

| ID | Required evidence |
|---|---|
| INQ-01 | Guest submission creates one correct listing-linked inquiry and confirmation. |
| INQ-02 | Invalid/spam/repeated submissions are handled without unintended duplicates. |
| AUTH-01 | Registration/sign-in preserves listing context and creates/resumes only the intended request. |
| AUTH-02 | Guests and other clients cannot retrieve private chats, reports, or attachments. |
| ROUTE-01 | Eligible assignment, unavailable-agent queue, timeout, and escalation work. |
| CHAT-01 | Both participants exchange persistent messages with accurate failure/read behavior. |
| CHAT-02 | Lost acknowledgements, refreshes, reconnects, and multiple tabs produce no duplicate messages. |
| ACCESS-01 | Reassignment preserves history and immediately enforces the defined new access rules. |
| LIFE-01 | Inactivation/reopening requires permitted action and preserves reason/history. |
| TASK-01 | Follow-up/viewing changes persist and obsolete reminders stop. |
| AI-01 | Summary reflects its source snapshot, flags missing data, and cannot follow malicious transcript instructions. |
| AI-02 | Failure/retry, review/correction, version history, and outdated state work. |
| AUD-01 | Important successful changes have matching audit events; rolled-back changes have no misleading success event. |
| AUD-02 | Ordinary users cannot alter audit evidence or export unauthorized records. |
| NOT-01 | Required recipients/channels receive one logical alert with separate delivery results. |
| NOT-02 | Duplicate callbacks, delayed jobs, failures, opt-outs/preferences, and reassignment are handled correctly. |
| SESSION-01 | Idle/absolute expiry blocks protected HTTP and realtime actions server-side. |
| SESSION-02 | Logout/account switch clears private state across tabs and prevents continued realtime access. |
| SESSION-03 | Reauthentication restores only authorized context without losing saved history. |
| BROKER-01 | Dashboard filters, overdue queues, summaries, and metrics match underlying authorized data. |
| UX-01 | Key journeys work on mobile and keyboard with accessible labels/focus and complete interface states. |

Run appropriate unit, integration, authorization, and E2E tests. Map every finalized requirement to evidence and record blocked/untested functions explicitly.

## 12. AI implementation phases

### Phase 1 — Read-only discovery

Read reports and project instructions; inspect current code, UI patterns, authentication, authorized Supabase schema/policies, integrations, and migration history. Treat sources/ as read-only. Identify reusable components and evidence-backed gaps; never expose credentials.

### Phase 2 — Finalize requirements

Resolve decisions below. Define role/permission matrix, stories, measurable quality targets, lifecycle transitions, and acceptance criteria. Separate required and deferred capabilities.

### Phase 3 — Design UI/UX, data, and contracts

Produce journeys and annotated screens for guest entry, sign-in return, waiting/chat, agent workspace, broker monitoring, AI report, audit viewer, and notifications. Specify interface states, service/API/event contracts, session lifecycle, data constraints, authorization, and migration plan.

### Phase 4 — Implement a vertical slice, then complete scope

Start with listing → authentication → agent request → assignment → notification → persisted chat → broker visibility. Add the guest path, follow-ups/viewings, AI summaries, audit tools, delivery recovery, and remaining states. Include authorization and audit capture as each feature is built.

### Phase 5 — Verify all module functions

Execute the acceptance matrix, resolve defects, and rerun affected checks. Test realistic disconnects, expirations, role changes, delivery failures, and cross-brokerage denial. Do not claim completion while required behavior is untested or blocked.

### Phase 6 — /learn: what was built

Document actual scope, UI/UX, roles, architecture, database changes, APIs/events, session behavior, integrations, audit/notification design, AI-report behavior, verification evidence, relevant files, limitations, and deferred functions. Distinguish verified facts from assumptions.

## 13. Decisions to resolve before implementation

1. Exact phone channel, recipients, provider, and reply behavior.
2. Listing-agent versus brokerage routing; acceptance timeout and fallback rules.
3. Client contact-field and verification requirements; secure guest-to-account linking.
4. Broker transcript/note access and agent access after reassignment.
5. Duplicate inquiry, chat completion, reopening, and AI-generation triggers.
6. Idle/absolute timeout values, concurrent-device policy, and revocation scope.
7. Notification preferences, business hours, quiet hours, response targets, and escalations.
8. Retention/deletion/export rules, allowed attachments, and AI processing configuration.
9. Existing module boundaries for viewing, calendar, notifications, and authentication.

## 14. Research references

Research supports patterns and controls; it does not prove current implementation coverage.

- [Follow Up Boss: CRM functions and reporting](https://www.followupboss.com/features/overview)
- [Follow Up Boss: team routing and oversight](https://www.followupboss.com/how-it-works/team-leader)
- [Twilio: outbound message delivery states](https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks)
- [Twilio: delivery logging](https://www.twilio.com/docs/messaging/guides/outbound-message-logging)
- [Twilio: webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Zendesk: AI conversation summaries](https://support.zendesk.com/hc/en-us/articles/8037649972634-Summarizing-ticket-comments-using-generative-AI)
- [OWASP: audit/security logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP: file upload controls](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP: web session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: realtime/WebSocket security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
