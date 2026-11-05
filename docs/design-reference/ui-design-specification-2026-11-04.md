# UI Design Specification

> Fill in the bracketed placeholders before implementation. This document is the UI specification for the AI agent building the application. Keep requirements concrete, observable, and consistent with the approved mockups.

## 1. Project Context

- **Project name:** Human Shelter Realty
- **Product purpose:** [Problem the application solves]
- **Primary users:** [User groups and their needs]
- **Primary user journey:** [Main task from start to finish]
- **Platform:** Responsive web application
- **In scope:** [Screens and features to build]
- **Out of scope:** [Features excluded from this implementation]

## 2. Instructions for the AI Agent

1. Read this document and applicable repository instructions before implementation.
2. Use the existing framework, components, and design tokens when available. Apply the shadcn/ui architecture and brand requirements in Appendix A using the integration notes in Section 8.
3. Treat filled-in requirements as the intended behavior. Treat bracketed placeholders as unresolved information, not literal UI text.
4. Do not invent product features, permissions, business rules, or backend behavior. Ask for clarification when a missing detail blocks a correct implementation.
5. For minor visual details that are unspecified, follow existing project conventions and record any material assumptions.
6. Implement all relevant interaction, validation, responsive, and accessibility requirements, including loading, empty, success, and error states.
7. Use mock data only when authorized, and identify it clearly in the implementation handoff.
8. Verify the acceptance criteria and report completed work, verification results, assumptions, and remaining gaps.
9. Record module UI specifications at `docs/modules/<module>/ui-specification.md` and register them in the module INDEX.md, following Section 9. Keep this root document as the shared design standard.

### Implementation Skill: `shadcn-ui`

Use the `shadcn-ui` skill for implementing, composing, customizing, and reviewing the project's shadcn/ui components.

- Before UI implementation, locate and read the available `shadcn-ui` skill's `SKILL.md`; follow relevant linked guidance as needed.
- Apply its component selection, installation, composition, variants, form, and accessibility guidance where covered by the actual skill.
- Preserve this document's approved palette, coral/slate button pairing, directory structure, and canonical `cn` helper when applying generic skill examples.
- Follow applicable instruction precedence. Skill examples do not override explicit user requirements or authorize unrelated actions.
- If the skill is unavailable, report that clearly. Do not claim to have loaded it. Use this specification and current official shadcn/ui documentation as the fallback for authorized implementation work.

**Availability at specification update:** A local search on 2026-10-27 found no `shadcn-ui` skill in the installed skill locations. This section records the requested skill usage; it does not install a skill or assume a particular publisher or source.

## 3. Shared Visual System

| Property | Specification |
|---|---|
| Design direction | [Visual style and reference designs] |
| Colors | Use the authoritative color tokens in Section 3.1. These exact hex values take precedence over Appendix A color examples. |
| Typography | [Font family, sizes, weights, and line heights] |
| Spacing | [Spacing scale and page padding] |
| Layout | [Content width, grid, alignment, and section spacing] |
| Borders and corners | [Border styles and radius tokens] |
| Elevation | [Shadow or layering rules] |
| Icons | [Icon library, sizes, and labeling rules] |
| Motion | [Transitions, timing, and reduced-motion behavior] |

### 3.1 Authoritative Color Tokens

The user supplied the following palette. These exact hex values are the source of truth for all shared colors and take precedence over conflicting color examples or HSL annotations in Appendix A. Derive any alternative color representations from these values.

```yaml
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
```

| UI Role / shadcn Token | Palette Token |
|---|---|
| `background` | `background` |
| `foreground`, `card-foreground`, `popover-foreground` | `text-primary` |
| `card`, `popover` | `surface` |
| `primary`, `ring` | `primary` |
| Primary button hover | `primary-hover` |
| `secondary` | `secondary` |
| `accent` / conversion action | `accent` |
| `muted-foreground` | `text-secondary` |
| `border`, `input` | `border` |
| Success indicator | `semantic.success` |
| Warning indicator | `semantic.warning` |
| `destructive` / error indicator | `semantic.error` |

Use `surface` or `background` for context-appropriate foregrounds on primary controls only after verifying contrast. Use `text-primary` on secondary and coral filled controls. Semantic colors do not automatically define accessible text/background pairs; choose and verify each pairing. Keep success, warning, and error distinguishable through labels or icons as well as color. Unspecified foreground, muted background, hover, and dark-theme tokens remain subject to the implementation checks in Section 8.

### Approved Coral Button

User-approved on 2026-10-27:

- **Background:** Coral `#FF6B6B` (`colors.accent`).
- **Font and icon color:** Slate `#1E293B` (`colors.text-primary`).
- **Use:** High-impact conversion actions, including “Review listing”.
- **Contrast:** Approximately 5.27:1 for the approved text/background pair.
- **Implementation:** Map `accent-foreground` and the coral button variant's foreground to `text-primary`. Icons inherit the text color. Keep this pairing consistent across the property discovery and agent workspace designs.
- **Other states:** Verify hover, focus, and disabled states separately; approval applies to the default color pair.

### Shared Components

| Component | Variants / States | Reuse Rules |
|---|---|---|
| [Button, input, dialog, table, etc.] | [Applicable sizes, variants, and states] | [Existing component or shared implementation] |

## 4. Navigation and Access

| Screen | Route / Entry Point | Allowed Roles | Main Destinations |
|---|---|---|---|
| [Screen name] | [Route or navigation entry] | [Roles] | [Linked screens] |

- **Unauthenticated behavior:** [Login flow or public access]
- **Unauthorized behavior:** [Access-denied response]
- **Back navigation:** [Expected behavior]
- **Unsaved changes:** [When to warn and how to recover]

## 5. Screen Specification

> Duplicate this section for each screen. Use unique requirement and element IDs so implementation and verification can refer to them.

### Screen: [Screen Name]

- **Screen ID:** [SCR-01]
- **Purpose:** [What users accomplish]
- **Route:** [Route or screen identifier]
- **User roles:** [Allowed roles]
- **Preconditions:** [Required session, data, or previous action]
- **Successful outcome:** [Observable result]

#### 5.1 Wireframe or Mockup

[Insert an image path, design link, or labeled layout description. Specify which reference takes precedence if several are provided.]

#### 5.2 Layout and Content

- **Header:** [Title, supporting text, and actions]
- **Main content:** [Sections in display order]
- **Secondary content:** [Sidebar, supporting information, or none]
- **Footer:** [Actions or information, if applicable]
- **Content rules:** [Exact labels and messages, formatting, truncation, and overflow behavior]

#### 5.3 UI Elements

| Element ID | Name | Type | Content / Data Source | Behavior | Visible / Enabled When |
|---|---|---|---|---|---|
| SCR-01-UI-01 | [Name] | [Input / button / table / etc.] | [Text, field, or data source] | [Action and resulting state] | [Condition] |

#### 5.4 Input and Validation

| Field | Required | Format / Constraints | Default | Validation Trigger | Exact Error Message |
|---|---|---|---|---|---|
| [Field name] | [Yes / No] | [Type, allowed values, length, or range] | [Default or none] | [Blur / change / submit] | [Message] |

- **Submission rules:** [When submission is allowed and how duplicate submissions are handled]
- **Invalid submission:** [Error placement, focus behavior, and preservation of entered values]
- **Server errors:** [How server validation and general failures appear]

#### 5.5 Interaction Flows

| Flow ID | Trigger | System Response | Success Outcome | Failure / Recovery |
|---|---|---|---|---|
| SCR-01-FLOW-01 | [User action] | [State change or request] | [Confirmation, updated data, or navigation] | [Message, preserved data, and retry option] |

#### 5.6 Screen States

| State | Trigger | Display | Available Actions |
|---|---|---|---|
| Default | [Initial conditions] | [Normal content] | [Actions] |
| Loading | [Data or action pending] | [Indicator or skeleton] | [Enabled / disabled actions] |
| Empty | [No records or results] | [Message] | [Create, reset filters, or other next step] |
| Success | [Action completed] | [Confirmation and updated content] | [Next step] |
| Error | [Request or operation failed] | [Actionable message] | [Retry or recovery] |
| Disabled | [Action unavailable] | [Disabled appearance and explanation where needed] | [Remaining actions] |

Mark any state that does not apply as `N/A` with a brief reason.

#### 5.7 Responsive Behavior

| Viewport / Breakpoint | Layout Changes | Navigation Changes | Overflow Behavior |
|---|---|---|---|
| [Mobile range] | [Stacking, spacing, and sizing] | [Behavior] | [Tables, long text, and menus] |
| [Tablet range] | [Changes] | [Behavior] | [Behavior] |
| [Desktop range] | [Changes] | [Behavior] | [Behavior] |

#### 5.8 Accessibility

- Use semantic elements and provide accessible names for controls.
- Associate each form field with its label and relevant instructions or errors.
- Support keyboard operation with a logical focus order and visible focus indicators.
- Define focus placement and restoration for dialogs and navigation changes.
- Communicate status and validation changes to assistive technology where appropriate.
- Do not rely on color alone to convey meaning.
- Ensure text remains usable with zoom and reflow, and honor reduced-motion preferences.
- **Additional screen requirements:** [Specific accessibility needs]

#### 5.9 Data and Integration

| Data / Action | Existing Source or Contract | UI Mapping | Pending / Failure Behavior |
|---|---|---|---|
| [Data or operation] | [Existing API, store, local source, or unresolved] | [Fields used by UI] | [State and recovery] |

- **Persistence:** [What is saved and when]
- **Refresh behavior:** [When data is fetched again]
- **Mock data authorization:** [Allowed scope or none]

#### 5.10 Acceptance Criteria

- [ ] **SCR-01-AC-01:** Given [precondition], when [action], then [observable result].
- [ ] **SCR-01-AC-02:** Given [invalid input], when [submission], then [exact validation behavior].
- [ ] **SCR-01-AC-03:** Given [loading, empty, or error condition], then [expected state and recovery action].
- [ ] **SCR-01-AC-04:** At [specified viewport], [expected layout and usability].
- [ ] **SCR-01-AC-05:** Using only the keyboard, [primary task] can be completed with visible focus.

## 6. Open Questions and Assumptions

| ID | Question / Assumption | Impact | Resolution |
|---|---|---|---|
| Q-01 | [Unresolved detail] | [Affected behavior or screen] | [Decision or pending] |

## 7. Implementation Handoff

The AI agent should provide:

- Screens and behaviors implemented, with references to acceptance criteria.
- Relevant files changed and how to preview the result.
- Verification performed and its outcome.
- Material assumptions, unresolved requirements, and known limitations.

## 8. shadcn/ui Integration Notes

**Source:** `2026-10-27-shadcn-ui-specification.md`, dated 2026-10-27, supplied by the user. Appendix A preserves the supplied specification. Its “Approved” status is source metadata; implementation and examples have not been independently verified. This update incorporates documentation only.

### Architecture and Brand Requirements

- Target stack from the source: React 19, Tailwind CSS v4, Radix UI, `clsx`, `tailwind-merge`, and `class-variance-authority`.
- Keep owned UI primitive source in `frontend/src/components/ui/`. Supporting package imports, including Radix, remain valid.
- Compose domain cards, modals, and layout components outside the primitive directory as shown in Appendix A.
- Use `frontend/src/utils/cn.js` and alias `@/utils/cn` as the canonical class helper. Avoid generating a duplicate helper.
- Keep shadcn configuration at `frontend/components.json` and shared styling at `frontend/src/index.css`.
- Use semantic tokens for component variants. Map the literal colors in the appendix's CVA example to shared tokens.
- Brand palette: pale slate canvas `#F8FAFC`, white surfaces `#FFFFFF`, slate text `#1E293B`, teal primary `#0F766E`, cyan teal secondary `#14B8A6`, coral conversion accent `#FF6B6B`, and border `#E2E8F0`. Standard radius is 8px.
- Prefer the existing configured icon library. The source defaults to Tabler and permits Lucide; use a consistent library and label icon-only actions.
- Use `asChild` where supported when composing styled controls with links. Preserve valid HTML and avoid nested interactive elements.

### Conflicts and Checks Before Implementation

1. **Color consistency:** Some HSL values differ from their annotated hex values. For example, `222 47% 11%` does not represent `#1E293B`. Use the authoritative hex palette in Section 3.1 and derive matching CSS values. Record this resolution in the implementation handoff.
2. **Tailwind v4 mapping:** The appendix supplies bare HSL channels. Inspect the existing CSS conventions and map complete color values to semantic Tailwind utilities as needed; do not assume the token block alone establishes this mapping.
3. **Contrast:** Verify actual color pairs in every relevant state. Do not assume the sample white-on-secondary button meets the specified normal-text contrast requirement. Adjust foreground or background as necessary. Pair coral with dark slate text.
4. **Mobile sizing:** The source shows 32px small buttons and 40px default controls, and requires 44px mobile touch targets. Provide an effective target of at least 44 by 44 CSS pixels on mobile, with adequate spacing.
5. **Version-sensitive examples:** Verify the supplied CLI commands, preset features, configuration fields, and package workarounds against installed versions and current official documentation before use. Investigate peer dependency conflicts before selecting a compatible version or override; do not automatically bypass checks.
6. **Accessibility:** Radix supplies behavioral foundations. The application must still implement labels, descriptions, focus behavior, and accessible composition, then verify the finished interface.
7. **Unspecified tokens:** Section 3.1 defines muted text, destructive/error, success, warning, and primary hover colors. Muted backgrounds, additional hover states, chart, sidebar, dark-theme, and some foreground tokens remain unspecified. Reuse existing project tokens and record unresolved requirements rather than assuming the supplied palette covers every state.

### Shared Acceptance Criteria

- [ ] **DS-AC-01:** Owned UI primitives use the specified directory and canonical class helper.
- [ ] **DS-AC-02:** Configuration aliases resolve to the intended existing files and directories.
- [ ] **DS-AC-03:** Semantic color utilities resolve correctly and color representations agree.
- [ ] **DS-AC-04:** Normal text meets the supplied 4.5:1 contrast requirement, focus is visible, and applicable keyboard interactions work.
- [ ] **DS-AC-05:** Mobile targets meet the supplied 44 by 44 CSS pixel requirement.
- [ ] **DS-AC-06:** Loading skeletons match content geometry to limit layout shifts.
- [ ] **DS-AC-07:** Existing applicable build, type-check, and Vitest checks pass. Identify unavailable checks explicitly.
- [ ] **DS-AC-08:** Screen-specific requirements in Section 5 are completed and verified alongside the shared criteria.

## 9. Recording UI Specifications by System Module

`design.md` defines shared UI standards. Record each module's actual UI requirements in `docs/modules/<module>/ui-specification.md`, alongside its other module documentation. Use the module folders supplied by the user:

```text
docs/
  modules/
    01-user-management/
      INDEX.md
      ui-specification.md
    02-property-listing/
      INDEX.md
      ui-specification.md
    03-agent-management/
      INDEX.md
      ui-specification.md
    04-sales-and-reports/
      INDEX.md
      ui-specification.md
    05-database/
      INDEX.md
      ui-specification.md
    06-audit/
      INDEX.md
      ui-specification.md
    07-inquiry/
      INDEX.md
      ui-specification.md
    08-ai-inquiry-assisted/
      INDEX.md
      ui-specification.md
```

This is the required documentation layout, based on the supplied screenshot. The screenshot establishes folder names, not implemented screens, permissions, or workflows. This section does not assert that these folders or module specifications already exist in the current workspace. Preserve other existing files and folders, including `docs/implementation/`, `docs/reports/`, `docs/superpowers/`, and `docs/system-modules/`.

### 9.1 Agent Recording Workflow

1. Identify the owning module and read its `INDEX.md`, current module specification, relevant feature specifications, and change records before recording UI behavior.
2. Create or update the module's `ui-specification.md`. Record proposed behavior before implementation and reconcile it with delivered behavior afterward. Distinguish proposed, approved, implemented, and verified states; never infer approval from implementation.
3. Reference the root `design.md` for shared tokens, component architecture, accessibility rules, and approved button styling. Avoid duplicating the palette in each module. Record any explicitly approved exception with its scope and rationale.
4. Use the module template below and repeat Section 5's screen template for every screen, modal, drawer, or other distinct UI view that needs a specification. Record meaningful tabs and states within their owning screen unless they need a separate specification.
5. Preserve existing requirement IDs. For new IDs, include the module number, such as `M02-SCR-01`, `M02-UI-001`, and `M02-AC-001`, to prevent collisions across modules.
6. Link each screen to its requirements, relevant implementation paths, acceptance criteria, and verification evidence. Label missing evidence as pending or unavailable; do not claim a check passed without evidence.
7. Register the UI specification in the module's `INDEX.md`. Link substantial feature UI specifications from the current UI specification rather than creating competing sources of truth.
8. For cross-module journeys, choose one owning specification and link it from affected modules. Record handoff points and dependencies without duplicating the full workflow.
9. After a UI change, update the affected screen specifications, module revision history, and a dated change/verification record. Follow the existing module naming convention. Dated records require YAML frontmatter containing `module`, `date`, `status`, and `affected_files`, and must be linked from `INDEX.md`.
10. Do not invent a user-facing UI for a module merely because its folder exists. For a backend-only module, record `UI applicability: None` with the confirmed reason and links to any interfaces owned by other modules.

### 9.2 Module UI Specification Template

Copy the following structure into the owning module's `ui-specification.md` and complete it using confirmed requirements and implementation evidence.

```markdown
# [Module Name] — UI Specification

- Module ID: [M01–M08]
- Module folder: [Exact folder name]
- UI applicability: [User-facing / Shared UI / None / Unresolved]
- Specification status: [Draft / Approved / Superseded]
- Implementation status: [Not started / In progress / Implemented / Not applicable]
- Verification status: [Pending / Passed / Failed / Unavailable / Not applicable]
- Last updated: [YYYY-MM-DD]
- Owner: [Name or role, if known]
- Shared design rules: [Root design.md](../../../design.md)
- Current module specification: [Link to existing specification]

## Purpose and Scope
[Module purpose, supported user tasks, included UI, and exclusions.]

## Roles and UI Access
| Role | View / Action | Visible / Enabled When | Enforcement Reference |
|---|---|---|---|
| [Confirmed role] | [Screen or action] | [Condition] | [Permission requirement or server contract] |

UI visibility does not replace server-side authorization.

## Screen Inventory
| Screen ID | Screen / View | Route or Entry Point | Roles | Specification Anchor | Implementation Status |
|---|---|---|---|---|---|
| M02-SCR-01 | [Name] | [Route, parent screen, or trigger] | [Roles] | [Link to screen section] | [Status] |

## User Journeys and Screen Transitions
| Flow ID | Entry / Preconditions | Steps and Screen IDs | Success Outcome | Failure / Recovery | Cross-Module Handoff |
|---|---|---|---|---|---|
| M02-FLOW-01 | [Entry] | [Ordered interactions] | [Result] | [Recovery] | [Owning specification or N/A] |

## Screen Specifications
[Repeat the screen template in design.md Section 5 for each inventory entry.
Include layout/mockup references, UI elements, exact copy, interactions,
validation, all applicable states, responsiveness, accessibility, data contracts,
and screen acceptance criteria. Replace sample IDs with module-specific IDs.]

## Module Business Rules and Dependencies
| Rule / Requirement ID | UI Effect | Source | Dependent Module / Contract |
|---|---|---|---|
| [Existing ID] | [Behavior or constraint] | [Specification link] | [Dependency or N/A] |

## Design Exceptions
[None, or explicitly approved deviations with rationale and approval reference.]

## Acceptance and Verification Traceability
| Requirement ID | Screen / UI IDs | Acceptance Criterion ID | Verification Method | Evidence | Result |
|---|---|---|---|---|---|
| [ID] | [IDs] | M02-AC-001 | [Observable check] | [Evidence link or pending] | [Passed / Failed / Skipped / Unavailable / Pending] |

## Open Questions and Assumptions
| ID | Question / Assumption | Impact | Resolution / Source |
|---|---|---|---|
| [ID] | [Detail] | [Affected UI] | [Confirmed decision or pending] |

## Revision History
| Date | Affected Screen / Requirement IDs | Change | Change / Verification Record |
|---|---|---|---|
| [YYYY-MM-DD] | [IDs] | [Description] | [Link] |
```

### 9.3 Module Entry Point Registration

Add a link in each applicable module's `INDEX.md`:

```markdown
- [UI Specification](ui-specification.md) — Current module screens, interactions, states, and verification traceability.
```

### 9.4 Documentation Completion Criteria

- [ ] The UI specification is saved under the correct module folder and linked from its `INDEX.md`.
- [ ] UI applicability is explicitly recorded; actual screens and roles are supported by confirmed sources.
- [ ] Every inventory entry has a matching detailed screen specification or an explicit cross-reference.
- [ ] Journeys, permissions, validation, states, responsive behavior, and accessibility are documented where applicable.
- [ ] Shared design rules are referenced, and approved exceptions are identified.
- [ ] Requirement IDs, acceptance criteria, and verification evidence are traceable; pending work is labeled accurately.
- [ ] Revision history and dated change records reflect the delivered changes without claiming unperformed verification.

## Appendix A. Supplied shadcn/ui Technical Specification

The following source is preserved for traceability. Use Section 8 to interpret conflicting examples. Source instructions describe future implementation requirements; their inclusion does not authorize unrelated actions or require running commands during this documentation update.

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
