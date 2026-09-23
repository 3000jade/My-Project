# Frontend Directory Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the frontend codebase into a clean, intuitive, and modular hierarchy by isolating experimental UI showcases inside `frontend/src/sandbox/components/`, decomposing production UI into `frontend/src/components/ui/{core,cards,modals,search,sections}`, partitioning route pages into `pages/public/` and `pages/portals/`, and providing zero-disruption barrel re-exports.

**Architecture:** Implement a domain-partitioned hybrid structure with a 100% self-contained sandbox lab. Retain full backward compatibility for all imports using master barrel hubs (`components/ui/index.js`, `sandbox/components/index.js`) and transparent re-export shims.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, Framer Motion, Vitest, React Router v7.

**Spec:** [`docs/superpowers/specs/2026-09-24-frontend-directory-reorganization-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-24-frontend-directory-reorganization-design.md)

## Global Constraints
- Do NOT break existing imports: every moved component must remain resolvable via its original import path using shim re-exports or barrel exports.
- All 20 experimental UI showcases belong strictly to `frontend/src/sandbox/components/`.
- All operational dashboards belong in `frontend/src/pages/portals/{agent,broker,client,super-admin}`.
- All public guest marketing pages belong in `frontend/src/pages/public/`.
- Baseline control heights (`h-[54px]`) and concentric curvature rules ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$) must remain preserved.

---

### Task 1: Isolate Sandbox Ecosystem (Showcases, Chrome, and Pages)

**Files:**
- Create:
  - `frontend/src/sandbox/components/`
  - `frontend/src/sandbox/layout/`
  - `frontend/src/sandbox/pages/`
  - `frontend/src/sandbox/components/index.js`
- Move to `frontend/src/sandbox/components/`:
  - `AnimatedVectorShapeShowcase.jsx`
  - `AnimeMorphingAnimalsShowcase.jsx`
  - `AnimeParallaxShowcase.jsx`
  - `BorderlessLuxuryCardShowcase.jsx`
  - `CatwalkHorizontalShowcase.jsx`
  - `EditorialRevealsShowcase.jsx`
  - `EditorialSplitTextShowcase.jsx`
  - `FramerMotionShowcase.jsx`
  - `HorizontalAndPinnedScrollShowcase.jsx`
  - `LiquidKerningShowcase.jsx`
  - `LookCloserMicroParallax.jsx`
  - `OverlappingOffsetCardShowcase.jsx`
  - `ParallaxMultiVectorHero.jsx`
  - `ParallaxPropertyShowcase.jsx`
  - `PinnedDollyHeroShowcase.jsx`
  - `PremiumLensTextTransitionShowcase.jsx`
  - `ScrollScrubbedVideoShowcase.jsx`
  - `StarTwinkleCanvas.jsx`
  - `VectorHUDOverlay.jsx`
  - `VectorParallaxNatureShowcase.jsx`
- Move to `frontend/src/sandbox/layout/`:
  - `SandboxHeader.jsx`
  - `SandboxLayout.jsx`
  - `SandboxPinnedButton.jsx`
- Move to `frontend/src/sandbox/pages/`:
  - `BlogPage.jsx`
  - `DemoUIUXPage.jsx`
  - `Duplex3DPage.jsx`
  - `HomeValuationPage.jsx`
  - `NeighborhoodGuidesPage.jsx`
  - `ParallaxLabPage.jsx`
  - `SandboxHubPage.jsx`
- Create Shim bridges in `frontend/src/components/ui/` for the 20 moved showcases.

**Interfaces:**
- Consumes: Static sandbox assets in `frontend/src/sandbox/assets/`.
- Produces: `frontend/src/sandbox/components/index.js` exporting all 20 experimental showcases.

- [ ] **Step 1: Create target sandbox directories**
  Create `frontend/src/sandbox/components`, `frontend/src/sandbox/layout`, and `frontend/src/sandbox/pages`.

- [ ] **Step 2: Relocate the 20 experimental showcase components to `sandbox/components/`**
  Move the 20 files from `frontend/src/components/ui/` to `frontend/src/sandbox/components/`.
  In each moved showcase file, update any relative asset references pointing to `../../sandbox/assets/` to `../assets/`.

- [ ] **Step 3: Relocate sandbox chrome to `sandbox/layout/` and sandbox routes to `sandbox/pages/`**
  Move `SandboxHeader.jsx`, `SandboxLayout.jsx`, `SandboxPinnedButton.jsx` into `frontend/src/sandbox/layout/`.
  Move `BlogPage.jsx`, `DemoUIUXPage.jsx`, `Duplex3DPage.jsx`, `HomeValuationPage.jsx`, `NeighborhoodGuidesPage.jsx`, `ParallaxLabPage.jsx`, `SandboxHubPage.jsx` into `frontend/src/sandbox/pages/`.
  Update relative imports between pages and layout (e.g. `import SandboxLayout from '../layout/SandboxLayout'`).

- [ ] **Step 4: Create `frontend/src/sandbox/components/index.js` barrel export**
  Export all 20 showcase components from `frontend/src/sandbox/components/index.js`.

- [ ] **Step 5: Create backward-compatibility re-export shims in `components/ui/`**
  For each of the 20 moved showcases, place a 2-line re-export file in `frontend/src/components/ui/` (e.g., `export * from '../../sandbox/components/AnimatedVectorShapeShowcase'; export { default } from '../../sandbox/components/AnimatedVectorShapeShowcase';`).

- [ ] **Step 6: Run frontend test suite to verify zero broken imports**
  Run: `npm test -- --run` in `frontend/`.
  Expected: All tests pass.

- [ ] **Step 7: Commit sandbox isolation changes**
  Commit message: `refactor(sandbox): isolate experimental showcases and pages into sandbox directory`

---

### Task 2: Decompose Production UI Components into Domain Categories

**Files:**
- Create:
  - `frontend/src/components/ui/core/`
  - `frontend/src/components/ui/cards/`
  - `frontend/src/components/ui/modals/`
  - `frontend/src/components/ui/search/`
  - `frontend/src/components/ui/sections/`
  - `frontend/src/components/ui/index.js`
- Move:
  - `core/`: `Button.jsx`, `DynamicBackground.jsx`, `FilterEmptyState.jsx`, `FilterEmptyState.test.jsx`, `KeySpecsBar.jsx`, `PageLoader.jsx`
  - `cards/`: `ActionConsole.jsx`, `AgentCard.jsx`, `AnalyticsMetricCard.jsx`, `GalleryCard.jsx`, `NeighborhoodCard.jsx`, `PropertyCard.jsx`
  - `modals/`: `InspectionScheduleModal.jsx`, `PropertyDetailModal.jsx`
  - `search/`: `AdvancedSearchBox.jsx`
  - `sections/`: `AgentBrokerSection.jsx`, `ArchitecturalGallerySection.jsx`, `BrandHeritageSection.jsx`, `ClientStoriesSection.jsx`, `ExclusiveListingsSection.jsx`, `FeaturesAmenitiesSection.jsx`, `FinancialCalculatorSection.jsx`, `FinancingCalculator.jsx`, `HeroVisualAnchor.jsx`, `HomeValuationTool.jsx`, `InstitutionalAuthoritySection.jsx`, `LeadCaptureSection.jsx`, `ListingHeroGallery.jsx`, `LocationNeighborhoodSection.jsx`, `NeighborhoodSpotlightsSection.jsx`, `PropertyGalleryMosaic.jsx`, `PropertyOverviewSection.jsx`, `RelatedListingsSection.jsx`, `SearchBarSection.jsx`, `SocialProofSection.jsx`, `TestimonialCarousel.jsx`
- Create Shim bridges in `frontend/src/components/ui/` for all 36 moved components.

**Interfaces:**
- Consumes: Tailwind styles, Lucide/Tabler icons, Framer Motion.
- Produces: `frontend/src/components/ui/index.js` exporting all production UI components.

- [ ] **Step 1: Create UI category directories**
  Create `core`, `cards`, `modals`, `search`, and `sections` under `frontend/src/components/ui/`.

- [ ] **Step 2: Relocate production components to category subdirectories**
  Move files to `core/`, `cards/`, `modals/`, `search/`, and `sections/` according to the specification.
  Update any internal intra-ui relative imports (e.g. `import Button from '../core/Button'`).

- [ ] **Step 3: Create `frontend/src/components/ui/index.js` master barrel export**
  Re-export all components from `core/`, `cards/`, `modals/`, `search/`, and `sections/`.

- [ ] **Step 4: Create backward-compatible re-export shims in `frontend/src/components/ui/`**
  For each moved component, leave a 2-line re-export stub (e.g. in `frontend/src/components/ui/Button.jsx`: `export * from './core/Button'; export { default } from './core/Button';`).

- [ ] **Step 5: Run tests to verify all component references resolve**
  Run: `npm test -- --run` in `frontend/`.
  Expected: PASS.

- [ ] **Step 6: Commit UI categorization changes**
  Commit message: `refactor(ui): decompose production UI components into core, cards, modals, search, and sections`

---

### Task 3: Structure Pages Hierarchy (Public vs. Portals)

**Files:**
- Create:
  - `frontend/src/pages/public/`
  - `frontend/src/pages/portals/`
- Move to `frontend/src/pages/public/`:
  - `AboutPage.jsx`
  - `ContactPage.jsx`
  - `DemoApiPage.jsx`
  - `Home.jsx`
  - `HowWeWorkPage.jsx`
  - `PartnerPage.jsx`
  - `PropertiesPage.jsx`
  - `PropertyListingView.jsx`
  - `UnauthorizedPage.jsx`
- Move to `frontend/src/pages/portals/`:
  - `agent/`
  - `broker/`
  - `client/`
  - `super-admin/`
- Modify:
  - `frontend/src/App.jsx`
- Create re-export bridges in `frontend/src/pages/` for relocated public pages and portals.

**Interfaces:**
- Consumes: Components from `components/layout/`, `components/ui/`, `components/dashboard/`.
- Produces: Clean, categorized page routing in `frontend/src/App.jsx`.

- [ ] **Step 1: Create `pages/public/` and `pages/portals/` directories**
  Create the target directories under `frontend/src/pages/`.

- [ ] **Step 2: Relocate public marketing routes to `pages/public/`**
  Move `AboutPage.jsx`, `ContactPage.jsx`, `DemoApiPage.jsx`, `Home.jsx`, `HowWeWorkPage.jsx`, `PartnerPage.jsx`, `PropertiesPage.jsx`, `PropertyListingView.jsx`, `UnauthorizedPage.jsx` into `frontend/src/pages/public/`.

- [ ] **Step 3: Relocate portal folders to `pages/portals/`**
  Move `agent`, `broker`, `client`, `super-admin` into `frontend/src/pages/portals/`.

- [ ] **Step 4: Update `frontend/src/App.jsx` route imports**
  Update lazy imports and direct imports in `App.jsx` to load from `pages/public/` and `pages/portals/`.

- [ ] **Step 5: Create re-export shims in `frontend/src/pages/`**
  Create shim files in `frontend/src/pages/` (e.g. `Home.jsx` -> `export { default } from './public/Home';`) and portal directory bridges so any legacy references or external tests resolve.

- [ ] **Step 6: Run tests to verify router and page rendering**
  Run: `npm test -- --run` in `frontend/`.
  Expected: PASS.

- [ ] **Step 7: Commit page hierarchy restructuring**
  Commit message: `refactor(pages): partition public guest routes and role portals`

---

### Task 4: Complete Build Validation & Verification

**Files:**
- Test: All unit and integration test suites.
- Verify: Full production build bundle.

- [ ] **Step 1: Run full frontend test suite**
  Run: `npm test -- --run` in `frontend/`.
  Verify all suites pass without errors.

- [ ] **Step 2: Run production bundle build**
  Run: `npm run build` in `frontend/`.
  Verify Vite compiles bundle without warnings or broken chunk imports.

- [ ] **Step 3: Verify git status and clean tree**
  Run: `git status` to confirm all files are tracked and committed.
