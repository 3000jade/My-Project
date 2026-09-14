# Full-Stack Directory Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the repository into a standardized, decoupled full-stack monorepo structure (Option 1), establish cross-stack shared type contracts, align frontend/backend internal layers, and generate a master `ARCHITECTURE_MAP.md` at the project root.

**Architecture:** Maintain top-level `frontend/` and `backend/` directories for zero disruption to development scripts. Introduce `shared/types/` for full-stack contracts. Migrate frontend layout components into `components/layout/` and HTTP services into `services/`, updating all consumer imports. Refactor backend layers into `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, and `utils/`. Publish `ARCHITECTURE_MAP.md` as the permanent blueprint.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Framer Motion, Lenis, Node.js, Express, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-14-fullstack-directory-migration-design.md`

## Global Constraints

- Never break existing developer workflows: `cd frontend && npm run dev` and `cd backend && npm run dev` must continue working seamlessly.
- Preserve all existing animations, Lenis scroll configurations, and design token formulas ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$, `h-[54px]`).
- All relative import paths affected by file movements must be updated atomically.
- All tests and TypeScript builds must pass cleanly before marking tasks complete.

---

### Task 1: Shared Layer Scaffolding & Root Environment Template

**Files:**
- Create: `shared/types/api.ts`
- Create: `shared/types/property.ts`
- Create: `shared/types/index.ts`
- Create: `.env.example`

**Interfaces:**
- Produces:
  - `ApiResponse<T>`: Standard response structure `{ success: boolean, data?: T, error?: string, message?: string, timestamp: string }`
  - `Property`: Universal property data schema
  - `ValuationEstimate`: Property valuation interface

- [ ] **Step 1: Create `shared/types/api.ts`**

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

- [ ] **Step 2: Create `shared/types/property.ts`**

```typescript
export interface Property {
  id: string | number;
  title: string;
  tagline?: string;
  price: number;
  formattedPrice?: string;
  location: {
    address: string;
    city: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specs: {
    beds: number;
    baths: number;
    sqft: number;
    propertyType: string;
    yearBuilt?: number;
  };
  features: string[];
  images: string[];
  architecturalStyle?: string;
  status: 'available' | 'pending' | 'sold';
  createdAt: string;
  updatedAt: string;
}

export interface ValuationEstimate {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidenceScore: number;
  lastUpdated: string;
}
```

- [ ] **Step 3: Create `shared/types/index.ts`**

```typescript
export * from './api';
export * from './property';
```

- [ ] **Step 4: Create root `.env.example`**

```bash
# ==========================================
# Full-Stack Monorepo Environment Variables
# ==========================================

# Backend Configuration
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

- [ ] **Step 5: Verify shared files exist and commit**

Run: `git add shared .env.example && git commit -m "feat(shared): scaffold shared types and root .env.example"`

---

### Task 2: Frontend Directory Migration & Import Updates

**Files:**
- Create: `frontend/src/components/layout/index.js`
- Move: `frontend/src/components/Header.jsx` -> `frontend/src/components/layout/Header.jsx`
- Move: `frontend/src/components/Footer.jsx` -> `frontend/src/components/layout/Footer.jsx`
- Move: `frontend/src/api/apiClient.js` -> `frontend/src/services/apiClient.js`
- Create: `frontend/src/api/apiClient.js` (bridge re-export)
- Delete: `frontend/src/app/` (empty directory)
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/AboutPage.jsx`
- Modify: `frontend/src/pages/PropertiesPage.jsx`
- Modify: `frontend/src/sandbox/SandboxLayout.jsx`

**Interfaces:**
- Consumes: Existing component implementations
- Produces:
  - `frontend/src/components/layout/Header.jsx`
  - `frontend/src/components/layout/Footer.jsx`
  - `frontend/src/services/apiClient.js`

- [ ] **Step 1: Move Header and Footer to `components/layout/`**

Create directory `frontend/src/components/layout/` and move:
- `frontend/src/components/Header.jsx` -> `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/Footer.jsx` -> `frontend/src/components/layout/Footer.jsx`

- [ ] **Step 2: Create `frontend/src/components/layout/index.js`**

```javascript
export { default as Header } from './Header';
export { default as Footer } from './Footer';
```

- [ ] **Step 3: Move `apiClient.js` to `services/` and establish bridge**

Create `frontend/src/services/apiClient.js` with content from `frontend/src/api/apiClient.js`.
In `frontend/src/api/apiClient.js`, provide backward compatibility:
```javascript
export * from '../services/apiClient';
import apiClient from '../services/apiClient';
export default apiClient;
```

- [ ] **Step 4: Remove empty `frontend/src/app/` directory**

Delete `frontend/src/app/`.

- [ ] **Step 5: Update imports in consumer files**

- In `frontend/src/App.jsx`:
  Change:
  `import Header from './components/Header';` -> `import Header from './components/layout/Header';`
  `import Footer from './components/Footer';` -> `import Footer from './components/layout/Footer';`
- In `frontend/src/pages/Home.jsx`:
  Change:
  `import Header from '../components/Header';` -> `import Header from '../components/layout/Header';`
  `import Footer from '../components/Footer';` -> `import Footer from '../components/layout/Footer';`
- In `frontend/src/pages/AboutPage.jsx`:
  Change:
  `import Header from '../components/Header';` -> `import Header from '../components/layout/Header';`
  `import Footer from '../components/Footer';` -> `import Footer from '../components/layout/Footer';`
- In `frontend/src/pages/PropertiesPage.jsx`:
  Change:
  `import Header from '../components/Header';` -> `import Header from '../components/layout/Header';`
  `import Footer from '../components/Footer';` -> `import Footer from '../components/layout/Footer';`
- In `frontend/src/sandbox/SandboxLayout.jsx`:
  Ensure any layout imports reference `../components/layout/`.

- [ ] **Step 6: Run frontend build to verify zero broken imports**

Run: `cd frontend && npm run build`
Expected: Build passes with 0 errors and outputs to `frontend/dist`.

- [ ] **Step 7: Commit frontend migration**

Run: `git add frontend && git commit -m "refactor(frontend): migrate layout components and services layer"`

---

### Task 3: Backend Layering & Structure Standardization

**Files:**
- Move / Rename: `backend/src/middlewares/` -> `backend/src/middleware/`
- Create: `backend/src/config/index.ts`
- Create: `backend/src/services/health.service.ts`
- Modify: `backend/src/controllers/health.controller.ts`
- Create: `backend/src/models/property.model.ts`
- Create: `backend/src/routes/index.ts`
- Create: `backend/src/utils/logger.ts`
- Modify: `backend/src/index.ts`

**Interfaces:**
- Produces:
  - `config`: typed application configuration
  - `healthService.getHealthStatus()`: returns health details
  - `apiRouter`: master express router mounted at `/api`
  - `logger`: structured logging utility

- [ ] **Step 1: Standardize `middlewares/` to `middleware/`**

Move `backend/src/middlewares/error.middleware.ts` to `backend/src/middleware/error.middleware.ts` and remove `middlewares/`.

- [ ] **Step 2: Create `backend/src/config/index.ts`**

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
```

- [ ] **Step 3: Create `backend/src/services/health.service.ts`**

```typescript
export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
  memoryUsage: NodeJS.MemoryUsage;
}

export class HealthService {
  public static getHealthStatus(): HealthStatus {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
    };
  }
}
```

- [ ] **Step 4: Refactor `backend/src/controllers/health.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';

export const getHealth = (req: Request, res: Response): void => {
  const healthData = HealthService.getHealthStatus();
  res.status(200).json({
    success: true,
    data: healthData,
    timestamp: healthData.timestamp,
  });
};
```

- [ ] **Step 5: Create `backend/src/models/property.model.ts`**

```typescript
export interface PropertyModel {
  id: string;
  title: string;
  tagline?: string;
  price: number;
  location: {
    address: string;
    city: string;
    state?: string;
  };
  specs: {
    beds: number;
    baths: number;
    sqft: number;
    propertyType: string;
  };
  features: string[];
  images: string[];
  status: 'available' | 'pending' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 6: Create `backend/src/routes/index.ts`**

```typescript
import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);

export default router;
```

- [ ] **Step 7: Create `backend/src/utils/logger.ts`**

```typescript
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
  },
};
```

- [ ] **Step 8: Update `backend/src/index.ts`**

Update `backend/src/index.ts` to consume `config`, `middleware/error.middleware`, and master router `routes/index.ts`.

- [ ] **Step 9: Run backend TypeScript build**

Run: `cd backend && npm run build`
Expected: TypeScript compiles cleanly with 0 errors into `backend/dist`.

- [ ] **Step 10: Commit backend migration**

Run: `git add backend && git commit -m "refactor(backend): standardize layered architecture (config, middleware, services, models, routes)"`

---

### Task 4: Master Architecture Map (`ARCHITECTURE_MAP.md`) & Rule Alignment

**Files:**
- Create: `ARCHITECTURE_MAP.md`
- Modify: `.agents/AGENTS.md` (add reference to `ARCHITECTURE_MAP.md`)

- [ ] **Step 1: Create `ARCHITECTURE_MAP.md` at root**

Document the comprehensive workspace tree, folder definitions, layer contracts, code placement guidelines, and architectural rules.

- [ ] **Step 2: Update `.agents/AGENTS.md`**

Add cross-link and enforcement rule linking to `ARCHITECTURE_MAP.md`.

- [ ] **Step 3: Commit architecture map**

Run: `git add ARCHITECTURE_MAP.md .agents/AGENTS.md && git commit -m "docs: add master ARCHITECTURE_MAP.md and update AGENTS.md"`

---

### Task 5: End-to-End Build & Final Verification

- [ ] **Step 1: Test Frontend Build**
  Run: `cd frontend && npm run build`
  Expected: Clean build output.

- [ ] **Step 2: Test Backend Build**
  Run: `cd backend && npm run build`
  Expected: Clean build output.

- [ ] **Step 3: Verify Clean Git Status**
  Run: `git status`
  Expected: Working tree clean or only untracked artifacts.
