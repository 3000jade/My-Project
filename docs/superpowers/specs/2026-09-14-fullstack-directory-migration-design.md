# Full-Stack Directory Migration & Architecture Map Design

**Date**: 2026-09-14  
**Classification**: Architectural  
**Status**: Approved  

---

## 1. Executive Summary & Objectives

This specification defines the architectural migration of the **CP_kerby** repository to a clean, decoupled full-stack monorepo layout (Option 1). It standardizes code organization across the frontend and backend, introduces a dedicated `shared/` layer for cross-stack data contracts, resolves legacy/misplaced directory paths, and creates a permanent, living blueprint at the project root: `ARCHITECTURE_MAP.md`.

### Core Goals:
1. **Zero Disruption to Existing Tooling**: Keep top-level directories named `frontend/` and `backend/` to preserve npm/vite/nodemon scripts and development commands.
2. **Standardized Layering**:
   - **Frontend**: Isolate structural chrome (`components/layout/`) from atomic UI controls (`components/ui/`), and standardize API integrations under `services/`.
   - **Backend**: Implement standard production layers (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`).
3. **Full-Stack Type Contracts**: Introduce `shared/types/` for shared TypeScript interfaces and API payload definitions.
4. **Living Architectural Map**: Publish `ARCHITECTURE_MAP.md` at root documenting folder responsibilities, file placement rules, and design token integration.
5. **Zero Breaking Changes**: Update all import statements across the codebase so all frontend and backend builds compile cleanly.

---

## 2. Directory Architecture

```text
CP_kerby/
├── frontend/                   # Frontend SPA (React 18 + Vite + Tailwind + Framer Motion)
│   ├── public/                 # Static public assets (favicons, video, 3D assets)
│   ├── src/
│   │   ├── assets/             # Bundled imagery, textures, and vector graphics
│   │   ├── components/         # Presentation UI components
│   │   │   ├── layout/         # Structural wrappers: Header.jsx, Footer.jsx, index.js
│   │   │   ├── ui/             # Atomic & feature controls (SearchBox, Modals, Showcases)
│   │   │   └── 3d/             # Three.js / Canvas scenes and 3D visual anchors
│   │   ├── hooks/              # Reusable React hooks (useLenis, scroll sentinels)
│   │   ├── mockData/           # Development mock properties and neighborhood records
│   │   ├── modules/            # Isolated domain features (e.g., Chat/ChatWidget)
│   │   ├── pages/              # Primary route views (Home, Properties, About, auth/)
│   │   ├── sandbox/            # Design laboratory & experimental showcases
│   │   ├── services/           # HTTP API client and endpoints (apiClient.js)
│   │   ├── types/              # Client-specific UI types
│   │   ├── utils/              # Client utility functions and formatters
│   │   ├── App.jsx             # Main routing and Lenis smooth-scroll provider
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind v4 configuration & theme tokens
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Server configuration & environment validation
│   │   │   └── index.ts
│   │   ├── controllers/        # HTTP handlers: request parsing & response dispatch
│   │   │   └── health.controller.ts
│   │   ├── middleware/         # Express middleware (error handling, auth, CORS)
│   │   │   └── error.middleware.ts
│   │   ├── models/             # Data schemas & entity definitions
│   │   │   └── property.model.ts
│   │   ├── routes/             # API routes
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts
│   │   ├── services/           # Pure business logic and database queries
│   │   │   └── health.service.ts
│   │   ├── utils/              # Helpers and logging utilities
│   │   └── index.ts            # Server entry point & Express bootstrapping
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                     # Cross-stack shared contracts & definitions
│   └── types/
│       ├── property.ts         # Shared Property and Listing types
│       ├── api.ts              # Standardized API response format { success, data, error }
│       └── index.ts            # Barrel export
│
├── .env.example                # Root environment reference documenting all keys
├── ARCHITECTURE_MAP.md         # Permanent canonical reference & file taxonomy guide
├── design.md                   # The Monolith & The Void design manifesto
└── .agents/                    # Agent skills, workflows, and behavioral rules
```

---

## 3. Frontend Migration Plan

### 3.1 Relocated Files
- Move `frontend/src/components/Header.jsx` -> `frontend/src/components/layout/Header.jsx`
- Move `frontend/src/components/Footer.jsx` -> `frontend/src/components/layout/Footer.jsx`
- Create `frontend/src/components/layout/index.js` exporting `Header` and `Footer`.
- Move `frontend/src/api/apiClient.js` -> `frontend/src/services/apiClient.js`.
- Provide a legacy bridge in `frontend/src/api/apiClient.js` re-exporting from `services/` to prevent external or dangling import breakages.
- Remove obsolete empty directory `frontend/src/app/`.

### 3.2 Import Reference Updates
Update import paths across:
- `frontend/src/App.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/AboutPage.jsx`
- `frontend/src/pages/PropertiesPage.jsx`
- `frontend/src/sandbox/SandboxLayout.jsx`
- Any pages or components consuming `apiClient.js`

---

## 4. Backend Migration Plan

### 4.1 Directory & Layer Standardization
- Rename / standardize `backend/src/middlewares/` -> `backend/src/middleware/`.
- Update `backend/src/index.ts` to import `errorHandler` from `./middleware/error.middleware`.
- Create `backend/src/config/index.ts` to centralize validated environment variables (`PORT`, `NODE_ENV`, etc.).
- Create `backend/src/services/health.service.ts` and refactor `backend/src/controllers/health.controller.ts` to call this service, establishing the controller-service pattern.
- Create `backend/src/models/property.model.ts` for property domain types.
- Create `backend/src/routes/index.ts` as the primary API router aggregator.
- Create `backend/src/utils/logger.ts` for standardized logging.

---

## 5. Shared Layer (`shared/types/`)

To guarantee contract synchronization between frontend and backend:
- `shared/types/api.ts`: Standard response envelope
- `shared/types/property.ts`: Universal property entity schema
- `shared/types/index.ts`: Barrel export

---

## 6. Living Map Specification (`ARCHITECTURE_MAP.md`)

The file `ARCHITECTURE_MAP.md` will be placed at the project root. It will document:
1. Complete tree view of the workspace with role annotations.
2. Layer rules: where new files belong (e.g. where a new modal goes, where a new route goes).
3. Import rules & path aliases.
4. UI and design token compliance (referencing `AGENTS.md` and `design.md`).

---

## 7. Verification Plan

1. **Frontend Verification**:
   - Run `npm run build` in `frontend/` to ensure Vite resolves all imports and bundles cleanly with zero module errors.
2. **Backend Verification**:
   - Run `npm run build` in `backend/` to ensure TypeScript compiles without type or import errors.
3. **Architecture Verification**:
   - Inspect directory tree and ensure no empty or orphaned folders remain.
   - Confirm `ARCHITECTURE_MAP.md` is complete and formatted cleanly.
