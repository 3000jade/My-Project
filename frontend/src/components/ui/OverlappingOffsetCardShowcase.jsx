import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IconLayersSubtract, 
  IconArrowUpRight, 
  IconSparkles, 
  IconMaximize, 
  IconCheck,
  IconAdjustmentsHorizontal
} from '@tabler/icons-react';

import coastalVilla from '../../assets/luxury_modern_villa.jpg';
import zenCourtyard from '../../assets/luxury_zen_courtyard.jpg';

export default function OverlappingOffsetCardShowcase() {
  const [boxTheme, setBoxTheme] = useState('stark'); // 'stark' | 'glass'

  const specimens = [
    {
      id: "01",
      title: "The Horizon Cliffside Monolith",
      subtitle: "Malibu Coastline • Ridge Level 03",
      price: "$18,500,000",
      stats: "850 m² • 5 Suites • Glass Infinity Pool",
      image: coastalVilla,
      category: "Coastal Architecture",
      leadText: "Engineered into coastal granite with a cantilevered titanium pavilion framing western sunset vectors."
    },
    {
      id: "02",
      title: "The Zen Water Reflection Pavilion",
      subtitle: "Kyoto Sanctuary • Black Pine Forest",
      price: "$14,200,000",
      stats: "720 m² • 4 Suites • Shou Sugi Ban Cedar",
      image: zenCourtyard,
      category: "Minimalist Sanctuary",
      leadText: "A central 18-meter dark basalt basin acting as both a passive cooling anchor and a moonlight contemplation mirror."
    }
  ];

  return (
    <div className="w-full space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 text-white text-xs font-mono font-semibold mb-2">
            <IconLayersSubtract className="w-3.5 h-3.5 text-[#14B8A6]" />
            Luxury Layout Standard • Asymmetrical Overlap
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849] tracking-tight">
            The Asymmetrical Overlapping Offset Card
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
            Composed of two overlapping elements: a <strong>large image offset to the left</strong>, and a <strong>small, stark text box overlapping its bottom-right corner</strong>. Creates dynamic architectural tension and layered spatial depth.
          </p>
        </div>

        {/* Box Styling Theme Switcher */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-mono self-start md:self-auto">
          <button
            onClick={() => setBoxTheme('stark')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              boxTheme === 'stark' 
                ? 'bg-[#174849] text-white font-bold shadow-sm' 
                : 'text-stone-600 hover:text-[#174849]'
            }`}
          >
            Stark Architectural Box
          </button>
          <button
            onClick={() => setBoxTheme('glass')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              boxTheme === 'glass' 
                ? 'bg-[#174849] text-white font-bold shadow-sm' 
                : 'text-stone-600 hover:text-[#174849]'
            }`}
          >
            Frosted Glassmorphic Box
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THE ASYMMETRICAL OVERLAPPING CARDS GRID                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 pt-4 pb-12">
        {specimens.map((specimen, idx) => (
          <motion.div
            key={specimen.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative group cursor-pointer"
          >
            {/* 1. Large Offset Photographic Canvas (Offset to Left) */}
            <div className="w-[88%] sm:w-[84%] aspect-[16/11] rounded-3xl overflow-hidden relative shadow-xl bg-stone-200">
              <motion.img
                src={specimen.image}
                alt={specimen.title}
                className="w-full h-full object-cover brightness-[0.9] contrast-[1.06] transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-100"
              />

              {/* Minimalist Top Index Pin */}
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[11px] font-bold text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  {specimen.category} • #{specimen.id}
                </span>
              </div>
            </div>

            {/* 2. Small Stark Text Box Overlapping Bottom-Right Corner */}
            <motion.div
              whileHover={{ y: -8, x: 6, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
              className={`absolute -bottom-8 right-0 sm:right-2 w-[68%] sm:w-[58%] rounded-2xl p-6 sm:p-7 z-20 transition-all duration-500 shadow-2xl ${
                boxTheme === 'stark'
                  ? 'bg-[#174849] text-white border border-[#266F71]/60'
                  : 'bg-white/90 backdrop-blur-xl text-stone-900 border border-white/40'
              }`}
            >
              {/* Category & Subtitle */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                  boxTheme === 'stark' ? 'text-[#14B8A6]' : 'text-[#266F71]'
                }`}>
                  {specimen.subtitle}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  boxTheme === 'stark' ? 'bg-[#14B8A6]' : 'bg-[#266F71]'
                } animate-pulse`} />
              </div>

              {/* Stark Headline */}
              <h4 className={`text-lg sm:text-xl font-bold font-display leading-tight tracking-tight mb-2.5 ${
                boxTheme === 'stark' ? 'text-white' : 'text-[#174849]'
              }`}>
                {specimen.title}
              </h4>

              {/* Descriptive Lead Paragraph */}
              <p className={`text-xs leading-relaxed mb-4 line-clamp-2 ${
                boxTheme === 'stark' ? 'text-stone-300' : 'text-stone-600'
              }`}>
                {specimen.leadText}
              </p>

              {/* Footer Valuation & Action */}
              <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
                boxTheme === 'stark' ? 'border-white/15' : 'border-stone-200'
              }`}>
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block ${
                    boxTheme === 'stark' ? 'text-stone-400' : 'text-stone-500'
                  }`}>Valuation</span>
                  <span className={`text-sm font-bold ${
                    boxTheme === 'stark' ? 'text-white' : 'text-[#174849]'
                  }`}>{specimen.price}</span>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                  boxTheme === 'stark' ? 'bg-white/10 text-white' : 'bg-[#174849] text-white'
                }`}>
                  <IconArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Architectural Composition Principles */}
      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Image Offset Ratio: <code className="text-[#174849]">w-[84%]</code> Left-Biased</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Stark Overlap Enclosure: <code className="text-[#174849]">w-[58%]</code> Bottom-Right Corner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Counter-Directional Z-Index Lift on Hover</span>
        </div>
      </div>
    </div>
  );
}
