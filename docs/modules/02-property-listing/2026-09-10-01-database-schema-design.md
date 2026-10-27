# Phase 1: Database Schema Design and Verification

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Version:** 1.1  
**Status:** Analysis and Design Only

## 1. Objective

Inspect, verify, and design the database architecture for the Human Shelter Realty Property Listing Management Module.

Ensure the proposed schema supports the confirmed system requirements without disrupting existing database structures, records, or application functionality.

## 2. Existing System Inspection

Before proposing changes:

1. Inspect the existing project structure.
2. Locate all database schema files and migration scripts.
3. Inspect the existing Supabase `public.properties` table.
4. Examine the `public.profiles` table and its relationships.
5. Identify existing foreign keys, indexes, constraints, triggers, and RLS policies.
6. Inspect related property management tables.
7. Examine existing frontend forms and backend services that interact with property listings.
8. Identify dependencies before recommending structural modifications.

Do not modify existing files or database structures during inspection.

## 3. Confirmed System Requirements

### Property Creation

- Agents cannot create property listings.
- Authorized brokers and administrators can create property listings.
- Preserve existing property creation functionality for authorized users.

### Property Editing

- Agents may propose changes to all business-related fields of properties assigned to them.
- Changes include property details, prices, features, images, statuses, and assigned agents.
- Agents cannot directly update approved property records.
- Every agent-proposed change requires broker or administrator approval.
- Pending and rejected requests must not alter approved listings.

### Field Exclusions

The following fields are not required in the Add Property form:

- `original_list_price`
- `association_fee`
- `tax_annual_amount`
- `list_price_currency`

Preserve these existing database columns unless their removal is separately approved.

### System-Controlled Fields

Protect system-managed fields such as:

- `id`
- `created_by`
- `created_at`
- `updated_at`
- Database identifiers and audit metadata

## 4. Database Schema Design

### 4.1 Existing Properties Table

Use `public.properties` as the authoritative property listing table.

Do not recreate the table.

Inspect and identify:

- Required and optional fields
- Duplicate or overlapping fields
- Existing constraints
- Property status management
- Agent assignment relationships
- Image and media references
- Existing search indexes
- Application dependencies

Recommend improvements only when justified by confirmed requirements.

### 4.2 Proposed Property Edit Requests Table

Evaluate the creation of `public.property_edit_requests`.

Recommended fields:

| Field | Purpose |
|---|---|
| `id` | Unique request identifier |
| `property_id` | References the property |
| `agent_id` | Requesting agent |
| `request_status` | Pending, Approved, Rejected, Cancelled, or Conflict |
| `proposed_changes` | Proposed property modifications in JSONB |
| `original_snapshot` | Original values used for comparison |
| `base_version` | Listing version when the proposal was created |
| `agent_notes` | Optional explanation |
| `reviewed_by` | Authorized reviewer |
| `reviewed_at` | Review timestamp |
| `review_notes` | Approval or rejection explanation |
| `created_at` | Request creation timestamp |
| `updated_at` | Request modification timestamp |

Pending changes must be stored separately from approved property records.

### 4.3 Proposed Property Audit Log

Evaluate the creation or reuse of an audit tracking table.

Recommended fields:

| Field | Purpose |
|---|---|
| `id` | Unique audit record |
| `property_id` | Affected listing |
| `request_id` | Related edit request |
| `actor_id` | User performing the action |
| `action_type` | Type of recorded activity |
| `changed_fields` | Fields modified |
| `previous_data` | Previous values |
| `new_data` | Updated values |
| `created_at` | Activity timestamp |

Inspect existing audit functionality before creating another table.

## 5. Entity Relationships

Verify and document relationships between:

- `profiles`
- `properties`
- `property_edit_requests`
- Existing audit trail tables
- `property_media`
- `property_rooms`
- `inquiries`
- `appointments`

Do not create duplicate relationships unnecessarily.

Generate a proposed Entity Relationship Diagram using Mermaid.

## 6. Schema Validation

Analyze:

1. Primary keys and foreign keys.
2. Field data types.
3. Required and nullable fields.
4. Default values.
5. Unique constraints.
6. Check constraints.
7. Indexing requirements.
8. Duplicate field consistency.
9. Property status rules.
10. Data preservation and migration compatibility.

Pay special attention to overlapping fields such as:

- `beds` and `bedrooms_total`
- `baths` and `bathrooms_total_integer`
- `sqft` and `living_area`
- `state` and `state_or_province`
- `status` and `standard_status`

Do not delete or merge these fields automatically.

## 7. Security Design Considerations

Identify the database-level controls required to:

- Restrict property creation to authorized users.
- Prevent direct agent modifications to approved listings.
- Verify property assignment before accepting agent edit requests.
- Restrict approval operations to brokers and administrators.
- Protect audit history.
- Prevent unauthorized manipulation of approval statuses.
- Detect conflicting or outdated edit requests.

Document proposed RLS policies without applying them.

## 8. Requirements Alignment

Compare the existing implementation against the confirmed requirements.

For each requirement, identify:

- Requirement description
- Existing implementation
- Compliance status
- Identified gap
- Recommended change
- Affected database tables
- Affected backend or frontend components

Clearly separate confirmed requirements from assumptions and recommendations.

## 9. Expected Deliverables

Prepare a Markdown report containing:

1. Existing database inspection summary.
2. Current schema assessment.
3. Requirements compliance matrix.
4. Proposed database improvements.
5. Proposed new table definitions.
6. Entity Relationship Diagram.
7. Database security considerations.
8. Migration dependencies.
9. Risk assessment.
10. Recommended implementation sequence.

## 10. Restrictions

- Do not execute SQL migrations.
- Do not modify existing database tables.
- Do not delete existing columns.
- Do not alter existing application pages.
- Do not overwrite existing records.
- Do not implement RLS changes.
- Do not assume undocumented table structures.
- Do not begin backend or frontend implementation.
- Do not automatically implement recommendations.

## 11. Completion Criteria

Phase 1 is complete only when:

- Existing database structures have been inspected.
- Proposed schema changes are documented.
- Relationships have been verified.
- Requirements are mapped to the database design.
- Security risks and dependencies are identified.
- A proposed ERD is provided.
- Unconfirmed design decisions are clearly identified.

Stop after generating the analysis and schema design report.

Wait for explicit approval before proceeding to Phase 2.
