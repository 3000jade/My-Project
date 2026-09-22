# Sandbox Sub-App Architecture & Target Pages Migration Specification

**Date:** 2026-09-10  
**Status:** Approved by Human Partner  
**Target:** Isolation of Experimental Modules (Valuation, Neighborhoods, Journal, 3D Demo, UI/UX Labs) into a Dedicated Sandbox Sub-App.

---

## 1. Overview & Objectives

The goal is to separate secondary and experimental preview features from the primary consumer luxury portal and house them in a dedicated **Sandbox** sub-application within the frontend workspace.

The Sandbox will:
1. Provide a focused environment for testing, prototyping, and reviewing experimental modules.
2. Feature a dedicated **Sandbox Header** tailored specifically for navigating between sandbox modules.
3. Be launched from a persistent, pinned **Sandbox Button** on the main application that opens the sandbox in a fresh browser tab (`target="_blank"`).
4. Remove these secondary routes from the main marketing navbar while keeping backwards-compatible redirects for existing bookmarks.

---

## 2. Target Pages to Migrate

| Main Route (Old) | Sandbox Route (New) | Page Component | Description |
|---|---|---|---|
| `/valuation` | `/sandbox/valuation` | `HomeValuationPage.jsx` | Interactive property valuation calculator |
| `/neighborhoods` | `/sandbox/neighborhoods` | `NeighborhoodGuidesPage.jsx` | Philippine luxury neighborhood guide cards & metrics |
| `/journal` | `/sandbox/journal` | `BlogPage.jsx` | Market insights & editorial articles |
| `/duplex-3d` | `/sandbox/3d-demo` | `Duplex3DPage.jsx` | Three.js interactive 3D duplex viewer |
| `/demo-ui-ux` | `/sandbox/ui-ux-labs` | `DemoUIUXPage.jsx` | Interactive luxury UI/UX component testbed |

---

## 3. Architecture & Routing

### A. Sub-App Shell: `/sandbox/*`
- Nested Route in `App.jsx`:
  ```jsx
  <Route path="/sandbox" element={<SandboxLayout />}>
    <Route index element={<SandboxHubPage />} />
    <Route path="valuation" element={<HomeValuationPage />} />
    <Route path="neighborhoods" element={<NeighborhoodGuidesPage />} />
    <Route path="journal" element={<BlogPage />} />
    <Route path="3d-demo" element={<Duplex3DPage />} />
    <Route path="ui-ux-labs" element={<DemoUIUXPage />} />
  </Route>
  ```
- **Redirects on Main App:**
  - Old routes (`/valuation`, `/neighborhoods`, `/journal`, `/duplex-3d`, `/demo-ui-ux`) will redirect (`<Navigate to="/sandbox/..." replace />`) so no external links or bookmarks break.

### B. Sandbox Layout & Header (`SandboxLayout.jsx` + `SandboxHeader.jsx`)
- **SandboxHeader.jsx**:
  - Distinct aesthetic: Sleek dark glassmorphism (`bg-black/90 backdrop-blur-md border-b border-emerald-500/20`).
  - Left: "SANDBOX // LABS" brand pill with an animated pulse indicator.
  - Center/Right Navigation links:
    - **Hub / Overview** (`/sandbox`)
    - **Valuation** (`/sandbox/valuation`)
    - **Neighborhoods** (`/sandbox/neighborhoods`)
    - **Journal** (`/sandbox/journal`)
    - **3D Demo** (`/sandbox/3d-demo`)
    - **UI/UX Labs** (`/sandbox/ui-ux-labs`)
  - Far Right: "Exit to Main App" button (navigates back to `/`).
- **SandboxHubPage.jsx**:
  - An index dashboard displaying interactive cards for each of the 5 modules with status pills (`Active`, `3D WebGL`, `Interactive`), summaries, and direct links.

### C. Main App Pinned Sandbox Launcher Button
- **Component**: `SandboxPinnedButton.jsx`
- **Position**: Pinned fixed at `bottom-6 left-6 z-40` (away from the `ChatWidget` which sits at `bottom-6 right-6`).
- **Styling**: Luxury dark pill with glowing emerald border, lab/beaker icon, label `"Sandbox Labs"`, and an external link badge.
- **Behavior**: Clicking opens `/sandbox` in a new tab via `window.open('/sandbox', '_blank')` or `<a href="/sandbox" target="_blank" rel="noopener noreferrer">`.
- **Visibility**: Rendered globally across public main application routes.

### D. Main Header Streamlining (`Header.jsx`)
- Remove the `/valuation`, `/neighborhoods`, and `/journal` links from the main navbar navigation array in `Header.jsx`.
- Main navbar will now cleanly feature core luxury real estate links: **Home**, **Properties**, **About**, **Services**, **Testimonials**, **Contact**, and login CTA.

---

## 4. Verification & Testing Plan
1. **Navigation Verification:**
   - Click the pinned Sandbox button on the main app $\rightarrow$ verify it opens `/sandbox` in a new tab.
   - Click each item in the Sandbox Header $\rightarrow$ verify each of the 5 pages loads seamlessly without console errors.
   - Click "Exit to Main App" $\rightarrow$ opens the main portal.
2. **Redirect Verification:**
   - Navigating directly to `/valuation`, `/neighborhoods`, etc. smoothly redirects to their respective `/sandbox/*` paths.
3. **Build & Lint Verification:**
   - Run `npm run build` in `frontend` to verify 100% clean compilation.
