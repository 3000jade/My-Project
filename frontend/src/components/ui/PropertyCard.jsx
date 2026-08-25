import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
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
      <motion.div variants={cardAnimation} whileHover={{ y: -4, scale: 1.01 }} className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-outline-variant/20 h-full relative cursor-pointer" onClick={() => navigate(`?propertyId=${property.id}`)}>
        {property.badge && (
          <div className="absolute top-4 left-4 z-20 bg-tertiary-container text-white text-[11px] font-bold uppercase tracking-wider font-sans px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-[16px] icon-fill">star</span> {property.badge}
          </div>
        )}
        <div className="relative w-full h-80 overflow-hidden">
          <img alt={property.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={property.image} />
          <div className="absolute bottom-4 left-4 z-20 bg-surface/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
            <span className="text-xl lg:text-2xl font-bold font-display text-primary">{property.price}</span>
          </div>
        </div>
        <div className="p-8 flex flex-col flex-grow">
          <h3 className="text-xl lg:text-2xl font-bold font-display text-tertiary mb-2 line-clamp-1 group-hover:text-primary-container transition-colors">{property.name}</h3>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed font-sans flex items-center gap-1 mb-4">
            <span className="material-symbols-outlined text-[18px] text-outline">location_on</span>{property.location}
          </p>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-on-surface-variant mt-auto mb-6">
            <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md"><span className="material-symbols-outlined text-[18px]">bed</span><span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.beds}</span></div>
            <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md"><span className="material-symbols-outlined text-[18px]">shower</span><span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.baths}</span></div>
            {property.parking && (
              <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md"><span className="material-symbols-outlined text-[18px]">directions_car</span><span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.parking}</span></div>
            )}
            <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md"><span className="material-symbols-outlined text-[18px]">square_foot</span><span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.area}</span></div>
          </div>
          <Button variant="primary" size="full" onClick={(e) => { e.stopPropagation(); navigate(`?propertyId=${property.id}`); }}>View Details</Button>
        </div>
      </motion.div>
    );
  }
  // Default Vertical
  return (
    <motion.div
      variants={cardAnimation}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group bg-transparent rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-outline-variant/20 h-full relative cursor-pointer"
      onClick={() => navigate(`?propertyId=${property.id}`)}
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
        <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm rounded-full p-2 text-outline-variant hover:text-tertiary-container transition-colors shadow-sm z-10 flex items-center justify-center">
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
        <div className="grid grid-cols-2 gap-2 text-on-surface-variant mt-auto bg-surface-container-low rounded-lg p-3">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.parking || 0} Cars</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">square_foot</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">{property.area}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
