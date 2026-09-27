import React from 'react';
import { motion } from 'framer-motion';
import Button from '../core/Button';
import { useNavigate } from 'react-router-dom';

export default function PropertyCard({ property, variant = 'vertical', variants }) {
  const navigate = useNavigate();
  // Common animation config if 'variants' is not provided by parent
  const cardAnimation = variants || {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  if (variant === 'large') {
    return (
      <motion.div
        variants={cardAnimation}
        whileHover={{ y: -8, scale: 1.015 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="group bg-white rounded-[14px] overflow-hidden shadow-[0_16px_36px_rgba(13,68,70,0.06)] hover:shadow-[0_28px_56px_rgba(13,68,70,0.12)] border border-[#E5EBEB] transition-all duration-300 flex flex-col h-full relative cursor-pointer"
        onClick={() => navigate(`/properties/${property.id}`)}
      >
        {property.badge && (
          <div className="absolute top-4 left-4 z-20 bg-[#0D4446] text-white text-[11px] font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-[6px] flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[15px] icon-fill">star</span> {property.badge}
          </div>
        )}
        <div className="relative w-full h-80 overflow-hidden bg-[#F4F5F4]">
          <img
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={property.image}
          />
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-[8px] border border-black/5 shadow-sm">
            <span className="text-xl lg:text-2xl font-bold font-mono text-[#0D4446] tabular-nums">
              {property.price}
            </span>
          </div>
        </div>
        <div className="p-8 flex flex-col flex-grow">
          <h3 className="text-xl lg:text-2xl font-bold font-display text-[#141717] mb-2 line-clamp-1 group-hover:text-[#0D4446] transition-colors">
            {property.name}
          </h3>
          <p className="text-sm md:text-base text-[#5C6768] leading-relaxed font-sans flex items-center gap-1.5 mb-5">
            <span className="material-symbols-outlined text-[18px] text-[#0D4446]">location_on</span>
            {property.location}
          </p>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-auto mb-6">
            <div className="flex items-center gap-1.5 bg-[#F4F5F4] border border-[#D8DFDF]/60 px-3 py-1.5 rounded-[6px]">
              <span className="material-symbols-outlined text-[16px] text-[#0D4446]">bed</span>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#5C6768] font-mono tabular-nums">{property.beds}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F4F5F4] border border-[#D8DFDF]/60 px-3 py-1.5 rounded-[6px]">
              <span className="material-symbols-outlined text-[16px] text-[#0D4446]">shower</span>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#5C6768] font-mono tabular-nums">{property.baths}</span>
            </div>
            {property.parking && (
              <div className="flex items-center gap-1.5 bg-[#F4F5F4] border border-[#D8DFDF]/60 px-3 py-1.5 rounded-[6px]">
                <span className="material-symbols-outlined text-[16px] text-[#0D4446]">directions_car</span>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[#5C6768] font-mono tabular-nums">{property.parking}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#F4F5F4] border border-[#D8DFDF]/60 px-3 py-1.5 rounded-[6px]">
              <span className="material-symbols-outlined text-[16px] text-[#0D4446]">square_foot</span>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#5C6768] font-mono tabular-nums">{property.area}</span>
            </div>
          </div>
          <Button variant="primary" size="full" onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}`); }}>
            View Details
          </Button>
        </div>
      </motion.div>
    );
  }
  // Default Vertical
  return (
    <motion.div
      variants={cardAnimation}
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="group bg-white rounded-[14px] overflow-hidden shadow-[0_16px_36px_rgba(13,68,70,0.06)] hover:shadow-[0_28px_56px_rgba(13,68,70,0.12)] border border-[#E5EBEB] transition-all duration-300 flex flex-col h-full relative cursor-pointer"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F4F5F4]">
        {property.image ? (
          <img
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={property.image}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#5C6768]/40">
            <span className="material-symbols-outlined text-5xl">image</span>
          </div>
        )}
        <div className="w-9 h-9 absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-full text-[#5C6768] hover:text-[#E76F51] transition-colors shadow-sm z-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">favorite</span>
        </div>
        {property.badge && (
          <div className="absolute bottom-3 left-3 bg-[#0D4446]/95 text-white backdrop-blur-sm px-2.5 py-1 rounded-[6px] shadow-sm z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">{property.badge}</span>
          </div>
        )}
      </div>
      <div className="p-6 md:p-7 flex flex-col flex-grow">
        <div className="mb-2">
          <span className="text-xl lg:text-2xl font-bold font-mono text-[#0D4446] tabular-nums tracking-tight">
            {property.price}
          </span>
        </div>
        <h3 className="text-lg lg:text-xl font-bold font-display text-[#141717] mb-1 line-clamp-1 group-hover:text-[#0D4446] transition-colors">
          {property.name}
        </h3>
        <p className="text-sm md:text-base text-[#5C6768] leading-relaxed font-sans flex items-center gap-1.5 mb-4">
          <span className="material-symbols-outlined text-[16px] text-[#0D4446]">location_on</span> {property.location}
        </p>
        <div className="grid grid-cols-2 gap-2 text-[#5C6768] mt-auto bg-[#F4F5F4] border border-[#D8DFDF]/60 rounded-[8px] p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0D4446]">bed</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider font-mono tabular-nums">{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0D4446]">shower</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider font-mono tabular-nums">{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0D4446]">directions_car</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider font-mono tabular-nums">{property.parking || 0} Cars</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0D4446]">square_foot</span>
            <span className="text-[12px] font-semibold uppercase tracking-wider font-mono tabular-nums">{property.area}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
