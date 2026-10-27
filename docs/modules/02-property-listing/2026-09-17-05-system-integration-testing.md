# Phase 5: System Integration and Testing Design

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Analysis and Test Planning Only

## 1. Objective

Analyze the existing system and prepare a comprehensive integration and testing plan for the Human Shelter Realty Property Listing Management Module.

Verify that the proposed database architecture, role-based access control, backend APIs, and frontend workflows are consistent with the confirmed system requirements.

Identify integration gaps, security vulnerabilities, missing tests, and potential regressions before implementing changes.

Do not modify source code, database structures, or application configuration during this phase.

## 2. Required References

Read these documents:

1. `01-database-schema-design.md`
2. `02-security-approval-workflow.md`
3. `03-backend-api-integration.md`
4. `04-frontend-workflow-integration.md`

Review their completed analysis reports:

- `phase-1-schema-inspection-report.md`
- `phase-2-security-approval-report.md`
- `phase-3-backend-integration-report.md`
- `phase-4-frontend-workflow-report.md`

Use verified findings as the basis for integration planning.

Do not treat proposed tables, endpoints, components, or security policies as implemented features unless they are verified in the current project.

If reports are missing, document the limitation and identify tests that depend on the missing information.

## 3. Confirmed System Requirements

### REQ-01: Property Creation

- Agents cannot create property listings.
- Authorized brokers and administrators can create property listings.
- Unauthorized creation attempts must be rejected by the backend and database authorization controls.

### REQ-02: Property Editing

- Agents may propose edits to all business-related fields of assigned listings.
- Agents cannot directly modify approved property records.
- All agent-proposed modifications require broker or administrator approval.
- Pending or rejected proposals must not change approved listing information.

### REQ-03: Property Approval

- Brokers and administrators may review requests within their authorized scope.
- Approvals must be performed through trusted backend or database operations.
- Reviewer identity must be authenticated and verified.
- Approval must apply permitted changes atomically.

### REQ-04: Property Status

- Agent-proposed property status changes require approval.
- Existing property lifecycle constraints must be respected.
- Reserved and Sold statuses are managed manually through authorized users.
- No external payment event should automatically mark a property Reserved or Sold.

### REQ-05: Field Exclusions

Exclude these fields from the Add Property form:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve existing database columns and data.

### REQ-06: Audit Trail

- Approved property modifications must produce an audit record.
- The audit must identify the authenticated actor, affected property, action, timestamp, and relevant changed values.
- Approval and rejection activities should be tracked.
- Audit information must be protected against unauthorized modification.

## 4. Existing Testing Environment Inspection

Inspect the project's existing testing infrastructure.

Identify:

- Frontend testing frameworks
- Backend testing frameworks
- Existing unit tests
- Integration tests
- End-to-end tests
- Test configuration files
- Test database configuration
- Mocking strategies
- Continuous integration workflows
- Test coverage reporting
- Available npm scripts

Determine which testing tools already exist.

Do not install additional frameworks without evaluating the existing setup.

Do not run tests that mutate production records.

## 5. Database Integration Testing

Design tests to verify:

### 5.1 Existing Schema

- `public.properties` remains intact.
- Existing property records remain accessible.
- Existing foreign key relationships are preserved.
- Existing indexes and triggers continue functioning.
- Existing property queries are not broken.

### 5.2 Proposed Edit Requests

- A valid assigned agent can submit a request.
- Unassigned agents cannot submit requests.
- Proposed changes are stored separately.
- Request status defaults to `PENDING`.
- Required request metadata is generated securely.
- System-managed fields cannot be changed by agents.

### 5.3 Approved Changes

- Approved values are applied to the correct property.
- Rejected requests leave the property unchanged.
- Failed transactions roll back.
- Audit records accurately reflect committed changes.
- Related property records remain consistent.

### 5.4 Concurrency

- Two reviewers cannot approve the same request twice.
- Stale proposals cannot silently overwrite newer information.
- Property version conflicts are detected.
- Agent reassignment is handled correctly.
- Concurrent requests behave according to the approved business rules.

## 6. Authentication and Authorization Testing

Prepare tests covering these scenarios.

| Test ID | Scenario | Expected Result |
|---|---|---|
| SEC-01 | Unauthenticated property creation | Rejected |
| SEC-02 | Agent creates property | Rejected |
| SEC-03 | Broker creates authorized property | Allowed |
| SEC-04 | Administrator creates authorized property | Allowed |
| SEC-05 | Agent directly updates live property | Rejected |
| SEC-06 | Agent edits unassigned listing | Rejected |
| SEC-07 | Assigned agent submits proposal | Allowed |
| SEC-08 | Agent approves own request | Rejected |
| SEC-09 | Client accesses restricted requests | Rejected |
| SEC-10 | Authorized broker approves request | Allowed |
| SEC-11 | Authorized administrator rejects request | Allowed |
| SEC-12 | Unauthorized user modifies audit logs | Rejected |
| SEC-13 | User supplies another reviewer's identity | Rejected |
| SEC-14 | Unauthorized broker accesses out-of-scope listing | Rejected |

Verify authorization through both API requests and database policies.

Do not rely only on hidden frontend controls.

## 7. Backend API Testing

Inspect existing API endpoints and determine which tests already exist.

Prepare tests for:

### Property Creation

- Valid broker-created listing
- Valid administrator-created listing
- Unauthorized agent creation
- Invalid required fields
- Invalid property price
- Invalid property type
- Invalid assigned agent

### Edit Request Submission

- Valid assigned agent request
- Missing authentication
- Invalid property identifier
- Unassigned property
- Unsupported field modification
- Empty proposed changes
- Invalid data types
- Duplicate pending request according to approved policy

### Request Approval

- Authorized reviewer
- Unauthorized reviewer
- Missing request
- Already approved request
- Rejected request
- Stale request
- Invalid status transition
- Database transaction failure
- Audit logging failure

### Request Rejection

- Authorized rejection
- Unauthorized rejection
- Rejection reason validation
- Already reviewed request
- Audit recording failure
- Preservation of approved property information

Document expected HTTP response codes and error structures.

## 8. Frontend Integration Testing

Inspect existing components and identify tests needed for:

### Agent Interface

- Assigned property listings
- Property detail display
- Edit proposal form
- Field validation
- Changed-field comparison
- Proposal submission
- Pending request indicator
- Approval feedback
- Rejection feedback
- Conflict notification

### Broker Interface

- Pending request list
- Request detail display
- Original versus proposed value comparison
- Approval confirmation
- Rejection dialog
- Review history
- Conflict handling

### Administrator Interface

- Authorized request access
- Approval and rejection actions
- Role-based interface visibility

### General Interface

- Loading states
- Error messages
- Responsive layouts
- Keyboard accessibility
- Duplicate submission prevention
- Refreshing data after approval

## 9. End-to-End Workflow Testing

Design tests for the complete agent-to-broker approval workflow.

### Scenario A: Successful Approval

1. Broker creates a property listing.
2. Broker assigns the property to an agent.
3. Agent views the assigned listing.
4. Agent proposes a price and description change.
5. System creates a pending edit request.
6. Approved listing remains unchanged.
7. Broker reviews the proposal.
8. Broker approves the request.
9. System applies the proposed changes atomically.
10. Agent sees the approved result.
11. Audit Trail records the completed action.

Expected result:

All approved values are updated consistently, without unauthorized modifications.

### Scenario B: Rejection

1. Agent proposes a property modification.
2. System stores the pending request.
3. Broker reviews the proposal.
4. Broker rejects with remarks.
5. System marks the request as rejected.
6. Original property information remains unchanged.
7. Agent views the rejection reason.

Expected result:

The rejected changes do not affect approved property data.

### Scenario C: Unauthorized Agent

1. Agent accesses an unassigned property.
2. Agent attempts to submit modifications through the API.
3. Backend validates property assignment.
4. Request is rejected.

Expected result:

No edit request