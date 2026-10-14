---
name: modern-saas-design
description: >-
  Use whenever the user requests a design update, redesign, UI improvement, or UX enhancement
  for Human Shelter Realty. Enforces the mandatory 6-step workflow (Inspect, Analyze, Propose,
  Approval Gate, Implement, Verify), Modern SaaS design tokens (Teal #0F766E, Coral #FF6B6B),
  role-based layout profiles, and strict scope control.
---

# Human Shelter Realty | Modern SaaS UI/UX Design Workflow

## Purpose & Triggers
Activate this skill whenever the user instructs to update, improve, redesign, restyle, or refine any part of the system interface.

**Primary Directive:** Apply a consistent, high-performing Modern SaaS UI/UX design language while strictly preserving existing business logic, authentication, routes, database schemas, and functional operations.

---

## 1. Mandatory 6-Step Workflow

$$\text{INSPECT} \longrightarrow \text{ANALYZE} \longrightarrow \text{PROPOSE} \longrightarrow \text{APPROVAL} \longrightarrow \text{IMPLEMENT} \longrightarrow \text{VERIFY}$$

### Step 1: Inspect (Read-Only)
- Inspect the requested page, layout, or component along with its dependencies.
- Review existing styles, props, and shared UI components (`src/components/ui/`).
- Check related navigation links and routes for potential conflicts.
- **Do not modify any files during this step.**

### Step 2: Analyze
- Identify inconsistencies against the Modern SaaS design system.
- Evaluate usability, responsiveness, and accessibility (WCAG 2.2 AA).
- Determine exact components and tokens to upgrade.
- Identify any risks to business logic or existing state.

### Step 3: Propose
- Formulate a concise, structured **Design Update Proposal** using the required template below.

### Step 4: Approval Gate (HARD STOP)
> [!IMPORTANT]
> **STOP AND WAIT FOR EXPLICIT USER APPROVAL.**  
> Do not modify any project files until the user explicitly approves the proposal.

### Step 5: Implement
After receiving user approval:
- Update only the approved components, styles, and files.
- Follow established Modern SaaS design tokens (`#0F766E` Teal, `#FF6B6B` Coral, `#F8FAFC` Ground, `#FFFFFF` Surface, 8px radius, 8px grid).
- Reuse shared UI components; do not create duplicate primitives.
- Strictly preserve business logic, API calls, and routing.

### Step 6: Verify
- Check visual fidelity, responsiveness (mobile/tablet/desktop), and keyboard/contrast accessibility.
- Run tests (`npm test`) and build check (`npm run build`).
- Transparently report all modified files and verification results.

---

## 2. Design System Tokens & Styling Standards

```
┌────────────────────────────────────────────────────────────────────────┐
│  BASE CANVAS:      Slate Alabaster Ground (#F8FAFC)                     │
│  SURFACE ELEVATION: Pure White (#FFFFFF) with 1px Border (#E2E8F0)     │
│  PRIMARY BRAND:    Teal (#0F766E) | Hover (#115E59) | Active (#14B8A6) │
│  CONVERSION ACCENT: Coral (#FF6B6B)                                    │
│  TYPOGRAPHIC INK:  Slate 800 (#1E293B) | Slate 500 Muted (#64748B)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Color Variables & Tokens
- **Theme:** Modern SaaS
- **Primary:** Teal `#0F766E` (Hover: `#115E59`)
- **Secondary:** `#14B8A6`
- **Accent (Conversion & CTAs):** Coral `#FF6B6B`
- **Background (Canvas):** `#F8FAFC`
- **Surface (Containers, Cards, Modals):** `#FFFFFF`
- **Primary Text:** `#1E293B` (Slate 800)
- **Secondary Text:** `#64748B` (Slate 500)
- **Border:** `#E2E8F0` (Slate 200)
- **Semantic Status:**
  - Success: `#10B981` (Emerald)
  - Warning: `#F59E0B` (Amber)
  - Error / Destructive: `#DC2626` (Red 600)

### Geometry, Radii & Spacing
- **Typography:** `Inter`, `-apple-system`, `sans-serif` (Data/Cadastre: `JetBrains Mono`).
- **Standard Border Radius:** `8px` (`rounded-lg`) across inputs, cards, and buttons. Sm: `4px`, Lg: `12px`, Pill: `9999px`.
- **Spacing System:** Strict **8px-based grid** (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Control Heights:** `h-[40px]` standard, `h-[48px]` prominent, `h-[54px]` search console.
- **Elevation & Shadows:** Subtle shadows (`0 1px 3px rgba(0,0,0,0.1)`) paired with hairline borders (`1px border border-[#E2E8F0]`).

---

## 3. Required Agent Response Template (Step 3)

Before modifying any project files, present the proposal in this exact format:

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

---

## 4. Scope Control & Role-Based Standards

### Scope Control
- **Allowed After Approval:** Visual styling, layout refinements, component styling, responsive adjustments, approved UX flows, reusable token updates.
- **NOT Allowed Without Separate Approval:** Deleting existing pages, changing routes, modifying database schemas, altering authentication/guards, changing business logic/APIs, removing features, or installing unnecessary packages.

### Role-Based Layout Profiles
- **Administrator:** High-density data tables, administrative logs, user management, and system configuration.
- **Agent:** Property listings, inquiry triage, appointment scheduling, and task-oriented workflows.
- **Client:** Property discovery, intuitive search, clear property specs, and straightforward inquiry interactions.

---

## 5. Verification Checklist (Step 6)

After completing an approved design update, execute and document this checklist:

- [ ] Design follows the Modern SaaS theme.
- [ ] Teal (`#0F766E`) and Coral (`#FF6B6B`) colors applied consistently.
- [ ] Standard border radius is 8px (`rounded-lg`).
- [ ] Existing reusable components leveraged without redundant duplication.
- [ ] Responsive layouts work correctly across mobile, tablet, and desktop.
- [ ] Forms and interactive controls remain fully functional.
- [ ] Navigation, breadcrumbs, and routes are preserved.
- [ ] Existing data operations and business logic are untouched.
- [ ] No unrelated files were modified.
- [ ] Build (`npm run build`) and test suites pass without regressions.
- [ ] All changed files and verification results are reported.
