# UI Effects & Interaction Conditions

When building or modifying UI components in this project, adhere strictly to the following design rules, scrolling behaviors, and modal effects:

1. **Sticky Header & Search Interaction:**
   - The main Header hides automatically when scrolling down past the 3D Hero section, allowing the Advanced Search Box to take its place.
   - The Advanced Search Box snaps to the top (`sticky`) precisely when it touches the 80px offset of the Header.
   - When the Search Box becomes sticky, it transitions visually: it loses its rounded corners (`border-radius: 0`) and dynamically widens to fill the screen edge-to-edge.

2. **Precision Scroll Tracking (Sentinel Logic):**
   - The Header reappear/hide logic should NOT be hardcoded to a fixed pixel amount. Instead, use `getBoundingClientRect` on a hidden sentinel element. This calculates exactly when components touch for frame-perfect transitions across all screen sizes.

3. **Manual Header Override:**
   - A fixed circular button in the top-right allows the user to manually summon the Header while deep in the page.
   - Clicking this button pushes the sticky Search Box down perfectly by exactly 80px.
   - If the user scrolls more than 50px away from the point they clicked, the system recognizes their intent to keep scrolling and auto-hides the Header again.

4. **Slippery Scroll (Momentum):**
   - Global smooth momentum scrolling is implemented across the entire application using the `lenis/react` library.

5. **Premium Modal Interactions:**
   - **Backdrop:** Modals use a heavy backdrop blur (`bg-black/80 backdrop-blur-md`) rather than a simple opaque color.
   - **Entrance Physics:** Modals enter using Framer Motion spring physics (`type: spring`, `damping: 25`, `stiffness: 200`). They scale up slightly (`scale: 0.9` -> `1`) and slide in dynamically from the bottom (`y: 100` -> `0`).
   - **Lenis Modal Fix:** Any elements inside the Lenis-controlled application that have their own scrollbars (like an `overflow-y-auto` modal sidebar) MUST have the `data-lenis-prevent="true"` attribute attached to them. This stops the Lenis engine from hijacking the internal native scroll.

6. **Consistent UI Sizing:**
   - All inputs, dropdowns, buttons, and filters inside search components MUST maintain a mathematically precise, uniform height (`h-[54px]`) to ensure a flush, premium alignment.

7. **Close Buttons (X):**
   - Close buttons floating over images must be small but highly visible. The standard is a `w-9 h-9` solid white circle (`bg-white`) with a heavy drop shadow and a dark icon (`text-[20px]`).

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

---

# Architecture & Directory Blueprint

All code additions, refactors, and file placements MUST strictly comply with the directory structure and layer responsibilities defined in [ARCHITECTURE_MAP.md](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/ARCHITECTURE_MAP.md):
- **Frontend Layout**: Structural chrome (`Header`, `Footer`) lives in `frontend/src/components/layout/`.
- **Frontend UI**: Atomic components and showcases live in `frontend/src/components/ui/`.
- **Frontend Services**: API integrations live in `frontend/src/services/`.
- **Backend Architecture**: Maintain strict separation across `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, and `utils/`.
- **Shared Contracts**: Cross-stack DTOs and API envelopes live in `shared/types/`.


