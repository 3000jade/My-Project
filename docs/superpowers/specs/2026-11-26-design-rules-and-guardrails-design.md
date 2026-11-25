# Design Rules, Common Labels, High-UX Motion & Lint Guardrails

**Date:** 2026-11-26
**Status:** Draft for Review
**Scope:** Frontend Design System (`DESIGN.md`, `AGENTS.md`, `frontend/`)

---

## 1. Purpose & Goals

Establish a unified, beginner-friendly, and enforceable set of design rules for Human Shelter Realty so every screen across Public, Client, Agent, Broker, and Admin portals:
1. Uses **common, plain-English labels** and shows only **necessary context** for what the user is doing right now.
2. Delivers **high UX and smooth, accessible animations** with complete coverage of Loading, Empty, Error, and Success states.
3. Follows a **strict 8-point spacing grid and responsive breakpoints** across mobile, tablet, and desktop.
4. Protects UI consistency with **automated ESLint guardrails** (non-blocking warnings during `npm run lint`) and ready-made building blocks.

---

## 2. Architecture Overview

The system has four coordinated parts:

| Part | Location | Responsibility |
| :--- | :--- | :--- |
| **Rulebook** | `DESIGN.md`, `AGENTS.md` | Single source of truth for visual tokens, labels, UX states, motion, spacing, breakpoints, and guardrails |
| **Common Label Dictionary** | `frontend/src/constants/uiLabels.js` | Shared everyday action labels, status labels, and context-aware label helpers |
| **Motion & Layout Helpers** | `frontend/src/lib/motion.js`, `frontend/src/components/ui/layout/LayoutPrimitives.jsx` | Ready-made `framer-motion` presets (with reduced-motion safety) and responsive 8-pt spacing/breakpoint wrappers |
| **Lint Guardrails** | `frontend/eslint-rules/design-guardrails.js`, `frontend/eslint.config.js` | Custom ESLint plugin running as `warn` across `frontend/src/` to catch off-grid spacing, unapproved colors, slash labels, raw HTML controls, missing focus rings, and unsafe motion |

---

## 3. Component Designs

### 3.1 Rulebook Updates (`DESIGN.md` & `AGENTS.md`)

- **Common Labels & Necessary Context Section (`DESIGN.md`):**
  - **One Common Label per Field:** Ban slash-separated labels (`Price / Rent`, `City / Municipality`, `Approve / Reject`). Use one plain-English label driven by context.
  - **Plain-English Dictionary Reference:** Point developers to `frontend/src/constants/uiLabels.js` for standard actions (`Save Changes`, `Cancel`, `Delete`, `Search`, `Retry`) and statuses (`Available`, `Pending Review`, `Reserved`, `Sold`, `Rented`, `Draft`, `Archived`).
  - **Necessary Context Only:** Hide irrelevant inputs/actions based on user selection (e.g., hide room counts for `Vacant Lot`; hide `Monthly Rent` when `For Sale` is selected) and tuck optional settings inside progressive disclosure panels.
- **High-UX & Animation Standards (`DESIGN.md`):**
  - Require all four screen states: **Loading** (shimmer `Skeleton` cards), **Empty** (`EmptyState` with next action), **Error** (`<Alert variant="destructive">` + `Retry`), and **Success** (toast/inline confirmation + disabled submit with spinner).
  - Document standard `framer-motion` timing presets (`150ms` tap/hover, `220ms` reveal, `260ms` spring step/tab switch), GPU-only properties (`opacity`, `transform`), and `<MotionConfig reducedMotion="user">`.
- **Spacing, Breakpoints & Guardrails (`DESIGN.md` & `AGENTS.md`):**
  - Reinforce the 8-pt grid (`4px` half-step only for inline icon+text pairs), `min-h-11 min-w-11` (`44px`) touch targets, and the three breakpoints (`< 768px` mobile 4-col / `16px`, `768px–1023px` tablet 8-col / `24px`, `>= 1024px` desktop 12-col / `24px` gutter / `32px` margin).
  - Add a short Guardrails checklist to `AGENTS.md` referencing `uiLabels.js`, `motion.js`, `LayoutPrimitives.jsx`, and `npm run lint`.

### 3.2 Shared Common Label Dictionary (`frontend/src/constants/uiLabels.js`)

Exports plain-English constants and small pure helpers:
- `ACTION_LABELS`: `{ save: 'Save Changes', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', search: 'Search', filter: 'Filter', clearFilters: 'Clear Filters', retry: 'Retry', back: 'Back', next: 'Next', publish: 'Publish', signIn: 'Sign In' }`
- `STATUS_LABELS`: `{ available: 'Available', pendingReview: 'Pending Review', reserved: 'Reserved', sold: 'Sold', rented: 'Rented', draft: 'Draft', archived: 'Archived' }`
- `getPriceLabel(transactionType)`: Returns `'Monthly Rent'` for `'rent'` / `'For Rent'`, `'Foreclosure Price'` for `'foreclosure'`, and `'Selling Price'` as the default.
- `getListingContextFlags(propertyType)`: Returns `{ showRooms: boolean, showFloorArea: boolean }` so forms/cards cleanly hide indoor room fields for `'Vacant Lot'` / `'Lot'`.

### 3.3 High-UX Animation Presets (`frontend/src/lib/motion.js`)

Exports reusable `framer-motion` configurations aligned with `DESIGN.md`:
- `MOTION_DURATIONS`: `{ fast: 0.15, normal: 0.22, spring: 0.26 }`
- `fadeSlideReveal`: `{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }`
- `tapFeedback`: `{ whileTap: { scale: 0.98 }, transition: { duration: 0.15 } }`
- `stepSpring`: `{ type: 'spring', stiffness: 380, damping: 32 }`
- `REDUCED_MOTION_TRANSITION`: `{ duration: 0 }`
- `AppMotionProvider`: Thin wrapper around `<MotionConfig reducedMotion="user">` for root/app-level usage.

### 3.4 Responsive Spacing & Breakpoint Wrappers (`frontend/src/components/ui/layout/LayoutPrimitives.jsx`)

Exports lightweight, `min-w-0`-safe layout wrappers built strictly with `DESIGN.md` tokens:
- `PageContainer`: Supports `variant="public"` (`max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8`) and `variant="portal"` (`w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8`).
- `SectionStack`: Vertical stack with `flex flex-col gap-6 min-w-0` (or `gap-4` / `gap-8` via validated `gap` prop).
- `BentoGrid`: `grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0`, paired with `BentoMain` (`lg:col-span-8 min-w-0`) and `BentoRail` (`lg:col-span-4 min-w-0 flex flex-col gap-6`).

### 3.5 Automated ESLint Guardrails (`frontend/eslint-rules/design-guardrails.js`)

A local ESLint plugin wired into `frontend/eslint.config.js` as **`warn`** across `frontend/src/**/*.{js,jsx}` (with `src/components/ui/**` exempted from the `no-raw-html-controls` rule since `components/ui/` wraps raw HTML elements):

1. **`no-arbitrary-tailwind-values`**: Flags arbitrary pixel/rem brackets in `className` strings such as `p-[13px]`, `gap-[19px]`, `text-[15px]`, `rounded-[7px]` (allows documented exceptions like `max-w-[1440px]` and `min-h-[44px]`).
2. **`no-unapproved-hex-colors`**: Flags raw hex color literals (`#...`) in JSX `className` or inline `style` props that are not in the approved `DESIGN.md` palette.
3. **`no-slash-labels`**: Flags JSX text or `label` / `placeholder` / `title` string props containing `/` between words (e.g., `"Price / Rent"`, `"City / Municipality"`), excluding URLs and numeric ratios like `N / 5`.
4. **`no-raw-html-controls`**: Flags raw `<button>`, `<input>`, or `<select>` elements outside `src/components/ui/` and suggests using `Button`, `Input`, or `Select` from `@/components/ui/*`.
5. **`no-unpaired-outline-none`**: Flags `outline-none` or `focus:outline-none` in `className` unless paired with `focus-visible:ring-`.
6. **`require-reduced-motion-safe`**: Flags `animate-` utility classes (outside `motion-safe:` / `motion-reduce:`) or `motion.` components lacking `<MotionConfig` / `useReducedMotion` awareness in the file.

---

## 4. Testing & Verification

- **Unit Tests (Vitest):**
  - `frontend/src/constants/uiLabels.test.js`: Verify `ACTION_LABELS`, `STATUS_LABELS`, `getPriceLabel()`, and `getListingContextFlags()`.
  - `frontend/eslint-rules/design-guardrails.test.js`: Use ESLint's `RuleTester` with Vitest to test valid and invalid code snippets for all 6 guardrail rules.
- **Verification Commands:**
  - `npm test` in `frontend/` — all unit tests pass.
  - `npm run lint` in `frontend/` — exits `0` (warnings only, no errors).
