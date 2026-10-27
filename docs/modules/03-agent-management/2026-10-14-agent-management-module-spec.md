# Agent Management — AI Implementation Workflow

## Objective

Build or improve the agent management module for the property platform.

Support three stakeholders:

- **Broker:** manages agents within their brokerage, controls access, allocates work, and monitors performance.
- **Sales Agent:** maintains their profile and availability, manages assigned responsibilities, and reviews personal performance.
- **Client:** views permitted public agent information and communicates through authorized listing or inquiry workflows.

Complete the following phases in order. Base implementation decisions on the existing system and verified evidence.

## Phase 1 — Review the Existing System

Before writing implementation code:

1. Read project instructions, system reports, and relevant documentation.
2. Inspect existing authentication, user profiles, brokerage membership, roles, teams, and permissions.
3. Review integrations with listings, inquiries, viewings, notifications, and transactions.
4. Use the existing Supabase configuration and authorized connection to inspect:
   - Tables, columns, relationships, constraints, and indexes.
   - Row Level Security policies.
   - Views, functions, triggers, and relevant extensions.
   - Relevant Auth, Storage, and Edge Functions.
   - Migration history and differences from the connected schema.
5. Identify reusable functionality, missing capabilities, and conflicting ownership rules.
6. Verify report claims against the current implementation.

**Deliverable:** Current-system assessment with file and schema references, dependencies, gaps, and unresolved questions.

**Completion criteria:** The assessment identifies where agent management belongs, which existing entities it reuses, and which changes are required.

**Constraints:** Keep discovery read-only. Do not expose credentials or modify synced reference files.

## Phase 2 — Define Requirements and Boundaries

Treat the following capabilities as proposed scope until discovery confirms them.

### Broker

- Invite agents and manage pending invitations.
- Review onboarding progress.
- Manage brokerage membership and team placement.
- Grant permitted roles and access.
- Review availability and workload.
- Assign or transfer responsibilities.
- Monitor agent activity and performance.
- Suspend, reactivate, or offboard agents.
- Review administrative history.

### Sales Agent

- Accept an invitation and complete onboarding.
- Maintain permitted professional and public profile information.
- Manage availability for new inquiries.
- View assigned responsibilities.
- Review personal activity and performance.

### Client

- View approved public agent details.
- Identify the agent responsible for their inquiry or listing interaction.
- Contact that agent through existing authorized workflows.

### Module Boundaries

Agent management owns:

- Agent profiles.
- Brokerage and team membership.
- Invitations and onboarding status.
- Role administration.
- Availability and assignment eligibility.
- Suspension and departure workflows.
- Administrative audit history.

Integrate with existing modules for:

- Authentication and identity.
- Inquiry assignments, messages, and follow-ups.
- Listing responsibilities.
- Viewing appointments.
- Notifications.
- Transaction outcomes.

Keep payroll, commission accounting, recruitment, and training outside scope unless explicitly required.

### Required Decisions

Define:

- Whether an agent may belong to multiple brokerages.
- Who can invite, approve, suspend, and remove agents.
- Which profile fields are public, internal, or editable by agents.
- Whether onboarding requires broker approval.
- How team membership affects access.
- How availability affects new and existing work.
- What happens to responsibilities during suspension or departure.
- How performance is attributed after reassignment.
- Data-retention and profile-removal rules.

**Deliverable:** User stories, permission matrix, agreed scope, and measurable acceptance criteria.

**Completion criteria:** Every included function has a defined actor, access boundary, expected behavior, and testable outcome.

## Phase 3 — Design UI/UX, Data, and Contracts

### UI/UX Design

Define user journeys, navigation, wireframes, and annotated screens.

#### Broker Screens

- Agent directory.
- Pending invitations.
- Agent profile and onboarding review.
- Team and role management.
- Availability and workload overview.
- Performance dashboard.
- Suspension and departure workflow.
- Administrative activity history.

#### Sales Agent Screens

- Invitation acceptance.
- Onboarding checklist.
- Profile editor and public-profile preview.
- Availability settings.
- Assigned-work overview.
- Personal performance dashboard.

#### Client Experience

- Public agent profile.
- Assigned-agent information within existing inquiry and listing screens.

For each flow, specify:

- Loading, empty, success, error, disabled, and restricted-access states.
- Validation and recovery behavior.
- Responsive layouts.
- Keyboard navigation, labels, and focus management.
- Clear explanations of role changes and work transfers.
- Reuse of the existing design system.

### Data Design

Reuse existing identity and business entities where appropriate.

Define records and relationships for:

- Agent profiles.
- Brokerage memberships.
- Teams and team memberships.
- Invitations.
- Onboarding requirements and completion.
- Availability schedules and exceptions.
- Administrative audit events.
- Responsibility-transfer operations.

Separate these dimensions:

| Dimension | Example values |
|---|---|
| Membership status | Invited, active, suspended, departed |
| Onboarding status | Incomplete, pending review, complete |
| Routing availability | Available, paused, scheduled unavailable |

Define valid combinations and transitions. For example, an available routing preference must not make a suspended membership eligible for assignment.

Keep inquiry ownership within inquiry management. Agent management provides membership and eligibility information.

### API and Event Contracts

Define existing service interfaces or required endpoints for:

- Inviting, resending, revoking, and accepting invitations.
- Reading and updating profiles.
- Managing roles and teams.
- Updating availability.
- Checking assignment eligibility.
- Suspending and reactivating membership.
- Previewing and executing responsibility transfers.
- Reading performance summaries and audit history.

Specify:

- Payloads and validation.
- Authorization rules.
- Pagination and filters.
- Error formats and status codes.
- Retry and duplicate-request behavior.
- Concurrent-update handling.
- Relevant events and notification triggers.

### Critical Rules

- Separate user identity from brokerage membership.
- Prevent agents from granting themselves additional privileges.
- Enforce brokerage isolation in the backend and database.
- Exclude ineligible agents from new assignments.
- Provide an unassigned queue when no eligible agent exists.
- Preserve historical authorship and assignment history.
- Define transfer behavior separately for inquiries, tasks, viewings, and listings.
- Define how partial transfer failures are detected and recovered.

**Deliverable:** UI/UX specifications, data model, permission design, API/event contracts, and migration plan.

**Completion criteria:** The design supports all acceptance criteria and fits the existing system.

## Phase 4 — Implement the Module

Start with one complete vertical slice:

**Broker invites agent → agent accepts → agent completes required onboarding → membership becomes active → agent can access permitted work.**

Then implement the remaining agreed functions:

- Agent directory and filtering.
- Profile editing and public visibility.
- Team and role administration.
- Availability settings.
- Assignment-eligibility integration.
- Workload overview.
- Personal and broker performance views.
- Suspension and reactivation.
- Departure and responsibility transfers.
- Notifications and administrative history.

Implement database changes, business rules, interfaces, permissions, and UI according to the design.

Enforce authorization beyond UI controls. Recheck eligibility when assignment occurs.

For departure workflows:

1. Identify outstanding responsibilities.
2. Preview transfer destinations and unresolved items.
3. Stop new assignments.
4. Apply the defined access-revocation policy.
5. Transfer or explicitly queue outstanding work.
6. Preserve history and record results.
7. Provide recovery for failed transfers.

**Deliverable:** Working module with migrations and appropriate automated checks.

**Completion criteria:** All agreed functions are implemented and ready for complete verification.

## Phase 5 — End-to-End Verification of All Module Functions

Map every acceptance criterion to a verification method and recorded result.

### Invitations and Onboarding

- New and existing users can accept valid invitations.
- Expired, revoked, and previously accepted invitations behave correctly.
- Resending invitations follows the defined expiry policy.
- Duplicate requests do not create unintended memberships.
- Incomplete onboarding does not bypass activation requirements.

### Profiles and Permissions

- Agents can edit only permitted fields.
- Clients see only approved public information.
- Agents cannot elevate their role.
- Brokerage and team boundaries are enforced.
- Role changes update access correctly, including existing sessions.

### Availability and Assignment

- Paused or otherwise ineligible agents receive no new assignments.
- Availability changes preserve existing work according to policy.
- Concurrent assignment and status changes cannot bypass eligibility.
- An inquiry remains visible in the fallback queue when no agent qualifies.

### Suspension and Departure

- Suspension revokes the defined access and routing eligibility.
- Reactivation restores only intended permissions.
- Departure identifies all relevant outstanding responsibilities.
- Transfers preserve history, authorship, and necessary context.
- Partial failures are visible and recoverable.
- Repeated transfer requests do not duplicate work.

### Reporting and Experience

- Metrics match their documented definitions.
- Historical attribution remains correct after transfers.
- Brokers and agents see only authorized reports.
- Changes persist after refresh and subsequent sign-in.
- Notification failures are visible and recoverable.
- Responsive behavior, accessibility, and interface states match the design.
- Affected inquiry, listing, viewing, and transaction workflows remain functional.

Use automated E2E tests for critical journeys, supported by targeted unit and integration tests for business rules, permissions, concurrency, and failure recovery.

Fix failures and rerun affected checks. Explicitly identify blocked or untested functions.

**Deliverable:** Verification report mapping acceptance criteria to evidence and results.

**Completion criteria:** All required checks pass. Any exceptions are documented; blocked or untested functionality is not described as verified.

## Phase 6 — /learn: Module Summary for AI Analysis

Write an evidence-based summary of the actual implementation.

Include:

1. **Purpose and boundaries.**
2. **Implemented stakeholder capabilities.**
3. **Brokerage, team, and role permissions.**
4. **Invitation and onboarding lifecycle.**
5. **Membership status and availability rules.**
6. **UI/UX screens, interactions, and interface states.**
7. **Architecture and business rules.**
8. **Database entities, relationships, indexes, and RLS policies.**
9. **APIs, events, and integrations.**
10. **Suspension, departure, and transfer behavior.**
11. **Performance metric definitions and attribution rules.**
12. **Verification evidence and results.**
13. **Decisions, deviations, limitations, and deferred work.**
14. **Relevant files, migrations, contracts, and tests.**
15. **Implementation version and verification date.**

Save the summary in the project’s established documentation location. If no convention exists, use `docs/modules/03-agent-management/2026-10-21-agent-management-technical-reference.md`.

**Deliverable:** Structured `/learn` module summary.

**Completion criteria:** Another AI can understand what was built, how it connects to the system, what was verified, and what remains unresolved.

Distinguish verified facts from assumptions. Exclude credentials and unnecessary personal data.