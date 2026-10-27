# Property Listing Inquiry Management — AI Implementation Workflow

## Objective

Build or improve the inquiry management module for three stakeholders:

- **Broker:** oversees brokerage inquiries, assigns agents, and monitors progress.
- **Sales Agent:** manages assigned inquiries, communicates with clients, schedules viewings, and follows up.
- **Client:** submits listing inquiries, communicates with an agent, and requests viewings.

Complete the following phases in order. Base decisions on the existing system and verified evidence.

## Phase 1 — Review the Existing System

Before writing implementation code:

1. Read available system reports, project instructions, and relevant documentation.
2. Inspect the current application structure, existing modules, UI components, authentication, permissions, and integrations.
3. Identify the existing Supabase configuration and use the authorized connection to inspect:
   - Tables, columns, relationships, constraints, and indexes.
   - Row Level Security policies and role access.
   - Views, functions, triggers, and relevant extensions.
   - Auth, Storage, and Edge Functions relevant to inquiries.
   - Migration history and differences from the connected schema.
4. Identify existing functionality to reuse, integration constraints, and missing capabilities.
5. Verify report claims against the current implementation.

**Deliverable:** Current-system assessment with relevant references, dependencies, gaps, and unresolved questions.

**Completion criteria:** The AI understands where the module belongs and how it connects to existing functionality.

**Constraints:** Keep discovery read-only. Do not expose credentials or modify synced reference files.

## Phase 2 — Define Module Requirements and Boundaries

Define user stories and measurable acceptance criteria for each stakeholder.

### Broker

- View inquiries within their brokerage.
- Assign and reassign sales agents.
- Monitor unanswered inquiries, overdue follow-ups, and outcomes.
- Review team activity and performance.

### Sales Agent

- View assigned or explicitly shared inquiries.
- Respond to clients and record communication.
- Maintain private notes and client requirements.
- Arrange viewings and schedule follow-ups.
- Update inquiry status and record outcomes.

### Client

- Submit an inquiry about a listing.
- Receive confirmation and communicate with the assigned agent.
- Request, confirm, or cancel viewings.
- View their own inquiry progress.

Define:

- Inputs, outputs, required fields, and validation rules.
- Role permissions and brokerage isolation.
- Inquiry ownership and reassignment rules.
- Status transitions, closure reasons, and reopening behavior.
- Dependencies on listings, notifications, calendars, applications, and transactions.
- Accessibility, responsiveness, performance, and data-retention requirements.
- Included, excluded, and deferred functionality.

**Deliverable:** Module requirements, permission matrix, and acceptance criteria.

**Completion criteria:** Every planned function has a defined actor, expected behavior, and testable outcome.

## Phase 3 — Design UI/UX, Data, and Contracts

### UI/UX Design

Define stakeholder journeys, navigation, wireframes, and annotated screen designs.

Cover:

- **Broker:** inquiry dashboard, team queue, assignment controls, and reporting.
- **Sales Agent:** inbox, conversation details, listing context, private notes, follow-up tasks, and viewing controls.
- **Client:** inquiry form, confirmation, conversation, and viewing status.

Specify:

- Loading, empty, success, error, disabled, and restricted-access states.
- Form validation, feedback, cancellation, and recovery behavior.
- Responsive layouts, keyboard navigation, labels, and focus management.
- Clear separation between internal notes and client-visible messages.
- Reuse of the existing design system.

### Data Design

Reuse existing entities where appropriate. Define relationships for contacts, inquiries, listings, messages, assignments, tasks, viewings, and activity history.

Account for:

- One client inquiring about multiple listings.
- Duplicate submission handling without incorrectly merging separate inquiries.
- Brokerage isolation and role permissions.
- Reassignment history and audit records.
- Indexes supporting inbox filters, ownership, and follow-up queries.

### API and Event Contracts

Define endpoints or existing service interfaces, payloads, validation, pagination, status codes, error formats, authorization, and relevant events.

Keep inquiry status separate from viewing and transaction status.

**Deliverable:** UI/UX specifications, data model, permission design, API contracts, and migration plan.

**Completion criteria:** The design supports all acceptance criteria and fits the current system.

## Phase 4 — Implement the Module

Start with one complete vertical slice:

**Client submits inquiry → inquiry is stored → broker assigns an agent → agent responds → client can access the response.**

Then implement the remaining agreed functions:

- Inquiry capture and duplicate protection.
- Inbox search, filtering, and pagination.
- Agent assignment and reassignment.
- Conversations and private notes.
- Follow-up tasks and reminders.
- Viewing integration.
- Status changes, closure, and reopening.
- Notifications and activity history.
- Broker reporting and relevant module handoffs.

Implement database changes, business rules, APIs, permissions, and UI together according to the design. Enforce authorization in the backend and database.

**Deliverable:** Working module with supporting migrations and automated checks.

**Completion criteria:** All agreed functions are implemented and ready for end-to-end verification.

## Phase 5 — End-to-End Verification of All Module Functions

Map every acceptance criterion to a test and record its result.

Verify:

- Complete Broker, Sales Agent, and Client journeys.
- Inquiry creation and correct listing association.
- Duplicate submissions and invalid inputs.
- Assignment, reassignment, and preserved history.
- Client-visible messages and restricted internal notes.
- Follow-up scheduling, reminders, and overdue states.
- Viewing requests, confirmation, cancellation, and conflicts.
- Status transitions, closure reasons, and reopening.
- Unavailable listings and cross-module handoffs.
- Role permissions, brokerage isolation, and Supabase RLS.
- Persistence after refresh and subsequent sign-in.
- Notification failures and recovery.
- Responsive behavior, accessibility, and design consistency.
- Security, performance, and regressions in affected modules.

Use automated E2E tests for critical journeys, supported by unit and integration tests where appropriate.

Fix failures and rerun affected tests. Explicitly identify blocked or untested functions.

**Deliverable:** Verification report linking acceptance criteria to evidence and results.

**Completion criteria:** All required checks pass; any exceptions are clearly documented. Do not claim complete verification when functions remain blocked or untested.

## Phase 6 — /learn: Module Summary for AI Analysis

Produce a structured summary of the actual implementation for future AI analysis.

Include:

1. **Module purpose and boundaries.**
2. **Stakeholders and implemented permissions.**
3. **Implemented functions and user journeys.**
4. **UI/UX screens, interactions, and interface states.**
5. **Architecture, components, and business rules.**
6. **Database changes, relationships, indexes, and RLS policies.**
7. **APIs, events, dependencies, and integrations.**
8. **Verification results and supporting evidence.**
9. **Design decisions, tradeoffs, and deviations.**
10. **Known limitations, incomplete work, and deferred functions.**
11. **Relevant file paths, migrations, contracts, and tests.**

**Deliverable:** Evidence-based `/learn` module summary.

**Completion criteria:** Another AI can understand what was built, how it fits the system, what was verified, and what remains unresolved without reconstructing the entire project.

Distinguish verified facts from assumptions. Exclude credentials and unnecessary client data.