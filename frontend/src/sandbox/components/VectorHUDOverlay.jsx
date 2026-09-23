import { motion } from 'framer-motion';

export default function VectorHUDOverlay({ opacity = 1 }) {
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 pointer-events-none z-[4] flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none"
    >
      {/* Top Bar HUD */}
      <div className="w-full flex justify-between items-start text-[11px] font-mono tracking-widest text-white/70">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-pulse" />
          <span className="uppercase text-white font-semibold">PHASE 3 • DAHLIA ENCLAVE</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/60">SEC-A // LOT 08-12</span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-white/90 font-mono tracking-wider">14.5995° N, 120.9842° E</span>
          <span className="text-[9px] text-[#FB8E5D] uppercase tracking-widest">GRID: LUX-MNL-2026</span>
        </div>
      </div>

      {/* Center Architectural Calipers & Dimension Guides */}
      <div className="relative w-full max-w-[1280px] mx-auto my-auto flex items-center justify-between pointer-events-none">
        {/* Left Elevation Tag */}
        <div className="hidden lg:flex flex-col gap-1 border-l-2 border-[#FB8E5D]/60 pl-3 py-1 bg-black/30 backdrop-blur-xs">
          <span className="text-[11px] font-mono font-bold text-[#FB8E5D]">EL +28.40M</span>
          <span className="text-[10px] font-sans text-white/70 tracking-wider">UPPER TERRACE LEVEL</span>
        </div>

        {/* Midground SVG Crosshairs and Dimension Lines */}
        <svg
          className="absolute inset-0 w-full h-48 opacity-50 pointer-events-none"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
        >
          {/* Subtle Horizontal Metric Guide */}
          <line x1="120" y1="100" x2="880" y2="100" stroke="white" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <line x1="120" y1="88" x2="120" y2="112" stroke="#FB8E5D" strokeWidth="2" />
          <line x1="880" y1="88" x2="880" y2="112" stroke="#FB8E5D" strokeWidth="2" />
          {/* Crosshair marks */}
          <circle cx="500" cy="100" r="4" fill="none" stroke="#FB8E5D" strokeWidth="1.5" />
          <line x1="500" y1="88" x2="500" y2="112" stroke="white" strokeWidth="1" />
          <line x1="488" y1="100" x2="512" y2="100" stroke="white" strokeWidth="1" />
        </svg>

        {/* Right Metric Tag */}
        <div className="hidden lg:flex flex-col gap-1 border-r-2 border-[#FB8E5D]/60 pr-3 py-1 text-right ml-auto bg-black/30 backdrop-blur-xs">
          <span className="text-[11px] font-mono font-bold text-[#FB8E5D]">FRONTAGE 36.00M</span>
          <span className="text-[10px] font-sans text-white/70 tracking-wider">MODERN BIOPHILIC DUPLEX</span>
        </div>
      </div>

      {/* Bottom Technical Spec Badges */}
      <div className="w-full flex flex-wrap justify-between items-end gap-4 text-[10px] font-mono tracking-widest text-white/60">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#FB8E5D]" /> 01 // LOUVERED TIMBER FAÇADE
          </span>
          <span className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#174849]" /> 02 // COBBLESTONE HARDSCAPE
          </span>
        </div>
        <div className="text-right text-white/50">
          STATUS: <span className="text-[#FB8E5D] font-bold">VERIFIED MASTERPLAN</span>
        </div>
      </div>
    </motion.div>
  );
}
