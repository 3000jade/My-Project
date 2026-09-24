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

8. **Responsive 12-Column Flexible Grid:**
   - All major views and components MUST align to a strict 12-column CSS Grid (`grid-cols-12` with 24px/1.5rem gutters on desktop `lg:`, 8 columns on tablet `md:`, 4/1 columns on mobile `sm:`).
   - Component groupings must span integer multiples of column fractions (`col-span-12`, `col-span-8`, `col-span-6`, `col-span-4`, `col-span-3`). Elements must never orphan or break out of the 1280px (`max-w-7xl`) container bounds.

9. **Fixed Visual Hierarchy (Major Third 1.250 Typographic Scale):**
   - Strictly adhere to Bauhaus Geometric Modernist hierarchy using `Manrope` (Display/Headings), `Inter` (UI/Controls), and `JetBrains Mono` (Cadastral Telemetry & Ledger):
     - **H1 (Display):** `56px` (`3.5rem`), `line-height: 1.1`, `font-weight: 800`, `letter-spacing: -0.03em` (`Manrope`).
     - **H2 (Section Header):** `36px` (`2.25rem`), `line-height: 1.2`, `font-weight: 700`, `letter-spacing: -0.02em` (`Manrope`).
     - **H3 (Card Title):** `24px` (`1.5rem`), `line-height: 1.3`, `font-weight: 600`, `letter-spacing: -0.01em` (`Manrope`).
     - **H4 (Subhead):** `18px` (`1.125rem`), `line-height: 1.4`, `font-weight: 600` (`Inter`).
     - **Body:** `16px` (`1.0rem`), `line-height: 1.6`, `font-weight: 400` (`Inter`).
     - **Micro-Telemetry:** `12px` (`0.75rem`), `line-height: 1.4`, `font-weight: 600`, uppercase `JetBrains Mono` (`+0.12em` tracking, tabular figures `tnum 1`).

10. **Accessible Color Ratios & 60-30-10 Rule:**
    - Strictly enforce the 60-30-10 visual balance and WCAG AAA compliance:
      - **60% Dominant Base Canvas:** Distraction-free plain ground (`#FBFBFA` Light / `#070D0E` Dark).
      - **30% Structural Secondary Tone:** Deep Spruce Teal (`#0D4446` Light / `#14B8A6` Dark), card surfaces (`#FFFFFF` / `#0C1618`), and high-contrast text (`#141717` Light / `#F4F7F7` Dark, guaranteeing $\ge 15:1$ contrast ratio, exceeding WCAG AAA 7:1).
      - **10% High-Impact Accent:** Burnt Terracotta Coral (`#E76F51` Light / `#FF7D5A` Dark) reserved strictly for primary conversion CTAs, active radio chips, and key metric badges. Never use accent colors on large background fills.

11. **Predictable Navigation Patterns:**
    - Essential controls MUST reside in universally understood positions:
      - **Top Left:** Monogram identity and verified licensure badge (`[MR] MARCUS REYES`).
      - **Top Center:** Primary section anchors (`Performance Ledger`, `Active Reserves`, `Velocity Engine`, `Private Audit`).
      - **Top Right:** Utility cluster (Multi-Currency converter, Dark/Light theme switch, Primary action CTA).
    - **Search Placement:** Positioned directly below the hero section in natural reading sequence, snapping flush to top when scrolled past hero, with all controls strictly uniform at **`h-[54px]`**.

12. **Layering & Spatial Depth (Z-Axis):**
    - Enforce a 4-tier spatial stack: Layer 0 (Z:0-1, plain canvas), Layer 1 (Z:10, structural stages & photography), Layer 2 (Z:30, floating HUD chips breaking outside container bounds with negative margins, deep frosted glass blurs `backdrop-filter: blur(28px)`, and elevation drop shadows), Layer 3 (Z:100, pinned spatial performance ledger and floating header island).

13. **Micro-Interactions & Reactive Hover States:**
    - Interactive elements must provide haptic feedback using physical spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`): 3D card tilt & lift (`translateY(-8px) scale(1.015)`), magnetic button-in-button with $45^\circ$ rotating arrow icon, and interactive facade inspection pins with floating CAD spec readouts.

14. **Dual-Engine Theming & Plain Backgrounds:**
    - Backgrounds must remain plain and distraction-free (no decorative grid lines or blurred orbs in standard view). Theming is powered by zero-reflow CSS variables on `:root` and `[data-theme="dark"]`.

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


