# Phase 2: Security and Approval Workflow Design Report

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Specification Reference:** `docs/Property_listings/02-security-approval-workflow.md`  
**Referenced Predecessors:** `01-database-schema-design.md`, `01-database-inspection-and-schema-design-report.md`  
**Execution Phase:** Phase 2 (Analysis and Design Only — No Code/Database Alterations)  
**Status:** COMPLETE (Pending User Approval)  
**Report Date:** 2026-10-14  

---

## 1. Existing Authentication and Authorization Findings

An exhaustive security audit was conducted across the backend authentication pipeline, authorization middleware, Supabase client configuration, API endpoints, and frontend portal routes.

### 1.1 Backend Authentication Flow (`backend/src/middleware/auth.middleware.ts`)
- **Mechanism:** The backend uses Express middleware `requireAuth` to extract the HTTP `Authorization: Bearer <token>` header and validate it via `supabase.auth.getUser(token)`.
- **Finding 1 — Client-Mutable Role Resolution (Privilege Escalation Risk):**  
  Line 87 in `auth.middleware.ts`:
  ```typescript
  const userObj = data.user as any;
  userObj.role = userObj.user_metadata?.role || 'agent';
  req.user = userObj;
  ```
  `requireAuth` determines the user's operational role by reading `user_metadata.role` from the Supabase Auth JWT rather than looking up the authoritative role in `public.profiles`. In Supabase, end-users can update their own `user_metadata` unless explicitly restricted, presenting a privilege escalation vulnerability. The authoritative source of truth MUST be `public.profiles.role`.
- **Finding 2 — Development/Mock Token Bypasses:**  
  `requireAuth` permits tokens prefixed with `dev-mock-jwt-token` and `token-google-` without cryptographic signature verification. While intended for local development, these must be strictly gated to non-production environments.

### 1.2 Backend Role Middleware (`backend/src/middleware/role.middleware.ts`)
- **Mechanism:** `requireRole(allowedRoles: string[])` checks if `req.user.role` is included in the permitted array, with an unconditional bypass for `'admin'`.
- **Finding:** Role checks occur in memory after `requireAuth`. However, `requireRole` does not verify object-level ownership (e.g., checking whether an agent owns or is assigned to the requested resource).

### 1.3 Supabase Client Configuration & RLS Bypass (`backend/src/config/supabase.ts`)
- **Mechanism:** The backend initializes two Supabase clients:
  1. `supabase`: Uses `SUPABASE_ANON_KEY`.
  2. `supabaseAdmin`: Uses `SUPABASE_SERVICE_ROLE_KEY`.
- **Critical Security Finding — Elevated Service-Role RLS Bypass:**  
  In `backend/src/services/property.service.ts`, write operations (`insert`, `update`, `delete`) are executed using `supabaseAdmin`.
  **The `supabaseAdmin` service role client completely bypasses PostgreSQL Row Level Security (RLS).**  
  Consequently, database-level RLS policies offer **zero protection** against unauthorized API calls routed through Express unless the Express endpoints and services implement strict, independent server-side authorization checks. Defense-in-depth requires both:
  1. Strict server-side ownership and role enforcement in Express.
  2. Database RLS policies and stored procedures that validate `auth.uid()` and caller permissions.

### 1.4 Property Endpoint Authorization Gaps (`backend/src/routes/property.routes.ts`)

| Endpoint | Method | Existing Middleware | Security Defect |
| :--- | :---: | :--- | :--- |
| `/api/properties` | `POST` | `requireAuth`, `requireRole(['agent', 'broker', 'admin'])` | 🔴 **Critical Defect:** Agents are authorized to create property listings directly, in direct violation of Requirement 3.1. |
| `/api/properties/:id` | `PUT` | `requireAuth`, `requireRole(['agent', 'broker', 'admin'])` | 🔴 **Critical Defect:** Agents are authorized to directly modify live listings. No check verifies whether the agent is even assigned to the listing. |
| `/api/properties/:id/media` | `POST` | `requireAuth`, `requireRole(['agent', 'broker', 'admin'])` | 🔴 **Defect:** Any agent can upload media to any property listing without assignment verification. |
| `/api/properties/:id` | `DELETE` | `requireAuth`, `requireRole(['broker', 'admin'])` | ✅ **Compliant:** Properly restricted to brokers and admins. |

### 1.5 Frontend Portal Route & UI Gaps
- `frontend/src/App.jsx`: Exposes `/agent/properties/create` mapped to `BrokerCreateListings.jsx`.
- `frontend/src/pages/portals/agent/AgentProperties.jsx`: Renders `+ Add Listing` button linking to creation route.
- `frontend/src/pages/portals/agent/AgentPropertyCreate.jsx`: Contains form submitting directly to `POST http://localhost:5000/api/properties`.
- `frontend/src/pages/portals/agent/AgentPropertyDetail.jsx`: Features an inline "Edit Listing" modal directly updating `price` and `status`, plus a toggle button that directly publishes/unpublishes listings without broker approval.

---

## 2. Current Role-Permission Analysis

Comparing current operational behavior with confirmed Human Shelter Realty requirements:

| Operation | Agent (Current) | Agent (Target) | Broker (Current) | Broker (Target) | Administrator (Target) | Compliance Gap |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Create listings** | Allowed | ❌ **DENIED** | Allowed | ✅ **AUTHORIZED** | ✅ **AUTHORIZED** | Agent creation path must be completely revoked across API, routes, and UI. |
| **View assigned listings** | Allowed | ✅ **ALLOWED** | Allowed | ✅ **ALLOWED** (Agency Scope) | ✅ **ALLOWED** (Global Scope) | In compliance; filter by `list_agent_key = agent_id`. |
| **Propose listing edits** | No staging mechanism | ✅ **ALLOWED** (Assigned only) | Direct edit | ✅ **ALLOWED** (Direct or Staged) | ✅ **ALLOWED** (Direct) | Missing proposal ingestion pipeline and staged storage. |
| **Directly update approved listings** | Allowed | ❌ **DENIED** | Allowed | ✅ **AUTHORIZED** (Policy rules) | ✅ **AUTHORIZED** | Must revoke agent direct PUT access to `public.properties`. |
| **Approve edit requests** | N/A | ❌ **DENIED** | N/A | ✅ **AUTHORIZED** | ✅ **AUTHORIZED** | Approval workflow does not exist yet. |
| **Reject edit requests** | N/A | ❌ **DENIED** | N/A | ✅ **AUTHORIZED** | ✅ **AUTHORIZED** | Rejection workflow does not exist yet. |
| **Modify audit records** | N/A | ❌ **DENIED** | N/A | ❌ **DENIED** | ❌ **DENIED** (App-level) | Audit records must be immutable, written only by DB engine. |

---

## 3. Agent Property Edit Workflow Design

The agent edit workflow enables licensed agents to propose changes to any business-related field of their assigned listings without altering the live public record.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: PROPERTY SELECTION & ASSIGNMENT VERIFICATION                                   │
│ • Agent logs in; system queries listings where list_agent_key = req.user.id.           │
│ • UI displays "Propose Changes" action ONLY on assigned listings.                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 2: PREPARATION & CLIENT-SIDE VALIDATION                                           │
│ • UI loads current approved property state.                                            │
│ • Agent modifies allowed business fields (price, description, specs, features).        │
│ • Client calculates field diff: proposed_changes = diff(original, current_form).       │
│ • Agent provides optional business justification notes (agent_notes).                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 3: SERVER-SIDE SUBMISSION & STAGING (POST /api/properties/:id/edit-requests)      │
│ • Server authenticates agent via session token.                                        │
│ • Server verifies assignment: properties.list_agent_key === req.user.id.               │
│ • Server checks for existing PENDING request on property_id (Single Pending rule).     │
│ • Server strips protected system keys (id, created_by, created_at, updated_at).        │
│ • Server snapshots current approved listing state into original_snapshot (JSONB).      │
│ • Server inserts row into public.property_edit_requests with status = 'PENDING'.       │
│ • Server notifies brokers of incoming submission via public.notifications.             │
│ • Live listing in public.properties remains 100% untouched.                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Business Fields Permitted for Agent Proposal
Agents may propose modifications to:
- `title`, `tagline`, `public_remarks`
- `price`, `formatted_price`
- `property_type`, `property_sub_type`, `property_condition`, `transaction_type`
- `address`, `unparsed_address`, `subdivision_name`, `city`, `state_or_province`, `postal_code`, `latitude`, `longitude`
- `beds`, `baths`, `bedrooms_total`, `bathrooms_total_integer`, `sqft`, `living_area`, `lot_size_area`, `year_built`, `parking_total`
- `features`, `interior_features`, `exterior_features`
- `images` (media gallery updates)
- `standard_status` (e.g. proposing `'Active Under Contract'` or `'Closed'`)
- `list_agent_key` (proposing co-agent or reassignment, subject to broker confirmation)

### 3.2 System Fields Strictly Guarded Against Mutation
The proposal ingestion handler will reject or silently strip the following system-managed keys:
- `id`, `listing_key`, `listing_id`
- `created_by`, `created_at`
- `updated_at` (managed exclusively by database timestamps)
- `is_featured` (exclusive broker/admin promotional prerogative)

---

## 4. Broker and Administrator Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: BROKER INBOX & REVIEW QUEUE (GET /api/property-edit-requests?status=PENDING)    │
│ • Broker navigates to "Proposed Edits" tab in BrokerProperties.jsx.                     │
│ • System displays pending requests with agent info, submission time, and property title.│
│ • Broker opens side-by-side comparison modal highlighting exact changed fields in Coral.│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 2: CONCURRENCY & STALE LISTING VALIDATION                                          │
│ • System checks if properties.updated_at > property_edit_requests.created_at.           │
│ • If stale: Highlights diverging fields so the broker can resolve merge conflicts.      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 3A: APPROVAL EXECUTION (POST /api/property-edit-requests/:id/approve)              │
│ • Caller verified as role IN ('broker', 'admin').                                       │
│ • Database executes public.apply_property_edit_request(request_id, broker_id, notes).   │
│ • Row-level lock acquired via SELECT ... FOR UPDATE.                                    │
│ • Whitelisted fields applied to public.properties.                                      │
│ • Request status transitioned to 'APPROVED'.                                            │
│ • Full before/after snapshot committed to public.property_audit_log.                   │
│ • Real-time notification dispatched to proposing agent.                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 3B: REJECTION EXECUTION (POST /api/property-edit-requests/:id/reject)               │
│ • Caller verified as role IN ('broker', 'admin').                                       │
│ • Broker provides required rejection remarks explaining reason for decline.             │
│ • Database executes public.reject_property_edit_request(request_id, broker_id, reason). │
│ • Request status transitioned to 'REJECTED'.                                            │
│ • Rejection audit logged; notification with remarks dispatched to agent.                │
│ • public.properties remains completely unchanged.                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Proposed Supabase Row Level Security (RLS) Design

To ensure defense-in-depth, database-level security policies must enforce authorization independently of the application layer.

### 5.1 Hardened Policies for `public.properties`

```sql
-- 1. Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. Public SELECT: Anyone can view Active listings; authenticated users view assigned/owned
DROP POLICY IF EXISTS "Properties are publicly viewable by anyone." ON public.properties;
CREATE POLICY "Properties are publicly viewable by anyone."
  ON public.properties FOR SELECT
  USING (
    standard_status = 'Active' OR 
    (auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR 
      list_agent_key = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    ))
  );

-- 3. Restrict INSERT exclusively to Brokers and Administrators
DROP POLICY IF EXISTS "Authenticated users can insert new properties." ON public.properties;
CREATE POLICY "Only brokers and admins can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- 4. Restrict direct UPDATE exclusively to Brokers and Administrators
DROP POLICY IF EXISTS "Property creators or admins can update properties." ON public.properties;
CREATE POLICY "Only brokers and admins can update properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- 5. Restrict DELETE exclusively to Brokers and Administrators
DROP POLICY IF EXISTS "Property creators or admins can delete properties." ON public.properties;
CREATE POLICY "Only brokers and admins can delete properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );
```

### 5.2 Policies for Proposed `public.property_edit_requests`

```sql
ALTER TABLE public.property_edit_requests ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
DROP POLICY IF EXISTS "Edit requests readable by assigned agent and brokers" ON public.property_edit_requests;
CREATE POLICY "Edit requests readable by assigned agent and brokers"
  ON public.property_edit_requests FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
  );

-- INSERT Policy: Assigned agent only
DROP POLICY IF EXISTS "Agents can submit edit requests for assigned properties only" ON public.property_edit_requests;
CREATE POLICY "Agents can submit edit requests for assigned properties only"
  ON public.property_edit_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = agent_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND list_agent_key = auth.uid()
    )
  );

-- UPDATE Policy: Agent self-cancel or Broker review update
DROP POLICY IF EXISTS "Agents can cancel pending; brokers can review" ON public.property_edit_requests;
CREATE POLICY "Agents can cancel pending; brokers can review"
  ON public.property_edit_requests FOR UPDATE
  TO authenticated
  USING (
    (agent_id = auth.uid() AND request_status = 'PENDING') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
  );

-- DELETE Policy: Deny standard deletion (Admins only)
DROP POLICY IF EXISTS "Only admins can delete edit requests" ON public.property_edit_requests;
CREATE POLICY "Only admins can delete edit requests"
  ON public.property_edit_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 5.3 Policies for Proposed `public.property_audit_log`

```sql
ALTER TABLE public.property_audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Brokers/Admins see all; agents see assigned property logs
DROP POLICY IF EXISTS "Audit logs viewable by authorized roles" ON public.property_audit_log;
CREATE POLICY "Audit logs viewable by authorized roles"
  ON public.property_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')) OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND list_agent_key = auth.uid())
  );

-- Write Policies: Explicitly denied to direct REST mutations
-- Writes occur exclusively via SECURITY DEFINER stored procedures
```

---

## 6. Backend Authorization Recommendations

### 6.1 Authoritative Profile Role Resolution
Update `requireAuth` in `backend/src/middleware/auth.middleware.ts` to look up the authoritative role in `public.profiles`:

```typescript
// Proposed enhancement to requireAuth:
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('role, verification_status')
  .eq('id', data.user.id)
  .single();

req.user.role = profile?.role || 'client';
(req.user as any).verification_status = profile?.verification_status || 'UNVERIFIED';
```
This eliminates reliance on client-mutable JWT metadata and ensures suspended or revoked agents are blocked immediately.

### 6.2 Proposed API Endpoints

```typescript
// 1. Submit Edit Proposal (Agent)
router.post(
  '/:id/edit-requests',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  validateBody(proposePropertyEditSchema),
  PropertyController.submitEditRequest
);

// 2. List Edit Requests (Broker review queue or Agent history)
router.get(
  '/edit-requests',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  PropertyController.listEditRequests
);

// 3. Get Single Edit Request Details
router.get(
  '/edit-requests/:requestId',
  requireAuth,
  requireRole(['agent', 'broker', 'admin']),
  PropertyController.getEditRequestDetail
);

// 4. Approve Edit Request (Broker / Admin)
router.post(
  '/edit-requests/:requestId/approve',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(approveEditRequestSchema),
  PropertyController.approveEditRequest
);

// 5. Reject Edit Request (Broker / Admin)
router.post(
  '/edit-requests/:requestId/reject',
  requireAuth,
  requireRole(['broker', 'admin']),
  validateBody(rejectEditRequestSchema),
  PropertyController.rejectEditRequest
);

// 6. Cancel Edit Request (Agent Self-Withdrawal)
router.post(
  '/edit-requests/:requestId/cancel',
  requireAuth,
  requireRole(['agent']),
  PropertyController.cancelEditRequest
);
```

### 6.3 Server-Side Ownership Check in `PropertyController.submitEditRequest`
Even though RLS provides database-level defense, the controller must verify assignment before dispatching work:
```typescript
const property = await PropertyService.findPropertyById(propertyId);
if (!property) return res.status(404).json({ error: 'Property not found.' });

if (req.user.role === 'agent' && property.listAgentKey !== req.user.id) {
  return res.status(403).json({ 
    error: 'Forbidden: You can only propose changes to properties assigned to you.' 
  });
}
```

---

## 7. Audit Trail Integration Design

### 7.1 Lifecycle Events Captured in `public.property_audit_log`
The audit ledger records 6 high-value lifecycle events:

| Event Code | Trigger Condition | Recorded Data |
| :--- | :--- | :--- |
| `CREATED` | Direct creation by broker/admin | Actor ID, initial property snapshot, timestamp. |
| `EDIT_REQUEST_SUBMITTED` | Agent submits staged proposal | Agent ID, proposed fields, base version snapshot. |
| `EDIT_APPROVED` | Broker approves and applies proposal | Broker ID, Request ID, changed fields, old vs new values. |
| `EDIT_REJECTED` | Broker declines proposal | Broker ID, Request ID, rejection remarks, timestamp. |
| `DIRECT_UPDATE` | Direct edit by authorized broker/admin | Broker ID, changed fields, old vs new snapshot. |
| `STATUS_CHANGE` | Publication, contract, or closure | Actor ID, old status, new status, timestamp. |

### 7.2 Immutability & Access Protection
- **Write Isolation:** Only database triggers and `SECURITY DEFINER` functions can insert into `public.property_audit_log`.
- **Query Restriction:** Brokers and administrators can review audit logs for all properties; agents can query history only for properties where `list_agent_key = auth.uid()`.
- **Retention:** Audit records have no cascade deletion attached to user accounts (`actor_id REFERENCES profiles(id) ON DELETE SET NULL`).

---

## 8. Concurrency and Conflict-Handling Strategy

### 8.1 Double-Review Race Condition
- **Problem:** Two brokers concurrently open and attempt to approve or reject the same pending edit request.
- **Solution:** The database function `apply_property_edit_request` executes `SELECT * FROM property_edit_requests WHERE id = p_request_id FOR UPDATE`. The first reviewer acquires the lock, verifies `request_status = 'PENDING'`, and commits the approval. The second transaction immediately fails with:
  `Cannot approve request: status is already APPROVED.`

### 8.2 Stale Listing Detection (Optimistic Concurrency)
- **Problem:** Agent submits a price drop proposal when property is at ₱100M. While the proposal is pending, a broker updates the property description or address directly.
- **Solution:** `property_edit_requests` records `base_version` and `original_snapshot`. Before approval, the review UI and backend compare `properties.updated_at` with `request.created_at`. If `properties.updated_at > request.created_at`, the review drawer flags:
  `⚠️ Listing updated since proposal submission. Please inspect overlapping fields.`
- **Granular Field Merging:** Because `apply_property_edit_request` updates only the keys present in `proposed_changes`, uncontested fields (e.g. price change) merge cleanly without overwriting the broker's newly updated description.

### 8.3 Single Active Pending Request Enforcement
- **Problem:** An agent submits 5 conflicting edit proposals in rapid succession.
- **Solution:** The unique partial index:
  `CREATE UNIQUE INDEX idx_single_pending_request_per_property ON public.property_edit_requests(property_id) WHERE request_status = 'PENDING';`
  The database engine rejects any second proposal with a clean constraint violation until the existing request is approved, rejected, or cancelled.

### 8.4 Agent Reassignment Race Condition
- **Problem:** A proposal is pending from Agent A. In the meantime, the broker reassigns the listing to Agent B.
- **Solution:** The approval function preserves the proposal history, but verifies that the listing is still active. The review interface alerts the broker that the proposal originated from the previous listing agent.

---

## 9. Security Risks & Mitigation Matrix

| # | Vulnerability / Threat | Likelihood | Impact | Proposed Security Control |
|---|---|:---:|:---:|---|
| **S1** | **BOLA / IDOR (Cross-Agent Proposal Tampering)** | Medium | High | Enforce database RLS check: `list_agent_key = auth.uid()` on `INSERT` into `property_edit_requests`, reinforced by Express controller verification. |
| **S2** | **Backend Service-Role RLS Bypass** | High | Critical | Implement strict controller authorization checks; avoid relying solely on database RLS when `supabaseAdmin` is active. |
| **S3** | **Privilege Escalation via JWT Metadata** | Medium | Critical | Refactor `requireAuth` to resolve roles from `public.profiles.role` table rather than client-controlled JWT metadata. |
| **S4** | **Direct Mutation of Approved Records by Agents** | High | Critical | Revoke agent role from `PUT /api/properties/:id` and update Supabase RLS on `public.properties` to allow UPDATE only for brokers/admins. |
| **S5** | **JSONB System Field Injection** | Medium | High | Whitelist permissible business keys in stored procedure; system fields (`id`, `created_by`, `created_at`, `updated_at`) are unconditionally excluded. |
| **S6** | **Confidential Broker Vault Exposure** | Low | Critical | Ensure `property_confidential` fields are not included in public edit proposal payloads; restrict `property_edit_requests` queries to authenticated staff. |

---

## 10. Recommended Phase 3 Implementation Dependencies

To implement this security architecture safely without downtime or regressions, Phase 3 must execute in the following strict order:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3.1: DATABASE ENGINE LAYER (Supabase Migration)                  │
│ 1. Deploy public.property_edit_requests & public.property_audit_log.   │
│ 2. Deploy stored procedures apply_property_edit_request and reject.    │
│ 3. Apply RLS policies for edit requests and audit logging.             │
│ 4. Harden public.properties RLS (restrict INSERT & UPDATE).            │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3.2: BACKEND CONTROLLERS & SERVICES (Express API)                │
│ 1. Refactor auth.middleware.ts to read role from public.profiles.      │
│ 2. Restrict POST /api/properties & PUT /api/properties/:id to brokers. │
│ 3. Add edit request endpoints in property.routes.ts.                   │
│ 4. Implement proposal submission, listing, approval, rejection logic.  │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3.3: FRONTEND PORTAL INTEGRATION                                 │
│ 1. Remove 4 excluded fields from BrokerCreateListings.jsx.             │
│ 2. Remove /agent/properties/create route and button.                   │
│ 3. Build "Proposed Edits" review drawer in BrokerProperties.jsx.       │
│ 4. Build "Propose Changes" drawer in AgentPropertyDetail.jsx.          │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3.4: VERIFICATION & AUDIT TESTING                                │
│ 1. Run automated unit test suites for controllers and middleware.      │
│ 2. Verify RLS denial assertions for unassigned agents.                 │
│ 3. Verify successful end-to-end proposal -> approval -> audit flow.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Completion Status & Stop Gate

In strict compliance with Sections 15 and 16 of `docs/Property_listings/02-security-approval-workflow.md`:
- **Phase 2 analysis and security design are complete.**
- **No files or source code have been modified.**
- **No database migrations have been executed.**
- **No RLS policies have been applied to live tables.**
- **Execution has stopped to await user review and approval before proceeding to Phase 3.**
