# Design System Specification (Imported from design.md)

**Name:** Nordic Modern Architectural & Bauhaus Precision  
**Ethos:** Marrying Nordic architectural authority and spatial permanence with mathematical Bauhaus typographic precision, distraction-free plain grounds, accessible 60-30-10 color harmony, and fluid scroll-driven interaction. Eliminating decorative canvas noise to let structural geometry, verifiable sales velocity, and typography command the viewport.

---

## 1. Dual-Engine Color Tokens & 60-30-10 Palette

Color application strictly complies with the **60-30-10 Rule** and meets **WCAG AAA** contrast standards ($\ge 7.0:1$ for normal text, $\ge 4.5:1$ for large text):

> [!IMPORTANT]
> **Public Interface Standard (Daylight Light Theme):**  
> All public-facing views (`Home`, `Properties`, `About`, `HowWeWork`, `Partner`, `Contact`, `ListingDetail`) are standardized exclusively on the **Daylight Light Theme** (`#FBFBF9` ground, `#FFFFFF` card surfaces, `#0D4446` Spruce Teal, `#E76F51` Burnt Terracotta Coral). Dark mode toggles are permanently disabled on public routes.

```
┌────────────────────────────────────────────────────────────────────────┐
│  60% BASE GROUND: Plain Alabaster (#FBFBF9) / Obsidian (#070D0E)        │
│  30% STRUCTURAL:  Spruce Teal (#0D4446 / #14B8A6) & High-Contrast Ink  │
│  10% ACCENT:      Burnt Terracotta Coral (#E76F51 / #FF7D5A) - CTAs    │
└────────────────────────────────────────────────────────────────────────┘
```

### Color Variables & Tokens
- **60% Base Canvas Grounds (Plain & Distraction-Free):**
  - `--canvas-light`: `#FBFBF9` (Warm Gallery Alabaster light mode ground)
  - `--canvas-dark`: `#070D0E` (Plain Deep Obsidian dark mode ground)
  - `--surface-light-pure`: `#FFFFFF` (Elevated crisp daylight white surface)
  - `--surface-light-low`: `#F4F5F4` (Soft alabaster section container)
  - `--surface-dark-card`: `#0C1618` (Plain basalt matte card surface)
  - `--surface-dark-elevated`: `#132427` (Elevated dark stage plinth)
  - `--cadastral-grid-pitch`: `28px 28px` (28px geometric architectural grid)
  - `--cadastral-grid-dot`: `rgba(13, 68, 70, 0.08)` (Micro-dot tint)
  - `--glass-light-plate`: `rgba(255, 255, 255, 0.80)` (80% frosted glass plate container)
  - `--glass-light-subplate`: `rgba(255, 255, 255, 0.75)` (Nested console plinth)
  - `--glass-light-input`: `rgba(255, 255, 255, 0.90)` (Daylight form controls)
  - `--glass-light-border`: `rgba(255, 255, 255, 0.90)` (Luminous perimeter rim)
  - `--glass-light-inner-glow`: `rgba(255, 255, 255, 0.95)` (Specular top refraction)
- **30% Core Architectural Tones:**
  - `--primary-light`: `#0D4446` (Deep Spruce Teal)
  - `--primary-light-hover`: `#083335`
  - `--primary-dark`: `#14B8A6` (Luminous Cyan-Teal)
  - `--primary-dark-hover`: `#0D9488`
  - `--primary-dark-glow`: `rgba(20, 184, 166, 0.35)`
- **10% High-Impact Accent (Conversion & CTAs only):**
  - `--accent-light`: `#E76F51` (Burnt Terracotta Coral)
  - `--accent-light-hover`: `#D65C3E`
  - `--accent-dark`: `#FF7D5A` (Neon Terracotta Coral)
  - `--accent-dark-glow`: `rgba(231, 111, 81, 0.45)`
- **Typographic Ink (WCAG AAA Verified Contrast $\ge$ 15:1):**
  - `--ink-light-main`: `#141717` (15.4:1 contrast on Alabaster)
  - `--ink-light-muted`: `#5C6768` (6.2:1 contrast)
  - `--ink-light-faint`: `#8E9A9B` (4.5:1 contrast)
  - `--ink-dark-main`: `#F4F7F7` (16.1:1 contrast on Obsidian)
  - `--ink-dark-muted`: `#95A6A6` (7.4:1 contrast)
  - `--ink-dark-faint`: `#536465`
- **Hairline Borders & Boundaries:**
  - `--border-light`: `#D8DFDF`
  - `--border-light-card`: `#E5EBEB`
  - `--border-dark`: `rgba(255, 255, 255, 0.1)`
  - `--border-dark-glow-teal`: `rgba(20, 184, 166, 0.4)`
  - `--border-dark-glow-coral`: `rgba(231, 111, 81, 0.4)`

---

## 2. Responsive 12-Column Flexible Grid

- **Desktop (`lg:` $\ge$ 1024px):** 12 columns, 24px gutters, 32px margin, `max-w-7xl` (1280px max-width).
- **Tablet (`md:` 768px–1023px):** 8 columns, 20px gutters, 24px margin.
- **Mobile (`sm:` < 768px):** 4 columns / 1 column stack, 16px gutters, 16px margin.
- **Grid Alignment:** Interactive containers, search bars, and card decks must span integer multiples of column fractions (`col-span-12`, `col-span-8`, `col-span-6`, `col-span-4`, `col-span-3`). Elements must never orphan or break out of bounds.

---

## 3. Fixed Visual Hierarchy & Typographic Matrix (Major Third 1.250)

Strictly adhere to Bauhaus Geometric Modernist hierarchy:
- **H1 (Display - `Manrope`):** `56px` (`3.5rem`), `line-height: 1.1` (`62px`), `font-weight: 800`, `letter-spacing: -0.03em`. Hero declarations & primary authority statements.
- **H2 (Section Header - `Manrope`):** `36px` (`2.25rem`), `line-height: 1.2` (`44px`), `font-weight: 700`, `letter-spacing: -0.02em`. Major section headers & ledger titles.
- **H3 (Card Title - `Manrope`):** `24px` (`1.5rem`), `line-height: 1.3` (`32px`), `font-weight: 600`, `letter-spacing: -0.01em`. Property reserve cards, feature titles, modal heads.
- **H4 (Subhead - `Inter`):** `18px` (`1.125rem`), `line-height: 1.4` (`26px`), `font-weight: 600`, `letter-spacing: -0.005em`. Subsection titles, pricing tags, form group labels.
- **Body (Regular - `Inter`):** `16px` (`1.0rem`), `line-height: 1.6` (`26px`), `font-weight: 400`, `letter-spacing: 0em`. Editorial copy, narrative descriptions, user inputs.
- **Body (Small - `Inter`):** `14px` (`0.875rem`), `line-height: 1.5` (`22px`), `font-weight: 500`, `letter-spacing: 0.01em`. Secondary metadata, dropdown selections, help text.
- **Micro-Telemetry (`JetBrains Mono`):** `12px` (`0.75rem`), `line-height: 1.33` (`16px`), `font-weight: 600`, uppercase, `letter-spacing: 0.12em`, `font-feature-settings: 'tnum' 1`. Cadastral stamps, license IDs, currency switches, contract velocity metrics.

---

## 4. Radii & Shadow Profiles

- **Radii Tokens:**
  - `sm`: `8px` (Inputs, tags, badges)
  - `md`: `14px` (Standard structural cards, filter consoles)
  - `lg`: `24px` (Feature plinths, modals, calculator chassis)
  - `pill`: `9999px` (Navigation docks, currency selectors, status beacons)
  - Architectural: Cantilever `36px 12px 36px 12px`, Cathedral `60px 60px 14px 14px`, Chamfer `18px 48px 18px 48px`.
- **Shadow Profiles:**
  - Light Subtle: `0 4px 16px rgba(13, 68, 70, 0.04)`
  - Light Card: `0 16px 36px rgba(13, 68, 70, 0.06)`
  - Light Card Hover: `0 28px 56px rgba(13, 68, 70, 0.12)`
  - Dark Card: `0 25px 60px rgba(0, 0, 0, 0.7)`
  - Dark Card Hover: `0 35px 70px rgba(0, 0, 0, 0.9), 0 0 30px rgba(231, 111, 81, 0.2)`

---

## 5. UI Interaction & Scrolling Conditions

1. **Sticky Header & Search Interaction:**
   - The main Header hides automatically when scrolling down past the 3D Hero section, allowing the Advanced Search Box to take its place.
   - The Advanced Search Box snaps to the top (`sticky`) precisely when it touches the 80px offset of the Header.
   - When the Search Box becomes sticky, it transitions visually: it loses its rounded corners (`border-radius: 0`) and dynamically widens to fill the screen edge-to-edge.

2. **Precision Scroll Tracking (Sentinel Logic):**
   - Use `getBoundingClientRect` on a hidden sentinel element rather than hardcoded pixel amounts for frame-perfect transitions.

3. **Manual Header Override:**
   - A fixed circular button in the top-right allows the user to manually summon the Header deep in the page, pushing the sticky Search Box down by 80px. Scrolling >50px away auto-hides it.

4. **Slippery Scroll (Momentum):**
   - Global smooth momentum scrolling is implemented across the entire application using `lenis/react`.

5. **Premium Modal Interactions:**
   - **Backdrop:** Heavy backdrop blur (`bg-black/80 backdrop-blur-md`).
   - **Entrance Physics:** Framer Motion spring physics (`type: spring`, `damping: 25`, `stiffness: 200`, `scale: 0.9` -> `1`, `y: 100` -> `0`).
   - **Lenis Modal Fix:** Any elements inside the Lenis-controlled application that have their own scrollbars (like an `overflow-y-auto` modal sidebar) MUST have `data-lenis-prevent="true"`.

6. **Consistent UI Sizing:**
   - All inputs, dropdowns, buttons, and filters inside search components MUST maintain a mathematically precise, uniform height (**`h-[54px]`**).

7. **Close Buttons (X):**
   - Close buttons floating over images are `w-9 h-9` solid white circles (`bg-white`) with drop shadow and dark icon (`text-[20px]`).

8. **Layering & Spatial Depth (4-Tier Z-Axis):**
   - **Layer 0 (Z: 0–1):** Base plain canvas (`--bg-page`).
   - **Layer 1 (Z: 10):** Content stage, architectural photo viewports, structural grids.
   - **Layer 2 (Z: 30):** Overlapping floating HUD chips with negative margins, deep frosted glass blurs (`backdrop-filter: blur(28px)`), and elevation drop shadows.
   - **Layer 3 (Z: 100):** Pinned spatial performance ledger and floating header island.

9. **Micro-Interactions & Reactive Hover States:**
   - Tactile spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`): 3D card elevation lift (`translateY(-8px) scale(1.015)`), magnetic button-in-button with $45^\circ$ rotating icon, and interactive facade inspection pins with floating CAD spec readouts.

10. **Dual-Engine Theming & Plain Backgrounds:**
    - Backgrounds must remain plain and distraction-free (no decorative grid lines or blurred orbs in standard view). Theming is powered by zero-reflow CSS variables on `:root` and `[data-theme="dark"]`.
    - **Tailwind v4 Dark Mode Scoping:** In Tailwind CSS v4, `dark:` variants evaluate against OS `@media (prefers-color-scheme: dark)` by default. To prevent system dark mode from breaking light theme pages, `index.css` MUST specify `@custom-variant dark (&:where(.dark, .dark *));`. Public components must never leave stray `dark:` utility classes.

11. **Category Plinth Iconification:**
    - Property category navigators (e.g. Condominium, Suburban Estate, Townhouse, Land) MUST utilize crisp, geometric architectural SVG icons on clean daylight plinths (`#FFFFFF` on `#FBFBF9`) rather than stock lifestyle photos or verbose narrative text blocks.

12. **Search Console & Frosted Glass Chassis:**
    - Quick Search and filter bars must be positioned directly beneath the hero monolith (not trapped within hero viewports), utilizing an 80% frosted glass plate (`rgba(255, 255, 255, 0.80)` / `backdrop-blur-md`), specular white perimeter borders, and uniform `h-[54px]` interactive inputs.

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

---

## Real Estate & RESO Integration Rules
- When processing property search requests, consult `.agent/skills/reso-query-expert/SKILL.md`.
- Use the `reso` MCP server to interact with real estate listing endpoints.
- Enforce RESO Data Dictionary field naming conventions (`ListPrice`, `StandardStatus`, `LivingArea`, `ListingKey`).
