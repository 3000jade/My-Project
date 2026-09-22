import { motion } from 'framer-motion';

const NEIGHBORHOODS = [
  {
    id: 'bgc',
    name: 'Bonifacio Global City',
    tagline: 'The Pulse of the Modern City',
    description: 'A master-planned metropolis offering premium high-rise living, world-class dining, and pedestrian-friendly greenways.',
    image: 'https://images.unsplash.com/photo-1577901089617-64906f362141?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'forbes',
    name: 'Forbes Park',
    tagline: 'Heritage and Exclusivity',
    description: 'The premier residential enclave in the Philippines, defined by sprawling estates, ancient acacia trees, and absolute privacy.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'dasma',
    name: 'Dasmariñas Village',
    tagline: 'A Sanctuary in the Metropolis',
    description: 'A highly sought-after community blending lush, tree-lined avenues with close proximity to the Makati central business district.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
  }
];

export default function NeighborhoodSpotlightsSection() {
  return (
    <section className="w-full bg-[#f9f9f7] py-16 md:py-24 border-b border-[#e5e5df] relative z-20">
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-[2px] bg-[#1b4d4b]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase font-sans">
                Where We Operate
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f1722] tracking-tight font-sans">
              Neighborhood Spotlights
            </h2>
            <p className="mt-4 text-gray-500 font-sans text-sm md:text-base leading-relaxed">
              Discover the most prestigious addresses in Metro Manila. We curate properties exclusively within highly secure, master-planned communities that offer unparalleled lifestyles.
            </p>
          </div>
          
          <button className="self-start md:self-auto text-xs font-bold uppercase tracking-wider text-[#1b4d4b] hover:text-[#0e2c2c] font-sans flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#1b4d4b]/20 hover:border-[#1b4d4b] hover:bg-[#1b4d4b]/5 transition-all shadow-sm">
            <span>Explore All Areas</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Spotlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {NEIGHBORHOODS.map((hood, index) => (
            <motion.div 
              key={hood.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="group cursor-pointer flex flex-col"
            >
              {/* Image Container with Soft Functionalism Physics */}
              <div className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-[#0f1722] shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                <img 
                  src={hood.image} 
                  alt={hood.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Subtle vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-0 transition-opacity duration-500" />
              </div>
              
              {/* Content Block (Clean, whitespace heavy) */}
              <div className="pr-4">
                <h3 className="text-xl md:text-2xl font-extrabold font-sans text-[#0f1722] mb-1 group-hover:text-[#1b4d4b] transition-colors">
                  {hood.name}
                </h3>
                <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#c9684b] mb-3">
                  {hood.tagline}
                </div>
                <p className="text-sm text-gray-500 font-sans leading-relaxed line-clamp-3">
                  {hood.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
