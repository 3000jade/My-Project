import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconHome, 
  IconBuildingSkyscraper, 
  IconHome2, 
  IconBuildingStore,
  IconShieldCheck
} from '@tabler/icons-react';

const PROPERTY_CATEGORIES = [
  { id: 'all', title: 'All Properties', icon: null },
  { id: 'house-and-lot', title: 'Single-Family', icon: IconHome },
  { id: 'condominium', title: 'Condominiums', icon: IconBuildingSkyscraper },
  { id: 'townhouse', title: 'Townhouses', icon: IconHome2 },
  { id: 'duplex', title: 'Duplexes', icon: IconBuildingStore }
];

const NEIGHBORHOOD_STORIES = [
  {
    id: 'cavite',
    tag: 'South Suburbs',
    name: 'Cavite Growth Corridor',
    location: 'Bacoor, Imus, Dasma, Gen. Trias',
    tagline: 'Spacious Family Living Near Expressways',
    description: 'The prime residential choice for suburban Filipino families. Enjoy spacious house-and-lot properties, top Cavite schools, and rapid connectivity via CAVITEX, CALAX, and MCX.',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop',
    stats: '₱1.8M – ₱12M Homes',
    supportedTypes: ['house-and-lot', 'townhouse', 'duplex']
  },
  {
    id: 'laguna',
    tag: 'Eco-City Hub',
    name: 'Laguna Green Corridors',
    location: 'Santa Rosa, Biñan, Nuvali, Calamba',
    tagline: 'Master-Planned Nature & Modern Subdivisions',
    description: 'The booming Lion City of the South. Featuring sprawling green subdivisions, top universities, commercial lifestyle parks, and peaceful family environments.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    stats: '₱2.8M – ₱28M Homes',
    supportedTypes: ['house-and-lot', 'townhouse', 'duplex']
  },
  {
    id: 'antipolo',
    tag: 'Eastern Haven',
    name: 'Antipolo & Rizal Ridge',
    location: 'Antipolo City, Taytay, Cainta',
    tagline: 'Fresh Mountain Air & Relaxed Townhouse Enclaves',
    description: 'Elevated green hills with cooler temperatures, scenic sunrise vistas, and multi-level modern townhouses just minutes away from Ortigas East and LRT-2.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    stats: '₱2.2M – ₱15M Homes',
    supportedTypes: ['house-and-lot', 'townhouse']
  },
  {
    id: 'taguig-bgc',
    tag: 'Global Metropolis',
    name: 'Taguig & BGC Metropolis',
    location: 'Bonifacio Global City, ARCA South',
    tagline: 'Walk-to-Work Urban High-Rise Living',
    description: 'A master-planned world-class urban core offering secure condominiums, multinational headquarters, walkable pedestrian parks, and premier international hospitals.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600&auto=format&fit=crop',
    stats: '₱4.5M – ₱85M Condos',
    supportedTypes: ['condominium']
  },
  {
    id: 'quezon-city',
    tag: 'University & Media Hub',
    name: 'Quezon City Enclaves',
    location: 'Katipunan, New Manila, Fairview',
    tagline: 'Premier Academic Institutions & Quiet Villages',
    description: 'The educational heart of Metro Manila, home to the country’s top universities (UP, Ateneo), leading medical complexes, and quiet gated family residential communities.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
    stats: '₱3.5M – ₱35M Estates',
    supportedTypes: ['condominium']
  }
];

export default function NeighborhoodSpotlightsSection() {
  const [activeId, setActiveId] = useState('cavite');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const filteredNeighborhoods = NEIGHBORHOOD_STORIES.filter(hood => 
    activeFilter === 'all' || hood.supportedTypes.includes(activeFilter)
  );

  // Auto-select the first item when filter changes
  useEffect(() => {
    if (filteredNeighborhoods.length > 0 && !filteredNeighborhoods.find(h => h.id === activeId)) {
      setActiveId(filteredNeighborhoods[0].id);
    }
  }, [activeFilter, filteredNeighborhoods, activeId]);

  return (
    <section
      id="neighborhood-spotlights-inner"
      className="w-full min-h-screen flex items-center justify-center bg-[#FBFBF9] py-12 md:py-16 border-b border-[#D1D5DB] relative z-20 transition-colors duration-500 overflow-hidden font-sans text-[#141717]"
      style={{
        backgroundImage: "url('/images/neighborhood-pattern.png')",
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">

        {/* Section Header */}
        <div className="mb-8 md:mb-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-[2px] bg-[#0D4446]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
              Where We Operate
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#141717] tracking-tight leading-tight">
            Explore Properties & Neighborhoods
          </h2>
          <p className="text-sm sm:text-base text-[#5C6768] font-normal leading-relaxed pt-1">
            Explore the most prestigious residential enclaves across Metro Manila. Select a property type to discover curated communities that offer unparalleled lifestyles for your family.
          </p>
        </div>

        {/* Property Category Filters */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {PROPERTY_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeFilter === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 text-sm font-bold whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0D4446] border-[#0D4446] text-white shadow-md'
                    : 'bg-white border-[#D8DFDF] text-[#5C6768] hover:border-[#0D4446] hover:text-[#0D4446]'
                }`}
              >
                {Icon && <Icon size={18} stroke={isActive ? 2.5 : 2} />}
                {category.title}
              </button>
            );
          })}
        </div>

        {/* ─── EXPANDING ACCORDION ─── */}
        <div className="w-full">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-[500px] md:h-[560px] lg:h-[600px] w-full">
            <AnimatePresence mode="popLayout">
              {filteredNeighborhoods.map((hood) => {
                const isActive = activeId === hood.id;

                return (
                  <motion.div
                    key={hood.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      if (isActive) {
                        navigate('/properties', { state: { search: hood.name } });
                      } else {
                        setActiveId(hood.id);
                      }
                    }}
                    onMouseEnter={() => setActiveId(hood.id)}
                    className={`group relative rounded-[5px] border border-[#D1D5DB] overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] select-none flex flex-col justify-between bg-slate-100 ${isActive
                        ? 'flex-[3.5] lg:flex-[4] shadow-[0_20px_40px_rgba(0,0,0,0.18)] border-[#141717]'
                        : 'flex-[1] shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] hover:border-[#141717]'
                      }`}
                  >
                    {/* Architecture Photography — crisp, no blur */}
                    <img
                      src={hood.image}
                      alt={hood.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out ${isActive ? 'scale-105' : 'scale-100 brightness-95 group-hover:brightness-100'
                        }`}
                    />

                    {/* Dark Vignette for crisp white text contrast */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isActive
                          ? 'bg-gradient-to-t from-black/80 via-black/25 to-transparent'
                          : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                        }`}
                    />

                    {/* ACTIVE EXPANDED STATE — Title on Left, View Properties on Lower Right */}
                    {isActive ? (
                      <div className="relative z-10 w-full h-full p-6 sm:p-8 md:p-10 flex flex-col justify-end">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
                          <div>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans drop-shadow-lg">
                              {hood.name}
                            </h3>
                          </div>

                          {/* Lower Right: View Properties Button with 30° Angled Arrow */}
                          <div className="shrink-0 mb-1">
                            <div
                              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/95 text-[#0D4446] backdrop-blur-md shadow-lg border border-white/70 group-hover:bg-white group-hover:shadow-2xl transition-all duration-300 cursor-pointer"
                              title="View properties"
                            >
                              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider font-sans whitespace-nowrap">
                                View properties
                              </span>
                              <span
                                className="inline-flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
                                style={{ transform: 'rotate(-30deg)' }}
                                aria-hidden="true"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                  <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* COLLAPSED INACTIVE STRIP — Vertical Title with 30° Angled Arrow at Lower Section */
                      <div className="relative z-10 w-full h-full p-4 flex flex-col justify-end items-center gap-4">
                        <div className="[writing-mode:vertical-rl] rotate-180 text-white/90 group-hover:text-white font-bold text-xs sm:text-sm uppercase tracking-[0.25em] whitespace-nowrap drop-shadow-md select-none transition-colors">
                          {hood.name}
                        </div>
                        <div
                          className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/90 group-hover:bg-white group-hover:text-[#0D4446] transition-all duration-300 shadow-xs mb-2"
                          title={`View properties in ${hood.name}`}
                        >
                          <span
                            className="inline-flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            style={{ transform: 'rotate(-30deg)' }}
                            aria-hidden="true"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
