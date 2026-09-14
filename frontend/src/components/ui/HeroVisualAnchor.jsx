import { motion } from 'framer-motion';
import Button from './Button';

export default function HeroVisualAnchor({ onExplore, onRequestValuation }) {
  return (
    <section className="relative min-h-screen pt-[15vh] flex flex-col items-center justify-start overflow-hidden w-full bg-[#071313]">
      <div className="absolute inset-0 w-full z-0 pointer-events-none">
        <motion.img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          alt="Twilight Architectural Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        {/* Ambient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#071313]/60 via-[#071313]/40 to-[#071313] w-full"></div>
        {/* Radial Gradients (#174849 Deep Pine Teal / 30% and #FB8E5D Sunset Amber / 20%) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-[#174849]/30 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-[#FB8E5D]/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} 
        className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 text-center flex flex-col items-center justify-center mt-12"
      >
        <div className="inline-flex items-center px-5 py-2 rounded-full text-[11px] font-bold font-sans bg-white/10 text-white backdrop-blur-md uppercase tracking-[0.2em] mb-8 border border-white/20 shadow-lg gap-3">
          <span className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-pulse"></span>
          [ IN PROGRESS • ARCHITECTURAL PREVIEW ]
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold font-display tracking-tight text-white mb-8 leading-[1.05] max-w-5xl mx-auto drop-shadow-2xl">
          Where Heritage Meets <span className="text-[#FB8E5D]">Strategic Advisory.</span>
        </h1>
        
        <p className="text-base md:text-lg lg:text-xl text-white/80 leading-[1.8] font-light font-sans mb-12 max-w-3xl mx-auto">
          Experience the next evolution of luxury property acquisition. Our exclusive market insights analyze global markets to secure your legacy.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
           <Button onClick={onExplore} variant="primary" className="h-[54px] px-8 bg-[#174849] hover:bg-[#103536] text-white shadow-[0_10px_30px_rgba(23,72,73,0.3)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] flex items-center justify-center">
              Explore Verified Inventory
           </Button>
           <Button onClick={onRequestValuation} variant="outline" className="h-[54px] px-8 bg-transparent hover:bg-white/10 text-white shadow-none hover:-translate-y-1 transition-all border-2 border-white/50 font-bold tracking-widest text-[12px] backdrop-blur-sm flex items-center justify-center">
              Request Instant Home Valuation
           </Button>
        </div>
      </motion.div>
    </section>
  );
}
