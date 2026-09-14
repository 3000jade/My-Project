import React from 'react';
import Button from './Button';
import heroImage from '../../assets/hero-dahlia-estate.jpg';

export default function ParallaxMultiVectorHero({
  onExplore,
  onRequestValuation,
  className = ''
}) {
  return (
    <section className={`relative min-h-[90vh] lg:min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#071313] ${className}`}>
      {/* Pristine Full Image Background (No Effects / Pure Image) */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={heroImage}
          alt="Dahlia Enclave • Phase 3 Modern Architectural Duplexes"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle Ambient Vignette Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071313] via-black/35 to-black/50" />
      </div>

      {/* Hero Editorial Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-24 md:py-32 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center px-5 py-2 rounded-full text-[11px] font-bold font-mono bg-black/50 text-white/90 backdrop-blur-md uppercase tracking-[0.25em] mb-6 border border-white/20 shadow-xl gap-3">
          <span className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-pulse" />
          DAHLIA ENCLAVE • PHASE 3
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white mb-6 leading-[1.08] drop-shadow-2xl max-w-4xl">
          Where Architecture <br className="hidden sm:inline" />
          <span className="text-[#FB8E5D]">Embraces the Night.</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-white/85 font-light max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-md">
          A private enclave of contemporary biophilic duplexes on Dahlia Street. Experience mastercrafted living harmonized with tropical nature.
        </p>

        {/* Action Buttons (Strict h-[54px] requirement per AGENTS.md) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <Button
            onClick={onExplore}
            variant="primary"
            className="h-[54px] px-8 bg-[#174849] hover:bg-[#103536] text-white shadow-[0_10px_30px_rgba(23,72,73,0.4)] border-none font-bold tracking-widest text-xs flex items-center justify-center rounded-lg transition-transform hover:-translate-y-0.5"
          >
            Explore Residences
          </Button>
          <Button
            onClick={onRequestValuation}
            variant="outline"
            className="h-[54px] px-8 bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 font-bold tracking-widest text-xs backdrop-blur-sm flex items-center justify-center rounded-lg transition-transform hover:-translate-y-0.5"
          >
            Schedule Private Viewing
          </Button>
        </div>
      </div>
    </section>
  );
}
