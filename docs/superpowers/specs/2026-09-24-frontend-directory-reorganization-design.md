# Frontend Directory Reorganization & Sandbox Isolation Design

**Date**: 2026-09-24  
**Classification**: Architectural  
**Status**: Draft (Pending User Final Approval)  

---

## 1. Executive Summary & Problem Statement

As the **CP_kerby** platform has evolved to incorporate multi-tenant role workspaces (`agent`, `broker`, `client`, `super-admin`) and elaborate visual experimental labs, the frontend presentation directory (`frontend/src/`) developed structural friction:

1. **Unorganized UI Layer**: `frontend/src/components/ui/` grew to 56 flat files, conflating atomic primitives (`Button.jsx`), domain cards (`PropertyCard.jsx`), marketing sections (`BrandHeritageSection.jsx`), and 50KB+ experimental motion labs (`AnimatedVectorShapeShowcase.jsx`, `VectorParallaxNatureShowcase.jsx`).
2. **Blurred Sandbox Boundaries**: Experimental showcases tested in `/sandbox` routes were placed inside the production `components/ui/` library, polluting production code with staging-only graphics and heavy multi-plate raster assets.
3. **Route Heterogeneity**: `frontend/src/pages/` mingled general public marketing pages (`Home.jsx`, `AboutPage.jsx`, `PropertiesPage.jsx`) with multi-tenant dashboard portals (`agent/`, `broker/`, `client/`, `super-admin/`).

### Core Objectives:
1. **Self-Contained Sandbox Ecosystem**: Move all experimental showcase components and sandbox page chrome directly into `frontend/src/sandbox/`, making the sandbox 100% self-contained and isolated from production bundles.
2. **Domain-Partitioned Production UI**: Categorize the remaining production UI into `core/`, `cards/`, `modals/`, `search/`, and `sections/` with a root `index.js` barrel export.
3. **Structured Pages Hierarchy**: Separate guest/public marketing routes into `pages/public/` and multi-tenant portals into `pages/portals/{agent,broker,client,super-admin}`.
4. **Zero Broken Imports**: Provide barrel re-exports and import bridges in `components/ui/` so existing references continue to resolve seamlessly.
5. **Updated Canonical Blueprint**: Update `ARCHITECTURE_MAP.md` to establish the new organizational taxonomy as the project standard.

---

## 2. Master Architecture & Directory Blueprint

```text
frontend/src/
├── assets/                       # Production brand marks, vector icons, media
│
├── components/                   # Production UI component library
│   ├── 3d/                       # Three.js WebGL canvas engines
│   │   └── CinematicPropertyViewer.jsx
│   ├── auth/                     # Security guards & route protectors
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/                # Shared multi-role portal UI components
│   │   ├── CreateListingModal.jsx
│   │   ├── DashboardHeader.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── DashboardModal.jsx
│   │   ├── DashboardSidebar.jsx
│   │   ├── DataTable.jsx
│   │   ├── EmptyState.jsx
│   │   ├── MetricCard.jsx
│   │   ├── PageHeader.jsx
│   │   ├── SearchAndFilterBar.jsx
│   │   └── StatusBadge.jsx
│   ├── layout/                   # Global shell chrome
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── index.js
│   └── ui/                       # Clean production design system
│       ├── index.js              # Master barrel export hub
│       ├── core/                 # Atomic primitives & foundational widgets
│       │   ├── Button.jsx
│       │   ├── DynamicBackground.jsx
│       │   ├── FilterEmptyState.jsx
│       │   ├── KeySpecsBar.jsx
│       │   └── PageLoader.jsx
│       ├── cards/                # Domain & entity card components
│       │   ├── ActionConsole.jsx
│       │   ├── AgentCard.jsx
│       │   ├── AnalyticsMetricCard.jsx
│       │   ├── GalleryCard.jsx
│       │   ├── NeighborhoodCard.jsx
│       │   └── PropertyCard.jsx
│       ├── modals/               # Production transactional dialogs
│       │   ├── InspectionScheduleModal.jsx
│       │   └── PropertyDetailModal.jsx
│       ├── search/               # Search engine & multi-facet filters
│       │   └── AdvancedSearchBox.jsx
│       └── sections/             # Curated page sections & calculators
│           ├── AgentBrokerSection.jsx
│           ├── ArchitecturalGallerySection.jsx
│           ├── BrandHeritageSection.jsx
│           ├── ClientStoriesSection.jsx
│           ├── ExclusiveListingsSection.jsx
│           ├── FeaturesAmenitiesSection.jsx
│           ├── FinancialCalculatorSection.jsx
│           ├── FinancingCalculator.jsx
│           ├── HeroVisualAnchor.jsx
│           ├── HomeValuationTool.jsx
│           ├── InstitutionalAuthoritySection.jsx
│           ├── LeadCaptureSection.jsx
│           ├── ListingHeroGallery.jsx
│           ├── LocationNeighborhoodSection.jsx
│           ├── NeighborhoodSpotlightsSection.jsx
│           ├── PropertyGalleryMosaic.jsx
│           ├── PropertyOverviewSection.jsx
│           ├── RelatedListingsSection.jsx
│           ├── SearchBarSection.jsx
│           ├── SocialProofSection.jsx
│           └── TestimonialCarousel.jsx
│
├── context/                      # React global state providers (AuthContext.jsx)
├── hooks/                        # Custom reusable React hooks
├── mockData/                     # API fallback fixtures & seeds
├── modules/                      # Standalone micro-features (modules/Chat/ChatWidget.jsx)
│
├── pages/                        # Production route views
│   ├── auth/                     # Authentication views
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── portals/                  # Role-based workspace suites:
│   │   ├── agent/                # 10 Agent workflow pages
│   │   ├── broker/               # 12 Broker executive pages
│   │   ├── client/               # Client buyer/investor dashboard (.gitkeep)
│   │   └── super-admin/          # Platform administration (.gitkeep)
│   └── public/                   # Public guest & marketing routes
│       ├── AboutPage.jsx
│       ├── ContactPage.jsx
│       ├── DemoApiPage.jsx
│       ├── Home.jsx
│       ├── HowWeWorkPage.jsx
│       ├── PartnerPage.jsx
│       ├── PropertiesPage.jsx
│       ├── PropertyListingView.jsx
│       └── UnauthorizedPage.jsx
│
├── sandbox/                      # 🧪 100% Self-Contained Experimental Staging Lab
│   ├── assets/                   # High-res plates, raster layers, and test SVGs
│   ├── components/               # Experimental UI Showcases (relocated from components/ui/)
│   │   ├── AnimatedVectorShapeShowcase.jsx
│   │   ├── AnimeMorphingAnimalsShowcase.jsx
│   │   ├── AnimeParallaxShowcase.jsx
│   │   ├── BorderlessLuxuryCardShowcase.jsx
│   │   ├── CatwalkHorizontalShowcase.jsx
│   │   ├── EditorialRevealsShowcase.jsx
│   │   ├── EditorialSplitTextShowcase.jsx
│   │   ├── FramerMotionShowcase.jsx
│   │   ├── HorizontalAndPinnedScrollShowcase.jsx
│   │   ├── LiquidKerningShowcase.jsx
│   │   ├── LookCloserMicroParallax.jsx
│   │   ├── OverlappingOffsetCardShowcase.jsx
│   │   ├── ParallaxMultiVectorHero.jsx
│   │   ├── ParallaxPropertyShowcase.jsx
│   │   ├── PinnedDollyHeroShowcase.jsx
│   │   ├── PremiumLensTextTransitionShowcase.jsx
│   │   ├── ScrollScrubbedVideoShowcase.jsx
│   │   ├── StarTwinkleCanvas.jsx
│   │   ├── VectorHUDOverlay.jsx
│   │   └── VectorParallaxNatureShowcase.jsx
│   ├── layout/                   # Sandbox-exclusive chrome
│   │   ├── SandboxHeader.jsx
│   │   ├── SandboxLayout.jsx
│   │   └── SandboxPinnedButton.jsx
│   └── pages/                    # Staged lab routes (`/sandbox/*`)
│       ├── BlogPage.jsx
│       ├── DemoUIUXPage.jsx
│       ├── Duplex3DPage.jsx
│       ├── HomeValuationPage.jsx
│       ├── NeighborhoodGuidesPage.jsx
│       ├── ParallaxLabPage.jsx
│       └── SandboxHubPage.jsx
│
├── services/                     # Centralized API network clients (apiClient.js, agentService.js, etc.)
└── types/                        # Client-side UI type definitions
```

---

## 3. Migration Details & Component Relocation Mapping

### 3.1 Relocation of 20 Showcase Components to Sandbox
All 20 showcase/experimental visual prototypes currently residing in `frontend/src/components/ui/` move to `frontend/src/sandbox/components/`:
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

*Internal asset imports within these components (e.g. `../../sandbox/assets/macro_craftsmanship_facade.jpg`) simplify to local sibling imports (`../assets/macro_craftsmanship_facade.jpg`).*

### 3.2 Categorization of Production UI Components
The remaining 36 production components in `frontend/src/components/ui/` are organized into focused subdirectories:
- **`core/`** (5 files): `Button.jsx`, `DynamicBackground.jsx`, `FilterEmptyState.jsx`, `KeySpecsBar.jsx`, `PageLoader.jsx`.
- **`cards/`** (6 files): `ActionConsole.jsx`, `AgentCard.jsx`, `AnalyticsMetricCard.jsx`, `GalleryCard.jsx`, `NeighborhoodCard.jsx`, `PropertyCard.jsx`.
- **`modals/`** (2 files): `InspectionScheduleModal.jsx`, `PropertyDetailModal.jsx`.
- **`search/`** (1 file): `AdvancedSearchBox.jsx`.
- **`sections/`** (21 files): `AgentBrokerSection.jsx`, `ArchitecturalGallerySection.jsx`, `BrandHeritageSection.jsx`, `ClientStoriesSection.jsx`, `ExclusiveListingsSection.jsx`, `FeaturesAmenitiesSection.jsx`, `FinancialCalculatorSection.jsx`, `FinancingCalculator.jsx`, `HeroVisualAnchor.jsx`, `HomeValuationTool.jsx`, `InstitutionalAuthoritySection.jsx`, `LeadCaptureSection.jsx`, `ListingHeroGallery.jsx`, `LocationNeighborhoodSection.jsx`, `NeighborhoodSpotlightsSection.jsx`, `PropertyGalleryMosaic.jsx`, `PropertyOverviewSection.jsx`, `RelatedListingsSection.jsx`, `SearchBarSection.jsx`, `SocialProofSection.jsx`, `TestimonialCarousel.jsx`.

### 3.3 Pages Categorization
- **`pages/public/`**: Public guest routes (`Home.jsx`, `PropertiesPage.jsx`, `PropertyListingView.jsx`, `AboutPage.jsx`, `ContactPage.jsx`, `HowWeWorkPage.jsx`, `PartnerPage.jsx`, `UnauthorizedPage.jsx`, `DemoApiPage.jsx`).
- **`pages/portals/`**: Multi-tenant operational portals (`agent/`, `broker/`, `client/`, `super-admin/`).
- **`pages/auth/`**: Dedicated authentication screens (`LoginPage.jsx`, `RegisterPage.jsx`).

---

## 4. Zero-Disruption Backward Compatibility Strategy

1. **Root UI Barrel Export (`frontend/src/components/ui/index.js`)**:
   Exports all primitives, cards, modals, search, and sections under standard naming so named imports (`import { Button, PropertyCard } from '@/components/ui'`) work out of the box.
2. **Re-Export Shims**:
   During migration, create lightweight 1-line re-export files in `components/ui/` (e.g. `Button.jsx` -> `export * from './core/Button'; export { default } from './core/Button';`) so any legacy direct import continues to work without runtime faults.
3. **Sandbox Internal Re-exports**:
   `sandbox/components/index.js` aggregates showcases for easy one-line consumption by `DemoUIUXPage.jsx` and `ParallaxLabPage.jsx`.

---

## 5. Verification Plan

1. **Lint & Static Analysis**: Check that all import paths resolve correctly.
2. **Vite Build Verification**: Run `npm run build` in `frontend/` to confirm complete compilation with zero broken references.
3. **Automated Test Suite**: Run all frontend tests (`npm run test` or `npx vitest run`) to verify all components, hooks, and pages pass.
4. **Documentation Sync**: Verify that `ARCHITECTURE_MAP.md` reflects this design.
