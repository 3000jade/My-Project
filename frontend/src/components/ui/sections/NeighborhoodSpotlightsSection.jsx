import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconHome, 
  IconBuildingSkyscraper, 
  IconHome2, 
  IconBuildingStore
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
    tag: 'Label',
    name: 'Location 1',
    location: 'Subtitle',
    tagline: 'Subtitle',
    description: 'Short description.',
    image: null,
    stats: 'Summary',
    supportedTypes: ['house-and-lot', 'townhouse', 'duplex']
  },
  {
    id: 'laguna',
    tag: 'Label',
    name: 'Location 2',
    location: 'Subtitle',
    tagline: 'Subtitle',
    description: 'Short description.',
    image: null,
    stats: 'Summary',
    supportedTypes: ['house-and-lot', 'townhouse', 'duplex']
  },
  {
    id: 'antipolo',
    tag: 'Label',
    name: 'Location 3',
    location: 'Subtitle',
    tagline: 'Subtitle',
    description: 'Short description.',
    image: null,
    stats: 'Summary',
    supportedTypes: ['house-and-lot', 'townhouse']
  },
  {
    id: 'taguig-bgc',
    tag: 'Label',
    name: 'Location 4',
    location: 'Subtitle',
    tagline: 'Subtitle',
    description: 'Short description.',
    image: null,
    stats: 'Summary',
    supportedTypes: ['condominium']
  },
  {
    id: 'quezon-city',
    tag: 'Label',
    name: 'Location 5',
    location: 'Subtitle',
    tagline: 'Subtitle',
    description: 'Short description.',
    image: null,
    stats: 'Summary',
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
      className="w-full min-h-screen flex items-center justify-center bg-[#F8FAFC] py-12 md:py-16 border-b border-[#E2E8F0] relative z-20 transition-colors duration-500 overflow-hidden font-sans text-[#1E293B]"
    >
      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">

        {/* Section Header */}
        <div className="mb-8 md:mb-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-[2px] bg-[#0F766E]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#0F766E] uppercase">
              Subtitle
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
            Section Title
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] font-normal leading-relaxed pt-1">
            Section description.
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
                    ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-md'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#0F766E] hover:text-[#0F766E]'
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
                    className={`group relative rounded-[5px] border border-[#D1D5DB] overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] select-none flex flex-col justify-between bg-white ${isActive
                        ? 'flex-[3.5] lg:flex-[4] shadow-[0_20px_40px_rgba(0,0,0,0.08)] border-[#141717]'
                        : 'flex-[1] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)] hover:border-[#141717]'
                      }`}
                  >
                    {/* White Image Box */}
                    <div
                      role="img"
                      aria-label={hood.name}
                      className="absolute inset-0 w-full h-full bg-white flex items-center justify-center"
                    >
                      {isActive && (
                        <span className="text-xs font-medium text-[#94A3B8] tracking-wide uppercase">
                          Image
                        </span>
                      )}
                    </div>

                    {/* ACTIVE EXPANDED STATE — Title on Left, View Properties on Lower Right */}
                    {isActive ? (
                      <div className="relative z-10 w-full h-full p-6 sm:p-8 md:p-10 flex flex-col justify-end">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
                          <div>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1E293B] leading-tight font-sans">
                              {hood.name}
                            </h3>
                          </div>

                          {/* Lower Right: View Properties Button with 30° Angled Arrow */}
                          <div className="shrink-0 mb-1">
                            <div
                              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#F8FAFC] text-[#0D4446] shadow-xs border border-[#E2E8F0] group-hover:bg-white group-hover:shadow-md transition-all duration-300 cursor-pointer"
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
                        <div className="[writing-mode:vertical-rl] rotate-180 text-[#64748B] group-hover:text-[#1E293B] font-bold text-xs sm:text-sm uppercase tracking-[0.25em] whitespace-nowrap select-none transition-colors">
                          {hood.name}
                        </div>
                        <div
                          className="w-7 h-7 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#0D4446] group-hover:bg-[#0D4446] group-hover:text-white transition-all duration-300 shadow-xs mb-2"
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
