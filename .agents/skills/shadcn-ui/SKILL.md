---
name: shadcn-ui
description: Comprehensive architecture, CLI recipes, CVA variant bindings, and composition standards for all 50+ shadcn/ui components in Human Shelter Realty, strictly adhering to design.md tokens and React 19.
---

# shadcn/ui Architecture & Implementation Guide

## 1. Executive Summary & Axioms
**shadcn/ui** is not an external component package; it is an open code-distribution system. Accessible, unstyled Radix UI primitives and Tailwind CSS utility classes live directly in `frontend/src/components/ui/`, giving 100% repository ownership, zero external bundle lock-in, and full control over markup, ARIA semantics, and styling.

### Core Architectural Invariants:
1. **Owned Primitives:** All base primitives live strictly in `frontend/src/components/ui/` (e.g., `button.jsx`, `table.jsx`, `card.jsx`, `badge.jsx`, `dialog.jsx`, `skeleton.jsx`).
2. **Domain Separation:** 
   - Atomic primitives: `frontend/src/components/ui/`
   - Composable Domain Cards: `frontend/src/components/ui/cards/`
   - Transactional Modals & Drawers: `frontend/src/components/ui/modals/` or `frontend/src/components/dashboard/`
3. **Canonical Class Helper:** Always merge classes via `@/utils/cn` (`clsx` + `tailwind-merge`). Never duplicate utility wrappers.
4. **Configuration Authority:** `frontend/components.json` sets alias and base styling defaults.

---

## 2. Authoritative Design Tokens (`design.md`)
All shadcn/ui components must strictly implement the authoritative tokens from `design.md` (Section 3.1):

```yaml
colors:
  primary: '#0F766E'                  # Primary Teal
  primary-hover: '#115E59'            # Primary Teal Hover
  secondary: '#14B8A6'                # Secondary Teal
  accent: '#FF6B6B'                   # High-Impact Coral Accent
  on-accent: '#1E293B'                # Slate 800 Text & Icons on Coral (5.27:1 contrast)
  background: '#F8FAFC'               # App & Page Background (Canvas Ground)
  surface: '#FFFFFF'                  # Card, Modal & Table Surface
  text-primary: '#1E293B'             # Slate 800 Primary Text
  text-secondary: '#64748B'           # Slate 500 Secondary / Muted Text
  border: '#E2E8F0'                   # Slate 200 Hairline Border
  semantic:
    success: '#10B981'                # Emerald
    warning: '#F59E0B'                # Amber
    error: '#DC2626'                  # Red 600 Destructive
```

### Geometry, Radii & Spacing:
- **Border Radius:** Standard `8px` (`rounded-lg`). Small: `4px` (`rounded-md`), Large: `12px` (`rounded-xl`), Full: `9999px` (`rounded-full`).
- **Spacing Rhythm:** Strict 8px grid (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Control Heights:** Standard `h-[40px]`, Prominent `h-[48px]`, Search Console `h-[54px]`.
- **Typography:** `Inter` for interfaces; `JetBrains Mono` (`font-mono`) for cadastre, currency (`₱`), valuation figures, and timestamps.

---

## 3. Master Component Catalog (50+ Components)
Components are added on demand using `npx shadcn@latest add <component> --legacy-peer-deps`.

| Category | Components | Platform Usage |
| :--- | :--- | :--- |
| **Actions** | `button`, `toggle`, `toggle-group` | Primary Teal actions, Coral conversion buttons, filter toggles |
| **Data Display** | `table`, `card`, `badge`, `avatar`, `skeleton`, `progress`, `aspect-ratio` | Listing grids, agent caseloads, conveyancing records, photo frames |
| **Navigation** | `tabs`, `breadcrumb`, `pagination`, `navigation-menu`, `menubar` | Role portal tabs, directory paging, cadastral maps |
| **Form Inputs** | `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `label`, `form`, `input-otp` | Create Listing console, valuation calculators, inquiry triage |
| **Overlays** | `dialog`, `sheet`, `alert-dialog`, `popover`, `tooltip`, `dropdown-menu`, `context-menu`, `hover-card` | Property Quick Edit drawers, Due Diligence dossiers, row menus |
| **Layout** | `accordion`, `collapsible`, `separator`, `scroll-area`, `resizable` | Building specifications, cadastral notes, filter panels |
| **Feedback** | `alert`, `sonner` / `toast` | Verification alert banners, transactional success toasts |
| **Date & Search** | `calendar`, `command` | Viewing schedules, global omnibox listing search |

---

## 4. Standard Implementation Recipes

### 1. Button Primitive with Approved Coral & Teal Variants (`cva`)
```jsx
// frontend/src/components/ui/button.jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs active:bg-[#134E4A]",
        coral: "bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] shadow-xs font-bold active:bg-[#E54848]",
        secondary: "bg-[#14B8A6] text-white hover:bg-[#0F766E] shadow-xs",
        outline: "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC] hover:border-slate-300 shadow-2xs",
        ghost: "text-[#1E293B] hover:bg-slate-100",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs",
      },
      size: {
        default: "h-[40px] px-4 py-2",
        sm: "h-[34px] rounded-md px-3 text-[11px]",
        lg: "h-[48px] rounded-lg px-6 text-sm",
        icon: "h-[40px] w-[40px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
```

### 2. High-Density Semantic Table Primitive
```jsx
// frontend/src/components/ui/table.jsx
import * as React from "react";
import { cn } from "@/utils/cn";

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto custom-scrollbar">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b border-[#E2E8F0] bg-[#F8FAFC]", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 divide-y divide-[#E2E8F0]", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-[#E2E8F0] transition-colors hover:bg-[#F8FAFC]/80 data-[state=selected]:bg-slate-100", className)} {...props} />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-11 px-3.5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-[#64748B]", className)} {...props} />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-3.5 align-middle text-[#1E293B]", className)} {...props} />
));
TableCell.displayName = "TableCell";
```

### 3. Composable Card Primitive
```jsx
// frontend/src/components/ui/card.jsx
import * as React from "react";
import { cn } from "@/utils/cn";

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] shadow-xs transition-all", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-bold tracking-tight text-[#1E293B]", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-[#64748B]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
```

---

## 5. Critical Guidelines & Anti-Patterns
1. **Never Render Nested Buttons:** When navigating via React Router, always use `<Button asChild><Link to="...">Label</Link></Button>`.
2. **Lenis Scroll Prevention:** Any modal or drawer containing scrollable content must include `data-lenis-prevent="true"` to isolate the internal scroll container from the window Lenis smooth-scroller.
3. **Preserve Business Logic:** Do not rewrite hooks, API services, or state machines when upgrading components. Swap UI presentation layers cleanly.
4. **Verification Gate:** Run `npm test` and build check after modifying UI primitives.
