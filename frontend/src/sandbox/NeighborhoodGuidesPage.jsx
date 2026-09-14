import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeighborhoodCard from '../components/ui/NeighborhoodCard';
import { mockNeighborhoods } from '../mockData/mockNeighborhoods';

export default function NeighborhoodGuidesPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  const categories = ['All', 'Urban Core', 'Gated Subdivisions', 'Heritage Enclave'];

  const filteredNeighborhoods = activeTab === 'All' 
    ? mockNeighborhoods 
    : mockNeighborhoods.filter(n => n.category === activeTab);

  return (
    <div className="bg-[#F9F9F8] min-h-screen pt-[120px] pb-32">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold font-sans bg-[#266F71]/10 text-[#174849] uppercase tracking-[0.2em] mb-6 border border-[#266F71]/20">
            District Intelligence
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-[#174849] mb-6">
            Curated <span className="text-[#FB8E5D]">Neighborhood Guides.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-sans leading-relaxed">
            Explore the most sought-after enclaves. From cosmopolitan centers to ultra-exclusive gated communities, discover where your legacy belongs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-bold font-sans uppercase tracking-[0.1em] transition-all ${
                activeTab === cat 
                  ? 'bg-[#174849] text-white shadow-md' 
                  : 'bg-white text-[#174849] border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredNeighborhoods.map((n, idx) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <NeighborhoodCard 
                  neighborhood={n} 
                  onClick={() => setSelectedNeighborhood(n)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNeighborhood && (
          <motion.div 
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNeighborhood(null)}
          >
            <motion.div 
              className="bg-white w-full max-w-4xl h-[85vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
              initial={{ scale: 0.95, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              data-lenis-prevent="true"
            >
              <button 
                onClick={() => setSelectedNeighborhood(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/50 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="h-64 md:h-80 relative shrink-0">
                <img src={selectedNeighborhood.image} alt={selectedNeighborhood.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h2 className="text-4xl font-display font-extrabold text-white">{selectedNeighborhood.name}</h2>
                  <span className="inline-block mt-2 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {selectedNeighborhood.category}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12" data-lenis-prevent="true">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-4 font-sans border-b border-gray-100 pb-2">Overview</h3>
                    <p className="text-gray-600 font-sans leading-relaxed mb-8">
                      {selectedNeighborhood.description}
                    </p>

                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-4 font-sans border-b border-gray-100 pb-2">Top Educational Institutions</h3>
                    <ul className="list-disc list-inside text-gray-600 font-sans space-y-2 mb-8">
                      {selectedNeighborhood.schools.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>

                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-4 font-sans border-b border-gray-100 pb-2">Lifestyle & Amenities</h3>
                    <ul className="list-disc list-inside text-gray-600 font-sans space-y-2">
                      {selectedNeighborhood.lifestyle.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-4 font-sans border-b border-gray-100 pb-2">Market Data</h3>
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Avg Price/sqm</span>
                        <span className="text-xl text-[#174849] font-bold font-display">{selectedNeighborhood.metrics.avgPricePerSqm}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">5-Year Appreciation</span>
                        <span className="text-xl text-[#FB8E5D] font-bold font-display">{selectedNeighborhood.metrics.appreciation}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Walk Score</span>
                        <span className="text-xl text-[#174849] font-bold font-display">{selectedNeighborhood.metrics.walkScore}/100</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Michelin Dining</span>
                        <span className="text-xl text-[#174849] font-bold font-display">{selectedNeighborhood.metrics.michelinDining} Establishments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
