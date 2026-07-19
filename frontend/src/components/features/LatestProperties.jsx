import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LatestProperties({ properties }) {
  const [sortBy, setSortBy] = useState('Newest');

  return (
    <section className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-20 py-24 lg:py-36">
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-tertiary">Latest Properties</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">Sort by:</span>
          <select
            className="bg-surface-container border-none rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans py-1 pr-8 pl-3 focus:ring-1 focus:ring-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Price: High to Low">Price: High to Low</option>
            <option value="Price: Low to High">Price: Low to High</option>
          </select>
        </div>
      </div>
      
      {properties && properties.length > 0 ? (
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
        >
          {properties.map(property => (
            <motion.div
              key={property.id}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-outline-variant/20 cursor-pointer"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container-low">
                {property.image ? (
                  <img
                    alt={property.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={property.image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline/40 text-5xl">image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm rounded-full p-2 text-outline-variant hover:text-tertiary-container transition-colors shadow-sm z-10">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </div>
                {property.badge && (
                  <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-sans">{property.badge}</span>
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-xl lg:text-2xl font-bold font-display text-primary">{property.price}</span>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold font-display text-tertiary mb-1 line-clamp-1 group-hover:text-primary-container transition-colors">
                  {property.name}
                </h3>
                <p className="text-base md:text-lg text-gray-500 leading-relaxed font-sans flex items-center gap-1 mb-4">
                  <span className="material-symbols-outlined text-[16px] text-outline">location_on</span> {property.location}
                </p>
                <div className="grid grid-cols-2 gap-2 text-on-surface-variant mt-auto mb-4 bg-surface-container-low rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">bed</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.beds} Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">shower</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.baths} Baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.parking} Cars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">square_foot</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.area}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="py-24 text-center text-tertiary bg-background rounded-2xl border border-outline-variant/30 shadow-sm"
        >
          <span className="material-symbols-outlined text-6xl opacity-30 mb-4 block">search_off</span>
          <p className="text-xl font-bold font-display text-tertiary mb-2">No properties found</p>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed font-sans">Try adjusting your filters or search keywords to find what you're looking for.</p>
        </motion.div>
      )}

      {properties && properties.length > 0 && (
        <div className="flex justify-center mt-stack-xl">
          <button className="bg-primary text-on-primary px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest font-sans premium-btn flex items-center gap-2">
            Load More Properties <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </button>
        </div>
      )}
    </section>
  );
}
