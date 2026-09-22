# CP_kerby Technology Stack & System Architecture

> **System**: CP_kerby Luxury Architectural Real Estate Platform  
> **Architecture Pattern**: Decoupled Full-Stack Monorepo  
> **Source of Truth**: `TECHSTACK.md`  
> **Last Updated**: 2026-09-17  

---

## 1. High-Level Architecture Overview

The **CP_kerby** platform is engineered as an enterprise-grade decoupled monorepo, separating client-side presentation, high-performance API services, and shared type contracts into isolated workspaces:

```text
CP_kerby/
├── frontend/          # Client Single Page Application (React 19, Vite, Tailwind v4, 3D & Motion)
├── backend/           # Server API (Node.js, Express v5, TypeScript, Supabase, Groq/xAI)
├── test files/        # Unified test suites (git-ignored; isolated frontend/ & backend/)
├── shared/            # Shared TypeScript contracts, DTOs, and API response envelopes
├── docs/              # Architectural blueprints, specs, and execution plans
├── scripts/           # Python asset processing pipelines (layer splitting, parallax depth)
└── .agents/           # Antigravity agent workflows, rules, and engineering skills
```

---

## 2. Frontend Technology Stack (`frontend/`)

### Core Runtime & Framework
- **Framework**: [React 19](https://react.dev/) (`react: ^19.2.7`, `react-dom: ^19.2.7`)
- **Build Tool / Bundler**: [Vite 8](https://vite.dev/) (`vite: ^8.1.1`, `@vitejs/plugin-react: ^6.0.3`)
- **Client Routing**: [React Router v7](https://reactrouter.com/) (`react-router-dom: ^7.18.1`)
- **Module System**: ES Modules (`"type": "module"`)

### Styling & Design System
- **CSS Engine**: [Tailwind CSS v4](https://tailwindcss.com/) (`tailwindcss: ^4.3.3`, `@tailwindcss/vite: ^4.3.3`)
- **Design Language**: Architectural Modernism / "The Monolith & The Void" (`design.md`)
- **Primary Typography**: Plus Jakarta Sans (geometric sans-serif architectural hierarchy)
- **Palette**: Mineral Spruce (`#1b4d4b`), Architectural Terracotta (`#e28468`), Obsidian Slate (`#0f1722`), Pristine Alabaster (`#f9f9f7`)

### Animation & Motion Engines
- **Physics & Layout Motion**: [Framer Motion v12](https://motion.dev/) (`framer-motion: ^12.42.2`) — spring physics modals, micro-interactions, layout transitions
- **Timeline & Scroll Orchestration**: [GSAP v3](https://gsap.com/) (`gsap: ^3.15.0`, `@gsap/react: ^2.1.2`) — multi-layer scrubbed animations and pinned showcases
- **Micro-Animations & Counters**: [Anime.js v4](https://animejs.com/) (`animejs: ^4.5.0`) — numerical count-ups and SVG morphing sequences
- **Smooth Momentum Scroll**: [Lenis](https://lenis.darkroom.engineering/) (`lenis: ^1.3.25`) — decoupled momentum scrolling with `data-lenis-prevent="true"` isolation for modal scrollbars

### 3D Visuals & WebGL
- **3D Engine**: [Three.js](https://threejs.org/) (`three: ^0.185.1`)
- **React 3D Bridge**: [React Three Fiber](https://r3f.docs.pmnd.rs/) (`@react-three/fiber: ^9.6.1`)
- **3D Utilities**: [@react-three/drei](https://github.com/pmndrs/drei) (`^10.7.7`) & [Maath](https://github.com/pmndrs/maath) (`^0.10.8`)
- **Post-Processing**: [postprocessing](https://github.com/pmndrs/postprocessing) (`^6.39.4`, `@react-three/postprocessing: ^3.1.1`)

### Component Primitives & UI Enhancements
- **UI System**: [Mantine UI v9](https://mantine.dev/) (`@mantine/core: ^9.4.2`, `@mantine/hooks: ^9.4.2`, `@mantine/carousel: ^9.4.2`)
- **Command Palette**: [cmdk](https://cmdk.paco.me/) (`cmdk: ^1.1.1`)
- **Carousel Engine**: [Embla Carousel](https://www.embla-carousel.com/) (`embla-carousel: ^8.6.0`, `embla-carousel-react: ^8.6.0`)
- **List Virtualization**: [TanStack Virtual](https://tanstack.com/virtual/latest) (`@tanstack/react-virtual: ^3.14.7`)
- **Media Lightbox**: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/) (`^3.32.1`)
- **Iconography**: [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react: ^3.45.0`)

### Maps & Regional Data
- **Interactive Maps**: [Leaflet](https://leafletjs.com/) (`leaflet: ^1.9.4`, `react-leaflet: ^5.0.0`)
- **Localization**: [select-philippines-address](https://www.npmjs.com/package/select-philippines-address) (`^1.0.6`) — Philippine regions, provinces, cities, and barangays

### Networking & Client Services
- **HTTP Client**: [Axios](https://axios-http.com/) (`axios: ^1.7.9`) wrapped in `services/apiClient.js`

### Testing & Quality Assurance
- **Test Runner**: [Vitest](https://vitest.dev/) (`vitest: ^5.0.0`) with `jsdom` (`^29.1.1`), executing unified test suites in `test files/frontend/` with root FS traversal (`server.fs.allow: ['..']`).
- **DOM Assertions**: `@testing-library/react` (`^16.3.3`), `@testing-library/jest-dom` (`^7.0.1`)
- **Linting**: ESLint v10 (`eslint: ^10.6.0`, `@eslint/js: ^10.0.1`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)

---

## 3. Backend Technology Stack (`backend/`)

### Runtime & Language
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Language**: [TypeScript v7](https://www.typescriptlang.org/) (`typescript: ^7.0.2`)
- **Development Execution**: [tsx](https://github.com/privatenumber/tsx) (`tsx: ^4.23.13` with live-watch mode)

### Server Framework & Architecture
- **Web Framework**: [Express v5](https://expressjs.com/) (`express: ^5.2.1`)
- **Architecture Pattern**: Controller-Service-Repository pattern with separation of concerns:
  - `controllers/`: HTTP endpoint handling and request validation
  - `services/`: Domain business logic, database queries, and AI integrations
  - `middleware/`: Global exception interceptor, security guards, CORS policies
  - `config/`: Strictly typed configuration and environment variable loading

### Database & Backend-as-a-Service (BaaS)
- **Database & Auth Platform**: [Supabase](https://supabase.com/) (`@supabase/supabase-js: ^2.116.0`)
- **Underlying Database**: PostgreSQL (via Supabase) with Row-Level Security (RLS)

### AI & Language Models
- **AI Concierge**: Dual-engine integration supporting [Groq Cloud](https://groq.com/) (ultra-fast LPU inference with `openai/gpt-oss-120b`) and [xAI](https://x.ai/) (`grok-2-latest`) with automatic provider auto-detection.

### Security & Server Middleware
- **Security Headers**: [Helmet](https://helmetjs.github.io/) (`helmet: ^8.3.0`)
- **Cross-Origin Resource Sharing**: [CORS](https://github.com/expressjs/cors) (`cors: ^2.8.6`)
- **HTTP Logging**: [Morgan](https://github.com/expressjs/morgan) (`morgan: ^1.11.0`)
- **Configuration Management**: [Dotenv](https://github.com/motdotla/dotenv) (`dotenv: ^17.4.2`)

### Testing
- **Test Runner**: [Vitest](https://vitest.dev/) (`vitest: ^5.0.1`) configured via `vitest.config.mjs`, executing unified backend suites in `test files/backend/`.

---

## 4. Shared Contract Layer (`shared/`)

- **Contracts**: Full-stack TypeScript interfaces in `shared/types/`
- **Envelope Format**: Standardized `ApiResponse<T>` and `PaginatedResponse<T>`
- **Domain Models**: Shared `Property`, `ValuationEstimate`, `Inquiry`, and `User` types ensuring zero drift between client and server.

---

## 5. Automation & Python Tooling (`scripts/`)

- **Asset Pipelines**: Python 3 automation scripts for parallax layer extraction, mask slicing, and Dream Gate visual effects.

---

## 6. Summary Matrix

| Domain | Primary Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `19.2.7` | UI component tree and state hydration |
| **Frontend Bundler** | Vite | `8.1.1` | Instant HMR development and optimized production build |
| **Styling** | Tailwind CSS | `4.3.3` | Utility-first styling with modern CSS engine |
| **Physics Animation** | Framer Motion | `12.42.2` | Spring-physics modals and page micro-transitions |
| **Scrubbed Motion** | GSAP | `3.15.0` | High-precision scroll-tied timeline animations |
| **Momentum Scroll** | Lenis | `1.3.25` | Smooth page momentum scrolling and modal isolation |
| **3D Engine** | Three.js + R3F | `0.185.1` / `9.6.1` | WebGL architectural property viewports & models |
| **UI Kit & Shell** | Mantine Core | `9.4.2` | Robust accessible interactive primitives |
| **Maps** | Leaflet + React-Leaflet | `1.9.4` / `5.0.0` | Geospatial property maps |
| **Backend Runtime** | Node.js + TypeScript | `Node` / `7.0.2` | Typed backend execution |
| **Backend Framework** | Express | `5.2.1` | REST API routes, controllers, middleware |
| **Database & Auth** | Supabase | `2.116.0` | Managed PostgreSQL, storage, and authentication |
| **Full-Stack Testing** | Vitest | `5.0.x` | Unit and integration test runner across stack |
