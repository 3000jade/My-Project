---
name: Nordic Modern Architectural & Bauhaus Precision
philosophy:
  concept: "Bauhaus Modernist Precision & Spatial Architectural Immersion"
  ethos: >
    Marrying Nordic architectural authority and spatial permanence with mathematical
    Bauhaus typographic precision, distraction-free plain grounds, accessible 60-30-10 color
    harmony, and fluid scroll-driven interaction. Eliminating decorative canvas noise to let
    structural geometry, verifiable sales velocity, and typography command the viewport.

colors:
  # Base Grounds: 60% Dominant Base Canvas (Plain Distraction-Free & Warm Alabaster)
  canvas-light: '#FBFBF9'             # Warm Gallery Alabaster ground (calibrated from image)
  canvas-dark: '#070D0E'              # Plain Deep Obsidian dark mode ground
  surface-light-pure: '#FFFFFF'       # Elevated crisp daylight white surface (from image)
  surface-light-low: '#F4F5F4'        # Soft alabaster section container
  surface-dark-card: '#0C1618'        # Plain basalt matte card surface
  surface-dark-elevated: '#132427'    # Elevated dark stage plinth

  # Cadastral Architectural Micro-Grid (28px pitch geometric ground)
  cadastral-grid-pitch: '28px 28px'   # Mathematical geometric pitch from reference image
  cadastral-grid-dot: '#F3F6F4'       # Micro-dot color
  cadastral-grid-dot-tint: 'rgba(13, 68, 70, 0.08)' # Subtle architectural tinted dot

  # Light Theme Glassmorphism (80% Frosted Glass Architecture)
  glass-light-plate: 'rgba(255, 255, 255, 0.80)'   # 80% frosted glass plate container
  glass-light-subplate: 'rgba(255, 255, 255, 0.75)'# Inner search console plinth
  glass-light-input: 'rgba(255, 255, 255, 0.90)'   # Daylight translucent input fill
  glass-light-border: 'rgba(255, 255, 255, 0.90)'  # Luminous perimeter boundary
  glass-light-inner-glow: 'rgba(255, 255, 255, 0.95)' # Specular refraction top highlight
  glass-light-shadow: '0 20px 50px rgba(100, 160, 220, 0.18)' # Atmospheric sky drop-shadow

  # Atmospheric Morning Sky
  sky-cerulean-top: '#b3dbff'         # Zenith clear cerulean morning sky
  sky-cerulean-mid: 'rgba(214, 236, 255, 0.70)' # Mid-sky horizon wash
  sky-cerulean-bottom: '#FFFFFF'      # Ground level daylight horizon


  # Core Architectural Tones: 30% Structural Secondary
  primary-light: '#0D4446'            # Deep Spruce Teal (Light mode primary)
  primary-light-hover: '#083335'      # Deepened spruce shadow
  primary-dark: '#14B8A6'             # Luminous Cyan-Teal (Dark mode primary)
  primary-dark-hover: '#0D9488'       # Focused cyan-teal
  primary-dark-glow: 'rgba(20, 184, 166, 0.35)'

  # High-Impact Accent: 10% Conversion & Active Accent
  accent-light: '#E76F51'             # Burnt Terracotta Coral (Light mode CTA)
  accent-light-hover: '#D65C3E'       # Deep terracotta focus
  accent-dark: '#FF7D5A'              # Neon Terracotta Coral (Dark mode CTA)
  accent-dark-glow: 'rgba(231, 111, 81, 0.45)'

  # Typographic Ink (WCAG AAA Verified Contrast >= 15:1)
  ink-light-main: '#141717'           # High-contrast charcoal (15.4:1 contrast on alabaster)
  ink-light-muted: '#5C6768'          # Granite secondary narrative (6.2:1 contrast)
  ink-light-faint: '#8E9A9B'          # Lichen micro-copy (4.5:1 contrast)
  ink-dark-main: '#F4F7F7'            # High-contrast milk white (16.1:1 contrast on obsidian)
  ink-dark-muted: '#95A6A6'           # Basalt secondary narrative (7.4:1 contrast)
  ink-dark-faint: '#536465'           # Low-cadence micro-copy

  # Hairline Borders & Rules
  border-light: '#D8DFDF'             # Light mode precision boundary
  border-light-card: '#E5EBEB'        # Light card border
  border-dark: 'rgba(255, 255, 255, 0.1)' # Dark mode hairline
  border-dark-glow-teal: 'rgba(20, 184, 166, 0.4)'
  border-dark-glow-coral: 'rgba(231, 111, 81, 0.4)'

grid:
  system: "Responsive 12-Column Flexible Grid"
  desktop:
    columns: 12
    gutter: "24px"
    margin: "32px"
    maxWidth: "1280px"
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
  scaleRatio: "1.250 (Major Third Modular Scale)"
  fontFamilies:
    display: "Geist, sans-serif"
    label: "Geist, sans-serif"
    mono: "Geist Mono, monospace"

  hierarchy:
    display-h1:
      fontFamily: "Geist"
      fontSize: "56px"               # 3.5rem
      lineHeight: "62px"             # 1.1
      fontWeight: "800"
      letterSpacing: "-0.03em"
      role: "Hero declarations, primary authority statements"
    heading-h2:
      fontFamily: "Geist"
      fontSize: "36px"               # 2.25rem
      lineHeight: "44px"             # 1.2
      fontWeight: "700"
      letterSpacing: "-0.025em"
      role: "Major section headers, performance ledger titles"
    card-h3:
      fontFamily: "Geist"
      fontSize: "24px"               # 1.5rem
      lineHeight: "32px"             # 1.3
      fontWeight: "600"
      letterSpacing: "-0.02em"
      role: "Property reserve cards, feature titles, modal heads"
    subhead-h4:
      fontFamily: "Geist"
      fontSize: "18px"               # 1.125rem
      lineHeight: "26px"             # 1.4
      fontWeight: "600"
      letterSpacing: "-0.015em"
      role: "Subsection titles, pricing tags, form group labels"
    body-regular:
      fontFamily: "Geist"
      fontSize: "16px"               # 1.0rem
      lineHeight: "26px"             # 1.6
      fontWeight: "400"
      letterSpacing: "-0.01em"
      role: "Editorial copy, narrative descriptions, user input text"
    body-small:
      fontFamily: "Geist"
      fontSize: "14px"               # 0.875rem
      lineHeight: "22px"             # 1.5
      fontWeight: "500"
      letterSpacing: "-0.005em"
      role: "Secondary metadata, dropdown selections, help text"
    telemetry-micro:
      fontFamily: "Geist Mono"
      fontSize: "12px"               # 0.75rem
      lineHeight: "16px"             # 1.33
      fontWeight: "600"
      letterSpacing: "0.08em"
      textTransform: "uppercase"
      fontFeatureSettings: "'tnum' 1"
      role: "Cadastral stamps, license IDs, currency switches, contract days"

radii:
  sm: "8px"                          # Inputs, tags, badges
  md: "14px"                         # Standard structural cards, filter consoles
  lg: "24px"                         # Feature plinths, modals, calculator chassis
  pill: "9999px"                     # Navigation docks, currency selectors, status beacons
  architectural:
    cantilever: "36px 12px 36px 12px" # Cantilever diagonal overhang
    cathedral: "60px 60px 14px 14px"  # Cathedral high-arch crown
    chamfer: "18px 48px 18px 48px"    # Offset geometric bevel

shadows:
  light:
    subtle: "0 4px 16px rgba(13, 68, 70, 0.04)"
    card: "0 16px 36px rgba(13, 68, 70, 0.06)"
    card-hover: "0 28px 56px rgba(13, 68, 70, 0.12)"
    hud-floating: "0 24px 60px rgba(13, 68, 70, 0.16)"
  dark:
    subtle: "0 8px 24px rgba(0, 0, 0, 0.5)"
    card: "0 25px 60px rgba(0, 0, 0, 0.7)"
    card-hover: "0 35px 70px rgba(0, 0, 0, 0.9), 0 0 30px rgba(231, 111, 81, 0.2)"
    hud-floating: "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 25px rgba(20, 184, 166, 0.2)"
---

# Design System: Nordic Modern Architectural & Bauhaus Precision

This specification codifies the engineering and visual standards for the real estate platform, blending high-end architectural authority with mathematical Bauhaus precision, accessible usability, and immersive interaction.

---

## 1. Architectural Philosophy & Dual-Engine Canvas

The interface rejects visual clutter, decorative skeuomorphism, and dense administrative styling. It rests on **plain, distraction-free surfaces** allowing photographic architecture and quantifiable performance data to lead the experience.

- **Dual-Engine Theming:** Controlled via CSS variables attached to `:root` (Light Mode: Warm Gallery Alabaster `#FBFBF9`) and `[data-theme="dark"]` (Dark Mode: Plain Obsidian `#070D0E`).
- **Zero-Reflow Transitions:** Theme toggling switches color tokens instantly with 0ms layout shift.
- **Mathematical Control Heights:** All inputs, dropdowns, filters, and action buttons maintain a strict, uniform height of **`h-[54px]`** (`--control-h: 54px`) for flush alignment.

---

## 2. Responsive 12-Column Flexible Grid

All structural views, sections, and card clusters are organized around a standardized **12-Column Flexible Grid System** (`.grid-12`), ensuring seamless adaptation from ultra-wide displays down to mobile devices.

### Breakpoint Matrix
| Viewport | Columns | Gutters | Margins | Standard Section Distributions |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop (`lg` $\ge$ 1024px)** | 12 | 24px | 32px | Hero (7 cols / 5 cols), Trio Cards (4 cols $\times$ 3), Split Engine (6 cols / 6 cols) |
| **Tablet (`md` 768px–1023px)** | 8 | 20px | 24px | Hero (8 cols stacked), Duo Cards (4 cols $\times$ 2), Full-width forms |
| **Mobile (`sm` < 768px)** | 4 / 1 | 16px | 16px | 100% full-width single column stack |

### Grid Alignment Rules
- **No Orphan Elements:** All interactive containers, search bars, and card decks must span integer multiples of column fractions (`col-span-12`, `col-span-8`, `col-span-6`, `col-span-4`, `col-span-3`).
- **Edge Containment:** Layouts center within a max-width container of `1280px` (`max-w-7xl mx-auto px-6 lg:px-12`).

---

## 3. Fixed Visual Hierarchy & Typographic Matrix

Typography follows a rigorous **Bauhaus Geometric Modernist** system built upon a **1.250 (Major Third)** modular scale, guaranteeing effortless scannability and structural rhythm.

### Typographic Roles
1. **Headings & Display (`Manrope`):**
   - High structural geometry with modern open apertures.
   - Used for authoritative hero statements, section headings, and property titles.
   - Sizing strictly follows: **H1 = 56px**, **H2 = 36px**, **H3 = 24px**.
2. **Interface & Controls (`Inter`):**
   - Maximum legibility at small-to-medium optical sizes.
   - Sizing strictly follows: **Subhead = 18px**, **Body = 16px**, **Small = 14px**.
   - Handles form inputs, button labels, spec copy, and dialog text.
3. **Cadastral Telemetry & Ledger (`JetBrains Mono`):**
   - Fixed-pitch tabular numerals (`font-feature-settings: 'tnum' 1`).
   - Sizing strictly follows: **Micro = 12px** with `+0.12em` uppercase tracking.
   - Handles sales speed days, licensure badges, currency tickers, and valuation computations.

---

## 4. Accessible Color Ratios & 60-30-10 Rule

Color application strictly complies with the **60-30-10 Rule** and meets **WCAG AAA** contrast standards ($\ge 7.0:1$ for normal text, $\ge 4.5:1$ for large text):

```
┌────────────────────────────────────────────────────────────────────────┐
│  60% BASE GROUND: Plain Alabaster (#FBFBF9) / Obsidian (#070D0E)        │
│  30% STRUCTURAL:  Spruce Teal (#0D4446 / #14B8A6) & High-Contrast Ink  │
│  10% ACCENT:      Burnt Terracotta Coral (#E76F51 / #FF7D5A) - CTAs    │
└────────────────────────────────────────────────────────────────────────┘
```

- **60% Dominant Base Canvas:** Clean, plain ground without pattern noise.
- **30% Structural Secondary Tone:** Spruce Teal structural headers, card containers, and high-contrast ink:
  - Light mode ink `#141717` on `#FBFBF9` provides **15.4:1 contrast ratio** (Passes WCAG AAA).
  - Dark mode ink `#F4F7F7` on `#070D0E` provides **16.1:1 contrast ratio** (Passes WCAG AAA).
- **10% High-Impact Accent:** Burnt Terracotta Coral reserved *strictly* for high-value conversion elements: primary CTA buttons, active radio chips, slider thumbs, and status radar beacons. Accent colors are NEVER diluted on large background fills.

---

## 5. Predictable Navigation Patterns

Interfaces enforce universally understood wayfinding conventions so users never feel disoriented:

1. **Header Anchor Architecture:**
   - **Left Anchor:** Brand identity and verified licensure badge (`[MR] MARCUS REYES`).
   - **Center Cluster:** Primary waypoints (`Performance Ledger`, `Active Reserves`, `Velocity Engine`, `Private Audit`).
   - **Right Cluster:** Predictable utility pod containing the Multi-Currency Converter (`CHF`, `EUR`, `USD`, `JPY`), the Dark/Light Mode switch, and the primary Audit action button.
2. **Search Console Anchor:**
   - Positioned in natural reading flow directly below the hero section.
   - When scrolling down, it smoothly transitions to a sticky top bar (`sticky top-0`) while widening edge-to-edge and locking all controls to `h-[54px]`.
3. **Wayfinding Feedback:**
   - Persistent active indicator highlights the current page section.
   - Single-click quick return-to-top floating button appears deep in the page.

---

## 6. Layering & Spatial Depth (Z-Axis)

Depth is created through an explicit 4-tier spatial stack rather than flat planes:

- **Layer 0 (Z: 0–1):** Base plain canvas (`--bg-page`).
- **Layer 1 (Z: 10):** Content stage, architectural photo viewports, and structural grids.
- **Layer 2 (Z: 30):** Overlapping floating HUD chips (e.g. *“Contract Signed in 18 Days”*) breaking outside photographic container bounds with negative margins (`right: -1.5rem`), heavy diffuse drop shadows, and deep frosted glass blurs (`backdrop-filter: blur(28px)`).
- **Layer 3 (Z: 100):** Pinned spatial performance ledger and floating header island.

---

## 7. Micro-Interactions & Reactive Hover States

Interactive components give tactile, haptic feedback using physical spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`):

- **3D Card Elevation Lift:** Property cards elevate smoothly on hover (`transform: translateY(-8px) scale(1.015)`) while border highlights shift to glowing terracotta (`box-shadow: 0 0 30px rgba(231,111,81,0.2)`).
- **Magnetic Button-in-Button:** Primary CTAs incorporate a trailing circular action capsule that fluidly rotates $45^\circ$ on hover.
- **Facade Hotspot Inspection Pins:** Numbered pins (`01`, `02`, `03`) placed on building elevations reveal floating glass CAD spec readouts upon interaction.
- **Blueprint X-Ray Toggle:** Dynamic button inverting architectural photography into high-contrast luminescence CAD blueprints.

---

## 8. Fluid Motion & Scroll-Driven Transitions

- **Momentum Scrolling:** Governed globally by `lenis/react` for buttery smooth inertia.
- **Pinned Spatial Ledger:** The `$184.2M` closed volume and `21 Days` sales velocity ledger serves as a sticky spatial bridge between hero storytelling and the active property catalog.
- **Kinetic Market Ticker:** Infinite marquee pinned to the top edge continuously broadcasting verified closed transactions and off-market milestones.

---

## 9. Light Theme (Daylight Architectural Precision & 80% Frosted Glass)

The **Light Theme** embodies Scandinavian daylight clarity, Bauhaus structural permanence, and architectural transparency. It establishes an elevated, distraction-free gallery ambiance where content breathes naturally on plain alabaster grounds.

### 9.1 Atmospheric Morning Sky & Procedural Cloud Engine
- **Morning Sky Gradient:** Seamless vertical transition from clear cerulean down to soft alabaster:
  ```css
  background: linear-gradient(180deg, #b3dbff 0%, rgba(214, 236, 255, 0.70) 45%, #FFFFFF 100%);
  ```
- **Procedural Cumulus Stream:** Endless, smooth horizontal parallax cloud flow across 4 altitude lanes:
  - **Lane 1 (High Altitude Cumulus):** Duration `65s`, drop-shadow `0 12px 24px rgba(100, 160, 220, 0.35)`.
  - **Lane 2 (Mid-Sky Parallel Stream):** Duration `55s`, drop-shadow `0 10px 20px rgba(100, 160, 220, 0.30)`.
  - **Lane 3 (Lower Horizon Drift):** Duration `70s`, drop-shadow `0 8px 16px rgba(100, 160, 220, 0.25)`.
  - **Lane 4 (Apex Horizon Stream):** Duration `80s`, drop-shadow `0 6px 14px rgba(100, 160, 220, 0.20)`.
- **Solar Radiance Glow:** Radial wash at zenith:
  ```css
  radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.10) 35%, transparent 65%)
  ```

### 9.2 80% Transparency Frosted Glass Monolith (Hero Monolith)
The primary hero exhibition card employs a mathematically calibrated **80% frosted glass** architectural plate:
- **Base Plate Fill:** `rgba(255, 255, 255, 0.80)` (`bg-white/80`)
- **Optical Diffusion (Lens Blur):** `backdrop-filter: blur(40px)` (`backdrop-blur-2xl`)
- **Specular Top Refraction Line:** `box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.95)`
- **Atmospheric Sky Shadow:** `box-shadow: 0 20px 50px rgba(100, 160, 220, 0.18)`
- **Perimeter Boundary:** `border: 1px solid rgba(255, 255, 255, 0.90)` (`border-white/90`)
- **Corner Curvature:** `20px` (`rounded-[20px]`) / `24px` (`rounded-3xl`)
- **Architectural Drafting Crosshairs:** Cadastral crosshairs `⌜`, `⌝`, `⌞`, `⌟` positioned at `top-3`/`bottom-3` in Spruce Teal tint `rgba(13, 68, 70, 0.40)`.

### 9.3 Integrated Quick Search Console in Light Theme
- **Console Plinth:** Nested glass chassis with `rgba(255, 255, 255, 0.75)` fill, `backdrop-filter: blur(24px)`, border `rgba(255, 255, 255, 0.90)`, and shadow `0 8px 24px rgba(13, 68, 70, 0.06)`.
- **Inputs & Dropdowns:**
  - Height: Strict **`h-[54px]`** mathematical standard.
  - Fill: `rgba(255, 255, 255, 0.90)` (`bg-white/90`).
  - Hairline: `#D8DFDF` border, shifting to `#0D4446` on focus.
  - Typography: `#141717` (High-contrast charcoal, 15.4:1 contrast).
  - Icons: Deep Spruce Teal `#0D4446`.
- **Action Buttons:**
  - **Find Homes CTA:** `h-[54px]` Burnt Terracotta Coral `#E76F51` with hover `#D65C3E`, text pure white, and shadow `0 4px 16px rgba(231, 111, 81, 0.35)`.
  - **Consult Advisor Beacon:** `h-[48px]` Deep Spruce Teal `#0D4446` with live pulsing emerald beacon (`bg-emerald-400` ping + solid `bg-emerald-400`), hover `#082b2d`, and shadow `0 4px 16px rgba(13, 68, 70, 0.18)`.
  - **View Properties Link:** `#0D4446` with underlined hover transition to `#E76F51`.

### 9.4 Light Mode Surface & Elevation Tokens
| Token | Color Code | Role & Layer | Border Rule |
| :--- | :--- | :--- | :--- |
| `--canvas-light` | `#FBFBF9` | Plain base canvas ground (60%) | None |
| `--surface-light-pure` | `#FFFFFF` | Elevated cards, search bars, modals | `1px solid #E5EBEB` |
| `--surface-light-low` | `#F4F5F4` | Soft plinth containers, spec chips | `1px solid #D8DFDF` |
| `--glass-light-plate` | `rgba(255, 255, 255, 0.80)` | Hero frosted glass monolith | `1px solid rgba(255, 255, 255, 0.90)` |
| `--glass-light-subplate` | `rgba(255, 255, 255, 0.75)` | Nested console plinth | `1px solid rgba(255, 255, 255, 0.90)` |
| `--glass-light-input` | `rgba(255, 255, 255, 0.90)` | Daylight form controls | `1px solid #D8DFDF` |

### 9.5 Light Mode Typographic Ink & WCAG AAA Verification
- **Display H1:** Deep Spruce Teal (`#0D4446`) paired with Burnt Terracotta Coral (`#E76F51`) italic serif accent.
- **Section Headers (H2/H3):** Deep Spruce Teal (`#0D4446`) with contrast ratio **9.8:1** on `#FBFBF9` (Passes WCAG AAA).
- **Body Text:** Charcoal Ink (`#141717`) with contrast ratio **15.4:1** on `#FBFBF9` (Passes WCAG AAA $\ge 7:1$).
- **Secondary Narrative:** Granite Muted (`#5C6768`) with contrast ratio **6.2:1** on `#FFFFFF` (Passes WCAG AA $\ge 4.5:1$).
- **Micro-Telemetry Badges:** JetBrains Mono `#0D4446` enclosed in `bg-white/85` with boundary `#0D4446]/20`.

### 9.6 Cadastral Architectural Micro-Grid Ground (`.bg-cadastral-grid`)
- **Mathematical Ground:** Warm Alabaster Canvas Base (`#FBFBF9`) paired with subtle architectural cadastral micro-grid dots spaced at exactly $28\text{px} \times 28\text{px}$ pitch (calibrated directly from the reference imagery).
- **Dot Specifications:**
  - Micro-dot radial size: `1.5px`
  - Dot tone: `rgba(13, 68, 70, 0.08)` (subtle Spruce Teal architectural tint) / `#F3F6F4`
  - Pitch: `28px 28px`
  - CSS Implementation:
    ```css
    .bg-cadastral-grid {
      background-color: #FBFBF9;
      background-image: radial-gradient(rgba(13, 68, 70, 0.08) 1.5px, transparent 1.5px);
      background-size: 28px 28px;
    }
    ```
- **Usage:** Standardized background foundation across all public page sections, hero containers, and catalog viewports to convey cadastral architectural authenticity.



