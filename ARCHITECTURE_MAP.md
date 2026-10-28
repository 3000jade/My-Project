# Architecture Map & Directory Blueprint

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Pattern**: Decoupled Full-Stack Monorepo (Option 1)  
> **Classification**: Master Architectural Blueprint & Source of Truth  
> **Last Updated**: 2026-10-27  

---

## 1. High-Level System Overview

The **CP_kerby** platform is structured as an enterprise-grade decoupled monorepo. It cleanly separates the client-facing presentation layer (`frontend/`), the server API and domain logic layer (`backend/`), shared cross-stack type contracts (`shared/`), system-wide module documentation (`docs/modules/`), and agent governance (`.agents/` & `AGENTS.md`).

```text
CP_kerby/
├── frontend/                   # Client-side SPA (React 19, Vite 8, Tailwind CSS v4, Framer Motion)
├── backend/                    # Server-side API (Node.js, Express v5, TypeScript 7, Supabase PostgreSQL)
├── shared/                     # Universal cross-cutting types and data contracts (TypeScript DTOs)
├── test files/                 # Unified test suite directory (frontend/ & backend/, Vitest)
├── docs/                       # Specifications, plans, system reports, and module documentation
│   ├── modules/                # 8 Core System Modules documentation protocol (INDEX.md & dated logs)
│   ├── implementation/         # Page specs, responsive guidelines, and task lists
│   ├── superpowers/            # Implementation plans and design specs
│   └── reports/                # System audit and verification reports
├── scripts/                    # Root automation utilities (layer generators, session doc generator)
├── notes/                      # Tactical implementation memos and feature scratchpads
├── Analyze/                    # Architectural inspection breakdowns and component audits
├── .agents/                    # Antigravity AI governance: rules, MCP configs, and 35 engineering skills
├── AGENTS.md                   # Superpowers methodology, hard gates, Modern SaaS design system, module protocol
├── ARCHITECTURE_MAP.md         # Canonical project directory map & blueprint (this document)
├── DATABASE_SCHEMA.md          # Master PostgreSQL schema catalog, constraints, and tables
├── DATABASE_GUIDE.md           # Database setup, migrations, and connection diagnostic guide
├── TECHSTACK.md                # Comprehensive technology stack & dependency inventory
├── design.md                   # Visual design system manifesto, tokens, and mathematical layouts
├── Design-layout.md            # Structural layout and component positioning specs
└── .env.example                # Unified environment variable template
```

---

## 2. Comprehensive Directory Tree & Role Taxonomy

### 2.1 Workspace Root

| Path | Responsibility / Purpose |
| :--- | :--- |
| `frontend/` | Complete React 19 SPA, animation engines, role-based portals, and client routers. |
| `backend/` | Express v5 RESTful API server, Supabase persistence, background scripts, SQL migrations, and domain services. |
| `shared/` | Universal full-stack TypeScript interfaces, shared DTOs, and API contract envelopes (`ApiResponse<T>`). |
| `test files/` | Unified test suite for frontend and backend, executed with Vitest. |
| `docs/` | Architecture specs, implementation plans, and official module documentation. |
| `docs/modules/` | Canonical documentation across the 8 core platform modules (01 to 08), adhering to AGENTS.md protocol. |
| `scripts/` | Root automation utilities (e.g., parallax layer generators, session doc builders). |
| `notes/` | Tactical implementation memos, modal workflows, and feature design scratchpads. |
| `Analyze/` | Component inspection breakdowns and UI/UX audit notes. |
| `.agents/` | Antigravity AI rules (`database-schema-invariants.md`), tool configurations, and 35 specialized skills. |
| `AGENTS.md` | Master engineering rules: Modern SaaS design tokens, Superpowers workflow gates, and module protocol. |
| `ARCHITECTURE_MAP.md` | Canonical living blueprint defining structural conventions and code locations. |
| `DATABASE_SCHEMA.md` | Detailed database schema reference, foreign keys, enums, and column definitions. |
| `DATABASE_GUIDE.md` | Practical guide for Supabase setup, migrations, and local/cloud connections. |
| `TECHSTACK.md` | Complete technology stack, dependency versions, and architectural runtime roles. |
| `design.md` | Modern SaaS design system specification, mathematical curvature tokens, and visual manifesto. |
| `Design-layout.md` | Visual layout blueprints and responsive breakpoint alignments. |
| `.env.example` | Root template documenting required environment variables for client and server. |

---

### 2.2 Frontend Layer (`frontend/src/`)

```text
frontend/
├── public/                     # Static unbundled assets (video flythroughs, webp frames, textures)
├── src/
│   ├── assets/                 # Production branding, photography & vector icons
│   ├── api/                    # Lightweight API client entrypoints (apiClient.js)
│   ├── components/             # React presentation components
│   │   ├── 3d/                 # Three.js canvas components, camera rigs, and 3D visual anchors
│   │   ├── auth/               # Auth guards, session modals, and permission controls:
│   │   │   ├── AuthGuard.jsx, ProtectedRoute.jsx, PermissionGate.jsx
│   │   │   ├── LoginForm.jsx, RegisterForm.jsx, MfaChallengeModal.jsx
│   │   │   ├── SessionWatcher.jsx, SessionTimeoutModal.jsx, SessionManagementPanel.jsx
│   │   │   └── RolePermissionEditor.jsx, AuthLayout.jsx, AuthFeedback.jsx, index.js
│   │   ├── cms/                # Content and catalog management drawers:
│   │   │   ├── PropertyQuickEditDrawer.jsx (Fast inline editing drawer)
│   │   │   └── ProposalReviewDrawer.jsx (Broker/agent listing proposal review)
│   │   ├── dashboard/          # Shared multi-role portal UI components:
│   │   │   ├── DashboardLayout.jsx, DashboardHeader.jsx, DashboardSidebar.jsx, PageHeader.jsx
│   │   │   ├── DataTable.jsx, MetricCard.jsx, StatusBadge.jsx, EmptyState.jsx
│   │   │   ├── AgentScheduleCalendar.jsx (Full scheduling & appointment calendar)
│   │   │   ├── AgentAssignmentActionModal.jsx, ReassignAgentModal.jsx, CreateListingModal.jsx
│   │   │   └── SearchAndFilterBar.jsx, DashboardModal.jsx
│   │   ├── layout/             # Top-level shell frames: Header.jsx, Footer.jsx, index.js
│   │   └── ui/                 # Production design system (strictly non-experimental UI)
│   │       ├── index.js        # Root barrel re-export hub for design system
│   │       ├── core/           # Primitives & atomic controls (Button, PageLoader, DynamicBackground,
│   │       │                   # Accordion, StatusBadge, KeySpecsBar, FilterEmptyState)
│   │       ├── cards/          # Domain entity cards (PropertyCard, AgentCard, NeighborhoodCard,
│   │       │                   # ActionConsole, AnalyticsMetricCard, GalleryCard)
│   │       ├── map/            # Interactive mapping components (PropertyMap, MapLayerControl)
│   │       ├── modals/         # Transactional overlays (PropertyDetailModal, InspectionScheduleModal,
│   │       │                   # AllFiltersDrawer, PublicAgentProfileModal)
│   │       ├── search/         # Unified faceted search engine (UnifiedSearchBar.jsx)
│   │       └── sections/       # Production marketing sections & calculators (25 sections:
│   │                           # HeroVisualAnchor, ArchitecturalGallerySection, BrandHeritageSection,
│   │                           # FinancingCalculator, HomeValuationTool, LeadCaptureSection,
│   │                           # BuyerProtectionPromiseSection, NeighborhoodSpotlightsSection, etc.)
│   ├── context/                # React global state providers (AuthContext.jsx)
│   ├── data/                   # Packaged client-side datasets
│   │   └── geo/                # Philippine Standard Geographic Code (PSGC) geo datasets:
│   │                           # regions.json, provinces.json, cities.json, barangays.json, zipcodes.json
│   ├── hooks/                  # Custom reusable React hooks:
│   │                           # usePropertyFilterEngine.js, useViewingList.js
│   ├── mockData/               # High-fidelity mock property datasets, user fixtures, and about content
│   ├── modules/                # Self-contained feature slices (e.g., modules/Chat/ChatWidget.jsx)
│   ├── pages/                  # Route page views
│   │   ├── auth/               # Authentication & onboarding views:
│   │   │   ├── LoginPage.jsx, RegisterPage.jsx, AgentRegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx, ResetPasswordPage.jsx, VerifyEmailPage.jsx
│   │   ├── portals/            # Multi-tenant operational role portals:
│   │   │   ├── agent/          # Agent workflow portal (10 pages):
│   │   │   │   ├── AgentDashboard.jsx, AgentProperties.jsx, AgentPropertyCreate.jsx
│   │   │   │   ├── AgentPropertyDetail.jsx, AgentInquiries.jsx, AgentInquiryDetail.jsx
│   │   │   │   ├── AgentAppointments.jsx, AgentAvailability.jsx, AgentSales.jsx, AgentProfile.jsx
│   │   │   ├── broker/         # Broker executive management portal (15 pages):
│   │   │   │   ├── BrokerDashboard.jsx, BrokerProperties.jsx, BrokerPropertyDetail.jsx
│   │   │   │   ├── BrokerCreateListings.jsx, BrokerAgents.jsx, BrokerAgentDetail.jsx
│   │   │   │   ├── BrokerAgentEdit.jsx, BrokerInviteAgent.jsx, BrokerInquiries.jsx
│   │   │   │   ├── BrokerInquiryDetail.jsx, BrokerAppointments.jsx, BrokerSales.jsx
│   │   │   │   ├── BrokerReports.jsx, BrokerNotifications.jsx, BrokerProfile.jsx
│   │   │   ├── client/         # Client buyer/investor portal (4 pages):
│   │   │   │   ├── ClientDashboard.jsx, ClientInquiries.jsx, ClientProfile.jsx, ClientSavedProperties.jsx
│   │   │   └── super-admin/    # Super Admin system portal:
│   │   │       └── AdminUsersPage.jsx (User management & RBAC configuration)
│   │   └── public/             # Public guest & marketing routes:
│   │       ├── Home.jsx, PropertiesPage.jsx, PropertyListingView.jsx
│   │       ├── AboutPage.jsx, ContactPage.jsx, DemoApiPage.jsx, UnauthorizedPage.jsx
│   ├── sandbox/                # 🧪 100% Self-Contained Experimental Staging Lab
│   │   ├── assets/             # Test plates, vector layers, and experimental media
│   │   ├── components/         # Experimental UI Showcases (Catwalk, Editorial, Parallax, Anime, HUD)
│   │   ├── layout/             # Lab shell chrome (SandboxHeader, SandboxLayout, SandboxPinnedButton)
│   │   └── pages/              # Isolated staging routes (DemoUIUXPage, ParallaxLabPage, SandboxHubPage,
│   │                           # BlogPage, Duplex3DPage, HomeValuationPage, NeighborhoodGuidesPage, ScrollRevealPage)
│   ├── services/               # HTTP client layer & domain service integrations:
│   │   ├── apiClient.js (Configured Axios client with interceptors)
│   │   ├── propertyService.js, agentService.js, agentCredentialsService.js
│   │   ├── appointmentService.js, inquiryService.js, authService.js, clientUserService.js
│   │   ├── dashboardService.js, driveService.js, mapsService.js, notificationService.js
│   │   ├── phLocationService.js, profileService.js, saleService.js, sessionCoordinator.js
│   │   ├── valuationService.js, chatService.js
│   ├── utils/                  # Helper formatters and utilities (cn.js, propertyCoordinates.js)
│   ├── App.jsx                 # Application entry, router table, Lenis smooth-scroll provider
│   ├── main.jsx                # DOM root mount
│   ├── index.css               # Tailwind CSS v4 directives and design tokens
│   ├── tailwind.config.js      # Tailwind configuration
│   └── test-setup.js           # Vitest frontend setup & DOM extensions
├── package.json
└── vite.config.js
```

#### Frontend Layer Rules:
1. **Layout (`components/layout/`)**:
   - Houses global structural chrome wrapping routes: `Header.jsx`, `Footer.jsx`.
   - Must export through `components/layout/index.js`.
2. **Production UI Library (`components/ui/`)**:
   - Strictly reserved for production-grade UI components. Experimental prototypes belong in `sandbox/`.
   - Decomposed into `core/`, `cards/`, `map/`, `modals/`, `search/`, and `sections/`.
   - Must export through `components/ui/index.js` to enable clean, decoupled imports.
   - Adhere strictly to the Modern SaaS design system: 8px spacing grid, 8px standard radius (`rounded-lg`), baseline control height (`h-[54px]`), and concentric corner radius rules ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$).
3. **Role Portals (`pages/portals/`)**:
   - Operational dashboard screens reside in `pages/portals/{agent,broker,client,super-admin}`.
   - All role-specific operational flows (triaging inquiries, scheduling appointments, managing roster, reviewing edits) live within their designated portal folder.
4. **Public Routes (`pages/public/`)**:
   - Public guest-facing marketing, listings, and informational pages reside in `pages/public/`.
5. **Experimental Sandbox (`sandbox/`)**:
   - 100% self-contained staging ground. All experimental UI showcases and lab routes reside strictly in `sandbox/components/`, `sandbox/assets/`, and `sandbox/pages/`.
6. **Services Layer (`services/`)**:
   - All network requests must go through `services/apiClient.js` or domain services. Never invoke raw `axios` or `fetch` directly in UI components.
   - Session coordination and heartbeat signals run via `services/sessionCoordinator.js`.
   - Local location and PSGC geography transformations run via `services/phLocationService.js`.

---

### 2.3 Backend Layer (`backend/src/`)

```text
backend/
├── src/
│   ├── config/                 # Environment validation and server configuration:
│   │   ├── index.ts            # Central env config (JWT, ports, OAuth credentials, timeouts)
│   │   └── supabase.ts         # Supabase client instantiation and service role bindings
│   ├── controllers/            # HTTP handlers (20 controllers):
│   │   ├── admin.controller.ts, agent.controller.ts, agentCredentials.controller.ts
│   │   ├── appointment.controller.ts, audit.controller.ts, auth.controller.ts
│   │   ├── chat.controller.ts, dashboard.controller.ts, drive.controller.ts
│   │   ├── health.controller.ts, inquiry.controller.ts, invitation.controller.ts
│   │   ├── mail.controller.ts, maps.controller.ts, notification.controller.ts
│   │   ├── profile.controller.ts, property.controller.ts, sale.controller.ts
│   │   ├── valuation.controller.ts, whatsapp.controller.ts
│   ├── middleware/             # Express middlewares:
│   │   ├── auth.middleware.ts (JWT bearer verification & user extraction)
│   │   ├── role.middleware.ts (RBAC authorization: broker, agent, client, admin)
│   │   ├── validate.middleware.ts (Zod schema validation middleware)
│   │   ├── rateLimiter.middleware.ts (Endpoint throttling & brute-force defense)
│   │   └── error.middleware.ts (Standardized error envelope handler)
│   ├── models/                 # Database DDL migration SQL files, seed JSON, and domain models:
│   │   ├── supabase_schema.sql (Master foundational database schema)
│   │   ├── supabase_seed.sql, schema_seed_data.json
│   │   ├── agent_management_v2_migration.sql, agent_invitations_migration.sql
│   │   ├── agent_audit_events_migration.sql, agent_credential_documents_migration.sql
│   │   ├── appointments_calendar_v2_migration.sql, inquiries_module_migration.sql
│   │   ├── user_sessions_migration.sql, communication_audit_session_migration.sql
│   │   ├── property_edit_approval_migration.sql, property_pricing_migration.sql
│   │   ├── property_assignment_confirmation_migration.sql, invitation_atomic_claim_migration.sql
│   │   ├── location_psgc_migration.sql
│   │   └── property.model.ts
│   ├── routes/                 # Express router definitions (21 routes):
│   │   ├── index.ts            # Master router aggregator mounting all resource paths
│   │   ├── admin.routes.ts, agent.routes.ts, agentCredentials.routes.ts
│   │   ├── appointment.routes.ts, audit.routes.ts, auth.routes.ts
│   │   ├── chat.routes.ts, dashboard.routes.ts, drive.routes.ts
│   │   ├── health.routes.ts, inquiry.routes.ts, invitation.routes.ts
│   │   ├── mail.routes.ts, maps.routes.ts, notification.routes.ts
│   │   ├── profile.routes.ts, property.routes.ts, sale.routes.ts
│   │   ├── valuation.routes.ts, whatsapp.routes.ts
│   ├── schemas/                # Zod request validation schemas (10 schemas):
│   │   ├── agent.schema.ts, appointment.schema.ts, auth.schema.ts
│   │   ├── dashboard.schema.ts, inquiry.schema.ts, invitation.schema.ts
│   │   ├── notification.schema.ts, profile.schema.ts, property.schema.ts, sale.schema.ts
│   ├── scripts/                # Diagnostic CLI, migration runners, and seed scripts (19 scripts):
│   │   ├── check-message.ts, clean-database.ts, clean-users.ts
│   │   ├── get-gmail-token.ts, get-google-drive-token.ts, migrate.ts
│   │   ├── seed-users.ts, seed.ts, test-auth.ts, test-chat.ts
│   │   ├── test-db-connection.ts, test-gmail.ts, test-google-auth.ts
│   │   ├── test-google-drive.ts, test-nominatim.ts, test-resend-invitation.ts
│   │   ├── test-session-functional.ts, test-upload-sample.ts, verify-agents.ts
│   ├── services/               # Pure business logic and database queries (28 services):
│   │   ├── property.service.ts, agent.service.ts, agentAvailability.service.ts
│   │   ├── agentCredentials.service.ts, agentEligibility.service.ts, agentRegistration.service.ts
│   │   ├── agentTeam.service.ts, agentTransfer.service.ts, appointment.service.ts
│   │   ├── audit.service.ts, auth.service.ts, chat.service.ts, dashboard.service.ts
│   │   ├── gmail.service.ts, googleAuth.service.ts, googleDrive.service.ts
│   │   ├── googleMaps.service.ts, health.service.ts, inquiry.service.ts
│   │   ├── inquirySummary.service.ts, invitation.service.ts, nominatim.service.ts
│   │   ├── notification.service.ts, profile.service.ts, sale.service.ts
│   │   ├── session.service.ts, valuation.service.ts, whatsapp.service.ts
│   ├── templates/              # Transactional email and notification templates:
│   │   └── emailTemplates.ts (Invitation, appointment, and reset templates)
│   ├── types/                  # Backend-specific Express Request augmentations and context types
│   ├── utils/                  # Logging, formatters, and helpers
│   └── index.ts                # Application bootstrap, middleware registration, port listener
├── dist/                       # Compiled production JavaScript (output from tsc)
├── tsconfig.json               # Backend TypeScript compiler options
└── package.json
```

#### Backend Layer Rules:
1. **Controller-Service Separation**:
   - **Controllers (`controllers/`)**: Accept Express `(req, res, next)`, validate inputs with Zod schemas, call services, and return standard `ApiResponse<T>`. No direct database queries or business calculations in controllers.
   - **Services (`services/`)**: Contain pure domain logic, complex workflows, and Supabase client queries. Return domain data or throw standard errors.
2. **Strict Request Validation (`schemas/`)**:
   - All HTTP endpoint payloads must be validated against a dedicated Zod schema in `src/schemas/` before passing to services.
3. **Database Schema & Migrations (`models/`)**:
   - Foundational schema resides in `supabase_schema.sql`.
   - Feature additions must reside as discrete, repeatable migration scripts (e.g., `agent_management_v2_migration.sql`, `appointments_calendar_v2_migration.sql`, `inquiries_module_migration.sql`).
   - Invariant columns must be preserved (e.g., `property_type TEXT`, not non-existent `property_type_id`).
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
    ├── appointment.ts          # Appointment slots, booking requests, and calendar sync contracts
    ├── inquiry.ts              # Lead triage, buyer inquiries, viewing requests, and status contracts
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

### 2.5 Module Documentation Protocol (`docs/modules/`)

All system documentation, verification reports, and technical specifications must be maintained across the 8 core modules:

```text
docs/modules/
├── 01-user-management/         # Authentication, RBAC, Sessions, User Profiles
├── 02-property-listing/        # Listings, Cadastral Maps, Media Galleries, Specs, Approvals
├── 03-agent-management/        # Roster, PRC/DHSUD Licensing, Calendars, Transfers, Teams
├── 04-sales-and-reports/       # Transactions, Commissions, Revenue Reporting, Exports
├── 05-database/                # PostgreSQL Schemas, Supabase Migrations, Type Contracts
├── 06-audit/                   # Administrative Audit Trails, Security Logs, Notifications
├── 07-inquiry/                 # Lead Triage, Inquiries, Property Viewing Requests
└── 08-ai-inquiry-assisted/     # AI Concierge, Semantic Search, Broker Handoff
```

#### Module Protocol Directives:
1. **Read Phase**: Before modifying features in any module, inspect `docs/modules/[module-name]/INDEX.md` and the latest dated document to understand current contracts and architectural constraints.
2. **Document Phase**: Upon completing approved changes, document the update in `docs/modules/[module-name]/YYYY-MM-DD-[action-description].md` with structured YAML frontmatter (`module`, `date`, `status`, `affected_files`) and register it in that module's `INDEX.md`.

---

### 2.6 Agent & Governance Layer (`.agents/` & `AGENTS.md`)

```text
.agents/
├── mcp_config.json             # Model Context Protocol server configurations
├── rules/                      # Systemic design and architectural invariant rules:
│   └── database-schema-invariants.md # Schema caching, column mapping, and database rules
└── skills/                     # 35 Antigravity specialized skill blueprints:
    ├── 3d-web-experience/      # Three.js, React Three Fiber, Spline, and 3D scenes
    ├── animation-js/           # SVG stroke drawings, stagger grids, counter tweens
    ├── animejs/                # JavaScript micro-animations and complex timeline orchestration
    ├── brainstorming/          # User intent discovery, requirements, and design exploration
    ├── canvas-design/          # Design philosophies and visual expression
    ├── dispatching-parallel-agents/ # Parallel agent task dispatching
    ├── editorial-motion-reveals/    # Masked container reveals, scroll triggers, parallax depth
    ├── executing-plans/        # Written plan execution with review checkpoints
    ├── finishing-a-development-branch/ # Integration, verification, and branch completion
    ├── framer-motion/          # LayoutId morphing, AnimatePresence, gesture springs
    ├── git-push/               # Safe GitHub push pipeline with commit confirmation
    ├── high-end-visual-design/ # Expensive agency-grade interfaces, typography, depth
    ├── mastering-typescript/   # Enterprise-grade TypeScript 5.9+ patterns and type safety
    ├── modern-saas-design/     # Modern SaaS design system (Teal/Coral), 6-step UI workflow
    ├── non-traditional-ui/     # Bespoke typography, asymmetrical spacing, fluid shapes
    ├── push/                   # Supabase migration deployment slash command
    ├── react-patterns/         # Modern React hooks, composition, and performance
    ├── receiving-code-review/  # Technical rigor in evaluating code review feedback
    ├── requesting-code-review/ # Pre-merge verification and code review requests
    ├── restful-api-design/     # RESTful API endpoints, Express controllers, services, middleware
    ├── scroll-experience/      # Parallax storytelling and scroll-driven experiences
    ├── subagent-driven-development/ # Executing implementation plans via subagents
    ├── supabase/               # Supabase Database, Auth, Storage, and Realtime operations
    ├── supabase-postgres-best-practices/ # Postgres indexing, RLS, queries, and schema rules
    ├── systematic-debugging/   # 4-phase root cause analysis for bugs and unexpected behavior
    ├── tailwind-4-docs/        # Tailwind CSS v4 documentation, utilities, and configuration
    ├── tailwind-design-system/ # Tailwind v4 design tokens and component libraries
    ├── tailwind-patterns/      # CSS-first configuration and design token architecture
    ├── test-driven-development/# Red-Green-Refactor development methodology
    ├── ui-ux-pro-max/          # Web/mobile design, color palettes, and UX patterns
    ├── using-git-worktrees/    # Worktree workspace isolation
    ├── using-superpowers/      # Master superpowers methodology & skill invocation rule
    ├── verification-before-completion/ # Automated test evidence before claiming completion
    ├── writing-plans/          # Multi-step task planning and roadmaps
    └── writing-skills/         # Creating and refining Antigravity skills
```

---

## 3. Decision Matrix: Where Does My Code Belong?

| If you are adding / editing: | Place it in: | Example File |
| :--- | :--- | :--- |
| Global navigation, topbar, or site footer | `frontend/src/components/layout/` | `Header.jsx`, `Footer.jsx` |
| Auth guard, permission gate, or session modal | `frontend/src/components/auth/` | `AuthGuard.jsx`, `SessionTimeoutModal.jsx`, `PermissionGate.jsx` |
| Content management quick-edit or review drawer | `frontend/src/components/cms/` | `PropertyQuickEditDrawer.jsx`, `ProposalReviewDrawer.jsx` |
| Shared portal table, modal, metric card, calendar | `frontend/src/components/dashboard/` | `AgentScheduleCalendar.jsx`, `DataTable.jsx`, `MetricCard.jsx` |
| Atomic button, loader, badge, or plain input | `frontend/src/components/ui/core/` | `Button.jsx`, `PageLoader.jsx`, `StatusBadge.jsx` |
| Domain card (property, agent, neighborhood) | `frontend/src/components/ui/cards/` | `PropertyCard.jsx`, `AgentCard.jsx`, `AnalyticsMetricCard.jsx` |
| Interactive Leaflet map or layer controller | `frontend/src/components/ui/map/` | `PropertyMap.jsx`, `MapLayerControl.jsx` |
| Production modal (detail, booking, filter drawer) | `frontend/src/components/ui/modals/` | `PropertyDetailModal.jsx`, `InspectionScheduleModal.jsx` |
| Unified faceted search bar or query engine | `frontend/src/components/ui/search/` | `UnifiedSearchBar.jsx` |
| Curated page section, gallery, or calculator | `frontend/src/components/ui/sections/` | `HeroVisualAnchor.jsx`, `FinancingCalculator.jsx` |
| Geographic reference datasets (PSGC regions, cities) | `frontend/src/data/geo/` | `regions.json`, `cities.json`, `barangays.json` |
| Client-side location & PSGC resolver | `frontend/src/services/` | `phLocationService.js` |
| Experimental motion showcase, animation lab | `frontend/src/sandbox/components/` | `CatwalkHorizontalShowcase.jsx`, `VectorHUDOverlay.jsx` |
| Staged sandbox route or lab playground | `frontend/src/sandbox/pages/` | `DemoUIUXPage.jsx`, `ParallaxLabPage.jsx`, `Duplex3DPage.jsx` |
| 3D canvas, Three.js scene, or WebGL shader | `frontend/src/components/3d/` | `CinematicPropertyViewer.jsx` |
| Public guest route (Home, Properties, About, Contact) | `frontend/src/pages/public/` | `Home.jsx`, `PropertiesPage.jsx`, `PropertyListingView.jsx` |
| Role-specific operational page (Agent) | `frontend/src/pages/portals/agent/` | `AgentDashboard.jsx`, `AgentAvailability.jsx`, `AgentInquiries.jsx` |
| Role-specific operational page (Broker) | `frontend/src/pages/portals/broker/` | `BrokerDashboard.jsx`, `BrokerCreateListings.jsx`, `BrokerAgents.jsx` |
| Role-specific operational page (Client) | `frontend/src/pages/portals/client/` | `ClientDashboard.jsx`, `ClientInquiries.jsx`, `ClientProfile.jsx` |
| Role-specific operational page (SuperAdmin) | `frontend/src/pages/portals/super-admin/` | `AdminUsersPage.jsx` |
| Authentication & onboarding page | `frontend/src/pages/auth/` | `LoginPage.jsx`, `AgentRegisterPage.jsx`, `ResetPasswordPage.jsx` |
| HTTP request call, endpoint fetcher, or REST client | `frontend/src/services/` | `apiClient.js`, `propertyService.js`, `appointmentService.js` |
| Custom React hook (filters, viewing list) | `frontend/src/hooks/` | `usePropertyFilterEngine.js`, `useViewingList.js` |
| Mock data fixtures or seed lists | `frontend/src/mockData/` | `mockProperties.js` |
| Backend HTTP endpoint handler | `backend/src/controllers/` | `property.controller.ts`, `inquiry.controller.ts`, `appointment.controller.ts` |
| Request payload validation (Zod schema) | `backend/src/schemas/` | `property.schema.ts`, `inquiry.schema.ts`, `appointment.schema.ts` |
| Backend business logic or Supabase queries | `backend/src/services/` | `property.service.ts`, `agent.service.ts`, `appointment.service.ts` |
| Express route definitions | `backend/src/routes/` | `property.routes.ts`, `inquiry.routes.ts`, `appointment.routes.ts` |
| Express middleware (auth, error, headers, upload) | `backend/src/middleware/` | `error.middleware.ts`, `auth.middleware.ts`, `role.middleware.ts` |
| SQL migration script or DDL schema | `backend/src/models/` | `agent_management_v2_migration.sql`, `appointments_calendar_v2_migration.sql` |
| CLI diagnostics, seeders, or database maintenance | `backend/src/scripts/` | `test-db-connection.ts`, `clean-database.ts`, `migrate.ts` |
| Transactional email templates (HTML/text) | `backend/src/templates/` | `emailTemplates.ts` |
| Environment variable parsing or app config | `backend/src/config/` | `index.ts`, `supabase.ts` |
| Shared data interface or DTO used by both sides | `shared/types/` | `property.ts`, `agent.ts`, `appointment.ts`, `inquiry.ts`, `api.ts` |
| Official system module documentation & logs | `docs/modules/<module-number>/` | `docs/modules/03-agent-management/INDEX.md` |
| AI rules, architectural invariants, or constraints | `.agents/rules/` | `database-schema-invariants.md` |
| Root automation or media generators | `scripts/` | `generate_parallax_layers.py`, `generate_session_doc.py` |
| Automated unit/integration test file | `test files/frontend/` or `test files/backend/` | `appointmentCalendarModule.test.ts`, `agentService.test.js` |

---

## 4. UI Effects & Design Token Alignment

All frontend code must comply with the design tokens codified in `AGENTS.md` and `design.md`:

1. **Modern SaaS Color Palette**:
   - **Base Canvas**: Slate Alabaster Ground (`#F8FAFC`)
   - **Surface Elevation**: Pure White (`#FFFFFF`) with 1px Border (`#E2E8F0`)
   - **Primary Brand**: Teal (`#0F766E`) | Hover (`#115E59`) | Active (`#14B8A6`)
   - **Conversion Accent**: Coral (`#FF6B6B`)
   - **Typographic Ink**: Slate 800 (`#1E293B`) | Slate 500 Muted (`#64748B`)
   - **Status Semantics**: Success (`#10B981`), Warning (`#F59E0B`), Destructive (`#DC2626`)
2. **Standard 8px Grid & Border Radius**:
   - Standard control & card radius is `8px` (`rounded-lg`). Small: `4px` (`rounded`), Large: `12px` (`rounded-xl`), Pill: `9999px` (`rounded-full`).
   - Strict 8px spacing rhythm: `8px`, `16px`, `24px`, `32px`, `40px`, `48px`.
3. **Concentric Curvature Formula**:
   $$R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$$
   *(e.g., outer `rounded-[2.5rem]` with `p-2.5` requires inner core `rounded-[calc(2.5rem-0.625rem)]`)*.
4. **Unified Control Height**:
   All interactive search elements, inputs, dropdowns, and buttons in toolbars maintain exact `h-[54px]`.
5. **Lenis Scroll Isolation**:
   Internal scrolling containers inside modals must include `data-lenis-prevent="true"`.
6. **Motion Physics**:
   Modal springs use `{ type: 'spring', damping: 25, stiffness: 200 }`. Hover controls use `cubic-bezier(0.32, 0.72, 0, 1)`.
7. **Accessibility & Wayfinding**:
   Minimum WCAG 2.2 AA ($\ge 4.5:1$) for standard text, AAA ($\ge 7.0:1$) for primary headings.
