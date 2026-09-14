# Design Specification: Parallax Multi-Vector Scrolling Intro

**Date**: 2026-09-14  
**Status**: Validated Design (Ready for Implementation Planning)  
**Topic**: 2.5D Layered Parallax Multi-Vector Scrolling Intro for Dahlia Enclave (Phase 3)

---

## 1. Overview & Objectives

This specification defines the architecture, motion choreography, and integration of a cinematic **2.5D Multi-Vector Parallax Scrolling Intro** for the landing page (`Home.jsx`).

Using the provided dusk/night architectural render of luxury duplex villas on Dahlia Street (Phase 3), the experience replaces the existing static hero with a dynamic, multi-vector scroll sequence:
- **Depth Separation**: The scene is segmented into distinct visual layers (starry sky, midground illuminated duplexes, cobblestone ground, left foreground with Dahlia Street sign and flowers, right foreground foliage).
- **Multi-Vector Scroll Choreography**: Over a pinned `220vh` scroll runway, scrolling drives multi-axis directional translation—foreground elements diverge outward along diagonal vectors ($X: \pm 220\text{px}, Y: +80\text{px}$), the camera pushes forward into the villas ($Z\text{-scale}: 1.0 \to 1.15$), and the starry sky drifts upward at lower velocity.
- **Real-Time 3D Mouse Tilt**: Dynamic spring physics reacts to pointer movement across $X$ and $Y$ axes, tilting and offsetting layers counter-directionally for an immediate sensation of tangible depth even at rest.
- **Architectural Vector HUD**: Animated SVG coordinate vectors, elevation badges, and dimension calipers track across the architecture mid-scroll.
- **Full AGENTS.md Compliance**: Handshake with Lenis momentum scrolling, precision sentinel tracking for the sticky search bar and header auto-hide, and strict `h-[54px]` UI sizing.

---

## 2. Asset Pipeline & Depth Layer Segmentation

Source image: `media_1789368735622.jpg` (1024x558 RGB luxury dusk/night villas).

### 2.1 Generated Layer Assets (`frontend/src/assets/parallax/`)
To achieve authentic multi-vector separation without visual tearing or halo artifacts against the dark night atmosphere, the source image is segmented into high-resolution transparent PNG layers:

1. **`layer-sky.png` (Backdrop, $z=1$)**:
   - Contains: Starry night sky, distant celestial glow, and background mountain/horizon silhouettes.
   - Enhancement: Coupled with an HTML5 `<canvas>` star twinkle system emitting micro-particles with varying pulse phases.
2. **`layer-villas.png` (Midground Structure, $z=2$)**:
   - Contains: The two illuminated two-story modern villas, warm wooden louver cladding, glowing interior rooms, second-floor glass balconies, and perimeter architectural accent lighting.
   - Color treatment: Warm accent glow (`#FB8E5D` amber / `#174849` spruce undertones).
3. **`layer-ground.png` (Hardscape Plane, $z=3$)**:
   - Contains: Cobblestone driveway, street curb, paved walkway, and vehicle headlights casting forward light cones onto the pavement.
4. **`layer-foreground-left.png` (Foreground Divergence Left, $z=5$)**:
   - Contains: `"DAHLIA STREET"` signpost, upper overhanging tree foliage, and vivid tropical red/pink anthurium flowers.
5. **`layer-foreground-right.png` (Foreground Divergence Right, $z=5$)**:
   - Contains: Tropical fan palms, manicured low garden shrubs, and the `"PHASE 3"` entrance gate post.

---

## 3. Motion Choreography & Vector Physics

### 3.1 Pinned Scroll Runway Geometry
- **Outer Wrapper**: `relative w-full h-[220vh]` to define the scroll distance.
- **Inner Stage**: `sticky top-0 h-screen w-full overflow-hidden bg-[#071313] flex items-center justify-center select-none`.
- **Hardware Acceleration**: All layer elements utilize `transform-gpu`, `will-change-transform`, and `translateZ(0)`.

### 3.2 Scroll Progress Milestones (`scrollYProgress: 0.0 \to 1.0`)

| Scroll Range | Visual Stage | Layer Motion Vectors | Editorial Content |
|---|---|---|---|
| **0.00 – 0.25** | Initial Cinematic Reveal | All layers at rest ($X: 0, Y: 0, \text{scale}: 1.0$). Mouse tilt active. Ambient star twinkling. | Main Title: `[ DAHLIA ENCLAVE • PHASE 3 ]`<br/>`"Where Architecture Embraces the Night"`<br/>`Scroll to enter ↓` |
| **0.25 – 0.70** | Vector Parting & Camera Dolly | **Left Flora & Sign**: $X: 0 \to -220\text{px}$, $Y: 0 \to +80\text{px}$, $\text{scale}: 1.0 \to 1.25$, opacity: $1.0 \to 0.25$.<br/>**Right Flora**: $X: 0 \to +220\text{px}$, $Y: 0 \to +60\text{px}$, $\text{scale}: 1.0 \to 1.20$, opacity: $1.0 \to 0.25$.<br/>**Villas**: $Y: 0 \to -30\text{px}$, $\text{scale}: 1.0 \to 1.15$.<br/>**Sky**: $Y: 0 \to -50\text{px}$, $\text{scale}: 1.0 \to 1.05$. | Title fades out ($0.25 \to 0.40$).<br/>Vector HUD badges fade in ($0.35 \to 0.65$):<br/>- `01 // LOUVERED TIMBER FAÇADE`<br/>- `02 // COBBLESTONE HARDSCAPE`<br/>- `03 // 14.5995° N, 120.9842° E` |
| **0.70 – 1.00** | Resolution & Action Handoff | Layers settle into final perspective. Foreground cleared to reveal open villa entrance. | Concluding Action Deck fades in:<br/>`"Discover Dahlia Enclave's Curated Residences"`<br/>Buttons: `[ Explore Residences ]` & `[ Schedule Private Viewing ]` (both `h-[54px]`) |

### 3.3 Real-Time 3D Mouse Spring Tilt
Pointer coordinates are normalized to $[-1, 1]$ relative to screen center:
- **Damping & Inertia**: Driven by Framer Motion `useSpring({ stiffness: 140, damping: 22 })`.
- **Perspective Plane**: Outer stage configured with `perspective: 1200px`.
  - $\text{Stage Rotate Y} = x \times 2.2^\circ$
  - $\text{Stage Rotate X} = -y \times 1.8^\circ$
- **Differential Layer Shifts**:
  - Foreground layers: $X_{\text{offset}} = x \times -28\text{px}$, $Y_{\text{offset}} = y \times -18\text{px}$
  - Midground villas: $X_{\text{offset}} = x \times -12\text{px}$, $Y_{\text{offset}} = y \times -8\text{px}$
  - Sky: $X_{\text{offset}} = x \times 8\text{px}$, $Y_{\text{offset}} = y \times 5\text{px}$

---

## 4. Architectural Vector HUD (`VectorHUDOverlay.jsx`)

An animated SVG layer rendered at $z=4$ that provides technical architectural accents:
- **Hairline Crosshairs**: Rendered at quadrant junctions with subtle pulse animation.
- **Coordinate Display**: Coordinates `14.5995° N, 120.9842° E` displayed with mono typography and bounding brackets.
- **Elevation Tag**: `EL +28.40M • PHASE 3 LOT 12` positioned near the right villa balcony.
- **Dimension Caliper**: A dynamic horizontal measurement indicator spanning the villa frontage.

---

## 5. System Integration & `.agents/AGENTS.md` Directives

### 5.1 Sticky Header & Search Sentinel Handoff
- Directly beneath the `h-[220vh]` parallax hero container, a hidden zero-height sentinel element is mounted:
  ```jsx
  <div ref={sentinelRef} className="h-0 w-full pointer-events-none" id="hero-sentinel" />
  ```
- As the user scrolls past the `220vh` mark, `sentinelRef.current.getBoundingClientRect().top` transitions past the header offset, triggering the main Header auto-hide and allowing the Advanced Search Box to transition to `sticky top-0` edge-to-edge.

### 5.2 Uniform UI Sizing
- All interactive CTA buttons inside the hero comply with the project standard:
  ```jsx
  className="h-[54px] px-8 rounded-none md:rounded-lg font-bold text-xs uppercase tracking-widest ..."
  ```

### 5.3 Lenis Smooth Momentum
- The container works natively with `ReactLenis` and `useLenis()`. No internal scroll hijacking or nested scroll traps are introduced; the entire parallax effect is pure window scroll progression.

---

## 6. Accessibility & Resilience

1. **`prefers-reduced-motion` Support**:
   - Detects `window.matchMedia('(prefers-reduced-motion: reduce)')`.
   - When active, vector translations ($X, Y$) and scale zooms are bypassed; instead, opacity cross-fades between the wide view and the CTA deck.
2. **Touch / Mobile Devices**:
   - Mousemove listeners are automatically disabled on touch devices (`@media (hover: none)`).
   - Layers scale gracefully with responsive media queries, ensuring the duplex villas remain visually centered on portrait aspect ratios.
3. **Asset Preloading & Loading Skeleton**:
   - Image assets are preloaded via `new Image()`. While loading, an ambient dark background (`#071313`) with subtle pulsing glow prevents any flash of unstyled content.

---

## 7. Verification & Testing Strategy

1. **Automated Unit Tests** (`ParallaxMultiVectorHero.test.jsx`):
   - Verify mounting and correct layer DOM order.
   - Verify that CTA buttons render with explicit `h-[54px]` height class.
   - Verify that callback functions `onExplore` and `onSchedule` execute on button click.
   - Verify reduced-motion behavior under simulated media query.
2. **Build Verification**:
   - `npm run build` in `frontend/` to confirm zero Vite build or ESLint errors.
3. **Manual Browser Verification**:
   - Test smooth scroll through all 3 phases ($0.0 \to 1.0$).
   - Test mouse tilt responsiveness and smoothness.
   - Validate sentinel transition into the search bar and sticky header.
