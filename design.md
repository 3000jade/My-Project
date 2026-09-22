---
name: Scandinavian Soft Functionalism (Alvar Aalto Inspired)
philosophy:
  concept: "Organic Modernism & Humanized Functionalism"
  ethos: >
    Marrying architectural discipline and cadastral authority with tactile warmth,
    generous daylight, and natural ergonomics. Moving away from clinical administrative
    ledgers in favor of bent birch contours, soft fog grounds, and intuitive clarity.

colors:
  # Base Natural Ground & Elevated Surfaces
  canvas-fog: '#f4f5f2'              # Soft Nordic fog-linen canvas
  surface-pure: '#ffffff'            # Elevated white daylight plane
  surface-birch: '#ecefe9'           # Light birch/moss wash container
  surface-card: '#ffffff'            # Daylight plinth card surface

  # Core Architectural Tones (Pine & Amber)
  primary: '#183d3b'                 # Deep Nordic Pine Spruce
  primary-hover: '#122e2c'           # Deep moss shadow
  primary-subtle: '#e8eeea'          # Birch forest mist
  on-primary: '#ffffff'

  secondary: '#c4683c'               # Warm fired Nordic Amber / Terracotta
  secondary-hover: '#b0572d'         # Fired clay focus
  secondary-subtle: '#fcf1eb'        # Amber dawn wash
  on-secondary: '#ffffff'

  # Typographic Grayscale (Charcoal & Granite)
  ink-charcoal: '#1c2224'            # Deep charcoal primary reading ink
  ink-slate: '#5f6b6f'               # Granite secondary narrative & body
  caption-muted: '#7a868a'           # Soft lichen micro-telemetry

  # Organic Boundary Hairlines
  hairline-birch: '#e1e5df'          # Soft organic boundary rule
  hairline-focus: '#c2c9bf'          # Active tactile border
  hairline-dark: '#183d3b'           # Pine anchor line

  # Operational Safeguards
  status-active: '#2d6a4f'           # Forest verified
  status-amber: '#c4683c'            # Active licensure stamp

typography:
  # Sculptural Display Hierarchy (Fraunces Display Cut)
  display-xl:
    fontFamily: Fraunces
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 68px
    letterSpacing: -0.03em
    fontVariationSettings: "'opsz' 120, 'SOFT' 20, 'WONK' 0"
  headline-lg:
    fontFamily: Fraunces
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.025em
    fontVariationSettings: "'opsz' 72, 'SOFT' 10, 'WONK' 0"
  headline-md:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 38px
    letterSpacing: -0.02em
    fontVariationSettings: "'opsz' 60, 'SOFT' 0, 'WONK' 0"
  title-card:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.015em
    fontVariationSettings: "'opsz' 48, 'SOFT' 0, 'WONK' 0"

  # Humanist Body & Controls (Satoshi Grotesque)
  body-lg:
    fontFamily: Satoshi
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Satoshi
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Satoshi
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em

  # Micro-Telemetry, Indices & Cadastral Seals (Geist Mono)
  telemetry-md:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.12em
    fontFeatureSettings: "'tnum' 1"
  telemetry-sm:
    fontFamily: Geist Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.14em
    fontFeatureSettings: "'tnum' 1"

radii:
  sm: 6px                            # Buttons, inputs & tactile tags
  md: 10px                           # Secondary cards & authority strips
  lg: 14px                           # Large feature plinths & dialogs
  pill: 9999px                       # Floating navigation docks & status indicators

shadows:
  subtle: '0 4px 20px -4px rgba(28, 34, 36, 0.04)'
  card: '0 6px 24px -6px rgba(28, 34, 36, 0.05)'
  card-hover: '0 16px 36px -8px rgba(28, 34, 36, 0.09)'
---

# Design System: Scandinavian Soft Functionalism

## 1. Architectural Philosophy & Spatial Cadence

The design system translates the warmth of Scandinavian modernist architecture (inspired by Alvar Aalto’s bentwood curves, natural daylight apertures, and clean functional lines) into an authoritative digital real estate portal. 

- **Organic Modernist Planar Ground:** Discarding both sterile cold-gray admin layouts and heavy black terminal wireframes. Interfaces rest on an organic Nordic fog ground (`#f4f5f2`), with elevated daylight white surfaces (`#ffffff`) and gentle birch hairlines (`#e1e5df`).
- **Tactile Curvature:** Interactive elements and containers incorporate comfortable radii (`6px` for controls, `10px` to `14px` for structural cards), echoing physical bent-birch craftsmanship while preserving architectural geometry.
- **Human-Centric Cadastral Transparency:** Legal verifications (Registry of Deeds, DHSUD escrow, PRC broker licenses) remain fully audit-grade, but communicated through clean, reassuring typography rather than stark tax-ledger tables.

---

## 2. Typographic Matrix

Three typefaces serve distinct roles with high textural harmony:

1. **Sculptural Display (Fraunces):**
   - Configured with high optical size (`opsz: 72–120`) and mild soft curvature (`SOFT: 10–20`) to invoke chiseled architectural lettering with organic warmth.
   - Reserved exclusively for hero statements, residence titles, and primary value counters.
2. **Humanist Grotesque Body (Satoshi):**
   - Clean, highly legible sans-serif handling editorial descriptions, specifications, navigation links, and form inputs.
   - Neutral yet warm, eliminating the cold industrial fatigue of utility sans-serifs.
3. **Refined Cadastral Telemetry (Geist Mono):**
   - Strictly reserved for micro-stamps (`10px–12px`), lot coordinates, azimuth bearings, and valuation figures.
   - Always formatted with tabular numbers (`font-feature-settings: 'tnum' 1`) and subtle uppercase letter-spacing (`+0.12em`).

---

