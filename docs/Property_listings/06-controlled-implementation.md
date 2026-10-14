# Phase 6: Controlled Implementation and Deployment

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Controlled Implementation

## 1. Objective

Implement the approved Property Listing Management requirements using the existing React, Express, and Supabase architecture.

The implementation must support secure property creation, agent edit proposals, broker and administrator approvals, database integrity, and audit tracking.

Preserve existing functionality and avoid unnecessary structural changes.

Implementation must proceed in small, testable stages with explicit approval checkpoints.

## 2. Required References

Read and analyze:

1. `01-database-schema-design.md`
2. `02-security-approval-workflow.md`
3. `03-backend-api-integration.md`
4. `04-frontend-workflow-integration.md`
5. `05-system-integration-testing.md`

Also inspect the completed reports:

- `phase-1-schema-inspection-report.md`
- `phase-2-security-approval-report.md`
- `phase-3-backend-integration-report.md`
- `phase-4-frontend-workflow-report.md`
- `phase-5-integration-testing-report.md`

Use the approved requirements and verified reports as the implementation reference.

If any required report is missing, incomplete, or inconsistent, identify the gap before implementing dependent functionality.

Do not assume proposed features already exist.

## 3. Mandatory Development Rules

Before changing any file:

1. Inspect its existing contents.
2. Identify related dependencies.
3. Verify current functionality.
4. Check whether an equivalent feature already exists.
5. Determine the minimum necessary modification.
6. Preserve unrelated code and behavior.
7. Prepare a rollback strategy.
8. Apply only approved changes.
9. Run appropriate tests.
10. Document results.

Do not rewrite entire components when a targeted modification is sufficient.

Do not make unrelated improvements without approval.

## 4. Confirmed Requirements

### 4.1 Property Creation

- Agents cannot create property listings.
- Authorized brokers and administrators may create listings.
- Backend authorization must enforce creation restrictions.
- Database policies must not allow unauthorized creation.

### 4.2 Property Editing

- Agents can propose changes to all business-related fields of assigned property listings.
- Agent changes require broker or administrator approval.
- Pending modifications must not update approved property records.
- Rejected proposals must not alter approved listings.
- Agents cannot approve or reject their own proposals.

### 4.3 Property Status

- Agents may propose transaction and publication status changes.
- Status changes require authorization and lifecycle validation.
- Existing database constraints must be preserved.
- Reserved and Sold statuses are manually maintained through authorized user actions.

### 4.4 Excluded Pricing Fields

Remove the following fields from the Add Property form:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve the corresponding database columns and existing data.

### 4.5 Audit Trail

- Record property changes and approval decisions.
- Identify verified actors and affected records.
- Record meaningful previous and updated values.
- Protect audit records from unauthorized modification.

## 5. Implementation Strategy

Use the following stages:

| Stage | Implementation Area | Required Result |
|---|---|---|
| 0 | Pre-implementation verification | Approved baseline and safe environment |
| 1 | Database migration | Required tables and constraints |
| 2 | Security configuration | Verified authorization and RLS |
| 3 | Backend integration | Secure API and approval transactions |
| 4 | Frontend integration | Functional role-based workflows |
| 5 | Integration testing | Verified end-to-end behavior |
| 6 | Staging deployment | Tested deployment candidate |
| 7 | Production deployment | Controlled release after separate approval |

Do not advance automatically when a stage has unresolved failures.

## 6. Stage 0: Pre-Implementation Verification

### Tasks

1. Inspect the current Git branch and working tree.
2. Identify uncommitted changes.
3. Inspect existing database migrations.
4. Confirm the target environment.
5. Verify database connection configuration without exposing secrets.
6. Review approved Phase 1–5 findings.
7. Identify unresolved requirements.
8. Prepare a file-level change plan.
9. Prepare rollback instructions.
10. Verify an authorized database backup and recovery process.

### Safety Requirements

- Do not overwrite uncommitted changes.
- Do not reset the Git repository.
- Do not delete existing migrations.
- Do not use production credentials for development tests.
- Do not assume that a backup is valid without verifying its recoverability.

### Checkpoint

Produce a pre-implementation report.

Stop if the target environment or required approvals cannot be verified.

## 7. Stage 1: Database Migration

### Tasks

Inspect existing database objects before proposing changes.

Evaluate whether the database needs:

- `property_edit_requests`
- An audit trail table or integration with an existing audit module
- Reliable property version tracking
- Foreign keys
- Check constraints
- Appropriate indexes
- Required database functions

### Migration Rules

1. Create migrations using the project's existing migration conventions.
2. Prefer additive, non-destructive changes.
3. Do not recreate `public.properties`.
4. Preserve existing columns.
5. Preserve existing foreign key relationships.
6. Check for object-name conflicts.
7. Verify trigger dependencies.
8. Validate migrations in development or staging.
9. Record migration execution results.
10. Prepare rollback or forward-recovery procedures.

### Important

Do not execute migrations against production without explicit authorization.

Do not remove existing pricing columns.

### Checkpoint

Confirm schema compatibility and successful migration testing before proceeding.

## 8. Stage 2: Security Implementation

### Tasks

Implement approved authorization rules after inspecting the current security configuration.

Verify:

- Authentication identity handling
- Role determination
- Agent assignment verification
- Broker and administrator review permissions
- Supabase RLS
- Database grants
- Existing policies
- Service-role usage
- Stored procedure permissions

### Required Security Rules

Agents must not directly insert or update approved property listings.

Agents may submit edit requests only for assigned listings.

Only authorized brokers or administrators may approve or reject requests.

Client-provided reviewer IDs must not be trusted.

Approval operations must verify the actual authenticated caller.

### RLS Requirements

- Inspect all existing policies.
- Remove or replace only policies that conflict with approved access rules.
- Ensure older permissive policies cannot bypass new restrictions.
- Prevent direct modification of protected request fields.
- Restrict audit record access.
- Test anonymous, client, agent, broker, and administrator access.

### Checkpoint

Run authorization tests before proceeding.

Stop if an unauthorized role can create listings, update approved properties, or approve edit requests.

## 9. Stage 3: Backend Implementation

### Tasks

Reuse existing Express routes, controllers, and services where possible.

Implement missing functionality for:

- Property creation authorization
- Agent edit request submission
- Edit request retrieval
- Broker and administrator approval
- Request rejection
- Conflict handling
- Audit Trail integration
- Status lifecycle validation

### Proposed API Operations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/properties` | Authorized property creation |
| POST | `/api/properties/:id/edit-requests` | Agent proposal submission |
| GET | `/api/property-edit-requests` | Authorized request retrieval |
| GET | `/api/property-edit-requests/:id` | Request details |
| POST | `/api/property-edit-requests/:id/approve` | Authorized approval |
| POST | `/api/property-edit-requests/:id/reject` | Authorized rejection |

Reuse equivalent existing endpoints instead of creating duplicates.

### Transaction Requirements

Approval must atomically:

1. Validate the reviewer.
2. Lock the request and affected property.
3. Verify the pending request.
4. Detect stale or conflicting changes.
5. Validate all proposed values.
6. Enforce property lifecycle rules.
7. Apply approved changes.
8. Update the approval record.
9. Write the audit event.
10. Commit the transaction.

If any required operation fails, roll back the entire approval.

### Checkpoint

Complete backend tests before beginning frontend integration.

## 10. Stage 4: Frontend Implementation

### Agent Interface

Inspect existing agent pages before making changes.

Required functionality:

- View assigned listings.
- Open assigned property details.
- Propose edits to business-related fields.
- Submit changes for approval.
- View pending requests.
- Review approval or rejection results.

Remove or guard unauthorized property creation controls.

Do not allow agents to directly save changes to approved property records.

### Broker Interface

Provide authorized functionality for:

- Viewing pending requests.
- Comparing current and proposed values.
- Approving changes.
- Rejecting with remarks.
- Viewing request history.
- Handling conflicts.

### Administrator Interface

Reuse existing components where possible.

Provide review functionality according to verified administrator permissions.

### UI Rules

- Preserve existing design and navigation.
- Reuse existing forms and components.
- Keep responsive behavior.
- Use the existing API client.
- Provide loading, error, and success states.
- Prevent duplicate submissions.
- Refresh approved listing information after successful review.

### Checkpoint

Verify frontend behavior against the confirmed requirements.

Do not proceed if agents can bypass the approval workflow.

## 11. Stage 5: Integration and Regression Testing

Use the approved Phase 5 testing plan.

### Required Tests

- Agent cannot create a property.
- Broker can create an authorized property.
- Administrator can create an authorized property.
- Agent cannot directly modify approved properties.
- Assigned agent can submit an edit request.
- Unassigned agent cannot submit a request.
- Pending edits do not change the approved listing.
- Broker can approve an authorized request.
- Administrator can reject an authorized request.
- Rejected edits preserve approved data.
- Approved edits are applied atomically.
- Audit events record correct values.
- Duplicate approvals are rejected.
- Stale requests cannot overwrite newer data.
- Existing status rules remain enforced.
- Existing listing search works.
- Existing property media works.
- Existing inquiries and appointments continue functioning.

Do not report a test as passed without execution evidence.

### Checkpoint

Produce a test report with results, failures, and remaining risks.

## 12. Stage 6: Staging Deployment

After implementation and testing:

1. Verify the staging environment.
2. Confirm configuration values.
3. Prepare staging database migration.
4. Verify recoverable database backup or snapshot.
5. Apply approved migrations.
6. Deploy corresponding backend changes.
7. Deploy frontend changes.
8. Run smoke tests.
9. Run authorization and approval workflow tests.
10. Document deployment results.

Do not use production data unless permitted and appropriately protected.

### Checkpoint

A staging release must pass required tests before production deployment is considered.

## 13. Stage 7: Production Deployment

Production deployment requires separate explicit approval.

Before deployment:

- Confirm approved release scope.
- Verify backup and recovery procedures.
- Confirm environment configuration.
- Check database migration compatibility.
- Plan coordinated backend and frontend release.
- Verify migration sequencing.
- Confirm monitoring and logging.
- Prepare rollback or forward-fix procedures.

After deployment:

- Verify application availability.
- Verify property listing access.
- Verify authorization restrictions.
- Verify approval transactions.
- Verify audit tracking.
- Confirm existing features remain functional.
- Document any issues.

Do not deploy automatically.

## 14. Change Control

For each implementation stage, provide:

| Item | Description |
|---|---|
| Stage | Current implementation stage |
| Requirement | Requirement being implemented |
| Existing Files | Files inspected |
| Proposed Changes | Required modifications |
| Affected Components | Dependencies |
| Database Impact | Tables, policies, or migrations |
| Security Impact | Authorization considerations |
| Tests | Required verification |
| Rollback | Recovery plan |
| Status | Pending, In Progress, Completed, or Blocked |

Do not mark stages completed without evidence.

## 15. Progress Reporting

After each stage, produce:

1. Summary of inspected components.
2. Actual changes made.
3. Files modified.
4. Database changes, if any.
5. Tests executed.
6. Test results.
7. Problems encountered.
8. Remaining risks.
9. Required next-stage approval.

Separate completed actions from proposed actions.

## 16. Mandatory Restrictions

- Do not modify unrelated modules.
- Do not delete existing property records.
- Do not recreate existing tables.
- Do not remove existing columns without approval.
- Do not expose authentication secrets.
- Do not bypass RLS.
- Do not allow direct agent updates to approved listings.
- Do not grant unauthorized approval permissions.
- Do not automatically deploy to production.
- Do not proceed beyond the authorized implementation stage.
- Do not overwrite existing work without inspection.
- Do not claim successful tests without evidence.

## 17. Completion Criteria

Phase 6 is complete only when:

1. Approved requirements are implemented.
2. Database migrations are validated.
3. Role-based permissions are enforced.
4. Agent edit requests function correctly.
5. Broker and administrator approval workflows function correctly.
6. Approved changes are applied atomically.
7. Audit history records required activities.
8. Existing functionality passes regression testing.
9. Staging deployment is verified.
10. Production deployment is separately authorized and verified, if included in the approved release scope.

Do not begin production deployment without explicit approval.

Begin with Stage 0 only.

Stop after Stage 0 and request authorization before making implementation changes.
