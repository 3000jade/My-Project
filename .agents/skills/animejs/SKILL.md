---
name: animejs
description: Use when implementing JavaScript-driven micro-animations, SVG stroke/morphing sequences, multi-element stagger cascades, numerical counters, or complex timeline orchestrations with Anime.js
---

# Anime.js Best Practices & Design Patterns

Anime.js is a lightweight, flexible JavaScript animation engine capable of animating CSS properties, SVG attributes, DOM nodes, and raw JavaScript objects.

---

## 1. When to Use Anime.js vs. Other Libraries

| Use Case | Recommended Engine | Why |
|---|---|---|
| **Complex SVG Path Morphing & Drawing** | **Anime.js** | Built-in `anime.setDashoffset`, native path motion, and lightweight footprint. |
| **Grid / Wave Stagger Cascades** | **Anime.js** | Elegant `anime.stagger([start, end], { from: 'center', grid: [x, y] })` API. |
| **Numeric Odometers & Object Tweening** | **Anime.js** | Directly tweens plain JS object values (`{ val: 0 }` -> `{ val: 100 }`). |
| **React Component Mount/Unmount & Modals** | **Framer Motion** | `<AnimatePresence>` handles DOM exit animations without manual lifecycle hooks. |
| **Scroll Pinning & Heavy Scrubbing** | **GSAP + ScrollTrigger** | Robust scroll pin calculations and velocity momentum integration. |

---

## 2. React Integration Rules (Critical)

Anime.js manipulates DOM nodes directly. In React 18/19 applications:

1. **Always use `useRef`:** Never select elements via global class strings like `'.card'`; query through component refs (`containerRef.current.querySelectorAll(...)`) to avoid leaking animations across multiple instances.
2. **Clean up on unmount:** Always call `anime.remove(targets)` in the cleanup function of `useEffect` to prevent memory leaks and ghost RAF loops.

```jsx
import React, { useEffect, useRef } from 'react';
import { animate, remove, stagger } from 'animejs';

export default function StaggerGrid() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.stagger-tile');

    const animation = animate(elements, {
      scale: [0.8, 1],
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(60, { from: 'center' }),
      ease: 'outElastic(1, .8)',
      duration: 800
    });

    return () => {
      remove(elements);
    };
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.id} className="stagger-tile p-4 rounded-xl bg-white shadow-sm" />
      ))}
    </div>
  );
}
```

---

## 3. Core Patterns & Code Examples

### Pattern 1: Kinetic SVG Path Length Drawing

Anime.js can calculate and animate SVG path dash offsets automatically:

```jsx
useEffect(() => {
  if (!svgRef.current) return;
  const path = svgRef.current.querySelector('path');

  anime({
    targets: path,
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeInOutCubic',
    duration: 1800,
    delay: 200
  });

  return () => anime.remove(path);
}, []);
```

### Pattern 2: Multi-Directional Grid & Wave Staggers

Animate grids with ripple effects radiating outward from specific focal coordinates:

```javascript
anime({
  targets: '.grid-cell',
  scale: [
    { value: 0.1, easing: 'easeOutSine', duration: 300 },
    { value: 1, easing: 'easeInOutQuad', duration: 800 }
  ],
  delay: anime.stagger(100, {
    grid: [6, 6],
    from: 'center',
    axis: 'x' // or 'y' or undefined for radial
  })
});
```

### Pattern 3: Smooth Numeric Roll Counter (Odometer)

Animate plain JavaScript object values and reflect them into state or inner text:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';

export function AnimatedCounter({ targetValue, prefix = '$' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const counterObj = useRef({ value: 0 });

  useEffect(() => {
    const anim = anime({
      targets: counterObj.current,
      value: targetValue,
      round: 1, // Round to integer steps
      easing: 'easeOutExpo',
      duration: 2000,
      update: () => {
        setDisplayValue(counterObj.current.value);
      }
    });

    return () => anime.remove(counterObj.current);
  }, [targetValue]);

  return <span>{prefix}{displayValue.toLocaleString()}</span>;
}
```

### Pattern 4: Coordinated Timelines (`anime.timeline`)

Chain independent micro-interactions sequentially with relative time offsets:

```javascript
const tl = anime.timeline({
  easing: 'easeOutExpo',
  duration: 750
});

tl.add({
  targets: '.modal-overlay',
  opacity: [0, 1],
  duration: 400
})
.add({
  targets: '.modal-box',
  translateY: [40, 0],
  scale: [0.95, 1],
  opacity: [0, 1]
}, '-=200') // Overlap by 200ms
.add({
  targets: '.modal-item',
  opacity: [0, 1],
  translateY: [15, 0],
  delay: anime.stagger(80)
}, '-=300');
```

---

## 4. Performance & Best Practices

1. **Prioritize Transform & Opacity:** Animate `transform` (`translateX`, `translateY`, `scale`, `rotate`) and `opacity` to remain on the GPU compositor thread without triggering layout reflows.
2. **Avoid animating CSS `width`/`height`:** Animate `scaleX` and `scaleY` instead whenever possible.
3. **Hardware Acceleration:** Ensure animated elements have `will-change: transform` or a 3D transform applied if rendering large lists.
4. **Integration with Lenis:** Anime.js operates independently of scroll libraries. If driving animations based on scroll position, use `requestAnimationFrame` or pass the scroll progress from Lenis into `animation.seek(progress * duration)`.

---

## 5. Quick Reference Table

| Feature | Anime.js Method | Example |
|---|---|---|
| **Stagger** | `anime.stagger(delay, options)` | `delay: anime.stagger(50, { from: 'last' })` |
| **SVG Dashoffset** | `anime.setDashoffset` | `strokeDashoffset: [anime.setDashoffset, 0]` |
| **Object Tween** | Plain object target | `targets: myObj, val: 500, round: 1` |
| **Timeline** | `anime.timeline(defaults)` | `tl.add({...}, '-=150')` |
| **Cleanup** | `anime.remove(targets)` | `return () => anime.remove(elements);` |
| **Seek / Scrub** | `animation.seek(time)` | `animation.seek(progress * animation.duration)` |
