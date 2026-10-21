# Agent Management — Calendar & Appointment Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Day/Week/Month Calendar & Appointment Scheduling interface into Agent Management, remove the standalone Appointments sidebar item while preserving route compatibility, and enforce conflict detection, availability/blocked periods, statuses (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`), reminders, and role-based permissions.

**Architecture:** Shared TypeScript contracts in `shared/types/appointment.ts`, PostgreSQL migration in `backend/src/models/appointments_calendar_v2_migration.sql`, atomic scheduling/conflict/reminder logic in `AppointmentService` + `AppointmentController`, and a reusable `<AgentScheduleCalendar />` component embedded into `BrokerAgents.jsx`, `BrokerAgentDetail.jsx`, `AgentAvailability.jsx`, and compatible routes.

**Tech Stack:** TypeScript, Express 5, Zod, Supabase PostgreSQL, React 19, Tailwind CSS v4, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-calendar-and-appointment-scheduling-design.md`

---

### Task 1: Shared Appointment Contracts, Database Migration & Backend Schemas

**Files:**
- Create: `shared/types/appointment.ts`
- Modify: `shared/types/index.ts`
- Create: `backend/src/models/appointments_calendar_v2_migration.sql`
- Modify: `backend/src/schemas/appointment.schema.ts`
- Test: `test files/backend/appointmentCalendarModule.test.ts`

- [ ] **Step 1: Write failing tests for appointment schema validation, conflict detection, status transitions, reminders, and role permissions**
- [ ] **Step 2: Run Vitest to verify RED failure**
- [ ] **Step 3: Implement `shared/types/appointment.ts`, `appointments_calendar_v2_migration.sql`, and `appointment.schema.ts`**

### Task 2: Backend AppointmentService, Conflict Engine, Reminders, Reassignment & Controller Routes

**Files:**
- Modify: `backend/src/services/appointment.service.ts`
- Modify: `backend/src/controllers/appointment.controller.ts`
- Modify: `backend/src/routes/appointment.routes.ts`
- Modify: `backend/src/services/agentTransfer.service.ts`
- Test: `test files/backend/appointmentCalendarModule.test.ts`

- [ ] **Step 1: Implement atomic conflict checking (`PENDING`/`CONFIRMED` + 15m buffer + working hours + blocked periods), status state machine (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), `24h`/`2h` reminder lifecycle, `reassignAppointment`, `activity_history`, and dual-layer Supabase `appointment_time` persistence**
- [ ] **Step 2: Run backend test suite to verify GREEN**

### Task 3: Frontend Appointment Service, Reusable `<AgentScheduleCalendar />` & Navigation Integration

**Files:**
- Modify: `frontend/src/services/appointmentService.js`
- Create: `frontend/src/components/dashboard/calendar/AgentScheduleCalendar.jsx`
- Modify: `frontend/src/components/dashboard/DashboardSidebar.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAgents.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAgentDetail.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerAppointments.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentAvailability.jsx`
- Modify: `frontend/src/pages/portals/agent/AgentAppointments.jsx`
- Modify: `frontend/src/pages/portals/client/ClientDashboard.jsx`
- Test: `test files/frontend/appointmentCalendarInterface.test.jsx`

- [ ] **Step 1: Write failing frontend tests for sidebar removal, Agent Management Calendar & Appointments tab, Day/Week/Month view switching, status color coding, conflict badges, and appointment actions**
- [ ] **Step 2: Run frontend Vitest to verify RED failure**
- [ ] **Step 3: Implement `appointmentService.js`, `AgentScheduleCalendar.jsx`, and integrate into Broker, Agent, and Client portals**
- [ ] **Step 4: Run frontend and backend test suites + production build to verify GREEN**
