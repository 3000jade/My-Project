# Remove Property Linking from Master Subdivision Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the **Master Subdivision Project** linking (UI, state, data fetching/handlers, and property data fields) from `BrokerCreateListings.jsx` and its location subcomponent while keeping plain `Subdivision Name`, `Phase`, `Block`, and `Lot` text fields intact.

**Architecture:** Strip `subdivisionService` project/lot fetching, `SubdivisionCreateModal`, and `cadastral-lot-picker` from `BrokerCreateListings.jsx`, simplify `SubdivisionLocationFields.jsx` to plain inputs, and remove `subdivision_project_id` / `subdivision_lot_id` mapping from `propertyService.js`.

**Tech Stack:** React, Vite, `shadcn/ui`, `subdivisionService`, `propertyService`

---

### Task 1: Simplify `SubdivisionLocationFields.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/components/property-form/SubdivisionLocationFields.jsx:1-108`

- [ ] **Step 1:** Remove the `Master Subdivision Project` header, `Pick from Master Projects` / `Enter Custom / Unlisted Name` toggle button, `+ New Project` button, and `<select id="subdivision-project-select">` dropdown.
- [ ] **Step 2:** Remove unused props (`subdivisionsList`, `isCustomSubdivisionMode`, `setIsCustomSubdivisionMode`, `setIsSubdivisionModalOpen`, `handleSubdivisionSelect`) and stop clearing `subdivision_project_id` / `subdivision_lot_id` in `onChange`.
- [ ] **Step 3:** Keep `Subdivision Name` `<Input id="subdivision-input">`, `<BuildingCoordinateMatcher>`, and `Phase` / `Block` / `Lot` inputs.

---

### Task 2: Remove Master Subdivision Project State, Functions & UI from `BrokerCreateListings.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx:29-30,293-295,417-423,538-661,2619-2691,4235-4252,5294-5298`

- [ ] **Step 1:** Remove imports for `subdivisionService` (line 29) and `SubdivisionCreateModal` (line 30).
- [ ] **Step 2:** Remove `subdivision_project_id`, `subdivision_lot_id`, and `subdivision_lot_details` from initial `formData` (lines 293–295).
- [ ] **Step 3:** Remove state hooks `subdivisionsList`, `isLoadingSubdivisions`, `isSubdivisionModalOpen`, `availableLots`, `isLoadingLots`, and `isCustomSubdivisionMode` (lines 417–423).
- [ ] **Step 4:** Remove `loadSubdivisions` and `loadLots` `useEffect`s and handlers `handleSubdivisionSelect`, `handleCadastralLotSelect`, and `handleSubdivisionCreated` (lines 538–661).
- [ ] **Step 5:** Simplify `<SubdivisionLocationFields>` props to `{ formData, setFormData, setIsDirty }` and remove the **Cadastral Studio Lots Integration Card** (`cadastral-lot-picker`, lines 2630–2691).
- [ ] **Step 6:** Remove the `subdivision_lot_id` badge and `subdivision_project_id` Interactive Plan View link from the Review step (lines 4235–4252) and remove `<SubdivisionCreateModal>` (lines 5294–5298).

---

### Task 3: Remove `subdivision_project_id` & `subdivision_lot_id` from Property Data Mapping (and Optional DB Migration)

**Files:**
- Modify: `frontend/src/services/propertyService.js:141-144,714-717`
- Optional DB Migration: `supabase/migrations/` (only if confirmed to drop `subdivision_project_id` / `subdivision_lot_id` columns from the `properties` table)

- [ ] **Step 1:** Remove `subdivision_project_id`, `subdivisionProjectId`, `subdivision_lot_id`, and `subdivisionLotId` from `normalizeProperty` and `toApiPayload` in `frontend/src/services/propertyService.js`.
- [ ] **Step 2:** *(If confirmed)* Create a migration to drop `subdivision_project_id` and `subdivision_lot_id` from `properties`.

---

### Task 4: Verify Build & Tests

- [ ] **Step 1:** Run `cd frontend && npx vite build` and confirm 0 errors.
- [ ] **Step 2:** Run `cd frontend && npx vitest run src/pages/portals/broker/BrokerCreateListings.test.jsx` to verify existing listing tests pass.
