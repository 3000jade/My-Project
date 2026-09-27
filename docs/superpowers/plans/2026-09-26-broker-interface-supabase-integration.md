# Broker Interface & Supabase Schema Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify and upgrade the Broker Property Listing Interface (`BrokerProperties.jsx`, `BrokerPropertyEditStudio.jsx`, `PropertyQuickEditDrawer.jsx`) to natively support the PostgreSQL master schema in `supabase_schema.sql` (RESO 2.0 statuses, approval workflows, confidential broker data, HOA dues, and CAD blueprints).

**Architecture:** Dual-Tier REST through Express API Gateway with optimistic local UI updates, 600ms debounced auto-save telemetry, 80/20 progressive disclosure accordions, and automatic development auth fallback.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React, Framer Motion, Express, PostgreSQL / Supabase, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-26-broker-interface-supabase-integration-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-26-broker-interface-supabase-integration-design.md)

## Global Constraints
- Strictly adhere to `design.md`: 60% Plain Alabaster (`#FBFBF9`), 30% Spruce Teal (`#0D4446`), 10% Burnt Terracotta Coral (`#E76F51`), WCAG AAA text ink (`#0F172A` / `#141717`).
- Strictly maintain human-readable labels on all user-facing surfaces; never display raw database acronyms or CamelCase developer terms.
- Preserve all existing automated test assertions and `data-testid` props in [`test files/frontend/pages/broker/BrokerProperties.test.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/test%20files/frontend/pages/broker/BrokerProperties.test.jsx).
- Git Safety Gate: NEVER execute `git push`, force-push, or publish remote branches.

---

### Task 1: Data Contracts, DTO Adapter & Service Integration

**Files:**
- Modify: `frontend/src/services/propertyService.js`
- Modify: `frontend/src/services/apiClient.js`

**Interfaces:**
- Consumes: REST endpoints `/api/properties`, `/api/properties/:id`
- Produces: `toApiPayload(formData)` converting flat ergonomic studio state into backend Zod DTO; `normalizeProperty(raw)` with full RESO schema fields (`standard_status`, `listing_id`, `association_fee`, `living_area`, `confidential`, `media`).

- [ ] **Step 1: Write unit tests for `toApiPayload` and `normalizeProperty`**
  Verify that `toApiPayload` correctly maps living area, association dues, and confidential broker terms, and that `normalizeProperty` handles both baseline and extended RESO columns.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- src/services/propertyService.test.js --run`

- [ ] **Step 3: Implement `toApiPayload` and enhance `normalizeProperty` in `propertyService.js`**
  Add `toApiPayload` and map `association_fee`, `standard_status`, `living_area`, `lot_size_area`, `listing_id`, and `confidential` fields.

- [ ] **Step 4: Update `apiClient.js` with frictionless dev auth fallback**
  Ensure the request interceptor injects `dev-mock-jwt-token-broker` in development mode if no live `cp_auth_token` is present.

- [ ] **Step 5: Run tests to verify they pass**
  Run: `npm test -- src/services/propertyService.test.js --run`

---

### Task 2: Status Badge & Workflow Primitives

**Files:**
- Modify: `frontend/src/components/ui/core/StatusBadge.jsx`

**Interfaces:**
- Consumes: `status` string (`Draft`, `Pending Approval`, `Active`, `Active Under Contract`, `Closed`, `Canceled`, `Expired`)
- Produces: Visual beacon badge with WCAG AAA daylight colors and semantic labels.

- [ ] **Step 1: Update `StatusBadge.jsx` to support all 8 RESO standard statuses**
  Map `Pending Approval` (amber beacon), `Active` (emerald beacon), `Active Under Contract` (blue beacon), `Closed` (slate badge), and `Draft` (neutral zinc pill).

- [ ] **Step 2: Verify component rendering across all status types**
  Run: `npm test -- src/components/ui/core/StatusBadge.test.jsx --run`

---

### Task 3: Broker Inventory Workspace & Approval Queue

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Test: `test files/frontend/pages/broker/BrokerProperties.test.jsx`

**Interfaces:**
- Consumes: `propertyService.getProperties`, `propertyService.updateProperty`, `propertyService.createProperty`
- Produces: Executive Filter Tabs with "Needs Approval" count badge, 6-column high-density ledger, 1-click inline "Approve & Activate" button, and multi-row batch actions.

- [ ] **Step 1: Add Executive Filter Tabs (`All Listings`, `Needs Approval`, `Active`, `Under Contract`, `Closed`)**
  Compute counts dynamically; display an amber beacon on "Needs Approval" when items with `standard_status = 'Pending Approval'` exist.

- [ ] **Step 2: Refactor table columns to 6-column executive ledger**
  Include MLS Cadastre ID, assigned agent avatar chip, subdivision sub-label, monthly HOA dues under price, and living area specs.

- [ ] **Step 3: Add 1-click inline "Approve & Activate" button**
  Allow brokers to approve listings directly in the row with instant optimistic state update and API dispatch.

- [ ] **Step 4: Enhance floating batch action bar**
  Include "Approve Selected" and "Set Under Contract" with batch `propertyService.updateProperty` execution.

- [ ] **Step 5: Run Vitest on `BrokerProperties.test.jsx` to verify all 7 tests pass**
  Run: `npm test -- "../test files/frontend/pages/broker/BrokerProperties.test.jsx" --run`

---

### Task 4: High-Velocity Quick Edit Drawer

**Files:**
- Modify: `frontend/src/components/cms/PropertyQuickEditDrawer.jsx`

**Interfaces:**
- Consumes: `property` object from table row click
- Produces: Instant 1-click status transitions (`Approve/Activate`, `Under Contract`, `Closed`, `Draft`), numeric price tuning, agent assignment, monthly HOA dues, and private remarks snippet.

- [ ] **Step 1: Expand `PropertyQuickEditDrawer.jsx` with RESO status pills and carrying costs**
  Add 1-click status transition buttons, monthly HOA dues input, assigned agent selector, and private remarks snippet.

- [ ] **Step 2: Connect save handler directly to `propertyService.updateProperty`**
  Persist updates to the Express API with optimistic local state updates.

- [ ] **Step 3: Verify drawer opens, edits, and saves cleanly**
  Run: `npm test -- src/components/cms/PropertyQuickEditDrawer.test.jsx --run`

---

### Task 5: 5-Accordion Split-Screen Studio & Dual-Mode Live Preview

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerPropertyEditStudio.jsx`

**Interfaces:**
- Consumes: `propertyService.getPropertyById`, `propertyService.updateProperty`, `propertyService.createProperty`
- Produces: 5-Accordion progressive disclosure left pane, quiet debounced auto-save with localStorage draft recovery, and right pane dual-mode preview (Photo $\leftrightarrow$ CAD Blueprint with unit switcher).

- [ ] **Step 1: Implement 5-Accordion Progressive Disclosure hierarchy**
  - Accordion 1: Physical Specs & Spatial Dimensions (`living_area`, `lot_size_area`, beds, baths, stories, style)
  - Accordion 2: Location & Neighborhood Cadastre (Address, Subdivision, City, Postal Code)
  - Accordion 3: Carrying Costs & HOA (`association_fee`, frequency, annual tax, original price)
  - Accordion 4: Broker Confidential & Co-Broke (`buyer_agency_compensation`, lockbox code, showing instructions, private remarks)
  - Accordion 5: Media & CAD Blueprints (`property_media` categorization: FloorPlan vs Photo)

- [ ] **Step 2: Connect quiet 600ms debounced auto-save to `propertyService.updateProperty`**
  Implement non-blocking toolbar telemetry (`Saved` $\rightarrow$ `Saving...` $\rightarrow$ `Saved just now`), with `localStorage` draft stash and retry button on failure.

- [ ] **Step 3: Enhance right pane with Dual-Mode Live Preview**
  Include in-place unit switcher ($\text{m}^2 \leftrightarrow \text{sq ft}$) and interactive Photo $\leftrightarrow$ CAD Blueprint toggle.

- [ ] **Step 4: Verify Studio loads, switches tabs, and persists changes**
  Run: `npm test -- src/pages/portals/broker/BrokerPropertyEditStudio.test.jsx --run`

---

### Task 6: Full Verification, Regression Testing & Production Build

**Files:**
- Full suite verification across all frontend test files.

- [ ] **Step 1: Run complete Vitest suite**
  Run: `npm test -- --run`
  Expected: 45+ test files pass, 130+ tests pass, 0 failures.

- [ ] **Step 2: Run production build**
  Run: `npm run build`
  Expected: 0 compilation errors, clean bundle output.

- [ ] **Step 3: Manual sanity check across broker pages**
  Verify `/broker/properties` and `/broker/properties/:id/edit` with clean daylight styling and responsive mobile layout.
