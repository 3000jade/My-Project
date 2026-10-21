# Agent Management — Calendar & Appointment Scheduling

## Objective

Integrate the calendar and appointment scheduling interface into **Agent Management** and remove the standalone **Appointments** sidebar section.

Follow the phases below. Inspect the existing system before deciding implementation details.

## Module Scope

**Agent Management → Calendar & Appointments** includes:

- Calendar views and agent availability.
- Appointment creation, confirmation, rescheduling, and cancellation.
- Scheduling conflict detection.
- Appointment statuses and reminders.
- Appointment details, including agent, client, property, location, and time zone.
- Role-based access and appointment activity history.

Remove the standalone sidebar entry while preserving existing appointment data and access through updated navigation and compatible routes.

## Stakeholders and Permissions

| Stakeholder | Intended capabilities |
|---|---|
| **Broker** | View brokerage team schedules, coordinate appointments, and manage assignments within defined permissions. |
| **Sales Agent** | Manage their availability, calendar, and assigned appointments. |
| **Client** | Request appointments and access or manage their own bookings under defined rules. |

Verify these capabilities against the existing permission model. Enforce access in the backend and database, including brokerage isolation.

## Phase 1 — Review the Existing System

Keep discovery read-only.

1. Read available reports, project instructions, and relevant documentation.
2. Inspect Agent Management, the existing appointment interface, and sidebar navigation.
3. Identify reusable calendar components, scheduling services, notification mechanisms, and permission checks.
4. Use the authorized Supabase connection to inspect relevant tables, relationships, constraints, indexes, RLS policies, functions, triggers, and migrations.
5. Trace existing appointment routes and dependencies.
6. Identify differences between reports, code, migrations, and the connected schema.

**Deliverable:** Current-system assessment with evidence, reusable functionality, integration dependencies, and unresolved questions.

**Completion criteria:** Existing appointment storage, navigation, permissions, and dependencies are documented. Do not expose credentials or modify synced reference files.

## Phase 2 — Define Requirements and Integration Risks

### Functional Requirements

- Provide day, week, and month calendar views.
- Allow authorized users to create, confirm, reschedule, and cancel appointments.
- Manage agent working hours and blocked periods.
- Detect overlapping bookings and unavailable times.
- Associate appointments with the appropriate agent, client, and property.
- Track pending, confirmed, completed, cancelled, and no-show statuses.
- Update reminders when appointment details change.
- Preserve existing appointments when relocating the interface.

### Decisions to Resolve

- Can guests request appointments, and how do they access their bookings?
- Who can confirm, reschedule, cancel, or reassign an appointment?
- Which statuses reserve an agent’s time?
- What happens when an agent becomes unavailable or leaves the brokerage?
- What duration, buffer, cancellation, and time-zone rules apply?
- Are external calendar integrations included or deferred?

Give each requirement a stable identifier and measurable acceptance criteria. Mark functionality as required, optional, or deferred.

### Integration Risk Assessment

| Risk | Required mitigation |
|---|---|
| Broken navigation after sidebar removal | Update links and preserve compatible routes or redirects. |
| Lost or duplicated appointments | Reuse existing records and verify record integrity before and after integration. |
| Unauthorized access to schedules or client details | Test role permissions and brokerage isolation. |
| Double bookings, including simultaneous requests | Enforce booking rules atomically in the backend or database. |
| Stale calendar information | Refresh affected views after appointment changes and handle concurrent edits. |
| Incorrect ownership after agent reassignment | Define transfer rules and preserve assignment history. |
| Appointment times shift | Define storage and display rules and test time-zone conversions. |
| Missed, duplicated, or outdated reminders | Update reminder jobs after changes and prevent duplicate delivery. |
| Users cannot find relocated appointments | Provide a clear Calendar & Appointments entry within Agent Management. |
| Existing Agent Management functions regress | Verify affected workflows end to end. |

Record each risk’s likelihood, impact, mitigation, and verification evidence.

**Deliverable:** Requirements, permission matrix, acceptance criteria, and risk register.

**Completion criteria:** Required behavior and integration rules are explicit. Unresolved decisions affecting data integrity, access, or booking correctness are identified as blockers.

## Phase 3 — Design the Interface, Data, and Contracts

### Calendar Interface

Design:

- Day, week, and month views.
- Date navigation, today control, and agent filters.
- Appointment details and scheduling forms.
- Availability and blocked-time controls.
- Responsive layouts and keyboard navigation.
- Loading, empty, error, restricted-access, and conflict states.
- Clear navigation under **Agent Management → Calendar & Appointments**.

### Status Color Coding

| State | Color | Meaning |
|---|---|---|
| **Pending** | Amber `#B45309` | Awaiting confirmation |
| **Confirmed** | Blue `#1D4ED8` | Scheduled and confirmed |
| **Completed** | Green `#15803D` | Appointment finished |
| **Cancelled** | Gray `#64748B` | Appointment cancelled |
| **No-show** | Red `#B91C1C` | Required participant did not attend |
| **Blocked time** | Slate `#475569` | Agent unavailable |

Interface rules:

- Pair colors with readable status labels and icons.
- Use pale event backgrounds with contrasting text and borders.
- Show cancelled appointments with strikethrough text.
- Mark conflicts with a warning icon and border while retaining appointment status.
- Give today and the selected date distinct visual indicators.
- Identify agents with names or avatars.
- Include a visible status legend.
- Verify contrast and readability in supported themes.

### Data and Integration Design

- Reuse existing appointment entities where appropriate.
- Define relationships with agents, clients, properties, and brokerages.
- Define permitted status transitions.
- Specify validation, permissions, concurrent booking handling, errors, and reminder events.
- Plan compatible migrations and recovery steps.
- Specify route changes and sidebar removal.

**Deliverable:** Annotated UI/UX designs, data changes, service contracts, navigation changes, and migration plan.

**Completion criteria:** Designs cover every required acceptance criterion and identified integration risk.

## Phase 4 — Implement the Integration

Start with one complete journey:

**Authorized user creates an appointment → availability is checked → appointment is saved → it appears in the assigned agent’s calendar → authorized participants can view its details.**

Then implement the remaining required functions:

1. Calendar views and filters.
2. Availability and blocked periods.
3. Appointment creation and status transitions.
4. Rescheduling and cancellation.
5. Conflict prevention, including concurrent booking attempts.
6. Reminders and change notifications.
7. Permissions and activity history.
8. Agent reassignment.
9. Updated Agent Management navigation and removal of the standalone Appointments sidebar entry.
10. Compatible handling of existing appointment URLs.

Test validation, permissions, and booking rules as each function is implemented.

**Deliverable:** Integrated submodule with migrations and supporting checks.

**Completion criteria:** Required functions are implemented, existing appointment records are preserved, and the module is ready for final verification.

## Phase 5 — End-to-End Verification

Map every requirement to recorded test evidence.

Verify:

- Broker, Sales Agent, and Client journeys.
- Calendar views, filters, date navigation, and status colors.
- Creation, confirmation, rescheduling, cancellation, completion, and no-show handling.
- Availability, blocked periods, and simultaneous booking conflicts.
- Agent reassignment and preserved history.
- Reminder updates and delivery failure recovery.
- Time-zone handling and persistence after refresh or sign-in.
- Role permissions, private information, and brokerage isolation.
- Existing appointment data after integration.
- Sidebar removal, replacement navigation, and existing URLs.
- Responsive behavior, keyboard access, and readable status indicators.
- Regressions in existing Agent Management functions.

Fix failures and rerun affected checks. Identify blocked or untested functions explicitly.

**Deliverable:** Verification report linking requirements and risks to results.

**Completion criteria:** All required checks pass. Required functions that fail or remain untested keep the integration incomplete.

## Phase 6 — `/learn`: What Was Built

Produce an evidence-based summary for future AI analysis containing:

- Module purpose and boundaries.
- Implemented stakeholder permissions.
- Calendar and scheduling functions.
- Interface states and color coding.
- Navigation changes and removed sidebar entry.
- Architecture, database changes, and RLS policies.
- Scheduling, reassignment, and reminder rules.
- Integration risks and mitigation results.
- Verification evidence.
- Known limitations, incomplete work, and deferred features.
- Relevant files, migrations, contracts, and tests.

**Completion criteria:** Another AI can understand what was implemented, what was verified, and what remains unresolved. Distinguish verified facts from assumptions and exclude credentials or unnecessary client information.