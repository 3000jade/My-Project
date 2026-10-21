# Calendar & Appointment Scheduling in Agent Management — `/learn` Technical Reference

**Implementation Version:** `v2.1.0`  
**Verification Date:** `2026-10-21`  
**Specification Source:** `docs/implementation/appointmentAndCalendarInterface.md`, `docs/superpowers/specs/2026-10-21-calendar-and-appointment-scheduling-design.md`

---

## 1. Purpose and Architectural Consolidation

The **Calendar & Appointment Scheduling Interface** consolidates all property viewing, online consultation, and contract signing schedules directly into **Agent Management** so that agent availability, working hours, blocked periods, workload transfers, and client bookings operate from a single source of truth:
- **Sidebar Consolidation (`DashboardSidebar.jsx`):** The standalone **Appointments** sidebar item has been removed from both the Broker and Sales Agent portals.
  - **Brokers** manage firm-wide and per-agent calendars inside **Agent Management** (`/broker/agents` → `Calendar & Appointments` sub-tab) and individual agent dossiers (`/broker/agents/:id` → `Schedule & Calendar` tab).
  - **Sales Agents** manage their calendar, working hours, and blocked periods in **Schedule & Availability** (`/agent/availability`).
  - **Backward Compatibility:** Direct navigation to `/broker/appointments` (`BrokerAppointments.jsx`) or `/agent/appointments` (`AgentAppointments.jsx`) remains operational, rendering `<AgentScheduleCalendar />` with a shortcut banner to the Agent Management workspace.

---

## 2. Stakeholder Capabilities & Permissions Matrix

| Action / Capability | Broker / Admin | Sales Agent | Authenticated Client | Guest Visitor |
|---|---|---|---|---|
| View Firm-Wide Multi-Agent Calendar | Allowed (`/broker/agents?tab=calendar`) | Denied (Scoped to own `agent_id`) | Denied | Denied |
| View Single-Agent Calendar & Working Hours | Allowed (`/broker/agents/:id`) | Allowed for self (`/agent/availability`) | Public slot availability only | Public slot availability only |
| Request / Create Appointment | Allowed (any agent) | Allowed (self) | Allowed (`InspectionScheduleModal`) | Allowed (`InspectionScheduleModal`) |
| Confirm (`CONFIRMED`), Complete (`COMPLETED`), or Mark `NO_SHOW` | Allowed (any brokerage appointment) | Allowed (own assigned appointments) | Denied (`403`) | Denied (`401`) |
| Reschedule or Cancel (`REQUESTED` / `CONFIRMED`) | Allowed anytime | Allowed anytime on own appointments | Allowed on own appointments **$\ge 2$ hours before start** (`422` inside 2h) | Denied |
| Reassign Appointment (`PATCH /api/appointments/:id/reassign`) | Allowed (with target conflict check) | Denied (`403`) | Denied (`403`) | Denied (`401`) |
| Configure Weekly Working Hours & Blocked Periods | Allowed (any brokerage agent) | Allowed (self) | Denied (`403`) | Denied (`401`) |
| View `internal_notes` | Allowed | Allowed (own appointments) | Stripped (`sanitizeForClient`) | Denied |
| Download `.ics` Calendar Invite | Allowed | Allowed | Allowed | Allowed on confirmation |

---

## 3. Time Zone, Duration, Buffer & Conflict Engine

1. **Canonical Time Zone (`Asia/Manila` / `UTC+8`):**
   - `AppointmentService.computeTimeWindow(date, time, duration, buffer)` parses both 12-hour (`10:00 AM`) and 24-hour (`14:30`) inputs in `Asia/Manila` (`+08:00`) and converts to canonical UTC ISO-8601 timestamps (`starts_at`, `ends_at`, `buffer_ends_at`).
   - All calendar headers and detail drawers explicitly display `Asia/Manila (UTC+8)`.
2. **Configurable Duration & 15-Minute Travel/Prep Buffer:**
   - Supported durations: `30`, `60` (default), `90`, and `120` minutes.
   - Every active booking (`REQUESTED`/`PENDING` and `CONFIRMED`) reserves `[starts_at, ends_at + 15m]`.
   - Two bookings for the same agent conflict whenever `startA < bufferEndB && bufferEndA > startB`.
3. **Working Hours & Blackout Validation:**
   - `AppointmentService.checkConflict` inspects the agent's `agent_availability_schedules` record:
     - Rejects (`409 APPOINTMENT_CONFLICT`) if `routing_availability === 'vacation'`.
     - Rejects if the date falls within any `blackout_dates` range (`start <= date <= end`).
     - Rejects if the weekday is disabled (`enabled === false`) or the window `[start, end]` falls outside the agent's configured `weekly_schedule` hours.
4. **Concurrency Safety:**
   - `AppointmentService.acquireAgentLock(agentId, fn)` serializes concurrent booking/rescheduling requests targeting the same agent so simultaneous requests cannot double-book the same slot.

---

## 4. Calendar Views & Status Visual Language

Implemented in `frontend/src/components/dashboard/AgentScheduleCalendar.jsx`:
- **Views:** `Month`, `Week`, `Day`, and `Agenda` (plus Table view for dense scanning), with `Today`, `Previous`, and `Next` date controls.
- **Filters:** Search by client/property/notes, Status filter, Appointment Type filter, and Agent filter (Broker view).
- **Mandatory Status Color System:**
  - **Pending / Requested (`REQUESTED` / `PENDING`):** Amber `#B45309` (`bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]`)
  - **Confirmed (`CONFIRMED`):** Blue `#1D4ED8` (`bg-[#DBEAFE] text-[#1D4ED8] border-[#3B82F6]`)
  - **Completed (`COMPLETED`):** Green `#15803D` (`bg-[#DCFCE7] text-[#15803D] border-[#22C55E]`)
  - **Cancelled (`CANCELLED`):** Neutral `#64748B` (`bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1] line-through`)
  - **No-Show (`NO_SHOW`):** Red `#B91C1C` (`bg-[#FEE2E2] text-[#B91C1C] border-[#EF4444]`)
  - **Blocked / Unavailable (`BLOCKED`):** Slate `#475569` (`bg-[#E2E8F0] text-[#475569] border-[#94A3B8]`)

---

## 5. Lifecycle Workflows: Reminders, Blocked Overlaps & Agent Departure

- **Automated Reminder Lifecycle (`24h_prior` & `2h_prior`):**
  - Creating or confirming an appointment generates `24h_prior` and `2h_prior` reminder entries in `reminders`.
  - Rescheduling recalculates `scheduled_for` timestamps; cancelling, completing, or marking `NO_SHOW` transitions pending reminders to `cancelled`.
- **Blocked Time Overlap Flagging (`has_conflict`):**
  - When an agent or broker adds a new blackout period via `PUT /api/agents/:id/availability`, `AgentAvailabilityService` calls `AppointmentService.flagConflictsForBlockedRange`, flagging any overlapping `REQUESTED`/`CONFIRMED` appointments with `has_conflict = true` and `conflict_reason` so the UI displays a prominent conflict badge.
- **Agent Suspension & Departure Reassignment:**
  - When `AgentTransferService.transferResponsibilities` or `departAgent` runs with scope `'appointments'`, upcoming `REQUESTED`/`PENDING`/`CONFIRMED` appointments are transferred to the target agent or the **Brokerage Unassigned Queue** (`agent_id = null`) while preserving `previous_agent_id`, `reassigned_at`, `reassigned_by`, and `reassignment_reason`.

---

## 6. Key Files & Verification Suites

- **Shared Contracts & Migration:**
  - `shared/types/appointment.ts`
  - `backend/src/models/appointments_calendar_v2_migration.sql`
- **Backend Implementation:**
  - `backend/src/schemas/appointment.schema.ts`
  - `backend/src/services/appointment.service.ts`
  - `backend/src/controllers/appointment.controller.ts`
  - `backend/src/routes/appointment.routes.ts`
  - `backend/src/services/agentAvailability.service.ts`
  - `backend/src/services/agentTransfer.service.ts`
- **Frontend Implementation:**
  - `frontend/src/components/dashboard/AgentScheduleCalendar.jsx`
  - `frontend/src/components/dashboard/DashboardSidebar.jsx`
  - `frontend/src/services/appointmentService.js`
  - `frontend/src/pages/portals/broker/BrokerAgents.jsx`
  - `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
  - `frontend/src/pages/portals/agent/AgentAvailability.jsx`
  - `frontend/src/pages/portals/broker/BrokerAppointments.jsx`
  - `frontend/src/pages/portals/agent/AgentAppointments.jsx`
  - `frontend/src/pages/portals/client/ClientDashboard.jsx`
- **Automated Tests:**
  - `test files/backend/appointmentCalendarModule.test.ts` (7 passed)
  - `test files/backend/controllers/appointment.controller.test.ts` (5 passed)
  - `test files/frontend/appointmentCalendarInterface.test.jsx` (5 passed)
