# Module 06: Audit Trail & Security Logging (`audit-module`)

**Module Identifier:** `06-audit` / `audit-module`  
**System:** Human Shelter Realty / CP_kerby Modern SaaS Real Estate Platform  
**Status:** Active & Architecture-Verified  
**Standards Conformance:** ISO/IEC/IEEE 29148:2018 (Requirements Engineering), ISO/IEC/IEEE 42010:2022 (Architecture Descriptions), ISO/IEC 25010:2023 (Systems and Software Quality Requirements)  
**Regulatory References:** Republic Act No. 10173 (Philippine Data Privacy Act of 2012), Republic Act No. 9646 (Real Estate Service Act), ISO/IEC 27001:2022 Control 8.15 (Logging)  
**Last Updated:** October 28, 2026  
**Primary Ownership:** `AuditService`, `AuditController`, Security Audit Middleware, PostgreSQL Immutability Triggers/Policies  

---

## 1. Executive Summary & Domain Purpose

The **Audit Trail & Security Logging Module (`audit-module`)** provides the foundational governance, non-repudiation, and regulatory compliance backbone of the Human Shelter Realty platform. It establishes an append-only, tamper-resistant evidentiary record of all administrative interventions, entity state mutations, authentication/session anomalies, broker-agent delegations, and customer communication workflows.

### 1.1 Core Mission & Architectural Tenets
1. **Uncompromising Immutability:** Audit records are strictly append-only. Once an event is written to persistent storage, it cannot be altered, overwritten, or deleted by any authenticated user, broker, or system administrator via public APIs.
2. **Automated Sensitive-Field Redaction:** The ingestion pipeline intercepts every event payload and automatically scrubs secrets, access tokens, credentials, and passwords before persistence, enforcing data minimization and preventing credential exfiltration in logs.
3. **Multi-Store Partitioned Architecture:** Specialized audit event streams are segregated into dedicated relational tables (`audit_events`, `property_audit_log`, `agent_audit_events`, `inquiry_assignment_audit`) with targeted indexes for high-throughput transactional logging and low-latency forensic querying.
4. **Context-Aware Public/Staff Separation:** User-facing activity timelines project sanitized milestone narratives to clients while strictly isolating sensitive staff dossier notes, operational rationale, and system exceptions to authorized brokerage supervisors.
5. **Full Forensic Traceability:** Every audit entry binds a monotonic ISO 8601 UTC timestamp, actor identity/role classification, target entity descriptor, outcome classification (`success`, `failure`, `denied`), and an end-to-end correlation ID linking related cross-module events.

---

## 2. Stakeholders & Role Capability Matrix

The Audit Module governs data visibility and execution permissions across five explicit actor classifications:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       AUDIT ROLE CAPABILITY MATRIX                             │
├─────────────────────────┬──────────────┬──────────────┬──────────────┬─────────┤
│ Capability / Action     │ Public/Guest │ Sales Agent  │ Broker       │ Admin   │
├─────────────────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│ View Public Timeline    │     YES      │     YES      │     YES      │   YES   │
│ View Staff Internal Log │      NO      │ Assigned Only│ Brokerage-Wide│ Global │
│ Access Audit Console    │      NO      │      NO      │ Brokerage-Wide│ Global │
│ Filter by Actor/Entity  │      NO      │      NO      │     YES      │   YES   │
│ Trigger Forensic Export │      NO      │      NO      │ Brokerage-Wide│ Global │
│ Direct Log Mutation     │  RESTRICTED  │  RESTRICTED  │  RESTRICTED  │RESTRICTED│
│ Log Deletion Attempt    │  DENIED(403) │  DENIED(403) │  DENIED(403) │DENIED(403)│
└─────────────────────────┴──────────────┴──────────────┴──────────────┴─────────┘
```

### 2.1 Public & Guest Visitor (`guest` / Anonymous)
- **Permissions:** Zero access to raw audit tables, query endpoints, or internal audit logs.
- **Surface:** Can view high-level public milestones on inquiries they initiated (e.g., "Inquiry Submitted", "Advisor Assigned", "Viewing Scheduled").
- **Audit Emission:** Guest actions (inquiry submission, anonymous viewing booking) generate audit records tagged with `actor_type: 'guest'`, `actor_id: null`, and `actor_name: 'Guest Visitor'`. No artificial authenticated IDs are ever fabricated for guests.

### 2.2 Sales Agent Persona (`agent`)
- **Permissions:** Can view operational activity events directly linked to their assigned listings and assigned inquiries.
- **Restrictions:** Cannot query the global audit log, cannot access peer agent logs, cannot view administrative security events, and cannot trigger bulk audit exports.
- **Audit Emission:** Every status modification, edit proposal, client interaction, and calendar reschedule performed by an agent produces an immutable audit record capturing their `actor_id`, `actor_role: 'agent'`, and state diffs.

### 2.3 Real Estate Broker Persona (`broker`)
- **Permissions:** Full read, query, filter, and export visibility over all audit logs within their brokerage jurisdiction (`brokerage_id`).
- **Capabilities:**
  - Forensic review of agent responsibility transfers and onboarding status transitions.
  - Review of listing modification histories and approval/rejection decisions via `property_audit_log`.
  - Export of compliance audit logs for legal or licensing scrutiny (`GET /api/audit-events/export`).
- **Restrictions:** Cannot mutate or delete audit entries. Any attempt to modify audit records triggers an immediate `audit.tamper_denied` security alert.

### 2.4 System Administrator Persona (`admin`)
- **Permissions:** Global, cross-brokerage read and query privileges across all audit streams.
- **Capabilities:** Forensic review of platform-wide access denials, session security alerts, database schema migrations, and API token revocations.
- **Restrictions:** Identical to brokers regarding immutability: administrators cannot alter or delete historical audit entries via the application or API layers.

### 2.5 System & Integration Actors (`system` / `integration`)
- **Execution:** Automated background tasks (session cleanup cron, AI concierge summary generation, notification delivery workers) emit events with `actor_type: 'system'` or `actor_type: 'integration'`.
- **Database Boundary:** Executes writes using the PostgreSQL `service_role` or security-definer database triggers.

---

## 3. Architectural Component Decomposition

The Audit Module adheres to the three-tier architectural pattern defined in `ARCHITECTURE_MAP.md`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────┤
│                           FRONTEND CONSUMERS                           │
│  ┌─────────────────────────┐               ┌────────────────────────┐  │
│  │   Inquiry Timeline UI   │               │   Broker Audit Console │  │
│  │ (Sanitized Milestones)  │               │   (Forensic Filters)   │  │
│  └────────────┬────────────┘               └───────────┬────────────┘  │
└───────────────┼────────────────────────────────────────┼───────────────┘
                │ HTTP                                   │ HTTP (Broker/Admin)
┌───────────────▼────────────────────────────────────────▼───────────────┐
│                    EXPRESS BACKEND CONTROLLER & ROUTES                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ `audit.routes.ts` (Mount: `/api/audit-events`)                   │  │
│  │ - `GET /`: Authenticated Broker/Admin listing                     │  │
│  │ - `GET /export`: Authenticated Broker/Admin forensic export       │  │
│  │ - `PATCH|DELETE /:id`: Rejection guard (forces 403 Forbidden)     │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ `AuditController` (`backend/src/controllers/audit.controller.ts`) │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Invokes
┌─────────────────────────────────────▼──────────────────────────────────┐
│                             AUDIT SERVICE                              │
│       (`backend/src/services/audit.service.ts` — Core Business Engine)  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. Ingestion & Sanitization Engine (`sanitizeObject`)             │  │
│  │    - Intercepts sensitive keys (`password`, `token`, `secret`,   │  │
│  │      `authorization`, `cookie`, `credential`, `raw_session`)      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 2. Immutability Enforcement Guard (`attemptModifyAuditRecord`)    │  │
│  │    - Intercepts mutations, logs `audit.tamper_denied`, raises 403 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 3. Timeline Projection Service (`getInquiryActivityTimeline`)     │  │
│  │    - Transforms raw audit logs into client/staff specific views  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 4. Filtered Query & Export Service (`listAuditEvents`, `export`) │  │
│  │    - Role authorization, multi-parameter queries, audit export   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Write / Query
┌─────────────────────────────────────▼──────────────────────────────────┐
│                   PERSISTENT RELATIONAL DATA STORES                    │
│                        (Supabase / PostgreSQL)                         │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │ `public.audit_events` │                  │`property_audit_log`   │  │
│  │ (Security & Admin Log)│                  │(Listing Diff Log)     │  │
│  └───────────────────────┘                  └───────────────────────┘  │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │`agent_audit_events`   │                  │`inquiry_assignment_   │  │
│  │(Agent Lifecycle Log)  │                  │ audit` (Triage Log)   │  │
│  └───────────────────────┘                  └───────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Row-Level Security: REVOKE UPDATE, DELETE ON ALL AUDIT TABLES    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Master Functional Requirements (FR) Traceability

The following functional requirements govern the Audit Module within `docs/REQUIREMENTS_SPECIFICATION.md`:

| Requirement ID | Capability Area | Description & Business Rules | Target Actors | Priority | Implementation Status | Verification Method |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **`FR-AU-001`** | Security Audit Trail | Record critical security events (logins, session timeouts, role modifications, transfers, approval overrides) with IP, actor ID, and metadata. | System, Admin | P1 | Implemented | Automated backend integration tests & RLS policy audit. |
| **`FR-AU-002`** | Property Edit Log | Retain granular previous and new value JSON diffs for every property attribute modification, approval, and status change. | Broker, Admin | P2 | Implemented | Stored procedure execution & `property_audit_log` assertions. |
| **`FR-AU-003`** | Agent Status Audit | Record immutable status transitions, accreditation renewals, suspensions, and offboarding events in `agent_audit_events`. | Broker, Admin | P2 | Implemented | Agent status change workflow & audit record verification. |
| **`FR-AU-004`** | Sensitive Sanitization | Automatic redaction of sensitive credentials, tokens, cookies, and secrets from all stored audit payloads via regex filtering. | System | P1 | Implemented | Unit tests with mock credential payloads validating scrubbed output. |
| **`FR-AU-005`** | Immutability Guard | Enforce append-only storage across all audit tables. Revoke `UPDATE` and `DELETE` via RLS; reject API mutation attempts with HTTP 403. | System, All | P1 | Implemented | API tamper test & PostgreSQL permission check. |
| **`FR-AU-006`** | Dual-View Timeline | Project sanitized public activity milestones to clients while isolating staff dossier notes and operational reasons to internal roles. | Client, Agent, Broker | P2 | Implemented | Activity timeline role-projection unit tests. |
| **`FR-AU-007`** | Audit Query Console | High-performance indexed querying of audit events filtered by `brokerageId`, `inquiryId`, `actorId`, `eventType`, and `outcome`. | Broker, Admin | P2 | Implemented | Filter query benchmarks and role-enforcement tests. |
| **`FR-AU-008`** | Forensic Export Engine | Generate authorized audit export bundles for compliance, recording an immutable `audit.exported` entry for self-auditing provenance. | Broker, Admin | P2 | Implemented | Export endpoint integration test and audit log check. |

---

## 5. Non-Functional Quality Requirements (ISO/IEC 25010:2023)

| Requirement ID | Quality Category | Quantitative Target / Measurable Metric | Verification Approach |
| :---: | :--- | :--- | :--- |
| **`NFR-AUD-001`** | **Security: Non-Repudiation** | 100% of audit records must possess immutable server timestamps, actor identification, and correlation IDs; zero unlogged state transitions. | Database reconciliation check between entity state tables and audit records. |
| **`NFR-AUD-002`** | **Security: Data Minimization** | Zero occurrences of plaintext passwords, bearer tokens, or session secrets stored in `previous_values` or `new_values`. | Automated test suite scanning audit payloads against sensitive key regexes. |
| **`NFR-AUD-003`** | **Performance: Ingestion Latency** | Audit event recording must complete in `< 50ms` (p95) to prevent slowing down primary transactional workflows. | Benchmark profiling of `AuditService.recordEvent` under asynchronous and direct insertion. |
| **`NFR-AUD-004`** | **Reliability: Fault Tolerance** | Supabase database connection dropouts must fall back gracefully to in-memory protected buffering without crashing transactional operations. | Fault injection test simulating database unavailability. |

---

## 6. Database Schema & RLS Architecture

The module utilizes four purpose-built database entities in PostgreSQL:

### 6.1 `public.audit_events` (Security & Inquiries Audit Store)
Defined in `backend/src/models/communication_audit_session_migration.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'guest', 'system', 'integration')),
  actor_role TEXT,
  brokerage_id TEXT NOT NULL DEFAULT 'human-shelter-main',
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  reason TEXT,
  correlation_id TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_inquiry_id 
  ON public.audit_events(inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_brokerage 
  ON public.audit_events(brokerage_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor 
  ON public.audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation 
  ON public.audit_events(correlation_id);
```

### 6.2 `public.property_audit_log` (Property Modification Log)
Defined in `backend/src/models/property_edit_approval_migration.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.property_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.property_edit_requests(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(32) NOT NULL 
    CHECK (action_type IN ('CREATED', 'EDIT_APPROVED', 'DIRECT_UPDATE', 'STATUS_CHANGE', 'MEDIA_UPDATE', 'DELETED')),
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  previous_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  audit_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_property_audit_log_property_id 
  ON public.property_audit_log(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_audit_log_actor_id 
  ON public.property_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_property_audit_log_action_type 
  ON public.property_audit_log(action_type);
```

### 6.3 `public.agent_audit_events` (Agent Onboarding & Status Transitions)
Defined in `backend/src/models/agent_audit_events_migration.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.agent_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  prior_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_events_target 
  ON public.agent_audit_events(target_id, created_at DESC);
```

### 6.4 `public.inquiry_assignment_audit` (Lead Triage & Delegation Log)
Defined in `backend/src/models/inquiries_module_migration.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.inquiry_assignment_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inquiry_audit_inquiry_id 
  ON public.inquiry_assignment_audit(inquiry_id);
```

### 6.5 Row-Level Security (RLS) Immutability Architecture

All audit tables strictly enforce PostgreSQL RLS policies that prevent modification and ensure strict role separation:

```sql
-- 1. Enable RLS on all audit tables
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_assignment_audit ENABLE ROW LEVEL SECURITY;

-- 2. Read Policies
CREATE POLICY "Brokers and admins can view audit events."
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))
  );

CREATE POLICY "Audit logs viewable by authorized roles"
  ON public.property_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')) OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND list_agent_key = auth.uid())
  );

CREATE POLICY "Brokers and Admins view audit events"
  ON public.agent_audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('broker', 'admin'))
  );

CREATE POLICY "Staff can view assignment audit."
  ON public.inquiry_assignment_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin'))
  );

-- 3. Hardened Immutability: Revoke mutation privileges
REVOKE UPDATE, DELETE ON public.audit_events FROM authenticated, anon, public;
REVOKE UPDATE, DELETE ON public.property_audit_log FROM authenticated, anon, public;
REVOKE UPDATE, DELETE ON public.agent_audit_events FROM authenticated, anon, public;
REVOKE UPDATE, DELETE ON public.inquiry_assignment_audit FROM authenticated, anon, public;
```

---

## 7. Event Taxonomy & Data Contracts

### 7.1 Standardized Event Types
The module categorizes events into hierarchical domain namespaces:

| Event Namespace | Event Identifier | Typical Actor | Description |
| :--- | :--- | :--- | :--- |
| **Authentication & Session** | `auth.login_success` | Human | Successful user authentication. |
| | `auth.login_failure` | Guest/Human | Failed authentication attempt (invalid password/email). |
| | `auth.session_timeout` | System | Automatic session invalidation after 15 min idle. |
| | `auth.relogin_success` | Human | Inactivity re-authentication restoring session context. |
| **Property Management** | `property.created` | Broker/Admin | New property listing authored. |
| | `property.edit_proposed` | Agent | Agent proposed changes submitted for broker review. |
| | `property.edit_approved` | Broker | Broker approved pending changes; applied diff to inventory. |
| | `property.edit_rejected` | Broker | Broker rejected proposal with written rationale. |
| | `property.status_changed` | Broker/Admin | Listing status transitioned (e.g., `Draft` → `Active`). |
| **Agent Governance** | `agent.invitation_created`| Broker | Single-use invitation generated. |
| | `agent.invitation_claimed`| Agent | Agent claimed invitation token and registered. |
| | `agent.status_changed` | Broker | Agent suspended, reactivated, or offboarded. |
| | `agent.delegation_transfer`| Broker | Property or lead portfolio transferred between agents. |
| **Inquiries & Comms** | `inquiry.created` | Guest/Client | New inquiry submitted. |
| | `inquiry.assigned` | Broker/System | Inquiry assigned to sales agent. |
| | `inquiry.reassigned` | Broker | Inquiry reassigned to another sales agent. |
| | `inquiry.status_changed` | Agent/Broker | Inquiry transitioned (`new` → `contacted` → `scheduled`). |
| | `inquiry.note_added` | Agent/Broker | Internal confidential staff note appended to dossier. |
| | `inquiry.ai_summary_ready`| System | AI summary generated from conversation transcript. |
| **Audit & Security** | `audit.tamper_denied` | System | Attempted modification or deletion of audit records rejected. |
| | `audit.access_denied` | System | Unauthorized role attempted to query audit logs. |
| | `audit.exported` | Broker/Admin | Audit log snapshot exported for forensic inspection. |

### 7.2 Core TypeScript Contracts (`shared/types/inquiry.ts`)

```typescript
export interface AuditEventRecord {
  id: string;
  eventType: string;
  actorId?: string | null;
  actorName?: string;
  actorType: 'human' | 'guest' | 'system' | 'integration';
  actorRole?: string;
  brokerageId: string;
  inquiryId?: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure' | 'denied';
  reason?: string;
  correlationId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface ActivityTimelineItem {
  id: string;
  eventType: string;
  title: string;
  description: string;
  actorName: string;
  actorType: string;
  timestamp: string;
  internalReason?: string;
}

export interface AuditFilterQuery {
  inquiryId?: string;
  eventType?: string;
  actorId?: string;
  outcome?: string;
  brokerageId?: string;
  limit?: number;
}
```

---

## 8. Backend API Specifications

The Audit Module exposes protected REST endpoints mounted under `/api/audit-events`:

### 8.1 `GET /api/audit-events`
- **Description:** Retrieve filtered audit events for the active brokerage.
- **Authorization:** Bearer JWT required. Role must be `broker` or `admin`.
- **Query Parameters:**
  - `inquiryId` (optional UUID): Filter events related to a specific inquiry.
  - `eventType` (optional string): Filter by exact event type (e.g., `inquiry.status_changed`).
  - `actorId` (optional UUID): Filter by acting user ID.
  - `outcome` (optional string): `success` | `failure` | `denied`.
  - `limit` (optional integer): Maximum records to retrieve (default: 50, max: 200).
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "aud-1729512345-abc123",
      "eventType": "property.edit_approved",
      "actorId": "usr-broker-01",
      "actorName": "Eleanor Vance",
      "actorType": "human",
      "actorRole": "broker",
      "brokerageId": "human-shelter-main",
      "targetType": "property",
      "targetId": "prop-bgc-penthouse-01",
      "outcome": "success",
      "reason": "Price revision aligned with Q4 market appraisal.",
      "correlationId": "corr-1729512345-xyz789",
      "previousValues": { "list_price": 45000000 },
      "newValues": { "list_price": 43500000 },
      "createdAt": "2026-10-28T05:20:00.000Z"
    }
  ],
  "message": "Audit events retrieved successfully.",
  "timestamp": "2026-10-28T05:30:00.000Z"
}
```
- **Response `403 Forbidden`:** Returned if user role is `client` or `agent`. Logs an `audit.access_denied` event.

### 8.2 `GET /api/audit-events/export`
- **Description:** Generate an authorized forensic export package of audit events.
- **Authorization:** Bearer JWT required. Role must be `broker` or `admin`.
- **Side Effect:** Automatically logs an `audit.exported` audit event capturing who performed the export, the filter criteria, and the timestamp.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "exportedAt": "2026-10-28T05:32:00.000Z",
    "exportedBy": "Eleanor Vance",
    "count": 142,
    "events": [ /* array of AuditEventRecord */ ]
  },
  "message": "Audit log export generated.",
  "timestamp": "2026-10-28T05:32:00.000Z"
}
```

### 8.3 `PATCH /api/audit-events/:id` & `DELETE /api/audit-events/:id`
- **Description:** Tamper prevention barrier. Explicitly catches any programmatic or direct attempt to alter or delete an existing audit event.
- **Behavior:** 
  1. Captures caller context (`actorId`, `actorRole`).
  2. Records an immediate `audit.tamper_denied` security alert with `outcome: 'denied'` and `reason: 'Audit records are immutable and cannot be altered or deleted.'`.
  3. Returns HTTP `403 Forbidden`.
- **Response `403 Forbidden`:**
```json
{
  "success": false,
  "error": "Forbidden: Audit records are immutable; corrections must generate additional audit events.",
  "timestamp": "2026-10-28T05:33:00.000Z"
}
```

---

## 9. Security & Privacy Safeguards

### 9.1 Data Minimization & Sanitization Engine
The `AuditService.sanitizeObject` utility enforces deep recursive redaction:
- Keys matching `/password|token|secret|authorization|cookie|credential|raw_session/i` are stripped immediately from `previousValues` and `newValues`.
- If an object contains nested configurations (e.g., credentials dictionaries), child nodes are traversed recursively to ensure no nested keys bypass inspection.

### 9.2 Guest Identity Isolation
In compliance with Philippine Data Privacy Act (RA 10173), non-authenticated visitors initiating inquiries or requesting viewing slots are explicitly classified:
- `actorType` is strictly set to `'guest'`.
- `actorId` is stored as `null`.
- The system never fabricates pseudonymous IDs or matches cookies to assign persistent identities without explicit user consent.

### 9.3 Public vs. Confidential Staff Activity Separation
When inquiries generate timeline streams for user interfaces via `AuditService.getInquiryActivityTimeline`:
- **Client Audience:** Receives sanitized customer-friendly descriptions. Confidential events (`inquiry.note_added`, `inquiry.note_updated`, `inquiry.ai_summary_generated`, `inquiry.ai_summary_reviewed`, `notification.failed`) and internal operational reasons are completely redacted.
- **Staff Audience (`agent`, `broker`, `admin`):** Receives full operational context, including internal notes and staff reasons.

---

## 10. Cross-Module Dependencies & Integrations

The Audit Module acts as an infrastructure listener across all business domains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CROSS-MODULE AUDIT INTERACTIONS                     │
├────────────────────────────────┬────────────────────────────────────────┤
│ Integrating Module             │ Emitted Audit Event & Target Store     │
├────────────────────────────────┼────────────────────────────────────────┤
│ **01 User Management**         │ Logins, logouts, 15-min idle timeouts, │
│                                │ re-authentication events in            │
│                                │ `public.audit_events`.                 │
├────────────────────────────────┼────────────────────────────────────────┤
│ **02 Property Listing**        │ Listing draft creation, 7-section edit │
│                                │ proposals, broker approval decisions   │
│                                │ in `public.property_audit_log`.        │
├────────────────────────────────┼────────────────────────────────────────┤
│ **03 Agent Management**        │ Invitation issuance, claim, status     │
│                                │ changes, and responsibility transfers  │
│                                │ in `public.agent_audit_events`.        │
├────────────────────────────────┼────────────────────────────────────────┤
│ **07 Inquiry & Comms**         │ Lead capture, advisor triage, internal │
│                                │ dossier notes, and viewing reschedules │
│                                │ in `public.inquiry_assignment_audit`.  │
├────────────────────────────────┼────────────────────────────────────────┤
│ **08 AI Inquiry Assisted**     │ AI summary generation versioning,      │
│                                │ prompt injection defense triggers in   │
│                                │ `public.audit_events`.                 │
└────────────────────────────────┴────────────────────────────────────────┘
```

---

## 11. Verification Matrix & Acceptance Criteria

| Check ID | Target Capability | Verification Scenario | Expected Result | Conformance Evidence |
| :---: | :--- | :--- | :--- | :--- |
| **`VER-AU-01`** | **Event Immutability** | Attempt `DELETE` or `PATCH` on an existing event via `/api/audit-events/:id`. | HTTP 403 returned; `audit.tamper_denied` logged to event store. | Pass (Verified in `AuditController.rejectMutation`). |
| **`VER-AU-02`** | **Sensitive Sanitization** | Record event with payload `{ password: "abc", secretToken: "xyz", validField: 123 }`. | `password` and `secretToken` absent from stored record; `validField` retained. | Pass (Verified in `AuditService.recordEvent`). |
| **`VER-AU-03`** | **Timeline Isolation** | Request inquiry timeline with `viewerRole: 'client'`. | Staff dossier notes and internal rejection reasons omitted from output array. | Pass (Verified in `AuditService.getInquiryActivityTimeline`). |
| **`VER-AU-04`** | **Role Access Control** | Authenticate as `agent` and request `GET /api/audit-events`. | HTTP 403 returned; `audit.access_denied` event recorded with agent's ID. | Pass (Verified in `AuditService.listAuditEvents`). |
| **`VER-AU-05`** | **Forensic Export Audit** | Authenticate as `broker` and request `GET /api/audit-events/export`. | HTTP 200 with payload metadata; new `audit.exported` record appended to log. | Pass (Verified in `AuditService.exportAuditEvents`). |
| **`VER-AU-06`** | **Property Diff Integrity** | Execute stored procedure `apply_property_edit_request`. | Atomically updates listing and records full old/new JSON diff to `property_audit_log`. | Pass (Verified in `backend/src/models/property_edit_approval_migration.sql`). |
