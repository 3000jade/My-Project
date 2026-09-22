import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GALLERY_ITEMS = [
  // ROW 1: 3-Col (Narrow) | 5-Col (Wide) | 4-Col (Medium)
  {
    id: '1',
    title: 'Ayala Alabang Sanctuary',
    listingType: 'Private Estate',
    architect: 'Leandro V. Locsin Partners',
    year: '2025',
    location: 'Ayala Alabang, Muntinlupa',
    priceNumeric: '185,000,000',
    priceSuffix: '',
    specs: '5 Beds • 6 Baths • 850 sqm',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Meticulously designed estate balancing raw modernist concrete with private Japanese Zen courtyards.',
    fullDescription: 'Floor-to-ceiling thermal apertures frame tranquil reflecting pools. Features a bespoke subterranean wine cellar, cinema pavilion, and landscaped grounds.',
    amenities: ['Private Cinema', 'Wine Cellar', 'Reflecting Basin', 'Smart Home System']
  },
  {
    id: '2',
    title: 'The Proscenium Sky Penthouse',
    listingType: 'Sky Residence',
    architect: 'Carlos Ott Architects',
    year: '2024',
    location: 'Rockwell Center, Makati',
    priceNumeric: '450,000',
    priceSuffix: '/ mo',
    specs: '3 Beds • 3.5 Baths • 280 sqm',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Commanding top-tier sky residence featuring wraparound glass walls overlooking the metropolitan skyline.',
    fullDescription: 'Private high-speed biometric elevator access opens into expansive double-height living galleries with imported Italian marble and a sunset viewing loggia.',
    amenities: ['Private Elevator', 'Skyline Loggia', 'Wine Vault', 'Concierge Service']
  },
  {
    id: '3',
    title: 'Aurelia Residences Horizon',
    listingType: 'Luxury High-Rise',
    architect: 'Skidmore, Owings & Merrill',
    year: '2025',
    location: 'Bonifacio Global City, Taguig',
    priceNumeric: '145,000,000',
    priceSuffix: '',
    specs: '3 Beds • 3.5 Baths • 240 sqm',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Uninterrupted panorama across the Manila Golf Course with floor-to-ceiling double-glazed envelopes.',
    fullDescription: 'Crafted with bespoke Italian fixtures, motorized solar screens, and bespoke marble vanities in the heart of Bonifacio Global City.',
    amenities: ['Golf Course Vista', 'Motorized Louvers', 'Lap Pool', 'Private Valet']
  },

  // ROW 2: 5-Col (Wide) | 4-Col (Medium) | 3-Col (Narrow)
  {
    id: '4',
    title: 'Forbes Park Brutalist Villa',
    listingType: 'Architectural Monolith',
    architect: 'Studio Veldt Architecture',
    year: '2024',
    location: 'Forbes Park, Makati',
    priceNumeric: '420,000,000',
    priceSuffix: '',
    specs: '6 Beds • 7 Baths • 1,200 sqm',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Board-formed exposed concrete complemented by custom patinated bronze joinery and private bamboo groves.',
    fullDescription: 'Museum-grade directional wall illumination, 14-foot ceiling heights, and a private 25-meter lap pool surrounded by old-growth tropical foliage.',
    amenities: ['25m Lap Pool', 'Subterranean Vault', 'Guard Outpost', 'Bespoke Joinery']
  },
  {
    id: '5',
    title: 'Dasmariñas Modern Pavilion',
    listingType: 'Contemporary Pavilion',
    architect: 'Marmol Radziner',
    year: '2025',
    location: 'Dasmariñas Village, Makati',
    priceNumeric: '280,000,000',
    priceSuffix: '',
    specs: '4 Beds • 4.5 Baths • 680 sqm',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Cantilevered steel roof planes and expansive pocket glass walls merging living zones with reflection ponds.',
    fullDescription: 'Engineered with geothermal climate controls, smart shading pergolas, and an artisanal chef demonstration kitchen.',
    amenities: ['Reflection Ponds', 'Demonstration Kitchen', 'Smart Pergolas', 'Wine Room']
  },
  {
    id: '6',
    title: 'The Suites at BGC Sky Villa',
    listingType: 'Duplex Penthouse',
    architect: 'Arquitectonica',
    year: '2024',
    location: 'High Street South, Taguig',
    priceNumeric: '260,000',
    priceSuffix: '/ mo',
    specs: '2 Beds • 2.5 Baths • 190 sqm',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop',
    shortDescription: 'Seamless duplex layouts framing direct vistas of the pedestrian High Street promenade and skyline.',
    fullDescription: 'Complete with integrated designer appliances, automated Lutron blinds, and direct biometric private lobby access.',
    amenities: ['Biometric Access', 'Lutron Automation', 'Fitness Suite', 'Private Parking']
  }
];

export default function ArchitecturalGallerySection() {
  const [modalItem, setModalItem] = useState(null);

  // Divide into Row 1 (first 3) and Row 2 (next 3) for the asymmetric staggered mosaic
  const row1Items = GALLERY_ITEMS.slice(0, 3);
  const row2Items = GALLERY_ITEMS.slice(3, 6);

  // Layout ratio classes for Row 1: 3-Col (25%) : 5-Col (41.7%) : 4-Col (33.3%)
  const getRow1ColClasses = (index) => {
    switch (index) {
      case 0: return 'lg:flex-[3]'; // Narrow
      case 1: return 'lg:flex-[5]'; // Wide
      case 2: return 'lg:flex-[4]'; // Medium
      default: return 'lg:flex-1';
    }
  };

  // Layout ratio classes for Row 2: 5-Col (41.7%) : 4-Col (33.3%) : 3-Col (25%)
  const getRow2ColClasses = (index) => {
    switch (index) {
      case 0: return 'lg:flex-[5]'; // Wide
      case 1: return 'lg:flex-[4]'; // Medium
      case 2: return 'lg:flex-[3]'; // Narrow
      default: return 'lg:flex-1';
    }
  };

  return (
    <section 
      id="gallery-exhibition" 
      className="w-full bg-[#ffffff] pt-8 md:pt-12 pb-16 md:pb-24 border-b border-[#e5e5df] relative z-20 text-[#0f1722]"
    >
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 font-sans">
        
        {/* Section Masthead: Reference Style (— GALLERY) */}
        <div className="mb-8 md:mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#1b4d4b]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase font-sans">
                Gallery
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-[#0f1722] tracking-tight">
              Featured Properties
            </h2>
          </div>
        </div>

        {/* ASYMMETRIC STAGGERED MOSAIC GRID (Faithful to Reference Layout) */}
        <div className="space-y-[clamp(0.875rem,1.5vw,1.25rem)]">
          
          {/* ROW 1: 3 COLS | 5 COLS | 4 COLS */}
          <div className="flex flex-col md:flex-row gap-[clamp(0.875rem,1.5vw,1.25rem)] h-auto md:h-[clamp(280px,28vw,380px)]">
            {row1Items.map((item, index) => {
              const colClass = getRow1ColClasses(index);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  onClick={() => setModalItem(item)}
                  className={`group relative rounded-[2px] overflow-hidden border border-[#e5e5df] bg-[#0f1722] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 h-[280px] md:h-full flex flex-col justify-end ${colClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b4d4b]`}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${item.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalItem(item); }}
                >
                  {/* Background Image with Gentle Scale Physics (Full Color Restored) */}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* TRANSPARENT GLASS DOCKED BAR: HIDDEN AT REST, REVEALS NAME & PRICE ON HOVER */}
                  <div className="relative z-10 w-full backdrop-blur-md bg-black/25 border-t border-white/25 px-4 py-3 flex items-center justify-between gap-3 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-300 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight truncate drop-shadow-sm">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-0.5 shrink-0 font-sans font-bold text-white text-sm sm:text-base drop-shadow-sm">
                      <span className="text-xs font-bold text-white/90 mr-0.5">₱</span>
                      <span>{item.priceNumeric}</span>
                      {item.priceSuffix && (
                        <span className="text-[10px] sm:text-xs font-medium text-white/80 ml-0.5">
                          {item.priceSuffix}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ROW 2: 5 COLS | 4 COLS | 3 COLS (Counter-Balanced Inverted Syncopation) */}
          <div className="flex flex-col md:flex-row gap-[clamp(0.875rem,1.5vw,1.25rem)] h-auto md:h-[clamp(280px,28vw,380px)]">
            {row2Items.map((item, index) => {
              const colClass = getRow2ColClasses(index);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                  onClick={() => setModalItem(item)}
                  className={`group relative rounded-[2px] overflow-hidden border border-[#e5e5df] bg-[#0f1722] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 h-[280px] md:h-full flex flex-col justify-end ${colClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b4d4b]`}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${item.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalItem(item); }}
                >
                  {/* Background Image with Gentle Scale Physics (Full Color Restored) */}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* TRANSPARENT GLASS DOCKED BAR: HIDDEN AT REST, REVEALS NAME & PRICE ON HOVER */}
                  <div className="relative z-10 w-full backdrop-blur-md bg-black/25 border-t border-white/25 px-4 py-3 flex items-center justify-between gap-3 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-300 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight truncate drop-shadow-sm">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-0.5 shrink-0 font-sans font-bold text-white text-sm sm:text-base drop-shadow-sm">
                      <span className="text-xs font-bold text-white/90 mr-0.5">₱</span>
                      <span>{item.priceNumeric}</span>
                      {item.priceSuffix && (
                        <span className="text-[10px] sm:text-xs font-medium text-white/80 ml-0.5">
                          {item.priceSuffix}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>

      {/* FULLSCREEN STUDY MODAL (Compliant with AGENTS.md Physics & Lenis Prevention) */}
      <AnimatePresence>
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 font-sans text-[#0f1722]">
            {/* Heavy Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setModalItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body with Spring Entrance Physics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              data-lenis-prevent="true"
              className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-[#e5e5df] rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row overflow-y-auto no-scrollbar"
            >
              {/* Premium White Circle Close Button */}
              <button
                onClick={() => setModalItem(null)}
                aria-label="Close modal"
                className="absolute top-5 right-5 z-20 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors cursor-pointer text-black"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">
                  close
                </span>
              </button>

              {/* Modal Left Image Stage */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center min-h-[320px]">
                <img
                  src={modalItem.image}
                  alt={modalItem.title}
                  className="w-full h-full max-h-[70vh] object-cover"
                />
              </div>

              {/* Modal Right Dossier Panel */}
              <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col justify-between bg-[#ffffff]">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1b4d4b] block mb-1">
                      {modalItem.listingType}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#0f1722] tracking-tight leading-tight">
                      {modalItem.title}
                    </h3>
                    <p className="text-xs font-medium font-sans text-[#5a6472] mt-1">
                      {modalItem.location} • {modalItem.architect} ({modalItem.year})
                    </p>
                  </div>

                  {/* Philippine Peso Price Card */}
                  <div className="p-4 rounded-xl bg-[#f9f9f7] border border-[#e5e5df]">
                    <div className="text-[10px] font-semibold text-[#5a6472] uppercase tracking-wider">
                      Acquisition Value
                    </div>
                    <div className="flex items-baseline gap-1 mt-1 text-[#0f1722] font-sans font-extrabold text-2xl sm:text-3xl">
                      <span className="text-lg font-extrabold text-emerald-600">₱</span>
                      <span>{modalItem.priceNumeric}</span>
                      {modalItem.priceSuffix && (
                        <span className="text-xs font-medium text-gray-500 ml-1">
                          {modalItem.priceSuffix}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 font-medium font-sans mt-1">
                      {modalItem.specs}
                    </div>
                  </div>

                  {/* Property Narrative */}
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans font-normal">
                    {modalItem.fullDescription}
                  </p>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {modalItem.amenities.map((amenity, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-gray-100 text-gray-700">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#e5e5df]">
                  <button
                    onClick={() => setModalItem(null)}
                    className="w-full h-[54px] rounded-lg bg-[#1b4d4b] hover:bg-[#123635] text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Inquire Portfolio Asset</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
