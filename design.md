---
name: Modern SaaS Design System & UI/UX Standards
philosophy:
  concept: "Soft Minimalist SaaS | Airy, Accessible & Performance-Driven"
  ethos: >
    Applying a consistent, functional Modern SaaS design language across the entire platform
    while preserving existing functionality, components, pages, and business logic.
    Balancing clarity, comfortable information density, rapid wayfinding, and accessibility
    with an airy, structured layout, 8px grid, standard 8px radius, and restrained
    application of the original Teal-Coral palette.

colors:
  primary: '#0F766E'                  # Primary Teal
  primary-hover: '#115E59'            # Primary Teal Hover
  secondary: '#14B8A6'                # Secondary Teal
  accent: '#FF6B6B'                   # High-Impact Coral Accent
  background: '#F8FAFC'               # App & Page Background (Canvas)
  surface: '#FFFFFF'                  # Card, Modal & Container Surface
  text-primary: '#1E293B'             # Slate 800 Primary Text (High contrast)
  text-secondary: '#64748B'           # Slate 500 Secondary / Muted Text
  border: '#E2E8F0'                   # Slate 200 Hairline Border
  semantic:
    success: '#10B981'                # Emerald Success
    warning: '#F59E0B'                # Amber Warning
    error: '#DC2626'                  # Red Destructive / Error

grid:
  system: "Responsive 12-Column Flexible Grid & 8px Spacing Base"
  spacingBase: "8px"
  desktop:
    columns: 12
    gutter: "24px"
    margin: "32px"
    maxWidth: "1440px"
  tablet:
    columns: 8
    gutter: "20px"
    margin: "24px"
    breakpoint: "768px - 1023px"
  mobile:
    columns: 4
    gutter: "16px"
    margin: "16px"
    breakpoint: "< 768px"

typography:
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  scaleRatio: "1.250 (Major Third Modular Scale)"
  hierarchy:
    display-h1:
      fontFamily: "Inter"
      fontSize: "36px"
      lineHeight: "44px"
      fontWeight: "700"
      letterSpacing: "-0.025em"
      role: "Hero declarations, primary page headers"
    heading-h2:
      fontFamily: "Inter"
      fontSize: "28px"
      lineHeight: "36px"
      fontWeight: "700"
      letterSpacing: "-0.02em"
      role: "Major section headers, module titles"
    card-h3:
      fontFamily: "Inter"
      fontSize: "20px"
      lineHeight: "28px"
      fontWeight: "600"
      letterSpacing: "-0.015em"
      role: "Card titles, subsection heads, modal headers"
    subhead-h4:
      fontFamily: "Inter"
      fontSize: "16px"
      lineHeight: "24px"
      fontWeight: "600"
      letterSpacing: "-0.01em"
      role: "Form group labels, table headers, subheadings"
    body-regular:
      fontFamily: "Inter"
      fontSize: "14px"
      lineHeight: "20px"
      fontWeight: "400"
      letterSpacing: "0em"
      role: "Primary copy, form inputs, table data cells"
    body-small:
      fontFamily: "Inter"
      fontSize: "12px"
      lineHeight: "16px"
      fontWeight: "500"
      letterSpacing: "0.005em"
      role: "Secondary metadata, helper text, badges, timestamps"
    mono-data:
      fontFamily: "'JetBrains Mono', monospace"
      fontSize: "12px"
      lineHeight: "16px"
      role: "Codes, IDs, cadastral numbers, monetary calculations"

radii:
  sm: "4px"                           # Badges, nested status indicators, tooltips
  default: "8px"                      # Standard buttons, form controls, cards, panels
  md: "8px"                           # Standard cards, forms, filter plinths
  lg: "12px"                          # Modals, drawers, elevated surface containers
  pill: "9999px"                      # Status pills, avatar circles, filter chips

shadows:
  subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
  card-hover: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
---

# Human Shelter Realty | Soft Minimalist SaaS UI/UX Design System Specification

## PURPOSE

This specification defines the mandatory design standards and protocol for AI agents and developers whenever a user requests a design update, redesign, UI improvement, or UX enhancement across Human Shelter Realty.

- **Trigger:** When the user instructs to update, improve, redesign, or refine any part of the system interface.
- **Objective:** Apply a consistent, high-performing **Soft Minimalist SaaS** UI/UX design while preserving existing functionality, components, pages, and business logic. This document governs design changes; it does not authorize creating listed example features.

---

## 1. MANDATORY WORKFLOW

Follow this sequence for every design update without exception:

$$\text{INSPECT} \longrightarrow \text{ANALYZE} \longrightarrow \text{PROPOSE} \longrightarrow \text{APPROVAL} \longrightarrow \text{IMPLEMENT} \longrightarrow \text{VERIFY}$$

### Step 1: Inspect
- Examine the requested page or component.
- Review existing styles, layouts, and dependencies.
- Identify reusable UI components.
- Check related pages for potential conflicts.
- **Do not modify any files during this step.**

### Step 2: Analyze
- Identify current design inconsistencies.
- Evaluate usability, responsiveness, and accessibility.
- Determine what requires improvement.
- Identify risks to existing functionality.

### Step 3: Propose
Present a concise design update plan containing:
- Target page or component
- Existing design issues
- Proposed UI improvements
- Proposed UX improvements
- Files requiring changes
- Potential conflicts or risks

### Step 4: Request Approval
> [!IMPORTANT]
> **STOP and wait for explicit user approval.**  
> Do not modify any project files before approval is given.

### Step 5: Implement
After approval:
- Update only approved components and files.
- Follow the established design system standards.
- Reuse existing components.
- Preserve business logic and functionality.
- Avoid unrelated changes.

### Step 6: Verify
- Check visual consistency.
- Verify existing functionality.
- Test responsive layouts.
- Check accessibility standards.
- Report modified files and verification results.

---

## 2. DESIGN SYSTEM STANDARDS & COLOR TOKENS

```
┌────────────────────────────────────────────────────────────────────────┐
│  BASE CANVAS:      Slate Alabaster Ground (#F8FAFC)                     │
│  SURFACE ELEVATION: Pure White (#FFFFFF) with 1px Border (#E2E8F0)     │
│  PRIMARY BRAND:    Teal (#0F766E) | Hover (#115E59) | Active (#14B8A6) │
│  CONVERSION ACCENT: Coral (#FF6B6B)                                    │
│  TYPOGRAPHIC INK:  Slate 800 (#1E293B) | Slate 500 Muted (#64748B)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Color Palette Specification
| Token Name | Hex Code | Purpose / Application | Contrast Ratio |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#0F766E` | Primary actions, branding, active tab borders | $\ge 4.5:1$ on `#FFFFFF` |
| `--color-primary-hover`| `#115E59` | Hover state for primary buttons and interactive items | Deep teal focus |
| `--color-secondary` | `#14B8A6` | Accompanying brand accents, secondary badges | Cyan-teal |
| `--color-accent` | `#FF6B6B` | Accents and conversion buttons with dark slate text | `#1E293B` text; verify AA |
| `--color-background` | `#F8FAFC` | Page and app canvas background | Neutral soft slate |
| `--color-surface` | `#FFFFFF` | Elevated cards, tables, modal containers, inputs | Pure white |
| `--color-text-primary`| `#1E293B` | Main headings, primary copy, table values | $> 13:1$ on `#F8FAFC` (AAA) |
| `--color-text-secondary`| `#64748B` | Labels, helper copy, placeholder text, breadcrumbs | $> 4.5:1$ (AA) |
| `--color-border` | `#E2E8F0` | Structural card borders, dividers, table lines | Slate 200 hairline |
| `--color-success` | `#10B981` | Positive statuses, active listings, success alerts | Emerald |
| `--color-warning` | `#F59E0B` | Pending approvals, caution alerts, expiring items | Amber |
| `--color-error` | `#DC2626` | Destructive actions, validation errors, rejected states | Red 600 |

### Styling & Geometric Rules
- **Typography:** `Inter`, `-apple-system`, `sans-serif`.
- **Standard Border Radius:** `8px` as the default across inputs, cards, and buttons; designated pills, avatars, and larger dialogs may use their documented radius tokens. Tailwind utility names apply only if that framework exists.
- **Spacing:** Use an **8px-based system** (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`); 4px half-step exceptions require a documented reason. Avoid arbitrary 20px spacing.
- **Clean and Minimal Layouts:** Distraction-free surfaces without decorative canvas noise.
- **Consistent Visual Hierarchy:** Clear typographic scale from H1 (36px) down to Micro (12px).
- **Responsive Design:** 12-column desktop (1024px and above), 8-column tablet (768–1023px), 4-column mobile (below 768px), unless existing project breakpoints differ; do not replace them without approval.
- **Accessible Color Contrast:** Target WCAG 2.2 AA: at least 4.5:1 for normal text, 3:1 for large text and relevant non-text UI indicators; 7:1 primary text contrast is an aspirational AAA enhancement, not a universal AA requirement. Validate actual foreground/background pairs.
- **Subtle Shadows and Hairlines:** Low-elevation shadows (`0 1px 3px rgba(0,0,0,0.1)`) paired with `1px border border-[#E2E8F0]`.
- **Control Heights:** Standardized input and action button heights (40px standard, 48px prominent); larger search controls may use 56px if consistent with the approved design. Ensure adequate target sizes and spacing.

---

## 3. UI COMPONENT REQUIREMENTS

Maintain consistent visual design for all interface primitives:

1. **Sidebars and Navigation:**
   - Consistent width, clear icon-label alignment, active indicator with Teal `#0F766E` background tint or left bar.
   - Clean group headers, collapsible menus, and responsive drawer on mobile.

2. **Headers and Breadcrumbs:**
   - Flush alignment, subtle bottom border (`#E2E8F0`), user profile dropdown with role chips, and predictable trail navigation.

3. **Buttons and Icon Buttons:**
   - **Primary:** Background Teal `#0F766E`, hover `#115E59`, text `#FFFFFF`, border-radius `8px`.
   - **Secondary / Outline:** Border `#E2E8F0`, text `#1E293B`, hover background `#F8FAFC`.
   - **Accent / Conversion:** Background Coral `#FF6B6B`, text `#1E293B` (dark slate, accessible for normal text). Hover styling must be visually distinct and retain at least 4.5:1 text contrast; do not default to white text on coral.
   - **Destructive:** Background `#DC2626`, hover `#B91C1C`, text `#FFFFFF`.

4. **Forms and Inputs:**
   - Uniform height (`h-[40px]` or `h-[48px]`), background `#FFFFFF`, border `1px solid #E2E8F0`.
   - Focus ring: `focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]`.
   - Clear field labels, required asterisks (`*`), helper text, and accessible error message slots.

5. **Cards and Statistics:**
   - Background `#FFFFFF`, rounded `8px`, border `1px solid #E2E8F0`, subtle shadow (`shadow-sm`).
   - Standardized padding (16px or 24px; `p-4` or `p-6` in default Tailwind), legible metric counters, and trend pill indicators.

6. **Data Tables:**
   - Clean table header in `#F8FAFC`, uppercase tracking for column labels, dividers in `#E2E8F0`.
   - Row hover state (`hover:bg-slate-50/60`), right-aligned numeric data, and sticky action columns.

7. **Search and Filters:**
   - Search input with leading search icon, multi-select filter dropdowns, active filter badge chips, and clear-all buttons.

8. **Dropdowns and Modals:**
   - Soft backdrop overlay (`bg-black/40 backdrop-blur-sm`), centered card with `rounded-xl`, clear header, body, and footer button bar.
   - Prevent background scrolling while a modal is open using the project's existing overlay/dialog handling; use library-specific attributes only when that library exists.

9. **Status Badges & Pills:**
   - Compact height, pill or `rounded-md`, uppercase or small title case, paired icon and status dot.
   - Use semantic status styling: Green for Available/Verified, Amber for Reserved/Pending, neutral slate for Sold and Draft, Red for Rejected/Error/Suspended. Preserve the underlying status values and distinguish statuses through text as well as color.

10. **Notifications & Loading Indicators:**
    - Non-intrusive toasts, inline banners, smooth skeleton pulse loaders (`animate-pulse bg-slate-200/80 rounded`), and accessible spinners.

> [!NOTE]
> Do not create duplicate components when reusable components already exist. Always leverage shared UI components.

---

## 4. UX COMPONENT REQUIREMENTS

Whenever relevant to the requested design update, evaluate and enforce:

### Navigation
- Clear page hierarchy with unambiguous headings.
- Visible, immediate active navigation states.
- Mobile drawer / responsive collapse behavior.
- Predictable wayfinding and back navigation.

### Forms
- Clear field labels positioned above inputs.
- Required field indicators (`*`) with semantic labels.
- Clear client-side validation and helper guidelines; propose real-time validation only if appropriate to the existing form and approved by the user.
- Helpful, context-specific error messages.
- Protection against accidental navigation with unsaved changes.

### Data Interaction
- Preserve existing search behavior; propose debouncing only when justified by current implementation and explicitly approved.
- Multi-facet filtering with visible selected filter badges.
- Ascending/descending column sorting with directional indicators.
- Preserve existing pagination; propose virtualization or new page-size behavior only after separate evaluation and approval.
- Meaningful, actionable empty states with an illustration or icon and a primary action button.

### Feedback
- Provide accurate loading or pending feedback; use optimistic updates only if already present or approved with rollback/error handling.
- Provide successful-operation feedback when relevant; preserve existing notification behavior and avoid redundant toasts.
- Human-readable error messages with recovery / retry suggestions.
- Modal confirmation dialogs for destructive operations.

### Accessibility
- Keyboard support appropriate to each control (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, and arrow keys where applicable).
- High-visibility focus indicators; never remove the native outline unless a clearly visible replacement is provided. Use framework-specific utilities only if supported.
- Readable typography, proper zoom/reflow behavior, and accessible contrast; avoid relying on 12px metadata for essential instructions.
- Minimum target touch sizes of $44\text{px} \times 44\text{px}$ on mobile viewports.

---

## 5. SCOPE CONTROL

Only update the page, module, or component requested by the user.

### Allowed After Approval
- Visual styling improvements and theme token harmonization.
- Layout refinements and spacing consistency.
- Component styling and interactive states.
- Responsive adjustments across mobile, tablet, and desktop.
- Approved UX workflow improvements.
- Reusable design token updates in theme definitions.

### Not Allowed Without Separate Approval
- Deleting existing pages or modules.
- Changing application routes or URL structures.
- Modifying database schemas or migrations.
- Altering authentication flows, session guards, or permission logic.
- Modifying underlying business logic or calculation formulas.
- Changing API response structures or endpoint contracts.
- Removing existing features or capabilities.
- Redesigning unrelated modules or pages outside the prompt scope.
- Installing unnecessary dependencies or libraries.

If a required change affects another module, explain the dependency and request additional approval.

---

## 6. ROLE-BASED DESIGN STANDARDS

Maintain the same Modern SaaS visual identity across the system while adapting layouts to existing user roles:

### Administrator
- Comfortable, scannable data tables and existing administrative tools; offer compact density only where the workflow requires it.
- Clear primary actions, grouped analytics, and efficient filtering, without crowding the page.

### Agent
- Operational workflow hubs: active property listings, inquiry triage, appointment scheduling, and commission ledgers.
- Task-oriented action bars, quick communication links, and client interaction histories.

### Client
- Seamless property discovery, intuitive multi-criteria search, transparent pricing breakdowns, and saved favorites.
- Low-friction inquiry submission and private consultation scheduling.

> Do not create missing modules or workflows unless explicitly requested and approved by the user.

---

## 7. VERIFICATION CHECKLIST

After an approved update, execute and document the following verification checklist:

- [ ] Design adheres strictly to the Modern SaaS theme.
- [ ] Teal (`#0F766E`) and Coral (`#FF6B6B`) colors are applied accurately.
- [ ] Standard border radius is 8px (`rounded-lg`).
- [ ] Existing reusable components are leveraged without redundant duplications.
- [ ] Responsive layouts operate smoothly on mobile, tablet, and desktop.
- [ ] Forms, inputs, and validations remain fully operational.
- [ ] Navigation paths, breadcrumbs, and existing routes are preserved.
- [ ] Data operations, API calls, and business logic are untouched.
- [ ] No unrelated files outside the agreed scope were modified.
- [ ] Discover the project's actual package manager and scripts, then run applicable build, lint, type-check, and test commands; report unavailable or failing checks without implying they passed.
- [ ] All modified files and changes are transparently reported to the user.

---

## 8. REQUIRED AGENT RESPONSE FORMAT

Before implementing any redesign, respond with the following standardized structure:

```markdown
### Design Update Proposal

**Target:** [Page or component name]

**Existing Design:** [Brief findings and issues identified]

**Proposed UI Changes:**
- [Change 1]
- [Change 2]

**Proposed UX Changes:**
- [Improvement 1]
- [Improvement 2]

**Affected Files:**
- [File path 1]
- [File path 2]

**Risks:** [Potential conflicts or none identified]

**Approval Required:** Yes

**Status:** Awaiting user approval.
```

> **Do not implement changes until user approval is explicitly provided.**

---


---

## 9. COMPONENT ACCEPTANCE CRITERIA

For every approved component update:
- Follow existing semantic design tokens; avoid duplicated hardcoded values.
- Preserve existing props, events, data bindings, permissions, and behavior.
- Specify applicable default, hover, active, focus, disabled, loading, empty, and error states.
- Verify accessible names, keyboard use, error association, focus visibility, and meaningful status text.
- Test the component at the existing project breakpoints and relevant zoom levels.
- Record what was verified and what could not be tested.

A component is complete only when approved acceptance criteria are met or explicitly documented as outstanding.

## 10. DESIGN TOKEN AND RESPONSIVE COMPATIBILITY

- First inspect the actual styling stack (CSS, Tailwind, component library, theme configuration).
- Reuse its existing token location and naming convention. Example semantic names include `--color-primary`, `--color-surface`, and `--color-text-primary`.
- Do not introduce a second design system or styling framework by default.
- Use the grid and breakpoint specifications above as proposed defaults, not permission to replace existing responsive behavior.
- Prefer existing application patterns for modal scroll-lock, focus management, and animation.
- Honor reduced-motion settings for non-essential transitions and loading effects.

## 11. CHANGE CLASSIFICATION AND APPROVAL

Classify every proposed change before implementing it:

| Class | Examples | Approval |
| :--- | :--- | :--- |
| Visual | Color, spacing, typography, borders, layout | Required under standard design approval |
| Interaction | Validation timing, search behavior, navigation feedback, modal handling | Explicitly itemize and approve behavior changes |
| Functional | APIs, workflows, database operations, authentication, permissions, calculations | Separate explicit approval, outside the default design scope |

Do not treat a visual-design request as authorization for new functionality. Preserve manual property availability and transaction-status updates by authorized users; never infer sales/reservations from UI actions or payments.

## 12. SOURCE PROTECTION AND ROLLBACK

Before proposed edits:
1. Inspect repository status (`git status`, if available) and document pre-existing uncommitted changes.
2. List the exact files expected to change and shared dependencies that could affect other pages.
3. Describe a rollback strategy that does not discard user work.
4. Stop after the proposal and wait for explicit approval.

During implementation, do not reset, overwrite, or reformat unrelated work. If a change crosses the approved scope, stop and request approval again.

## 13. REGRESSION AND ACCESSIBILITY VERIFICATION

After approved edits:
- Compare before-and-after screenshots for target pages when visual capture is available.
- Inspect related shared-component usages and ensure unrelated pages are unchanged.
- Check mobile, tablet, and desktop layouts, keyboard focus, zoom/reflow, contrast, validation, and overlays.
- Test critical existing flows, including form input, navigation, saves, filters, and role-specific access where applicable.
- Run only commands found in the actual project configuration; distinguish pre-existing failures from newly introduced failures.
- Report modified files, verification results, failed/unavailable tests, and the safe rollback method.

## 14. REQUIRED PROPOSAL ADDITIONS

Extend the response format from Section 8 with:

- **Change classification:** Visual / Interaction / Functional for each proposal.
- **Existing dependencies:** Shared components, affected routes, and styling framework.
- **Acceptance criteria:** Specific checks that establish completion.
- **Rollback approach:** How to reverse only approved edits without losing user changes.
- **Verification plan:** Actual project scripts and visual/interaction checks, or state what is not yet known.

**The approval gate from Section 1 remains mandatory. No edits before approval.**

## 15. SOFT MINIMALIST SAAS VISUAL DIRECTION

**Design intent:** Calm, airy, structured, professional, readable. This is a refinement of the existing Modern SaaS system, not a replacement of its color palette, semantic tokens, component architecture, or approval-first workflow.

### 15.1 Visual hierarchy and color restraint
- Use `#F8FAFC` for the canvas and `#FFFFFF` for primary surfaces. Establish separation with whitespace and `#E2E8F0` hairline borders; use shadows only when elevation is meaningful.
- Use primary teal `#0F766E` for the selected navigation state, the main page action, accessible focus accents, and limited key indicators. Use `#115E59` for primary hover; `#14B8A6` for restrained secondary accents.
- Reserve coral `#FF6B6B` for a *small number* of meaningful callouts or conversion actions, never a competing action on every card. For coral buttons use dark slate `#1E293B` text, not white.
- Prefer plain surfaces over gradients, glassmorphism, glow, strongly tinted cards, and large purely decorative illustrations. Any decorative asset must serve the user task and be approved when it changes existing pages.
- Keep semantic success, warning, and error colors distinct from branding, including textual status labels.

### 15.2 Airy dashboard layout
- **Application shell:** A stable left sidebar plus a low-distraction top header for administrator/agent pages; the client website can retain its public navigation pattern.
- **Sidebar:** Suggested expanded width 240–256px; white surface with subtle border, grouped labels, quiet icons, and a pale teal selected row. Collapse to an accessible drawer on small screens. Reuse existing dimensions if changing them would disturb the layout.
- **Top header:** Suggested height 64–72px, white or near-white, with only necessary search, notifications, and user-menu controls.
- **Content container:** Fluid, with a proposed maximum width of 1440px. Preserve existing 12/8/4-column grid and project breakpoints unless changes are explicitly approved.
- **Outer padding:** Desktop 32px, tablet 24px, mobile 16px as design defaults. Space major sections by 24–32px, card interiors by 16–24px, and tightly related items by 8–16px.
- **Cards:** Prefer a single low-contrast border, white surface, 8px radius, and at most a subtle shadow; avoid excessive nesting and redundant card wrappers.
- **Typography:** Retain the Inter scale already defined. Use a clearly distinguished page heading, small supporting description, concise section headings, readable field labels, and subdued metadata. Do not shrink important data to fit dense layouts.
- **Actions:** One clear primary action per task area; use neutral secondary actions. Destructive actions remain separate and explicitly labeled.

### 15.3 Form layout and property-listing application
- For long forms, propose a consistent seven-section structure where it matches the approved module specification: Basic Information, Location, Specifications, Pricing, Features, Media, Review.
- On desktop, favor a primary form column and *optional* narrower preview/assistance column only where a live preview already exists or is separately approved. On mobile, stack content in reading order.
- Use full-width fields for titles, descriptions, and addresses; use aligned two-column groups for short related fields on wider screens. Avoid squeezing labels or helper text.
- Show progress, required markers, field-level errors, contextual help, and safe previous/next actions. Keep Save Draft accessible **only if supported by the current workflow**.
- Do not add a preview, wizard, uploads, autosave, or any new field solely because this document depicts a layout. Propose such changes individually and secure approval first.
- Preserve the existing field definitions, validations, uploads, permissions, data persistence, and manual status updates.

### 15.4 Responsive behavior and accessibility
- Preserve the existing grid and breakpoints; proposed layout patterns are defaults, not instructions to override working code.
- Stack form fields and cards when needed, keep controls touch-accessible, and manage wide tables using an approved mobile pattern (horizontal scrolling or responsive detail cards).
- Ensure meaningful focus visibility, keyboard access, accessible feedback, readable contrast, reflow at zoom, and reduced-motion behavior.
- Favor short, subtle transitions (about 150–200ms) where motion adds clarity; avoid gratuitous animation.

### 15.5 Visual design acceptance criteria
- Main background and card surfaces use the approved palette without excessive color fills.
- Key actions are obvious; teal and coral do not compete for attention.
- Layout has consistent alignment, spacing, 8px standard radii, and readable content.
- No unintended horizontal overflow, cramped controls, or decorative UI noise at supported widths.
- Updated views remain consistent with related pages; no unrelated visual or functional regressions.
- Before-and-after screenshots, available test results, and all exceptions are documented after approved implementation.

### 15.6 Approval boundary
This section defines a **visual direction**, not automatic implementation authorization. The agent must **inspect → analyze → propose → obtain explicit approval → implement only approved changes → verify**. Any new interactions, fields, workflow steps, sidebar resizing affecting other screens, or shared global token modifications must be itemized with affected files and risks in the proposal.

---

## 16. BALANCED-COMPACT RESPONSIVE LAYOUT

**Objective:** Implement adaptive layouts across Desktop, Tablet, and Mobile devices while preserving all existing functionality, fields, permissions, and business logic. Maintain balanced density without excessive whitespace or cramped data controls.

### 16.1 Responsive Breakpoint Architecture
- **Desktop:** $1024\text{px}$ and above (`lg` and `xl`).
- **Tablet:** $768\text{px} - 1023\text{px}$ (`md` to `lg`).
- **Mobile:** Below $768\text{px}$ (`< md`).

### 16.2 Desktop Layout Standards ($\ge 1024\text{px}$)
- **Container & Space Utilization:** Full-width fluid layout (`w-full`) eliminating arbitrary `max-w-[1440px]` restrictions. Main portal viewport stretches edge-to-edge with standard perimeter padding (`p-4 sm:p-6 lg:p-8`), completely removing dead outer side gutters on 1080p, 1440p, and ultrawide screens.
- **Sidebar:** Expanded width approximately $220\text{px} - 240\text{px}$ (or $256\text{px}$ `w-64`), with collapsible icon rail mode (`w-16`).
- **Summary Metrics:** Four KPI cards positioned in a single horizontal row (`grid-cols-4`).
- **Toolbar:** Compact single-row toolbar integrating search, multi-dropdown status/role filters, sorting, and reset controls (40px standard touch height).
- **Data Table:** Full-width primary column table with 10 structured columns, compact 56–64px row heights (`py-3.5`), compact horizontal cell padding (`px-3`), sticky identifier column pinning (`stickyFirstColumn`), and numbered pagination controls.
- **Typography & Rhythm:** 14px body, 12–13px table text, 11px uppercase metadata labels. Section spacing: 24–32px, card padding: 16–24px.

### 16.3 Tablet Layout Standards ($768\text{px} - 1023\text{px}$)
- **Navigation:** Collapsible sidebar rail (`w-16`) or off-canvas navigation drawer with backdrop blur.
- **Summary Metrics:** Balanced 2-column grid layout (`grid-cols-2`) rendering summary cards in a clean 2x2 matrix.
- **Toolbar:** Adaptive flex layout with wrapping controls that prevent horizontal viewport stretching.
- **Data Table:** Controlled horizontal scrolling (`overflow-x-auto custom-scrollbar`) with sticky identifier pinning (`stickyFirstColumn`) and minimum column widths to preserve full data fidelity without losing row context or clipping identity.
- **Secondary Widgets & Dossiers:** Adaptive 2-column grid reflow (`md:grid-cols-2 lg:grid-cols-1` in dashboards; `md:col-span-5` and `md:col-span-7` in detail dossiers), ensuring side-by-side balance rather than tall single-column stacking.

### 16.4 Mobile Layout Standards ($< 768\text{px}$)
- **Navigation:** Sidebar completely replaced with an accessible slide-over navigation drawer.
- **Summary Metrics:** 2-column card layout (`grid-cols-2`) avoiding excessive vertical thumb scrolling.
- **Toolbar:** Vertically stacked search input on top with filter dropdowns grouped below.
- **Responsive Entity Representation:** Wide tables transform into responsive mobile cards displaying essential information immediately (avatar, role, contact, status dot badge, key metrics) with prominent touch-friendly actions (`Review`, `Resend`, `View`).
- **Dialogs & Forms:** Single-column form layouts with full touch accessibility and clean dismiss controls.

---

## FINAL RULE

Whenever the user requests a design update, follow this document as the single source of truth for the Soft Minimalist SaaS UI/UX direction, preserving the original color tokens and explicit approval requirements.

**Inspect first. Propose changes. Obtain approval. Implement only approved changes. Verify results.**

