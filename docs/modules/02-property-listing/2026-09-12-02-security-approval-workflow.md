# Phase 2: Security and Approval Workflow Design

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Analysis and Design Only

## 1. Objective

Analyze and design secure access controls and a property editing approval workflow for Human Shelter Realty.

The system must allow assigned agents to propose changes to property listings while ensuring that brokers or administrators approve those changes before they are applied.

All recommendations must align with the verified Phase 1 database schema and confirmed system requirements.

## 2. Required References

Before starting:

1. Read `01-database-schema-design.md`.
2. Review the completed Phase 1 schema inspection report.
3. Inspect the existing authentication implementation.
4. Inspect the `profiles` and `properties` tables.
5. Identify existing authorization middleware and RLS policies.
6. Inspect existing property routes, controllers, services, and frontend pages.

Treat verified Phase 1 findings as the database reference.

If Phase 1 is incomplete, report the missing information before designing dependent functionality.

Do not assume that proposed tables or functions already exist.

## 3. Confirmed Business Requirements

### 3.1 Property Creation

- Agents are not authorized to create property listings.
- Authorized brokers and administrators may create listings.
- Existing unauthorized creation paths must be identified.

### 3.2 Property Editing

- Agents may propose changes to all business-related fields of their assigned properties.
- Proposed changes include property details, prices, images, property statuses, and listing-agent assignments.
- Agents cannot directly modify approved property records.
- Every agent-initiated change requires broker or administrator approval.
- Pending or rejected changes must not modify the live listing.

### 3.3 Field Exclusions

The Add Property form must exclude:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve the existing database columns and data.

### 3.4 System Fields

Protect database-managed information, including:

- Primary keys
- Record creator identifiers
- Creation and update timestamps
- Audit identifiers
- Approval metadata

## 4. Role-Based Access Control

Inspect existing user roles and permissions.

Design authorization rules for the following roles:

| Operation | Agent | Broker | Administrator |
|---|---|---|---|
| Create listings | Denied | Authorized | Authorized |
| View assigned listings | Allowed | According to scope | According to scope |
| Propose edits | Assigned listings | According to scope | According to scope |
| Directly update approved listings | Denied | Subject to policy | Subject to policy |
| Approve agent edit requests | Denied | Authorized | Authorized |
| Reject agent edit requests | Denied | Authorized | Authorized |
| Modify audit records | Denied | Denied | Denied through normal application access |

Do not assume brokers have unrestricted access across all organizational records.

Verify actual permissions and ownership relationships before recommending implementation.

## 5. Agent Edit Request Workflow

### Step 1: Select Property

1. Authenticate the agent.
2. Retrieve listings assigned to the agent.
3. Verify assignment using the existing property-agent relationship.
4. Restrict editing actions to assigned listings.

### Step 2: Prepare Changes

1. Retrieve the current approved property details.
2. Allow editing of business-related fields.
3. Validate proposed values.
4. Compare current values with proposed values.
5. Identify the fields that changed.

### Step 3: Submit Request

1. Verify the authenticated agent.
2. Recheck property assignment.
3. Validate the submitted changes on the server.
4. Record the current approved listing version.
5. Store the proposed changes in the edit-request table.
6. Set the request status to `PENDING`.
7. Preserve the original property record.

Do not update `public.properties` during submission.

## 6. Broker and Administrator Approval Workflow

### 6.1 Pending Request Review

Authorized reviewers should be able to examine:

- Property information
- Requesting agent
- Original property values
- Proposed property values
- Changed fields
- Request submission time
- Agent notes
- Conflicting or outdated changes

### 6.2 Approval Process

When a reviewer approves a request:

1. Verify the reviewer's authenticated identity.
2. Verify broker or administrator authorization.
3. Verify access to the requested property.
4. Lock the relevant request and property records.
5. Confirm that the request remains pending.
6. Check whether the listing has changed since submission.
7. Revalidate the proposed fields.
8. Apply the approved changes in a single database transaction.
9. Update the request status to `APPROVED`.
10. Record the reviewer and approval timestamp.
11. Record the completed changes in the audit trail.

If any operation fails, the transaction must roll back.

### 6.3 Rejection Process

When a reviewer rejects a request:

1. Verify reviewer authorization.
2. Validate the rejection reason.
3. Set the request status to `REJECTED`.
4. Record the reviewer and review timestamp.
5. Preserve the approved property information.
6. Record the rejection in the audit trail.

## 7. Supabase RLS Design

Inspect all existing RLS policies on:

- `public.properties`
- `public.profiles`
- Existing property-related tables
- Proposed `property_edit_requests`
- Existing or proposed audit tables

Design policies to enforce:

1. Agents cannot insert property listings.
2. Agents cannot directly update approved listings.
3. Agents can submit edit requests only for assigned properties.
4. Agents cannot modify approval decisions.
5. Only authorized reviewers can approve or reject requests.
6. Clients cannot access restricted edit requests.
7. Audit records are protected against unauthorized modification.

Inspect existing policies before recommending replacements.

Do not execute RLS changes.

## 8. Backend Security Analysis

Inspect the existing Express backend.

Identify:

- Authentication middleware
- Role verification logic
- Property ownership checks
- Supabase client configuration
- Service-role usage
- Existing creation and editing endpoints
- Existing validation mechanisms

Evaluate whether the backend can bypass RLS through elevated credentials.

Design server-side authorization that verifies the actual authenticated user rather than trusting client-submitted role or reviewer identifiers.

## 9. Proposed Backend Endpoints

Evaluate these endpoints against the existing API architecture:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/properties/:id/edit-requests` | Submit edit proposal |
| GET | `/api/property-edit-requests` | List authorized requests |
| GET | `/api/property-edit-requests/:id` | Retrieve request details |
| POST | `/api/property-edit-requests/:id/approve` | Approve proposal |
| POST | `/api/property-edit-requests/:id/reject` | Reject proposal |

Reuse existing routes when appropriate.

Do not create duplicate endpoints.

## 10. Property Status Security

Inspect the existing:

- `status` field
- `standard_status` field
- Property lifecycle triggers
- Existing status constraints

Agents may propose property status changes, but these require approval.

The design must prevent invalid transitions and unauthorized direct updates.

Do not replace existing status rules without documenting their current behavior.

## 11. Conflict and Concurrency Handling

Design protection against:

- Multiple reviewers approving the same request
- Stale property information
- Simultaneous property modifications
- Requests submitted before agent reassignment
- Conflicting status changes

Recommend reliable database-level version checks and transactional locking.

Do not silently overwrite newer property information.

## 12. Audit Trail Requirements

Inspect the existing Audit Trail Management Module before proposing a new audit table.

Audit events should include:

- Request submission
- Approval
- Rejection
- Approved property modifications
- Property status changes
- Listing-agent reassignment

Record the authenticated actor, affected record, action, timestamp, and relevant changed values.

Protect audit information from unauthorized changes and unnecessary exposure.

## 13. Requirements Compliance Analysis

For each security requirement, document:

| Item | Description |
|---|---|
| Requirement | Expected behavior |
| Existing implementation | Current verified behavior |
| Compliance | Compliant, Partial, Missing, or Unverified |
| Security risk | Identified vulnerability |
| Recommended solution | Required improvement |
| Affected files | Existing code or database objects |
| Dependencies | Other changes required |

Separate confirmed findings from assumptions.

## 14. Expected Deliverables

Create a Markdown report containing:

1. Existing authentication and authorization findings.
2. Current role-permission analysis.
3. Agent property edit workflow design.
4. Broker and administrator approval workflow.
5. Proposed RLS policy design.
6. Backend authorization recommendations.
7. Audit Trail integration design.
8. Concurrency and conflict-handling strategy.
9. Security risks and mitigation.
10. Recommended Phase 3 implementation dependencies.

## 15. Restrictions

- Do not modify existing files.
- Do not execute database migrations.
- Do not apply RLS policies.
- Do not create new database tables.
- Do not modify backend endpoints.
- Do not modify frontend pages.
- Do not bypass existing authentication.
- Do not expose Supabase service-role credentials.
- Do not assume unverified permissions.
- Do not begin implementation.

## 16. Completion Criteria

Phase 2 is complete when:

- Existing authorization controls have been inspected.
- Security requirements have been mapped to current functionality.
- Agent editing restrictions have been documented.
- Broker and administrator approval workflows are designed.
- RLS requirements are defined.
- Backend security gaps are identified.
- Audit tracking requirements are documented.
- Implementation risks and dependencies are identified.

Stop after producing the Phase 2 analysis report.

Do not proceed to implementation without explicit approval.
