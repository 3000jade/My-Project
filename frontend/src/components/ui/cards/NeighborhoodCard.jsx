import React from 'react';
import { motion } from 'framer-motion';

export default function NeighborhoodCard({ neighborhood, onClick }) {
  return (
    <motion.div 
      onClick={onClick}
      className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group hover:shadow-[0_20px_40px_rgba(23,72,73,0.08)] transition-all duration-300"
      whileHover={{ y: -5 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={neighborhood.image} 
          alt={neighborhood.name} 
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md text-[#174849] text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
            {neighborhood.category}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="text-2xl font-display font-extrabold text-white tracking-tight">{neighborhood.name}</h3>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-gray-500 font-sans line-clamp-2 mb-6">
          {neighborhood.description}
        </p>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Avg Price/sqm</span>
            <span className="text-sm text-[#174849] font-bold font-sans">{neighborhood.metrics.avgPricePerSqm}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Appreciation (5Y)</span>
            <span className="text-sm text-[#FB8E5D] font-bold font-sans">{neighborhood.metrics.appreciation}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Walk Score</span>
            <span className="text-sm text-[#174849] font-bold font-sans">{neighborhood.metrics.walkScore}/100</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">School Rating</span>
            <span className="text-sm text-[#174849] font-bold font-sans">{neighborhood.metrics.schoolRating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
