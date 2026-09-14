# Parallax Multi-Vector Scrolling Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate a cinematic 2.5D multi-vector parallax scrolling intro for the Dahlia Enclave (Phase 3) into the landing page hero, featuring layered depth divergence, real-time mouse spring tilt, architectural vector HUD, and seamless handoff to the sticky search bar.

**Architecture:** A `220vh` pinned scroll stage driven by Framer Motion's `useScroll` and `useTransform` hooked into Lenis momentum scrolling. The scene is segmented into 5 alpha-channel transparent PNG layers (sky, illuminated duplexes, cobblestone ground, left/right foreground flora & street signs) that translate along multi-axial vectors on scroll and tilt counter-directionally via spring-damped pointer coordinates.

**Tech Stack:** React 19, Framer Motion, Lenis (`lenis/react`), Tailwind CSS v4, HTML5 Canvas, Vitest / Node test runner.

**Spec:** [`docs/superpowers/specs/2026-09-14-parallax-multi-vector-scrolling-intro-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/superpowers/specs/2026-09-14-parallax-multi-vector-scrolling-intro-design.md)

## Global Constraints

- All CTA buttons inside the hero MUST strictly maintain the uniform `h-[54px]` height per `.agents/AGENTS.md` Rule 6.
- The hero must transition smoothly to the sticky header and search box using a zero-height sentinel element tracked via `getBoundingClientRect` per `.agents/AGENTS.md` Rule 1 & 2.
- The scroll behavior must bind to Lenis momentum without introducing internal scroll hijacking or nested scroll traps per `.agents/AGENTS.md` Rule 4 & 5.
- Support `prefers-reduced-motion: reduce` by disabling multi-vector translations and falling back to subtle opacity cross-fades.
- Mobile/touch screens must gracefully disable pointer tilt listeners and scale layers responsively to keep villas centered.

---

### Task 1: Test Infrastructure & Parallax Layer Asset Pipeline

**Files:**
- Create: `scripts/generate_parallax_layers.py`
- Create: `scripts/verify_parallax_layers.py`
- Produce: `frontend/src/assets/parallax/layer-sky.png`
- Produce: `frontend/src/assets/parallax/layer-villas.png`
- Produce: `frontend/src/assets/parallax/layer-ground.png`
- Produce: `frontend/src/assets/parallax/layer-foreground-left.png`
- Produce: `frontend/src/assets/parallax/layer-foreground-right.png`

**Interfaces:**
- Input: `C:/Users/Win11x64/.gemini/antigravity/brain/6441366b-4b13-4099-a1c8-37b199304142/.user_uploaded/media_1789368735622.jpg`
- Output: 5 transparent RGBA PNG assets in `frontend/src/assets/parallax/`

- [ ] **Step 1: Write the failing verification test**

Create `scripts/verify_parallax_layers.py`:
```python
import os
import sys
from PIL import Image

REQUIRED_LAYERS = [
    "layer-sky.png",
    "layer-villas.png",
    "layer-ground.png",
    "layer-foreground-left.png",
    "layer-foreground-right.png"
]

def test_layers():
    target_dir = os.path.join("frontend", "src", "assets", "parallax")
    missing = []
    for layer in REQUIRED_LAYERS:
        path = os.path.join(target_dir, layer)
        if not os.path.exists(path):
            missing.append(layer)
            continue
        with Image.open(path) as img:
            assert img.mode in ("RGBA", "RGB"), f"{layer} mode is {img.mode}, expected RGBA"
            assert img.size[0] >= 1024, f"{layer} width {img.size[0]} < 1024"
    if missing:
        print(f"FAILED: Missing layers: {missing}", file=sys.stderr)
        sys.exit(1)
    print("ALL LAYERS VERIFIED OK")

if __name__ == "__main__":
    test_layers()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python scripts/verify_parallax_layers.py`  
Expected: FAIL with "Missing layers: ['layer-sky.png', ...]"

- [ ] **Step 3: Implement layer segmentation extraction script**

Create `scripts/generate_parallax_layers.py` that processes `media_1789368735622.jpg`, creates high-fidelity feathered masks for:
1. `layer-sky.png`: Upper sky above the roofline and tree crowns.
2. `layer-villas.png`: The illuminated modern villas, balconies, and upper woodwork with soft feathered alpha against the sky.
3. `layer-ground.png`: Lower driveway, pavement, and car headlights.
4. `layer-foreground-left.png`: Dahlia Street post, lower-left tropical flowers, and upper-left foliage branch with alpha transparency.
5. `layer-foreground-right.png`: Lower-right shrubs and palm fronds.

Execute: `python scripts/generate_parallax_layers.py`

- [ ] **Step 4: Run test to verify it passes**

Run: `python scripts/verify_parallax_layers.py`  
Expected: "ALL LAYERS VERIFIED OK"

- [ ] **Step 5: Commit**

Run: `git add scripts/ frontend/src/assets/parallax/; git commit -m "feat(assets): generate and verify 2.5D parallax depth layers"`

---

### Task 2: Starfield Canvas Particle Component (`StarTwinkleCanvas.jsx`)

**Files:**
- Create: `frontend/src/components/ui/StarTwinkleCanvas.jsx`
- Create: `frontend/src/components/ui/StarTwinkleCanvas.test.jsx`

**Interfaces:**
- Consumes: `starCount` (optional number, default 60), `speed` (optional number, default 1)
- Produces: React canvas component rendering responsive ambient twinkling stars and floating particles.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/StarTwinkleCanvas.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StarTwinkleCanvas from './StarTwinkleCanvas';

describe('StarTwinkleCanvas', () => {
  it('renders canvas with correct class names and attributes', () => {
    const { container } = render(<StarTwinkleCanvas starCount={40} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pointer-events-none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- StarTwinkleCanvas.test.jsx`  
Expected: FAIL with "Cannot find module StarTwinkleCanvas"

- [ ] **Step 3: Implement `StarTwinkleCanvas.jsx`**

Create `frontend/src/components/ui/StarTwinkleCanvas.jsx`:
```jsx
import { useEffect, useRef } from 'react';

export default function StarTwinkleCanvas({ starCount = 65, speed = 0.8, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.6), // Concentrated in upper sky
      radius: Math.random() * 1.4 + 0.4,
      baseAlpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.02 + 0.01) * speed
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.phase += star.speed;
        const currentAlpha = Math.max(0.1, star.baseAlpha + Math.sin(star.phase) * 0.35);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.shadowBlur = star.radius * 2;
        ctx.shadowColor = 'rgba(251, 142, 93, 0.5)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none z-[2] ${className}`}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- StarTwinkleCanvas.test.jsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run: `git add frontend/src/components/ui/StarTwinkleCanvas*; git commit -m "feat(ui): add ambient StarTwinkleCanvas component"`

---

### Task 3: Architectural Vector HUD Overlay (`VectorHUDOverlay.jsx`)

**Files:**
- Create: `frontend/src/components/ui/VectorHUDOverlay.jsx`
- Create: `frontend/src/components/ui/VectorHUDOverlay.test.jsx`

**Interfaces:**
- Consumes: `progress` (MotionValue or number between 0 and 1)
- Produces: SVG architectural CAD layout with coordinates, elevation markers, and dimension caliper.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/VectorHUDOverlay.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VectorHUDOverlay from './VectorHUDOverlay';

describe('VectorHUDOverlay', () => {
  it('renders technical coordinate markers and architectural spec labels', () => {
    render(<VectorHUDOverlay opacity={1} />);
    expect(screen.getByText(/14\.5995° N, 120\.9842° E/i)).toBeInTheDocument();
    expect(screen.getByText(/EL \+28\.40M/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 3 • DAHLIA ENCLAVE/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- VectorHUDOverlay.test.jsx`  
Expected: FAIL with "Cannot find module VectorHUDOverlay"

- [ ] **Step 3: Implement `VectorHUDOverlay.jsx`**

Create `frontend/src/components/ui/VectorHUDOverlay.jsx`:
```jsx
import { motion } from 'framer-motion';

export default function VectorHUDOverlay({ opacity = 1 }) {
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 pointer-events-none z-[4] flex flex-col justify-between p-6 md:p-12 overflow-hidden"
    >
      {/* Top Bar HUD */}
      <div className="w-full flex justify-between items-start text-[11px] font-mono tracking-widest text-white/60">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-ping" />
          <span className="uppercase text-white/80 font-semibold">PHASE 3 • DAHLIA ENCLAVE</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/50">SEC-A // LOT 08-12</span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-white/80 font-mono">14.5995° N, 120.9842° E</span>
          <span className="text-[9px] text-[#FB8E5D]/80 uppercase">GRID REFERENCE: LUX-MNL-2026</span>
        </div>
      </div>

      {/* Center Architectural Calipers & Dimension Guides */}
      <div className="relative w-full max-w-[1280px] mx-auto my-auto flex items-center justify-between">
        {/* Left Elevation Tag */}
        <div className="hidden lg:flex flex-col gap-1 border-l-2 border-white/20 pl-3 py-1">
          <span className="text-[10px] font-mono text-[#FB8E5D]">EL +28.40M</span>
          <span className="text-[10px] font-sans text-white/50 tracking-wider">UPPER TERRACE</span>
        </div>

        {/* Midground SVG Crosshairs and Dimension Lines */}
        <svg
          className="absolute inset-0 w-full h-48 opacity-40 pointer-events-none"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
        >
          {/* Subtle Horizontal Metric Guide */}
          <line x1="150" y1="100" x2="850" y2="100" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="150" y1="90" x2="150" y2="110" stroke="#FB8E5D" strokeWidth="2" />
          <line x1="850" y1="90" x2="850" y2="110" stroke="#FB8E5D" strokeWidth="2" />
          {/* Crosshair marks */}
          <circle cx="500" cy="100" r="4" fill="none" stroke="#FB8E5D" strokeWidth="1.5" />
          <line x1="500" y1="88" x2="500" y2="112" stroke="white" strokeWidth="1" />
          <line x1="488" y1="100" x2="512" y2="100" stroke="white" strokeWidth="1" />
        </svg>

        {/* Right Metric Tag */}
        <div className="hidden lg:flex flex-col gap-1 border-r-2 border-white/20 pr-3 py-1 text-right ml-auto">
          <span className="text-[10px] font-mono text-[#FB8E5D]">FRONTAGE 36.00M</span>
          <span className="text-[10px] font-sans text-white/50 tracking-wider">MODERN BIOPHILIC DUPLEX</span>
        </div>
      </div>

      {/* Bottom Technical Spec Badges */}
      <div className="w-full flex flex-wrap justify-between items-end gap-4 text-[10px] font-mono tracking-widest text-white/50">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#174849]" /> 01 // LOUVERED TIMBER FAÇADE
          </span>
          <span className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#174849]" /> 02 // COBBLESTONE HARDSCAPE
          </span>
        </div>
        <div className="text-right text-white/40">
          STATUS: <span className="text-[#FB8E5D] font-bold">VERIFIED MASTERPLAN</span>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- VectorHUDOverlay.test.jsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run: `git add frontend/src/components/ui/VectorHUDOverlay*; git commit -m "feat(ui): add architectural VectorHUDOverlay component"`

---

### Task 4: Master Parallax Controller (`ParallaxMultiVectorHero.jsx`)

**Files:**
- Create: `frontend/src/components/ui/ParallaxMultiVectorHero.jsx`
- Create: `frontend/src/components/ui/ParallaxMultiVectorHero.test.jsx`

**Interfaces:**
- Consumes:
  - `onExplore`: callback function `() => void`
  - `onRequestValuation`: callback function `() => void`
- Produces: Main responsive 2.5D multi-vector parallax hero component with spring mouse tilt, scroll-driven lateral foliage divergence, camera dolly zoom, and compliant `h-[54px]` action buttons.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/ParallaxMultiVectorHero.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParallaxMultiVectorHero from './ParallaxMultiVectorHero';

describe('ParallaxMultiVectorHero', () => {
  it('renders initial title and triggers action callbacks with compliant h-[54px] buttons', () => {
    const onExplore = vi.fn();
    const onRequestValuation = vi.fn();

    render(
      <ParallaxMultiVectorHero
        onExplore={onExplore}
        onRequestValuation={onRequestValuation}
      />
    );

    // Initial heading
    expect(screen.getByText(/DAHLIA ENCLAVE/i)).toBeInTheDocument();

    // Check buttons with strict h-[54px] height
    const exploreBtn = screen.getByRole('button', { name: /explore residences/i });
    const valuationBtn = screen.getByRole('button', { name: /schedule private viewing/i });

    expect(exploreBtn).toHaveClass('h-[54px]');
    expect(valuationBtn).toHaveClass('h-[54px]');

    fireEvent.click(exploreBtn);
    expect(onExplore).toHaveBeenCalledTimes(1);

    fireEvent.click(valuationBtn);
    expect(onRequestValuation).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- ParallaxMultiVectorHero.test.jsx`  
Expected: FAIL with "Cannot find module ParallaxMultiVectorHero"

- [ ] **Step 3: Implement `ParallaxMultiVectorHero.jsx`**

Create `frontend/src/components/ui/ParallaxMultiVectorHero.jsx` incorporating:
- Scroll runway: `relative w-full h-[220vh]`
- Sticky stage: `sticky top-0 h-screen w-full overflow-hidden bg-[#071313]`
- Framer Motion `useScroll`, `useTransform`, and `useSpring` mouse tracking.
- Layer transforms:
  - Sky: `translateY(0 to -50px)`, `scale(1 to 1.05)`
  - Villas: `translateY(0 to -30px)`, `scale(1 to 1.15)`
  - Ground: `translateY(0 to 40px)`, `scale(1 to 1.18)`
  - Foreground Left: `translateX(0 to -220px)`, `translateY(0 to 80px)`, `scale(1 to 1.25)`, `opacity(1 to 0.25)`
  - Foreground Right: `translateX(0 to 220px)`, `translateY(0 to 60px)`, `scale(1 to 1.20)`, `opacity(1 to 0.25)`
- Reduced-motion conditional disabling.
- Touch screen pointer event guards.
- Strict `h-[54px]` button classes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- ParallaxMultiVectorHero.test.jsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run: `git add frontend/src/components/ui/ParallaxMultiVectorHero*; git commit -m "feat(ui): implement ParallaxMultiVectorHero controller"`

---

### Task 5: Home Page Integration & Sentinel Handoff (`Home.jsx`)

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/pages/Home.test.jsx`

**Interfaces:**
- Consumes: `ParallaxMultiVectorHero`, `HeroVisualAnchor`
- Produces: Integrated landing page with hidden sentinel element immediately below the hero for sticky header & search box auto-switch per `.agents/AGENTS.md`.

- [ ] **Step 1: Write the failing integration test**

Create `frontend/src/pages/Home.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Page Integration', () => {
  it('renders ParallaxMultiVectorHero and hero-sentinel anchor', () => {
    const { container } = render(
      <BrowserRouter>
        <Home setIsDarkTheme={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByText(/DAHLIA ENCLAVE/i)).toBeInTheDocument();
    const sentinel = container.querySelector('#hero-sentinel');
    expect(sentinel).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- Home.test.jsx`  
Expected: FAIL (hero-sentinel not found)

- [ ] **Step 3: Modify `Home.jsx` to integrate `ParallaxMultiVectorHero` and sentinel**

In `frontend/src/pages/Home.jsx`:
- Import `ParallaxMultiVectorHero` from `../components/ui/ParallaxMultiVectorHero`.
- Replace the top static hero / section with `ParallaxMultiVectorHero`.
- Insert `<div id="hero-sentinel" ref={sentinelRef} className="h-0 w-full pointer-events-none" />` directly beneath it.
- Wire `onExplore` to smoothly scroll down to the search box using `lenis.scrollTo('#advanced-search-box')` or fallback `window.scrollTo`.
- Wire `onRequestValuation` to open valuation modal / route.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- Home.test.jsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run: `git add frontend/src/pages/Home.*; git commit -m "feat(pages): integrate ParallaxMultiVectorHero and sentinel into Home.jsx"`

---

### Task 6: Full Test Suite, Build Verification & Visual Polish

**Files:**
- Verify all modified files:
  - `frontend/src/assets/parallax/*`
  - `frontend/src/components/ui/ParallaxMultiVectorHero.jsx`
  - `frontend/src/components/ui/StarTwinkleCanvas.jsx`
  - `frontend/src/components/ui/VectorHUDOverlay.jsx`
  - `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Run all automated tests**

Run: `npm --prefix frontend test`  
Expected: All tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm --prefix frontend run build`  
Expected: Vite build succeeds with zero errors.

- [ ] **Step 3: Visual & functional sanity check**

Start dev server `npm --prefix frontend run dev` and verify in browser:
1. Pinned `220vh` scroll sequence flows smoothly with Lenis.
2. Dahlia Street sign and foreground tropical foliage part laterally down-left and down-right.
3. Midground modern villas zoom closer with interior warm window glow.
4. Starfield canvas subtly twinkles in the dusk sky.
5. Mouse move tilts all layers with tactile spring perspective.
6. Handoff past `hero-sentinel` triggers sticky header hide and search box top snap.
7. CTA buttons have exact `h-[54px]` height.

- [ ] **Step 4: Final commit**

Run: `git add .; git commit -m "chore(release): complete parallax multi-vector scrolling intro implementation"`
