# Architecture Map & Directory Blueprint

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Pattern**: Decoupled Full-Stack Monorepo (Option 1)  
> **Classification**: Master Architectural Blueprint & Source of Truth  
> **Last Updated**: 2026-09-14  

---

## 1. High-Level System Overview

The **CP_kerby** platform is structured as an enterprise-grade decoupled monorepo. It cleanly separates the client-facing presentation layer (`frontend/`), the server API and domain logic layer (`backend/`), and shared type contracts (`shared/`).

```text
CP_kerby/
├── frontend/                   # Client-side SPA (React 18, Vite, Tailwind CSS v4, Framer Motion)
├── backend/                    # Server-side API (Node.js, Express, TypeScript)
├── shared/                     # Cross-cutting types and data contracts
├── docs/                       # Specifications, plans, and architectural design docs
├── .agents/                    # Agent behaviors, prompt engineering rules, and skills
├── .env.example                # Unified environment variable template
├── ARCHITECTURE_MAP.md         # Canonical project directory map (this document)
└── design.md                   # Visual design philosophy ("The Monolith & The Void")
```

---

## 2. Comprehensive Directory Tree & Role Taxonomy

### 2.1 Workspace Root

| Path | Responsibility / Purpose |
| :--- | :--- |
| `frontend/` | Complete user interface application, animation engines, and client routers. |
| `backend/` | RESTful API server, health monitoring, business services, and database schemas. |
| `shared/` | Full-stack TypeScript interfaces, shared DTOs, and API contract envelopes. |
| `docs/` | Architecture specs (`docs/superpowers/specs/`) and execution plans (`docs/superpowers/plans/`). |
| `.agents/` | Antigravity AI agent rules (`AGENTS.md`) and specialized skills. |
| `.env.example` | Root template documenting required environment variables for client and server. |
| `ARCHITECTURE_MAP.md` | Living blueprint defining structural conventions and code locations. |
| `design.md` | "The Monolith & The Void" design manifesto and mathematical token formulas. |

---

### 2.2 Frontend Layer (`frontend/src/`)

```text
frontend/
├── public/                     # Static unbundled assets
│   ├── frames/                 # WebP image sequence frames for scrubbed video transitions
│   └── video/                  # Flythrough renders & media assets
├── src/
│   ├── assets/                 # High-resolution architectural photography & vector graphics
│   ├── components/             # React presentation components
│   │   ├── layout/             # Top-level shell frames: Header.jsx, Footer.jsx, index.js
│   │   ├── ui/                 # Atomic & showcase controls (Buttons, Modals, SearchBox, Cards)
│   │   └── 3d/                 # Three.js canvas components, camera rigs, and 3D visual anchors
│   ├── hooks/                  # Custom reusable React hooks (e.g., useLenis, scroll tracking)
│   ├── mockData/               # High-fidelity mock property datasets, user fixtures, and about content
│   ├── modules/                # Self-contained feature slices (e.g., modules/Chat/ChatWidget.jsx)
│   ├── pages/                  # Route page views (Home.jsx, PropertiesPage.jsx, AboutPage.jsx, auth/)
│   ├── sandbox/                # Visual staging lab, UI/UX showcases, and component playgrounds
│   ├── services/               # HTTP client layer & API service integrations (apiClient.js)
│   ├── types/                  # Frontend-specific UI prop types and local interfaces
│   ├── utils/                  # Helper formatters (currency, measurement conversions)
│   ├── App.jsx                 # Application entry, router table, and Lenis smooth-scroll provider
│   ├── main.jsx                # DOM root mount
│   └── index.css               # Tailwind CSS v4 directives and design tokens
├── package.json
└── vite.config.js
```

#### Frontend Layer Rules:
1. **Layout (`components/layout/`)**:
   - Houses global structural elements that wrap views: `Header.jsx`, `Footer.jsx`.
   - Must export through `components/layout/index.js`.
2. **UI Library (`components/ui/`)**:
   - Atomic primitives (`Button.jsx`, inputs) and specialized showcase displays (`AdvancedSearchBox.jsx`, `PropertyDetailModal.jsx`).
   - Must adhere strictly to the uniform baseline height (`h-[54px]`) and concentric corner radius rules ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$).
3. **3D Visuals (`components/3d/`)**:
   - All Three.js, React Three Fiber, WebGL canvas components, and orbit controllers live here.
4. **Services (`services/`)**:
   - All network requests go through `services/apiClient.js`. Never invoke raw `fetch` or `axios` directly within UI components.
5. **Sandbox (`sandbox/`)**:
   - Isolated staging ground for experimental pages (`DemoUIUXPage.jsx`, `Duplex3DPage.jsx`, `HomeValuationPage.jsx`).

---

### 2.3 Backend Layer (`backend/src/`)

```text
backend/
├── src/
│   ├── config/                 # Environment validation and server configuration (config/index.ts)
│   ├── controllers/            # HTTP handlers: request validation and HTTP status dispatching
│   ├── middleware/             # Express middlewares (error handling, auth, security guards)
│   ├── models/                 # Domain models and database entity schemas
│   ├── routes/                 # Express router definitions and route mapping (routes/index.ts)
│   ├── services/               # Pure business logic and database queries
│   ├── utils/                  # Logging (utils/logger.ts), string helpers, date formatters
│   └── index.ts                # Application bootstrap, middleware registration, port listener
├── dist/                       # Compiled production JavaScript (output from tsc)
├── tsconfig.json               # Backend TypeScript compiler options
└── package.json
```

#### Backend Layer Rules:
1. **Controller-Service Separation**:
   - **Controllers (`controllers/`)**: Accept Express `(req, res, next)`, parse query/body params, call services, and return standard JSON. No SQL, ORM, or database queries in controllers.
   - **Services (`services/`)**: Contain pure business logic, calculations, and database calls. Return raw data or throw domain errors.
2. **Standardized Middleware (`middleware/`)**:
   - All global exception handlers, auth guards, rate limiters, and CORS configurations live here.
3. **Central Configuration (`config/`)**:
   - Access `process.env` exclusively through `config/index.ts`. Never spread raw `process.env` calls across controller or service files.
4. **Master Router (`routes/index.ts`)**:
   - Aggregates sub-routers (e.g. `health.routes.ts`, `property.routes.ts`) and mounts onto `/api`.

---

### 2.4 Shared Contract Layer (`shared/types/`)

```text
shared/
└── types/
    ├── api.ts                  # Standardized ApiResponse<T> and PaginatedResponse<T> envelopes
    ├── property.ts             # Universal Property, ValuationEstimate, and Listing definitions
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

## 3. Decision Matrix: Where Does My Code Belong?

| If you are adding / editing: | Place it in: | Example File |
| :--- | :--- | :--- |
| Global navigation, topbar, or site footer | `frontend/src/components/layout/` | `Header.jsx`, `Footer.jsx` |
| Reusable button, modal, card, or search bar | `frontend/src/components/ui/` | `AdvancedSearchBox.jsx`, `Button.jsx` |
| 3D canvas, Three.js scene, or WebGL shader | `frontend/src/components/3d/` | `CinematicPropertyViewer.jsx` |
| A full page route (Home, Properties, About) | `frontend/src/pages/` | `PropertiesPage.jsx`, `Home.jsx` |
| An isolated experimental or staging screen | `frontend/src/sandbox/` | `DemoUIUXPage.jsx`, `SandboxHubPage.jsx` |
| HTTP request call, endpoint fetcher, or REST client | `frontend/src/services/` | `apiClient.js`, `propertyService.js` |
| Custom React hook (scroll sentinel, state tween) | `frontend/src/hooks/` | `useLenisScroll.js` |
| Mock data fixtures or seed lists | `frontend/src/mockData/` | `mockProperties.js` |
| Backend HTTP endpoint handler | `backend/src/controllers/` | `property.controller.ts` |
| Backend business logic or database query | `backend/src/services/` | `property.service.ts` |
| Express route definitions | `backend/src/routes/` | `property.routes.ts` |
| Express middleware (auth, error, headers) | `backend/src/middleware/` | `error.middleware.ts` |
| Environment variable parsing or app config | `backend/src/config/` | `index.ts` |
| Shared data interface or DTO used by both sides | `shared/types/` | `property.ts`, `api.ts` |

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
