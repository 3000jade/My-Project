# Sandbox Sub-App & Target Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated "Sandbox" sub-application (`/sandbox/*`) within the frontend, equipped with its own dedicated Sandbox Header and Hub dashboard. Migrate the 5 target pages (Valuation, Neighborhood Guides, Journal/Blog, 3D Duplex Demo, UI/UX Labs) into this sub-app, add redirects on the main app, remove their links from the main navbar, and install a pinned floating "Sandbox" launcher button on the main app that opens `/sandbox` in a new tab.

**Architecture:**
- **`frontend/src/components/sandbox/`**:
  - `SandboxHeader.jsx`: High-tech dark glassmorphic navigation header with live pulse badge, routes for all 5 experimental modules, and an "Exit to Main App" link.
  - `SandboxLayout.jsx`: Sub-app layout container rendering `SandboxHeader` and an `<Outlet />`.
  - `SandboxPinnedButton.jsx`: Pinned floating trigger at `bottom-6 left-6` on the main app with an external link indicator to launch `/sandbox` in a new browser tab.
- **`frontend/src/pages/sandbox/`**:
  - `SandboxHubPage.jsx`: Visual overview grid featuring quick launch cards for each of the 5 experimental pages.
- **`frontend/src/components/Header.jsx`**:
  - Streamline main navigation links by removing `/valuation`, `/neighborhoods`, and `/journal`.
- **`frontend/src/App.jsx`**:
  - Mount `/sandbox/*` nested routes under `SandboxLayout`.
  - Provide `<Navigate />` redirects for legacy routes (`/valuation`, `/neighborhoods`, `/journal`, `/duplex-3d`, `/demo-ui-ux`).
  - Render `SandboxPinnedButton` on the main application.

**Spec:** [docs/superpowers/specs/2026-09-10-sandbox-subapp-design.md](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-10-sandbox-subapp-design.md)

---

## Tasks

### Task 1: Create Sandbox Header & Layout
- Create `frontend/src/components/sandbox/SandboxHeader.jsx` with dedicated navigation links:
  - Overview (`/sandbox`), Valuation (`/sandbox/valuation`), Neighborhoods (`/sandbox/neighborhoods`), Journal (`/sandbox/journal`), 3D Demo (`/sandbox/3d-demo`), UI/UX Labs (`/sandbox/ui-ux-labs`), and "Exit to Main App" (`/`).
- Create `frontend/src/components/sandbox/SandboxLayout.jsx` mounting `SandboxHeader` and `<Outlet />`.

### Task 2: Create Sandbox Hub Page
- Create `frontend/src/pages/sandbox/SandboxHubPage.jsx` with interactive hero banner, status badges, module cards, and direct launch buttons.

### Task 3: Create Pinned Sandbox Launcher Button
- Create `frontend/src/components/sandbox/SandboxPinnedButton.jsx` pinned at `bottom-6 left-6 z-40` with an animated pulse and external link icon to open `/sandbox` in a new tab.

### Task 4: Streamline Main Header & Configure Routes
- In `frontend/src/components/Header.jsx`, remove `/valuation`, `/neighborhoods`, and `/journal` links from the main navbar.
- In `frontend/src/App.jsx`:
  - Add `/sandbox/*` route group using `SandboxLayout`.
  - Setup redirects from legacy routes (`/valuation`, `/neighborhoods`, `/journal`, `/duplex-3d`, `/demo-ui-ux`) to their `/sandbox/*` destinations.
  - Mount `SandboxPinnedButton` so it displays across main portal routes.

### Task 5: Build Verification & Verification Testing
- Run `npm run build` in `frontend` to verify 100% clean compilation.
