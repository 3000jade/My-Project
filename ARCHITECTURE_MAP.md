# Architecture Map & Directory Blueprint

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Pattern**: Decoupled Full-Stack Monorepo (Option 1)  
> **Classification**: Master Architectural Blueprint & Source of Truth  
> **Last Updated**: 2026-10-16  

---

## 1. High-Level System Overview

The **CP_kerby** platform is structured as an enterprise-grade decoupled monorepo. It cleanly separates the client-facing presentation layer (`frontend/`), the server API and domain logic layer (`backend/`), and shared cross-stack type contracts (`shared/`).

```text
CP_kerby/
├── frontend/                   # Client-side SPA (React 19, Vite 8, Tailwind CSS v4, Framer Motion)
├── backend/                    # Server-side API (Node.js, Express v5, TypeScript, Supabase PostgreSQL)
├── test files/                 # Unified test suite directory (ignored by git; frontend/ & backend/)
├── shared/                     # Universal cross-cutting types and data contracts
├── docs/                       # Specifications, plans, and architectural design docs
├── notes/                      # Technical memos, feature checklists, and design reviews
├── .agents/                    # Agent behaviors, prompt engineering rules, and custom skills
├── .env.example                # Unified environment variable template
├── ARCHITECTURE_MAP.md         # Canonical project directory map & blueprint (this document)
├── DATABASE_SCHEMA.md          # Master PostgreSQL schema catalog, constraints, and tables
├── DATABASE_GUIDE.md           # Database setup, migrations, and connection diagnostic guide
├── TECHSTACK.md                # Comprehensive technology stack & dependency inventory
└── design.md                   # Visual design philosophy ("The Monolith & The Void") & tokens
```

---

## 2. Comprehensive Directory Tree & Role Taxonomy

### 2.1 Workspace Root

| Path | Responsibility / Purpose |
| :--- | :--- |
| `frontend/` | Complete user interface application, animation engines, portal views, and client routers. |
| `backend/` | RESTful API server, Supabase persistence, background scripts, schemas, and services. |
| `shared/` | Universal full-stack TypeScript interfaces, shared DTOs, and API contract envelopes. |
| `test files/` | Unified test repository (`frontend/` & `backend/`), executed with Vitest. |
| `docs/` | Architecture specifications (`docs/specs/`), implementation task trackers, and guides. |
| `notes/` | Tactical implementation memos, modal workflows, and feature design scratchpads. |
| `.agents/` | Antigravity AI rules (`AGENTS.md`, `rules/`), tool configurations, and specialized skills. |
| `.env.example` | Root template documenting required environment variables for client and server. |
| `ARCHITECTURE_MAP.md` | Canonical living blueprint defining structural conventions and code locations. |
| `DATABASE_SCHEMA.md` | Detailed database schema reference, foreign keys, enums, and column definitions. |
| `DATABASE_GUIDE.md` | Practical guide for Supabase setup, migrations, and local/cloud connections. |
| `TECHSTACK.md` | Complete technology stack, dependency versions, and architectural runtime roles. |
| `design.md` | Modern SaaS & "The Monolith & The Void" design system manifesto and mathematical tokens. |

---

### 2.2 Frontend Layer (`frontend/src/`)

```text
frontend/
├── public/                     # Static unbundled assets (video flythroughs, webp frames)
├── src/
│   ├── assets/                 # Production branding, photography & vector icons
│   ├── components/             # React presentation components
│   │   ├── 3d/                 # Three.js canvas components, camera rigs, and 3D visual anchors
│   │   ├── auth/               # Security guards & route protectors (ProtectedRoute.jsx)
│   │   ├── dashboard/          # Shared multi-role portal UI (Sidebar, Header, MetricCards, DataTable)
│   │   ├── layout/             # Top-level shell frames: Header.jsx, Footer.jsx, index.js
│   │   └── ui/                 # Production design system (strictly non-experimental UI)
│   │       ├── index.js        # Root barrel re-export hub for design system
│   │       ├── core/           # Primitives & atomic controls (Button, PageLoader, DynamicBackground)
│   │       ├── cards/          # Domain entity cards (PropertyCard, AgentCard, NeighborhoodCard)
│   │       ├── modals/         # Transactional overlays (PropertyDetailModal, InspectionScheduleModal)
│   │       ├── search/         # Advanced search bar & faceted filter engine (AdvancedSearchBox)
│   │       └── sections/       # Production marketing sections & calculators (Hero, BrandHeritage, Financial)
│   ├── context/                # React global state providers (AuthContext.jsx)
│   ├── data/                   # Packaged client-side datasets
│   │   └── geo/                # Philippine Standard Geographic Code (PSGC) geo datasets:
│   │                           # regions.json, provinces.json, cities.json, barangays.json, zipcodes.json
│   ├── hooks/                  # Custom reusable React hooks (useLenis, filter engines, viewing list)
│   ├── mockData/               # High-fidelity mock property datasets, user fixtures, and about content
│   ├── modules/                # Self-contained feature slices (e.g., modules/Chat/ChatWidget.jsx)
│   ├── pages/                  # Route page views
│   │   ├── auth/               # Authentication views (LoginPage.jsx, RegisterPage.jsx)
│   │   ├── portals/            # Multi-tenant operational role portals:
│   │   │   ├── agent/          # 10 Agent workflow pages (Dashboard, Properties, Create, Inquiries, Sales)
│   │   │   ├── broker/         # 12 Broker executive pages (Dashboard, CreateListings, Agents, Detail, Reports)
│   │   │   ├── client/         # Client buyer/investor dashboard (.gitkeep)
│   │   │   └── super-admin/    # Platform administration (.gitkeep)
│   │   └── public/             # Public guest & marketing routes (Home, Properties, Detail, About, Contact)
│   ├── sandbox/                # 🧪 100% Self-Contained Experimental Staging Lab
│   │   ├── assets/             # Test plates, vector layers, and experimental media
│   │   ├── components/         # Experimental UI Showcases (Catwalk, Editorial, Parallax, Anime, HUD)
│   │   ├── layout/             # Lab shell chrome (SandboxHeader, SandboxLayout, SandboxPinnedButton)
│   │   └── pages/              # Isolated staging routes (DemoUIUXPage, ParallaxLabPage, SandboxHubPage)
│   ├── services/               # HTTP client layer & domain service integrations:
│   │                           # apiClient.js, propertyService.js, phLocationService.js, agentService.js
│   ├── types/                  # Frontend-specific UI prop types and local interfaces
│   ├── utils/                  # Helper formatters (currency, measurement conversions, PSGC helpers)
│   ├── App.jsx                 # Application entry, router table, and Lenis smooth-scroll provider
│   ├── main.jsx                # DOM root mount
│   └── index.css               # Tailwind CSS v4 directives and design tokens
├── package.json
└── vite.config.js
```

#### Frontend Layer Rules:
1. **Layout (`components/layout/`)**:
   - Houses global structural chrome wrapping routes: `Header.jsx`, `Footer.jsx`.
   - Must export through `components/layout/index.js`.
2. **Production UI Library (`components/ui/`)**:
   - Strictly reserved for production-grade UI components. Experimental prototypes belong in `sandbox/`.
   - Decomposed into `core/` (primitives), `cards/` (entity cards), `modals/` (dialogs), `search/` (search tools), and `sections/` (page sections).
   - Must export through `components/ui/index.js` to enable clean, decoupled imports.
   - Must adhere strictly to uniform baseline height (`h-[54px]`) and concentric corner radius rules ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$).
3. **Role Portals (`pages/portals/`)**:
   - Operational dashboard screens reside in `pages/portals/{agent,broker,client,super-admin}`.
4. **Public Routes (`pages/public/`)**:
   - Public guest-facing marketing, listings, and informational pages reside in `pages/public/`.
5. **Experimental Sandbox (`sandbox/`)**:
   - 100% self-contained staging ground. All experimental UI showcases and lab routes reside strictly in `sandbox/components/`, `sandbox/assets/`, and `sandbox/pages/`.
6. **Services Layer (`services/`)**:
   - Network requests go through `services/apiClient.js` or domain services (`propertyService.js`, `agentService.js`).
   - Local location and PSGC geography transformations run via `services/phLocationService.js`. Never invoke raw `axios` or `fetch` directly in UI components.

---

### 2.3 Backend Layer (`backend/src/`)

```text
backend/
├── src/
│   ├── config/                 # Environment validation and server configuration (config/index.ts, supabase.ts)
│   ├── controllers/            # HTTP handlers: request validation, service invocation, and status codes
│   ├── middleware/             # Express middlewares (error handling, auth guards, rate limiters, upload)
│   ├── models/                 # Database DDL migration SQL files, seed JSON, and TypeScript domain entities
│   │                           # (supabase_schema.sql, location_psgc_migration.sql, property_pricing_migration.sql)
│   ├── routes/                 # Express router definitions and route mapping (routes/index.ts)
│   ├── schemas/                # Zod request validation schemas (property, auth, agent, invitation, inquiry)
│   ├── scripts/                # Diagnostic CLI, migration runners, and seed scripts (migrate.ts, test-db.ts)
│   ├── services/               # Pure business logic, external API integrations, and Supabase client queries
│   ├── templates/              # Transactional email and notification HTML/text templates (emailTemplates.ts)
│   ├── types/                  # Backend-specific types and Express Request augmentations
│   ├── utils/                  # Structured logging (utils/logger.ts), formatters, and utility helpers
│   └── index.ts                # Application bootstrap, middleware registration, port listener
├── dist/                       # Compiled production JavaScript (output from tsc)
├── tsconfig.json               # Backend TypeScript compiler options
└── package.json
```

#### Backend Layer Rules:
1. **Controller-Service Separation**:
   - **Controllers (`controllers/`)**: Accept Express `(req, res, next)`, parse params with Zod schemas, call services, and return standard JSON. No raw SQL or direct DB queries in controllers.
   - **Services (`services/`)**: Contain pure domain logic, calculations, and Supabase client queries. Return raw data or throw domain errors.
2. **Strict Request Validation (`schemas/`)**:
   - All HTTP endpoint payloads must be validated against a dedicated Zod schema in `src/schemas/` before passing to services.
3. **Database Schema & Migrations (`models/`)**:
   - Master schema resides in `supabase_schema.sql`.
   - Discrete, repeatable feature migrations reside as individual SQL scripts (e.g., `location_psgc_migration.sql`, `property_pricing_migration.sql`, `agent_invitations_migration.sql`).
   - Must strictly maintain database invariants (e.g. `property_type TEXT`, not non-existent `property_type_id`).
4. **Maintenance & Diagnostics (`scripts/`)**:
   - DB connection checks, user provisioning, invitation resends, and migration runners belong in `src/scripts/`.
5. **Central Configuration (`config/`)**:
   - Access `process.env` exclusively through `config/index.ts` and `config/supabase.ts`.

---

### 2.4 Shared Contract Layer (`shared/types/`)

```text
shared/
└── types/
    ├── api.ts                  # Standardized ApiResponse<T> and PaginatedResponse<T> envelopes
    ├── property.ts             # Universal Property, ValuationEstimate, Media, and Room definitions
    ├── agent.ts                # Agent profile, license, accreditation, and invitation contracts
    ├── auth.ts                 # Auth credentials, session payloads, and user roles
    ├── chat.ts                 # Real estate AI concierge conversation contracts
    ├── integrations.ts         # Google Drive, Maps, and WhatsApp webhook contracts
    ├── maps.ts                 # Geocoding, coordinates, and reverse-lookup contracts
    └── index.ts                # Central barrel export
```

#### Shared Contract Rules:
1. When creating or modifying data shapes returned by the backend to the frontend, update `shared/types/` first.
2. Every API endpoint must return a payload conforming to `ApiResponse<T>`:
   ```typescript
   {
     success: boolean;
     data?: T;
     error?: string;
     message?: string;
     timestamp: string;
   }
   ```

---

### 2.5 Agent & Governance Layer (`.agents/`)

```text
.agents/
├── AGENTS.md                   # Superpowers engineering methodology, hard gates, and design rules
├── mcp_config.json             # Model Context Protocol server configurations
├── rules/                      # Systemic design and architectural invariant rules:
│   └── database-schema-invariants.md # Schema caching, column mapping, and database rules
└── skills/                     # Antigravity operational skill blueprints:
    ├── brainstorming/          # Design intent & user requirement discovery
    ├── systematic-debugging/   # 4-phase root cause analysis
    ├── modern-saas-design/     # Design token compliance & 6-step UI workflow
    ├── git-push/               # Controlled GitHub push pipeline
    └── supabase/               # Supabase database & storage lifecycle
```

---

## 3. Decision Matrix: Where Does My Code Belong?

| If you are adding / editing: | Place it in: | Example File |
| :--- | :--- | :--- |
| Global navigation, topbar, or site footer | `frontend/src/components/layout/` | `Header.jsx`, `Footer.jsx` |
| Atomic button, loader, badge, or plain input | `frontend/src/components/ui/core/` | `Button.jsx`, `PageLoader.jsx` |
| Domain card (property, agent, neighborhood) | `frontend/src/components/ui/cards/` | `PropertyCard.jsx`, `AgentCard.jsx` |
| Production modal (detail, booking, inquiry) | `frontend/src/components/ui/modals/` | `PropertyDetailModal.jsx` |
| Advanced search bar or faceted filter engine | `frontend/src/components/ui/search/` | `AdvancedSearchBox.jsx` |
| Curated page section or calculator | `frontend/src/components/ui/sections/` | `HeroVisualAnchor.jsx`, `BrandHeritageSection.jsx` |
| Shared multi-role dashboard table, card, sidebar | `frontend/src/components/dashboard/` | `DashboardSidebar.jsx`, `DataTable.jsx` |
| Geographic reference datasets (PSGC regions, cities) | `frontend/src/data/geo/` | `regions.json`, `cities.json`, `barangays.json` |
| Client-side location & PSGC resolver | `frontend/src/services/` | `phLocationService.js` |
| Experimental motion showcase, animation lab, vector demo | `frontend/src/sandbox/components/` | `CatwalkHorizontalShowcase.jsx`, `VectorHUDOverlay.jsx` |
| Staged sandbox route or lab playground | `frontend/src/sandbox/pages/` | `DemoUIUXPage.jsx`, `ParallaxLabPage.jsx` |
| 3D canvas, Three.js scene, or WebGL shader | `frontend/src/components/3d/` | `CinematicPropertyViewer.jsx` |
| Public guest route (Home, Properties, About, Contact) | `frontend/src/pages/public/` | `Home.jsx`, `PropertyListingView.jsx` |
| Role-specific workspace page (Agent, Broker, Client, SuperAdmin) | `frontend/src/pages/portals/<role>/` | `BrokerCreateListings.jsx`, `AgentDashboard.jsx` |
| Authentication page (Login, Register) | `frontend/src/pages/auth/` | `LoginPage.jsx`, `RegisterPage.jsx` |
| HTTP request call, endpoint fetcher, or REST client | `frontend/src/services/` | `apiClient.js`, `propertyService.js` |
| Custom React hook (scroll sentinel, state tween, filters) | `frontend/src/hooks/` | `useLenisScroll.js`, `usePropertyFilterEngine.js` |
| Mock data fixtures or seed lists | `frontend/src/mockData/` | `mockProperties.js` |
| Backend HTTP endpoint handler | `backend/src/controllers/` | `property.controller.ts`, `agent.controller.ts` |
| Request payload validation (Zod schema) | `backend/src/schemas/` | `property.schema.ts`, `auth.schema.ts` |
| Backend business logic or Supabase queries | `backend/src/services/` | `property.service.ts`, `agent.service.ts` |
| Express route definitions | `backend/src/routes/` | `property.routes.ts`, `agent.routes.ts` |
| Express middleware (auth, error, headers, upload) | `backend/src/middleware/` | `error.middleware.ts`, `auth.middleware.ts` |
| SQL migration script or DDL schema | `backend/src/models/` | `location_psgc_migration.sql`, `supabase_schema.sql` |
| CLI diagnostics, seeders, or database maintenance | `backend/src/scripts/` | `test-db-connection.ts`, `seed.ts`, `migrate.ts` |
| Transactional email templates (HTML/text) | `backend/src/templates/` | `emailTemplates.ts` |
| Environment variable parsing or app config | `backend/src/config/` | `index.ts`, `supabase.ts` |
| Shared data interface or DTO used by both sides | `shared/types/` | `property.ts`, `agent.ts`, `api.ts` |
| AI rules, architectural invariants, or constraints | `.agents/rules/` | `database-schema-invariants.md` |
| Automated unit/integration test file | `test files/frontend/` or `test files/backend/` | `BrokerCreateListings.test.jsx`, `property.controller.test.ts` |

---

## 4. UI Effects & Design Token Alignment

All frontend code must comply with the design tokens codified in `design.md` and `.agents/AGENTS.md`:

1. **Concentric Curvature Formula**:
   $$R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$$
   *(e.g., outer `rounded-[2.5rem]` with `p-2.5` requires inner core `rounded-[calc(2.5rem-0.625rem)]`)*.
2. **Unified Control Height**:
   All interactive search elements, inputs, dropdowns, and buttons in toolbars maintain exact `h-[54px]`.
3. **Lenis Scroll Isolation**:
   Internal scrolling containers inside modals must include `data-lenis-prevent="true"`.
4. **Motion Physics**:
   Modal springs use `{ type: 'spring', damping: 25, stiffness: 200 }`. Hover controls use `cubic-bezier(0.32, 0.72, 0, 1)`.
5. **Sticky Header & Sentinel Tracking**:
   Header reveal/hide state is bound to sentinel element tracking via `getBoundingClientRect()`, pushing sticky search containers by exactly `80px` when summoned.
