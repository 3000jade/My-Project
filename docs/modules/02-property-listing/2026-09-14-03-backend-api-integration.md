# Phase 3: Backend API and Database Integration Design

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Analysis and Design Only

## 1. Objective

Analyze the existing backend architecture and design the necessary API and database integration changes for the Human Shelter Realty Property Listing Management Module.

The backend must securely handle property creation, agent edit requests, broker and administrator approvals, property status changes, and audit tracking.

All proposed changes must align with the verified Phase 1 database schema and Phase 2 security requirements.

Do not implement or modify existing functionality during this phase.

## 2. Required References

Before starting:

1. Read `01-database-schema-design.md`.
2. Read `02-security-approval-workflow.md`.
3. Review the completed Phase 1 inspection report.
4. Review the completed Phase 2 security report.
5. Inspect the current backend project structure.
6. Identify existing routes, controllers, services, middleware, models, and database utilities.
7. Inspect the existing Supabase integration.
8. Identify existing property management and audit tracking functionality.

If reference files or reports are missing, identify the missing information and continue only with findings that can be verified.

Do not assume proposed database tables already exist.

## 3. Existing Backend Inspection

Inspect the backend implementation before recommending modifications.

Focus on:

- Project directory structure
- Express application configuration
- Route registration
- Authentication middleware
- Authorization middleware
- Property controllers
- Property services
- Supabase client configuration
- Database query patterns
- Existing validation mechanisms
- Error handling
- Logging and audit tracking
- File and image upload mechanisms

Identify whether the backend currently uses:

- Direct Supabase database queries
- PostgreSQL functions or RPC calls
- Supabase service-role credentials
- Authenticated user access tokens
- Existing transaction management

Document the actual implementation.

## 4. Confirmed Business Requirements

### Property Creation

- Agents cannot create property listings.
- Only authorized brokers and administrators may create property listings.
- The backend must reject unauthorized creation attempts.
- Authorization must be enforced on the server, not only through frontend restrictions.

### Property Editing

- Agents may propose edits to all business-related fields of assigned property listings.
- Agent edits require broker or administrator approval.
- Pending requests cannot directly modify approved property records.
- Agents cannot approve or reject their own requests.
- Existing approved property information must remain unchanged when requests are rejected.

### Property Status Changes

- Agents may propose changes to property transaction and publication statuses.
- Status updates require approval.
- Existing database status lifecycle rules must be respected.
- Reserved and Sold status changes are manually initiated through authorized users and not automatically determined from external transactions.

### Excluded Fields

The following fields are excluded from the Add Property form:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve existing database columns and records.

## 5. Backend Architecture Design

Inspect the existing architecture before deciding whether new components are needed.

Recommended separation of responsibilities:

### Routes

Responsible for:

- Registering API endpoints
- Applying authentication middleware
- Applying authorization middleware
- Forwarding requests to controllers

### Controllers

Responsible for:

- Receiving HTTP requests
- Validating request structure
- Calling service methods
- Returning appropriate HTTP responses

### Services

Responsible for:

- Enforcing business rules
- Verifying property assignments
- Preparing edit requests
- Performing approval operations
- Coordinating database transactions
- Integrating audit logging

### Database Layer

Responsible for:

- Database queries
- Stored procedure execution
- Data consistency
- Transaction integrity
- Concurrency protection

Reuse existing components where possible.

Do not introduce unnecessary architectural layers or duplicate services.

## 6. Proposed API Endpoints

Inspect existing routes before proposing additions.

| Method | Endpoint | Authorized users | Purpose |
|---|---|---|---|
| GET | `/api/properties` | According to visibility rules | Retrieve permitted listings |
| GET | `/api/properties/:id` | According to access rules | Retrieve property details |
| POST | `/api/properties` | Broker/Admin | Create listing |
| PUT/PATCH | `/api/properties/:id` | Broker/Admin | Authorized direct updates, subject to policy |
| POST | `/api/properties/:id/edit-requests` | Assigned Agent | Submit edit request |
| GET | `/api/property-edit-requests` | Agent/Broker/Admin | Retrieve authorized requests |
| GET | `/api/property-edit-requests/:id` | Authorized users | Retrieve request details |
| POST | `/api/property-edit-requests/:id/approve` | Broker/Admin | Approve changes |
| POST | `/api/property-edit-requests/:id/reject` | Broker/Admin | Reject changes |

These are proposed endpoints. Reuse equivalent existing endpoints where appropriate.

## 7. Property Creation Service

Inspect the existing property creation service.

The proposed workflow is:

1. Verify the authenticated user.
2. Verify broker or administrator authorization.
3. Validate property information.
4. Validate assigned agent information, when provided.
5. Apply database constraints.
6. Create the property record.
7. Record the property creation event.
8. Return the created property identifier.

Agents must be denied access even when directly calling the API.

## 8. Agent Edit Request Service

Design a service that:

1. Receives the authenticated agent's request.
2. Retrieves the property using its identifier.
3. Verifies current agent assignment.
4. Retrieves the authoritative property record.
5. Validates the proposed business fields.
6. Rejects modifications to system-managed fields.
7. Compares proposed and existing values.
8. Identifies actual changes.
9. Records the current property version.
10. Saves the proposed changes in `property_edit_requests`.
11. Sets the request status to `PENDING`.
12. Returns the edit request identifier.

The service must not directly modify `public.properties`.

Validate all proposed changes on the server.

Do not trust fields such as agent identity, review status, or original snapshot when supplied by the client.

## 9. Approval Service

Design a secure approval operation.

### Authorization

1. Obtain the reviewer identity from the verified authentication context.
2. Verify the reviewer is an authorized broker or administrator.
3. Verify the reviewer is permitted to manage the relevant property.
4. Reject attempts to impersonate another reviewer.

Do not trust client-supplied reviewer IDs.

### Approval Processing

1. Retrieve and lock the pending request.
2. Retrieve and lock the associated property.
3. Confirm the request status is `PENDING`.
4. Check for conflicting property updates.
5. Revalidate proposed changes.
6. Enforce status lifecycle rules.
7. Apply approved business-field modifications.
8. Update request status to `APPROVED`.
9. Record reviewer and approval timestamp.
10. Insert the audit event.
11. Commit all database modifications atomically.

The complete database operation must either succeed or roll back.

Evaluate whether this should be implemented using a PostgreSQL stored procedure or an existing trusted transactional backend mechanism.

Do not implement approval as unrelated database requests that can partially succeed.

## 10. Rejection Service

Design rejection functionality that:

1. Authenticates the reviewer.
2. Verifies broker or administrator authorization.
3. Confirms the request is pending.
4. Validates the rejection explanation.
5. Updates the request status to `REJECTED`.
6. Records review metadata.
7. Inserts an audit record.
8. Preserves the original property listing.

Do not modify `public.properties` when rejecting a request.

## 11. Property Status Validation

Inspect the current property lifecycle implementation.

Pay attention to:

- `status`
- `standard_status`
- Existing check constraints
- Existing status triggers
- Status synchronization logic

Document valid states and transitions.

Ensure approved agent-proposed status changes follow the same validation rules as authorized direct changes.

Do not replace existing lifecycle logic without understanding its dependencies.

## 12. Input Validation

Design server-side validation for:

### Required Property Information

- Title
- Price
- Address
- City
- Property type
- Bedroom and bathroom counts
- Property area

### Optional Property Information

- Property description
- Location coordinates
- Property features
- Images
- Parking
- Construction year
- Architectural style

### Data Integrity

Validate:

- Data types
- Required values
- Numeric ranges
- Valid JSON structures
- Supported status values
- Valid foreign key references
- Authorized field modifications

Maintain compatibility with the current Supabase schema.

## 13. Duplicate Field Consistency

Investigate the relationships between:

- `beds` and `bedrooms_total`
- `baths` and `bathrooms_total_integer`
- `sqft` and `living_area`
- `state` and `state_or_province`
- `status` and `standard_status`

Recommend how the backend should maintain consistency without deleting existing columns.

Do not automatically synchronize values unless their meanings and units are verified.

## 14. Database Transaction Design

Design transaction-safe operations for:

- Approved property updates
- Approval status changes
- Audit event insertion
- Related media updates
- Agent reassignment
- Conflict detection

Use database row locking or equivalent concurrency controls where necessary.

Do not assume multiple independent Supabase API calls form one atomic transaction.

## 15. Supabase Integration

Inspect the existing Supabase client configuration.

Verify:

1. How authentication tokens reach the backend.
2. How user identity is verified.
3. Whether service-role credentials are used.
4. Whether database operations use RPC functions.
5. Which operations bypass RLS.
6. Whether existing queries expose restricted information.

Design secure integration based on the existing configuration.

Never expose privileged Supabase credentials to the frontend.

## 16. Audit Trail Integration

Inspect whether the application already contains an Audit Trail Management Module.

Evaluate how the backend records:

- Property creation
- Agent edit request submission
- Edit request approval
- Edit request rejection
- Property status changes
- Listing-agent reassignment
- Direct broker or administrator updates

Avoid creating duplicate audit functionality.

Audit entries must use verified actor identities and accurate before-and-after values.

## 17. Error Handling Design

Recommend consistent HTTP responses.

| Status | Situation |
|---|---|
| 400 | Invalid input |
| 401 | Authentication required or invalid |
| 403 | Insufficient permissions |
| 404 | Property or request not found, when disclosure is permitted |
| 409 | Conflicting or outdated request |
| 422 | Semantically invalid property values or status transition |
| 500 | Unexpected server error |

Error responses must not reveal sensitive database information, authorization internals, or service credentials.

## 18. API Security Testing

Prepare tests covering:

- Agent cannot create a listing.
- Agent cannot directly modify an approved listing.
- Agent cannot submit edits for another agent's property.
- Assigned agent can submit a valid proposal.
- Client cannot impersonate an agent.
- Agent cannot approve their own proposal.
- Broker can approve requests within authorized scope.
- Administrator can approve authorized requests.
- Rejection preserves the approved property record.
- Duplicate approvals are rejected.
- Stale requests do not overwrite newer property information.
- Invalid status transitions are rejected.
- Approved changes produce accurate audit records.
- Database errors do not result in partial approvals.

## 19. Requirements Traceability

For each backend requirement, identify:

- Requirement ID
- Confirmed requirement
- Existing implementation
- Backend component involved
- Compliance status
- Proposed modification
- Database dependency
- Security considerations
- Required test

Separate confirmed requirements from recommendations.

## 20. Expected Deliverables

Generate a Markdown report containing:

1. Existing backend architecture assessment.
2. API endpoint inventory.
3. Authentication and authorization findings.
4. Property creation workflow assessment.
5. Edit request submission design.
6. Approval and rejection service design.
7. Supabase transaction integration design.
8. Validation and error-handling strategy.
9. Audit Trail integration analysis.
10. Backend requirements compliance matrix.
11. Proposed implementation sequence.
12. Risks and unresolved dependencies.

## 21. Restrictions

- Do not modify backend source files.
- Do not create new routes.
- Do not implement new services.
- Do not execute database migrations.
- Do not apply RLS policies.
- Do not modify existing database records.
- Do not expose Supabase credentials.
- Do not duplicate existing backend functionality.
- Do not change frontend components.
- Do not begin implementation.

## 22. Completion Criteria

Phase 3 is complete when:

- Existing backend functionality has been inspected.
- Required API behavior is documented.
- Authorization responsibilities are defined.
- Approval transactions are designed.
- Database dependencies are identified.
- Validation and error handling are specified.
- Audit integration is documented.
- Security testing requirements are prepared.

Stop after producing the backend analysis and implementation design.

Wait for explicit approval before proceeding to Phase 4.
