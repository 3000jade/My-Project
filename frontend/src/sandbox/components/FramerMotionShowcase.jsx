import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSparkles, 
  IconLayersLinked, 
  IconCheck, 
  IconChevronDown, 
  IconHandMove, 
  IconReload, 
  IconEye, 
  IconFlame, 
  IconBox 
} from '@tabler/icons-react';

export default function FramerMotionShowcase() {
  // 1. Shared Layout Tab State
  const [activeTab, setActiveTab] = useState('overview');
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  // 2. Staggered List State
  const [showStaggerList, setShowStaggerList] = useState(true);

  // 3. SVG Path Draw State
  const [isCompleted, setIsCompleted] = useState(false);

  // 4. Accordion State
  const [openAccordion, setOpenAccordion] = useState(null);

  // Stagger container & item variants
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const featureItems = [
    { title: "Dynamic Island Morph", desc: "Seamless layoutId transition between components", tag: "Layout" },
    { title: "Stagger Cascade", desc: "Orchestrated parent-child sequence delays", tag: "Sequence" },
    { title: "Path Length SVG", desc: "Kinetic stroke-dashoffset spring drawing", tag: "SVG Vector" },
    { title: "Elastic Drag & Throw", desc: "Physics-based momentum & drag constraints", tag: "Gestures" }
  ];

  return (
    <div className="w-full space-y-10 text-stone-800">
      {/* DEMO 1: Shared Layout Animations (layoutId) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-semibold mb-1">
              Pattern 1 • layoutId
            </div>
            <h3 className="text-lg font-bold font-display text-[#174849]">
              Shared Layout Morphing &amp; Pill Indicators
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Smooth fluid morphing of background highlights across active elements using Framer Motion's <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[#174849]">layoutId</code>.
            </p>
          </div>

          {/* Tab Navigation with Shared Layout Pill */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/80 self-start sm:self-auto">
            {['overview', 'analytics', 'specs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  activeTab === tab ? 'text-white' : 'text-stone-600 hover:text-[#174849]'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-[#266F71] rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Morphing Card */}
        <div className="pt-2">
          <motion.div
            layout
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`p-5 rounded-xl border cursor-pointer transition-colors ${
              isCardExpanded 
                ? 'bg-[#174849] text-white border-[#266F71] shadow-xl' 
                : 'bg-stone-50 text-[#174849] border-stone-200 hover:border-stone-300 shadow-xs'
            }`}
          >
            <motion.div layout className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  layout 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isCardExpanded ? 'bg-white/10 text-emerald-300' : 'bg-[#266F71]/10 text-[#266F71]'
                  }`}
                >
                  <IconLayersLinked className="w-5 h-5" />
                </motion.div>
                <div>
                  <motion.h4 layout className="text-sm font-bold">
                    Horizon Penthouse Suite 42
                  </motion.h4>
                  <motion.p layout className={`text-xs ${isCardExpanded ? 'text-emerald-200/80' : 'text-stone-500'}`}>
                    Click to morph card footprint &amp; reveal detailed metadata
                  </motion.p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isCardExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="p-1 rounded-full hover:bg-black/10"
              >
                <IconChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {isCardExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-white/15 space-y-3 text-xs"
                >
                  <p className="text-stone-200 leading-relaxed">
                    Morphing layout without reflow jump cuts. Notice how container height, child elements, and background styles morph in single spring timing.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/10 p-2.5 rounded-lg text-center backdrop-blur-md">
                      <span className="text-[10px] text-emerald-200 uppercase tracking-widest block font-mono">Area</span>
                      <span className="font-bold text-white">420 m²</span>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-lg text-center backdrop-blur-md">
                      <span className="text-[10px] text-emerald-200 uppercase tracking-widest block font-mono">Bedrooms</span>
                      <span className="font-bold text-white">4 Suite</span>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-lg text-center backdrop-blur-md">
                      <span className="text-[10px] text-emerald-200 uppercase tracking-widest block font-mono">Parking</span>
                      <span className="font-bold text-white">3 Slot</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* DEMO 2 & DEMO 3 GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEMO 2: Staggered Cascade List */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-semibold">
                Pattern 2 • staggerChildren
              </span>
              <h3 className="text-base font-bold font-display text-[#174849] mt-1">
                Staggered List Entrance
              </h3>
            </div>
            <button
              onClick={() => setShowStaggerList(!showStaggerList)}
              className="p-2 text-stone-500 hover:text-[#266F71] bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              title="Re-trigger Stagger"
            >
              <IconReload className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showStaggerList && (
              <motion.div
                key="stagger-list"
                variants={listContainerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-2.5"
              >
                {featureItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={listItemVariants}
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                    className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-[#174849]">{item.title}</h5>
                      <p className="text-[11px] text-stone-500">{item.desc}</p>
                    </div>
                    <span className="font-mono text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      {item.tag}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DEMO 3: Path Length SVG Drawing & Kinetic State */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono font-semibold">
              Pattern 3 • pathLength
            </span>
            <h3 className="text-base font-bold font-display text-[#174849] mt-1">
              Kinetic SVG Path Animation
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Smooth vector stroke drawing using Framer Motion's animated <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">pathLength</code> property.
            </p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <button
              onClick={() => setIsCompleted(!isCompleted)}
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-[#174849] text-white text-xs font-bold shadow-md hover:bg-[#266F71] transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center bg-white/10">
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    d="M20 6L9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <span>{isCompleted ? 'Inspection Confirmed ✓' : 'Confirm Inspection'}</span>
            </button>
            <p className="text-[11px] text-stone-400 mt-3 font-mono">
              Click button to toggle SVG stroke draw state
            </p>
          </div>
        </div>
      </div>

      {/* DEMO 4 & DEMO 5 GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEMO 4: Accordion with Auto Height */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-mono font-semibold">
              Pattern 4 • AnimatePresence &amp; Auto Height
            </span>
            <h3 className="text-base font-bold font-display text-[#174849] mt-1">
              Smooth Auto-Height Accordion
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { id: 1, title: 'What is Spring Damping?', body: 'Spring damping controls how quickly oscillation stops. Higher damping means less bounce and faster settling time.' },
              { id: 2, title: 'How does layoutId work?', body: 'layoutId automatically connects two distinct components across state changes, smoothly morphing position and size.' },
              { id: 3, title: 'Why use Framer Motion over pure CSS?', body: 'Framer Motion provides real physics-based spring curves, interrupted gesture handshakes, and React state integration.' }
            ].map((acc) => (
              <div key={acc.id} className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/50">
                <button
                  onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)}
                  className="w-full p-3.5 text-left text-xs font-bold text-[#174849] flex items-center justify-between hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <span>{acc.title}</span>
                  <motion.span
                    animate={{ rotate: openAccordion === acc.id ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <IconChevronDown className="w-4 h-4 text-stone-500" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openAccordion === acc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="p-3.5 pt-0 text-xs text-stone-600 leading-relaxed border-t border-stone-200/60">
                        {acc.body}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* DEMO 5: Physics Drag & Momentum Bounds */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-mono font-semibold">
                Pattern 5 • drag &amp; dragConstraints
              </span>
              <IconHandMove className="w-4 h-4 text-teal-700 animate-bounce" />
            </div>
            <h3 className="text-base font-bold font-display text-[#174849] mt-1">
              Physics Gesture Drag Card
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Drag the card around inside the bounded frame. Release to experience elastic snapback physics.
            </p>
          </div>

          <div className="h-48 bg-stone-900 rounded-xl border border-zinc-800 relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <motion.div
              drag
              dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
              dragElastic={0.2}
              whileDrag={{ scale: 1.05, cursor: 'grabbing', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-4 bg-[#266F71] text-white rounded-xl shadow-xl cursor-grab border border-teal-400/30 flex items-center gap-3 select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <IconFlame className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h5 className="text-xs font-bold">Interactive Drag Target</h5>
                <p className="text-[10px] text-teal-100/80 font-mono">Toss or drag me around</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
