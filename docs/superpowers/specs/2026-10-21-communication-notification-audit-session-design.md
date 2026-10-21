# Property Listing Inquiry Management: Communication, Notification, Audit, AI Summary & Session Handling — Design Specification

**Date:** 2026-10-21  
**Status:** Validated Design Specification  
**Source Requirement:** [`docs/implementation/CommunicationNotificationAuditAndSessionHandling.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/implementation/CommunicationNotificationAuditAndSessionHandling.md)  
**Architecture Pattern:** Approach A — Relational Extension + In-Process Async Workers + Dual Supabase/Deterministic Fallback  

---

## 1. Purpose, Stakeholders, and Resolved Product Decisions

### 1.1 Purpose
Manage property inquiries from guest submission or registered client live chat through routing, assignment, multi-session communication, follow-up task management, AI client summarization, immutable audit logging, multi-channel notifications, and server/client session lifecycle management.

### 1.2 Stakeholder Role & Permission Matrix

| Capability | Guest / Visitor | Registered Client | Sales Agent | Broker / Admin |
|---|:---:|:---:|:---:|:---:|
| Submit Guest Listing Inquiry | Allowed (rate-limited) | Allowed | Allowed | Allowed |
| Request an Agent & Start Live Chat | Redirects to Sign-In (preserves listing context) | Allowed | N/A | N/A |
| View Inquiry & Message Thread | Confirmation ref only (no history leak by email/ID) | Own inquiries (`client_id`) | Assigned or shared inquiries | All brokerage inquiries |
| Send Chat Message (`requestId` idempotency) | No | Own inquiries | Assigned inquiries | All brokerage inquiries |
| View / Create Staff-Only Internal Notes | Denied | Denied (stripped server-side & RLS) | Assigned inquiries | All brokerage inquiries |
| Manage Follow-up Tasks & Viewings | Denied | Request/view own viewings | Assigned inquiries | All brokerage inquiries |
| Change Business Status (`active` / `inactive`) | Denied | Reopen on reply (if permitted) | Assigned inquiries (reason required) | All brokerage inquiries (reason required) |
| Assign / Reassign Agent | Denied | Denied | Accept/Decline assigned | Assign/Reassign eligible agents |
| Access after Agent Reassignment | N/A | Unchanged | **Previous agent immediately loses read/write/realtime access** | Full access |
| Generate / Review / Correct AI Summary | Denied | Denied (unless explicitly shared) | Assigned inquiries | All brokerage inquiries |
| View Activity Timeline vs. Audit Evidence | Denied | Sanitized client milestones only | Simplified inquiry activity timeline | Full protected Audit Viewer & Export |

### 1.3 Resolved Product Decisions (Section 13)
1. **Phone Channel & Reply Behavior:** Uses Meta WhatsApp Cloud API (`WhatsAppService`), Gmail API (`GmailService`), and In-System Notifications. Guest inquiries keep supplied contact fields marked `contact_verified = false` until verified via authenticated email match or staff verification. Staff reply to guests via logged outbound email/WhatsApp actions recorded on the inquiry timeline.
2. **Routing, Acceptance Timeout & Fallback:** Eligible listing agent (verified via `AgentEligibilityService` and `AgentAvailabilityService`) is assigned first. If the agent is unavailable or does not accept/respond within **15 minutes**, the inquiry enters the **Brokerage Unassigned Queue** (`operational_status = 'unassigned'`). At **30 minutes** unanswered, it escalates to the Broker (`operational_status = 'overdue'`).
3. **Duplicate Handling & Merging:** If an authenticated client (or guest with identical normalized email + listing ID within 24 hours) submits a repeated request for the same listing while an `active` inquiry exists, the system resumes/appends to the existing inquiry rather than creating an unintended duplicate, recording an `inquiry.duplicate_merged` audit event. Staff can also explicitly merge duplicate inquiries while preserving provenance (`merged_into_id`).
4. **Chat Sessions vs. Inquiry Lifecycle:** Business status is `active` or `inactive` (mapped cleanly alongside detailed workflow statuses `new`, `assigned`, `contacted`, `scheduled`, `closed`, `reopened`). Operational status tracks `unassigned`, `awaiting_agent`, `awaiting_client`, `overdue`, or `none`. A **Chat Session** (`waiting`, `ongoing`, `ended`) is a communication episode within an inquiry; ending a chat session, signing out, or generating an AI report never automatically inactivates the inquiry.
5. **AI Client Summary Triggers & Safety:** Triggered by explicit staff action (`POST /api/inquiries/:id/ai-summary`) or upon ending a chat session. Uses a saved snapshot (`covered_from_message_id`, `covered_to_message_id`, `message_count`), cites source message IDs for key facts, marks missing fields `"Not provided"`, isolates transcript text inside `<untrusted_transcript_data>` tags to block prompt injection, never overwrites verified client profile fields or inquiry status, and transitions to `outdated` when new messages arrive.
6. **Web Session Timeouts & Revocation:** Server-enforced **Idle Timeout** is **30 minutes** for Agent/Broker and **60 minutes** for Client; **Absolute Timeout** is **12 hours** for Agent/Broker and **24 hours** for Client. Background presence heartbeats (`X-Session-Heartbeat: true`) update online presence (`60s` TTL) without advancing `last_active_at` idle timers. Logout supports current-session or all-device revocation and broadcasts across browser tabs via `BroadcastChannel('cp_kerby_session_sync')`.
7. **Notifications, Quiet Hours & Active Suppression:** Business hours are `08:00–20:00 Asia/Manila (UTC+8)`. Optional notifications respect user quiet hours; required/escalation notifications bypass quiet hours. External alerts (Email/WhatsApp) are suppressed if the recipient has an active conversation view cursor within the last 30 seconds.

---

## 2. Database Schema & Relational Data Model

Migration file: `backend/src/models/communication_audit_session_migration.sql`

### 2.1 Augmented Tables
1. **`public.inquiries`**:
   - `reference_code TEXT UNIQUE` (e.g., `INQ-2026-8F92A1`, unguessable confirmation reference)
   - `business_status TEXT NOT NULL DEFAULT 'active' CHECK (business_status IN ('active', 'inactive'))`
   - `operational_status TEXT NOT NULL DEFAULT 'awaiting_agent' CHECK (operational_status IN ('unassigned', 'awaiting_agent', 'awaiting_client', 'overdue', 'none'))`
   - `inactive_outcome TEXT CHECK (inactive_outcome IN ('resolved', 'withdrawn', 'closed', 'duplicate', 'no_longer_pursued', 'purchased', 'not_interested', 'unresponsive', 'other'))`
   - `inactive_reason TEXT`
   - `reactivation_reason TEXT`
   - `contact_verified BOOLEAN NOT NULL DEFAULT false`
   - `preferred_reply_channel TEXT DEFAULT 'email' CHECK (preferred_reply_channel IN ('email', 'phone', 'whatsapp', 'chat'))`
   - `source TEXT DEFAULT 'guest_form'` (`guest_form`, `agent_chat_request`, `direct`)
   - `brokerage_id TEXT NOT NULL DEFAULT 'human-shelter-main'`
   - `merged_into_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL`
   - `first_human_response_at TIMESTAMPTZ`
   - `sla_due_at TIMESTAMPTZ`
   - `listing_snapshot JSONB` (preserves title, price, status, and context if listing is unpublished/transferred)
2. **`public.inquiry_messages`**:
   - `session_id UUID REFERENCES public.inquiry_chat_sessions(id) ON DELETE SET NULL`
   - `request_id TEXT UNIQUE` (client-generated idempotency key for safe retries)
   - `delivery_status TEXT NOT NULL DEFAULT 'saved' CHECK (delivery_status IN ('sending', 'saved', 'delivered', 'read', 'failed'))`
   - `read_at TIMESTAMPTZ`
   - `read_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `edited_at TIMESTAMPTZ`
   - `redacted_at TIMESTAMPTZ`
   - `attachments JSONB DEFAULT '[]'::jsonb`

### 2.2 New Domain Tables
1. **`public.inquiry_chat_sessions`** (Communication episodes within an inquiry):
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE`
   - `client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ongoing', 'ended', 'timed_out', 'escalated'))`
   - `started_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `connected_at TIMESTAMPTZ`
   - `ended_at TIMESTAMPTZ`
   - `ended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `end_reason TEXT`
2. **`public.inquiry_follow_up_tasks`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE`
   - `assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `title TEXT NOT NULL`
   - `notes TEXT`
   - `due_at TIMESTAMPTZ NOT NULL`
   - `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue'))`
   - `completed_at TIMESTAMPTZ`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
3. **`public.inquiry_ai_summaries`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE`
   - `session_id UUID REFERENCES public.inquiry_chat_sessions(id) ON DELETE SET NULL`
   - `version INTEGER NOT NULL DEFAULT 1`
   - `generation_status TEXT NOT NULL CHECK (generation_status IN ('pending', 'generating', 'ready', 'failed', 'outdated'))`
   - `review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'reviewed', 'corrected', 'approved'))`
   - `covered_from_message_id TEXT`
   - `covered_to_message_id TEXT`
   - `covered_message_count INTEGER NOT NULL DEFAULT 0`
   - `model_version TEXT NOT NULL`
   - `template_version TEXT NOT NULL DEFAULT 'v1.0'`
   - `sections JSONB NOT NULL` (Structured 6 sections: `clientIdentity`, `propertyRequirements`, `intentAndTimeline`, `questionsAndConcerns`, `agreedNextSteps`, `inquiryStatusSnapshot`, plus `citations` & `inferredVsExplicit` flags)
   - `staff_corrections JSONB`
   - `reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `reviewed_by_name TEXT`
   - `reviewed_at TIMESTAMPTZ`
   - `error_message TEXT`
   - `generated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
4. **`public.audit_events`** (Protected append-only store):
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `event_type TEXT NOT NULL`
   - `actor_id TEXT`
   - `actor_name TEXT`
   - `actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'guest', 'system', 'integration'))`
   - `actor_role TEXT`
   - `brokerage_id TEXT NOT NULL DEFAULT 'human-shelter-main'`
   - `inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL`
   - `target_type TEXT NOT NULL`
   - `target_id TEXT NOT NULL`
   - `outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied'))`
   - `reason TEXT`
   - `correlation_id TEXT NOT NULL`
   - `previous_values JSONB` (redacted of secrets/tokens/passwords)
   - `new_values JSONB` (redacted of secrets/tokens/passwords)
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
5. **`public.notification_jobs` & `public.notification_delivery_attempts` & `public.notification_preferences`**:
   - `notification_jobs`: `id`, `dedupe_key TEXT UNIQUE` (`event_type:record_id:recipient_id:channel`), `event_type`, `inquiry_id`, `recipient_id`, `recipient_Contact`, `channel ('system' | 'email' | 'whatsapp')`, `status ('queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'suppressed')`, `attempt_count`, `max_attempts`, `next_retry_at`, `provider_ref`, `last_error`, `payload JSONB`, `created_at`, `updated_at`.
   - `notification_delivery_attempts`: `id`, `job_id`, `attempt_number`, `status`, `provider_ref`, `sanitized_error`, `created_at`.
   - `notification_preferences`: `user_id PRIMARY KEY`, `email_enabled`, `whatsapp_enabled`, `quiet_hours_start`, `quiet_hours_end`, `timezone`.
6. **`public.auth_sessions`**:
   - `id TEXT PRIMARY KEY`
   - `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `role TEXT NOT NULL`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `idle_expires_at TIMESTAMPTZ NOT NULL`
   - `absolute_expires_at TIMESTAMPTZ NOT NULL`
   - `revoked_at TIMESTAMPTZ`
   - `revoke_reason TEXT`

---

## 3. Service Architecture & API Contracts

### 3.1 Audit Service (`backend/src/services/audit.service.ts`)
- **`AuditService.recordEvent(input)`**: Atomically records immutable audit events. Strips any key matching `/password|token|secret|authorization|cookie|credential/i`. Never invents authenticated user IDs for guests (`actor_type = 'guest'`, `actor_id = null`).
- **`AuditService.getInquiryActivityTimeline(inquiryId, viewerRole)`**: Returns a simplified, user-safe chronological timeline for the Agent/Client workspace (omits internal audit metadata for clients).
- **`AuditService.listAuditEvents(filters, actor)`**: Restricted strictly to `broker` and `admin`. Supports filtering by `inquiryId`, `eventType`, `actorId`, `outcome`, and date range.
- **`AuditService.exportAuditEvents(filters, actor)`**: Authorized JSON/CSV export for Brokers, recording an `audit.exported` event upon execution.
- **Immutability Enforcement**: Any attempt by ordinary users to mutate or delete audit records is rejected with `403 Forbidden` and logs an `audit.tamper_denied` event (`AUD-02`).

### 3.2 Notification Queue & Delivery Engine (`backend/src/services/notification.service.ts`)
- **`NotificationService.enqueueEvent(trigger)`**:
  - Evaluates recipient rules, preferences, quiet hours (`08:00–20:00 Asia/Manila`), and active conversation view suppression (`isViewingConversation(userId, inquiryId)` within 30s).
  - Deduplicates by `dedupe_key = ${eventType}:${recordId}:${recipient}:${channel}` (`NOT-01`, `NOT-02`).
  - Persists job and dispatches via `SystemChannelAdapter`, `GmailChannelAdapter`, or `WhatsAppChannelAdapter`.
  - Re-verifies ownership and access before executing delayed/retried jobs (e.g., if an agent was reassigned while a job was queued, the job for the old agent is cancelled/suppressed).
- **`NotificationService.handleProviderCallback(provider, signature, payload)`**:
  - Verifies webhook signature (`X-Hub-Signature-256` / token), handles idempotent/out-of-order status transitions (`queued` → `sent` → `delivered` / `failed`), and triggers a staff system alert on repeated delivery failures (`attempt_count >= max_attempts`).

### 3.3 AI Client Summary Service (`backend/src/services/inquirySummary.service.ts`)
- **`InquirySummaryService.generateSummary(inquiryId, actor)`**:
  - Captures an immutable snapshot of authorized messages (`covered_from_message_id` to `covered_to_message_id`).
  - Sanitizes and encapsulates messages in `<untrusted_transcript_data>` blocks; system prompt strictly forbids executing commands or changing statuses/permissions from transcript text (`AI-01`).
  - Produces the 6 mandatory sections:
    1. `clientIdentity` (separating `accountData` vs. `conversationStatedData`, plus `contactVerified` boolean)
    2. `propertyRequirements` (related listing, locations, budget, preferences)
    3. `intentAndTimeline` (buying/renting intent, urgency, timeline)
    4. `questionsAndConcerns` (questions, answers, unresolved items)
    5. `agreedNextSteps` (action items, responsible person, follow-up dates, viewing requests)
    6. `inquiryStatusSnapshot` (business status, operational status, assigned agent as of report timestamp)
  - Every extracted fact includes `sourceMessageIds: string[]` and `basis: 'explicit' | 'inferred'`. Missing details are explicitly set to `"Not provided"`.
- **`InquirySummaryService.reviewOrCorrectSummary(inquiryId, summaryId, actor, corrections)`**:
  - Creates a new version or records staff review attribution (`reviewed_by`, `reviewed_at`, `review_status = 'corrected' | 'approved'`) while preserving prior versions (`AI-02`).
- **Automatic Outdated Marking**: Whenever `InquiryService.addMessage` saves a new client or agent message, any `ready` summary on that inquiry transitions to `generation_status = 'outdated'`.

### 3.4 Session Coordinator & Reconnection Service (`backend/src/services/session.service.ts` & `frontend/src/services/sessionCoordinator.js`)
- **Server-Side (`SessionService` + `requireAuth`)**:
  - Tracks session state (`last_active_at`, `idle_expires_at`, `absolute_expires_at`, `revoked_at`).
  - Rejects requests with `401 Session Expired` (`code: 'SESSION_IDLE_EXPIRED' | 'SESSION_ABSOLUTE_EXPIRED' | 'SESSION_REVOKED'`) when idle or absolute limits are exceeded (`SESSION-01`).
  - Requests carrying `X-Session-Heartbeat: true` update presence (`SessionService.recordPresence`) but **do not** extend `idle_expires_at`.
  - Provides `POST /api/auth/logout` (single session) and `POST /api/auth/revoke-all` (all-device revocation).
- **Client-Side (`sessionCoordinator.js` + `AuthContext.jsx`)**:
  - Serializes concurrent token refresh calls via a singleton promise lock.
  - Emits `SESSION_EXPIRING_SOON` warning 2 minutes before idle expiry; on expiry or logout, clears private state/drafts, stops polling/subscriptions, and synchronizes across tabs via `BroadcastChannel` (`SESSION-02`).
  - On reconnection or reauthentication, re-authorizes the active inquiry (`GET /api/inquiries/:id/reconnect?sinceCursor=<timestamp>`) to reconcile uncertain pending messages by `requestId` and fetch missed messages in deterministic order (`CHAT-02`, `SESSION-03`).

### 3.5 REST API Endpoints Added / Upgraded

| Method | Endpoint | Auth / Role | Purpose |
|---|---|---|---|
| `POST` | `/api/inquiries` | `optionalAuth` (Rate-limited) | Guest or authenticated inquiry creation with duplicate detection & reference code. |
| `POST` | `/api/inquiries/request-agent` | `requireAuth` (`client`) | Creates/resumes authenticated live chat request & `inquiry_chat_sessions` episode. |
| `GET` | `/api/inquiries/:id/reconnect` | `requireAuth` | Re-authorizes inquiry after reconnect/reauth; returns missed messages since cursor & reconciles `requestId`s. |
| `POST` | `/api/inquiries/:id/messages` | `requireAuth` | Appends message with `requestId` idempotency, attachment validation, and marks prior AI summary `outdated`. |
| `POST` | `/api/inquiries/:id/messages/read` | `requireAuth` | Records authorized recipient read receipt (`read_at`, `read_by`) and updates active view cursor. |
| `PATCH` | `/api/inquiries/:id/messages/:msgId` | `requireAuth` | Message edit or staff redaction with immutable audit trail. |
| `POST` | `/api/inquiries/:id/chat-session/end` | `requireAuth` | Ends communication episode (`inquiry_chat_sessions`) without inactivating the inquiry. |
| `POST` | `/api/inquiries/:id/status` | `requireAuth` (`agent`, `broker`, `admin`) | Updates `business_status` (`active`/`inactive`) with mandatory outcome/reason and reactivation logging. |
| `POST` | `/api/inquiries/:id/merge` | `requireAuth` (`broker`, `admin`) | Merges duplicate inquiry into target inquiry while preserving full provenance. |
| `GET/POST/PATCH` | `/api/inquiries/:id/tasks` | `requireAuth` (`agent`, `broker`, `admin`) | CRUD for inquiry follow-up tasks; completing/cancelling stops obsolete reminders (`TASK-01`). |
| `POST` | `/api/inquiries/:id/ai-summary` | `requireAuth` (`agent`, `broker`, `admin`) | Generates structured 6-section AI summary from current authorized transcript snapshot. |
| `PATCH` | `/api/inquiries/:id/ai-summary/:summaryId` | `requireAuth` (`agent`, `broker`, `admin`) | Saves staff review approval or corrections with version history. |
| `GET` | `/api/inquiries/:id/timeline` | `requireAuth` | Returns simplified activity timeline for the inquiry. |
| `GET` | `/api/audit-events` | `requireAuth` (`broker`, `admin`) | Broker Audit Viewer query with change-detail inspection. |
| `GET` | `/api/audit-events/export` | `requireAuth` (`broker`, `admin`) | Authorized audit log export. |
| `POST` | `/api/notifications/callbacks/:provider` | Signature verified | Webhook callback handler for email/WhatsApp delivery status updates. |
| `GET/PUT` | `/api/notifications/preferences` | `requireAuth` | User notification channel & quiet-hours preferences. |
| `POST` | `/api/auth/heartbeat` | `requireAuth` | Presence heartbeat (`X-Session-Heartbeat: true`) that does not reset idle expiry. |
| `POST` | `/api/auth/revoke-all` | `requireAuth` | Revokes all active sessions for the user across devices. |

---

## 4. Frontend UI/UX Architecture (`modern-saas-design`)

1. **Public Property View (`PropertyListingView.jsx`)**:
   - **Guest Inquiry Form**: Validates email/phone format, submits to `POST /api/inquiries`, displays unguessable `referenceCode` confirmation without exposing historical thread data.
   - **Request an Agent CTA**: Checks authentication; if unauthenticated, redirects to `/login?returnTo=/properties/:id&action=request-agent` (validated internal path only). Once signed in, invokes `POST /api/inquiries/request-agent` and opens the live chat session modal.
2. **Client Inquiries & Live Chat (`ClientInquiries.jsx`)**:
   - Displays connection status pill (`Connected`, `Reconnecting...`, `Offline`), assigned agent card, listing preview badge, date separators, and message delivery states (`Sending...`, `Saved`, `Read`, `Failed — Retry`).
   - Generates stable UUID `requestId` per outgoing message so network retries never duplicate messages.
   - Sends read receipts only when the thread is actively open and visible.
3. **Agent Inquiry Dossier (`AgentInquiryDetail.jsx`)**:
   - **Header & Status Bar**: Shows Business Status (`Active` / `Inactive`), Operational Condition badge (`Awaiting Agent`, `Awaiting Client`, `Overdue`), and Status Transition modal requiring outcome/reason on inactivation or reactivation.
   - **Follow-up Tasks Card**: Create, complete, and cancel follow-up tasks with due dates.
   - **AI Client Summary Report Panel**: Displays generation state (`Ready`, `Outdated`, `Failed`), the 6 structured sections, `"Not provided"` badges, `Explicit` vs. `Inferred` tags, clickable source message citations, staff edit/correction drawer, and version selector.
   - **Activity Timeline Card**: Simplified chronological history of key inquiry events.
4. **Broker Monitoring & Audit Viewer (`BrokerInquiries.jsx` & `BrokerInquiryDetail.jsx`)**:
   - Queue tabs for `All`, `Active`, `Inactive`, `Unassigned`, `Unanswered`, and `Overdue`, plus SLA first-response metrics (separating system auto-acknowledgements from human agent responses).
   - **Broker Audit Viewer**: Filterable table of protected `audit_events` with a Change-Details inspection drawer (`previous_values` vs. `new_values`, `correlation_id`, `actor_type`) and Authorized Export button.
5. **Session Expiry & Cross-Tab Sync (`AuthContext.jsx` & `sessionCoordinator.js`)**:
   - Non-intrusive expiry warning banner/modal when approaching idle timeout; sign-in prompt on expiry that re-authorizes the active inquiry upon reauthentication.

---

## 5. Verification Strategy (Acceptance Criteria Mapping)

All 21 acceptance criteria (`INQ-01` through `UX-01`) from Section 11 of `CommunicationNotificationAuditAndSessionHandling.md` will be verified via automated Vitest unit, integration, authorization, and E2E journey suites:
- **`test files/backend/controllers/communication-audit-session.test.ts`**: End-to-end backend verification covering `INQ-01`, `INQ-02`, `AUTH-01`, `AUTH-02`, `ROUTE-01`, `CHAT-01`, `CHAT-02`, `ACCESS-01`, `LIFE-01`, `TASK-01`, `AI-01`, `AI-02`, `AUD-01`, `AUD-02`, `NOT-01`, `NOT-02`, `SESSION-01`, `SESSION-02`, `SESSION-03`, and `BROKER-01`.
- **Frontend component & service tests**: Verifying `UX-01`, `SESSION-02`, `CHAT-01`, and portal screens across Client, Agent, and Broker views.
