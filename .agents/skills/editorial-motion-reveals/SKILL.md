---
name: editorial-motion-reveals
description: Expert guide for high-end editorial web animations — masked container reveals, scroll-triggered viewport entrances, counter-directional parallax depth, and millisecond staggered waves using Framer Motion and Tailwind CSS.
---

# Editorial Motion & High-End Reveals

This skill provides design principles, motion mathematics, and implementation patterns for agency-tier editorial animations in React and Tailwind CSS applications.

---

## 1. Aesthetic Movement & Core Principles

Editorial motion treats web interfaces like high-fashion monographs and architectural publications rather than software dashboards:

1. **Viewport Discipline**: Never dump all content at once. Initial screens must remain ultra-clean and minimalist. Content earns its entrance when scrolled into view.
2. **Invisible Boundaries (Masking)**: Elements don't just fade in arbitrarily; they emerge from behind crisp, invisible geometric envelopes (`overflow-hidden`).
3. **Intentional Velocity**: Discard floaty, linear transitions. Use luxury agency cubic-beziers (`ease: [0.16, 1, 0.3, 1]`) or dampened spring curves (`stiffness: 300, damping: 25`).

---

## 2. Core Motion Patterns

### Pattern 1: Scroll-Triggered Viewport Reveal

Keep initial viewports clean by animating elements only when they breach the user's active viewport margin:

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 40, scale: 0.96 }}
  whileInView={{ opacity: 1, y: 0, scale: 1 }}
  viewport={{ once: true, margin: '-60px' }}
  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
  className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800"
>
  {/* Card Content */}
</motion.div>
```

> **Rule**: Always use a negative viewport margin (`margin: '-60px'` to `'-100px'`) so animations trigger after entering the screen, preventing awkward clipping at the very bottom edge.

---

### Pattern 2: Masked Editorial Curtain Reveal

Text and images emerge from behind invisible boundaries, replicating editorial print layouts:

#### A. Typography Mask Reveal
Enclose each line or heading block in an `overflow-hidden` container:

```jsx
<div className="overflow-hidden">
  <motion.h2
    initial={{ y: "100%" }}
    whileInView={{ y: "0%" }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="text-4xl font-extrabold font-display text-white tracking-tight"
  >
    Sculpted from Light & Stone
  </motion.h2>
</div>
```

#### B. Image Curtain Sweep
Place an opaque solid block overlay inside an `overflow-hidden` wrapper that collapses vertically or horizontally:

```jsx
<div className="relative rounded-2xl overflow-hidden aspect-[16/10]">
  {/* The Curtain Mask */}
  <motion.div
    initial={{ scaleY: 1 }}
    whileInView={{ scaleY: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    className="absolute inset-0 bg-[#174849] z-20 origin-top"
  />
  
  {/* Image with subtle counter zoom */}
  <motion.img
    initial={{ scale: 1.15, opacity: 0 }}
    whileInView={{ scale: 1, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    src="/property.jpg"
    alt="Editorial View"
    className="w-full h-full object-cover"
  />
</div>
```

---

### Pattern 3: Staggered Entrance Wave

Create a rhythmic, cascading wave across grids of cards or list items:

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // 120ms editorial standard
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.94 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: 'spring', stiffness: 300, damping: 25 } 
  }
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: '-50px' }}
  className="grid grid-cols-1 md:grid-cols-3 gap-6"
>
  {items.map((item, idx) => (
    <motion.div key={idx} variants={itemVariants} className="card">
      {/* Content */}
    </motion.div>
  ))}
</motion.div>
```

#### Stagger Presets:
- **Fast / Tech Pulse**: `0.05s` (50ms)
- **Balanced Editorial**: `0.12s` (120ms)
- **Cinematic / Dramatic**: `0.25s` (250ms)

---

### Pattern 4: Counter-Directional Spatial Parallax

Layer elements inside a single viewport card so background visuals move opposite to foreground metadata:

```jsx
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

function ParallaxCard({ image, title, price }) {
  const cardRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start']
  });

  // Background translates down
  const yImage = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  
  // Foreground typography translates up
  const yText = useTransform(scrollYProgress, [0, 1], ['35px', '-35px']);

  return (
    <div ref={cardRef} className="relative h-[500px] rounded-3xl overflow-hidden p-8 flex flex-col justify-end">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.img 
          style={{ y: yImage }}
          src={image} 
          className="absolute -top-[15%] -bottom-[15%] w-full h-[130%] object-cover" 
        />
      </div>

      <motion.div style={{ y: yText }} className="relative z-10">
        <h3 className="text-3xl font-bold text-white">{title}</h3>
        <p className="text-emerald-400 font-mono">{price}</p>
      </motion.div>
    </div>
  );
}
```

---

### Pattern 5: Horizontal Scroll Section (Vertical-to-Horizontal Lock)

Locks vertical scrolling temporarily to drive a horizontal gallery track, breaking vertical page monotony:

```jsx
function HorizontalScrollGallery({ items }) {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end']
  });

  // Calculate translation range based on item count
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-68%']);

  return (
    // Outer scroll track container creates vertical scrub distance
    <section ref={targetRef} className="relative h-[280vh]">
      {/* Sticky viewport window locks in place while track moves */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <motion.div style={{ x }} className="flex gap-8 w-max pl-10 pr-20">
          {items.map((item, idx) => (
            <div key={idx} className="w-[450px] h-[380px] rounded-2xl overflow-hidden flex-shrink-0">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

---

### Pattern 6: Sticky Content Pinning (Split-Screen Scrub)

Pins an architectural specimen or product on one side of the screen while narrative specifications scrub past on the opposite column:

```jsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  {/* Left Column: Pinned Anchor */}
  <div className="lg:col-span-6">
    <div className="sticky top-28 h-[500px] rounded-3xl overflow-hidden bg-zinc-900">
      <img src="/hero.jpg" alt="Pinned Anchor" className="w-full h-full object-cover" />
    </div>
  </div>

  {/* Right Column: Natural Scrolling Chapters */}
  <div className="lg:col-span-6 space-y-12">
    {chapters.map((ch, idx) => (
      <div key={idx} className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h4 className="text-xl font-bold">{ch.title}</h4>
        <p className="text-sm text-zinc-400 mt-2">{ch.body}</p>
      </div>
    ))}
  </div>
</div>
```

---

### Pattern 7: The "Look Closer" Micro-Parallax (Craftsmanship Scrub)

A camera scrub animation where vertical scroll progress translates directly into dramatic zoom (`scale: 1x -> 3.2x`) and precision panning to reveal micro-textures, joinery tolerances, or material engravings:

```jsx
function LookCloserScrub({ macroImage }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Micro-Parallax Camera Transforms
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [1, 2.1, 3.1, 3.1]);
  const x = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['0%', '-14%', '24%', '24%']);
  const y = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['0%', '-8%', '-4%', '-4%']);

  // Narrative Card Opacities
  const opacityOverview = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const opacityDetail1 = useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
  const opacityDetail2 = useTransform(scrollYProgress, [0.68, 0.78, 1], [0, 1, 1]);

  return (
    <div ref={containerRef} className="relative h-[290vh]">
      <div className="sticky top-20 h-[85vh] rounded-3xl overflow-hidden bg-zinc-950">
        <motion.div style={{ scale, x, y }} className="w-full h-full will-change-transform">
          <img src={macroImage} alt="Craftsmanship Detail" className="w-full h-full object-cover" />
        </motion.div>

        {/* Dynamic Contextual Callouts */}
        <motion.div style={{ opacity: opacityDetail1 }} className="absolute bottom-8 left-8 p-6 bg-black/80 rounded-2xl">
          <h4 className="text-white font-bold">0.5mm Shadow Reveal Gap</h4>
          <p className="text-xs text-zinc-400">Diamond-milled thermal expansion relief joint.</p>
        </motion.div>
      </div>
    </div>
  );
}
```

---

### Pattern 8: The "Catwalk" Horizontal Showcase (Runway Lookbook)

A dramatic viewport lock where vertical scroll input translates into large, full-bleed runway panels gliding horizontally from right to left like haute-couture models:

```jsx
function CatwalkRunway({ looks }) {
  const runwayRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end']
  });

  // Calculate full-bleed horizontal translation
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-76%']);

  return (
    <div ref={runwayRef} className="relative h-[340vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black text-white flex flex-col justify-between p-8">
        <motion.div style={{ x }} className="flex gap-12 w-max will-change-transform my-auto">
          {looks.map((look) => (
            <div key={look.id} className="w-[84vw] max-w-[1240px] h-[64vh] rounded-3xl overflow-hidden relative group">
              <img src={look.img} alt={look.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-8 left-8 text-white z-10">
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-400">{look.tag}</span>
                <h3 className="text-4xl font-extrabold">{look.title}</h3>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
```

---

### Pattern 9: Premium Optical Lens Text Transitions (Anamorphic Rack Focus)

Simulates an anamorphic lens rack focus: text begins slightly oversized, deeply blurred in a muted silver tint, then scales down and sharpens into crisp, deep charcoal:

```jsx
// Optical Lens Blur-to-Charcoal Transition
<motion.span
  initial={{ 
    scale: 1.10, 
    filter: "blur(14px)", 
    color: "#CBD5E1", // Muted silver
    opacity: 0.25 
  }}
  whileInView={{ 
    scale: 1.0, 
    filter: "blur(0px)", 
    color: "#18181B", // Crisp deep charcoal
    opacity: 1.0 
  }}
  viewport={{ once: true, margin: "-40px" }}
  transition={{ 
    duration: 0.85, 
    ease: [0.16, 1, 0.3, 1] 
  }}
  className="text-4xl font-extrabold font-display inline-block"
>
  The Architecture of Silence
</motion.span>
```

#### Preset Values:
- **Subtle**: `scale: 1.06`, `blur: 8px`
- **Cinematic**: `scale: 1.10`, `blur: 14px`
- **Deep Anamorphic**: `scale: 1.18`, `blur: 22px`

---

### Pattern 10: The "Editorial Split" (Masked Line-by-Line)

Sentences or headlines are split into individual lines hidden inside invisible structural `overflow-hidden` boxes. On scroll, each line glides up from `y: 115%` into `y: 0%`, appearing out of thin air:

```jsx
const lines = [
  "WE CONSTRUCT SPACES",
  "WHERE ARCHITECTURAL SILENCE",
  "MEETS RAW COASTAL DRAMA"
];

function EditorialSplitHeadline() {
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => (
        <div key={idx} className="overflow-hidden">
          <motion.h2
            initial={{ y: "115%", opacity: 0, rotate: 1.5 }}
            whileInView={{ y: "0%", opacity: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              duration: 0.85, 
              delay: idx * 0.12, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="text-5xl font-extrabold font-display text-white tracking-tight"
          >
            {line}
          </motion.h2>
        </div>
      ))}
    </div>
  );
}
```

---

### Pattern 11: The "Liquid Kerning" Expand (Kinetic Tracking Out)

A minimalist header starts with standard letter-spacing. As the element enters the viewport or receives a hover, the tracking smoothly expands outward while subtly dimming in opacity:

```jsx
<motion.h2
  initial={{ 
    letterSpacing: "0.02em", 
    opacity: 1.0 
  }}
  whileInView={{ 
    letterSpacing: "0.24em", 
    opacity: 0.78 
  }}
  viewport={{ once: true, margin: "-40px" }}
  transition={{ 
    duration: 1.2, 
    ease: [0.16, 1, 0.3, 1] 
  }}
  className="text-4xl font-extrabold font-display uppercase tracking-tight text-white"
>
  Architectural Silence
</motion.h2>
```

#### Preset Values:
- **Subtle**: `letterSpacing: "0.14em"`, `opacity: 0.85`
- **Balanced Editorial**: `letterSpacing: "0.24em"`, `opacity: 0.78`
- **Liquid Hauteur**: `letterSpacing: "0.38em"`, `opacity: 0.70`

---

### Pattern 12: The Pristine Borderless Full-Bleed Card Layout

Eliminates boxed-in software card tropes. Cards possess no visible border lines and no solid background wrappers (`bg-transparent border-0 shadow-none`). The pristine full-bleed photograph rests directly on the website's main canvas with natural whitespace:

```jsx
<article className="group cursor-pointer bg-transparent border-0 shadow-none p-0">
  {/* Full-Bleed Photographic Surface */}
  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative">
    <motion.img
      src="/estate.jpg"
      alt="Pristine Specimen"
      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
    />
  </div>

  {/* Minimalist Metadata on Natural Page Canvas */}
  <div className="pt-5 space-y-2">
    <span className="font-mono text-xs uppercase text-teal-700 font-bold tracking-wider">
      Coastal Monolith
    </span>
    <h4 className="text-xl font-bold font-display text-zinc-900 group-hover:text-teal-700 transition-colors">
      The Cliffside Vanguard
    </h4>
    <div className="pt-2 flex justify-between border-t border-stone-200 text-xs font-mono">
      <span className="font-extrabold text-zinc-900">$18,500,000</span>
      <span className="text-stone-400">850 m²</span>
    </div>
  </div>
</article>
```

---

### Pattern 13: The Asymmetrical Overlapping Offset Card

A luxury composition of two overlapping elements: a large photographic canvas offset to the left (`w-[84%]`), and a small, stark text box overlapping its bottom-right corner (`w-[58%]`) with counter-directional hover lift:

```jsx
<div className="relative group cursor-pointer">
  {/* 1. Large Offset Photographic Canvas (Offset Left) */}
  <div className="w-[84%] aspect-[16/11] rounded-3xl overflow-hidden relative shadow-xl">
    <motion.img
      src="/specimen.jpg"
      alt="Architectural Specimen"
      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
    />
  </div>

  {/* 2. Small Stark Text Box Overlapping Bottom-Right Corner */}
  <motion.div
    whileHover={{ y: -8, x: 6, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
    className="absolute -bottom-8 right-2 w-[58%] rounded-2xl p-7 bg-[#174849] text-white border border-[#266F71]/60 shadow-2xl z-20"
  >
    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-2">
      Level 03 Coastal Ridge
    </span>
    <h4 className="text-xl font-bold font-display text-white mb-2">
      The Cliffside Monolith
    </h4>
    <p className="text-xs text-stone-300 line-clamp-2 mb-4">
      Cantilevered titanium pavilion framing unobstructed sunset horizons.
    </p>
    <div className="pt-3 border-t border-white/15 flex justify-between text-xs font-mono">
      <span className="font-bold text-white">$18,500,000</span>
      <span className="text-stone-400">850 m²</span>
    </div>
  </motion.div>
</div>
```

---

## 3. Checklist for Luxury Editorial Polish

- [ ] All typography reveals use `overflow-hidden` parent envelopes with `y: "100%"` -> `y: "0%"`.
- [ ] Stagger waves use `staggerChildren` rather than manual hardcoded `setTimeout` delays.
- [ ] Viewport triggers include negative margins (`-50px` to `-80px`) to avoid premature triggers.
- [ ] Image masks scale down (`scaleY: 0` or `scaleX: 0`) using `origin-top` or `origin-left`.
- [ ] Internal scrollable overlays have `data-lenis-prevent="true"` when integrated with smooth momentum scroll engines.
