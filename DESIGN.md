# DESIGN.md — Human Shelter Realty Design System

> **Stack:** React 19 · Tailwind CSS v4 (`@tailwindcss/vite`) · shadcn/ui · Mantine v9  
> **Source of Truth:** [`frontend/src/index.css`](./frontend/src/index.css)

---

## 1. Core Philosophy & Visual Identity

- **Archetype:** Soft Minimalist SaaS & Architectural Real Estate Ledger — minimalist, ergonomic, function-first.
- **Clarity Over Decoration:** Visual hierarchy is built through generous whitespace, crisp `1px` hairline borders (`#E2E8F0`), and typographic contrast rather than heavy gradients, drop shadows, or ornamental chrome.
- **Ergonomic Scannability:** High-contrast primary ink (`#1E293B`) on a cool alabaster ground (`#F8FAFC`) reduces eye strain across dense broker/agent property ledgers, cadastral map studios, and public discovery views.
- **Restrained Brand Signal:** Primary Teal (`#0F766E`) anchors active navigation, primary actions, and focus states. High-impact Coral (`#FF6B6B`) is reserved strictly for high-priority conversion callouts (always paired with `#1E293B` text for WCAG AA compliance).

---

## 2. Color Palette & Semantic Tokens

All tokens map directly to `@theme` variables in [`frontend/src/index.css`](./frontend/src/index.css) and standard Tailwind CSS v4 utilities.

### 2.1 Surface, Text & Brand Tokens

| Semantic Role | CSS Custom Property | Light Mode (Default) | Dark Mode (`.dark`) | Tailwind Utility Class | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **App Canvas** | `--color-background` | `#F8FAFC` | `#0F172A` | `bg-background` / `bg-slate-50` | Root page & portal viewport ground |
| **Primary Surface** | `--color-surface` | `#FFFFFF` | `#1E293B` | `bg-surface` / `bg-white` | Cards, tables, modals, inputs, sidebars |
| **Muted Surface** | `--color-surface-variant` | `#F1F5F9` | `#334155` | `bg-surface-variant` / `bg-slate-100` | Secondary containers, table headers, filter bars |
| **Hairline Border** | `--color-outline` | `#E2E8F0` | `#334155` | `border-outline` / `border-slate-200` | Standard `1px` card, input, and divider borders |
| **Strong Border** | `--color-outline-variant` | `#CBD5E1` | `#475569` | `border-outline-variant` / `border-slate-300` | Hovered inputs, active dividers |
| **Primary Text** | `--color-on-surface` | `#1E293B` | `#F8FAFC` | `text-on-surface` / `text-slate-800` | Headings, body copy, table values (>13:1 AAA) |
| **Secondary Text** | `--color-on-surface-variant` | `#64748B` | `#94A3B8` | `text-on-surface-variant` / `text-slate-500` | Field labels, helper text, breadcrumbs (>4.5:1 AA) |
| **Primary Brand** | `--color-primary` | `#0F766E` | `#14B8A6` | `bg-primary` / `text-primary` / `bg-teal-700` | Primary CTAs, active nav indicators, focus rings |
| **Primary Hover** | `--color-primary-hover` | `#115E59` | `#0D9488` | `hover:bg-primary-hover` / `hover:bg-teal-800` | Hover state for primary buttons & links |
| **Primary Tint** | `--color-tertiary-container` | `#CCFBF1` | `#134E4A` | `bg-tertiary-container` / `bg-teal-100` | Selected sidebar rows, active filter chips |
| **Conversion Accent** | `--color-accent` | `#FF6B6B` | `#FF6B6B` | `bg-accent` / `text-accent` | High-priority conversion badges & callouts |
| **Accent Hover** | `--color-accent-hover` | `#EE5A5A` | `#F87171` | `hover:bg-accent-hover` | Hover state for conversion accents |
| **On-Accent Text** | `--color-on-accent` | `#1E293B` | `#0F172A` | `text-on-accent` / `text-slate-800` | Mandatory dark text over `#FF6B6B` coral fills |

### 2.2 Semantic Status Tokens

| Status State | Light Mode (Fill / Text / Border) | Dark Mode (Fill / Text / Border) | Tailwind Utility Classes | Domain Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Available** | Bg `#ECFDF5` · Text `#15803D` · Dot `#10B981` | Bg `#064E3B` · Text `#6EE7B7` · Dot `#34D399` | `bg-emerald-50 text-emerald-700 border-emerald-200` | Active listing, verified agent, confirmed booking |
| **Warning / Pending** | Bg `#FFFBEB` · Text `#B45309` · Dot `#F59E0B` | Bg `#78350F` · Text `#FCD34D` · Dot `#FBBF24` | `bg-amber-50 text-amber-700 border-amber-200` | Pending approval, reserved lot, expiring session |
| **Danger / Error** | Bg `#FEF2F2` · Text `#DC2626` · Dot `#EF4444` | Bg `#7F1D1D` · Text `#FCA5A5` · Dot `#F87171` | `bg-red-50 text-red-600 border-red-200` | Validation error, rejected credential, destructive CTA |
| **Info / Scheduled** | Bg `#EFF6FF` · Text `#1D4ED8` · Dot `#3B82F6` | Bg `#1E3A8A` · Text `#93C5FD` · Dot `#60A5FA` | `bg-blue-50 text-blue-700 border-blue-200` | Scheduled tour, in-review inquiry |
| **Neutral / Archived** | Bg `#F1F5F9` · Text `#475569` · Dot `#64748B` | Bg `#1E293B` · Text `#CBD5E1` · Dot `#94A3B8` | `bg-slate-100 text-slate-600 border-slate-200` | Draft listing, sold property, historical log |

---

## 3. Typography System

### 3.1 Font Stack

| Token | Font Family | Tailwind Utility | Application |
| :--- | :--- | :--- | :--- |
| `--font-sans` | `'Figtree Variable'`, `'Inter'`, `-apple-system`, `sans-serif` | `font-sans` | Default UI, body copy, inputs, prices, cards, tables, buttons |
| `--font-display` | `'Figtree Variable'`, `'Inter'`, `-apple-system`, `sans-serif` | `font-display` | Page titles, hero headings, metric counters |
| `--font-mono` | `'Figtree Variable'`, `'Inter'`, `-apple-system`, `sans-serif` | `tabular-nums` | Deprecated alias mapped to `Figtree Variable`; use `tabular-nums` only for numeric data table cells |

### 3.2 Responsive Type Scale (1.250 Major Third)

| Role | Size (`rem` / `px`) | Line Height | Weight | Tracking | Tailwind Classes | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `2.25rem` (`36px`) | `2.75rem` (`44px`) | `700` (Bold) | `-0.025em` | `text-3xl sm:text-4xl font-bold tracking-tight` | Public hero declarations, primary page headers |
| **Heading H1** | `1.75rem` (`28px`) | `2.25rem` (`36px`) | `700` (Bold) | `-0.02em` | `text-2xl sm:text-[28px] font-bold tracking-tight` | Portal workspace titles, major section headers |
| **Heading H2** | `1.25rem` (`20px`) | `1.75rem` (`28px`) | `600` (SemiBold) | `-0.015em` | `text-xl font-semibold tracking-tight` | Card headers, modal titles, wizard step titles |
| **Subhead H3** | `1.0rem` (`16px`) | `1.5rem` (`24px`) | `600` (SemiBold) | `-0.01em` | `text-base font-semibold` | Form section titles, group headers |
| **Body Default** | `0.875rem` (`14px`) | `1.25rem` (`20px`) | `400` / `500` | `0em` | `text-sm font-normal` | Primary interface copy, table cells, form inputs |
| **Caption / Label** | `0.75rem` (`12px`) | `1.0rem` (`16px`) | `500` / `600` | `+0.05em` | `text-xs font-medium uppercase tracking-wider` | Table column headers, status badges, eyebrow kickers |
| **Data Table Numbers** | `0.875rem` (`14px`) / `0.75rem` (`12px`) | `1.25rem` (`20px`) / `1.0rem` (`16px`) | `500` (Medium) | `0em` | `font-sans tabular-nums` | Numeric columns in data tables only (table prices, lot/floor areas, counts) |

---

## 4. Spatial System & Layout

### 4.1 Strict 8-Point Spacing Grid

All padding, margins, and layout gaps use multiples of `8px` (with `4px` half-step allowed only for tight inline icon-to-text pairs and compact badge interiors).

| Step | Pixels | REM | Tailwind Utility (`p-*`, `m-*`, `gap-*`) | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **0.5x** | `4px` | `0.25rem` | `1` (`gap-1`, `p-1`) | Inline icon-to-label spacing, segmented tab container padding |
| **1x** | `8px` | `0.5rem` | `2` (`gap-2`, `p-2`) | Related form controls, button group gaps, compact cell padding |
| **2x** | `16px` | `1.0rem` | `4` (`gap-4`, `p-4`) | Mobile outer margin, compact card padding, form field vertical stack |
| **3x** | `24px` | `1.5rem` | `6` (`gap-6`, `p-6`) | Standard card padding, desktop grid gutter, tablet outer margin |
| **4x** | `32px` | `2.0rem` | `8` (`gap-8`, `p-8`) | Desktop outer container padding, major section separation |
| **5x** | `40px` | `2.5rem` | `10` (`py-10`, `gap-10`) | Portal sub-module vertical rhythm |
| **6x** | `48px` | `3.0rem` | `12` (`py-12`, `gap-12`) | Public page section spacing |

- **Compact Card & KPI Spacing:** Compact KPI/summary cards use `gap-1` (`4px`) between header and value, `px-4 pt-2 pb-0` header, `px-4 pb-2 pt-0` body, `px-4 py-2` footer, `size-8` (`32px`) icon box, and `gap-4` (`16px`) grid gutters—never off-grid values (`gap-0.5`, `gap-3`, `pt-2.5`, `py-1.5`).

### 4.2 Standard Container Widths & Shell Geometry

| Surface / Container | Width / Height | Tailwind Classes |
| :--- | :--- | :--- |
| **Public Marketing Container** | Max `1440px` | `max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8` |
| **Portal Workspace Container** | Full width (`w-full min-w-0`) | `w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8` |
| **Portal Left Sidebar** | `256px` (`16rem`) expanded | `w-64 shrink-0 border-r border-outline bg-surface` |
| **Portal Top Header** | `64px` (`4rem`) height | `h-16 sticky top-0 z-30 bg-surface border-b border-outline` |

### 4.3 Responsive Breakpoints

| Breakpoint | Viewport Range | Grid Columns | Gutter | Outer Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`default`)** | `< 768px` | 4 columns (`grid-cols-1` to `grid-cols-4`) | `16px` (`gap-4`) | `16px` (`px-4`) |
| **Tablet (`md:`)** | `768px – 1023px` | 8 columns (`md:grid-cols-8`) | `24px` (`md:gap-6`) | `24px` (`md:px-6`) |
| **Desktop (`lg:` / `xl:`)** | `>= 1024px` | 12 columns (`lg:grid-cols-12`) | `24px` (`lg:gap-6`) | `32px` (`lg:px-8`) |

---

## 5. Component Specifications

### 5.1 Border Radii

| Token | Value | Tailwind Utility | Target Components |
| :--- | :--- | :--- | :--- |
| `--radius-sm` | `4px` (`0.25rem`) | `rounded-sm` | Compact status tags, tooltips, checkboxes |
| `--radius-md` (Default) | `8px` (`0.5rem`) | `rounded-lg` | Buttons, inputs, selects, standard cards, data tables |
| `--radius-lg` | `12px` (`0.75rem`) | `rounded-xl` | Modals, drawers, map HUD overlays, feature panels |
| `--radius-full` | `9999px` | `rounded-full` | Avatars, filter chips, map price pins, status dots |

### 5.2 Shadow Elevation Levels (0–3)

Elevation relies on a `1px` `#E2E8F0` border first, augmented by four restrained shadow tiers:

| Level | Name | CSS Box Shadow | Tailwind Utility | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | Flat / Hairline | `none` (uses `1px solid #E2E8F0`) | `shadow-none border border-outline` | Inputs, table wrappers, nested panels, sidebars |
| **Level 1** | Resting Card | `0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)` | `shadow-xs border border-outline` | KPI cards, property cards at rest, filter bars |
| **Level 2** | Interactive / Hover | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)` | `shadow-md` | Hovered property cards, dropdown menus, popovers, map pins |
| **Level 3** | Modal / Dialog | `0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)` | `shadow-xl` | Dialogs, sheets, drawers, command palettes |

### 5.3 Ergonomic Control Heights & Touch Targets

- **Minimum Touch Target:** Every interactive control (buttons, icon buttons, pagination links, drawer toggles, map controls) must provide a minimum hit area of **`44px × 44px`** (`min-h-11 min-w-11` on coarse/mobile viewports, or `h-10` with padded hit area on desktop).
- **Standard Input & Button Height:** `40px` (`h-10 px-4 py-2 text-sm`).
- **Prominent / Primary CTA & Hero Input Height:** `48px` (`h-12 px-6 text-base`).
- **Unified Search Bar Plinth:** `56px` (`h-14`).

### 5.4 Input Focus Rings & States

- **Default Input:** `bg-surface border border-outline text-on-surface placeholder:text-on-surface-variant rounded-lg`
- **Focus State (Keyboard & Pointer):** `focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`
- **Error State:** `border-red-600 focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/20`
- **Disabled State:** `disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-variant`

### 5.5 Map & Z-Index Stacking Isolation

All map canvases (Google Maps, Leaflet, subdivision vector editors) must remain isolated in `z-index: 0` (`isolation: isolate; z-index: 0`) so map panes never overlap sticky headers (`z-30`), drawers (`z-40`), or modals (`z-50`).

---

## 6. Strict Negative Constraints

1. **No Arbitrary Pixel Values:** Never write arbitrary spacing, font sizes, or radii such as `p-[13px]`, `gap-[19px]`, `text-[15px]`, or `rounded-[7px]`. Use the 8-point spacing scale and defined typography/radius tokens.
2. **No Off-Token Colors:** Never introduce raw hex values outside Section 2 (e.g., no generic `#0000FF`, `#333333`, or unapproved Tailwind purples/indigos). Always use semantic tokens (`bg-primary`, `text-on-surface`, `border-outline`) or their mapped Slate/Teal/Emerald/Amber/Red equivalents.
3. **No White Text on Coral Fills:** Never pair `#FFFFFF` text with `#FF6B6B` backgrounds (fails WCAG AA contrast). Coral backgrounds must use `#1E293B` (`text-on-accent`) text.
4. **No Outline Removal Without Replacement:** Never apply `outline-none` or `focus:outline-none` without immediately pairing `focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary`.
5. **Mandatory Reduced-Motion Fallbacks:** Every continuous or layout animation (GSAP, Framer Motion, CSS keyframes, smooth scroll) must respect `prefers-reduced-motion: reduce` (using `motion-safe:` / `motion-reduce:transition-none` or checking `window.matchMedia('(prefers-reduced-motion: reduce)')`).
6. **No Competing Primary CTAs:** Each view or modal footer may display at most **one** solid Primary (`bg-primary`) action button; secondary actions must use outline/ghost variants (`border-outline bg-surface text-on-surface hover:bg-surface-variant`).
7. **No Unisolated Map Containers:** Never mount a Leaflet or Google Maps canvas without container stacking isolation (`isolation: isolate; z-index: 0`).

---

## 7. Portal Bento Layout (Broker, Agent & Admin) & `shadcn/ui` Standard

Every **Broker, Agent, and Admin** portal dashboard page (`frontend/src/pages/portals/broker/*.jsx`, `frontend/src/pages/portals/agent/*.jsx`, `frontend/src/pages/portals/admin/*.jsx`) follows a **Bento Grid** layout built exclusively with `shadcn/ui` primitives (`Card`, `Tabs`, `Table`, `Badge`, `Button`, `Alert`, `Separator`, `Skeleton`) and `lucide-react` icons:

### 7.1 Bento Grid Anatomy & Space Utilization
- **Full-Width Root Stack:** `flex flex-col gap-6 font-sans w-full min-w-0 max-w-full` (never `space-y-*` and no fixed `max-w-*` caps on portal pages, so content expands into all available space when the desktop sidebar in `DashboardSidebar` is collapsed).
- **Top Metric Strip (Optional per page):** `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4` — equal-height summary `Card` tiles (`flex flex-col justify-between`) with `CardHeader`, `CardContent`, and `CardFooter`.
- **Asymmetric Main Bento Grid:** `grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`:
  - **Primary Tile (`lg:col-span-8 min-w-0`):** Main workspace table, tabbed ledger (`Tabs`), or interactive form/editor inside a `Card` (`min-w-0` prevents wide tables from overflowing the grid).
  - **Secondary Rail (`lg:col-span-4 min-w-0`):** `flex flex-col gap-6` containing stacked summary, quick-action, status, or activity `Card`s.
- **Full-Width Map / Studio Exception:** Map studios (`BrokerFullViewMap`, `SubdivisionMapEditor`, `BrokerMultiPropertyMapStudio`) use a split Bento (`lg:col-span-8` isolated map tile + `lg:col-span-4` side ledger/inspector `Card`) so the map stays `isolation: isolate; z-index: 0`.

### 7.2 `shadcn/ui` Composition Rules for Bento Tiles
- **Canvas & Surfaces:** Always place dashboards, forms, and Bento grids on a **soft neutral `#F8FAFC` page canvas** with **crisp white (`#FFFFFF`) elevated cards** (`bg-white border border-[#E2E8F0] rounded-xl shadow-xs`).
- **Cards:** Use full `CardHeader` (`CardTitle`, `CardDescription`), `CardContent`, and `CardFooter` rather than raw `div` boxes.
- **Spacing & Sizing:** Use `gap-4` / `gap-6` for grid and stack spacing; use `size-*` (e.g., `size-9`, `size-4`) instead of matching `w-* h-*`.
- **Icons:** Use `lucide-react` icons consistently across all Broker, Agent, and Admin Bento tiles.
- **Callouts & Empty States:** Use `<Alert>` (`@/components/ui/alert`) for banners/warnings and `EmptyState` inside `CardContent` when lists are empty.

### 7.3 KPI Card Standard (`KpiCard` — No-Pill & Status-Colored Icon Design)
All portal KPI strips use [`KpiCard`](frontend/src/components/ui/cards/KpiCard.jsx) following these rules:
- **No Pill Badges on KPI Cards:** Replace bubbly rounded `Badge` pills with **Status Dot + Plain Text** (`size-2 rounded-full` + colored label, e.g. `● 26 Pending Review`) and **Trend Arrow + Colored Text** (`TrendingUp` / `TrendingDown` + `tabular-nums` text, e.g. `↗ +12.4%`).
- **Status-Colored Icon Box (`statusVariant`):** Tint the `size-8 rounded-lg` icon container to reflect the metric's status:
  - `primary` / `default` (`bg-teal-50 text-[#0F766E]`): Headline / neutral metric
  - `success` (`bg-emerald-50 text-emerald-700`): Healthy / target met
  - `warning` (`bg-amber-50 text-amber-700`): Pending review / verification
  - `coral` (`bg-[#FF6B6B]/15 text-[#DC2626]`) / `destructive` (`bg-red-50 text-red-600`): Urgent or new inbound items needing attention
- **Compact Spacing & Teal Progress:** Use compact card padding (`px-4 pt-4` header, `px-4 pb-4` content, `px-4 py-2` footer) and `shadcn/ui` `Progress` bars (`h-2` track, `bg-[#0F766E]` fill). For responsive strips, `size="md"` renders with equal inner padding (`px-4 py-3`) and morphs cleanly on mobile (`< 640px`).

---

## 8. High-UX Standards for All Components & Pages

Every component and page across Public, Client, Agent, Broker, and Admin views must deliver high usability and polish:
1. **Clear Visual Hierarchy:** Every page starts with one clear `36px` title (`PageHeader` or matching heading), a short plain-English subtitle, and one primary action button (`#0F766E` or `#FF6B6B` coral) so the next step is obvious at a glance.
2. **Complete State Coverage (No Dead Ends) & Shimmer Skeleton Cards:** Always design and render all four UI states — **Loading** (**Shimmer Skeleton Cards**: crisp white `#FFFFFF` `Card` containers with animated left-to-right shimmer `Skeleton` bars mirroring the exact final layout, respecting `prefers-reduced-motion`), **Empty** (`EmptyState` with a helpful next action), **Error** (`<Alert variant="destructive">` with a `Retry` button), and **Success** (toast or inline confirmation).
3. **Zero Layout Shift & Responsive Safety:** Use fixed-height skeletons, `min-w-0` on flex/grid containers, and `overflow-x-auto` inside table wrappers so content never jumps or overflows horizontally on mobile (`375px`) or desktop (`1440px+`).
4. **Effortless Interaction & Framer Motion Feedback:** All interactive controls meet the `44px` (`h-11` / `min-h-[44px]`) touch target, show clear hover/focus-visible rings (`#0F766E`), disable with a spinner during async submissions to prevent double clicks, preserve user input on validation errors, and use smooth `framer-motion` spring transitions (`AnimatePresence`, `layoutId`, `layout`, wrapped in `<MotionConfig reducedMotion="user">`) for step changes, accordions, and active pills.
5. **Plain-English Microcopy:** Use clear, human-readable labels, helpful placeholders, and specific error messages that tell the user how to fix the problem.
6. **Accessible by Default:** Use semantic HTML, paired `<Label>` elements, `aria-label` on icon-only buttons, keyboard navigation for dialogs/tabs/menus, and WCAG AA contrast (`≥ 4.5:1`).
7. **Engineered to Eliminate Cognitive Overload:**
   - **Progressive Disclosure:** Show essential fields first and tuck optional/advanced settings (e.g., detailed financing breakdowns) behind clean expandable panels so screens stay calm and scannable.
   - **Chunking & Clean Breathing Room:** Group related inputs into focused cards (around 3–6 items per group) separated by `gap-6` spacing instead of long walls of inputs.
   - **One Single Common Label per Field:** Never use confusing slash-separated labels (`Price / Rent`); always show one clear, everyday label driven by context.
   - **Smart Defaults & Context Filtering:** Hide irrelevant fields automatically (e.g., hide Bedroom/Kitchen fields for a Vacant Lot), pre-fill repeating broker/agent credentials, and auto-calculate derived numbers (such as Price per sqm) to cut manual thinking and typing.

### 8.1 Section-by-Section High-UX Micro-Interactions (`shadcn/ui` + Framer Motion)
- **Dropdowns (`Select` / `FormSelect`):** Every dropdown uses `shadcn/ui` `Select` (`SelectGroup` + `SelectItem`) with `h-11` (`44px`) trigger height, leading `lucide-react` scan icons, single-line `truncate` labels, smooth open/close popovers, and keyboard navigation (`ArrowDown`, `Enter`, `Escape`).
- **Text Limiters & Live Counters:** Constrained inputs and textareas use `InputGroup` + `InputGroupAddon` to show a calm live character count (`current / max`) that turns Coral (`#FF6B6B`) when `>= 90%` of the database limit.
- **Step 1 (Details & Price):** `ToggleGroup` / animated `layoutId` spring pills for Transaction Type (`For Sale`, `For Rent`, `Foreclosure`); live `Price per sqm` badge update as the user types; smooth `AnimatePresence` accordion for optional Payment Breakdown; and Partnered Bank cards with a clean logo placeholder + inline upload when no logo is uploaded yet.
- **Step 2 (Location):** Cascading `Region` -> `Province` -> `City` -> `Barangay` `shadcn` dropdowns with gentle mismatch notices when a parent changes, `isolation: isolate; z-index: 0` interactive map pin feedback, and a 2-option `Map Pin Privacy` toggle (`Exact Location` vs `Approximate Area (250m)`).
- **Step 3 (Specs & Features):** Quick-tap `ToggleGroup` / chips for Bedrooms, Bathrooms, Parking, and Furnishing, paired with `AnimatePresence` collapse of indoor room cards when a Vacant Lot is chosen, and leading `lucide-react` icons on Nearby Places inputs.
- **Step 4 (Media & Story):** Pre-selected area/room gallery cards driven by Property Category/Type, live `N / 5` photo limit counters (`3–5` recommended per area), per-photo `Description` counter, and a 1-per-area Video + Video Thumbnail uploader enforcing the `50 MB` standard size limit.
- **Step 5 (Credentials & Publish):** One-click **Use My Profile** auto-fill with instant visual feedback, interactive **Ready to Publish Checklist** rows that jump directly to any incomplete step, and a single solid primary CTA footer (`DESIGN.md` Section 6.6).

---

## 9. Mobile-First Editing, Touch Ergonomics, Bulk Safety & Sample State

1. **Adaptive Layout & Spacing (Mobile-First):** Author base styles for `< 768px` (`p-4`, `gap-4`, `grid-cols-1`, `min-w-0`) and scale up at `md:` / `lg:` (`Section 4`). On mobile viewports, secondary inspector rails and tool docks collapse into a bottom `Drawer` (`shadcn/ui`) so the primary canvas or form remains unobstructed.
2. **Touch-First Editing Architecture:** Every interactive editing control must meet `44px × 44px` (`min-h-11 min-w-11` on mobile / `@media (pointer: coarse)`). Direct-manipulation canvases and drag surfaces apply `touch-none` so browser scrolling or pinch-zoom does not conflict with drawing or dragging.
3. **Ergonomics:** Place primary mobile editor actions (Save, Undo/Redo, Done) in a thumb-zone sticky footer (`sticky bottom-0`) with at most one solid Primary CTA (`Section 6.6`). Never rely solely on hover tooltips or desktop keyboard shortcuts—expose visible labels or `aria-label`s and on-screen Undo/Redo buttons.
4. **Bulk Tools & Safety Guardrails:** Multi-select workflows (`selectedIds`) expose a contextual bulk bar (`N selected`, `Select All`, `Clear`). Any destructive or overwriting bulk action (Bulk Delete, Bulk Archive, Bulk Status Change) must open a confirmation `Dialog` showing the exact affected count before applying, paired with an Undo toast for reversible local edits.
5. **Sample Data & Interactive State:** Empty editors and complex workspaces may offer a one-tap **Load Sample** preset (plus a **Reset** confirmation) backed by static local fixtures—never mutating live records—so interactive workflows can be previewed and tested immediately.
