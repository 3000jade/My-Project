# Phase 3: Backend API and Database Integration Design Report

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Specification Reference:** `docs/Property_listings/03-backend-api-integration.md`  
**Referenced Predecessors:**  
- `01-database-schema-design.md` & `01-database-inspection-and-schema-design-report.md` (Phase 1)  
- `02-security-approval-workflow.md` & `02-security-and-approval-workflow-report.md` (Phase 2)  
**Execution Phase:** Phase 3 (Analysis and Integration Design Only — No Code/Database Alterations)  
**Status:** COMPLETE (Pending User Approval)  
**Report Date:** 2026-10-14  

---

## 1. Existing Backend Architecture Assessment

The backend for Human Shelter Realty is implemented as a decoupled RESTful API built on Express v5 and TypeScript, integrating directly with Supabase for authentication and PostgreSQL data persistence.

```
backend/src/
├── config/                  # Server configuration, CORS, environment variables, Supabase clients
├── controllers/             # Express HTTP controllers (PropertyController, AgentController, etc.)
├── middleware/              # Auth (requireAuth), RBAC (requireRole), validation, error handling, rate limiting
├── models/                  # TypeScript data models and raw SQL schema definitions
├── routes/                  # Express route tables (master index.ts, property.routes.ts, etc.)
├── schemas/                 # Zod runtime input validation schemas (property.schema.ts)
├── services/                # Domain business logic (PropertyService, GoogleDriveService, AgentService)
├── types/                   # Cross-cutting TypeScript interfaces and API envelope contracts
└── utils/                   # Shared helpers (logger.ts)
```

### 1.1 Layer Separation & Architectural Strengths
1. **Master Route Mounting (`backend/src/routes/index.ts`):** Clean modular separation where all domain routers mount under `/api` with an automated rate limiter (300 requests per 15 minutes per IP).
2. **Input Validation Pipeline (`backend/src/middleware/validate.middleware.ts`):** Uses Zod schemas via `validateBody()` and `validateQuery()`, formatting standard 400 Bad Request error envelopes.
3. **Structured API Envelopes (`backend/src/types/api.ts`):** Standardizes success and paginated responses (`success: boolean`, `data: T`, `message?: string`, `error?: string`, `timestamp: string`).

### 1.2 Architectural Vulnerabilities & Integration Deficiencies
1. **Elevated Service-Role RLS Bypass:** `PropertyService` instantiates and executes all mutations via `supabaseAdmin` (`SUPABASE_SERVICE_ROLE_KEY`), which unconditionally bypasses PostgreSQL Row Level Security (RLS). Any security check omitted at the Express layer will not be caught by database RLS.
2. **Missing Update Validation:** While `POST /api/properties` validates using `createPropertySchema`, `PUT /api/properties/:id` is executed without any request body validation schema (`validateBody` is omitted from line 36 of `property.routes.ts`).
3. **In-Memory Mock Fallback Violations:** `PropertyService` retains `SEED_PROPERTIES` and `localPropertiesState`. When Supabase operations encounter errors or when Supabase is unconfigured, methods silently fall back to mutating in-memory arrays and return fabricated HTTP 200/201 responses. This creates false positives and desynchronizes client state.
4. **Missing Staging & Approval Pipeline:** The backend contains zero controllers, routes, or service methods for property edit proposals, staged JSONB ingestion, or review workflows.

---

## 2. API Endpoint Inventory

### 2.1 Existing Property Endpoints (`backend/src/routes/property.routes.ts`)

| HTTP Method | Route Path | Middleware Stack | Authorized Roles | Controller Method | Status / Security Assessment |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/properties/count` | `validateQuery(queryPropertySchema)` | Public / All | `countProperties` | Compliant (Read-only count) |
| `GET` | `/api/properties` | `validateQuery(queryPropertySchema)` | Public / All | `listProperties` | Compliant (OData-style filtering & pagination) |
| `GET` | `/api/properties/:id` | None | Public / All | `getProperty` | Compliant (Redacts confidential broker vault for non-staff) |
| `POST` | `/api/properties` | `requireAuth`, `requireRole(['agent', 'broker', 'admin'])`, `validateBody(createPropertySchema)` | `agent`, `broker`, `admin` | `createProperty` | 🔴 **CRITICAL DEFECT:** Authorizes agents to create listings. Must be restricted to `broker` and `admin`. |
| `PUT` | `/api/properties/:id` | `requireAuth`, `requireRole(['agent', 'broker', 'admin'])` | `agent`, `broker`, `admin` | `updateProperty` | 🔴 **CRITICAL DEFECT:** Authorizes agents to directly mutate live listings. No body validation; no assignment verification. |
| `POST` | `/api/properties/:id/media`| `requireAuth`, `requireRole(['agent', 'broker', 'admin'])`, `multer.array()` | `agent`, `broker`, `admin` | `uploadMedia` | 🔴 **DEFECT:** Does not verify that the agent is assigned to the target property. |
| `DELETE`| `/api/properties/:id` | `requireAuth`, `requireRole(['broker', 'admin'])` | `broker`, `admin` | `deleteProperty` | ✅ **COMPLIANT:** Correctly restricted to high-privilege roles. |

---

## 3. Authentication and Authorization Findings

### 3.1 Role Resolution Defect in `requireAuth`
In `backend/src/middleware/auth.middleware.ts` (lines 86-88):
```typescript
const userObj = data.user as any;
userObj.role = userObj.user_metadata?.role || 'agent';
req.user = userObj;
```
- **Vulnerability:** `req.user.role` is populated directly from the client-manipulable `user_metadata` field embedded in the Supabase Auth JWT.
- **Risk:** In standard Supabase configurations, users can invoke `supabase.auth.updateUser({ data: { role: 'broker' } })` or `admin`, potentially escalating their privileges unless server-side custom claims or database profile lookups are enforced.
- **Required Backend Fix:** `requireAuth` must look up the verified role from the authoritative `public.profiles` table:
  ```typescript
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, verification_status')
    .eq('id', data.user.id)
    .single();
  
  userObj.role = profile?.role || 'client';
  userObj.verification_status = profile?.verification_status || 'UNVERIFIED';
  ```

### 3.2 Ownership & Assignment Authorization Gap
Existing endpoints verify **Role** (`requireRole`) but completely omit **Object Ownership / Assignment** checks:
- Any authenticated agent can currently call `PUT /api/properties/:id` on a luxury estate assigned to another agent and modify its price or description.
- Any authenticated agent can call `POST /api/properties/:id/media` on any property in the system.
- **Required Backend Fix:** Every agent-facing modification endpoint must verify that `properties.list_agent_key === req.user.id`.

---

## 4. Property Creation Workflow Assessment

### 4.1 Current Workflow Deficiencies
1. **Agent Role Permitted:** `POST /api/properties` permits `agent`, violating Requirement 4 ("Agents cannot create property listings").
2. **Frontend Form Leakage:** `BrokerCreateListings.jsx` renders inputs for `associationFee`, `associationFeeFrequency`, `taxAnnualAmount`, and tracks `originalListPrice`, violating Requirement 4 ("Excluded Fields").
3. **Silent Failure / Local State Fallback:** In `PropertyService.createProperty()`, when Supabase errors occur, the code logs a warning and unshifts into `localPropertiesState`, returning a false HTTP 201 response.

### 4.2 Target Property Creation Workflow (Brokers & Admins Only)

```
[Broker Client] 
       │ 1. POST /api/properties (Authorization: Bearer <JWT>)
       ▼
[requireAuth] ──────► Verifies JWT and resolves authoritative role from public.profiles
       │
       ▼
[requireRole(['broker', 'admin'])] ───► Rejects Agents with 403 Forbidden
       │
       ▼
[validateBody(createPropertySchema)] ──► Validates structure; defaults omitted fields
       │
       ▼
[PropertyController.createProperty]
       │
       ▼
[PropertyService.createProperty]
       │ 2. Enforces standardStatus: default 'Active' for broker, 'Draft' if unspecified
       │ 3. Resolves coordinates via Nominatim OSM if missing
       │ 4. Executes INSERT into public.properties via Supabase
       │ 5. Inserts confidential record into public.property_confidential if provided
       │ 6. Writes 'CREATED' event to public.property_audit_log
       │ 7. Returns real persisted PropertyItem (throws on DB error; no mock fallback)
       ▼
[201 Created Response with persisted ID]
```

---

## 5. Edit Request Submission Design (Agent Staging Service)

When an agent edits their assigned listing, the backend must stage the changes in `public.property_edit_requests` without modifying `public.properties`.

### 5.1 Endpoint Specification
- **Route:** `POST /api/properties/:id/edit-requests`
- **Authentication:** `requireAuth` (Agent, Broker, Admin)
- **Validation:** `validateBody(proposePropertyEditSchema)`

### 5.2 Service Method: `PropertyService.submitEditRequest`
1. **Identity & Assignment Verification:**
   - Retrieve the target listing: `SELECT * FROM properties WHERE id = :id`.
   - If not found: return `404 Not Found`.
   - If `req.user.role === 'agent'`: verify `properties.list_agent_key === req.user.id`. If not matching: return `403 Forbidden ("You are not the assigned agent for this listing.")`.
2. **Single Pending Request Guard:**
   - Query `public.property_edit_requests` for `property_id = :id AND request_status = 'PENDING'`.
   - If an active request exists: return `409 Conflict ("An active edit request is already pending broker review for this property.")`.
3. **Payload Sanitization (System Field Protection):**
   - Strip protected keys from `req.body`: `id`, `listing_key`, `listing_id`, `created_by`, `created_at`, `updated_at`, `is_featured`.
4. **Change Detection & Snapshot Generation:**
   - Construct `original_snapshot` from current `public.properties` row.
   - Diff `proposed_changes` against `original_snapshot`.
   - If zero business fields differ: return `400 Bad Request ("No changes detected between proposed payload and current property state.")`.
5. **Staged Ingestion:**
   - Insert into `public.property_edit_requests`:
     - `property_id`: target property UUID
     - `agent_id`: `req.user.id`
     - `request_status`: `'PENDING'`
     - `proposed_changes`: sanitized JSONB diff
     - `original_snapshot`: current property JSONB snapshot
     - `base_version`: current property version integer
     - `agent_notes`: optional agent remarks
   - Insert broker notification into `public.notifications`.
   - Return `201 Created` with edit request details.

---

## 6. Approval and Rejection Service Design

### 6.1 Pending Request Review (`GET /api/property-edit-requests`)
- **Route:** `GET /api/property-edit-requests`
- **Authorized Roles:** `agent`, `broker`, `admin`
- **Scoping Rule:**
  - If `req.user.role === 'agent'`: return requests where `agent_id === req.user.id`.
  - If `req.user.role IN ('broker', 'admin')`: return all requests across agency scope.
- **Filter Parameters:** `?status=PENDING`, `?propertyId=:uuid`.

### 6.2 Approval Service (`POST /api/property-edit-requests/:id/approve`)
- **Route:** `POST /api/property-edit-requests/:id/approve`
- **Authorized Roles:** `broker`, `admin` (Agents rejected with 403)
- **Validation:** `validateBody(approveEditRequestSchema)` (optional `reviewNotes`)
- **Implementation Strategy:** Execute the PostgreSQL stored procedure `public.apply_property_edit_request(p_request_id, p_broker_id, p_review_notes)`.
- **Database Transaction Flow:**
  1. Acquire row lock `FOR UPDATE` on `property_edit_requests` and `properties`.
  2. Verify `request_status = 'PENDING'`.
  3. Validate caller is broker or admin.
  4. Check for stale divergence: compare `properties.updated_at` with `request.created_at`.
  5. Apply whitelisted keys to `public.properties`.
  6. Transition request status to `'APPROVED'`.
  7. Commit row diff to `public.property_audit_log`.
  8. Notify agent via `public.notifications`.
  9. Roll back completely on any exception.

### 6.3 Rejection Service (`POST /api/property-edit-requests/:id/reject`)
- **Route:** `POST /api/property-edit-requests/:id/reject`
- **Authorized Roles:** `broker`, `admin`
- **Validation:** `validateBody(rejectEditRequestSchema)` (`reviewNotes` / `rejectionReason` required)
- **Implementation Strategy:** Execute stored procedure `public.reject_property_edit_request(p_request_id, p_broker_id, p_rejection_reason)`.
- **Behavior:** Request transitioned to `'REJECTED'`. `public.properties` remains untouched. Audit log records rejection event. Agent notified with reason.

---

## 7. Supabase Transaction Integration Design

### 7.1 Why PostgreSQL Stored Procedures are Required
In Supabase's JS SDK (`@supabase/supabase-js`), independent chained calls (e.g. `supabase.from('properties').update(...)` followed by `supabase.from('audit_log').insert(...)`) do **not** run inside an atomic database transaction. If the server crashes or network drops between calls, the database enters a corrupt, partially applied state.

To guarantee ACID properties, the approval operation MUST be encapsulated within a single PostgreSQL stored procedure (`SECURITY DEFINER` function).

### 7.2 RPC Invocation Pattern in `PropertyService`
```typescript
public static async approveEditRequest(
  requestId: string,
  reviewerId: string,
  reviewNotes?: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc('apply_property_edit_request', {
    p_request_id: requestId,
    p_broker_id: reviewerId,
    p_review_notes: reviewNotes || null,
  });

  if (error) {
    logger.error(`[PropertyService] Approval RPC error for request ${requestId}:`, error);
    if (error.message.includes('not found')) {
      throw new Error(`NotFound: ${error.message}`);
    }
    if (error.message.includes('already')) {
      throw new Error(`Conflict: ${error.message}`);
    }
    if (error.message.includes('Access Denied')) {
      throw new Error(`Forbidden: ${error.message}`);
    }
    throw new Error(`TransactionFailed: ${error.message}`);
  }

  return data;
}
```

---

## 8. Validation and Error-Handling Strategy

### 8.1 Proposed Zod Validation Schemas (`backend/src/schemas/property.schema.ts`)

#### Schema 1: `proposePropertyEditSchema` (Agent Staging)
```typescript
export const proposePropertyEditSchema = z.object({
  proposedChanges: z.object({
    title: z.string().min(3).trim().optional(),
    tagline: z.string().trim().optional(),
    price: z.number().positive().optional(),
    propertyType: z.string().optional(),
    propertySubType: z.string().optional(),
    propertyCondition: z.string().optional(),
    transactionType: z.enum(['For Sale', 'For Rent']).optional(),
    publicRemarks: z.string().optional(),
    address: z.string().trim().optional(),
    subdivisionName: z.string().trim().optional(),
    city: z.string().trim().optional(),
    stateOrProvince: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    beds: z.number().int().nonnegative().optional(),
    baths: z.number().int().nonnegative().optional(),
    sqft: z.number().positive().optional(),
    livingArea: z.number().positive().optional(),
    lotSizeArea: z.number().nonnegative().optional(),
    yearBuilt: z.number().int().optional(),
    parkingTotal: z.number().int().nonnegative().optional(),
    architecturalStyle: z.string().optional(),
    features: z.array(z.string()).optional(),
    interiorFeatures: z.array(z.string()).optional(),
    exteriorFeatures: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    standardStatus: z.enum([
      'Draft', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired'
    ]).optional(),
    listAgentKey: z.string().uuid().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'proposedChanges must contain at least one field to update.',
  }),
  agentNotes: z.string().max(1000).trim().optional(),
});
```

#### Schema 2: `approveEditRequestSchema`
```typescript
export const approveEditRequestSchema = z.object({
  reviewNotes: z.string().max(1000).trim().optional(),
});
```

#### Schema 3: `rejectEditRequestSchema`
```typescript
export const rejectEditRequestSchema = z.object({
  rejectionReason: z.string().min(3, 'A rejection reason of at least 3 characters is required.').max(1000).trim(),
});
```

### 8.2 Standard Error Response Mapping

| HTTP Code | Scenario in Property Workflow | Standard Response Body Envelope |
| :---: | :--- | :--- |
| `400` | Malformed input, missing fields, or empty proposal | `{ success: false, error: "Validation failed: [reasons]", timestamp: "..." }` |
| `401` | Missing, expired, or malformed Bearer token | `{ success: false, error: "Unauthorized: Invalid or expired session.", timestamp: "..." }` |
| `403` | Agent attempting creation, unassigned listing edit, or self-approval | `{ success: false, error: "Forbidden: You are not authorized to perform this action.", timestamp: "..." }` |
| `404` | Property ID or Edit Request ID not found | `{ success: false, error: "Property or request not found.", timestamp: "..." }` |
| `409` | Active pending request already exists, or request already approved | `{ success: false, error: "Conflict: An active request already exists for this property.", timestamp: "..." }` |
| `422` | Stale proposal conflict or invalid status transition | `{ success: false, error: "Unprocessable: Listing updated since proposal was submitted.", timestamp: "..." }` |
| `500` | Database error, RPC failure, unexpected exception | `{ success: false, error: "Internal server error.", timestamp: "..." }` |

---

## 9. Duplicate Field Consistency Strategy

As confirmed in Phase 1 and Phase 2, the backend must maintain backward compatibility with legacy UI consumers without deleting columns:

```typescript
// Proposed Normalization Adapter in PropertyService:
function harmonizePropertySpecs(data: any) {
  const beds = data.beds ?? data.bedroomsTotal ?? 1;
  const baths = data.baths ?? data.bathroomsTotalInteger ?? 1;
  const livingArea = data.livingArea ?? data.sqft ?? 0;
  const state = data.stateOrProvince ?? data.state ?? 'Metro Manila';
  const standardStatus = data.standardStatus || (data.status === 'available' ? 'Active' : data.status === 'pending' ? 'Pending' : 'Closed');
  const status = standardStatus === 'Active' ? 'available' : standardStatus === 'Closed' ? 'sold' : 'pending';

  return {
    beds,
    bedrooms_total: beds,
    baths,
    bathrooms_total_integer: baths,
    sqft: livingArea,
    living_area: livingArea,
    state,
    state_or_province: state,
    standard_status: standardStatus,
    status,
  };
}
```

---

## 10. Audit Trail Integration Analysis

### 10.1 Inspection of Existing Audit Facilities
- Inspection confirmed **no existing audit log table** exists in PostgreSQL or backend services.
- The `sales` table tracks closed financial transactions, but not operational listing mutations or edit proposals.
- Therefore, creating `public.property_audit_log` does **not** duplicate any pre-existing table or module.

### 10.2 Audit Event Schema
The backend audit integration will record structured events into `public.property_audit_log`:
- `property_id`: Affected listing UUID
- `request_id`: Associated edit request UUID (nullable for direct broker creations)
- `actor_id`: Authenticated user executing the action (`req.user.id`)
- `action_type`: `'CREATED'`, `'EDIT_REQUEST_SUBMITTED'`, `'EDIT_APPROVED'`, `'EDIT_REJECTED'`, `'DIRECT_UPDATE'`, `'STATUS_CHANGE'`
- `changed_fields`: Array of modified column keys
- `previous_data`: Full JSONB snapshot prior to change
- `new_data`: Full JSONB snapshot after change

---

## 11. Backend Requirements Compliance Matrix

| Requirement | Current Express Implementation | Compliance | Gap Identified | Proposed Backend Modification |
| :--- | :--- | :---: | :--- | :--- |
| **1. Agents cannot create property listings** | `POST /api/properties` permits `role: 'agent'`. | ❌ **Non-Compliant** | Server-side authorization allows agents to create properties. | Change middleware to `requireRole(['broker', 'admin'])`. Remove `agent` access. |
| **2. Agents propose edits to assigned listings** | `PUT /api/properties/:id` allows direct updates. No proposal route exists. | ❌ **Non-Compliant** | Missing staged proposal ingestion endpoint and assignment check. | Implement `POST /api/properties/:id/edit-requests` with `proposePropertyEditSchema` and assignment check. |
| **3. Broker approval required** | No review or approval endpoints exist. | ❌ **Non-Compliant** | Brokers cannot review, approve, or reject field changes via API. | Implement `GET /api/property-edit-requests`, `POST /.../:id/approve`, `POST /.../:id/reject`. |
| **4. Pending edits must not alter approved records** | `PUT` directly mutates `public.properties`. | ❌ **Non-Compliant** | Updates write immediately to live table via `supabaseAdmin`. | Revoke agent role from `PUT`. Proposal service writes only to `property_edit_requests`. |
| **5. Approved edits applied securely with audit trail** | Direct update executes without audit recording. No atomic transaction. | ❌ **Non-Compliant** | Zero change history; non-transactional mutations. | Implement `apply_property_edit_request` RPC call executing inside a single DB transaction. |
| **6. Exclude 4 fields from Add Property form** | `createPropertySchema` accepts all 4 fields. | ⚠️ **Acceptable** | Schema accepts fields; UI form currently displays them. | Keep backend schema optional for backward compatibility; remove inputs from frontend form. |
| **7. Preserve database columns** | Columns present in `public.properties`. | ✅ **Compliant** | None. | Retain all columns non-destructively in queries and adapters. |
| **8. Protect system-managed fields** | Handled loosely in controllers. | ⚠️ **Partial** | System keys could be passed in raw payloads. | Explicitly strip `id`, `created_by`, `created_at`, `updated_at`, `is_featured` in proposal service. |

---

## 12. Proposed Implementation Sequence (Phase 4 Roadmap)

Upon user approval of this report, backend implementation will proceed through the following 4 milestones:

```
┌────────────────────────────────────────────────────────────────────────┐
│ MILESTONE 1: SCHEMA VALIDATORS & AUTHENTICATION REFACTOR               │
│ • Update backend/src/schemas/property.schema.ts:                       │
│   - Add proposePropertyEditSchema                                      │
│   - Add approveEditRequestSchema                                       │
│   - Add rejectEditRequestSchema                                        │
│ • Refactor backend/src/middleware/auth.middleware.ts:                  │
│   - Look up authoritative role & verification_status in profiles       │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 2: ROUTE TABLE & AUTHORIZATION HARDENING                     │
│ • Update backend/src/routes/property.routes.ts:                        │
│   - Restrict POST / to requireRole(['broker', 'admin'])                │
│   - Restrict PUT /:id to requireRole(['broker', 'admin'])              │
│   - Add POST /:id/edit-requests (agent proposal)                       │
│   - Add GET /edit-requests (review queue)                              │
│   - Add GET /edit-requests/:requestId (detail)                         │
│   - Add POST /edit-requests/:requestId/approve (broker approval)       │
│   - Add POST /edit-requests/:requestId/reject (broker rejection)       │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 3: CONTROLLER & SERVICE IMPLEMENTATION                       │
│ • Update backend/src/controllers/property.controller.ts:               │
│   - Implement submitEditRequest, listEditRequests, approve, reject     │
│ • Update backend/src/services/property.service.ts:                     │
│   - Implement submitEditRequest (assignment check, diff staging)       │
│   - Implement approveEditRequest (RPC apply_property_edit_request)     │
│   - Implement rejectEditRequest (RPC reject_property_edit_request)      │
│   - Remove SEED_PROPERTIES mock data fallback on database errors       │
├────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 4: AUTOMATED API INTEGRATION TESTING                         │
│ • Verify agent listing creation fails with 403 Forbidden               │
│ • Verify agent direct PUT fails with 403 Forbidden                     │
│ • Verify unassigned agent proposal fails with 403 Forbidden            │
│ • Verify assigned agent proposal succeeds with 201 Created             │
│ • Verify broker approval updates property and creates audit record     │
│ • Verify duplicate pending proposals are rejected with 409 Conflict    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Risks and Unresolved Dependencies

| Risk Item | Likelihood | Impact | Proposed Mitigation |
| :--- | :---: | :---: | :--- |
| **R-1: Database RPC Dependency** | High | Critical | The backend approval service relies on stored procedure `apply_property_edit_request`. **Mitigation:** The Phase 1 migration script must be executed and verified in Supabase before testing backend approval endpoints. |
| **R-2: Frontend Breaking Change on Agent PUT** | High | High | Existing `AgentPropertyDetail.jsx` calls `PUT /api/properties/:id`. Restricting the route will immediately break the agent modal if frontend changes aren't coordinated. **Mitigation:** Deploy the backend proposal endpoint first, update the frontend agent modal to use the proposal endpoint, then lock down `PUT`. |
| **R-3: Nominatim Geocoding Latency** | Low | Low | `PropertyService.createProperty()` calls OSM Nominatim geocoding synchronously, which can delay creation by 1-2s. **Mitigation:** Retain existing timeout and fallbacks; broker coordinates are pre-resolved in the studio UI. |
| **R-4: Stale Proposal Approval** | Medium | Medium | Broker approves an old proposal after another broker made direct updates. **Mitigation:** The review UI displays a side-by-side visual diff against current property state before confirming approval. |

---

## 14. Completion Status & Stop Gate

In strict accordance with Section 21 and 22 of `docs/Property_listings/03-backend-api-integration.md`:
- **Phase 3 backend integration analysis and design are complete.**
- **No source code files have been modified.**
- **No new routes, controllers, or services have been scaffolded.**
- **No database migrations or SQL queries have been executed.**
- **Execution has stopped to await user review and approval before proceeding to implementation.**
