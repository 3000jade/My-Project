# shadcn/ui Technical Specification & Architecture Guide

**System:** Human Shelter Realty  
**Document Type:** Technical Specification  
**Date:** 2026-10-27  
**Status:** Approved  
**Affected Subsystem:** `frontend/src/components/ui/`, `frontend/src/utils/cn.js`, `frontend/components.json`  
**Dependencies:** React 19, Tailwind CSS v4, Radix UI Primitives, `clsx`, `tailwind-merge`, `class-variance-authority`, `@tabler/icons-react` / `lucide-react`

---

## 1. Executive Summary & Philosophy

**shadcn/ui** is not an external component library distributed as a black-box `node_modules` dependency. Instead, it is an **open-source code distribution system** that copies accessible, customizable UI primitives directly into the project's codebase (`frontend/src/components/ui/`).

### Core Architectural Axioms
1. **Source Code Ownership:** All components live directly inside the repository. The engineering team has 100% control over the DOM structure, CSS classes, ARIA attributes, and runtime behavior.
2. **Separation of Concerns:** 
   - **Behavior & Accessibility:** Managed by headless **Radix UI** primitives (keyboard focus trap, screen-reader semantics, outside-click detection, ARIA state tracking).
   - **Visual Styling:** Managed exclusively by **Tailwind CSS v4** and semantic CSS variables.
   - **Variant Orchestration:** Managed declaratively using **Class Variance Authority (`cva`)**.
3. **Zero Lock-In:** Components can be deleted, refactored, extended, or replaced individually without breaking package dependency graphs.

---

## 2. Directory Structure & Layer Blueprint

All shadcn/ui artifacts within Human Shelter Realty follow this layout:

```text
frontend/
├── components.json                  # shadcn CLI master configuration
├── src/
│   ├── components/
│   │   ├── ui/                     # ATOMIC PRIMITIVES (shadcn distribution target)
│   │   │   ├── button.jsx          # CVA button with Teal & Coral brand variants
│   │   │   ├── dialog.jsx          # Radix Dialog primitive with backdrop blur
│   │   │   ├── table.jsx           # High-density data table elements
│   │   │   ├── badge.jsx           # Semantic status pills & indicators
│   │   │   ├── input.jsx           # 40px/48px standard form controls
│   │   │   ├── label.jsx           # Accessible form label bindings
│   │   │   └── dropdown-menu.jsx   # Context & action menus
│   │   ├── cards/                  # COMPOSABLE CARDS (Property Discovery, KPI)
│   │   ├── modals/                 # DOMAIN MODALS (Due Diligence Dossier)
│   │   └── layout/                 # STRUCTURAL CHROME (Header, Sidebar)
│   └── utils/
│       └── cn.js                   # Canonical class merging helper (clsx + tailwind-merge)
```

---

## 3. Configuration Contract (`components.json`)

The `components.json` file dictates how the shadcn CLI behaves when installing, updating, and scaffolding components:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "tabler",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/utils/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### Key Field Specifications:
- **`css`:** Points to `src/index.css` (the Tailwind CSS v4 entry point).
- **`aliases.utils`:** Set strictly to `@/utils/cn` to utilize the existing `frontend/src/utils/cn.js` and eliminate duplicate `lib/utils.js` files.
- **`aliases.ui`:** Directs generated primitives into `@/components/ui`.
- **`iconLibrary`:** Set to `tabler` (leveraging `@tabler/icons-react`) or `lucide` (leveraging `lucide-react`).

---

## 4. Design System Token Alignment (`design.md`)

shadcn uses CSS custom properties defined in HSL format. The semantic tokens must strictly adhere to the Human Shelter Realty Design System:

```css
/* frontend/src/index.css */
:root {
  /* Canvas Ground & Surface Elevation */
  --background: 210 40% 98%;          /* #F8FAFC Canvas */
  --foreground: 222 47% 11%;          /* #1E293B Slate 800 */
  --card: 0 0% 100%;                  /* #FFFFFF Surface */
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* Primary Brand: Teal (#0F766E) */
  --primary: 175 77% 26%;
  --primary-foreground: 0 0% 100%;

  /* Secondary Brand: Cyan Teal (#14B8A6) */
  --secondary: 173 80% 40%;
  --secondary-foreground: 0 0% 100%;

  /* High-Impact Conversion Accent: Coral (#FF6B6B) */
  /* CRITICAL: Paired with dark slate #1E293B for WCAG 2.2 AA (>= 4.5:1) */
  --accent: 0 100% 71%;
  --accent-foreground: 222 47% 11%;

  /* Borders, Inputs, Focus Rings */
  --border: 214 32% 91%;             /* #E2E8F0 Hairline Border */
  --input: 214 32% 91%;
  --ring: 175 77% 26%;               /* #0F766E Focus Ring */

  /* Standard Geometry Radius */
  --radius: 0.5rem;                  /* 8px standard default (rounded-lg) */
}
```

---

## 5. Preset Lifecycle & Management

shadcn supports sharable design presets that bundle base colors, themes, radius scales, and icon packages.

```
┌────────────────────────────────────────────────────────┐
│                   PRESET LIFECYCLE                     │
│                                                        │
│   1. Inspect / Decode:                                 │
│      npx shadcn preset decode <code-or-url>            │
│                            │                           │
│                            ▼                           │
│   2. Fresh Setup:                                      │
│      npx shadcn init --preset <code-or-url> -y         │
│                            │                           │
│                            ▼                           │
│   3. Dynamic Switch on Existing Project:               │
│      npx shadcn apply --preset <code-or-url>           │
│                                                        │
│   4. Partial Update (Theme & Font only):               │
│      npx shadcn apply --preset <code> --only theme,font│
└────────────────────────────────────────────────────────┘
```

---

## 6. Core Technical Patterns

### 6.1 The Polymorphic Slot Pattern (`asChild`)
Radix UI primitives utilize `@radix-ui/react-slot`. Passing `asChild` instructs the component not to render its default HTML element (e.g. `<button>`), but instead forward its styling, ref, and accessibility event handlers onto its direct child:

```jsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Valid accessible <a> element with full button styling
<Button asChild variant="default">
  <Link to="/properties/HS-MK-2024-001">View Details</Link>
</Button>
```

### 6.2 Declarative Variants with Class Variance Authority (`cva`)
Components define their styling contract using `cva`. Additional brand-specific variants are declared in the variants schema:

```javascript
// Example CVA definition in src/components/ui/button.jsx
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0F766E] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0F766E] text-white hover:bg-[#115E59]",
        coral: "bg-[#FF6B6B] text-[#1E293B] hover:brightness-95 font-bold shadow-xs",
        secondary: "bg-[#14B8A6] text-white hover:bg-[#0F766E]",
        outline: "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
        ghost: "hover:bg-slate-100 text-[#1E293B]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 rounded-md",
        lg: "h-12 px-6 rounded-lg text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

## 7. Operational Guidelines & Troubleshooting

| Issue / Failure | Technical Root Cause | Resolution Protocol |
| :--- | :--- | :--- |
| `No components.json found` | `shadcn apply` executed before initialization | Run `npx shadcn@latest init --preset <code-or-url>` to generate the configuration first. |
| React 19 Peer Conflict (`ERESOLVE`) | Radix packages declaring React 18 in `peerDependencies` | Run `npx shadcn@latest add <component> --legacy-peer-deps` or define package overrides in `package.json`. |
| Nested Interactive Control Error | Nesting `<button>` or `<a>` inside `<Button>` | Apply the `asChild` prop on the parent `<Button>` primitive. |
| Fragmented Utility Helpers | Generation of redundant `src/lib/utils.js` | Ensure `components.json` points to `@/utils/cn`. |
| Unintended Cumulative Layout Shift (CLS) | Skeleton loaders mismatching live component geometry | Render 1:1 geometry skeleton wrappers matching live element padding, height, and typography line heights. |

---

## 8. Verification & Compliance Checklist

Before committing any component derived from shadcn/ui:
- [ ] Component source is committed to `src/components/ui/` (never imported from `node_modules`).
- [ ] All interactive elements are fully keyboard navigable (`Tab`, `Enter`, `Space`, `Escape`).
- [ ] Color contrast passes WCAG 2.2 AA ($\ge 4.5:1$ for normal text, dark text on `#FF6B6B`).
- [ ] Standard border radius adheres to 8px (`rounded-lg` / `var(--radius)`).
- [ ] Touch targets on mobile measure at least $44\text{px} \times 44\text{px}$.
- [ ] Existing build, type-check, and Vitest test suites execute successfully without regressions.
