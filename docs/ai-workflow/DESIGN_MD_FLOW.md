# Antigravity AI Agent Design Workflow: `design.md` to `shadcn-ui` Execution Flow

---

## 1. Executive Summary

This document formalizes the **Antigravity AI Agent Design System Workflow** for Human Shelter Realty. It details the end-to-end integration between **[`design.md`](../../design.md)** (authoritative brand and visual token specification), the **[`shadcn-ui` skill](../../.agents/skills/shadcn-ui/SKILL.md)** (technical component distribution playbook), and the **Antigravity AI Agent** (code executor and pair programmer).

### Key Architectural Invariants Delivered:
1. **Authoritative Tokens:** Direct enforcement of Primary Teal (`#0F766E`), High-Impact Coral (`#FF6B6B` with `#1E293B` text/icons at 5.27:1 contrast), Canvas Ground (`#F8FAFC`), Surface (`#FFFFFF`), and Hairline Border (`#E2E8F0`).
2. **Component Ownership:** Owned base primitives installed directly in `frontend/src/components/ui/` (`button`, `card`, `table`, `badge`, `skeleton`, `dropdown-menu`, `dialog`), eliminating black-box package lock-in.
3. **Automatic Skill Initiation:** Instructions in Section 2 of `design.md` explicitly mandate activating and reading the `shadcn-ui` skill for all UI component implementations.
4. **Mandatory 6-Step Approval Gate:** Strict adherence to `INSPECT → ANALYZE → PROPOSE → APPROVAL GATE (Hard Stop) → IMPLEMENT → VERIFY`.
5. **Pilot Implementation Verified:** Complete refactor of `BrokerDashboard.jsx` using the shared primitive layer, verified with `vitest` (3/3 passing) and production Vite build (0 errors).

---

## 2. The 3-Tier System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. design.md                    THE AUTHORITATIVE BLUEPRINT            │
│    - Authoritative Hex Tokens (#0F766E, #FF6B6B, #1E293B, #F8FAFC)     │
│    - Geometry (8px standard radius, 8px grid, h-[40px]/h-[48px])       │
│    - Mandatory WCAG 2.2 AA Contrast & Screen Specifications            │
│    - Direct Directive: "Initiate and follow the shadcn-ui skill"       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ triggers & directs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. .agents/skills/shadcn-ui/    THE TECHNICAL PLAYBOOK                 │
│    - Radix UI Headless Accessibility & Keyboard Navigation             │
│    - Tailwind CSS v4 Utility Mapping & CVA Variant Recipes             │
│    - 50+ Component Catalog (Actions, Tables, Overlays, Forms)          │
│    - Real Estate Invariants (asChild, data-lenis-prevent="true")       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ instructs & guides
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. ANTIGRAVITY AI AGENT         THE EXECUTOR & CODE BUILDER            │
│    - Inspects existing code (Read-Only)                                │
│    - Analyzes gaps and formulates formal Design Proposals              │
│    - WAITS for explicit user approval before touching files           │
│    - Executes CLI commands (npx shadcn add) and writes JSX / CSS       │
│    - Verifies builds (npm run build) and runs Vitest test suites       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Workflow Execution Loop

Whenever a user requests a design update, UI refactor, or component creation, the agent executes this mandatory 6-step lifecycle:

$$\text{INSPECT} \longrightarrow \text{ANALYZE} \longrightarrow \text{PROPOSE} \longrightarrow \text{APPROVAL GATE} \longrightarrow \text{IMPLEMENT} \longrightarrow \text{VERIFY}$$

### Step 1: Inspect (Read-Only)
- Inspect the target page, layout, and component dependencies.
- Inspect `design.md` for applicable visual constraints.
- Verify existing imports and shared UI components (`src/components/ui/`).
- **No files are modified during this phase.**

### Step 2: Analyze & Match Skill
- Identify deviations against `design.md` (e.g. legacy colors, missing focus rings, raw tables).
- Initiate the `shadcn-ui` skill in `.agents/skills/shadcn-ui/` to identify the required primitives.
- Determine if primitives exist or need to be generated in `frontend/src/components/ui/`.

### Step 3: Propose
- Formulate a structured proposal matching the required specification format:
  - **Target:** Page or component name
  - **Existing Design:** Issues and inconsistencies identified
  - **Proposed UI Changes:** Tokens, primitives, and layout adjustments
  - **Proposed UX Changes:** Empty states, skeletons, responsive adjustments
  - **Affected Files:** Precise list of files to be created or modified
  - **Risks:** Scope boundary analysis

### Step 4: Approval Gate (HARD STOP)
> [!IMPORTANT]
> The agent MUST pause and wait for explicit user confirmation before touching or writing any files in the workspace.

### Step 5: Implement (With Owned Primitives)
After user approval:
1. **Scaffold Primitives:** If not already present, create or install the required primitives in `frontend/src/components/ui/` (`button.jsx`, `card.jsx`, `table.jsx`, etc.) using CVA and `design.md` tokens.
2. **Export through Barrel:** Register the new primitives in `frontend/src/components/ui/index.js`.
3. **Compose Page UI:** Refactor the target view using the primitives, ensuring:
   - Links wrapped in `<Button asChild><Link to="...">...</Link></Button>`.
   - Modals and drawers include `data-lenis-prevent="true"`.
   - Financial figures and cadastre metrics apply `font-mono`.
   - Skeletons and `<EmptyState>` are provided for zero-data states.

### Step 6: Verify
- Run target unit tests (`npm --prefix frontend test -- <TestName>.test.jsx`).
- Run production build (`npm --prefix frontend run build`).
- Verify responsive layout, keyboard accessibility, and contrast.
- Deliver a concise summary of changes and verification evidence.

---

## 4. Directory Layering Contract

All UI code generated by the agent must conform to this physical directory layout:

```text
frontend/
├── components.json                     # shadcn CLI configuration (baseColor: slate, alias: @/components/ui)
├── src/
│   ├── components/
│   │   ├── ui/                        # ATOMIC PRIMITIVES (Owned source code)
│   │   │   ├── button.jsx             # CVA variants: default (Teal), coral (Coral), outline, destructive
│   │   │   ├── card.jsx               # Composable card surfaces with hairline borders
│   │   │   ├── table.jsx              # High-density semantic tables with hover states
│   │   │   ├── badge.jsx              # Operational status indicator pills
│   │   │   ├── skeleton.jsx           # Layout shift prevention skeletons
│   │   │   ├── dropdown-menu.jsx      # Radix contextual menus
│   │   │   ├── dialog.jsx             # Accessible modal overlays with backdrop blur
│   │   │   └── index.js               # Central barrel export hub
│   │   ├── cards/                     # COMPOSABLE DOMAIN CARDS (e.g. PropertyCard, AgentCard)
│   │   ├── dashboard/                 # PORTAL CHROME & WIDGETS (Sidebar, Header, MetricCard)
│   │   └── modals/                    # TRANSACTIONAL FLOWS (PropertyDetailModal, FilterDrawers)
│   ├── pages/portals/                 # ROLE-BASED APPLICATION PAGES
│   │   ├── broker/                    # Broker executive pages (BrokerDashboard.jsx, etc.)
│   │   ├── agent/                     # Agent workspace pages (AgentDashboard.jsx, etc.)
│   │   └── client/                    # Client investor portal (ClientDashboard.jsx, etc.)
│   ├── utils/
│   │   └── cn.js                      # Canonical class merging helper (clsx + tailwind-merge)
│   └── index.css                      # Tailwind CSS v4 directives & theme tokens
```

---

## 5. Record of Initial Implementation (2026-10-27)

| Artifact / File | Role in Flow | Verified Outcome |
| :--- | :--- | :--- |
| `.agents/skills/shadcn-ui/SKILL.md` | Master Agent Playbook | Standardized full 50+ component recipes and invariants |
| `frontend/src/components/ui/button.jsx` | Atomic Primitive | Teal `#0F766E` and Coral `#FF6B6B` CVA variants active |
| `frontend/src/components/ui/card.jsx` | Atomic Primitive | Surface elevation and hairline border active |
| `frontend/src/components/ui/table.jsx` | Atomic Primitive | High-density tables with `#F8FAFC` hover active |
| `frontend/src/components/ui/badge.jsx` | Atomic Primitive | Semantic status indicator pills active |
| `frontend/src/components/ui/skeleton.jsx` | Atomic Primitive | Pulse animation with geometry preservation active |
| `frontend/src/components/ui/dropdown-menu.jsx` | Atomic Primitive | Radix menu primitives active |
| `frontend/src/components/ui/dialog.jsx` | Atomic Primitive | Accessible modal dialog with Lenis isolation active |
| `frontend/src/components/ui/index.js` | Barrel Export | Cleanly exports primitives alongside legacy components |
| `frontend/src/pages/portals/broker/BrokerDashboard.jsx` | Target Portal Page | Refactored with executive action bar, tables, empty states |
| `test files/frontend/pages/broker/BrokerDashboard.test.jsx` | Automated Verification | 3/3 tests passing |
| `npm run build` | Compiler Check | Production build passed in 5.12s |

---

## 6. Summary for Future Agent Sessions
When working on any future page (Agent Portal, Client Portal, Listings):
1. **Read `design.md` first** to pull exact hex tokens and layout guidelines.
2. **Reference `.agents/skills/shadcn-ui/SKILL.md`** for code blueprints.
3. **Propose changes and await approval** before modifying files.
4. **Reuse primitives in `frontend/src/components/ui/`**, adding new shadcn primitives on demand.
5. **Verify with Vitest and Vite Build** before completion.
