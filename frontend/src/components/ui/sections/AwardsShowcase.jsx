import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AWARDS = [
  { 
    id: 1, 
    type: 'image', 
    src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200', 
    title: 'Best Luxury Brokerage 2025',
    description: 'Awarded for exceptional service in high-end real estate.'
  },
  { 
    id: 2, 
    type: 'video', 
    src: 'https://www.w3schools.com/html/mov_bbb.mp4', 
    title: 'Innovation in PropTech',
    description: 'Recognized for our advanced digital platform.'
  },
  { 
    id: 3, 
    type: 'image', 
    src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200', 
    title: 'Top Sales Performance',
    description: 'Highest volume of completed transactions in Q4.'
  },
  { 
    id: 4, 
    type: 'image', 
    src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200', 
    title: 'Excellence in Design',
    description: 'Award for the most intuitive UI/UX in real estate.'
  },
  { 
    id: 5, 
    type: 'video', 
    src: 'https://www.w3schools.com/html/mov_bbb.mp4', 
    title: 'Community Impact Award',
    description: 'For outstanding contributions to local housing development.'
  },
];

const AWARDS_LIST = [
  { id: 1, year: '2025', title: 'Top Luxury Brokerage Firm', organization: 'Asian Real Estate Awards' },
  { id: 2, year: '2024', title: 'Innovation in PropTech', organization: 'Global Tech Innovators' },
  { id: 3, year: '2024', title: 'Excellence in Sustainable Architecture', organization: 'Green Building Council' },
  { id: 4, year: '2023', title: 'Highest Transaction Volume', organization: 'National Real Estate Board' },
  { id: 5, year: '2023', title: 'Community Impact Award', organization: 'Urban Development Authority' },
  { id: 6, year: '2022', title: 'Best User Experience Design', organization: 'Webby Awards' },
];

export default function AwardsShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % AWARDS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + AWARDS.length) % AWARDS.length);
  };

  // Helper to determine position relative to center
  const getIndexOffset = (index) => {
    const diff = index - currentIndex;
    if (diff === 0) return 0;
    
    // Normalize to handle wrapping
    if (diff > AWARDS.length / 2) return diff - AWARDS.length;
    if (diff < -AWARDS.length / 2) return diff + AWARDS.length;
    
    return diff;
  };

  return (
    <section className="py-20 bg-[#FBFBF9] border-t border-[#D8DFDF] overflow-hidden">
      <div className="max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-[#141717] mb-4 uppercase tracking-tight">
          Awards & Achievements
        </h2>
        <p className="text-[#5C6768] max-w-2xl mx-auto text-sm md:text-base">
          Highlighting our industry recognitions, milestones, and the exceptional moments that define our commitment to excellence.
        </p>
      </div>

      <div className="relative w-full h-[50vh] sm:h-[65vh] lg:h-[80vh] min-h-[400px] flex items-center justify-center">
        
        {/* Navigation Overlays (invisible clickable areas for left/right) */}
        <div 
          className="absolute left-0 top-0 w-1/4 h-full z-30 cursor-pointer" 
          onClick={handlePrev}
        />
        <div 
          className="absolute right-0 top-0 w-1/4 h-full z-30 cursor-pointer" 
          onClick={handleNext}
        />

        <AnimatePresence initial={false}>
          {AWARDS.map((award, index) => {
            const offset = getIndexOffset(index);
            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 1; // Only render center and 1 on each side

            if (!isVisible) return null;

            return (
              <motion.div
                key={award.id}
                className="absolute w-[85%] sm:w-[75%] lg:w-[65%] h-full rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl bg-black"
                initial={{ 
                  x: offset * 100 + "%", 
                  scale: 0.8, 
                  opacity: 1,
                  zIndex: 10 - Math.abs(offset) 
                }}
                animate={{
                  x: offset * 95 + "%", // Adjusted to 95% for a minor gap
                  scale: isCenter ? 1 : 0.8,
                  opacity: 1,
                  zIndex: isCenter ? 20 : 10,
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  zIndex: 0 
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: 'center center'
                }}
              >
                {award.type === 'video' ? (
                  <video
                    src={award.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={award.src}
                    alt={award.title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Center Content Overlay */}
                {isCenter && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10 text-white"
                  >
                    <span className="w-10 h-1 bg-[#E76F51] mb-4" />
                    <h3 className="text-xl md:text-3xl font-display font-bold mb-2">
                      {award.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/80 max-w-lg font-sans">
                      {award.description}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Pagination Dots (Inside the container, at the bottom) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
          {AWARDS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx 
                  ? 'w-6 h-2 bg-[#E76F51]' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Historical Awards List */}
      <div className="max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 mt-24">
        <div className="flex items-center gap-3 mb-10">
          <span className="w-6 h-[2px] bg-[#0D4446]" />
          <h3 className="text-sm font-bold tracking-[0.25em] text-[#0D4446] uppercase">
            Historical Honors
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AWARDS_LIST.map((award, idx) => (
            <motion.div 
              key={award.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white border border-[#e5e5df] rounded-[14px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-[#0D4446]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <span className="inline-block bg-[#0D4446]/10 text-[#0D4446] font-mono text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                  {award.year}
                </span>
                <h4 className="text-lg sm:text-xl font-extrabold text-[#0f1722] leading-tight mb-2">
                  {award.title}
                </h4>
              </div>
              <div className="text-xs font-semibold text-[#5a6472] uppercase tracking-wider mt-6 pt-4 border-t border-[#f0f0ed]">
                {award.organization}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
