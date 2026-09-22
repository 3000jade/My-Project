# Clean Up Directory Typos, Consolidate Mock Data, and Update Directory Map

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up naming typos in the workspace directory tree, eliminate scattered and duplicate mock data across `src/data`, `src/utils`, and `src/mockData` into a single canonical `src/mockData/` module, update all importing components, and regenerate an accurate `Analyze/rules/directory_map.txt`.

**Architecture:** 
- Centralize all frontend mock data (`mockProperties`, `mockNeighborhoods`, `mockAbout`, `mockUsers`, etc.) into `frontend/src/mockData/`.
- Unify `mockProperties.js` so that all 12 properties contain both the B2B dashboard schema attributes (`agent_id`, `status`, `price_raw`, `floor_area`, `lot_area`, `created_at`) and consumer showcase attributes (`isLarge`, `exclusive`, `badge`, `architect`, `solarAzimuth`, `agent`).
- Remove redundant directories `frontend/src/data`, `frontend/src/utils`, and empty typo folder `frontend/public/assest`.
- Correct typo folder `Analyze/Componenets` to `Analyze/Components`.
- Completely refresh `Analyze/rules/directory_map.txt` to document the actual current project structure.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Node.js / PowerShell

---

## Tasks

### Task 1: Consolidate and Unify Mock Data in `frontend/src/mockData`
- Move `frontend/src/data/mockNeighborhoods.js` to `frontend/src/mockData/mockNeighborhoods.js`.
- Move `frontend/src/utils/mockAbout.js` to `frontend/src/mockData/mockAbout.js`.
- Move `frontend/src/utils/mockUsers.js` to `frontend/src/mockData/mockUsers.js`.
- Merge `frontend/src/utils/mockProperties.js` (12 items) with `frontend/src/mockData/mockProperties.js` (8 items) into a single 12-item list supporting both consumer and dashboard properties.
- Remove redundant `frontend/src/data/` and `frontend/src/utils/` folders.

### Task 2: Update Component and Page Imports
- Update `PropertiesPage.jsx` import from `../utils/mockProperties` to `../mockData/mockProperties`.
- Update `Home.jsx` import from `../utils/mockProperties` to `../mockData/mockProperties`.
- Update `AboutPage.jsx` import from `../utils/mockAbout` to `../mockData/mockAbout`.
- Update `LoginPage.jsx` import from `../../utils/mockUsers` to `../../mockData/mockUsers`.
- Update `ChatWidget.jsx` import from `../../utils/mockProperties` to `../../mockData/mockProperties`.
- Update `PropertyDetailModal.jsx` import from `../../utils/mockProperties` to `../../mockData/mockProperties`.
- Update `ExclusiveListingsSection.jsx` import from `../../utils/mockProperties` to `../../mockData/mockProperties`.
- Update `NeighborhoodGuidesPage.jsx` import from `../data/mockNeighborhoods` to `../mockData/mockNeighborhoods`.

### Task 3: Directory Cleanups
- Rename `Analyze/Componenets` to `Analyze/Components`.
- Delete empty folder `frontend/public/assest`.

### Task 4: Update Directory Map
- Refresh `Analyze/rules/directory_map.txt` to match the current full tree structure.

### Task 5: Verification
- Run `npm run build` in `frontend` and `backend`.
- Verify zero broken imports.
