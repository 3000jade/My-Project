import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Hero3DCarousel({ properties = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // If we don't have enough properties, duplicate them to ensure smooth cyclic loop
  // We need at least 5 for L2, L1, Center, R1, R2 to look right.
  const displayProperties = properties.length < 5 
    ? [...properties, ...properties, ...properties].slice(0, 5) 
    : properties;

  const length = displayProperties.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % length);
  }, [length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  }, [length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handleCardClick = (relativeOffset, index, prop) => {
    if (relativeOffset === 0) {
      navigate(`?propertyId=${prop.id}`);
      return;
    }
    setCurrentIndex(index);
  };

  const getRelativeOffset = (index, current, totalLength) => {
    let diff = (index - current) % totalLength;
    if (diff < 0) diff += totalLength;
    
    if (diff === 0) return 0;
    if (diff === 1) return 1;
    if (diff === 2) return 2;
    if (diff === totalLength - 2) return -2;
    if (diff === totalLength - 1) return -1;
    return null; // Hidden items
  };

  const getTransform = (relativeOffset) => {
    switch (relativeOffset) {
      case 0: return { x: '0%', scale: 1, zIndex: 30, opacity: 1, boxShadow: '0 24px 50px -12px rgba(0,0,0,0.5)' }; // Center [LY-205]
      case 1: return { x: '35%', scale: 0.85, zIndex: 20, opacity: 0.8, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }; // R1 [LY-206]
      case 2: return { x: '65%', scale: 0.7, zIndex: 10, opacity: 0.4, boxShadow: 'none' }; // R2 [LY-207]
      case -1: return { x: '-35%', scale: 0.85, zIndex: 20, opacity: 0.8, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }; // L1 [LY-204]
      case -2: return { x: '-65%', scale: 0.7, zIndex: 10, opacity: 0.4, boxShadow: 'none' }; // L2 [LY-203]
      default: return { x: '0%', scale: 0.5, zIndex: 0, opacity: 0, boxShadow: 'none' }; // Hidden
    }
  };

  const activeProperty = displayProperties[currentIndex];

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] flex flex-col items-center justify-center overflow-hidden bg-black">
      
      {/* [LY-202] Ambient Blur Glow Filter Layer */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeProperty?.id || currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center blur-[100px] transform scale-110"
            style={{ backgroundImage: `url(${activeProperty?.image})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* CAROUSEL TRACK */}
      <div className="relative w-full max-w-[1440px] h-[60%] flex items-center justify-center perspective-1000 mt-[-40px]">
        {displayProperties.map((prop, index) => {
          const relativeOffset = getRelativeOffset(index, currentIndex, length);
          const transform = getTransform(relativeOffset);
          
          return (
            <motion.div
              key={`${prop.id}-${index}`}
              className="absolute w-[85%] md:w-[60%] lg:w-[45%] h-full rounded-2xl overflow-hidden cursor-pointer"
              animate={transform}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={() => handleCardClick(relativeOffset, index, prop)}
            >
              {/* Image Asset */}
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${prop.image})` }}
              />
              {/* Shadow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Content Reveal (Only fully visible when Center) */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 p-8"
                animate={{ opacity: relativeOffset === 0 ? 1 : 0, y: relativeOffset === 0 ? 0 : 20 }}
                transition={{ duration: 0.3 }}
              >
                {prop.badge && (
                  <span className="inline-block px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest mb-3 rounded-sm">
                    {prop.badge}
                  </span>
                )}
                <h3 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">{prop.name}</h3>
                <p className="text-white/80 font-sans text-sm md:text-base line-clamp-2 max-w-[80%]">
                  {prop.description}
                </p>
                <p className="text-accent font-bold font-display text-xl mt-3">
                  {prop.price}
                </p>
              </motion.div>

              {/* [FN-204] Play / Bring to Center Overlay for Side Cards */}
              {relativeOffset !== 0 && relativeOffset !== null && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <span className="material-symbols-outlined text-white text-3xl">
                      {relativeOffset > 0 ? 'arrow_back' : 'arrow_forward'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* [LY-208] NAV DOT CONTROLS */}
      <div className="absolute bottom-10 z-40 flex items-center gap-6">
        <button 
          onClick={handlePrev}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>

        <div className="flex gap-3">
          {displayProperties.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-accent scale-125' 
                  : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">chevron_right</span>
        </button>
      </div>

    </div>
  );
}
