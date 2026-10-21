# Agent Management — Calendar & Appointment Scheduling Design Specification

**Date:** 2026-10-21  
**Source Spec:** `docs/implementation/appointmentAndCalendarInterface.md`  
**Status:** Approved by User  

---

## 1. Objective & Module Scope

Integrate the calendar and appointment scheduling interface into **Agent Management** and remove the standalone **Appointments** sidebar section across the Broker and Sales Agent portals while preserving existing appointment data, permissions, and URL compatibility.

### Module Capabilities
- Day, Week, Month, and Agenda calendar views with Today indicator, Selected Date highlight, and Agent/Team/Status filters.
- Appointment creation, confirmation (`PENDING → CONFIRMED`), rescheduling, cancellation (with reason and 2-hour Client cutoff), completion (`CONFIRMED → COMPLETED`), no-show (`CONFIRMED → NO_SHOW`), and Broker agent reassignment.
- Working hours and blocked-period / blackout management (`agent_availability_schedules`) overlaid onto calendar views.
- Atomic scheduling conflict detection covering `PENDING` and `CONFIRMED` appointments, 15-minute buffers, weekly working hours, and blocked periods.
- Automated `24h` and `2h` reminder lifecycle with idempotency keys and change notifications.
- Role-based access, brokerage isolation (`brokerage_id`), sanitized client views, and immutable `activity_history`.

---

## 2. Requirements (`REQ-CAL-01` – `REQ-CAL-13`)

- **REQ-CAL-01 (Required):** Remove standalone `Appointments` sidebar item from `DashboardSidebar.jsx`. Add `Calendar & Appointments` sub-tab under `/broker/agents` (`BrokerAgents.jsx`) and `Calendar & Schedule` sub-tab under `/broker/agents/:id` (`BrokerAgentDetail.jsx`). Consolidate Agent schedule and calendar under `/agent/availability` (`Schedule & Availability` in Agent sidebar) while keeping `/broker/appointments` and `/agent/appointments` routes 100% compatible.
- **REQ-CAL-02 (Required):** Provide Day, Week, Month, and Agenda calendar views with date navigation, Today button, Agent/Team filter dropdowns, and Status filter.
- **REQ-CAL-03 (Required):** Status color coding: Pending (`#B45309` Amber), Confirmed (`#1D4ED8` Blue), Completed (`#15803D` Green), Cancelled (`#64748B` Gray with strikethrough), No-show (`#B91C1C` Red), Blocked time (`#475569` Slate), plus conflict warning icon and border.
- **REQ-CAL-04 (Required):** Create, confirm, reschedule, cancel, complete, and mark no-show on appointments with property, agent, client, location, duration (`30/60/90/120m`, default `60m`), and timezone (`Asia/Manila`).
- **REQ-CAL-05 (Required):** Manage agent weekly working hours and blocked periods / blackout dates.
- **REQ-CAL-06 (Required):** Atomic overlap and unavailability conflict detection (`409 Conflict` when overlapping `PENDING` or `CONFIRMED` bookings + 15-minute buffer or blocked periods).
- **REQ-CAL-07 (Required):** Broker agent reassignment with target agent eligibility/conflict validation and preserved `activity_history`.
- **REQ-CAL-08 (Required):** Automated `24h` and `2h` reminder scheduling, updates on reschedule/cancellation, and duplicate prevention.
- **REQ-CAL-09 (Required):** Role-based access and brokerage isolation in backend and Supabase RLS.
- **REQ-CAL-10 (Required):** Immutable `activity_history` audit trail per appointment.
- **REQ-CAL-11 (Required):** Repair `AppointmentService` live Supabase integration (`appointment_time TIMESTAMPTZ` + dual-layer metadata persistence) and preserve existing records.
- **REQ-CAL-12 (Optional):** Downloadable `.ics` calendar invite.
- **REQ-CAL-13 (Deferred):** 2-way external OAuth calendar sync.
