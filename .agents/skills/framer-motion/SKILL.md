---
name: framer-motion
description: Comprehensive Framer Motion guide for React applications. Covers LayoutId morphing, AnimatePresence zero-reflow state handshakes, gesture spring physics, SVG path length drawing, variants, and Lenis scroll prevention integration.
---

# Framer Motion Best Practices & Design Patterns

This skill provides expert patterns, performance rules, and code snippets for building high-end, production-grade animations using `framer-motion` in React applications.

---

## 1. Core Principles & Spring Physics Standards

Always prefer **spring physics** over linear or standard CSS ease transitions for natural human interaction:

- **Bouncy / Kinetic Buttons**: `{ type: 'spring', stiffness: 400, damping: 25 }`
- **Modal Entrance & Overlay**: `{ type: 'spring', stiffness: 200, damping: 25 }`
- **Tab Indicators (`layoutId`)**: `{ type: 'spring', stiffness: 400, damping: 30 }`
- **Odometer / Roll Counters**: `{ type: 'spring', stiffness: 350, damping: 30 }`

---

## 2. Key Patterns & Code Examples

### Pattern 1: Shared Layout Indicator (`layoutId`)
Smooth background indicator morphing between active tabs or menu items:

```jsx
{activeTab === tab.id && (
  <motion.div
    layoutId="activeTabIndicator"
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className="absolute inset-0 bg-[#266F71] rounded-lg shadow-sm"
  />
)}
```

### Pattern 2: Morphing Card Footprint (`layout`)
Zero-reflow container footprint morphing when expanding cards or revealing hidden details:

```jsx
<motion.div
  layout
  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
  className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800"
>
  <motion.h4 layout>Card Header</motion.h4>
  <AnimatePresence>
    {isExpanded && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        Expanded Content
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

### Pattern 3: Parent-Child Cascading Stagger (`staggerChildren`)
Orchestrated grid or list reveals:

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};
```

### Pattern 4: Kinetic SVG Path Drawing (`pathLength`)
Animated checkmarks, progress rings, and sparkline paths:

```jsx
<motion.path
  d="M20 6L9 17l-5-5"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: isChecked ? 1 : 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
/>
```

### Pattern 5: Physics Drag & Momentum Constraints (`drag`)
Elastic drag targets and bottom sheets:

```jsx
<motion.div
  drag
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  Draggable Element
</motion.div>
```

---

## 3. Modals & Lenis Scroll Integration Rules

When opening modals or fixed overlays inside a Lenis scroll application:

1. **Backdrop Blur**: `bg-black/80 backdrop-blur-md`
2. **Modal Physics**: `initial={{ opacity: 0, scale: 0.9, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }}`
3. **Lenis Scroll Prevention**: Any internal scrollable container inside the modal MUST have `data-lenis-prevent="true"` attached to stop Lenis engine hijacking.
