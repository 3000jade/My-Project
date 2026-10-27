# Phase 4: Frontend UI and Workflow Integration Design

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Analysis and Design Only

## 1. Objective

Inspect the existing React frontend and design the required interface changes for property listing management and agent-broker approval workflows.

The system must allow assigned agents to propose edits to property listings, while brokers and administrators can review, approve, or reject those requests.

Preserve existing layouts, styling, navigation, reusable components, and functional pages wherever possible.

Do not implement changes during this phase.

## 2. Required References

Read the following documents:

1. `01-database-schema-design.md`
2. `02-security-approval-workflow.md`
3. `03-backend-api-integration.md`

Review the completed analysis reports from Phases 1, 2, and 3.

Use verified requirements and existing system functionality as references.

Do not assume proposed backend endpoints or database tables have already been implemented.

If supporting reports are missing, identify the missing information and distinguish assumptions from verified findings.

## 3. Existing Frontend Inspection

Inspect the existing React application.

Identify:

- Application routes
- Authentication context
- Role-based navigation
- Agent dashboard
- Broker dashboard
- Administrator dashboard
- Property listing pages
- Property creation forms
- Property detail pages
- Property editing interfaces
- API service files
- Reusable form components
- Existing notification components
- Loading and error states

Determine which components can be reused.

Avoid creating duplicate pages or components.

## 4. Confirmed Requirements

### Property Creation

- Agents cannot create property listings.
- Authorized brokers and administrators can create listings.
- Remove or restrict unauthorized agent creation controls.
- Frontend restrictions must be supported by backend authorization.

### Property Editing

- Agents can propose changes to all business-related fields of assigned listings.
- Changes require broker or administrator approval.
- Pending changes must not modify approved listing information.
- Agents cannot approve or reject requests.

### Field Exclusions

The Add Property form must exclude:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve their existing database columns.

Do not remove unrelated property information.

## 5. Agent Property Management Interface

Inspect the existing Agent Property Management page.

The proposed interface should provide:

### Assigned Listings

Display property listings assigned to the authenticated agent.

Recommended information:

- Property image
- Property title
- Location
- Listing price
- Property type
- Listing status
- Last updated date
- Pending edit request indicator

### Available Actions

Agents may:

- View assigned property details
- Propose edits
- View submitted edit requests
- Review approval or rejection results

Agents must not:

- Create property listings
- Directly publish modifications
- Directly modify approved listing records
- Approve their own requests

## 6. Agent Edit Property Form

Inspect existing property editing components before proposing new forms.

Reuse existing field components where practical.

Organize editable property information into seven sections.

### Section 1: Basic Information

- Property title
- Tagline
- Property type
- Property subtype
- Transaction type

### Section 2: Location

- Address
- City
- Province
- Postal code
- Subdivision
- Geographic coordinates

### Section 3: Pricing

- Listing price

Display formatted price automatically.

Do not include the four excluded pricing fields.

### Section 4: Property Specifications

- Bedrooms
- Bathrooms
- Floor area
- Lot area
- Year built
- Property condition
- Number of stories

### Section 5: Features and Amenities

- Property features
- Interior features
- Exterior features
- Parking information

### Section 6: Description and Media

- Public description
- Architectural style
- Property images

### Section 7: Listing Management

- Transaction status
- Publication status
- Assigned listing agent
- Featured listing settings, subject to verified business rules

The editing form must distinguish approved values from unapproved proposed changes.

Use current schema field names and verified backend mappings.

## 7. Agent Edit Submission Workflow

When an assigned agent edits a listing:

1. Retrieve the approved property information.
2. Display the existing property values.
3. Allow the agent to modify permitted business fields.
4. Validate the form.
5. Identify changes compared with the approved listing.
6. Display a confirmation summary.
7. Submit an edit request through the authorized backend API.
8. Display the request status as `PENDING`.
9. Preserve the existing approved listing display.

The interface must not imply that pending changes are already published.

Suggested submit button:

**Submit for Approval**

Do not use a direct-save action that bypasses the approval workflow.

## 8. Agent Request Tracking Interface

Design a request-tracking view displaying:

| Field | Description |
|---|---|
| Property | Listing associated with the request |
| Request ID | Unique identifier |
| Submitted Date | Submission timestamp |
| Changed Fields | Fields included in the proposal |
| Request Status | Current review state |
| Reviewed By | Reviewer, if available |
| Review Date | Review timestamp |
| Review Notes | Approval or rejection feedback |

Support the following request states if confirmed by the backend design:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `SUPERSEDED`
- `CONFLICTED`

Do not invent status values unsupported by the implemented database.

Agents must only see requests they are authorized to access.

## 9. Broker Approval Management Interface

Inspect the existing Broker Dashboard and Property Management pages.

Determine whether the approval interface should be integrated into an existing page or developed as a separate component.

The proposed interface should provide:

### Pending Requests

- Property information
- Requesting agent
- Submission date
- Number of changed fields
- Request status

### Review Details

Provide a side-by-side comparison.

| Field | Current Approved Value | Proposed Value |
|---|---|---|
| Price | Existing price | Proposed price |
| Description | Existing description | Proposed description |
| Status | Existing status | Proposed status |
| Assigned Agent | Existing agent | Proposed agent |

Only display fields included in the request.

### Review Actions

Authorized reviewers may:

- Approve a request
- Reject a request with remarks
- View request history
- View conflict warnings

The interface must show confirmation before performing approval.

## 10. Administrator Approval Interface

Inspect existing administrator functionality.

Determine whether existing review components can be reused.

Administrators should be able to review property edit requests according to their authorized scope.

Avoid duplicating broker components unnecessarily.

Use shared components when both roles require similar behavior.

## 11. API Integration Design

Inspect existing API service patterns.

Determine how the frontend should communicate with:

- Property listing endpoints
- Property edit-request endpoints
- Approval endpoints
- Rejection endpoints
- Request history endpoints

Use the existing API client and authentication mechanisms.

Do not create direct Supabase mutations that bypass backend approval controls.

Handle loading, success, validation errors, permission errors, and conflicts.

## 12. Form State and Validation

Design the interface to support:

- Required-field validation
- Numeric validation
- Dropdown validation
- Image validation
- Unsaved-change warnings
- Submit-button loading states
- Duplicate submission prevention
- Server validation errors
- Request conflict notifications

The frontend validation must match backend rules.

Frontend validation must not replace backend validation.

## 13. Approval and Rejection Feedback

### Approved

Display a clear confirmation that the request was approved and that the approved listing has been updated.

Refresh property information from the backend.

### Rejected

Display the rejection reason.

Preserve the approved property information.

Allow agents to review the rejected request.

### Pending

Display that the request is awaiting review.

Do not show pending changes as already approved.

### Conflict

Display a warning that the approved listing changed after the proposal was submitted.

Do not automatically overwrite updated listing data.

## 14. Navigation and Role Visibility

Inspect existing navigation structures.

Recommend changes only where necessary.

### Agent

- Assigned Properties
- Property Details
- Propose Edit
- My Edit Requests

### Broker

- Property Listings
- Create Property
- Pending Edit Requests
- Review Requests

### Administrator

- Property Management
- Edit Request Review
- Audit History, according to access permissions

Do not create navigation links to unauthorized features.

## 15. Component Reuse and UI Consistency

Before creating components:

1. Search for existing equivalent components.
2. Check whether existing forms can be reused.
3. Preserve current styling conventions.
4. Preserve existing responsive behavior.
5. Preserve accessibility behavior.
6. Identify API dependencies.
7. Recommend minimal modifications.

Avoid redesigning unrelated dashboards, navigation, or pages.

## 16. Security Considerations

The frontend must:

- Use authenticated API requests.
- Display controls according to verified permissions.
- Avoid exposing privileged credentials.
- Avoid displaying confidential property information to unauthorized users.
- Prevent accidental duplicate submissions.
- Avoid direct property updates by agents.

Hidden interface controls are not a replacement for backend authorization.

## 17. Frontend Testing Requirements

Prepare tests verifying:

- Agent cannot access property creation functionality.
- Agent only sees authorized assigned listings.
- Agent can open the proposal form.
- Editing does not directly modify approved listing data.
- Edit submission creates a pending request.
- Broker can view authorized pending requests.
- Broker can approve a request.
- Broker can reject a request.
- Administrator can review authorized requests.
- Rejected requests preserve the approved listing.
- Approved requests display refreshed property information.
- Conflict messages appear correctly.
- Existing property listing and search interfaces continue working.
- Mobile and desktop layouts remain functional.

## 18. Requirements Traceability

For each frontend requirement, document:

- Requirement ID
- Existing page or component
- Existing functionality
- Compliance status
- Required UI modification
- API dependency
- Security considerations
- Required tests

Distinguish verified findings from proposed changes.

## 19. Expected Deliverables

Create a Markdown report containing:

1. Existing frontend architecture assessment.
2. Current page and component inventory.
3. Agent interface gap analysis.
4. Broker and administrator interface gap analysis.
5. Proposed agent edit form design.
6. Proposed request tracking interface.
7. Proposed approval review interface.
8. Component reuse recommendations.
9. API integration dependencies.
10. Navigation and role-visibility changes.
11. Frontend testing plan.
12. Recommended implementation sequence.

## 20. Restrictions

- Do not modify existing source files.
- Do not create or delete pages.
- Do not modify React routes.
- Do not modify API service implementations.
- Do not redesign existing dashboards.
- Do not execute database migrations.
- Do not change Supabase RLS policies.
- Do not implement new features.
- Do not assume missing backend endpoints exist.
- Do not duplicate existing components unnecessarily.

## 21. Completion Criteria

Phase 4 is complete when:

- Existing frontend components have been inspected.
- Required UI changes have been documented.
- Agent editing workflows are designed.
- Broker and administrator approval interfaces are designed.
- API dependencies are identified.
- Security and validation requirements are documented.
- Reusable components are identified.
- Functional and regression tests are defined.

Stop after generating the Phase 4 frontend analysis and design report.

Do not begin implementation without explicit approval.
