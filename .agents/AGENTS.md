# Design System Specification (Imported from design.md)

**Name:** Human Shelter Realty | Modern SaaS UI/UX Design System  
**Ethos:** Applying a consistent, high-performing Modern SaaS design language across the entire platform while strictly preserving existing functionality, components, pages, and business logic. Balancing clarity, rapid wayfinding, data density, and accessibility with an 8px grid, standard 8px radius, and disciplined Teal-Coral chromatic palette.

---

## 1. Mandatory Workflow for Design Updates

$$\text{INSPECT} \longrightarrow \text{ANALYZE} \longrightarrow \text{PROPOSE} \longrightarrow \text{APPROVAL} \longrightarrow \text{IMPLEMENT} \longrightarrow \text{VERIFY}$$

1. **Inspect:** Examine target page/component, styles, dependencies, and reusable components. Do NOT modify any files.
2. **Analyze:** Evaluate inconsistencies, usability, responsiveness, accessibility, and functional risks.
3. **Propose:** Present a concise Design Update Proposal (Target, Existing Design, Proposed UI/UX Changes, Affected Files, Risks).
4. **Approval Gate (STOP):** Wait for explicit user approval before modifying any files.
5. **Implement:** Update only approved components/files, follow design tokens, reuse components, and preserve business logic.
6. **Verify:** Check visual consistency, responsiveness, accessibility, run build/tests, and report results.

---

## 2. Design System Tokens & Color Palette

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
- **Standard Border Radius:** `8px` (`rounded-lg`) as the standard across inputs, cards, and buttons. Sm: `4px`, Lg: `12px`, Pill: `9999px`.
- **Spacing:** Strict **8px-based system** (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Accessibility:** Minimum WCAG 2.2 AA ($\ge 4.5:1$) for standard text, AAA ($\ge 7.0:1$) for primary headings.
- **Elevation & Shadows:** Subtle shadows (`0 1px 3px rgba(0,0,0,0.1)`) paired with hairline borders (`1px border border-[#E2E8F0]`).

---

## 3. Scope Control & Role-Based Standards

### Scope Control
- **Allowed After Approval:** Visual styling, layout refinements, component styling, responsive adjustments, approved UX flows, reusable token updates.
- **NOT Allowed Without Separate Approval:** Deleting existing pages, changing routes, modifying database schemas, altering authentication/guards, changing business logic/APIs, removing features, or installing unnecessary packages.

### Role-Based Profiles
- **Administrator:** High-density data tables, administrative logs, user management, and system configuration.
- **Agent:** Property listings, inquiry triage, appointment scheduling, and task-oriented workflows.
- **Client:** Property discovery, intuitive search, clear property specs, and straightforward inquiry interactions.

---

# Superpowers Engineering Methodology & Directives

> Inherited from `obra/superpowers` (v6.3.0) adapted for Antigravity

## Core Directive: Skills Before Action

If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill before taking implementation action or writing code.

- **Process Skills First**: Process skills set the engineering discipline, then domain/UI skills carry it out.
  - New feature, component, behavior change, or project structure → `brainstorming` first.
  - Bug, unexpected behavior, or error → `systematic-debugging` first.
  - Writing code with verifiable behavior → `test-driven-development` (strict Red/Green/Refactor).
  - Multi-step implementation → `writing-plans` then `executing-plans` (or `subagent-driven-development`).
  - Pre-completion verification → `verification-before-completion`.

## Antigravity Tool Mapping

| Action Requested | Antigravity CLI Equivalent |
|---|---|
| **Dispatch Subagent** | `invoke_subagent` using built-in `TypeName`: `self` (full-capability execution) or `research` (read-only review/investigation). |
| **Task Tracking / Checklists** | Maintain a **task artifact**: `write_to_file` with `IsArtifact: true` and `ArtifactMetadata.ArtifactType: "task"`, updated incrementally with `replace_file_content`. *(Do not use `manage_task`, which manages OS background tasks).* |
| **Skill Invocation** | View and follow `.agents/skills/<skill-name>/SKILL.md` using `view_file`. |

## Hard Gates

1. **Brainstorming Gate**: Do NOT jump into code or scaffold implementation until the design path (Spike, Bounded, Architectural) is classified and approved by the human partner.
2. **TDD Gate**: Tests must be written and seen to FAIL first (Red) before writing implementation code to make them PASS (Green).
3. **Review & Verification Gate**: Never mark work complete without running automated tests, checking git status, and validating against acceptance criteria.
4. **Git Safety Gate**: NEVER execute `git push`, force-push (`--force`), or publish branches to remote git repositories under any circumstances unless the human partner explicitly commands you to push. Local commits and branches must remain strictly local until explicit user authorization.

---

# Architecture & Directory Blueprint

All code additions, refactors, and file placements MUST strictly comply with the directory structure and layer responsibilities defined in [ARCHITECTURE_MAP.md](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/ARCHITECTURE_MAP.md):
- **Frontend Layout**: Structural chrome (`Header`, `Footer`) lives in `frontend/src/components/layout/`.
- **Frontend UI**: Atomic components and showcases live in `frontend/src/components/ui/`.
- **Frontend Services**: API integrations live in `frontend/src/services/`.
- **Backend Architecture**: Maintain strict separation across `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, and `utils/`.
- **Shared Contracts**: Cross-stack DTOs and API envelopes live in `shared/types/`.
