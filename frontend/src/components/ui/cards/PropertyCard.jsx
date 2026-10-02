import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  IconMapPin, 
  IconBed, 
  IconBath, 
  IconCar, 
  IconDimensions,
  IconArrowRight 
} from '@tabler/icons-react';

export default function PropertyCard({ property, variant = 'vertical', variants }) {
  const navigate = useNavigate();
  
  // Common animation config if 'variants' is not provided by parent
  const cardAnimation = variants || {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const getFinancingInfo = (item) => {
    const isRent = item.priceSuffix || (item.status && item.status.toLowerCase().includes('rent'));
    const rawPrice = item.price ? item.price.toString().replace(/,/g, '') : '0';
    const numPrice = parseInt(rawPrice, 10);
    
    if (isRent) {
      return {
        label: 'Monthly Lease',
        monthly: `₱${numPrice.toLocaleString()}/mo`,
        tcp: `₱${numPrice.toLocaleString()} / month`
      };
    }
    
    const loanAmount = numPrice * 0.80;
    const r = 0.075 / 12;
    const n = 15 * 12;
    const monthlyAmort = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    return {
      label: 'Est. Monthly',
      monthly: `₱${Math.round(monthlyAmort).toLocaleString()}/mo`,
      tcp: `TCP: ₱${numPrice.toLocaleString()}`
    };
  };

  const finance = getFinancingInfo(property);
  const propertyTitle = property.name || property.title;
  const propertyBeds = property.beds ? String(property.beds) : (property.specs ? property.specs.split(' • ')[0].replace(' Beds', '').replace(' Bed', '') : '0');
  const propertyBaths = property.baths ? String(property.baths) : (property.specs ? property.specs.split(' • ')[1].replace(' Baths', '').replace(' Bath', '') : '0');
  const propertyParking = property.parking ? String(property.parking).replace(' Cars', '') : '0';

  return (
    <motion.div
      variants={cardAnimation}
      onClick={() => navigate(`/properties/${property.id}`)}
      className="relative bg-white rounded-[10px] border border-[#D1D5DB] shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(13,68,70,0.12)] hover:border-[#0D4446]/40 hover:-translate-y-1.5 transition-all duration-700 ease-out group cursor-pointer overflow-hidden flex flex-col justify-between h-full w-full z-10"
      tabIndex={0}
      role="button"
      aria-label={`View details for ${propertyTitle}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/properties/${property.id}`); }}
    >
      {/* Dynamic Top Accent Border */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#E76F51] transition-colors duration-500 z-10" 
      />

      {/* Upper Image Section with Badges, Reference Code, Title, and Location */}
      <div>
        <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-900">
          <img
            src={property.image}
            alt={propertyTitle}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

          {/* Top Badges: Single Status Pill */}
          <div className="absolute top-3 left-3 z-10">
            <span className="backdrop-blur-md bg-white/95 text-[#0D4446] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xs border border-white/40">
              {property.badge || property.status || (property.priceSuffix ? 'For Rent' : 'For Sale')}
            </span>
          </div>

          {/* Title and Location overlaid on image bottom */}
          <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white line-clamp-1 leading-snug drop-shadow-sm group-hover:text-white transition-colors">
              {propertyTitle}
            </h3>
            <p className="flex items-center gap-1 text-xs text-stone-300 font-sans mt-0.5">
              <IconMapPin size={14} stroke={2} className="shrink-0 text-stone-400" />
              <span className="truncate">{property.location}</span>
            </p>
          </div>
        </div>

        {/* Body Content: Price + Metrics */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Price Heading */}
          <div>
            <span className="text-[11px] sm:text-xs uppercase text-[#E76F51] font-mono font-bold block leading-none mb-1">
              {finance.label}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#141717] font-sans tracking-tight leading-tight">
              {finance.monthly}
            </div>
            <div className="text-[11px] sm:text-xs font-mono text-[#5C6768] mt-1 tracking-wide">
              {finance.tcp}
            </div>
          </div>

          {/* 4 Metric Cards with Icons */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5 pb-2 border-b border-transparent text-center">
            <div className="py-2 px-1.5 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-0.5">
                <IconDimensions size={16} stroke={2} className="text-[#0D4446]" />
                Area
              </span>
              <p className="text-[13px] sm:text-[14px] font-bold text-[#0D4446] font-mono mt-1 text-center leading-tight">
                {property.area}
              </p>
            </div>
            <div className="py-2 px-1.5 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-0.5">
                <IconBed size={16} stroke={2} className="text-[#0D4446]" />
                Beds
              </span>
              <p className="text-[13px] sm:text-[14px] font-bold text-[#0D4446] font-mono mt-1 text-center leading-tight">
                {propertyBeds}
              </p>
            </div>
            <div className="py-2 px-1.5 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-0.5">
                <IconBath size={16} stroke={2} className="text-[#0D4446]" />
                Baths
              </span>
              <p className="text-[13px] sm:text-[14px] font-bold text-[#0D4446] font-mono mt-1 text-center leading-tight">
                {propertyBaths}
              </p>
            </div>
            <div className="py-2 px-1.5 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-0.5">
                <IconCar size={16} stroke={2} className="text-[#0D4446]" />
                Parking
              </span>
              <p className="text-[13px] sm:text-[14px] font-bold text-[#0D4446] font-mono mt-1 text-center leading-tight">
                {propertyParking}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Stage: Agent Redesign + Inspect Action */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3.5 flex items-center justify-between border-t border-stone-200/80 mt-1">
        {/* Redesigned Agent Profile */}
        <div className="flex items-center gap-3 group/agent cursor-pointer">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" 
              alt="Listing Agent" 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-stone-200 transition-transform duration-300 group-hover/agent:scale-105" 
            />
            {/* Online Status Indicator */}
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[13px] sm:text-sm font-bold text-[#0D4446] leading-none group-hover/agent:text-[#E76F51] transition-colors duration-300">Elena Silva</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/properties/${property.id}`);
          }}
          className="btn-shine px-3 py-1.5 bg-[#0D4446] hover:bg-[#082b2d] text-white rounded-[5px] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shadow-sm relative overflow-hidden group/btn"
        >
          {/* Subtle shine effect wrapper */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shine_1.5s_ease-in-out_infinite]" />
          <span className="relative z-10">View Details</span>
          <IconArrowRight size={12} stroke={3} className="shrink-0 group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" />
        </button>
      </div>
    </motion.div>
  );
}
