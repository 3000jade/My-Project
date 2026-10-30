# Property Status Alignment & Synchronization Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile and align property listing status handling across the backend services, shared contracts, frontend consoles, and UI components with RESO Data Dictionary 2.0 standards, database integrity constraints, and `design.md` tokens.

**Architecture:**
1. **Backend Status Synchronization Engine (`backend/src/services/property.service.ts`):** 
   Harmonize `updateProperty()` and `createProperty()` so updates to `standardStatus` automatically and deterministically derive valid database `status` (`available`, `pending`, `sold`) and publication flags (`is_published`), eliminating status drift and PostgreSQL check constraint violations.
2. **Frontend Service Normalization (`frontend/src/services/propertyService.js`):** 
   Update `toApiPayload()` and `normalizeProperty()` to support bi-directional status translation without dropping RESO standard statuses (`Active`, `Active Under Contract`, `Pending`, `Closed`, `Draft`, `Pending Confirmation`, `Action Required`).
3. **Design Tokens Compliance (`frontend/src/components/dashboard/StatusBadge.jsx`):** 
   Upgrade `StatusBadge` from obsolete palette values (`#266F71`, `#FB8E5D`) to `design.md` tokens (Spruce Teal `#0F766E`, Approved Coral `#FF6B6B`, Amber Warning `#F59E0B`, Slate Neutral `#334155`), ensuring accessible contrast and ARIA screen reader compliance.
4. **Broker Console Alignment (`BrokerPropertyDetail.jsx`, `PropertyQuickEditDrawer.jsx`, `BrokerProperties.jsx`):** 
   - Align status selectors in `BrokerPropertyDetail` with RESO standard statuses.
   - Fix hardcoded "Published" publication indicator to reflect live listing state dynamically.
   - Update `PropertyQuickEditDrawer` status pills to adhere to design tokens and valid database values.
   - Align table status badges in `BrokerProperties` (Sold = Slate neutral, Draft = Slate muted, Action Required = Rose alert).
5. **Master Living SRS & Verification:** Register `FR-PL-020` in `docs/REQUIREMENTS_SPECIFICATION.md` and generate dated verification records.

**Tech Stack:** Node.js, Express, TypeScript, React 19, Tailwind CSS v4, Vitest, Playwright E2E.

**Spec Reference:** `docs/modules/02-property-listing/ui-specification.md`, `design.md`, and Master SRS (`docs/REQUIREMENTS_SPECIFICATION.md`).

---

## Global Constraints & Invariants

1. **Public View Invariant:** 
   NEVER modify `frontend/src/pages/public/PropertyListingView.jsx` or `frontend/src/pages/public/PropertiesPage.jsx`.
2. **Decoupled Agent Assignment Invariant:** 
   NEVER re-introduce sales agent assignment into property listing intake wizard.
3. **Database Check Constraint Invariant:** 
   The database column `properties.status` has a strict constraint: `CHECK (status IN ('available', 'pending', 'sold'))`. Any status update written to Supabase must supply one of these three lowercase values.
4. **Security Trigger Invariant:** 
   Database trigger `enforce_property_status_lifecycle()` strictly forbids non-broker and non-admin roles from transitioning `standard_status` to `'Active'`.
5. **Design System Tokens (`design.md`):**
   - Primary Spruce Teal: `#0F766E`
   - Primary Hover: `#115E59`
   - Approved Coral Accent: `#FF6B6B`
   - Surface: `#FFFFFF`
   - Canvas: `#F8FAFC`
   - Text Primary: `#1E293B`
   - Text Secondary / Muted: `#64748B`
   - Border: `#E2E8F0`
   - Success: `#10B981` (Emerald)
   - Warning: `#F59E0B` (Amber)
   - Destructive / Alert: `#DC2626` / `#BE123C` (Rose)

---

## User Review Required

> [!IMPORTANT]
> **Bi-Directional Status Mapping Rule:**
> When a broker sets `standardStatus = 'Draft'` or `'Pending Approval'`, the legacy `status` column will be stored as `'pending'` because the PostgreSQL database constraint only permits `'available'`, `'pending'`, or `'sold'`. `is_published` will be set to `false`. This ensures listings are never exposed to public search or client portals while satisfying database integrity.

> [!NOTE]
> **Publication Status Dynamic Logic:**
> In `BrokerPropertyDetail.jsx`, the publication status card previously displayed a hardcoded static green "Published" badge for all properties. It will now dynamically render:
> - **Published (`bg-emerald-50 text-emerald-700 border-emerald-200`)**: When `property.is_published === true && property.standard_status === 'Active'`.
> - **Unpublished / Private (`bg-slate-100 text-slate-700 border-slate-200`)**: When `property.is_published === false` or `standard_status !== 'Active'`.

---

## Proposed Changes

### Component 1: Backend Services (`backend/src/services/property.service.ts`)

#### [MODIFY] `backend/src/services/property.service.ts`
- Implement helper function `deriveLegacyStatus(standardStatus: string): { status: 'available' | 'pending' | 'sold'; isPublished: boolean }`:
  - `'Active'` -> `{ status: 'available', isPublished: true }`
  - `'Active Under Contract'` / `'Reserved'` -> `{ status: 'pending', isPublished: true }`
  - `'Pending'` -> `{ status: 'pending', isPublished: false }`
  - `'Closed'` / `'Sold'` -> `{ status: 'sold', isPublished: false }`
  - `'Pending Confirmation'` / `'Action Required'` / `'Pending Approval'` / `'Draft'` / `'Canceled'` / `'Expired'` -> `{ status: 'pending', isPublished: false }`
- In `updateProperty()`:
  - If `data.standardStatus` is provided, automatically compute `status` and `isPublished` via `deriveLegacyStatus()`.
  - If `data.status` is provided instead (legacy client), map to canonical `standardStatus` (`available` -> `Active`, `pending` -> `Pending`, `sold` -> `Closed`).
  - Respect explicit `data.isPublished` override if supplied by authorized broker.
  - Fix lines 1588-1589 where `status` was previously frozen to `existing.status` for all non-Active updates.

---

### Component 2: Frontend Service Contracts (`frontend/src/services/propertyService.js`)

#### [MODIFY] `frontend/src/services/propertyService.js`
- In `toApiPayload()`:
  - Synchronize `standardStatus` and `status` cleanly so API updates carry both values correctly:
    ```javascript
    const derived = deriveLegacyStatus(item.standardStatus || item.standard_status);
    standardStatus: item.standardStatus || item.standard_status || derived.standardStatus,
    status: derived.status,
    isPublished: item.is_published !== undefined ? Boolean(item.is_published) : derived.isPublished,
    ```
- In `normalizeProperty()`:
  - Ensure `standard_status` and `standardStatus` are consistently populated from backend response rows.

---

### Component 3: Design Tokens & Shared Status Badge (`frontend/src/components/dashboard/StatusBadge.jsx`)

#### [MODIFY] `frontend/src/components/dashboard/StatusBadge.jsx`
- Replace outdated palette `#266F71` with `#0F766E` (Spruce Teal) and `#FB8E5D` with `#F59E0B` (Amber) / `#FF6B6B` (Coral).
- Add support for all RESO standard statuses:
  - `ACTIVE`: `bg-emerald-50 text-emerald-700 border-emerald-200/80`
  - `AVAILABLE`: `bg-emerald-50 text-emerald-700 border-emerald-200/80`
  - `NEEDS APPROVAL` / `PENDING APPROVAL`: `bg-amber-50 text-amber-800 border-amber-200` (pulsing dot)
  - `PENDING CONFIRMATION`: `bg-amber-50 text-amber-800 border-amber-200` (pulsing dot)
  - `ACTION REQUIRED`: `bg-rose-50 text-rose-800 border-rose-200` (pulsing dot)
  - `ACTIVE UNDER CONTRACT` / `UNDER CONTRACT`: `bg-amber-50 text-amber-700 border-amber-200/80`
  - `RESERVED`: `bg-amber-50 text-amber-700 border-amber-200/80`
  - `PENDING`: `bg-blue-50 text-blue-700 border-blue-200/80`
  - `CLOSED` / `SOLD`: `bg-slate-100 text-slate-700 border-slate-300` (slate neutral)
  - `DRAFT` / `INACTIVE`: `bg-slate-100 text-slate-500 border-slate-200` (muted neutral)
  - `EXPIRED` / `CANCELED`: `bg-slate-100 text-slate-600 border-slate-200`

---

### Component 4: Broker Administrative Consoles

#### [MODIFY] `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx`
- In `handleStatusChange()`:
  - Update payload to send proper RESO `standardStatus` and derived `status`.
- In `Listing Status` card:
  - Expand status dropdown to full set of authorized broker statuses:
    - `<option value="Active">Active (Publicly Listed)</option>`
    - `<option value="Active Under Contract">Active Under Contract (Reserved)</option>`
    - `<option value="Pending">Pending (Under Escrow / Mortgage)</option>`
    - `<option value="Closed">Closed (Sold / Conveyed)</option>`
    - `<option value="Pending Approval">Needs Approval (Pending Broker Review)</option>`
    - `<option value="Draft">Draft (Offline)</option>`
    - Include `Pending Confirmation` and `Action Required` when applicable.
- In `Publication Status` card:
  - Replace static green "Published" markup with dynamic status indicator:
    - If `property.is_published && property.standard_status === 'Active'`: Emerald badge ("Published / Live").
    - Else: Slate badge ("Unpublished / Private").

#### [MODIFY] `frontend/src/components/cms/PropertyQuickEditDrawer.jsx`
- Update `STATUS_PILLS` to use `design.md` tokens:
  - `Approve & Activate` (`standardStatus: 'Active'`, `status: 'available'`)
  - `Under Contract` (`standardStatus: 'Active Under Contract'`, `status: 'pending'`)
  - `Closed` (`standardStatus: 'Closed'`, `status: 'sold'`, Slate-100/Slate-700)
  - `Needs Approval` (`standardStatus: 'Pending Approval'`, `status: 'pending'`)
  - `Draft` (`standardStatus: 'Draft'`, `status: 'pending'`, Slate-50/Slate-600)

#### [MODIFY] `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Align table Status column styling with `design.md`:
  - `Sold`: Change from Rose-50 to Slate Neutral (`bg-slate-100 text-slate-700 border-slate-300`).
  - `Draft`: Change from Blue-50 to Slate Muted (`bg-slate-100 text-slate-600 border-slate-200`).
  - Ensure badges and action buttons (`Approve`, `Reassign`) are accessible and visually consistent.

---

### Component 5: Master Registries & Documentation

#### [MODIFY] `docs/REQUIREMENTS_SPECIFICATION.md`
- Add revision entry in Section 1 (Revision History) for `FR-PL-020`.
- Register `FR-PL-020: Unified Property Status Alignment & Synchronization Engine` in Section 3 under Property Listing module.

#### [MODIFY] `docs/modules/02-property-listing/ui-specification.md`
- Document status taxonomy, design token mappings, and dynamic publication rules.

#### [NEW] `docs/modules/02-property-listing/2026-10-28-property-status-alignment-verification.md`
- Create dated verification record with frontmatter, test results, and requirement traceability.

#### [MODIFY] `docs/modules/02-property-listing/INDEX.md`
- Increment document count and register verification record.

---

## Verification Plan

### Automated Tests
1. **Vitest Unit & Regression Tests:**
   ```bash
   npm run test --prefix frontend -- StatusBadge BrokerProperties BrokerPropertyDetail PropertyQuickEditDrawer PropertyFilterToolbar primitives
   ```
2. **Backend Service Unit Tests:**
   ```bash
   npm run test --prefix backend -- property.service.test.ts
   ```
3. **Playwright E2E Decoupling & Status Tests:**
   ```bash
   powershell -Command "cd frontend; npx playwright test property-agent-assignment-decoupling.spec.ts"
   ```
4. **Invariant Audit:**
   ```bash
   git diff HEAD -- frontend/src/pages/public/PropertyListingView.jsx frontend/src/pages/public/PropertiesPage.jsx
   ```
   (Must output 0 diff lines).

### Manual Verification in Browser (Playwright MCP)
1. **Broker Status Mutation:**
   - Navigate to `/broker/properties/:id` as broker.
   - Switch status to `Active Under Contract` -> verify status card updates and publication status adjusts.
   - Switch status to `Closed` -> verify status updates to `Closed` and table reflects `Sold` with Slate styling.
2. **Quick Edit Drawer Workflow:**
   - In `/broker/properties`, open Quick Edit drawer on a property.
   - Click "Approve & Activate" -> save -> verify property moves to Active tab.
3. **Publication Status Check:**
   - Verify non-active properties clearly display "Unpublished / Private" in `BrokerPropertyDetail`.
